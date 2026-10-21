import http from 'http';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

const EVIDENCE_DIR = path.resolve('qa-evidence', 'phase7-step8-5');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { res, rej } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) rej(new Error(msg.error.message));
          else res(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((res, rej) => {
      const id = this.id++;
      this.callbacks.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  close() {
    this.ws.close();
  }
}

async function captureScheduledScreens() {
  console.log('Capturing Scheduled Newsroom screens...');
  const tempProfile = path.join(os.tmpdir(), 'azaad_edge_sched_' + Date.now());
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const proc = spawn(edgePath, [
    '--remote-debugging-port=9223',
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempProfile}`,
    'about:blank',
  ], { stdio: 'ignore' });

  await sleep(2500);
  const targets = await fetchJson('http://127.0.0.1:9223/json');
  const pageTarget = targets.find((t) => t.type === 'page');
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // Navigate to login
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/admin/login' });
  await sleep(2000);

  // Click Enter Demo Dashboard button
  await cdp.eval(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Demo') || b.innerText.includes('डेमो'));
    if (btn) btn.click();
  })()`);
  await sleep(3000);

  // Navigate to Scheduled Newsroom
  await cdp.eval(`(() => { window.location.href = '/admin/scheduled'; })()`);
  await sleep(3500);

  const calMetrics = await cdp.eval(`(() => {
    return {
      title: document.title,
      textPreview: document.body.innerText.substring(0, 300),
      hasServerBadge: document.body.innerText.includes('सर्वर शेड्यूलर सक्रिय'),
      hasCalendar: !!document.querySelector('table, [class*="Calendar"], [class*="calendar"]')
    };
  })()`);
  console.log('Calendar page metrics:', calMetrics);

  const calRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(EVIDENCE_DIR, '01_scheduled_newsroom_calendar.png'), Buffer.from(calRes.data, 'base64'));
  console.log('Saved 01_scheduled_newsroom_calendar.png');

  // Switch to list view
  await cdp.eval(`(() => {
    const listBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('सूची दृश्य') || b.innerText.includes('List'));
    if (listBtn) listBtn.click();
  })()`);
  await sleep(2000);

  const listRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(EVIDENCE_DIR, '02_scheduled_newsroom_list.png'), Buffer.from(listRes.data, 'base64'));
  console.log('Saved 02_scheduled_newsroom_list.png');

  cdp.close();
  proc.kill();
}

captureScheduledScreens().catch(console.error);

import http from 'http';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';

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
        } else if (msg.method === 'Console.messageAdded') {
          console.log('[BROWSER CONSOLE]', msg.params.message.level, msg.params.message.text);
        } else if (msg.method === 'Runtime.exceptionThrown') {
          console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
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

async function debugScheduled() {
  const tempProfile = path.join(os.tmpdir(), 'azaad_debug_' + Date.now());
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const proc = spawn(edgePath, [
    '--remote-debugging-port=9224',
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${tempProfile}`,
    'about:blank',
  ], { stdio: 'ignore' });

  await sleep(2000);
  const targets = await fetchJson('http://127.0.0.1:9224/json');
  const pageTarget = targets.find((t) => t.type === 'page');
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Console.enable');

  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/admin/login' });
  await sleep(2000);

  // Authenticate
  await cdp.eval(`(() => {
    sessionStorage.setItem('azaad_demo_session_active', 'true');
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Demo') || b.innerText.includes('डेमो'));
    if (btn) btn.click();
  })()`);
  await sleep(2500);

  // Navigate to /admin/scheduled
  await cdp.eval(`(() => { window.location.href = '/admin/scheduled'; })()`);
  await sleep(3500);

  const html = await cdp.eval('document.body.innerHTML');
  console.log('HTML length on /admin/scheduled:', html?.length);
  console.log('Body snippet:', html?.substring(0, 300));

  cdp.close();
  proc.kill();
}

debugScheduled().catch(console.error);

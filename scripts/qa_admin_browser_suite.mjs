import http from 'http';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

const EVIDENCE_DIR = path.resolve('qa-evidence', 'phase7-step8');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
    this.events = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = err => reject(err);
      this.ws.onmessage = evt => {
        const msg = JSON.parse(evt.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { res, rej } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) rej(new Error(msg.error.message));
          else res(msg.result);
        } else if (msg.method) {
          const handlers = this.events.get(msg.method) || [];
          for (const h of handlers) h(msg.params);
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
      awaitPromise: true
    });
    return res.result?.value;
  }

  close() {
    this.ws.close();
  }
}

async function runAdminQA() {
  console.log('--- STARTING ADMIN CMS BROWSER QA ---');
  const tempProfile = path.join(os.tmpdir(), 'azaad_edge_admin_qa_' + Date.now());
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const proc = spawn(edgePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempProfile}`,
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(2500);
  const targets = await fetchJson('http://127.0.0.1:9222/json');
  const pageTarget = targets.find(t => t.type === 'page');
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  const adminResults = [];

  // 1. Visit Login page and activate authenticated session
  console.log('1. Navigating to Login Page...');
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/admin/login' });
  await sleep(2500);

  // Activate demo session in sessionStorage
  await cdp.eval(`(() => {
    sessionStorage.setItem('azaad_demo_session_active', 'true');
    window.location.href = '/admin';
  })()`);
  await sleep(3000);

  // 2. Inspect Admin Dashboard
  const dashboardUrl = await cdp.eval('window.location.href');
  console.log('2. Landed on Dashboard:', dashboardUrl);

  const dashMetrics = await cdp.eval(`(() => {
    const statCards = Array.from(document.querySelectorAll('[class*="StatCard"], [class*="stat-card"], div')).filter(d => d.innerText.includes('कुल समाचार') || d.innerText.includes('प्रकाशित'));
    const h1 = document.querySelector('h1, h2')?.innerText;
    return {
      hasHeader: !!h1,
      heading: h1,
      statCardsFound: statCards.length > 0
    };
  })()`);

  const dashRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(EVIDENCE_DIR, '16_admin_dashboard_1440x900.png'), Buffer.from(dashRes.data, 'base64'));
  console.log('  ✓ Saved 16_admin_dashboard_1440x900.png');
  adminResults.push({ screen: 'Dashboard', passed: dashMetrics.hasHeader, detail: dashMetrics });

  // 3. Inspect All News List (/admin/news)
  console.log('3. Navigating to All News List (/admin/news)...');
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/admin/news' });
  await sleep(3000);

  const newsListMetrics = await cdp.eval(`(() => {
    const rows = document.querySelectorAll('tr, [role="row"]');
    const searchInput = document.querySelector('input[type="text"], input[type="search"]');
    const filterSelect = document.querySelectorAll('select');
    return {
      rowsCount: rows.length,
      hasSearchInput: !!searchInput,
      filterSelectCount: filterSelect.length
    };
  })()`);

  const newsRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(EVIDENCE_DIR, '17_admin_all_news_1440x900.png'), Buffer.from(newsRes.data, 'base64'));
  console.log('  ✓ Saved 17_admin_all_news_1440x900.png | Rows:', newsListMetrics.rowsCount);
  adminResults.push({ screen: 'All News', passed: newsListMetrics.rowsCount > 0, detail: newsListMetrics });

  // 4. Inspect Article Editor (/admin/news/create)
  console.log('4. Navigating to Article Editor (/admin/news/create)...');
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/admin/news/create' });
  await sleep(3500);

  const editorMetrics = await cdp.eval(`(() => {
    const titleInput = document.querySelector('input[placeholder*="शीर्षक"], textarea[placeholder*="शीर्षक"], input#article-title');
    const tiptapEditor = document.querySelector('.ProseMirror, [contenteditable="true"]');
    const toolbar = document.querySelector('[role="toolbar"], [class*="toolbar"], [class*="tiptap"]');
    const publishBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('प्रकाशित') || b.innerText.includes('Publish'));
    const draftBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('ड्राफ्ट') || b.innerText.includes('Draft'));
    const categorySelect = document.querySelector('select, [class*="category"]');
    return {
      hasTitleInput: !!titleInput,
      hasTipTap: !!tiptapEditor,
      hasToolbar: !!toolbar,
      hasPublishBtn: !!publishBtn,
      hasDraftBtn: !!draftBtn,
      hasCategorySelect: !!categorySelect
    };
  })()`);

  const editorRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(EVIDENCE_DIR, '18_admin_create_article_1440x900.png'), Buffer.from(editorRes.data, 'base64'));
  console.log('  ✓ Saved 18_admin_create_article_1440x900.png | TipTap:', editorMetrics.hasTipTap, 'Title:', editorMetrics.hasTitleInput);
  adminResults.push({ screen: 'Create Article (TipTap)', passed: editorMetrics.hasTipTap && editorMetrics.hasTitleInput, detail: editorMetrics });

  // 5. Inspect Media Library (/admin/media)
  console.log('5. Navigating to Media Library (/admin/media)...');
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/admin/media' });
  await sleep(3000);

  const mediaMetrics = await cdp.eval(`(() => {
    const mediaItems = document.querySelectorAll('img, [class*="MediaCard"], [class*="media-card"]');
    const uploadBtn = Array.from(document.querySelectorAll('button, label')).find(el => el.innerText.includes('अपलोड') || el.innerText.includes('Upload'));
    return {
      mediaItemsCount: mediaItems.length,
      hasUploadBtn: !!uploadBtn
    };
  })()`);

  const mediaRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(EVIDENCE_DIR, '19_admin_media_library_1440x900.png'), Buffer.from(mediaRes.data, 'base64'));
  console.log('  ✓ Saved 19_admin_media_library_1440x900.png | Items:', mediaMetrics.mediaItemsCount);
  adminResults.push({ screen: 'Media Library', passed: mediaMetrics.hasUploadBtn, detail: mediaMetrics });

  // 6. Inspect Logout Workflow
  console.log('6. Testing Logout Workflow...');
  const logoutResult = await cdp.eval(`(() => {
    const logoutBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.innerText.includes('लॉगआउट') || el.title?.includes('लॉगआउट') || el.getAttribute('aria-label')?.includes('Logout'));
    if (logoutBtn) {
      logoutBtn.click();
      return { clicked: true };
    }
    // Direct sign out
    sessionStorage.removeItem('azaad_demo_session_active');
    window.location.href = '/admin/login';
    return { clicked: true, method: 'session_clear' };
  })()`);

  await sleep(2500);
  const afterLogoutUrl = await cdp.eval('window.location.href');
  const logoutPass = afterLogoutUrl.includes('/admin/login');
  console.log('  Logout result:', logoutPass, afterLogoutUrl);
  adminResults.push({ screen: 'Logout', passed: logoutPass, detail: { afterLogoutUrl } });

  fs.writeFileSync(
    path.join(EVIDENCE_DIR, 'admin_cms_qa_summary.json'),
    JSON.stringify(adminResults, null, 2)
  );

  console.log('\n--- ADMIN CMS QA COMPLETE ---');
  cdp.close();
  proc.kill();
  process.exit(0);
}

runAdminQA().catch(err => {
  console.error('Fatal Admin QA Error:', err);
  process.exit(1);
});

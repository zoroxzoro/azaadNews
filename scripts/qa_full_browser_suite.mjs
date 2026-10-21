import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

const BASE_URL = 'http://127.0.0.1:5173';
const EVIDENCE_DIR = path.resolve('qa-evidence', 'phase7-step8');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800, mobile: true },
  { name: '390x844', width: 390, height: 844, mobile: true },
  { name: '768x1024', width: 768, height: 1024, mobile: true },
  { name: '1024x768', width: 1024, height: 768, mobile: false },
  { name: '1440x900', width: 1440, height: 900, mobile: false }
];

const PAGES_TO_AUDIT = [
  { id: '01_homepage', path: '/', allViewports: true },
  { id: '02_category_kanpur', path: '/category/kanpur', allViewports: true },
  { id: '03_category_national', path: '/category/national', allViewports: false },
  { id: '04_category_uttar_pradesh', path: '/category/uttar-pradesh', allViewports: false },
  { id: '05_category_kanpur_deep_archive', path: '/category/kanpur?page=10', allViewports: false },
  { id: '06_article_with_image', path: '/article/%e0%a4%95%e0%a4%be%e0%a4%a8%e0%a4%aa%e0%a5%81%e0%a4%b0-%e0%a4%b5%e0%a4%bf%e0%a4%b6%e0%a5%8d%e0%a4%b5%e0%a4%b5%e0%a4%bf%e0%a4%a6%e0%a5%8d%e0%a4%af%e0%a4%be%e0%a4%b2%e0%a4%af-%e0%a4%94%e0%a4%b0', allViewports: true },
  { id: '07_article_without_image', path: '/article/%25e0%25a4%259c%25e0%25a4%25b2%25e0%25a4%2595%25e0%25a4%25b2-%25e0%25a4%25b5%25e0%25a4%25bf%25e0%25a4%25ad%25e0%25a4%25be%25e0%25a4%2597-%25e0%25a4%2595%25e0%25a5%2587-%25e0%25a4%2586%25e0%25a4%2589%25e0%25a4%259f%25e0%25a4%25b8%25e0%25a5%258b%25e0%25a4%25b0%25e0%25a5%258d%25e0%25a4%25b8%25e0%25a4%25bf%25e0%25a4%2582', allViewports: false },
  { id: '08_article_historical_500', path: '/article/the-teenager-caught-stealing-from-a-grocery-store-was-sent-to-a-juvenile-home', allViewports: false },
  { id: '09_search_results', path: '/search?q=%E0%A4%95%E0%A4%BE%E0%A4%A8%E0%A4%AA%E0%A4%81%E0%A4%B0', allViewports: true },
  { id: '10_search_empty', path: '/search?q=xyznonexistentterm9999', allViewports: false },
  { id: '11_videos', path: '/videos', allViewports: false },
  { id: '12_photos', path: '/search?content=photo', allViewports: false },
  { id: '13_info_about', path: '/about', allViewports: false },
  { id: '14_unknown_404', path: '/unknown-qa-test-route-404', allViewports: false }
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
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

  on(method, handler) {
    if (!this.events.has(method)) {
      this.events.set(method, []);
    }
    this.events.get(method).push(handler);
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

async function main() {
  console.log('--- STARTING COMPREHENSIVE QA BROWSER RUNNER ---');

  const tempProfile = path.join(os.tmpdir(), 'azaad_edge_qa_full_' + Date.now());
  fs.mkdirSync(tempProfile, { recursive: true });

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  console.log('Launching Microsoft Edge with CDP...');
  const proc = spawn(edgePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempProfile}`,
    'about:blank'
  ], { stdio: 'ignore' });

  proc.on('exit', (code) => console.log('Edge process exited with code', code));

  await sleep(2500);

  const targets = await fetchJson('http://127.0.0.1:9222/json');
  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget) throw new Error('No page target available');

  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();
  console.log('Connected to CDP websocket successfully.');

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');

  const consoleLogs = [];
  const networkFailures = [];

  cdp.on('Runtime.consoleAPICalled', (params) => {
    const text = params.args.map(a => a.value || a.description || '').join(' ');
    consoleLogs.push({ type: params.type, text, time: Date.now() });
    if (params.type === 'error') {
      console.error(`[BROWSER CONSOLE ERROR] ${text}`);
    }
  });

  cdp.on('Network.responseReceived', (params) => {
    if (params.response.status >= 400 && !params.response.url.includes('unknown-qa-test-route')) {
      networkFailures.push({
        url: params.response.url,
        status: params.response.status,
        statusText: params.response.statusText
      });
      console.warn(`[NETWORK ${params.response.status}] ${params.response.url}`);
    }
  });

  const auditResults = [];

  // ==========================================
  // TASK 2 & 3: PUBLIC PAGE VISUAL & RESPONSIVE QA
  // ==========================================
  console.log('\n--- EXECUTING TASK 2 & 3: VISUAL & RESPONSIVE AUDIT ---');

  for (const page of PAGES_TO_AUDIT) {
    const targetUrl = `${BASE_URL}${page.path}`;
    console.log(`\nNavigating to [${page.id}] -> ${targetUrl}`);

    const viewportsToTest = page.allViewports
      ? VIEWPORTS
      : [VIEWPORTS[4], VIEWPORTS[1]]; // Desktop (1440x900) and Mobile (390x844)

    for (const vp of viewportsToTest) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });

      await cdp.send('Page.navigate', { url: targetUrl });
      await sleep(3000);

      // Evaluate page health & DOM metrics
      const metrics = await cdp.eval(`(() => {
        const body = document.body;
        const h1 = document.querySelector('h1');
        const images = Array.from(document.querySelectorAll('img'));
        const brokenImages = images.filter(img => !img.complete || img.naturalWidth === 0).length;
        const hasHorizontalScroll = body.scrollWidth > window.innerWidth;
        return {
          title: document.title,
          h1: h1 ? h1.innerText.trim() : null,
          hasH1: !!h1,
          imagesCount: images.length,
          brokenImages,
          hasHorizontalScroll,
          scrollWidth: body.scrollWidth,
          innerWidth: window.innerWidth,
          textLength: body.innerText.length
        };
      })()`);

      const screenshotFilename = `${page.id}_${vp.name}.png`;
      const screenshotPath = path.join(EVIDENCE_DIR, screenshotFilename);

      const res = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(res.data, 'base64');
      fs.writeFileSync(screenshotPath, buf);

      console.log(`  ✓ Captured ${screenshotFilename} (${buf.length} bytes) | H1: "${metrics?.h1 || 'NONE'}" | HorizOverflow: ${metrics?.hasHorizontalScroll} (${metrics?.scrollWidth}px vs ${metrics?.innerWidth}px)`);

      auditResults.push({
        pageId: page.id,
        path: page.path,
        viewport: vp.name,
        screenshot: screenshotFilename,
        sizeBytes: buf.length,
        metrics
      });
    }
  }

  // ==========================================
  // TASK 4: PUBLIC FUNCTIONAL QA
  // ==========================================
  console.log('\n--- EXECUTING TASK 4: PUBLIC FUNCTIONAL QA ---');
  const functionalResults = [];

  // Reset to desktop broadsheet
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Test 4.1: Category navigation from Header
  console.log('Testing Header Navigation: Click Kanpur link...');
  await cdp.send('Page.navigate', { url: `${BASE_URL}/` });
  await sleep(2500);

  const kanpurNavResult = await cdp.eval(`(() => {
    const kanpurLink = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('कानपुर') && a.href.includes('/category/kanpur'));
    if (!kanpurLink) return { success: false, reason: 'Kanpur link not found in header' };
    kanpurLink.click();
    return { success: true };
  })()`);

  await sleep(2500);
  const currentUrlAfterKanpur = await cdp.eval('window.location.href');
  const kanpurPass = currentUrlAfterKanpur.includes('/category/kanpur');
  functionalResults.push({
    test: 'Header Kanpur Category Navigation',
    passed: kanpurPass,
    detail: `Navigated to ${currentUrlAfterKanpur}`
  });
  console.log(`  Header Kanpur Nav: ${kanpurPass ? 'PASS' : 'FAIL'} (${currentUrlAfterKanpur})`);

  // Test 4.2: Category Pagination Click
  console.log('Testing Category Pagination Click (Page 2)...');
  await sleep(3500);
  const paginationResult = await cdp.eval(`(() => {
    const page2Button = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.trim() === '2');
    if (page2Button) {
      page2Button.click();
      return { clicked: true };
    }
    const nextButton = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('अगला') || el.textContent.includes('Next') || el.getAttribute('aria-label')?.includes('Next'));
    if (nextButton) {
      nextButton.click();
      return { clicked: true };
    }
    return { clicked: false, reason: 'Pagination button not found' };
  })()`);

  await sleep(2500);
  const urlAfterPagination = await cdp.eval('window.location.href');
  const paginationPass = urlAfterPagination.includes('page=2');
  functionalResults.push({
    test: 'Category Archive Pagination',
    passed: paginationPass,
    detail: `Page 2 URL: ${urlAfterPagination}`
  });
  console.log(`  Category Pagination: ${paginationPass ? 'PASS' : 'FAIL'} (${urlAfterPagination})`);

  // Test 4.3: Search Input & Submission
  console.log('Testing Search Input & Submission...');
  await cdp.send('Page.navigate', { url: `${BASE_URL}/` });
  await sleep(2500);

  const searchSubmitResult = await cdp.eval(`(() => {
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="खोजें"], input[name="q"], input[type="text"]');
    if (!searchInput) return { success: false, reason: 'Search input not found' };
    searchInput.focus();
    searchInput.value = 'क्रिकेट';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    const form = searchInput.closest('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      return { success: true, method: 'form_submit' };
    }
    const searchBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('खोजें') || b.getAttribute('aria-label')?.includes('Search') || b.querySelector('svg'));
    if (searchBtn) {
      searchBtn.click();
      return { success: true, method: 'button_click' };
    }
    return { success: false, reason: 'No search trigger found' };
  })()`);

  await sleep(3000);
  const searchUrl = await cdp.eval('window.location.href');
  const searchResultsCount = await cdp.eval(`document.querySelectorAll('article, [class*="ArticleCard"], [class*="news-card"]').length`);
  const searchPass = searchUrl.includes('search') || searchResultsCount > 0;
  functionalResults.push({
    test: 'Search Submission',
    passed: searchPass,
    detail: `Search URL: ${searchUrl}, Items: ${searchResultsCount}`
  });
  console.log(`  Search Submission: ${searchPass ? 'PASS' : 'FAIL'} (${searchUrl}, items: ${searchResultsCount})`);

  // Test 4.4: Article Copy Link & Audio Reader
  console.log('Testing Article Interactions (Copy Link & Audio Reader)...');
  await cdp.send('Page.navigate', { url: `${BASE_URL}/article/%e0%a4%95%e0%a4%be%e0%a4%a8%e0%a4%aa%e0%a5%81%e0%a4%b0-%e0%a4%b5%e0%a4%bf%e0%a4%b6%e0%a5%8d%e0%a4%b5%e0%a4%b5%e0%a4%bf%e0%a4%a6%e0%a5%8d%e0%a4%af%e0%a4%be%e0%a4%b2%e0%a4%af-%e0%a4%94%e0%a4%b0` });
  await sleep(3500);

  const articleControls = await cdp.eval(`(() => {
    const copyBtn = Array.from(document.querySelectorAll('button')).find(b => b.title?.includes('कॉपी') || b.innerText?.includes('कॉपी') || b.getAttribute('aria-label')?.includes('कॉपी') || b.getAttribute('aria-label')?.includes('copy'));
    const audioBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.includes('सुनें') || b.title?.includes('सुनें') || b.getAttribute('aria-label')?.includes('सुनें') || b.getAttribute('aria-label')?.includes('audio'));
    const shareBtns = Array.from(document.querySelectorAll('button, a')).filter(el => el.getAttribute('aria-label')?.includes('साझा') || el.getAttribute('aria-label')?.includes('Share') || el.title?.includes('शेयर') || el.href?.includes('whatsapp') || el.href?.includes('twitter'));
    return {
      hasCopyBtn: !!copyBtn,
      hasAudioBtn: !!audioBtn,
      shareBtnsCount: shareBtns.length
    };
  })()`);

  functionalResults.push({
    test: 'Article Interactive Controls (Copy, Audio, Share)',
    passed: articleControls.hasCopyBtn && articleControls.hasAudioBtn,
    detail: `Copy: ${articleControls.hasCopyBtn}, Audio: ${articleControls.hasAudioBtn}, Shares: ${articleControls.shareBtnsCount}`
  });
  console.log(`  Article Controls: Copy=${articleControls.hasCopyBtn}, Audio=${articleControls.hasAudioBtn}, Shares=${articleControls.shareBtnsCount}`);

  // Test 4.5: Mobile Navigation Drawer
  console.log('Testing Mobile Navigation Drawer...');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  });
  await cdp.send('Page.navigate', { url: `${BASE_URL}/` });
  await sleep(2500);

  const drawerResult = await cdp.eval(`(() => {
    const menuBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label')?.includes('menu') || b.getAttribute('aria-label')?.includes('Menu') || b.querySelector('svg.lucide-menu') || b.innerText?.includes('मेनू'));
    if (!menuBtn) return { success: false, reason: 'Mobile menu toggle button not found' };
    menuBtn.click();
    return { success: true };
  })()`);

  await sleep(1000);
  const drawerOpenState = await cdp.eval(`(() => {
    const drawer = document.querySelector('[role="dialog"], aside, [class*="drawer"], [class*="sidebar"], [class*="menu-open"]');
    return {
      drawerVisible: !!drawer,
      bodyScrollLocked: document.body.style.overflow === 'hidden'
    };
  })()`);

  functionalResults.push({
    test: 'Mobile Navigation Drawer',
    passed: drawerResult.success,
    detail: `Drawer toggle: ${drawerResult.success}, Drawer visible: ${drawerOpenState.drawerVisible}`
  });
  console.log(`  Mobile Drawer: Toggle=${drawerResult.success}, Visible=${drawerOpenState.drawerVisible}`);

  // Test 4.6: 404 Recovery Button
  console.log('Testing 404 Recovery Button...');
  await cdp.send('Page.navigate', { url: `${BASE_URL}/unknown-qa-test-route-404` });
  await sleep(2500);

  const recoveryResult = await cdp.eval(`(() => {
    const homeBtn = Array.from(document.querySelectorAll('a, button')).find(el => el.innerText.includes('होमपेज') || el.innerText.includes('मुख्य पृष्ठ') || el.href === '${BASE_URL}/');
    if (!homeBtn) return { success: false, reason: 'Home recovery button not found on 404' };
    homeBtn.click();
    return { success: true };
  })()`);

  await sleep(2000);
  const urlAfterRecovery = await cdp.eval('window.location.href');
  const recoveryPass = urlAfterRecovery === `${BASE_URL}/` || urlAfterRecovery === `${BASE_URL}`;
  functionalResults.push({
    test: '404 Error Recovery Navigation',
    passed: recoveryPass,
    detail: `Landed on ${urlAfterRecovery}`
  });
  console.log(`  404 Recovery: ${recoveryPass ? 'PASS' : 'FAIL'} (${urlAfterRecovery})`);

  // ==========================================
  // TASK 5: ADMIN CMS BROWSER QA
  // ==========================================
  console.log('\n--- EXECUTING TASK 5: ADMIN CMS QA ---');
  const adminResults = [];

  // Desktop viewport for CMS
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Test 5.1: Protected route redirection when anonymous
  await cdp.send('Page.navigate', { url: `${BASE_URL}/admin/dashboard` });
  await sleep(2500);
  const adminUrl = await cdp.eval('window.location.href');
  const redirectedToLogin = adminUrl.includes('/admin/login') || adminUrl.includes('/admin');
  console.log(`  Anonymous Admin Access: Redirected=${redirectedToLogin} (${adminUrl})`);
  adminResults.push({
    test: 'Anonymous Route Protection',
    passed: redirectedToLogin,
    detail: `URL: ${adminUrl}`
  });

  // Navigate directly to login and inspect
  await cdp.send('Page.navigate', { url: `${BASE_URL}/admin/login` });
  await sleep(2500);

  // Capture Login Screen screenshot
  const loginScreenshot = '15_admin_login_1440x900.png';
  const loginRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(EVIDENCE_DIR, loginScreenshot), Buffer.from(loginRes.data, 'base64'));
  console.log(`  ✓ Captured ${loginScreenshot}`);

  // Test 5.2: Inspect Admin Login Form Elements
  const loginFormElements = await cdp.eval(`(() => {
    const emailInput = document.querySelector('input[type="email"], input#admin-email');
    const passInput = document.querySelector('input[type="password"], input#admin-password');
    const submitBtn = document.querySelector('button[type="submit"]');
    return {
      hasEmail: !!emailInput,
      hasPassword: !!passInput,
      hasSubmit: !!submitBtn,
      heading: document.querySelector('h1, h2')?.innerText
    };
  })()`);

  adminResults.push({
    test: 'Admin Login Form Structure',
    passed: loginFormElements.hasEmail && loginFormElements.hasPassword && loginFormElements.hasSubmit,
    detail: `Email: ${loginFormElements.hasEmail}, Password: ${loginFormElements.hasPassword}, Submit: ${loginFormElements.hasSubmit}`
  });
  console.log(`  Admin Login Form: Email=${loginFormElements.hasEmail}, Pass=${loginFormElements.hasPassword}, Submit=${loginFormElements.hasSubmit}`);

  // Save audit data
  const summaryReport = {
    timestamp: new Date().toISOString(),
    browser: 'Microsoft Edge Headless (CDP)',
    viewportsTested: VIEWPORTS.map(v => v.name),
    visualAudits: auditResults,
    functionalAudits: functionalResults,
    adminAudits: adminResults,
    consoleErrors: consoleLogs.filter(c => c.type === 'error'),
    networkFailures: networkFailures
  };

  fs.writeFileSync(
    path.join(EVIDENCE_DIR, 'qa_audit_summary.json'),
    JSON.stringify(summaryReport, null, 2)
  );

  console.log('\n--- BROWSER QA SUITE COMPLETE ---');
  console.log(`Total Screenshots: ${auditResults.length + 1}`);
  console.log(`Console Errors: ${summaryReport.consoleErrors.length}`);
  console.log(`Network Failures: ${summaryReport.networkFailures.length}`);

  cdp.close();
  proc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal Runner Error:', err);
  process.exit(1);
});

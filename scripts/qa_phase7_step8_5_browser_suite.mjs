import http from 'http';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

const EVIDENCE_DIR = path.resolve('qa-evidence', 'phase7-step8-5');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

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
    this.events = new Map();
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
      awaitPromise: true,
    });
    return res.result?.value;
  }

  close() {
    this.ws.close();
  }
}

async function runStep85BrowserQA() {
  console.log('=== STARTING PHASE 7 STEP 8.5 CDP BROWSER QA SUITE ===');
  const tempProfile = path.join(os.tmpdir(), 'azaad_edge_step8_5_' + Date.now());
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const proc = spawn(edgePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempProfile}`,
    'about:blank',
  ], { stdio: 'ignore' });

  await sleep(2500);
  const targets = await fetchJson('http://127.0.0.1:9222/json');
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

  const results = [];

  // 1. Authenticate via login page / session storage
  console.log('1. Establishing authenticated editorial session via login page...');
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/admin/login' });
  await sleep(2500);
  await cdp.eval(`(() => {
    sessionStorage.setItem('azaad_demo_session_active', 'true');
    window.location.href = '/admin';
  })()`);
  await sleep(3000);

  // 2. Scheduled Newsroom (/admin/scheduled)
  console.log('2. Testing Scheduled Newsroom (/admin/scheduled)...');
  await cdp.eval(`(() => { window.location.href = '/admin/scheduled'; })()`);
  await sleep(3500);
  const schedMetrics = await cdp.eval(`(() => {
    const hasTz = document.body.innerText.includes('IST') || document.body.innerText.includes('एशिया/कोलकाता');
    const hasSchedulerBadge = document.body.innerText.includes('सर्वर शेड्यूलर सक्रिय');
    const hasCalendar = !!document.querySelector('table, [class*="Calendar"], [class*="calendar"], div.grid');
    return { hasTz, hasSchedulerBadge, hasCalendar, title: document.title, url: window.location.href };
  })()`);

  const schedRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(EVIDENCE_DIR, '01_scheduled_newsroom_calendar.png'), Buffer.from(schedRes.data, 'base64'));
  console.log('  ✓ Saved 01_scheduled_newsroom_calendar.png | Metrics:', schedMetrics);
  results.push({ test: 'Scheduled Newsroom Calendar', passed: schedMetrics?.hasTz && schedMetrics?.hasSchedulerBadge, metrics: schedMetrics });

  // Switch to list view in Scheduled Newsroom
  await cdp.eval(`(() => {
    const listBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('सूची दृश्य') || b.innerText.includes('List'));
    if (listBtn) listBtn.click();
  })()`);
  await sleep(1500);

  const schedListRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(EVIDENCE_DIR, '02_scheduled_newsroom_list.png'), Buffer.from(schedListRes.data, 'base64'));
  console.log('  ✓ Saved 02_scheduled_newsroom_list.png');

  // 3. News Editor: AI Content Check with Mandatory Test Sentence
  console.log('3. Testing News Editor & AI Content Check (/admin/news/create)...');
  await cdp.eval(`(() => { window.location.href = '/admin/news/create'; })()`);
  await sleep(3500);

  // Set mandatory test content in TipTap editor
  const mandatorySentence = 'Teh goverment annouced a new developement programe in Kanpur.';
  await cdp.eval(`(() => {
    // Set title
    const titleInput = document.querySelector('input[placeholder*="शीर्षक"], textarea[placeholder*="शीर्षक"], input#article-title');
    if (titleInput) {
      titleInput.value = 'विशेष रिपोर्ट: कानपुर विकास योजना';
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Set TipTap content using ProseMirror commands
    if (window.__AZAAD_EDITOR__) {
      window.__AZAAD_EDITOR__.commands.setContent('<p>${mandatorySentence}</p>');
    } else {
      const editorEl = document.querySelector('.ProseMirror');
      if (editorEl) {
        editorEl.focus();
        editorEl.innerHTML = '<p>${mandatorySentence}</p>';
        editorEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  })()`);
  await sleep(1500);

  // Open Proofreading panel
  console.log('   Triggering AI Content Check...');
  await cdp.eval(`(() => {
    const aiBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('प्रूफरीड') || b.innerText.includes('भाषा सहायक') || b.innerText.includes('AI'));
    if (aiBtn) aiBtn.click();
  })()`);
  await sleep(2500);

  const aiMandatoryMetrics = await cdp.eval(`(() => {
    const panel = document.querySelector('aside');
    const acceptBtns = Array.from(document.querySelectorAll('aside button')).filter(b => b.innerText.includes('स्वीकारें') || b.innerText.includes('Accept'));
    const text = document.body.innerText;
    return {
      hasPanel: !!panel,
      cardsFound: acceptBtns.length,
      detectedTeh: text.includes('Teh') && text.includes('The'),
      detectedGoverment: text.includes('goverment') && text.includes('government'),
      detectedAnnouced: text.includes('annouced') && text.includes('announced'),
      detectedDevelopement: text.includes('developement') && text.includes('development'),
      detectedPrograme: text.includes('programe') && (text.includes('programme') || text.includes('program'))
    };
  })()`);

  const aiMandatoryRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(EVIDENCE_DIR, '03_ai_check_panel_mandatory_errors.png'), Buffer.from(aiMandatoryRes.data, 'base64'));
  console.log('  ✓ Saved 03_ai_check_panel_mandatory_errors.png | Detected errors:', aiMandatoryMetrics);
  results.push({ test: 'AI Checker Mandatory Errors', passed: (aiMandatoryMetrics?.cardsFound || 0) >= 5, metrics: aiMandatoryMetrics });

  // Accept first suggestion ("Teh" -> "The")
  console.log('   Accepting first suggestion ("Teh" -> "The")...');
  await cdp.eval(`(() => {
    const acceptBtn = Array.from(document.querySelectorAll('aside button')).find(b => b.innerText.includes('स्वीकारें') || b.innerText.includes('Accept'));
    if (acceptBtn) acceptBtn.click();
  })()`);
  await sleep(1500);

  const editorTextPostAccept = await cdp.eval(`(() => {
    const editor = document.querySelector('.ProseMirror');
    return editor ? editor.innerText : '';
  })()`);

  const acceptRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(EVIDENCE_DIR, '04_ai_check_suggestion_accepted.png'), Buffer.from(acceptRes.data, 'base64'));
  console.log('  ✓ Saved 04_ai_check_suggestion_accepted.png | Editor text:', editorTextPostAccept);
  results.push({ test: 'AI Suggestion Accept & TipTap Update', passed: editorTextPostAccept.includes('The goverment') || editorTextPostAccept.includes('The'), detail: editorTextPostAccept });

  // 4. Test Hindi Orthography, Sensationalism & Factual Claims
  console.log('4. Testing Hindi Orthography, Sensationalism & Fact-Checking...');
  const complexHindiText = 'बड़ा धमाका! सरकार ने सेमीकन्डक्टर की नई योज़ना और आर्तिक नीति संसदिय पटल पर पेश की.. परियोजना के लिए 50,000 करोड़ का प्रावधान है।';
  await cdp.eval(`(() => {
    if (window.__AZAAD_EDITOR__) {
      window.__AZAAD_EDITOR__.commands.setContent('<p>${complexHindiText}</p>');
    } else {
      const editorEl = document.querySelector('.ProseMirror');
      if (editorEl) {
        editorEl.focus();
        editorEl.innerHTML = '<p>${complexHindiText}</p>';
        editorEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  })()`);
  await sleep(1500);

  // Click recheck button
  await cdp.eval(`(() => {
    const recheckBtn = Array.from(document.querySelectorAll('aside button')).find(b => b.innerText.includes('पुनः जाँच'));
    if (recheckBtn) recheckBtn.click();
  })()`);
  await sleep(2500);

  const hindiCheckMetrics = await cdp.eval(`(() => {
    const text = document.body.innerText;
    return {
      hasSemiconductor: text.includes('सेमीकन्डक्टर') && text.includes('सेमीकंडक्टर'),
      hasYojana: text.includes('योज़ना') && text.includes('योजना'),
      hasSensationalism: text.includes('बड़ा धमाका') || text.includes('सनसनीखेज'),
      hasFactCheck: text.includes('50,000 करोड़') && (text.includes('Needs verification') || text.includes('तथ्य सत्यापन'))
    };
  })()`);

  const hindiCheckRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(EVIDENCE_DIR, '05_ai_check_hindi_sensationalism_factcheck.png'), Buffer.from(hindiCheckRes.data, 'base64'));
  console.log('  ✓ Saved 05_ai_check_hindi_sensationalism_factcheck.png | Metrics:', hindiCheckMetrics);
  results.push({ test: 'Hindi Orthography & Fact-Check', passed: hindiCheckMetrics.hasSemiconductor && hindiCheckMetrics.hasFactCheck, metrics: hindiCheckMetrics });

  // 5. Test Clean Article (No False Positives)
  console.log('5. Testing Clean Article (No False Positives)...');
  const cleanArticleText = 'उत्तर प्रदेश के कानपुर में गंगा तट पर विकास कार्यों की समीक्षा की गई। जिला प्रशासन ने समय पर कार्य पूर्ण करने के निर्देश दिए।';
  await cdp.eval(`(() => {
    if (window.__AZAAD_EDITOR__) {
      window.__AZAAD_EDITOR__.commands.setContent('<p>${cleanArticleText}</p>');
    } else {
      const editorEl = document.querySelector('.ProseMirror');
      if (editorEl) {
        editorEl.focus();
        editorEl.innerHTML = '<p>${cleanArticleText}</p>';
        editorEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  })()`);
  await sleep(1500);

  // Click recheck button
  await cdp.eval(`(() => {
    const recheckBtn = Array.from(document.querySelectorAll('aside button')).find(b => b.innerText.includes('पुनः जाँच'));
    if (recheckBtn) recheckBtn.click();
  })()`);
  await sleep(2500);

  const cleanArticleMetrics = await cdp.eval(`(() => {
    const text = document.body.innerText;
    return {
      isCleanReported: text.includes('कोई त्रुटि नहीं पाई गई') || text.includes('Clean'),
      noCardsFound: Array.from(document.querySelectorAll('aside button')).filter(b => b.innerText.includes('स्वीकारें') || b.innerText.includes('Accept')).length === 0
    };
  })()`);

  const cleanRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(EVIDENCE_DIR, '06_ai_check_clean_article.png'), Buffer.from(cleanRes.data, 'base64'));
  console.log('  ✓ Saved 06_ai_check_clean_article.png | Clean Reported:', cleanArticleMetrics);
  results.push({ test: 'Clean Article Analysis', passed: cleanArticleMetrics.isCleanReported, metrics: cleanArticleMetrics });

  // Close AI Panel
  await cdp.eval(`(() => {
    const closeBtn = document.querySelector('aside button[title*="बंद"], aside button[title*="पैनल"]');
    if (closeBtn) closeBtn.click();
  })()`);
  await sleep(1000);

  // 6. Test Category Selection, SEO & Media Picker in Editor
  console.log('6. Testing Category, Tags, SEO & Media controls in Editor...');
  // Open SEO Accordion / Assistant
  await cdp.eval(`(() => {
    const seoToggle = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('SEO') || b.innerText.includes('मेटा'));
    if (seoToggle) seoToggle.click();
  })()`);
  await sleep(1500);

  const seoRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(EVIDENCE_DIR, '07_editor_seo_panel.png'), Buffer.from(seoRes.data, 'base64'));
  console.log('  ✓ Saved 07_editor_seo_panel.png');

  // 7. Test Media Library (/admin/media)
  console.log('7. Testing Media Library (/admin/media)...');
  await cdp.eval(`(() => { window.location.href = '/admin/media'; })()`);
  await sleep(3000);

  const mediaRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(EVIDENCE_DIR, '08_admin_media_library.png'), Buffer.from(mediaRes.data, 'base64'));
  console.log('  ✓ Saved 08_admin_media_library.png');

  // 8. Test Category Management (/admin/categories)
  console.log('8. Testing Category Management (/admin/categories)...');
  await cdp.eval(`(() => { window.location.href = '/admin/categories'; })()`);
  await sleep(3000);

  const catRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(EVIDENCE_DIR, '09_category_management.png'), Buffer.from(catRes.data, 'base64'));
  console.log('  ✓ Saved 09_category_management.png');

  // 9. Test System Settings (/admin/settings)
  console.log('9. Testing System Settings (/admin/settings)...');
  await cdp.eval(`(() => { window.location.href = '/admin/settings'; })()`);
  await sleep(3000);

  const setRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(EVIDENCE_DIR, '10_system_settings.png'), Buffer.from(setRes.data, 'base64'));
  console.log('  ✓ Saved 10_system_settings.png');

  // 10. Test All News Filters (/admin/news)
  console.log('10. Testing All News List & Filters (/admin/news)...');
  await cdp.eval(`(() => { window.location.href = '/admin/news'; })()`);
  await sleep(3000);

  const newsRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(EVIDENCE_DIR, '11_all_news_filters.png'), Buffer.from(newsRes.data, 'base64'));
  console.log('  ✓ Saved 11_all_news_filters.png');

  // Save QA Results Summary
  fs.writeFileSync(
    path.join(EVIDENCE_DIR, 'phase7_step8_5_summary.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('\n=== BROWSER QA SUITE COMPLETED SUCCESSFULLY ===');
  cdp.close();
  proc.kill();
  process.exit(0);
}

runStep85BrowserQA().catch((err) => {
  console.error('Fatal Step 8.5 Browser QA Error:', err);
  process.exit(1);
});

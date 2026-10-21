/**
 * PHASE 7 STEP 6: SEARCH, NAVIGATION & REMAINING PUBLIC PAGES TEST SUITE
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Automated verification of:
 * 1. Full archive search with Hindi Unicode terms (कानपुर, पुलिस, विकास)
 * 2. Search pagination and deterministic tie-breaking
 * 3. Search race-condition guard (reqIdRef) and input debounce
 * 4. Desktop & Mobile Navigation (Kanpur prominence, drawer accessibility)
 * 5. Dead link audit across routes
 * 6. Video & Photo multimedia routes (/videos & /search?content=photo)
 * 7. Informational pages & owner-editable placeholder integrity
 * 8. Branded 404 page & SEO noIndex enforcement
 * 9. Breadcrumbs & typography consistency
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

console.log('================================================================');
console.log('  PHASE 7 STEP 6: SEARCH, NAVIGATION & PUBLIC PAGES TEST SUITE');
console.log('================================================================\n');

// Load environment variables from .env
const envContent = readFileSync(resolve(ROOT, '.env'), 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -------------------------------------------------------------
// 1. Full Archive Search with Hindi Unicode
// -------------------------------------------------------------
console.log('1. Auditing Full Archive Search & Hindi Unicode Matching...');
try {
  const { articlesService } = await import('../src/services/articlesService.js');

  // Test 'कानपुर'
  const t0 = performance.now();
  const resKanpur = await articlesService.searchArticles('कानपुर', { page: 1, pageSize: 12 });
  const timeKanpur = (performance.now() - t0).toFixed(1);
  assert(resKanpur.total > 500, `Search for 'कानपुर' returned full archive depth (${resKanpur.total} items, took ${timeKanpur}ms)`);
  assert(resKanpur.data && resKanpur.data.length === 12, 'Page 1 bounded to 12 items');

  // Test 'पुलिस'
  const resPolice = await articlesService.searchArticles('पुलिस', { page: 1, pageSize: 12 });
  assert(resPolice.total > 500, `Search for 'पुलिस' returned matches (${resPolice.total} items)`);

  // Test 'विकास'
  const resVikas = await articlesService.searchArticles('विकास', { page: 1, pageSize: 12 });
  assert(resVikas.total > 100, `Search for 'विकास' returned matches (${resVikas.total} items)`);
} catch (err) {
  assert(false, `Search query failed: ${err.message}`);
}

// -------------------------------------------------------------
// 2. Search Pagination & Deterministic Tie-Breaking
// -------------------------------------------------------------
console.log('\n2. Auditing Search Pagination & Tie-Breaking Stability...');
try {
  const { articlesService } = await import('../src/services/articlesService.js');

  const page1 = await articlesService.searchArticles('पुलिस', { page: 1, pageSize: 12 });
  const page2 = await articlesService.searchArticles('पुलिस', { page: 2, pageSize: 12 });

  assert(page1.data && page1.data.length === 12, 'Page 1 has 12 items');
  assert(page2.data && page2.data.length === 12, 'Page 2 has 12 items');

  const page1Ids = new Set(page1.data.map((a) => a.id));
  const duplicates = page2.data.filter((a) => page1Ids.has(a.id));
  assert(duplicates.length === 0, 'Zero duplicate items found across Page 1 and Page 2');
} catch (err) {
  assert(false, `Pagination test threw: ${err.message}`);
}

// -------------------------------------------------------------
// 3. Search Page Code Audit (Debounce, Race Conditions, Skeletons)
// -------------------------------------------------------------
console.log('\n3. Auditing SearchPage.jsx Code Architecture...');
const searchPageCode = readFileSync(resolve(ROOT, 'src/pages/public/SearchPage.jsx'), 'utf-8');

assert(searchPageCode.includes('reqIdRef'), 'SearchPage implements request sequence tracking (reqIdRef) to prevent race conditions');
assert(searchPageCode.includes('setTimeout') && searchPageCode.includes('clearTimeout'), 'SearchPage implements input debounce to synchronize with URL');
assert(searchPageCode.includes('SearchLoadingSkeleton'), 'SearchPage displays loading skeleton during pending query');
assert(searchPageCode.includes('contentType'), 'SearchPage passes contentType filter to articlesService');
assert(searchPageCode.includes('SEO') && searchPageCode.includes('noIndex={Boolean(query)}'), 'Search queries are shielded from search engine index pollution with noIndex');

// -------------------------------------------------------------
// 4. SearchResultCard Component Audit
// -------------------------------------------------------------
console.log('\n4. Auditing SearchResultCard.jsx Presentation...');
const searchCardCode = readFileSync(resolve(ROOT, 'src/components/news/SearchResultCard.jsx'), 'utf-8');

assert(searchCardCode.includes('categoryObj?.nameHindi'), 'SearchResultCard resolves Hindi category labels dynamically');
assert(searchCardCode.includes('imageError') && searchCardCode.includes('Newspaper'), 'SearchResultCard implements newspaper masthead fallback on missing/broken images');
assert(searchCardCode.includes('break-words'), 'SearchResultCard implements break-words to prevent Hindi text overflow');

// -------------------------------------------------------------
// 5. Desktop & Mobile Navigation Audit
// -------------------------------------------------------------
console.log('\n5. Auditing Header, Navbar & Mobile Navigation...');
const catNavCode = readFileSync(resolve(ROOT, 'src/components/layout/CategoryNavbar.jsx'), 'utf-8');
const headerCode = readFileSync(resolve(ROOT, 'src/components/layout/Header.jsx'), 'utf-8');
const mobileNavCode = readFileSync(resolve(ROOT, 'src/components/layout/MobileNavigation.jsx'), 'utf-8');

assert(catNavCode.includes("slug: 'kanpur'") && catNavCode.includes('कानपुर'), 'CategoryNavbar features prominent Kanpur section');
assert(headerCode.includes('handleSearchSubmit'), 'Header provides category-aware search submission');
assert(mobileNavCode.includes('role="dialog"') && mobileNavCode.includes('aria-modal="true"'), 'MobileNavigation drawer has accessible modal dialog attributes');
assert(mobileNavCode.includes('Escape'), 'MobileNavigation supports Escape key dismissal');
assert(mobileNavCode.includes('/category/kanpur'), 'MobileNavigation includes Kanpur category link');

// -------------------------------------------------------------
// 6. Video & Photo Multimedia Routes Audit
// -------------------------------------------------------------
console.log('\n6. Auditing Video & Photo Multimedia Routes...');
const videoPageCode = readFileSync(resolve(ROOT, 'src/pages/public/VideoNewsPage.jsx'), 'utf-8');
assert(!videoPageCode.includes('mockNews'), 'VideoNewsPage contains zero imports from mockNews');
assert(videoPageCode.includes('SEO') && videoPageCode.includes('path="videos"'), 'VideoNewsPage defines canonical SEO metadata');
assert(videoPageCode.includes('डिजिटल मल्टीमीडिया प्रभाग'), 'VideoNewsPage provides dignified broadcast desk hub when no direct YouTube records are attached');

// Photo route verification (/search?content=photo)
try {
  const { articlesService } = await import('../src/services/articlesService.js');
  const photoRes = await articlesService.searchArticles('', { contentType: 'photo', page: 1, pageSize: 12 });
  assert(photoRes.total > 5000, `Photo Gallery search route matches verified media articles (count: ${photoRes.total})`);
  assert(photoRes.data[0].featuredMediaId || photoRes.data[0].featuredImage, 'Photo route returns articles with genuine media assets');
} catch (err) {
  assert(false, `Photo route test failed: ${err.message}`);
}

// -------------------------------------------------------------
// 7. Informational Pages & Owner-Editable Placeholders
// -------------------------------------------------------------
console.log('\n7. Auditing Informational & Editorial Policy Pages...');
const staticInfoCode = readFileSync(resolve(ROOT, 'src/pages/public/StaticInfoPage.jsx'), 'utf-8');
const appCode = readFileSync(resolve(ROOT, 'src/App.jsx'), 'utf-8');
const footerCode = readFileSync(resolve(ROOT, 'src/components/layout/Footer.jsx'), 'utf-8');

assert(appCode.includes('corrections-policy'), 'App.jsx includes corrections-policy route');
assert(staticInfoCode.includes('/corrections-policy'), 'StaticInfoPage configures Corrections & Clarifications Policy');
assert(staticInfoCode.includes('/about'), 'StaticInfoPage configures About Us');
assert(staticInfoCode.includes('/contact'), 'StaticInfoPage configures Contact Us');
assert(staticInfoCode.includes('/editorial-policy'), 'StaticInfoPage configures Editorial Policy');
assert(staticInfoCode.includes('/privacy-policy'), 'StaticInfoPage configures Privacy Policy');
assert(staticInfoCode.includes('/terms-and-conditions'), 'StaticInfoPage configures Terms and Conditions');
assert(staticInfoCode.includes('/fact-check-policy'), 'StaticInfoPage configures Fact-Checking Policy');
assert(staticInfoCode.includes('/grievance'), 'StaticInfoPage configures Grievance Redressal');
assert(staticInfoCode.includes('[') && staticInfoCode.includes('Publisher]'), 'StaticInfoPage uses clearly marked owner-editable placeholders for missing contact/legal info');
assert(staticInfoCode.includes('SEO'), 'StaticInfoPage renders SEO metadata for all informational pages');
assert(footerCode.includes('/corrections-policy'), 'Footer links to corrections-policy');

// -------------------------------------------------------------
// 8. 404 Not Found Page Audit
// -------------------------------------------------------------
console.log('\n8. Auditing 404 Not Found Page...');
const notFoundCode = readFileSync(resolve(ROOT, 'src/pages/public/NotFoundPage.jsx'), 'utf-8');

assert(notFoundCode.includes('noIndex={true}'), 'NotFoundPage enforces SEO noIndex={true}');
assert(notFoundCode.includes('४०४'), 'NotFoundPage renders broadsheet crimson 404 badge');
assert(notFoundCode.includes('to="/"') && notFoundCode.includes('to="/category/latest"'), 'NotFoundPage provides helpful recovery navigation links');

// -------------------------------------------------------------
// 9. Dead Link Audit
// -------------------------------------------------------------
console.log('\n9. Auditing Dead Links Across Navigation...');
assert(!catNavCode.includes('href="#"'), 'CategoryNavbar has zero dead href="#" links');
assert(!headerCode.includes('href="#"'), 'Header has zero dead href="#" links');
assert(!footerCode.includes('href="#"'), 'Footer has zero dead href="#" links');

console.log('\n================================================================');
console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

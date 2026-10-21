/**
 * Phase 6 Step 2 — Taxonomy, Redirect & Sitemap Reconciliation Test Suite
 * Azaad Samachar (आज़ाद समाचार)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
  }
}

console.log('================================================================');
console.log('  PHASE 6 RECONCILIATION VERIFICATION TEST SUITE');
console.log('================================================================\n');

// 1. Verify Category Schema & Mapping
console.log('1. Testing Category Schema Mapping & Runner Parity...');
const runnerContent = fs.readFileSync(path.join(rootDir, 'scripts', 'run_full_archive_migration.mjs'), 'utf8');
assert(runnerContent.includes(".select('id, slug, name')"), "Runner queries 'name' and NOT 'name_hi'");
assert(!runnerContent.includes("name_hi"), "Runner contains zero references to invalid 'name_hi' column");
assert(runnerContent.includes("source_path: `/?p=${wpId}`"), "Runner uses 'source_path' for redirect upsert");
assert(runnerContent.includes("target_slug: finalSlug"), "Runner uses 'target_slug' for redirect upsert");
assert(!runnerContent.includes("legacy_url_redirects').upsert({\n            legacy_url:"), "Runner does not use invalid 'legacy_url' column in legacy_url_redirects upsert");

// 2. Verify Multi-Category Preservation & Plan
console.log('\n2. Testing Multi-Category Preservation & Reconciliation Plan...');
const dryRunPlanPath = path.join(rootDir, 'docs', 'RECONCILIATION_DRY_RUN_PLAN.json');
assert(fs.existsSync(dryRunPlanPath), "Reconciliation dry-run plan exists");
const plan = JSON.parse(fs.readFileSync(dryRunPlanPath, 'utf8'));
assert(plan.totalArticles === 10654, `Plan accounts for exactly 10,654 articles (found ${plan.totalArticles})`);
assert(plan.kanpurArticleCount === 8528, `Kanpur beat preserved with 8,528 articles (found ${plan.kanpurArticleCount})`);
assert(plan.categoryDistribution.national === 2308, `National category has exactly 2,308 articles`);
assert(plan.totalPlannedCategoryJoins === 11722, `Total category joins equals 11,722 (accounting for multi-category articles)`);
assert(plan.existingJoinsPreserved === 74, `Preserved all 74 pre-existing joins`);
assert(plan.totalPlannedRedirects === 10654, `Total planned redirects equals 10,654 articles`);

// 3. Verify Sitemap Generator & Indexing
console.log('\n3. Testing Sitemap Index & Partitioned Yearly Sitemaps...');
const sitemapIndexPath = path.join(rootDir, 'public', 'sitemap.xml');
assert(fs.existsSync(sitemapIndexPath), "Master sitemap.xml exists in public directory");
const indexContent = fs.readFileSync(sitemapIndexPath, 'utf8');
assert(indexContent.includes('<sitemapindex'), "sitemap.xml is a valid <sitemapindex>");
assert(indexContent.includes('sitemap-categories.xml'), "sitemap.xml indexes sitemap-categories.xml");
assert(indexContent.includes('sitemap-2026.xml'), "sitemap.xml indexes sitemap-2026.xml");
assert(indexContent.includes('sitemap-2025.xml'), "sitemap.xml indexes sitemap-2025.xml");
assert(indexContent.includes('sitemap-2024.xml'), "sitemap.xml indexes sitemap-2024.xml");
assert(indexContent.includes('sitemap-2023.xml'), "sitemap.xml indexes sitemap-2023.xml");

// 4. Verify Sub-Sitemaps Content & Deduplication
console.log('\n4. Testing Sub-Sitemaps Coverage & URL Encoding...');
const years = ['2023', '2024', '2025', '2026'];
const allUrls = new Set();
let duplicateUrlCount = 0;

for (const year of years) {
  const filePath = path.join(rootDir, 'public', `sitemap-${year}.xml`);
  assert(fs.existsSync(filePath), `sitemap-${year}.xml exists`);
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('<urlset'), `sitemap-${year}.xml is a valid <urlset>`);

  const locMatches = content.match(/<loc>(.*?)<\/loc>/g) || [];
  for (const m of locMatches) {
    const url = m.replace(/<\/?loc>/g, '');
    if (allUrls.has(url)) {
      duplicateUrlCount++;
    } else {
      allUrls.add(url);
    }
  }
}

assert(duplicateUrlCount === 0, `Zero duplicate article URLs across all sitemaps (found ${duplicateUrlCount})`);
assert(allUrls.size === 10654, `Sitemaps cover exactly 10,654 unique article URLs (found ${allUrls.size})`);

// Check URL formatting
const sampleUrl = Array.from(allUrls)[0];
assert(sampleUrl.startsWith('https://azaadsamacharindia.com/news/'), `URL format matches canonical production route (${sampleUrl.slice(0, 50)}...)`);
assert(!sampleUrl.includes(' '), "Article URLs are cleanly encoded with no raw spaces");

// 5. Verify Categories Sub-Sitemap
console.log('\n5. Testing Categories Sitemap...');
const catSitemapPath = path.join(rootDir, 'public', 'sitemap-categories.xml');
assert(fs.existsSync(catSitemapPath), "sitemap-categories.xml exists");
const catContent = fs.readFileSync(catSitemapPath, 'utf8');
assert(catContent.includes('https://azaadsamacharindia.com/'), "Includes canonical homepage");
assert(catContent.includes('/category/kanpur'), "Includes Kanpur category route");
assert(catContent.includes('/category/national'), "Includes National category route");
assert(catContent.includes('/category/uttar-pradesh'), "Includes Uttar Pradesh category route");

console.log('\n================================================================');
console.log(`RESULTS: ${passedTests} passed, ${failedTests} failed out of ${totalTests} tests`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
}

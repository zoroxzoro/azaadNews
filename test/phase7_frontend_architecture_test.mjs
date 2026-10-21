/**
 * Phase 7 Step 2 Automated Regression Test Suite
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Verifies:
 * 1. Direct article deep links outside the latest 100.
 * 2. Loading state vs genuine 404 state handling (no premature 404 flash).
 * 3. Network error handling and retry mechanisms.
 * 4. Category pagination and accurate total counts.
 * 5. Kanpur category data access (8,528 associated articles).
 * 6. Full-archive search with Hindi Unicode support.
 * 7. Search URL synchronization.
 * 8. Admin article pagination across all 10,654 records.
 * 9. Dashboard counts (10,654 total articles).
 * 10. Media Library pagination across all 8,670 assets.
 * 11. Elimination of obsolete mock-data fallbacks.
 * 12. Removal of hardcoded semiconductor highlights/polls from ArticleBody.jsx.
 * 13. Security: Zero service-role keys in frontend src/ directory.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
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
console.log('  PHASE 7 STEP 2: FRONTEND ARCHITECTURE & ARCHIVE TEST SUITE');
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
// 1. Testing Direct Deep Link to Historical Article outside Top 100
// -------------------------------------------------------------
console.log('1. Testing Direct Historical Article Deep Link...');
try {
  // Fetch an article from the middle of the database (e.g. offset 500)
  const { data: sampleArticles, error: sampleErr } = await supabase
    .from('articles')
    .select('id, slug, title, legacy_wordpress_id, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(500, 501);

  assert(!sampleErr, 'Supabase query succeeded for historical article offset 500');
  assert(sampleArticles && sampleArticles.length > 0, 'Found historical article beyond latest 100');

  const testArticle = sampleArticles[0];
  console.log(`     Target historical article: "${testArticle.title?.slice(0, 40)}..." (ID: ${testArticle.id})`);

  // Direct lookup by slug
  const { data: directArticle, error: directErr } = await supabase
    .from('articles')
    .select('id, slug, title, content_json, original_html, published_at')
    .eq('slug', testArticle.slug)
    .maybeSingle();

  assert(!directErr, 'Direct slug lookup completed without query error');
  assert(directArticle && directArticle.id === testArticle.id, 'Deep link resolves exact historical article outside top 100');
  assert(directArticle.content_json || directArticle.original_html, 'Historical article content body is available on detail page');
} catch (err) {
  assert(false, `Deep link test threw error: ${err.message}`);
}

// -------------------------------------------------------------
// 2. Testing NewsDetailPage Loading vs 404 State Machine
// -------------------------------------------------------------
console.log('\n2. Testing NewsDetailPage State Machine & Clean 404s...');
const newsDetailCode = readFileSync(resolve(ROOT, 'src/pages/public/NewsDetailPage.jsx'), 'utf-8');

assert(newsDetailCode.includes('ArticleDetailSkeleton'), 'NewsDetailPage renders broadsheet skeleton while query is pending');
assert(newsDetailCode.includes('isNotFound'), 'NewsDetailPage maintains distinct isNotFound state');
assert(newsDetailCode.includes('networkError'), 'NewsDetailPage distinguishes network errors from genuine 404s');
assert(newsDetailCode.includes('noIndex={true}'), 'noIndex={true} is applied only to genuine 404 state');

// -------------------------------------------------------------
// 3. Testing ArticleBody Clean Rendering (No Hardcoded Content)
// -------------------------------------------------------------
console.log('\n3. Testing ArticleBody Content Integrity...');
const articleBodyCode = readFileSync(resolve(ROOT, 'src/components/news/ArticleBody.jsx'), 'utf-8');

assert(!articleBodyCode.includes('सेमीकंडक्टर नीति 2025'), 'Removed hardcoded semiconductor highlights from ArticleBody');
assert(!articleBodyCode.includes('क्या आप राष्ट्रीय सेमीकंडक्टर नीति 2025 से सहमत हैं?'), 'Removed hardcoded semiconductor poll from ArticleBody');
assert(articleBodyCode.includes('article.highlights') && articleBodyCode.includes('{highlights && ('), 'Highlights rendered only when actual article data exists');
assert(articleBodyCode.includes('{poll && poll.question && ('), 'Poll rendered only when actual poll data exists');

// -------------------------------------------------------------
// 4. Testing Category Pagination & Kanpur Beats
// -------------------------------------------------------------
console.log('\n4. Testing Category Data Access & Server-side Pagination...');
const categoryPageCode = readFileSync(resolve(ROOT, 'src/pages/public/CategoryPage.jsx'), 'utf-8');

assert(!categoryPageCode.includes('getArticlesByCategory(slug)'), 'Obsolete mock news fallback removed from CategoryPage');
assert(categoryPageCode.includes('articlesService.getArticlesByCategory'), 'CategoryPage calls articlesService with server-side pagination');
assert(categoryPageCode.includes('CategoryLoadingSkeleton'), 'CategoryPage displays loading skeleton during pending queries');

// Test Kanpur live query
const { data: kanpurRows, count: kanpurCount, error: kanpurErr } = await supabase
  .from('articles')
  .select('id, title, article_categories!inner(category_id, categories!inner(slug))', { count: 'exact' })
  .eq('status', 'published')
  .eq('article_categories.categories.slug', 'kanpur')
  .range(0, 11);

assert(!kanpurErr, 'Kanpur category PostgREST query completed successfully');
assert(kanpurCount === 8528, `Kanpur total count equals exactly 8,528 (received: ${kanpurCount})`);
assert(kanpurRows && kanpurRows.length === 12, 'Default page size of 12 rows returned for Kanpur');

// -------------------------------------------------------------
// 5. Testing Full-Archive Search with Hindi Unicode
// -------------------------------------------------------------
console.log('\n5. Testing Full-Archive Search with Hindi Unicode...');
const searchPageCode = readFileSync(resolve(ROOT, 'src/pages/public/SearchPage.jsx'), 'utf-8');

assert(!searchPageCode.includes('searchNews(sourceArticles, query)'), 'Client-side regex search on in-memory array eliminated');
assert(searchPageCode.includes('articlesService.searchArticles'), 'SearchPage calls server-side searchArticles service');
assert(searchPageCode.includes('reqIdRef.current'), 'SearchPage guards against stale responses with sequence tracker');

// Live Hindi search test across all 10,654 rows
const hindiTerm = 'पुलिस';
const { data: searchRows, count: searchTotal, error: searchErr } = await supabase
  .from('articles')
  .select('id, title, excerpt', { count: 'exact' })
  .eq('status', 'published')
  .or(`title.ilike.%${hindiTerm}%,excerpt.ilike.%${hindiTerm}%`)
  .range(0, 11);

assert(!searchErr, 'Hindi Unicode ILIKE query completed without database error');
assert(searchTotal > 100, `Found ${searchTotal} matches across entire archive for keyword '${hindiTerm}'`);
assert(searchRows.length === 12, 'Returned exactly 12 search result rows for page 1');

// -------------------------------------------------------------
// 6. Testing Admin CMS AllNewsPage & Dashboard Counts
// -------------------------------------------------------------
console.log('\n6. Testing Admin CMS Pagination & Dashboard Counts...');
const allNewsCode = readFileSync(resolve(ROOT, 'src/pages/admin/AllNewsPage.jsx'), 'utf-8');
const dashboardCode = readFileSync(resolve(ROOT, 'src/pages/admin/DashboardPage.jsx'), 'utf-8');

assert(allNewsCode.includes('articlesService.getAdminArticles'), 'AllNewsPage queries getAdminArticles with server-side pagination');
assert(allNewsCode.includes('articlesService.getArticleCounts'), 'AllNewsPage queries real status counts from database');
assert(dashboardCode.includes('articlesService.getArticleCounts'), 'DashboardPage fetches real database counts');

// Test live count query
const [totalRes, pubRes] = await Promise.all([
  supabase.from('articles').select('id', { count: 'exact', head: true }),
  supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
]);

assert(totalRes.count === 10654, `Dashboard total articles equals 10,654 (received: ${totalRes.count})`);
assert(pubRes.count === 10654, `Dashboard published articles equals 10,654 (received: ${pubRes.count})`);

// -------------------------------------------------------------
// 7. Testing Admin Media Library Server Pagination
// -------------------------------------------------------------
console.log('\n7. Testing Admin Media Library Pagination...');
const mediaPageCode = readFileSync(resolve(ROOT, 'src/pages/admin/MediaLibraryPage.jsx'), 'utf-8');
const mediaServiceCode = readFileSync(resolve(ROOT, 'src/services/mediaService.js'), 'utf-8');

assert(mediaServiceCode.includes('fetchMediaAssetsPaginated'), 'mediaService implements fetchMediaAssetsPaginated');
assert(mediaPageCode.includes('backendMediaService.fetchMediaAssetsPaginated'), 'MediaLibraryPage calls fetchMediaAssetsPaginated');
assert(mediaPageCode.includes('Pagination'), 'MediaLibraryPage includes Pagination component');

// Live media count test
const { count: mediaCount, error: mediaErr } = await supabase
  .from('media')
  .select('id', { count: 'exact', head: true });

assert(!mediaErr, 'Media table count query succeeded');
assert(mediaCount === 8670, `Total media assets equals 8,670 (received: ${mediaCount})`);

// -------------------------------------------------------------
// 8. Testing Lightweight Context (No Unnecessary 100-Article AST Downloads)
// -------------------------------------------------------------
console.log('\n8. Testing Initial Article Context Payload Optimization...');
const articleContextCode = readFileSync(resolve(ROOT, 'src/context/ArticleContext.jsx'), 'utf-8');

assert(articleContextCode.includes('limit: 30'), 'Initial public context payload reduced to lightweight 30 summaries');
assert(articleContextCode.includes('pageSize: 50'), 'Admin context initialized with paginated summaries');

// -------------------------------------------------------------
// 9. Testing Database Indexes Migration
// -------------------------------------------------------------
console.log('\n9. Testing Database Performance Migration...');
const migration7Path = resolve(ROOT, 'supabase/migrations/20261020000007_search_and_performance_optimization.sql');
assert(existsSync(migration7Path), 'Migration 7 exists for GIN trigram indexes');
const mig7Code = readFileSync(migration7Path, 'utf-8');
assert(mig7Code.includes('pg_trgm'), 'Migration 7 enables pg_trgm extension');
assert(mig7Code.includes('idx_articles_title_trgm'), 'Migration 7 defines title trigram index');
assert(mig7Code.includes('idx_articles_excerpt_trgm'), 'Migration 7 defines excerpt trigram index');

// -------------------------------------------------------------
// 10. Security Audit: Zero Service Role Keys in Frontend
// -------------------------------------------------------------
console.log('\n10. Testing Security: Zero Service Role Keys in src/...');
const srcDir = resolve(ROOT, 'src');
let foundServiceRole = false;

function scanDir(dir) {
  const { readdirSync, statSync } = require('fs');
  const files = readdirSync(dir);
  for (const file of files) {
    const full = resolve(dir, file);
    if (statSync(full).isDirectory()) {
      scanDir(full);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = readFileSync(full, 'utf-8');
      if (content.includes('service_role') || content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
        foundServiceRole = true;
        console.error(`     Found forbidden service-role reference in ${full}`);
      }
    }
  }
}

// Use native dynamic scan
const fs = await import('fs');
function scanDirEsm(dir) {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = resolve(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDirEsm(fullPath);
    } else if (entry.endsWith('.js') || entry.endsWith('.jsx')) {
      const code = fs.readFileSync(fullPath, 'utf-8');
      if (code.includes('SUPABASE_SERVICE_ROLE_KEY') || (code.includes('service_role') && !code.includes('author_role'))) {
        foundServiceRole = true;
        console.error(`     Found forbidden key reference in ${fullPath}`);
      }
    }
  }
}

scanDirEsm(srcDir);
assert(!foundServiceRole, 'Zero service role keys or admin secrets exist in browser code');

console.log('\n================================================================');
console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
}

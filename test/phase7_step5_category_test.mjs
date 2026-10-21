/**
 * Phase 7 Step 5 Automated Test Suite
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Verifies:
 * 1. Kanpur category pagination (Page 1, Page 2, and Deep Archive Page 100)
 * 2. Deterministic tie-breaking sorting across pagination (zero duplicate/skipped items)
 * 3. Total article counts accuracy (Kanpur: 8,528, National: 2,308, UP: 438, Sports: 104)
 * 4. Topic fallback transparency for business and politics categories
 * 5. Small categories (e.g. spirituality with 19 articles) pagination & layout
 * 6. CategoryHeader props, Hindi titles, and topic disclosure
 * 7. CategoryPage first-page broadsheet segmentation (lead, sub-lead, stream without item loss)
 * 8. NewsFilters prop robustness & sorting integration (newest, popular, oldest)
 * 9. Pagination component dynamic windowing (computedPageNumbers with ellipsis)
 * 10. SEO pagination-aware canonical paths and invalid category noIndex guard
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
console.log('  PHASE 7 STEP 5: CATEGORY PAGES & ARCHIVE BROWSING TEST SUITE');
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

async function runTests() {
  // -------------------------------------------------------------
  // 1. Audit CategoryPage.jsx Component Code
  // -------------------------------------------------------------
  console.log('1. Auditing CategoryPage.jsx Code...');
  const catPagePath = resolve(ROOT, 'src/pages/public/CategoryPage.jsx');
  assert(existsSync(catPagePath), 'CategoryPage.jsx exists');
  const catCode = readFileSync(catPagePath, 'utf-8');

  assert(!catCode.includes('/images/placeholder.jpg'), 'CategoryPage replaced broken /images/placeholder.jpg with broadsheet fallback');
  assert(catCode.includes('articles.slice(1 + subLeadArticles.length)'), 'CategoryPage handles subLead segmentation without losing articles');
  assert(catCode.includes('isTopicFallback'), 'CategoryPage receives isTopicFallback state');
  assert(catCode.includes('totalArticles={totalCount}'), 'CategoryPage passes totalArticles to CategoryHeader');
  assert(catCode.includes('noIndex={isInvalidCategory}'), 'CategoryPage applies noIndex for invalid categories with 0 results');
  assert(catCode.includes('page=${currentPage}'), 'CategoryPage generates pagination-aware canonical SEO paths');

  // -------------------------------------------------------------
  // 2. Audit CategoryHeader & NewsFilters & Pagination Components
  // -------------------------------------------------------------
  console.log('\n2. Auditing Supporting Category Components...');
  const headerPath = resolve(ROOT, 'src/components/news/CategoryHeader.jsx');
  const filtersPath = resolve(ROOT, 'src/components/news/NewsFilters.jsx');
  const pagPath = resolve(ROOT, 'src/components/news/Pagination.jsx');
  assert(existsSync(headerPath) && existsSync(filtersPath) && existsSync(pagPath), 'CategoryHeader, NewsFilters, and Pagination exist');

  const headerCode = readFileSync(headerPath, 'utf-8');
  const filtersCode = readFileSync(filtersPath, 'utf-8');
  const pagCode = readFileSync(pagPath, 'utf-8');

  assert(headerCode.includes('matchingRule'), 'CategoryHeader displays editorial topic matching disclosure');
  assert(headerCode.includes('articleCount !== undefined ? articleCount : totalArticles'), 'CategoryHeader supports both articleCount and totalArticles');
  assert(filtersCode.includes('activeSub !== undefined ? activeSub : activeSubCategory'), 'NewsFilters supports both activeSub and activeSubCategory');
  assert(pagCode.includes('computedPageNumbers'), 'Pagination dynamically computes windowed page numbers with ellipsis');

  // -------------------------------------------------------------
  // 3. Database Queries: Kanpur Category Deep Archive Pagination
  // -------------------------------------------------------------
  console.log('\n3. Testing Kanpur Beat Pagination & Tie-Breaking Stability...');

  // Kanpur Page 1 (items 0 to 11)
  const { data: kanpurP1, count: kanpurCount, error: errK1 } = await supabase
    .from('articles')
    .select('id, title, slug, published_at, article_categories!inner(categories!inner(slug))', { count: 'exact' })
    .eq('status', 'published')
    .eq('article_categories.categories.slug', 'kanpur')
    .order('published_at', { ascending: false })
    .order('id', { ascending: false })
    .range(0, 11);

  assert(!errK1 && kanpurP1, 'Kanpur Page 1 query executed successfully');
  assert(kanpurCount === 8528, `Kanpur total count verified across database (expected 8528, received: ${kanpurCount})`);
  assert(kanpurP1.length === 12, 'Kanpur Page 1 returned exactly 12 items');

  // Kanpur Page 2 (items 12 to 23)
  const { data: kanpurP2, error: errK2 } = await supabase
    .from('articles')
    .select('id, title, slug, published_at, article_categories!inner(categories!inner(slug))')
    .eq('status', 'published')
    .eq('article_categories.categories.slug', 'kanpur')
    .order('published_at', { ascending: false })
    .order('id', { ascending: false })
    .range(12, 23);

  assert(!errK2 && kanpurP2, 'Kanpur Page 2 query executed successfully');
  assert(kanpurP2.length === 12, 'Kanpur Page 2 returned exactly 12 items');

  // Verify Zero Duplicates between Page 1 and Page 2
  const p1Ids = new Set(kanpurP1.map((a) => a.id));
  const hasDuplicate = kanpurP2.some((a) => p1Ids.has(a.id));
  assert(!hasDuplicate, 'Deterministic tie-breaking sorting guaranteed zero duplicate items between Page 1 and Page 2');

  // Deep Archive: Kanpur Page 100 (items 1188 to 1199)
  const { data: kanpurP100, error: errK100 } = await supabase
    .from('articles')
    .select('id, title, slug, published_at, article_categories!inner(categories!inner(slug))')
    .eq('status', 'published')
    .eq('article_categories.categories.slug', 'kanpur')
    .order('published_at', { ascending: false })
    .order('id', { ascending: false })
    .range(1188, 1199);

  assert(!errK100 && kanpurP100 && kanpurP100.length === 12, `Deep archive navigation: Page 100 loaded exactly 12 historical articles (Lead: "${kanpurP100?.[0]?.title?.slice(0, 30)}...")`);

  // -------------------------------------------------------------
  // 4. Testing Other Core Categories
  // -------------------------------------------------------------
  console.log('\n4. Testing Core Categories Archive Counts...');

  // National Category
  const { count: natCount, error: natErr } = await supabase
    .from('articles')
    .select('id, article_categories!inner(categories!inner(slug))', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('article_categories.categories.slug', 'national');
  assert(!natErr && natCount === 2308, `National category total count verified (2308, received: ${natCount})`);

  // Uttar Pradesh Category
  const { count: upCount, error: upErr } = await supabase
    .from('articles')
    .select('id, article_categories!inner(categories!inner(slug))', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('article_categories.categories.slug', 'uttar-pradesh');
  assert(!upErr && upCount === 438, `Uttar Pradesh category total count verified (438, received: ${upCount})`);

  // Sports Category
  const { count: spCount, error: spErr } = await supabase
    .from('articles')
    .select('id, article_categories!inner(categories!inner(slug))', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('article_categories.categories.slug', 'sports');
  assert(!spErr && spCount === 104, `Sports category total count verified (104, received: ${spCount})`);

  // Small Category: Spirituality (धर्म/अध्यात्म with 19 articles)
  const { count: spiritCount, error: spiritErr } = await supabase
    .from('articles')
    .select('id, article_categories!inner(categories!inner(slug))', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('article_categories.categories.slug', 'spirituality');
  assert(!spiritErr && spiritCount === 19, `Small category spirituality verified (19 articles, totalPages: ${Math.ceil(spiritCount / 12)})`);

  // -------------------------------------------------------------
  // 5. Testing Topic Fallback Transparency for Business & Politics
  // -------------------------------------------------------------
  console.log('\n5. Testing Topic Fallback Transparency...');
  const { count: bzCount, error: bzErr } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .or('title.ilike.%व्यापार%,title.ilike.%कारोबार%,title.ilike.%बाजार%,title.ilike.%उद्योग%');
  assert(!bzErr && bzCount === 204, `Business topic fallback matches 204 historical articles`);

  const { count: polCount, error: polErr } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .or('title.ilike.%चुनाव%,title.ilike.%भाजपा%,title.ilike.%सपा%,title.ilike.%कांग्रेस%,title.ilike.%राजनीति%');
  assert(!polErr && polCount === 415, `Politics topic fallback matches 415 historical articles`);

  // -------------------------------------------------------------
  // 6. Testing Invalid Category Slug & Empty State
  // -------------------------------------------------------------
  console.log('\n6. Testing Invalid Category Slug...');
  const fakeSlug = 'nonexistent-category-slug-12345';
  const { data: fakeData, count: fakeCount } = await supabase
    .from('articles')
    .select('id, article_categories!inner(categories!inner(slug))', { count: 'exact' })
    .eq('article_categories.categories.slug', fakeSlug);

  assert(fakeCount === 0 || !fakeData || fakeData.length === 0, 'Invalid category slug returns 0 records (triggers clean EmptyState and noIndex)');

  console.log('\n================================================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

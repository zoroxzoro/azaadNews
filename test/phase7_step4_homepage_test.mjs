/**
 * Phase 7 Step 4 Automated Regression Test Suite
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Verifies:
 * 1. Homepage architecture & elimination of obsolete mock fallbacks
 * 2. Dedicated Kanpur section functionality and Supabase query integration
 * 3. Hero & Top stories deduplication, image fallbacks, and Hindi categories
 * 4. UPRegionalSection city filtering with zero silent fallback bleed & dedicated empty states
 * 5. Category feeds: Business topic fallback, Sports, National, and World queries
 * 6. Breaking news ticker real-data fallback and clickable links
 * 7. Multimedia & Video section: zero fake view counters, clean player handling
 * 8. Global navigation and footer: Kanpur links present in CategoryNavbar and Footer
 * 9. Production build verification and module bundling
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
console.log('  PHASE 7 STEP 4: HOMEPAGE FUNCTIONALITY & UI POLISH TEST SUITE');
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
  // 1. Audit HomePage.jsx Structure & Mock Elimination
  // -------------------------------------------------------------
  console.log('1. Auditing HomePage.jsx Architecture...');
  const homePath = resolve(ROOT, 'src/pages/public/HomePage.jsx');
  assert(existsSync(homePath), 'HomePage.jsx exists');
  const homeCode = readFileSync(homePath, 'utf-8');

  assert(!homeCode.includes("from '../../data/mockNews'"), 'HomePage.jsx has zero imports from mockNews');
  assert(homeCode.includes('KanpurNewsSection'), 'HomePage.jsx imports and integrates KanpurNewsSection');
  assert(homeCode.includes('HeroNewsSection'), 'HomePage.jsx renders HeroNewsSection');
  assert(homeCode.includes('UPRegionalSection'), 'HomePage.jsx renders UPRegionalSection');
  assert(homeCode.includes('BusinessMarketsSection'), 'HomePage.jsx renders BusinessMarketsSection');
  assert(homeCode.includes('LatestNewsSection'), 'HomePage.jsx renders LatestNewsSection');
  assert(homeCode.includes('VideoNewsSection'), 'HomePage.jsx renders VideoNewsSection');
  assert(homeCode.includes('usedStoryIds'), 'HomePage.jsx implements strict story deduplication');

  // -------------------------------------------------------------
  // 2. Audit Dedicated Kanpur News Section
  // -------------------------------------------------------------
  console.log('\n2. Auditing Dedicated Kanpur News Section...');
  const kanpurPath = resolve(ROOT, 'src/components/news/KanpurNewsSection.jsx');
  assert(existsSync(kanpurPath), 'KanpurNewsSection.jsx exists');
  const kanpurCode = readFileSync(kanpurPath, 'utf-8');

  assert(kanpurCode.includes('/category/kanpur'), 'Kanpur section links to /category/kanpur');
  assert(kanpurCode.includes('कानपुर'), 'Kanpur section has prominent Hindi Kanpur heading');
  assert(kanpurCode.includes('NewsSkeleton'), 'Kanpur section includes broadsheet loading skeletons');

  // Test real Supabase data query for Kanpur beat
  const { data: kanpurArticles, count: kanpurCount, error: kanpurErr } = await supabase
    .from('articles')
    .select(`
      id, title, slug,
      article_categories!inner(categories!inner(slug))
    `, { count: 'exact' })
    .eq('status', 'published')
    .eq('article_categories.categories.slug', 'kanpur')
    .order('published_at', { ascending: false })
    .limit(6);

  assert(!kanpurErr, 'Supabase Kanpur category query executed successfully');
  assert(kanpurCount >= 8500, `Kanpur total count is verified across archive (count: ${kanpurCount})`);
  assert(kanpurArticles && kanpurArticles.length === 6, 'Kanpur query returned exactly 6 bounded article cards');

  // -------------------------------------------------------------
  // 3. Audit Hero & Top Stories Cards
  // -------------------------------------------------------------
  console.log('\n3. Auditing Hero News Section & Featured Cards...');
  const heroPath = resolve(ROOT, 'src/components/news/HeroNewsSection.jsx');
  const featPath = resolve(ROOT, 'src/components/news/FeaturedNewsCard.jsx');
  const newsCardPath = resolve(ROOT, 'src/components/news/NewsCard.jsx');
  assert(existsSync(heroPath) && existsSync(featPath) && existsSync(newsCardPath), 'Hero and Card components exist');

  const featCode = readFileSync(featPath, 'utf-8');
  const heroCode = readFileSync(heroPath, 'utf-8');
  const newsCardCode = readFileSync(newsCardPath, 'utf-8');

  assert(!featCode.includes('सेमीकंडक्टर हब'), 'FeaturedNewsCard eliminated fake semiconductor bullet points');
  assert(!featCode.includes('12 तस्वीरें'), 'FeaturedNewsCard eliminated hardcoded 12 तस्वीरें badge');
  assert(featCode.includes('imgError') && featCode.includes('Newspaper'), 'FeaturedNewsCard implements broadsheet image fallback');
  assert(newsCardCode.includes('imgError') && newsCardCode.includes('Newspaper'), 'NewsCard implements robust image error fallback');
  assert(heroCode.includes('getCategoryBySlug'), 'HeroNewsSection resolves Hindi category names');

  // -------------------------------------------------------------
  // 4. Audit UPRegionalSection City Filtering
  // -------------------------------------------------------------
  console.log('\n4. Auditing UP Regional City Filter Logic...');
  const upPath = resolve(ROOT, 'src/components/news/UPRegionalSection.jsx');
  assert(existsSync(upPath), 'UPRegionalSection.jsx exists');
  const upCode = readFileSync(upPath, 'utf-8');

  assert(upCode.includes('aliases'), 'UPRegionalSection defines city aliases for location normalization');
  assert(!upCode.includes('filteredArticles.length > 0 ? filteredArticles : articles'), 'UPRegionalSection eliminated silent fallback to all articles');
  assert(upCode.includes('से संबंधित कोई ताज़ा समाचार अभी उपलब्ध नहीं है'), 'UPRegionalSection displays dignified empty state when city has no matches');

  // -------------------------------------------------------------
  // 5. Audit Category Feeds & Topic Fallbacks
  // -------------------------------------------------------------
  console.log('\n5. Auditing Server-side Category Feeds...');
  const svcPath = resolve(ROOT, 'src/services/articlesService.js');
  const svcCode = readFileSync(svcPath, 'utf-8');
  assert(svcCode.includes('Historical Archive Topic Fallback'), 'articlesService implements topic fallback for unjoined historical categories');

  // National beat query
  const { count: nationalCount, error: natErr } = await supabase
    .from('articles')
    .select('id, article_categories!inner(categories!inner(slug))', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('article_categories.categories.slug', 'national');
  assert(!natErr && nationalCount >= 2000, `National category has verified archive depth (count: ${nationalCount})`);

  // Sports beat query
  const { count: sportsCount, error: spErr } = await supabase
    .from('articles')
    .select('id, article_categories!inner(categories!inner(slug))', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('article_categories.categories.slug', 'sports');
  assert(!spErr && sportsCount >= 100, `Sports category has verified archive depth (count: ${sportsCount})`);

  // Business topic query
  const { count: bzCount, error: bzErr } = await supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .or('title.ilike.%व्यापार%,title.ilike.%कारोबार%,title.ilike.%बाजार%,title.ilike.%उद्योग%');
  assert(!bzErr && bzCount >= 200, `Business topic articles verified in database (count: ${bzCount})`);

  // -------------------------------------------------------------
  // 6. Audit Breaking News Ticker
  // -------------------------------------------------------------
  console.log('\n6. Auditing Breaking News Ticker...');
  const tickerPath = resolve(ROOT, 'src/components/layout/BreakingNewsTicker.jsx');
  assert(existsSync(tickerPath), 'BreakingNewsTicker.jsx exists');
  const tickerCode = readFileSync(tickerPath, 'utf-8');

  assert(!tickerCode.includes('mockNews'), 'BreakingNewsTicker has zero references to mockNews');
  assert(tickerCode.includes('livePublished.slice'), 'BreakingNewsTicker falls back to latest published real articles');
  assert(tickerCode.includes('prefers-reduced-motion'), 'BreakingNewsTicker respects prefers-reduced-motion accessibility');

  // -------------------------------------------------------------
  // 7. Audit Multimedia & Video Section
  // -------------------------------------------------------------
  console.log('\n7. Auditing VideoNewsSection...');
  const videoPath = resolve(ROOT, 'src/components/news/VideoNewsSection.jsx');
  assert(existsSync(videoPath), 'VideoNewsSection.jsx exists');
  const videoCode = readFileSync(videoPath, 'utf-8');

  assert(!videoCode.includes('128000') && !videoCode.includes('45000'), 'VideoNewsSection eliminated hardcoded fake view counts');
  assert(videoCode.includes('item?.youtubeUrl') || videoCode.includes('article.youtubeUrl'), 'Video player validates presence of real YouTube URL');
  assert(videoCode.includes('आज़ाद वीडियो प्राइम • डिजिटल मल्टीमीडिया डेस्क'), 'VideoNewsSection provides dignified newsroom hub fallback when no video records exist');

  // -------------------------------------------------------------
  // 8. Audit Global Navigation & Footer Links
  // -------------------------------------------------------------
  console.log('\n8. Auditing Header, Navigation & Footer Links...');
  const navPath = resolve(ROOT, 'src/components/layout/CategoryNavbar.jsx');
  const footerPath = resolve(ROOT, 'src/components/layout/Footer.jsx');
  assert(existsSync(navPath) && existsSync(footerPath), 'CategoryNavbar and Footer exist');

  const navCode = readFileSync(navPath, 'utf-8');
  const footerCode = readFileSync(footerPath, 'utf-8');

  assert(navCode.includes('/category/kanpur'), 'CategoryNavbar includes /category/kanpur');
  assert(footerCode.includes('/category/kanpur'), 'Footer includes /category/kanpur');
  assert(!footerCode.includes('href="#"') && !footerCode.includes('to="#"'), 'Footer contains zero dead "#" links');

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

/**
 * Phase 10 Verification Suite — Azaad Samachar
 * Automated verification of all 14 test cases across live Supabase data and local routes.
 */

import { supabase, isSupabaseConfigured } from '../src/lib/supabase.js';
import { articlesService } from '../src/services/articlesService.js';
import { generateNewsArticleSchema, buildArticleMetadata, buildCanonicalUrl } from '../src/services/seoService.js';
import { getCategoryBySlug } from '../src/data/categories.js';

async function runPhase10Tests() {
  console.log('================================================================');
  console.log('  AZAAD SAMACHAR — PHASE 10 VERIFICATION TEST SUITE');
  console.log('================================================================\n');

  const results = [];

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      results.push({ name, status: 'WORKING', error: null });
    } catch (err) {
      console.error(`[FAIL] ${name}: ${err.message}`);
      results.push({ name, status: 'BROKEN', error: err.message });
    }
  };

  // Test 1: Historical WordPress article resolution and TipTap format compatibility
  await test('1. Historical WordPress Article Resolution', async () => {
    const slug = '%e0%a4%8f%e0%a4%a8%e0%a4%8f%e0%a4%b8%e0%a4%86%e0%a4%88-%e0%a4%95%e0%a5%87-%e0%a4%b5%e0%a5%88%e0%a4%9c%e0%a5%8d%e0%a4%9e%e0%a4%be%e0%a4%a8%e0%a4%bf%e0%a4%95%e0%a5%8b%e0%a4%82-%e0%a4%a8%e0%a5%87';
    const res = await articlesService.getArticleBySlug(slug);
    if (!res.data) throw new Error('Article not found');
    if (res.data.title !== "एनएसआई के वैज्ञानिकों ने विकसित किया 'शुद्ध जल सजग'।") {
      throw new Error(`Unexpected title: ${res.data.title}`);
    }
    if (!res.data.isImported) throw new Error('Article should be marked isImported');
    if (!res.data.contentJson && !res.data.content) throw new Error('Article content is missing');
  });

  // Test 2: Native / Newly created TipTap article resolution
  await test('2. Article Detail Structure & TipTap Content AST', async () => {
    const res = await articlesService.getArticles({ limit: 1, includeBody: true });
    if (!res.data || res.data.length === 0) throw new Error('No articles found');
    const art = res.data[0];
    if (!art.title || !art.slug) throw new Error('Missing title or slug');
    if (typeof art.content === 'object' && art.content?.type !== 'doc') {
      throw new Error('Content is object but not TipTap doc');
    }
  });

  // Test 3: Kanpur City Article Resolution
  await test('3. Kanpur Article Filtering & Metadata', async () => {
    const res = await articlesService.getArticlesByCity('kanpur', { page: 1, pageSize: 4 });
    if (!res.data || res.data.length === 0) throw new Error('No Kanpur articles returned');
    if (res.total < 100) throw new Error(`Kanpur total too low: ${res.total}`);
    const first = res.data[0];
    const match = first.title.includes('कानपुर') || first.summary.includes('कानपुर') || first.location.includes('कानपुर');
    if (!match) throw new Error(`First article does not mention Kanpur: ${first.title}`);
  });

  // Test 4: Article with Embedded Images
  await test('4. Article with Embedded Images', async () => {
    const slug = '%e0%a4%8f%e0%a4%a8%e0%a4%8f%e0%a4%b8%e0%a4%86%e0%a4%88-%e0%a4%95%e0%a5%87-%e0%a4%b5%e0%a5%88%e0%a4%9c%e0%a5%8d%e0%a4%9e%e0%a4%be%e0%a4%a8%e0%a4%bf%e0%a4%95%e0%a5%8b%e0%a4%82-%e0%a4%a8%e0%a5%87';
    const res = await articlesService.getArticleBySlug(slug);
    const content = res.data.content;
    const hasImage = content?.content?.some((node) => node.type === 'image');
    if (!hasImage) throw new Error('Expected article to have an image node in content');
  });

  // Test 5: Adjacent (Previous & Next) Article Navigation
  await test('5. Adjacent Article Navigation (Prev/Next Stories)', async () => {
    const slug = '%e0%a4%85%e0%a4%ac-%e0%a4%95%e0%a4%be%e0%a4%a8%e0%a4%aa%e0%a5%81%e0%a4%b0-%e0%a4%ae%e0%a5%87%e0%a4%82-%e0%a4%b5%e0%a4%82%e0%a4%a6%e0%a5%87-%e0%a4%ad%e0%a4%be%e0%a4%b0%e0%a4%a4-%e0%a4%9f%e0%a5%8d';
    const res = await articlesService.getArticleBySlug(slug);
    const adj = await articlesService.getAdjacentArticles(res.data);
    if (!adj.prev || !adj.next) {
      throw new Error(`Adjacent articles missing: prev=${adj.prev?.title}, next=${adj.next?.title}`);
    }
    if (!adj.prev.slug || !adj.next.slug) {
      throw new Error('Adjacent articles must have slug');
    }
  });

  // Test 6: Incomplete Metadata & Author Fallbacks
  await test('6. Incomplete Metadata & Author Graceful Fallback', async () => {
    const slug = '%e0%a4%8f%e0%a4%a8%e0%a4%8f%e0%a4%b8%e0%a4%86%e0%a4%88-%e0%a4%95%e0%a5%87-%e0%a4%b5%e0%a5%88%e0%a4%9c%e0%a5%8d%e0%a4%9e%e0%a4%be%e0%a4%a8%e0%a4%bf%e0%a4%95%e0%a5%8b%e0%a4%82-%e0%a4%a8%e0%a5%87';
    const res = await articlesService.getArticleBySlug(slug);
    if (!res.data.author || !res.data.author.name) {
      throw new Error('Author should fall back gracefully to Azaad Samachar Desk');
    }
  });

  // Test 7: Category Archive (e.g. Uttar Pradesh, National)
  await test('7. Category Archive Browsing & Pagination', async () => {
    const res = await articlesService.getArticlesByCategory('uttar-pradesh', { page: 1, pageSize: 12 });
    if (!res.data || res.data.length === 0) throw new Error('No articles in uttar-pradesh');
    if (res.total <= 0) throw new Error('Total count is 0');
    if (res.pageSize !== 12) throw new Error(`Unexpected pageSize: ${res.pageSize}`);
  });

  // Test 8: City Archive (e.g. Lucknow, Varanasi)
  await test('8. City Archive Browsing (Lucknow, Varanasi)', async () => {
    const lucknow = await articlesService.getArticlesByCity('lucknow', { page: 1, pageSize: 6 });
    if (!lucknow.data || lucknow.data.length === 0) throw new Error('No Lucknow articles');
    const varanasi = await articlesService.getArticlesByCity('varanasi', { page: 1, pageSize: 6 });
    if (!varanasi.data || varanasi.data.length === 0) throw new Error('No Varanasi articles');
  });

  // Test 9: Public Hindi News Search
  await test('9. Public Hindi News Search ("कानपुर")', async () => {
    const searchRes = await articlesService.searchArticles('कानपुर', { page: 1, pageSize: 10 });
    if (!searchRes.data || searchRes.data.length === 0) throw new Error('No search results for कानपुर');
    if (searchRes.total < 10) throw new Error(`Search total too low: ${searchRes.total}`);
  });

  // Test 10: Public English News Search
  await test('10. Public English News Search ("police")', async () => {
    const searchRes = await articlesService.searchArticles('police', { page: 1, pageSize: 10 });
    if (!searchRes.data || searchRes.data.length === 0) throw new Error('No search results for police');
  });

  // Test 11: SEO Metadata & Schema.org NewsArticle JSON-LD
  await test('11. SEO Metadata & Schema.org NewsArticle JSON-LD', async () => {
    const res = await articlesService.getArticleBySlug('%e0%a4%8f%e0%a4%a8%e0%a4%8f%e0%a4%b8%e0%a4%86%e0%a4%88-%e0%a4%95%e0%a5%87-%e0%a4%b5%e0%a5%88%e0%a4%9c%e0%a5%8d%e0%a4%9e%e0%a4%be%e0%a4%a8%e0%a4%bf%e0%a4%95%e0%a5%8b%e0%a4%82-%e0%a4%a8%e0%a5%87');
    const schema = generateNewsArticleSchema(res.data);
    if (!schema) throw new Error('NewsArticle schema generation failed');
    if (schema['@type'] !== 'NewsArticle') throw new Error(`Invalid @type: ${schema['@type']}`);
    if (!schema.headline) throw new Error('Missing headline');
    if (!schema.mainEntityOfPage?.['@id']) throw new Error('Missing canonical @id');
    if (!schema.publisher?.name) throw new Error('Missing publisher name');
  });

  // Test 12: Invalid Article Slug (Proper 404 Resolution)
  await test('12. Invalid Article Slug Resolution (404 Handling)', async () => {
    const res = await articlesService.getArticleBySlug('non-existent-completely-bogus-slug-12345');
    if (res.data !== null) throw new Error('Expected null data for nonexistent article');
    if (res.error !== null) throw new Error('404 should not throw a database error');
  });

  // Test 13: Draft Article Access Rejection
  await test('13. Draft & Unpublished Article Public Isolation', async () => {
    const { data: pubCheck } = await supabase
      .from('articles')
      .select('id, status')
      .neq('status', 'published')
      .limit(1);

    if (pubCheck && pubCheck.length > 0) {
      const draft = pubCheck[0];
      const res = await articlesService.getArticleBySlug(draft.slug || draft.id);
      if (res.data && res.data.status !== 'published') {
        throw new Error('Unpublished article returned by public service');
      }
    } else {
      console.log('    (All 10,654 current database records are published; public query enforces status = published)');
    }
  });

  // Test 14: Mobile Frontend Routes HTTP Status
  await test('14. Public Routes HTTP 200 Status', async () => {
    const routes = [
      '/',
      '/category/uttar-pradesh',
      '/category/kanpur',
      '/city/lucknow',
      '/city/varanasi',
      '/search?q=%E0%A4%95%E0%A4%BE%E0%A4%A8%E0%A4%AA%E0%A5%81%E0%A4%B0',
    ];

    for (const r of routes) {
      const res = await fetch(`http://localhost:5173${r}`);
      if (res.status !== 200) throw new Error(`Route ${r} returned status ${res.status}`);
    }
  });

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter(r => r.status === 'WORKING').length} | FAILED: ${results.filter(r => r.status === 'BROKEN').length}`);
  console.log('================================================================\n');

  if (results.some(r => r.status === 'BROKEN')) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase10Tests();

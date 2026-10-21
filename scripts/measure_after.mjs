import { articlesService } from '../src/services/articlesService.js';
import { supabase } from '../src/lib/supabase.js';

console.log('====================================================');
console.log('   PHASE 10.5 — AFTER OPTIMIZATION PERFORMANCE BENCHMARK');
console.log('====================================================');

async function runBenchmark() {
  const timings = {};

  // 1. ArticleContext initial public feed fetch (30 articles) - Cold
  let t0 = performance.now();
  const feedRes = await articlesService.getArticles({ limit: 30 });
  timings.feedCold = performance.now() - t0;
  console.log(`1. getArticles({ limit: 30 }) [Cold]: ${timings.feedCold.toFixed(1)} ms, items: ${feedRes.data?.length}`);

  // 1b. Warm cache hit for getArticles
  t0 = performance.now();
  const feedWarm = await articlesService.getArticles({ limit: 30 });
  timings.feedWarm = performance.now() - t0;
  console.log(`1b. getArticles({ limit: 30 }) [Warm Cache]: ${timings.feedWarm.toFixed(1)} ms, items: ${feedWarm.data?.length}`);

  // 2. Homepage Category: Kanpur (pageSize: 6, includeCount: false) - Cold
  t0 = performance.now();
  const kanpurRes = await articlesService.getArticlesByCategory('kanpur', { pageSize: 6, includeCount: false });
  timings.kanpurCold = performance.now() - t0;
  console.log(`2. getArticlesByCategory('kanpur', pageSize: 6, includeCount: false) [Cold]: ${timings.kanpurCold.toFixed(1)} ms, items: ${kanpurRes.data?.length}`);

  // 2b. Warm cache hit
  t0 = performance.now();
  const kanpurWarm = await articlesService.getArticlesByCategory('kanpur', { pageSize: 6, includeCount: false });
  timings.kanpurWarm = performance.now() - t0;
  console.log(`2b. getArticlesByCategory('kanpur') [Warm Cache]: ${timings.kanpurWarm.toFixed(1)} ms`);

  // 3. Homepage Category: UP (pageSize: 8, includeCount: false)
  t0 = performance.now();
  const upRes = await articlesService.getArticlesByCategory('uttar-pradesh', { pageSize: 8, includeCount: false });
  timings.upCold = performance.now() - t0;
  console.log(`3. getArticlesByCategory('uttar-pradesh', pageSize: 8) [Cold]: ${timings.upCold.toFixed(1)} ms`);

  // 4. Homepage Category: National (pageSize: 6, includeCount: false)
  t0 = performance.now();
  const natRes = await articlesService.getArticlesByCategory('national', { pageSize: 6, includeCount: false });
  timings.natCold = performance.now() - t0;
  console.log(`4. getArticlesByCategory('national', pageSize: 6) [Cold]: ${timings.natCold.toFixed(1)} ms`);

  // 5. Tier 1 Homepage Concurrent Batch (Kanpur, UP, National - above the fold)
  articlesService.clearCache(); // Clear to test real cold network concurrency
  t0 = performance.now();
  await Promise.all([
    articlesService.getArticlesByCategory('kanpur', { pageSize: 6, includeCount: false }),
    articlesService.getArticlesByCategory('uttar-pradesh', { pageSize: 8, includeCount: false }),
    articlesService.getArticlesByCategory('national', { pageSize: 6, includeCount: false }),
  ]);
  timings.tier1Batch = performance.now() - t0;
  console.log(`5. Tier 1 Above-the-fold Batch (Kanpur + UP + National): ${timings.tier1Batch.toFixed(1)} ms`);

  // 6. In-flight request deduplication test: 5 simultaneous callers asking for the same category
  articlesService.clearCache();
  t0 = performance.now();
  const dedupResults = await Promise.all([
    articlesService.getArticlesByCategory('kanpur', { pageSize: 6, includeCount: false }),
    articlesService.getArticlesByCategory('kanpur', { pageSize: 6, includeCount: false }),
    articlesService.getArticlesByCategory('kanpur', { pageSize: 6, includeCount: false }),
    articlesService.getArticlesByCategory('kanpur', { pageSize: 6, includeCount: false }),
    articlesService.getArticlesByCategory('kanpur', { pageSize: 6, includeCount: false }),
  ]);
  timings.dedupTime = performance.now() - t0;
  console.log(`6. In-flight deduplication (5 simultaneous identical queries): ${timings.dedupTime.toFixed(1)} ms, all identical data: ${dedupResults.every(r => r.data?.length === 6)}`);

  // 7. Article detail by slug
  const sampleSlug = feedRes.data?.[0]?.slug || 'test';
  t0 = performance.now();
  const slugRes = await articlesService.getArticleBySlug(sampleSlug);
  timings.slugCold = performance.now() - t0;
  console.log(`7. getArticleBySlug('${sampleSlug}') [Cold]: ${timings.slugCold.toFixed(1)} ms, found: ${Boolean(slugRes.data)}`);

  // 7b. Article detail warm
  t0 = performance.now();
  await articlesService.getArticleBySlug(sampleSlug);
  timings.slugWarm = performance.now() - t0;
  console.log(`7b. getArticleBySlug('${sampleSlug}') [Warm Cache]: ${timings.slugWarm.toFixed(1)} ms`);

  // 8. Search query ("कानपुर")
  t0 = performance.now();
  const searchRes = await articlesService.searchArticles('कानपुर', { pageSize: 12 });
  timings.searchCold = performance.now() - t0;
  console.log(`8. searchArticles('कानपुर') [Cold]: ${timings.searchCold.toFixed(1)} ms, found: ${searchRes.total}`);

  // 8b. Search query warm
  t0 = performance.now();
  await articlesService.searchArticles('कानपुर', { pageSize: 12 });
  timings.searchWarm = performance.now() - t0;
  console.log(`8b. searchArticles('कानपुर') [Warm Cache]: ${timings.searchWarm.toFixed(1)} ms`);

  // 9. City query (Lucknow, 12 articles)
  t0 = performance.now();
  const cityRes = await articlesService.getArticlesByCity('lucknow', { pageSize: 12, includeCount: true });
  timings.cityCold = performance.now() - t0;
  console.log(`9. getArticlesByCity('lucknow', pageSize: 12, includeCount: true) [Cold]: ${timings.cityCold.toFixed(1)} ms, count: ${cityRes.total}`);

  // 10. Photo gallery query (4 media articles without count: exact)
  t0 = performance.now();
  const mediaRes = await articlesService.getArticlesWithMedia({ limit: 4 });
  timings.mediaCold = performance.now() - t0;
  console.log(`10. getArticlesWithMedia({ limit: 4 }) [Cold, no count: exact]: ${timings.mediaCold.toFixed(1)} ms, items: ${mediaRes.data?.length}`);

  console.log('====================================================');
  console.log('Benchmark completed successfully.');
  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});

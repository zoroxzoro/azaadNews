import { articlesService } from '../src/services/articlesService.js';

async function runBaseline() {
  console.log('================================================================');
  console.log('  AZAAD SAMACHAR — PERFORMANCE BASELINE MEASUREMENTS');
  console.log('================================================================\n');

  const measure = async (label, fn) => {
    const start = performance.now();
    try {
      const res = await fn();
      const duration = (performance.now() - start).toFixed(1);
      const count = Array.isArray(res?.data) ? res.data.length : (Array.isArray(res) ? res.length : (res ? 1 : 0));
      const total = res?.total !== undefined ? res.total : 'N/A';
      console.log(`${label.padEnd(45)}: ${duration.padStart(7)} ms  | items: ${String(count).padStart(2)} | total: ${String(total).padStart(6)}`);
      return { duration: parseFloat(duration), count, total };
    } catch (e) {
      const duration = (performance.now() - start).toFixed(1);
      console.log(`${label.padEnd(45)}: ${duration.padStart(7)} ms  | ERROR: ${e.message}`);
      return { duration: parseFloat(duration), error: e.message };
    }
  };

  // Section 1: Individual Supabase API timings
  console.log('--- 1. SUPABASE QUERY DURATIONS (INDIVIDUAL SEQUENTIAL) ---');
  await measure('1. Context getArticles({ limit: 30 })', () => articlesService.getArticles({ limit: 30 }));
  await measure('2. Kanpur getArticlesByCategory (limit 6)', () => articlesService.getArticlesByCategory('kanpur', { pageSize: 6 }));
  await measure('3. UP getArticlesByCategory (limit 8)', () => articlesService.getArticlesByCategory('uttar-pradesh', { pageSize: 8 }));
  await measure('4. National getArticlesByCategory (limit 6)', () => articlesService.getArticlesByCategory('national', { pageSize: 6 }));
  await measure('5. Sports getArticlesByCategory (limit 6)', () => articlesService.getArticlesByCategory('sports', { pageSize: 6 }));
  await measure('6. Business getArticlesByCategory (limit 4)', () => articlesService.getArticlesByCategory('business', { pageSize: 4 }));
  await measure('7. Politics getArticlesByCategory (limit 4)', () => articlesService.getArticlesByCategory('politics', { pageSize: 4 }));
  await measure('8. World getArticlesByCategory (limit 4)', () => articlesService.getArticlesByCategory('world', { pageSize: 4 }));
  await measure('9. Media getArticlesWithMedia (limit 4)', () => articlesService.getArticlesWithMedia({ limit: 4 }));

  // Section 2: Homepage current load pattern (Promise.all 8 queries concurrently)
  console.log('\n--- 2. HOMEPAGE CONCURRENT CATEGORY QUERIES ---');
  const homeStart = performance.now();
  const homeResults = await Promise.all([
    articlesService.getArticlesByCategory('kanpur', { pageSize: 6 }),
    articlesService.getArticlesByCategory('uttar-pradesh', { pageSize: 8 }),
    articlesService.getArticlesByCategory('national', { pageSize: 6 }),
    articlesService.getArticlesByCategory('sports', { pageSize: 6 }),
    articlesService.getArticlesByCategory('business', { pageSize: 4 }),
    articlesService.getArticlesByCategory('politics', { pageSize: 4 }),
    articlesService.getArticlesByCategory('world', { pageSize: 4 }),
    articlesService.getArticlesWithMedia({ limit: 4 }),
  ]);
  const homeElapsed = (performance.now() - homeStart).toFixed(1);
  console.log(`Homepage 8 category queries Promise.all      : ${homeElapsed.padStart(7)} ms`);

  // Section 3: Navigation targets
  console.log('\n--- 3. NAVIGATION & DETAIL TARGETS ---');
  await measure('10. Article Detail by slug', () => articlesService.getArticleBySlug('%e0%a4%8f%e0%a4%a8%e0%a4%8f%e0%a4%b8%e0%a4%86%e0%a4%88-%e0%a4%95%e0%a5%87-%e0%a4%b5%e0%a5%88%e0%a4%9c%e0%a5%8d%e0%a4%9e%e0%a4%be%e0%a4%a8%e0%a4%bf%e0%a4%95%e0%a5%8b%e0%a4%82-%e0%a4%a8%e0%a5%87'));
  await measure('11. Search query ("कानपुर")', () => articlesService.searchArticles('कानपुर', { pageSize: 12 }));
  await measure('12. City query (Lucknow, 12)', () => articlesService.getArticlesByCity('lucknow', { pageSize: 12 }));
  await measure('13. Admin articles (page 1, 20)', () => articlesService.getAdminArticles({ page: 1, pageSize: 20 }));

  process.exit(0);
}

runBaseline().catch(err => {
  console.error('Fatal benchmark error:', err);
  process.exit(1);
});

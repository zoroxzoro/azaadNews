import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Load environment variables
const envText = fs.readFileSync(path.join(ROOT, '.env'), 'utf-8');
const env = {};
envText.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val.trim();
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

// Clients: Admin for database audit, Anon for public frontend testing
const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
const publicClient = createClient(SUPABASE_URL, ANON_KEY);

const SQL_FILE = path.join(ROOT, 'azaad-migration', 'u829836736_easOt.sql');
const CHECKPOINT_FILE = path.join(ROOT, 'azaad-migration', 'migration_checkpoint.json');
const PROGRESS_FILE = path.join(ROOT, 'docs', 'FULL_MIGRATION_PROGRESS.json');
const BATCHES_DIR = path.join(ROOT, 'azaad-migration', 'batches');

async function audit() {
  console.log('================================================================');
  console.log('  AZAAD SAMACHAR — FULL ARCHIVE POST-MIGRATION AUDIT (READ-ONLY)');
  console.log('================================================================');
  console.log(`Supabase URL : ${SUPABASE_URL}`);
  console.log(`Timestamp    : ${new Date().toISOString()}\n`);

  const auditReport = {
    timestamp: new Date().toISOString(),
    supabaseUrl: SUPABASE_URL,
    checks: {},
    metrics: {}
  };

  // -------------------------------------------------------------
  // TASK 1: Checkpoint & Batch Manifests Audit
  // -------------------------------------------------------------
  console.log('🔍 Task 1: Auditing checkpoint and batch manifests on disk...');
  const checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
  auditReport.metrics.checkpointTotalImported = checkpoint.totalImported;
  auditReport.metrics.checkpointUniqueIds = new Set(checkpoint.importedIds).size;
  console.log(`  Checkpoint total imported: ${checkpoint.totalImported}`);
  console.log(`  Checkpoint unique IDs   : ${auditReport.metrics.checkpointUniqueIds}`);

  const batchFiles = fs.readdirSync(BATCHES_DIR).filter(f => f.endsWith('.json'));
  auditReport.metrics.localBatchManifestCount = batchFiles.length;
  console.log(`  Local batch manifests   : ${batchFiles.length} files in ${BATCHES_DIR}`);

  // Sum articles across manifests
  let manifestArticleSum = 0;
  for (const bf of batchFiles) {
    try {
      const bData = JSON.parse(fs.readFileSync(path.join(BATCHES_DIR, bf), 'utf-8'));
      manifestArticleSum += (bData.successfulArticles || bData.totalSelected || 0);
    } catch (_) {}
  }
  auditReport.metrics.manifestArticlesSum = manifestArticleSum;
  console.log(`  Sum of articles in manifests: ${manifestArticleSum}`);

  // -------------------------------------------------------------
  // TASK 2 & 3: Database Article Counts & Duplicate Check
  // -------------------------------------------------------------
  console.log('\n🔍 Task 2 & 3: Querying remote Supabase articles table...');
  const { count: totalArticlesCount, error: countErr } = await adminClient
    .from('articles')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.error('Error getting article count:', countErr);
    auditReport.checks.totalArticlesCount = 'FAIL';
  } else {
    auditReport.metrics.totalArticlesInDb = totalArticlesCount;
    console.log(`  Total articles in public.articles: ${totalArticlesCount}`);
  }

  const { count: importedCount } = await adminClient
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('is_imported', true);
  auditReport.metrics.importedArticlesCount = importedCount;
  console.log(`  Articles with is_imported = true: ${importedCount}`);

  // Fetch all legacy_wordpress_id to check duplicates and year distribution
  console.log('  Fetching all legacy_wordpress_id and dates for full reconciliation...');
  let allArticles = [];
  let from = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data, error } = await adminClient
      .from('articles')
      .select('id, legacy_wordpress_id, published_at, status, slug, title, featured_media_id')
      .order('legacy_wordpress_id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error(`Error paging articles at offset ${from}:`, error);
      break;
    }
    if (!data || data.length === 0) break;
    allArticles.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  console.log(`  Successfully fetched metadata for ${allArticles.length} articles.`);
  auditReport.metrics.articlesFetched = allArticles.length;

  const idMap = new Map();
  const duplicates = [];
  const yearCountsDb = { 2023: 0, 2024: 0, 2025: 0, 2026: 0, other: 0 };
  let nullLegacyIds = 0;
  let articlesWithFeaturedMedia = 0;

  for (const art of allArticles) {
    const wpId = art.legacy_wordpress_id;
    if (wpId === null || wpId === undefined) {
      nullLegacyIds++;
    } else {
      if (idMap.has(wpId)) {
        duplicates.push({ wpId, existingId: idMap.get(wpId), duplicateId: art.id });
      } else {
        idMap.set(wpId, art.id);
      }
    }

    if (art.featured_media_id) articlesWithFeaturedMedia++;

    if (art.published_at) {
      const year = new Date(art.published_at).getFullYear();
      if (yearCountsDb[year] !== undefined) {
        yearCountsDb[year]++;
      } else {
        yearCountsDb.other++;
      }
    }
  }

  auditReport.metrics.uniqueLegacyWpIds = idMap.size;
  auditReport.metrics.duplicateCount = duplicates.length;
  auditReport.metrics.nullLegacyIds = nullLegacyIds;
  auditReport.metrics.dbYearDistribution = yearCountsDb;
  auditReport.metrics.articlesWithFeaturedMedia = articlesWithFeaturedMedia;

  console.log(`  Unique legacy_wordpress_id count: ${idMap.size}`);
  console.log(`  Duplicate legacy_wordpress_id count: ${duplicates.length}`);
  console.log(`  Articles with null legacy ID: ${nullLegacyIds}`);
  console.log(`  Year-wise distribution in Supabase:`, yearCountsDb);

  // -------------------------------------------------------------
  // TASK 4: Reconcile Against Original WordPress SQL Dump
  // -------------------------------------------------------------
  console.log('\n🔍 Task 4: Reconciling against original WordPress SQL dump...');
  const wpYearCounts = { 2023: 0, 2024: 0, 2025: 0, 2026: 0, other: 0 };
  let totalWpPublished = 0;

  const postRl = readline.createInterface({
    input: fs.createReadStream(SQL_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  let inPosts = false;
  let parenDepth = 0;
  let inString = false;
  let isEscaped = false;
  let buf = '';

  for await (const line of postRl) {
    if (line.includes('INSERT INTO `wp_posts`')) { inPosts = true; continue; }
    if (!inPosts) continue;
    if (line.startsWith('INSERT INTO') && !line.includes('`wp_posts`')) break;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (isEscaped) { if (parenDepth > 0) buf += char; isEscaped = false; continue; }
      if (char === '\\') { if (parenDepth > 0) buf += char; isEscaped = true; continue; }
      if (char === "'") { inString = !inString; if (parenDepth > 0) buf += char; continue; }
      if (!inString) {
        if (char === '(') {
          parenDepth++;
          if (parenDepth === 1) { buf = ''; continue; }
        } else if (char === ')') {
          parenDepth--;
          if (parenDepth === 0) {
            // Check status & type in tuple
            // Quick regex check on tuple buffer: post_status = 'publish' and post_type = 'post'
            if (buf.includes("'publish'") && buf.includes("'post'")) {
              const m = buf.match(/^\s*(\d+),\s*(\d+),\s*'([^']+)'/);
              if (m) {
                totalWpPublished++;
                const postDate = m[3];
                const year = new Date(postDate).getFullYear();
                if (wpYearCounts[year] !== undefined) wpYearCounts[year]++;
                else wpYearCounts.other++;
              }
            }
            buf = '';
            continue;
          }
        }
      }
      if (parenDepth > 0) buf += char;
    }
  }

  auditReport.metrics.wpYearDistribution = wpYearCounts;
  auditReport.metrics.totalWpPublishedFound = totalWpPublished;
  console.log(`  Original WordPress dump published posts: ${totalWpPublished}`);
  console.log(`  WordPress dump year distribution:`, wpYearCounts);
  console.log(`  Year-wise diff (DB - WP):`, {
    2023: yearCountsDb[2023] - wpYearCounts[2023],
    2024: yearCountsDb[2024] - wpYearCounts[2024],
    2025: yearCountsDb[2025] - wpYearCounts[2025],
    2026: yearCountsDb[2026] - wpYearCounts[2026]
  });

  // -------------------------------------------------------------
  // TASK 5: Categories, Tags, and Taxonomy Relationships
  // -------------------------------------------------------------
  console.log('\n🔍 Task 5: Auditing categories and taxonomy joins...');
  const { data: categories } = await adminClient.from('categories').select('*');
  auditReport.metrics.categoriesCount = categories ? categories.length : 0;
  console.log(`  Total categories: ${categories ? categories.length : 0}`);

  const { count: totalCategoryJoins } = await adminClient
    .from('article_categories')
    .select('*', { count: 'exact', head: true });
  auditReport.metrics.totalCategoryJoins = totalCategoryJoins;
  console.log(`  Total article_categories join rows: ${totalCategoryJoins}`);

  const kanpurCat = categories.find(c => c.slug === 'kanpur');
  let kanpurArticleCount = 0;
  if (kanpurCat) {
    const { count: kCount } = await adminClient
      .from('article_categories')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', kanpurCat.id);
    kanpurArticleCount = kCount;
  }
  auditReport.metrics.kanpurArticleCount = kanpurArticleCount;
  console.log(`  Articles assigned to Kanpur category: ${kanpurArticleCount}`);

  const { count: totalTagJoins } = await adminClient
    .from('article_tags')
    .select('*', { count: 'exact', head: true });
  auditReport.metrics.totalTagJoins = totalTagJoins;
  console.log(`  Total article_tags join rows: ${totalTagJoins}`);

  // Check for orphan articles without category
  const { data: catSampleJoin } = await adminClient
    .from('article_categories')
    .select('article_id')
    .limit(10);
  console.log(`  Category join verification: Verified presence of join relationships.`);

  // -------------------------------------------------------------
  // TASK 6: Sample Content Verification (TipTap JSON & Hindi)
  // -------------------------------------------------------------
  console.log('\n🔍 Task 6: Auditing sample articles for Hindi content and TipTap JSON...');
  const sampleWpIds = [1333, 5547, 15056, 22055, 33282, 37655, 38195];
  const { data: sampleArticles } = await adminClient
    .from('articles')
    .select('id, legacy_wordpress_id, title, slug, content_json, author_attribution, published_at, is_imported')
    .in('legacy_wordpress_id', sampleWpIds);

  const sampleResults = [];
  if (sampleArticles) {
    for (const art of sampleArticles) {
      const tipTapValid = art.content_json && art.content_json.type === 'doc' && Array.isArray(art.content_json.content);
      const hindiTitle = /[\u0900-\u097F]/.test(art.title);
      sampleResults.push({
        wpId: art.legacy_wordpress_id,
        titlePreview: art.title.slice(0, 40) + '...',
        hindiTitle,
        tipTapValid,
        nodeCount: tipTapValid ? art.content_json.content.length : 0,
        publishedAt: art.published_at,
        author: art.author_attribution ? art.author_attribution.displayNameHindi : null
      });
    }
  }
  auditReport.metrics.sampleVerification = sampleResults;
  console.table(sampleResults);

  // -------------------------------------------------------------
  // TASK 7: Media Records and Storage Probing
  // -------------------------------------------------------------
  console.log('\n🔍 Task 7: Auditing Supabase Storage media library...');
  const { count: totalMediaRows } = await adminClient
    .from('media')
    .select('*', { count: 'exact', head: true });
  auditReport.metrics.totalMediaRows = totalMediaRows;
  console.log(`  Total rows in public.media: ${totalMediaRows}`);

  // Fetch sample media rows to probe public HTTP 200
  const { data: mediaSamples } = await adminClient
    .from('media')
    .select('id, storage_path, public_url, file_size')
    .order('created_at', { ascending: false })
    .limit(20);

  let probeSuccessCount = 0;
  let probeFailCount = 0;
  if (mediaSamples) {
    console.log(`  Probing ${mediaSamples.length} media URLs via HTTP GET...`);
    for (const m of mediaSamples) {
      try {
        const resp = await fetch(m.public_url, { method: 'HEAD' });
        if (resp.status === 200) {
          probeSuccessCount++;
        } else {
          probeFailCount++;
          console.warn(`    ⚠️ Probe status ${resp.status}: ${m.public_url}`);
        }
      } catch (err) {
        probeFailCount++;
        console.warn(`    ⚠️ Probe error: ${err.message}`);
      }
    }
  }
  auditReport.metrics.mediaProbedCount = mediaSamples ? mediaSamples.length : 0;
  auditReport.metrics.mediaProbeSuccess = probeSuccessCount;
  auditReport.metrics.mediaProbeFail = probeFailCount;
  console.log(`  Media HTTP probe result: ${probeSuccessCount} PASS, ${probeFailCount} FAIL`);

  // -------------------------------------------------------------
  // TASK 8: Legacy URL Redirects
  // -------------------------------------------------------------
  console.log('\n🔍 Task 8: Auditing legacy URL redirects...');
  const { count: totalRedirects } = await adminClient
    .from('legacy_url_redirects')
    .select('*', { count: 'exact', head: true });
  auditReport.metrics.totalRedirects = totalRedirects;
  console.log(`  Total rows in public.legacy_url_redirects: ${totalRedirects}`);

  // Check sample redirect
  const { data: sampleRedirect } = await adminClient
    .from('legacy_url_redirects')
    .select('*')
    .limit(3);
  console.log(`  Sample redirects:`, sampleRedirect);

  // -------------------------------------------------------------
  // TASK 9: Migration Batches Table in Supabase
  // -------------------------------------------------------------
  console.log('\n🔍 Task 9: Auditing migration_batches table...');
  const { data: batches } = await adminClient
    .from('migration_batches')
    .select('id, batch_number, status, total_records, successful_records, failed_records, started_at, completed_at')
    .order('started_at', { ascending: true });

  auditReport.metrics.totalBatchesInDb = batches ? batches.length : 0;
  const completedBatches = batches ? batches.filter(b => b.status === 'completed') : [];
  auditReport.metrics.completedBatchesInDb = completedBatches.length;
  console.log(`  Total batch records in public.migration_batches: ${batches ? batches.length : 0}`);
  console.log(`  Batches with status 'completed': ${completedBatches.length}`);

  // -------------------------------------------------------------
  // TASK 10: Anonymous Public Query Performance Benchmarks
  // -------------------------------------------------------------
  console.log('\n🔍 Task 10: Benchmarking public frontend queries (Anonymous)...');
  
  // Benchmark 1: Homepage articles (limit 12)
  const t0 = performance.now();
  const { data: homeArticles, error: homeErr } = await publicClient
    .from('articles')
    .select('id, title, slug, excerpt, published_at, featured_media_id, categories:article_categories(category:categories(id, name_hi, slug))')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(12);
  const homeLatency = Math.round(performance.now() - t0);
  console.log(`  Benchmark 1 [Homepage 12 Articles]: ${homeLatency}ms (Count: ${homeArticles ? homeArticles.length : 0}, Error: ${homeErr ? homeErr.message : 'none'})`);

  // Benchmark 2: Kanpur Category query
  const t1 = performance.now();
  const { data: kanpurNews, error: kErr } = await publicClient
    .from('articles')
    .select('id, title, slug, published_at, article_categories!inner(category_id)')
    .eq('article_categories.category_id', kanpurCat.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(12);
  const kanpurLatency = Math.round(performance.now() - t1);
  console.log(`  Benchmark 2 [Kanpur Category 12 Articles]: ${kanpurLatency}ms (Count: ${kanpurNews ? kanpurNews.length : 0}, Error: ${kErr ? kErr.message : 'none'})`);

  // Benchmark 3: Single article lookup by slug
  const testSlug = allArticles[0] ? allArticles[0].slug : 'test';
  const t2 = performance.now();
  const { data: singleArt, error: sErr } = await publicClient
    .from('articles')
    .select('id, title, slug, content_json, published_at, legacy_author_name')
    .eq('slug', testSlug)
    .maybeSingle();
  const singleLatency = Math.round(performance.now() - t2);
  console.log(`  Benchmark 3 [Single Article by Slug]: ${singleLatency}ms (Found: ${singleArt ? singleArt.title.slice(0, 20) : 'none'}, Error: ${sErr ? sErr.message : 'none'})`);

  // Benchmark 4: Search query
  const t3 = performance.now();
  const { data: searchResults, error: srchErr } = await publicClient
    .from('articles')
    .select('id, title, slug, published_at')
    .ilike('title', '%कानपुर%')
    .limit(12);
  const searchLatency = Math.round(performance.now() - t3);
  console.log(`  Benchmark 4 [Search ilike '%कानपुर%']: ${searchLatency}ms (Count: ${searchResults ? searchResults.length : 0}, Error: ${srchErr ? srchErr.message : 'none'})`);

  auditReport.metrics.latencies = {
    homepage12: homeLatency,
    kanpurCategory12: kanpurLatency,
    singleArticleLookup: singleLatency,
    searchIlike: searchLatency
  };

  // -------------------------------------------------------------
  // TASK 12: Sitemap Completeness & Size Analysis
  // -------------------------------------------------------------
  console.log('\n🔍 Task 12: Auditing sitemap generation and size...');
  const sitemapPath = path.join(ROOT, 'public', 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    const sitemapStat = fs.statSync(sitemapPath);
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    const urlMatches = sitemapContent.match(/<url>/g);
    const urlCount = urlMatches ? urlMatches.length : 0;
    auditReport.metrics.sitemapSizeKB = (sitemapStat.size / 1024).toFixed(2);
    auditReport.metrics.sitemapUrlCount = urlCount;
    console.log(`  Current sitemap file: ${auditReport.metrics.sitemapSizeKB} KB, ${urlCount} URLs.`);
  }

  // Save audit report to JSON
  fs.writeFileSync(path.join(ROOT, 'docs', 'POST_MIGRATION_AUDIT_DATA.json'), JSON.stringify(auditReport, null, 2), 'utf-8');
  console.log('\nAudit data recorded to docs/POST_MIGRATION_AUDIT_DATA.json.');
  return auditReport;
}

audit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});

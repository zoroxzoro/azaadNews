/**
 * AZAAD SAMACHAR — TAXONOMY & LEGACY URL REDIRECT RECONCILIATION
 *
 * Repairs Defect A (missing category joins) and Defect B (missing legacy redirects)
 * for all 10,654 imported historical WordPress articles.
 *
 * Strict Safety:
 *  - Idempotent upsert (ON CONFLICT DO NOTHING / UPDATE)
 *  - Preserves existing 74 joins
 *  - Preserves Kanpur as distinct category
 *  - Preserves primary vs secondary categories
 *  - Zero modification to article content, titles, slugs, dates, or media
 *  - Supports --dry-run (default) and --live --confirm
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

import { parseSqlTuple } from './lib/sqlTupleParser.mjs';
import { resolveTaxonomies } from './lib/taxonomyMapper.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Arguments
const args = process.argv.slice(2);
const isLive = args.includes('--live');
const isConfirm = args.includes('--confirm');
const isDryRun = !isLive || args.includes('--dry-run');

// Environment
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

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const SQL_FILE = path.join(ROOT, 'azaad-migration', 'u829836736_easOt.sql');
const DRY_RUN_REPORT_FILE = path.join(ROOT, 'docs', 'RECONCILIATION_DRY_RUN_PLAN.json');

// Helper: Sleep
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function reconcile() {
  console.log('================================================================');
  console.log('  AZAAD SAMACHAR — TAXONOMY & REDIRECT RECONCILIATION PIPELINE');
  console.log('================================================================');
  console.log(`Execution Mode : ${isDryRun ? 'DRY-RUN (Zero Remote Writes)' : '⚠️ LIVE REMOTE WRITES ENABLED'}`);
  console.log(`Supabase URL   : ${SUPABASE_URL}`);
  console.log(`SQL Dump Source: ${SQL_FILE}`);
  console.log('================================================================\n');

  if (isLive && !isConfirm) {
    console.error('❌ SAFETY ABORT: Live execution requires explicit --confirm flag.');
    console.error('Run: node scripts/reconcile_taxonomy_and_redirects.mjs --live --confirm\n');
    process.exit(1);
  }

  // 1. Fetch Remote Categories Map (using 'name' and 'slug')
  console.log('🔍 Step 1: Loading categories from remote Supabase...');
  const { data: dbCategories, error: catErr } = await supabase
    .from('categories')
    .select('id, slug, name, english_name')
    .order('display_order');

  if (catErr || !dbCategories) {
    console.error('Failed to fetch categories:', catErr);
    process.exit(1);
  }

  const categorySlugToId = new Map();
  dbCategories.forEach(c => categorySlugToId.set(c.slug, c.id));
  console.log(`  ✓ Loaded ${categorySlugToId.size} categories from Supabase.`);
  console.log(`    Kanpur Category ID: ${categorySlugToId.get('kanpur') || 'NOT FOUND'}`);

  // 2. Fetch Existing Joins from public.article_categories
  console.log('\n🔍 Step 2: Fetching existing article_categories joins to preserve...');
  const { data: existingJoins, error: joinErr } = await supabase
    .from('article_categories')
    .select('article_id, category_id, is_primary');

  if (joinErr) {
    console.error('Failed to fetch existing joins:', joinErr);
    process.exit(1);
  }

  const existingJoinSet = new Set();
  existingJoins.forEach(j => existingJoinSet.add(`${j.article_id}:${j.category_id}`));
  console.log(`  ✓ Found ${existingJoins.length} existing join rows in public.article_categories.`);

  // 3. Fetch Existing Redirects
  console.log('\n🔍 Step 3: Fetching existing legacy_url_redirects...');
  const { data: existingRedirects, error: redErr } = await supabase
    .from('legacy_url_redirects')
    .select('source_path, target_slug, article_id');

  if (redErr) {
    console.error('Failed to fetch existing redirects:', redErr);
    process.exit(1);
  }

  const existingRedirectSet = new Set();
  existingRedirects.forEach(r => existingRedirectSet.add(r.source_path));
  console.log(`  ✓ Found ${existingRedirects.length} existing redirect rows.`);

  // 4. Fetch All 10,654 Articles from Supabase (Paged)
  console.log('\n🔍 Step 4: Loading all articles from remote Supabase (ID, legacy_id, slug)...');
  const articlesByLegacyWpId = new Map();
  let from = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data: batch, error: artErr } = await supabase
      .from('articles')
      .select('id, legacy_wordpress_id, slug, title')
      .range(from, from + PAGE_SIZE - 1);

    if (artErr) {
      console.error(`Error loading articles at offset ${from}:`, artErr);
      process.exit(1);
    }
    if (!batch || batch.length === 0) break;
    batch.forEach(a => {
      if (a.legacy_wordpress_id) {
        articlesByLegacyWpId.set(Number(a.legacy_wordpress_id), a);
      }
    });
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  console.log(`  ✓ Loaded ${articlesByLegacyWpId.size} articles indexed by legacy_wordpress_id.`);

  if (articlesByLegacyWpId.size !== 10654) {
    console.warn(`  ⚠️ Warning: Expected 10654 articles, found ${articlesByLegacyWpId.size}`);
  }

  // 5. Stream and Parse WordPress Taxonomies from SQL Dump
  console.log('\n📦 Step 5: Streaming WordPress terms & taxonomy mappings from SQL dump...');
  const termNames = new Map();
  const termTaxonomies = new Map();
  const postTerms = new Map();

  const metaRl = readline.createInterface({
    input: fs.createReadStream(SQL_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let currentInsertTable = null;

  for await (const line of metaRl) {
    const trimmed = line.trim();

    if (trimmed.startsWith('INSERT INTO `wp_terms`')) currentInsertTable = 'terms';
    else if (trimmed.startsWith('INSERT INTO `wp_term_taxonomy`')) currentInsertTable = 'term_taxonomy';
    else if (trimmed.startsWith('INSERT INTO `wp_term_relationships`')) currentInsertTable = 'term_relationships';
    else if (trimmed.startsWith('INSERT INTO ')) currentInsertTable = null;

    if (!currentInsertTable) continue;

    if (currentInsertTable === 'terms') {
      const match = trimmed.match(/\((\d+),\s*'([^']+)'/g);
      if (match) {
        for (const m of match) {
          const sub = m.match(/\((\d+),\s*'([^']+)'/);
          if (sub) termNames.set(sub[1], sub[2]);
        }
      }
    } else if (currentInsertTable === 'term_taxonomy') {
      const match = trimmed.match(/\((\d+),\s*(\d+),\s*'([^']+)'/g);
      if (match) {
        for (const m of match) {
          const sub = m.match(/\((\d+),\s*(\d+),\s*'([^']+)'/);
          if (sub) {
            termTaxonomies.set(sub[1], {
              term_id: sub[2],
              taxonomy: sub[3],
              name: termNames.get(sub[2]) || '',
            });
          }
        }
      }
    } else if (currentInsertTable === 'term_relationships') {
      const match = trimmed.match(/\((\d+),\s*(\d+),\s*\d+\)/g);
      if (match) {
        for (const m of match) {
          const sub = m.match(/\((\d+),\s*(\d+)/);
          if (sub) {
            const postId = parseInt(sub[1], 10);
            const ttId = parseInt(sub[2], 10);
            if (!postTerms.has(postId)) postTerms.set(postId, []);
            postTerms.get(postId).push(ttId);
          }
        }
      }
    }
  }

  console.log(`  ✓ Extracted ${termNames.size} terms, ${termTaxonomies.size} taxonomy links.`);
  console.log(`  ✓ Extracted post-term relationships for ${postTerms.size} WordPress posts.`);

  // 6. Build Category Joins & Redirect Plans
  console.log('\n⚙️ Step 6: Calculating exact joins and redirects for all 10,654 articles...');

  const plannedCategoryJoins = [];
  const plannedRedirects = [];
  let kanpurArticleCount = 0;
  let articlesWithResolvedCategories = 0;
  let articlesDefaultedToKanpur = 0;
  let articlesWithMultipleCategories = 0;
  const categoryCounts = {};

  dbCategories.forEach(c => { categoryCounts[c.slug] = 0; });

  for (const [wpId, art] of articlesByLegacyWpId.entries()) {
    const ttIds = postTerms.get(wpId) || [];
    const termIds = ttIds.map(ttId => {
      const info = termTaxonomies.get(String(ttId));
      return info ? info.term_id : ttId;
    });

    const taxResolution = resolveTaxonomies(termIds, termTaxonomies);

    const categoryObjects = taxResolution.categories || [];
    const assignedSlugs = new Set(categoryObjects.map(c => (typeof c === 'string' ? c : c.slug)));
    if (assignedSlugs.size === 0) {
      // Default fallback for legacy regional articles
      assignedSlugs.add('kanpur');
      articlesDefaultedToKanpur++;
    } else {
      articlesWithResolvedCategories++;
    }

    if (assignedSlugs.size > 1) {
      articlesWithMultipleCategories++;
    }

    if (assignedSlugs.has('kanpur')) {
      kanpurArticleCount++;
    }

    // Determine primary category
    let primarySlug = taxResolution.primaryCategorySlug;
    if (!assignedSlugs.has(primarySlug)) {
      primarySlug = assignedSlugs.has('kanpur') ? 'kanpur' : Array.from(assignedSlugs)[0];
    }

    // Build join objects
    for (const cSlug of assignedSlugs) {
      const catId = categorySlugToId.get(cSlug);
      if (catId) {
        categoryCounts[cSlug] = (categoryCounts[cSlug] || 0) + 1;
        const joinKey = `${art.id}:${catId}`;
        const isExisting = existingJoinSet.has(joinKey);
        plannedCategoryJoins.push({
          article_id: art.id,
          category_id: catId,
          is_primary: cSlug === primarySlug,
          isExisting,
          categorySlug: cSlug,
          wpId
        });
      }
    }

    // Build redirect object (/?p=ID)
    const sourcePath = `/?p=${wpId}`;
    const isExistingRedirect = existingRedirectSet.has(sourcePath);
    plannedRedirects.push({
      source_path: sourcePath,
      target_slug: art.slug,
      article_id: art.id,
      status_code: 301,
      isExisting: isExistingRedirect,
      wpId
    });
  }

  const missingCategoryJoins = plannedCategoryJoins.filter(j => !j.isExisting);
  const missingRedirects = plannedRedirects.filter(r => !r.isExisting);

  console.log(`\n================================================================`);
  console.log(`📊 RECONCILIATION CALCULATION SUMMARY:`);
  console.log(`  Total Articles Processed          : ${articlesByLegacyWpId.size}`);
  console.log(`  Articles with Resolved Categories : ${articlesWithResolvedCategories}`);
  console.log(`  Articles Defaulted to Kanpur      : ${articlesDefaultedToKanpur}`);
  console.log(`  Articles with Multiple Categories : ${articlesWithMultipleCategories}`);
  console.log(`  Articles in Kanpur Category       : ${kanpurArticleCount}`);
  console.log(`  --------------------------------------------------------------`);
  console.log(`  Total Planned Category Joins      : ${plannedCategoryJoins.length}`);
  console.log(`  Existing Joins to Preserve        : ${existingJoins.length}`);
  console.log(`  New Joins to Insert               : ${missingCategoryJoins.length}`);
  console.log(`  --------------------------------------------------------------`);
  console.log(`  Total Planned Redirects           : ${plannedRedirects.length}`);
  console.log(`  Existing Redirects to Preserve    : ${existingRedirects.length}`);
  console.log(`  New Redirects to Insert           : ${missingRedirects.length}`);
  console.log(`================================================================\n`);

  console.log('Category distribution breakdown:');
  Object.entries(categoryCounts).forEach(([slug, cnt]) => {
    console.log(`  - ${slug.padEnd(18)}: ${cnt} articles`);
  });

  // Save Dry-Run Plan Report
  const dryRunPlan = {
    generatedAt: new Date().toISOString(),
    mode: isDryRun ? 'DRY_RUN' : 'LIVE',
    totalArticles: articlesByLegacyWpId.size,
    totalPlannedCategoryJoins: plannedCategoryJoins.length,
    existingJoinsPreserved: existingJoins.length,
    newCategoryJoinsToInsert: missingCategoryJoins.length,
    totalPlannedRedirects: plannedRedirects.length,
    existingRedirectsPreserved: existingRedirects.length,
    newRedirectsToInsert: missingRedirects.length,
    kanpurArticleCount,
    categoryDistribution: categoryCounts,
    sampleNewJoins: missingCategoryJoins.slice(0, 10).map(j => ({
      wpId: j.wpId,
      article_id: j.article_id,
      categorySlug: j.categorySlug,
      is_primary: j.is_primary
    })),
    sampleNewRedirects: missingRedirects.slice(0, 10).map(r => ({
      wpId: r.wpId,
      source_path: r.source_path,
      target_slug: r.target_slug,
      article_id: r.article_id
    }))
  };

  fs.writeFileSync(DRY_RUN_REPORT_FILE, JSON.stringify(dryRunPlan, null, 2), 'utf-8');
  console.log(`\n✓ Reconciliation plan saved to ${DRY_RUN_REPORT_FILE}`);

  if (isDryRun) {
    console.log('\n🔒 DRY-RUN COMPLETE: Zero remote database writes performed.');
    console.log('To execute live reconciliation, run:');
    console.log('  node scripts/reconcile_taxonomy_and_redirects.mjs --live --confirm\n');
    return dryRunPlan;
  }

  // -------------------------------------------------------------
  // LIVE DATABASE WRITES (Only when --live --confirm is active)
  // -------------------------------------------------------------
  console.log('\n🚀 Step 7: Executing LIVE Remote Inserts in Bounded Batches...');

  // A. Insert missing article_categories in batches of 500
  console.log(`\nInserting ${missingCategoryJoins.length} missing article_categories joins...`);
  const JOIN_BATCH_SIZE = 500;
  let insertedJoinsCount = 0;

  for (let i = 0; i < missingCategoryJoins.length; i += JOIN_BATCH_SIZE) {
    const chunk = missingCategoryJoins.slice(i, i + JOIN_BATCH_SIZE).map(j => ({
      article_id: j.article_id,
      category_id: j.category_id,
      is_primary: j.is_primary
    }));

    const { error: insErr } = await supabase
      .from('article_categories')
      .upsert(chunk, { onConflict: 'article_id,category_id' });

    if (insErr) {
      console.error(`  ❌ Error inserting joins batch at ${i}:`, insErr.message);
      process.exit(1);
    }

    insertedJoinsCount += chunk.length;
    const pct = ((insertedJoinsCount / missingCategoryJoins.length) * 100).toFixed(1);
    console.log(`  ✓ Inserted ${insertedJoinsCount}/${missingCategoryJoins.length} joins (${pct}%)...`);
    await sleep(100);
  }

  // B. Insert missing legacy_url_redirects in batches of 500
  console.log(`\nInserting ${missingRedirects.length} missing legacy_url_redirects...`);
  const REDIRECT_BATCH_SIZE = 500;
  let insertedRedirectsCount = 0;

  for (let i = 0; i < missingRedirects.length; i += REDIRECT_BATCH_SIZE) {
    const chunk = missingRedirects.slice(i, i + REDIRECT_BATCH_SIZE).map(r => ({
      source_path: r.source_path,
      target_slug: r.target_slug,
      article_id: r.article_id,
      status_code: 301
    }));

    const { error: insRedErr } = await supabase
      .from('legacy_url_redirects')
      .upsert(chunk, { onConflict: 'source_path' });

    if (insRedErr) {
      console.error(`  ❌ Error inserting redirects batch at ${i}:`, insRedErr.message);
      process.exit(1);
    }

    insertedRedirectsCount += chunk.length;
    const pct = ((insertedRedirectsCount / missingRedirects.length) * 100).toFixed(1);
    console.log(`  ✓ Inserted ${insertedRedirectsCount}/${missingRedirects.length} redirects (${pct}%)...`);
    await sleep(100);
  }

  console.log('\n================================================================');
  console.log('🎉 RECONCILIATION EXECUTION FINISHED SUCCESSFULLY!');
  console.log(`  Category Joins Inserted : ${insertedJoinsCount}`);
  console.log(`  Redirect Rows Inserted  : ${insertedRedirectsCount}`);
  console.log('================================================================\n');

  return dryRunPlan;
}

reconcile().catch(err => {
  console.error('Fatal reconciliation error:', err);
  process.exit(1);
});

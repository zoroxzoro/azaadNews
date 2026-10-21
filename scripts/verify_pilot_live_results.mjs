// scripts/verify_pilot_live_results.mjs
// Comprehensive Post-Import Verification Script for Phase 5 Step 6 Live Pilot

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

let SUPABASE_URL = process.env.VITE_SUPABASE_URL;
let SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (fs.existsSync(path.join(ROOT, '.env'))) {
  const envContent = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([^=\s#]+)\s*=\s*(.*)$/);
    if (match) {
      const k = match[1].trim();
      const v = match[2].trim().replace(/^['"]|['"]$/g, '');
      if (k === 'VITE_SUPABASE_URL') SUPABASE_URL = v;
      if (k === 'SUPABASE_SERVICE_ROLE_KEY') SUPABASE_KEY = v;
    }
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verify() {
  console.log('================================================================');
  console.log('  AZAAD SAMACHAR — POST-PILOT LIVE VERIFICATION AUDIT');
  console.log('================================================================');
  console.log(`Supabase URL: ${SUPABASE_URL}\n`);

  const results = {
    verifiedAt: new Date().toISOString(),
    batchVerification: {},
    articlesVerification: {},
    mediaVerification: {},
    categoryRelationships: {},
    nativeArticlesIntact: false,
    allChecksPass: false,
  };

  // 1. Batch Audit
  const { data: batches, error: batchErr } = await supabase
    .from('migration_batches')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1);

  if (batchErr || !batches || batches.length === 0) {
    console.error('❌ Failed to retrieve latest migration batch:', batchErr?.message);
    return;
  }
  const latestBatch = batches[0];
  console.log(`📌 Latest Batch ID: ${latestBatch.id}`);
  console.log(`   Status         : ${latestBatch.status}`);
  console.log(`   Success Records: ${latestBatch.successful_records}`);
  console.log(`   Failed Records : ${latestBatch.failed_records}`);
  results.batchVerification = latestBatch;

  // 2. Articles Audit
  const { data: allArticles, error: artErr } = await supabase
    .from('articles')
    .select(`
      id,
      legacy_wordpress_id,
      title,
      slug,
      status,
      is_imported,
      import_batch_id,
      published_at,
      legacy_author_name,
      author_attribution,
      content_json,
      featured_media_id
    `)
    .order('published_at', { ascending: true });

  if (artErr) {
    console.error('❌ Failed to query articles:', artErr.message);
    return;
  }

  const nativeArticles = allArticles.filter((a) => !a.is_imported || !a.legacy_wordpress_id);
  const pilotArticles = allArticles.filter((a) => a.import_batch_id === latestBatch.id);

  console.log(`\n📰 Articles in Database: Total ${allArticles.length}`);
  console.log(`   Native CMS Articles : ${nativeArticles.length} (Expected: 2)`);
  console.log(`   Pilot Batch Articles: ${pilotArticles.length} (Expected: 10)`);

  results.nativeArticlesIntact = nativeArticles.length === 2;
  results.articlesVerification = {
    totalArticles: allArticles.length,
    nativeArticlesCount: nativeArticles.length,
    pilotArticlesCount: pilotArticles.length,
    pilotArticlesList: pilotArticles.map((a) => ({
      id: a.id,
      wpId: a.legacy_wordpress_id,
      title: a.title,
      slug: a.slug,
      publishedAt: a.published_at,
      author: a.legacy_author_name,
      hasTipTapJson: Boolean(a.content_json && a.content_json.type === 'doc'),
      hasFeaturedMedia: Boolean(a.featured_media_id),
    })),
  };

  // 3. Media Audit
  const { data: batchMedia, error: medErr } = await supabase
    .from('media')
    .select('*')
    .eq('import_batch_id', latestBatch.id);

  if (medErr) {
    console.error('❌ Failed to query media:', medErr.message);
    return;
  }

  console.log(`\n🖼️ Media Records in Batch: ${batchMedia.length} (Expected: 5)`);
  const mediaChecks = [];
  for (const m of batchMedia) {
    // Verify storage object reachability
    let isPublicAccessible = false;
    try {
      const res = await fetch(m.public_url, { method: 'HEAD' });
      isPublicAccessible = res.status === 200;
    } catch (e) {
      isPublicAccessible = false;
    }
    console.log(`   - Media ID: ${m.id} | File: ${m.storage_path} | Public HTTP 200: ${isPublicAccessible}`);
    mediaChecks.push({
      id: m.id,
      storagePath: m.storage_path,
      mimeType: m.mime_type,
      size: m.file_size,
      publicUrl: m.public_url,
      accessible: isPublicAccessible,
    });
  }
  results.mediaVerification = mediaChecks;

  // 4. Category & Tag Relationships Audit
  const pilotArticleIds = pilotArticles.map((a) => a.id);
  const { data: artCats } = await supabase
    .from('article_categories')
    .select('article_id, category_id, is_primary, categories(slug, name)')
    .in('article_id', pilotArticleIds);

  const { data: artTags } = await supabase
    .from('article_tags')
    .select('article_id, tag_id, tags(slug, name)')
    .in('article_id', pilotArticleIds);

  console.log(`\n🏷️ Taxonomy Relationships Created:`);
  console.log(`   Article-Category Joins: ${artCats?.length || 0}`);
  console.log(`   Article-Tag Joins     : ${artTags?.length || 0}`);

  results.categoryRelationships = {
    totalCategoryJoins: artCats?.length || 0,
    totalTagJoins: artTags?.length || 0,
  };

  // 5. Kanpur Category Specific Query
  const { data: kanpurArticles } = await supabase
    .from('article_categories')
    .select('article_id, is_primary, articles(id, title, published_at)')
    .eq('categories.slug', 'kanpur');

  const kanpurCount = artCats ? artCats.filter((ac) => ac.categories?.slug === 'kanpur').length : 0;
  console.log(`   Articles tagged in Kanpur: ${kanpurCount}`);

  results.allChecksPass =
    pilotArticles.length === 10 &&
    nativeArticles.length === 2 &&
    batchMedia.length === 5 &&
    mediaChecks.every((m) => m.accessible) &&
    latestBatch.status === 'completed';

  const outPath = path.join(ROOT, 'docs', 'PILOT_LIVE_VERIFICATION_REPORT.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');

  console.log('\n================================================================');
  console.log(`PILOT VERIFICATION OVERALL STATUS: ${results.allChecksPass ? '✅ ALL CHECKS PASSED' : '⚠️ WARNING / CHECK FAILED'}`);
  console.log(`Detailed Report Saved To: ${outPath}`);
  console.log('================================================================\n');

  return results;
}

verify().catch(console.error);

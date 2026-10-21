// scripts/verify_batch2_live_results.mjs
// Post-Import Verification Script for Phase 5 Step 8 Batch 2 Live Import

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

const BATCH_ID = '10dc55ff-d857-45cf-8a74-bec574b7f128';
const PILOT_BATCH_ID = '64ced286-f276-4ba9-834f-e04ac7dd4c54';

async function verify() {
  console.log('================================================================');
  console.log('  AZAAD SAMACHAR — POST-BATCH 2 LIVE VERIFICATION AUDIT');
  console.log('================================================================');
  console.log(`Supabase URL : ${SUPABASE_URL}`);
  console.log(`Batch 2 ID   : ${BATCH_ID}\n`);

  const results = {
    verifiedAt: new Date().toISOString(),
    batchRecord: null,
    totalArticlesInDb: 0,
    batch2ArticlesCount: 0,
    pilotArticlesCount: 0,
    batch2MediaCount: 0,
    publicMediaProbesPassed: 0,
    totalCategoryJoins: 0,
    totalTagJoins: 0,
    kanpurArticlesCount: 0,
    checks: {},
  };

  // 1. Verify Batch Record in migration_batches
  const { data: batchData, error: batchErr } = await supabase
    .from('migration_batches')
    .select('*')
    .eq('id', BATCH_ID)
    .single();

  if (batchErr || !batchData) {
    console.error('❌ Failed to fetch batch record:', batchErr?.message);
    results.checks.batchRecord = 'FAIL';
  } else {
    results.batchRecord = batchData;
    results.checks.batchRecord = batchData.status === 'completed' && batchData.successful_records === 50 ? 'PASS' : 'WARN';
    console.log(`Batch Record Status: ${batchData.status} | Successful: ${batchData.successful_records} | Failed: ${batchData.failed_records}`);
  }

  // 2. Count Total Articles in Database
  const { data: allArticles, count: totalCount } = await supabase
    .from('articles')
    .select('id, legacy_wordpress_id, import_batch_id, title, slug, published_at, featured_media_id', { count: 'exact' });

  results.totalArticlesInDb = totalCount || allArticles.length;
  console.log(`Total Articles in Database: ${results.totalArticlesInDb}`);

  // Count by Batch
  const batch2Articles = allArticles.filter((a) => a.import_batch_id === BATCH_ID);
  const pilotArticles = allArticles.filter((a) => a.import_batch_id === PILOT_BATCH_ID);
  const otherArticles = allArticles.filter((a) => a.import_batch_id !== BATCH_ID && a.import_batch_id !== PILOT_BATCH_ID);

  results.batch2ArticlesCount = batch2Articles.length;
  results.pilotArticlesCount = pilotArticles.length;

  console.log(`  - Batch 2 Articles : ${batch2Articles.length} (Expected: 50)`);
  console.log(`  - Pilot Batch 1    : ${pilotArticles.length} (Expected: 10)`);
  console.log(`  - Other / Native   : ${otherArticles.length}`);

  results.checks.batch2Count = batch2Articles.length === 50 ? 'PASS' : 'FAIL';
  results.checks.pilotIntact = pilotArticles.length === 10 ? 'PASS' : 'FAIL';

  // 3. Verify Batch 2 Media & Live HTTP Reachability
  const { data: batch2Media, error: medErr } = await supabase
    .from('media')
    .select('id, storage_path, public_url, mime_type, file_size, import_batch_id')
    .eq('import_batch_id', BATCH_ID);

  results.batch2MediaCount = batch2Media ? batch2Media.length : 0;
  console.log(`\nBatch 2 Media Records: ${results.batch2MediaCount} (Expected: 37)`);

  let reachableMedia = 0;
  let totalMediaBytes = 0;
  if (batch2Media && batch2Media.length > 0) {
    // Probe a sample of 10 media items
    for (const m of batch2Media.slice(0, 10)) {
      totalMediaBytes += m.file_size || 0;
      try {
        const res = await fetch(m.public_url, { method: 'HEAD' });
        if (res.status === 200) reachableMedia++;
      } catch (e) {}
    }
    console.log(`  Sample 10 Media HTTP 200 Reachable: ${reachableMedia} / 10`);
  }
  results.publicMediaProbesPassed = reachableMedia;
  results.checks.mediaUploads = batch2Media.length === 37 ? 'PASS' : 'WARN';

  // 4. Verify Article-Category Relationships
  const batch2Ids = batch2Articles.map((a) => a.id);
  const { data: artCats } = await supabase
    .from('article_categories')
    .select('article_id, category_id, is_primary, categories(slug, name)')
    .in('article_id', batch2Ids);

  const { data: artTags } = await supabase
    .from('article_tags')
    .select('article_id, tag_id')
    .in('article_id', batch2Ids);

  results.totalCategoryJoins = artCats ? artCats.length : 0;
  results.totalTagJoins = artTags ? artTags.length : 0;

  const kanpurCount = artCats ? artCats.filter((ac) => ac.categories?.slug === 'kanpur').length : 0;
  results.kanpurArticlesCount = kanpurCount;

  console.log(`\nTaxonomy Joins Created:`);
  console.log(`  - Category Joins       : ${results.totalCategoryJoins}`);
  console.log(`  - Tag Joins            : ${results.totalTagJoins}`);
  console.log(`  - Articles with Kanpur : ${kanpurCount}`);

  results.checks.taxonomyJoins = results.totalCategoryJoins >= 50 ? 'PASS' : 'WARN';

  const outPath = path.join(ROOT, 'docs', 'BATCH2_LIVE_VERIFICATION_AUDIT.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');

  console.log('\n================================================================');
  console.log(`OVERALL VERIFICATION STATUS: ${Object.values(results.checks).every((c) => c === 'PASS') ? '✅ ALL CHECKS PASSED' : '⚠️ WARNING / CHECK FAILED'}`);
  console.log(`Audit saved to: ${outPath}`);
  console.log('================================================================\n');

  return results;
}

verify().catch(console.error);

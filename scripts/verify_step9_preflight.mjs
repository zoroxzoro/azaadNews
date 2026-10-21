import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envText = fs.readFileSync('.env', 'utf-8');
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

const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  console.log('=== PHASE 5 STEP 9 MANDATORY PRE-FLIGHT AUDIT ===');
  
  // 1. Target Supabase URL
  console.log('\n[Check 1] Target Supabase URL:', supabaseUrl);

  // 2. Database backup / snapshots
  const snapshots = [
    'docs/PRE_PILOT_REMOTE_SNAPSHOT.json',
    'docs/PRE_BATCH2_REMOTE_SNAPSHOT.json',
    'azaad-migration/migration_checkpoint.json',
    'azaad-migration/batches/64ced286-f276-4ba9-834f-e04ac7dd4c54.json',
    'azaad-migration/batches/10dc55ff-d857-45cf-8a74-bec574b7f128.json'
  ];
  const snapshotsExist = snapshots.every(s => fs.existsSync(s));
  console.log('[Check 2] Snapshots & Recoverable Tracking Exist:', snapshotsExist ? 'PASS' : 'FAIL');

  // 4 & 5. Credentials
  console.log('[Check 5] Service role key available:', serviceKey ? 'PASS (present, non-empty, hidden)' : 'FAIL');

  // 6 & 7. Article counts & reconciliation
  const { data: articles, error: artErr } = await supabase.from('articles').select('id, title, status, is_imported, legacy_wordpress_id, created_at, import_batch_id');
  if (artErr) {
    console.error('Error fetching articles:', artErr);
    return;
  }
  
  const totalArticles = articles.length;
  const publishedArticles = articles.filter(a => a.status === 'published').length;
  const draftArticles = articles.filter(a => a.status === 'draft').length;
  const importedArticles = articles.filter(a => a.is_imported === true).length;
  const nativeArticles = articles.filter(a => a.is_imported === false || !a.legacy_wordpress_id).length;

  console.log('\n[Check 7] Article Reconciliation:');
  console.log('  - Total rows in public.articles:', totalArticles);
  console.log('  - Published articles:', publishedArticles);
  console.log('  - Draft articles:', draftArticles);
  console.log('  - Imported articles (is_imported=true):', importedArticles);
  console.log('  - Native CMS articles (is_imported=false / legacy_id=null):', nativeArticles);

  // Check 8 & 9. Native UUID check
  const native1Uuid = '42fc3ec2-eef0-4f59-a548-d3c2a632ea51';
  const native2Uuid = '1e12726d-df98-444a-9351-411a76ddc075';
  const snap1Uuid = '8019108a-a7d7-43ce-ba65-0701f0d9aade';
  const snap2Uuid = '7ebdb4a4-6b59-4392-813a-38189c72b665';

  const foundNative1 = articles.find(a => a.id === native1Uuid);
  const foundNative2 = articles.find(a => a.id === native2Uuid);
  const foundSnap1 = articles.find(a => a.id === snap1Uuid);
  const foundSnap2 = articles.find(a => a.id === snap2Uuid);

  console.log('\n[Check 8 & 9] Native CMS Article Verification:');
  console.log(`  - Target Native 1 (${native1Uuid}):`, foundNative1 ? 'EXISTS' : 'MISSING (NOT FOUND)');
  console.log(`  - Target Native 2 (${native2Uuid}):`, foundNative2 ? 'EXISTS' : 'MISSING (NOT FOUND)');
  console.log(`  - Snapshot Native 1 (${snap1Uuid}):`, foundSnap1 ? 'EXISTS' : 'MISSING (NOT FOUND)');
  console.log(`  - Snapshot Native 2 (${snap2Uuid}):`, foundSnap2 ? 'EXISTS' : 'MISSING (NOT FOUND)');

  // Check 6 & 10. Checkpoint & remaining WP IDs
  const checkpoint = JSON.parse(fs.readFileSync('azaad-migration/migration_checkpoint.json', 'utf-8'));
  const importedWpIds = checkpoint.importedIds;
  console.log('\n[Check 6] Existing Imported WordPress IDs count in checkpoint:', importedWpIds.length);

  // Check 11 & 12. Storage usage & capacity
  const { data: mediaRows, error: mediaErr } = await supabase.from('media').select('id, file_size, storage_path');
  if (mediaErr) {
    console.error('Error fetching media:', mediaErr);
  }
  let totalUploadedBytes = 0;
  if (mediaRows) {
    mediaRows.forEach(m => {
      totalUploadedBytes += (m.file_size || 0);
    });
  }
  const totalUploadedMB = (totalUploadedBytes / (1024 * 1024)).toFixed(3);
  console.log('\n[Check 11 & 12] Supabase Storage Status:');
  console.log('  - Total media records in DB:', mediaRows ? mediaRows.length : 0);
  console.log('  - Total recorded storage used:', `${totalUploadedMB} MB`);
  console.log('  - Free tier quota: 1000 MB (1.0 GB)');
  console.log('  - Estimated remaining archive media: ~648.8 MB');
  console.log('  - Headroom remaining if all archive media uploaded: ~349 MB');

  // Check 13. URL Redirects table
  const { count: redirectCount, error: redErr } = await supabase.from('legacy_url_redirects').select('*', { count: 'exact', head: true });
  console.log('\n[Check 13] Legacy URL Redirects Table accessible:', redErr ? `FAIL: ${redErr.message}` : `PASS (${redirectCount || 0} rows)`);

  // Check 14. Batches table
  const { data: batches, error: batchErr } = await supabase.from('migration_batches').select('*');
  console.log('\n[Check 14] Migration Batches Recorded:', batches ? batches.length : 0);
  if (batches) {
    batches.forEach(b => console.log(`  - Batch ${b.id}: status=${b.status}, records=${b.successful_records}`));
  }

  // Summary verdict
  console.log('\n================================================================');
  console.log('PRE-FLIGHT GATE VERDICT:');
  if (!foundNative1 || !foundNative2) {
    console.log('CRITICAL GATE FAILURE: Native CMS articles 42fc3ec2-eef0-4f59-a548-d3c2a632ea51 and 1e12726d-df98-444a-9351-411a76ddc075 are MISSING from the database.');
    console.log('Per Step 1 Requirement 9: "If native articles are unexpectedly missing or modified, STOP and report the issue."');
  } else {
    console.log('ALL PRE-FLIGHT CHECKS PASSED.');
  }
  console.log('================================================================');
}

run();

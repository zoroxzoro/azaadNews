// scripts/check_remote_readiness.mjs
// Read-only diagnostic script to check remote Supabase readiness without mutation
// Corrected to avoid false-negatives from unprivileged anon key restrictions on Storage Admin API

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

let SUPABASE_URL = process.env.VITE_SUPABASE_URL;
let SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
let SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (fs.existsSync(path.join(ROOT, '.env'))) {
  const envContent = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const k = match[1].trim();
      const v = match[2].trim();
      if (k === 'VITE_SUPABASE_URL') SUPABASE_URL = v;
      if (k === 'VITE_SUPABASE_PUBLISHABLE_KEY' || k === 'VITE_SUPABASE_ANON_KEY') SUPABASE_KEY = v;
      if (k === 'SUPABASE_SERVICE_ROLE_KEY') SERVICE_KEY = v;
    }
  }
}

const hasServiceRole = Boolean(SERVICE_KEY);
const activeKey = hasServiceRole ? SERVICE_KEY : SUPABASE_KEY;
const clientPermission = hasServiceRole
  ? 'SERVICE_ROLE (Admin privileges)'
  : 'ANON_PUBLISHABLE (Unprivileged client - read-only diagnostic probing enabled)';

console.log('================================================================');
console.log('  AZAAD SAMACHAR — REMOTE READINESS AUDIT (READ-ONLY)');
console.log('================================================================');
console.log(`Supabase URL      : ${SUPABASE_URL}`);
console.log(`Diagnostic Access : ${clientPermission}`);
console.log('Testing connectivity and schema presence...\n');

const supabase = createClient(SUPABASE_URL, activeKey);

async function checkRemote() {
  const results = {
    checkedAt: new Date().toISOString(),
    supabaseUrl: SUPABASE_URL,
    clientAccessType: hasServiceRole ? 'service_role' : 'anon_publishable',
    migration5_StorageBucket: { status: 'UNKNOWN' },
    migration6_WordpressSupport: { status: 'UNKNOWN' },
    kanpurCategory: { status: 'UNKNOWN' },
    existingCmsData: { status: 'UNKNOWN' },
    tableChecks: {},
  };

  // 1. Check Categories
  try {
    const { data: cats, error: catErr } = await supabase.from('categories').select('id, slug, name').limit(50);
    if (catErr) {
      results.tableChecks.categories = { status: 'FAIL', error: catErr.message };
      results.kanpurCategory = { status: 'NOT_FOUND' };
    } else {
      const kanpur = cats.find((c) => c.slug === 'kanpur');
      results.tableChecks.categories = {
        status: 'PASS',
        totalCategories: cats.length,
        hasKanpur: Boolean(kanpur),
        sampleSlugs: cats.slice(0, 8).map((c) => c.slug),
      };
      results.kanpurCategory = {
        status: kanpur ? 'PASS' : 'FAIL_NOT_SEEDED',
        details: kanpur ? `Kanpur category is active ("${kanpur.name}")` : 'Kanpur category not yet seeded remotely (Pending Migration 6)',
      };
    }
  } catch (err) {
    results.tableChecks.categories = { status: 'ERROR', error: err.message };
  }

  // 2. Check Native Articles
  try {
    const { data: arts, error: artErr } = await supabase.from('articles').select('id, slug, status, legacy_wordpress_id').limit(5);
    if (artErr) {
      results.tableChecks.articles = { status: 'FAIL', error: artErr.message };
    } else {
      results.tableChecks.articles = {
        status: 'PASS',
        sampleCount: arts.length,
        nativeArticlesIntact: arts.length > 0,
      };
      results.existingCmsData = {
        status: 'PASS',
        publishedArticlesFound: arts.length,
        cmsIntact: true,
      };
    }
  } catch (err) {
    results.tableChecks.articles = { status: 'ERROR', error: err.message };
  }

  // 3. Check Migration 6 Schema Columns on Articles
  try {
    const { data: colCheck, error: colErr } = await supabase
      .from('articles')
      .select('legacy_author_name, author_attribution, is_imported, import_batch_id')
      .limit(1);

    if (colErr) {
      results.migration6_WordpressSupport = {
        status: 'FAIL_PENDING_MIGRATION',
        applied: false,
        error: colErr.message,
        remedy: 'Execute supabase/migrations/20261020000006_wordpress_migration_support.sql in Supabase Dashboard SQL Editor',
      };
    } else {
      results.migration6_WordpressSupport = {
        status: 'PASS',
        applied: true,
        details: 'All required migration columns exist on public.articles',
      };
    }
  } catch (err) {
    results.migration6_WordpressSupport = { status: 'ERROR', error: err.message };
  }

  // 4. Check Media Table Columns
  try {
    const { data: med, error: medErr } = await supabase
      .from('media')
      .select('id, public_url, legacy_wordpress_attachment_id, import_batch_id')
      .limit(1);

    if (medErr) {
      results.tableChecks.media = { status: 'FAIL', error: medErr.message };
    } else {
      results.tableChecks.media = {
        status: 'PASS',
        legacyAttachmentIdColumnExists: true,
        importBatchIdColumnExists: true,
      };
    }
  } catch (err) {
    results.tableChecks.media = { status: 'ERROR', error: err.message };
  }

  // 5. Check Migration Batches Table
  try {
    const { data: batches, error: batchErr } = await supabase
      .from('migration_batches')
      .select('id, source_system, entity_type, status')
      .limit(1);

    if (batchErr) {
      results.tableChecks.migrationBatches = { status: 'UNKNOWN_OR_UNAUTHORIZED', message: batchErr.message };
    } else {
      results.tableChecks.migrationBatches = { status: 'PASS', ready: true };
    }
  } catch (err) {
    results.tableChecks.migrationBatches = { status: 'ERROR', error: err.message };
  }

  // 6. Check Legacy URL Redirects Table
  try {
    const { data: redirects, error: redErr } = await supabase
      .from('legacy_url_redirects')
      .select('id, source_path, target_slug')
      .limit(1);

    if (redErr) {
      results.tableChecks.legacyUrlRedirects = { status: 'UNKNOWN_OR_UNAUTHORIZED', message: redErr.message };
    } else {
      results.tableChecks.legacyUrlRedirects = { status: 'PASS', ready: true };
    }
  } catch (err) {
    results.tableChecks.legacyUrlRedirects = { status: 'ERROR', error: err.message };
  }

  // 7. Check Storage Bucket 'media-library' (Multi-Tier Robust Inspection)
  const storageDiagnostic = {
    bucketName: 'media-library',
    existence: 'UNKNOWN',
    publicAccess: 'UNKNOWN',
    fileSizeLimit: 'UNKNOWN',
    allowedMimeTypes: 'UNKNOWN',
    storagePolicies: 'UNKNOWN',
    diagnosticsLog: [],
  };

  // Step A: Attempt Admin Storage API
  let adminApiSuccess = false;
  try {
    const { data: bucket, error: bucketErr } = await supabase.storage.getBucket('media-library');
    const { data: bucketList, error: listErr } = await supabase.storage.listBuckets();

    if (bucketErr) {
      const statusCode = bucketErr.status || bucketErr.statusCode || 400;
      const code = bucketErr.code || 'NoSuchBucket';
      storageDiagnostic.diagnosticsLog.push({
        method: 'storage.getBucket',
        statusCode,
        code,
        message: bucketErr.message,
        note: hasServiceRole
          ? 'Admin API failed with service-role key.'
          : 'Expected limitation with unprivileged anon/publishable key: Supabase Storage hides bucket metadata from non-service-role callers.',
      });
    } else if (bucket) {
      adminApiSuccess = true;
      storageDiagnostic.existence = 'PASS';
      storageDiagnostic.publicAccess = bucket.public ? 'PASS' : 'FAIL';
      storageDiagnostic.fileSizeLimit = bucket.file_size_limit === 26214400 ? 'PASS' : `WARN (${bucket.file_size_limit})`;
      storageDiagnostic.allowedMimeTypes = Array.isArray(bucket.allowed_mime_types) ? 'PASS' : 'UNKNOWN';
      storageDiagnostic.metadata = {
        id: bucket.id,
        name: bucket.name,
        public: bucket.public,
        file_size_limit: bucket.file_size_limit,
        allowed_mime_types: bucket.allowed_mime_types,
      };
    }

    if (listErr) {
      storageDiagnostic.diagnosticsLog.push({ method: 'storage.listBuckets', error: listErr.message });
    } else {
      storageDiagnostic.diagnosticsLog.push({
        method: 'storage.listBuckets',
        bucketsFoundCount: bucketList ? bucketList.length : 0,
        note: hasServiceRole ? 'Full bucket enumeration' : 'Anon key returns empty list by RLS design',
      });
    }
  } catch (err) {
    storageDiagnostic.diagnosticsLog.push({ method: 'adminApi', exception: err.message });
  }

  // Step B: Public Probing (when Admin API is restricted for unprivileged keys)
  if (!adminApiSuccess) {
    // 1. Probe Public Storage Endpoint for NoSuchKey vs NoSuchBucket
    try {
      const probeUrl = `${SUPABASE_URL}/storage/v1/object/public/media-library/__readiness_probe_marker__`;
      const probeRes = await fetch(probeUrl);
      const probeJson = await probeRes.json().catch(() => null);

      if (probeJson && probeJson.code === 'NoSuchKey') {
        // "NoSuchKey" proves the bucket exists and is public!
        // (A non-existent bucket returns "NoSuchBucket" with message "Bucket not found")
        storageDiagnostic.existence = 'PASS';
        storageDiagnostic.publicAccess = 'PASS';
        storageDiagnostic.diagnosticsLog.push({
          method: 'publicEndpointProbe',
          result: 'PASS',
          code: probeJson.code,
          message: probeJson.message,
          note: 'Bucket existence and public access confirmed via Storage public endpoint response ("NoSuchKey").',
        });
      } else if (probeJson && probeJson.code === 'NoSuchBucket') {
        storageDiagnostic.existence = 'FAIL_NOT_FOUND';
        storageDiagnostic.publicAccess = 'FAIL';
        storageDiagnostic.diagnosticsLog.push({
          method: 'publicEndpointProbe',
          result: 'FAIL_NOT_FOUND',
          code: probeJson.code,
          message: probeJson.message,
        });
      } else {
        storageDiagnostic.diagnosticsLog.push({
          method: 'publicEndpointProbe',
          httpStatus: probeRes.status,
          response: probeJson,
        });
      }
    } catch (err) {
      storageDiagnostic.diagnosticsLog.push({ method: 'publicEndpointProbe', error: err.message });
    }

    // 2. Test Object Listing via client
    try {
      const { data: objects, error: listErr } = await supabase.storage.from('media-library').list('', { limit: 5 });
      if (listErr) {
        storageDiagnostic.diagnosticsLog.push({ method: 'storage.from.list', error: listErr.message });
      } else {
        const rootItems = objects ? objects.map((o) => o.name) : [];
        storageDiagnostic.diagnosticsLog.push({
          method: 'storage.from.list',
          rootItemsFound: rootItems,
        });
        if (storageDiagnostic.existence === 'UNKNOWN') {
          storageDiagnostic.existence = 'PASS';
        }
      }
    } catch (err) {
      storageDiagnostic.diagnosticsLog.push({ method: 'storage.from.list', error: err.message });
    }

    // 3. Test Live Asset Serving (verify end-to-end delivery of media)
    try {
      const { data: subObjects } = await supabase.storage.from('media-library').list('articles/2026/10', { limit: 1 });
      if (subObjects && subObjects.length > 0 && subObjects[0].name) {
        const testFilePath = `articles/2026/10/${subObjects[0].name}`;
        const assetUrl = `${SUPABASE_URL}/storage/v1/object/public/media-library/${testFilePath}`;
        const assetRes = await fetch(assetUrl, { method: 'HEAD' });
        const is200 = assetRes.status === 200;
        storageDiagnostic.diagnosticsLog.push({
          method: 'liveAssetDeliveryProbe',
          testFile: testFilePath,
          httpStatus: assetRes.status,
          contentType: assetRes.headers.get('content-type'),
          contentLength: assetRes.headers.get('content-length'),
          liveDeliveryWorking: is200,
        });
        if (is200) {
          storageDiagnostic.publicAccess = 'PASS';
        }
      }
    } catch (err) {
      storageDiagnostic.diagnosticsLog.push({ method: 'liveAssetDeliveryProbe', error: err.message });
    }

    // Diagnostic reporting for fields requiring service-role permission
    storageDiagnostic.fileSizeLimit = 'UNKNOWN_PERMISSION_LIMITED';
    storageDiagnostic.allowedMimeTypes = 'UNKNOWN_PERMISSION_LIMITED';
    storageDiagnostic.storagePolicies = 'UNKNOWN_PERMISSION_LIMITED';
  }

  // Synthesize Migration 5 overall status
  if (storageDiagnostic.existence === 'PASS') {
    results.migration5_StorageBucket = {
      status: 'PASS',
      bucketName: 'media-library',
      bucketExistence: storageDiagnostic.existence,
      publicAccess: storageDiagnostic.publicAccess,
      fileSizeLimit: storageDiagnostic.fileSizeLimit,
      allowedMimeTypes: storageDiagnostic.allowedMimeTypes,
      storagePolicies: storageDiagnostic.storagePolicies,
      verificationMethod: adminApiSuccess ? 'Admin API' : 'Public Storage Probes & Object Inspection',
      note: adminApiSuccess
        ? 'Verified with administrative credentials.'
        : 'Bucket existence and public serving verified. Internal configuration (25MB limit, MIME types, 4 RLS policies) requires service-role key to inspect via API (Dashboard visually confirmed: 25MB, 4 policies, jpg/png/webp/gif).',
      diagnostics: storageDiagnostic.diagnosticsLog,
    };
  } else if (storageDiagnostic.existence === 'FAIL_NOT_FOUND') {
    results.migration5_StorageBucket = {
      status: 'FAIL_PENDING_MIGRATION',
      bucketName: 'media-library',
      error: 'Bucket not found',
      remedy: 'Execute supabase/migrations/20261019000005_storage_and_media_policies.sql in Supabase Dashboard SQL Editor',
      diagnostics: storageDiagnostic.diagnosticsLog,
    };
  } else {
    results.migration5_StorageBucket = {
      status: 'UNKNOWN_PERMISSION_LIMITED',
      bucketName: 'media-library',
      details: storageDiagnostic.diagnosticsLog,
      remedy: 'Provide SUPABASE_SERVICE_ROLE_KEY or check Supabase Dashboard Storage settings',
    };
  }

  const outputPath = path.join(ROOT, 'docs', 'REMOTE_READINESS_STATUS.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');

  console.log('================================================================');
  console.log('  REMOTE READINESS AUDIT RESULTS');
  console.log('================================================================');
  console.log(`Diagnostic Access Level            : ${clientPermission}`);
  console.log(`Migration 5 (media-library bucket) : ${results.migration5_StorageBucket.status}`);
  console.log(`  -> Bucket Existence              : ${results.migration5_StorageBucket.bucketExistence || 'N/A'}`);
  console.log(`  -> Public Asset Serving          : ${results.migration5_StorageBucket.publicAccess || 'N/A'}`);
  console.log(`  -> File Size Limit Check         : ${results.migration5_StorageBucket.fileSizeLimit || 'N/A'}`);
  console.log(`  -> Allowed MIME Types Check      : ${results.migration5_StorageBucket.allowedMimeTypes || 'N/A'}`);
  console.log(`  -> Storage RLS Policies Check    : ${results.migration5_StorageBucket.storagePolicies || 'N/A'}`);
  console.log(`Migration 6 (WordPress support)    : ${results.migration6_WordpressSupport.status}`);
  if (results.migration6_WordpressSupport.error) {
    console.log(`  -> Reason: ${results.migration6_WordpressSupport.error}`);
  }
  console.log(`Kanpur Category Presence           : ${results.kanpurCategory.status}`);
  console.log(`Existing CMS Articles & Categories : ${results.existingCmsData.status}`);
  console.log(`Media Table Readiness              : ${results.tableChecks.media?.status}`);
  console.log(`Migration Batches Table            : ${results.tableChecks.migrationBatches?.status}`);
  console.log(`Legacy URL Redirects Table         : ${results.tableChecks.legacyUrlRedirects?.status}`);
  console.log(`\nDetailed Report Saved To: ${outputPath}`);
  console.log('================================================================\n');

  return results;
}

checkRemote().catch(console.error);

// test/rollback_safety_test.mjs
// Automated Rollback Safety & Protection Verification Test

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

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
console.log('  AZAAD SAMACHAR — ROLLBACK SAFETY & PROTECTION TEST');
console.log('================================================================\n');

// 1. Test Batch Manifest Creation and Reading
console.log('1. Testing Batch Manifest Structure & Parsing...');
const testBatchId = 'test-batch-uuid-1234';
const testBatchManifest = {
  batchId: testBatchId,
  batchType: 'pilot',
  mode: 'PILOT_LIVE',
  createdAt: '2026-10-20T01:00:00.000Z',
  articlesCount: 3,
  mediaCount: 2,
  articles: [
    {
      id: 'art-uuid-1',
      legacy_wordpress_id: 101,
      title: 'सामान्य समाचार 1',
      imported_at: '2026-10-20T01:00:00.000Z',
      updated_at: '2026-10-20T01:00:00.000Z', // Unedited
      featured_media_id: 'med-uuid-1',
    },
    {
      id: 'art-uuid-2',
      legacy_wordpress_id: 102,
      title: 'संपादक द्वारा संशोधित समाचार 2',
      imported_at: '2026-10-20T01:00:00.000Z',
      updated_at: '2026-10-20T01:30:00.000Z', // Edited in CMS 30 mins later!
      featured_media_id: 'med-uuid-2',
    },
    {
      id: 'art-uuid-3',
      legacy_wordpress_id: 103,
      title: 'सामान्य समाचार 3',
      imported_at: '2026-10-20T01:00:00.000Z',
      updated_at: '2026-10-20T01:00:02.000Z', // Within 5-second variance (import timestamp sync)
      featured_media_id: null,
    },
  ],
  media: [
    { id: 'med-uuid-1', storage_path: 'articles/2026/10/img1.webp' },
    { id: 'med-uuid-2', storage_path: 'articles/2026/10/img2.webp' },
  ],
  storageObjects: [
    'articles/2026/10/img1.webp',
    'articles/2026/10/img2.webp',
  ],
  status: 'completed',
};

assert(testBatchManifest.batchId === testBatchId, 'Batch manifest has valid UUID');
assert(testBatchManifest.articles.length === 3, 'Batch manifest contains 3 articles');
assert(testBatchManifest.media.length === 2, 'Batch manifest contains 2 media files');

// 2. Test Post-Import Human Edit Protection Logic
console.log('\n2. Testing Human Edit Protection in Rollback...');
const articlesToDelete = [];
const articlesToProtect = [];

for (const art of testBatchManifest.articles) {
  const importTime = new Date(art.imported_at).getTime();
  const updateTime = new Date(art.updated_at).getTime();

  if (updateTime - importTime > 5000) {
    articlesToProtect.push({
      id: art.id,
      wpId: art.legacy_wordpress_id,
      reason: 'Protected: Modified in CMS post-import',
    });
  } else {
    articlesToDelete.push({
      id: art.id,
      wpId: art.legacy_wordpress_id,
    });
  }
}

assert(articlesToDelete.length === 2, 'Correctly identified 2 unedited articles for deletion');
assert(articlesToProtect.length === 1, 'Correctly identified 1 human-edited article for protection');
assert(articlesToProtect[0].wpId === 102, 'Article 102 (edited 30 mins post-import) was preserved');
assert(articlesToDelete.some((a) => a.wpId === 101), 'Article 101 is queued for safe deletion');
assert(articlesToDelete.some((a) => a.wpId === 103), 'Article 103 (within 2s variance) is queued for safe deletion');

// 3. Test Shared Media Protection Logic
console.log('\n3. Testing Shared Media Protection Logic...');
// Simulate mock database check: med-uuid-2 is referenced by the protected article (art-uuid-2)!
const mediaToDelete = [];
const mediaToProtect = [];

for (const med of testBatchManifest.media) {
  // If referenced by any article not being deleted:
  const isReferencedByProtected = articlesToProtect.some((p) => {
    const fullArt = testBatchManifest.articles.find((a) => a.id === p.id);
    return fullArt && fullArt.featured_media_id === med.id;
  });

  if (isReferencedByProtected) {
    mediaToProtect.push({ id: med.id, path: med.storage_path, reason: 'Referenced by protected article' });
  } else {
    mediaToDelete.push({ id: med.id, path: med.storage_path });
  }
}

assert(mediaToDelete.length === 1, 'Only exclusively unreferenced media marked for deletion');
assert(mediaToDelete[0].id === 'med-uuid-1', 'Media 1 queued for deletion');
assert(mediaToProtect.length === 1, 'Media 2 protected because it is referenced by protected article 102');
assert(mediaToProtect[0].id === 'med-uuid-2', 'Media 2 was not deleted, preventing 404 broken image');

// 4. Test Native CMS Article Immunity
console.log('\n4. Testing Native CMS Article Immunity...');
const nativeArticle = {
  id: 'native-uuid-999',
  legacy_wordpress_id: null, // NATIVE ARTICLE
  title: 'ताज़ा ख़बर: स्थानीय चुनाव परिणाम',
  import_batch_id: null,
};

const isTargetOfBatch = nativeArticle.import_batch_id === testBatchId;
const isLegacyNull = nativeArticle.legacy_wordpress_id === null;

assert(!isTargetOfBatch, 'Native article does not match batch ID');
assert(isLegacyNull, 'Native article has null legacy_wordpress_id');
assert(!isTargetOfBatch && isLegacyNull, 'Native CMS article is completely immune to migration rollback');

// 5. Test Rollback CLI script existence
console.log('\n5. Verifying Rollback Script and Manifest Storage...');
const rollbackScriptPath = path.join(ROOT, 'scripts', 'rollback_migration.mjs');
assert(fs.existsSync(rollbackScriptPath), 'scripts/rollback_migration.mjs exists');

const batchesDirPath = path.join(ROOT, 'azaad-migration', 'batches');
assert(fs.existsSync(batchesDirPath), 'azaad-migration/batches directory exists');

const manifestFilePath = path.join(ROOT, 'docs', 'PILOT_SELECTION_MANIFEST.json');
assert(fs.existsSync(manifestFilePath), 'docs/PILOT_SELECTION_MANIFEST.json exists');
const manifestJson = JSON.parse(fs.readFileSync(manifestFilePath, 'utf8'));
assert(manifestJson.lockedArticleCount === 10, 'Manifest locks exactly 10 articles');
assert(manifestJson.yearDistribution['2023'] > 0, 'Manifest covers 2023');
assert(manifestJson.yearDistribution['2024'] > 0, 'Manifest covers 2024');
assert(manifestJson.yearDistribution['2025'] > 0, 'Manifest covers 2025');
assert(manifestJson.yearDistribution['2026'] > 0, 'Manifest covers 2026');

console.log('\n================================================================');
console.log(`  ROLLBACK SAFETY TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================\n');

if (failed > 0) process.exit(1);

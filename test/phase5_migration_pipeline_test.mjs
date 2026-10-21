// test/phase5_migration_pipeline_test.mjs
// Phase 5 Migration Pipeline Verification Test

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseSqlTuple } from '../scripts/lib/sqlTupleParser.mjs';
import { wpHtmlToTipTap } from '../src/utils/wpHtmlToTipTap.js';
import { CATEGORY_MAP, resolveTaxonomies } from '../scripts/lib/taxonomyMapper.mjs';
import { resolveAuthor } from '../scripts/lib/authorMapper.mjs';

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
console.log('  AZAAD SAMACHAR — PHASE 5 MIGRATION PIPELINE VERIFICATION TEST');
console.log('================================================================\n');

// 1. SQL Tuple Parser Tests
console.log('1. Testing SQL Tuple Parsing & Escape Handling...');
const sampleTuple = `1234, 1, '2024-05-10 12:30:00', '2024-05-10 07:00:00', 'यह एक \\'परीक्षण\\' समाचार है\\r\\nदूसरी पंक्ति', 'कानपुर समाचार', '', 'publish'`;
const parsed = parseSqlTuple(sampleTuple);
assert(parsed.length === 8, 'Parsed exactly 8 fields from SQL tuple');
assert(parseInt(parsed[0], 10) === 1234, 'Parsed integer ID correctly');
assert(parseInt(parsed[1], 10) === 1, 'Parsed author ID correctly');
assert(parsed[5] === 'कानपुर समाचार', 'Parsed UTF-8 Hindi text correctly');
assert(parsed[4].includes("परीक्षण"), 'Parsed escaped quotes in multiline text correctly');

// 2. HTML to TipTap Converter Tests
console.log('\n2. Testing HTML-to-TipTap Rich-Text Conversion...');
const sampleWpHtml = `
<!-- wp:paragraph -->
<p>उत्तर प्रदेश के कानपुर में <strong>बड़ी घटना</strong> सामने आई है। अधिक जानकारी के लिए <a href="https://example.com">यहाँ क्लिक करें</a>।</p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":2} -->
<h2>मुख्य बिंदु</h2>
<!-- /wp:heading -->
<!-- wp:list -->
<ul>
  <li>पहला बिंदु</li>
  <li>दूसरा बिंदु</li>
</ul>
<!-- /wp:list -->
<blockquote><p>यह एक महत्वपूर्ण बयान है।</p></blockquote>
<figure><img src="https://azaadsamacharindia.com/wp-content/uploads/2024/05/test.jpg" alt="परीक्षण चित्र" /><figcaption>चित्र का विवरण</figcaption></figure>
`;

const tipTapDoc = wpHtmlToTipTap(sampleWpHtml);
assert(tipTapDoc && tipTapDoc.type === 'doc', 'Produced valid ProseMirror document root');
assert(Array.isArray(tipTapDoc.content) && tipTapDoc.content.length >= 4, 'Converted blocks into structured nodes');

const pNode = tipTapDoc.content.find(n => n.type === 'paragraph');
assert(pNode && pNode.content.some(c => c.marks?.some(m => m.type === 'bold')), 'Preserved bold mark in paragraph');
assert(pNode && pNode.content.some(c => c.marks?.some(m => m.type === 'link')), 'Preserved link mark in paragraph');

const hNode = tipTapDoc.content.find(n => n.type === 'heading');
assert(hNode && hNode.attrs?.level === 2, 'Preserved H2 heading with level 2 attribute');

const listNode = tipTapDoc.content.find(n => n.type === 'bulletList');
assert(listNode && listNode.content?.length === 2, 'Preserved bullet list with 2 items');

const bqNode = tipTapDoc.content.find(n => n.type === 'blockquote');
assert(bqNode && bqNode.content?.[0]?.type === 'paragraph', 'Preserved blockquote node');

const imgNode = tipTapDoc.content.find(n => n.type === 'image');
assert(imgNode && imgNode.attrs?.src.includes('test.jpg'), 'Preserved inline image node');

// 3. Taxonomy Mapping Tests (Kanpur Preservation)
console.log('\n3. Testing Taxonomy Mapping & Kanpur Preservation...');
assert(CATEGORY_MAP['कानपुर']?.slug === 'kanpur', 'Mapped कानपुर directly to kanpur slug (not merged into UP)');
assert(CATEGORY_MAP['उत्तर-प्रदेश']?.slug === 'uttar-pradesh', 'Mapped उत्तर-प्रदेश to uttar-pradesh slug');
assert(CATEGORY_MAP['भारत']?.slug === 'national', 'Mapped भारत to national slug');
assert(CATEGORY_MAP['देश-विदेश']?.slug === 'world', 'Mapped देश-विदेश to world slug');
assert(CATEGORY_MAP['खेल']?.slug === 'sports', 'Mapped खेल to sports slug');
assert(CATEGORY_MAP['41']?.slug === 'opinion', 'Mapped कविताएं/41 to opinion slug');

const mappedTax = resolveTaxonomies([9, 62], new Map());
assert(mappedTax.primaryCategorySlug === 'kanpur', 'Kanpur designated as primary category');
assert(mappedTax.isFeatured === true, 'Category 62 mapped to is_featured editorial flag');

// 4. Author Strategy Tests
console.log('\n4. Testing Historical Author Strategy...');
const author1 = resolveAuthor(1, new Map());
assert(author1.legacyWpId === 1, 'Preserves legacy WordPress author ID 1');
assert(author1.displayNameHindi === 'आज़ाद समाचार डेस्क', 'Mapped WP author 1 to legacy display name');

// 5. Migration 6 SQL Verification
console.log('\n5. Verifying Migration 6 SQL Structure...');
const migration6Path = path.join(ROOT, 'supabase', 'migrations', '20261020000006_wordpress_migration_support.sql');
assert(fs.existsSync(migration6Path), 'Migration 6 file exists');
const migration6Content = fs.readFileSync(migration6Path, 'utf8');
assert(migration6Content.includes("legacy_wordpress_id"), 'Migration 6 adds legacy_wordpress_id to articles');
assert(migration6Content.includes("legacy_wordpress_attachment_id"), 'Migration 6 adds legacy_wordpress_attachment_id to media');
assert(migration6Content.includes("idx_articles_legacy_wp_id"), 'Migration 6 creates unique index on legacy_wordpress_id');
assert(migration6Content.includes("'kanpur'"), 'Migration 6 seeds Kanpur category');
assert(migration6Content.includes("DROP NOT NULL"), 'Migration 6 relaxes author_id not-null constraint for historical archives');

// 6. Dry Run Preview Output Verification
console.log('\n6. Verifying Dry Run Preview Artifact...');
const previewPath = path.join(ROOT, 'docs', 'MIGRATION_DRY_RUN_PREVIEW.json');
assert(fs.existsSync(previewPath), 'MIGRATION_DRY_RUN_PREVIEW.json artifact exists');
const previewData = JSON.parse(fs.readFileSync(previewPath, 'utf8'));
assert(Array.isArray(previewData), 'Preview data is a JSON array');
assert(previewData.length === 10, 'Preview array contains exactly 10 sample articles');
assert(previewData.every(a => a.recordPreview?.content_json?.type === 'doc'), 'All 10 dry-run articles converted to valid TipTap JSON');
assert(previewData.every(a => a.primaryCategory), 'All 10 dry-run articles have a resolved primary category');
assert(previewData.every(a => a.warnings !== undefined), 'All dry-run items report conversion warnings array');

console.log('\n================================================================');
console.log(`  PHASE 5 VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
}

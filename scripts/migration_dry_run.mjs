/**
 * Phase 5 Migration Dry-Run CLI Tool
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Performs a complete, non-destructive simulation of migrating 10 real representative
 * WordPress articles into the Supabase target schema.
 *
 * STRICT SAFETY:
 * - Does NOT connect or write to remote Supabase database.
 * - Does NOT upload any media files to Supabase Storage.
 * - Does NOT modify original WordPress SQL dump or uploads.
 * - Validates schema compatibility, TipTap JSONB integrity, and media resolution.
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const migrationDir = path.join(rootDir, 'azaad-migration');
const sqlPath = path.join(migrationDir, 'u829836736_easOt.sql');

import { parseSqlTuple } from './lib/sqlTupleParser.mjs';
import { convertWpHtmlToTipTap, stripHtmlTags } from '../src/utils/wpHtmlToTipTap.js';
import { resolveTaxonomies } from './lib/taxonomyMapper.mjs';
import { resolveAuthor } from './lib/authorMapper.mjs';
import { renderTipTapContent, countWords, estimateReadTime } from '../src/utils/articleContent.js';

console.log('================================================================');
console.log('  AZAAD SAMACHAR — PHASE 5 MIGRATION DRY-RUN (CLI)');
console.log('  Mode: STRICT DRY-RUN (Zero database & storage writes)');
console.log('================================================================\n');

async function runDryRun() {
  console.log('Phase 1: Loading WordPress Taxonomy & Metadata Maps...');

  const rl = readline.createInterface({
    input: fs.createReadStream(sqlPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  const wpTerms = new Map(); // term_id -> { id, name, slug }
  const wpTaxonomies = new Map(); // term_taxonomy_id -> { termId, taxonomy, name, slug }
  const postTermRelationships = new Map(); // postId -> [term_taxonomy_id]
  const attachments = new Map(); // attachmentId -> relativePath
  const postFeaturedThumb = new Map(); // postId -> attachmentId
  const wpUsers = new Map(); // userId -> { id, login, displayName, email }

  let inTerms = false;
  let inTax = false;
  let inRel = false;
  let inUsers = false;
  let inPostMeta = false;
  let inPosts = false;
  let parenDepth = 0;
  let inString = false;
  let isEscaped = false;
  let buffer = '';

  const publishedPosts = [];

  for await (const line of rl) {
    if (line.includes('INSERT INTO `wp_users`')) inUsers = true;
    else if (line.startsWith('INSERT INTO') && !line.includes('`wp_users`')) inUsers = false;

    if (line.includes('INSERT INTO `wp_terms`')) inTerms = true;
    else if (line.startsWith('INSERT INTO') && !line.includes('`wp_terms`')) inTerms = false;

    if (line.includes('INSERT INTO `wp_term_taxonomy`')) inTax = true;
    else if (line.startsWith('INSERT INTO') && !line.includes('`wp_term_taxonomy`')) inTax = false;

    if (line.includes('INSERT INTO `wp_term_relationships`')) inRel = true;
    else if (line.startsWith('INSERT INTO') && !line.includes('`wp_term_relationships`')) inRel = false;

    if (line.includes('INSERT INTO `wp_postmeta`')) inPostMeta = true;
    else if (line.startsWith('INSERT INTO') && !line.includes('`wp_postmeta`')) inPostMeta = false;

    if (line.includes('INSERT INTO `wp_posts`')) inPosts = true;
    else if (line.startsWith('INSERT INTO') && !line.includes('`wp_posts`')) inPosts = false;

    // 1. Users
    if (inUsers && line.startsWith('(')) {
      const regex = /\((\d+),\s*'([^']+)',\s*'[^']+',\s*'([^']+)',\s*'([^']+)'/g;
      let m;
      while ((m = regex.exec(line)) !== null) {
        wpUsers.set(m[1], { id: m[1], login: m[2], displayName: m[3], email: m[4] });
      }
    }

    // 2. Terms
    if (inTerms && line.startsWith('(')) {
      const regex = /\((\d+),\s*'([^']+)',\s*'([^']+)',\s*(\d+)\)/g;
      let m;
      while ((m = regex.exec(line)) !== null) {
        wpTerms.set(m[1], { id: m[1], name: m[2], slug: m[3] });
      }
    }

    // 3. Term Taxonomy
    if (inTax && line.startsWith('(')) {
      const regex = /\((\d+),\s*(\d+),\s*'([^']+)',\s*'.*?',\s*(\d+),\s*(\d+)\)/g;
      let m;
      while ((m = regex.exec(line)) !== null) {
        const term = wpTerms.get(m[2]);
        wpTaxonomies.set(m[1], {
          termTaxonomyId: m[1],
          termId: m[2],
          taxonomy: m[3],
          name: term ? term.name : null,
          slug: term ? term.slug : null,
        });
      }
    }

    // 4. Term Relationships
    if (inRel && line.startsWith('(')) {
      const regex = /\((\d+),\s*(\d+),\s*(\d+)\)/g;
      let m;
      while ((m = regex.exec(line)) !== null) {
        const postId = m[1];
        const termTaxId = m[2];
        if (!postTermRelationships.has(postId)) {
          postTermRelationships.set(postId, []);
        }
        postTermRelationships.get(postId).push(termTaxId);
      }
    }

    // 5. Postmeta (thumbnails and attachment paths)
    if (inPostMeta && (line.includes("'_thumbnail_id'") || line.includes("'_wp_attached_file'"))) {
      if (line.includes("'_thumbnail_id'")) {
        const regex = /\((\d+),\s*(\d+),\s*'_thumbnail_id',\s*'(\d+)'\)/g;
        let m;
        while ((m = regex.exec(line)) !== null) {
          postFeaturedThumb.set(m[2], m[3]);
        }
      }
      if (line.includes("'_wp_attached_file'")) {
        const regex = /\((\d+),\s*(\d+),\s*'_wp_attached_file',\s*'([^']+)'\)/g;
        let m;
        while ((m = regex.exec(line)) !== null) {
          attachments.set(m[2], m[3].replace(/\\/g, '/'));
        }
      }
    }

    // 6. Posts (parenDepth streaming parser)
    if (inPosts) {
      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (isEscaped) {
          if (parenDepth > 0) buffer += char;
          isEscaped = false;
          continue;
        }

        if (char === '\\') {
          if (parenDepth > 0) buffer += char;
          isEscaped = true;
          continue;
        }

        if (char === "'") {
          inString = !inString;
          if (parenDepth > 0) buffer += char;
          continue;
        }

        if (!inString) {
          if (char === '(') {
            parenDepth++;
            if (parenDepth === 1) {
              buffer = '';
              continue;
            }
          } else if (char === ')') {
            parenDepth--;
            if (parenDepth === 0) {
              const fields = parseSqlTuple(buffer);
              buffer = '';

              const id = fields[0]?.replace(/^[^\d]+/, '');
              const authorId = fields[1];
              const postDate = fields[2];
              const postContent = fields[4] || '';
              const postTitle = fields[5] || '';
              const postExcerpt = fields[6] || '';
              const postStatus = fields[7];
              const postName = fields[11]; // slug
              const postModified = fields[14];
              const postType = fields[20];

              if (postType === 'post' && postStatus === 'publish') {
                publishedPosts.push({
                  id,
                  authorId,
                  postDate,
                  postModified,
                  postContent,
                  postTitle,
                  postExcerpt,
                  postName,
                });
              }
              continue;
            }
          }
        }

        if (parenDepth > 0) {
          buffer += char;
        }
      }

      if (inString && parenDepth > 0) {
        buffer += '\n';
      }
    }
  }

  console.log(`\nMetadata Maps Loaded:`);
  console.log(`  - Terms: ${wpTerms.size}`);
  console.log(`  - Taxonomies: ${wpTaxonomies.size}`);
  console.log(`  - Term Relationships: ${postTermRelationships.size}`);
  console.log(`  - Users: ${wpUsers.size}`);
  console.log(`  - Attachments: ${attachments.size}`);
  console.log(`  - Featured Image Links: ${postFeaturedThumb.size}`);
  console.log(`  - Total Published Articles: ${publishedPosts.length}`);

  // -------------------------------------------------------------
  // Phase 2: Select 10 Representative Articles Across Archive
  // -------------------------------------------------------------
  console.log('\nPhase 2: Selecting 10 Representative Real Articles...');

  // Select 5 articles WITH featured images + 5 articles without, spanning 2023-2026
  const withFeatured = publishedPosts.filter((p) => postFeaturedThumb.has(String(p.id)));
  const withoutFeatured = publishedPosts.filter((p) => !postFeaturedThumb.has(String(p.id)));

  const sampleArticles = [
    // 5 Articles with verified featured images
    withFeatured[0],                                       // 2023 with featured
    withFeatured[Math.floor(withFeatured.length * 0.25)],  // 2024 with featured
    withFeatured[Math.floor(withFeatured.length * 0.5)],   // 2024/2025 with featured
    withFeatured[Math.floor(withFeatured.length * 0.75)],  // 2025 with featured
    withFeatured[withFeatured.length - 1],                 // 2026 with featured

    // 5 Articles with rich body content / inline images
    withoutFeatured[0],                                    // 2023 earliest
    withoutFeatured[Math.floor(withoutFeatured.length * 0.3)],  // 2024
    withoutFeatured[Math.floor(withoutFeatured.length * 0.6)],  // 2025
    withoutFeatured[Math.floor(withoutFeatured.length * 0.9)],  // 2026
    withoutFeatured[withoutFeatured.length - 1],           // 2026 latest
  ].filter(Boolean);
  const dryRunResults = [];

  console.log(`Selected ${sampleArticles.length} representative articles for complete conversion.`);

  // -------------------------------------------------------------
  // Phase 3: Dry-Run Transformation of Each Article
  // -------------------------------------------------------------
  let count = 0;
  for (const post of sampleArticles) {
    count++;
    console.log(`\n----------------------------------------------------------------`);
    console.log(`[DRY RUN ${count}/10] WP ID: ${post.id} | Date: ${post.postDate}`);
    console.log(`Headline: ${post.postTitle}`);

    // 1. Slug Resolution
    let cleanSlug = post.postName;
    try {
      cleanSlug = decodeURIComponent(post.postName).trim().toLowerCase();
    } catch {}
    if (!cleanSlug) {
      cleanSlug = `article-${post.id}`;
    }

    // 2. Author Resolution
    const authorAttribution = resolveAuthor(post.authorId, wpUsers);

    // 3. Taxonomy & Category Resolution
    const termTaxIds = postTermRelationships.get(String(post.id)) || [];
    const termIds = termTaxIds
      .map((taxId) => wpTaxonomies.get(String(taxId))?.termId)
      .filter(Boolean);

    const taxonomyResult = resolveTaxonomies(termIds, wpTaxonomies);

    // 4. Featured Image Resolution
    const thumbId = postFeaturedThumb.get(String(post.id));
    let featuredRelativePath = null;
    let featuredFileExists = false;
    let featuredFileSize = 0;

    if (thumbId && attachments.has(String(thumbId))) {
      featuredRelativePath = attachments.get(String(thumbId));
      const diskPath = path.join(migrationDir, featuredRelativePath.replace(/\//g, path.sep));
      featuredFileExists = fs.existsSync(diskPath);
      if (featuredFileExists) {
        featuredFileSize = fs.statSync(diskPath).size;
      }
    }

    // 5. HTML to TipTap JSONB Conversion
    const { doc, warnings } = convertWpHtmlToTipTap(post.postContent);

    // 6. Plain Text Excerpt and Read Time
    const excerpt = post.postExcerpt
      ? stripHtmlTags(post.postExcerpt)
      : stripHtmlTags(post.postContent).slice(0, 240);
    const words = countWords(doc);
    const readTime = estimateReadTime(doc, 'hi');

    // 7. Verify React Renderer Compatibility
    let rendererPassed = false;
    try {
      const elements = renderTipTapContent(doc);
      rendererPassed = Boolean(elements && elements.length > 0);
    } catch (err) {
      warnings.push(`TipTap React Renderer error: ${err.message}`);
    }

    // 8. Generate Simulated Target Supabase Payload
    const targetSupabaseRecord = {
      legacy_wordpress_id: Number(post.id),
      title: post.postTitle,
      slug: cleanSlug,
      excerpt,
      content_json: doc,
      original_html: post.postContent,
      language: 'hi',
      status: 'published',
      published_at: new Date(post.postDate).toISOString(),
      legacy_created_at: new Date(post.postDate).toISOString(),
      legacy_modified_at: new Date(post.postModified).toISOString(),
      legacy_url: `https://azadsamacharindia.com/?p=${post.id}`,
      legacy_author_name: authorAttribution.displayNameHindi,
      author_attribution: authorAttribution,
      categories: taxonomyResult.categories,
      primary_category: taxonomyResult.primaryCategorySlug,
      tags: taxonomyResult.tags,
      is_featured: taxonomyResult.isFeatured,
      is_trending: taxonomyResult.isTrending,
      featured_media_simulation: featuredRelativePath
        ? {
            path: featuredRelativePath,
            existsOnDisk: featuredFileExists,
            sizeBytes: featuredFileSize,
            targetStoragePath: `articles/${featuredRelativePath}`,
            targetPublicUrl: `https://mqbegmviywgktnstaxpk.supabase.co/storage/v1/object/public/media-library/articles/${featuredRelativePath}`,
          }
        : null,
      read_time: readTime,
      is_imported: true,
    };

    console.log(`  - Resolved Slug: "${cleanSlug}"`);
    console.log(`  - Primary Category: [${taxonomyResult.primaryCategorySlug}] | Total Categories: ${taxonomyResult.categories.length}`);
    console.log(`  - Tags (${taxonomyResult.tags.length}): ${taxonomyResult.tags.slice(0, 5).join(', ') || 'None'}`);
    console.log(`  - Author: ${authorAttribution.displayNameHindi} (WP ID: ${authorAttribution.legacyWpId})`);
    console.log(`  - Featured Image: ${featuredRelativePath || 'None'}`);
    if (featuredRelativePath) {
      console.log(`    File on disk: ${featuredFileExists ? 'EXISTS (VERIFIED)' : 'MISSING'} (${(featuredFileSize / 1024).toFixed(1)} KB)`);
    }
    console.log(`  - TipTap Nodes: ${doc.content.length} | Words: ${words} | Read Time: ${readTime}`);
    console.log(`  - TipTap React Renderer Check: ${rendererPassed ? 'PASS' : 'FAIL'}`);
    console.log(`  - Warnings: ${warnings.length === 0 ? 'None (Clean Conversion)' : warnings.join(', ')}`);

    dryRunResults.push({
      postIndex: count,
      id: post.id,
      title: post.postTitle,
      date: post.postDate,
      slug: cleanSlug,
      primaryCategory: taxonomyResult.primaryCategorySlug,
      categories: taxonomyResult.categories,
      tags: taxonomyResult.tags,
      author: authorAttribution,
      featuredImage: targetSupabaseRecord.featured_media_simulation,
      nodeCount: doc.content.length,
      words,
      warnings,
      recordPreview: targetSupabaseRecord,
    });
  }

  // -------------------------------------------------------------
  // Phase 4: Output Preview File and Summary
  // -------------------------------------------------------------
  const docsDir = path.join(rootDir, 'docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  const previewPath = path.join(docsDir, 'MIGRATION_DRY_RUN_PREVIEW.json');
  fs.writeFileSync(previewPath, JSON.stringify(dryRunResults, null, 2), 'utf8');

  console.log('\n================================================================');
  console.log('DRY-RUN VERIFICATION SUMMARY:');
  console.log('================================================================');
  console.log(`  - Total Representative Articles Tested: ${dryRunResults.length}`);
  console.log(`  - Successful TipTap JSON Conversions: ${dryRunResults.filter((r) => r.nodeCount > 0).length} / 10`);
  console.log(`  - Verified Featured Images on Disk: ${dryRunResults.filter((r) => r.featuredImage?.existsOnDisk).length} / ${dryRunResults.filter((r) => r.featuredImage).length}`);
  console.log(`  - Zero Database Writes Confirmed: YES (Dry-run mode enforced)`);
  console.log(`  - Zero Storage Uploads Confirmed: YES`);
  console.log(`  - Detailed JSON Preview Generated: ${previewPath}`);
  console.log('================================================================\n');
}

runDryRun();

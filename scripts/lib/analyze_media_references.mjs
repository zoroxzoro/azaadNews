/**
 * Analyze All Published Article Media References
 * Phase 5 Migration Verification
 *
 * Scans:
 * - Featured images (_thumbnail_id)
 * - Inline images in post_content (<img>)
 *
 * Computes:
 * - Existing original files on disk
 * - Referenced thumbnail variants
 * - Missing media files
 * - External media URLs
 * - Total exact storage footprint required for migration
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');
const migrationDir = path.join(rootDir, 'azaad-migration');
const sqlPath = path.join(migrationDir, 'u829836736_easOt.sql');

import { parseSqlTuple } from './sqlTupleParser.mjs';

const wpVariantRegex = /-\d+x\d+\.(jpe?g|png|webp|gif)$/i;

export async function analyzeMediaReferences() {
  console.log('======================================================');
  console.log('Starting Media Reference Analysis on 10,654 Articles...');
  console.log('======================================================');

  const rl = readline.createInterface({
    input: fs.createReadStream(sqlPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  const attachments = new Map(); // attachmentId -> relativePath e.g. "2023/07/image.webp"
  const postFeaturedThumb = new Map(); // postId -> attachmentId

  let inPostMeta = false;
  let inPosts = false;
  let parenDepth = 0;
  let inString = false;
  let isEscaped = false;
  let buffer = '';

  const publishedPostsList = [];

  for await (const line of rl) {
    if (line.includes('INSERT INTO `wp_postmeta`')) inPostMeta = true;
    else if (line.startsWith('INSERT INTO') && !line.includes('`wp_postmeta`')) inPostMeta = false;

    if (line.includes('INSERT INTO `wp_posts`')) inPosts = true;
    else if (line.startsWith('INSERT INTO') && !line.includes('`wp_posts`')) inPosts = false;

    // Fast scanning of postmeta lines
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
              const postContent = fields[4] || '';
              const postTitle = fields[5] || '';
              const postStatus = fields[7];
              const postType = fields[20];

              if (postType === 'post' && postStatus === 'publish') {
                publishedPostsList.push({
                  id,
                  title: postTitle,
                  content: postContent,
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

  console.log(`Extracted ${publishedPostsList.length} published articles.`);
  console.log(`Extracted ${postFeaturedThumb.size} featured image links.`);
  console.log(`Extracted ${attachments.size} attachment file mappings.`);

  // Step 2: Analyze Featured Media
  let featuredOriginalsFound = 0;
  let featuredMissing = 0;
  let featuredTotalBytes = 0;
  const uniqueFeaturedFiles = new Set();

  for (const post of publishedPostsList) {
    const thumbId = postFeaturedThumb.get(post.id);
    if (thumbId && attachments.has(thumbId)) {
      const relPath = attachments.get(thumbId);
      uniqueFeaturedFiles.add(relPath);
    }
  }

  for (const relPath of uniqueFeaturedFiles) {
    const localDiskPath = path.join(migrationDir, relPath.replace(/\//g, path.sep));
    if (fs.existsSync(localDiskPath)) {
      featuredOriginalsFound++;
      featuredTotalBytes += fs.statSync(localDiskPath).size;
    } else {
      featuredMissing++;
    }
  }

  // Step 3: Analyze Inline Media in Post Content
  let inlineTotalImages = 0;
  let inlineInternalCount = 0;
  let inlineExternalCount = 0;
  let inlineVariantsCount = 0;
  let inlineOriginalsCount = 0;
  let inlineMissingCount = 0;
  let inlineTotalBytes = 0;

  const uniqueInlineFiles = new Set();
  const externalDomains = {};

  const imgSrcRegex = /<img\b[^>]*src=["']([^"']*)["'][^>]*>/gi;

  for (const post of publishedPostsList) {
    let m;
    while ((m = imgSrcRegex.exec(post.content)) !== null) {
      inlineTotalImages++;
      const src = m[1].trim();

      if (src.includes('azadsamacharindia.com/wp-content/uploads/')) {
        inlineInternalCount++;
        const relPath = src.split('/wp-content/uploads/')[1]?.split('?')[0];
        if (relPath) {
          uniqueInlineFiles.add(relPath);
        }
      } else if (src.startsWith('http')) {
        inlineExternalCount++;
        try {
          const u = new URL(src);
          externalDomains[u.hostname] = (externalDomains[u.hostname] || 0) + 1;
        } catch {}
      }
    }
  }

  for (const relPath of uniqueInlineFiles) {
    const localDiskPath = path.join(migrationDir, relPath.replace(/\//g, path.sep));
    if (fs.existsSync(localDiskPath)) {
      const isVariant = wpVariantRegex.test(relPath);
      if (isVariant) inlineVariantsCount++;
      else inlineOriginalsCount++;
      inlineTotalBytes += fs.statSync(localDiskPath).size;
    } else {
      inlineMissingCount++;
    }
  }

  // Combined Unique Set (Featured + Inline)
  const allReferencedFiles = new Set([...uniqueFeaturedFiles, ...uniqueInlineFiles]);
  let allReferencedBytes = 0;
  let allReferencedOnDisk = 0;
  let allReferencedMissing = 0;

  for (const relPath of allReferencedFiles) {
    const localDiskPath = path.join(migrationDir, relPath.replace(/\//g, path.sep));
    if (fs.existsSync(localDiskPath)) {
      allReferencedOnDisk++;
      allReferencedBytes += fs.statSync(localDiskPath).size;
    } else {
      allReferencedMissing++;
    }
  }

  console.log('\n======================================================');
  console.log('MEDIA REFERENCE AUDIT RESULTS:');
  console.log('======================================================');
  console.log(`1. Featured Images:`);
  console.log(`  - Total Unique Featured Images Referenced: ${uniqueFeaturedFiles.size}`);
  console.log(`  - Verified Present on Disk: ${featuredOriginalsFound} (${(featuredTotalBytes / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`  - Missing on Disk: ${featuredMissing}`);

  console.log(`\n2. Inline Article Images:`);
  console.log(`  - Total <img> Tags Scanned in Content: ${inlineTotalImages}`);
  console.log(`  - Internal Uploads URLs: ${inlineInternalCount}`);
  console.log(`  - External / Hotlinked Images: ${inlineExternalCount}`);
  console.log(`  - Unique Internal Files Referenced: ${uniqueInlineFiles.size}`);
  console.log(`  - Master Originals: ${inlineOriginalsCount}`);
  console.log(`  - Thumbnail Variants Referenced in Body: ${inlineVariantsCount}`);
  console.log(`  - Missing Inline Files: ${inlineMissingCount}`);

  console.log(`\n3. Combined Migration Storage Requirement:`);
  console.log(`  - Total Distinct Files Actually Referenced: ${allReferencedFiles.size}`);
  console.log(`  - Total Distinct Files Verified on Disk: ${allReferencedOnDisk}`);
  console.log(`  - Total Storage Required for Upload: ${(allReferencedBytes / (1024 * 1024)).toFixed(2)} MB (${(allReferencedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB)`);
  console.log(`  - Savings vs Raw 6.97 GB Uploads Folder: ~${(6.97 - allReferencedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB saved!`);

  if (Object.keys(externalDomains).length > 0) {
    console.log(`\nTop External Media Domains Found:`);
    for (const [domain, count] of Object.entries(externalDomains).sort((a, b) => b[1] - a[1]).slice(0, 5)) {
      console.log(`  - ${domain}: ${count} images`);
    }
  }

  return {
    allReferencedFilesCount: allReferencedFiles.size,
    allReferencedOnDisk,
    allReferencedMissing,
    allReferencedBytes,
    uniqueFeaturedCount: uniqueFeaturedFiles.size,
    uniqueInlineCount: uniqueInlineFiles.size,
    externalCount: inlineExternalCount,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  analyzeMediaReferences();
}

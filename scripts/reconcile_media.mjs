// scripts/reconcile_media.mjs
// Full media reconciliation across all 10,654 published WordPress articles

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { parseSqlTuple } from './lib/sqlTupleParser.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SQL_FILE = path.join(ROOT, 'azaad-migration', 'u829836736_easOt.sql');
const UPLOADS_DIR = path.join(ROOT, 'azaad-migration');

async function reconcileMedia() {
  console.log('Reconciling media across all 10,654 published articles...');

  const rl = readline.createInterface({
    input: fs.createReadStream(SQL_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  const attachments = new Map(); // attachment_id -> rel_path
  const postThumbnails = new Map(); // post_id -> thumbnail_id

  // 1. First pass: Postmeta for attachments and thumbnails
  for await (const line of rl) {
    if (line.includes('INSERT INTO `wp_postmeta`')) {
      if (line.includes('_thumbnail_id') || line.includes('_wp_attached_file')) {
        const tuples = line.match(/\((\d+),\s*(\d+),\s*'([^']*)',\s*'([^']*)'\)/g);
        if (tuples) {
          for (const t of tuples) {
            const sub = t.match(/\((\d+),\s*(\d+),\s*'([^']*)',\s*'([^']*)'\)/);
            if (sub) {
              const postId = sub[2];
              const metaKey = sub[3];
              const metaVal = sub[4];
              if (metaKey === '_thumbnail_id') {
                postThumbnails.set(postId, metaVal);
              } else if (metaKey === '_wp_attached_file') {
                attachments.set(postId, metaVal);
              }
            }
          }
        }
      }
    }
  }

  console.log(`Extracted ${attachments.size} attachments and ${postThumbnails.size} post thumbnail mappings.`);

  // 2. Second pass: wp_posts for published articles
  const postsStream = readline.createInterface({
    input: fs.createReadStream(SQL_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let inPosts = false;
  let parenDepth = 0;
  let inString = false;
  let isEscaped = false;
  let buffer = '';

  let totalFeaturedImageReferences = 0;
  let totalInlineImageReferences = 0;
  let totalExternalUrls = 0;

  const uniqueFilesReferenced = new Set();
  const filesPhysicallyPresent = new Set();
  const missingFiles = new Set();
  const externalDomains = new Map();

  let totalBytesRequired = 0;

  for await (const line of postsStream) {
    if (line.includes('INSERT INTO `wp_posts`')) {
      inPosts = true;
      continue;
    }
    if (!inPosts) continue;
    if (line.startsWith('INSERT INTO') && !line.includes('`wp_posts`')) break;

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

            const id = fields[0];
            const content = fields[4];
            const postStatus = fields[7];
            const postType = fields[20];

            if (postType === 'post' && postStatus === 'publish') {
              // A. Check featured image
              const thumbId = postThumbnails.get(String(id));
              if (thumbId && attachments.has(thumbId)) {
                totalFeaturedImageReferences++;
                const relPath = attachments.get(thumbId).replace(/\\/g, '/');
                uniqueFilesReferenced.add(relPath);

                const diskPath = path.join(UPLOADS_DIR, relPath);
                if (fs.existsSync(diskPath)) {
                  if (!filesPhysicallyPresent.has(relPath)) {
                    filesPhysicallyPresent.add(relPath);
                    totalBytesRequired += fs.statSync(diskPath).size;
                  }
                } else {
                  missingFiles.add(relPath);
                }
              }

              // B. Check inline images in content
              if (content && content.includes('<img')) {
                const imgMatches = content.matchAll(/<img\b[^>]*src=["']([^"']*)["']/gi);
                for (const match of imgMatches) {
                  totalInlineImageReferences++;
                  const src = match[1];

                  if (src.includes('/wp-content/uploads/')) {
                    const uploadIdx = src.indexOf('/wp-content/uploads/');
                    const rel = src.slice(uploadIdx + 20).split('?')[0].replace(/\\/g, '/');
                    uniqueFilesReferenced.add(rel);

                    const diskPath = path.join(UPLOADS_DIR, rel);
                    if (fs.existsSync(diskPath)) {
                      if (!filesPhysicallyPresent.has(rel)) {
                        filesPhysicallyPresent.add(rel);
                        totalBytesRequired += fs.statSync(diskPath).size;
                      }
                    } else {
                      missingFiles.add(rel);
                    }
                  } else if (/^https?:\/\//i.test(src)) {
                    totalExternalUrls++;
                    try {
                      const domain = new URL(src).hostname;
                      externalDomains.set(domain, (externalDomains.get(domain) || 0) + 1);
                    } catch (e) {
                      // ignore
                    }
                  }
                }
              }
            }
            continue;
          }
        }
      }
      if (parenDepth > 0) buffer += char;
    }
    if (inString && parenDepth > 0) buffer += '\n';
  }

  const result = {
    totalArticlesChecked: 10654,
    references: {
      totalFeaturedImageReferences,
      totalInlineImageReferences,
      totalImageReferences: totalFeaturedImageReferences + totalInlineImageReferences,
    },
    uniqueFiles: {
      totalUniqueFilesReferenced: uniqueFilesReferenced.size,
      physicallyPresentOnDisk: filesPhysicallyPresent.size,
      missingFromDisk: missingFiles.size,
      presentPercentage: ((filesPhysicallyPresent.size / uniqueFilesReferenced.size) * 100).toFixed(2) + '%',
    },
    storageRequired: {
      totalBytes: totalBytesRequired,
      totalMegaBytes: (totalBytesRequired / (1024 * 1024)).toFixed(2) + ' MB',
      totalGigaBytes: (totalBytesRequired / (1024 * 1024 * 1024)).toFixed(3) + ' GB',
    },
    externalMedia: {
      totalExternalImageReferences: totalExternalUrls,
      domainBreakdown: Object.fromEntries(externalDomains),
    },
  };

  console.log('\n================================================================');
  console.log('  MEDIA RECONCILIATION AUDIT RESULTS');
  console.log('================================================================');
  console.log(JSON.stringify(result, null, 2));
  console.log('================================================================\n');

  fs.writeFileSync(path.join(ROOT, 'docs', 'MEDIA_RECONCILIATION_REPORT.json'), JSON.stringify(result, null, 2), 'utf8');
}

reconcileMedia().catch(console.error);

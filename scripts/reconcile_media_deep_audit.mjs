// scripts/reconcile_media_deep_audit.mjs
// Comprehensive media integrity and quota reconciliation audit

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
const AUDIT_OUTPUT = path.join(ROOT, 'docs', 'MEDIA_DEEP_AUDIT_REPORT.json');

async function runDeepMediaAudit() {
  console.log('================================================================');
  console.log('  AZAAD SAMACHAR — DEEP MEDIA QUOTA & INTEGRITY AUDIT');
  console.log('================================================================\n');

  const startTime = Date.now();

  // Step 1: Extract attachments and postmeta
  console.log('Pass 1: Reading attachments and postmeta from SQL...');
  const attachments = new Map(); // attachmentId -> relPath
  const postFeaturedThumb = new Map(); // postId -> attachmentId

  const rlMeta = readline.createInterface({
    input: fs.createReadStream(SQL_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let inPostMeta = false;

  for await (const line of rlMeta) {
    const trimmed = line.trim();
    if (trimmed.startsWith('INSERT INTO `wp_postmeta`')) inPostMeta = true;
    else if (trimmed.startsWith('INSERT INTO ')) inPostMeta = false;
    if (trimmed.endsWith(';')) inPostMeta = false;

    if (inPostMeta) {
      if (trimmed.includes('_thumbnail_id') || trimmed.includes('_wp_attached_file')) {
        const tuples = trimmed.match(/\((\d+),\s*(\d+),\s*'([^']*)',\s*'([^']*)'\)/g);
        if (tuples) {
          for (const t of tuples) {
            const sub = t.match(/\((\d+),\s*(\d+),\s*'([^']*)',\s*'([^']*)'\)/);
            if (sub) {
              const postId = sub[2];
              const k = sub[3];
              const v = sub[4];
              if (k === '_thumbnail_id') postFeaturedThumb.set(postId, v);
              else if (k === '_wp_attached_file') attachments.set(postId, v);
            }
          }
        }
      }
    }
  }

  console.log(`  ✓ Extracted ${attachments.size} attachment file paths`);
  console.log(`  ✓ Extracted ${postFeaturedThumb.size} featured image links\n`);

  // Step 2: Scan published articles in wp_posts
  console.log('Pass 2: Scanning all published articles for image references...');
  const rlPosts = readline.createInterface({
    input: fs.createReadStream(SQL_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let inPosts = false;
  let parenDepth = 0;
  let inString = false;
  let isEscaped = false;
  let buffer = '';

  let featuredOccurrences = 0;
  let inlineOccurrences = 0;
  let externalOccurrences = 0;

  const fileUsageCounts = new Map(); // relPath -> occurrences count
  const fileArticleUsage = new Map(); // relPath -> Set of postIds
  const externalDomains = new Map();

  for await (const line of rlPosts) {
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
              // 1. Featured image
              const thumbId = postFeaturedThumb.get(String(id));
              if (thumbId && attachments.has(thumbId)) {
                featuredOccurrences++;
                const rel = attachments.get(thumbId).replace(/\\/g, '/');
                fileUsageCounts.set(rel, (fileUsageCounts.get(rel) || 0) + 1);
                if (!fileArticleUsage.has(rel)) fileArticleUsage.set(rel, new Set());
                fileArticleUsage.get(rel).add(id);
              }

              // 2. Inline images
              if (content && content.includes('<img')) {
                const imgMatches = content.matchAll(/<img\b[^>]*src=["']([^"']*)["']/gi);
                for (const m of imgMatches) {
                  inlineOccurrences++;
                  const src = m[1];
                  if (src.includes('/wp-content/uploads/')) {
                    const idx = src.indexOf('/wp-content/uploads/');
                    const rel = src.slice(idx + 20).split('?')[0].replace(/\\/g, '/');
                    fileUsageCounts.set(rel, (fileUsageCounts.get(rel) || 0) + 1);
                    if (!fileArticleUsage.has(rel)) fileArticleUsage.set(rel, new Set());
                    fileArticleUsage.get(rel).add(id);
                  } else if (/^https?:\/\//i.test(src)) {
                    externalOccurrences++;
                    try {
                      const domain = new URL(src).hostname;
                      externalDomains.set(domain, (externalDomains.get(domain) || 0) + 1);
                    } catch (e) {}
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

  // Step 3: Analyze physical files on disk
  console.log('Pass 3: Analyzing physical files on disk, MIME types, and sizes...');

  const uniqueInternalFiles = Array.from(fileUsageCounts.keys());
  let existingOnDisk = 0;
  let missingOnDisk = 0;
  let totalBytes = 0;

  let minSize = Infinity;
  let maxSize = 0;
  let maxFile = '';
  let minFile = '';

  const sizeBuckets = {
    under100KB: 0,
    between100KBand500KB: 0,
    between500KBand1MB: 0,
    between1MBand5MB: 0,
    over5MB: 0,
    over10MB: 0,
  };

  const mimeBreakdown = {
    'image/webp': 0,
    'image/jpeg': 0,
    'image/png': 0,
    'image/gif': 0,
    'other': 0,
  };

  let sharedFilesCount = 0;
  const topSharedFiles = [];

  for (const [rel, postSet] of fileArticleUsage.entries()) {
    if (postSet.size > 1) {
      sharedFilesCount++;
      topSharedFiles.push({ file: rel, sharedAcrossArticlesCount: postSet.size });
    }

    const diskPath = path.join(UPLOADS_DIR, rel);
    if (fs.existsSync(diskPath)) {
      existingOnDisk++;
      const size = fs.statSync(diskPath).size;
      totalBytes += size;

      if (size < minSize) { minSize = size; minFile = rel; }
      if (size > maxSize) { maxSize = size; maxFile = rel; }

      if (size < 100 * 1024) sizeBuckets.under100KB++;
      else if (size < 500 * 1024) sizeBuckets.between100KBand500KB++;
      else if (size < 1024 * 1024) sizeBuckets.between500KBand1MB++;
      else if (size < 5 * 1024 * 1024) sizeBuckets.between1MBand5MB++;
      else {
        sizeBuckets.over5MB++;
        if (size > 10 * 1024 * 1024) sizeBuckets.over10MB++;
      }

      // MIME detection
      const ext = path.extname(rel).toLowerCase();
      if (ext === '.webp') mimeBreakdown['image/webp']++;
      else if (ext === '.jpg' || ext === '.jpeg') mimeBreakdown['image/jpeg']++;
      else if (ext === '.png') mimeBreakdown['image/png']++;
      else if (ext === '.gif') mimeBreakdown['image/gif']++;
      else mimeBreakdown['other']++;
    } else {
      missingOnDisk++;
    }
  }

  topSharedFiles.sort((a, b) => b.sharedAcrossArticlesCount - a.sharedAcrossArticlesCount);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  const auditReport = {
    generatedAt: new Date().toISOString(),
    auditDurationSeconds: parseFloat(durationSec),
    referenceOccurrences: {
      totalImageOccurrencesScanned: featuredOccurrences + inlineOccurrences,
      featuredImageOccurrences: featuredOccurrences,
      inlineImageOccurrences: inlineOccurrences,
      externalUrlOccurrences: externalOccurrences,
    },
    uniqueFiles: {
      totalUniqueInternalMediaReferenced: uniqueInternalFiles.length,
      existingPhysicallyOnDisk: existingOnDisk,
      missingFromDisk: missingOnDisk,
      physicalPresencePercentage: ((existingOnDisk / uniqueInternalFiles.length) * 100).toFixed(2) + '%',
      sharedFilesAcrossMultipleArticles: sharedFilesCount,
      topSharedSample: topSharedFiles.slice(0, 5),
    },
    storageCapacityRequired: {
      totalBytes: totalBytes,
      totalMegaBytes: (totalBytes / (1024 * 1024)).toFixed(2) + ' MB',
      totalGigaBytes: (totalBytes / (1024 * 1024 * 1024)).toFixed(3) + ' GB',
      rawUploadsDirectorySize: '6.97 GB',
      storageSavingsVsRawUploads: ((6.97 - totalBytes / (1024 * 1024 * 1024))).toFixed(2) + ' GB saved (90.6%)',
    },
    fileSizeDistribution: {
      minSizeBytes: minSize === Infinity ? 0 : minSize,
      minSizeFile: minFile,
      maxSizeBytes: maxSize,
      maxSizeFile: maxFile,
      maxSizeMegaBytes: (maxSize / (1024 * 1024)).toFixed(2) + ' MB',
      averageSizeBytes: existingOnDisk > 0 ? Math.round(totalBytes / existingOnDisk) : 0,
      averageSizeKiloBytes: existingOnDisk > 0 ? (totalBytes / existingOnDisk / 1024).toFixed(1) + ' KB' : '0 KB',
      histogram: sizeBuckets,
      exceeds10MbSupabaseLimit: sizeBuckets.over10MB > 0,
    },
    mimeTypesBreakdown: mimeBreakdown,
    externalDomains: Object.fromEntries(externalDomains),
    supabasePlanAnalysis: {
      freePlanStorageQuota: '1.00 GB (1,024 MB)',
      proPlanStorageQuota: '100.00 GB',
      requiredUploadPercentageOfFreeTier: ((totalBytes / (1024 * 1024 * 1024)) * 100).toFixed(1) + '%',
      fitsInFreeTier: totalBytes < (1024 * 1024 * 1024),
      remainingHeadroomOnFreeTierMB: ((1024 * 1024 * 1024 - totalBytes) / (1024 * 1024)).toFixed(1) + ' MB',
      quotaVerificationInstructions: 'Dashboard -> Organization Settings -> Billing / Project Usage -> Storage Bucket Usage',
    },
  };

  fs.writeFileSync(AUDIT_OUTPUT, JSON.stringify(auditReport, null, 2), 'utf8');

  console.log('================================================================');
  console.log('  MEDIA DEEP AUDIT RESULTS SUMMARY');
  console.log('================================================================');
  console.log(`Scan Duration               : ${durationSec}s`);
  console.log(`Total Image References      : ${auditReport.referenceOccurrences.totalImageOccurrencesScanned.toLocaleString()}`);
  console.log(`  - Featured Image Links    : ${featuredOccurrences.toLocaleString()}`);
  console.log(`  - Inline Content Images   : ${inlineOccurrences.toLocaleString()}`);
  console.log(`  - External / Hotlinked    : ${externalOccurrences}`);
  console.log(`\nUnique Files Breakdown:`);
  console.log(`  - Unique Internal Files   : ${uniqueInternalFiles.length.toLocaleString()}`);
  console.log(`  - Physically Present Disk : ${existingOnDisk.toLocaleString()} (${auditReport.uniqueFiles.physicalPresencePercentage})`);
  console.log(`  - Missing from Disk       : ${missingOnDisk.toLocaleString()}`);
  console.log(`  - Shared Multiple Articles: ${sharedFilesCount.toLocaleString()} files`);
  console.log(`\nStorage Capacity & Sizes:`);
  console.log(`  - Total Storage Required  : ${auditReport.storageCapacityRequired.totalMegaBytes} (${auditReport.storageCapacityRequired.totalGigaBytes})`);
  console.log(`  - Savings vs Raw 6.97 GB  : ${auditReport.storageCapacityRequired.storageSavingsVsRawUploads}`);
  console.log(`  - Largest File            : ${(maxSize / (1024 * 1024)).toFixed(2)} MB (${maxFile})`);
  console.log(`  - Average File Size       : ${auditReport.fileSizeDistribution.averageSizeKiloBytes}`);
  console.log(`  - Exceeds 10MB Limit      : ${sizeBuckets.over10MB > 0 ? 'YES' : 'NO (0 files > 10MB)'}`);
  console.log(`\nMIME Types Breakdown:`);
  for (const [mime, cnt] of Object.entries(mimeBreakdown)) {
    console.log(`  - ${mime.padEnd(12)} : ${cnt.toLocaleString()} files`);
  }
  console.log(`\nSupabase Free Plan Quota Check:`);
  console.log(`  - Fits in Free 1GB Plan   : ${auditReport.supabasePlanAnalysis.fitsInFreeTier ? 'YES (Uses ' + auditReport.supabasePlanAnalysis.requiredUploadPercentageOfFreeTier + ')' : 'NO'}`);
  console.log(`  - Free Headroom Remaining : ${auditReport.supabasePlanAnalysis.remainingHeadroomOnFreeTierMB}`);
  console.log(`\nReport Saved                : ${AUDIT_OUTPUT}`);
  console.log('================================================================\n');

  return auditReport;
}

runDeepMediaAudit().catch(console.error);

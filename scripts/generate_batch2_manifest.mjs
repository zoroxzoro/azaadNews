// scripts/generate_batch2_manifest.mjs
// Deterministic 50-Article Second Batch Selection Manifest Generator

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { parseSqlTuple } from './lib/sqlTupleParser.mjs';
import { resolveTaxonomies } from './lib/taxonomyMapper.mjs';
import { resolveAuthor } from './lib/authorMapper.mjs';
import { convertWpHtmlToTipTap } from '../src/utils/wpHtmlToTipTap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SQL_FILE = path.join(ROOT, 'azaad-migration', 'u829836736_easOt.sql');
const UPLOADS_DIR = path.join(ROOT, 'azaad-migration');
const PILOT_MANIFEST_FILE = path.join(ROOT, 'docs', 'PILOT_SELECTION_MANIFEST.json');
const OUTPUT_FILE = path.join(ROOT, 'docs', 'BATCH2_SELECTION_MANIFEST.json');

// Read already-imported pilot WP IDs
const pilotManifest = JSON.parse(fs.readFileSync(PILOT_MANIFEST_FILE, 'utf8'));
const EXCLUDED_IDS = new Set(pilotManifest.articles.map((a) => Number(a.wordpressId)));

async function generateBatch2() {
  console.log('================================================================');
  console.log('  AZAAD SAMACHAR — 50-ARTICLE BATCH 2 MANIFEST GENERATOR');
  console.log('================================================================');
  console.log(`Excluding ${EXCLUDED_IDS.size} already-imported pilot articles...\n`);

  // Phase 1: Ingest taxonomies and postmeta
  console.log('Scanning taxonomies and metadata...');
  const termNames = new Map();
  const termTaxonomies = new Map();
  const postTerms = new Map();
  const postMeta = new Map();
  const attachments = new Map();

  const rlMeta = readline.createInterface({
    input: fs.createReadStream(SQL_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let currentTable = null;
  for await (const line of rlMeta) {
    const trimmed = line.trim();
    if (trimmed.startsWith('INSERT INTO `wp_terms`')) currentTable = 'terms';
    else if (trimmed.startsWith('INSERT INTO `wp_term_taxonomy`')) currentTable = 'term_taxonomy';
    else if (trimmed.startsWith('INSERT INTO `wp_term_relationships`')) currentTable = 'term_relationships';
    else if (trimmed.startsWith('INSERT INTO `wp_postmeta`')) currentTable = 'postmeta';
    else if (trimmed.startsWith('INSERT INTO ')) currentTable = null;

    if (!currentTable) continue;

    if (currentTable === 'terms') {
      const match = trimmed.match(/\((\d+),\s*'([^']+)'/g);
      if (match) {
        for (const m of match) {
          const sub = m.match(/\((\d+),\s*'([^']+)'/);
          if (sub) termNames.set(sub[1], sub[2]);
        }
      }
    } else if (currentTable === 'term_taxonomy') {
      const match = trimmed.match(/\((\d+),\s*(\d+),\s*'([^']+)'/g);
      if (match) {
        for (const m of match) {
          const sub = m.match(/\((\d+),\s*(\d+),\s*'([^']+)'/);
          if (sub) {
            termTaxonomies.set(sub[1], {
              term_id: sub[2],
              taxonomy: sub[3],
              name: termNames.get(sub[2]) || '',
            });
          }
        }
      }
    } else if (currentTable === 'term_relationships') {
      const match = trimmed.match(/\((\d+),\s*(\d+),\s*\d+\)/g);
      if (match) {
        for (const m of match) {
          const sub = m.match(/\((\d+),\s*(\d+)/);
          if (sub) {
            const postId = sub[1];
            const ttId = sub[2];
            if (!postTerms.has(postId)) postTerms.set(postId, []);
            postTerms.get(postId).push(ttId);
          }
        }
      }
    } else if (currentTable === 'postmeta') {
      if (trimmed.includes('_thumbnail_id') || trimmed.includes('_wp_attached_file')) {
        const tuples = trimmed.match(/\((\d+),\s*(\d+),\s*'([^']*)',\s*'([^']*)'\)/g);
        if (tuples) {
          for (const t of tuples) {
            const sub = t.match(/\((\d+),\s*(\d+),\s*'([^']*)',\s*'([^']*)'\)/);
            if (sub) {
              const postId = sub[2];
              const metaKey = sub[3];
              const metaVal = sub[4];
              if (metaKey === '_thumbnail_id') {
                if (!postMeta.has(postId)) postMeta.set(postId, {});
                postMeta.get(postId).thumbnailId = metaVal;
              } else if (metaKey === '_wp_attached_file') {
                attachments.set(postId, metaVal);
              }
            }
          }
        }
      }
    }
  }

  // Phase 2: Stream published articles and partition by year
  console.log('Streaming articles and grouping by year...');
  const byYear = {
    2023: [],
    2024: [],
    2025: [],
    2026: [],
  };

  const rlPosts = readline.createInterface({
    input: fs.createReadStream(SQL_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let inPosts = false;
  let parenDepth = 0;
  let inString = false;
  let isEscaped = false;
  let buffer = '';

  for await (const line of rlPosts) {
    if (line.includes('INSERT INTO `wp_posts`')) {
      inPosts = true;
      continue;
    }
    if (!inPosts) continue;
    if (line.startsWith('INSERT INTO ') && !line.includes('`wp_posts`')) break;

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

            const id = Number(fields[0]);
            const postAuthor = fields[1];
            const postDate = fields[2];
            const postContent = fields[4];
            const postTitle = fields[5];
            const postExcerpt = fields[6];
            const postStatus = fields[7];
            const postSlug = fields[11];
            const postType = fields[20];

            if (postType === 'post' && postStatus === 'publish' && !EXCLUDED_IDS.has(id)) {
              const year = new Date(postDate).getFullYear();
              if (byYear[year]) {
                byYear[year].push({
                  id,
                  authorId: postAuthor,
                  date: postDate,
                  content: postContent,
                  title: postTitle,
                  excerpt: postExcerpt,
                  slug: postSlug,
                  year,
                });
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

  console.log(`Available candidate counts (excluding pilot):`);
  console.log(`  2023: ${byYear[2023].length}`);
  console.log(`  2024: ${byYear[2024].length}`);
  console.log(`  2025: ${byYear[2025].length}`);
  console.log(`  2026: ${byYear[2026].length}`);

  // Select 50 representative articles:
  // 10 from 2023, 15 from 2024, 15 from 2025, 10 from 2026
  const targetYearDistribution = { 2023: 10, 2024: 15, 2025: 15, 2026: 10 };
  const selectedRaw = [];

  for (const [year, targetCount] of Object.entries(targetYearDistribution)) {
    const list = byYear[year];
    // Deterministic spaced sampling across the year
    const step = Math.max(1, Math.floor(list.length / targetCount));
    for (let i = 0; i < targetCount && i * step < list.length; i++) {
      selectedRaw.push(list[i * step]);
    }
  }

  console.log(`\nSelected exactly ${selectedRaw.length} articles for Batch 2.`);

  // Build rich manifest items
  const manifestArticles = [];
  let totalDiskBytes = 0;
  let diskImagesFound = 0;
  let diskImagesMissing = 0;

  let index = 0;
  for (const raw of selectedRaw) {
    index++;
    const meta = postMeta.get(String(raw.id)) || {};
    let featuredMedia = null;

    if (meta.thumbnailId) {
      const relPath = attachments.get(meta.thumbnailId);
      if (relPath) {
        const fullDisk = path.join(UPLOADS_DIR, relPath);
        const exists = fs.existsSync(fullDisk);
        const size = exists ? fs.statSync(fullDisk).size : 0;
        if (exists) {
          diskImagesFound++;
          totalDiskBytes += size;
        } else {
          diskImagesMissing++;
        }
        featuredMedia = {
          source: 'wp_post_thumbnail',
          relativePath: relPath.replace(/\\/g, '/'),
          existsOnDisk: exists,
          sizeBytes: size,
          targetStoragePath: `articles/${relPath.replace(/\\/g, '/')}`,
        };
      }
    }

    if (!featuredMedia) {
      const imgMatch = raw.content.match(/<img\b[^>]*src=["']([^"']*)["']/i);
      if (imgMatch) {
        const m = imgMatch[1].match(/uploads\/(.*)$/i);
        if (m) {
          const relPath = m[1].replace(/\\/g, '/');
          const fullDisk = path.join(UPLOADS_DIR, relPath);
          const exists = fs.existsSync(fullDisk);
          const size = exists ? fs.statSync(fullDisk).size : 0;
          if (exists) {
            diskImagesFound++;
            totalDiskBytes += size;
          } else {
            diskImagesMissing++;
          }
          featuredMedia = {
            source: 'inline_content_fallback',
            relativePath: relPath,
            existsOnDisk: exists,
            sizeBytes: size,
            targetStoragePath: `articles/${relPath}`,
          };
        }
      }
    }

    const termTaxIds = postTerms.get(String(raw.id)) || [];
    const termIds = termTaxIds.map((ttId) => {
      const info = termTaxonomies.get(ttId);
      return info ? info.term_id : ttId;
    });
    const taxResolution = resolveTaxonomies(termIds, termTaxonomies);
    const authorAttribution = resolveAuthor(raw.authorId);
    const { doc: tipTapDoc, warnings: tipTapWarnings } = convertWpHtmlToTipTap(raw.content);

    let cleanSlug = raw.slug;
    if (!cleanSlug || cleanSlug.trim() === '') {
      cleanSlug = `news-${raw.id}`;
    }

    manifestArticles.push({
      manifestIndex: index,
      year: raw.year,
      wordpressId: raw.id,
      title: raw.title,
      slug: cleanSlug,
      publishedAt: new Date(raw.date).toISOString(),
      originalPermalink: `https://azadsamacharindia.com/?p=${raw.id}`,
      primaryCategory: taxResolution.primaryCategorySlug,
      categories: taxResolution.categories,
      tags: taxResolution.tags,
      isFeatured: taxResolution.isFeatured,
      isTrending: taxResolution.isTrending,
      author: {
        legacyWpId: Number(raw.authorId),
        displayName: authorAttribution.displayNameHindi || 'आज़ाद समाचार डेस्क',
        attribution: authorAttribution,
      },
      featuredMedia,
      tipTapDocNodesCount: tipTapDoc.content?.length || 0,
      conversionWarnings: tipTapWarnings,
    });
  }

  const manifest = {
    manifestVersion: '1.0.0',
    batchType: 'batch_2_controlled_sample',
    generatedAt: new Date().toISOString(),
    lockedArticleCount: manifestArticles.length,
    yearDistribution: targetYearDistribution,
    mediaSummary: {
      imagesFoundOnDisk: diskImagesFound,
      imagesMissingOnDisk: diskImagesMissing,
      totalDiskBytes,
      totalDiskMb: (totalDiskBytes / 1024 / 1024).toFixed(3),
    },
    articles: manifestArticles,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`\n================================================================`);
  console.log('  BATCH 2 MANIFEST GENERATION COMPLETE');
  console.log('================================================================');
  console.log(`Manifest File          : ${OUTPUT_FILE}`);
  console.log(`Total Articles         : ${manifest.lockedArticleCount}`);
  console.log(`Year Breakdown         : 2023 (${targetYearDistribution[2023]}), 2024 (${targetYearDistribution[2024]}), 2025 (${targetYearDistribution[2025]}), 2026 (${targetYearDistribution[2026]})`);
  console.log(`Media Files On Disk    : ${diskImagesFound}`);
  console.log(`Media Files Missing    : ${diskImagesMissing}`);
  console.log(`Total Media Volume     : ${manifest.mediaSummary.totalDiskMb} MB (${totalDiskBytes} bytes)`);
  console.log('================================================================\n');

  return manifest;
}

generateBatch2().catch(console.error);

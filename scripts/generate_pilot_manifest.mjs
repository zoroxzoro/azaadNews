// scripts/generate_pilot_manifest.mjs
// Generates the strict, deterministic 10-article pilot manifest spanning 2023-2026

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { parseSqlTuple } from './lib/sqlTupleParser.mjs';
import { convertWpHtmlToTipTap } from '../src/utils/wpHtmlToTipTap.js';
import { resolveTaxonomies } from './lib/taxonomyMapper.mjs';
import { resolveAuthor } from './lib/authorMapper.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SQL_FILE = path.join(ROOT, 'azaad-migration', 'u829836736_easOt.sql');
const UPLOADS_DIR = path.join(ROOT, 'azaad-migration');
const MANIFEST_FILE = path.join(ROOT, 'docs', 'PILOT_SELECTION_MANIFEST.json');

// Exact 10 representative article IDs chosen across 2023, 2024, 2025, and 2026:
const TARGET_PILOT_WP_IDS = [
  1333,   // 2023: Early archive, National category, inline image fallback
  1336,   // 2023: Vande Bharat train in Kanpur, National + Kanpur local
  4134,   // 2023: Kanpur local, featured WebP image on disk, Gutenberg quote
  5535,   // 2024: New year news, Kanpur category, verified disk image
  5541,   // 2024: Highway beat, National category + local beat
  5544,   // 2024: Transporters strike, Kanpur local category
  20401,  // 2025: Infrastructure report, Kanpur category, rich TipTap nodes
  20405,  // 2025: Police & administration beat, multiple tags
  33282,  // 2026: January 2026 local news, high node count
  38200,  // 2026: Latest published article in archive (Cricket/Sports)
];

async function generatePilotManifest() {
  console.log('Generating locked 10-article pilot manifest...');

  // 1. Extract metadata maps
  const termNames = new Map();
  const termTaxonomies = new Map();
  const rawPostTtIds = new Map();
  const postCategories = new Map();
  const postMeta = new Map();
  const attachments = new Map();

  const rlMeta = readline.createInterface({
    input: fs.createReadStream(SQL_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let inTerms = false;
  let inTermTax = false;
  let inTermRel = false;
  let inPostMeta = false;

  for await (const line of rlMeta) {
    const trimmed = line.trim();

    if (trimmed.startsWith('INSERT INTO `wp_terms`')) inTerms = true;
    else if (trimmed.startsWith('INSERT INTO `wp_term_taxonomy`')) inTermTax = true;
    else if (trimmed.startsWith('INSERT INTO `wp_term_relationships`')) inTermRel = true;
    else if (trimmed.startsWith('INSERT INTO `wp_postmeta`')) inPostMeta = true;
    else if (trimmed.startsWith('INSERT INTO ')) {
      inTerms = false;
      inTermTax = false;
      inTermRel = false;
      inPostMeta = false;
    }

    if (trimmed.endsWith(';')) {
      inTerms = false;
      inTermTax = false;
      inTermRel = false;
      inPostMeta = false;
    }

    if (inTerms) {
      const match = trimmed.match(/\((\d+),\s*'([^']+)'/g);
      if (match) {
        for (const m of match) {
          const sub = m.match(/\((\d+),\s*'([^']+)'/);
          if (sub) termNames.set(sub[1], sub[2]);
        }
      }
    }

    if (inTermTax) {
      const match = trimmed.match(/\((\d+),\s*(\d+),\s*'([^']+)'/g);
      if (match) {
        for (const m of match) {
          const sub = m.match(/\((\d+),\s*(\d+),\s*'([^']+)'/);
          if (sub) termTaxonomies.set(sub[1], { term_id: sub[2], taxonomy: sub[3], name: termNames.get(sub[2]) || '' });
        }
      }
    }

    if (inTermRel) {
      const match = trimmed.match(/\((\d+),\s*(\d+),\s*\d+\)/g);
      if (match) {
        for (const m of match) {
          const sub = m.match(/\((\d+),\s*(\d+)/);
          if (sub) {
            const postId = sub[1];
            const ttId = sub[2];
            if (!rawPostTtIds.has(postId)) rawPostTtIds.set(postId, []);
            rawPostTtIds.get(postId).push(ttId);
          }
        }
      }
    }

    if (inPostMeta) {
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

  // 2. Scan wp_posts for the exact 10 articles
  const targetIdSet = new Set(TARGET_PILOT_WP_IDS);
  const matchedPosts = new Map();

  const postsStream = readline.createInterface({
    input: fs.createReadStream(SQL_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let inPosts = false;
  let parenDepth = 0;
  let inString = false;
  let isEscaped = false;
  let buffer = '';

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

            const id = Number(fields[0]);
            if (targetIdSet.has(id)) {
              matchedPosts.set(id, {
                id,
                authorId: fields[1],
                date: fields[2],
                content: fields[4],
                title: fields[5],
                excerpt: fields[6],
                slug: fields[11],
              });
            }
            continue;
          }
        }
      }
      if (parenDepth > 0) buffer += char;
    }
    if (inString && parenDepth > 0) buffer += '\n';
  }

  console.log(`Matched ${matchedPosts.size} / 10 target articles.`);

  // 3. Assemble Manifest Items
  const manifestItems = [];
  let itemIndex = 1;

  for (const targetId of TARGET_PILOT_WP_IDS) {
    const raw = matchedPosts.get(targetId);
    if (!raw) {
      console.warn(`⚠️ Warning: Target WP ID ${targetId} was not found in SQL dump.`);
      continue;
    }

    // A. TipTap Conversion
    const { doc: tipTapDoc, warnings } = convertWpHtmlToTipTap(raw.content);

    // B. Taxonomy Resolution
    const ttIds = rawPostTtIds.get(String(targetId)) || [];
    const termIds = ttIds.map((ttId) => {
      const info = termTaxonomies.get(ttId);
      return info ? info.term_id : ttId;
    });
    const tax = resolveTaxonomies(termIds, termTaxonomies);

    // C. Author Resolution
    const author = resolveAuthor(raw.authorId);

    // D. Media Resolution
    const meta = postMeta.get(String(targetId)) || {};
    let featuredImage = null;

    if (meta.thumbnailId) {
      const relPath = attachments.get(meta.thumbnailId);
      if (relPath) {
        const diskPath = path.join(UPLOADS_DIR, relPath);
        const exists = fs.existsSync(diskPath);
        featuredImage = {
          source: 'wp_post_thumbnail',
          relativePath: relPath.replace(/\\/g, '/'),
          existsOnDisk: exists,
          sizeBytes: exists ? fs.statSync(diskPath).size : 0,
          targetStoragePath: `articles/${relPath.replace(/\\/g, '/')}`,
        };
      }
    }

    // Inline image fallback
    if (!featuredImage) {
      const inlineMatch = raw.content.match(/<img\b[^>]*src=["']([^"']*)["']/i);
      if (inlineMatch && inlineMatch[1].includes('/wp-content/uploads/')) {
        const uploadIdx = inlineMatch[1].indexOf('/wp-content/uploads/');
        const rel = inlineMatch[1].slice(uploadIdx + 20).split('?')[0].replace(/\\/g, '/');
        const diskPath = path.join(UPLOADS_DIR, rel);
        const exists = fs.existsSync(diskPath);
        featuredImage = {
          source: 'inline_content_fallback',
          relativePath: rel,
          existsOnDisk: exists,
          sizeBytes: exists ? fs.statSync(diskPath).size : 0,
          targetStoragePath: `articles/${rel}`,
        };
      }
    }

    // Clean Unicode Slug
    let cleanSlug = raw.slug || '';
    if (cleanSlug.includes('%')) {
      try {
        cleanSlug = decodeURIComponent(cleanSlug);
      } catch (e) {
        // keep raw
      }
    }
    if (!cleanSlug || cleanSlug.startsWith('http')) {
      cleanSlug = raw.title.toLowerCase().replace(/[^\w\s\u0900-\u097F-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80);
    }

    const year = new Date(raw.date).getFullYear();

    manifestItems.push({
      manifestIndex: itemIndex++,
      year,
      wordpressId: targetId,
      title: raw.title,
      slug: cleanSlug,
      publishedAt: new Date(raw.date).toISOString(),
      originalPermalink: `https://azadsamacharindia.com/?p=${targetId}`,
      primaryCategory: tax.primaryCategorySlug,
      categories: tax.categories,
      tags: tax.tags,
      isFeatured: tax.isFeatured,
      isTrending: tax.isTrending,
      author: {
        legacyWpId: author.legacyWpId,
        displayName: author.displayNameHindi,
        attribution: author,
      },
      featuredMedia: featuredImage,
      tipTapDocNodesCount: tipTapDoc.content?.length || 0,
      conversionWarnings: warnings,
      expectedTargetRecord: {
        legacy_wordpress_id: targetId,
        title: raw.title,
        slug: cleanSlug,
        excerpt: raw.excerpt || '',
        status: 'published',
        language: 'hi',
        legacy_author_name: author.displayNameHindi,
        is_imported: true,
        location: 'कानपुर',
      },
    });
  }

  const manifestData = {
    manifestVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    lockedArticleCount: manifestItems.length,
    yearDistribution: {
      '2023': manifestItems.filter((i) => i.year === 2023).length,
      '2024': manifestItems.filter((i) => i.year === 2024).length,
      '2025': manifestItems.filter((i) => i.year === 2025).length,
      '2026': manifestItems.filter((i) => i.year === 2026).length,
    },
    articles: manifestItems,
  };

  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifestData, null, 2), 'utf8');

  console.log('\n================================================================');
  console.log('  PILOT MANIFEST SUMMARY');
  console.log('================================================================');
  console.log(`Locked Articles Count : ${manifestData.lockedArticleCount}`);
  console.log(`Year Distribution     : 2023 (${manifestData.yearDistribution['2023']}), 2024 (${manifestData.yearDistribution['2024']}), 2025 (${manifestData.yearDistribution['2025']}), 2026 (${manifestData.yearDistribution['2026']})`);
  console.log(`Manifest File Saved   : ${MANIFEST_FILE}`);
  console.log('================================================================\n');

  return manifestData;
}

generatePilotManifest().catch(console.error);

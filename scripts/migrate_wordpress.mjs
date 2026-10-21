/**
 * WordPress to Supabase Production Migration CLI
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Safe, idempotent, resumable migration pipeline with strict dry-run,
 * pilot, and full migration modes.
 *
 * Usage:
 *   node scripts/migrate_wordpress.mjs --dry-run
 *   node scripts/migrate_wordpress.mjs --pilot [--limit 10]
 *   node scripts/migrate_wordpress.mjs --pilot --live [--limit 10]
 *   node scripts/migrate_wordpress.mjs --check-only
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { convertWpHtmlToTipTap } from '../src/utils/wpHtmlToTipTap.js';
import { parseSqlTuple } from './lib/sqlTupleParser.mjs';
import { CATEGORY_MAP, resolveTaxonomies } from './lib/taxonomyMapper.mjs';
import { resolveAuthor } from './lib/authorMapper.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

import crypto from 'crypto';

// File paths
const SQL_FILE = path.join(ROOT, 'azaad-migration', 'u829836736_easOt.sql');
const UPLOADS_DIR = path.join(ROOT, 'azaad-migration');
const CHECKPOINT_FILE = path.join(ROOT, 'azaad-migration', 'migration_checkpoint.json');
const REPORT_FILE = path.join(ROOT, 'docs', 'MIGRATION_LATEST_RUN_REPORT.json');
const BATCHES_DIR = path.join(ROOT, 'azaad-migration', 'batches');
const PILOT_MANIFEST_FILE = path.join(ROOT, 'docs', 'PILOT_SELECTION_MANIFEST.json');

// Ensure batches directory exists
if (!fs.existsSync(BATCHES_DIR)) {
  fs.mkdirSync(BATCHES_DIR, { recursive: true });
}

// Parse CLI Arguments
const args = process.argv.slice(2);
const isDryRunExplicit = args.includes('--dry-run');
const isLive = args.includes('--live');
const isPilot = args.includes('--pilot');
const isFull = args.includes('--full');
const isConfirm = args.includes('--confirm');
const isCheckOnly = args.includes('--check-only');
const isVerbose = args.includes('--verbose');
const isForce = args.includes('--force');

function getArgValue(flag) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return null;
}

const limitArg = getArgValue('--limit');
const offsetArg = getArgValue('--offset');
const yearArg = getArgValue('--year');
const manifestArg = getArgValue('--manifest');

const LIMIT = limitArg ? parseInt(limitArg, 10) : (isPilot ? 10 : Infinity);
const OFFSET = offsetArg ? parseInt(offsetArg, 10) : 0;
const FILTER_YEAR = yearArg ? parseInt(yearArg, 10) : null;

// Unique Batch ID for Auditable Tracking & Precise Rollback
const BATCH_ID = crypto.randomUUID();

// Safety Enforcement: Full import requires explicit --confirm flag
if (isFull && isLive && !isConfirm) {
  console.error('❌ SAFETY ABORT: Full live migration requires explicit --confirm flag.');
  console.error('Command must be: node scripts/migrate_wordpress.mjs --full --live --confirm');
  process.exit(1);
}

// Determine Execution Mode
// STRICT RULE: If --live is not explicitly provided, execution is ALWAYS DRY-RUN.
const MODE = !isLive ? 'DRY_RUN' : (isPilot ? 'PILOT_LIVE' : 'FULL_LIVE');

// Read Environment Variables safely
function getEnvConfig() {
  let url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  let anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const envFiles = ['.env', '.env.local', '.env.production'];
  for (const envFile of envFiles) {
    const fullPath = path.join(ROOT, envFile);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const m = line.match(/^\s*([^=\s#]+)\s*=\s*(.*)$/);
        if (m) {
          const k = m[1].trim();
          const v = m[2].trim().replace(/^['"]|['"]$/g, '');
          if (!url && (k === 'VITE_SUPABASE_URL' || k === 'SUPABASE_URL')) url = v;
          if (!anonKey && (k === 'VITE_SUPABASE_PUBLISHABLE_KEY' || k === 'VITE_SUPABASE_ANON_KEY')) anonKey = v;
          if (!serviceRoleKey && k === 'SUPABASE_SERVICE_ROLE_KEY') serviceRoleKey = v;
        }
      }
    }
  }

  return { url, anonKey, serviceRoleKey };
}

const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY, serviceRoleKey: SUPABASE_SERVICE_KEY } = getEnvConfig();

console.log('================================================================');
console.log('  AZAAD SAMACHAR — WORDPRESS MIGRATION PIPELINE CLI');
console.log('================================================================');
console.log(`Execution Mode   : ${MODE} ${!isLive ? '(SAFETY ENFORCED: NO REMOTE WRITES)' : '⚠️ LIVE REMOTE WRITES ENABLED'}`);
console.log(`Article Limit    : ${LIMIT === Infinity ? 'ALL (Full Import)' : LIMIT}`);
console.log(`Article Offset   : ${OFFSET}`);
if (FILTER_YEAR) console.log(`Filter Year      : ${FILTER_YEAR}`);
console.log(`SQL Source       : ${SQL_FILE}`);
console.log(`Uploads Dir      : ${UPLOADS_DIR}`);
console.log(`Supabase URL     : ${SUPABASE_URL || 'Not Configured'}`);
console.log(`Service Role Key : ${SUPABASE_SERVICE_KEY ? 'Present (Server-side)' : 'Not Set (Live writes disabled)'}`);
console.log('================================================================\n');

// Validation before live execution
if (isLive) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ ERROR: Live execution requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env or environment.');
    console.error('Aborting for safety. No remote changes performed.');
    process.exit(1);
  }
}

// Checkpoint Manager
class CheckpointManager {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = { importedIds: [], lastProcessedWpId: null, lastRunAt: null, totalImported: 0 };
    this.load();
  }

  load() {
    if (fs.existsSync(this.filePath)) {
      try {
        this.data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      } catch (e) {
        console.warn('⚠️ Could not parse existing checkpoint file, starting fresh.');
      }
    }
  }

  save() {
    this.data.lastRunAt = new Date().toISOString();
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
  }

  isImported(wpId) {
    return this.data.importedIds.includes(Number(wpId));
  }

  markImported(wpId) {
    const num = Number(wpId);
    if (!this.data.importedIds.includes(num)) {
      this.data.importedIds.push(num);
      this.data.totalImported = this.data.importedIds.length;
      this.data.lastProcessedWpId = num;
    }
  }
}

const checkpoint = new CheckpointManager(CHECKPOINT_FILE);

// Media URL and Path Resolver
function resolveImagePath(rawUrl) {
  if (!rawUrl) return null;
  const match = rawUrl.match(/uploads\/(.*)$/i);
  if (!match) return null;
  const relPath = match[1].replace(/\\/g, '/');
  const diskPath = path.join(UPLOADS_DIR, relPath);
  const exists = fs.existsSync(diskPath);
  let sizeBytes = 0;
  if (exists) {
    try {
      sizeBytes = fs.statSync(diskPath).size;
    } catch (e) {
      // ignore
    }
  }
  return {
    originalUrl: rawUrl,
    relativePath: relPath,
    diskPath,
    existsOnDisk: exists,
    sizeBytes,
    targetStoragePath: `articles/${relPath}`,
    targetPublicUrl: `${SUPABASE_URL}/storage/v1/object/public/media-library/articles/${relPath}`,
  };
}

// Generate Unique Unicode Slug
function generateCleanSlug(title, wpId) {
  let slug = (title || '')
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);

  if (!slug) slug = `news-${wpId}`;
  return slug;
}

// Main Migration Runner
async function run() {
  const startTime = Date.now();
  const stats = {
    totalPostsInSql: 0,
    publishedArticlesFound: 0,
    selectedForProcessing: 0,
    processedSuccess: 0,
    skippedAlreadyImported: 0,
    skippedCmsEdited: 0,
    missingImages: 0,
    externalImages: 0,
    warnings: [],
    errors: [],
    processedArticles: [],
  };

  // Phase 1: Build Metadata Maps from SQL dump
  console.log('📦 Phase 1: Scanning MariaDB SQL export for metadata & taxonomies...');

  const termNames = new Map(); // term_id -> name
  const termTaxonomies = new Map(); // term_taxonomy_id -> { term_id, taxonomy, name }
  const postTerms = new Map(); // post_id -> [term_taxonomy_id]
  const postMeta = new Map(); // post_id -> { _thumbnail_id }
  const attachments = new Map(); // attachment_post_id -> relative_file_path

  const rl = readline.createInterface({
    input: fs.createReadStream(SQL_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let currentInsertTable = null;

  for await (const line of rl) {
    const trimmed = line.trim();

    if (trimmed.startsWith('INSERT INTO `wp_terms`')) currentInsertTable = 'terms';
    else if (trimmed.startsWith('INSERT INTO `wp_term_taxonomy`')) currentInsertTable = 'term_taxonomy';
    else if (trimmed.startsWith('INSERT INTO `wp_term_relationships`')) currentInsertTable = 'term_relationships';
    else if (trimmed.startsWith('INSERT INTO `wp_postmeta`')) currentInsertTable = 'postmeta';
    else if (trimmed.startsWith('INSERT INTO ')) currentInsertTable = null;

    if (!currentInsertTable) continue;

    // Fast-path extraction of metadata tuples
    if (currentInsertTable === 'terms') {
      const match = trimmed.match(/\((\d+),\s*'([^']+)'/g);
      if (match) {
        for (const m of match) {
          const sub = m.match(/\((\d+),\s*'([^']+)'/);
          if (sub) termNames.set(sub[1], sub[2]);
        }
      }
    } else if (currentInsertTable === 'term_taxonomy') {
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
    } else if (currentInsertTable === 'term_relationships') {
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
    } else if (currentInsertTable === 'postmeta') {
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

  console.log(`  ✓ Extracted ${termNames.size} terms, ${termTaxonomies.size} taxonomy links`);
  console.log(`  ✓ Extracted ${postTerms.size} post-taxonomy relationships`);
  console.log(`  ✓ Extracted ${attachments.size} attachment files`);

  // Diagnostic mode check
  if (isCheckOnly) {
    console.log('\n🔍 Check-Only Diagnostic Complete. System is ready.');
    process.exit(0);
  }

  // Phase 2: Stream and Parse wp_posts Table
  console.log('\n📰 Phase 2: Streaming published articles from wp_posts...');

  const postsStream = readline.createInterface({
    input: fs.createReadStream(SQL_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let inPosts = false;
  let parenDepth = 0;
  let inString = false;
  let isEscaped = false;
  let buffer = '';
  let publishedArticles = [];

  for await (const line of postsStream) {
    if (line.includes('INSERT INTO `wp_posts`')) {
      inPosts = true;
      continue;
    }
    if (!inPosts) continue;
    if (line.startsWith('INSERT INTO') && !line.includes('`wp_posts`')) {
      break;
    }

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
            buffer = ''; // Start of tuple
            continue;
          }
        } else if (char === ')') {
          parenDepth--;
          if (parenDepth === 0) {
            // End of tuple
            const fields = parseSqlTuple(buffer);
            buffer = '';

            const id = fields[0];
            const postAuthor = fields[1];
            const postDate = fields[2];
            const postContent = fields[4];
            const postTitle = fields[5];
            const postExcerpt = fields[6];
            const postStatus = fields[7];
            const postSlug = fields[11];
            const postType = fields[20];

            if (postType === 'post' && postStatus === 'publish') {
              stats.publishedArticlesFound++;
              publishedArticles.push({
                id: String(id),
                authorId: postAuthor,
                date: postDate,
                content: postContent,
                title: postTitle,
                excerpt: postExcerpt,
                slug: postSlug,
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

  stats.totalPostsInSql = publishedArticles.length;
  console.log(`  ✓ Found ${publishedArticles.length} published articles in SQL dump.`);

  // Select Articles for this run
  let selectedArticles = [];
  const targetManifestPath = manifestArg
    ? path.resolve(ROOT, manifestArg)
    : (isPilot ? PILOT_MANIFEST_FILE : null);

  if (targetManifestPath && fs.existsSync(targetManifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(targetManifestPath, 'utf8'));
      // Preserve the exact order in the manifest
      for (const item of manifest.articles) {
        const found = publishedArticles.find((p) => String(p.id) === String(item.wordpressId));
        if (found) selectedArticles.push(found);
      }
      console.log(`  ✓ Loaded exactly ${selectedArticles.length} representative articles from ${path.basename(targetManifestPath)}.`);
    } catch (e) {
      console.warn(`⚠️ Warning reading manifest ${targetManifestPath}, falling back to sequential selection: ${e.message}`);
      selectedArticles = publishedArticles.slice(OFFSET, OFFSET + LIMIT);
    }
  } else {
    // Apply Year Filter if provided
    if (FILTER_YEAR) {
      publishedArticles = publishedArticles.filter((a) => {
        const year = new Date(a.date).getFullYear();
        return year === FILTER_YEAR;
      });
      console.log(`  ✓ Filtered to ${publishedArticles.length} articles for year ${FILTER_YEAR}.`);
    }
    selectedArticles = publishedArticles.slice(OFFSET, OFFSET + LIMIT);
    console.log(`  ✓ Selected ${selectedArticles.length} articles for this run (Offset: ${OFFSET}, Limit: ${LIMIT}).\n`);
  }
  stats.selectedForProcessing = selectedArticles.length;

  // Phase 3: Process & Convert Articles
  console.log(`⚙️ Phase 3: Processing articles (${MODE})...\n`);
  console.log(`📌 Batch Execution ID: ${BATCH_ID}`);

  const batchArticles = [];
  const batchMedia = [];
  const batchStorageObjects = [];

  // Initialize Supabase Client if live
  let supabase = null;
  if (isLive) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    try {
      await supabase.from('migration_batches').insert({
        id: BATCH_ID,
        source_system: 'wordpress_mariadb',
        entity_type: isPilot ? 'pilot_articles' : 'articles',
        batch_number: Math.floor(Date.now() / 1000),
        total_records: selectedArticles.length,
        status: 'processing',
        started_at: new Date().toISOString(),
      });
      console.log(`  ✓ Registered batch ${BATCH_ID} in public.migration_batches.`);
    } catch (bErr) {
      console.warn(`  Notice: migration_batches tracking: ${bErr.message}`);
    }
  }

  let counter = 0;
  for (const raw of selectedArticles) {
    counter++;
    const wpId = parseInt(raw.id, 10);

    // Checkpoint check
    if (!isForce && checkpoint.isImported(wpId)) {
      stats.skippedAlreadyImported++;
      if (isVerbose) console.log(`  [SKIP] WP ID ${wpId} already recorded in checkpoint.`);
      continue;
    }

    // 1. TipTap Conversion
    const { doc: tipTapDoc, warnings: tipTapWarnings } = convertWpHtmlToTipTap(raw.content);

    // 2. Taxonomy Resolution
    const termTaxIds = postTerms.get(raw.id) || [];
    const termIds = termTaxIds.map((ttId) => {
      const info = termTaxonomies.get(ttId);
      return info ? info.term_id : ttId;
    });
    const taxResolution = resolveTaxonomies(termIds, termTaxonomies);

    // 3. Author Resolution
    const authorAttribution = resolveAuthor(raw.authorId);

    // 4. Featured Image Resolution
    const meta = postMeta.get(raw.id) || {};
    let featuredImageInfo = null;

    if (meta.thumbnailId) {
      const relPath = attachments.get(meta.thumbnailId);
      if (relPath) {
        featuredImageInfo = resolveImagePath(`https://azaadsamacharindia.com/wp-content/uploads/${relPath}`);
      }
    }

    // Fallback: If no post thumbnail, check for first inline image in content
    if (!featuredImageInfo) {
      const inlineImgMatch = raw.content.match(/<img\b[^>]*src=["']([^"']*)["']/i);
      if (inlineImgMatch) {
        featuredImageInfo = resolveImagePath(inlineImgMatch[1]);
      }
    }

    if (featuredImageInfo && !featuredImageInfo.existsOnDisk) {
      stats.missingImages++;
    }

    // 5. Build Target Supabase Record
    const cleanSlug = raw.slug || generateCleanSlug(raw.title, wpId);
    const pubDate = new Date(raw.date).toISOString();

    const targetArticlePayload = {
      legacy_wordpress_id: wpId,
      title: raw.title,
      slug: cleanSlug,
      excerpt: raw.excerpt || '',
      content_json: tipTapDoc,
      original_html: raw.content,
      language: 'hi',
      status: 'published',
      author_id: null, // Left null to preserve historical desk attribution
      legacy_author_name: authorAttribution.displayNameHindi || 'आज़ाद समाचार डेस्क',
      author_attribution: authorAttribution,
      is_featured: taxResolution.isFeatured,
      is_trending: taxResolution.isTrending,
      is_imported: true,
      imported_at: new Date().toISOString(),
      published_at: pubDate,
      legacy_created_at: pubDate,
      legacy_url: `https://azadsamacharindia.com/?p=${wpId}`,
      location: 'कानपुर',
      import_batch_id: BATCH_ID,
    };

    // Record for preview
    const previewItem = {
      index: counter,
      wpId,
      title: raw.title,
      date: raw.date,
      slug: cleanSlug,
      category: taxResolution.primaryCategorySlug,
      categories: taxResolution.categories,
      tags: taxResolution.tags,
      featuredImage: featuredImageInfo ? {
        path: featuredImageInfo.relativePath,
        existsOnDisk: featuredImageInfo.existsOnDisk,
        sizeBytes: featuredImageInfo.sizeBytes,
      } : null,
      tipTapNodesCount: tipTapDoc.content?.length || 0,
      warnings: tipTapWarnings,
    };

    stats.processedArticles.push(previewItem);

    // 6. Live Write Execution (Only when --live is strictly active)
    if (isLive && supabase) {
      try {
        // Safety check A: Does an article with this legacy_wordpress_id exist and was it modified in the CMS?
        const { data: existingArt } = await supabase
          .from('articles')
          .select('id, legacy_wordpress_id, is_imported, imported_at, updated_at')
          .eq('legacy_wordpress_id', wpId)
          .maybeSingle();

        if (existingArt) {
          const importedTime = new Date(existingArt.imported_at).getTime();
          const updatedTime = new Date(existingArt.updated_at).getTime();

          // If edited more than 5 seconds after import, protect CMS human edits!
          if (existingArt.is_imported && (updatedTime - importedTime > 5000)) {
            stats.skippedCmsEdited++;
            console.log(`  🛡️ [PROTECT] WP ID ${wpId} was modified in CMS post-import. Skipping overwrite.`);
            continue;
          }
        }

        // Safety check B: Disambiguate slug against native articles (where legacy_wordpress_id is null)
        const { data: slugConflict } = await supabase
          .from('articles')
          .select('id, legacy_wordpress_id')
          .eq('slug', targetArticlePayload.slug)
          .maybeSingle();

        if (slugConflict && slugConflict.legacy_wordpress_id !== wpId) {
          targetArticlePayload.slug = `${targetArticlePayload.slug}-wp${wpId}`;
        }

        // Step C: Upload featured image to storage if on disk and not yet in media table
        let targetFeaturedMediaId = null;
        if (featuredImageInfo && featuredImageInfo.existsOnDisk) {
          const fileBuffer = fs.readFileSync(featuredImageInfo.diskPath);
          const storagePath = featuredImageInfo.targetStoragePath;

          // Check if already in storage/media table
          const { data: existingMedia } = await supabase
            .from('media')
            .select('id')
            .eq('storage_path', storagePath)
            .maybeSingle();

          if (existingMedia) {
            targetFeaturedMediaId = existingMedia.id;
          } else {
            // Upload to Supabase Storage
            const mimeType = storagePath.endsWith('.webp') ? 'image/webp' :
                             storagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

            const { error: uploadErr } = await supabase.storage
              .from('media-library')
              .upload(storagePath, fileBuffer, { contentType: mimeType, upsert: true });

            if (!uploadErr) {
              const { data: mediaRow } = await supabase
                .from('media')
                .insert({
                  storage_bucket: 'media-library',
                  storage_path: storagePath,
                  public_url: featuredImageInfo.targetPublicUrl,
                  original_filename: path.basename(storagePath),
                  mime_type: mimeType,
                  file_size: featuredImageInfo.sizeBytes,
                  alt_text: raw.title,
                  import_batch_id: BATCH_ID,
                })
                .select('id')
                .single();

              if (mediaRow) {
                targetFeaturedMediaId = mediaRow.id;
                batchMedia.push({ id: mediaRow.id, storage_path: storagePath });
                batchStorageObjects.push(storagePath);
              }
            }
          }
        }

        if (targetFeaturedMediaId) {
          targetArticlePayload.featured_media_id = targetFeaturedMediaId;
        }

        // Step D: Upsert Article
        const { data: upsertedArt, error: artErr } = await supabase
          .from('articles')
          .upsert(targetArticlePayload, { onConflict: 'legacy_wordpress_id' })
          .select('id')
          .single();

        if (artErr) throw artErr;

        const targetArticleId = upsertedArt.id;
        batchArticles.push({ id: targetArticleId, legacy_wordpress_id: wpId, title: raw.title });

        // Step E: Sync Categories in article_categories
        const catSlugs = taxResolution.categories.map((c) => c.slug);
        const { data: dbCats } = await supabase.from('categories').select('id, slug').in('slug', catSlugs);
        if (dbCats && dbCats.length > 0) {
          await supabase.from('article_categories').delete().eq('article_id', targetArticleId);
          const catJoins = dbCats.map((c) => ({
            article_id: targetArticleId,
            category_id: c.id,
            is_primary: c.slug === taxResolution.primaryCategorySlug,
          }));
          await supabase.from('article_categories').insert(catJoins);
        }

        // Step F: Sync Tags in article_tags
        if (taxResolution.tags.length > 0) {
          await supabase.from('article_tags').delete().eq('article_id', targetArticleId);
          for (const tagName of taxResolution.tags.slice(0, 5)) {
            const cleanTag = tagName.trim();
            const tagSlug = cleanTag.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]+/g, '-').slice(0, 100);
            const { data: tagRow } = await supabase
              .from('tags')
              .upsert({ name: cleanTag, slug: tagSlug }, { onConflict: 'slug' })
              .select('id')
              .single();

            if (tagRow) {
              await supabase.from('article_tags').insert({ article_id: targetArticleId, tag_id: tagRow.id });
            }
          }
        }

        checkpoint.markImported(wpId);
        stats.processedSuccess++;
        console.log(`  [LIVE OK] #${counter} WP ID ${wpId}: "${raw.title.slice(0, 40)}..." -> DB ID: ${targetArticleId}`);
      } catch (err) {
        stats.errors.push({ wpId, error: err.message });
        console.error(`  [LIVE ERROR] #${counter} WP ID ${wpId}:`, err.message);
      }
    } else {
      // Dry-Run Mode Logging
      stats.processedSuccess++;
      batchArticles.push({ id: `dry_run_${wpId}`, legacy_wordpress_id: wpId, title: raw.title });
      if (featuredImageInfo && featuredImageInfo.existsOnDisk) {
        batchMedia.push({ id: `dry_run_media_${wpId}`, storage_path: featuredImageInfo.targetStoragePath });
        batchStorageObjects.push(featuredImageInfo.targetStoragePath);
      }
      console.log(`  [DRY-RUN OK] #${counter} WP ID ${wpId} (${raw.date.slice(0, 10)}): "${raw.title.slice(0, 45)}..." [Cat: ${taxResolution.primaryCategorySlug}, Nodes: ${tipTapDoc.content?.length}]`);
    }
  }

  // Save checkpoint if live
  if (isLive) {
    checkpoint.save();

    // Update batch record in Supabase
    if (supabase) {
      try {
        await supabase.from('migration_batches').update({
          successful_records: stats.processedSuccess,
          failed_records: stats.errors.length,
          status: stats.errors.length === 0 ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          error_log: stats.errors,
        }).eq('id', BATCH_ID);
      } catch (e) {
        // non-fatal
      }
    }
  }

  // Save Local Batch Manifest
  const batchManifest = {
    batchId: BATCH_ID,
    batchType: isPilot ? 'pilot' : (isFull ? 'full' : 'dry_run'),
    mode: MODE,
    createdAt: new Date().toISOString(),
    articlesCount: batchArticles.length,
    mediaCount: batchMedia.length,
    articles: batchArticles,
    media: batchMedia,
    storageObjects: batchStorageObjects,
    status: stats.errors.length === 0 ? 'completed' : 'failed',
  };
  fs.writeFileSync(path.join(BATCHES_DIR, `${BATCH_ID}.json`), JSON.stringify(batchManifest, null, 2), 'utf8');

  // Write Run Report
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const report = {
    mode: MODE,
    completedAt: new Date().toISOString(),
    durationSeconds: parseFloat(elapsedSec),
    stats: {
      totalInSqlDump: stats.totalPostsInSql,
      selectedForProcessing: stats.selectedForProcessing,
      successfullyProcessed: stats.processedSuccess,
      skippedAlreadyImported: stats.skippedAlreadyImported,
      skippedCmsEdited: stats.skippedCmsEdited,
      missingImages: stats.missingImages,
      errorCount: stats.errors.length,
    },
    sampleArticles: stats.processedArticles.slice(0, 10),
    errors: stats.errors,
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n================================================================');
  console.log('  MIGRATION EXECUTION SUMMARY');
  console.log('================================================================');
  console.log(`Batch ID               : ${BATCH_ID}`);
  console.log(`Mode                   : ${MODE}`);
  console.log(`Duration               : ${elapsedSec}s`);
  console.log(`Selected For Run       : ${stats.selectedForProcessing}`);
  console.log(`Successfully Processed : ${stats.processedSuccess}`);
  console.log(`Skipped (Imported)     : ${stats.skippedAlreadyImported}`);
  console.log(`Skipped (CMS Edited)   : ${stats.skippedCmsEdited}`);
  console.log(`Missing Image Warnings : ${stats.missingImages}`);
  console.log(`Errors                 : ${stats.errors.length}`);
  console.log(`Batch Manifest         : ${path.join(BATCHES_DIR, `${BATCH_ID}.json`)}`);
  console.log(`Report Saved           : ${REPORT_FILE}`);
  console.log('----------------------------------------------------------------');
  console.log('Rollback Commands:');
  console.log(`  Dry-Run : node scripts/rollback_migration.mjs --batch-id ${BATCH_ID} --dry-run`);
  console.log(`  Confirm : node scripts/rollback_migration.mjs --batch-id ${BATCH_ID} --confirm`);
  console.log('================================================================\n');

  if (MODE === 'DRY_RUN') {
    console.log('🔒 SAFETY CONFIRMATION: Zero remote database writes performed.');
    console.log('🔒 SAFETY CONFIRMATION: Zero Supabase Storage media uploads performed.');
  }
}

run().catch((err) => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});

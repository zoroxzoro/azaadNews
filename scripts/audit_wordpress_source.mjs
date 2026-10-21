/**
 * Read-Only WordPress Audit Script for Azaad Samachar
 * Phase 5 Migration Pipeline Preparation
 *
 * Detailed inspection of:
 * 1. WordPress SQL dumps (u829836736_4MBde.sql & u829836736_easOt.sql)
 *    - siteurl / home / blogname
 *    - wp_users
 *    - wp_posts breakdown (type, status, date range, titles)
 *    - wp_terms & wp_term_taxonomy (categories, tags)
 *    - wp_postmeta (_thumbnail_id, SEO metadata)
 * 2. Uploads folder inventory
 *    - total files, total size
 *    - directory structure
 *    - original files vs thumbnail variants (-WxH.ext)
 *    - mime/extension breakdown
 *
 * READ-ONLY: Never writes to source files or remote databases.
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const migrationDir = path.join(rootDir, 'azaad-migration');

console.log('================================================================');
console.log('  AZAAD SAMACHAR — WORDPRESS PHASE 5 AUDIT');
console.log('  Inspecting source files in strict READ-ONLY mode...');
console.log('================================================================\n');

// -------------------------------------------------------------
// PART 1: Uploads Folder Inventory
// -------------------------------------------------------------
console.log('>>> SCANNING UPLOADS DIRECTORY...');

let totalUploadFiles = 0;
let totalUploadBytes = 0;
let originalImagesCount = 0;
let variantImagesCount = 0;
const extensionCounts = {};
const folderCounts = {};

// Regex for WordPress generated image variants: e.g. photo-150x150.jpg, image-1024x768.png
const wpVariantRegex = /-\d+x\d+\.(jpe?g|png|webp|gif)$/i;

function scanDirRecursive(dirPath, relativeDir = '') {
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    console.error(`Cannot read ${dirPath}: ${err.message}`);
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      scanDirRecursive(fullPath, relPath);
    } else if (entry.isFile() && !entry.name.endsWith('.sql')) {
      totalUploadFiles++;
      const size = fs.statSync(fullPath).size;
      totalUploadBytes += size;

      const ext = path.extname(entry.name).toLowerCase() || 'no-extension';
      extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;

      const topFolder = relPath.split('/')[0] || 'root';
      folderCounts[topFolder] = folderCounts[topFolder] || { count: 0, bytes: 0 };
      folderCounts[topFolder].count++;
      folderCounts[topFolder].bytes += size;

      if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
        if (wpVariantRegex.test(entry.name)) {
          variantImagesCount++;
        } else {
          originalImagesCount++;
        }
      }
    }
  }
}

scanDirRecursive(migrationDir);

console.log(`\nUploads Inventory Summary:`);
console.log(`  Total Media Files: ${totalUploadFiles}`);
console.log(`  Total Media Size: ${(totalUploadBytes / (1024 * 1024)).toFixed(2)} MB (${(totalUploadBytes / (1024 * 1024 * 1024)).toFixed(2)} GB)`);
console.log(`  Original Images (Master Assets): ${originalImagesCount}`);
console.log(`  Resized Variants (-WxH thumbnails): ${variantImagesCount}`);
console.log(`\nBreakdown by Top-level Folder:`);
for (const [folder, data] of Object.entries(folderCounts)) {
  console.log(`  - ${folder.padEnd(22)} : ${String(data.count).padStart(6)} files | ${(data.bytes / (1024 * 1024)).toFixed(2).padStart(8)} MB`);
}

console.log(`\nBreakdown by Extension:`);
for (const [ext, count] of Object.entries(extensionCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  - ${ext.padEnd(10)}: ${count}`);
}

// -------------------------------------------------------------
// PART 2: SQL Dump Inspection
// -------------------------------------------------------------
console.log('\n================================================================');
console.log('>>> ANALYZING WORDPRESS SQL DUMPS...');
console.log('================================================================');

async function inspectSqlDump(fileName) {
  const filePath = path.join(migrationDir, fileName);
  console.log(`\nReading ${fileName} (${(fs.statSync(filePath).size / (1024 * 1024)).toFixed(2)} MB)...`);

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let siteUrl = null;
  let homeUrl = null;
  let blogName = null;

  const users = [];
  const postTypeStatus = {};
  const categories = [];
  const tags = [];
  let totalPostsInserted = 0;
  let samplePosts = [];

  let currentTable = null;

  for await (const line of rl) {
    if (line.startsWith('-- Table structure for table `') || line.startsWith('CREATE TABLE `')) {
      const match = line.match(/`([^`]+)`/);
      if (match) currentTable = match[1];
    }

    // 1. wp_options (siteurl, home, blogname)
    if (currentTable === 'wp_options' && line.includes('INSERT INTO `wp_options`')) {
      if (line.includes("'siteurl'")) {
        const m = line.match(/'siteurl',\s*'([^']+)'/);
        if (m) siteUrl = m[1];
      }
      if (line.includes("'home'")) {
        const m = line.match(/'home',\s*'([^']+)'/);
        if (m) homeUrl = m[1];
      }
      if (line.includes("'blogname'")) {
        const m = line.match(/'blogname',\s*'([^']+)'/);
        if (m) blogName = m[1];
      }
    }

    // 2. wp_users
    if (currentTable === 'wp_users' && line.includes('INSERT INTO `wp_users`')) {
      // e.g. VALUES (1, 'admin', '$P$...', 'admin', 'admin@example.com', ...)
      const regex = /\((\d+),\s*'([^']+)',\s*'[^']+',\s*'([^']+)',\s*'([^']+)'/g;
      let match;
      while ((match = regex.exec(line)) !== null) {
        users.push({
          id: match[1],
          username: match[2],
          displayName: match[3],
          email: match[4],
        });
      }
    }

    // 3. wp_terms
    if (currentTable === 'wp_terms' && line.includes('INSERT INTO `wp_terms`')) {
      // VALUES (1, 'Uncategorized', 'uncategorized', 0), (2, 'National', 'national', 0)
      const termRegex = /\((\d+),\s*'([^']+)',\s*'([^']+)',\s*(\d+)\)/g;
      let m;
      while ((m = termRegex.exec(line)) !== null) {
        categories.push({ id: m[1], name: m[2], slug: m[3] });
      }
    }

    // 4. wp_posts
    if (currentTable === 'wp_posts' && line.startsWith('INSERT INTO `wp_posts` VALUES')) {
      // Parse tuples from INSERT statement
      // Standard WP schema order:
      // (ID, post_author, post_date, post_date_gmt, post_content, post_title, post_excerpt,
      // post_status, comment_status, ping_status, post_password, post_name, to_ping, pinged,
      // post_modified, post_modified_gmt, post_content_filtered, post_parent, guid, menu_order,
      // post_type, post_mime_type, comment_count)

      // Regex matching post tuples
      // Notice: post_type and post_status are near the end of each row
      // We can search for 'post', 'publish', 'page', 'attachment', 'revision'
      const rows = line.split(/\),\s*\(/);
      for (const row of rows) {
        totalPostsInserted++;
        // Extract post_type (usually 'post', 'page', 'attachment', 'revision')
        // Extract post_status (usually 'publish', 'draft', 'trash', 'inherit')
        const typeMatch = row.match(/'(post|page|attachment|revision|nav_menu_item|custom_css|wp_global_styles|wp_template|wp_block|elementor_library)'/i);
        const statusMatch = row.match(/'(publish|draft|trash|inherit|auto-draft|pending|future|private)'/i);

        const type = typeMatch ? typeMatch[1].toLowerCase() : 'other';
        const status = statusMatch ? statusMatch[1].toLowerCase() : 'other';

        if (!postTypeStatus[type]) postTypeStatus[type] = {};
        postTypeStatus[type][status] = (postTypeStatus[type][status] || 0) + 1;

        if (type === 'post' && status === 'publish' && samplePosts.length < 5) {
          // Extract title if possible
          const titleMatch = row.match(/,\s*'(\d{4}-\d{2}-\d{2}[^']*)',\s*'.*?',\s*'([^']{5,100})'/);
          if (titleMatch) {
            samplePosts.push({ date: titleMatch[1], title: titleMatch[2] });
          }
        }
      }
    }
  }

  console.log(`\nDatabase: ${fileName}`);
  console.log(`  Site URL: ${siteUrl || 'Not found in options'}`);
  console.log(`  Home URL: ${homeUrl || 'Not found in options'}`);
  console.log(`  Blog Name: ${blogName || 'Not found in options'}`);
  console.log(`  Users Found (${users.length}):`);
  for (const u of users) {
    console.log(`    - ID ${u.id}: ${u.username} (${u.displayName}) <${u.email}>`);
  }

  console.log(`\n  wp_posts Breakdown (Total Rows: ${totalPostsInserted}):`);
  for (const [type, statuses] of Object.entries(postTypeStatus)) {
    console.log(`    - Type [${type}]:`);
    for (const [status, cnt] of Object.entries(statuses)) {
      console.log(`        Status [${status}]: ${cnt}`);
    }
  }

  if (categories.length > 0) {
    console.log(`\n  Sample Terms (${categories.length} total terms found):`);
    for (const cat of categories.slice(0, 10)) {
      console.log(`    - [${cat.id}] ${cat.name} (slug: ${cat.slug})`);
    }
  }

  if (samplePosts.length > 0) {
    console.log(`\n  Sample Published Post Titles:`);
    for (const p of samplePosts) {
      console.log(`    - [${p.date}] ${p.title}`);
    }
  }
}

async function start() {
  await inspectSqlDump('u829836736_4MBde.sql');
  await inspectSqlDump('u829836736_easOt.sql');
  console.log('\n================================================================');
  console.log('  AUDIT COMPLETE (READ-ONLY)');
  console.log('================================================================');
}

start();

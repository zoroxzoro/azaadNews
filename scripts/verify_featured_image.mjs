/**
 * Verify Featured Image Attachment Linking in WordPress Dump
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const migrationDir = path.join(rootDir, 'azaad-migration');

async function verifyFeaturedImageFlow() {
  const filePath = path.join(migrationDir, 'u829836736_easOt.sql');
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  const thumbnailMeta = []; // { postId, attachmentId }
  const attachments = {}; // attachmentId -> file path
  let inPostMeta = false;
  let inPosts = false;

  for await (const line of rl) {
    if (line.includes('INSERT INTO `wp_postmeta`')) inPostMeta = true;
    else if (line.startsWith('INSERT INTO') && !line.includes('`wp_postmeta`')) inPostMeta = false;

    if (line.includes('INSERT INTO `wp_posts`')) inPosts = true;
    else if (line.startsWith('INSERT INTO') && !line.includes('`wp_posts`')) inPosts = false;

    // Check _thumbnail_id in postmeta
    if (inPostMeta && line.includes("'_thumbnail_id'")) {
      // (meta_id, post_id, '_thumbnail_id', 'attachment_id')
      const regex = /\((\d+),\s*(\d+),\s*'_thumbnail_id',\s*'(\d+)'\)/g;
      let m;
      while ((m = regex.exec(line)) !== null) {
        if (thumbnailMeta.length < 20) {
          thumbnailMeta.push({ postId: m[2], attachmentId: m[3] });
        }
      }
    }

    // Check _wp_attached_file in postmeta
    if (inPostMeta && line.includes("'_wp_attached_file'")) {
      const regex = /\((\d+),\s*(\d+),\s*'_wp_attached_file',\s*'([^']+)'\)/g;
      let m;
      while ((m = regex.exec(line)) !== null) {
        attachments[m[2]] = m[3];
      }
    }
  }

  console.log(`Sample _thumbnail_id records: ${thumbnailMeta.length}`);
  for (const item of thumbnailMeta.slice(0, 5)) {
    const attachedFile = attachments[item.attachmentId];
    console.log(`  - Article ID [${item.postId}] -> Featured Media Attachment [${item.attachmentId}] -> File: ${attachedFile || 'Checking file system...'}`);
    if (attachedFile) {
      const localDiskPath = path.join(migrationDir, attachedFile.replace(/\//g, path.sep));
      const exists = fs.existsSync(localDiskPath);
      console.log(`    File on disk: ${exists ? 'EXISTS (VERIFIED)' : 'MISSING'} -> ${localDiskPath}`);
    }
  }
}

verifyFeaturedImageFlow();

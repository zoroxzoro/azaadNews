/**
 * Inspect text encoding of post titles, slugs, and content
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const migrationDir = path.join(rootDir, 'azaad-migration');

async function testEncoding() {
  const filePath = path.join(migrationDir, 'u829836736_easOt.sql');
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let count = 0;
  for await (const line of rl) {
    if (line.includes("'post'") && line.includes("'publish'")) {
      // Find post 1333, 1336, 1350
      if (line.startsWith('(1333,') || line.startsWith('(1336,') || line.startsWith('(1350,')) {
        console.log(`\n--------------------------------------------`);
        // Extract post_name (slug)
        const slugMatch = line.match(/,\s*'([^']*)',\s*'',\s*'',\s*'[^']*',\s*'[^']*',\s*'',\s*\d+,\s*'[^']*',\s*\d+,\s*'post'/);
        if (slugMatch) {
          const rawSlug = slugMatch[1];
          console.log(`Raw Slug: ${rawSlug}`);
          try {
            console.log(`Decoded Slug (Hindi): ${decodeURIComponent(rawSlug)}`);
          } catch (e) {
            console.log(`Decode failed: ${e.message}`);
          }
        }

        // Check if there are Unicode escape sequences or Devanagari in the line
        const devanagariMatch = line.match(/[\u0900-\u097F]+/g);
        console.log(`Devanagari characters found directly in line:`, devanagariMatch ? devanagariMatch.slice(0, 5) : 'None');

        // Print raw title part
        const parts = line.split("', '");
        console.log(`Part 4 (Title candidate?):`, parts[4]?.slice(0, 100));
        console.log(`Part 5 (Excerpt candidate?):`, parts[5]?.slice(0, 100));

        count++;
        if (count >= 3) break;
      }
    }
  }
}

testEncoding();

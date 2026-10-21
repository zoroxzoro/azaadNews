/**
 * Test HTML-to-TipTap conversion on real WordPress articles
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { convertWpHtmlToTipTap, stripHtmlTags } from '../src/utils/wpHtmlToTipTap.js';
import { renderTipTapContent } from '../src/utils/articleContent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const sqlPath = path.join(rootDir, 'azaad-migration', 'u829836736_easOt.sql');
import { parseSqlTuple } from './test_sql_parser.mjs';

async function testConverter() {
  console.log('Testing convertWpHtmlToTipTap on real WordPress articles...');

  const rl = readline.createInterface({
    input: fs.createReadStream(sqlPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let inPosts = false;
  let buffer = '';
  let inString = false;
  let isEscaped = false;
  let tested = 0;

  for await (const line of rl) {
    if (line.includes('INSERT INTO `wp_posts`')) {
      inPosts = true;
      continue;
    }
    if (!inPosts) continue;
    if (line.startsWith('INSERT INTO') && !line.includes('`wp_posts`')) break;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (isEscaped) {
        buffer += char;
        isEscaped = false;
        continue;
      }
      if (char === '\\') {
        buffer += char;
        isEscaped = true;
        continue;
      }
      if (char === "'") {
        buffer += char;
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '(' && buffer.trim() === '') {
          buffer = '';
          continue;
        }

        if (char === ')' && (i === line.length - 1 || line[i + 1] === ',' || line[i + 1] === ';')) {
          const fields = parseSqlTuple(buffer);
          buffer = '';

          const id = fields[0];
          const postContent = fields[4] || '';
          const postTitle = fields[5] || '';
          const postStatus = fields[7];
          const postType = fields[20];

          if (postType === 'post' && postStatus === 'publish' && postContent.length > 500) {
            tested++;
            console.log(`\n======================================================`);
            console.log(`Article #${tested}: [ID ${id}] ${postTitle}`);
            console.log(`Original HTML Length: ${postContent.length} chars`);

            const { doc, warnings } = convertWpHtmlToTipTap(postContent);
            console.log(`TipTap Doc Node Count: ${doc.content.length}`);
            console.log(`Node Types:`, doc.content.map((n) => n.type + (n.attrs?.level ? `(h${n.attrs.level})` : '')));
            console.log(`Warnings:`, warnings);

            // Verify with portal renderTipTapContent
            try {
              const elements = renderTipTapContent(doc);
              console.log(`Portal React Elements Generated: ${elements?.length || 0}`);
              console.log(`[PASS] Valid schema for Azaad Samachar React Renderer`);
            } catch (err) {
              console.error(`[FAIL] Error rendering TipTap JSON:`, err);
            }

            // Sample node output
            console.log(`First 2 Nodes JSON:`, JSON.stringify(doc.content.slice(0, 2), null, 2));

            if (tested >= 3) {
              rl.close();
              return;
            }
          }
          continue;
        }
      }

      buffer += char;
    }

    if (inString) buffer += '\n';
  }
}

testConverter();

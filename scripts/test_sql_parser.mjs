/**
 * Prototype streaming SQL tuple parser
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const sqlPath = path.join(rootDir, 'azaad-migration', 'u829836736_easOt.sql');

/**
 * Splits a SQL tuple string e.g. "1, 'Title', 'Content', ..." into field values.
 */
export function parseSqlTuple(tupleStr) {
  // tupleStr does not include surrounding parentheses
  const fields = [];
  let current = '';
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < tupleStr.length; i++) {
    const char = tupleStr[i];

    if (isEscaped) {
      if (char === 'n') current += '\n';
      else if (char === 'r') current += '\r';
      else if (char === 't') current += '\t';
      else if (char === '\\') current += '\\';
      else if (char === "'") current += "'";
      else if (char === '"') current += '"';
      else current += char;
      isEscaped = false;
      continue;
    }

    if (char === '\\') {
      isEscaped = true;
      continue;
    }

    if (char === "'") {
      inString = !inString;
      continue; // Don't include surrounding single quotes
    }

    if (char === ',' && !inString) {
      const trimmed = current.trim();
      if (trimmed === 'NULL') {
        fields.push(null);
      } else {
        fields.push(trimmed);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const trimmed = current.trim();
  if (trimmed === 'NULL') fields.push(null);
  else fields.push(trimmed);

  return fields;
}

async function test() {
  const rl = readline.createInterface({
    input: fs.createReadStream(sqlPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let inPosts = false;
  let buffer = '';
  let inString = false;
  let isEscaped = false;
  let found = 0;

  console.log('Testing streaming tuple parser on wp_posts in u829836736_easOt.sql...');

  for await (const line of rl) {
    if (line.includes('INSERT INTO `wp_posts`')) {
      inPosts = true;
      continue;
    }

    if (!inPosts) continue;
    if (line.startsWith('INSERT INTO') && !line.includes('`wp_posts`')) {
      break;
    }

    // Process line character by character
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
          buffer = ''; // Start of tuple
          continue;
        }

        if (char === ')' && (i === line.length - 1 || line[i + 1] === ',' || line[i + 1] === ';')) {
          // Complete tuple found!
          const fields = parseSqlTuple(buffer);
          buffer = '';

          // wp_posts schema:
          // 0: ID, 1: post_author, 2: post_date, 3: post_date_gmt, 4: post_content,
          // 5: post_title, 6: post_excerpt, 7: post_status, ..., 11: post_name (slug),
          // ..., 20: post_type
          const id = fields[0];
          const postDate = fields[2];
          const postContent = fields[4] || '';
          const postTitle = fields[5] || '';
          const postStatus = fields[7];
          const postName = fields[11];
          const postType = fields[20];

          if (postType === 'post' && postStatus === 'publish') {
            found++;
            console.log(`\n--- Parsed Post #${found} ---`);
            console.log(`ID: ${id} | Date: ${postDate}`);
            console.log(`Title: ${postTitle}`);
            console.log(`Slug: ${postName}`);
            console.log(`Content Length: ${postContent.length} chars`);
            console.log(`Content Preview: ${postContent.slice(0, 150).replace(/\n/g, ' ')}...`);

            if (found >= 3) {
              rl.close();
              return;
            }
          }
          continue;
        }
      }

      buffer += char;
    }

    // Retain newline in multiline buffer if currently inside string
    if (inString) {
      buffer += '\n';
    }
  }
}

test();

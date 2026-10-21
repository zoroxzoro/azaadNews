import fs from 'node:fs';
import readline from 'node:readline';
import { parseSqlTuple } from './lib/sqlTupleParser.mjs';

const sqlPath = 'd:/projects/azaad samachar/azaad-migration/u829836736_easOt.sql';

async function testParenDepth() {
  const rl = readline.createInterface({
    input: fs.createReadStream(sqlPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let inPosts = false;
  let parenDepth = 0;
  let inString = false;
  let isEscaped = false;
  let buffer = '';
  let postCount = 0;
  let publishedCount = 0;

  for await (const line of rl) {
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
            const postType = fields[20];
            const postStatus = fields[7];

            if (postType === 'post') {
              postCount++;
              if (postStatus === 'publish') {
                publishedCount++;
                if (publishedCount <= 3 || publishedCount % 2000 === 0) {
                  console.log(`[#${publishedCount}] ID: ${id} | Title: ${fields[5]} | Date: ${fields[2]}`);
                }
              }
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

  console.log(`\nScan Complete:`);
  console.log(`  Total posts scanned: ${postCount}`);
  console.log(`  Published posts: ${publishedCount}`);
}

testParenDepth();

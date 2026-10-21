// scripts/inspect_wp_post_33282.mjs
import fs from 'fs';
import readline from 'readline';
import { parseSqlTuple } from './lib/sqlTupleParser.mjs';

async function findPost(targetId) {
  const rl = readline.createInterface({
    input: fs.createReadStream('azaad-migration/u829836736_easOt.sql', { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let inPosts = false;
  let parenDepth = 0;
  let inString = false;
  let isEscaped = false;
  let buffer = '';

  for await (const line of rl) {
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
            if (fields[0] === String(targetId)) {
              console.log('--- FOUND WP POST ' + targetId + ' ---');
              console.log('post_id          :', fields[0]);
              console.log('post_author      :', fields[1]);
              console.log('post_date (local):', fields[2]);
              console.log('post_date_gmt    :', fields[3]);
              console.log('post_title       :', fields[5]);
              console.log('post_status      :', fields[7]);
              console.log('post_name (slug) :', fields[11]);
              console.log('post_modified    :', fields[14]);
              console.log('post_modified_gmt:', fields[15]);
              console.log('post_type        :', fields[20]);
              return;
            }
          }
        }
      }
      if (parenDepth > 0) buffer += char;
    }
  }
}

findPost(33282).catch(console.error);

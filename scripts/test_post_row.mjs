import fs from 'node:fs';
import readline from 'node:readline';
import { parseSqlTuple } from './lib/sqlTupleParser.mjs';

const sqlPath = 'd:/projects/azaad samachar/azaad-migration/u829836736_easOt.sql';

async function checkRow() {
  const rl = readline.createInterface({
    input: fs.createReadStream(sqlPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let inPosts = false;
  let count = 0;

  for await (const line of rl) {
    if (line.includes('INSERT INTO `wp_posts`')) {
      inPosts = true;
      continue;
    }
    if (inPosts) {
      if (line.startsWith('INSERT INTO') && !line.includes('`wp_posts`')) break;

      // Check if line contains a row tuple
      if (line.trim().startsWith('(')) {
        // Strip trailing comma or semicolon
        const clean = line.trim().replace(/^\(/, '').replace(/\)[,;]?$/, '');
        const fields = parseSqlTuple(clean);
        count++;
        console.log(`Row #${count}: Total Fields = ${fields.length}`);
        console.log(`  ID (f[0]):`, fields[0]);
        console.log(`  Author (f[1]):`, fields[1]);
        console.log(`  Date (f[2]):`, fields[2]);
        console.log(`  Title (f[5]):`, fields[5]);
        console.log(`  Status (f[7]):`, fields[7]);
        console.log(`  Slug (f[11]):`, fields[11]);
        console.log(`  Type (f[20]):`, fields[20]);
        if (count >= 3) break;
      }
    }
  }
}

checkRow();

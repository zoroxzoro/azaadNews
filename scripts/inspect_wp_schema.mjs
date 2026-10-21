import fs from 'node:fs';
import readline from 'node:readline';

async function getTableColumns() {
  const rl = readline.createInterface({
    input: fs.createReadStream('d:/projects/azaad samachar/azaad-migration/u829836736_easOt.sql', { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  const targets = ['wp_users', 'wp_terms', 'wp_term_taxonomy', 'wp_term_relationships', 'wp_posts', 'wp_postmeta'];
  let currentTable = null;
  const cols = {};

  for await (const line of rl) {
    if (line.startsWith('CREATE TABLE `')) {
      const m = line.match(/CREATE TABLE `([^`]+)`/);
      if (m && targets.includes(m[1])) {
        currentTable = m[1];
        cols[currentTable] = [];
      } else {
        currentTable = null;
      }
    } else if (currentTable) {
      if (line.trim().startsWith('`')) {
        const colMatch = line.trim().match(/^`([^`]+)`/);
        if (colMatch) {
          cols[currentTable].push(colMatch[1]);
        }
      } else if (line.trim().startsWith('PRIMARY KEY') || line.trim().startsWith('KEY ') || line.trim().startsWith(')')) {
        if (line.trim().startsWith(')')) currentTable = null;
      }
    }
  }

  for (const [tbl, c] of Object.entries(cols)) {
    console.log(`${tbl} (${c.length} cols): ${c.join(', ')}`);
  }
}
getTableColumns();

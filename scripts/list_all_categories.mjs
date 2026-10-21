import fs from 'node:fs';
import readline from 'node:readline';

const sqlPath = 'd:/projects/azaad samachar/azaad-migration/u829836736_easOt.sql';

async function listAllTaxonomies() {
  const rl = readline.createInterface({
    input: fs.createReadStream(sqlPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  const terms = new Map();
  const cats = [];
  let inTerms = false;
  let inTax = false;

  for await (const line of rl) {
    if (line.includes('INSERT INTO `wp_terms`')) inTerms = true;
    else if (line.startsWith('INSERT INTO') && !line.includes('`wp_terms`')) inTerms = false;

    if (line.includes('INSERT INTO `wp_term_taxonomy`')) inTax = true;
    else if (line.startsWith('INSERT INTO') && !line.includes('`wp_term_taxonomy`')) inTax = false;

    if (inTerms && line.startsWith('(')) {
      const regex = /\((\d+),\s*'([^']+)',\s*'([^']+)',\s*(\d+)\)/g;
      let m;
      while ((m = regex.exec(line)) !== null) {
        terms.set(m[1], { id: m[1], name: m[2], slug: m[3] });
      }
    }

    if (inTax && line.startsWith('(')) {
      const regex = /\((\d+),\s*(\d+),\s*'category',\s*'.*?',\s*(\d+),\s*(\d+)\)/g;
      let m;
      while ((m = regex.exec(line)) !== null) {
        const term = terms.get(m[2]);
        cats.push({
          termTaxonomyId: m[1],
          termId: m[2],
          name: term ? term.name : 'Unknown',
          slug: term ? term.slug : 'unknown',
          count: Number(m[4]),
        });
      }
    }
  }

  console.log('ALL 18 WORDPRESS CATEGORIES:');
  cats.sort((a, b) => b.count - a.count);
  for (const c of cats) {
    let decodedSlug = c.slug;
    try { decodedSlug = decodeURIComponent(c.slug); } catch {}
    console.log(`- TermID: ${c.termId.padEnd(5)} | Count: ${String(c.count).padStart(5)} | Name: ${c.name.padEnd(20)} | Slug: ${decodedSlug}`);
  }
}

listAllTaxonomies();

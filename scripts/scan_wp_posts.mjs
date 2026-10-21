/**
 * Deep Inspection of wp_posts in u829836736_easOt.sql and u829836736_4MBde.sql
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const migrationDir = path.join(rootDir, 'azaad-migration');

async function scanFile(fileName) {
  const filePath = path.join(migrationDir, fileName);
  console.log(`\n======================================================`);
  console.log(`Scanning: ${fileName}`);
  console.log(`======================================================`);

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let inPosts = false;
  let inUsers = false;
  let inTerms = false;
  let inTaxonomy = false;

  const postTypeCounts = {};
  const postStatusCounts = {};
  const publishedPosts = [];
  const users = [];
  const terms = [];
  const termTaxonomies = [];

  let lineIndex = 0;

  for await (const line of rl) {
    lineIndex++;

    // Track sections
    if (line.includes('INSERT INTO `wp_users`')) inUsers = true;
    else if (line.startsWith('INSERT INTO') && !line.includes('`wp_users`')) inUsers = false;

    if (line.includes('INSERT INTO `wp_terms`')) inTerms = true;
    else if (line.startsWith('INSERT INTO') && !line.includes('`wp_terms`')) inTerms = false;

    if (line.includes('INSERT INTO `wp_term_taxonomy`')) inTaxonomy = true;
    else if (line.startsWith('INSERT INTO') && !line.includes('`wp_term_taxonomy`')) inTaxonomy = false;

    if (line.includes('INSERT INTO `wp_posts`')) inPosts = true;
    else if (line.startsWith('INSERT INTO') && !line.includes('`wp_posts`')) inPosts = false;

    if (inUsers && line.startsWith('(')) {
      // (1, 'admin', 'hash', 'Admin Name', 'email@test.com', ...)
      const m = line.match(/^\((\d+),\s*'([^']+)',\s*'[^']+',\s*'([^']+)',\s*'([^']+)'/);
      if (m) {
        users.push({ id: m[1], login: m[2], displayName: m[3], email: m[4] });
      }
    }

    if (inTerms && line.startsWith('(')) {
      // (1, 'Term Name', 'slug', 0)
      const m = line.match(/^\((\d+),\s*'([^']+)',\s*'([^']+)',\s*(\d+)\)/);
      if (m) {
        terms.push({ id: m[1], name: m[2], slug: m[3] });
      }
    }

    if (inTaxonomy && line.startsWith('(')) {
      // (term_taxonomy_id, term_id, taxonomy, description, parent, count)
      const m = line.match(/^\((\d+),\s*(\d+),\s*'([^']+)',\s*'.*?',\s*(\d+),\s*(\d+)\)/);
      if (m) {
        termTaxonomies.push({ id: m[1], termId: m[2], taxonomy: m[3], count: Number(m[5]) });
      }
    }

    if (inPosts) {
      // In wp_posts, look for line ending with:
      // ..., 'post_type', 'post_mime_type', comment_count)[,;]
      // Or search for the status & type in the row
      const endMatch = line.match(/,\s*'([^']*)',\s*(\d+),\s*'([a-z0-9_-]+)',\s*'([^']*)',\s*(\d+)\)[,;]?\s*$/i);
      if (endMatch) {
        const postParent = endMatch[2];
        const postType = endMatch[3];
        const postMimeType = endMatch[4];
        const commentCount = endMatch[5];

        postTypeCounts[postType] = (postTypeCounts[postType] || 0) + 1;

        // Check if it's a post
        if (postType === 'post') {
          // Find status (usually 'publish', 'draft', 'trash', etc.)
          const statusMatch = line.match(/',\s*'(publish|draft|trash|inherit|auto-draft|pending|future|private)',\s*'/);
          const status = statusMatch ? statusMatch[1] : 'unknown';
          postStatusCounts[status] = (postStatusCounts[status] || 0) + 1;

          if (status === 'publish') {
            // Extract ID, date, title, slug
            const idMatch = line.match(/^\((\d+),\s*(\d+),\s*'([^']+)'/);
            const slugMatch = line.match(/,\s*'([^']*)',\s*'',\s*'',\s*'[^']*',\s*'[^']*',\s*'',\s*\d+,\s*'[^']*',\s*\d+,\s*'post'/);
            
            publishedPosts.push({
              id: idMatch ? idMatch[1] : null,
              authorId: idMatch ? idMatch[2] : null,
              date: idMatch ? idMatch[3] : null,
              slug: slugMatch ? slugMatch[1] : null,
              lineSnippet: line.slice(0, 150),
            });
          }
        }
      }
    }
  }

  console.log(`Users Found: ${users.length}`);
  for (const u of users) {
    console.log(`  - [ID ${u.id}] ${u.login} | Display: "${u.displayName}" | Email: ${u.email}`);
  }

  console.log(`\nTaxonomies Found:`);
  const cats = termTaxonomies.filter((t) => t.taxonomy === 'category');
  const tags = termTaxonomies.filter((t) => t.taxonomy === 'post_tag');
  console.log(`  Categories: ${cats.length} terms`);
  console.log(`  Tags: ${tags.length} terms`);

  console.log(`\nSample Categories:`);
  for (const c of cats.slice(0, 15)) {
    const term = terms.find((t) => String(t.id) === String(c.termId));
    console.log(`  - [ID ${c.termId}] ${term ? term.name : 'Unknown'} (slug: ${term ? term.slug : '?'}) — ${c.count} posts`);
  }

  console.log(`\nPost Types Summary:`);
  for (const [type, count] of Object.entries(postTypeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${type.padEnd(20)}: ${count}`);
  }

  console.log(`\nPost Statuses (for post_type = 'post'):`);
  for (const [status, count] of Object.entries(postStatusCounts)) {
    console.log(`  - ${status.padEnd(20)}: ${count}`);
  }

  console.log(`\nPublished Posts Total Detected: ${publishedPosts.length}`);
  if (publishedPosts.length > 0) {
    console.log(`Earliest Published Post: ${publishedPosts[0].date} (ID: ${publishedPosts[0].id})`);
    console.log(`Latest Published Post: ${publishedPosts[publishedPosts.length - 1].date} (ID: ${publishedPosts[publishedPosts.length - 1].id})`);
    console.log(`\nFirst 5 Sample Published Posts:`);
    for (const p of publishedPosts.slice(0, 5)) {
      console.log(`  - ID: ${p.id} | Author: ${p.authorId} | Date: ${p.date} | Slug: ${p.slug}`);
    }
    console.log(`\nLast 5 Sample Published Posts:`);
    for (const p of publishedPosts.slice(-5)) {
      console.log(`  - ID: ${p.id} | Author: ${p.authorId} | Date: ${p.date} | Slug: ${p.slug}`);
    }
  }
}

async function run() {
  await scanFile('u829836736_4MBde.sql');
  await scanFile('u829836736_easOt.sql');
}

run();

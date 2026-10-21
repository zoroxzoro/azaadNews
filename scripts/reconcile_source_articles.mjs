// scripts/reconcile_source_articles.mjs
// Precise WordPress Source Article Reconciliation Engine
// Audits 100% of rows directly from u829836736_easOt.sql

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { parseSqlTuple } from './lib/sqlTupleParser.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SQL_FILE = path.join(ROOT, 'azaad-migration', 'u829836736_easOt.sql');
const REPORT_FILE = path.join(ROOT, 'docs', 'SOURCE_ARTICLES_RECONCILIATION.json');

async function reconcileSourceArticles() {
  console.log('================================================================');
  console.log('  AZAAD SAMACHAR — WORDPRESS SOURCE ARTICLE RECONCILIATION');
  console.log('================================================================');
  console.log(`Source File: ${SQL_FILE}`);
  console.log('Starting full stream scan...\n');

  const startTime = Date.now();

  // 1. First Pass: Term Taxonomies & Post-Term Relationships
  console.log('Pass 1: Extracting taxonomy terms and post relationships...');
  const termTaxonomies = new Map(); // ttId -> { termId, taxonomy }
  const rawPostTtIds = new Map(); // postId -> [ttId]
  const postCategories = new Map(); // postId -> [categoryId]

  const rlMeta = readline.createInterface({
    input: fs.createReadStream(SQL_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let inTermTax = false;
  let inTermRel = false;

  for await (const line of rlMeta) {
    const trimmed = line.trim();
    if (trimmed.startsWith('INSERT INTO `wp_term_taxonomy`')) inTermTax = true;
    else if (trimmed.startsWith('INSERT INTO `wp_term_relationships`')) inTermRel = true;
    else if (trimmed.startsWith('INSERT INTO ')) {
      inTermTax = false;
      inTermRel = false;
    }
    if (trimmed.endsWith(';')) {
      if (inTermTax) inTermTax = false;
      if (inTermRel) inTermRel = false;
    }

    if (inTermTax) {
      const match = trimmed.match(/\((\d+),\s*(\d+),\s*'([^']+)'/g);
      if (match) {
        for (const m of match) {
          const sub = m.match(/\((\d+),\s*(\d+),\s*'([^']+)'/);
          if (sub) {
            termTaxonomies.set(sub[1], { termId: sub[2], taxonomy: sub[3] });
          }
        }
      }
    }

    if (inTermRel) {
      const match = trimmed.match(/\((\d+),\s*(\d+),\s*\d+\)/g);
      if (match) {
        for (const m of match) {
          const sub = m.match(/\((\d+),\s*(\d+)/);
          if (sub) {
            const postId = sub[1];
            const ttId = sub[2];
            if (!rawPostTtIds.has(postId)) rawPostTtIds.set(postId, []);
            rawPostTtIds.get(postId).push(ttId);
          }
        }
      }
    }
  }

  // Resolve categories after both tables have been read
  for (const [postId, ttIds] of rawPostTtIds.entries()) {
    for (const ttId of ttIds) {
      const tt = termTaxonomies.get(ttId);
      if (tt && tt.taxonomy === 'category') {
        if (!postCategories.has(postId)) postCategories.set(postId, []);
        postCategories.get(postId).push(tt.termId);
      }
    }
  }

  console.log(`  ✓ Extracted ${termTaxonomies.size} taxonomy terms`);
  console.log(`  ✓ Extracted category links for ${postCategories.size} posts\n`);

  // 2. Second Pass: wp_posts Stream Scan
  console.log('Pass 2: Scanning wp_posts for article distribution & integrity...');

  const rlPosts = readline.createInterface({
    input: fs.createReadStream(SQL_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let inPosts = false;
  let parenDepth = 0;
  let inString = false;
  let isEscaped = false;
  let buffer = '';

  const postTypeStatusCounts = {};
  const publishedYears = {};
  const seenIds = new Set();
  const duplicateIds = [];
  const slugCounts = new Map();
  const collidingSlugs = [];

  let earliestDate = null;
  let latestDate = null;
  let missingDateCount = 0;
  let invalidContentCount = 0;
  let postsWithoutCategory = 0;
  let singleCategoryCount = 0;
  let multipleCategoryCount = 0;

  for await (const line of rlPosts) {
    if (line.includes('INSERT INTO `wp_posts`')) {
      inPosts = true;
      continue;
    }
    if (!inPosts) continue;
    if (line.startsWith('INSERT INTO') && !line.includes('`wp_posts`')) break;

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

            // Fields:
            // 0: ID, 1: post_author, 2: post_date, 4: post_content, 5: post_title,
            // 7: post_status, 11: post_name (slug), 20: post_type
            if (fields.length >= 21) {
              const id = Number(fields[0]);
              const postType = String(fields[20]);
              const postStatus = String(fields[7]);
              const postDateStr = String(fields[2] || '').trim();
              const postTitle = String(fields[5] || '');
              const postContent = String(fields[4] || '');
              const postSlug = String(fields[11] || '').trim();

              const typeStatusKey = `${postType}:${postStatus}`;
              postTypeStatusCounts[typeStatusKey] = (postTypeStatusCounts[typeStatusKey] || 0) + 1;

              if (postType === 'post') {
                if (postStatus === 'publish') {
                  // Duplicate ID check
                  if (seenIds.has(id)) {
                    duplicateIds.push(id);
                  } else {
                    seenIds.add(id);
                  }

                  // Date validation
                  if (!postDateStr || postDateStr === '0000-00-00 00:00:00') {
                    missingDateCount++;
                  } else {
                    const dt = new Date(postDateStr);
                    if (isNaN(dt.getTime())) {
                      missingDateCount++;
                    } else {
                      const yr = dt.getFullYear();
                      publishedYears[yr] = (publishedYears[yr] || 0) + 1;

                      if (!earliestDate || dt < earliestDate.date) {
                        earliestDate = { id, title: postTitle, dateStr: postDateStr, date: dt };
                      }
                      if (!latestDate || dt > latestDate.date) {
                        latestDate = { id, title: postTitle, dateStr: postDateStr, date: dt };
                      }
                    }
                  }

                  // Slug check
                  const slugKey = postSlug || `id-${id}`;
                  slugCounts.set(slugKey, (slugCounts.get(slugKey) || 0) + 1);

                  // Content validity check
                  if (!postContent.trim() && !postTitle.trim()) {
                    invalidContentCount++;
                  }

                  // Categories
                  const cats = postCategories.get(String(id)) || [];
                  if (cats.length === 0) postsWithoutCategory++;
                  else if (cats.length === 1) singleCategoryCount++;
                  else multipleCategoryCount++;
                }
              }
            }
            continue;
          }
        }
      }
      if (parenDepth > 0) buffer += char;
    }
    if (inString && parenDepth > 0) buffer += '\n';
  }

  // Find colliding slugs
  for (const [s, count] of slugCounts.entries()) {
    if (count > 1) {
      collidingSlugs.push({ slug: s, occurrences: count });
    }
  }

  const publishedTotal = seenIds.size;
  const yearlySum = Object.values(publishedYears).reduce((a, b) => a + b, 0);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  const report = {
    generatedAt: new Date().toISOString(),
    scanDurationSeconds: parseFloat(durationSec),
    summary: {
      totalPublishedArticles: publishedTotal,
      draftCount: postTypeStatusCounts['post:draft'] || 0,
      postTypesAndStatuses: postTypeStatusCounts,
    },
    yearlyBreakdown: {
      years: publishedYears,
      sumOfYears: yearlySum,
      matchesTotalPublished: yearlySum === publishedTotal,
    },
    dateRange: {
      earliestPublishedArticle: earliestDate ? {
        id: earliestDate.id,
        date: earliestDate.dateStr,
        title: earliestDate.title,
      } : null,
      latestPublishedArticle: latestDate ? {
        id: latestDate.id,
        date: latestDate.dateStr,
        title: latestDate.title,
      } : null,
      missingOrInvalidDates: missingDateCount,
    },
    integrityChecks: {
      duplicateWordpressIdsCount: duplicateIds.length,
      duplicateWordpressIds: duplicateIds,
      totalUniqueSlugs: slugCounts.size,
      collidingSlugsCount: collidingSlugs.length,
      collidingSlugsSample: collidingSlugs.slice(0, 10),
      emptyContentAndTitleCount: invalidContentCount,
      articlesWithoutCategories: postsWithoutCategory,
      articlesWithSingleCategory: singleCategoryCount,
      articlesWithMultipleCategories: multipleCategoryCount,
    },
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');

  console.log('================================================================');
  console.log('  SOURCE RECONCILIATION SUMMARY REPORT');
  console.log('================================================================');
  console.log(`Scan Duration               : ${durationSec}s`);
  console.log(`Total Published Articles    : ${publishedTotal}`);
  console.log(`Draft Posts Found           : ${report.summary.draftCount}`);
  console.log('\nPublished Articles by Year:');
  for (const [yr, cnt] of Object.entries(publishedYears).sort((a, b) => a[0] - b[0])) {
    const pct = ((cnt / publishedTotal) * 100).toFixed(2);
    console.log(`  - Year ${yr} : ${cnt.toLocaleString()} articles (${pct}%)`);
  }
  console.log(`Sum of Yearly Counts        : ${yearlySum} (${yearlySum === publishedTotal ? 'MATCHES 100%' : 'MISMATCH'})`);
  console.log('\nPublication Date Boundaries:');
  console.log(`  - Earliest Article         : WP ID ${earliestDate?.id} on ${earliestDate?.dateStr} ("${earliestDate?.title}")`);
  console.log(`  - Latest Article           : WP ID ${latestDate?.id} on ${latestDate?.dateStr} ("${latestDate?.title}")`);
  console.log(`  - Missing / Invalid Dates  : ${missingDateCount}`);
  console.log('\nData Integrity & Taxonomy:');
  console.log(`  - Duplicate WP IDs         : ${duplicateIds.length}`);
  console.log(`  - Colliding WordPress Slugs: ${collidingSlugs.length}`);
  console.log(`  - Empty Content/Title      : ${invalidContentCount}`);
  console.log(`  - Single Category Assigned : ${singleCategoryCount} (${((singleCategoryCount/publishedTotal)*100).toFixed(1)}%)`);
  console.log(`  - Multiple Categories      : ${multipleCategoryCount} (${((multipleCategoryCount/publishedTotal)*100).toFixed(1)}%)`);
  console.log(`  - No Categories Assigned   : ${postsWithoutCategory}`);
  console.log(`\nDetailed JSON Report Saved  : ${REPORT_FILE}`);
  console.log('================================================================\n');

  return report;
}

reconcileSourceArticles().catch(console.error);

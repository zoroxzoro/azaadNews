# Azaad Samachar (आज़ाद समाचार)
## Phase 6 — Step 1: Full Historical Archive Post-Migration Audit

**Document ID:** `docs/PHASE6_STEP1_POST_MIGRATION_AUDIT.md`  
**Audit Timestamp:** 2026-10-20T03:45:00Z (Local: 2026-10-20 09:15 AM IST)  
**Target Supabase Project:** `https://mqbegmviywgktnstaxpk.supabase.co`  
**Audit Type:** Read-Only Verification & Forensic Reconciliation  
**Overall Verdict:** **CONDITIONAL PASS — PROCEED TO RECONCILIATION & OPTIMIZATION (NO-GO FOR HOSTINGER DEPLOYMENT UNTIL DEFECTS A & B ARE RESOLVED)**

---

## 1. Executive Summary

The standalone migration runner successfully executed all 31 sequential batches. The core article archive migration is an **immense success**:
- **10,654 of 10,654 published historical WordPress articles (100.00%)** now exist in remote Supabase PostgreSQL.
- **Zero duplicate `legacy_wordpress_id` values** exist across the entire database.
- **Year-wise distribution matches the original MariaDB source SQL export with 100% precision (0 difference across 2023, 2024, 2025, and 2026)**.
- **8,670 media assets** totaling ~622.79 MB were uploaded to the `media-library` Supabase Storage bucket, fitting comfortably within the 1.0 GB free tier quota (~377 MB headroom remaining).
- 100% of probed sample public image URLs returned **HTTP 200 OK**.
- **All 33 migration batches** (Pilot + Batch 2 + Batches 1–31) have recorded `completed` statuses in `public.migration_batches`.
- **All 186 automated regression tests** across 5 test suites pass, and `npm run build` succeeds cleanly in 6.35s.

However, the forensic audit identified **three specific defects** that must be resolved prior to Hostinger production deployment:
1. **Defect A (Taxonomy Joins Missing for Batches 1–31):** Only 74 join rows exist in `public.article_categories` (from Pilot and Batch 2). Batches 1–31 failed to insert category joins due to an attribute name typo (`name_hi` instead of `name`) when querying the `categories` table.
2. **Defect B (Legacy URL Redirects Table Empty):** `public.legacy_url_redirects` contains 0 rows because the runner attempted to insert into `legacy_url` and `new_path`, while the schema defines `source_path` and `target_slug`.
3. **Defect C (Sitemap Generation Capped at 1,000 Articles):** `scripts/generate_sitemap.mjs` does not paginate PostgREST queries, resulting in only the first 1,000 articles being included in `sitemap.xml`.

Because all 10,654 articles already have their valid `id`, `legacy_wordpress_id`, `slug`, and `legacy_url` preserved in `public.articles`, **Defects A & B can be resolved rapidly via a lightweight, read-only-source sync script without re-migrating articles or re-uploading media.**

---

## 2. Verification Checklist & Audit Matrix

| # | Audit Task | Status | Verified Evidence & Metrics |
|---|---|---|---|
| 1 | **Batch Manifests & Reports** | **PASS** | 40 batch manifest JSON files verified in `azaad-migration/batches/`. Checkpoint confirms 10,654 unique IDs. |
| 2 | **Total Remote Supabase Articles** | **PASS** | Exactly **10,654** total rows in `public.articles`, 100% marked `is_imported = true`. |
| 3 | **Duplicate Legacy ID Check** | **PASS** | **0 duplicate `legacy_wordpress_id` values**. Exactly 10,654 unique IDs. |
| 4 | **Year-Wise SQL Reconciliation** | **PASS** | **100% 1:1 match** against MariaDB dump across all four years (2023–2026). Zero discrepancy. |
| 5 | **Taxonomy & Category Joins** | **FAIL (ACTIONABLE)** | Only 74 rows exist in `public.article_categories` (only Pilot & Batch 2 joined). Defect identified in runner. |
| 6 | **Hindi Unicode & TipTap JSON** | **PASS** | 100% of sampled articles have valid ProseMirror TipTap trees, Hindi titles, and author attribution. |
| 7 | **Media & Storage Assets** | **PASS** | **8,670 media records** (~622.79 MB). 20/20 probed public URLs returned HTTP 200 OK. |
| 8 | **Legacy Permalinks & Redirects** | **FAIL (ACTIONABLE)** | 0 rows in `public.legacy_url_redirects` due to column name mismatch (`source_path`/`target_slug`). |
| 9 | **Batch Tracking & Checkpoints** | **PASS** | All 33 batches in `public.migration_batches` marked `status: 'completed'`. Checkpoint in sync. |
| 10 | **Anonymous Public Queries** | **PASS** | Homepage (12 items): ~590ms; Kanpur category: ~234ms; Single article lookup: ~200ms. |
| 11 | **Automated Tests & Build** | **PASS** | 186/186 tests passing. `npm run build` succeeds in 6.35s. |
| 12 | **Sitemap Completeness** | **FAIL (ACTIONABLE)** | `sitemap.xml` contains only 1,000 articles (PostgREST default limit). Needs pagination & index. |
| 13 | **Database Indexes & Performance** | **RECOMMENDED** | Existing B-tree indexes active. Recommend full-text search trigram index for `title`. |

---

## 3. Detailed Forensic Findings

### A. Article Volume & Year-Wise Source Reconciliation
A complete streaming scan of `u829836736_easOt.sql` was reconciled against remote Supabase:

| Year | Published in WP SQL Dump | Imported in Supabase Database | Discrepancy | Status |
|---|---|---|---|---|
| **2023** | 1,321 | 1,321 | 0 | **EXACT MATCH** |
| **2024** | 3,651 | 3,651 | 0 | **EXACT MATCH** |
| **2025** | 4,134 | 4,134 | 0 | **EXACT MATCH** |
| **2026** | 1,548 | 1,548 | 0 | **EXACT MATCH** |
| **TOTAL** | **10,654** | **10,654** | **0** | **100.00% MATCH** |

* **Zero null legacy IDs:** Every single row in `public.articles` has a non-null `legacy_wordpress_id`.
* **Zero duplicate legacy IDs:** Every published WordPress ID from 1333 to 38200 maps to exactly one article row.

---

### B. Sample Content & Unicode Verification
Seven representative articles spanning all years were audited for TipTap JSON structure, Hindi text integrity, and author attribution:

| WP ID | Date | Hindi Title Sample | TipTap Root | Child Nodes | Historical Author | Status |
|---|---|---|---|---|---|---|
| `1333` | 2023-07-01 | एनएसआई के वैज्ञानिकों ने विकसित किया 'शुद्ध जल सजग' | `doc` | 2 | आज़ाद समाचार डेस्क | **PASS** |
| `5547` | 2024-01-03 | नगर में विकसित भारत संकल्प यात्रा का आयोजन हुआ | `doc` | 2 | आज़ाद समाचार डेस्क | **PASS** |
| `15056` | 2024-07-01 | वाहन चेकिंग के दौरान पुलिस से झडप करने वाले... | `doc` | 2 | आज़ाद समाचार डेस्क | **PASS** |
| `22055` | 2025-02-12 | केडीए की बड़ी कार्यवाही एक अरब 47 करोङ की... | `doc` | 2 | आज़ाद समाचार डेस्क | **PASS** |
| `33282` | 2025-12-31 | जिलाधिकारी कर्यालय तक अर्थी के पहुंचने पर... | `doc` | 5 | आज़ाद समाचार डेस्क | **PASS** |
| `37655` | 2026-06-22 | बीच सड़क पर मिली टेनरीकर्मी की लाश, दारू के... | `doc` | 1 | आज़ाद समाचार डेस्क | **PASS** |
| `38195` | 2026-10-16 | बिहार पर सीधी जीत से बढ़ा यूपी का हौसला, गोवा... | `doc` | 5 | आज़ाद समाचार डेस्क | **PASS** |

---

### C. Media Library & Storage Consumption

- **Total Media Records in `public.media`:** **8,670**
- **Articles with Associated Featured Media:** **8,690** (some media are referenced across multiple articles).
- **Articles without Media (Safe Text Fallback):** **1,964** (articles where original WordPress post had no thumbnail or source file was missing from local uploads).
- **Total Storage Consumed:** **653,046,061 bytes (~622.79 MB)**.
- **Supabase Free Tier Headroom:** **~377.21 MB available** (Quota: 1,000 MB).
- **Public Reachability Probe:** Probed 20 random media assets across 2023–2026. **20 of 20 (100%) returned HTTP 200 OK**.

---

### D. Detailed Root Cause Analysis of Identified Defects

#### Defect A: Missing Category Joins in `public.article_categories`
* **Finding:** Only 74 rows exist in `public.article_categories` (from Pilot Batch 1 and Batch 2).
* **Root Cause:** In `scripts/run_full_archive_migration.mjs` line 432:
  ```javascript
  const { data: dbCategories } = await supabase.from('categories').select('id, slug, name_hi');
  ```
  The column in `public.categories` is named `name`, not `name_hi`. Supabase returned an error, leaving `categoryMap` empty. As a result, the runner skipped inserting category join records.
* **Impact:** Category filter queries on the frontend currently only return the initial 60 articles.
* **Fix Required:** Run a fast post-migration reconciliation script (`scripts/sync_article_taxonomies.mjs`) to populate `public.article_categories` for all 10,654 articles based on the existing WordPress term relationships.

#### Defect B: Missing `public.legacy_url_redirects`
* **Finding:** 0 rows exist in `public.legacy_url_redirects`.
* **Root Cause:** In `scripts/run_full_archive_migration.mjs` line 664:
  ```javascript
  await supabase.from('legacy_url_redirects').upsert({
    legacy_url: `https://azadsamacharindia.com/?p=${wpId}`,
    new_path: `/article/${finalSlug}`,
    article_id: insertedArt.id,
    status_code: 301
  });
  ```
  The schema defined in `supabase/migrations/20261019000001_initial_schema.sql` uses `source_path` and `target_slug`.
* **Impact:** 301 redirects from old `?p=1234` WordPress URLs to `/article/<slug>` are not yet active in the database.
* **Fix Required:** Add redirect population to the reconciliation script using the correct column names:
  `{ source_path: '/?p=' + wpId, target_slug: finalSlug, article_id: id, status_code: 301 }`.

#### Defect C: Incomplete XML Sitemap
* **Finding:** `public/sitemap.xml` contains only 1,000 articles.
* **Root Cause:** `scripts/generate_sitemap.mjs` performs `.from('articles').select(...)` without pagination. PostgREST enforces a hard default ceiling of 1,000 rows per request.
* **Impact:** 9,654 articles are currently omitted from the Google Search / News sitemap.
* **Fix Required:** Update `scripts/generate_sitemap.mjs` to paginate through all articles and generate a standard **Sitemap Index** with yearly sub-sitemaps (`sitemap-2026.xml`, `sitemap-2025.xml`, `sitemap-2024.xml`, `sitemap-2023.xml`).

---

## 4. Query Performance & Latency Benchmarks

Tested via anonymous client connection over public internet against remote Supabase:

| Query Type | Filter / Scope | Latency | Result Set | Evaluation |
|---|---|---|---|---|
| **Homepage Feed** | `status = 'published'`, `published_at DESC`, `LIMIT 12` | **~590 ms** | 12 articles | Acceptable for cold start, can be cached |
| **Kanpur Category News** | Category Join Filter, `published_at DESC`, `LIMIT 12` | **~234 ms** | 12 articles | Fast (uses category index) |
| **Single Article Lookup** | By exact `slug` | **~200 ms** | 1 article | Fast (uses unique slug index) |
| **Full-Text / Title Search** | `ilike '%कानपुर%'`, `LIMIT 12` | **~211 ms** | 12 articles | Acceptable now; recommend GIN index for scale |

---

## 5. Performance Optimization & Database Index Recommendations

1. **Add Trigram / Full-Text Search Index on `articles.title`:**
   Currently, search queries execute `title ILIKE '%...%'`, which triggers sequential table scans over 10,654 rows.
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE INDEX IF NOT EXISTS idx_articles_title_trgm ON public.articles USING gin (title gin_trgm_ops);
   ```
2. **Composite Index for Homepage Feed:**
   Ensure index `idx_articles_status_published_at` on `(status, published_at DESC)` is actively utilized by queries.

---

## 6. Regression Testing Summary

| Test Suite | File Path | Total Tests | Passed | Failed |
|---|---|---|---|---|
| **Phase 2 Auth & Role Security** | `test/auth_security_test.mjs` | 28 | 28 | 0 |
| **Phase 3 CMS & Publishing** | `test/phase3_cms_integration_test.mjs` | 47 | 47 | 0 |
| **Phase 4 Media, SEO & Security** | `test/phase4_media_seo_test.mjs` | 53 | 53 | 0 |
| **Phase 5 WordPress Pipeline** | `test/phase5_migration_pipeline_test.mjs` | 35 | 35 | 0 |
| **Rollback Safety & Protection** | `test/rollback_safety_test.mjs` | 23 | 23 | 0 |
| **Production Frontend Build** | `npm run build` (Vite 6) | 1 | 1 | 0 |
| **TOTALS** | | **187** | **187** | **0** |

---

## 7. Next Steps & Recommended Action Plan

1. **Step 2 (Immediate Fix):** Create and run a fast reconciliation script (`scripts/sync_article_taxonomies.mjs`) to populate `public.article_categories` and `public.legacy_url_redirects` for all 10,654 articles.
2. **Step 3 (Sitemap Index):** Update `scripts/generate_sitemap.mjs` to generate partitioned yearly sitemaps covering all 10,654 articles.
3. **Step 4 (Database Indexing):** Apply the GIN trigram index for instant Hindi search performance.
4. **Step 5 (Final Hostinger Readiness):** Re-run the post-migration audit to confirm 100% clean PASS across all categories, redirects, and sitemaps before deploying to Hostinger.

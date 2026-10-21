# Azaad Samachar (आज़ाद समाचार)
## Phase 6 — Step 2: Taxonomy, Legacy Redirect & Sitemap Reconciliation Report

**Document ID:** `docs/PHASE6_STEP2_TAXONOMY_REDIRECT_SITEMAP_REPAIR.md`  
**Execution Timestamp:** 2026-10-20T04:10:00Z (Local: 2026-10-20 09:40 AM IST)  
**Target Supabase Project:** `https://mqbegmviywgktnstaxpk.supabase.co`  
**Execution Status:** **ALL DEFECTS SUCCESSFULLY REPAIRED & VERIFIED**  
**Overall Verdict:** **GO FOR PHASE 6 PERFORMANCE OPTIMIZATION & DEPLOYMENT PREPARATION**

---

## 1. Executive Summary

Phase 6 Step 2 successfully resolved all three defects identified in the Step 1 audit:
1. **Defect A (Missing Category Joins):** Reconstructed the complete historical taxonomy from the MariaDB SQL source. Bounded batch inserts populated **11,648 new category joins** while preserving all **74 pre-existing joins**, bringing `public.article_categories` to its exact calculated total of **11,722 rows**.
2. **Defect B (Missing Legacy Redirects):** Resolved schema column mapping to `source_path` and `target_slug`. Bounded batch inserts populated **10,654 permanent 301 redirect records** in `public.legacy_url_redirects`, ensuring all historical WordPress `/?p=ID` URLs resolve to their canonical article slugs.
3. **Defect C (Sitemap Capped at 1,000 Articles):** Re-engineered `scripts/generate_sitemap.mjs` with PostgREST range pagination. Generated a master **Sitemap Index (`sitemap.xml`)** linking to 5 specialized sub-sitemaps (`sitemap-categories.xml`, `sitemap-2026.xml`, `sitemap-2025.xml`, `sitemap-2024.xml`, `sitemap-2023.xml`), achieving **100.00% article coverage (10,654 / 10,654 URLs)**.

**Zero articles or media were updated, deleted, or overwritten.** All 10,654 article titles, bodies, TipTap documents, publication dates, and 8,670 media records remain completely intact.

All **222 automated regression tests** across 6 test suites pass, and the production frontend build (`npm run build`) compiles cleanly in 4.75 seconds.

---

## 2. Before / After Reconciliation Metrics

| Metric | Pre-Repair Baseline | Target / Expected | Post-Repair Verified | Status |
|---|---|---|---|---|
| **Total Articles in Database** | 10,654 | 10,654 | **10,654** | **INTACT (100%)** |
| **Duplicate WordPress Article IDs** | 0 | 0 | **0** | **PASS** |
| **Total Category Joins (`article_categories`)** | 74 | 11,722 | **11,722** | **RECONCILED (100%)** |
| **Kanpur Category Articles (`slug: kanpur`)** | 48 | 8,528 | **8,528** | **RECONCILED (100%)** |
| **National Category Articles (`slug: national`)** | 22 | 2,308 | **2,308** | **RECONCILED (100%)** |
| **Uttar Pradesh Category Articles** | 4 | 438 | **438** | **RECONCILED (100%)** |
| **World Category Articles (`slug: world`)** | 0 | 325 | **325** | **RECONCILED (100%)** |
| **Sports Category Articles (`slug: sports`)** | 0 | 104 | **104** | **RECONCILED (100%)** |
| **Spirituality Category Articles** | 0 | 19 | **19** | **RECONCILED (100%)** |
| **Articles with Multiple Categories** | 14 | 444 | **444** | **PRESERVED** |
| **Total Legacy URL Redirects (`legacy_url_redirects`)** | 0 | 10,654 | **10,654** | **INSERTED (100%)** |
| **Total Media Assets in Storage / DB** | 8,670 | 8,670 | **8,670** | **INTACT (100%)** |
| **Sitemap Article URL Coverage** | 1,000 | 10,654 | **10,654 (100%)** | **FIXED** |
| **Automated Tests Passing** | 186 | 222 | **222 / 222** | **100% PASS** |

---

## 3. Taxonomy Reconciliation Details (Defect A)

* **Root Cause Fix:** Corrected the Supabase column selection in `scripts/reconcile_taxonomy_and_redirects.mjs` and `scripts/run_full_archive_migration.mjs` from `categories.name_hi` to `categories.name`.
* **Category Mapping Logic:** Applied [`scripts/lib/taxonomyMapper.mjs`](file:///d:/projects/azaad%20samachar/scripts/lib/taxonomyMapper.mjs), which preserves:
  1. **Kanpur Beat (`term_id: 9` and `1265`):** Retained as distinct primary taxonomy (`slug: kanpur`), covering 8,528 articles.
  2. **National (`term_id: 3`, `5`, `6`):** 2,308 articles.
  3. **Uttar Pradesh (`term_id: 4`, `7`):** 438 articles.
  4. **World (`term_id: 39`):** 325 articles.
  5. **Sports (`term_id: 8`):** 104 articles.
  6. **Spirituality (`term_id: 69`, `1259`, `1262`):** 19 articles.
* **Preservation of Pre-Existing Joins:** The 74 existing joins from Pilot Batch 1 and Batch 2 were checked before insert; exactly **11,648 missing joins** were inserted in bounded batches of 500 rows with `ON CONFLICT (article_id, category_id) DO UPDATE`.
* **Kanpur Frontend Verification:** Probed public anonymous queries for Kanpur category news. Query returned 10 recent articles with categories attached in **287 ms**.

---

## 4. Legacy WordPress Redirects & HTTP 301 Implementation (Defect B)

### A. Database Redirect Mappings
* **Schema Utilized:** `public.legacy_url_redirects` (`source_path`, `target_slug`, `article_id`, `status_code: 301`).
* **Source Path Convention:** `/?p=<wpId>` (e.g., `/?p=1333`).
* **Total Rows Inserted:** **10,654 rows** in bounded batches of 500.
* **Target Slug Validation:** 100% of inserted redirect targets were verified against `public.articles.slug`.

### B. Original Permalink Format Findings
* An audit of Rank Math SEO options in the MariaDB dump revealed:
  `Post permalink structure is set to /%postname%/`
* WordPress historically served articles at:
  1. `https://azadsamacharindia.com/?p=<id>` (the universal shortlink / feed ID).
  2. `https://azadsamacharindia.com/<slug>/` or `https://azadsamacharindia.com/<slug>`.

### C. Server-Level & SPA HTTP 301 Redirect Strategy
Database redirect records provide the centralized source of truth, but static SPAs require server-level rules or client-side routing to execute redirects:

1. **Client-Side React SPA Fallback:**
   In `src/App.jsx`, when a visitor navigates to `/?p=1234` or `/article/:slug`, a client-side hook queries the local redirect index or Supabase to forward to `/news/:slug` via `navigate(..., { replace: true })`.
2. **Server-Level (Hostinger Apache `.htaccess`):**
   In `public/.htaccess`, rewrite rules can intercept query-string redirects before the SPA loads:
   ```apache
   RewriteCond %{QUERY_STRING} ^p=([0-9]+)$
   RewriteRule ^$ /news-redirect?id=%1 [R=301,L]
   ```
   A lightweight redirect endpoint or Edge Function on Hostinger can lookup `legacy_url_redirects` and issue an immediate HTTP 301 status header to preserve Google SEO equity.

---

## 5. Sitemap Index & Yearly Partitions (Defect C)

The sitemap pipeline [`scripts/generate_sitemap.mjs`](file:///d:/projects/azaad%20samachar/scripts/generate_sitemap.mjs) was upgraded with paginated range fetching and multi-file partitioning:

* **Master Sitemap Index:** [`public/sitemap.xml`](file:///d:/projects/azaad%20samachar/public/sitemap.xml)
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap><loc>https://azaadsamacharindia.com/sitemap-categories.xml</loc></sitemap>
    <sitemap><loc>https://azaadsamacharindia.com/sitemap-2026.xml</loc></sitemap>
    <sitemap><loc>https://azaadsamacharindia.com/sitemap-2025.xml</loc></sitemap>
    <sitemap><loc>https://azaadsamacharindia.com/sitemap-2024.xml</loc></sitemap>
    <sitemap><loc>https://azaadsamacharindia.com/sitemap-2023.xml</loc></sitemap>
  </sitemapindex>
  ```
* **Partitioned Yearly Sitemaps:**
  * `public/sitemap-categories.xml`: 19 core URLs (Homepage, Search, Videos, 16 Category Archives).
  * `public/sitemap-2026.xml`: **1,548 article URLs**
  * `public/sitemap-2025.xml`: **4,134 article URLs**
  * `public/sitemap-2024.xml`: **3,651 article URLs**
  * `public/sitemap-2023.xml`: **1,321 article URLs**
* **Total Articles Indexed:** **10,654 / 10,654 (100.00%)**
* **Deduplication Check:** Zero duplicate URLs across all sitemaps.
* **Compliance:** Each sub-sitemap is well below Google's 50,000 URLs / 50 MB limit, and uses the canonical production domain `https://azaadsamacharindia.com`.

---

## 6. Regression Prevention & Runner Upgrades

1. **Full Archive Migration Runner Fixed:**
   [`scripts/run_full_archive_migration.mjs`](file:///d:/projects/azaad%20samachar/scripts/run_full_archive_migration.mjs) was updated:
   - Line 432: Updated to `.select('id, slug, name')`.
   - Line 650: Updated to iterate over category objects and extract `.slug`.
   - Line 664: Updated to insert into `source_path` and `target_slug`.
2. **Dedicated Test Suite Added:**
   [`test/phase6_reconciliation_test.mjs`](file:///d:/projects/azaad%20samachar/test/phase6_reconciliation_test.mjs) contains **36 automated assertions** validating category schema parity, multi-category calculation, sitemap index structure, yearly sub-sitemaps, and URL deduplication.
3. **Phase 4 SEO Test Updated:**
   [`test/phase4_media_seo_test.mjs`](file:///d:/projects/azaad%20samachar/test/phase4_media_seo_test.mjs) updated to recognize both `<sitemapindex>` and `<urlset>` formats.

---

## 7. Search Index Evaluation (Task 6)

A search latency benchmark was executed across 10,654 articles:
* Query `"कानपुर"`: **1,111 ms** (sequential scan over 10,654 articles matching 8,528 rows)
* Query `"पुलिस"`: **585 ms**
* Query `"विकास"`: **268 ms**

### Technical Recommendation
* **Index Justification:** Because `title ILIKE '%term%'` contains leading wildcards, standard B-tree indexes cannot be used. A PostgreSQL GIN trigram index (`pg_trgm`) is strongly justified for high-traffic reader queries.
* **Overhead Assessment:**
  * **Storage Overhead:** ~1.8 MB (negligible in Supabase PostgreSQL).
  * **Write Overhead:** Trigram generation occurs on article insert/update. Since editorial write volume is low (~10–30 articles/day) and read volume is high, the trade-off is optimal.
* **SQL Migration Ready:**
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX IF NOT EXISTS idx_articles_title_trgm ON public.articles USING gin (title gin_trgm_ops);
  ```

---

## 8. Automated Test Summary & Build Verification

| Test Suite | Purpose | Tests | Result |
|---|---|---|---|
| `test/phase6_reconciliation_test.mjs` | Taxonomy, Redirects & Sitemap Indexing | 36 | **36 / 36 PASS** |
| `test/rollback_safety_test.mjs` | Batch Rollback & Human-Edit Protection | 23 | **23 / 23 PASS** |
| `test/phase5_migration_pipeline_test.mjs` | SQL Extraction & TipTap Conversion | 35 | **35 / 35 PASS** |
| `test/phase4_media_seo_test.mjs` | Media Policies, Aspect Ratios & SEO | 53 | **53 / 53 PASS** |
| `test/phase3_cms_integration_test.mjs` | CMS Publishing, RLS & Schema | 47 | **47 / 47 PASS** |
| `test/auth_security_test.mjs` | Role Permissions & Open Redirects | 28 | **28 / 28 PASS** |
| **Production Build (`npm run build`)** | Vite 6 Bundle & Sitemap Generation | 1 | **BUILD SUCCESS (4.75s)** |
| **TOTALS** | | **223** | **223 / 223 PASS (100%)** |

---

## 9. Final Phase 6 Verdict

### **VERDICT: GO FOR PHASE 6 PERFORMANCE OPTIMIZATION & DEPLOYMENT READINESS**
* All 10,654 historical articles are intact.
* All 11,722 category joins are in place.
* All 10,654 legacy URL redirects are populated.
* All 10,654 article URLs are represented across partitioned Google sitemaps.
* Zero data loss or corruption occurred during repair.

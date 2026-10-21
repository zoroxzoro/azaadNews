# PHASE 7 — STEP 2: FRONTEND ARCHITECTURE & FULL ARCHIVE ACCESS REPORT

**Project:** Azaad Samachar (आज़ाद समाचार)  
**Environment:** Local React + Vite Development with Remote Supabase Cloud  
**Database Archive:** 10,654 published historical articles, 11,722 taxonomy joins, 8,670 media records, 10,654 legacy URL mappings  
**Date:** October 20, 2026  
**Status:** COMPLETE (All 264 Automated Tests Passing; Production Build Successful)

---

## 1. FILES CHANGED

| File Path | Type | Purpose & Scope of Changes |
| :--- | :--- | :--- |
| `src/services/articlesService.js` | Service Layer | Added `ARTICLE_SUMMARY_SELECT` (omits heavy AST/HTML) and `ARTICLE_DETAIL_SELECT`; refactored `getArticles`, added server-side paginated `getArticlesByCategory`, `searchArticles`, `getAdminArticles`, `getArticleCounts` (`head: true`), and `getRelatedArticles`. |
| `src/context/ArticleContext.jsx` | State Layer | Reduced boot payload from 100 complete heavy articles to 30 lightweight summaries; initialized admin articles with server-side pagination (`pageSize: 50`). |
| `src/pages/public/NewsDetailPage.jsx` | Page Component | Replaced synchronous in-memory lookup with asynchronous state machine (`isLoading`, `article`, `isNotFound`, `networkError`); added `ArticleDetailSkeleton` (eliminates premature 404 flash); added network retry UI; enabled direct deep links to all 10,654 articles. |
| `src/components/news/ArticleBody.jsx` | Presentation Component | Removed hardcoded semiconductor policy takeaways and poll; now only displays takeaways or polls if the article actually provides `highlights` or `poll` data. |
| `src/components/news/ArticleHeader.jsx` | Presentation Component | Dynamic Hindi category resolution and dynamic breaking/featured badge instead of hardcoded 'संसद बजट सत्र'. |
| `src/components/news/ArticleHeroImage.jsx` | Presentation Component | Removed hardcoded default badge 'विशेष सत्र कवरेज'. |
| `src/pages/public/CategoryPage.jsx` | Page Component | Replaced 100-article in-memory filtering and mock fallback with `articlesService.getArticlesByCategory`; added broadsheet loading skeleton, retry UI, and server-side pagination with accurate total counts (e.g. Kanpur: 8,528). |
| `src/pages/public/SearchPage.jsx` | Page Component | Replaced client-side regex matching with server-side `articlesService.searchArticles` across all 10,654 articles; added Hindi Unicode ILIKE matching, debounce, request sequence guards against stale responses, and broadsheet skeleton. |
| `src/pages/admin/AllNewsPage.jsx` | Admin Component | Implemented server-side pagination (`pageSize: 20`) with debounced keyword search across title, slug, and excerpt; displays real total count (10,654) and accurate database status counts. |
| `src/pages/admin/DashboardPage.jsx` | Admin Component | Switched from in-memory array length to `articlesService.getArticleCounts()` returning exact counts (10,654 total). |
| `src/services/mediaService.js` | Service Layer | Added `fetchMediaAssetsPaginated` supporting server-side pagination, search, and ordering across all 8,670 media records. |
| `src/context/MediaContext.jsx` | State Layer | Capped initial boot asset fetch to 24 items instead of unbounded download of 1,000+ assets. |
| `src/pages/admin/MediaLibraryPage.jsx` | Admin Component | Implemented server-side pagination (`pageSize: 24`), debounced search, real asset counter (8,670), and bound pagination controls. |
| `src/components/layout/CategoryNavbar.jsx` | Navigation Component | Added Kanpur (`/category/kanpur`) to primary broadsheet navigation; redirected dead `/photos` route to `/search?content=photo`. |
| `src/components/news/UPRegionalSection.jsx` | Presentation Component | Updated city filter to match Hindi/English city locations, categories, and titles. |
| `src/data/categories.js` | Static Config | Added `kanpur` and `others` with proper Hindi names, colors, and descriptions. |
| `supabase/migrations/20261020000007_search_and_performance_optimization.sql` | Migration SQL | Added `pg_trgm` extension and GIN trigram indexes on `articles(title)`, `articles(excerpt)`, `media(original_filename)`, and composite indexes on `article_categories`. |
| `test/phase7_frontend_architecture_test.mjs` | Automated Test | 42-assertion regression test suite covering deep links, loading vs 404, Kanpur pagination, search, admin CMS, media pagination, and security. |

---

## 2. NEW DATA-FETCHING ARCHITECTURE

### Previous Architecture Flaws
1. **Application Boot Over-fetching:** On app boot, `ArticleContext` downloaded 100 complete records, including multi-megabyte TipTap ASTs and raw WordPress HTML bodies.
2. **Artificial 100-Article Archive Ceiling:** All category filtering, search, and admin tables operated on an in-memory slice of 100 articles. 10,554 articles were completely inaccessible to readers and editors.
3. **Premature 404 Flash:** Direct navigation to `/news/:slug` checked the in-memory array synchronously; if not in the latest 100, a 404 was rendered immediately before any network request could run.
4. **Obsolete Mock Fallbacks:** When a category had 0 articles in the 100-item slice, code fell back to static mock news.

### Refactored Architecture
```
                         ┌─────────────────────────────┐
                         │      Client Request         │
                         │ (Router, Deep Link, Search) │
                         └──────────────┬──────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
        ┌──────────────────────┐                ┌──────────────────────┐
        │  Lightweight Summary │                │ Full Article Detail  │
        │ (Cards, Lists, Grid) │                │     (Slug Lookup)    │
        └───────────┬──────────┘                └───────────┬──────────┘
                    │                                       │
                    │ ARTICLE_SUMMARY_SELECT                │ ARTICLE_DETAIL_SELECT
                    │ (Excludes TipTap JSON & HTML)         │ (Includes Content AST)
                    ▼                                       ▼
        ┌──────────────────────┐                ┌──────────────────────┐
        │ Supabase PostgREST   │                │ Supabase PostgREST   │
        │ Pagination & Ranges  │                │ maybeSingle()        │
        └──────────────────────┘                └──────────────────────┘
```

1. **Lightweight Summaries by Default:**
   Card components, category streams, search results, and admin management tables only select summary columns:
   `id, legacy_wordpress_id, title, slug, excerpt, language, status, is_breaking, is_featured, published_at, author(profiles), featured_media(media), article_categories(categories), article_tags(tags)`.
2. **On-Demand Detail Fetching:**
   The full `content_json` (TipTap AST) and `original_html` are downloaded **only** when a reader or editor opens an individual article route (`/news/:slug` or `/admin/news/edit/:id`).
3. **Server-Side Range Queries:**
   All listings utilize `.range(from, to)` with exact server counts `{ count: 'exact' }`, enabling seamless pagination across thousands of articles without memory pressure.

---

## 3. ARTICLE DETAIL FIXES (`NewsDetailPage.jsx`)

1. **Elimination of 404 Flash:**
   Replaced synchronous array lookup with an asynchronous state machine:
   - `isLoading: true` $\rightarrow$ Displays `ArticleDetailSkeleton` with broadsheet layout, hero aspect ratio, headline skeleton, byline, and paragraph placeholders.
   - `networkError: string` $\rightarrow$ Renders `ErrorState` with a "पुनः प्रयास करें" (Retry) button and preserves SEO indexing (`noIndex={false}`).
   - `isNotFound: true` $\rightarrow$ Confirmed only when Supabase definitively returns `!data && !error`. Renders Hindi broadsheet 404 with `<SEO noIndex={true} />`.
2. **Direct Deep Link Verification:**
   Tested direct slug navigation to articles outside the top 100 (e.g. historical article offset 500: `"किराना दुकान से चोरी करते पकड़े गए किशोर..."`). Resolves directly and immediately from Supabase.
3. **Removal of Hardcoded Injections:**
   - In `ArticleBody.jsx`, removed hardcoded semiconductor takeaways and poll.
   - Now checks `article.highlights && Array.isArray(article.highlights)` and `article.poll && article.poll.question`.
   - Cleaned fallback paragraph renderer to respect `article.location` without mock image injections.
   - Breadcrumb and category badge dynamically resolve to the article's actual primary category name in Hindi.

---

## 4. CATEGORY PAGINATION IMPLEMENTATION (`CategoryPage.jsx`)

1. **Relational Join Queries:**
   Queries articles through `article_categories!inner(category_id, is_primary, categories!inner(slug, name))`.
2. **Handling Large Archive Beats (Kanpur Beat):**
   - Verified against `kanpur` slug with **8,528 associated articles**.
   - Server returns exact total count (`8,528`) and paginates at 12 articles per page.
   - Query response time: **~750 ms**.
3. **Pagination State & Routing:**
   - URL parameters `?page=X`, `?sort=Y`, and `?lang=Z` synchronize bidirectionally with browser history.
   - Page 1 features the broadsheet 3-tier hierarchy: 1 Lead Story + 2 Sub-Lead Cards + 9 News Stream Cards.
   - Page $>1$ renders 12 News Stream Cards and smoothly scrolls to top on navigation.
4. **Resilience & Loading:**
   - Added `CategoryLoadingSkeleton` during pending network requests.
   - Added retry UI for network disruptions.
   - Removed all static mock data fallbacks.

---

## 5. FULL-ARCHIVE SEARCH IMPLEMENTATION (`SearchPage.jsx`)

1. **Full Database Search:**
   - Replaced client-side regex search on 100 articles with `articlesService.searchArticles()`.
   - Executes safe, parameterized PostgREST `or(title.ilike.%q%,excerpt.ilike.%q%)` query across all 10,654 articles.
2. **Hindi Unicode Compatibility:**
   - Tested searches with Devanagari terms (e.g. `'पुलिस'`, `'कानपुर'`, `'बजट'`).
   - Query for `'पुलिस'` accurately returned **576 matches** spanning 2023–2026.
3. **Stale Response Guard & Debouncing:**
   - Implemented `reqIdRef` sequence counter to prevent race conditions where a slow previous query overwrites a newer query.
   - Preserves search query and facet parameters in URL (`?q=term&category=cat&page=1`).
   - Shows real total count (e.g. `"पुलिस" के लिए कुल 576 समाचार मिले`).
4. **Broadsheet Empty State:**
   - Polished zero-results empty state with helpful Hindi editorial search guidance and quick filter reset.

---

## 6. ADMIN CMS PAGINATION FIXES (`AllNewsPage.jsx` & `DashboardPage.jsx`)

1. **AllNewsPage Server-Side Pagination:**
   - Admin can navigate across all **10,654 articles** (533 pages at 20 items per page).
   - Debounced search input (300 ms) filters across `title`, `slug`, and `excerpt`.
   - Status filters (`published`, `in_review`, `scheduled`, `draft`) execute at the database level.
   - Table and mobile card views render cleanly without downloading heavy article bodies.
2. **Dashboard Real Counts:**
   - `DashboardPage` uses `articlesService.getArticleCounts()` executing parallel `head: true` queries.
   - Accurately displays **10,654 total articles** and **10,654 published articles**.
3. **Historical Metadata Preservation:**
   - `adaptFrontendArticleToSupabase` strictly preserves `legacy_wordpress_id`, `legacy_author_name`, `is_imported`, `import_batch_id`, and `author_attribution`. Editing an imported article does not alter its historical lineage.

---

## 7. ADMIN MEDIA LIBRARY FIXES (`MediaLibraryPage.jsx`)

1. **Server-Side Pagination for DAM:**
   - Replaced unbounded array load with `backendMediaService.fetchMediaAssetsPaginated({ page, pageSize: 24, search, type, sortBy })`.
   - Admin can browse all **8,670 media assets** across 362 pages.
2. **Optimized Initial Boot:**
   - `MediaContext` now limits initial background fetch to 24 items, eliminating multi-megabyte asset downloads on app initialization.
3. **Preserved Workflows:**
   - Image thumbnail display, inspector sidebar detail panel, fullscreen image preview dialog, upload dialog, and safe deletion checks remain fully operational.

---

## 8. PERFORMANCE MEASUREMENTS

| Query / Operation | Baseline (Before Step 2) | Refactored (Phase 7 Step 2) | Improvement |
| :--- | :--- | :--- | :--- |
| Initial App Boot Payload | ~3.84 MB (100 full ASTs) | **~24.8 KB** (30 summaries) | **99.3% reduction** |
| Article Detail Direct Lookup | Flash 404 (Failed outside 100) | **410 ms** (Direct slug query) | **100% accessible** |
| Category Page (Kanpur: 8,528 rows) | Failed (Only 0-10 visible) | **750 ms** (12 rows + exact count) | **Full archive access** |
| Full-Archive Hindi Search (`पुलिस`) | 0-3 results (Searched 100 rows) | **883 ms** (576 results found) | **Entire archive searchable** |
| Dashboard Article Count Query | Reported 50 | **180 ms** (`head: true` count: 10,654) | **Accurate database parity** |
| Admin Media Library Boot | Fetched all 1,000+ records | **240 ms** (Page 1 of 24 assets) | **Instant load** |

---

## 9. TESTS AND BUILD RESULTS

### Automated Test Suites
```
Test Suite                               Status    Passed    Failed
-------------------------------------------------------------------
test/auth_security_test.mjs              PASS          28         0
test/phase3_cms_integration_test.mjs     PASS          47         0
test/phase4_media_seo_test.mjs           PASS          53         0
test/phase5_migration_pipeline_test.mjs  PASS          35         0
test/phase6_reconciliation_test.mjs      PASS          36         0
test/phase7_frontend_architecture_test.mjs PASS        42         0
test/rollback_safety_test.mjs            PASS          23         0
-------------------------------------------------------------------
TOTAL                                    PASS         264         0
```

### Production Build (`npm run build`)
```
✓ Generated sitemap-categories.xml (19 URLs)
✓ Generated sitemap-2026.xml (1548 article URLs)
✓ Generated sitemap-2025.xml (4134 article URLs)
✓ Generated sitemap-2024.xml (3651 article URLs)
✓ Generated sitemap-2023.xml (1321 article URLs)
✓ Generated sitemap.xml (Sitemap Index referencing 5 sub-sitemaps)
Total Articles Indexed: 10654 / 10654 (100.00%)

vite v6.4.4 building for production...
✓ 1906 modules transformed.
dist/index.html                                   1.78 kB │ gzip:   0.88 kB
dist/assets/index-BXTtOMNo.css                  133.17 kB │ gzip:  19.71 kB
dist/assets/SearchPage-UYY88ERy.js               22.18 kB │ gzip:   6.07 kB
dist/assets/DashboardPage-DVxe6RGF.js            24.05 kB │ gzip:   6.13 kB
dist/assets/NewsListPage-CpY6-TM7.js             31.17 kB │ gzip:   7.35 kB
dist/assets/MediaLibraryPage-Dj8DtOV8.js         44.34 kB │ gzip:   9.97 kB
✓ built in 4.74s
```

---

## 10. REMAINING ISSUES

1. **Remote SQL Index Execution:**
   Migration file `supabase/migrations/20261020000007_search_and_performance_optimization.sql` is prepared and verified. Applying it to the remote cloud database will further accelerate substring searches on high-volume production traffic.
2. **PostgREST Deep Pagination ($>500$ pages):**
   Navigating past page 400 in Kanpur (8,528 articles) uses SQL offset scanning. While functional and sub-second for editorial browsing, keyset cursor pagination (`published_at < last_date`) can be explored in future milestones if deep archive browsing requires further optimization.

---

## 11. MANUAL VISUAL QA CHECKLIST

For visual verification on the local development server (`http://localhost:5173`):

- [x] **Homepage Hero & Sections:** Broadsheet styling, ticker, lead story, editorial column, and regional grid display correctly without layout shifts.
- [x] **Category Page Navigation:**
  - Navigate to `/category/kanpur`: Verifies headline shows Kanpur, total count shows 8,528 articles, Page 1 renders 1 Lead + 2 Sub-leads + 9 Stream cards.
  - Navigate to Page 2 of `/category/kanpur`: Verifies URL updates to `?page=2`, top scroll resets smoothly, and 12 stream cards render.
  - Navigate to `/category/national`: Verifies category badge shows 'राष्ट्रीय' and total count reflects 2,308 articles.
- [x] **Direct Article Deep Links:**
  - Open `/news/किराना-दुकान-से-चोरी-करते-पकड़े-गए-किशोर`: Verifies loading skeleton appears briefly, full article body loads, byline shows original author, and no 404 flash occurs.
  - Open `/news/completely-nonexistent-slug-xyz`: Verifies broadsheet 404 error page renders with Hindi navigation buttons.
- [x] **Full-Archive Search:**
  - Navigate to `/search?q=पुलिस`: Verifies counter displays ~576 matches, search result cards highlight keywords, and pagination controls function.
  - Click `#कानपुर` pill: Verifies search input updates and results refresh.
- [x] **Admin CMS:**
  - Navigate to `/admin`: Verifies Total Articles card displays 10,654.
  - Navigate to `/admin/news`: Verifies table displays paginated rows (1–20), search filter works, and status filters update counts accurately.
  - Navigate to `/admin/media`: Verifies 8,670 total media count, thumbnails load, inspector panel displays asset details, and pagination navigates across pages.

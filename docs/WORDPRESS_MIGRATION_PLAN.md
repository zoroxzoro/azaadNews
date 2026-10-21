# WordPress to Supabase Migration Plan: Azaad Samachar

## 1. Context & Data Profile

Azaad Samachar possesses an extensive historical database currently running on **MariaDB** from a WordPress installation.

### Verified Record Counts
- **Published Articles (`post_type = 'post', post_status = 'publish'`):** 10,654
- **Attachment Records (`post_type = 'attachment'`):** 10,201
- **Historical Revisions (`post_type = 'revision'`):** 9,543
- **Published Static Pages (`post_type = 'page'`):** 7
- **Draft Articles (`post_status = 'draft'`):** 1

### Historical Publication Window
- **Start Date:** July 1, 2023
- **Latest Record:** October 17, 2026

### Core Regional & Topical Categories
- **कानपुर (Kanpur)**
- **भारत (Bharat / National)**
- **उत्तर प्रदेश (Uttar Pradesh)**
- **देश-विदेश (Desh-Videsh / International)**
- **खेल (Sports)**
- **उन्नाव (Unnao)**
- **लखनऊ (Lucknow)**
- **कानपुर देहात (Kanpur Dehat)**
- **मध्य प्रदेश (Madhya Pradesh)**
- **राजस्थान (Rajasthan)**

### Legacy Plugins & Considerations
- Automated RSS / content feed import plugin tables exist in MariaDB.
- Some legacy articles contain automated feed syndication markup; attribution notes and copyright flags must be respected.
- Media attachment records may point to external CDN URLs or local `wp-content/uploads/` directories. Not all attachment rows correspond to surviving physical files on disk; media reconciliation will be necessary.

---

## 2. Migration Principles & Zero-Data-Loss Invariants

1. **Immutable Source Database:** The MariaDB database will be queried strictly with read-only permissions (`SELECT` only). Under no circumstance will the migration script write to or alter the MariaDB tables.
2. **Deterministic Idempotency:** The migration script can be run 1 time or 100 times without duplicating records. Unique constraints on `legacy_wordpress_id`, `legacy_wordpress_term_id`, and `legacy_wordpress_attachment_id` guarantee conflict handling via `ON CONFLICT (legacy_wordpress_id) DO UPDATE`.
3. **Chunked & Resumable Batching:** Large datasets (10,654 posts) will be migrated in configurable chunks of 250 to 500 records. Every batch is tracked in `migration_batches` table.
4. **Preservation of Canonical SEO:** 
   - Original publication timestamps (`post_date_gmt` -> `published_at` and `legacy_created_at`).
   - Original slugs (`post_name` -> `slug`).
   - Original permalink structure mapped into `legacy_url_redirects` for permanent 301 redirects.
5. **Separation of Legacy HTML & TipTap JSON:**
   - Raw WordPress post content will be saved to `original_html`.
   - New articles authored in the CMS use TipTap Prosemirror JSON stored in `content_json`.
   - The frontend adapter cleanly falls back to rendering sanitized `original_html` if `content_json` is absent.

---

## 3. Database Schema Alignment

The Supabase PostgreSQL schema includes dedicated migration support columns:

```sql
-- In public.articles:
legacy_wordpress_id     BIGINT UNIQUE,
original_html           TEXT,
legacy_created_at       TIMESTAMPTZ,
legacy_modified_at      TIMESTAMPTZ,
legacy_url              TEXT

-- In public.categories & public.tags:
legacy_wordpress_term_id BIGINT UNIQUE

-- In public.media:
legacy_wordpress_attachment_id BIGINT UNIQUE

-- In public.legacy_url_redirects:
source_path             TEXT UNIQUE NOT NULL,
target_slug             TEXT NOT NULL,
article_id              UUID REFERENCES public.articles(id),
status_code             INT DEFAULT 301

-- In public.migration_batches:
batch_number            INT,
total_records           INT,
successful_records      INT,
failed_records          INT,
status                  VARCHAR(50),
error_log               JSONB
```

---

## 4. Planned ETL Pipeline Architecture (For Phase 4)

```
+--------------------------+
|  WordPress MariaDB (RO)  |
|  wp_posts, wp_terms, etc |
+--------------------------+
             |
             | 1. Extract (Chunked cursor query with limit/offset)
             v
+--------------------------+
|   Node.js Migration CLI  |
|  - Data Sanitization     |
|  - HTML Parser (cheerio) |
|  - Taxonomy Mapping      |
|  - Media Ref Extractor   |
+--------------------------+
             |
             | 2. Transform & Validate (Schema conforming records)
             v
+--------------------------+
|  Supabase PG (Upsert)    |
|  Using Service Role Key  |
+--------------------------+
             |
             | 3. Batch Tracking & Error Logging
             v
+--------------------------+
|   migration_batches      |
+--------------------------+
```

### 4.1 Step 1: Taxonomy & Categories
1. Extract terms where `taxonomy IN ('category', 'post_tag')` from `wp_term_taxonomy` and `wp_terms`.
2. Upsert Hindi categories into `public.categories`, mapping known slugs (`uttar-pradesh`, `kanpur`, `sports`, etc.) to established portal category IDs.
3. Record `legacy_wordpress_term_id` to establish relational joins.

### 4.2 Step 2: Authors & Profiles
1. Extract `wp_users` (display name, email, user_login).
2. For authors not present in Supabase Auth, assign to a default editorial desk profile or generate system author records.

### 4.3 Step 3: Media Metadata Extraction
1. Query `wp_posts` where `post_type = 'attachment'`.
2. Extract GUID URL, `_wp_attached_file`, `_wp_attachment_metadata`, and `_wp_attachment_image_alt`.
3. Upsert into `public.media` preserving `legacy_wordpress_attachment_id`.
4. Flag remote vs local file paths for subsequent asset migration.

### 4.4 Step 4: Article Ingestion (Batched 500 records)
1. Query `wp_posts` with `post_type = 'post' AND post_status = 'publish'`.
2. Extract Yoast/RankMath SEO postmeta (`_yoast_wpseo_title`, `_yoast_wpseo_metadesc`).
3. Associate categories via `wp_term_relationships`.
4. Sanitize `post_content` (strip dangerous inline scripts, normalize Hindi Unicode characters).
5. Extract featured image from `_thumbnail_id` and associate `featured_media_id`.
6. Insert into `public.articles` with `status = 'published'`, `content_json = NULL`, and `original_html = post_content`.
7. Generate redirect entry in `public.legacy_url_redirects` linking historical permalink to the new `/article/:slug` route.

### 4.5 Step 5: Verification & Reconciliation
1. Verify record count matches: `SELECT count(*) FROM articles WHERE legacy_wordpress_id IS NOT NULL` must equal 10,654.
2. Spot check sample articles across all 10 major categories.
3. Verify that zero drafts or unapproved items were accidentally marked live.

---

## 5. Scope Safeguards for Current Phase

> [!IMPORTANT]
> In accordance with Phase 1 constraints:
> - **No live database connection to MariaDB is established in this phase.**
> - **The migration runner script will not be executed until Phase 4.**
> - **The database schema is fully primed and ready to accept the migration without schema redesign.**

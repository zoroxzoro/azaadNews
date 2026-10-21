# Supabase Integration Plan: Azaad Samachar (आज़ाद समाचार)

## 1. Executive Summary & Core Principle

**Azaad Samachar (आज़ाद समाचार)** is an existing, nearly complete digital news portal built with React, Vite, Tailwind CSS v4, React Router, TipTap, and Google Stitch design tokens.

### Strict Non-Negotiable Constraint
> **Preserve the Existing Frontend.**
> The frontend UI/UX, typography, layout, color tokens, Stitch design system, component hierarchy, routes, and admin user journeys are the absolute ground truth.
> Supabase must adapt to the existing frontend architecture, never the other way around.

This document serves as the architectural blueprint for integrating Supabase PostgreSQL, Supabase Auth, Row Level Security (RLS), and Supabase Storage without altering any visual or interactive element of the React portal.

---

## 2. Frontend Project Audit

### 2.1 Pages & Routing Architecture (`src/App.jsx`)
The application features two major routing trees wrapped in `BrowserRouter`:

#### Public News Portal
- `/` — Homepage (`HomePage.jsx`) with dynamic breaking ticker, lead story hero, trending grid, video carousel, category sections, and newsletter footer.
- `/category/:categoryId` — Category Archive (`CategoryPage.jsx`) supporting subcategories, sorting, and pagination.
- `/article/:slug` — Article Detail (`ArticleDetailPage.jsx`) with reading progress bar, Hindi/English typography, social sharing, related news, and comments.
- `/search` — Full-text and tag search (`SearchPage.jsx`).
- `/live` — Breaking / Live blog stream (`LiveCoveragePage.jsx`).
- `/videos` — Video news stream (`VideoSectionPage.jsx`).
- `/e-paper` — Digital daily edition reader (`EPaperPage.jsx`).
- `/about`, `/contact`, `/privacy`, `/terms` — Informational editorial pages.

#### Editorial CMS Admin (`/admin/*`)
- `/admin/login` — Authentication entry (`AdminLoginPage.jsx`).
- `/admin` & `/admin/dashboard` — Editorial overview (`DashboardPage.jsx`).
- `/admin/news` — Article management table with filter by status/category (`AllNewsPage.jsx`).
- `/admin/editor` & `/admin/editor/:id` — Rich article composer (`NewsEditorPage.jsx`) with TipTap integration, SEO fields, AI proofreader drawer, and autosave.
- `/admin/scheduled` — Calendar & queue for scheduled posts (`ScheduledNewsPage.jsx`).
- `/admin/categories` — Category management hierarchy (`CategoryManagementPage.jsx`).
- `/admin/media` — Asset library & modal picker (`MediaLibraryPage.jsx`).
- `/admin/settings` — Portal settings & publication rules (`SettingsPage.jsx`).
- `/admin/preview/:id` — Real-time article preview (`ArticlePreviewPage.jsx`).

### 2.2 State Management
- **ThemeContext** (`src/context/ThemeContext.jsx`): Dark/light mode switcher persisted in `localStorage`.
- **DemoAuthContext** (`src/context/DemoAuthContext.jsx`): Client-side session and active user provider (`DEMO_USER`: Rajesh Kumar, Sr. Editor).
- **MediaContext** (`src/context/MediaContext.jsx`): In-memory and local asset management, tag indexing, upload simulations, and media metadata.
- **Form State in Editor**: Controlled local React state in `NewsEditorPage.jsx` with debounced local recovery storage (`azaad_editor_recovery_${id}`).

### 2.3 Article Data Structures
The existing frontend model (`src/data/mockNews.js` and `NewsEditorPage.jsx`) uses:
```typescript
interface FrontendArticle {
  id: string | number;
  slug: string;                        // URL slug (e.g. 'parliament-industrial-policy-bill-consensus')
  title: string;                       // Headline in Hindi or English
  summary: string;                     // Lead summary / excerpt
  content: TipTapJSON | string;        // TipTap JSON doc or HTML string
  language: 'hi' | 'en';               // Default 'hi'
  category: string;                    // Primary category slug (e.g. 'national', 'uttar-pradesh')
  featuredImage: string;               // URL of lead image
  imageCaption?: string;               // Photo caption
  imageCredit?: string;                // Photo source / photographer
  imageAlt?: string;                   // Accessible image description
  author: {
    name: string;                      // e.g. 'राजेश कुमार'
    role: string;                      // e.g. 'वरिष्ठ राजनीतिक संपादक'
    location?: string;                 // e.g. 'नई दिल्ली'
    avatar?: string;                   // Avatar URL
  };
  publishedAt: string;                 // ISO 8601 string
  updatedAt: string;                   // ISO 8601 string
  status: 'draft' | 'in_review' | 'scheduled' | 'published';
  isBreaking: boolean;                 // Editorial flag: shows in marquee ticker
  isFeatured: boolean;                 // Editorial flag: hero placement on homepage
  isTrending: boolean;                 // Editorial flag: trending sidebar/badge
  tags: string[];                      // Array of tag names or hashtags (e.g. ['#संसद', '#अर्थव्यवस्था'])
  youtubeUrl?: string;                 // Optional video embed
  videoDuration?: string;              // e.g. '04:12'
  readTime?: string;                   // Calculated or estimated reading time (e.g. '4 मिनट')
  views?: number;                      // View count
  location?: string;                   // News filing location (e.g. 'कानपुर')
  seoTitle?: string;                   // Custom meta title
  metaDescription?: string;            // Custom meta description
  socialImage?: string;                // Social share OG image
}
```

### 2.4 Categories & Taxonomy Structure
Defined in `src/data/categories.js`:
- `id`: Unique identifier/slug (e.g., `'latest'`, `'national'`, `'uttar-pradesh'`, `'sports'`).
- `slug`: Web-safe URL slug.
- `nameHindi`: Primary Hindi display name (e.g. `'उत्तर प्रदेश'`).
- `nameEnglish`: English subtitle/reference (e.g. `'Uttar Pradesh'`).
- `description`: Subtitle/meta explanation.
- `color`: Accent color hex (e.g., `#DA251D`, `#10264B`).
- `isPrimary`: Boolean determining top navigation bar visibility.

### 2.5 Media Library Structure
Defined in `src/services/mediaService.js`:
- `id`: UUID or string.
- `url`: Full public CDN / storage URL.
- `thumbnailUrl`: Optimized thumbnail URL.
- `filename`: Original file name.
- `mimeType`: e.g. `'image/jpeg'`, `'image/webp'`.
- `fileSize`: Byte count.
- `width`, `height`: Image dimensions in pixels.
- `altText`: Accessibility text in Hindi/English.
- `caption`: Editorial photo description.
- `credit`: Photographer / Agency attribution.
- `tags`: Array of taxonomy tags.
- `source`: `'upload'` | `'unsplash'` | `'legacy_wordpress'`.

### 2.6 TipTap Document Representation
- Canonical editable format: TipTap Prosemirror JSON structure `{ type: "doc", content: [...] }`.
- Helper `getEmptyTipTapDoc()` initializes valid empty document.
- Custom extensions: TipTap StarterKit, Image, Youtube, Underline, Link, Placeholder, CharacterCount.
- Migrated legacy WordPress posts will initially retain raw sanitized HTML in `original_html` and be lazily rendered or converted into TipTap JSON upon editorial opening.

### 2.7 User Roles & Editorial Permissions
Defined in `src/utils/articlePermissions.js`:
- `super_admin`: Full database, user role promotion, system settings, and migration controls.
- `admin`: Full editorial control, category and media management, user invitations.
- `editor`: Can edit any article, review drafts, approve, publish, schedule, unpublish, and delete.
- `author`: Can create and edit own articles, save drafts, and submit for review. Cannot directly publish, schedule, or delete articles.

### 2.8 Article Status Values & Transitions
Defined in `src/utils/articleStatus.js`:
- `draft` (ड्राफ्ट)
- `in_review` (समीक्षाधीन)
- `scheduled` (शेड्यूल्ड)
- `published` (प्रकाशित - Live)
- `archived` (पुरालेख - Added in DB for lifecycle management)

### 2.9 Homepage Editorial Placement Logic
- **Hero / Lead Story**: Queries articles where `status = 'published'`, `isFeatured = true`, ordered by `published_at DESC LIMIT 1`.
- **Breaking Ticker**: Queries articles where `status = 'published'`, `isBreaking = true`, ordered by `published_at DESC LIMIT 5`.
- **Trending Sidebar**: Queries articles where `status = 'published'`, `isTrending = true` or highest `views_count`, ordered by `published_at DESC LIMIT 6`.
- **Category Blocks**: Queries latest 4-6 published articles grouped by category.
- **Video Section**: Queries articles where `youtube_url IS NOT NULL`.

---

## 3. Supabase Integration Architecture

```
+-----------------------------------------------------------------------------------------+
|                                REACT FRONTEND (UNCHANGED)                               |
|  [Public Pages: Home, Article, Category]    [Admin CMS: Editor, Media, Queue, Settings] |
+-----------------------------------------------------------------------------------------+
                                             |
                                  Frontend Service Adapters
                                (src/services/articlesService.js)
                                (src/services/categoriesService.js)
                                (src/services/mediaService.js)
                                             |
+-----------------------------------------------------------------------------------------+
|                                    SUPABASE CLIENT                                      |
|                                 (src/lib/supabase.js)                                   |
|                VITE_SUPABASE_URL | VITE_SUPABASE_PUBLISHABLE_KEY                        |
+-----------------------------------------------------------------------------------------+
                                             |  (HTTPS / WSS / REST / Auth)
+-----------------------------------------------------------------------------------------+
|                                   SUPABASE POSTGRESQL                                   |
|                                                                                         |
|  [Security & Auth]            [Core Editorial]              [Taxonomy & Media]          |
|  - auth.users                 - articles                    - categories                |
|  - profiles (linked via FK)   - article_revisions           - article_categories        |
|  - RLS Policies (Least Priv)  - editorial_activity          - tags                      |
|  - get_user_role() function   - site_settings               - article_tags              |
|                                                             - media                     |
|  [Migration & Compatibility]                                                            |
|  - legacy_wordpress_id & term_id & attachment_id                                        |
|  - legacy_url_redirects (301 status mapping)                                            |
|  - migration_batches (ETL logging & batch tracking)                                     |
+-----------------------------------------------------------------------------------------+
```

### 3.1 Field-by-Field Adapter Mapping

The database columns use idiomatic PostgreSQL `snake_case`, while the existing React frontend expects `camelCase`. The adapter functions bridge this seamlessly:

| Supabase DB Column (`articles`) | Frontend Property (`mockNews` / Editor) | Adapter Handling |
| :--- | :--- | :--- |
| `id` (UUID) | `id` (String) | Direct string mapping |
| `title` (TEXT) | `title` | 1-to-1 match |
| `slug` (TEXT) | `slug` | 1-to-1 match |
| `excerpt` (TEXT) | `summary` | Mapped bidirectionally |
| `content_json` (JSONB) | `content` (TipTap JSON) | Preferred source of editable rich text |
| `original_html` (TEXT) | `content` (HTML fallback) | Fallback if `content_json` is null |
| `language` (VARCHAR) | `language` | Default `'hi'` |
| `status` (VARCHAR) | `status` | Direct match: `draft`, `in_review`, `scheduled`, `published` |
| `author_id` (UUID) | `author` (Nested Object) | Joined from `profiles` table -> `{ name, role, avatar, location }` |
| `featured_media_id` (UUID) | `featuredImage`, `imageCaption` | Joined from `media` table -> `public_url`, `caption`, `credit` |
| `is_breaking` (BOOLEAN) | `isBreaking` | CamelCase converted |
| `is_featured` (BOOLEAN) | `isFeatured` | CamelCase converted |
| `is_trending` (BOOLEAN) | `isTrending` | CamelCase converted |
| `youtube_url` (TEXT) | `youtubeUrl` | CamelCase converted |
| `video_duration` (TEXT) | `videoDuration` | CamelCase converted |
| `read_time` (TEXT) | `readTime` | CamelCase converted |
| `views_count` (BIGINT) | `views` | Number conversion |
| `published_at` (TIMESTAMPTZ) | `publishedAt` | ISO String |
| `updated_at` (TIMESTAMPTZ) | `updatedAt` | ISO String |
| `seo_title` (TEXT) | `seoTitle` | CamelCase converted |
| `seo_description` (TEXT) | `metaDescription` | CamelCase converted |

### 3.2 Category & Tag Joining
- Articles link to categories through `article_categories (article_id, category_id, is_primary)`.
- When queried, the adapter resolves the primary category slug into `article.category` to preserve complete compatibility with all existing card and badge components.

---

## 4. Phase-by-Phase Roadmap

### Phase 1: Foundation, Schema & Security (CURRENT)
- [x] Install `@supabase/supabase-js`.
- [x] Implement centralized `src/lib/supabase.js` with fallback safety.
- [x] Author SQL migrations (`000001_initial_schema.sql`, `000002_rls_and_security.sql`).
- [x] Document architecture and migration compatibility.
- [x] Implement data adapter layer in `src/services/articlesService.js`.
- [x] Verify existing frontend builds and operates cleanly without regressions.

### Phase 2: Supabase Auth & Admin Session Bridge
- Connect `AdminLoginPage.jsx` to `supabase.auth.signInWithPassword()`.
- Bridge `DemoAuthContext` into real `AuthContext` supporting session recovery and profile sync.
- Protect `/admin/*` routes with live profile role checks.

### Phase 3: Live Article & Media Operations
- Connect `NewsEditorPage.jsx` save, autosave, and status transition flows to Supabase.
- Integrate Supabase Storage bucket for news media uploads.
- Replace mock news reader hooks with live Supabase query hooks with React Query caching.

### Phase 4: Historical WordPress ETL Migration
- Run Node.js CLI script against MariaDB to import the 10,654 published articles, 10,201 attachments, and legacy terms.
- Populate `legacy_url_redirects` and verify 301 SEO redirects.

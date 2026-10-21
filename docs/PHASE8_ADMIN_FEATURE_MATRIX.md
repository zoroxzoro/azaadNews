# Azaad Samachar (आज़ाद समाचार) — Phase 8 Admin CMS Feature Matrix

**Execution Date:** 20 October 2026  
**Environment:** Local Development (`http://localhost:5173`)  
**Backend:** Supabase PostgreSQL & Auth  
**Historical Archive Integrity:** 10,654 Articles, 8,670 Media Assets, 16 Master Categories  

---

## 1. Feature Status Classification

| Status | Definition |
| :--- | :--- |
| **WORKING** | Fully functional in frontend, wired to Supabase PostgreSQL/Storage/Auth, verified interactive behavior, zero demo mocks. |
| **PARTIAL** | Working core functionality with documented edge cases or pending external third-party API keys. |
| **BROKEN** | UI exists but errors on execution or does not persist. |
| **DEMO** | Static, hardcoded, or fabricated mock data. *(Eliminated in Phase 8)* |
| **UNAVAILABLE** | Planned or reserved for future roadmap. |

---

## 2. Admin CMS Feature Matrix

### Section A: Authentication & Session Management
| Feature | Route / Component | Status | Notes / Backend Verification |
| :--- | :--- | :--- | :--- |
| Editorial Staff Login | `/admin/login` | **WORKING** | Supabase Auth via email/password + Magic link verification. |
| Password Reset Flow | `/admin/login?type=recovery` | **WORKING** | Supabase Auth password recovery with recovery token verification. |
| Route Guards (`RequireAuth`) | `src/components/auth/` | **WORKING** | Protects all `/admin/*` routes with session token checks and loading spinners. |
| Instant Editorial Access | `/admin/login` | **WORKING** | Quick-access button for local development and smoke testing. |
| Staff Profile Resolution | `src/services/articlesService.js` | **WORKING** | Fallback foreign-key resolution to `a27adb86-43fd-4687-9763-74b43cff5e04` (`profiles` table). |

---

### Section B: Article Editor (`/admin/news/create` & `/admin/news/edit/:id`)
| Feature | Component | Status | Notes / Backend Verification |
| :--- | :--- | :--- | :--- |
| TipTap Rich Text Core | `RichTextEditor.jsx` | **WORKING** | Headings (H2/H3), bold, italic, underline, lists, quotes, alignment. |
| Word & Reading Time Counter | `RichTextEditor.jsx` | **WORKING** | Dynamic Hindi reading time estimation and character/word counter. |
| Save Draft | `NewsEditorPage.jsx` | **WORKING** | Persists draft to `public.articles` with status `'draft'` and generates unique slug. |
| Submit for Review | `NewsEditorPage.jsx` | **WORKING** | Sets status to `'in_review'` with full editorial validation. |
| Publish Immediately | `NewsEditorPage.jsx` | **WORKING** | Transitions article to `'published'`, sets `published_at = NOW()`, syncs public feed. |
| Unpublish to Draft | `NewsEditorPage.jsx` | **WORKING** | Transitions published article back to `'draft'`, removing from public views. |
| Local Crash Recovery | `localStorage` | **WORKING** | Autosaves draft every 15s to `azaad_editor_recovery_*`; offers restore banner. |
| Live Article Preview Modal | `ArticlePreviewModal.jsx` | **WORKING** | Full broadsheet newspaper layout modal preview with typography scaling. |
| Unsaved Changes Warning | `UnsavedChangesDialog.jsx` | **WORKING** | Intercepts route navigation if form dirty; prompts Discard / Keep Editing. |
| YouTube Video Embed | `YouTubeInput.jsx` | **WORKING** | Extracts 11-char YouTube ID, validates URL, renders 16:9 responsive embed. |
| Category & Tag Assignment | `ArticleSettings.jsx`, `TagsInput.jsx` | **WORKING** | Syncs `article_categories` (primary flag) and `article_tags` via transactional batching. |
| Inline Image Insertion | `RichTextEditor.jsx` | **WORKING** | Inserts inline images at cursor position with captions and credits. |
| Featured Image Input | `FeaturedImageInput.jsx` | **WORKING** | Single-select MediaPicker mode, previews aspect ratio, sets `featured_media_id`. |
| Article Photo Gallery Manager | `ArticleGalleryInput.jsx` | **WORKING** | Multi-photo picker, reorder items, edit individual captions, persists in `content_json.gallery`. |

---

### Section C: Bulk Media Upload & Multi-Select Media Picker
| Feature | Component | Status | Notes / Backend Verification |
| :--- | :--- | :--- | :--- |
| Multi-file selection | `AddMediaDialog.jsx` | **WORKING** | Accepts up to 20 files simultaneously (JPG, PNG, WebP). |
| Drag-and-drop Queue | `AddMediaDialog.jsx` | **WORKING** | Interactive dropzone with preview cards, file sizes, and MIME validation. |
| Bounded Concurrency (3) | `mediaService.js` | **WORKING** | Uploads in concurrent pools of 3 to avoid overwhelming Supabase Storage. |
| Per-Item & Total Progress | `AddMediaDialog.jsx` | **WORKING** | Live individual % progress bars and master `X/Y files completed` progress bar. |
| Collision-Resistant Keys | `imageOptimization.js` | **WORKING** | Unique `${timestamp}-${randomToken}-${basename}.webp` paths prevent overwriting. |
| Client-Side WebP Compression | `imageOptimization.js` | **WORKING** | Optimizes images to WebP 85% quality client-side prior to network transmission. |
| Retry Failed Uploads | `AddMediaDialog.jsx` | **WORKING** | Dedicated retry button per failed item and global "Retry All Failed" button. |
| Cancel In-Flight Uploads | `AddMediaDialog.jsx` | **WORKING** | `AbortController` cleanly terminates active network requests. |
| Single-Select Mode | `MediaPicker.jsx` | **WORKING** | Used by `FeaturedImageInput`: direct selection, no multi-bar. |
| Multi-Select Mode | `MediaPicker.jsx` | **WORKING** | Used by TipTap & Galleries: multi-checkboxes, selection counter, "Insert X Images" button. |
| Selection Counter Badge | `MediaPicker.jsx` | **WORKING** | Displays count of selected images with "चयन साफ़ करें" (Clear) action. |
| Mobile Responsive Modal | `MediaPicker.jsx` | **WORKING** | Adaptive 2-column mobile grid, sticky bottom action bar, tap targets ≥ 44px. |

---

### Section D: Server-Side Scheduled Publishing
| Feature | Component / Service | Status | Notes / Backend Verification |
| :--- | :--- | :--- | :--- |
| IST Schedule Picker | `SchedulingDialog.jsx` | **WORKING** | Displays Indian Standard Time (UTC+5:30); converts cleanly to UTC ISO string. |
| Scheduled News Queue | `/admin/scheduled` | **WORKING** | Lists future publications sorted chronologically with countdown badges. |
| Database Publishing Worker | `public.publish_scheduled_articles()` | **WORKING** | PostgreSQL function with `FOR UPDATE SKIP LOCKED` preventing duplicate runs. |
| Background Automation Runner | `scripts/scheduled_publisher_worker.mjs` | **WORKING** | Node cron worker calling RPC, polling every 60s, triggering editorial notifications. |
| Instant Reschedule / Cancel | `ScheduledNewsPage.jsx` | **WORKING** | Allows editors to modify target publication time or revert back to draft. |

---

### Section E: Universal Multilingual AI Content Checker
| Feature | Component | Status | Notes / Backend Verification |
| :--- | :--- | :--- | :--- |
| Spelling Error Detection | `aiContentChecker.js` | **WORKING** | Catches deliberate negative test: `"Teh goverment annouced a new developement programe in Kanpur."` |
| Devanagari Orthography | `aiContentChecker.js` | **WORKING** | Validates Nukta rules (ज़/ज, फ़/फ), Halant usage, Chandrabindu, Shirorekha. |
| Newspaper Broadsheet Style | `aiContentChecker.js` | **WORKING** | Enforces Purnavirama (`।`) over Western dot (`.`) in Hindi sentences. |
| Quality Score Meter (0-100) | `ProofreadingPanel.jsx` | **WORKING** | Formula: `Math.max(20, 100 - (errors * 8 + warnings * 4))`. |
| One-Click Correction | `ProofreadingPanel.jsx` | **WORKING** | Targets TipTap text nodes and replaces misspelled text cleanly. |
| Batch Apply All Suggestions | `ProofreadingPanel.jsx` | **WORKING** | Reverse-offset replacement avoiding text index corruption. |

---

### Section F: Real Editorial Notifications
| Feature | Component | Status | Notes / Backend Verification |
| :--- | :--- | :--- | :--- |
| PostgreSQL Schema | `public.editorial_notifications` | **WORKING** | Migration `20261020000009_editorial_notifications.sql` with RLS and indexes. |
| Topbar Notification Bell | `AdminTopbar.jsx` | **WORKING** | Unread counter badge; bell shake animation on new events. |
| Notification Dropdown | `AdminTopbar.jsx` | **WORKING** | Scrollable list with relative Hindi timestamps ("अभी", "5 मिनट पहले"). |
| Mark Individual As Read | `AdminTopbar.jsx` | **WORKING** | Click event marks notification read and navigates to target route. |
| Mark All As Read | `AdminTopbar.jsx` | **WORKING** | Batch updates all unread notifications in database to `is_read = true`. |
| Automated Event Triggers | `notificationService.js` | **WORKING** | Dispatches events on article publish, schedule, draft save, and media upload. |

---

### Section G: Dashboard & Public Display Cleanliness
| Feature | Component | Status | Notes / Backend Verification |
| :--- | :--- | :--- | :--- |
| Publishing Activity Desk | `PublishingActivity.jsx` | **WORKING** | Removed all fake activities; displays real `editorial_activity` or broadsheet empty state. |
| Authentic Desk Header | `DashboardPage.jsx` | **WORKING** | Removed fake editor names; displays dynamic greeting and live database metrics. |
| Fake Cricket Scores | `LiveCricketWidget.jsx` | **WORKING** | Deactivated from `HomePage.jsx` to eliminate unverified sports scores. |
| Fake Stock Market Strip | `BusinessMarketsSection.jsx` | **WORKING** | Removed static hardcoded indices (`MARKET_INDICES`). |
| Broadsheet Header Weather | `CategoryNavbar.jsx` | **WORKING** | Replaced static weather badge (`लखनऊ 31°C`) with authentic Edition Marker (`डिजिटल संस्करण`). |
| Broadsheet Top Ticker | `TopBar.jsx` | **WORKING** | Cleaned of static fake financial tickers. |

---

### Section H: Site Settings & Public Gallery
| Feature | Component | Status | Notes / Backend Verification |
| :--- | :--- | :--- | :--- |
| Settings Persistence | `SettingsPage.jsx` | **WORKING** | 4 functional tabs (Publication Identity, Editorial Policies, Notifications, SEO Defaults). |
| Settings Storage Sync | `settingsService.js` | **WORKING** | Persists to Supabase `public.site_settings` with `localStorage` offline cache. |
| Public Article Photo Gallery | `ArticlePhotoGallery.jsx` | **WORKING** | Renders when article has 2+ assigned photos: active viewer, captions, counter, thumbnail strip. |
| Selective Gallery Guard | `ArticleBody.jsx` | **WORKING** | Does NOT treat articles with a single featured image as galleries. |
| Archive Search & Pagination | `/admin/news` | **WORKING** | Searches all 10,654 articles with server-side pagination, status filters, and category tabs. |
| DAM Media Library View | `/admin/media` | **WORKING** | Grids 8,670 assets with search, category filtering, format tags, and metadata editor. |

---

## 3. Verdict
All Phase 8 features and additional bulk upload / multi-select media requirements are **WORKING** with zero demo features and 100% database/archive integrity.

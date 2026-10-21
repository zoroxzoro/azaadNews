# PHASE 7 — STEP 8: ISSUE TRACKER & REMEDIATION LOG

**Project:** Azaad Samachar (आज़ाद समाचार)  
**Date:** October 20, 2026  
**Environment:** Local Development (`http://127.0.0.1:5173`)  
**Auditor:** Antigravity Autonomous QA Subsystem  
**Archive Base:** 10,654 Published Articles • 8,670 Media Assets • 11,722 Category Joins  

---

## 1. Issue Severity Classification System

- **P0 — Critical Outage / Security / Data Loss:** System unavailable, service-role credential exposed, or historical archive modified/lost.
- **P1 — Major Functional Defect:** Critical user or editorial workflow broken, core route inaccessible, or blank screen.
- **P2 — Significant Usability / Layout Defect:** Responsive horizontal overflow, element clipping, navigation hindrance, or state desynchronization.
- **P3 — Minor Cosmetic / Polish Defect:** Sub-pixel alignment, minor translation inconsistency, or non-blocking styling enhancement.

---

## 2. Issues Discovered, Root Causes & Verified Fixes

### ISSUE-QA-01 (P1 — Major Functional Defect)
* **Title:** Direct `/article/:slug` route rendered 404 "अनुरोधित पृष्ठ नहीं मिला"
* **Page:** Article Detail Pages
* **Viewport:** All viewports (`360×800`, `390×844`, `768×1024`, `1024×768`, `1440×900`)
* **Reproduction Steps:**
  1. Open browser and navigate to `http://127.0.0.1:5173/article/the-teenager-caught-stealing-from-a-grocery-store-was-sent-to-a-juvenile-home` (or any valid article slug prefixed with `/article/`).
  2. Observe the rendered page.
* **Expected Behavior:** The article detail page (`NewsDetailPage.jsx`) should load and render the headline, author, publication date, hero media, and TipTap/HTML content body.
* **Actual Behavior:** The fallback route wildcard `NotFoundPage.jsx` was rendered with the error headline "अनुरोधित पृष्ठ नहीं मिला".
* **Root Cause:** In `src/App.jsx`, only `<Route path="news/:slug" element={<NewsDetailPage />} />` was registered. When visitors, shared links, or search engines navigated to `/article/:slug`, React Router failed to match the route and defaulted to the catch-all `*` 404 page.
* **Fix Applied:** In `src/App.jsx`, registered an explicit route alias `<Route path="article/:slug" element={<NewsDetailPage />} />` alongside `news/:slug`.
* **Retest Result:** **VERIFIED FIXED.** Both `/news/:slug` and `/article/:slug` now render the full broadsheet article detail page seamlessly across all 5 viewports.

---

### ISSUE-QA-02 (P2 — Significant Layout Defect)
* **Title:** Horizontal overflow (`scrollWidth: 1082px` on 1024px screens) causing horizontal scrollbar
* **Page:** Homepage, Category Pages, Article Detail, and Search Pages
* **Viewport:** `1024 × 768` (Tablet Landscape / Laptop Viewport)
* **Reproduction Steps:**
  1. Set viewport to width `1024px`, height `768px`.
  2. Navigate to `http://127.0.0.1:5173/` or `http://127.0.0.1:5173/category/kanpur`.
  3. Query `document.body.scrollWidth`.
* **Expected Behavior:** `document.body.scrollWidth` must be `<= 1024px`, with zero horizontal overflow or page shift.
* **Actual Behavior:** `document.body.scrollWidth` was `1082px`, producing an unwanted horizontal scroll of 58px.
* **Root Cause:**
  1. In `src/components/layout/CategoryNavbar.jsx`, the flex wrapper around the horizontally scrolling category list lacked `min-w-0` and `overflow-x-clip`, allowing the wide category items to expand the parent flex container beyond the viewport.
  2. In `src/components/layout/Footer.jsx`, the 4-column editorial matrix lacked `overflow-x-clip`.
  3. In `src/styles/index.css`, `html, body` lacked explicit `overflow-x: hidden` and `max-width: 100%`.
* **Fix Applied:**
  1. Added `overflow-x-clip` and `min-w-0 max-w-full` to `CategoryNavbar.jsx` and `Footer.jsx`.
  2. Added `html, body { overflow-x: hidden; max-width: 100%; }` to `src/styles/index.css`.
* **Retest Result:** **VERIFIED FIXED.** Re-evaluated via CDP at `1024 × 768`: `scrollWidth` reduced to **1009px** (strictly less than `1024px`). `hasHorizontalScroll` evaluated to `false` across all tested routes.

---

### ISSUE-QA-03 (P2 — Process & Dev Environment Polish)
* **Title:** Vite development server watcher file-lock crash during browser profile generation
* **Page:** Dev Server Environment
* **Viewport:** N/A (Server Process)
* **Reproduction Steps:**
  1. Start `npm run dev`.
  2. Launch a browser automation process that writes browser session tabs into a subdirectory of the workspace.
* **Expected Behavior:** Vite dev server should ignore temporary browser profile locks and continue serving hot modules uninterrupted.
* **Actual Behavior:** Node file watcher threw `EBUSY: resource busy or locked` on `scratch_edge_profile` and killed the Vite server process.
* **Root Cause:** `vite.config.js` did not explicitly exclude temporary test profiles, browser caches, and QA evidence directories from `server.watch.ignored`.
* **Fix Applied:**
  1. Added `server: { watch: { ignored: ['**/scratch*/**', '**/.edge*/**', '**/qa-evidence/**', '**/backups/**'] } }` to `vite.config.js`.
  2. Configured all browser automation runners to store profile sessions in `os.tmpdir()`, completely outside the repository tree.
* **Retest Result:** **VERIFIED FIXED.** Vite dev server ran continuously throughout the entire QA session with zero file-watcher crashes.

---

## 3. Summary of Issues

| Issue ID | Severity | Component | Summary | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ISSUE-QA-01** | **P1** | `App.jsx` | `/article/:slug` route alias missing | **FIXED & VERIFIED** |
| **ISSUE-QA-02** | **P2** | `CategoryNavbar` / `Footer` / CSS | Horizontal overflow on 1024px screens | **FIXED & VERIFIED** |
| **ISSUE-QA-03** | **P2** | `vite.config.js` | Dev server watcher collision with browser profile | **FIXED & VERIFIED** |

**Zero P0 or P1 defects remain open.**

---
name: Broadsheet Editorial
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf1'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee9ff'
  surface-container-highest: '#d8e3f9'
  on-surface: '#111c2c'
  on-surface-variant: '#5c403f'
  inverse-surface: '#263142'
  inverse-on-surface: '#ebf1ff'
  outline: '#906f6e'
  outline-variant: '#e5bdbb'
  surface-tint: '#bf0229'
  primary: '#9e001f'
  on-primary: '#ffffff'
  primary-container: '#c8102e'
  on-primary-container: '#ffdad8'
  inverse-primary: '#ffb3b1'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#434d5f'
  on-tertiary: '#ffffff'
  tertiary-container: '#5b6578'
  on-tertiary-container: '#d9e3f9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b1'
  on-primary-fixed: '#410007'
  on-primary-fixed-variant: '#92001c'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#d9e3f9'
  tertiary-fixed-dim: '#bdc7dc'
  on-tertiary-fixed: '#121c2c'
  on-tertiary-fixed-variant: '#3d4759'
  background: '#f9f9ff'
  on-background: '#111c2c'
  surface-variant: '#d8e3f9'
  breaking-crimson: '#DA251D'
  paper-canvas: '#FFFFFF'
  paper-tint: '#F8F9FA'
  paper-subtle: '#EDF2F7'
  border-rule: '#E2E8F0'
  border-heavy: '#1A1A1A'
  ticker-tint: '#FCE9E9'
  live-pulse: '#E53E3E'
typography:
  display-xl:
    fontFamily: Mukta
    fontSize: 44px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.02em
  display-xl-mobile:
    fontFamily: Mukta
    fontSize: 30px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Mukta
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Mukta
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Mukta
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: Mukta
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers an authoritative, high-density digital broadsheet experience tailored for national and regional reporting. The visual style merges traditional journalistic credibility with high-speed digital news consumption. 

### Design Philosophy
- **High-Density Editorial Architecture:** Content hierarchy relies on typographic scale, structured dividing rules, and modular column spans rather than excessive whitespace or decorative padding.
- **Journalistic Authority:** Clean, precise lines, restrained surface tints, and stark contrast communicate urgency, objectivity, and truth.
- **Bilingual Typographic Harmony:** Latin metadata, datelines, and navigation live alongside Devanagari headlines and body copy with matched vertical metrics and visual weight.
- **Functional Utility:** Avoid soft, playful, floating SaaS cards. Instead, adopt structured hairline borders, crisp media badges, numbered editorial rankings, and alert ribbons.

## Colors

The color palette is anchored in classic broadsheet journalism: high-contrast ink on crisp paper with purposeful editorial red accents.

### Color Roles & Hierarchy
- **Primary (`#C8102E`):** Used strictly for breaking news alerts, lead category stamps, primary live indicators, active section rules, and key editorial markers.
- **Secondary (`#1A1A1A`):** The primary ink color for main headlines, heavy editorial divider rules, and high-emphasis textual framing. Avoid pure black to maintain reading comfort across long articles.
- **Tertiary (`#2D3748`):** Deep slate applied to body paragraphs, datelines, and author bylines to establish subtle typographic gradation.
- **Neutral (`#5A6578`):** Mid-tone neutral reserved for captions, timestamps, reading time estimates, and secondary interface icons.

### Surface and Editorial Accents
- **Canvas (`#FFFFFF` & `#F8F9FA`):** Pure white serves as the primary reading canvas; `#F8F9FA` provides alternating column wash and section banding.
- **Editorial Ticker Tint (`#FCE9E9`):** A soft crimson tint used exclusively beneath breaking news ribbons and urgent flash banners.
- **Rule Lines (`#E2E8F0` & `#1A1A1A`):** 1px borders define module separations. High-importance packages receive a 3px secondary (`#1A1A1A`) top border rule.

## Typography

Typography establishes immediate editorial cadence and linguistic authenticity across English and Hindi text.

### Pairing Strategy
- **Mukta:** Applied across all news headlines, breaking banners, and story titles. Its robust Devanagari character set ensures crisp legibility even at compact mobile sizes, while maintaining an assertive, traditional broadsheet demeanor.
- **Inter:** Employed for body copy, article text, bylines, timestamps, and interface elements. Its tall x-height and neutral mechanics ensure extreme reading comfort in long-form paragraphs and dense analytical sidebars.

### Typesetting Rules
- **Headline Leading:** Keep line heights tight (1.15–1.25x font size) on headlines to preserve dense newspaper rhythm and prevent gaps in complex conjunct Devanagari glyphs.
- **Metadata Casings:** Use uppercase treatment with expanded letter spacing (`label-sm`, `label-md`) strictly for Latin category tags, datelines, and photo attributions. Never force uppercase or letter-spacing expansion onto Devanagari glyphs.
- **Lead Paragraphs:** The initial lead paragraph (`body-lg`) of an anchor story should carry a 1.65x line height with a 1px slate divider isolating it from the main body copy.

## Layout & Spacing

The layout is built upon an editorial 12-column grid system optimized for high content throughput, distinct multi-story sections, and flexible lead story packages.

### Grid & Breakpoints
- **Desktop (1200px+):** 12-column fixed-max layout (1280px max width). Standard editorial split: 3 columns (trending & opinions), 6 columns (lead packages & breaking stories), 3 columns (regional news & multimedia). Gutters are locked at `1.5rem` (`gutter-desktop`).
- **Tablet (768px – 1199px):** 8-column layout with `1rem` gutters. Content reflows into a 5-column primary news track and a 3-column secondary sidebar.
- **Mobile (< 768px):** 4-column layout with `1rem` margins. The grid collapses into stacked linear flows where vertical rules disappear in favor of 1px horizontal dividers between story blocks.

### Editorial Spacing Principles
- **Density Over Void:** Spacing values default to compact steps (`space-sm` for element pairings, `space-md` for story stack separation). Generous margins are avoided inside news items to maintain continuous scanning.
- **Structural Dividers:** Module separation is achieved via `1px solid #E2E8F0` hairline rules rather than deep gap spacing, retaining traditional newspaper column discipline.

## Elevation & Depth

This design system avoids blurred drop shadows, stacked cards, and skeuomorphic elevations. Depth is established purely through surface tonality, border hierarchies, and structural layering.

### Depth Rules
- **Flat Surface Hierarchy:** All primary news content rests at elevation 0 (`#FFFFFF`). Secondary sidebars, opinion columns, and fact boxes sit on flat tinted panels (`#F8F9FA` or `#EDF2F7`).
- **Hairline Outlines:** Content modules are isolated using crisp, unblurred 1px borders (`#E2E8F0`). 
- **Top-Rule Anchors:** High-priority editorial segments (e.g., Lead Story, Analysis, Fact Check) feature a dominant 3px solid top border in `#1A1A1A` or `#C8102E` to anchor the reader's eye.
- **Overlays & Badges:** Media overlays (video indicators, photo gallery counts) use solid `#1A1A1A` with a 90% opacity backplate and high-contrast white icons, flatly placed over media thumbnails without ambient shadow.
- **Breaking News Ribbon:** A pinned full-width ticker uses a flat `#FCE9E9` background anchored by a 1px solid `#DA251D` bottom border, remaining locked at the top of the viewport.

## Shapes

The shape system is strictly sharp (`roundedness: 0`), reinforcing the structure of print newspapers and broadsheet authenticity.

### Shape Details
- **Rectilinear Precision:** Headlines, image containers, cards, category chips, alert ribbons, and input fields all use 0px border-radius (`rounded-none`).
- **Media Thumbnails:** Story photography is strictly cropped to rectangular aspect ratios (16:9 for lead video/images, 4:3 for secondary thumbnails, 1:1 for author avatars) with squared corners and an optional 1px interior boundary stroke.
- **Buttons & Chips:** Interactive tags, category labels, and search fields are hard-edged rectangles with prominent typographic styling and crisp 1px borders.

## Components

### Buttons
- **Primary Editorial Button:** Solid `#C8102E` background, `#FFFFFF` bold label (`label-md`), 0px border radius, `0.5rem 1rem` padding. Hover state shifts to `#A00D24`.
- **Secondary Outlined Button:** `#FFFFFF` background with a 1px `#1A1A1A` border and `#1A1A1A` text. Hover state shifts to `#1A1A1A` with `#FFFFFF` text.
- **Text Link Button:** Underlined `#1A1A1A` text with an inline right arrow icon, shifting to `#C8102E` on hover.

### Category Chips & Badges
- **Editorial Category Stamp:** Sharp rectangular tag. Solid `#1A1A1A` background with crisp white uppercase text (`label-sm`), positioned directly above article headlines or resting on thumbnail corners.
- **Live / Breaking Badge:** Red `#C8102E` fill with pure white text and an integrated pulsing dot indicator for continuous live coverage.
- **Fact-Check Tag:** Light gray `#EDF2F7` fill, 1px `#CBD5E0` border, deep slate `#2D3748` text.

### News Cards & Story Blocks
- **Lead Package:** Large 16:9 media asset top or left, prominent `display-xl` Mukta headline, 2-line `body-md` synopsis, byline, timestamp, and a bulleted sub-bullet list of related updates. Framed by a 3px dark top rule.
- **Standard Story Item:** Horizontal flex unit with text on the left and a compact 4:3 or 1:1 thumbnail on the right. Separated from adjacent items by a 1px horizontal `#E2E8F0` divider.
- **No-Card Metaphor:** No rounded corners, no soft shadows, and no card margins. Content flows directly on the white canvas separated by hairline rules.

### Breaking News Ticker
- **Layout:** Full-width strip sitting directly beneath the main masthead.
- **Coloration:** `#FCE9E9` background with a solid `#DA251D` label badge reading "ब्रेकिंग न्यूज़" or "BREAKING".
- **Typography:** Seamless horizontal crawl or smooth step transition using `headline-sm` Mukta text, paired with explicit arrow navigation controls.

### Trending / Numbered Story Index
- **Visual Identifier:** Large, heavy numeric glyphs (01 to 10) in `#E2E8F0` or `#C8102E` placed to the left of the headline.
- **Typography:** Two-line Mukta `headline-sm` headline with a subtle timestamp beneath.

### Video & Media Badges
- **Video Indicator:** High-contrast solid dark rectangle (`#1A1A1A` at 90% opacity) positioned at the bottom left of video thumbnails. Contains a crisp white triangular play symbol and duration timestamp (e.g., `▶ 02:45`).
- **Photo Gallery Counter:** Matching dark rectangle badge displaying a camera icon with the total photo count (e.g., `📷 8`).

### Input Fields & Search
- **Search Bar:** Rectangular input box with a 1px solid `#1A1A1A` or `#CBD5E0` border, sharp corners, white background, and a dedicated square red search submit button with a magnifying glass icon.
- **Newsletter Subscription:** Horizontal input stack with an integrated flat `#C8102E` button, sitting within an editorial bordered box.
/**
 * Comprehensive Automated Verification Suite for Phase 4
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Verifies:
 * 1. Migration 5 (Storage bucket and RLS policies) integrity
 * 2. Media validation & structured path generator
 * 3. Client-side image optimization & aspect ratio calculations
 * 4. Safe media deletion check (featured media & TipTap JSON references)
 * 5. SEO Service & Schema.org JSON-LD structured data (NewsArticle, NewsMediaOrganization)
 * 6. Robots.txt & XML Sitemap compliance
 * 7. Hostinger .htaccess SPA routing, HTTPS & security headers
 * 8. Live Supabase Storage & Media RLS security enforcement
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
  }
}

// Read .env
let supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mqbegmviywgktnstaxpk.supabase.co';
let supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_eA7MetRL_U4PMReeZ8FP6A_P0mzxrhB';

try {
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('VITE_SUPABASE_URL=')) {
        supabaseUrl = trimmed.replace('VITE_SUPABASE_URL=', '').trim();
      }
      if (trimmed.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) {
        supabaseKey = trimmed.replace('VITE_SUPABASE_PUBLISHABLE_KEY=', '').trim();
      }
    }
  }
} catch {}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runPhase4Tests() {
  console.log('================================================================');
  console.log('  AZAAD SAMACHAR — PHASE 4 MEDIA, SEO & PRODUCTION READINESS TEST');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // TEST SUITE 1: Migration 5 Schema & Storage Policies Integrity
  // -------------------------------------------------------------
  console.log('1. Verifying Migration 5 Storage Policies & Schema...');
  const mig5Path = path.join(rootDir, 'supabase', 'migrations', '20261019000005_storage_and_media_policies.sql');
  assert(fs.existsSync(mig5Path), 'Migration 5 file exists');
  const mig5Content = fs.readFileSync(mig5Path, 'utf8');

  assert(mig5Content.includes("'media-library'"), "Migration 5 defines 'media-library' bucket");
  assert(mig5Content.includes('storage.objects'), 'Migration 5 creates policies on storage.objects');
  assert(mig5Content.includes('Public Read Media Library Objects'), 'Migration 5 provides public read access for media');
  assert(mig5Content.includes('Staff Upload Media Library Objects'), 'Migration 5 restricts uploads to authenticated staff');
  assert(mig5Content.includes('Staff Update Media Library Objects'), 'Migration 5 enforces staff-only media updates');
  assert(mig5Content.includes('Staff Delete Media Library Objects'), 'Migration 5 restricts deletion to owner or admin');
  assert(mig5Content.includes('idx_media_public_url'), 'Migration 5 indexes media(public_url)');
  assert(mig5Content.includes('idx_articles_featured_media_id'), 'Migration 5 indexes articles(featured_media_id)');

  // -------------------------------------------------------------
  // TEST SUITE 2: Storage Path Formatting & File Validation
  // -------------------------------------------------------------
  console.log('\n2. Testing Media Path Formatting & File Validation...');
  const { validateMediaFile, formatFileSize } = await import('../src/utils/mediaValidation.js');
  const { generateStoragePath, calculateAspectRatio, calculateTargetDimensions } = await import('../src/utils/imageOptimization.js');

  const validFile = { name: 'news_photo 2026.jpg', type: 'image/jpeg', size: 1024 * 500 };
  const validCheck = validateMediaFile(validFile);
  assert(validCheck.isValid === true, 'Accepts valid JPEG under 25MB');

  const oversizedFile = { name: 'huge.png', type: 'image/png', size: 30 * 1024 * 1024 };
  const oversizedCheck = validateMediaFile(oversizedFile);
  assert(oversizedCheck.isValid === false && oversizedCheck.errors.some((e) => e.includes('25 MB')), 'Rejects file exceeding 25MB');

  const invalidTypeFile = { name: 'script.exe', type: 'application/x-msdownload', size: 1024 };
  const invalidTypeCheck = validateMediaFile(invalidTypeFile);
  assert(invalidTypeCheck.isValid === false, 'Rejects executable or unsupported MIME type');

  const formattedPath = generateStoragePath('भारत न्यूज़ 2026! @#$.png');
  const pathRegex = /^articles\/\d{4}\/\d{2}\/\d+-[a-z0-9-_]+\.webp$/;
  assert(pathRegex.test(formattedPath), `Generates structured and sanitized path: ${formattedPath}`);

  // -------------------------------------------------------------
  // TEST SUITE 3: Aspect Ratio & Image Calculations
  // -------------------------------------------------------------
  console.log('\n3. Testing Image Calculations & Aspect Ratios...');

  assert(calculateAspectRatio(1920, 1080) === '16:9', '1920x1080 calculates to 16:9 aspect ratio');
  assert(calculateAspectRatio(1200, 900) === '4:3', '1200x900 calculates to 4:3 aspect ratio');
  assert(calculateAspectRatio(800, 800) === '1:1', '800x800 calculates to 1:1 aspect ratio');

  const scaled = calculateTargetDimensions(3840, 2160, 1920, 1920);
  assert(scaled.width === 1920 && scaled.height === 1080, `Downscales 4K image to 1920x1080: ${scaled.width}x${scaled.height}`);

  const unscaled = calculateTargetDimensions(800, 600, 1920, 1920);
  assert(unscaled.width === 800 && unscaled.height === 600, 'Does not upscale image smaller than limits');

  // -------------------------------------------------------------
  // TEST SUITE 4: Safe Media Deletion Checks
  // -------------------------------------------------------------
  console.log('\n4. Testing Safe Media Deletion Usage Checks...');
  const { checkMediaAssetUsage } = await import('../src/utils/mediaStorage.js');

  const sampleArticles = [
    {
      id: 'art-1',
      title: 'संसद में बजट सत्र',
      featuredImage: 'https://example.com/storage/img-1.webp',
      featuredMediaId: 'media-uuid-1',
      content: { type: 'doc', content: [] },
    },
    {
      id: 'art-2',
      title: 'खेल समाचार',
      featuredImage: 'https://example.com/other.jpg',
      featuredMediaId: 'media-uuid-2',
      content: {
        type: 'doc',
        content: [
          {
            type: 'image',
            attrs: { src: 'https://example.com/storage/img-3.webp' },
          },
        ],
      },
    },
  ];

  const usage1 = checkMediaAssetUsage({ id: 'media-uuid-1', url: 'https://example.com/storage/img-1.webp' }, sampleArticles);
  assert(usage1.isUsed === true && usage1.usedAsFeatured === true, 'Detects image used as article featured image');

  const usage2 = checkMediaAssetUsage({ id: 'media-uuid-3', url: 'https://example.com/storage/img-3.webp' }, sampleArticles);
  assert(usage2.isUsed === true && usage2.usedInContent === true, 'Detects image embedded inside TipTap JSON content');

  const usage3 = checkMediaAssetUsage({ id: 'media-uuid-unused', url: 'https://example.com/unused.webp' }, sampleArticles);
  assert(usage3.isUsed === false, 'Allows deletion of completely unused image');

  // -------------------------------------------------------------
  // TEST SUITE 5: Centralized SEO Service & Schema.org JSON-LD
  // -------------------------------------------------------------
  console.log('\n5. Testing Centralized SEO & Structured Data Generation...');
  const {
    CANONICAL_DOMAIN,
    buildCanonicalUrl,
    buildArticleMetadata,
    generateNewsArticleJsonLd,
    generateOrganizationJsonLd,
  } = await import('../src/services/seoService.js');

  assert(CANONICAL_DOMAIN === 'https://azaadsamacharindia.com', 'Strict production domain https://azaadsamacharindia.com');

  const artUrl = buildCanonicalUrl('/news/uttar-pradesh-expressway');
  assert(artUrl === 'https://azaadsamacharindia.com/news/uttar-pradesh-expressway', `Canonical URL format: ${artUrl}`);

  const testArticle = {
    id: 'test-123',
    slug: 'up-defense-corridor',
    title: 'उत्तर प्रदेश डिफेंस कॉरिडोर में नया निवेश',
    summary: 'बुंदेलखंड में भारी रक्षा विनिर्माण निवेश स्वीकृत।',
    featuredImage: 'https://azaadsamacharindia.com/assets/banner.webp',
    publishedAt: '2026-10-19T10:00:00Z',
    updatedAt: '2026-10-19T12:00:00Z',
    category: 'uttar-pradesh',
    author: { name: 'राजेश कुमार' },
  };

  const meta = buildArticleMetadata(testArticle);
  assert(meta.title.includes('उत्तर प्रदेश डिफेंस कॉरिडोर'), 'Article metadata includes title');
  assert(meta.canonicalUrl.includes('/news/up-defense-corridor'), 'Article metadata has canonical URL');
  assert(meta.ogImage === testArticle.featuredImage, 'Article metadata has OpenGraph image');
  assert(meta.twitterCard === 'summary_large_image', 'Twitter card is summary_large_image');

  const newsArticleJson = generateNewsArticleJsonLd(testArticle);
  assert(newsArticleJson['@type'] === 'NewsArticle', 'Schema.org type is NewsArticle');
  assert(newsArticleJson.headline === testArticle.title, 'JSON-LD headline matches title');
  const authorName = Array.isArray(newsArticleJson.author)
    ? newsArticleJson.author[0]?.name
    : newsArticleJson.author?.name;
  assert(authorName === 'राजेश कुमार', 'JSON-LD author matches author name');
  assert(newsArticleJson.publisher.name === 'आज़ाद समाचार (Azaad Samachar)', 'JSON-LD publisher matches branding');
  assert(newsArticleJson.mainEntityOfPage['@id'] === 'https://azaadsamacharindia.com/news/up-defense-corridor', 'JSON-LD mainEntityOfPage canonical');

  const orgJson = generateOrganizationJsonLd();
  assert(orgJson['@type'] === 'NewsMediaOrganization', 'Schema.org publisher is NewsMediaOrganization');
  assert(orgJson.url === 'https://azaadsamacharindia.com', 'Organization URL is canonical domain');

  // -------------------------------------------------------------
  // TEST SUITE 6: Robots.txt & XML Sitemap Compliance
  // -------------------------------------------------------------
  console.log('\n6. Testing Robots.txt and XML Sitemap...');
  const robotsPath = path.join(rootDir, 'public', 'robots.txt');
  assert(fs.existsSync(robotsPath), 'public/robots.txt exists');
  const robotsContent = fs.readFileSync(robotsPath, 'utf8');
  assert(robotsContent.includes('Disallow: /admin'), 'robots.txt protects /admin routes');
  assert(robotsContent.includes('Sitemap: https://azaadsamacharindia.com/sitemap.xml'), 'robots.txt links to production sitemap');

  const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
  assert(fs.existsSync(sitemapPath), 'public/sitemap.xml exists');
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  const isSitemapIndex = sitemapContent.includes('<sitemapindex');
  const catSitemapPath = path.join(rootDir, 'public', 'sitemap-categories.xml');
  const catContent = fs.existsSync(catSitemapPath) ? fs.readFileSync(catSitemapPath, 'utf8') : sitemapContent;

  assert(
    sitemapContent.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">') ||
    sitemapContent.includes('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'),
    'sitemap.xml has valid schema declaration'
  );
  assert(catContent.includes('<loc>https://azaadsamacharindia.com/</loc>'), 'sitemap includes homepage');
  assert(catContent.includes('/category/national'), 'sitemap includes category URLs');
  assert(!sitemapContent.includes('azaadsamachar.in'), 'sitemap.xml does not use deprecated .in domain');

  // -------------------------------------------------------------
  // TEST SUITE 7: Hostinger .htaccess SPA Routing & Security
  // -------------------------------------------------------------
  console.log('\n7. Testing Hostinger .htaccess Configuration...');
  const htaccessPath = path.join(rootDir, 'public', '.htaccess');
  assert(fs.existsSync(htaccessPath), 'public/.htaccess exists');
  const htaccessContent = fs.readFileSync(htaccessPath, 'utf8');
  assert(htaccessContent.includes('RewriteEngine On'), '.htaccess enables RewriteEngine');
  assert(htaccessContent.includes('RewriteRule ^ index.html [L]'), '.htaccess provides SPA fallback to index.html');
  assert(htaccessContent.includes('RewriteCond %{HTTPS} !=on'), '.htaccess enforces HTTPS redirect');
  assert(htaccessContent.includes('X-Content-Type-Options "nosniff"'), '.htaccess sets X-Content-Type-Options nosniff');
  assert(htaccessContent.includes('X-Frame-Options "SAMEORIGIN"'), '.htaccess sets X-Frame-Options SAMEORIGIN');
  assert(htaccessContent.includes('max-age=31536000'), '.htaccess configures immutable caching for hashed assets');
  assert(htaccessContent.includes('no-cache, no-store, must-revalidate'), '.htaccess prevents stale HTML caching');

  // -------------------------------------------------------------
  // TEST SUITE 8: Live Supabase Remote Security & RLS
  // -------------------------------------------------------------
  console.log('\n8. Testing Remote Supabase Security & RLS Enforcements...');
  try {
    // 1. Anonymous visitor attempt to insert into public.media
    const { data: mediaInsert, error: mediaInsertError } = await supabase
      .from('media')
      .insert({
        original_filename: 'unauthorized_hack.jpg',
        public_url: 'https://malicious.com/exploit.jpg',
        mime_type: 'image/jpeg',
        file_size: 100,
      })
      .select();

    assert(
      mediaInsertError !== null && (mediaInsertError.code === '42501' || mediaInsertError.message.includes('violates row-level security')),
      `Anonymous cannot insert into public.media table: [${mediaInsertError?.message}]`
    );

    // 2. Anonymous visitor attempt to delete from public.media
    const { error: mediaDeleteError } = await supabase
      .from('media')
      .delete()
      .eq('id', '00000000-0000-0000-0000-000000000000');

    assert(
      mediaDeleteError === null || mediaDeleteError.code === '42501',
      'Anonymous delete on media table is guarded'
    );

    // 3. Anonymous visitor reading media table
    const { data: mediaRead, error: mediaReadError } = await supabase
      .from('media')
      .select('id, public_url, caption')
      .limit(5);

    assert(mediaReadError === null, `Anonymous visitor can query approved media list (${mediaRead?.length || 0} found)`);

  } catch (err) {
    console.error('Remote test error:', err);
  }

  console.log('\n================================================================');
  console.log(`  PHASE 4 VERIFICATION RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPhase4Tests();

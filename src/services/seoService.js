/**
 * SEO & Structured Data Service for Azaad Samachar (आज़ाद समाचार)
 * Production Domain: https://azaadsamacharindia.com
 *
 * Implements:
 * - Dynamic document title and meta tag synchronization.
 * - Open Graph & Twitter summary_large_image social card tags.
 * - Canonical URL enforcement on the primary production domain.
 * - Schema.org NewsArticle and NewsMediaOrganization JSON-LD structured data.
 * - Safe sanitization to prevent XSS in meta attributes and script tags.
 */

export const PRODUCTION_DOMAIN = 'https://azaadsamacharindia.com';
export const CANONICAL_DOMAIN = PRODUCTION_DOMAIN;
export const SITE_NAME_HINDI = 'आज़ाद समाचार';
export const SITE_NAME_ENGLISH = 'Azaad Samachar';
export const DEFAULT_OG_IMAGE = `${PRODUCTION_DOMAIN}/assets/logo.png`;
export const TWITTER_HANDLE = '@AzaadSamachar';

/**
 * Creates canonical URL from relative path
 */
export function buildCanonicalUrl(path = '') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${PRODUCTION_DOMAIN}${cleanPath}`;
}

/**
 * Builds clean metadata object for an article
 */
export function buildArticleMetadata(article) {
  if (!article) return {};
  const canonical = article.canonicalUrl || buildCanonicalUrl(`news/${article.slug}`);
  const title = article.title ? `${article.title} - ${SITE_NAME_HINDI} | ${SITE_NAME_ENGLISH}` : SITE_NAME_HINDI;
  const description = article.summary || article.excerpt || article.title || '';
  const ogImage = article.featuredImage || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    canonicalUrl: canonical,
    ogImage,
    ogType: 'article',
    twitterCard: 'summary_large_image',
  };
}

/**
 * Generates Schema.org JSON-LD for a NewsArticle
 */
export function generateNewsArticleSchema(article) {
  if (!article) return null;

  const canonicalUrl = article.canonicalUrl || buildCanonicalUrl(`news/${article.slug}`);
  const imageUrl = article.featuredImage
    ? (article.featuredImage.startsWith('http') ? article.featuredImage : `${PRODUCTION_DOMAIN}${article.featuredImage}`)
    : DEFAULT_OG_IMAGE;

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    headline: article.title,
    description: article.summary || article.excerpt || article.title,
    image: [imageUrl],
    datePublished: article.publishedAt || article.createdAt,
    dateModified: article.updatedAt || article.publishedAt || article.createdAt,
    articleSection: article.category || 'National',
    inLanguage: article.language || 'hi',
    author: [
      {
        '@type': 'Person',
        name: article.author?.name || 'आज़ाद समाचार डिजिटल डेस्क',
        jobTitle: article.author?.role || 'संपादक',
        url: buildCanonicalUrl('about'),
      },
    ],
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'आज़ाद समाचार (Azaad Samachar)',
      url: PRODUCTION_DOMAIN,
      logo: {
        '@type': 'ImageObject',
        url: DEFAULT_OG_IMAGE,
      },
    },
  };
}

/**
 * Generates Schema.org JSON-LD for Portal Homepage / Organization
 */
export function generatePortalOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'आज़ाद समाचार',
    alternateName: 'Azaad Samachar',
    url: PRODUCTION_DOMAIN,
    logo: DEFAULT_OG_IMAGE,
    sameAs: [
      'https://x.com/azad_samachar_',
      'https://www.youtube.com/@azadsamachar9',
      'https://www.instagram.com/azadsamachar9?cplk=MWoxdXdtd3JweDl3bw%3D%3D',
    ],
    publishingPrinciples: buildCanonicalUrl('editorial-policy'),
    correctionsPolicy: buildCanonicalUrl('fact-check-policy'),
    diversityPolicy: buildCanonicalUrl('about'),
    ethicsPolicy: buildCanonicalUrl('editorial-policy'),
  };
}

/**
 * Helper to update or create an HTML meta tag
 */
export function setMetaTag(name, content, isProperty = false) {
  if (typeof document === 'undefined') return;
  const attribute = isProperty ? 'property' : 'name';
  let meta = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content || '');
}

/**
 * Helper to update canonical link
 */
export function setCanonicalUrl(url) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

/**
 * Applies complete SEO meta suite to current browser DOM
 */
export function applySEO({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  publishedAt,
  modifiedAt,
  authorName,
  section,
  noIndex = false,
}) {
  if (typeof document === 'undefined') return;

  // 1. Page Title
  const fullTitle = title
    ? `${title} - ${SITE_NAME_HINDI} | ${SITE_NAME_ENGLISH}`
    : `${SITE_NAME_HINDI} • निष्पक्ष • निर्भीक • डिजिटल न्यूज़ पोर्टल`;
  document.title = fullTitle;

  // 2. Standard Meta
  setMetaTag('description', description || `${SITE_NAME_HINDI} - भारत का विश्वसनीय और स्वतंत्र डिजिटल न्यूज़ पोर्टल।`);
  setMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

  // 3. Canonical Link
  const targetCanonical = canonicalUrl || PRODUCTION_DOMAIN;
  setCanonicalUrl(targetCanonical);

  // 4. Open Graph
  setMetaTag('og:site_name', `${SITE_NAME_HINDI} (${SITE_NAME_ENGLISH})`, true);
  setMetaTag('og:title', title || fullTitle, true);
  setMetaTag('og:description', description || '', true);
  setMetaTag('og:url', targetCanonical, true);
  setMetaTag('og:type', ogType, true);
  setMetaTag('og:locale', 'hi_IN', true);

  const finalImage = ogImage || DEFAULT_OG_IMAGE;
  setMetaTag('og:image', finalImage, true);
  setMetaTag('og:image:alt', title || SITE_NAME_HINDI, true);

  if (ogType === 'article') {
    if (publishedAt) setMetaTag('article:published_time', publishedAt, true);
    if (modifiedAt) setMetaTag('article:modified_time', modifiedAt, true);
    if (authorName) setMetaTag('article:author', authorName, true);
    if (section) setMetaTag('article:section', section, true);
  }

  // 5. Twitter Card
  setMetaTag('twitter:card', 'summary_large_image');
  setMetaTag('twitter:site', TWITTER_HANDLE);
  setMetaTag('twitter:title', title || fullTitle);
  setMetaTag('twitter:description', description || '');
  setMetaTag('twitter:image', finalImage);
}

// Aliases for Schema.org JSON-LD structured data generators
export const generateNewsArticleJsonLd = generateNewsArticleSchema;
export const generateOrganizationJsonLd = generatePortalOrganizationSchema;


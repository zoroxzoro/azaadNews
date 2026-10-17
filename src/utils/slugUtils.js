/**
 * Slug Utilities for Azaad Samachar
 * Handles Unicode-safe slug generation, transliteration helpers, and uniqueness checks.
 */

// Common Hindi words transliteration map for SEO-friendly slugs
const HINDI_TRANSLITERATION_MAP = {
  'भारत': 'bharat',
  'सरकार': 'sarkar',
  'संसद': 'parliament',
  'योजना': 'yojana',
  'चुनाव': 'chunav',
  'उत्तर प्रदेश': 'uttar-pradesh',
  'यूपी': 'up',
  'दिल्ली': 'delhi',
  'विकास': 'vikas',
  'बजट': 'budget',
  'नीति': 'policy',
  'समाचार': 'samachar',
  'विशेष': 'vishesh',
  'क्रिकेट': 'cricket',
  'मौसम': 'weather',
  'रेलवे': 'railway',
  'शिक्षा': 'education',
  'स्वास्थ्य': 'health',
};

/**
 * Generates an SEO-friendly URL slug from an article headline.
 * Supports Hindi transliteration fallbacks and clean Latin/Unicode characters.
 *
 * @param {string} text - Headline text
 * @returns {string} - Clean URL slug
 */
export function generateSlug(text) {
  if (!text || typeof text !== 'string') return '';

  let str = text.trim().toLowerCase();

  // Replace known common Hindi phrases if present
  Object.entries(HINDI_TRANSLITERATION_MAP).forEach(([hi, en]) => {
    str = str.replace(new RegExp(hi, 'g'), en);
  });

  // Convert Devanagari characters:
  // If slug contains non-ASCII characters, we clean and preserve valid alphanumeric or transliterate
  str = str
    .replace(/[^\w\s\u0900-\u097F-]/g, '') // Remove punctuation except hyphens, spaces, and Devanagari
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .replace(/^-+|-+$/g, ''); // Trim leading and trailing hyphens

  // If after cleaning it's empty, generate a fallback
  if (!str) {
    str = `story-${Date.now().toString(36)}`;
  }

  // Limit length to 100 characters for clean URLs
  if (str.length > 100) {
    str = str.slice(0, 100).replace(/-+$/, '');
  }

  return str;
}

/**
 * Validates slug format
 * Allows lowercase letters, numbers, hyphens, and Devanagari letters
 */
export function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  const trimmed = slug.trim();
  // Must be between 2 and 120 chars, only letters, numbers, and hyphens (no consecutive hyphens)
  return /^[a-z0-9\u0900-\u097F]+(?:-[a-z0-9\u0900-\u097F]+)*$/.test(trimmed);
}

/**
 * Checks if a slug is unique among existing articles
 *
 * @param {string} slug - The slug to test
 * @param {string|number|null} currentArticleId - ID of the article being edited (excluded from check)
 * @param {Array} articles - Current list of articles
 * @returns {boolean} - True if unique, false if already taken
 */
export function isSlugUnique(slug, currentArticleId, articles = []) {
  if (!slug) return false;
  const normalized = slug.trim().toLowerCase();

  return !articles.some((article) => {
    const isSameArticle =
      currentArticleId &&
      (String(article.id) === String(currentArticleId) || Number(article.id) === Number(currentArticleId));
    if (isSameArticle) return false;

    return (article.slug || '').toLowerCase() === normalized;
  });
}

/**
 * Ensures unique slug by appending counter suffix if slug is taken
 */
export function getUniqueSlug(baseSlug, currentArticleId, articles = []) {
  const cleanBase = generateSlug(baseSlug) || `story-${Date.now().toString(36)}`;
  let candidate = cleanBase;
  let counter = 1;

  while (!isSlugUnique(candidate, currentArticleId, articles)) {
    candidate = `${cleanBase}-${counter}`;
    counter += 1;
  }

  return candidate;
}

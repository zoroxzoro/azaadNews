/**
 * Client-side search utility for Azaad Samachar
 * Supports bilingual search (Hindi & English), Unicode normalization,
 * keyword weighting, and relevance ranking.
 */

/**
 * Normalizes text for consistent comparison
 * @param {string} text
 * @returns {string}
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .normalize('NFC')
    .toLowerCase()
    .trim();
}

export const normalizeHindiText = normalizeText;

/**
 * Searches across articles using multi-field weighted scoring
 *
 * Weighting hierarchy:
 * 1. Title match: 15-20 points
 * 2. Tags match: 10 points
 * 3. Summary match: 6 points
 * 4. Author name match: 5 points
 * 5. Category name match: 4 points
 * 6. Body content match: 2 points
 *
 * @param {Array} articles - Array of article objects
 * @param {string} rawQuery - Search keyword from user
 * @returns {Array} - Matching articles with relevance score and highlight helper
 */
export function searchNews(articles = [], rawQuery = '') {
  const query = normalizeText(rawQuery);
  if (!query) return [];

  // Split into individual search terms for multi-word queries
  const terms = query.split(/\s+/).filter((t) => t.length > 0);
  if (terms.length === 0) return [];

  const results = [];

  for (const article of articles) {
    if (!article) continue;

    let score = 0;
    const title = normalizeText(article.title);
    const summary = normalizeText(article.summary);
    const content = normalizeText(article.content);
    const category = normalizeText(article.category);
    const authorName = normalizeText(article.author?.name);
    const tags = Array.isArray(article.tags)
      ? article.tags.map((t) => normalizeText(t)).join(' ')
      : '';

    // Check full query first (highest relevance)
    if (title.includes(query)) score += 20;
    if (tags.includes(query)) score += 12;
    if (summary.includes(query)) score += 8;
    if (authorName.includes(query)) score += 6;
    if (category.includes(query)) score += 5;
    if (content.includes(query)) score += 3;

    // Check individual terms
    for (const term of terms) {
      if (title.includes(term)) score += 6;
      if (tags.includes(term)) score += 4;
      if (summary.includes(term)) score += 3;
      if (authorName.includes(term)) score += 2;
      if (category.includes(term)) score += 2;
      if (content.includes(term)) score += 1;
    }

    if (score > 0) {
      results.push({
        ...article,
        _searchScore: score,
      });
    }
  }

  // Sort by search score descending
  return results.sort((a, b) => b._searchScore - a._searchScore);
}

/**
 * Highlights search matches in text safely
 * @param {string} text
 * @param {string} query
 * @returns {string} - Text with marked elements or original text
 */
export function getHighlightedParts(text = '', query = '') {
  if (!text || !query) return [{ text, isMatch: false }];

  const cleanQuery = query.trim();
  if (!cleanQuery) return [{ text, isMatch: false }];

  // Escape special regex characters
  const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part) => ({
    text: part,
    isMatch: part.toLowerCase() === cleanQuery.toLowerCase(),
  }));
}

/**
 * Filtering and sorting utility for Azaad Samachar
 */

/**
 * Filters a list of news articles by category, language, date, and content type.
 *
 * @param {Array} articles - Array of article objects
 * @param {object} filters - Active filter parameters
 * @returns {Array} - Filtered and sorted article array
 */
export function filterNews(articles = [], filters = {}) {
  const {
    category = 'all',
    subCategory = 'all',
    language = 'all',
    date = 'all',
    from = '',
    to = '',
    contentType = 'all',
    sort = 'newest',
  } = filters;

  const now = new Date();

  const filtered = articles.filter((article) => {
    if (!article) return false;

    // 1. Category Filter
    if (category && category !== 'all' && article.category !== category) {
      return false;
    }

    // 2. Sub-Category / Tag / Topic Filter
    if (subCategory && subCategory !== 'all') {
      const matchTag = article.tags?.some((t) =>
        t.toLowerCase().includes(subCategory.toLowerCase())
      );
      const matchCat = article.category?.toLowerCase() === subCategory.toLowerCase();
      if (!matchTag && !matchCat) return false;
    }

    // 3. Language Filter
    if (language && language !== 'all') {
      const articleLang = article.language || 'hi';
      if (articleLang.toLowerCase() !== language.toLowerCase()) {
        return false;
      }
    }

    // 4. Content Type Filter
    if (contentType && contentType !== 'all') {
      if (contentType === 'video' && !article.youtubeUrl) return false;
      if (contentType === 'text' && article.youtubeUrl) return false;
      if (contentType === 'photo' && !article.tags?.some((t) => t.includes('फोटो') || t.includes('photo'))) {
        // Fallback for photo content check
        if (article.category !== 'spirituality' && !article.slug?.includes('photo')) {
          return false;
        }
      }
    }

    // 5. Date Filter
    if (article.publishedAt) {
      const pubDate = new Date(article.publishedAt);

      if (date === 'today' || date === '24h') {
        const diffHours = (now - pubDate) / (1000 * 60 * 60);
        if (diffHours > 24) return false;
      } else if (date === 'week' || date === '7d') {
        const diffDays = (now - pubDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 7) return false;
      } else if (date === 'month' || date === '30d') {
        const diffDays = (now - pubDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 30) return false;
      } else if (date === 'year') {
        const diffDays = (now - pubDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 365) return false;
      } else if (date === 'custom') {
        if (from) {
          const fromDate = new Date(from);
          if (pubDate < fromDate) return false;
        }
        if (to) {
          const toDate = new Date(to);
          toDate.setHours(23, 59, 59, 999);
          if (pubDate > toDate) return false;
        }
      }
    }

    return true;
  });

  // 6. Sorting
  return filtered.sort((a, b) => {
    if (sort === 'relevance' && a._searchScore && b._searchScore) {
      return b._searchScore - a._searchScore;
    }
    if (sort === 'popular') {
      return (b.views || 0) - (a.views || 0);
    }
    if (sort === 'oldest') {
      return new Date(a.publishedAt) - new Date(b.publishedAt);
    }
    // Default: 'newest'
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });
}

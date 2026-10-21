/**
 * Articles Service & Supabase Data Access Layer
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Provides bidirectional translation between Supabase PostgreSQL schema (snake_case)
 * and the existing React frontend article structure (camelCase).
 *
 * Full CRUD, multi-category relational management, tag synchronization,
 * revision tracking, and editorial activity logging.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { mockNews, getArticleBySlug as getMockArticleBySlug, getArticleById as getMockArticleById } from '../data/mockNews.js';
import { normalizeStatus, ARTICLE_STATUS } from '../utils/articleStatus.js';

/**
 * Maps a Supabase PostgreSQL article record (with joined profiles, media, and taxonomy)
 * to the exact JavaScript structure expected by Azaad Samachar React components.
 */
export function adaptSupabaseArticleToFrontend(row) {
  if (!row) return null;

  // Resolve categories (supports multiple categories)
  const categoryObjects = [];
  let primaryCategorySlug = 'latest';

  if (Array.isArray(row.article_categories) && row.article_categories.length > 0) {
    row.article_categories.forEach((ac) => {
      const cat = ac.categories || ac;
      if (cat) {
        categoryObjects.push({
          id: cat.id,
          slug: cat.slug,
          name: cat.name,
          nameHindi: cat.name,
          nameEnglish: cat.english_name,
          isPrimary: Boolean(ac.is_primary),
        });
        if (ac.is_primary) {
          primaryCategorySlug = cat.slug;
        }
      }
    });
    if (primaryCategorySlug === 'latest' && categoryObjects.length > 0) {
      primaryCategorySlug = categoryObjects[0].slug;
    }
  } else if (row.category_slug) {
    primaryCategorySlug = row.category_slug;
  }

  // Resolve tags
  const tags = Array.isArray(row.article_tags)
    ? row.article_tags.map((t) => t.tags?.name || t.tag_name || t.name || t).filter(Boolean)
    : Array.isArray(row.tags)
    ? row.tags
    : [];

  // Resolve author profile
  const authorData = row.author || row.profiles || {};
  const authorAttribution = row.author_attribution || {};
  const author = {
    id: authorData.id || row.author_id,
    name:
      authorData.display_name_hindi ||
      authorData.display_name ||
      row.legacy_author_name ||
      authorAttribution.displayNameHindi ||
      'आज़ाद समाचार डेस्क',
    role:
      authorData.desk
        ? `${authorData.desk} ब्यूरो`
        : authorData.role || authorAttribution.role || 'संपादक',
    location: row.location || authorAttribution.location || 'कानपुर',
    avatar: authorData.avatar_url || null,
  };

  // Resolve featured media
  const media = row.featured_media || row.media || {};
  const featuredImage = media.public_url || row.legacy_url || '';
  const imageCaption = media.caption || '';
  const imageCredit = media.credit || '';
  const imageAlt = media.alt_text || row.title || '';

  return {
    id: row.id,
    legacyWordPressId: row.legacy_wordpress_id || null,
    isImported: Boolean(row.is_imported),
    importBatchId: row.import_batch_id || null,
    slug: row.slug,
    title: row.title,
    summary: row.excerpt || '',
    content: row.content_json || row.original_html || '',
    contentJson: row.content_json || null,
    originalHtml: row.original_html || '',
    language: row.language || 'hi',
    category: primaryCategorySlug,
    categories: categoryObjects,
    featuredImage,
    featuredMediaId: media.id || row.featured_media_id || null,
    imageCaption,
    imageCredit,
    imageAlt,
    galleryImages: Array.isArray(row.content_json?.gallery) ? row.content_json.gallery : [],
    author,
    authorId: row.author_id || authorData.id || null,
    publishedAt: row.published_at || null,
    scheduledAt: row.scheduled_at || null,
    scheduledFor: row.scheduled_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    status: normalizeStatus(row.status),
    isBreaking: Boolean(row.is_breaking),
    isFeatured: Boolean(row.is_featured),
    isTrending: Boolean(row.is_trending),
    tags,
    youtubeUrl: row.youtube_url || '',
    videoDuration: row.video_duration || '',
    readTime: row.read_time || null,
    views: Number(row.views_count || 0),
    location: row.location || 'कानपुर',
    seoTitle: row.seo_title || '',
    metaDescription: row.seo_description || '',
    canonicalUrl: row.canonical_url || '',
  };
}

/**
 * Generates all candidate slug formats for URL resolution.
 * Handles React Router decoded UTF-8 strings, single-encoded (%e0...),
 * double-encoded (%25e0... from WordPress imports), uppercase/lowercase variations,
 * ensuring seamless resolution across the entire 10,654 article historical archive.
 */
export function generateSlugCandidates(rawSlug) {
  if (!rawSlug || typeof rawSlug !== 'string') return [];
  const set = new Set();
  const add = (s) => {
    if (typeof s === 'string' && s.trim()) {
      const trimmed = s.trim();
      set.add(trimmed);
      set.add(trimmed.toLowerCase());
      set.add(trimmed.toUpperCase());
    }
  };

  add(rawSlug);

  // Iteratively decode (up to 3 times to unwrap %25 and URL encodings)
  let cur = rawSlug;
  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(cur);
      if (decoded === cur) break;
      add(decoded);
      cur = decoded;
    } catch (e) {
      break;
    }
  }

  // Iteratively encode from all decoded/existing forms
  const snapshot = Array.from(set);
  for (const item of snapshot) {
    try {
      const enc1 = encodeURIComponent(item);
      add(enc1);
      const enc2 = encodeURIComponent(enc1);
      add(enc2);
    } catch (e) {}
  }

  return Array.from(set);
}

/**
 * Maps a frontend article object or form state to Supabase PostgreSQL insert/update payload.
 */
export function adaptFrontendArticleToSupabase(article, authorId, { isPartial = false } = {}) {
  const isTipTapObject = typeof article.content === 'object' && article.content !== null;
  const status = article.status ? normalizeStatus(article.status) : (isPartial ? undefined : ARTICLE_STATUS.DRAFT);

  const payload = {};

  if (!isPartial || article.title !== undefined) {
    if (article.title !== undefined) {
      payload.title = article.title?.trim() || (isPartial ? undefined : 'Untitled');
      if (payload.title === undefined) delete payload.title;
    } else if (!isPartial) {
      payload.title = 'Untitled';
    }
  }

  if (!isPartial || article.slug !== undefined) {
    if (article.slug) {
      payload.slug = article.slug.trim();
    } else if (!isPartial) {
      payload.slug = `article-${Date.now()}`;
    }
  }

  if (!isPartial || article.summary !== undefined) {
    if (article.summary !== undefined) {
      payload.excerpt = article.summary?.trim() || '';
    } else if (!isPartial) {
      payload.excerpt = '';
    }
  }

  if (!isPartial || article.language !== undefined) {
    payload.language = article.language || (isPartial ? undefined : 'hi');
    if (payload.language === undefined) delete payload.language;
  }

  if (status !== undefined) {
    payload.status = status;

    if (status === ARTICLE_STATUS.PUBLISHED) {
      payload.published_at = article.publishedAt || new Date().toISOString();
      payload.scheduled_at = null;
    } else if (status === ARTICLE_STATUS.SCHEDULED) {
      payload.scheduled_at = article.scheduledAt || article.scheduledFor || null;
    } else if (status === ARTICLE_STATUS.DRAFT) {
      payload.scheduled_at = null;
    }
  } else {
    if (article.scheduledAt !== undefined || article.scheduledFor !== undefined) {
      payload.scheduled_at = article.scheduledAt || article.scheduledFor || null;
    }
    if (article.publishedAt !== undefined) {
      payload.published_at = article.publishedAt;
    }
  }

  if (article.featuredMediaId !== undefined) {
    payload.featured_media_id = (article.featuredMediaId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(article.featuredMediaId))
      ? article.featuredMediaId
      : null;
  } else if (!isPartial) {
    payload.featured_media_id = null;
  }

  if (article.isBreaking !== undefined) payload.is_breaking = Boolean(article.isBreaking);
  else if (!isPartial) payload.is_breaking = false;

  if (article.isFeatured !== undefined) payload.is_featured = Boolean(article.isFeatured);
  else if (!isPartial) payload.is_featured = false;

  if (article.isTrending !== undefined) payload.is_trending = Boolean(article.isTrending);
  else if (!isPartial) payload.is_trending = false;

  if (article.youtubeUrl !== undefined) payload.youtube_url = article.youtubeUrl || null;
  else if (!isPartial) payload.youtube_url = null;

  if (article.videoDuration !== undefined) payload.video_duration = article.videoDuration || null;
  else if (!isPartial) payload.video_duration = null;

  if (article.readTime !== undefined) payload.read_time = article.readTime || null;
  else if (!isPartial) payload.read_time = null;

  if (article.location !== undefined) payload.location = article.location || 'कानपुर';
  else if (!isPartial) payload.location = 'कानपुर';

  if (article.seoTitle !== undefined) payload.seo_title = article.seoTitle || null;
  else if (!isPartial) payload.seo_title = null;

  if (article.metaDescription !== undefined) payload.seo_description = article.metaDescription || null;
  else if (!isPartial) payload.seo_description = null;

  if (article.canonicalUrl !== undefined) payload.canonical_url = article.canonicalUrl || null;
  else if (!isPartial) payload.canonical_url = null;

  // Content & Gallery preservation: only assign if explicitly provided
  if (isTipTapObject) {
    payload.content_json = {
      ...article.content,
      gallery: Array.isArray(article.galleryImages)
        ? article.galleryImages
        : (article.content?.gallery || []),
    };
  } else if (Array.isArray(article.galleryImages) && article.galleryImages.length > 0) {
    payload.content_json = {
      type: 'doc',
      content: [],
      gallery: article.galleryImages,
    };
  }
  if (!isTipTapObject && typeof article.content === 'string' && article.content) {
    payload.original_html = article.content;
  } else if (article.originalHtml) {
    payload.original_html = article.originalHtml;
  }

  // Preserve historical lineage fields without rewriting them
  if (article.legacyWordPressId !== undefined && article.legacyWordPressId !== null) {
    payload.legacy_wordpress_id = article.legacyWordPressId;
  }
  if (article.isImported !== undefined) {
    payload.is_imported = Boolean(article.isImported);
  }
  if (article.importBatchId) {
    payload.import_batch_id = article.importBatchId;
  }
  if (article.legacyAuthorName) {
    payload.legacy_author_name = article.legacyAuthorName;
  }
  if (article.authorAttribution) {
    payload.author_attribution = article.authorAttribution;
  }

  if (authorId) {
    payload.author_id = authorId;
  }

  return payload;
}

// In-memory cache for public read queries
const publicCache = new Map();
// In-flight promises map for request deduplication
const inFlightRequests = new Map();

// Default TTLs (in milliseconds)
export const CACHE_TTL = {
  ARTICLES_FEED: 2 * 60 * 1000,       // 2 minutes for home feeds and categories
  ARTICLE_DETAIL: 5 * 60 * 1000,      // 5 minutes for single article reading
  RELATED_ARTICLES: 5 * 60 * 1000,    // 5 minutes for adjacent & related
  SEARCH: 60 * 1000,                  // 1 minute for search queries
};

/**
 * Execute a query with in-flight deduplication and short-lived caching.
 * If another caller asks for the identical query while it's in flight, both receive the exact same promise.
 * Subsequent calls within TTL return from memory instantaneously (0ms network time).
 */
async function fetchWithCache(key, ttlMs, fetchFn) {
  const now = Date.now();
  const cached = publicCache.get(key);
  if (cached && (now - cached.timestamp < cached.ttl)) {
    return cached.data;
  }

  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  const promise = (async () => {
    try {
      const data = await fetchFn();
      if (data && !data.error) {
        publicCache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
      }
      return data;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

/**
 * Core Articles Service
 */
export const ARTICLE_SUMMARY_SELECT = `
  id,
  legacy_wordpress_id,
  legacy_author_name,
  author_attribution,
  is_imported,
  import_batch_id,
  title,
  slug,
  excerpt,
  language,
  status,
  is_breaking,
  is_featured,
  is_trending,
  youtube_url,
  video_duration,
  read_time,
  views_count,
  location,
  published_at,
  scheduled_at,
  created_at,
  updated_at,
  author:profiles(id, display_name, display_name_hindi, avatar_url, desk, role),
  featured_media:media(id, public_url, caption, credit, alt_text),
  article_categories(is_primary, categories(id, slug, name, english_name)),
  article_tags(tags(id, name, slug))
`;

export const ARTICLE_DETAIL_SELECT = `
  id,
  legacy_wordpress_id,
  legacy_author_name,
  author_attribution,
  is_imported,
  import_batch_id,
  title,
  slug,
  excerpt,
  content_json,
  original_html,
  language,
  status,
  is_breaking,
  is_featured,
  is_trending,
  youtube_url,
  video_duration,
  read_time,
  views_count,
  location,
  seo_title,
  seo_description,
  canonical_url,
  published_at,
  scheduled_at,
  created_at,
  updated_at,
  author:profiles(id, display_name, display_name_hindi, avatar_url, desk, role),
  featured_media:media(id, public_url, caption, credit, alt_text),
  article_categories(is_primary, categories(id, slug, name, english_name)),
  article_tags(tags(id, name, slug))
`;

export const articlesService = {
  /**
   * Invalidate public cache entries. If pattern is provided, invalidates matching keys;
   * otherwise flushes the entire public cache.
   */
  clearCache(pattern = null) {
    if (!pattern) {
      publicCache.clear();
      return;
    }
    for (const key of publicCache.keys()) {
      if (key.includes(pattern)) {
        publicCache.delete(key);
      }
    }
  },

  /**
   * Fetch lightweight news article summaries for Public Portal (homepage, widgets, cards).
   * Does NOT download full TipTap AST or HTML bodies.
   */
  async getArticles(params = {}) {
    if (!isSupabaseConfigured) {
      return this._getMockArticles(params);
    }

    const cacheKey = `articles_feed_${JSON.stringify(params)}`;
    return fetchWithCache(cacheKey, CACHE_TTL.ARTICLES_FEED, async () => {
      try {
        const selectFields = params.includeBody ? ARTICLE_DETAIL_SELECT : ARTICLE_SUMMARY_SELECT;
        let query = supabase
          .from('articles')
          .select(selectFields)
          .eq('status', ARTICLE_STATUS.PUBLISHED)
          .lte('published_at', new Date().toISOString())
          .order('published_at', { ascending: false });

        if (params.isBreaking !== undefined) {
          query = query.eq('is_breaking', params.isBreaking);
        }
        if (params.isFeatured !== undefined) {
          query = query.eq('is_featured', params.isFeatured);
        }
        if (params.isTrending !== undefined) {
          query = query.eq('is_trending', params.isTrending);
        }
        if (params.onlyVideos) {
          query = query.not('youtube_url', 'is', null).neq('youtube_url', '');
        }
        if (params.limit) {
          query = query.limit(params.limit);
        }

        const { data, error } = await query;

        if (error) {
          console.warn('[articlesService] Supabase getArticles fallback:', error.message);
          return this._getMockArticles(params);
        }

        const adapted = (data || []).map(adaptSupabaseArticleToFrontend);

        // In-memory category filter if specifically requested on the global set
        if (params.category && params.category !== 'latest') {
          const filtered = adapted.filter((item) =>
            item.category === params.category ||
            (item.categories && item.categories.some((c) => c.slug === params.category))
          );
          return { data: filtered, total: filtered.length };
        }

        return {
          data: adapted,
          total: adapted.length,
        };
      } catch (err) {
        console.warn('[articlesService] Unexpected error, using mock:', err);
        return this._getMockArticles(params);
      }
    });
  },

  /**
   * Fetch articles by category with real database pagination and accurate total count.
   * Efficiently handles categories with thousands of records (e.g. Kanpur with 8,528 articles).
   * count: 'exact' is only executed when includeCount: true is requested (e.g. on full category pages).
   */
  async getArticlesByCategory(categorySlug, params = {}) {
    if (!isSupabaseConfigured) {
      const mockList = (mockNews || []).filter(
        (item) => item.category === categorySlug || categorySlug === 'latest'
      );
      return { data: mockList, total: mockList.length, page: 1, pageSize: 12, totalPages: 1 };
    }

    const cacheKey = `cat_${categorySlug || 'latest'}_${JSON.stringify(params)}`;
    return fetchWithCache(cacheKey, CACHE_TTL.ARTICLES_FEED, async () => {
      try {
        const page = Math.max(1, parseInt(params.page || 1, 10));
        const pageSize = Math.max(1, parseInt(params.pageSize || 12, 10));
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        const includeCount = params.includeCount !== false;
        const countOpt = includeCount ? { count: 'exact' } : undefined;

        // Handle 'latest' pseudo-category: all published articles reverse chronological
        if (!categorySlug || categorySlug === 'latest') {
          let query = supabase
            .from('articles')
            .select(ARTICLE_SUMMARY_SELECT, countOpt)
            .eq('status', ARTICLE_STATUS.PUBLISHED)
            .lte('published_at', new Date().toISOString());

          if (params.language && params.language !== 'all') {
            query = query.eq('language', params.language);
          }

          if (params.sortBy === 'views' || params.sortBy === 'popular') {
            query = query.order('views_count', { ascending: false }).order('id', { ascending: false });
          } else if (params.sortBy === 'oldest') {
            query = query.order('published_at', { ascending: true }).order('id', { ascending: true });
          } else {
            query = query.order('published_at', { ascending: false }).order('id', { ascending: false });
          }

          query = query.range(from, to);

          const { data, count, error } = await query;
          if (error) throw error;

          const adapted = (data || []).map(adaptSupabaseArticleToFrontend);
          const total = count != null ? count : (adapted ? adapted.length : 0);
          return {
            data: adapted,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize) || 1,
            isTopicFallback: false,
            matchingRule: null,
          };
        }

        // Query real categories via article_categories join
        let query = supabase
          .from('articles')
          .select(`
            id,
            legacy_wordpress_id,
            legacy_author_name,
            author_attribution,
            is_imported,
            import_batch_id,
            title,
            slug,
            excerpt,
            language,
            status,
            is_breaking,
            is_featured,
            is_trending,
            youtube_url,
            video_duration,
            read_time,
            views_count,
            location,
            published_at,
            scheduled_at,
            created_at,
            updated_at,
            author:profiles(id, display_name, display_name_hindi, avatar_url, desk, role),
            featured_media:media(id, public_url, caption, credit, alt_text),
            article_categories!inner(category_id, is_primary, categories!inner(id, slug, name, english_name)),
            article_tags(tags(id, name, slug))
          `, countOpt)
          .eq('status', ARTICLE_STATUS.PUBLISHED)
          .lte('published_at', new Date().toISOString())
          .eq('article_categories.categories.slug', categorySlug);

        if (params.language && params.language !== 'all') {
          query = query.eq('language', params.language);
        }

        if (params.sortBy === 'views' || params.sortBy === 'popular') {
          query = query.order('views_count', { ascending: false }).order('id', { ascending: false });
        } else if (params.sortBy === 'oldest') {
          query = query.order('published_at', { ascending: true }).order('id', { ascending: true });
        } else {
          query = query.order('published_at', { ascending: false }).order('id', { ascending: false });
        }

        query = query.range(from, to);

        const { data, count, error } = await query;
        if (error) throw error;

        let finalData = data || [];
        let total = count != null ? count : (finalData ? finalData.length : 0);
        let isTopicFallback = false;
        let matchingRule = null;

        // Historical Archive Topic Fallback:
        // If direct article_categories join has 0 records (e.g. WordPress archive lacked separate business/politics tags),
        // query historical articles by editorial headline keywords so readers see authentic published stories.
        if (finalData.length === 0 && (categorySlug === 'business' || categorySlug === 'politics')) {
          let topicFilter = '';
          if (categorySlug === 'business') {
            topicFilter = 'title.ilike.%व्यापार%,title.ilike.%कारोबार%,title.ilike.%बाजार%,title.ilike.%उद्योग%';
            matchingRule = 'संपादकीय शीर्षक कीवर्ड मिलान (व्यापार, कारोबार, बाजार, उद्योग)';
          } else if (categorySlug === 'politics') {
            topicFilter = 'title.ilike.%चुनाव%,title.ilike.%भाजपा%,title.ilike.%सपा%,title.ilike.%कांग्रेस%,title.ilike.%राजनीति%';
            matchingRule = 'संपादकीय शीर्षक कीवर्ड मिलान (चुनाव, राजनीति, भाजपा, सपा, कांग्रेस)';
          }

          if (topicFilter) {
            let fbQuery = supabase
              .from('articles')
              .select(ARTICLE_SUMMARY_SELECT, countOpt)
              .eq('status', ARTICLE_STATUS.PUBLISHED)
              .lte('published_at', new Date().toISOString())
              .or(topicFilter);

            if (params.sortBy === 'views' || params.sortBy === 'popular') {
              fbQuery = fbQuery.order('views_count', { ascending: false }).order('id', { ascending: false });
            } else if (params.sortBy === 'oldest') {
              fbQuery = fbQuery.order('published_at', { ascending: true }).order('id', { ascending: true });
            } else {
              fbQuery = fbQuery.order('published_at', { ascending: false }).order('id', { ascending: false });
            }

            fbQuery = fbQuery.range(from, to);

            const { data: fbData, count: fbCount, error: fbErr } = await fbQuery;
            if (!fbErr && fbData && fbData.length > 0) {
              finalData = fbData;
              total = fbCount != null ? fbCount : fbData.length;
              isTopicFallback = true;
            }
          }
        }

        const adapted = finalData.map(adaptSupabaseArticleToFrontend);
        return {
          data: adapted,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
          isTopicFallback,
          matchingRule,
        };
      } catch (err) {
        console.warn('[articlesService] getArticlesByCategory error:', err.message);
        return { data: [], total: 0, page: 1, pageSize: 12, totalPages: 1, error: err.message };
      }
    });
  },

  /**
   * Fetch articles for a specific regional city (Lucknow, Ayodhya, Varanasi, Prayagraj, Gorakhpur, Kanpur).
   * Queries title, excerpt, and location with genuine published constraints and server-side pagination.
   */
  async getArticlesByCity(cityKey, params = {}) {
    if (!isSupabaseConfigured) {
      return { data: [], total: 0, page: 1, pageSize: 12, totalPages: 1 };
    }

    const cacheKey = `city_${cityKey}_${JSON.stringify(params)}`;
    return fetchWithCache(cacheKey, CACHE_TTL.ARTICLES_FEED, async () => {
      const cityAliasMap = {
        lucknow: ['lucknow', 'लखनऊ'],
        ayodhya: ['ayodhya', 'अयोध्या', 'फैजाबाद'],
        varanasi: ['varanasi', 'वाराणसी', 'काशी', 'बनारस'],
        kanpur: ['kanpur', 'कानपुर', 'कानपुर नगर', 'कानपुर देहात'],
        'kanpur-nagar': ['कानपुर नगर', 'kanpur nagar'],
        'kanpur-dehat': ['कानपुर देहात', 'kanpur dehat', 'अकबरपुर'],
        prayagraj: ['prayagraj', 'प्रयागराज', 'इलाहाबाद', 'allahabad'],
        gorakhpur: ['gorakhpur', 'गोरखपुर'],
      };

      const aliases = cityAliasMap[cityKey] || [cityKey];
      const page = Math.max(1, parseInt(params.page || 1, 10));
      const pageSize = Math.max(1, parseInt(params.pageSize || params.limit || 12, 10));
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const includeCount = params.includeCount !== false;
      const countOpt = includeCount ? { count: 'exact' } : undefined;

      try {
        const orCondition = aliases
          .map((a) => `title.ilike.%${a}%,excerpt.ilike.%${a}%,location.ilike.%${a}%`)
          .join(',');

        let query = supabase
          .from('articles')
          .select(ARTICLE_SUMMARY_SELECT, countOpt)
          .eq('status', ARTICLE_STATUS.PUBLISHED)
          .lte('published_at', new Date().toISOString())
          .or(orCondition);

        if (params.language && params.language !== 'all') {
          query = query.eq('language', params.language);
        }

        if (params.sortBy === 'views' || params.sortBy === 'popular') {
          query = query.order('views_count', { ascending: false }).order('id', { ascending: false });
        } else if (params.sortBy === 'oldest') {
          query = query.order('published_at', { ascending: true }).order('id', { ascending: true });
        } else {
          query = query.order('published_at', { ascending: false }).order('id', { ascending: false });
        }

        query = query.range(from, to);

        const { data, count, error } = await query;
        if (error) throw error;

        const total = count != null ? count : (data ? data.length : 0);
        return {
          data: (data || []).map(adaptSupabaseArticleToFrontend),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
        };
      } catch (err) {
        console.warn(`[articlesService] getArticlesByCity(${cityKey}) error:`, err.message);
        return { data: [], total: 0, page, pageSize, totalPages: 1, error: err.message };
      }
    });
  },

  /**
   * Fetch genuine published articles with uploaded featured media for the Photo Gallery showcase.
   */
  async getArticlesWithMedia(params = {}) {
    if (!isSupabaseConfigured) {
      return { data: [], total: 0 };
    }

    const cacheKey = `media_articles_${JSON.stringify(params)}`;
    return fetchWithCache(cacheKey, CACHE_TTL.ARTICLES_FEED, async () => {
      const limit = Math.max(1, parseInt(params.limit || 4, 10));

      try {
        const { data, error } = await supabase
          .from('articles')
          .select(ARTICLE_SUMMARY_SELECT)
          .eq('status', ARTICLE_STATUS.PUBLISHED)
          .lte('published_at', new Date().toISOString())
          .not('featured_media_id', 'is', null)
          .order('published_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        return {
          data: (data || []).map(adaptSupabaseArticleToFrontend),
          total: data ? data.length : 0,
        };
      } catch (err) {
        console.warn('[articlesService] getArticlesWithMedia error:', err.message);
        return { data: [], total: 0, error: err.message };
      }
    });
  },

  /**
   * Search published articles across the entire historical archive (10,654+ records).
   * Supports Hindi Unicode and multi-field matching on title & excerpt with server-side pagination.
   */
  async searchArticles(queryStr, params = {}) {
    if (!isSupabaseConfigured) {
      return this._mockSearch(queryStr, params);
    }

    const cacheKey = `search_${(queryStr || '').trim().toLowerCase()}_${JSON.stringify(params)}`;
    return fetchWithCache(cacheKey, CACHE_TTL.SEARCH, async () => {
      try {
      const page = Math.max(1, parseInt(params.page || 1, 10));
      const pageSize = Math.max(1, parseInt(params.pageSize || 12, 10));
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const trimmed = (queryStr || '').trim();

      let query;
      const hasCategory = params.category && params.category !== 'all';

      if (hasCategory) {
        query = supabase
          .from('articles')
          .select(`
            id,
            legacy_wordpress_id,
            legacy_author_name,
            author_attribution,
            is_imported,
            import_batch_id,
            title,
            slug,
            excerpt,
            language,
            status,
            is_breaking,
            is_featured,
            is_trending,
            youtube_url,
            video_duration,
            read_time,
            views_count,
            location,
            published_at,
            scheduled_at,
            created_at,
            updated_at,
            author:profiles(id, display_name, display_name_hindi, avatar_url, desk, role),
            featured_media:media(id, public_url, caption, credit, alt_text),
            article_categories!inner(category_id, is_primary, categories!inner(id, slug, name, english_name)),
            article_tags(tags(id, name, slug))
          `, { count: 'exact' })
          .eq('status', ARTICLE_STATUS.PUBLISHED)
          .lte('published_at', new Date().toISOString())
          .eq('article_categories.categories.slug', params.category);
      } else {
        query = supabase
          .from('articles')
          .select(ARTICLE_SUMMARY_SELECT, { count: 'exact' })
          .eq('status', ARTICLE_STATUS.PUBLISHED)
          .lte('published_at', new Date().toISOString());
      }

      // Safe, bilingual search supporting both Devanagari Hindi and English keywords
      if (trimmed) {
        const lower = trimmed.toLowerCase();
        const bilingualEquivalents = {
          police: 'पुलिस',
          kanpur: 'कानपुर',
          lucknow: 'लखनऊ',
          ayodhya: 'अयोध्या',
          varanasi: 'वाराणसी',
          banaras: 'बनारस',
          kashi: 'काशी',
          prayagraj: 'प्रयागराज',
          allahabad: 'इलाहाबाद',
          gorakhpur: 'गोरखपुर',
          up: 'उत्तर प्रदेश',
          uttarpradesh: 'उत्तर प्रदेश',
          crime: 'अपराध',
          election: 'चुनाव',
          bjp: 'भाजपा',
          congress: 'कांग्रेस',
          sp: 'सपा',
          bsp: 'बसपा',
          railway: 'रेलवे',
          metro: 'मेट्रो',
          hospital: 'अस्पताल',
          weather: 'मौसम',
          budget: 'बजट',
          student: 'छात्र',
          school: 'स्कूल',
          court: 'कोर्ट',
          cm: 'मुख्यमंत्री',
          pm: 'प्रधानमंत्री',
          yogi: 'योगी',
          modi: 'मोदी',
        };

        const hindiEquiv = bilingualEquivalents[lower];
        const orClauses = [
          `title.ilike.%${trimmed}%`,
          `excerpt.ilike.%${trimmed}%`,
          `location.ilike.%${trimmed}%`,
        ];
        if (hindiEquiv) {
          orClauses.push(
            `title.ilike.%${hindiEquiv}%`,
            `excerpt.ilike.%${hindiEquiv}%`,
            `location.ilike.%${hindiEquiv}%`
          );
        }
        query = query.or(orClauses.join(','));
      }

      // Content type filtering (photo / video / all)
      if (params.contentType === 'video') {
        query = query.not('youtube_url', 'is', null).neq('youtube_url', '');
      } else if (params.contentType === 'photo') {
        query = query.not('featured_media_id', 'is', null);
      }

      if (params.language && params.language !== 'all') {
        query = query.eq('language', params.language);
      }

      // Date range filtering
      if (params.dateRange && params.dateRange !== 'all') {
        const now = new Date();
        if (params.dateRange === 'today') {
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
          query = query.gte('published_at', startOfDay);
        } else if (params.dateRange === 'week') {
          const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte('published_at', startOfWeek);
        } else if (params.dateRange === 'month') {
          const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte('published_at', startOfMonth);
        } else if (params.dateRange === 'year') {
          const startOfYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte('published_at', startOfYear);
        }
      }

      if (params.customFrom) {
        query = query.gte('published_at', new Date(params.customFrom).toISOString());
      }
      if (params.customTo) {
        query = query.lte('published_at', new Date(params.customTo).toISOString());
      }

      // Sort with deterministic secondary tie-breaking on id descending
      if (params.sortBy === 'views') {
        query = query.order('views_count', { ascending: false }).order('id', { ascending: false });
      } else if (params.sortBy === 'oldest') {
        query = query.order('published_at', { ascending: true, nullsFirst: false }).order('id', { ascending: false });
      } else {
        query = query.order('published_at', { ascending: false, nullsFirst: false }).order('id', { ascending: false });
      }

      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      const adapted = (data || []).map(adaptSupabaseArticleToFrontend);
      const total = count || 0;
      return {
        data: adapted,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      };
    } catch (err) {
      console.warn('[articlesService] searchArticles error:', err.message);
      return { data: [], total: 0, page: 1, pageSize: 12, totalPages: 1, error: err.message };
    }
    });
  },

  /**
   * Fetch lightweight related stories for an article (same category or newest published).
   */
  async getRelatedArticles(currentArticle, limit = 4) {
    if (!currentArticle || !isSupabaseConfigured) {
      return [];
    }

    const cacheKey = `related_${currentArticle.id || currentArticle.slug}_${limit}`;
    return fetchWithCache(cacheKey, CACHE_TTL.RELATED_ARTICLES, async () => {
      try {
        const categorySlug = currentArticle.category;
        let query;

        if (categorySlug && categorySlug !== 'latest') {
          query = supabase
            .from('articles')
            .select(`
              id,
              title,
              slug,
              excerpt,
              read_time,
              published_at,
              author:profiles(id, display_name, display_name_hindi),
              featured_media:media(id, public_url, caption, credit, alt_text),
              article_categories!inner(categories!inner(slug))
            `)
            .eq('status', ARTICLE_STATUS.PUBLISHED)
            .eq('article_categories.categories.slug', categorySlug)
            .neq('id', currentArticle.id)
            .order('published_at', { ascending: false })
            .limit(limit);
        } else {
          query = supabase
            .from('articles')
            .select(ARTICLE_SUMMARY_SELECT)
            .eq('status', ARTICLE_STATUS.PUBLISHED)
            .neq('id', currentArticle.id)
            .order('published_at', { ascending: false })
            .limit(limit);
        }

        const { data, error } = await query;
        if (error || !data || data.length === 0) {
          // Fallback to newest published articles excluding current
          const { data: fallbackData } = await supabase
            .from('articles')
            .select(ARTICLE_SUMMARY_SELECT)
            .eq('status', ARTICLE_STATUS.PUBLISHED)
            .neq('id', currentArticle.id)
            .order('published_at', { ascending: false })
            .limit(limit);

          return (fallbackData || []).map(adaptSupabaseArticleToFrontend);
        }

        return data.map(adaptSupabaseArticleToFrontend);
      } catch (err) {
        console.warn('[articlesService] getRelatedArticles error:', err.message);
        return [];
      }
    });
  },

  /**
   * Fetch adjacent (previous and next) published articles for seamless reading navigation.
   * Prev: older published article (published_at < current)
   * Next: newer published article (published_at > current)
   */
  async getAdjacentArticles(currentArticle) {
    if (!currentArticle || !isSupabaseConfigured) {
      return { prev: null, next: null };
    }

    const pubDate = currentArticle.publishedAt || currentArticle.createdAt;
    if (!pubDate) return { prev: null, next: null };

    const cacheKey = `adjacent_${currentArticle.id || currentArticle.slug}`;
    return fetchWithCache(cacheKey, CACHE_TTL.RELATED_ARTICLES, async () => {
      try {
        // Previous (Older) Article
        const prevPromise = supabase
          .from('articles')
          .select(`
            id,
            title,
            slug,
            published_at,
            featured_media:media(id, public_url, alt_text),
            article_categories(is_primary, categories(id, slug, name, english_name))
          `)
          .eq('status', ARTICLE_STATUS.PUBLISHED)
          .lte('published_at', new Date().toISOString())
          .lt('published_at', pubDate)
          .order('published_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Next (Newer) Article
        const nextPromise = supabase
          .from('articles')
          .select(`
            id,
            title,
            slug,
            published_at,
            featured_media:media(id, public_url, alt_text),
            article_categories(is_primary, categories(id, slug, name, english_name))
          `)
          .eq('status', ARTICLE_STATUS.PUBLISHED)
          .lte('published_at', new Date().toISOString())
          .gt('published_at', pubDate)
          .order('published_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        const [prevRes, nextRes] = await Promise.all([prevPromise, nextPromise]);

        const formatAdjacent = (row) => {
          if (!row) return null;
          let catName = 'समाचार';
          if (Array.isArray(row.article_categories) && row.article_categories.length > 0) {
            const cat = row.article_categories[0].categories;
            if (cat) catName = cat.name || cat.english_name || catName;
          }
          return {
            id: row.id,
            title: row.title,
            slug: row.slug,
            categoryName: catName,
            publishedAt: row.published_at,
            featuredImage: row.featured_media?.public_url || '',
          };
        };

        return {
          prev: formatAdjacent(prevRes.data),
          next: formatAdjacent(nextRes.data),
        };
      } catch (err) {
        console.warn('[articlesService] getAdjacentArticles error:', err.message);
        return { prev: null, next: null };
      }
    });
  },

  /**
   * Accurate SQL COUNT queries for CMS Dashboard metrics.
   * Supports optional authorId filtering for ordinary admin personal metrics.
   */
  async getArticleCounts(authorId = null) {
    if (!isSupabaseConfigured) {
      let filtered = mockNews || [];
      if (authorId) {
        filtered = filtered.filter((a) => a.authorId === authorId || a.author?.id === authorId);
      }
      return {
        total: filtered.length,
        published: filtered.filter((a) => a.status === ARTICLE_STATUS.PUBLISHED).length,
        scheduled: filtered.filter((a) => a.status === ARTICLE_STATUS.SCHEDULED).length,
        inReview: filtered.filter((a) => a.status === ARTICLE_STATUS.IN_REVIEW).length,
        draft: filtered.filter((a) => a.status === ARTICLE_STATUS.DRAFT).length,
        breaking: filtered.filter((a) => a.isBreaking).length,
        media: 0,
        totalViews: 0,
      };
    }

    try {
      let totalQ = supabase.from('articles').select('id', { count: 'exact', head: true });
      let pubQ = supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', ARTICLE_STATUS.PUBLISHED);
      let schedQ = supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', ARTICLE_STATUS.SCHEDULED);
      let revQ = supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', ARTICLE_STATUS.IN_REVIEW);
      let draftQ = supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', ARTICLE_STATUS.DRAFT);
      let breakingQ = supabase.from('articles').select('id', { count: 'exact', head: true }).eq('is_breaking', true);
      let mediaQ = supabase.from('media').select('id', { count: 'exact', head: true });

      if (authorId) {
        totalQ = totalQ.eq('author_id', authorId);
        pubQ = pubQ.eq('author_id', authorId);
        schedQ = schedQ.eq('author_id', authorId);
        revQ = revQ.eq('author_id', authorId);
        draftQ = draftQ.eq('author_id', authorId);
        breakingQ = breakingQ.eq('author_id', authorId);
      }

      const [
        totalRes,
        pubRes,
        schedRes,
        revRes,
        draftRes,
        breakingRes,
        mediaRes,
      ] = await Promise.all([
        totalQ,
        pubQ,
        schedQ,
        revQ,
        draftQ,
        breakingQ,
        mediaQ,
      ]);

      return {
        total: totalRes.count || 0,
        published: pubRes.count || 0,
        scheduled: schedRes.count || 0,
        inReview: revRes.count || 0,
        draft: draftRes.count || 0,
        breaking: breakingRes.count || 0,
        media: mediaRes.count || 0,
        totalViews: 0,
      };
    } catch (err) {
      console.warn('[articlesService] getArticleCounts error:', err.message);
      return { total: 0, published: 0, scheduled: 0, inReview: 0, draft: 0, breaking: 0, media: 0, totalViews: 0 };
    }
  },

  /**
   * Fetch lightweight recently updated articles for Dashboard.
   * Only selects summary metadata, zero heavy TipTap content bodies.
   * Supports optional authorId filtering for ordinary admin.
   */
  async getRecentArticles(limit = 6, authorId = null) {
    if (!isSupabaseConfigured) {
      let filtered = mockNews || [];
      if (authorId) {
        filtered = filtered.filter((a) => a.authorId === authorId || a.author?.id === authorId);
      }
      return filtered.slice(0, limit);
    }
    try {
      let query = supabase
        .from('articles')
        .select(ARTICLE_SUMMARY_SELECT);

      if (authorId) {
        query = query.eq('author_id', authorId);
      }

      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map(adaptSupabaseArticleToFrontend);
    } catch (err) {
      console.warn('[articlesService] getRecentArticles error:', err.message);
      return (mockNews || []).slice(0, limit);
    }
  },

  /**
   * Fetch articles for Admin CMS with server-side pagination, search, status and category filtering.
   * Does NOT download heavy article content bodies for table listings.
   */
  async getAdminArticles(params = {}) {
    if (!isSupabaseConfigured) {
      return this._getMockArticles(params);
    }

    try {
      const page = Math.max(1, parseInt(params.page || 1, 10));
      const pageSize = Math.max(1, parseInt(params.pageSize || 20, 10));
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query;
      const hasCategory = params.category && params.category !== 'all';

      if (hasCategory) {
        query = supabase
          .from('articles')
          .select(`
            id,
            legacy_wordpress_id,
            legacy_author_name,
            author_attribution,
            is_imported,
            import_batch_id,
            title,
            slug,
            excerpt,
            language,
            status,
            is_breaking,
            is_featured,
            is_trending,
            youtube_url,
            video_duration,
            read_time,
            views_count,
            location,
            published_at,
            scheduled_at,
            created_at,
            updated_at,
            author:profiles(id, display_name, display_name_hindi, avatar_url, desk, role),
            featured_media:media(id, public_url, caption, credit, alt_text),
            article_categories!inner(category_id, is_primary, categories!inner(id, slug, name, english_name)),
            article_tags(tags(id, name, slug))
          `, { count: 'exact' })
          .eq('article_categories.categories.slug', params.category);
      } else {
        query = supabase
          .from('articles')
          .select(ARTICLE_SUMMARY_SELECT, { count: 'exact' });
      }

      // Filter by author_id (for ordinary admin ownership enforcement)
      if (params.authorId) {
        query = query.eq('author_id', params.authorId);
      }

      // Filter by status
      if (params.status && params.status !== 'all') {
        query = query.eq('status', normalizeStatus(params.status));
      }

      // Filter by language
      if (params.language && params.language !== 'all') {
        query = query.eq('language', params.language);
      }

      // Keyword search across title, slug, excerpt
      if (params.search && params.search.trim()) {
        const q = params.search.trim();
        query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%,excerpt.ilike.%${q}%`);
      }

      // Order
      if (params.sortBy === 'created_desc') {
        query = query.order('created_at', { ascending: false });
      } else if (params.sortBy === 'published_desc') {
        query = query.order('published_at', { ascending: false, nullsFirst: false });
      } else if (params.sortBy === 'views_desc') {
        query = query.order('views_count', { ascending: false });
      } else {
        query = query.order('updated_at', { ascending: false });
      }

      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        console.warn('[articlesService] getAdminArticles error:', error.message);
        return { data: [], total: 0, error: error.message };
      }

      const adapted = (data || []).map(adaptSupabaseArticleToFrontend);
      const total = count || 0;

      return {
        data: adapted,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      };
    } catch (err) {
      console.warn('[articlesService] getAdminArticles exception:', err);
      return this._getMockArticles(params);
    }
  },

  /**
   * Fetch single article by slug with full TipTap content and SEO metadata.
   * Robust multi-format resolution: handles React Router decoded UTF-8 strings,
   * single-encoded (%e0...), double-encoded (%25e0...), uppercase/lowercase variations,
   * article UUIDs, and numeric legacy IDs.
   * Explicitly distinguishes network failure from genuine 404 (not found).
   */
  async getArticleBySlug(slug) {
    if (!slug) {
      return { data: null, error: null };
    }

    if (!isSupabaseConfigured) {
      const mock = getMockArticleBySlug(slug);
      return { data: mock || null, error: null };
    }

    const trimmed = String(slug).trim();
    const cacheKey = `slug_${trimmed.toLowerCase()}`;
    return fetchWithCache(cacheKey, CACHE_TTL.ARTICLE_DETAIL, async () => {
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
        const isNumeric = /^\d+$/.test(trimmed);

        // Fast check for UUID or numeric legacy ID
        if (isUUID || isNumeric) {
          let idQuery = supabase.from('articles').select(ARTICLE_DETAIL_SELECT);
          if (isUUID) {
            idQuery = idQuery.eq('id', trimmed);
          } else {
            idQuery = idQuery.eq('legacy_wordpress_id', trimmed);
          }
          const { data: idData, error: idError } = await idQuery.maybeSingle();
          if (idData) {
            return { data: adaptSupabaseArticleToFrontend(idData), error: null };
          }
          if (idError) {
            console.warn('[articlesService] getArticleBySlug id lookup error:', idError.message);
          }
        }

        // Generate all candidate slug variations (handles React Router UTF-8 decoding, single/double percent encoding)
        const candidates = generateSlugCandidates(trimmed);

        // Primary batch query using .in('slug', candidates)
        const { data, error } = await supabase
          .from('articles')
          .select(ARTICLE_DETAIL_SELECT)
          .in('slug', candidates)
          .limit(1);

        if (error) {
          console.warn('[articlesService] getArticleBySlug error:', error.message);
          return { data: null, error: error.message };
        }

        if (data && data.length > 0) {
          return { data: adaptSupabaseArticleToFrontend(data[0]), error: null };
        }

        // Secondary fallback: case-insensitive match on candidate stems
        if (candidates.length > 0) {
          const primaryCandidate = candidates[0];
          const { data: fallbackData } = await supabase
            .from('articles')
            .select(ARTICLE_DETAIL_SELECT)
            .ilike('slug', primaryCandidate)
            .limit(1);

          if (fallbackData && fallbackData.length > 0) {
            return { data: adaptSupabaseArticleToFrontend(fallbackData[0]), error: null };
          }
        }

        return { data: null, error: null };
      } catch (err) {
        console.warn('[articlesService] Failed to fetch article by slug:', err);
        return { data: null, error: err.message };
      }
    });
  },

  /**
   * Fetch single article by ID (UUID, numeric legacy ID, or slug) with full content.
   */
  async getArticleById(id) {
    if (!id) return null;
    if (!isSupabaseConfigured) {
      return getMockArticleById(id);
    }

    try {
      const trimmed = String(id).trim();
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);

      if (isUUID) {
        const { data, error } = await supabase
          .from('articles')
          .select(ARTICLE_DETAIL_SELECT)
          .eq('id', trimmed)
          .maybeSingle();

        if (error || !data) return null;
        return adaptSupabaseArticleToFrontend(data);
      }

      const isNumeric = /^\d+$/.test(trimmed);
      if (isNumeric) {
        const { data } = await supabase
          .from('articles')
          .select(ARTICLE_DETAIL_SELECT)
          .eq('legacy_wordpress_id', trimmed)
          .maybeSingle();

        if (data) return adaptSupabaseArticleToFrontend(data);
      }

      // If id is a slug or partial slug, resolve via getArticleBySlug
      const slugRes = await this.getArticleBySlug(trimmed);
      return slugRes?.data || null;
    } catch (err) {
      console.warn('[articlesService] getArticleById fallback:', err);
      return null;
    }
  },

  /**
   * Create a new article with category & tag relationships
   */
  async createArticle(articleData, authorId) {
    if (!isSupabaseConfigured) {
      const newMock = {
        ...articleData,
        id: Date.now(),
        status: normalizeStatus(articleData.status || ARTICLE_STATUS.DRAFT),
        publishedAt: articleData.status === ARTICLE_STATUS.PUBLISHED ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
        views: 0,
      };
      mockNews.unshift(newMock);
      return { success: true, data: newMock };
    }

    try {
      // 1. Strict owner assignment: Always bind to authenticated user if session exists
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUserId = sessionData?.session?.user?.id;
      let finalAuthorId = sessionUserId || authorId;

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(finalAuthorId);
      if (!isUUID) {
        const { data: fallbackProfile } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
        finalAuthorId = fallbackProfile?.id || 'a27adb86-43fd-4687-9763-74b43cff5e04';
      }

      // 2. Prepare payload
      const payload = adaptFrontendArticleToSupabase(articleData, finalAuthorId);
      if (!payload.featured_media_id && articleData.featuredImage) {
        payload.featured_media_id = await this._resolveFeaturedMediaId(articleData, finalAuthorId);
      }

      // 3. Ensure slug uniqueness
      let candidateSlug = payload.slug;
      const { data: existingSlug } = await supabase
        .from('articles')
        .select('id')
        .eq('slug', candidateSlug)
        .maybeSingle();

      if (existingSlug) {
        candidateSlug = `${candidateSlug}-${Date.now().toString().slice(-4)}`;
        payload.slug = candidateSlug;
      }

      // 4. Insert into articles table
      const { data: inserted, error: insertError } = await supabase
        .from('articles')
        .insert(payload)
        .select()
        .single();

      if (insertError) throw insertError;

      const newArticleId = inserted.id;

      // 5. Associate Categories in article_categories
      await this._syncArticleCategories(newArticleId, articleData.category, articleData.categories);

      // 6. Associate Tags in article_tags
      if (Array.isArray(articleData.tags) && articleData.tags.length > 0) {
        await this._syncArticleTags(newArticleId, articleData.tags);
      }

      // 7. Log editorial activity
      await this._logEditorialActivity(newArticleId, finalAuthorId, 'created', {
        title: inserted.title,
        status: inserted.status,
      });

      // 8. Fetch complete populated record
      const full = await this.getArticleById(newArticleId);
      this.clearCache();
      return { success: true, data: full };
    } catch (err) {
      console.error('[articlesService] createArticle error:', err);
      return { success: false, error: err.message || 'समाचार सहेजने में त्रुटि' };
    }
  },

  /**
   * Update existing article by ID
   */
  async updateArticle(id, updates, authorId) {
    if (!isSupabaseConfigured) {
      const idx = mockNews.findIndex((a) => String(a.id) === String(id) || Number(a.id) === Number(id));
      if (idx !== -1) {
        mockNews[idx] = { ...mockNews[idx], ...updates, updatedAt: new Date().toISOString() };
        return { success: true, data: mockNews[idx] };
      }
      return { success: false, error: 'Article not found' };
    }

    try {
      const isPartial = updates.title === undefined && updates.content === undefined;
      const payload = adaptFrontendArticleToSupabase(updates, authorId, { isPartial });
      payload.updated_at = new Date().toISOString();

      // Enforce immutability of article ownership and migration flags
      delete payload.author_id;
      delete payload.legacy_wordpress_id;
      delete payload.is_imported;
      delete payload.import_batch_id;

      if (!payload.featured_media_id && updates.featuredImage) {
        payload.featured_media_id = await this._resolveFeaturedMediaId(updates, authorId);
      } else if (updates.featuredImage === '' || updates.featuredMediaId === null) {
        payload.featured_media_id = null;
      }

      const { data: updated, error: updateError } = await supabase
        .from('articles')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Sync categories if provided
      if (updates.category || updates.categories) {
        await this._syncArticleCategories(id, updates.category, updates.categories);
      }

      // Sync tags if provided
      if (Array.isArray(updates.tags)) {
        await this._syncArticleTags(id, updates.tags);
      }

      // Save revision
      try {
        await supabase.from('article_revisions').insert({
          article_id: id,
          revision_number: Date.now(),
          title: updated.title,
          excerpt: updated.excerpt,
          content_json: updated.content_json,
          status: updated.status,
          changed_by: authorId || null,
          change_summary: `Updated: status=${updated.status}`,
        });
      } catch (revErr) {
        // Revision failure does not block the save
      }

      // Log editorial activity on status transitions or significant edits
      await this._logEditorialActivity(id, authorId, updated.status, {
        title: updated.title,
        slug: updated.slug,
        status: updated.status,
        published_at: updated.published_at,
        scheduled_at: updated.scheduled_at,
      });

      const full = await this.getArticleById(id);
      this.clearCache();
      return { success: true, data: full };
    } catch (err) {
      console.error('[articlesService] updateArticle error:', err);
      return { success: false, error: err.message || 'समाचार अद्यतन में त्रुटि' };
    }
  },

  /**
   * Fetch all scheduled articles from Supabase ordered by scheduled_at ascending.
   * Supports optional authorId filtering for ordinary admin.
   */
  async getScheduledArticles(authorId = null) {
    if (!isSupabaseConfigured) {
      let filtered = mockNews.filter((a) => normalizeStatus(a.status) === ARTICLE_STATUS.SCHEDULED);
      if (authorId) {
        filtered = filtered.filter((a) => a.authorId === authorId || a.author?.id === authorId);
      }
      return filtered;
    }

    try {
      let query = supabase
        .from('articles')
        .select(ARTICLE_SUMMARY_SELECT)
        .eq('status', ARTICLE_STATUS.SCHEDULED);

      if (authorId) {
        query = query.eq('author_id', authorId);
      }

      const { data, error } = await query
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(adaptSupabaseArticleToFrontend);
    } catch (err) {
      console.warn('[articlesService] getScheduledArticles error:', err);
      return [];
    }
  },

  /**
   * Change status of single article (e.g. Draft -> In Review -> Published)
   */
  async changeArticleStatus(id, newStatus, extraFields = {}, userId = null) {
    const normalized = normalizeStatus(newStatus);
    const updates = {
      status: normalized,
      ...extraFields,
    };

    if (normalized === ARTICLE_STATUS.PUBLISHED) {
      updates.publishedAt = extraFields.publishedAt || new Date().toISOString();
      updates.scheduledAt = null;
      updates.scheduledFor = null;
    } else if (normalized === ARTICLE_STATUS.SCHEDULED) {
      updates.scheduledAt = extraFields.scheduledAt || extraFields.scheduledFor || null;
      updates.scheduledFor = extraFields.scheduledAt || extraFields.scheduledFor || null;
    } else if (normalized === ARTICLE_STATUS.DRAFT) {
      updates.scheduledAt = null;
      updates.scheduledFor = null;
    }

    return this.updateArticle(id, updates, userId);
  },

  /**
   * Delete single article by ID
   */
  async deleteArticle(id, userId = null) {
    if (!isSupabaseConfigured) {
      const idx = mockNews.findIndex((a) => String(a.id) === String(id) || Number(a.id) === Number(id));
      if (idx !== -1) {
        mockNews.splice(idx, 1);
        this.clearCache();
        return { success: true };
      }
      return { success: false, error: 'Article not found' };
    }

    try {
      // 1. Audit log deletion before removing row
      let actorId = userId;
      if (!actorId) {
        const { data: sessionData } = await supabase.auth.getSession();
        actorId = sessionData?.session?.user?.id;
      }
      try {
        await this._logEditorialActivity(id, actorId, 'deleted', {
          deleted_article_id: id,
          deleted_at: new Date().toISOString(),
        });
      } catch (logErr) {
        console.warn('[articlesService] delete audit log error:', logErr.message);
      }

      const { error } = await supabase.from('articles').delete().eq('id', id);
      if (error) throw error;
      this.clearCache();
      return { success: true };
    } catch (err) {
      console.error('[articlesService] deleteArticle error:', err);
      return { success: false, error: err.message || 'समाचार हटाने में त्रुटि' };
    }
  },

  /**
   * Bulk change status
   */
  async bulkChangeStatus(ids = [], newStatus, userId = null) {
    const normalized = normalizeStatus(newStatus);
    const results = await Promise.all(
      ids.map((id) => this.changeArticleStatus(id, normalized, {}, userId))
    );
    const hasError = results.some((r) => !r.success);
    return { success: !hasError };
  },

  /**
   * Bulk delete articles
   */
  async bulkDeleteArticles(ids = []) {
    if (!isSupabaseConfigured) {
      ids.forEach((id) => this.deleteArticle(id));
      this.clearCache();
      return { success: true };
    }

    try {
      const { error } = await supabase.from('articles').delete().in('id', ids);
      if (error) throw error;
      this.clearCache();
      return { success: true };
    } catch (err) {
      console.error('[articlesService] bulkDeleteArticles error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Automatically publish overdue scheduled articles (scheduled_at <= NOW()).
   * Tries PostgreSQL RPC 'publish_scheduled_articles' first, with safe direct fallback.
   */
  async publishOverdueScheduledArticles() {
    if (!isSupabaseConfigured) {
      const nowMs = Date.now();
      let publishedCount = 0;
      const publishedIds = [];
      mockNews.forEach((art) => {
        if (art.status === ARTICLE_STATUS.SCHEDULED && art.scheduledAt) {
          const schedMs = new Date(art.scheduledAt).getTime();
          if (schedMs <= nowMs) {
            art.status = ARTICLE_STATUS.PUBLISHED;
            art.publishedAt = art.scheduledAt;
            art.scheduledAt = null;
            publishedCount++;
            publishedIds.push(art.id);
          }
        }
      });
      return { success: true, publishedCount, publishedIds, method: 'mock' };
    }

    // 1. Try RPC stored procedure
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('publish_scheduled_articles');
      if (!rpcError && rpcData?.success) {
        return {
          success: true,
          publishedCount: rpcData.published_count || 0,
          publishedIds: rpcData.published_ids || [],
          method: 'rpc',
        };
      }
    } catch (e) {
      // Continue to fallback
    }

    // 2. Resilient Direct Reconciliation Fallback
    try {
      const nowIso = new Date().toISOString();
      const { data: overdue, error: fetchErr } = await supabase
        .from('articles')
        .select('id, title, slug, scheduled_at')
        .eq('status', ARTICLE_STATUS.SCHEDULED)
        .lte('scheduled_at', nowIso);

      if (fetchErr) throw fetchErr;
      if (!overdue || overdue.length === 0) {
        return { success: true, publishedCount: 0, publishedIds: [], method: 'direct' };
      }

      const publishedIds = [];
      for (const item of overdue) {
        const pubTime = item.scheduled_at || nowIso;
        const { error: updErr } = await supabase
          .from('articles')
          .update({
            status: ARTICLE_STATUS.PUBLISHED,
            published_at: pubTime,
            scheduled_at: null,
            updated_at: nowIso,
          })
          .eq('id', item.id)
          .eq('status', ARTICLE_STATUS.SCHEDULED);

        if (!updErr) {
          publishedIds.push(item.id);
          await this._logEditorialActivity(
            item.id,
            null,
            'auto_publish_scheduled',
            { title: item.title, scheduled_at: item.scheduled_at, published_at: pubTime }
          ).catch(() => {});
        }
      }

      return {
        success: true,
        publishedCount: publishedIds.length,
        publishedIds,
        method: 'direct',
      };
    } catch (err) {
      console.warn('[articlesService] publishOverdueScheduledArticles error:', err);
      return { success: false, publishedCount: 0, publishedIds: [], error: err.message };
    }
  },

  /**
   * Internal Category Join Helper
   */
  async _syncArticleCategories(articleId, primaryCategorySlug, categoriesList) {
    try {
      // 1. Clear old associations
      await supabase.from('article_categories').delete().eq('article_id', articleId);

      // 2. Fetch all category UUIDs matching slugs
      const slugsToMatch = new Set();
      if (primaryCategorySlug) slugsToMatch.add(primaryCategorySlug);
      if (Array.isArray(categoriesList)) {
        categoriesList.forEach((c) => {
          const s = typeof c === 'string' ? c : c.slug;
          if (s) slugsToMatch.add(s);
        });
      }

      if (slugsToMatch.size === 0) return;

      const { data: dbCategories } = await supabase
        .from('categories')
        .select('id, slug')
        .in('slug', Array.from(slugsToMatch));

      if (!dbCategories || dbCategories.length === 0) return;

      const joinRows = dbCategories.map((c) => ({
        article_id: articleId,
        category_id: c.id,
        is_primary: c.slug === primaryCategorySlug,
      }));

      await supabase.from('article_categories').insert(joinRows);
    } catch (err) {
      console.warn('[articlesService] _syncArticleCategories notice:', err.message);
    }
  },

  /**
   * Internal Tag Join Helper
   */
  async _syncArticleTags(articleId, tagNames = []) {
    try {
      await supabase.from('article_tags').delete().eq('article_id', articleId);

      for (const rawName of tagNames) {
        const cleanName = String(rawName).trim();
        if (!cleanName) continue;
        const slug = cleanName.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]+/g, '-').replace(/^-|-$/g, '') || `tag-${Date.now()}`;

        // Upsert tag
        const { data: tagRow } = await supabase
          .from('tags')
          .upsert({ name: cleanName, slug }, { onConflict: 'slug' })
          .select('id')
          .single();

        if (tagRow) {
          await supabase.from('article_tags').insert({
            article_id: articleId,
            tag_id: tagRow.id,
          });
        }
      }
    } catch (err) {
      console.warn('[articlesService] _syncArticleTags notice:', err.message);
    }
  },

  /**
   * Internal Editorial Activity Helper
   */
  async _logEditorialActivity(articleId, userId, action, details = {}) {
    try {
      await supabase.from('editorial_activity').insert({
        article_id: articleId,
        user_id: userId || null,
        action,
        details,
      });
    } catch (err) {
      // Non-fatal
    }
  },

  /**
   * Internal mock fallback handler
   */
  async _getMockArticles(params = {}) {
    let result = [...mockNews];

    if (params.status && params.status !== 'all') {
      result = result.filter((item) => normalizeStatus(item.status) === normalizeStatus(params.status));
    }
    if (params.category && params.category !== 'all' && params.category !== 'latest') {
      result = result.filter((item) => item.category === params.category);
    }
    if (params.language && params.language !== 'all') {
      result = result.filter((item) => (item.language || 'hi') === params.language);
    }
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.summary?.toLowerCase().includes(q) ||
          item.author?.name?.toLowerCase().includes(q) ||
          item.tags?.some((t) => t.toLowerCase().includes(q)) ||
          String(item.id).includes(q)
      );
    }
    if (params.isBreaking !== undefined) {
      result = result.filter((item) => item.isBreaking === params.isBreaking);
    }
    if (params.isFeatured !== undefined) {
      result = result.filter((item) => item.isFeatured === params.isFeatured);
    }
    if (params.isTrending !== undefined) {
      result = result.filter((item) => item.isTrending === params.isTrending);
    }
    if (params.onlyVideos) {
      result = result.filter((item) => !!item.youtubeUrl);
    }
    if (params.limit) {
      result = result.slice(0, params.limit);
    }

    return {
      data: result,
      total: result.length,
    };
  },

  /**
   * Resolve or auto-register featured media record from an image URL
   */
  async _resolveFeaturedMediaId(articleData, authorId) {
    if (articleData.featuredMediaId) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(articleData.featuredMediaId);
      if (isUUID) {
        const { data: verified } = await supabase
          .from('media')
          .select('id')
          .eq('id', articleData.featuredMediaId)
          .maybeSingle();
        if (verified?.id) return verified.id;
      }
    }

    if (!articleData.featuredImage || typeof articleData.featuredImage !== 'string') return null;

    try {
      const url = articleData.featuredImage.trim();
      if (!url) return null;

      // 1. Check if this public URL already exists in media table
      const { data: existing } = await supabase
        .from('media')
        .select('id')
        .eq('public_url', url)
        .maybeSingle();

      if (existing?.id) return existing.id;

      // 2. Register external/direct image in media table
      const filename = url.split('/').pop()?.split('?')[0] || `featured-${Date.now()}.jpg`;
      const validAuthorId = (authorId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authorId))
        ? authorId
        : null;

      const { data: inserted } = await supabase
        .from('media')
        .insert({
          original_filename: filename,
          public_url: url,
          thumbnail_url: url,
          mime_type: 'image/jpeg',
          file_size: 0,
          uploaded_by: validAuthorId,
          alt_text: articleData.imageAlt || articleData.title || null,
          caption: articleData.imageCaption || null,
          credit: articleData.imageCredit || null,
        })
        .select('id')
        .maybeSingle();

      return inserted?.id || null;
    } catch {
      return null;
    }
  },
};

export default articlesService;

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import Container from '../../components/common/Container';
import EmptyState from '../../components/common/EmptyState';
import {
  CategoryHeader,
  NewsFilters,
  Pagination,
  ArticleSidebar,
} from '../../components/news';
import SEO from '../../components/common/SEO.jsx';
import { useArticles } from '../../context/ArticleContext';
import { articlesService } from '../../services/articlesService';
import { getCategoryBySlug } from '../../data/categories';
import { Eye, Clock, Share2, Bookmark, ChevronRight, User, AlertCircle, RefreshCw, Newspaper } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRelativeTime } from '../../utils/timezoneUtils';

const CITY_CONFIGS = {
  kanpur: {
    id: 'kanpur',
    slug: 'kanpur',
    name: 'Kanpur',
    nameHindi: 'कानपुर',
    englishName: 'Kanpur',
    description: 'कानपुर नगर व देहात की ताज़ा खबरें, प्रशासनिक गतिविधियां और स्थानीय समाचार',
    color: '#c8102e',
    isCity: true,
  },
  'kanpur-nagar': {
    id: 'kanpur-nagar',
    slug: 'kanpur-nagar',
    name: 'Kanpur Nagar',
    nameHindi: 'कानपुर नगर',
    englishName: 'Kanpur Nagar',
    description: 'कानपुर नगर की ताज़ा खबरें, प्रशासनिक गतिविधियां और शहरी विकास समाचार',
    color: '#c8102e',
    isCity: true,
  },
  'kanpur-dehat': {
    id: 'kanpur-dehat',
    slug: 'kanpur-dehat',
    name: 'Kanpur Dehat',
    nameHindi: 'कानपुर देहात',
    englishName: 'Kanpur Dehat',
    description: 'कानपुर देहात, माती मुख्यालय, रसूलाबाद, पुखरायां व अकबरपुर की स्थानीय खबरें',
    color: '#c8102e',
    isCity: true,
  },
  lucknow: {
    id: 'lucknow',
    slug: 'lucknow',
    name: 'Lucknow',
    nameHindi: 'लखनऊ',
    englishName: 'Lucknow',
    description: 'राजधानी लखनऊ की ताज़ा खबरें, शासन, सचिवालय, विधानसभा और स्थानीय घटनाक्रम',
    color: '#DA251D',
    isCity: true,
  },
  ayodhya: {
    id: 'ayodhya',
    slug: 'ayodhya',
    name: 'Ayodhya',
    nameHindi: 'अयोध्या',
    englishName: 'Ayodhya',
    description: 'श्री रामनगरी अयोध्या, फैजाबाद की खबरें, विकास कार्य और धर्म-संस्कृति',
    color: '#e27802',
    isCity: true,
  },
  varanasi: {
    id: 'varanasi',
    slug: 'varanasi',
    name: 'Varanasi',
    nameHindi: 'वाराणसी',
    englishName: 'Varanasi',
    description: 'काशी-वाराणसी, बाबा विश्वनाथ धाम, गंगा घाट और पूर्वांचल की ताज़ा खबरें',
    color: '#c06c84',
    isCity: true,
  },
  prayagraj: {
    id: 'prayagraj',
    slug: 'prayagraj',
    name: 'Prayagraj',
    nameHindi: 'प्रयागराज',
    englishName: 'Prayagraj',
    description: 'संगमनगरी प्रयागराज, हाईकोर्ट, विश्वविद्यालय और कुंभ क्षेत्र की प्रमुख खबरें',
    color: '#10264B',
    isCity: true,
  },
  gorakhpur: {
    id: 'gorakhpur',
    slug: 'gorakhpur',
    name: 'Gorakhpur',
    nameHindi: 'गोरखपुर',
    englishName: 'Gorakhpur',
    description: 'गोरखपुर, गोरखनाथ पीठ, एम्स और पूर्वी उत्तर प्रदेश की ताज़ा हलचल',
    color: '#2b580c',
    isCity: true,
  },
};

function CategoryLoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" aria-label="सामग्री लोड हो रही है">
      {/* Lead Skeleton */}
      <div className="bg-paper-canvas border border-border-rule overflow-hidden">
        <div className="aspect-video sm:aspect-16/9 bg-surface-container" />
        <div className="p-4 sm:p-6 space-y-4">
          <div className="h-8 bg-surface-container rounded w-3/4" />
          <div className="h-4 bg-surface-container rounded w-full" />
          <div className="h-4 bg-surface-container rounded w-2/3" />
        </div>
      </div>
      {/* Stream Skeletons */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border border-border-rule p-4 flex flex-col sm:flex-row gap-4 bg-paper-canvas">
            <div className="w-full sm:w-48 aspect-video bg-surface-container shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-surface-container rounded w-3/4" />
              <div className="h-3 bg-surface-container rounded w-full" />
              <div className="h-3 bg-surface-container rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getPublishedArticles } = useArticles();
  const livePublished = getPublishedArticles() || [];

  // URL query params
  const activeSub = searchParams.get('sub') || 'all';
  const activeLang = searchParams.get('lang') || 'all';
  const activeSort = searchParams.get('sort') || 'newest';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  // Regional City vs Topic Category configuration
  const cityConfig = CITY_CONFIGS[slug];
  const isCity = Boolean(cityConfig) || (typeof window !== 'undefined' && window.location.pathname.startsWith('/city/'));

  const categoryConfig = isCity
    ? (cityConfig || {
        id: slug,
        slug: slug,
        name: slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'शहर',
        nameHindi: slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'शहर',
        englishName: slug || 'City',
        description: `${slug} शहर और ज़िले की स्थानीय प्रामाणिक खबरें।`,
        color: '#c8102e',
        isCity: true,
      })
    : getCategoryBySlug(slug);

  const category = categoryConfig || {
    id: slug,
    slug: slug,
    name: slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'समाचार',
    nameHindi: slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'समाचार',
    englishName: slug || 'News',
    description: null,
    color: '#DA251D',
  };

  // Remote data state
  const [articles, setArticles] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isTopicFallback, setIsTopicFallback] = useState(false);
  const [matchingRule, setMatchingRule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Server-side category/city fetch with pagination, stable sorting, and metadata
  const fetchCategoryArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let result;
      if (isCity) {
        result = await articlesService.getArticlesByCity(slug, {
          page: currentPage,
          pageSize: 12,
          sortBy: activeSort,
          language: activeLang,
          includeCount: true,
        });
      } else {
        result = await articlesService.getArticlesByCategory(slug, {
          page: currentPage,
          pageSize: 12,
          sortBy: activeSort,
          language: activeLang,
          includeCount: true,
        });
      }

      if (result.error) {
        setError(result.error);
        setArticles([]);
        setTotalCount(0);
        setTotalPages(1);
        setIsTopicFallback(false);
        setMatchingRule(null);
      } else {
        setArticles(result.data || []);
        setTotalCount(result.total || 0);
        setTotalPages(result.totalPages || 1);
        setIsTopicFallback(Boolean(result.isTopicFallback));
        setMatchingRule(result.matchingRule || null);
      }
    } catch (err) {
      console.error('[CategoryPage] fetchCategoryArticles failed:', err);
      setError(err.message || 'नेटवर्क त्रुटि के कारण समाचार लोड नहीं हो सके');
      setArticles([]);
      setTotalCount(0);
      setTotalPages(1);
      setIsTopicFallback(false);
      setMatchingRule(null);
    } finally {
      setIsLoading(false);
    }
  }, [slug, isCity, currentPage, activeSort, activeLang]);

  useEffect(() => {
    let isCancelled = false;
    fetchCategoryArticles();

    return () => {
      isCancelled = true;
    };
  }, [fetchCategoryArticles]);

  // Trending articles for the sidebar
  const trendingArticles = useMemo(() => {
    const liveTrending = livePublished.filter((a) => a.isTrending);
    if (liveTrending.length > 0) return liveTrending.slice(0, 5);
    return livePublished.slice(0, 5);
  }, [livePublished]);

  // Handlers for URL search params
  const handleSubChange = (newSub) => {
    const params = new URLSearchParams(searchParams);
    if (newSub && newSub !== 'all') {
      params.set('sub', newSub);
    } else {
      params.delete('sub');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleLangChange = (newLang) => {
    const params = new URLSearchParams(searchParams);
    if (newLang && newLang !== 'all') {
      params.set('lang', newLang);
    } else {
      params.delete('lang');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSortChange = (newSort) => {
    const params = new URLSearchParams(searchParams);
    if (newSort && newSort !== 'newest') {
      params.set('sort', newSort);
    } else {
      params.delete('sort');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const safePage = Math.max(1, Math.min(newPage, totalPages));
    const params = new URLSearchParams(searchParams);
    params.set('page', String(safePage));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setSearchParams({});
  };

  const handleShare = (article, e) => {
    e.preventDefault();
    if (navigator.clipboard) {
      const shortId = article.legacyWordPressId || article.id || article.slug;
      navigator.clipboard.writeText(`https://azaadsamacharindia.com/news/${shortId}`);
      toast.success('लेख लिंक कॉपी किया गया!');
    }
  };

  const handleBookmark = (article, e) => {
    e.preventDefault();
    toast.success('लेख सहेज लिया गया (Bookmarked)');
  };

  // Articles segmentation for Broadsheet Category Layout
  // On Page 1 (default view): 1 Lead story + up to 2 Sub-Lead stories + remaining stream
  // On Page 2+: Uniform stream without repeating the hero banner
  const isPageOneDefault = currentPage === 1 && activeSub === 'all';
  const leadArticle = isPageOneDefault && articles.length > 0 ? articles[0] : null;
  const subLeadArticles = isPageOneDefault && articles.length > 1 ? articles.slice(1, 3) : [];
  const feedArticles = isPageOneDefault
    ? articles.slice(1 + subLeadArticles.length)
    : articles;

  const categoryDisplayName = category.nameHindi || category.name;
  const isInvalidCategory = !categoryConfig && !isLoading && totalCount === 0;

  const basePath = isCity && typeof window !== 'undefined' && window.location.pathname.startsWith('/city/') ? `city/${slug}` : `category/${slug}`;
  const seoTitle = currentPage > 1
    ? `${categoryDisplayName} ${isCity ? 'विशेष' : ''} समाचार - पृष्ठ ${currentPage}`
    : `${categoryDisplayName} ${isCity ? 'विशेष' : ''} समाचार - ताज़ा एवं प्रामाणिक खबरें`;

  const seoDescription = category.description || `${categoryDisplayName} की ताज़ा और महत्वपूर्ण खबरें - आज़ाद समाचार डिजिटल पोर्टल`;
  const seoPath = currentPage > 1 ? `${basePath}?page=${currentPage}` : basePath;

  return (
    <div className="bg-paper-canvas min-h-screen py-4 sm:py-6">
      <SEO
        title={seoTitle}
        description={seoDescription}
        path={seoPath}
        noIndex={isInvalidCategory}
      />

      <Container className="px-3 sm:px-6 space-y-6">
        {/* Category Header Masthead */}
        <CategoryHeader
          category={category}
          articleCount={totalCount}
          totalArticles={totalCount}
          isTopicFallback={isTopicFallback}
          matchingRule={matchingRule}
        />

        {/* Filter Toolbar */}
        <NewsFilters
          subCategories={category.subCategories || []}
          activeSub={activeSub}
          activeSubCategory={activeSub}
          onSubChange={handleSubChange}
          onSubCategoryChange={handleSubChange}
          activeLanguage={activeLang}
          onLanguageChange={handleLangChange}
          activeSort={activeSort}
          onSortChange={handleSortChange}
        />

        {/* Main 2-Column Broadsheet Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main 8-Column Editorial Feed */}
          <div className="lg:col-span-8 space-y-8">
            {isLoading ? (
              <CategoryLoadingSkeleton />
            ) : error ? (
              <div className="bg-paper-tint border-2 border-dashed border-primary-container/30 p-8 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="font-mukta font-bold text-lg text-on-surface">
                  समाचार लोड करने में त्रुटि
                </div>
                <p className="text-secondary font-inter text-xs max-w-md mx-auto">
                  {error}
                </p>
                <button
                  onClick={fetchCategoryArticles}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container text-white text-xs font-bold font-mukta hover:bg-primary transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>पुनः प्रयास करें</span>
                </button>
              </div>
            ) : articles.length === 0 ? (
              <div className="bg-paper-tint border-2 border-dashed border-border-rule p-8 text-center">
                <EmptyState
                  title={`"${categoryDisplayName}" में कोई परिणाम नहीं मिला`}
                  description="चुने गए फ़िल्टर के अनुसार कोई समाचार उपलब्ध नहीं है। कृपया फ़िल्टर रीसेट करें।"
                  actionText="फ़िल्टर साफ़ करें"
                  onAction={handleClearFilters}
                />
              </div>
            ) : (
              <>
                {/* 1. Hero Lead Article Package (Shown prominently on Page 1) */}
                {leadArticle && (
                  <article className="group bg-paper-canvas border border-border-rule overflow-hidden shadow-xs hover:border-border-heavy transition-all">
                    {/* Hero Image */}
                    <div className="relative aspect-video sm:aspect-16/9 overflow-hidden bg-surface-container border-b border-border-rule/50">
                      {leadArticle.featuredImage ? (
                        <img
                          src={leadArticle.featuredImage}
                          alt={leadArticle.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                          loading="eager"
                        />
                      ) : (
                        <div className="w-full h-full bg-paper-tint flex flex-col items-center justify-center p-6 text-center">
                          <Newspaper className="w-10 h-10 text-primary-container/70 mb-2" />
                          <span className="font-mukta text-sm font-bold text-on-surface uppercase tracking-wider">
                            आज़ाद समाचार • {categoryDisplayName} डेस्क
                          </span>
                        </div>
                      )}

                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-primary-container text-white font-mukta font-bold text-xs uppercase tracking-wider shadow-sm">
                          प्रमुख समाचार • लीड स्टोरी
                        </span>
                        {leadArticle.isBreaking && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 font-inter font-bold text-[11px] border border-red-300">
                            ब्रेकिंग
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-xs text-white text-[11px] font-inter px-2 py-0.5">
                        <span>{leadArticle.author?.location || leadArticle.location || categoryDisplayName}</span>
                      </div>
                    </div>

                    {/* Lead Content Block */}
                    <div className="p-4 sm:p-6 bg-paper-canvas space-y-4">
                      <Link to={`/news/${leadArticle.slug}`} className="block group-hover:text-primary-container transition-colors">
                        <h2 className="font-mukta text-xl sm:text-2xl md:text-3xl font-extrabold text-on-surface leading-tight break-words">
                          {leadArticle.title}
                        </h2>
                      </Link>

                      {leadArticle.summary && (
                        <p className="font-inter text-xs sm:text-sm text-secondary leading-relaxed line-clamp-3">
                          {leadArticle.summary}
                        </p>
                      )}

                      {/* Byline & Quick Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border-rule text-xs font-inter">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-paper-subtle flex items-center justify-center font-bold text-primary-container border border-border-rule">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-on-surface text-xs">
                              {leadArticle.author?.name || 'आज़ाद ब्यूरो'}
                            </div>
                            <div className="text-[11px] text-secondary">
                              {formatRelativeTime(leadArticle.publishedAt || leadArticle.createdAt) || 'ताज़ा'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleShare(leadArticle, e)}
                            className="p-1.5 bg-paper-tint hover:bg-paper-subtle text-secondary hover:text-on-surface transition-colors cursor-pointer border border-border-rule"
                            title="शेयर करें"
                            aria-label="शेयर करें"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleBookmark(leadArticle, e)}
                            className="p-1.5 bg-paper-tint hover:bg-paper-subtle text-secondary hover:text-on-surface transition-colors cursor-pointer border border-border-rule"
                            title="बुकमार्क"
                            aria-label="बुकमार्क"
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/news/${leadArticle.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary-container hover:underline ml-2"
                          >
                            <span>पूरा पढ़ें</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                )}

                {/* 2. Secondary Sub-Lead Cards (Up to 2 on Page 1) */}
                {subLeadArticles.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {subLeadArticles.map((article) => (
                      <article
                        key={article.id}
                        className="group bg-paper-canvas border border-border-rule overflow-hidden hover:border-border-heavy transition-all flex flex-col justify-between shadow-2xs"
                      >
                        <div>
                          <div className="relative aspect-video overflow-hidden bg-surface-container border-b border-border-rule/40">
                            {article.featuredImage ? (
                              <img
                                src={article.featuredImage}
                                alt={article.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-paper-tint flex items-center justify-center p-4">
                                <Newspaper className="w-6 h-6 text-primary-container/60" />
                              </div>
                            )}
                            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/80 text-white text-[10px] uppercase font-mukta font-bold">
                              {article.location || categoryDisplayName}
                            </span>
                          </div>

                          <div className="p-4 space-y-2">
                            <span className="text-[11px] font-inter text-secondary block">
                              {formatRelativeTime(article.publishedAt || article.createdAt) || 'ताज़ा'}
                            </span>
                            <Link to={`/news/${article.slug}`}>
                              <h3 className="font-mukta text-base font-bold text-on-surface group-hover:text-primary-container transition-colors line-clamp-2 leading-snug break-words">
                                {article.title}
                              </h3>
                            </Link>
                            {article.summary && (
                              <p className="font-inter text-xs text-secondary line-clamp-2 leading-relaxed">
                                {article.summary}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="p-4 pt-2 border-t border-border-rule flex items-center justify-between text-[11px] font-inter text-secondary">
                          <span className="font-medium text-on-surface truncate max-w-[120px]">
                            {article.author?.name || 'आज़ाद डेस्क'}
                          </span>
                          {article.views ? (
                            <span className="flex items-center gap-1 text-primary-container font-medium">
                              <Eye className="w-3 h-3" />
                              {article.views.toLocaleString('hi-IN')}
                            </span>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {/* 3. Section Header for the Feed Stream */}
                <div className="flex items-center gap-3 pt-2">
                  <span className="h-0.5 flex-1 bg-border-rule" />
                  <span className="font-mukta text-sm font-bold uppercase tracking-wider text-secondary">
                    {categoryDisplayName} — समग्र समाचार प्रवाह ({totalCount.toLocaleString('hi-IN')})
                  </span>
                  <span className="h-0.5 flex-1 bg-border-rule" />
                </div>

                {/* 4. Category News Stream Cards */}
                {feedArticles.length === 0 ? (
                  <div className="text-center py-6 text-secondary font-inter text-xs bg-paper-tint border border-border-rule">
                    इस पृष्ठ पर कोई अतिरिक्त समाचार नहीं हैं।
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedArticles.map((article) => (
                      <article
                        key={article.id}
                        className="bg-paper-canvas border border-border-rule p-3.5 sm:p-4 hover:border-border-heavy transition-all group flex flex-col sm:flex-row gap-4 shadow-2xs"
                      >
                        {/* Thumbnail */}
                        <div className="w-full sm:w-48 aspect-video sm:aspect-16/10 overflow-hidden bg-surface-container shrink-0 border border-border-rule/40">
                          {article.featuredImage ? (
                            <img
                              src={article.featuredImage}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-paper-tint flex flex-col items-center justify-center p-2 text-center">
                              <Newspaper className="w-6 h-6 text-primary-container/70 mb-1" />
                              <span className="font-mukta text-[10px] font-bold text-secondary uppercase">
                                आज़ाद समाचार
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col justify-between gap-2 min-w-0">
                          <div>
                            <div className="flex items-center gap-2 text-[11px] font-inter text-secondary mb-1">
                              <span className="font-bold uppercase text-primary-container">
                                {article.location || categoryDisplayName}
                              </span>
                              <span>•</span>
                              <span>
                                {article.publishedAt
                                  ? new Date(article.publishedAt).toLocaleDateString('hi-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                    })
                                  : 'हाल ही में'}
                              </span>
                            </div>

                            <Link to={`/news/${article.slug}`}>
                              <h3 className="font-mukta text-base sm:text-lg font-bold text-on-surface group-hover:text-primary-container transition-colors line-clamp-2 leading-snug break-words">
                                {article.title}
                              </h3>
                            </Link>

                            {article.summary && (
                              <p className="font-inter text-xs text-secondary mt-1 line-clamp-2 leading-relaxed">
                                {article.summary}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-inter text-secondary pt-2 border-t border-border-rule/60">
                            <span className="truncate max-w-[140px]">{article.author?.name || 'आज़ाद ब्यूरो'}</span>
                            <span className="flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3 text-secondary" />
                              {formatRelativeTime(article.publishedAt || article.createdAt) || 'ताज़ा'}
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {/* 5. Server-Side Archive Pagination */}
                {totalPages > 1 && (
                  <div className="pt-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right 4-Column Broadsheet Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-20">
              <ArticleSidebar trendingArticles={trendingArticles} />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

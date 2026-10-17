import React, { useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import Container from '../../components/common/Container';
import EmptyState from '../../components/common/EmptyState';
import {
  CategoryHeader,
  NewsFilters,
  Pagination,
  ArticleSidebar,
} from '../../components/news';
import { getArticlesByCategory, getTrendingNews } from '../../data/mockNews';
import { getCategoryBySlug } from '../../data/categories';
import { filterNews } from '../../utils/filterNews';
import { paginateNews } from '../../utils/paginateNews';
import { Eye, Clock, Share2, Bookmark, CheckCircle, ChevronRight, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query params
  const activeSub = searchParams.get('sub') || 'all';
  const activeLang = searchParams.get('lang') || 'all';
  const activeSort = searchParams.get('sort') || 'newest';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Category configuration
  const category = getCategoryBySlug(slug);

  // Raw articles for this category
  const rawCategoryArticles = useMemo(() => {
    return getArticlesByCategory(slug);
  }, [slug]);

  // Apply client-side filters
  const filteredArticles = useMemo(() => {
    return filterNews(rawCategoryArticles, {
      subCategory: activeSub,
      language: activeLang,
      sortBy: activeSort,
    });
  }, [rawCategoryArticles, activeSub, activeLang, activeSort]);

  // Trending articles for the sidebar
  const trendingArticles = useMemo(() => {
    return getTrendingNews(5);
  }, []);

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
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
    window.scrollTo({ top: 320, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setSearchParams({});
  };

  const handleShare = (article, e) => {
    e.preventDefault();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + `/news/${article.slug}`);
      toast.success('लिंक कॉपी किया गया!');
    }
  };

  const handleBookmark = (article, e) => {
    e.preventDefault();
    toast.success('लेख सहेज लिया गया (Bookmarked)');
  };

  // If category does not exist in master list
  if (!category) {
    return (
      <Container className="py-12 px-4">
        <EmptyState
          title="श्रेणी नहीं मिली (Category Not Found)"
          description={`श्रेणी "${slug}" हमारी डायरेक्टरी में उपलब्ध नहीं है। कृपया मुख्य पृष्ठ पर जाएं।`}
          actionLink="/"
          actionText="मुख्य पृष्ठ पर जाएं"
        />
      </Container>
    );
  }

  // Articles segmentation for Broadsheet Category Layout
  // Lead story is first article on page 1 (when no sub-category filter is active)
  const isPageOneDefault = currentPage === 1 && activeSub === 'all';
  const leadArticle = isPageOneDefault && filteredArticles.length > 0 ? filteredArticles[0] : null;
  const subLeadArticles = isPageOneDefault && filteredArticles.length > 2 ? filteredArticles.slice(1, 3) : [];
  
  // Feed articles (remaining articles for pagination)
  const feedArticlesPool = isPageOneDefault
    ? filteredArticles.slice(3)
    : filteredArticles;

  // Pagination for the feed articles
  const pageSize = 6;
  const paginatedResult = paginateNews(feedArticlesPool, currentPage, pageSize);

  const hasActiveFilters = activeSub !== 'all' || activeLang !== 'all' || activeSort !== 'newest';

  return (
    <div className="bg-paper-canvas min-h-screen py-4 sm:py-6">
      <Container className="px-3 sm:px-6 space-y-6">
        {/* Category Header Masthead */}
        <CategoryHeader
          category={category}
          articleCount={rawCategoryArticles.length}
          todayBulletinsCount={Math.max(2, Math.floor(rawCategoryArticles.length / 2))}
        />

        {/* Filter Toolbar */}
        <NewsFilters
          subCategories={category.subCategories || []}
          activeSub={activeSub}
          onSubChange={handleSubChange}
          activeLanguage={activeLang}
          onLanguageChange={handleLangChange}
          activeSort={activeSort}
          onSortChange={handleSortChange}
        />

        {/* Main 2-Column Broadsheet Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main 8-Column Editorial Feed */}
          <div className="lg:col-span-8 space-y-8">
            {filteredArticles.length === 0 ? (
              <div className="bg-paper-tint border-2 border-dashed border-border-rule p-8 text-center">
                <EmptyState
                  title={`"${category.nameHindi}" में कोई परिणाम नहीं मिला`}
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
                    <div className="relative aspect-video sm:aspect-16/9 overflow-hidden bg-surface-container">
                      <img
                        src={leadArticle.featuredImage}
                        alt={leadArticle.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-primary-container text-white font-mukta font-bold text-xs uppercase tracking-wider shadow-sm">
                          प्रमुख समाचार • लीड स्टोरी
                        </span>
                        {leadArticle.isBreaking && (
                          <span className="px-2 py-0.5 bg-ticker-tint text-breaking-crimson font-inter font-bold text-[11px] border border-breaking-crimson/40">
                            ब्रेकिंग
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-xs text-white text-[11px] font-inter px-2 py-0.5 rounded">
                        <span>{leadArticle.author?.location || 'विशेष ब्यूरो'}</span>
                      </div>
                    </div>

                    {/* Lead Content Block */}
                    <div className="p-4 sm:p-6 bg-paper-canvas space-y-4">
                      <Link to={`/news/${leadArticle.slug}`} className="block group-hover:text-primary-container transition-colors">
                        <h2 className="font-mukta text-xl sm:text-2xl md:text-3xl font-extrabold text-on-surface leading-tight">
                          {leadArticle.title}
                        </h2>
                      </Link>

                      <p className="font-inter text-xs sm:text-sm text-secondary leading-relaxed line-clamp-3">
                        {leadArticle.summary}
                      </p>

                      {/* Key Highlights Callout */}
                      <div className="bg-paper-tint border-l-4 border-primary-container p-3 sm:p-4 text-xs font-inter space-y-1.5">
                        <span className="font-bold text-primary-container uppercase tracking-wider block text-[11px]">
                          मुख्य बिंदु एवं प्रभाव:
                        </span>
                        <ul className="space-y-1 text-on-surface">
                          <li className="flex items-start gap-1.5">
                            <span className="text-primary-container font-bold">›</span>
                            <span>इस नीतिगत फैसले से राज्य एवं राष्ट्रीय स्तर पर त्वरित विकास को बढ़ावा मिलेगा।</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-primary-container font-bold">›</span>
                            <span>संबंधित विभाग द्वारा डिजिटल मॉनिटरिंग और 60 दिनों में प्रगति रिपोर्ट अनिवार्य।</span>
                          </li>
                        </ul>
                      </div>

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
                              {leadArticle.publishedAt
                                ? new Date(leadArticle.publishedAt).toLocaleDateString('hi-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '25 मार्च 2025'}{' '}
                              • {leadArticle.readTime || '4 मिनट पठन'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => handleShare(leadArticle, e)}
                            className="p-1.5 rounded bg-paper-tint hover:bg-paper-subtle text-secondary hover:text-on-surface transition-colors cursor-pointer"
                            title="शेयर करें"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleBookmark(leadArticle, e)}
                            className="p-1.5 rounded bg-paper-tint hover:bg-paper-subtle text-secondary hover:text-on-surface transition-colors cursor-pointer"
                            title="बुकमार्क"
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

                {/* 2. Secondary Sub-Lead Cards (2 Side-by-Side on Page 1) */}
                {subLeadArticles.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {subLeadArticles.map((article) => (
                      <article
                        key={article.id}
                        className="group bg-paper-canvas border border-border-rule overflow-hidden hover:border-border-heavy transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative aspect-video overflow-hidden bg-surface-container">
                            <img
                              src={article.featuredImage}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/75 text-white text-[10px] uppercase font-inter rounded">
                              {article.city || category.nameHindi}
                            </span>
                          </div>
                          <div className="p-4 space-y-2">
                            <span className="text-[11px] font-inter text-secondary block">
                              {article.publishedAt
                                ? new Date(article.publishedAt).toLocaleDateString('hi-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                  })
                                : 'आज'}{' '}
                              • {article.readTime || '3 मिनट'}
                            </span>
                            <Link to={`/news/${article.slug}`}>
                              <h3 className="font-mukta text-base font-bold text-on-surface group-hover:text-primary-container transition-colors line-clamp-2 leading-snug">
                                {article.title}
                              </h3>
                            </Link>
                            <p className="font-inter text-xs text-secondary line-clamp-2">
                              {article.summary}
                            </p>
                          </div>
                        </div>

                        <div className="p-4 pt-2 border-t border-border-rule flex items-center justify-between text-[11px] font-inter text-secondary">
                          <span className="font-medium text-on-surface">{article.author?.name}</span>
                          <span className="flex items-center gap-1 text-primary-container font-medium">
                            <Eye className="w-3 h-3" />
                            {article.views || 1200}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {/* 3. Section Divider for the Feed */}
                <div className="flex items-center gap-3 pt-2">
                  <span className="h-0.5 flex-1 bg-border-rule" />
                  <span className="font-mukta text-sm font-bold uppercase tracking-wider text-secondary">
                    {category.nameHindi} — अन्य समाचार व बुलेटिन
                  </span>
                  <span className="h-0.5 flex-1 bg-border-rule" />
                </div>

                {/* 4. Category News Stream Cards */}
                {paginatedResult.items.length === 0 ? (
                  <div className="text-center py-8 text-secondary font-inter text-xs">
                    इस पृष्ठ पर कोई अतिरिक्त समाचार नहीं हैं।
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paginatedResult.items.map((article) => (
                      <article
                        key={article.id}
                        className="bg-paper-canvas border border-border-rule p-3.5 sm:p-4 hover:border-border-heavy transition-all group flex flex-col sm:flex-row gap-4"
                      >
                        {/* Thumbnail */}
                        <div className="w-full sm:w-48 aspect-video sm:aspect-16/10 overflow-hidden bg-surface-container shrink-0">
                          <img
                            src={article.featuredImage}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col justify-between gap-2 min-w-0">
                          <div>
                            <div className="flex items-center gap-2 text-[11px] font-inter text-secondary mb-1">
                              <span className="font-bold uppercase text-primary-container">
                                {article.city || category.nameHindi}
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
                              <h3 className="font-mukta text-base sm:text-lg font-bold text-on-surface group-hover:text-primary-container transition-colors line-clamp-2 leading-snug">
                                {article.title}
                              </h3>
                            </Link>

                            <p className="font-inter text-xs text-secondary mt-1 line-clamp-2">
                              {article.summary}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-inter text-secondary pt-2 border-t border-border-rule/60">
                            <span>{article.author?.name || 'आज़ाद ब्यूरो'}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-secondary" />
                              {article.readTime || '3 मिनट'}
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {/* 5. Pagination */}
                {paginatedResult.totalPages > 1 && (
                  <div className="pt-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={paginatedResult.totalPages}
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

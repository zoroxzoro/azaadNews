import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Container from '../../components/common/Container';
import SEO from '../../components/common/SEO.jsx';
import { useArticles } from '../../context/ArticleContext';
import {
  SearchResultCard,
  SearchFilters,
  Pagination,
  ArticleSidebar,
} from '../../components/news';
import { articlesService } from '../../services/articlesService';
import { Search, X, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react';

function SearchLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-label="खोज परिणाम लोड हो रहे हैं">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-paper-canvas border border-border-rule p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-4 bg-surface-container rounded w-20" />
            <div className="h-4 bg-surface-container rounded w-28" />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-44 aspect-video bg-surface-container shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-surface-container rounded w-5/6" />
              <div className="h-3 bg-surface-container rounded w-full" />
              <div className="h-3 bg-surface-container rounded w-3/4" />
              <div className="h-3 bg-surface-container rounded w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getPublishedArticles } = useArticles();
  const livePublished = getPublishedArticles();

  // Query parameter values
  const query = searchParams.get('q') || '';
  const activeCategory = searchParams.get('category') || 'all';
  const activeLanguage = searchParams.get('language') || 'all';
  const activeDate = searchParams.get('date') || 'all';
  const customFrom = searchParams.get('from') || '';
  const customTo = searchParams.get('to') || '';
  const contentType = searchParams.get('content') || 'all';
  const activeSort = searchParams.get('sort') || (query ? 'relevance' : 'newest');
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Local state for the search input
  const [inputValue, setInputValue] = useState(query);

  // Search Results state from remote Supabase
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active request sequence reference to prevent stale responses from overwriting newer queries
  const reqIdRef = useRef(0);

  // Keep input in sync if URL query changes (browser back/forward or clicking tags)
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  // Suggested trending keywords for quick search
  const trendingTags = [
    'कानपुर',
    'उत्तर प्रदेश',
    'बजट 2025',
    'क्राइम',
    'संसद',
    'IPL',
    'राजनीति',
    'विकास',
  ];

  // Helper to update URL search parameters
  const updateParams = (newParams) => {
    const current = Object.fromEntries(searchParams.entries());
    const merged = { ...current, ...newParams };

    // Clean up empty or default values
    Object.keys(merged).forEach((key) => {
      if (!merged[key] || merged[key] === 'all' || (key === 'page' && merged[key] === '1')) {
        if (key !== 'q') {
          delete merged[key];
        }
      }
    });

    setSearchParams(merged);
  };

  // Debounce input to synchronize with URL query
  useEffect(() => {
    const trimmed = inputValue.trim();
    if (trimmed === query) return;

    const timer = setTimeout(() => {
      const newParams = {
        q: trimmed,
        page: '1',
      };
      if (trimmed && !searchParams.get('sort')) {
        newParams.sort = 'relevance';
      }
      updateParams(newParams);
    }, 450);

    return () => clearTimeout(timer);
  }, [inputValue, query]);

  // Perform remote search across all 10,654+ articles in Supabase
  const executeSearch = useCallback(async () => {
    const currentReq = ++reqIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const response = await articlesService.searchArticles(query, {
        page: currentPage,
        pageSize: 12,
        category: activeCategory,
        language: activeLanguage,
        dateRange: activeDate,
        customFrom,
        customTo,
        contentType,
        sortBy: activeSort,
      });

      if (currentReq === reqIdRef.current) {
        if (response.error) {
          setError(response.error);
          setResults([]);
          setTotalCount(0);
          setTotalPages(1);
        } else {
          setResults(response.data || []);
          setTotalCount(response.total || 0);
          setTotalPages(response.totalPages || 1);
        }
      }
    } catch (err) {
      if (currentReq === reqIdRef.current) {
        console.error('[SearchPage] searchArticles failed:', err);
        setError(err.message || 'खोज अनुरोध में त्रुटि हुई');
        setResults([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } finally {
      if (currentReq === reqIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [query, currentPage, activeCategory, activeLanguage, activeDate, customFrom, customTo, contentType, activeSort]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const trimmed = inputValue.trim();
    const newParams = {
      q: trimmed,
      page: '1',
    };
    if (trimmed) {
      if (!searchParams.get('sort')) {
        newParams.sort = 'relevance';
      }
    }
    updateParams(newParams);
  };

  const handleTagClick = (tag) => {
    setInputValue(tag);
    updateParams({ q: tag, page: '1', sort: 'relevance' });
  };

  const handleClearSearch = () => {
    setInputValue('');
    updateParams({ q: '', page: '1' });
  };

  const handleCategoryChange = (catSlug) => {
    updateParams({ category: catSlug, page: '1' });
  };

  const handleLanguageChange = (lang) => {
    updateParams({ language: lang, page: '1' });
  };

  const handleDateChange = (date) => {
    updateParams({ date, page: '1' });
  };

  const handleCustomDateChange = (from, to) => {
    updateParams({ from, to, page: '1' });
  };

  const handleContentTypeChange = (type) => {
    updateParams({ content: type, page: '1' });
  };

  const handleSortChange = (sort) => {
    updateParams({ sort, page: '1' });
  };

  const handlePageChange = (newPage) => {
    updateParams({ page: String(newPage) });
    window.scrollTo({ top: 280, behavior: 'smooth' });
  };

  const handleClearAllFilters = () => {
    const params = {};
    if (query) params.q = query;
    setSearchParams(params);
  };

  // Trending stories for sidebar
  const trendingArticles = useMemo(() => {
    const liveTrending = livePublished.filter((a) => a.isTrending);
    if (liveTrending.length > 0) return liveTrending.slice(0, 5);
    return livePublished.slice(0, 5);
  }, [livePublished]);

  const hasActiveFilters =
    activeCategory !== 'all' ||
    activeLanguage !== 'all' ||
    activeDate !== 'all' ||
    customFrom !== '' ||
    customTo !== '' ||
    contentType !== 'all' ||
    (query && activeSort !== 'relevance') ||
    (!query && activeSort !== 'newest');

  return (
    <div className="bg-paper-canvas min-h-screen py-4 sm:py-6">
      <SEO
        title={query ? `खोज: "${query}"` : 'समाचार एवं अभिलेखागार खोज'}
        description="आज़ाद समाचार अभिलेखागार एवं समाचार खोज पोर्टल — संपूर्ण ऐतिहासिक संग्रह।"
        path={query ? `search?q=${encodeURIComponent(query)}` : 'search'}
        noIndex={Boolean(query)}
      />
      <Container className="px-3 sm:px-6 space-y-6">
        {/* HERO COMMAND BAR (Stitch Search Header) */}
        <div className="bg-paper-canvas border border-border-rule p-4 sm:p-6 shadow-xs">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
              <h1 className="font-mukta text-xl sm:text-2xl font-bold text-on-surface">
                समाचार एवं अभिलेखागार खोज (10,650+ ऐतिहासिक समाचार)
              </h1>
            </div>

            {/* Large Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <div className="relative flex-1 flex items-center">
                <Search className="w-5 h-5 absolute left-3.5 text-secondary pointer-events-none" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="शीर्षक, विषय, कीवर्ड, शहर या रिपोर्टर खोजें (उदा. कानपुर, पुलिस, बजट)..."
                  className="w-full pl-11 pr-10 py-3 bg-paper-tint border-2 border-border-rule text-sm sm:text-base font-inter text-on-surface placeholder-secondary focus:outline-none focus:border-primary-container transition-colors"
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 p-1 text-secondary hover:text-on-surface cursor-pointer"
                    title="साफ़ करें"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-primary-container text-white font-mukta font-bold text-base hover:bg-primary transition-colors cursor-pointer shrink-0 ml-2"
              >
                खोजें
              </button>
            </form>

            {/* Trending Quick Search Tag Pills */}
            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs font-inter">
              <span className="text-secondary font-medium flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-primary-container" />
                ट्रेंडिंग खोजें:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {trendingTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className="px-2.5 py-1 bg-paper-tint hover:bg-paper-subtle border border-border-rule text-on-surface text-xs rounded transition-colors cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH META BAR: Stats, Language Segmented Control, Sort Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-paper-tint border border-border-rule px-4 py-2.5 text-xs font-inter">
          {/* Results count text */}
          <div className="flex items-center gap-2 text-on-surface">
            {isLoading ? (
              <span className="text-secondary font-medium">खोज परिणाम संकलित किए जा रहे हैं...</span>
            ) : query ? (
              <span>
                परिणाम: "<strong>{query}</strong>" के लिए कुल{' '}
                <strong className="text-primary-container">{totalCount.toLocaleString('hi-IN')}</strong> समाचार मिले
              </span>
            ) : (
              <span>
                अभिलेखागार में कुल <strong>{totalCount.toLocaleString('hi-IN')}</strong> समाचार उपलब्ध
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Language Segmented Control */}
            <div className="inline-flex rounded border border-border-rule overflow-hidden bg-paper-canvas">
              <button
                onClick={() => handleLanguageChange('all')}
                className={`px-3 py-1 font-inter text-xs transition-colors cursor-pointer ${
                  activeLanguage === 'all'
                    ? 'bg-primary-container text-white font-bold'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                सभी
              </button>
              <button
                onClick={() => handleLanguageChange('hi')}
                className={`px-3 py-1 font-inter text-xs transition-colors cursor-pointer border-l border-border-rule ${
                  activeLanguage === 'hi'
                    ? 'bg-primary-container text-white font-bold'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-3 py-1 font-inter text-xs transition-colors cursor-pointer border-l border-border-rule ${
                  activeLanguage === 'en'
                    ? 'bg-primary-container text-white font-bold'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                English
              </button>
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-secondary">क्रमबद्ध:</span>
              <select
                value={activeSort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-paper-canvas border border-border-rule text-on-surface text-xs font-inter py-1 px-2 focus:outline-none focus:border-border-heavy cursor-pointer"
              >
                {query && <option value="relevance">प्रासंगिकता (Most Relevant)</option>}
                <option value="newest">नवीनतम (Newest First)</option>
                <option value="oldest">सबसे पुराना (Oldest First)</option>
                <option value="views">सर्वाधिक पढ़ा गया (Most Read)</option>
              </select>
            </div>
          </div>
        </div>

        {/* FACET BAR FILTERS */}
        <SearchFilters
          activeCategory={activeCategory}
          activeLanguage={activeLanguage}
          activeDate={activeDate}
          customFrom={customFrom}
          customTo={customTo}
          contentType={contentType}
          categoryCounts={{}}
          onCategoryChange={handleCategoryChange}
          onLanguageChange={handleLanguageChange}
          onDateChange={handleDateChange}
          onCustomDateChange={handleCustomDateChange}
          onContentTypeChange={handleContentTypeChange}
          onClearFilters={handleClearAllFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* MAIN RESULTS FEED & SIDEBAR (BROADSHEET 2-COLUMN) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main 8-Column Editorial Feed */}
          <div className="lg:col-span-8 space-y-4">
            {isLoading ? (
              <SearchLoadingSkeleton />
            ) : error ? (
              <div className="bg-paper-tint border-2 border-dashed border-breaking-crimson/30 p-8 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-breaking-crimson/10 flex items-center justify-center text-breaking-crimson">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="font-mukta font-bold text-lg text-on-surface">
                  खोज में त्रुटि हुई
                </div>
                <p className="text-secondary font-inter text-xs max-w-md mx-auto">
                  {error}
                </p>
                <button
                  onClick={executeSearch}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container text-white text-xs font-bold font-mukta hover:bg-red-700 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>पुनः प्रयास करें</span>
                </button>
              </div>
            ) : results.length === 0 ? (
              /* POLISHED ZERO RESULTS EMPTY STATE (from Stitch) */
              <div className="bg-paper-tint border-2 border-dashed border-border-rule p-6 sm:p-10 text-center space-y-5">
                <div className="w-14 h-14 mx-auto rounded-full bg-ticker-tint flex items-center justify-center text-breaking-crimson">
                  <AlertCircle className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-widest text-breaking-crimson font-bold font-inter">
                    शून्य परिणाम स्थिति (Zero Results)
                  </span>
                  <h3 className="font-mukta text-xl sm:text-2xl font-bold text-on-surface">
                    {query
                      ? `'${query}' के लिए कोई परिणाम नहीं मिला`
                      : 'कोई समाचार मेल नहीं खाता'}
                  </h3>
                  <p className="font-inter text-xs sm:text-sm text-secondary max-w-md mx-auto">
                    आपके द्वारा खोजे गए शब्द या चुने गए फ़िल्टर से मेल खाते लेख हमारे 10,650+ समाचार संग्रह में उपलब्ध नहीं हैं। कृपया नीचे दिए गए सुझावों की सहायता लें:
                  </p>
                </div>

                {/* Helpful Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-lg mx-auto bg-paper-canvas border border-border-rule p-4 text-xs font-inter">
                  <div className="flex items-start gap-2 text-on-surface">
                    <span className="text-primary-container font-bold">✓</span>
                    <span>वर्तनी (Spelling) की जांच करें या वैकल्पिक हिन्दी/अंग्रेजी शब्द लिखें।</span>
                  </div>
                  <div className="flex items-start gap-2 text-on-surface">
                    <span className="text-primary-container font-bold">✓</span>
                    <span>लगाए गए फ़िल्टर साफ़ करके पुनः खोजें।</span>
                  </div>
                  <div className="flex items-start gap-2 text-on-surface">
                    <span className="text-primary-container font-bold">✓</span>
                    <span>अधिक सामान्य व संक्षिप्त कीवर्ड का प्रयोग करें (उदा. 'कानपुर' या 'विकास')।</span>
                  </div>
                  <div className="flex items-start gap-2 text-on-surface">
                    <span className="text-primary-container font-bold">✓</span>
                    <span>वर्तमान में ट्रेंडिंग विषयों की सूची ब्राउज़ करें।</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearAllFilters}
                      className="px-4 py-2 bg-primary-container text-white font-inter text-xs font-bold hover:bg-primary transition-colors cursor-pointer"
                    >
                      फ़िल्टर हटाएं एवं पुनः प्रयास करें
                    </button>
                  )}
                  <Link
                    to="/"
                    className="px-4 py-2 bg-paper-canvas border border-border-rule text-on-surface font-inter text-xs hover:border-border-heavy transition-colors"
                  >
                    मुख्य पृष्ठ पर वापस जाएं
                  </Link>
                </div>
              </div>
            ) : (
              /* ACTIVE RESULTS CONTAINER */
              <div className="space-y-4">
                {results.map((article, index) => (
                  <SearchResultCard
                    key={article.id}
                    article={article}
                    query={query}
                    isTopMatch={index === 0 && currentPage === 1 && !!query}
                  />
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pt-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right 4-Column Broadsheet Reading Companion Sidebar */}
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

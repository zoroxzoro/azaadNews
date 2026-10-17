import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Container from '../../components/common/Container';
import EmptyState from '../../components/common/EmptyState';
import {
  FeaturedVideo,
  VideoGrid,
  VideoCategoryFilter,
  VideoSearch,
} from '../../components/news';
import { mockNews } from '../../data/mockNews';
import { normalizeHindiText } from '../../utils/searchNews';
import { Play, ChevronLeft, ChevronRight, Video, RotateCcw, Sparkles } from 'lucide-react';

export default function VideoNewsPage() {
  // 1. Filter all news articles that have a valid youtubeUrl
  const allVideoArticles = useMemo(() => {
    return mockNews.filter((item) => !!item.youtubeUrl);
  }, []);

  // 2. Filter states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(9);

  // Active playing video ID (either 'featured' or an article.id)
  // Ensures only ONE video plays at any time (unmounting other iframes)
  const [activePlayingId, setActivePlayingId] = useState(null);

  // 3. Featured Video (topmost or breaking/featured video)
  // We pick the first prominent video from the dataset as the default featured video
  const featuredArticle = useMemo(() => {
    return allVideoArticles.find((a) => a.isBreaking || a.isFeatured) || allVideoArticles[0];
  }, [allVideoArticles]);

  // Compute category counts for the filter bar
  const categoryCounts = useMemo(() => {
    const counts = { all: allVideoArticles.length };
    allVideoArticles.forEach((article) => {
      const cat = article.category;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [allVideoArticles]);

  // 4. Client-side Search and Category Filtering
  const filteredArticles = useMemo(() => {
    let result = allVideoArticles;

    // Filter by Category
    if (selectedCategory !== 'all') {
      result = result.filter((item) => item.category === selectedCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const normalizedQuery = normalizeHindiText(searchQuery.trim().toLowerCase());
      result = result.filter((item) => {
        const titleMatch = item.title && normalizeHindiText(item.title.toLowerCase()).includes(normalizedQuery);
        const summaryMatch = item.summary && normalizeHindiText(item.summary.toLowerCase()).includes(normalizedQuery);
        const categoryMatch = item.category && normalizeHindiText(item.category.toLowerCase()).includes(normalizedQuery);
        const tagMatch = item.tags && item.tags.some((t) => normalizeHindiText(t.toLowerCase()).includes(normalizedQuery));
        const authorMatch = item.author?.name && normalizeHindiText(item.author.name.toLowerCase()).includes(normalizedQuery);

        return titleMatch || summaryMatch || categoryMatch || tagMatch || authorMatch;
      });
    }

    return result;
  }, [allVideoArticles, selectedCategory, searchQuery]);

  // Reset pagination when category or search changes
  const handleCategorySelect = (catSlug) => {
    setSelectedCategory(catSlug);
    setVisibleCount(9);
    setActivePlayingId(null);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setVisibleCount(9);
    setActivePlayingId(null);
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setVisibleCount(9);
    setActivePlayingId(null);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  // Play handlers: Ensures only ONE video plays at a time
  const handlePlayFeatured = () => {
    setActivePlayingId('featured');
  };

  const handlePlayCard = (article) => {
    setActivePlayingId(article.id);
  };

  const visibleArticles = filteredArticles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredArticles.length;
  const hasActiveFilters = selectedCategory !== 'all' || searchQuery.trim() !== '';

  return (
    <div className="bg-paper-canvas min-h-screen py-4 sm:py-6">
      <Container className="px-3 sm:px-6 space-y-6">
        {/* Breadcrumb & Page Masthead */}
        <div className="bg-paper-canvas border-b-2 border-primary-container border-x border-t border-border-rule p-4 sm:p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/"
              className="text-secondary hover:text-primary-container text-xs font-inter flex items-center gap-0.5 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>होमपेज</span>
            </Link>
            <span className="text-secondary text-xs">/</span>
            <span className="font-inter text-xs uppercase font-bold text-secondary tracking-widest">
              VIDEOS
            </span>
            <span className="text-secondary text-xs">/</span>
            <span className="font-mukta text-xs font-bold text-primary-container">
              वीडियो न्यूज़
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="font-mukta text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                </span>
                <span>वीडियो न्यूज़ एवं डिजिटल प्रसारण</span>
              </h1>
              <p className="font-inter text-xs sm:text-sm text-secondary mt-1.5 max-w-3xl">
                आज़ाद समाचार डिजिटल न्यूज़कास्ट: निष्पक्ष विश्लेषण, चुनावी समीक्षा, विशेष साक्षात्कार और ग्राउंड वीडियो रिपोर्टिंग।
              </p>
            </div>

            {/* Live Updates Counter Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-paper-tint border border-border-rule self-start md:self-auto text-xs font-inter shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span className="font-bold text-on-surface">कुल {allVideoArticles.length} वीडियो रिपोर्ट</span>
            </div>
          </div>
        </div>

        {/* FEATURED VIDEO SECTION (Top Hero Player) */}
        {featuredArticle && !searchQuery && selectedCategory === 'all' && (
          <div className="space-y-2">
            <FeaturedVideo
              article={featuredArticle}
              isPlaying={activePlayingId === 'featured'}
              onPlay={handlePlayFeatured}
            />
          </div>
        )}

        {/* SEARCH & CATEGORY FILTER TOOLBAR */}
        <div className="space-y-3 bg-paper-tint border border-border-rule p-3 sm:p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input (5 Cols on Desktop) */}
            <div className="md:col-span-5">
              <VideoSearch
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onClearSearch={() => handleSearchChange('')}
              />
            </div>

            {/* Meta count & Clear Filters (7 Cols on Desktop) */}
            <div className="md:col-span-7 flex items-center justify-between md:justify-end gap-3 text-xs font-inter text-secondary">
              <span>
                {filteredArticles.length} वीडियो उपलब्ध
                {searchQuery ? ` ("${searchQuery}" के लिए)` : ''}
              </span>

              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-inter text-breaking-crimson bg-ticker-tint hover:bg-breaking-crimson hover:text-white transition-colors cursor-pointer border border-breaking-crimson/20"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>फ़िल्टर साफ़ करें</span>
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <VideoCategoryFilter
            activeCategory={selectedCategory}
            categoryCounts={categoryCounts}
            onSelectCategory={handleCategorySelect}
          />
        </div>

        {/* MAIN VIDEO GRID SECTION */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-border-rule">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-primary-container" />
              <h2 className="font-mukta text-lg sm:text-xl font-bold text-on-surface">
                {selectedCategory === 'all' ? 'नवीनतम वीडियो बुलेटिन' : `${filteredArticles[0]?.categoryNameHindi || selectedCategory} वीडियो`}
              </h2>
            </div>
            <span className="font-inter text-xs text-secondary">
              दिखा रहे हैं: {Math.min(visibleCount, filteredArticles.length)} / {filteredArticles.length}
            </span>
          </div>

          {filteredArticles.length === 0 ? (
            /* EMPTY STATE */
            <div className="bg-paper-tint border-2 border-dashed border-border-rule p-8 sm:p-12 text-center">
              <EmptyState
                title="कोई वीडियो नहीं मिला"
                description={
                  searchQuery
                    ? `"${searchQuery}" से संबंधित कोई वीडियो उपलब्ध नहीं है। कृपया भिन्न कीवर्ड खोजें।`
                    : 'इस श्रेणी में अभी कोई वीडियो उपलब्ध नहीं है।'
                }
                actionText="सभी वीडियो देखें"
                onAction={handleClearFilters}
              />
            </div>
          ) : (
            <>
              {/* Responsive Video News Grid */}
              <VideoGrid
                articles={visibleArticles}
                activeVideoId={activePlayingId}
                onPlayVideo={handlePlayCard}
              />

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    className="px-8 py-3 bg-paper-canvas border-2 border-border-rule hover:border-primary-container hover:text-primary-container text-on-surface font-mukta font-bold text-sm sm:text-base transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>और वीडियो लोड करें (Load More Videos)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Container>
    </div>
  );
}

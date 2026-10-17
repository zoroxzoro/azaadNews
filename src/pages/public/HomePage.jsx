import React from 'react';
import Container from '../../components/common/Container';
import {
  HeroNewsSection,
  LiveCricketWidget,
  UPRegionalSection,
  BusinessMarketsSection,
  VideoNewsSection,
  LatestNewsSection,
  CategoryNewsSection,
  MostReadSection,
  SocialMediaSection,
  FactCheckAndOpinions,
  PhotoGallerySection,
} from '../../components/news';
import {
  mockNews,
  getFeaturedNews,
  getLatestNews,
  getTrendingNews,
  getNewsByCategory,
  getVideoNews,
  getMostReadNews,
} from '../../data/mockNews';
import { categories, getCategoryBySlug } from '../../data/categories';

/**
 * HomePage Component for Azaad Samachar
 * Faithful implementation of the Google Stitch broadsheet editorial homepage design.
 */
export default function HomePage() {
  // Query data using modular selectors
  const featured = getFeaturedNews();
  const leadStory = featured[0] || mockNews[0];
  const secondaryStories = featured.length > 1 ? featured.slice(1, 4) : mockNews.slice(1, 4);
  const trendingStories = getTrendingNews(5);
  const upStories = getNewsByCategory('uttar-pradesh');
  const businessStories = getNewsByCategory('business');
  const sportsStories = getNewsByCategory('sports');
  const videoStories = getVideoNews(4);
  const latestStories = getLatestNews(8);
  const mostReadStories = getMostReadNews(5);
  const sportsCategory = getCategoryBySlug('sports');

  return (
    <Container className="space-y-6 sm:space-y-8 px-3 sm:px-4 lg:px-6 py-4">
      {/* 1. HERO NEWS PACKAGE (Dominant Lead + 3 Secondary + Numbered Trending) */}
      <HeroNewsSection
        leadStory={leadStory}
        secondaryStories={secondaryStories}
        trendingStories={trendingStories}
      />

      {/* 2. LIVE CRICKET SCORECARD STRIP (ICC T20 Widget) */}
      <LiveCricketWidget />

      {/* 3. UTTAR PRADESH REGIONAL FOCUS (City Tabs: Lucknow, Ayodhya, Varanasi, Kanpur, Prayagraj, Gorakhpur) */}
      <UPRegionalSection articles={upStories} />

      {/* 4. DUAL CATEGORY ROW: Business & Markets + Sports Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Business & Markets with Live Indices (6 Columns) */}
        <div className="lg:col-span-6">
          <BusinessMarketsSection articles={businessStories} />
        </div>

        {/* Sports Arena (6 Columns) */}
        <div className="lg:col-span-6">
          <CategoryNewsSection
            category={sportsCategory}
            title="खेल जगत"
            articles={sportsStories}
            layout="split"
          />
        </div>
      </div>

      {/* 5. MULTIMEDIA & VIDEO NEWS (Azaad Video Prime with YouTube Player) */}
      <VideoNewsSection
        videoArticles={videoStories}
        title="आज़ाद वीडियो प्राइम • स्पेशल वीडियो रिपोर्ट्स"
      />

      {/* 6. LATEST NEWS GRID (ताज़ा खबरें - 8 Cards in Reverse Chronological Order) */}
      <LatestNewsSection articles={latestStories} />

      {/* 7. FACT CHECK DESK & EDITORIAL OPINIONS (Two-Pillar Row) */}
      <FactCheckAndOpinions />

      {/* 8. PHOTO GALLERY SPOTLIGHT (तस्वीरों में आज का भारत) */}
      <PhotoGallerySection />

      {/* 9. MOST READ POPULAR STORIES (सबसे ज्यादा पढ़ी गई खबरें) */}
      <MostReadSection articles={mostReadStories} />

      {/* 10. SOCIAL MEDIA ENGAGEMENT & MORNING NEWSLETTER STRIP */}
      <SocialMediaSection />
    </Container>
  );
}

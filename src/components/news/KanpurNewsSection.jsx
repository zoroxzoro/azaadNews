import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Newspaper } from 'lucide-react';
import SectionHeading from '../common/SectionHeading';
import NewsCard from './NewsCard';
import CompactNewsCard from './CompactNewsCard';
import NewsSkeleton from './NewsSkeleton';

/**
 * KanpurNewsSection component
 * Dedicated high-impact editorial showcase for Kanpur local news (8,528+ archive articles).
 * Preserves Google Stitch broadsheet aesthetic with a dominant local lead and supporting local wire.
 */
export default function KanpurNewsSection({
  articles = [],
  isLoading = false,
  error = null,
  className = '',
}) {
  const leadStory = articles[0];
  const subStories = articles.slice(1, 5);

  return (
    <section
      className={`bg-paper-canvas p-3 sm:p-5 lg:p-6 border border-border-rule transition-colors shadow-xs ${className}`}
      aria-label="कानपुर समाचार कवरेज"
    >
      {/* Broadsheet Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-border-heavy pb-2.5 mb-4 gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 bg-primary-container inline-block shrink-0"></span>
          <div>
            <h2 className="font-mukta text-xl md:text-2xl font-bold text-on-surface leading-tight flex items-center gap-2">
              <span>कानपुर नगर व देहात • लोकल महाकवरेज</span>
            </h2>
          </div>
        </div>

        <Link
          to="/category/kanpur"
          className="inline-flex items-center gap-1 font-inter text-xs font-bold text-primary-container hover:text-primary transition-colors group shrink-0"
        >
          <span>सभी कानपुर खबरें देखें</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NewsSkeleton count={4} />
        </div>
      )}

      {/* Error / Empty State */}
      {!isLoading && (!articles || articles.length === 0) && (
        <div className="bg-paper-tint border border-dashed border-border-heavy p-8 text-center flex flex-col items-center justify-center my-2">
          <MapPin className="w-8 h-8 text-secondary/60 mb-2" />
          <h4 className="font-mukta text-base sm:text-lg font-bold text-on-surface">
            कानपुर से संबंधित ताज़ा समाचार लोड किए जा रहे हैं
          </h4>
          <Link
            to="/category/kanpur"
            className="mt-3 px-3.5 py-1.5 bg-primary-container text-white font-mukta font-bold text-xs hover:bg-primary transition-colors"
          >
            कानपुर आर्काइव ब्राउज़ करें
          </Link>
        </div>
      )}

      {/* Editorial Grid: 1 Dominant Story (6 Cols) + 4 Supporting Stories (6 Cols) */}
      {!isLoading && articles.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Dominant Local Story */}
          {leadStory && (
            <div className="lg:col-span-6 flex flex-col justify-between">
              <NewsCard
                article={leadStory}
                variant="horizontal"
                showSummary={true}
                aspectRatio="aspect-[16/10]"
                className="h-full"
              />
            </div>
          )}

          {/* 4 Supporting Local Wire Stories in 2x2 Grid */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {subStories.map((story) => (
              <CompactNewsCard
                key={story.id}
                article={story}
                showImage={true}
                imagePosition="left"
                imageSize="w-24 h-20"
                className="bg-paper-tint p-2.5 border border-border-rule shadow-2xs hover:border-primary-container/40 transition-colors"
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

import React from 'react';
import SectionHeading from '../common/SectionHeading';
import NewsCard from './NewsCard';
import CompactNewsCard from './CompactNewsCard';

/**
 * CategoryNewsSection component
 * Reusable editorial block for category-specific feeds
 */
export default function CategoryNewsSection({
  category,
  title,
  icon,
  articles = [],
  viewAllLink,
  layout = 'split', // 'split' (1 large + 3 small) | 'grid' (4 cards)
  className = '',
}) {
  const displayTitle = title || category?.nameHindi || 'श्रेणी';
  const categorySlug = category?.slug || 'national';
  const targetLink = viewAllLink || `/category/${categorySlug}`;

  if (!articles || articles.length === 0) return null;

  const leadStory = articles[0];
  const subStories = articles.slice(1, 4);

  return (
    <section className={`bg-paper-canvas p-3 sm:p-5 border-t-2 border-border-heavy flex flex-col gap-4 shadow-xs ${className}`}>
      <SectionHeading
        title={displayTitle}
        viewAllLink={targetLink}
        viewAllText={`सभी ${displayTitle}`}
        accentColor="bg-primary-container"
        className="mb-0"
      />

      {layout === 'split' ? (
        <div className="flex flex-col gap-4">
          {/* Prominent Lead Category Card */}
          {leadStory && (
            <NewsCard
              article={leadStory}
              variant="horizontal"
              showSummary={true}
            />
          )}

          {/* 3 Horizontal Snippets */}
          <div className="flex flex-col divide-y divide-border-rule">
            {subStories.map((story) => (
              <CompactNewsCard
                key={story.id}
                article={story}
                showImage={true}
                imagePosition="right"
                imageSize="w-20 h-16"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {articles.slice(0, 4).map((story) => (
            <NewsCard key={story.id} article={story} showSummary={false} />
          ))}
        </div>
      )}
    </section>
  );
}

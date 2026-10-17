import React from 'react';
import SectionHeading from '../common/SectionHeading';
import NewsCard from './NewsCard';

/**
 * LatestNewsSection component
 * Reverse-chronological feed of the freshest reports
 */
export default function LatestNewsSection({
  articles = [],
  title = 'ताज़ा खबरें',
  viewAllLink = '/category/latest',
  className = '',
}) {
  return (
    <section className={`bg-paper-canvas p-3 sm:p-5 lg:p-6 border border-border-rule transition-colors shadow-xs ${className}`}>
      <SectionHeading
        title={title}
        viewAllLink={viewAllLink}
        viewAllText="सभी ताज़ा खबरें देखें"
        badgeText="लाइव फीड"
        accentColor="bg-primary-container"
      />

      {/* Grid: 4 columns on desktop, 2 on tablet, 1 on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {articles.slice(0, 8).map((article, idx) => (
          <NewsCard
            key={article.id || idx}
            article={article}
            showSummary={true}
            aspectRatio="aspect-[16/10]"
          />
        ))}
      </div>
    </section>
  );
}

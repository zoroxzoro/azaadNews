import React from 'react';
import { Link } from 'react-router-dom';
import FeaturedNewsCard from './FeaturedNewsCard';
import TrendingNewsSidebar from './TrendingNewsSidebar';
import SectionHeading from '../common/SectionHeading';

/**
 * HeroNewsSection component
 * 3-column broadsheet editorial hero package:
 * - Col 1 (6 cols): Primary dominant lead package
 * - Col 2 (3 cols): 3 stacked secondary packages
 * - Col 3 (3 cols): Numbered trending index + sponsored block
 */
export default function HeroNewsSection({
  leadStory,
  secondaryStories = [],
  trendingStories = [],
  className = '',
}) {
  return (
    <section className={`bg-paper-canvas p-3 sm:p-5 lg:p-6 border border-border-rule transition-colors shadow-xs ${className}`}>
      <SectionHeading
        title="प्रमुख समाचार एवं महाविश्लेषण"
        subtitle="संपादकीय डेस्क • नई दिल्ली"
        badgeText="आज की बड़ी खबरें"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Left Column: Dominant Lead Story (6 Cols) */}
        <div className="lg:col-span-6">
          <FeaturedNewsCard article={leadStory} />
        </div>

        {/* Center Column: Secondary Major Packages (3 Cols) */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 divide-y sm:divide-y-0 lg:divide-y divide-border-rule">
          {secondaryStories.slice(0, 3).map((story, idx) => (
            <article key={story.id || idx} className="pt-3 sm:pt-0 lg:pt-3 first:pt-0 group">
              <div className="overflow-hidden aspect-video bg-surface-container mb-2 relative">
                <img
                  src={story.featuredImage}
                  alt={story.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 bg-[#1A1A1A] text-white font-inter text-[9px] sm:text-[10px] uppercase font-bold px-1.5 py-0.5 shadow-xs">
                  {story.category}
                </span>
              </div>

              <Link to={`/news/${story.slug}`}>
                <h3 className="font-mukta text-sm sm:text-base font-bold text-on-surface leading-snug group-hover:text-primary-container transition-colors line-clamp-2">
                  {story.title}
                </h3>
              </Link>

              {story.summary && (
                <p className="font-inter text-[11px] sm:text-xs text-secondary mt-1 line-clamp-2 leading-relaxed">
                  {story.summary}
                </p>
              )}

              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-secondary font-inter mt-2 pt-1.5 border-t border-border-rule/60">
                <span className="text-primary-container font-semibold truncate">
                  {story.author?.name || 'संवाददाता'}
                </span>
                <span>{story.readTime || '3 मिनट'}</span>
              </div>
            </article>
          ))}
        </div>

        {/* Right Column: Trending Desk & Ad (3 Cols) */}
        <div className="lg:col-span-3">
          <TrendingNewsSidebar stories={trendingStories} />
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, TrendingUp } from 'lucide-react';
import SectionHeading from '../common/SectionHeading';

/**
 * MostReadSection component
 * Displays high-engagement popular news ranked 01 to 05 with thumbnails
 */
export default function MostReadSection({
  articles = [],
  title = 'सबसे ज्यादा पढ़ी गई खबरें',
  className = '',
}) {
  const displayArticles = articles.slice(0, 5);

  return (
    <section className={`bg-paper-canvas p-3 sm:p-5 lg:p-6 border border-border-rule transition-colors shadow-xs ${className}`}>
      <SectionHeading
        title={title}
        badgeText="रीडर चॉइस"
        accentColor="bg-[#10264B]"
        rightContent={
          <span className="hidden sm:flex items-center gap-1 font-inter text-xs text-secondary">
            <TrendingUp className="w-3.5 h-3.5 text-primary-container" />
            24 घंटे के सर्वाधिक लोकप्रिय लेख
          </span>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {displayArticles.map((story, index) => (
          <article
            key={story.id || index}
            className="bg-paper-tint p-3 border border-border-rule flex flex-col justify-between group relative"
          >
            <div>
              {/* Rank Badge */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-mukta text-2xl font-black text-primary-container leading-none">
                  0{index + 1}
                </span>
                {story.category && (
                  <span className="font-inter text-[9px] uppercase font-bold text-secondary bg-surface-container px-1.5 py-0.5">
                    {story.category}
                  </span>
                )}
              </div>

              {/* Image */}
              {story.featuredImage && (
                <div className="aspect-[16/10] overflow-hidden mb-2 relative bg-surface-container">
                  <img
                    src={story.featuredImage}
                    alt={story.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              {/* Title */}
              <Link to={`/news/${story.slug}`}>
                <h4 className="font-mukta text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary-container transition-colors line-clamp-2 leading-snug">
                  {story.title}
                </h4>
              </Link>
            </div>

            {/* Readership count */}
            <div className="mt-3 pt-2 border-t border-border-rule flex items-center justify-between font-inter text-[10px] text-secondary">
              <span className="flex items-center gap-1 text-primary-container font-semibold">
                <Eye className="w-3 h-3" />
                {(story.views || 10000).toLocaleString('hi-IN')}
              </span>
              <span>{story.readTime || '3 मिनट'}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

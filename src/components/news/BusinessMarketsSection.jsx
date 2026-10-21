import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Briefcase } from 'lucide-react';
import NewsCard from './NewsCard';
import { formatRelativeTime } from '../../utils/timezoneUtils';

export default function BusinessMarketsSection({ articles = [], className = '' }) {
  const featuredArticle = articles[0];
  const listArticles = articles.slice(1, 4);

  return (
    <section className={`bg-paper-canvas p-3 sm:p-5 border-t-2 border-border-heavy flex flex-col gap-4 shadow-xs ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-rule pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#0d7377] inline-block"></span>
          <h3 className="font-mukta text-lg sm:text-xl font-bold text-on-surface">
            बिज़नेस व अर्थव्यवस्था
          </h3>
        </div>
        <Link
          to="/category/business"
          className="text-primary-container font-inter text-xs font-bold hover:underline flex items-center gap-0.5"
        >
          <span>सभी बिज़नेस खबरें</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="bg-paper-tint border border-dashed border-border-heavy p-6 text-center text-secondary font-mukta text-xs flex flex-col items-center justify-center">
          <Briefcase className="w-6 h-6 text-secondary/60 mb-1" />
          <span>बिज़नेस व वाणिज्य समाचार लोड किए जा रहे हैं...</span>
        </div>
      ) : (
        <>
          {/* Featured Business Story (Horizontal Card) */}
          {featuredArticle && (
            <NewsCard
              article={featuredArticle}
              variant="horizontal"
              showSummary={true}
            />
          )}

          {/* 3 Horizontal Sub-Stories */}
          {listArticles.length > 0 && (
            <div className="flex flex-col divide-y divide-border-rule">
              {listArticles.map((story) => (
                <article key={story.id} className="py-2.5 flex items-center justify-between gap-3 group">
                  <div className="flex flex-col min-w-0">
                    <span className="font-inter text-[10px] text-primary-container font-bold uppercase">
                      {story.category || 'बिज़नेस'}
                    </span>
                    <Link
                      to={`/news/${story.slug}`}
                      className="font-mukta text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary-container transition-colors leading-snug line-clamp-2"
                    >
                      {story.title}
                    </Link>
                    <span className="font-inter text-[10px] text-secondary mt-1">
                      {story.author?.name || 'वाणिज्य संवाददाता'} • {formatRelativeTime(story.publishedAt || story.createdAt) || story.readTime || 'ताज़ा'}
                    </span>
                  </div>
                  {story.featuredImage && (
                    <div className="w-16 sm:w-20 h-14 bg-surface-container shrink-0 overflow-hidden">
                      <img
                        src={story.featuredImage}
                        alt={story.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

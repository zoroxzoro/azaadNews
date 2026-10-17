import React from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

/**
 * RelatedNews component
 * Bottom 4-column card grid showcasing related articles from the same category/desk
 */
export default function RelatedNews({ currentArticle, allArticles = [], className = '' }) {
  if (!currentArticle) return null;

  // Find articles in the same category or shared tags, excluding current
  const related = allArticles
    .filter((a) => a.id !== currentArticle.id)
    .sort((a, b) => {
      // Prioritize same category
      if (a.category === currentArticle.category && b.category !== currentArticle.category) return -1;
      if (b.category === currentArticle.category && a.category !== currentArticle.category) return 1;
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    })
    .slice(0, 4);

  if (related.length === 0) return null;

  return (
    <section className={`w-full bg-paper-tint border-t-2 border-border-heavy py-8 mt-10 ${className}`}>
      <div className="flex flex-col gap-5">
        {/* Section Heading */}
        <div className="flex items-center justify-between border-b border-border-rule pb-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-primary-container" />
            <h3 className="font-mukta text-xl font-bold text-on-surface">
              संबंधित खबरें (Related Stories)
            </h3>
          </div>
          <span className="font-inter text-xs text-secondary font-medium">
            नीति एवं उद्योग डेस्क
          </span>
        </div>

        {/* 4 Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {related.map((story) => (
            <article
              key={story.id}
              className="bg-paper-canvas border border-border-rule p-3 flex flex-col justify-between group shadow-xs"
            >
              <div>
                <div className="w-full aspect-[16/10] bg-surface-container overflow-hidden relative mb-2.5">
                  <img
                    src={story.featuredImage}
                    alt={story.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-1 left-1 bg-black/85 text-white font-inter text-[9px] uppercase px-1.5 py-0.5">
                    {story.category}
                  </span>
                </div>

                <Link to={`/news/${story.slug}`}>
                  <h4 className="font-mukta text-sm font-bold text-on-surface group-hover:text-primary-container transition-colors line-clamp-2 leading-snug">
                    {story.title}
                  </h4>
                </Link>
              </div>

              <div className="mt-3 pt-2 border-t border-border-rule flex items-center justify-between font-inter text-[10px] text-secondary">
                <span>{story.author?.name || 'संवाददाता'}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {story.readTime || '3 मिनट'}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

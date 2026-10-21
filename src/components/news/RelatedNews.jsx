import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Newspaper } from 'lucide-react';
import { getCategoryBySlug } from '../../data/categories';
import { formatRelativeTime } from '../../utils/timezoneUtils';

/**
 * RelatedNews Component
 * Bottom 4-column broadsheet card grid showcasing related articles:
 * - Prioritizes shared categories and recent published articles
 * - Strict deduplication and exclusion of current article
 * - Full historical archive compatibility
 * - Hindi category names and clean image fallback
 */
export default function RelatedNews({ currentArticle, allArticles = [], className = '' }) {
  if (!currentArticle) return null;

  // Primary category Hindi resolution
  const primaryCatSlug = currentArticle.categories?.[0]?.slug || currentArticle.category || 'national';
  const categoryConfig = getCategoryBySlug(primaryCatSlug);
  const categoryDisplayName =
    currentArticle.categories?.[0]?.nameHindi ||
    currentArticle.categories?.[0]?.name ||
    categoryConfig?.nameHindi ||
    categoryConfig?.name ||
    'विशेष';

  // Strict deduplication & filter out current article
  const seenIds = new Set([currentArticle.id]);
  const related = [];

  for (const item of allArticles) {
    if (item && item.id && !seenIds.has(item.id)) {
      seenIds.add(item.id);
      related.push(item);
      if (related.length >= 4) break;
    }
  }

  if (related.length === 0) return null;

  return (
    <section className={`w-full bg-paper-tint border-t-2 border-border-heavy py-8 mt-10 font-inter ${className}`}>
      <div className="flex flex-col gap-5">
        {/* Section Heading */}
        <div className="flex items-center justify-between border-b border-border-rule pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-primary-container inline-block shrink-0" />
            <h3 className="font-mukta text-xl sm:text-2xl font-bold text-on-surface">
              संबंधित खबरें (Related Stories)
            </h3>
          </div>
          <span className="font-inter text-xs text-secondary font-semibold">
            {categoryDisplayName} डेस्क
          </span>
        </div>

        {/* 4 Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {related.map((story) => {
            const storyCatSlug = story.categories?.[0]?.slug || story.category || primaryCatSlug;
            const storyCatConfig = getCategoryBySlug(storyCatSlug);
            const storyCatName =
              story.categories?.[0]?.nameHindi ||
              story.categories?.[0]?.name ||
              storyCatConfig?.nameHindi ||
              storyCatConfig?.name ||
              categoryDisplayName;

            return (
              <article
                key={story.id}
                className="bg-paper-canvas border border-border-rule p-3 flex flex-col justify-between group shadow-xs hover:border-border-heavy transition-all"
              >
                <div>
                  <div className="w-full aspect-[16/10] bg-surface-container overflow-hidden relative mb-2.5 border border-border-rule/60">
                    {story.featuredImage ? (
                      <img
                        src={story.featuredImage}
                        alt={story.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-paper-tint flex flex-col items-center justify-center p-2 text-center">
                        <Newspaper className="w-5 h-5 text-primary-container mb-1" />
                        <span className="text-[10px] font-mukta text-secondary font-bold">आज़ाद समाचार</span>
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 bg-black/85 text-white font-inter text-[9px] uppercase font-semibold px-1.5 py-0.5">
                      {storyCatName}
                    </span>
                  </div>

                  <Link to={`/news/${story.slug}`}>
                    <h4 className="font-mukta text-sm sm:text-base font-bold text-on-surface group-hover:text-primary-container transition-colors line-clamp-2 leading-snug">
                      {story.title}
                    </h4>
                  </Link>

                  {story.summary && (
                    <p className="font-inter text-xs text-secondary line-clamp-2 mt-1 leading-relaxed">
                      {story.summary}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-border-rule flex items-center justify-between font-inter text-[11px] text-secondary">
                  <span className="truncate max-w-[120px] font-medium text-on-surface/80">
                    {story.author?.name || 'आज़ाद ब्यूरो'}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3 text-secondary" />
                    <span>{formatRelativeTime(story.publishedAt || story.createdAt) || story.readTime || 'ताज़ा'}</span>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

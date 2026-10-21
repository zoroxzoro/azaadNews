import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Newspaper } from 'lucide-react';

/**
 * ArticleNavigation Component
 * Broadsheet adjacent story switcher:
 * - Provides previous and next article navigation links with real headlines & thumbnails
 * - Fully responsive with high-contrast touch targets
 * - Graceful fallback when navigating from the earliest or newest publication
 */
export default function ArticleNavigation({ prevArticle, nextArticle, className = '' }) {
  if (!prevArticle && !nextArticle) return null;

  return (
    <nav
      aria-label="अगली व पिछली खबरें"
      className={`w-full my-8 py-5 border-y-2 border-border-rule font-inter ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* PREVIOUS ARTICLE */}
        {prevArticle ? (
          <Link
            to={`/news/${prevArticle.slug}`}
            className="group flex items-start gap-3.5 p-3.5 bg-paper-canvas hover:bg-paper-tint border border-border-rule hover:border-border-heavy transition-all shadow-2xs"
          >
            <div className="w-8 h-8 rounded-full bg-paper-tint border border-border-rule flex items-center justify-center shrink-0 text-primary-container group-hover:bg-primary-container group-hover:text-white transition-colors mt-0.5">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block font-inter text-[11px] font-bold uppercase tracking-wider text-secondary mb-1">
                ← पिछली खबर ({prevArticle.categoryName || 'समाचार'})
              </span>
              <h4 className="font-mukta text-sm sm:text-base font-bold text-on-surface group-hover:text-primary-container transition-colors line-clamp-2 leading-snug">
                {prevArticle.title}
              </h4>
            </div>
            {prevArticle.featuredImage && (
              <div className="w-16 h-12 bg-surface-container shrink-0 overflow-hidden border border-border-rule hidden xs:block">
                <img
                  src={prevArticle.featuredImage}
                  alt={prevArticle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              </div>
            )}
          </Link>
        ) : (
          <div className="p-3.5 bg-paper-tint/50 border border-dashed border-border-rule/80 flex items-center justify-center text-secondary text-xs font-inter italic">
            <span>यह इस श्रृंखला की सबसे पहली खबर है</span>
          </div>
        )}

        {/* NEXT ARTICLE */}
        {nextArticle ? (
          <Link
            to={`/news/${nextArticle.slug}`}
            className="group flex items-start justify-between gap-3.5 p-3.5 bg-paper-canvas hover:bg-paper-tint border border-border-rule hover:border-border-heavy transition-all shadow-2xs text-right sm:text-left"
          >
            {nextArticle.featuredImage && (
              <div className="w-16 h-12 bg-surface-container shrink-0 overflow-hidden border border-border-rule hidden xs:block order-2 sm:order-1">
                <img
                  src={nextArticle.featuredImage}
                  alt={nextArticle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              </div>
            )}
            <div className="flex-1 min-w-0 order-1 sm:order-2">
              <span className="block font-inter text-[11px] font-bold uppercase tracking-wider text-secondary mb-1">
                अगली खबर ({nextArticle.categoryName || 'समाचार'}) →
              </span>
              <h4 className="font-mukta text-sm sm:text-base font-bold text-on-surface group-hover:text-primary-container transition-colors line-clamp-2 leading-snug">
                {nextArticle.title}
              </h4>
            </div>
            <div className="w-8 h-8 rounded-full bg-paper-tint border border-border-rule flex items-center justify-center shrink-0 text-primary-container group-hover:bg-primary-container group-hover:text-white transition-colors mt-0.5 order-3">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ) : (
          <div className="p-3.5 bg-paper-tint/50 border border-dashed border-border-rule/80 flex items-center justify-center text-secondary text-xs font-inter italic">
            <span>यह इस श्रृंखला की नवीनतम प्रकाशित खबर है</span>
          </div>
        )}
      </div>
    </nav>
  );
}

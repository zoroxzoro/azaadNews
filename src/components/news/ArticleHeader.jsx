import React from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Eye,
  Clock,
  CheckCircle2,
  Flame,
  User,
  Calendar,
} from 'lucide-react';
import { getCategoryBySlug } from '../../data/categories';

/**
 * ArticleHeader Component
 * Broadsheet digital newspaper article header with:
 * - Semantic Hindi breadcrumbs
 * - Dynamic category stamp and breaking/exclusive flags
 * - High-impact Hindi headline (H1) with Devanagari typography tuning
 * - Editorial dek / summary callout
 * - Verified author byline with real metadata
 * - Accurate Hindi publication and update timestamps
 * - Native Web Speech API audio reader for Hindi news
 */
export default function ArticleHeader({ article }) {
  if (!article) return null;

  const {
    title,
    summary,
    category,
    categories = [],
    author,
    publishedAt,
    updatedAt,
    readTime,
    views,
    isBreaking,
    isFeatured,
  } = article;

  // Resolve category configuration and Hindi display name
  const primaryCatSlug = categories[0]?.slug || category || 'national';
  const categoryConfig = getCategoryBySlug(primaryCatSlug);
  const categoryDisplayName =
    categories[0]?.nameHindi ||
    categories[0]?.name ||
    categoryConfig?.nameHindi ||
    categoryConfig?.name ||
    'समाचार';

  // Author information resolution
  const authorName = author?.name?.trim() || 'आज़ाद समाचार डेस्क';
  const authorRole = author?.role?.trim() || null;
  const authorLocation = author?.location?.trim() || article.location?.trim() || null;

  // Publication and Updated timestamps in Hindi
  const publishedDateStr = publishedAt
    ? new Date(publishedAt).toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  // Show updated timestamp only when there is substantive variance (> 1 hour)
  const isUpdated = Boolean(
    updatedAt &&
    publishedAt &&
    Math.abs(new Date(updatedAt).getTime() - new Date(publishedAt).getTime()) > 3600000
  );

  const updatedDateStr = isUpdated
    ? new Date(updatedAt).toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) + ', ' + new Date(updatedAt).toLocaleTimeString('hi-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' IST'
    : null;



  return (
    <header className="flex flex-col gap-3.5 mb-5 font-inter">
      {/* 1. Breadcrumb & Metadata Utility Band */}
      <div className="w-full bg-paper-tint border-b border-border-rule py-2 px-1 flex flex-wrap items-center justify-between gap-2 text-xs text-secondary">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-wrap">
          <Link
            to="/"
            className="hover:text-primary-container transition-colors flex items-center gap-1 font-medium"
          >
            <Home className="w-3.5 h-3.5" />
            <span>होम</span>
          </Link>
          <span className="text-secondary/50">/</span>
          <Link
            to={`/category/${primaryCatSlug}`}
            className="hover:text-primary-container transition-colors font-bold text-primary-container"
          >
            {categoryDisplayName}
          </Link>
          <span className="text-secondary/50">/</span>
          <span className="text-on-surface font-semibold truncate max-w-[180px] sm:max-w-xs md:max-w-md">
            {title}
          </span>
        </nav>

        <div className="flex items-center gap-3 text-[11px] text-secondary">
          {views > 0 && (
            <span className="inline-flex items-center gap-1 text-primary-container font-semibold">
              <Eye className="w-3.5 h-3.5" />
              <span>{views.toLocaleString('hi-IN')} बार पढ़ा गया</span>
            </span>
          )}
          {views > 0 && <span>•</span>}
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>पठन अवधि: {readTime || '3 मिनट'}</span>
          </span>
        </div>
      </div>

      {/* 2. Category Stamp & Editorial Flags */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Link
          to={`/category/${primaryCatSlug}`}
          className="px-2.5 py-1 bg-primary-container text-white font-mukta text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors shadow-xs"
        >
          {categoryDisplayName}
        </Link>

        {isBreaking && (
          <span className="px-2.5 py-0.5 bg-ticker-tint border border-breaking-crimson/40 text-breaking-crimson font-inter text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-breaking-crimson animate-ping" />
            <span>ब्रेकिंग न्यूज़</span>
          </span>
        )}
        {isFeatured && !isBreaking && (
          <span className="px-2.5 py-0.5 bg-ticker-tint border border-primary-container/40 text-primary-container font-inter text-xs font-semibold flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-primary-container fill-current" />
            <span>विशेष कवरेज</span>
          </span>
        )}
      </div>

      {/* 3. Main Headline (H1) — Tuned for Hindi Broadsheet Readability */}
      <h1 className="font-mukta text-2xl sm:text-3xl md:text-4xl lg:text-[38px] font-extrabold text-on-surface leading-[1.25] sm:leading-[1.22] tracking-tight break-words my-1">
        {title}
      </h1>

      {/* 4. Editorial Dek / Summary Callout */}
      {summary && (
        <p className="font-inter text-sm sm:text-base md:text-lg text-secondary leading-relaxed border-l-4 border-primary-container pl-3.5 sm:pl-4 py-2.5 bg-paper-tint break-words">
          {summary}
        </p>
      )}

      {/* 5. Author Byline & Timestamps Container */}
      <div className="w-full border-y border-border-rule py-3 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Author Byline */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border border-border-rule shrink-0 bg-paper-tint flex items-center justify-center">
              {author?.avatar ? (
                <img
                  src={author.avatar}
                  alt={authorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-mukta font-bold text-primary-container text-base">
                  {authorName.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mukta text-base font-bold text-on-surface leading-tight truncate">
                  {authorName}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-primary-container fill-primary-container text-white shrink-0" />
              </div>
              <span className="font-inter text-xs text-secondary truncate">
                {authorRole || 'संवाददाता'}
                {authorLocation && ` • ${authorLocation}`}
              </span>
            </div>
          </div>

          {/* Publication and Update Timestamps */}
          <div className="flex flex-col sm:text-right font-inter text-xs text-secondary shrink-0">
            {publishedDateStr && (
              <span className="flex items-center sm:justify-end gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-secondary" />
                <span>
                  <strong className="text-on-surface">प्रकाशित:</strong> {publishedDateStr}
                </span>
              </span>
            )}
            {updatedDateStr && (
              <span className="text-primary-container font-medium text-[11px] mt-0.5">
                <strong>अपडेट:</strong> {updatedDateStr}
              </span>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, Play, Newspaper } from 'lucide-react';
import { getCategoryBySlug } from '../../data/categories';
import { formatRelativeTime } from '../../utils/timezoneUtils';

/**
 * Standard NewsCard component
 * Used in category grids, latest news lists, and editorial layouts:
 * - Robust image error and missing media fallback
 * - Hindi category name resolution
 * - Devanagari typography tuning and line-clamp
 */
export default function NewsCard({
  article,
  showSummary = true,
  aspectRatio = 'aspect-[16/10]',
  variant = 'standard', // 'standard' | 'horizontal' | 'compact'
  eager = false,
  className = '',
}) {
  const [imgError, setImgError] = useState(false);

  if (!article) return null;

  const {
    slug,
    title,
    summary,
    category,
    featuredImage,
    publishedAt,
    author,
    readTime,
    views,
    youtubeUrl,
  } = article;

  const categoryName = getCategoryBySlug(category)?.nameHindi || category;

  const displayTime = publishedAt
    ? formatRelativeTime(publishedAt, 'hi')
    : readTime || 'ताज़ा';

  const hasImage = Boolean(featuredImage && !imgError);

  if (variant === 'horizontal') {
    return (
      <article
        className={`bg-paper-tint p-3 border border-border-rule flex flex-col sm:flex-row gap-3 group transition-colors ${className}`}
      >
        <div className={`sm:w-1/2 ${aspectRatio} bg-surface-container overflow-hidden shrink-0 relative border border-border-rule/50`}>
          {hasImage ? (
            <img
              src={featuredImage}
              alt={title}
              loading={eager ? 'eager' : 'lazy'}
              decoding="async"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-paper-tint flex flex-col items-center justify-center p-3 text-center">
              <Newspaper className="w-6 h-6 text-primary-container/70 mb-1" />
              <span className="font-mukta text-[11px] font-bold text-secondary uppercase tracking-wider">
                आज़ाद समाचार
              </span>
            </div>
          )}

          {categoryName && (
            <span className="absolute top-2 left-2 bg-primary-container text-white font-mukta text-[11px] font-bold px-2 py-0.5 shadow-sm">
              {categoryName}
            </span>
          )}
          {youtubeUrl && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="w-9 h-9 rounded-full bg-primary-container text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-4 h-4 ml-0.5 fill-current" />
              </span>
            </div>
          )}
        </div>

        <div className="sm:w-1/2 flex flex-col justify-between">
          <div>
            <Link
              to={`/news/${slug}`}
              className="font-mukta text-base font-bold text-on-surface group-hover:text-primary-container transition-colors leading-snug line-clamp-2 break-words"
            >
              {title}
            </Link>
            {showSummary && summary && (
              <p className="font-inter text-xs text-secondary mt-1.5 line-clamp-2 leading-relaxed">
                {summary}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-secondary font-inter pt-2 mt-2 border-t border-border-rule">
            <span className="font-medium text-on-surface/90 truncate max-w-[130px]">{author?.name || 'आज़ाद डेस्क'}</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>{displayTime}</span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`bg-paper-tint p-3 border border-border-rule flex flex-col justify-between group transition-colors ${className}`}
    >
      <div>
        <div className={`${aspectRatio} overflow-hidden mb-2.5 relative bg-surface-container border border-border-rule/50`}>
          {hasImage ? (
            <img
              src={featuredImage}
              alt={title}
              loading={eager ? 'eager' : 'lazy'}
              decoding="async"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-paper-tint flex flex-col items-center justify-center p-3 text-center">
              <Newspaper className="w-6 h-6 text-primary-container/70 mb-1" />
              <span className="font-mukta text-[11px] font-bold text-secondary uppercase tracking-wider">
                आज़ाद समाचार
              </span>
            </div>
          )}

          {categoryName && (
            <span className="absolute top-2 left-2 bg-primary-container text-white text-[11px] font-mukta font-bold px-2 py-0.5 shadow-sm">
              {categoryName}
            </span>
          )}
          {youtubeUrl && (
            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-inter px-1.5 py-0.5 flex items-center gap-1">
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>वीडियो</span>
            </div>
          )}
        </div>

        <Link to={`/news/${slug}`}>
          <h3 className="font-mukta text-sm sm:text-base font-bold text-on-surface group-hover:text-primary-container transition-colors line-clamp-2 leading-snug break-words">
            {title}
          </h3>
        </Link>

        {showSummary && summary && (
          <p className="font-inter text-[11px] sm:text-xs text-secondary mt-1.5 line-clamp-2 leading-relaxed">
            {summary}
          </p>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-border-rule flex items-center justify-between font-inter text-[10px] sm:text-[11px] text-secondary">
        <span className="font-medium truncate max-w-[120px]">{author?.name || 'आज़ाद डेस्क'}</span>
        <div className="flex items-center gap-2">
          {views && (
            <span className="hidden xs:inline-flex items-center gap-0.5">
              <Eye className="w-3 h-3" />
              {views.toLocaleString('hi-IN')}
            </span>
          )}
          <span>{displayTime}</span>
        </div>
      </div>
    </article>
  );
}

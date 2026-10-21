import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import { getCategoryBySlug } from '../../data/categories';
import { formatRelativeTime } from '../../utils/timezoneUtils';

/**
 * CompactNewsCard component
 * Used in secondary stacks, sidebars, and dense newspaper lists:
 * - Robust image error handling and missing media fallback
 * - Hindi category name resolution
 * - Accessible link labels and Devanagari typography
 */
export default function CompactNewsCard({
  article,
  rank,
  showImage = true,
  imagePosition = 'right',
  imageSize = 'w-20 h-16',
  className = '',
}) {
  const [imgError, setImgError] = useState(false);

  if (!article) return null;

  const {
    slug,
    title,
    category,
    featuredImage,
    publishedAt,
    author,
    readTime,
    views,
  } = article;

  const categoryName = getCategoryBySlug(category)?.nameHindi || category;

  const displayTime = publishedAt
    ? formatRelativeTime(publishedAt, 'hi')
    : readTime || 'ताज़ा';

  const hasImage = Boolean(featuredImage && !imgError);

  const imageElement = (
    <div className={`${imageSize} bg-surface-container shrink-0 overflow-hidden relative border border-border-rule/40`}>
      {hasImage ? (
        <img
          src={featuredImage}
          alt={title}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full bg-paper-tint flex items-center justify-center">
          <Newspaper className="w-4 h-4 text-secondary/60" />
        </div>
      )}
    </div>
  );

  return (
    <article
      className={`group flex items-start gap-3 py-2.5 transition-colors ${className}`}
    >
      {rank !== undefined && (
        <span className="font-mukta text-xl sm:text-2xl font-black text-primary-container/40 leading-none shrink-0 w-6 pt-0.5">
          {typeof rank === 'number' && rank < 10 ? `0${rank}` : rank}
        </span>
      )}

      {showImage && imagePosition === 'left' && imageElement}

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {categoryName && (
          <span className="font-mukta text-[11px] font-bold text-primary-container uppercase tracking-wider block">
            {categoryName}
          </span>
        )}

        <Link
          to={`/news/${slug}`}
          className="font-mukta text-sm font-bold text-on-surface group-hover:text-primary-container transition-colors leading-snug line-clamp-2 mt-0.5 break-words"
        >
          {title}
        </Link>

        <div className="flex items-center gap-2 mt-1 font-inter text-[10px] text-secondary">
          {author?.name && <span className="font-medium text-on-surface/80 truncate max-w-[100px]">{author.name}</span>}
          {author?.name && <span>•</span>}
          <span>{displayTime}</span>
          {views && (
            <>
              <span>•</span>
              <span>{views.toLocaleString('hi-IN')} व्यूज</span>
            </>
          )}
        </div>
      </div>

      {showImage && imagePosition === 'right' && imageElement}
    </article>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * CompactNewsCard component
 * Used in secondary stacks, sidebars, and dense newspaper lists.
 */
export default function CompactNewsCard({
  article,
  rank,
  showImage = true,
  imagePosition = 'right',
  imageSize = 'w-20 h-16',
  className = '',
}) {
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

  const formattedTime = publishedAt
    ? new Date(publishedAt).toLocaleTimeString('hi-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <article
      className={`group flex items-start gap-3 py-2.5 transition-colors ${className}`}
    >
      {rank !== undefined && (
        <span className="font-mukta text-xl sm:text-2xl font-black text-primary-container/40 leading-none shrink-0 w-6">
          {typeof rank === 'number' && rank < 10 ? `0${rank}` : rank}
        </span>
      )}

      {showImage && imagePosition === 'left' && featuredImage && (
        <div className={`${imageSize} bg-surface-container shrink-0 overflow-hidden relative`}>
          <img
            src={featuredImage}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {category && (
          <span className="font-inter text-[10px] font-bold text-primary-container uppercase tracking-wider">
            {category}
          </span>
        )}

        <Link
          to={`/news/${slug}`}
          className="font-mukta text-sm font-bold text-on-surface group-hover:text-primary-container transition-colors leading-snug line-clamp-2 mt-0.5"
        >
          {title}
        </Link>

        <div className="flex items-center gap-2 mt-1 font-inter text-[10px] text-secondary">
          {author?.name && <span className="font-medium text-on-surface/80">{author.name}</span>}
          {author?.name && <span>•</span>}
          {author?.location && <span>{author.location}</span>}
          {author?.location && <span>•</span>}
          <span>{readTime || formattedTime || 'ताज़ा'}</span>
          {views && (
            <>
              <span>•</span>
              <span>{views.toLocaleString('hi-IN')} व्यूज</span>
            </>
          )}
        </div>
      </div>

      {showImage && imagePosition === 'right' && featuredImage && (
        <div className={`${imageSize} bg-surface-container shrink-0 overflow-hidden relative`}>
          <img
            src={featuredImage}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
    </article>
  );
}

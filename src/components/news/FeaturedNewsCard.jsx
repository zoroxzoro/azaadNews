import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Clock, ChevronRight, Newspaper } from 'lucide-react';
import { getCategoryBySlug } from '../../data/categories';

/**
 * FeaturedNewsCard component
 * The dominant visual anchor card for the homepage hero section:
 * - Robust image error and missing media fallback
 * - Hindi category name resolution
 * - Zero hardcoded semiconductor bullet points or fake image counts
 * - Devanagari typography tuning
 */
export default function FeaturedNewsCard({ article, relatedPoints = [] }) {
  const [imgError, setImgError] = useState(false);

  if (!article) {
    return (
      <div className="flex flex-col gap-2.5 sm:gap-3 animate-pulse" aria-hidden="true">
        <div className="aspect-[16/10] bg-surface-container border border-border-rule/50" />
        <div className="flex flex-col gap-2 pt-1">
          <div className="h-7 sm:h-8 bg-surface-container rounded-xs w-4/5" />
          <div className="h-4 bg-surface-container rounded-xs w-full mt-1" />
          <div className="h-4 bg-surface-container rounded-xs w-2/3" />
          <div className="h-4 bg-surface-container rounded-xs w-1/3 mt-2" />
        </div>
      </div>
    );
  }

  const {
    slug,
    title,
    summary,
    category,
    featuredImage,
    imageCaption,
    author,
    publishedAt,
    readTime,
    views,
  } = article;

  const categoryObj = getCategoryBySlug(category);
  const categoryLabel = categoryObj?.nameHindi || category || 'विशेष रिपोर्ट';

  const hasImage = Boolean(featuredImage && !imgError);

  return (
    <article className="flex flex-col gap-2.5 sm:gap-3 group">
      {/* Visual Image Anchor */}
      <div className="relative overflow-hidden aspect-[16/10] bg-surface-container border border-border-rule/50">
        {hasImage ? (
          <img
            src={featuredImage}
            alt={title}
            loading="eager"
            fetchpriority="high"
            decoding="async"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-paper-tint flex flex-col items-center justify-center p-6 text-center">
            <Newspaper className="w-10 h-10 text-primary-container/80 mb-2" />
            <span className="font-mukta text-sm font-bold text-on-surface uppercase tracking-widest">
              आज़ाद समाचार • डिजिटल अभिलेखागार
            </span>
            <span className="font-inter text-xs text-secondary mt-1">
              संपादकीय विशेष लीड रिपोर्ट
            </span>
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
          <span className="bg-primary-container text-white font-mukta text-[11px] sm:text-xs font-bold px-2.5 py-0.5 tracking-wider uppercase shadow-sm">
            {categoryLabel}
          </span>
          {article.photosCount && (
            <span className="bg-black/75 backdrop-blur-xs text-white font-inter text-[10px] sm:text-xs px-2 py-0.5">
              {article.photosCount} तस्वीरें
            </span>
          )}
        </div>

        {imageCaption && hasImage && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-2.5 sm:p-3 text-white font-inter text-[11px] sm:text-xs">
            {imageCaption}
          </div>
        )}
      </div>

      {/* Editorial Content */}
      <div className="flex flex-col gap-2 pt-1">
        <Link to={`/news/${slug}`}>
          <h1 className="font-mukta text-xl sm:text-2xl lg:text-[28px] font-extrabold text-on-surface leading-snug sm:leading-tight hover:text-primary-container transition-colors break-words">
            {title}
          </h1>
        </Link>

        {summary && (
          <p className="font-inter text-xs sm:text-sm md:text-base text-secondary leading-relaxed line-clamp-3">
            {summary}
          </p>
        )}

        {/* Attribution & Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-rule text-[11px] sm:text-xs text-secondary font-inter">
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface">{author?.name || 'आज़ाद संपादकीय डेस्क'}</span>
            <span>•</span>
            <span>{author?.location || 'कानपुर'}</span>
            {views && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-primary-container font-semibold">
                  <Eye className="w-3.5 h-3.5" />
                  {views.toLocaleString('hi-IN')} पढ़े
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px]">
            <Clock className="w-3 h-3 text-secondary" />
            <span>{readTime || '4 मिनट'}</span>
          </div>
        </div>

        {/* Bulleted Key Takeaways Linked to Story (rendered strictly if present) */}
        {Array.isArray(relatedPoints) && relatedPoints.length > 0 && (
          <div className="bg-paper-tint p-2.5 sm:p-3 border-l-4 border-primary-container flex flex-col gap-1.5 mt-1">
            <span className="font-inter text-[10px] sm:text-[11px] uppercase tracking-wider text-primary-container font-bold">
              संबंधित अहम बिंदु:
            </span>
            <ul className="flex flex-col gap-1 text-xs sm:text-sm font-mukta text-on-surface">
              {relatedPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-primary-container shrink-0 mt-0.5" />
                  <Link
                    to={`/news/${slug}`}
                    className="hover:text-primary-container hover:underline line-clamp-1"
                  >
                    {point}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User, Share2, Bookmark, CheckCircle, Video, Image as ImageIcon, Newspaper } from 'lucide-react';
import { getHighlightedParts } from '../../utils/searchNews';
import { categories } from '../../data/categories';

/**
 * Renders highlighted text where query matches are enclosed in a mark tag
 */
function HighlightedText({ text, query, className = '' }) {
  if (!text) return null;
  const parts = getHighlightedParts(text, query);
  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.isMatch ? (
          <mark
            key={index}
            className="bg-ticker-tint text-breaking-crimson px-1 py-0.5 rounded-none font-bold"
          >
            {part.text}
          </mark>
        ) : (
          part.text
        )
      )}
    </span>
  );
}

export default function SearchResultCard({ article, query = '', isTopMatch = false }) {
  const [imageError, setImageError] = useState(false);

  if (!article) return null;

  const categoryObj = categories.find((c) => c.slug === article.category);
  const categoryLabel = article.categoryNameHindi || categoryObj?.nameHindi || article.category;

  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'हाल ही में';

  const hasImage = Boolean(article.featuredImage) && !imageError;

  return (
    <article
      className={`bg-paper-canvas transition-all duration-200 border border-border-rule group ${
        isTopMatch
          ? 'border-t-4 border-t-primary-container p-4 sm:p-5 shadow-sm'
          : 'p-3.5 sm:p-4.5 hover:border-border-heavy'
      }`}
    >
      {/* Top Meta Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-border-rule text-xs font-inter">
        <div className="flex items-center gap-2 flex-wrap">
          {isTopMatch && (
            <span className="px-2 py-0.5 bg-primary-container text-white text-[10px] font-bold uppercase tracking-wider">
              शीर्ष परिणाम / Top Match
            </span>
          )}
          <span className="font-bold text-on-surface uppercase text-[11px] tracking-wider">
            {categoryLabel}
          </span>
          <span className="text-secondary">•</span>
          <time className="text-secondary text-[11px] flex items-center gap-1">
            <Calendar className="w-3 h-3 text-secondary shrink-0" />
            {formattedDate}
          </time>
          {article.isVerified && (
            <span className="inline-flex items-center gap-0.5 text-accent-verified text-[11px] font-medium">
              <CheckCircle className="w-3 h-3" />
              सत्यापित
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-secondary">
          <span className="text-[11px] font-medium text-breaking-crimson">
            {article.readTime || '3 मिनट पठन'}
          </span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* Text Block */}
        <div className="md:col-span-8 flex flex-col gap-1.5 order-2 md:order-1">
          <Link to={`/news/${article.slug}`}>
            <h2
              className={`font-mukta font-bold text-on-surface group-hover:text-primary-container transition-colors leading-snug break-words [word-break:break-word] ${
                isTopMatch ? 'text-lg sm:text-xl md:text-2xl' : 'text-base sm:text-lg md:text-xl'
              }`}
            >
              <HighlightedText text={article.title} query={query} />
            </h2>
          </Link>

          <p className="font-inter text-xs sm:text-sm text-secondary leading-relaxed line-clamp-2 sm:line-clamp-3 break-words [word-break:break-word]">
            <HighlightedText text={article.summary} query={query} />
          </p>

          {/* Tags preview */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {article.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 bg-paper-tint text-[10px] font-inter text-secondary rounded border border-border-rule"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Author and news desk byline */}
          <div className="flex items-center gap-3 pt-2 text-[11px] font-inter text-secondary border-t border-border-rule/60 mt-1">
            <div className="flex items-center gap-1 font-medium text-on-surface">
              <User className="w-3 h-3 text-primary-container" />
              <span>{article.author?.name || 'आज़ाद ब्यूरो'}</span>
            </div>
            <span>•</span>
            <span>{article.location || 'कानपुर'}</span>
            {article.views && (
              <>
                <span>•</span>
                <span>{article.views.toLocaleString('hi-IN')} देखा गया</span>
              </>
            )}
          </div>
        </div>

        {/* Thumbnail Block */}
        <div className="md:col-span-4 order-1 md:order-2">
          <Link to={`/news/${article.slug}`} className="block overflow-hidden relative group/thumb">
            {hasImage ? (
              <div className="aspect-video sm:aspect-16/10 bg-surface-container overflow-hidden">
                <img
                  src={article.featuredImage}
                  alt={article.title}
                  loading="lazy"
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="aspect-video sm:aspect-16/10 bg-paper-tint border border-border-rule overflow-hidden flex flex-col items-center justify-center p-3 text-secondary text-center group-hover/thumb:bg-paper-subtle transition-colors">
                <Newspaper className="w-8 h-8 text-secondary/60 mb-1" />
                <span className="font-mukta text-xs font-bold text-on-surface line-clamp-1">
                  आज़ाद समाचार
                </span>
                <span className="font-inter text-[10px] text-secondary">
                  {categoryLabel} डेस्क
                </span>
              </div>
            )}
            {article.contentType === 'video' && (
              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-inter flex items-center gap-1 rounded">
                <Video className="w-3 h-3 text-red-500" />
                वीडियो
              </span>
            )}
            {article.contentType === 'photo' && (
              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-inter flex items-center gap-1 rounded">
                <ImageIcon className="w-3 h-3 text-amber-400" />
                गैलरी
              </span>
            )}
          </Link>
        </div>
      </div>
    </article>
  );
}

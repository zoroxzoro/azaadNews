import React, { useState } from 'react';
import { Camera, Info, Newspaper } from 'lucide-react';

/**
 * ArticleHeroImage Component
 * High-performance featured media display:
 * - Fixed 16:9 aspect ratio preventing Cumulative Layout Shift (CLS)
 * - Dignified broadsheet fallback banner for text-only/historical articles with missing media
 * - Real alt text and responsive image rendering
 * - Displays caption and credit strictly when available in database
 * - Zero hardcoded generic badges or fake photo credits
 */
export default function ArticleHeroImage({
  src,
  alt = '',
  caption = '',
  credit = null,
  badgeText = null,
  className = '',
}) {
  const [imgError, setImgError] = useState(false);

  const hasImage = Boolean(src && !imgError);

  if (!hasImage) {
    return (
      <div className={`w-full bg-paper-tint border border-border-rule p-4 sm:p-6 mb-4 text-center rounded-none shadow-2xs ${className}`}>
        <div className="flex items-center justify-center gap-2 text-secondary font-mukta text-xs font-bold uppercase tracking-widest mb-1.5">
          <Newspaper className="w-4 h-4 text-primary-container" />
          <span>आज़ाद समाचार • डिजिटल अभिलेखागार</span>
        </div>
        <p className="font-mukta text-sm sm:text-base font-bold text-on-surface max-w-xl mx-auto leading-snug">
          {alt || 'संपादकीय विशेष रिपोर्ट'}
        </p>
      </div>
    );
  }

  return (
    <figure className={`w-full flex flex-col gap-2 ${className}`}>
      <div className="w-full relative aspect-[16/9] bg-surface-container overflow-hidden border border-border-rule shadow-xs">
        <img
          src={src}
          alt={alt || 'समाचार मुख्य चित्र'}
          loading="eager"
          fetchpriority="high"
          decoding="async"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />

        {badgeText && (
          <span className="absolute bottom-2.5 left-2.5 bg-black/85 backdrop-blur-xs text-white font-inter text-[11px] sm:text-xs px-2.5 py-0.5 flex items-center gap-1.5 shadow-sm">
            <Camera className="w-3.5 h-3.5 text-primary-container" />
            <span>{badgeText}</span>
          </span>
        )}
      </div>

      {(caption || credit) && (
        <figcaption className="font-inter text-xs text-secondary flex items-start gap-1.5 pt-1 px-1 leading-relaxed">
          <Info className="w-3.5 h-3.5 text-primary-container shrink-0 mt-0.5" />
          <span>
            {caption || alt}
            {credit && <span className="font-medium text-on-surface/80 ml-1">({credit})</span>}
          </span>
        </figcaption>
      )}
    </figure>
  );
}

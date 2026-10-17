import React, { useState } from 'react';
import { Camera, Info } from 'lucide-react';

/**
 * ArticleHeroImage component
 * Displays the primary featured visual asset with overlay tags,
 * informative caption, and photo credit.
 */
export default function ArticleHeroImage({
  src,
  alt,
  caption,
  credit = 'पीटीआई / आज़ाद समाचार ब्यूरो',
  badgeText = 'विशेष सत्र कवरेज',
  className = '',
}) {
  const [imgError, setImgError] = useState(false);

  // Fallback placeholder image if src is missing or fails to load
  const fallbackSrc =
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80';

  return (
    <figure className={`w-full flex flex-col gap-2 ${className}`}>
      <div className="w-full relative aspect-[16/9] bg-surface-container overflow-hidden border border-border-rule shadow-xs">
        <img
          src={!imgError && src ? src : fallbackSrc}
          alt={alt || 'समाचार चित्र'}
          loading="eager"
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
          <Info className="w-4 h-4 text-primary-container shrink-0 mt-0.5" />
          <span>
            {caption || alt} {credit && <span className="font-medium text-on-surface/80">({credit})</span>}
          </span>
        </figcaption>
      )}
    </figure>
  );
}

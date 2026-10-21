import React from 'react';
import { Camera, ImageOff, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../../utils/timezoneUtils';

/**
 * PhotoGallerySection component
 * High-visual photo story showcase with genuine Supabase media and working article links.
 * Respects Phase 9 editorial standards: zero hardcoded mock photos or fake slugs.
 */
export default function PhotoGallerySection({ articles = [], className = '' }) {
  const photoArticles = (articles || []).filter((item) => Boolean(item && (item.featuredImage || item.featured_media?.public_url)));

  if (photoArticles.length === 0) {
    return (
      <section className={`w-full bg-paper-canvas p-4 sm:p-5 lg:p-6 shadow-xs border border-border-rule ${className}`}>
        <div className="flex items-center justify-between border-b-2 border-border-heavy pb-2 mb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary-container" />
            <h2 className="font-mukta text-lg sm:text-xl font-bold text-on-surface">
              फोटो गैलरी • तस्वीरों में आज का भारत
            </h2>
          </div>
          <span className="font-inter text-xs text-secondary font-medium">
            दैनिक विजुअल डायरी
          </span>
        </div>
        <div className="bg-paper-tint border border-dashed border-border-heavy p-6 text-center flex flex-col items-center justify-center">
          <ImageOff className="w-8 h-8 text-secondary/60 mb-2" />
          <p className="font-mukta text-sm text-secondary">
            संपादकीय डेस्क द्वारा नवीनतम फोटो स्टोरीज़ एवं विजुअल रिपोर्ट्स संकलित की जा रही हैं।
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={`w-full bg-paper-canvas p-4 sm:p-5 lg:p-6 shadow-xs border border-border-rule ${className}`}>
      <div className="flex items-center justify-between border-b-2 border-border-heavy pb-2 mb-4">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary-container" />
          <h2 className="font-mukta text-lg sm:text-xl font-bold text-on-surface">
            फोटो गैलरी • तस्वीरों में आज का भारत
          </h2>
        </div>
        <span className="font-inter text-xs text-secondary font-medium">
          दैनिक विजुअल डायरी
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {photoArticles.slice(0, 4).map((item) => {
          const imageUrl = item.featuredImage || item.featured_media?.public_url;
          return (
            <Link
              key={item.id}
              to={`/news/${item.slug}`}
              className="flex flex-col group cursor-pointer"
            >
              <div className="overflow-hidden aspect-video bg-surface-container relative border border-border-rule/40">
                <img
                  src={imageUrl}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute bottom-2 left-2 bg-black/80 text-white font-inter text-[11px] px-2 py-0.5 flex items-center gap-1 shadow-xs">
                  <Camera className="w-3 h-3 text-primary-container" />
                  <span>तस्वीरें</span>
                </span>
                {item.category && (
                  <span className="absolute top-2 right-2 bg-primary-container text-white font-inter text-[9px] uppercase font-bold px-1.5 py-0.5">
                    {item.category}
                  </span>
                )}
              </div>
              <h4 className="font-mukta text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary-container transition-colors mt-2 leading-snug line-clamp-2">
                {item.title}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-secondary font-inter">
                <span className="text-primary-container font-medium truncate max-w-[140px]">
                  {item.author?.name || 'संपादकीय डेस्क'}
                </span>
                <span>•</span>
                <span>{formatRelativeTime(item.publishedAt || item.createdAt) || item.readTime || 'ताज़ा'}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

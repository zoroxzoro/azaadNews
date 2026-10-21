import React, { useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

export default function ArticlePhotoGallery({
  gallery = [],
  title = 'समाचार से जुड़े अन्य छायाचित्र (Photo Gallery)',
  className = '',
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!Array.isArray(gallery) || gallery.length === 0) {
    return null;
  }

  // Single photo view
  if (gallery.length === 1) {
    const single = gallery[0];
    return (
      <figure className={`my-6 bg-paper-canvas border border-border-rule shadow-xs overflow-hidden font-mukta ${className}`}>
        <div className="bg-paper-tint border-b border-border-rule px-3.5 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-primary-container" />
            <h4 className="font-mukta text-xs sm:text-sm font-bold uppercase tracking-wider text-on-surface">
              {title}
            </h4>
          </div>
        </div>
        <div className="relative aspect-[16/9] bg-black overflow-hidden">
          <img
            src={single.url}
            alt={single.altText || single.caption || 'समाचार छायाचित्र'}
            className="w-full h-full object-cover"
          />
        </div>
        {(single.caption || single.credit) && (
          <figcaption className="p-2.5 sm:p-3 bg-paper-tint border-t border-border-rule flex items-center justify-between text-xs font-inter text-secondary">
            <span>{single.caption || single.title || ''}</span>
            {single.credit && (
              <span className="font-semibold text-on-surface">{single.credit}</span>
            )}
          </figcaption>
        )}
      </figure>
    );
  }

  const activePhoto = gallery[activeIndex] || gallery[0];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className={`my-6 bg-paper-canvas border-2 border-border-heavy shadow-sm overflow-hidden font-mukta ${className}`}>
      {/* Header ribbon */}
      <div className="bg-paper-tint border-b border-border-rule px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary-container" />
          <h3 className="font-mukta text-sm sm:text-base font-bold uppercase tracking-wider text-on-surface">
            {title}
          </h3>
        </div>
        <span className="font-inter text-xs text-secondary font-semibold">
          तस्वीर {activeIndex + 1} / {gallery.length}
        </span>
      </div>

      {/* Main active photo stage */}
      <div className="relative aspect-[16/9] bg-black overflow-hidden group select-none">
        <img
          src={activePhoto.url}
          alt={activePhoto.altText || activePhoto.caption || 'गैलरी तस्वीर'}
          className="w-full h-full object-contain mx-auto"
        />

        {/* Prev / Next controls overlay */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous Photo"
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all cursor-pointer opacity-80 group-hover:opacity-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next Photo"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all cursor-pointer opacity-80 group-hover:opacity-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Photo caption & credit bar */}
      <div className="p-3 sm:p-4 bg-paper-tint border-t border-border-rule">
        <p className="font-mukta text-xs sm:text-sm text-on-surface leading-snug">
          {activePhoto.caption || activePhoto.title || 'संबंधित आलेख से फ़ोटो संग्रह'}
        </p>
        {activePhoto.credit && (
          <p className="font-inter text-[11px] text-secondary mt-1">
            साभार / स्रोत: <span className="font-semibold text-on-surface">{activePhoto.credit}</span>
          </p>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="p-2 sm:p-3 bg-paper-subtle border-t border-border-rule overflow-x-auto flex items-center gap-2 no-scrollbar">
        {gallery.map((photo, idx) => (
          <button
            key={photo.id || idx}
            type="button"
            onClick={() => setActiveIndex(idx)}
            className={`w-16 h-12 sm:w-20 sm:h-14 shrink-0 overflow-hidden border-2 transition-all cursor-pointer ${
              idx === activeIndex
                ? 'border-primary-container ring-1 ring-primary-container scale-102'
                : 'border-border-rule opacity-60 hover:opacity-100'
            }`}
          >
            <img
              src={photo.url}
              alt="thumb"
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </section>
  );
}

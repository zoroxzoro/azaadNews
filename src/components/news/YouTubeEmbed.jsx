import React, { useState } from 'react';
import { getYouTubeEmbedUrl, getYouTubeVideoId, getYouTubeThumbnail } from '../../utils/youtube';
import { Play, Video, AlertCircle } from 'lucide-react';

/**
 * YouTubeEmbed component
 * Responsive 16:9 YouTube video player with privacy-enhanced embed
 * and accessible fallback handling.
 */
export default function YouTubeEmbed({
  url,
  title = 'आज़ाद वीडियो विश्लेषण',
  caption,
  duration,
  className = '',
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoId = getYouTubeVideoId(url);
  const embedUrl = getYouTubeEmbedUrl(url, { autoplay: 1 });
  const thumbnailUrl = getYouTubeThumbnail(url, 'maxresdefault') || getYouTubeThumbnail(url, 'hqdefault');

  if (!videoId || !embedUrl) {
    return (
      <div className={`w-full p-4 bg-paper-tint border border-border-rule flex items-center gap-3 text-secondary ${className}`}>
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        <span className="font-inter text-xs">
          वीडियो लोड नहीं हो सका या यूआरएल अमान्य है।
        </span>
      </div>
    );
  }

  return (
    <figure className={`w-full flex flex-col gap-2 my-4 ${className}`}>
      <div className="relative aspect-video w-full bg-[#1A1A1A] overflow-hidden border border-border-rule shadow-md group">
        {!isPlaying ? (
          <div
            onClick={() => setIsPlaying(true)}
            className="relative w-full h-full cursor-pointer flex items-center justify-center"
            role="button"
            tabIndex={0}
            aria-label={`वीडियो चलाएं: ${title}`}
            onKeyDown={(e) => e.key === 'Enter' && setIsPlaying(true)}
          >
            <img
              src={thumbnailUrl}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
            />

            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary-container text-white flex items-center justify-center shadow-xl group-hover:scale-115 transition-transform">
                <Play className="w-7 h-7 ml-1 fill-current" />
              </div>
            </div>

            {/* Badges */}
            <span className="absolute top-3 right-3 bg-primary-container text-white font-inter text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider shadow-sm">
              वीडियो रिपोर्ट
            </span>

            {duration && (
              <span className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-xs text-white font-inter text-xs px-2 py-0.5 flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-primary-fixed" />
                <span>अवधि: {duration}</span>
              </span>
            )}
          </div>
        ) : (
          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>

      {(caption || title) && (
        <figcaption className="font-inter text-xs text-secondary flex items-start gap-1.5 pt-0.5">
          <span className="font-semibold text-on-surface/90">{title}:</span>
          <span>{caption || 'आज़ाद समाचार डिजिटल डेस्क वीडियो रिपोर्ट।'}</span>
        </figcaption>
      )}
    </figure>
  );
}

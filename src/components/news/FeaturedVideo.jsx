import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, Calendar, ExternalLink, ArrowRight, User, AlertCircle, Video } from 'lucide-react';
import { getYouTubeEmbedUrl, getYouTubeThumbnail, getYouTubeVideoId } from '../../utils/youtube';

export default function FeaturedVideo({
  article,
  isPlaying = false,
  onPlay,
  className = '',
}) {
  const [hasPlaybackError, setHasPlaybackError] = useState(false);

  if (!article) return null;

  const videoId = getYouTubeVideoId(article.youtubeUrl);
  const embedUrl = videoId ? getYouTubeEmbedUrl(article.youtubeUrl, { autoplay: 1 }) : null;
  const thumbnailUrl =
    getYouTubeThumbnail(article.youtubeUrl, 'maxresdefault') ||
    getYouTubeThumbnail(article.youtubeUrl, 'hqdefault') ||
    article.featuredImage;

  const handlePlayClick = () => {
    if (onPlay) {
      onPlay(article);
    }
  };

  return (
    <section
      className={`w-full bg-[#10264B] text-white border-t-4 border-primary-container shadow-xl overflow-hidden ${className}`}
      aria-label="प्रमुख वीडियो समाचार"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
        {/* Left: 16:9 Video Frame (7 Cols Desktop) */}
        <div className="lg:col-span-7 relative bg-black flex items-center justify-center overflow-hidden min-h-[260px] sm:min-h-[380px] lg:min-h-[440px]">
          {isPlaying && embedUrl && !hasPlaybackError ? (
            <div className="relative w-full h-full aspect-video">
              <iframe
                src={embedUrl}
                title={article.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onError={() => setHasPlaybackError(true)}
              />
            </div>
          ) : (
            <div
              onClick={handlePlayClick}
              className="relative w-full h-full aspect-video cursor-pointer group flex items-center justify-center overflow-hidden"
              role="button"
              tabIndex={0}
              aria-label={`वीडियो चलाएं: ${article.title}`}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handlePlayClick()}
            >
              {/* Thumbnail Image */}
              <img
                src={thumbnailUrl}
                alt={article.title}
                loading="eager"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
              />

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30 group-hover:via-black/20 transition-colors" />

              {/* Prominent Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary-container text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300 border-2 border-white/30">
                  <Play className="w-7 h-7 sm:w-9 sm:h-9 ml-1 fill-white" />
                </div>
              </div>

              {/* Top Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-3 py-1 bg-primary-container text-white font-mukta font-bold text-xs uppercase tracking-wider shadow-md">
                  प्रमुख वीडियो बुलेटिन (Featured)
                </span>
                {article.isBreaking && (
                  <span className="px-2 py-0.5 bg-red-600/90 text-white font-inter text-[11px] font-bold uppercase rounded-xs">
                    ब्रेकिंग
                  </span>
                )}
              </div>

              {/* Bottom Duration Badge */}
              {article.videoDuration && (
                <div className="absolute bottom-4 right-4 bg-black/85 backdrop-blur-xs text-white font-mono text-xs px-2.5 py-1 flex items-center gap-1.5 rounded-xs border border-white/20">
                  <Video className="w-3.5 h-3.5 text-primary-fixed" />
                  <span>अवधि: {article.videoDuration}</span>
                </div>
              )}
            </div>
          )}

          {/* Fallback message if playback error occurs */}
          {hasPlaybackError && (
            <div className="p-4 text-center text-slate-300 text-xs">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-amber-400" />
              <span>एंबेडेड प्लेबैक उपलब्ध नहीं है। </span>
              <a
                href={article.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-white font-semibold inline-flex items-center gap-1"
              >
                यूट्यूब पर देखें <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Right: Editorial Information & Meta (5 Cols Desktop) */}
        <div className="lg:col-span-5 p-5 sm:p-7 lg:p-8 flex flex-col justify-between gap-5 bg-[#10264B] border-t lg:border-t-0 lg:border-l border-white/10">
          <div className="space-y-3.5">
            {/* Category & Time */}
            <div className="flex items-center gap-2 text-xs font-inter text-slate-300">
              <span className="font-bold uppercase tracking-wider text-primary-fixed">
                {article.categoryNameHindi || article.category}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString('hi-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '25 मार्च 2025'}
              </span>
            </div>

            {/* Title */}
            <h2 className="font-mukta text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight">
              {article.title}
            </h2>

            {/* Summary */}
            <p className="font-inter text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3 sm:line-clamp-4">
              {article.summary}
            </p>

            {/* Author / Bureau info */}
            <div className="flex items-center gap-2.5 pt-2 text-xs font-inter text-slate-300 border-t border-white/10">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-primary-fixed font-bold">
                <User className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-white block">
                  {article.author?.name || 'आज़ाद वीडियो डेस्क'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {article.author?.role || 'डिजिटल प्रसारण संवाददाता'} • {article.author?.location || 'नई दिल्ली'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/10">
            {!isPlaying && (
              <button
                onClick={handlePlayClick}
                className="px-5 py-2.5 bg-primary-container text-white font-mukta font-bold text-sm hover:bg-primary transition-colors cursor-pointer flex items-center gap-2 shadow-md"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>अभी देखें (Watch Video)</span>
              </button>
            )}

            <Link
              to={`/news/${article.slug}`}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-mukta font-semibold text-sm transition-colors inline-flex items-center gap-1.5"
            >
              <span>पूरी खबर पढ़ें</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

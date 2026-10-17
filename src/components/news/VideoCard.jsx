import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Calendar, Eye, Video, ArrowRight, ExternalLink } from 'lucide-react';
import { getYouTubeThumbnail, getYouTubeEmbedUrl, getYouTubeVideoId } from '../../utils/youtube';

export default function VideoCard({
  article,
  isPlaying = false,
  onPlay,
  className = '',
}) {
  const [playbackError, setPlaybackError] = useState(false);

  if (!article) return null;

  const videoId = getYouTubeVideoId(article.youtubeUrl);
  const embedUrl = videoId ? getYouTubeEmbedUrl(article.youtubeUrl, { autoplay: 1 }) : null;
  const thumbnailUrl =
    getYouTubeThumbnail(article.youtubeUrl, 'hqdefault') ||
    article.featuredImage;

  const handlePlayClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onPlay) {
      onPlay(article);
    }
  };

  return (
    <article
      className={`bg-paper-canvas border border-border-rule flex flex-col group hover:border-border-heavy transition-all duration-200 shadow-xs ${className}`}
    >
      {/* 16:9 Thumbnail Frame / Embedded Player */}
      <div className="relative aspect-video bg-black overflow-hidden">
        {isPlaying && embedUrl && !playbackError ? (
          <div className="w-full h-full">
            <iframe
              src={embedUrl}
              title={article.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onError={() => setPlaybackError(true)}
            />
          </div>
        ) : (
          <div
            onClick={handlePlayClick}
            className="w-full h-full relative cursor-pointer group/thumb"
            role="button"
            tabIndex={0}
            aria-label={`वीडियो चलाएं: ${article.title}`}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handlePlayClick(e)}
          >
            {/* Thumbnail Image */}
            <img
              src={thumbnailUrl}
              alt={article.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500 opacity-90"
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40 group-hover/thumb:bg-black/25 transition-colors" />

            {/* Centered Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center shadow-xl group-hover/thumb:scale-115 transition-transform duration-300">
                <Play className="w-5 h-5 ml-0.5 fill-white" />
              </div>
            </div>

            {/* Category Tag (Top Left) */}
            <div className="absolute top-2.5 left-2.5">
              <span className="px-2 py-0.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-inter font-bold uppercase tracking-wider rounded-xs border border-white/10">
                {article.categoryNameHindi || article.category}
              </span>
            </div>

            {/* Video Duration (Bottom Right) */}
            {article.videoDuration && (
              <span className="absolute bottom-2.5 right-2.5 bg-black/85 backdrop-blur-xs text-white font-mono text-[10px] px-2 py-0.5 flex items-center gap-1 rounded-xs border border-white/20">
                <Video className="w-3 h-3 text-red-500" />
                <span>{article.videoDuration}</span>
              </span>
            )}
          </div>
        )}

        {playbackError && (
          <div className="p-3 text-center text-slate-300 text-xs">
            <span>वीडियो लोड नहीं हो सका। </span>
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

      {/* Card Content & Editorial Metadata */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Published Date */}
          <div className="flex items-center gap-2 text-[11px] font-inter text-secondary mb-1.5">
            <Calendar className="w-3 h-3 text-secondary shrink-0" />
            <span>
              {article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString('hi-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'हाल ही में'}
            </span>
          </div>

          {/* Video Title -> Navigates to Article */}
          <Link to={`/news/${article.slug}`}>
            <h3 className="font-mukta text-base sm:text-lg font-bold text-on-surface group-hover:text-primary-container transition-colors line-clamp-2 leading-snug">
              {article.title}
            </h3>
          </Link>

          {/* Short Summary */}
          {article.summary && (
            <p className="font-inter text-xs text-secondary mt-1.5 line-clamp-2">
              {article.summary}
            </p>
          )}
        </div>

        {/* Footer actions: Author, Views, and Read Full Story link */}
        <div className="pt-2.5 border-t border-border-rule flex items-center justify-between text-[11px] font-inter text-secondary">
          <span className="font-medium text-on-surface">
            {article.author?.name || 'आज़ाद ब्यूरो'}
          </span>

          <Link
            to={`/news/${article.slug}`}
            className="text-primary-container font-semibold hover:underline inline-flex items-center gap-0.5"
          >
            <span>पूरी खबर</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}

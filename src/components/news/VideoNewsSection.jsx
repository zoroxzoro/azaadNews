import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, X, Clock, Eye, Video } from 'lucide-react';
import { getYouTubeEmbedUrl, getYouTubeThumbnail } from '../../utils/youtube';

/**
 * VideoNewsSection component (आज़ाद वीडियो प्राइम)
 * Features responsive 16:9 video embeds, inline playback via modal,
 * and high-engagement video thumbnails.
 */
export default function VideoNewsSection({
  videoArticles = [],
  title = 'आज़ाद वीडियो प्राइम • स्पेशल वीडियो रिपोर्ट्स',
  className = '',
}) {
  const [activeVideo, setActiveVideo] = useState(null);

  const mainVideo = videoArticles[0];
  const secondaryVideos = videoArticles.slice(1, 4);

  const handlePlay = (article) => {
    if (!article) return;
    const embedUrl = getYouTubeEmbedUrl(article.youtubeUrl);
    if (embedUrl) {
      setActiveVideo({
        title: article.title,
        embedUrl,
        article,
      });
    }
  };

  const closePlayer = () => {
    setActiveVideo(null);
  };

  return (
    <section className={`w-full bg-[#10264B] text-white p-4 lg:p-6 shadow-xl border-t-4 border-primary-container ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/20 pb-3 mb-5 gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
          <h2 className="font-mukta text-xl lg:text-2xl font-bold tracking-wide text-white">
            {title}
          </h2>
        </div>
        <Link
          to="/category/videos"
          className="font-inter text-xs text-red-300 hover:text-white transition-colors flex items-center gap-1 font-bold"
        >
          <span>सभी वीडियो बुलेटिन देखें</span>
          <Video className="w-4 h-4 ml-0.5" />
        </Link>
      </div>

      {/* Main Grid: 7 cols main featured video + 5 cols secondary stack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Featured Video (7 Cols) */}
        {mainVideo && (
          <div className="lg:col-span-7 flex flex-col gap-2 group">
            <div
              onClick={() => handlePlay(mainVideo)}
              className="relative overflow-hidden aspect-video bg-black/60 border border-white/20 cursor-pointer shadow-lg"
              role="button"
              tabIndex={0}
              aria-label={`वीडियो चलाएं: ${mainVideo.title}`}
              onKeyDown={(e) => e.key === 'Enter' && handlePlay(mainVideo)}
            >
              <img
                src={getYouTubeThumbnail(mainVideo.youtubeUrl) || mainVideo.featuredImage}
                alt={mainVideo.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Play Overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-115 transition-transform">
                  <Play className="w-7 h-7 ml-1 fill-current" />
                </div>
              </div>

              {/* Badges */}
              <span className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-xs text-white font-inter text-xs px-2.5 py-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-red-400" />
                <span>{mainVideo.videoDuration || '08:45'}</span>
              </span>

              <span className="absolute top-3 right-3 bg-red-600 text-white font-inter text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider shadow-sm">
                ग्राउंड इन्वेस्टिगेशन
              </span>
            </div>

            <h3
              onClick={() => handlePlay(mainVideo)}
              className="font-mukta text-lg lg:text-xl font-bold text-white mt-1 group-hover:text-red-300 transition-colors cursor-pointer leading-snug"
            >
              {mainVideo.title}
            </h3>

            {mainVideo.summary && (
              <p className="font-inter text-xs sm:text-sm text-neutral-300 leading-relaxed line-clamp-2">
                {mainVideo.summary}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs text-neutral-400 font-inter pt-1">
              <span className="font-medium text-white/90">आज़ाद डॉक्यूमेंट्री</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {(mainVideo.views || 128000).toLocaleString('hi-IN')} व्यूज
              </span>
              <span>•</span>
              <span>{mainVideo.readTime || 'ताज़ा'}</span>
            </div>
          </div>
        )}

        {/* 3 Video Bulletin Stack (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {secondaryVideos.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => handlePlay(item)}
              className="flex gap-3 p-2 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`वीडियो चलाएं: ${item.title}`}
              onKeyDown={(e) => e.key === 'Enter' && handlePlay(item)}
            >
              <div className="w-32 sm:w-36 aspect-video bg-black/50 relative shrink-0 overflow-hidden">
                <img
                  src={getYouTubeThumbnail(item.youtubeUrl) || item.featuredImage}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute bottom-1 right-1 bg-black/85 text-white text-[9px] font-inter px-1 font-bold">
                  {item.videoDuration || '05:00'}
                </span>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
                  <span className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-sm">
                    <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-between py-0.5">
                <h4 className="font-mukta text-xs sm:text-sm font-bold text-white group-hover:text-red-300 transition-colors leading-snug line-clamp-2">
                  {item.title}
                </h4>
                <div className="font-inter text-[10px] text-neutral-400 mt-1">
                  <span>{(item.views || 45000).toLocaleString('hi-IN')} व्यूज</span>
                  <span> • </span>
                  <span>{item.readTime || 'आज'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inline / Modal YouTube Player */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={closePlayer}
        >
          <div
            className="relative w-full max-w-4xl bg-black border border-white/20 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Bar */}
            <div className="flex items-center justify-between p-3 bg-neutral-900 border-b border-neutral-800 text-white">
              <span className="font-mukta text-sm sm:text-base font-bold truncate pr-4">
                {activeVideo.title}
              </span>
              <button
                onClick={closePlayer}
                className="p-1 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white"
                aria-label="खिलाड़ी बंद करें"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 16:9 Responsive Embed */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={activeVideo.embedUrl}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

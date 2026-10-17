import React from 'react';
import VideoCard from './VideoCard';

export default function VideoGrid({
  articles = [],
  activeVideoId = null,
  onPlayVideo,
  className = '',
}) {
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 ${className}`}
      aria-label="वीडियो समाचार ग्रिड"
    >
      {articles.map((article) => (
        <VideoCard
          key={article.id}
          article={article}
          isPlaying={activeVideoId === article.id}
          onPlay={() => onPlayVideo(article)}
        />
      ))}
    </div>
  );
}

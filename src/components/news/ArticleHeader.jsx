import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Eye,
  Clock,
  CheckCircle2,
  Volume2,
  Play,
  Pause,
  Download,
  Flame,
} from 'lucide-react';

/**
 * ArticleHeader component
 * Features breadcrumbs, exclusive tags, bold Hindi headline,
 * editorial dek/summary, verified author byline, and interactive audio listen bar.
 */
export default function ArticleHeader({ article }) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [audioProgress, setAudioProgress] = useState(15); // visual progress simulation

  const speeds = [1.0, 1.25, 1.5];

  const handleSpeedToggle = () => {
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  useEffect(() => {
    let timer;
    if (isPlayingAudio) {
      timer = setInterval(() => {
        setAudioProgress((prev) => (prev >= 100 ? 0 : prev + 2 * playbackSpeed));
      }, 500);
    }
    return () => clearInterval(timer);
  }, [isPlayingAudio, playbackSpeed]);

  if (!article) return null;

  const {
    title,
    summary,
    category,
    author,
    publishedAt,
    updatedAt,
    readTime,
    views,
    isBreaking,
    isFeatured,
  } = article;

  const publishedDateStr = publishedAt
    ? new Date(publishedAt).toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '25 मार्च 2025';

  const updatedDateStr = updatedAt
    ? new Date(updatedAt).toLocaleTimeString('hi-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <header className="flex flex-col gap-3.5 mb-4">
      {/* 1. Breadcrumb & Metadata Utility Band */}
      <div className="w-full bg-paper-tint border-b border-border-rule py-2 px-1 flex flex-wrap items-center justify-between gap-2 text-xs font-inter text-secondary">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="hover:text-primary-container transition-colors flex items-center gap-1 font-medium">
            <Home className="w-3.5 h-3.5" />
            <span>होम</span>
          </Link>
          <span className="text-secondary/60">/</span>
          <Link
            to={`/category/${category || 'national'}`}
            className="hover:text-primary-container transition-colors uppercase font-semibold text-primary-container"
          >
            {category || 'राष्ट्रीय'}
          </Link>
          <span className="text-secondary/60">/</span>
          <span className="text-on-surface font-semibold truncate max-w-[200px]">
            विशेष रिपोर्ट
          </span>
        </nav>

        <div className="flex items-center gap-3 text-[11px] font-inter">
          {views && (
            <span className="inline-flex items-center gap-1 text-primary-container font-semibold">
              <Eye className="w-3.5 h-3.5" />
              <span>{views.toLocaleString('hi-IN')} बार पढ़ा गया</span>
            </span>
          )}
          <span>|</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>पढ़ने का समय: {readTime || '4 मिनट'}</span>
          </span>
        </div>
      </div>

      {/* 2. Category Stamp & Exclusive Flag */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="px-2.5 py-1 bg-primary-container text-white font-inter text-xs font-bold uppercase tracking-wider shadow-xs">
          {category === 'national' ? 'राष्ट्रीय / विशेष रिपोर्ट' : category || 'विशेष रिपोर्ट'}
        </span>

        {(isBreaking || isFeatured) && (
          <span className="px-2.5 py-1 bg-ticker-tint border border-primary-container/40 text-primary-container font-inter text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            संसद बजट सत्र एक्सक्लूसिव
          </span>
        )}
      </div>

      {/* 3. Main Headline (H1) */}
      <h1 className="font-mukta text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-on-surface leading-tight tracking-tight mt-1">
        {title}
      </h1>

      {/* 4. Editorial Dek / Summary Callout */}
      {summary && (
        <p className="font-inter text-sm sm:text-base md:text-lg text-secondary leading-relaxed border-l-4 border-primary-container pl-3.5 sm:pl-4 py-2 bg-paper-tint">
          {summary}
        </p>
      )}

      {/* 5. Byline, Timestamps and Audio Bar Container */}
      <div className="w-full border-y border-border-rule py-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Author Block */}
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-border-rule shrink-0 bg-surface-container">
              <img
                src={author?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'}
                alt={author?.name || 'लेखक'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-mukta text-base font-bold text-on-surface leading-tight">
                  {author?.name || 'राजेश कुमार बाजपेयी'}
                </span>
                <CheckCircle2 className="w-4 h-4 text-primary-container fill-primary-container text-white" />
              </div>
              <span className="font-inter text-xs text-secondary">
                {author?.role || 'वरिष्ठ ब्यूरो प्रमुख'} • {author?.location || 'नई दिल्ली'}
              </span>
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex flex-col sm:text-right font-inter text-xs text-secondary">
            <span>
              <strong className="text-on-surface">प्रकाशित:</strong> {publishedDateStr}
            </span>
            {updatedDateStr && (
              <span className="text-primary-container font-medium">
                <strong>अपडेट किया गया:</strong> आज, {updatedDateStr} IST
              </span>
            )}
          </div>
        </div>

        {/* 6. Audio Listen Player Bar Component */}
        <div className="w-full bg-paper-tint border border-border-rule px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[220px]">
            <button
              type="button"
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              aria-label={isPlayingAudio ? 'ऑडियो रोकें' : 'समाचार सुनें'}
              className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center hover:bg-primary transition-colors shadow-sm cursor-pointer shrink-0"
            >
              {isPlayingAudio ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 ml-0.5 fill-current" />
              )}
            </button>

            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs font-inter">
                <span className="font-bold text-on-surface flex items-center gap-1.5 truncate">
                  <Volume2 className="w-4 h-4 text-primary-container shrink-0" />
                  <span>यह समाचार सुनें (Listen to Article)</span>
                </span>
                <span className="text-secondary text-[11px] font-mono">
                  {isPlayingAudio ? '01:14' : '00:00'} / 03:45
                </span>
              </div>

              <div
                className="w-full bg-border-rule h-1.5 rounded-full mt-1.5 overflow-hidden cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  setAudioProgress(Math.round((clickX / rect.width) * 100));
                }}
              >
                <div
                  className="bg-primary-container h-full rounded-full transition-all duration-300"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSpeedToggle}
              className="px-2 py-0.5 bg-paper-canvas border border-border-rule text-on-surface font-inter text-xs font-semibold rounded hover:bg-surface-container cursor-pointer"
              title="प्लेबैक गति बदलें"
            >
              {playbackSpeed.toFixed(1)}x
            </button>

            <button
              type="button"
              onClick={() => alert('ऑडियो बुलेटिन डाउनलोड प्रारंभ हुआ।')}
              className="w-7 h-7 flex items-center justify-center text-secondary hover:text-primary-container transition-colors cursor-pointer"
              title="डाउनलोड ऑडियो बुलेटिन"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

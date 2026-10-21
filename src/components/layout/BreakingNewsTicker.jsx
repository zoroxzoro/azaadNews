import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Container from '../common/Container';
import { useArticles } from '../../context/ArticleContext';
import { useLanguage } from '../../context/LanguageContext';
import { ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';

export default function BreakingNewsTicker() {
  const { t } = useLanguage();
  const { getPublishedArticles } = useArticles();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFading, setIsFading] = useState(false);

  // Filter breaking news articles from real published articles
  const livePublished = getPublishedArticles() || [];
  const liveBreaking = livePublished.filter((item) => item.isBreaking);
  const isGenuineBreaking = liveBreaking.length > 0;
  // If no article is explicitly marked breaking, use latest published articles with truthful labeling
  const breakingArticles = isGenuineBreaking ? liveBreaking : livePublished.slice(0, 6);

  // Auto rotation every 5 seconds (respects pause and reduced-motion)
  useEffect(() => {
    // Check user preference for reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isPaused || prefersReducedMotion || breakingArticles.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, breakingArticles.length]);

  const handleNext = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % breakingArticles.length);
      setIsFading(false);
    }, 200);
  };

  const handlePrev = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + breakingArticles.length) % breakingArticles.length);
      setIsFading(false);
    }, 200);
  };

  // If no articles exist at all, hide gracefully (placed strictly AFTER all hooks)
  if (!breakingArticles || breakingArticles.length === 0) {
    return null;
  }

  const currentStory = breakingArticles[currentIndex] || breakingArticles[0];
  if (!currentStory) return null;

  return (
    <section
      aria-label="Breaking News"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className="w-full bg-[#FCE9E9] dark:bg-[#261116] border-b border-[#DA251D] transition-colors select-none"
    >
      <Container className="py-1.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Prominent Red Breaking / Latest Label Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-[#DA251D] text-white font-mukta text-xs sm:text-sm font-bold px-2.5 sm:px-3 py-1 tracking-wider uppercase flex items-center gap-1.5 shadow-sm shrink-0">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <Megaphone className="w-3.5 h-3.5 hidden xs:inline" />
            <span>{isGenuineBreaking ? t('breaking_news') : (t('quick_alert') || 'ताज़ा अपडेट')}</span>
          </div>

          <span className="font-inter text-[11px] font-bold text-primary-container hidden md:inline tracking-wider uppercase">
            | {isGenuineBreaking ? t('live_desk') : 'संपादकीय बुलेटिन'}:
          </span>
        </div>

        {/* Center: Headline with Smooth Transition */}
        <div className="flex-1 overflow-hidden relative min-h-[26px] flex items-center">
          <div
            className={`w-full font-mukta text-xs sm:text-sm md:text-base font-semibold text-[#1A1A1A] dark:text-[#fecdd3] transition-opacity duration-200 ${
              isFading ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <Link
              to={`/news/${currentStory.slug}`}
              className="hover:text-primary-container transition-colors flex items-center gap-2 truncate max-w-full"
              title={currentStory.title}
            >
              <span className="text-[#DA251D] font-bold shrink-0">●</span>
              <span className="truncate">{currentStory.title}</span>
            </Link>
          </div>
        </div>

        {/* Right: Counter & Navigation Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 text-secondary">
          <span className="hidden sm:inline font-mono text-[10px] sm:text-xs">
            {currentIndex + 1} / {breakingArticles.length}
          </span>

          <div className="flex items-center border border-border-rule bg-paper-canvas">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="पिछली खबर (Previous Breaking Story)"
              className="p-1 hover:text-primary-container hover:bg-paper-tint transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="h-3 w-px bg-border-rule"></span>
            <button
              type="button"
              onClick={handleNext}
              aria-label="अगली खबर (Next Breaking Story)"
              className="p-1 hover:text-primary-container hover:bg-paper-tint transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}

import React, { useEffect, useState } from 'react';

/**
 * ReadingProgress component
 * Displays a subtle progress bar at the top of the viewport
 * based on the reader's scroll position through the article.
 */
export default function ReadingProgress({ targetId = 'article-root' }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const articleEl = document.getElementById(targetId);
      if (!articleEl) {
        // Fallback to window scroll
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight > 0) {
          const current = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
          setProgress(current);
        }
        return;
      }

      const rect = articleEl.getBoundingClientRect();
      const articleTop = rect.top + window.scrollY;
      const articleHeight = rect.height;
      const windowHeight = window.innerHeight;

      // How much of the article has scrolled past
      const scrolled = window.scrollY - articleTop;
      const maxScroll = articleHeight - windowHeight / 2;

      if (scrolled <= 0) {
        setProgress(0);
      } else if (scrolled >= maxScroll) {
        setProgress(100);
      } else {
        const pct = Math.min(100, Math.max(0, (scrolled / maxScroll) * 100));
        setProgress(pct);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [targetId]);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 z-50 bg-border-rule/40 pointer-events-none"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="पढ़ने की प्रगति"
    >
      <div
        className="h-full bg-primary-container transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

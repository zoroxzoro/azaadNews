import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Radio, Sparkles } from 'lucide-react';

/**
 * CategoryHeader Component
 * Broadsheet masthead banner with category branding, live counter,
 * and breadcrumb navigation.
 */
export default function CategoryHeader({
  category,
  totalArticles = 0,
  className = '',
}) {
  if (!category) return null;

  return (
    <div className={`flex flex-col gap-3 mb-6 ${className}`}>
      {/* 1. Breadcrumb Bar */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 font-inter text-xs text-secondary py-1">
        <Link to="/" className="hover:text-primary-container transition-colors flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>होम</span>
        </Link>
        <span className="text-secondary/50">/</span>
        <span className="text-primary-container font-bold">{category.nameHindi}</span>
        <span className="text-secondary/50">/</span>
        <span className="text-on-surface font-medium">समग्र कवरेज</span>
      </nav>

      {/* 2. Category Masthead Banner */}
      <div className="bg-paper-tint rounded-xl p-5 sm:p-6 lg:p-8 relative overflow-hidden shadow-xs border border-border-rule">
        {/* Left accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-container" />

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2 py-0.5 bg-primary-container text-white font-inter text-[10px] font-bold uppercase tracking-wider shadow-xs">
                विशेष डेस्क
              </span>
              <span className="font-inter text-xs text-secondary uppercase tracking-widest font-semibold">
                • {category.nameEnglish}
              </span>
            </div>

            <h1 className="font-mukta text-3xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface leading-tight tracking-tight mb-2">
              {category.nameHindi}
            </h1>

            <p className="font-inter text-xs sm:text-sm md:text-base text-secondary leading-relaxed">
              {category.description || 'देश के नीतिगत निर्णय, शासन, और राष्ट्रीय घटनाक्रम से जुड़ी हर निष्पक्ष और प्रमाणिक खबर।'}
            </p>
          </div>

          {/* Real-time Stat Widget */}
          <div className="flex items-center gap-4 bg-paper-canvas p-3 rounded-lg shadow-xs border border-border-rule shrink-0 self-start lg:self-auto">
            <div className="flex items-center gap-2 text-primary-container">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse" />
              <span className="font-inter text-xs font-bold uppercase tracking-wide">
                लाइव कवरेज
              </span>
            </div>
            <div className="h-6 w-px bg-border-rule" />
            <div className="font-inter text-xs text-on-surface">
              <strong className="text-primary-container font-bold text-sm sm:text-base">
                {totalArticles}
              </strong>{' '}
              <span>कुल समाचार</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

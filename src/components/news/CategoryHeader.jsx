import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Layers, Sparkles, Tag, Info } from 'lucide-react';

/**
 * CategoryHeader Component
 * Broadsheet masthead banner with category branding, live counter,
 * breadcrumb navigation, and transparent topic fallback disclosure.
 */
export default function CategoryHeader({
  category,
  totalArticles = 0,
  articleCount,
  isTopicFallback = false,
  matchingRule = null,
  className = '',
}) {
  if (!category) return null;

  const count = articleCount !== undefined ? articleCount : totalArticles;
  const hindiName = category.nameHindi || category.name;
  const englishName = category.englishName || category.nameEnglish || category.name;

  return (
    <header className={`flex flex-col gap-3 mb-6 ${className}`}>
      {/* 1. Semantic Breadcrumb Bar */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 font-inter text-xs text-secondary py-1">
        <Link to="/" className="hover:text-primary-container transition-colors flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>होम</span>
        </Link>
        <span className="text-secondary/50">/</span>
        {category.isCity ? (
          <>
            <Link to="/category/uttar-pradesh" className="hover:text-primary-container transition-colors">
              उत्तर प्रदेश
            </Link>
            <span className="text-secondary/50">/</span>
          </>
        ) : (
          <>
            <span className="text-secondary font-medium">श्रेणियां</span>
            <span className="text-secondary/50">/</span>
          </>
        )}
        <span className="text-primary-container font-bold">{hindiName}</span>
      </nav>

      {/* 2. Category Masthead Banner */}
      <div className="bg-paper-tint p-5 sm:p-6 lg:p-7 relative overflow-hidden shadow-xs border border-border-rule">
        {/* Left broadsheet accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-container" />

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2 py-0.5 bg-primary-container text-white font-mukta text-xs font-bold uppercase tracking-wider shadow-xs">
                {category.isCity ? 'शहर विशेष • प्रादेशिक महाकवरेज' : 'विशेष डेस्क'}
              </span>
              {englishName && (
                <span className="font-inter text-xs text-secondary uppercase tracking-widest font-semibold">
                  • {englishName}
                </span>
              )}
              {isTopicFallback && (
                <span className="px-2 py-0.5 bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30 font-inter text-[11px] font-semibold flex items-center gap-1">
                  <Tag className="w-3 h-3 text-amber-600 dark:text-amber-300" />
                  <span>संपादकीय विषय संग्रह</span>
                </span>
              )}
            </div>

            <h1 className="font-mukta text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface leading-tight tracking-tight mb-2">
              {hindiName}
            </h1>

            {/* Optional Description strictly when real metadata exists */}
            {category.description && (
              <p className="font-inter text-xs sm:text-sm text-secondary leading-relaxed">
                {category.description}
              </p>
            )}

            {/* Topic Fallback Transparency Disclosure */}
            {isTopicFallback && matchingRule && (
              <div className="flex items-center gap-1.5 mt-2 text-secondary font-inter text-xs bg-paper-canvas/80 p-2 border border-border-rule/60">
                <Info className="w-3.5 h-3.5 text-primary-container shrink-0" />
                <span>
                  <strong>नोट:</strong> यह अनुभाग ऐतिहासिक डिजिटल अभिलेखागार से {matchingRule} के अंतर्गत संकलित किया गया है।
                </span>
              </div>
            )}
          </div>

          {/* Real-time Count Widget */}
          <div className="flex items-center gap-4 bg-paper-canvas p-3 shadow-xs border border-border-rule shrink-0 self-start lg:self-auto">
            <div className="flex items-center gap-2 text-primary-container">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse" />
              <span className="font-mukta text-xs font-bold uppercase tracking-wide">
                लाइव कवरेज
              </span>
            </div>
            <div className="h-6 w-px bg-border-rule" />
            <div className="font-inter text-xs text-on-surface">
              <strong className="text-primary-container font-bold text-sm sm:text-base">
                {Number(count).toLocaleString('hi-IN')}
              </strong>{' '}
              <span>कुल समाचार</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

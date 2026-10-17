import React from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

/**
 * TrendingNewsSidebar component
 * Displays numbered viral/trending stories and a broadsheet sponsorship block
 */
export default function TrendingNewsSidebar({
  stories = [],
  title = 'ट्रेंडिंग समाचार',
  showAd = true,
  className = '',
}) {
  const hindiNumbers = ['१', '२', '३', '४', '५', '६', '७', '८', '९', '१०'];

  return (
    <aside className={`bg-paper-tint p-3 sm:p-4 border border-border-rule flex flex-col justify-between ${className}`}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-border-heavy pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-primary-container inline-block"></span>
            <h3 className="font-mukta text-base sm:text-lg font-bold text-on-surface">
              {title}
            </h3>
          </div>
          <span className="flex items-center gap-1 font-inter text-[11px] font-semibold text-primary-container">
            <Flame className="w-3.5 h-3.5 fill-current animate-pulse text-primary-container" />
            लाइव अपडेट
          </span>
        </div>

        {/* Numbered List */}
        <ol className="divide-y divide-border-rule">
          {stories.map((story, index) => (
            <li key={story.id || index} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-2.5 group">
              <span className="font-mukta text-xl sm:text-2xl font-black text-primary-container/45 leading-none shrink-0 w-6 pt-0.5">
                {hindiNumbers[index] || `0${index + 1}`}
              </span>
              <div className="flex-1 min-w-0">
                {story.category && (
                  <span className="font-inter text-[9px] uppercase tracking-wider font-bold text-secondary block mb-0.5">
                    {story.category}
                  </span>
                )}
                <Link
                  to={`/news/${story.slug}`}
                  className="font-mukta text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary-container transition-colors line-clamp-2 leading-snug"
                >
                  {story.title}
                </Link>
                <div className="flex items-center gap-2 font-inter text-[10px] text-secondary mt-1">
                  {story.views && <span>{story.views.toLocaleString('hi-IN')} पाठक</span>}
                  {story.views && <span>•</span>}
                  <span>{story.readTime || '3 मिनट'}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Broadsheet Sponsored Ad Block (Stitch 300x250) */}
      {showAd && (
        <div className="mt-4 pt-4 border-t border-border-rule">
          <div className="bg-paper-canvas border border-dashed border-border-heavy p-3 text-center flex flex-col items-center justify-center min-h-[140px] text-secondary">
            <span className="font-inter text-[9px] uppercase tracking-widest font-semibold text-secondary mb-1">
              प्रायोजित संदेश • विज्ञापन
            </span>
            <div className="w-full py-4 px-2 bg-paper-tint/50 border border-border-rule/50 my-1">
              <span className="font-mukta text-sm font-bold text-on-surface block">
                आज़ाद ई-पेपर सदस्यता
              </span>
              <span className="font-inter text-[11px] text-primary-container font-semibold block mt-0.5">
                वार्षिक प्लान पर 50% छूट
              </span>
            </div>
            <Link
              to="/epaper"
              className="mt-1 font-inter text-[10px] text-secondary hover:text-primary-container underline"
            >
              आज़ाद डिजिटल नेटवर्क पर विज्ञापन दें →
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}

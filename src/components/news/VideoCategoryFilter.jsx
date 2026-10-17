import React from 'react';

const FILTER_CATEGORIES = [
  { slug: 'all', labelHindi: 'सभी वीडियो', labelEnglish: 'All Videos' },
  { slug: 'national', labelHindi: 'राष्ट्रीय', labelEnglish: 'National' },
  { slug: 'politics', labelHindi: 'राजनीति', labelEnglish: 'Politics' },
  { slug: 'uttar-pradesh', labelHindi: 'उत्तर प्रदेश', labelEnglish: 'Uttar Pradesh' },
  { slug: 'sports', labelHindi: 'खेल', labelEnglish: 'Sports' },
  { slug: 'entertainment', labelHindi: 'मनोरंजन', labelEnglish: 'Entertainment' },
  { slug: 'business', labelHindi: 'बिज़नेस', labelEnglish: 'Business' },
  { slug: 'technology', labelHindi: 'टेक्नोलॉजी', labelEnglish: 'Technology' },
];

export default function VideoCategoryFilter({
  activeCategory = 'all',
  categoryCounts = {},
  onSelectCategory,
  className = '',
}) {
  return (
    <nav
      className={`w-full bg-paper-canvas border border-border-rule p-2 sm:p-3 overflow-x-auto no-scrollbar shadow-2xs ${className}`}
      aria-label="वीडियो श्रेणी फ़िल्टर"
    >
      <div className="flex items-center gap-1.5 min-w-max">
        {FILTER_CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.slug;
          const count = categoryCounts[cat.slug] || 0;

          // Don't show category if not 'all' and count is 0 (per user requirements)
          if (cat.slug !== 'all' && count === 0) {
            return null;
          }

          return (
            <button
              key={cat.slug}
              onClick={() => onSelectCategory(cat.slug)}
              className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-mukta font-bold transition-all cursor-pointer rounded-none border whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-primary-container ${
                isSelected
                  ? 'bg-primary-container text-white border-primary-container shadow-xs'
                  : 'bg-paper-tint text-on-surface hover:text-primary-container hover:bg-paper-subtle border-border-rule'
              }`}
              aria-pressed={isSelected}
            >
              <span>{cat.labelHindi}</span>
              {count > 0 && (
                <span
                  className={`ml-1.5 text-[11px] font-inter font-normal px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-surface-container text-secondary'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

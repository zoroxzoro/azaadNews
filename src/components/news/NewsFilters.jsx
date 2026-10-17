import React from 'react';
import { ArrowUpDown } from 'lucide-react';

/**
 * NewsFilters component
 * Filter pills for sub-topics, language switchers, and sorting dropdown.
 */
export default function NewsFilters({
  activeSubCategory = 'all',
  subCategories = [],
  activeLanguage = 'all',
  activeSort = 'newest',
  onSubCategoryChange,
  onLanguageChange,
  onSortChange,
  className = '',
}) {
  const sortOptions = [
    { value: 'newest', label: 'नवीनतम पहले (Newest First)' },
    { value: 'popular', label: 'सर्वाधिक पढ़े गए (Most Read)' },
    { value: 'oldest', label: 'सबसे पुरानी (Oldest First)' },
  ];

  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-paper-canvas p-2 border border-border-rule rounded-lg shadow-xs mb-6 ${className}`}>
      {/* 1. Sub-Category / Topic Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-1">
        <button
          type="button"
          onClick={() => onSubCategoryChange('all')}
          className={`px-3 py-1.5 rounded-full font-inter text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeSubCategory === 'all'
              ? 'bg-primary-container text-white shadow-xs'
              : 'bg-paper-tint text-on-surface hover:bg-surface-container border border-border-rule'
          }`}
        >
          सभी (All)
        </button>

        {subCategories.map((sub) => {
          const isActive = activeSubCategory === sub.value;
          return (
            <button
              key={sub.value}
              type="button"
              onClick={() => onSubCategoryChange(sub.value)}
              className={`px-3 py-1.5 rounded-full font-inter text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary-container text-white shadow-xs'
                  : 'bg-paper-tint text-on-surface hover:bg-surface-container border border-border-rule'
              }`}
            >
              {sub.label}
            </button>
          );
        })}
      </div>

      {/* 2. Language Segment & Sort By Dropdown */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {/* Language Tabs */}
        <div className="flex items-center border border-border-rule bg-paper-tint rounded-md p-0.5 font-inter text-xs">
          <button
            type="button"
            onClick={() => onLanguageChange('all')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              activeLanguage === 'all'
                ? 'bg-paper-canvas text-primary-container font-bold shadow-xs'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            सभी
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('hi')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              activeLanguage === 'hi'
                ? 'bg-paper-canvas text-primary-container font-bold shadow-xs'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            हिंदी
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              activeLanguage === 'en'
                ? 'bg-paper-canvas text-primary-container font-bold shadow-xs'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            EN
          </button>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-1.5 bg-paper-tint border border-border-rule px-2.5 py-1 rounded-md font-inter text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-secondary shrink-0" />
          <select
            value={activeSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-transparent text-on-surface font-semibold focus:outline-none cursor-pointer pr-1"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-paper-canvas text-on-surface">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

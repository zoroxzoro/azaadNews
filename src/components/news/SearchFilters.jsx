import React from 'react';
import { Calendar, Filter, X, RotateCcw } from 'lucide-react';
import { categories } from '../../data/categories';

export default function SearchFilters({
  activeCategory = 'all',
  activeLanguage = 'all',
  activeDate = 'all',
  customFrom = '',
  customTo = '',
  contentType = 'all',
  categoryCounts = {},
  onCategoryChange,
  onLanguageChange,
  onDateChange,
  onCustomDateChange,
  onContentTypeChange,
  onClearFilters,
  hasActiveFilters = false,
}) {
  return (
    <div className="bg-paper-canvas border border-border-rule p-3 sm:p-4 space-y-3">
      {/* Top Facet Bar: Categories Pills */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-border-rule">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto">
          <button
            onClick={() => onCategoryChange('all')}
            className={`px-3 py-1 text-xs font-inter uppercase tracking-wider rounded-none shrink-0 transition-colors cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-primary-container text-white font-bold'
                : 'bg-paper-tint text-secondary hover:text-on-surface hover:bg-paper-subtle border border-border-rule'
            }`}
          >
            सभी (All) {categoryCounts.all ? `(${categoryCounts.all})` : ''}
          </button>

          {categories.map((cat) => {
            const count = categoryCounts[cat.slug] || 0;
            const isSelected = activeCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.slug)}
                className={`px-3 py-1 text-xs font-inter tracking-wider rounded-none shrink-0 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary-container text-white font-bold'
                    : 'bg-paper-tint text-secondary hover:text-on-surface hover:bg-paper-subtle border border-border-rule'
                }`}
              >
                {cat.nameHindi} {count > 0 ? `(${count})` : ''}
              </button>
            );
          })}
        </div>

        {/* Clear Filters Button if any filter active */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-inter text-breaking-crimson bg-ticker-tint hover:bg-breaking-crimson hover:text-white transition-colors cursor-pointer shrink-0 border border-breaking-crimson/20"
          >
            <RotateCcw className="w-3 h-3" />
            <span>फ़िल्टर हटाएं</span>
          </button>
        )}
      </div>

      {/* Secondary Row: Date Range & Media Content Type */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Filter Dropdown */}
          <div className="relative">
            <select
              value={activeDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-paper-tint border border-border-rule text-on-surface text-xs font-inter py-1.5 pl-2.5 pr-8 focus:outline-none focus:border-border-heavy cursor-pointer appearance-none"
            >
              <option value="all">समय सीमा: सभी (Any time)</option>
              <option value="today">आज (Today / 24 घंटे)</option>
              <option value="week">पिछला 7 दिन (Past Week)</option>
              <option value="month">पिछला महीना (Past Month)</option>
              <option value="year">पिछला वर्ष (Past Year)</option>
              <option value="custom">कस्टम तिथि... (Custom Range)</option>
            </select>
            <Calendar className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-secondary" />
          </div>

          {/* Content Type Filter */}
          <div className="relative">
            <select
              value={contentType}
              onChange={(e) => onContentTypeChange(e.target.value)}
              className="bg-paper-tint border border-border-rule text-on-surface text-xs font-inter py-1.5 pl-2.5 pr-8 focus:outline-none focus:border-border-heavy cursor-pointer appearance-none"
            >
              <option value="all">सामग्री: सभी प्रकार (All)</option>
              <option value="text">लेख / समाचार (Text)</option>
              <option value="video">वीडियो रिपोर्ट (Video)</option>
              <option value="photo">फोटो गैलरी (Photos)</option>
            </select>
            <Filter className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-secondary" />
          </div>
        </div>

        {/* Custom Date Range Picker Fields (if activeDate === 'custom') */}
        {activeDate === 'custom' && (
          <div className="flex items-center gap-2 bg-paper-tint p-1.5 border border-border-rule flex-wrap">
            <span className="text-[11px] font-inter text-secondary">से:</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => onCustomDateChange(e.target.value, customTo)}
              className="bg-paper-canvas border border-border-rule text-xs font-inter px-2 py-0.5 text-on-surface focus:outline-none"
            />
            <span className="text-[11px] font-inter text-secondary">तक:</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => onCustomDateChange(customFrom, e.target.value)}
              className="bg-paper-canvas border border-border-rule text-xs font-inter px-2 py-0.5 text-on-surface focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

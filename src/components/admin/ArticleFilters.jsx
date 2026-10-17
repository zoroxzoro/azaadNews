import React from 'react';
import { Search, Filter, RotateCcw, ArrowUpDown, Globe } from 'lucide-react';
import { categories } from '../../data/categories';
import { ARTICLE_STATUS } from '../../utils/articleStatus';

export default function ArticleFilters({
  searchTerm = '',
  onSearchChange,
  statusFilter = 'all',
  onStatusChange,
  categoryFilter = 'all',
  onCategoryChange,
  languageFilter = 'all',
  onLanguageChange,
  sortBy = 'updated_desc',
  onSortChange,
  onClearFilters,
  hasActiveFilters = false,
  statusCounts = {},
}) {
  return (
    <div className="bg-paper-canvas border border-border-rule p-3 sm:p-4 space-y-3 shadow-2xs">
      {/* Top Search & Category Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search Field (6 cols) */}
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="शीर्षक, लेखक, टैग या स्टोरी ID से खोजें..."
            className="w-full pl-9 pr-3 py-2 bg-paper-tint border border-border-rule text-xs sm:text-sm font-inter text-on-surface focus:outline-none focus:bg-paper-canvas focus:border-primary-container transition-colors"
          />
        </div>

        {/* Category Dropdown (3 cols) */}
        <div className="md:col-span-3">
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-xs font-inter text-on-surface focus:outline-none focus:bg-paper-canvas focus:border-primary-container cursor-pointer appearance-none pr-8"
            >
              <option value="all">सभी श्रेणियां (All Categories)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.nameHindi} ({cat.nameEnglish})
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary" />
          </div>
        </div>

        {/* Sort & Language (3 cols) */}
        <div className="md:col-span-3 flex items-center gap-2">
          {/* Language selector */}
          <div className="relative flex-1">
            <select
              value={languageFilter}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="w-full px-2.5 py-2 bg-paper-tint border border-border-rule text-xs font-inter text-on-surface focus:outline-none focus:bg-paper-canvas focus:border-primary-container cursor-pointer appearance-none pr-6"
            >
              <option value="all">भाषा: सभी</option>
              <option value="hi">हिन्दी (HI)</option>
              <option value="en">English (EN)</option>
            </select>
            <Globe className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-secondary" />
          </div>

          {/* Sort selector */}
          <div className="relative flex-1">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full px-2.5 py-2 bg-paper-tint border border-border-rule text-xs font-inter text-on-surface focus:outline-none focus:bg-paper-canvas focus:border-primary-container cursor-pointer appearance-none pr-6"
            >
              <option value="updated_desc">हालिया अपडेट</option>
              <option value="updated_asc">पुराना अपडेट</option>
              <option value="published_desc">हालिया प्रकाशित</option>
              <option value="title_asc">शीर्षक (A–Z)</option>
            </select>
            <ArrowUpDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-secondary" />
          </div>
        </div>
      </div>

      {/* Status Filter Tabs & Clear Filter button */}
      <div className="pt-2 border-t border-border-rule flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => onStatusChange('all')}
            className={`px-3 py-1 text-xs font-mukta font-bold cursor-pointer rounded transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-primary-container text-white'
                : 'bg-paper-tint text-secondary hover:text-on-surface border border-border-rule'
            }`}
          >
            सभी {statusCounts.all !== undefined ? `(${statusCounts.all})` : ''}
          </button>

          <button
            type="button"
            onClick={() => onStatusChange(ARTICLE_STATUS.PUBLISHED)}
            className={`px-3 py-1 text-xs font-mukta font-bold cursor-pointer rounded transition-colors whitespace-nowrap ${
              statusFilter === ARTICLE_STATUS.PUBLISHED
                ? 'bg-primary-container text-white'
                : 'bg-paper-tint text-secondary hover:text-on-surface border border-border-rule'
            }`}
          >
            प्रकाशित {statusCounts[ARTICLE_STATUS.PUBLISHED] !== undefined ? `(${statusCounts[ARTICLE_STATUS.PUBLISHED]})` : ''}
          </button>

          <button
            type="button"
            onClick={() => onStatusChange(ARTICLE_STATUS.IN_REVIEW)}
            className={`px-3 py-1 text-xs font-mukta font-bold cursor-pointer rounded transition-colors whitespace-nowrap ${
              statusFilter === ARTICLE_STATUS.IN_REVIEW
                ? 'bg-primary-container text-white'
                : 'bg-paper-tint text-secondary hover:text-on-surface border border-border-rule'
            }`}
          >
            समीक्षाधीन {statusCounts[ARTICLE_STATUS.IN_REVIEW] !== undefined ? `(${statusCounts[ARTICLE_STATUS.IN_REVIEW]})` : ''}
          </button>

          <button
            type="button"
            onClick={() => onStatusChange(ARTICLE_STATUS.SCHEDULED)}
            className={`px-3 py-1 text-xs font-mukta font-bold cursor-pointer rounded transition-colors whitespace-nowrap ${
              statusFilter === ARTICLE_STATUS.SCHEDULED
                ? 'bg-primary-container text-white'
                : 'bg-paper-tint text-secondary hover:text-on-surface border border-border-rule'
            }`}
          >
            शेड्यूल्ड {statusCounts[ARTICLE_STATUS.SCHEDULED] !== undefined ? `(${statusCounts[ARTICLE_STATUS.SCHEDULED]})` : ''}
          </button>

          <button
            type="button"
            onClick={() => onStatusChange(ARTICLE_STATUS.DRAFT)}
            className={`px-3 py-1 text-xs font-mukta font-bold cursor-pointer rounded transition-colors whitespace-nowrap ${
              statusFilter === ARTICLE_STATUS.DRAFT
                ? 'bg-primary-container text-white'
                : 'bg-paper-tint text-secondary hover:text-on-surface border border-border-rule'
            }`}
          >
            ड्राफ्ट {statusCounts[ARTICLE_STATUS.DRAFT] !== undefined ? `(${statusCounts[ARTICLE_STATUS.DRAFT]})` : ''}
          </button>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-inter text-breaking-crimson bg-ticker-tint hover:bg-breaking-crimson hover:text-white transition-colors cursor-pointer border border-breaking-crimson/20"
          >
            <RotateCcw className="w-3 h-3" />
            <span>फ़िल्टर साफ़ करें</span>
          </button>
        )}
      </div>
    </div>
  );
}

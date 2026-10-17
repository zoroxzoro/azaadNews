import React from 'react';
import {
  Search,
  RotateCcw,
  LayoutGrid,
  List as ListIcon,
  Image as ImageIcon,
  HardDrive,
  Globe,
  SlidersHorizontal,
  X,
} from 'lucide-react';

export default function MediaFilters({
  search = '',
  onSearchChange,
  typeFilter = 'all',
  onTypeFilterChange,
  ratioFilter = 'all',
  onRatioFilterChange,
  sourceFilter = 'all',
  onSourceFilterChange,
  sortBy = 'newest',
  onSortChange,
  viewMode = 'grid',
  onViewModeChange,
  onResetFilters,
  totalCount = 0,
  filteredCount = 0,
}) {
  const isFiltered =
    search ||
    typeFilter !== 'all' ||
    ratioFilter !== 'all' ||
    sourceFilter !== 'all' ||
    sortBy !== 'newest';

  return (
    <div className="bg-paper-canvas border border-border-rule shadow-xs p-4 space-y-3.5">
      {/* Search Input Row */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="कीवर्ड, कैप्शन, फोटोग्राफर, वायर आईडी या क्रेडिट से खोजें (उदा: संसद, सेमीकंडक्टर, IPL, ISRO)..."
            className="w-full h-10 pl-9 pr-8 bg-paper-tint border border-border-rule text-on-surface font-inter text-xs placeholder:text-secondary focus:outline-none focus:border-primary-container"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-inter">
          {/* Aspect Ratio */}
          <select
            value={ratioFilter}
            onChange={(e) => onRatioFilterChange(e.target.value)}
            className="h-10 px-2.5 bg-paper-tint border border-border-rule text-on-surface text-xs focus:outline-none focus:border-primary-container"
          >
            <option value="all">अनुपात: सभी (All Ratio)</option>
            <option value="16:9">16:9 (लीड हेडलाइन)</option>
            <option value="4:3">4:3 (मानक संपादकीय)</option>
            <option value="1:1">1:1 (स्क्वायर / सोशल)</option>
            <option value="9:16">9:16 (स्टोरी / रील्स)</option>
          </select>

          {/* Source Agency */}
          <select
            value={sourceFilter}
            onChange={(e) => onSourceFilterChange(e.target.value)}
            className="h-10 px-2.5 bg-paper-tint border border-border-rule text-on-surface text-xs focus:outline-none focus:border-primary-container"
          >
            <option value="all">स्रोत: सभी एजेंसियां</option>
            <option value="pti">पीटीआई (PTI Wire)</option>
            <option value="ani">एएनआई (ANI Multimedia)</option>
            <option value="reuters">रॉयटर्स (Reuters)</option>
            <option value="inhouse">इन-हाउस फ़ोटोडेस्क</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="h-10 px-2.5 bg-paper-tint border border-border-rule text-on-surface text-xs focus:outline-none focus:border-primary-container"
          >
            <option value="newest">क्रम: नवीनतम पहले (Newest)</option>
            <option value="oldest">क्रम: पुरातन पहले (Oldest)</option>
            <option value="title_asc">शीर्षक (A to Z)</option>
            <option value="title_desc">शीर्षक (Z to A)</option>
          </select>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="h-10 px-3 bg-paper-subtle hover:bg-paper-tint border border-border-rule text-secondary hover:text-on-surface flex items-center gap-1 transition-colors cursor-pointer"
              title="सभी फ़िल्टर साफ़ करें"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>रीसेट</span>
            </button>
          )}
        </div>
      </div>

      {/* Segment Pills & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border-rule/60">
        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onTypeFilterChange('all')}
            className={`px-3 py-1 font-mukta text-xs font-bold transition-all cursor-pointer border ${
              typeFilter === 'all'
                ? 'bg-border-heavy text-white border-border-heavy shadow-2xs'
                : 'bg-paper-tint text-secondary hover:text-on-surface border-border-rule'
            }`}
          >
            सभी मीडिया ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => onTypeFilterChange('images')}
            className={`px-3 py-1 font-mukta text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
              typeFilter === 'images'
                ? 'bg-primary-container text-white border-primary-container shadow-2xs'
                : 'bg-paper-tint text-secondary hover:text-on-surface border-border-rule'
            }`}
          >
            <ImageIcon className="w-3 h-3 text-primary-container" />
            <span>तस्वीरें (Images)</span>
          </button>

          <button
            type="button"
            onClick={() => onTypeFilterChange('demo_upload')}
            className={`px-3 py-1 font-mukta text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
              typeFilter === 'demo_upload'
                ? 'bg-blue-700 text-white border-blue-700 shadow-2xs'
                : 'bg-paper-tint text-secondary hover:text-on-surface border-border-rule'
            }`}
          >
            <HardDrive className="w-3 h-3 text-blue-600" />
            <span>लोकल डेमो अपलोड</span>
          </button>

          <button
            type="button"
            onClick={() => onTypeFilterChange('url')}
            className={`px-3 py-1 font-mukta text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
              typeFilter === 'url'
                ? 'bg-border-heavy text-white border-border-heavy shadow-2xs'
                : 'bg-paper-tint text-secondary hover:text-on-surface border-border-rule'
            }`}
          >
            <Globe className="w-3 h-3 text-secondary" />
            <span>वेब स्रोत (URLs)</span>
          </button>
        </div>

        {/* View Toggle & Count Indicator */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="font-inter text-xs text-secondary">
            परिणाम: <strong>{filteredCount}</strong> संपत्तियां प्रदर्शित
          </span>

          <div className="flex items-center border border-border-rule bg-paper-canvas">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-paper-subtle text-primary-container'
                  : 'text-secondary hover:text-on-surface'
              }`}
              title="ग्रिड दृश्य (Grid)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-border-rule" />
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-paper-subtle text-primary-container'
                  : 'text-secondary hover:text-on-surface'
              }`}
              title="सूची दृश्य (List / Table)"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

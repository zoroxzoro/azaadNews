import React from 'react';
import { Search, X } from 'lucide-react';

export default function VideoSearch({
  searchQuery = '',
  onSearchChange,
  onClearSearch,
  className = '',
}) {
  return (
    <div className={`relative w-full ${className}`}>
      <label htmlFor="video-search-input" className="sr-only">
        वीडियो समाचार खोजें
      </label>
      <div className="relative flex items-center">
        <Search className="w-4 h-4 absolute left-3.5 text-secondary pointer-events-none" />
        <input
          id="video-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="शीर्षक, विषय, वक्ता या कीवर्ड खोजें (उदा. संसद, बजट, खेल)..."
          className="w-full pl-10 pr-9 py-2 sm:py-2.5 bg-paper-tint border border-border-rule text-xs sm:text-sm font-inter text-on-surface placeholder-secondary focus:outline-none focus:border-primary-container focus:bg-paper-canvas transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={onClearSearch}
            className="absolute right-2.5 p-1 text-secondary hover:text-on-surface transition-colors cursor-pointer"
            aria-label="खोज साफ़ करें"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

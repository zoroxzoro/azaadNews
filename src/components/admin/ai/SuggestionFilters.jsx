import React from 'react';
import { Search } from 'lucide-react';
import { calculateSummaryCounts } from '../../../utils/proofreadingSuggestions';

export default function SuggestionFilters({
  activeCategory = 'all',
  onSelectCategory,
  searchQuery = '',
  onSearchChange,
  suggestions = [],
}) {
  const counts = calculateSummaryCounts(suggestions);

  const tabs = [
    { id: 'all', label: 'सभी', count: counts.total },
    { id: 'spelling', label: 'वर्तनी', count: counts.spelling },
    { id: 'grammar', label: 'व्याकरण', count: counts.grammar },
    { id: 'punctuation', label: 'विराम चिह्न', count: counts.punctuation },
    { id: 'clarity_style', label: 'शैली', count: counts.clarity + counts.style },
  ];

  if (counts.sensationalism > 0) {
    tabs.push({ id: 'sensationalism', label: 'सनसनीखेज', count: counts.sensationalism });
  }
  if (counts.fact_check > 0) {
    tabs.push({ id: 'fact_check', label: 'तथ्य सत्यापन', count: counts.fact_check });
  }

  return (
    <div className="space-y-2 font-mukta">
      {/* Category Pills */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-xs">
        {tabs.map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectCategory(tab.id)}
              className={`px-2.5 py-1 whitespace-nowrap font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                isActive
                  ? 'bg-primary-container text-white border-primary-container shadow-2xs'
                  : 'bg-paper-tint text-secondary border-border-rule hover:bg-paper-subtle hover:text-on-surface'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1 py-0.2 rounded-full font-inter ${
                  isActive ? 'bg-white/20 text-white' : 'bg-paper-subtle text-secondary'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Filter */}
      {counts.total > 4 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-secondary absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="सुझाव या शब्द खोजें..."
            className="w-full pl-8 pr-2.5 py-1 text-xs bg-paper-tint border border-border-rule font-inter text-on-surface focus:outline-none focus:bg-paper-canvas"
          />
        </div>
      )}
    </div>
  );
}

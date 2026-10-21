import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  RotateCcw,
  CheckCheck,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import ProofreadingStatus from './ProofreadingStatus';
import ProofreadingSummary from './ProofreadingSummary';
import SuggestionFilters from './SuggestionFilters';
import SuggestionCard from './SuggestionCard';
import {
  filterSuggestions,
  getSafeBatchSuggestions,
} from '../../../utils/proofreadingSuggestions';

export default function ProofreadingPanel({
  isOpen,
  onClose,
  status = 'idle',
  suggestions = [],
  activeSuggestionId = null,
  isStale = false,
  isAiProviderConfigured = false,
  language = 'hi',
  onLanguageChange,
  onRecheck,
  onSelectSuggestion,
  onAcceptSuggestion,
  onIgnoreSuggestion,
  onAcceptAllSafe,
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredSuggestions = filterSuggestions(suggestions, activeCategory, searchQuery);
  const safeSuggestions = getSafeBatchSuggestions(suggestions);
  const canAcceptAll = safeSuggestions.length > 0 && !isStale && status !== 'analyzing';

  return (
    <aside
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-paper-canvas border-l border-border-rule shadow-2xl flex flex-col font-mukta animate-in slide-in-from-right duration-200"
      aria-label="AI Proofreading Assistant Panel"
    >
      {/* 1. Panel Header */}
      <div className="bg-[#10264B] text-white p-3.5 px-4 flex items-center justify-between gap-2 shrink-0 border-b border-primary-container">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center text-primary-fixed shrink-0">
            <Sparkles className="w-4 h-4 text-primary-fixed" />
          </div>
          <div>
            <h2 className="text-base font-bold leading-tight flex items-center gap-1.5">
              <span>AI वर्तनी व भाषा सहायक</span>
              <span className={`text-[9px] px-1.5 py-0.2 font-mono font-bold ${
                isAiProviderConfigured
                  ? 'bg-emerald-600 text-white'
                  : 'bg-ticker-tint text-secondary border border-border-rule'
              }`}>
                {isAiProviderConfigured ? 'REAL AI' : 'RULE ENGINE'}
              </span>
            </h2>
            <span className="font-inter text-[10px] text-neutral-300 block">
              संपादकीय गुणवत्ता, शीर्षक व वर्तनी सुधार
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="पैनल बंद करें (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Language Selector & Recheck Bar */}
      <div className="bg-paper-tint px-4 py-2 border-b border-border-rule flex items-center justify-between gap-2 text-xs shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-secondary uppercase font-inter">
            भाषा:
          </span>
          <div className="inline-flex border border-border-rule bg-paper-canvas p-0.5">
            <button
              type="button"
              onClick={() => onLanguageChange('hi')}
              className={`px-2 py-0.5 font-bold transition-colors cursor-pointer ${
                language === 'hi'
                  ? 'bg-primary-container text-white shadow-2xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              हिंदी
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-0.5 font-bold font-inter transition-colors cursor-pointer ${
                language === 'en'
                  ? 'bg-primary-container text-white shadow-2xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              English
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onRecheck}
          disabled={status === 'analyzing'}
          className="px-2.5 py-1 bg-paper-canvas hover:bg-paper-subtle border border-border-rule text-on-surface text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
          title="वर्तमान आलेख की पुनः जाँच करें"
        >
          <RotateCcw className={`w-3 h-3 ${status === 'analyzing' ? 'animate-spin' : ''}`} />
          <span>पुनः जाँच करें</span>
        </button>
      </div>

      {/* 3. Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {/* Status Indicator */}
        <ProofreadingStatus
          status={status}
          suggestionCount={suggestions.length}
          isStale={isStale}
          isAiProviderConfigured={isAiProviderConfigured}
          onRecheck={onRecheck}
        />

        {/* Quality Scorecard & Derived Breakdown */}
        {suggestions.length > 0 && (
          <ProofreadingSummary suggestions={suggestions} language={language} />
        )}

        {/* Batch Action Bar */}
        {suggestions.length > 0 && (
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border-rule">
            <button
              type="button"
              onClick={onAcceptAllSafe}
              disabled={!canAcceptAll}
              className={`w-full py-1.5 px-3 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                canAcceptAll
                  ? 'bg-primary-container hover:bg-primary text-white cursor-pointer'
                  : 'bg-paper-tint text-secondary border border-border-rule opacity-60 cursor-not-allowed'
              }`}
              title={
                canAcceptAll
                  ? 'सभी सुरक्षित वर्तनी व विराम सुधार एक क्लिक में लागू करें'
                  : 'कोई सुरक्षित बैच सुझाव उपलब्ध नहीं है'
              }
            >
              <CheckCheck className="w-4 h-4" />
              <span>
                सभी सुरक्षित लागू करें ({safeSuggestions.length} सुधार)
              </span>
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        {suggestions.length > 0 && (
          <SuggestionFilters
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            suggestions={suggestions}
          />
        )}

        {/* Suggestion Cards Stream */}
        <div className="space-y-2.5 pt-1">
          {filteredSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              isActive={activeSuggestionId === suggestion.id}
              isStale={isStale}
              onSelect={onSelectSuggestion}
              onAccept={onAcceptSuggestion}
              onIgnore={onIgnoreSuggestion}
            />
          ))}

          {filteredSuggestions.length === 0 && suggestions.length > 0 && (
            <div className="text-center p-6 bg-paper-tint border border-border-rule text-secondary text-xs">
              इस श्रेणी में कोई सुझाव नहीं है।
            </div>
          )}
        </div>
      </div>

      {/* 4. Footer Editorial Safety Notice (Section 16) */}
      <div className="bg-paper-tint border-t border-border-rule p-2.5 px-3.5 text-secondary text-[11px] font-inter flex items-center gap-2 shrink-0">
        <ShieldAlert className="w-3.5 h-3.5 text-primary-container shrink-0" />
        <span>
          AI सुझाव सहायक हैं। तथ्य, उद्धरण और प्रकाशन की अंतिम जिम्मेदारी संपादक की है।
        </span>
      </div>
    </aside>
  );
}

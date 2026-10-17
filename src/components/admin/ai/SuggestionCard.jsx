import React from 'react';
import { Check, X, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

export default function SuggestionCard({
  suggestion,
  isActive = false,
  isStale = false,
  onSelect,
  onAccept,
  onIgnore,
}) {
  const { id, type, originalText, suggestedText, explanation, confidence, isSafeToAutoApply } = suggestion;

  // Category label & color badges
  let categoryMeta = {
    label: 'वर्तनी (Spelling)',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300',
  };

  if (type === 'grammar') {
    categoryMeta = {
      label: 'व्याकरण (Grammar)',
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300',
    };
  } else if (type === 'punctuation') {
    categoryMeta = {
      label: 'विराम चिह्न (Punctuation)',
      badgeClass: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300',
    };
  } else if (type === 'clarity' || type === 'style') {
    categoryMeta = {
      label: 'शैली व प्रवाह (Style)',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300',
    };
  }

  return (
    <div
      onClick={() => onSelect(suggestion)}
      className={`p-3.5 border transition-all text-xs font-mukta space-y-2 cursor-pointer ${
        isActive
          ? 'bg-paper-canvas border-primary-container shadow-md ring-1 ring-primary-container'
          : 'bg-paper-canvas hover:bg-paper-tint border-border-rule shadow-2xs'
      }`}
    >
      {/* Category & Confidence Badge */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wider ${categoryMeta.badgeClass}`}
        >
          {categoryMeta.label}
        </span>

        <div className="flex items-center gap-1.5 text-secondary">
          {confidence === 'high' ? (
            <span className="flex items-center gap-0.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold font-inter">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>उच्च सटीकता</span>
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-[10px] text-secondary font-inter">
              <HelpCircle className="w-3 h-3 text-secondary" />
              <span>मानव समीक्षा अनुशंसित</span>
            </span>
          )}
        </div>
      </div>

      {/* Before / After Comparison */}
      <div className="bg-paper-tint p-2.5 border border-border-rule space-y-1.5">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] text-secondary font-bold uppercase font-inter shrink-0">
            मूल:
          </span>
          <del className="text-breaking-crimson font-medium bg-rose-50 dark:bg-rose-950/40 px-1 py-0.2">
            {originalText}
          </del>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold uppercase font-inter shrink-0">
            सुझाव:
          </span>
          <strong className="text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.2">
            {suggestedText}
          </strong>
        </div>
      </div>

      {/* Explanation */}
      <p className="text-secondary text-[11px] leading-relaxed font-inter">
        {explanation}
      </p>

      {/* Stale Warning if document edited */}
      {isStale && (
        <p className="text-amber-700 dark:text-amber-400 text-[10px] font-inter italic">
          * आलेख में बदलाव के कारण यह सुझाव पुराना हो सकता है।
        </p>
      )}

      {/* Actions (Accept / Ignore) */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-border-rule">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIgnore(suggestion);
          }}
          className="px-2.5 py-1 text-secondary hover:text-on-surface hover:bg-paper-subtle border border-transparent hover:border-border-rule font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
          title="सुझाव अनदेखा करें"
        >
          <X className="w-3 h-3" />
          <span>अनदेखा करें</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAccept(suggestion);
          }}
          className="px-3 py-1 bg-primary-container hover:bg-primary text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
          title="सुझाव स्वीकार करें और आलेख में लागू करें"
        >
          <Check className="w-3 h-3" />
          <span>स्वीकारें (Accept)</span>
        </button>
      </div>
    </div>
  );
}

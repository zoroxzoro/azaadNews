import React from 'react';
import { calculateSummaryCounts } from '../../../utils/proofreadingSuggestions';

export default function ProofreadingSummary({ suggestions = [], language = 'hi' }) {
  const counts = calculateSummaryCounts(suggestions);

  // Derived accuracy rate for visual gauge based on word volume vs issue ratio
  // If 0 issues, 100%. If issues exist, calculate indicative editorial quality score.
  const score =
    counts.total === 0 ? 100 : Math.max(70, Math.min(99, 100 - counts.total * 2.5));

  return (
    <div className="bg-paper-tint border border-border-rule p-3 space-y-3 font-mukta">
      {/* Score Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase font-bold text-secondary">
          भाषा शुद्धता संकेत (Editorial Score)
        </span>
        <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 font-inter">
          {score.toFixed(1)}%
        </span>
      </div>

      {/* Progress Meter Bar */}
      <div className="w-full h-1.5 bg-paper-subtle border border-border-rule overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            score > 90 ? 'bg-emerald-600' : score > 80 ? 'bg-amber-500' : 'bg-breaking-crimson'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Category Metric Badges */}
      <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
        <div className="bg-paper-canvas p-1.5 border border-border-rule">
          <span className="text-[10px] text-secondary block font-inter">वर्तनी (Spelling)</span>
          <strong className="text-amber-800 dark:text-amber-300 font-bold font-inter text-sm">
            {counts.spelling}
          </strong>
        </div>

        <div className="bg-paper-canvas p-1.5 border border-border-rule">
          <span className="text-[10px] text-secondary block font-inter">व्याकरण (Grammar)</span>
          <strong className="text-rose-800 dark:text-rose-300 font-bold font-inter text-sm">
            {counts.grammar}
          </strong>
        </div>

        <div className="bg-paper-canvas p-1.5 border border-border-rule">
          <span className="text-[10px] text-secondary block font-inter">विराम (Punctuation)</span>
          <strong className="text-blue-800 dark:text-blue-300 font-bold font-inter text-sm">
            {counts.punctuation}
          </strong>
        </div>

        <div className="bg-paper-canvas p-1.5 border border-border-rule">
          <span className="text-[10px] text-secondary block font-inter">शैली (Style)</span>
          <strong className="text-purple-800 dark:text-purple-300 font-bold font-inter text-sm">
            {counts.clarity + counts.style}
          </strong>
        </div>
      </div>
    </div>
  );
}

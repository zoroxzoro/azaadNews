import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Broadsheet Pagination Component
 * Displays numbered page controls, next/previous buttons, and handles page transitions.
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  pageNumbers = [1],
  onPageChange,
  className = '',
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="पृष्ठ नेविगेशन (Pagination)"
      className={`flex items-center justify-between bg-paper-tint p-3 sm:p-4 rounded-xl shadow-xs border border-border-rule mt-6 ${className}`}
    >
      {/* Previous Button */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`px-3 sm:px-4 py-2 rounded-lg font-inter text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
          currentPage <= 1
            ? 'bg-paper-canvas/50 text-secondary/40 cursor-not-allowed border border-border-rule/40'
            : 'bg-paper-canvas text-on-surface hover:bg-surface-container border border-border-rule cursor-pointer'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden xs:inline">पिछला</span>
        <span className="text-[11px] text-secondary font-normal">(Prev)</span>
      </button>

      {/* Numbered Page Buttons */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {pageNumbers.map((num, idx) => {
          if (num === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="w-7 sm:w-8 text-center text-secondary font-bold text-xs"
              >
                ...
              </span>
            );
          }

          const isActive = num === currentPage;

          return (
            <button
              key={num}
              type="button"
              onClick={() => onPageChange(num)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-inter text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
                isActive
                  ? 'bg-primary-container text-white shadow-sm ring-1 ring-primary-container'
                  : 'bg-paper-canvas text-on-surface hover:bg-surface-container border border-border-rule'
              }`}
            >
              {num}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`px-3 sm:px-4 py-2 rounded-lg font-inter text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
          currentPage >= totalPages
            ? 'bg-paper-canvas/50 text-secondary/40 cursor-not-allowed border border-border-rule/40'
            : 'bg-primary-container text-white hover:bg-primary cursor-pointer'
        }`}
      >
        <span className="hidden xs:inline">अगला</span>
        <span className="text-[11px] font-normal text-white/80">(Next)</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

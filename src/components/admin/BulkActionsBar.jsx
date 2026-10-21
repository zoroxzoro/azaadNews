import React from 'react';
import { Trash2, FileEdit, X, CheckSquare } from 'lucide-react';

export default function BulkActionsBar({
  selectedCount = 0,
  onClearSelection,
  onBulkMoveToDraft,
  onBulkDelete,
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-paper-canvas border-2 border-primary-container p-3 sm:px-4 sm:py-2.5 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-2 text-xs font-inter font-bold text-on-surface">
        <CheckSquare className="w-4 h-4 text-primary-container" />
        <span>{selectedCount} समाचार आलेख चयनित (Selected)</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onBulkMoveToDraft}
          className="px-3 py-1.5 bg-paper-tint hover:bg-paper-subtle text-on-surface border border-border-rule font-mukta font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-colors"
          title="चयनित आलेखों को ड्राफ्ट में ले जाएं"
        >
          <FileEdit className="w-3.5 h-3.5 text-secondary" />
          <span>ड्राफ्ट में बदलें (Move to Draft)</span>
        </button>

        {Boolean(onBulkDelete) && (
          <button
            type="button"
            onClick={onBulkDelete}
            className="px-3 py-1.5 bg-ticker-tint hover:bg-red-100 dark:hover:bg-red-950 text-breaking-crimson border border-breaking-crimson/30 font-mukta font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            title="चयनित आलेखों को हटाएं"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>हटाएं (Delete)</span>
          </button>
        )}

        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 text-secondary hover:text-on-surface cursor-pointer rounded"
          title="चयन हटाएं"
          aria-label="चयन हटाएं"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

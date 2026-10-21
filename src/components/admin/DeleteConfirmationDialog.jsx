import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmationDialog({
  isOpen,
  articlesToDelete = [],
  onConfirm,
  onCancel,
  isBulk = false,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="bg-paper-canvas border border-border-rule shadow-2xl w-full max-w-lg p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 text-breaking-crimson">
            <div className="w-9 h-9 rounded-full bg-ticker-tint flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="delete-dialog-title" className="font-mukta text-lg sm:text-xl font-bold text-on-surface">
                {isBulk
                  ? `क्या आप इन ${articlesToDelete.length} आलेखों को हटाना चाहते हैं?`
                  : 'क्या आप इस आलेख को हटाना चाहते हैं?'}
              </h3>
              <span className="font-inter text-xs text-secondary">
                पुष्टि की आवश्यकता है (Confirmation Required)
              </span>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-secondary hover:text-on-surface cursor-pointer rounded"
            aria-label="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list / Preview */}
        <div className="bg-paper-tint border border-border-rule p-3 max-h-48 overflow-y-auto space-y-2">
          {articlesToDelete.map((art) => {
            const isHistorical = Boolean(art.isImported || art.legacyWordPressId);
            return (
              <div key={art.id} className="text-xs font-inter text-on-surface flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="text-breaking-crimson font-bold">•</span>
                  <span className="font-mukta font-bold text-sm line-clamp-1">{art.title}</span>
                </div>
                {isHistorical && (
                  <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-800 shrink-0">
                    ऐतिहासिक आर्काइव
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Warning text */}
        <p className="font-inter text-xs text-secondary leading-relaxed">
          चेतावनी: यह क्रिया चयनित समाचार आलेख को डेटाबेस और सार्वजनिक वेबसाइट से स्थायी रूप से हटा देगी। यह कार्रवाई पूर्ववत (Undo) नहीं की जा सकती।
        </p>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-border-rule">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-paper-canvas hover:bg-paper-tint text-on-surface border border-border-rule font-mukta font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            रद्द करें (Cancel)
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-breaking-crimson hover:bg-red-700 text-white font-mukta font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>हटाएं (Delete)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

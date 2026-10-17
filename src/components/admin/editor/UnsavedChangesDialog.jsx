import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function UnsavedChangesDialog({ isOpen, onStay, onLeave }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-paper-canvas border border-border-rule shadow-2xl w-full max-w-md p-6 space-y-4 font-mukta">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-on-surface">
              अप्रकाशित परिवर्तन मौजूद हैं (Unsaved Changes)
            </h3>
            <p className="font-inter text-xs text-secondary leading-relaxed">
              आपने इस समाचार में कुछ बदलाव किए हैं जो अभी सहेजे नहीं गए हैं। यदि आप बिना सहेजे पृष्ठ छोड़ते हैं, तो नवीनतम बदलाव खो सकते हैं।
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-rule">
          <button
            type="button"
            onClick={onStay}
            className="px-4 py-2 bg-paper-tint hover:bg-paper-subtle border border-border-rule text-on-surface text-xs font-bold font-mukta cursor-pointer"
          >
            यहीं रहें (Stay & Edit)
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="px-4 py-2 bg-breaking-crimson hover:bg-primary text-white text-xs font-bold font-mukta cursor-pointer shadow-xs"
          >
            पृष्ठ छोड़ें (Discard Changes)
          </button>
        </div>
      </div>
    </div>
  );
}

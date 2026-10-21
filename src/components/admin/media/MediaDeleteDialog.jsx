import React from 'react';
import { AlertTriangle, Trash2, X, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MediaDeleteDialog({
  isOpen,
  onClose,
  onConfirmDelete,
  asset,
  usageInfo,
  isDeleting = false,
}) {
  if (!isOpen || !asset) return null;

  const isUsed = usageInfo?.isUsed;
  const usedArticles = usageInfo?.articles || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-paper-canvas border border-border-rule shadow-2xl max-w-md w-full font-mukta p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-border-rule pb-3">
          <div className="w-8 h-8 rounded-full bg-ticker-tint border border-breaking-crimson/40 flex items-center justify-center text-breaking-crimson shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h3 className="font-mukta text-lg font-bold text-on-surface">
            मीडिया संपत्ति हटाएं (Delete Media Asset)?
          </h3>
        </div>

        {/* Target Asset Preview */}
        <div className="bg-paper-tint p-3 border border-border-rule flex items-center gap-3">
          <div className="w-16 h-12 bg-paper-subtle border border-border-rule overflow-hidden shrink-0">
            {asset.url ? (
              <img src={asset.url} alt="Thumb" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-secondary text-[10px]">
                N/A
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-xs text-on-surface truncate">
              {asset.title || asset.filename}
            </h4>
            <span className="font-mono text-[10px] text-secondary truncate block">
              {asset.filename} ({asset.id})
            </span>
          </div>
        </div>

        {/* Warning if In Use */}
        {isUsed ? (
          <div className="bg-ticker-tint p-3 border border-breaking-crimson text-xs font-inter text-on-surface space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-breaking-crimson">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>चेतावनी: यह छवि {usedArticles.length} आलेखों में सक्रिय रूप से उपयोग हो रही है!</span>
            </div>
            <p className="text-[11px] text-secondary leading-relaxed">
              यदि आप इस छवि को हटाते हैं, तो निम्नलिखित समाचारों में मुख्य या इनलाइन छवि टूटी हुई (broken) प्रदर्शित हो सकती है:
            </p>
            <div className="max-h-28 overflow-y-auto space-y-1 pt-1">
              {usedArticles.map((art) => (
                <div
                  key={art.id}
                  className="bg-paper-canvas p-1.5 border border-border-rule flex items-center justify-between text-[11px]"
                >
                  <span className="truncate font-semibold text-on-surface">{art.title}</span>
                  <span className="text-[9px] uppercase px-1 bg-paper-tint border text-secondary shrink-0 ml-1">
                    {art.isFeatured ? 'मुख्य छवि' : 'इनलाइन'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="font-inter text-xs text-secondary leading-relaxed">
            क्या आप सुनिश्चित हैं कि आप इस मीडिया संपत्ति को लाइब्रेरी से हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।
          </p>
        )}

        {/* CTA Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-rule">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-1.5 border border-border-rule text-xs font-bold text-on-surface hover:bg-paper-subtle cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            रद्द करें (Cancel)
          </button>
          <button
            type="button"
            onClick={() => onConfirmDelete(asset)}
            disabled={isDeleting}
            className="px-4 py-1.5 bg-breaking-crimson hover:bg-primary text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>{isDeleting ? 'हटाया जा रहा है...' : 'हटाएं (Confirm Delete)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import { X, ExternalLink, Download, HardDrive } from 'lucide-react';
import { formatFileSize } from '../../../utils/mediaValidation';

export default function MediaPreviewDialog({ isOpen, onClose, asset }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !asset) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-paper-canvas border border-border-rule shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden font-mukta">
        {/* Top Header */}
        <div className="bg-paper-tint px-4 py-3 border-b border-border-rule flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="font-mukta text-sm sm:text-base font-bold text-on-surface truncate">
              {asset.title || asset.filename}
            </span>
            {asset.isLocalOnly && (
              <span className="px-1.5 py-0.2 bg-blue-700 text-white font-inter text-[9px] font-bold uppercase rounded-2xs shrink-0 flex items-center gap-0.5">
                <HardDrive className="w-2.5 h-2.5" />
                <span>लोकल डेमो</span>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-secondary hover:text-on-surface rounded-xs cursor-pointer"
            title="बंद करें (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image viewport container */}
        <div className="bg-black/90 p-2 sm:p-4 flex items-center justify-center flex-1 overflow-hidden min-h-[280px] max-h-[60vh]">
          {asset.url ? (
            <img
              src={asset.url}
              alt={asset.altText || asset.title}
              className="max-w-full max-h-[56vh] object-contain shadow-lg"
            />
          ) : (
            <div className="text-secondary text-xs font-inter">छवि लोड नहीं की जा सकी</div>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="p-4 bg-paper-canvas border-t border-border-rule space-y-2">
          {asset.caption && (
            <p className="font-mukta text-sm text-on-surface leading-snug">
              {asset.caption}
            </p>
          )}

          <div className="flex items-center justify-between text-xs font-inter text-secondary border-t border-border-rule/60 pt-2 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span>
                <strong>क्रेडिट:</strong> {asset.credit || 'प्रेस ब्यूरो'}
              </span>
              <span>•</span>
              <span>
                <strong>ऑल्ट:</strong> {asset.altText || '--'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {asset.width && asset.height && (
                <span className="font-mono text-[11px] bg-paper-tint px-2 py-0.5 border border-border-rule">
                  {asset.width} × {asset.height} ({asset.aspectRatio || '16:9'})
                </span>
              )}

              {asset.fileSize && (
                <span className="font-mono text-[11px] bg-paper-tint px-2 py-0.5 border border-border-rule">
                  {formatFileSize(asset.fileSize)}
                </span>
              )}

              {asset.url && !asset.isLocalOnly && (
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-paper-subtle hover:bg-paper-tint border border-border-rule text-on-surface font-mukta text-xs font-bold flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>मूल खोलें</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

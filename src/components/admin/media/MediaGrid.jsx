import React from 'react';
import { Image as ImageIcon, Plus } from 'lucide-react';
import MediaCard from './MediaCard';

export default function MediaGrid({
  assets = [],
  selectedAssetId = null,
  onSelect,
  onPreview,
  onInspect,
  onDelete,
  onAddMedia,
  checkAssetUsage,
}) {
  if (assets.length === 0) {
    return (
      <div className="bg-paper-canvas border border-border-rule p-12 text-center shadow-xs">
        <ImageIcon className="w-12 h-12 text-secondary/40 mx-auto mb-3" />
        <h3 className="font-mukta text-lg font-bold text-on-surface">
          कोई मीडिया संपत्ति नहीं मिली
        </h3>
        <p className="font-inter text-xs text-secondary mt-1 max-w-sm mx-auto">
          वर्तमान खोज या फ़िल्टर मापदंडों से मेल खाने वाली कोई छवि नहीं है। नया मीडिया जोड़ें या फ़िल्टर रीसेट करें।
        </p>
        {onAddMedia && (
          <div className="mt-4">
            <button
              type="button"
              onClick={onAddMedia}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-container hover:bg-primary text-white font-mukta text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ नई मीडिया जोड़ें</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
      {assets.map((asset) => {
        const usage = checkAssetUsage ? checkAssetUsage(asset) : null;
        return (
          <MediaCard
            key={asset.id}
            asset={asset}
            isSelected={String(asset.id) === String(selectedAssetId)}
            onSelect={onSelect}
            onPreview={onPreview}
            onInspect={onInspect}
            onDelete={onDelete}
            usageInfo={usage}
          />
        );
      })}
    </div>
  );
}

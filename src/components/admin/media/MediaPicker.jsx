import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Check,
  Plus,
  Image as ImageIcon,
  HardDrive,
  ExternalLink,
  Layers,
  Trash2,
} from 'lucide-react';
import { useMedia } from '../../../context/MediaContext';
import AddMediaDialog from './AddMediaDialog';

export default function MediaPicker({
  isOpen,
  onClose,
  onSelectMedia,
  title = 'मीडिया लाइब्रेरी से छवि चुनें (Select Media)',
  multiple = false,
  selectedIds = [],
}) {
  const { assets, addAssetByUrl, addDemoUploadedFile, uploadBatchAssets } = useMedia();

  // Selected state: supports both single ID and multi-selection Set
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [selectedAssetIds, setSelectedAssetIds] = useState(new Set());

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'images' | 'demo_upload'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Sync initial selection ONLY when modal opens or selectedIds actually changes
  useEffect(() => {
    if (!isOpen) return;

    if (multiple) {
      const arr = Array.isArray(selectedIds) ? selectedIds.map(String) : [];
      setSelectedAssetIds(new Set(arr));
    } else {
      const first = Array.isArray(selectedIds) && selectedIds.length > 0 ? selectedIds[0] : null;
      setSelectedAssetId(first ? String(first) : null);
    }
  }, [isOpen]);

  // Filtered assets
  const filteredAssets = useMemo(() => {
    let result = assets;
    if (filterType === 'demo_upload') {
      result = result.filter((a) => a.source === 'demo_upload' || a.source === 'upload');
    } else if (filterType === 'images') {
      result = result.filter((a) => a.source !== 'demo_upload');
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.filename?.toLowerCase().includes(q) ||
          a.altText?.toLowerCase().includes(q) ||
          a.caption?.toLowerCase().includes(q) ||
          a.credit?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [assets, filterType, search]);

  // Match currently selected asset in single mode by ID or URL
  const singleSelectedAsset = useMemo(() => {
    if (!selectedAssetId) return null;
    const target = String(selectedAssetId);
    return (
      assets.find((a) => String(a.id) === target) ||
      assets.find((a) => a.url === target || a.public_url === target || a.publicUrl === target) ||
      null
    );
  }, [assets, selectedAssetId]);

  if (!isOpen) return null;

  // Toggle selection for an asset
  const handleToggleSelect = (asset) => {
    if (!asset) return;
    if (!multiple) {
      setSelectedAssetId(String(asset.id || asset.url));
      return;
    }

    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      const strId = String(asset.id || asset.url);
      if (next.has(strId)) {
        next.delete(strId);
      } else {
        next.add(strId);
      }
      return next;
    });
  };

  // Double-click to instantly confirm and close
  const handleDoubleClick = (asset) => {
    if (!asset) return;
    if (!multiple) {
      onSelectMedia(asset);
      onClose();
    }
  };

  const handleClearSelection = () => {
    if (multiple) {
      setSelectedAssetIds(new Set());
    } else {
      setSelectedAssetId(null);
    }
  };

  const handleConfirm = () => {
    if (multiple) {
      const selectedList = assets.filter((a) => {
        const idStr = String(a.id);
        const urlStr = String(a.url || a.public_url || '');
        return selectedAssetIds.has(idStr) || (urlStr && selectedAssetIds.has(urlStr));
      });
      if (selectedList.length === 0) return;
      onSelectMedia(selectedList);
      onClose();
    } else {
      if (!singleSelectedAsset) return;
      onSelectMedia(singleSelectedAsset);
      onClose();
    }
  };

  const multiSelectedCount = selectedAssetIds.size;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 font-mukta">
        <div className="bg-paper-canvas border border-border-rule shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-paper-tint px-5 py-3 border-b border-border-rule flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary-container" />
              <h3 className="text-base sm:text-lg font-bold text-on-surface">
                {title}
              </h3>
              {multiple && (
                <span className="px-2 py-0.5 bg-primary-container text-white text-[10px] font-inter uppercase font-bold tracking-wider">
                  मल्टी-सिलेक्ट मोड (Multi-Select)
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-secondary hover:text-on-surface rounded-xs cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toolbar: Search, Filter, + Add button */}
          <div className="p-4 bg-paper-canvas border-b border-border-rule flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="शीर्षक, कैप्शन या टैग से खोजें..."
                className="w-full pl-9 pr-4 py-1.5 bg-paper-tint border border-border-rule font-inter text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>

            {/* Filters & Add Media Button */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center border border-border-rule bg-paper-subtle font-inter text-xs">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 font-semibold cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-paper-canvas text-primary-container font-bold shadow-2xs'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  सभी
                </button>
                <div className="h-3 w-px bg-border-rule" />
                <button
                  type="button"
                  onClick={() => setFilterType('demo_upload')}
                  className={`px-2.5 py-1 font-semibold flex items-center gap-1 cursor-pointer ${
                    filterType === 'demo_upload'
                      ? 'bg-paper-canvas text-blue-700 font-bold shadow-2xs'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  <HardDrive className="w-3 h-3" />
                  <span>अपलोड्स</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-container hover:bg-primary text-white font-mukta text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ नई फ़ाइलें अपलोड करें</span>
              </button>
            </div>
          </div>

          {/* Body: Grid of selectable media */}
          <div className="p-4 overflow-y-auto flex-1 max-h-[50vh] min-h-[250px] bg-paper-subtle/40">
            {filteredAssets.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredAssets.map((asset) => {
                  const idStr = String(asset.id || '');
                  const urlStr = String(asset.url || asset.public_url || '');
                  const isSelected = multiple
                    ? selectedAssetIds.has(idStr) || (urlStr && selectedAssetIds.has(urlStr))
                    : Boolean(selectedAssetId && (idStr === selectedAssetId || (urlStr && urlStr === selectedAssetId)));

                  return (
                    <div
                      key={asset.id || asset.url}
                      onClick={() => handleToggleSelect(asset)}
                      onDoubleClick={() => handleDoubleClick(asset)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleSelect(asset);
                        }
                      }}
                      className={`group relative bg-paper-canvas border overflow-hidden cursor-pointer flex flex-col transition-all select-none ${
                        isSelected
                          ? 'ring-2 ring-primary-container border-primary-container shadow-sm'
                          : 'border-border-rule hover:border-primary-container/50'
                      }`}
                    >
                      <div className="aspect-video bg-paper-subtle relative overflow-hidden">
                        {asset.url ? (
                          <img
                            src={asset.url}
                            alt={asset.altText || asset.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-inter text-[10px] text-secondary">
                            N/A
                          </div>
                        )}

                        {/* Checkbox / Selection Indicator */}
                        <div
                          className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-sm flex items-center justify-center shadow transition-colors ${
                            isSelected
                              ? 'bg-primary-container text-white'
                              : 'bg-black/40 border border-white/60 text-transparent group-hover:bg-black/60'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>

                        {/* Format tag */}
                        <div className="absolute bottom-1 left-1 px-1 py-0.2 bg-border-heavy/90 text-white font-mono text-[9px]">
                          {asset.aspectRatio || '16:9'}
                        </div>
                      </div>

                      <div className="p-1.5 font-mukta">
                        <span className="text-xs font-bold text-on-surface line-clamp-1 block">
                          {asset.title || asset.filename}
                        </span>
                        <span className="text-[10px] text-secondary font-inter block truncate">
                          {asset.credit || 'आज़ाद समाचार'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-secondary space-y-2">
                <ImageIcon className="w-10 h-10 mx-auto text-secondary/40" />
                <p className="font-mukta text-sm font-bold text-on-surface">
                  कोई छवि उपलब्ध नहीं है
                </p>
                <p className="font-inter text-xs">
                  नया वेब URL जोड़ें या स्थानीय फ़ाइलें अपलोड करें।
                </p>
              </div>
            )}
          </div>

          {/* Selected Asset Details Footer Bar */}
          <div className="p-4 bg-paper-tint border-t border-border-rule flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              {multiple ? (
                multiSelectedCount > 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-primary-container text-white text-xs font-bold font-mukta">
                      {multiSelectedCount} {multiSelectedCount > 1 ? 'छवियां चयनित' : 'छवि चयनित'}
                    </span>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-secondary hover:text-breaking-crimson text-xs font-inter underline cursor-pointer"
                    >
                      चयन साफ़ करें
                    </button>
                  </div>
                ) : (
                  <span className="font-inter text-xs text-secondary italic">
                    आलेख में सम्मिलित करने हेतु एक या एकाधिक छवियों पर क्लिक करें।
                  </span>
                )
              ) : singleSelectedAsset ? (
                <div className="flex items-center gap-3">
                  <div className="w-14 h-10 bg-paper-canvas border border-border-rule overflow-hidden shrink-0">
                    <img
                      src={singleSelectedAsset.url}
                      alt="Thumb"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 font-inter text-xs">
                    <span className="font-mukta font-bold text-on-surface block truncate text-sm">
                      {singleSelectedAsset.title}
                    </span>
                    <span className="text-secondary text-[11px] block truncate">
                      ऑल्ट: {singleSelectedAsset.altText || '--'} • साभार: {singleSelectedAsset.credit || '--'}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="font-inter text-xs text-secondary italic">
                  कृपया ऊपर दी गई सूची से किसी छवि पर क्लिक करें।
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-border-rule text-xs font-bold text-on-surface hover:bg-paper-subtle cursor-pointer"
              >
                रद्द करें
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={multiple ? multiSelectedCount === 0 : !singleSelectedAsset}
                className="px-5 py-2 bg-primary-container hover:bg-primary disabled:bg-secondary/40 text-white font-mukta text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {multiple
                    ? `चयनित छवियां सम्मिलित करें (${multiSelectedCount})`
                    : 'चयनित छवि का उपयोग करें (Use Image)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Media Nested Dialog */}
      <AddMediaDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddByUrl={addAssetByUrl}
        onAddUploadedFile={addDemoUploadedFile}
        onBatchUpload={uploadBatchAssets}
      />
    </>
  );
}

import React, { useState, useMemo } from 'react';
import {
  Upload,
  Plus,
  Image as ImageIcon,
  HardDrive,
  RefreshCw,
  SlidersHorizontal,
  Radio,
  FileCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useMedia } from '../../context/MediaContext';
import { formatFileSize } from '../../utils/mediaValidation';
import {
  MediaGrid,
  MediaList,
  MediaFilters,
  MediaDetailPanel,
  AddMediaDialog,
  MediaPreviewDialog,
  MediaDeleteDialog,
} from '../../components/admin/media';

export default function MediaLibraryPage() {
  const {
    assets,
    addAssetByUrl,
    addDemoUploadedFile,
    updateAssetMetadata,
    deleteAsset,
    checkAssetUsage,
    storageStats,
  } = useMedia();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'images' | 'demo_upload' | 'url'
  const [ratioFilter, setRatioFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Selected asset for inspector detail panel
  const [selectedAssetId, setSelectedAssetId] = useState(() => {
    return assets.length > 0 ? assets[0].id : null;
  });

  // Modal dialog states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [deleteTargetAsset, setDeleteTargetAsset] = useState(null);

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    let result = [...assets];

    // 1. Type filter
    if (typeFilter === 'demo_upload') {
      result = result.filter((a) => a.source === 'demo_upload');
    } else if (typeFilter === 'url') {
      result = result.filter((a) => a.source === 'url');
    } else if (typeFilter === 'images') {
      result = result.filter((a) => a.mimeType?.startsWith('image/') || a.source === 'url');
    }

    // 2. Ratio filter
    if (ratioFilter !== 'all') {
      result = result.filter((a) => a.aspectRatio === ratioFilter);
    }

    // 3. Source Agency filter
    if (sourceFilter !== 'all') {
      result = result.filter((a) => a.sourceAgency === sourceFilter);
    }

    // 4. Keyword search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((a) => {
        const titleMatch = a.title?.toLowerCase().includes(q);
        const fileMatch = a.filename?.toLowerCase().includes(q);
        const altMatch = a.altText?.toLowerCase().includes(q);
        const captionMatch = a.caption?.toLowerCase().includes(q);
        const creditMatch = a.credit?.toLowerCase().includes(q);
        const tagMatch = a.tags && a.tags.some((t) => t.toLowerCase().includes(q));
        const idMatch = String(a.id).toLowerCase().includes(q);

        return (
          titleMatch ||
          fileMatch ||
          altMatch ||
          captionMatch ||
          creditMatch ||
          tagMatch ||
          idMatch
        );
      });
    }

    // 5. Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'title_asc') {
        return (a.title || a.filename || '').localeCompare(b.title || b.filename || '');
      }
      if (sortBy === 'title_desc') {
        return (b.title || b.filename || '').localeCompare(a.title || a.filename || '');
      }
      return 0;
    });

    return result;
  }, [assets, typeFilter, ratioFilter, sourceFilter, search, sortBy]);

  // Selected asset object
  const selectedAsset = useMemo(() => {
    return assets.find((a) => String(a.id) === String(selectedAssetId)) || null;
  }, [assets, selectedAssetId]);

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setRatioFilter('all');
    setSourceFilter('all');
    setSortBy('newest');
  };

  const handleConfirmDelete = async (assetId) => {
    try {
      await deleteAsset(assetId);
      toast.success('मीडिया संपत्ति सफलतापूर्वक हटा दी गई');
      setDeleteTargetAsset(null);
      if (String(selectedAssetId) === String(assetId)) {
        setSelectedAssetId(null);
      }
    } catch (err) {
      console.error(err);
      toast.error('हटाने में त्रुटि हुई');
    }
  };

  return (
    <div className="space-y-4 pb-12 font-inter">
      {/* 1. TOP NEWSROOM WIRE ALERT & NOTIFICATION RIBBON */}
      <div className="bg-ticker-tint border border-border-rule px-4 sm:px-6 py-2 flex items-center justify-between flex-wrap gap-2 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary-container text-white font-inter text-[10px] uppercase font-bold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>DAM वायर सिंक सक्रिय</span>
          </span>
          <span className="font-mukta text-xs sm:text-sm text-on-surface">
            <strong>न्यूज़रूम अलर्ट:</strong> मुख्य प्रेस वायर (PTI / ANI / रॉयटर्स) और स्थानीय डेस्क से संपत्तियां केंद्रीय भंडार में उपलब्ध हैं।
          </span>
        </div>

        <div className="flex items-center gap-3 text-secondary font-inter text-xs">
          <span className="flex items-center gap-1">
            <CloudDone className="w-3.5 h-3.5 text-primary-container" />
            <span>CDN अपटाइम: 99.98%</span>
          </span>
        </div>
      </div>

      {/* 2. COMMAND HEADER & STORAGE GAUGE */}
      <div className="bg-paper-canvas border border-border-rule p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Description */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mukta text-xs font-bold uppercase tracking-wider text-primary-container bg-paper-tint px-2 py-0.5 border border-border-rule">
                डिजिटल आर्काइव
              </span>
              <span className="font-mono text-xs text-secondary">
                {assets.length} कुल संपत्तियां
              </span>
            </div>
            <h1 className="font-mukta text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              मीडिया लाइब्रेरी (Media Asset Library)
            </h1>
            <p className="font-inter text-xs sm:text-sm text-secondary mt-0.5 max-w-2xl">
              संपादकीय तस्वीरें, प्रेस रिलीज फोटोज़, इन्फोग्राफिक्स व आधिकारिक हैंडआउट्स का केंद्रीय भंडार।
            </p>
          </div>

          {/* Quick Actions & Storage Meter Card */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Storage Meter */}
            <div className="bg-paper-tint border border-border-rule px-3.5 py-2 flex items-center gap-3">
              <div className="text-left font-inter">
                <div className="flex items-center justify-between gap-4 text-[10px] font-bold text-secondary uppercase">
                  <span>डेमो स्टोरेज कोटा</span>
                  <span className="text-on-surface">
                    {formatFileSize(storageStats.totalBytes) || '42 MB'} / 500 MB
                  </span>
                </div>
                <div className="w-32 sm:w-36 h-1.5 bg-paper-subtle border border-border-rule overflow-hidden mt-1 rounded-full">
                  <div
                    className="bg-primary-container h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(8, (storageStats.totalBytes / storageStats.quotaBytes) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Add Media Button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-container hover:bg-primary text-white font-mukta text-sm font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ नई मीडिया जोड़ें</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. FILTERS & SEARCH TOOLBAR */}
      <MediaFilters
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        ratioFilter={ratioFilter}
        onRatioFilterChange={setRatioFilter}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onResetFilters={handleResetFilters}
        totalCount={assets.length}
        filteredCount={filteredAssets.length}
      />

      {/* 4. MAIN WORKSPACE: SPLIT GRID + RIGHT INSPECTOR PANEL */}
      <div className="flex flex-col xl:flex-row items-start gap-4">
        {/* Left Pane: Media Grid or Table List */}
        <div className="flex-1 w-full min-w-0">
          {viewMode === 'grid' ? (
            <MediaGrid
              assets={filteredAssets}
              selectedAssetId={selectedAssetId}
              onSelect={(art) => setSelectedAssetId(art.id)}
              onPreview={(art) => setPreviewAsset(art)}
              onInspect={(art) => setSelectedAssetId(art.id)}
              onDelete={(art) => setDeleteTargetAsset(art)}
              onAddMedia={() => setIsAddModalOpen(true)}
              checkAssetUsage={checkAssetUsage}
            />
          ) : (
            <MediaList
              assets={filteredAssets}
              selectedAssetId={selectedAssetId}
              onSelect={(art) => setSelectedAssetId(art.id)}
              onPreview={(art) => setPreviewAsset(art)}
              onInspect={(art) => setSelectedAssetId(art.id)}
              onDelete={(art) => setDeleteTargetAsset(art)}
              checkAssetUsage={checkAssetUsage}
            />
          )}
        </div>

        {/* Right Pane: Media Inspector Detail Panel */}
        {selectedAsset && (
          <MediaDetailPanel
            asset={selectedAsset}
            onClose={() => setSelectedAssetId(null)}
            onUpdateMetadata={updateAssetMetadata}
            onPreview={(art) => setPreviewAsset(art)}
            onDelete={(art) => setDeleteTargetAsset(art)}
            checkAssetUsage={checkAssetUsage}
          />
        )}
      </div>

      {/* 5. ADD MEDIA MODAL */}
      <AddMediaDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddByUrl={addAssetByUrl}
        onAddUploadedFile={addDemoUploadedFile}
      />

      {/* 6. FULLSCREEN IMAGE PREVIEW MODAL */}
      <MediaPreviewDialog
        isOpen={Boolean(previewAsset)}
        onClose={() => setPreviewAsset(null)}
        asset={previewAsset}
      />

      {/* 7. SAFE DELETION CONFIRMATION MODAL */}
      <MediaDeleteDialog
        isOpen={Boolean(deleteTargetAsset)}
        onClose={() => setDeleteTargetAsset(null)}
        onConfirmDelete={handleConfirmDelete}
        asset={deleteTargetAsset}
        usageInfo={deleteTargetAsset ? checkAssetUsage(deleteTargetAsset) : null}
      />
    </div>
  );
}

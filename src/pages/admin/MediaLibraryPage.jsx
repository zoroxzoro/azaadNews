import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Upload,
  Plus,
  Image as ImageIcon,
  HardDrive,
  RefreshCw,
  SlidersHorizontal,
  Radio,
  FileCheck,
  Loader2,
  Cloud,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useMedia } from '../../context/MediaContext';
import { backendMediaService } from '../../services/mediaService';
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
import Pagination from '../../components/news/Pagination';

export default function MediaLibraryPage() {
  const {
    addAssetByUrl,
    addDemoUploadedFile,
    uploadAsset,
    uploadBatchAssets,
    updateAssetMetadata,
    deleteAsset,
    checkAssetUsage,
    storageStats,
  } = useMedia();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'images'
  const [ratioFilter, setRatioFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Paginated remote assets state
  const [paginatedAssets, setPaginatedAssets] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const pageSize = 24;
  const reqIdRef = useRef(0);

  // Fetch paginated assets from Supabase
  const fetchMedia = useCallback(async () => {
    const currentReq = ++reqIdRef.current;
    setIsLoading(true);

    try {
      const result = await backendMediaService.fetchMediaAssetsPaginated({
        page: currentPage,
        pageSize,
        search: debouncedSearch,
        type: typeFilter,
        sortBy,
      });

      if (currentReq === reqIdRef.current) {
        setPaginatedAssets(result.data || []);
        setTotalCount(result.total || 0);
        setTotalPages(result.totalPages || 1);
      }
    } catch (err) {
      if (currentReq === reqIdRef.current) {
        console.error('[MediaLibraryPage] fetchMedia error:', err);
        toast.error('मीडिया लोड करने में त्रुटि');
        setPaginatedAssets([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } finally {
      if (currentReq === reqIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentPage, pageSize, debouncedSearch, typeFilter, sortBy]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Selected asset for inspector detail panel
  const [selectedAssetId, setSelectedAssetId] = useState(null);

  // Default selection when page loads
  useEffect(() => {
    if (paginatedAssets.length > 0 && !selectedAssetId) {
      setSelectedAssetId(paginatedAssets[0].id);
    }
  }, [paginatedAssets, selectedAssetId]);

  // Modal dialog states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [deleteTargetAsset, setDeleteTargetAsset] = useState(null);
  const [deleteUsageInfo, setDeleteUsageInfo] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (deleteTargetAsset) {
      checkAssetUsage(deleteTargetAsset).then((info) => {
        if (isMounted) setDeleteUsageInfo(info);
      });
    } else {
      setDeleteUsageInfo(null);
    }
    return () => {
      isMounted = false;
    };
  }, [deleteTargetAsset, checkAssetUsage]);

  // Filter client-side aspect ratio and agency if applied on the current page slice
  const displayedAssets = useMemo(() => {
    let result = [...paginatedAssets];

    if (ratioFilter !== 'all') {
      result = result.filter((a) => a.aspectRatio === ratioFilter);
    }
    if (sourceFilter !== 'all') {
      result = result.filter((a) => a.sourceAgency === sourceFilter);
    }

    return result;
  }, [paginatedAssets, ratioFilter, sourceFilter]);

  // Selected asset object
  const selectedAsset = useMemo(() => {
    return paginatedAssets.find((a) => String(a.id) === String(selectedAssetId)) || null;
  }, [paginatedAssets, selectedAssetId]);

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setRatioFilter('all');
    setSourceFilter('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const handleConfirmDelete = async (assetToDel) => {
    const target = assetToDel || deleteTargetAsset;
    if (!target) return;
    setIsDeleting(true);
    try {
      await deleteAsset(target);
      toast.success('मीडिया संपत्ति सफलतापूर्वक हटा दी गई');
      const removedId = target.id;
      setDeleteTargetAsset(null);
      if (String(selectedAssetId) === String(removedId)) {
        setSelectedAssetId(null);
      }
      fetchMedia();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'हटाने में त्रुटि हुई');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-12 font-inter">
      {/* 1. TOP NEWSROOM WIRE ALERT & NOTIFICATION RIBBON */}
      <div className="bg-ticker-tint border border-border-rule px-4 sm:px-6 py-2 flex items-center justify-between flex-wrap gap-2 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary-container text-white font-inter text-[10px] uppercase font-bold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>DAM आर्काइव सिंक सक्रिय</span>
          </span>
          <span className="font-mukta text-xs sm:text-sm text-on-surface">
            <strong>आज़ाद डिजिटल आर्काइव:</strong> कुल {totalCount.toLocaleString('hi-IN')} ऐतिहासिक एवं संपादकीय मीडिया संपत्तियां उपलब्ध हैं।
          </span>
        </div>

        <div className="flex items-center gap-3 text-secondary font-inter text-xs">
          <button
            onClick={fetchMedia}
            className="flex items-center gap-1 text-primary-container hover:underline cursor-pointer"
            title="रीफ्रेश"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>रीफ्रेश</span>
          </button>
          <span className="flex items-center gap-1">
            <Cloud className="w-3.5 h-3.5 text-primary-container" />
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
              <span className="font-mono text-xs text-secondary font-semibold">
                {totalCount.toLocaleString('hi-IN')} कुल संपत्तियां
              </span>
            </div>
            <h1 className="font-mukta text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              मीडिया लाइब्रेरी (Media Asset Library)
            </h1>
            <p className="font-inter text-xs sm:text-sm text-secondary mt-0.5 max-w-2xl">
              ऐतिहासिक एवं समसामयिक तस्वीरों, प्रेस फोटोज़ व आधिकारिक हैंडआउट्स का केंद्रीय भंडार।
            </p>
          </div>

          {/* Quick Actions & Storage Meter Card */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Storage Meter */}
            <div className="bg-paper-tint border border-border-rule px-3.5 py-2 flex items-center gap-3">
              <div className="text-left font-inter">
                <div className="flex items-center justify-between gap-4 text-[10px] font-bold text-secondary uppercase">
                  <span>क्लाउड स्टोरेज कोटा</span>
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
        onTypeFilterChange={(val) => {
          setTypeFilter(val);
          setCurrentPage(1);
        }}
        ratioFilter={ratioFilter}
        onRatioFilterChange={(val) => {
          setRatioFilter(val);
        }}
        sourceFilter={sourceFilter}
        onSourceFilterChange={(val) => {
          setSourceFilter(val);
        }}
        sortBy={sortBy}
        onSortChange={(val) => {
          setSortBy(val);
          setCurrentPage(1);
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onResetFilters={handleResetFilters}
        totalCount={totalCount}
        filteredCount={displayedAssets.length}
      />

      {/* 4. MAIN WORKSPACE: SPLIT GRID + RIGHT INSPECTOR PANEL */}
      <div className="flex flex-col xl:flex-row items-start gap-4">
        {/* Left Pane: Media Grid or Table List */}
        <div className="flex-1 w-full min-w-0 space-y-4">
          {isLoading ? (
            <div className="bg-paper-canvas border border-border-rule p-12 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary-container" />
              <span className="font-mukta text-sm text-secondary">मीडिया संपत्तियां लोड हो रही हैं...</span>
            </div>
          ) : viewMode === 'grid' ? (
            <MediaGrid
              assets={displayedAssets}
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
              assets={displayedAssets}
              selectedAssetId={selectedAssetId}
              onSelect={(art) => setSelectedAssetId(art.id)}
              onPreview={(art) => setPreviewAsset(art)}
              onInspect={(art) => setSelectedAssetId(art.id)}
              onDelete={(art) => setDeleteTargetAsset(art)}
              checkAssetUsage={checkAssetUsage}
            />
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-2">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 200, behavior: 'smooth' });
                }}
              />
            </div>
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
        onAddByUrl={async (url, meta) => {
          await addAssetByUrl(url, meta);
          fetchMedia();
        }}
        onAddUploadedFile={async (file, meta) => {
          await uploadAsset(file, meta);
          fetchMedia();
        }}
        onBatchUpload={async (items, options) => {
          const res = await uploadBatchAssets(items, options);
          fetchMedia();
          return res;
        }}
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
        usageInfo={deleteUsageInfo}
        isDeleting={isDeleting}
      />
    </div>
  );
}

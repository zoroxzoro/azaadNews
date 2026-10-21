import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  backendMediaService,
  INITIAL_MEDIA_ASSETS,
} from '../services/mediaService.js';
import { useAuth } from './AuthContext.jsx';
import toast from 'react-hot-toast';

const MediaContext = createContext(null);
const DEMO_MEDIA_STORAGE_KEY = 'azaad_demo_media_library_v1';

export function MediaProvider({ children }) {
  const { user, isDemoMode, isLoading: isAuthLoading } = useAuth();
  const [assets, setAssets] = useState(INITIAL_MEDIA_ASSETS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all media assets from Supabase or demo storage
  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isDemoMode) {
        const saved = localStorage.getItem(DEMO_MEDIA_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const clean = parsed.filter(
                (a) =>
                  !a.filename?.includes('bulk-test') &&
                  !a.title?.includes('bulk-test') &&
                  !a.filename?.includes('retry-test')
              );
              try {
                localStorage.setItem(DEMO_MEDIA_STORAGE_KEY, JSON.stringify(clean));
              } catch {}
              setAssets(clean.length > 0 ? clean : INITIAL_MEDIA_ASSETS);
              setIsLoading(false);
              return;
            }
          } catch {}
        }
        setAssets(INITIAL_MEDIA_ASSETS);
        setIsLoading(false);
        return;
      }

      // Production / Supabase mode: Fetch recent 24 assets for preview/selectors
      const data = await backendMediaService.fetchMediaAssets({ limit: 24 });
      setAssets(data);
    } catch (err) {
      console.warn('[MediaContext] Error loading assets:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    if (isAuthLoading) return;
    loadAssets();
  }, [loadAssets, isAuthLoading]);

  /**
   * Upload an image file directly to Supabase Storage with local cache fallback
   */
  const uploadAsset = useCallback(
    async (file, metadata = {}) => {
      const authorId = user?.id || null;
      try {
        const result = await backendMediaService.uploadMediaFile(file, metadata, authorId);
        if (result.success && result.asset) {
          setAssets((prev) => [result.asset, ...prev.filter((a) => a.id !== result.asset.id)]);
          return result.asset;
        }
      } catch (err) {
        console.warn('[MediaContext] Supabase upload failed, checking fallback:', err.message);
        if (!isDemoMode) throw err;
      }

      // Local demo fallback only if Supabase call fails or strictly in demo mode
      const previewUrl = URL.createObjectURL(file);
      const newDemoAsset = {
        id: `ASSET-${Date.now()}`,
        url: previewUrl,
        thumbnailUrl: previewUrl,
        filename: file.name,
        title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
        mimeType: file.type || 'image/jpeg',
        fileSize: file.size,
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        altText: metadata.altText || metadata.title || file.name,
        caption: metadata.caption || '',
        credit: metadata.credit || 'आज़ाद समाचार डिजिटल डेस्क',
        sourceAgency: 'inhouse',
        category: metadata.category || 'national',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'upload',
      };
      setAssets((prev) => [newDemoAsset, ...prev]);
      return newDemoAsset;
    },
    [isDemoMode, user]
  );

  /**
   * Batch Upload multiple files with bounded concurrency and progress reporting
   */
  const uploadBatchAssets = useCallback(
    async (items, options = {}) => {
      const authorId = user?.id || null;
      const res = await backendMediaService.uploadMediaBatch(items, { ...options, authorId });
      const successfulAssets = res.results.filter((r) => r.success && r.asset).map((r) => r.asset);
      if (successfulAssets.length > 0) {
        setAssets((prev) => [...successfulAssets, ...prev]);
      }
      return res;
    },
    [user]
  );

  /**
   * Register media from an external URL
   */
  const addAssetByUrl = useCallback(
    async (payload) => {
      if (isDemoMode) {
        const newAsset = {
          id: `URL-ASSET-${Date.now()}`,
          url: payload.url,
          thumbnailUrl: payload.url,
          filename: payload.url.split('/').pop()?.split('?')[0] || 'web-asset.jpg',
          title: payload.title || 'वेब मीडिया',
          mimeType: 'image/jpeg',
          fileSize: 1048576,
          width: 1200,
          height: 675,
          aspectRatio: '16:9',
          altText: payload.altText || '',
          caption: payload.caption || '',
          credit: payload.credit || 'वेब स्रोत',
          sourceAgency: 'inhouse',
          category: 'national',
          tags: payload.tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: 'url',
        };
        setAssets((prev) => [newAsset, ...prev]);
        return newAsset;
      }

      const authorId = user?.id || null;
      const result = await backendMediaService.registerUrlAsset(payload, authorId);
      if (result.success && result.asset) {
        setAssets((prev) => [result.asset, ...prev.filter((a) => a.id !== result.asset.id)]);
        return result.asset;
      }
      throw new Error('वेब मीडिया जोड़ने में त्रुटि हुई');
    },
    [isDemoMode, user]
  );

  /**
   * Update metadata (altText, caption, credit)
   */
  const updateAssetMetadata = useCallback(
    async (id, updates) => {
      setAssets((prev) =>
        prev.map((asset) => {
          if (String(asset.id) === String(id)) {
            return {
              ...asset,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
          }
          return asset;
        })
      );

      if (!isDemoMode) {
        await backendMediaService.updateMediaAsset(id, updates);
      }
    },
    [isDemoMode]
  );

  /**
   * Check whether an asset is in use before deleting
   */
  const checkAssetUsage = useCallback(
    async (asset) => {
      return backendMediaService.checkAssetUsage(asset);
    },
    []
  );

  /**
   * Delete media asset safely
   */
  const deleteAsset = useCallback(
    async (asset) => {
      const assetId = typeof asset === 'object' ? asset.id : asset;

      if (!isDemoMode) {
        await backendMediaService.deleteMediaAsset(asset);
      }

      setAssets((prev) => prev.filter((a) => String(a.id) !== String(assetId)));
    },
    [isDemoMode]
  );

  /**
   * Storage Quota & Capacity Calculation
   */
  const storageStats = useMemo(() => {
    const totalBytes = assets.reduce((acc, curr) => acc + (Number(curr.fileSize) || 0), 0);
    const maxCapacityBytes = 10737418240; // 10 GB newsroom tier
    const usedPercentage = Math.min(100, Math.round((totalBytes / maxCapacityBytes) * 100));

    return {
      usedBytes: totalBytes,
      maxBytes: maxCapacityBytes,
      percentage: usedPercentage,
      totalAssets: assets.length,
      imageCount: assets.filter((a) => a.mimeType?.startsWith('image/')).length,
    };
  }, [assets]);

  const value = {
    assets,
    isLoading,
    error,
    refreshMedia: loadAssets,
    uploadAsset,
    uploadBatchAssets,
    addDemoUploadedFile: uploadAsset, // Alias for backward compatibility
    addAssetByUrl,
    updateAssetMetadata,
    checkAssetUsage,
    deleteAsset,
    storageStats,
  };

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}

export function useMedia() {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
}

export default MediaContext;

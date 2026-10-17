import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { INITIAL_MEDIA_ASSETS } from '../services/mediaService';
import {
  storeDemoBlob,
  getDemoBlob,
  deleteDemoBlob,
  getOrCreateObjectUrl,
  revokeObjectUrl,
} from '../utils/mediaStorage';
import { extractFilename } from '../utils/mediaValidation';

const MediaContext = createContext(null);
const MEDIA_STORAGE_KEY = 'azaad_media_library_v1';
const ARTICLES_STORAGE_KEY = 'azaad_newsroom_articles_v1';

function loadInitialAssets() {
  if (typeof window === 'undefined') return INITIAL_MEDIA_ASSETS;
  try {
    const saved = localStorage.getItem(MEDIA_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read saved media from localStorage, falling back to initial catalog:', err);
  }
  return INITIAL_MEDIA_ASSETS;
}

export function MediaProvider({ children }) {
  const [assets, setAssets] = useState(loadInitialAssets);

  // Re-hydrate local demo upload object URLs from IndexedDB on startup
  useEffect(() => {
    let isMounted = true;

    async function hydrateLocalBlobs() {
      const demoAssets = assets.filter((a) => a.source === 'demo_upload');
      if (demoAssets.length === 0) return;

      let updated = false;
      const updatedAssets = await Promise.all(
        assets.map(async (asset) => {
          if (asset.source === 'demo_upload') {
            const blob = await getDemoBlob(asset.id);
            if (blob) {
              const freshUrl = getOrCreateObjectUrl(asset.id, blob);
              if (freshUrl && asset.url !== freshUrl) {
                updated = true;
                return { ...asset, url: freshUrl, thumbnailUrl: freshUrl };
              }
            }
          }
          return asset;
        })
      );

      if (isMounted && updated) {
        setAssets(updatedAssets);
      }
    }

    hydrateLocalBlobs();

    return () => {
      isMounted = false;
    };
  }, []);

  // Persist asset metadata to localStorage (clean JSON, no Blobs)
  useEffect(() => {
    try {
      // Clean temporary object URLs from storage to avoid saving stale blob: URLs
      const cleanToStore = assets.map((a) => {
        if (a.source === 'demo_upload') {
          return {
            ...a,
            // Keep record markers for rehydration
            url: a.url?.startsWith('blob:') ? '' : a.url,
            thumbnailUrl: a.thumbnailUrl?.startsWith('blob:') ? '' : a.thumbnailUrl,
          };
        }
        return a;
      });
      localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(cleanToStore));
    } catch (err) {
      console.warn('Failed to persist media assets to localStorage:', err);
    }
  }, [assets]);

  /**
   * Get single asset by ID
   */
  const getAssetById = useCallback(
    (id) => {
      return assets.find((a) => String(a.id) === String(id));
    },
    [assets]
  );

  /**
   * Add new asset via HTTPS URL
   */
  const addAssetByUrl = useCallback(
    ({ url, title, altText, caption, credit, tags = [], category = 'national', sourceAgency = 'inhouse' }) => {
      const id = `ASSET-${Date.now()}`;
      const filename = extractFilename(url);
      const cleanTitle = (title && title.trim()) || filename;

      const newAsset = {
        id,
        url: url.trim(),
        thumbnailUrl: url.trim(),
        filename,
        title: cleanTitle,
        mimeType: 'image/jpeg',
        fileSize: null, // External URL: do not invent fake sizes
        width: null,
        height: null,
        aspectRatio: '16:9',
        altText: altText ? altText.trim() : cleanTitle,
        caption: caption ? caption.trim() : '',
        credit: credit ? credit.trim() : 'प्रेस छायाचित्र / विशेष',
        sourceAgency: sourceAgency || 'inhouse',
        category: category || 'national',
        tags: Array.isArray(tags) ? tags : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'url',
        isLocalOnly: false,
      };

      setAssets((prev) => [newAsset, ...prev]);
      return newAsset;
    },
    []
  );

  /**
   * Add new demonstration asset from user's device File upload
   */
  const addDemoUploadedFile = useCallback(async (file, metadata = {}) => {
    const id = `ASSET-${Date.now()}`;
    const filename = file.name;
    const cleanTitle = metadata.title?.trim() || filename.replace(/\.[^/.]+$/, '');

    // 1. Persist Blob in IndexedDB
    await storeDemoBlob(id, file);

    // 2. Create active Object URL for rendering
    const objectUrl = getOrCreateObjectUrl(id, file);

    // 3. Measure dimensions via browser Image API
    let width = null;
    let height = null;
    let aspectRatio = '16:9';

    try {
      const img = new Image();
      const dimsPromise = new Promise((resolve) => {
        img.onload = () => {
          resolve({ w: img.naturalWidth, h: img.naturalHeight });
        };
        img.onerror = () => resolve(null);
      });
      img.src = objectUrl;
      const dims = await dimsPromise;
      if (dims) {
        width = dims.w;
        height = dims.h;
        const ratioVal = dims.w / dims.h;
        if (Math.abs(ratioVal - 16 / 9) < 0.15) aspectRatio = '16:9';
        else if (Math.abs(ratioVal - 4 / 3) < 0.15) aspectRatio = '4:3';
        else if (Math.abs(ratioVal - 1) < 0.1) aspectRatio = '1:1';
        else if (Math.abs(ratioVal - 9 / 16) < 0.15) aspectRatio = '9:16';
        else aspectRatio = `${dims.w}x${dims.h}`;
      }
    } catch {
      // Non-blocking
    }

    const newAsset = {
      id,
      url: objectUrl,
      thumbnailUrl: objectUrl,
      filename,
      title: cleanTitle,
      mimeType: file.type || 'image/jpeg',
      fileSize: file.size,
      width,
      height,
      aspectRatio,
      altText: metadata.altText?.trim() || cleanTitle,
      caption: metadata.caption?.trim() || '',
      credit: metadata.credit?.trim() || 'स्थानीय न्यूज़डेस्क (डेमो अपलोड)',
      sourceAgency: 'inhouse',
      category: metadata.category || 'national',
      tags: Array.isArray(metadata.tags) ? metadata.tags : ['#डेमोअपलोड'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'demo_upload',
      isLocalOnly: true,
    };

    setAssets((prev) => [newAsset, ...prev]);
    return newAsset;
  }, []);

  /**
   * Update metadata of an existing asset
   */
  const updateAssetMetadata = useCallback((id, updates) => {
    setAssets((prev) =>
      prev.map((item) => {
        if (String(item.id) === String(id)) {
          return {
            ...item,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  }, []);

  /**
   * Delete an asset
   */
  const deleteAsset = useCallback(async (id) => {
    const strId = String(id);
    // Cleanup IndexedDB and object URL if demo upload
    await deleteDemoBlob(strId);
    revokeObjectUrl(strId);

    setAssets((prev) => prev.filter((item) => String(item.id) !== strId));
    return true;
  }, []);

  /**
   * Checks whether an asset is actively referenced by any article in the article store.
   * Scans both `featuredImage` and TipTap `content` JSON or string for the asset's URL or ID.
   */
  const checkAssetUsage = useCallback((asset) => {
    if (!asset) return { isUsed: false, count: 0, articles: [] };

    let articlesList = [];
    try {
      const saved = localStorage.getItem(ARTICLES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) articlesList = parsed;
      }
    } catch {
      // Ignore
    }

    const targetUrl = asset.url;
    const targetId = asset.id;
    const matched = [];

    for (const art of articlesList) {
      let isFeaturedMatch = Boolean(
        targetUrl && art.featuredImage && art.featuredImage.trim() === targetUrl.trim()
      );
      let isContentMatch = false;

      if (art.content) {
        const contentStr =
          typeof art.content === 'string'
            ? art.content
            : JSON.stringify(art.content);

        if (targetUrl && contentStr.includes(targetUrl)) {
          isContentMatch = true;
        } else if (targetId && contentStr.includes(String(targetId))) {
          isContentMatch = true;
        }
      }

      if (isFeaturedMatch || isContentMatch) {
        matched.push({
          id: art.id,
          title: art.title,
          slug: art.slug,
          isFeatured: isFeaturedMatch,
          isInline: isContentMatch,
        });
      }
    }

    return {
      isUsed: matched.length > 0,
      count: matched.length,
      articles: matched,
    };
  }, []);

  /**
   * Storage Quota Calculation
   * Sum of all known file sizes in the library
   */
  const storageStats = useMemo(() => {
    let totalBytes = 0;
    let totalCount = assets.length;
    let localCount = 0;
    let urlCount = 0;

    for (const a of assets) {
      if (a.fileSize && typeof a.fileSize === 'number') {
        totalBytes += a.fileSize;
      }
      if (a.source === 'demo_upload') localCount += 1;
      else urlCount += 1;
    }

    return {
      totalBytes,
      totalCount,
      localCount,
      urlCount,
      quotaBytes: 500 * 1024 * 1024, // 500 MB demo quota
    };
  }, [assets]);

  return (
    <MediaContext.Provider
      value={{
        assets,
        getAssetById,
        addAssetByUrl,
        addDemoUploadedFile,
        updateAssetMetadata,
        deleteAsset,
        checkAssetUsage,
        storageStats,
      }}
    >
      {children}
    </MediaContext.Provider>
  );
}

export function useMedia() {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
}

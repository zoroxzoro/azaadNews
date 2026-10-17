/**
 * Browser Storage Utilities for Azaad Samachar Media Assets
 *
 * Persists URL metadata to localStorage and local demonstration uploaded file
 * Blobs to browser IndexedDB, avoiding large base64 strings in localStorage.
 */

const DB_NAME = 'azaad_media_db_v1';
const DB_VERSION = 1;
const STORE_NAME = 'blobs';

// Memory fallback cache if IndexedDB is blocked or unavailable
const memoryBlobCache = new Map();

/**
 * Opens or initializes the IndexedDB database
 */
function openMediaDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.warn('IndexedDB open error, falling back to in-memory store:', event.target.error);
        resolve(null);
      };
    } catch (err) {
      console.warn('IndexedDB not supported or blocked:', err);
      resolve(null);
    }
  });
}

/**
 * Stores a demonstration file Blob into IndexedDB
 */
export async function storeDemoBlob(id, blobOrFile) {
  memoryBlobCache.set(String(id), blobOrFile);

  const db = await openMediaDB();
  if (!db) return true;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const record = {
        id: String(id),
        blob: blobOrFile,
        savedAt: new Date().toISOString(),
      };
      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = () => {
        console.warn('Failed to put blob into IndexedDB:', req.error);
        resolve(false);
      };
    } catch (err) {
      console.warn('Transaction error in storeDemoBlob:', err);
      resolve(false);
    }
  });
}

/**
 * Retrieves a demonstration file Blob from IndexedDB or memory cache
 */
export async function getDemoBlob(id) {
  const strId = String(id);
  if (memoryBlobCache.has(strId)) {
    return memoryBlobCache.get(strId);
  }

  const db = await openMediaDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(strId);

      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          memoryBlobCache.set(strId, req.result.blob);
          resolve(req.result.blob);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Deletes a demo Blob from IndexedDB and memory
 */
export async function deleteDemoBlob(id) {
  const strId = String(id);
  memoryBlobCache.delete(strId);

  const db = await openMediaDB();
  if (!db) return true;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.delete(strId);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Object URL Registry to prevent memory leaks while keeping URLs alive for active views
 */
const activeObjectUrls = new Map();

/**
 * Creates or retrieves a cached object URL for a given Blob
 */
export function getOrCreateObjectUrl(id, blob) {
  const key = String(id);
  if (activeObjectUrls.has(key)) {
    return activeObjectUrls.get(key);
  }

  if (blob && typeof window !== 'undefined' && window.URL && window.URL.createObjectURL) {
    try {
      const url = window.URL.createObjectURL(blob);
      activeObjectUrls.set(key, url);
      return url;
    } catch (err) {
      console.warn('Failed to create object URL:', err);
    }
  }

  return null;
}

/**
 * Revokes an object URL when an asset is deleted
 */
export function revokeObjectUrl(id) {
  const key = String(id);
  if (activeObjectUrls.has(key)) {
    const url = activeObjectUrls.get(key);
    if (url && typeof window !== 'undefined' && window.URL && window.URL.revokeObjectURL) {
      try {
        window.URL.revokeObjectURL(url);
      } catch (err) {
        // Ignore
      }
    }
    activeObjectUrls.delete(key);
  }
}

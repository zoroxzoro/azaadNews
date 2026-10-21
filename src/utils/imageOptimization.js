/**
 * Image Optimization Utilities for Azaad Samachar
 * Newsroom Digital Asset Management (DAM)
 *
 * Provides:
 * - Client-side responsive image resizing (max 1920px).
 * - Automatic conversion to WebP format for optimal performance without visual degradation.
 * - Aspect ratio measurement and preservation (16:9 broadsheet standard).
 * - Safe file naming and storage path generation (articles/YYYY/MM/...).
 * - Fallback protection for SVGs and animated GIFs.
 */

export const IMAGE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_DIMENSION: 1920,             // Max width or height in pixels
  THUMBNAIL_MAX_DIMENSION: 400,    // Thumbnail dimension
  WEBP_QUALITY: 0.85,              // WebP compression quality (high visual fidelity)
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ],
};

/**
 * Calculates standard editorial aspect ratio string from dimensions
 */
export function calculateAspectRatio(width, height) {
  if (!width || !height) return '16:9';
  const ratio = width / height;

  if (Math.abs(ratio - 16 / 9) < 0.15) return '16:9';
  if (Math.abs(ratio - 4 / 3) < 0.15) return '4:3';
  if (Math.abs(ratio - 1) < 0.1) return '1:1';
  if (Math.abs(ratio - 9 / 16) < 0.15) return '9:16';
  if (Math.abs(ratio - 3 / 2) < 0.15) return '3:2';

  return `${Math.round(ratio * 100) / 100}:1`;
}

/**
 * Generates a structured, conflict-free Supabase Storage path:
 * e.g. articles/2026/10/1729339200000-parliament-session.webp
 */
export function generateStoragePath(originalFilename, folder = 'articles') {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // Strip extension and sanitize filename for URL safety
  const baseName = originalFilename
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'news-image';

  const timestamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 7);
  const uniqueName = `${timestamp}-${rand}-${baseName}.webp`;

  return `${folder}/${year}/${month}/${uniqueName}`;
}

/**
 * Calculates scaled dimensions preserving aspect ratio within max limits
 */
export function calculateTargetDimensions(originalWidth, originalHeight, maxDim = IMAGE_CONFIG.MAX_DIMENSION) {
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (originalWidth > maxDim || originalHeight > maxDim) {
    if (originalWidth > originalHeight) {
      targetWidth = maxDim;
      targetHeight = Math.round((originalHeight * maxDim) / originalWidth);
    } else {
      targetHeight = maxDim;
      targetWidth = Math.round((originalWidth * maxDim) / originalHeight);
    }
  }

  return { width: targetWidth, height: targetHeight };
}

/**
 * Optimizes an image File using browser HTML5 Canvas API before uploading.
 * Resizes large dimensions, converts to WebP, and preserves aspect ratio.
 */
export async function optimizeImageForUpload(file, options = {}) {
  const maxDim = options.maxDimension || IMAGE_CONFIG.MAX_DIMENSION;
  const quality = options.quality || IMAGE_CONFIG.WEBP_QUALITY;

  // SVGs and animated GIFs should not be rasterized through Canvas
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return {
      file,
      blob: file,
      width: null,
      height: null,
      aspectRatio: '16:9',
      mimeType: file.type,
      filename: file.name,
      fileSize: file.size,
      wasOptimized: false,
    };
  }

  // If running in an environment without DOM/Canvas (e.g. Node tests), return original
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      file,
      blob: file,
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      mimeType: file.type || 'image/jpeg',
      filename: file.name,
      fileSize: file.size,
      wasOptimized: false,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;
      const aspectRatio = calculateAspectRatio(originalWidth, originalHeight);

      const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(originalWidth, originalHeight, maxDim);

      // Draw onto canvas for conversion & scaling
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      // Use high quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // If PNG with transparency, fill with transparent/clean pixels
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Determine output format: prefer WebP
      const outputMime = 'image/webp';
      const outputExt = '.webp';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback to original file if toBlob fails
            resolve({
              file,
              blob: file,
              width: originalWidth,
              height: originalHeight,
              aspectRatio,
              mimeType: file.type,
              filename: file.name,
              fileSize: file.size,
              wasOptimized: false,
            });
            return;
          }

          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const newFilename = `${baseName}${outputExt}`;

          const optimizedFile = new File([blob], newFilename, {
            type: outputMime,
            lastModified: Date.now(),
          });

          resolve({
            file: optimizedFile,
            blob,
            width: targetWidth,
            height: targetHeight,
            aspectRatio,
            mimeType: outputMime,
            filename: newFilename,
            fileSize: blob.size,
            originalSize: file.size,
            wasOptimized: true,
          });
        },
        outputMime,
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image for optimization: ${err.message || 'invalid image'}`));
    };

    img.src = objectUrl;
  });
}

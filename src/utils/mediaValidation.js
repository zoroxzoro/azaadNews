/**
 * Media Asset Validation Utilities
 * Azaad Samachar Newsroom Digital Asset Management (DAM)
 */

export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

/**
 * Formats byte size into human readable string (KB, MB, GB)
 */
export function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined || Number.isNaN(Number(bytes))) {
    return null;
  }
  const b = Number(bytes);
  if (b === 0) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Validates external media URL and basic editorial metadata
 */
export function validateMediaUrlInput({ url, altText, caption, credit }) {
  const errors = {};

  // 1. URL validation
  if (!url || !url.trim()) {
    errors.url = 'छवि यूआरएल (Image URL) अनिवार्य है।';
  } else {
    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        errors.url = 'केवल http या https वेब यूआरएल ही मान्य हैं।';
      } else if (parsed.protocol === 'http:') {
        errors.url = 'सुरक्षा कारणों से HTTPS यूआरएल का उपयोग करें (Use HTTPS)।';
      }
    } catch {
      errors.url = 'अमान्य वेब पता। कृपया पूर्ण यूआरएल (https://...) दर्ज करें।';
    }
  }

  // 2. Alt text validation (Accessibility & Google News requirement)
  if (!altText || !altText.trim()) {
    errors.altText = 'एसईओ व दृष्टिबाधित पाठकों हेतु ऑल्ट टेक्स्ट (Alt Text) अनिवार्य है।';
  } else if (altText.trim().length < 3) {
    errors.altText = 'ऑल्ट टेक्स्ट कम से कम 3 वर्णों का होना चाहिए।';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates a local file selected for demo upload
 */
export function validateMediaFile(file) {
  const errors = [];

  if (!file) {
    errors.push('कोई फ़ाइल प्राप्त नहीं हुई।');
    return { isValid: false, errors };
  }

  // 1. MIME type validation
  const fileType = file.type?.toLowerCase() || '';
  const extension = (file.name || '').split('.').pop()?.toLowerCase();

  const isMimeAllowed = ALLOWED_MIME_TYPES.includes(fileType);
  const isExtAllowed = ALLOWED_EXTENSIONS.includes(extension);

  if (!isMimeAllowed && !isExtAllowed) {
    errors.push(
      `अमान्य फ़ाइल प्रकार (${extension || 'unknown'})। केवल JPG, PNG, WebP, GIF छवियां ही मान्य हैं।`
    );
  }

  // 2. Size limit validation
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    errors.push(
      `फ़ाइल का आकार (${formatFileSize(file.size)}) अधिकतम सीमा (25 MB) से अधिक है। कृपया संपीड़ित (compress) करें।`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Extracts clean filename from URL or File object
 */
export function extractFilename(urlOrFile) {
  if (!urlOrFile) return 'untitled_asset';

  if (typeof urlOrFile === 'object' && urlOrFile.name) {
    return urlOrFile.name;
  }

  if (typeof urlOrFile === 'string') {
    try {
      const parsed = new URL(urlOrFile);
      const pathname = parsed.pathname;
      const name = pathname.substring(pathname.lastIndexOf('/') + 1);
      if (name && name.includes('.')) {
        return decodeURIComponent(name);
      }
      return `${parsed.hostname.replace(/\./g, '_')}_image.jpg`;
    } catch {
      return 'web_asset.jpg';
    }
  }

  return 'asset.jpg';
}

/**
 * YouTube Utility functions for Azaad Samachar
 * Safely extracts video IDs, validates them, and builds privacy-enhanced embed URLs.
 */

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extracts YouTube video ID from various standard URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 *
 * @param {string} url - YouTube URL to parse
 * @returns {string|null} - 11-char video ID or null if invalid
 */
export function getYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  // If already an 11-character video ID
  if (YOUTUBE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const hostname = parsed.hostname.toLowerCase();

    // youtu.be/VIDEO_ID
    if (hostname === 'youtu.be' || hostname.endsWith('.youtu.be')) {
      const id = parsed.pathname.slice(1).split(/[?#&]/)[0];
      return YOUTUBE_ID_REGEX.test(id) ? id : null;
    }

    // youtube.com / m.youtube.com / www.youtube-nocookie.com
    if (hostname.includes('youtube.com') || hostname.includes('youtube-nocookie.com')) {
      // /watch?v=VIDEO_ID
      const vParam = parsed.searchParams.get('v');
      if (vParam && YOUTUBE_ID_REGEX.test(vParam)) {
        return vParam;
      }

      // /shorts/VIDEO_ID or /embed/VIDEO_ID or /v/VIDEO_ID
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (['shorts', 'embed', 'v', 'live'].includes(pathParts[0]) && pathParts[1]) {
        const id = pathParts[1].split(/[?#&]/)[0];
        return YOUTUBE_ID_REGEX.test(id) ? id : null;
      }
    }
  } catch {
    // Regex fallback in case URL parsing fails on unconventional strings
    const match = trimmed.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i
    );
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Builds a privacy-friendly YouTube embed URL
 *
 * @param {string} urlOrId - YouTube URL or raw Video ID
 * @param {object} [options] - Optional player parameters
 * @returns {string|null} - Embed URL or null if invalid
 */
export function getYouTubeEmbedUrl(urlOrId, options = {}) {
  const videoId = getYouTubeVideoId(urlOrId);
  if (!videoId) return null;

  const { autoplay = 1, rel = 0, modestbranding = 1 } = options;
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    rel: rel ? '1' : '0',
    modestbranding: modestbranding ? '1' : '0',
    playsinline: '1',
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Generates high-quality YouTube video thumbnail URL from ID
 *
 * @param {string} urlOrId - YouTube URL or raw Video ID
 * @param {'hqdefault'|'maxresdefault'|'mqdefault'} [quality='hqdefault']
 * @returns {string|null}
 */
export function getYouTubeThumbnail(urlOrId, quality = 'hqdefault') {
  const videoId = getYouTubeVideoId(urlOrId);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

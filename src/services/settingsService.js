import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const STORAGE_PREFIX = 'azaad_settings_';

export const DEFAULT_SETTINGS = {
  publication: {
    nameHindi: 'आज़ाद समाचार',
    nameEnglish: 'Azaad Samachar',
    tagline: 'सच्ची खबर पक्की खबर | निष्पक्ष • निर्भीक • सटीक',
    rniNumber: 'RNI/DEL/2024/AZAAD',
    editorInChief: 'संपादक मंडल (Editorial Board)',
    contactEmail: 'editor@azaadsamachar.com',
  },
  editorial: {
    defaultStatus: 'draft',
    autoSlugEnabled: true,
    requireExcerpt: true,
    aiCheckOnSubmit: true,
    defaultCategory: 'national',
  },
  notifications: {
    emailOnPublish: false,
    inAppOnSchedule: true,
    inAppOnReview: true,
    notifyOnAiFlag: true,
  },
  seo: {
    defaultMetaTitle: 'आज़ाद समाचार - निष्पक्ष • निर्भीक • राष्ट्रीय दैनिक',
    defaultMetaDescription: 'देश, राज्य, राजनीति, व्यापार और खेल की ताज़ा एवं विश्वसनीय खबरें।',
    canonicalBaseUrl: 'https://azaadsamachar.com',
  },
};

export const settingsService = {
  /**
   * Synchronously return cached settings with defaults (0ms delay)
   */
  getCachedSettings() {
    const keys = ['publication', 'editorial', 'notifications', 'seo'];
    const result = {};

    for (const groupKey of keys) {
      const fallback = DEFAULT_SETTINGS[groupKey] || {};
      let cached = null;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const raw = localStorage.getItem(`${STORAGE_PREFIX}${groupKey}`);
          if (raw) {
            cached = JSON.parse(raw);
          }
        }
      } catch {
        // ignore storage access errors
      }
      result[groupKey] = cached ? { ...fallback, ...cached } : { ...fallback };
    }

    return result;
  },

  /**
   * Fetch a setting group by key (e.g. 'publication', 'editorial', 'notifications', 'seo')
   */
  async getSettings(groupKey) {
    const cached = this.getCachedSettings();
    const fallback = cached[groupKey] || DEFAULT_SETTINGS[groupKey] || {};

    if (!isSupabaseConfigured) {
      return fallback;
    }

    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', groupKey)
        .maybeSingle();

      if (!error && data?.value) {
        const merged = { ...fallback, ...data.value };
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(`${STORAGE_PREFIX}${groupKey}`, JSON.stringify(merged));
          }
        } catch {
          // ignore
        }
        return merged;
      }
    } catch (err) {
      console.warn(`[settingsService] getSettings(${groupKey}) db fetch fallback:`, err.message);
    }

    return fallback;
  },

  /**
   * Save a setting group by key to localStorage and Supabase site_settings table
   */
  async saveSettings(groupKey, value) {
    const fallback = DEFAULT_SETTINGS[groupKey] || {};
    const merged = { ...fallback, ...value };

    // 1. Cache to local storage immediately
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`${STORAGE_PREFIX}${groupKey}`, JSON.stringify(merged));
      }
    } catch {
      // ignore
    }

    // 2. Persist to Supabase site_settings table
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('site_settings')
        .upsert(
          {
            key: groupKey,
            value: merged,
            description: `Configuration group for ${groupKey}`,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );

      if (error) {
        console.error(`[settingsService] saveSettings(${groupKey}) db error:`, error.message);
        throw new Error(error.message || 'डेटाबेस में सेटिंग्स सहेजने में विफल');
      }
    }

    return merged;
  },

  /**
   * Load all system settings in a single fast database query
   */
  async getAllSettings() {
    const result = this.getCachedSettings();

    if (!isSupabaseConfigured) {
      return result;
    }

    try {
      // Single query for all keys rather than multiple roundtrips
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          if (row?.key && row?.value && result[row.key]) {
            result[row.key] = { ...result[row.key], ...row.value };
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(`${STORAGE_PREFIX}${row.key}`, JSON.stringify(result[row.key]));
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } catch (err) {
      console.warn('[settingsService] getAllSettings error:', err.message);
    }

    return result;
  },
};

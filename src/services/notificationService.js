/**
 * Notification Service for Azaad Samachar (आज़ाद समाचार)
 *
 * Real, database-backed notification system for editorial newsroom:
 * - Reflects real database events from `editorial_activity`:
 *   article published, article scheduled, in review, auto-publish, draft.
 * - Accurate unread count persisted across page refreshes.
 * - Full support for mark as read and mark all as read.
 * - Deep linking to corresponding articles (/news/:slug or /admin/news).
 * - Instant reactive updates across open components via custom events.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const READ_NOTIFS_STORAGE_KEY = 'azaad_read_notification_ids_v1';
const NOTIF_CHANGE_EVENT = 'azaad_notifications_changed';

/**
 * Retrieve read notification IDs from localStorage
 */
function getReadNotifIds() {
  try {
    const raw = localStorage.getItem(READ_NOTIFS_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Save read notification IDs to localStorage
 */
function saveReadNotifIds(idSet) {
  try {
    localStorage.setItem(READ_NOTIFS_STORAGE_KEY, JSON.stringify(Array.from(idSet)));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Dispatches an in-memory event so open topbar/components immediately update
 */
function notifyChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NOTIF_CHANGE_EVENT));
  }
}

/**
 * Format a database editorial_activity row into a standard Notification object
 */
function formatActivityToNotification(act, readSet) {
  const details = act.details || {};
  const article = act.articles || {};
  const title = article.title || details.title || 'समाचार आलेख';
  const slug = article.slug || details.slug || '';
  const action = act.action || 'created';

  let type = 'system';
  let notifTitle = 'संपादकीय सूचना';
  let message = `आलेख "${title.slice(0, 45)}${title.length > 45 ? '...' : ''}" अद्यतित किया गया।`;
  let link = act.article_id ? `/admin/news/edit/${act.article_id}` : '/admin/news';

  if (action === 'published') {
    type = 'published';
    notifTitle = 'समाचार लाइव प्रकाशित हुआ (Published)';
    message = `"${title.slice(0, 45)}${title.length > 45 ? '...' : ''}" पोर्टल पर लाइव उपलब्ध है।`;
    link = slug ? `/news/${slug}` : act.article_id ? `/admin/news/edit/${act.article_id}` : '/admin/news';
  } else if (action === 'scheduled') {
    type = 'scheduled';
    notifTitle = 'समाचार शेड्यूल किया गया (Scheduled)';
    message = `"${title.slice(0, 45)}${title.length > 45 ? '...' : ''}" को निर्धारित समय अनुसार प्रकाशन हेतु शेड्यूल किया गया।`;
    link = '/admin/scheduled';
  } else if (action === 'auto_publish_scheduled') {
    type = 'published';
    notifTitle = 'स्वतः शेड्यूल्ड प्रकाशन (Auto-Published)';
    message = `"${title.slice(0, 45)}${title.length > 45 ? '...' : ''}" निर्धारित समय पर स्वतः लाइव प्रकाशित हुआ।`;
    link = slug ? `/news/${slug}` : '/admin/news';
  } else if (action === 'review' || action === 'in_review') {
    type = 'review';
    notifTitle = 'समीक्षा हेतु प्रस्तुत (In Review)';
    message = `"${title.slice(0, 45)}${title.length > 45 ? '...' : ''}" संपादक की समीक्षा कतार में है।`;
    link = '/admin/news';
  } else if (action === 'created') {
    type = 'draft';
    notifTitle = 'नया आलेख रचा गया';
    message = `"${title.slice(0, 45)}${title.length > 45 ? '...' : ''}" रचा गया (${details.status || 'draft'})।`;
    link = act.article_id ? `/admin/news/edit/${act.article_id}` : '/admin/news';
  } else if (action === 'media') {
    type = 'media';
    notifTitle = 'नया मीडिया अपलोड हुआ';
    message = details.filename ? `फ़ाइल "${details.filename}" मीडिया लाइब्रेरी में जोड़ी गई।` : 'मीडिया अपलोड हुआ।';
    link = '/admin/media';
  }

  return {
    id: act.id,
    type,
    title: notifTitle,
    message,
    article_id: act.article_id,
    link,
    is_read: readSet.has(act.id),
    created_at: act.created_at,
  };
}

export const notificationService = {
  /**
   * Fetch recent editorial notifications from real database events
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getNotifications(limit = 20) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('editorial_activity')
          .select(`
            id,
            article_id,
            user_id,
            action,
            details,
            created_at,
            articles(id, title, slug)
          `)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && Array.isArray(data)) {
          const readSet = getReadNotifIds();
          return data.map((act) => formatActivityToNotification(act, readSet));
        }
      } catch (err) {
        console.warn('[notificationService] Database fetch warning:', err);
      }
    }

    return [];
  },

  /**
   * Get unread notification count based on real database records
   * @returns {Promise<number>}
   */
  async getUnreadCount() {
    try {
      const notifications = await this.getNotifications(50);
      return notifications.filter((n) => !n.is_read).length;
    } catch {
      return 0;
    }
  },

  /**
   * Create and persist a new editorial activity notification
   */
  async createNotification({ type, title, message = '', articleId = null, link = '/admin/news' }) {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('editorial_activity').insert({
          article_id: articleId,
          action: type,
          details: { title, message, link },
        });
      } catch (err) {
        console.warn('[notificationService] Failed to insert editorial activity:', err);
      }
    }

    notifyChange();
  },

  /**
   * Mark a single notification as read
   * @param {string} notificationId
   */
  async markAsRead(notificationId) {
    const readSet = getReadNotifIds();
    readSet.add(notificationId);
    saveReadNotifIds(readSet);
    notifyChange();
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const list = await this.getNotifications(100);
      const readSet = getReadNotifIds();
      list.forEach((n) => readSet.add(n.id));
      saveReadNotifIds(readSet);
      notifyChange();
    } catch (err) {
      console.warn('[notificationService] markAllAsRead error:', err);
    }
  },

  /**
   * Subscribe to notification change events
   * @param {Function} callback
   * @returns {Function} cleanup function
   */
  subscribe(callback) {
    if (typeof window === 'undefined') return () => {};
    const handler = () => callback();
    window.addEventListener(NOTIF_CHANGE_EVENT, handler);
    return () => window.removeEventListener(NOTIF_CHANGE_EVENT, handler);
  },
};

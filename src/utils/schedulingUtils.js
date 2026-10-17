/**
 * Scheduling Utilities & Editorial Queue Helpers
 * Azaad Samachar Newsroom CMS
 */

import {
  getIstParts,
  getRelativeIstDates,
  isFutureDate,
  isOverdueScheduled,
  combineIstDateTimeToUtcIso,
  formatInIST,
  NEWSROOM_TIMEZONE,
} from './timezoneUtils';
import { validateForPublishing } from './articleValidation';
import { normalizeStatus, ARTICLE_STATUS } from './articleStatus';

/**
 * Validates full editorial criteria before scheduling an article,
 * ensuring all publishing rules are met AND the scheduled date/time is in the future.
 *
 * @param {Object} formData Article form data (title, summary, category, etc.)
 * @param {string} scheduledAtUtcIso Canonical UTC ISO string
 * @param {string|number} articleId Current editing article ID
 * @param {Array} allArticles Existing articles list for slug uniqueness check
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateForScheduling(formData, scheduledAtUtcIso, articleId, allArticles = []) {
  // 1. Run core publishing validation (title, summary, category, language, content, slug, media)
  const baseValidation = validateForPublishing(formData, articleId, allArticles);
  const errors = { ...baseValidation.errors };

  // 2. Validate scheduledAt
  if (!scheduledAtUtcIso) {
    errors.scheduledAt = 'प्रकाशन की तारीख एवं समय का चयन अनिवार्य है।';
  } else {
    const dateObj = new Date(scheduledAtUtcIso);
    if (Number.isNaN(dateObj.getTime())) {
      errors.scheduledAt = 'अमान्य तारीख या समय प्रारूप।';
    } else if (!isFutureDate(scheduledAtUtcIso)) {
      errors.scheduledAt = 'शेड्यूल किया गया समय भविष्य का होना चाहिए (Scheduled time must be in the future)।';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Normalizes article scheduled timestamp from various property names:
 * (scheduledAt, scheduledFor, etc.)
 */
export function getArticleScheduledTime(article) {
  if (!article) return null;
  return article.scheduledAt || article.scheduledFor || null;
}

/**
 * Calculates newsroom scheduling statistics from the shared article collection.
 * Uses strict Asia/Kolkata (IST) calendar day boundaries.
 *
 * Statistics calculated:
 * - totalScheduled: All articles with status === 'scheduled'
 * - scheduledToday: Scheduled articles scheduled for Today in IST
 * - scheduledThisWeek: Scheduled articles scheduled within the current 7 days / calendar week
 * - overdueScheduled: Scheduled articles whose scheduled time has passed but status is still 'scheduled'
 *
 * @param {Array} articles
 * @returns {{
 *   totalScheduled: number,
 *   scheduledToday: number,
 *   scheduledThisWeek: number,
 *   overdueScheduled: number,
 *   scheduledList: Array
 * }}
 */
export function calculateSchedulingStats(articles = []) {
  const { todayKey } = getRelativeIstDates();
  const nowMs = Date.now();
  // 7 days window (current day to 7 days ahead)
  const endOfWeekMs = nowMs + 7 * 24 * 60 * 60 * 1000;

  let totalScheduled = 0;
  let scheduledToday = 0;
  let scheduledThisWeek = 0;
  let overdueScheduled = 0;

  const scheduledArticles = [];

  for (const article of articles) {
    const status = normalizeStatus(article.status);
    if (status !== ARTICLE_STATUS.SCHEDULED) continue;

    const scheduledTime = getArticleScheduledTime(article);
    if (!scheduledTime) continue;

    totalScheduled += 1;
    scheduledArticles.push(article);

    const schedMs = new Date(scheduledTime).getTime();
    const parts = getIstParts(scheduledTime);

    // Overdue check
    if (schedMs <= nowMs) {
      overdueScheduled += 1;
    } else {
      // Future checks
      if (parts && parts.dateStr === todayKey) {
        scheduledToday += 1;
      }
      if (schedMs >= nowMs && schedMs <= endOfWeekMs) {
        scheduledThisWeek += 1;
      }
    }
  }

  return {
    totalScheduled,
    scheduledToday,
    scheduledThisWeek,
    overdueScheduled,
    scheduledList: scheduledArticles,
  };
}

/**
 * Groups scheduled articles by IST calendar date (YYYY-MM-DD).
 *
 * @param {Array} articles
 * @returns {Record<string, Array>} Map of 'YYYY-MM-DD' => array of scheduled articles
 */
export function groupArticlesByIstDate(articles = []) {
  const grouped = {};

  for (const article of articles) {
    if (normalizeStatus(article.status) !== ARTICLE_STATUS.SCHEDULED) continue;
    const scheduledTime = getArticleScheduledTime(article);
    if (!scheduledTime) continue;

    const parts = getIstParts(scheduledTime);
    if (!parts) continue;

    const key = parts.dateStr;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(article);
  }

  // Sort articles within each date by scheduled time
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => {
      const timeA = new Date(getArticleScheduledTime(a)).getTime();
      const timeB = new Date(getArticleScheduledTime(b)).getTime();
      return timeA - timeB;
    });
  }

  return grouped;
}

/**
 * Partitions scheduled articles into editorial publishing queue buckets:
 * - overdue: Passed scheduled time, still marked 'scheduled' (requires editorial attention)
 * - today: Scheduled for today in IST
 * - tomorrow: Scheduled for tomorrow in IST
 * - laterThisWeek: Scheduled within the next 2-7 days in IST
 * - upcoming: Scheduled beyond 7 days
 *
 * @param {Array} articles
 * @returns {{
 *   overdue: Array,
 *   today: Array,
 *   tomorrow: Array,
 *   laterThisWeek: Array,
 *   upcoming: Array
 * }}
 */
export function partitionPublishingQueue(articles = []) {
  const { todayKey, tomorrowKey } = getRelativeIstDates();
  const nowMs = Date.now();
  const weekCutoffMs = nowMs + 7 * 24 * 60 * 60 * 1000;

  const result = {
    overdue: [],
    today: [],
    tomorrow: [],
    laterThisWeek: [],
    upcoming: [],
  };

  const scheduled = articles
    .filter((a) => normalizeStatus(a.status) === ARTICLE_STATUS.SCHEDULED)
    .sort((a, b) => {
      const timeA = new Date(getArticleScheduledTime(a)).getTime();
      const timeB = new Date(getArticleScheduledTime(b)).getTime();
      return timeA - timeB;
    });

  for (const article of scheduled) {
    const scheduledTime = getArticleScheduledTime(article);
    if (!scheduledTime) continue;

    const schedMs = new Date(scheduledTime).getTime();
    const parts = getIstParts(scheduledTime);
    if (!parts) continue;

    if (schedMs <= nowMs) {
      result.overdue.push(article);
    } else if (parts.dateStr === todayKey) {
      result.today.push(article);
    } else if (parts.dateStr === tomorrowKey) {
      result.tomorrow.push(article);
    } else if (schedMs <= weekCutoffMs) {
      result.laterThisWeek.push(article);
    } else {
      result.upcoming.push(article);
    }
  }

  return result;
}

/**
 * Filters scheduled articles based on user query options:
 * category, language, search text, and date range.
 */
export function filterScheduledArticles(articles = [], filters = {}) {
  const { category = 'all', language = 'all', search = '', dateFilter = 'all' } = filters;
  const { todayKey, tomorrowKey } = getRelativeIstDates();
  const searchLower = search.trim().toLowerCase();

  return articles.filter((article) => {
    if (normalizeStatus(article.status) !== ARTICLE_STATUS.SCHEDULED) return false;

    // Category
    if (category !== 'all' && article.category !== category) return false;

    // Language
    if (language !== 'all' && article.language !== language) return false;

    // Search query
    if (searchLower) {
      const title = (article.title || '').toLowerCase();
      const summary = (article.summary || '').toLowerCase();
      const author = (article.author?.name || '').toLowerCase();
      if (!title.includes(searchLower) && !summary.includes(searchLower) && !author.includes(searchLower)) {
        return false;
      }
    }

    // Date Filter
    if (dateFilter !== 'all') {
      const scheduledTime = getArticleScheduledTime(article);
      if (!scheduledTime) return false;
      const parts = getIstParts(scheduledTime);
      const isPast = new Date(scheduledTime).getTime() <= Date.now();

      if (dateFilter === 'today' && parts.dateStr !== todayKey) return false;
      if (dateFilter === 'tomorrow' && parts.dateStr !== tomorrowKey) return false;
      if (dateFilter === 'overdue' && !isPast) return false;
    }

    return true;
  });
}

/**
 * BACKEND-READY SERVICE INTERFACES
 *
 * NOTE: In this frontend prototype, scheduling operations update the shared
 * ArticleContext and localStorage. When the production backend scheduler service
 * is deployed, these async stubs can be plugged directly into Axios/Fetch calls:
 *
 * - POST /api/admin/articles/:id/schedule
 * - PATCH /api/admin/articles/:id/schedule
 * - DELETE /api/admin/articles/:id/schedule
 * - POST /api/admin/articles/:id/publish
 */
export const backendSchedulerService = {
  async scheduleArticle(id, scheduledAtUtcIso, scheduledBy) {
    console.info(`[Backend Scheduler Ready] POST /api/admin/articles/${id}/schedule`, {
      scheduledAt: scheduledAtUtcIso,
      scheduledBy,
    });
    // Frontend prototype stub:
    return { success: true, id, scheduledAt: scheduledAtUtcIso };
  },

  async rescheduleArticle(id, newScheduledAtUtcIso) {
    console.info(`[Backend Scheduler Ready] PATCH /api/admin/articles/${id}/schedule`, {
      scheduledAt: newScheduledAtUtcIso,
    });
    return { success: true, id, scheduledAt: newScheduledAtUtcIso };
  },

  async cancelSchedule(id) {
    console.info(`[Backend Scheduler Ready] DELETE /api/admin/articles/${id}/schedule`);
    return { success: true, id };
  },

  async publishNow(id) {
    console.info(`[Backend Scheduler Ready] POST /api/admin/articles/${id}/publish`);
    return { success: true, id };
  },
};

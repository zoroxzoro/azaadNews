/**
 * Timezone Utilities for Azaad Samachar Newsroom Workstation
 * 
 * Canonical newsroom timezone: Asia/Kolkata (IST, UTC+05:30).
 * All scheduled dates are stored canonically as UTC ISO 8601 strings
 * (e.g. 2026-10-18T03:30:00.000Z), while all display and calendar
 * day-grouping boundaries are computed strictly in Asia/Kolkata time.
 */

export const NEWSROOM_TIMEZONE = 'Asia/Kolkata';
export const TIMEZONE_LABEL = 'IST (भारतीय मानक समय • UTC+05:30)';
export const TIMEZONE_SHORT = 'IST';

// IST is fixed UTC+05:30 (330 minutes ahead of UTC) without Daylight Saving Time.
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/**
 * Returns current timestamp in UTC ISO format
 */
export function getNowUTC() {
  return new Date().toISOString();
}

/**
 * Converts date parts in IST (year, month, day, hours, minutes) into a canonical UTC ISO string.
 * Uses exact mathematical offset conversion (+05:30) to eliminate browser timezone drift.
 *
 * @param {string|number} year e.g. 2026
 * @param {string|number} month 1-12
 * @param {string|number} day 1-31
 * @param {string|number} hours 0-23
 * @param {string|number} minutes 0-59
 * @returns {string} UTC ISO 8601 string
 */
export function istToUtcIso(year, month, day, hours = 0, minutes = 0) {
  const y = Number(year);
  const m = Number(month) - 1; // 0-indexed for Date.UTC
  const d = Number(day);
  const h = Number(hours);
  const min = Number(minutes);

  // Milliseconds from epoch for this date/time treated as UTC
  const naiveUtcMs = Date.UTC(y, m, d, h, min, 0, 0);
  // Subtract 5h 30m to get true UTC epoch timestamp
  const realUtcMs = naiveUtcMs - IST_OFFSET_MS;

  return new Date(realUtcMs).toISOString();
}

/**
 * Converts date string (YYYY-MM-DD) and time string (HH:mm) entered in IST into UTC ISO string.
 * 
 * @param {string} dateStr 'YYYY-MM-DD'
 * @param {string} timeStr 'HH:mm'
 * @returns {string|null} Canonical UTC ISO string or null if invalid
 */
export function combineIstDateTimeToUtcIso(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const [hourStr, minStr] = timeStr.split(':');

  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);
  const d = parseInt(dayStr, 10);
  const h = parseInt(hourStr, 10);
  const min = parseInt(minStr, 10);

  if (
    Number.isNaN(y) ||
    Number.isNaN(m) ||
    Number.isNaN(d) ||
    Number.isNaN(h) ||
    Number.isNaN(min) ||
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > 31 ||
    h < 0 ||
    h > 23 ||
    min < 0 ||
    min > 59
  ) {
    return null;
  }

  return istToUtcIso(y, m, d, h, min);
}

/**
 * Extracts IST date & time parts from any ISO / UTC timestamp.
 * Returns { year, month, day, hours, minutes, dateStr: 'YYYY-MM-DD', timeStr: 'HH:mm' }
 */
export function getIstParts(isoOrDate) {
  if (!isoOrDate) return null;
  const dateObj = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(dateObj.getTime())) return null;

  // Add 5:30 hours to get date representation in UTC corresponding to IST
  const istDate = new Date(dateObj.getTime() + IST_OFFSET_MS);

  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth() + 1;
  const day = istDate.getUTCDate();
  const hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();

  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${year}-${pad(month)}-${pad(day)}`;
  const timeStr = `${pad(hours)}:${pad(minutes)}`;

  return {
    year,
    month,
    day,
    hours,
    minutes,
    dateStr,
    timeStr,
  };
}

/**
 * Gets 'YYYY-MM-DD' in IST for a given date or current time.
 */
export function getIstDateString(isoOrDate = new Date()) {
  const parts = getIstParts(isoOrDate);
  return parts ? parts.dateStr : '';
}

/**
 * Hindi day names
 */
const HINDI_DAYS = [
  'रविवार',
  'सोमवार',
  'मंगलवार',
  'बुधवार',
  'गुरुवार',
  'शुक्रवार',
  'शनिवार',
];

const HINDI_MONTHS = [
  'जनवरी',
  'फ़रवरी',
  'मार्च',
  'अप्रैल',
  'मई',
  'जून',
  'जुलाई',
  'अगस्त',
  'सितंबर',
  'अक्टूबर',
  'नवंबर',
  'दिसंबर',
];

/**
 * Formats a UTC ISO timestamp into a rich human-readable string in IST with Hindi and English options.
 *
 * @param {string|Date} isoOrDate
 * @param {Object} options
 * @param {string} options.locale 'hi' | 'en'
 * @param {boolean} options.includeTime whether to include HH:mm IST
 * @param {boolean} options.includeWeekday whether to include day of week
 * @returns {string}
 */
export function formatInIST(
  isoOrDate,
  { locale = 'hi', includeTime = true, includeWeekday = true, shortFormat = false } = {}
) {
  if (!isoOrDate) return 'अनिर्धारित';
  const parts = getIstParts(isoOrDate);
  if (!parts) return 'अमान्य तारीख';

  const { year, month, day, hours, minutes } = parts;

  // Calculate day of week in IST
  const istDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const dayOfWeekIndex = istDate.getUTCDay();

  const pad = (n) => String(n).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const display12Hours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedTime12 = `${pad(display12Hours)}:${pad(minutes)} ${period}`;

  if (locale === 'hi') {
    const weekday = HINDI_DAYS[dayOfWeekIndex];
    const monthName = HINDI_MONTHS[month - 1];

    if (shortFormat) {
      return includeTime
        ? `${day} ${monthName}, ${formattedTime12}`
        : `${day} ${monthName}`;
    }

    let result = '';
    if (includeWeekday) result += `${weekday}, `;
    result += `${day} ${monthName} ${year}`;
    if (includeTime) result += ` • ${formattedTime12} IST`;
    return result;
  }

  // English fallback
  const d = new Date(isoOrDate);
  const options = {
    timeZone: NEWSROOM_TIMEZONE,
    day: 'numeric',
    month: shortFormat ? 'short' : 'long',
    year: 'numeric',
    ...(includeWeekday ? { weekday: 'short' } : {}),
    ...(includeTime
      ? { hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short' }
      : {}),
  };
  return new Intl.DateTimeFormat('en-IN', options).format(d);
}

/**
 * Formats just the time in 12-hour IST format (e.g. "09:30 AM")
 */
export function formatIstTime(isoOrDate) {
  const parts = getIstParts(isoOrDate);
  if (!parts) return '--:--';
  const { hours, minutes } = parts;
  const pad = (n) => String(n).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const display12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${pad(display12)}:${pad(minutes)} ${period} IST`;
}

/**
 * Checks whether a given ISO date string is strictly in the future.
 */
export function isFutureDate(isoOrDate) {
  if (!isoOrDate) return false;
  const dateObj = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  const time = dateObj.getTime();
  return !Number.isNaN(time) && time > Date.now();
}

/**
 * Checks whether a scheduled item is overdue:
 * Scheduled time is in the past, but status is still 'scheduled'.
 */
export function isOverdueScheduled(isoOrDate, status = 'scheduled') {
  if (!isoOrDate) return false;
  if (status !== 'scheduled') return false;
  const dateObj = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  const time = dateObj.getTime();
  return !Number.isNaN(time) && time <= Date.now();
}

/**
 * Returns today's, tomorrow's, and yesterday's YYYY-MM-DD in IST.
 */
export function getRelativeIstDates() {
  const now = new Date();
  const todayParts = getIstParts(now);
  const todayKey = todayParts.dateStr;

  // Tomorrow in IST
  const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowKey = getIstParts(tomorrowDate).dateStr;

  // Yesterday in IST
  const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayKey = getIstParts(yesterdayDate).dateStr;

  return {
    todayKey,
    tomorrowKey,
    yesterdayKey,
    currentHour: todayParts.hours,
    currentMinute: todayParts.minutes,
  };
}

/**
 * Computes default schedule time: tomorrow at 09:00 AM IST
 */
export function getDefaultSchedulePreset() {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const parts = getIstParts(tomorrow);
  return {
    date: parts.dateStr,
    time: '09:00',
    utcIso: istToUtcIso(parts.year, parts.month, parts.day, 9, 0),
  };
}

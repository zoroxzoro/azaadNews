import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  Plus,
  X,
  Eye,
  Edit,
  RotateCcw,
  Rocket,
} from 'lucide-react';
import {
  getIstParts,
  getRelativeIstDates,
  formatInIST,
  formatIstTime,
  isOverdueScheduled,
  NEWSROOM_TIMEZONE,
} from '../../../utils/timezoneUtils';
import { groupArticlesByIstDate, getArticleScheduledTime } from '../../../utils/schedulingUtils';
import ScheduledArticleCard from './ScheduledArticleCard';

const HINDI_MONTH_NAMES = [
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

const WEEKDAY_NAMES = [
  { short: 'रवि', full: 'रविवार' },
  { short: 'सोम', full: 'सोमवार' },
  { short: 'मंगल', full: 'मंगलवार' },
  { short: 'बुध', full: 'बुधवार' },
  { short: 'गुरु', full: 'गुरुवार' },
  { short: 'शुक्र', full: 'शुक्रवार' },
  { short: 'शनि', full: 'शनिवार' },
];

export default function PublishingCalendar({
  articles = [],
  onPreview,
  onEdit,
  onReschedule,
  onReturnToDraft,
  onPublishNow,
  onCreateScheduled,
}) {
  const { todayKey } = getRelativeIstDates();
  const todayParts = getIstParts(new Date());

  // Current viewed month & year in calendar
  const [viewYear, setViewYear] = useState(() => todayParts.year);
  const [viewMonth, setViewMonth] = useState(() => todayParts.month); // 1-12
  const [selectedDateKey, setSelectedDateKey] = useState(() => todayKey);

  // Group articles by IST date string
  const groupedArticles = useMemo(() => {
    return groupArticlesByIstDate(articles);
  }, [articles]);

  // Compute calendar days matrix
  const calendarDays = useMemo(() => {
    const pad = (n) => String(n).padStart(2, '0');
    // First day of current view month
    const firstDayDate = new Date(Date.UTC(viewYear, viewMonth - 1, 1));
    const startingDayOfWeek = firstDayDate.getUTCDay(); // 0 is Sunday

    // Total days in current month
    const totalDaysInMonth = new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate();

    // Total days in previous month
    const prevMonthTotalDays = new Date(Date.UTC(viewYear, viewMonth - 1, 0)).getUTCDate();

    const days = [];

    // Previous month filler days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevD = prevMonthTotalDays - i;
      const prevM = viewMonth === 1 ? 12 : viewMonth - 1;
      const prevY = viewMonth === 1 ? viewYear - 1 : viewYear;
      const key = `${prevY}-${pad(prevM)}-${pad(prevD)}`;
      days.push({
        dayNumber: prevD,
        dateKey: key,
        isCurrentMonth: false,
        isToday: key === todayKey,
        articles: groupedArticles[key] || [],
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const key = `${viewYear}-${pad(viewMonth)}-${pad(d)}`;
      days.push({
        dayNumber: d,
        dateKey: key,
        isCurrentMonth: true,
        isToday: key === todayKey,
        articles: groupedArticles[key] || [],
      });
    }

    // Next month filler days to complete grid (multiples of 7)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let nextD = 1; nextD <= remaining; nextD++) {
        const nextM = viewMonth === 12 ? 1 : viewMonth + 1;
        const nextY = viewMonth === 12 ? viewYear + 1 : viewYear;
        const key = `${nextY}-${pad(nextM)}-${pad(nextD)}`;
        days.push({
          dayNumber: nextD,
          dateKey: key,
          isCurrentMonth: false,
          isToday: key === todayKey,
          articles: groupedArticles[key] || [],
        });
      }
    }

    return days;
  }, [viewYear, viewMonth, groupedArticles, todayKey]);

  // Selected date's articles
  const selectedArticles = groupedArticles[selectedDateKey] || [];

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleGoToday = () => {
    setViewYear(todayParts.year);
    setViewMonth(todayParts.month);
    setSelectedDateKey(todayKey);
  };

  return (
    <div className="bg-paper-canvas border border-border-rule shadow-xs flex flex-col">
      {/* Calendar Header Controls */}
      <div className="px-4 sm:px-6 py-4 border-b border-border-rule flex items-center justify-between flex-wrap gap-4 bg-paper-tint">
        {/* Month Title & Timezone Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-primary-container" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-mukta text-xl sm:text-2xl font-bold text-on-surface">
                {HINDI_MONTH_NAMES[viewMonth - 1]} {viewYear}
              </h2>
              <span className="font-inter text-[11px] font-bold text-secondary bg-paper-subtle px-2 py-0.5 uppercase tracking-wide">
                IST (Asia/Kolkata)
              </span>
            </div>
            <p className="font-inter text-xs text-secondary hidden sm:block">
              दैनिक प्रकाशन स्लॉट एवं निर्धारित समय-सारणी
            </p>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGoToday}
            className="px-3 py-1.5 bg-paper-canvas hover:bg-ticker-tint border border-border-rule text-primary-container font-mukta text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            आज (Today)
          </button>

          <div className="flex items-center border border-border-rule bg-paper-canvas">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-secondary hover:text-on-surface hover:bg-paper-subtle transition-colors cursor-pointer"
              title="पिछला महीना"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-border-rule" />
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-secondary hover:text-on-surface hover:bg-paper-subtle transition-colors cursor-pointer"
              title="अगला महीना"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Days of week header + Cells */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[680px]">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border-rule bg-paper-subtle">
            {WEEKDAY_NAMES.map((w, idx) => (
              <div
                key={w.short}
                className={`py-2 text-center font-inter text-xs font-bold uppercase tracking-wider ${
                  idx === 0 || idx === 6 ? 'text-primary-container' : 'text-secondary'
                }`}
              >
                <span className="hidden sm:inline">{w.full}</span>
                <span className="sm:hidden">{w.short}</span>
              </div>
            ))}
          </div>

          {/* Day Grid Cells */}
          <div className="grid grid-cols-7 border-collapse">
            {calendarDays.map((cell) => {
              const isSelected = cell.dateKey === selectedDateKey;
              const hasArticles = cell.articles.length > 0;
              const hasOverdue = cell.articles.some((a) =>
                isOverdueScheduled(getArticleScheduledTime(a), a.status)
              );

              return (
                <div
                  key={cell.dateKey}
                  onClick={() => setSelectedDateKey(cell.dateKey)}
                  className={`min-h-[92px] sm:min-h-[110px] p-2 border-b border-r border-border-rule flex flex-col justify-between transition-all cursor-pointer relative ${
                    cell.isCurrentMonth
                      ? isSelected
                        ? 'bg-paper-subtle ring-2 ring-primary-container ring-inset z-10'
                        : cell.isToday
                        ? 'bg-ticker-tint/40 hover:bg-paper-subtle'
                        : 'bg-paper-canvas hover:bg-paper-tint/70'
                      : 'bg-paper-tint/40 opacity-40 hover:opacity-70'
                  }`}
                >
                  {/* Day Number and Badges */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mukta text-sm sm:text-base font-bold w-6 h-6 flex items-center justify-center rounded-xs ${
                        cell.isToday
                          ? 'bg-breaking-crimson text-white font-extrabold shadow-2xs'
                          : isSelected
                          ? 'bg-primary-container text-white font-bold'
                          : cell.isCurrentMonth
                          ? 'text-on-surface'
                          : 'text-secondary'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Article count chip */}
                    {hasArticles && (
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.2 font-inter text-[10px] font-bold rounded-xs ${
                          hasOverdue
                            ? 'bg-breaking-crimson text-white animate-pulse'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {hasOverdue && <AlertTriangle className="w-2.5 h-2.5" />}
                        {cell.articles.length} {cell.articles.length === 1 ? 'समाचार' : 'समाचार'}
                      </span>
                    )}
                  </div>

                  {/* Scheduled Items Preview list in cell (desktop) */}
                  <div className="mt-1 flex flex-col gap-1 overflow-hidden">
                    {cell.articles.slice(0, 2).map((art) => {
                      const overdue = isOverdueScheduled(getArticleScheduledTime(art), art.status);
                      return (
                        <div
                          key={art.id}
                          className={`px-1.5 py-0.5 text-[11px] font-mukta font-medium truncate rounded-2xs border ${
                            overdue
                              ? 'bg-breaking-crimson/10 border-breaking-crimson/30 text-breaking-crimson'
                              : 'bg-paper-tint border-border-rule text-on-surface'
                          }`}
                          title={`${art.title} (${formatIstTime(getArticleScheduledTime(art))})`}
                        >
                          <span className="font-mono text-[9px] text-secondary mr-1">
                            {formatIstTime(getArticleScheduledTime(art)).slice(0, 5)}
                          </span>
                          {art.title}
                        </div>
                      );
                    })}

                    {cell.articles.length > 2 && (
                      <span className="font-inter text-[10px] text-secondary font-semibold pl-1">
                        +{cell.articles.length - 2} और...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Stories Drawer / Bottom Panel */}
      <div className="p-4 sm:p-6 border-t border-border-rule bg-paper-tint">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary-container" />
            <h3 className="font-mukta text-lg sm:text-xl font-bold text-on-surface">
              {formatInIST(`${selectedDateKey}T00:00:00.000Z`, {
                locale: 'hi',
                includeTime: false,
                includeWeekday: true,
              })}{' '}
              {selectedDateKey === todayKey && (
                <span className="text-xs bg-breaking-crimson text-white px-2 py-0.5 ml-1 font-inter font-bold">
                  आज
                </span>
              )}
            </h3>
            <span className="text-xs text-secondary font-inter">
              ({selectedArticles.length} समाचार निर्धारित)
            </span>
          </div>

          {onCreateScheduled && (
            <button
              type="button"
              onClick={onCreateScheduled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-container hover:bg-primary text-white font-mukta text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ नया समाचार शेड्यूल करें</span>
            </button>
          )}
        </div>

        {/* Selected date stories list */}
        {selectedArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedArticles.map((article) => (
              <ScheduledArticleCard
                key={article.id}
                article={article}
                onPreview={onPreview}
                onEdit={onEdit}
                onReschedule={onReschedule}
                onReturnToDraft={onReturnToDraft}
                onPublishNow={onPublishNow}
                compact={false}
              />
            ))}
          </div>
        ) : (
          <div className="bg-paper-canvas border border-border-rule p-8 text-center">
            <Clock className="w-8 h-8 text-secondary/40 mx-auto mb-2" />
            <p className="font-mukta text-base font-bold text-on-surface">
              इस तारीख के लिए कोई समाचार शेड्यूल नहीं है
            </p>
            <p className="font-inter text-xs text-secondary mt-1">
              न्यूज़ एडिटर से नया समाचार लिखें या किसी ड्राफ्ट का प्रकाशन समय तय करें।
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

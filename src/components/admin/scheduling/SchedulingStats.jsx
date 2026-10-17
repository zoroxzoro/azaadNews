import React from 'react';
import { Calendar, Clock, AlertTriangle, Flame } from 'lucide-react';

/**
 * SchedulingStats
 * Displays 4 responsive editorial metrics strips matching the broadsheet newsroom CMS design.
 */
export default function SchedulingStats({ stats, onFilterOverdue, onFilterToday, activeFilter }) {
  const {
    totalScheduled = 0,
    scheduledToday = 0,
    scheduledThisWeek = 0,
    overdueScheduled = 0,
  } = stats || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Total Scheduled */}
      <div className="bg-paper-canvas border border-border-rule p-4 flex items-center justify-between shadow-xs">
        <div>
          <span className="font-inter text-[11px] uppercase tracking-wider text-secondary font-bold block">
            कुल शेड्यूल्ड समाचार (Total)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mukta text-2xl sm:text-3xl font-extrabold text-on-surface">
              {totalScheduled}
            </span>
            <span className="font-inter text-xs text-secondary">कतार में</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-sm bg-paper-tint border border-border-rule flex items-center justify-center text-secondary">
          <Calendar className="w-5 h-5 text-secondary" />
        </div>
      </div>

      {/* 2. Scheduled Today */}
      <div
        onClick={onFilterToday}
        className={`bg-paper-canvas border p-4 flex items-center justify-between shadow-xs cursor-pointer transition-all ${
          activeFilter === 'today'
            ? 'border-primary-container ring-1 ring-primary-container'
            : 'border-border-rule hover:border-primary-container/40'
        }`}
      >
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-inter text-[11px] uppercase tracking-wider text-secondary font-bold">
              आज के स्लॉट (Today)
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mukta text-2xl sm:text-3xl font-extrabold text-primary-container">
              {scheduledToday}
            </span>
            <span className="font-inter text-xs text-secondary">प्रकाशन कतार</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-sm bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-primary-container">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Scheduled This Week */}
      <div className="bg-paper-canvas border border-border-rule p-4 flex items-center justify-between shadow-xs">
        <div>
          <span className="font-inter text-[11px] uppercase tracking-wider text-secondary font-bold block">
            इस सप्ताह (This Week)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mukta text-2xl sm:text-3xl font-extrabold text-on-surface">
              {scheduledThisWeek}
            </span>
            <span className="font-inter text-xs text-secondary">7-दिवसीय स्लॉट</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-sm bg-paper-tint border border-border-rule flex items-center justify-center text-amber-700">
          <Flame className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Overdue Scheduled */}
      <div
        onClick={onFilterOverdue}
        className={`border p-4 flex items-center justify-between shadow-xs cursor-pointer transition-all ${
          overdueScheduled > 0
            ? 'bg-ticker-tint border-breaking-crimson/50 hover:border-breaking-crimson'
            : 'bg-paper-canvas border-border-rule'
        } ${activeFilter === 'overdue' ? 'ring-2 ring-breaking-crimson' : ''}`}
      >
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className={`font-inter text-[11px] uppercase tracking-wider font-bold ${
                overdueScheduled > 0 ? 'text-breaking-crimson' : 'text-secondary'
              }`}
            >
              अतिदेय शेड्यूल्ड (Overdue)
            </span>
            {overdueScheduled > 0 && (
              <span className="w-2 h-2 rounded-full bg-breaking-crimson animate-ping" />
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`font-mukta text-2xl sm:text-3xl font-extrabold ${
                overdueScheduled > 0 ? 'text-breaking-crimson' : 'text-on-surface'
              }`}
            >
              {overdueScheduled}
            </span>
            <span
              className={`font-inter text-xs ${
                overdueScheduled > 0 ? 'text-breaking-crimson font-medium' : 'text-secondary'
              }`}
            >
              {overdueScheduled > 0 ? 'कार्यवाही जरूरी' : 'सब समय पर'}
            </span>
          </div>
        </div>
        <div
          className={`w-10 h-10 rounded-sm flex items-center justify-center ${
            overdueScheduled > 0
              ? 'bg-breaking-crimson text-white'
              : 'bg-paper-tint border border-border-rule text-secondary'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Globe,
  AlertCircle,
  CheckCircle2,
  X,
  RotateCcw,
} from 'lucide-react';
import {
  getIstParts,
  combineIstDateTimeToUtcIso,
  formatInIST,
  isFutureDate,
  TIMEZONE_LABEL,
} from '../../../utils/timezoneUtils';
import { getArticleScheduledTime } from '../../../utils/schedulingUtils';

export default function RescheduleDialog({
  isOpen,
  onClose,
  onConfirm,
  article,
}) {
  const currentScheduledTime = article ? getArticleScheduledTime(article) : null;
  const currentFormattedIST = currentScheduledTime
    ? formatInIST(currentScheduledTime, { locale: 'hi' })
    : 'उपलब्ध नहीं';

  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [error, setError] = useState('');

  // Initialize from current scheduled date or tomorrow
  useEffect(() => {
    if (!isOpen) return;

    setError('');
    let baseDate;
    if (currentScheduledTime && !Number.isNaN(new Date(currentScheduledTime).getTime())) {
      // If current is past, default to tomorrow; otherwise start from current date
      const curMs = new Date(currentScheduledTime).getTime();
      baseDate = curMs > Date.now() ? new Date(curMs) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else {
      baseDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const parts = getIstParts(baseDate);
    if (parts) {
      setDateStr(parts.dateStr);
      setTimeStr(parts.timeStr || '09:00');
    }
  }, [isOpen, currentScheduledTime]);

  if (!isOpen || !article) return null;

  const newUtcIso = combineIstDateTimeToUtcIso(dateStr, timeStr);
  const isValidFuture = newUtcIso ? isFutureDate(newUtcIso) : false;
  const newIstPreview = newUtcIso ? formatInIST(newUtcIso, { locale: 'hi' }) : '';

  const handleConfirm = () => {
    setError('');
    if (!dateStr) {
      setError('कृपया नई तारीख चुनें।');
      return;
    }
    if (!timeStr) {
      setError('कृपया नया समय दर्ज करें।');
      return;
    }
    if (!newUtcIso) {
      setError('अमान्य तारीख या समय।');
      return;
    }
    if (!isValidFuture) {
      setError('नया निर्धारित समय भविष्य का होना अनिवार्य है।');
      return;
    }

    onConfirm(article.id, newUtcIso);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-paper-canvas border border-border-rule shadow-2xl w-full max-w-md font-mukta overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-paper-tint px-5 py-4 border-b border-border-rule flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary-container" />
            <h3 className="text-lg font-bold text-on-surface">
              समय पुनर्निर्धारित करें (Reschedule)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-secondary hover:text-on-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Article Info */}
          <div className="bg-paper-subtle p-3 border border-border-rule">
            <span className="font-inter text-[10px] uppercase font-bold text-secondary block">
              समाचार शीर्षक
            </span>
            <p className="text-sm font-bold text-on-surface line-clamp-2 mt-0.5">
              {article.title}
            </p>
          </div>

          {/* Current Scheduled Time */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-xs font-inter space-y-1">
            <span className="font-bold text-amber-900 dark:text-amber-200 uppercase text-[10px] block">
              वर्तमान निर्धारित समय (Current Slot)
            </span>
            <div className="flex items-center gap-1.5 text-amber-950 dark:text-amber-100 font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>{currentFormattedIST}</span>
            </div>
          </div>

          {/* Timezone Note */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-paper-tint border border-border-rule text-xs font-inter text-secondary">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-primary-container" />
              <span>टाइमज़ोन:</span>
            </div>
            <span className="font-bold text-primary-container">{TIMEZONE_LABEL}</span>
          </div>

          {/* New Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-inter text-xs font-bold text-on-surface mb-1">
                नई तारीख (Date) <span className="text-breaking-crimson">*</span>
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => {
                  setDateStr(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2 bg-paper-tint border border-border-rule font-inter text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>
            <div>
              <label className="block font-inter text-xs font-bold text-on-surface mb-1">
                नया समय (Time) <span className="text-breaking-crimson">*</span>
              </label>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => {
                  setTimeStr(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2 bg-paper-tint border border-border-rule font-inter text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>
          </div>

          {/* Preview */}
          {newUtcIso && (
            <div className="bg-paper-tint p-3 border border-border-rule text-xs font-inter">
              <span className="text-secondary font-bold text-[10px] uppercase block mb-1">
                नया स्लॉट पूर्वावलोकन
              </span>
              <div className="font-mukta text-sm font-bold text-on-surface flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary-container" />
                <span>{newIstPreview}</span>
              </div>
              {!isValidFuture && (
                <span className="text-breaking-crimson font-medium block mt-1">
                  त्रुटि: चुना गया समय भविष्य का होना चाहिए।
                </span>
              )}
            </div>
          )}

          {error && (
            <div className="bg-ticker-tint border border-breaking-crimson/40 p-2.5 text-breaking-crimson text-xs font-inter flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-paper-tint px-5 py-3 border-t border-border-rule flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-paper-canvas hover:bg-paper-subtle border border-border-rule text-on-surface font-mukta text-xs font-bold"
          >
            रद्द करें (Cancel)
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValidFuture}
            className="px-5 py-2 bg-primary-container hover:bg-primary disabled:bg-secondary/40 text-white font-mukta text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>परिवर्तन सुरक्षित करें (Save Changes)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Globe,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import {
  getIstParts,
  combineIstDateTimeToUtcIso,
  formatInIST,
  isFutureDate,
  NEWSROOM_TIMEZONE,
  TIMEZONE_LABEL,
} from '../../../utils/timezoneUtils';

export default function SchedulingDialog({
  isOpen,
  onClose,
  onConfirm,
  articleTitle = '',
  initialUtcIso = null,
  isRescheduling = false,
}) {
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [error, setError] = useState('');

  // Initialize date & time in IST from initialUtcIso or default to tomorrow at 09:00 IST
  useEffect(() => {
    if (!isOpen) return;

    setError('');
    let baseDate;
    if (initialUtcIso && !Number.isNaN(new Date(initialUtcIso).getTime())) {
      baseDate = new Date(initialUtcIso);
    } else {
      // Default: tomorrow morning
      baseDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const parts = getIstParts(baseDate);
    if (parts) {
      setDateStr(parts.dateStr);
      setTimeStr(parts.timeStr || '09:00');
    }
  }, [isOpen, initialUtcIso]);

  if (!isOpen) return null;

  // Compute canonical UTC ISO from current inputs
  const currentUtcIso = combineIstDateTimeToUtcIso(dateStr, timeStr);
  const isValidFuture = currentUtcIso ? isFutureDate(currentUtcIso) : false;
  const istPreview = currentUtcIso ? formatInIST(currentUtcIso, { locale: 'hi' }) : '';

  // Quick preset handlers
  const handleSetPresetTime = (hoursStr, minutesStr) => {
    setTimeStr(`${hoursStr}:${minutesStr}`);
    setError('');
  };

  const handleSetTomorrow = () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const parts = getIstParts(tomorrow);
    if (parts) setDateStr(parts.dateStr);
    setError('');
  };

  const handleSetDayAfterTomorrow = () => {
    const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const parts = getIstParts(dayAfter);
    if (parts) setDateStr(parts.dateStr);
    setError('');
  };

  const handleConfirm = () => {
    setError('');
    if (!dateStr) {
      setError('प्रकाशन की तारीख चुनना अनिवार्य है।');
      return;
    }
    if (!timeStr) {
      setError('प्रकाशन का समय दर्ज करना अनिवार्य है।');
      return;
    }
    if (!currentUtcIso) {
      setError('अमान्य तारीख या समय प्रविष्ट किया गया है।');
      return;
    }
    if (!isValidFuture) {
      setError('शेड्यूल किया गया समय भविष्य का होना चाहिए (Scheduled time must be in the future)।');
      return;
    }

    onConfirm(currentUtcIso);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-paper-canvas border border-border-rule shadow-2xl w-full max-w-lg font-mukta overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-paper-tint px-5 py-4 border-b border-border-rule flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-primary-container text-white flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mukta text-lg font-bold text-on-surface leading-tight">
                {isRescheduling ? 'प्रकाशन समय पुनर्निर्धारित करें' : 'प्रकाशन शेड्यूल करें (Schedule News)'}
              </h3>
              <span className="font-inter text-xs text-secondary">
                आलेख निर्धारित समय पर पाठकों के लिए लाइव होगा
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-secondary hover:text-on-surface rounded-xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Article Title banner */}
          {articleTitle && (
            <div className="bg-paper-subtle p-3 border border-border-rule">
              <span className="font-inter text-[10px] uppercase font-bold text-secondary block">
                चयनित आलेख (Article)
              </span>
              <p className="font-mukta text-sm font-bold text-on-surface line-clamp-2 mt-0.5">
                {articleTitle}
              </p>
            </div>
          )}

          {/* Timezone Indicator Banner */}
          <div className="flex items-center justify-between px-3 py-2 bg-paper-tint border border-border-rule text-xs font-inter">
            <div className="flex items-center gap-2 text-secondary">
              <Globe className="w-3.5 h-3.5 text-primary-container" />
              <span>न्यूज़रूम टाइमज़ोन (Timezone):</span>
            </div>
            <span className="font-bold text-primary-container">{TIMEZONE_LABEL}</span>
          </div>

          {/* Date & Time Picker inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date Picker */}
            <div className="space-y-1.5">
              <label className="block font-inter text-xs font-bold text-on-surface">
                प्रकाशन तिथि (Date) <span className="text-breaking-crimson">*</span>
              </label>
              <div className="relative">
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
              {/* Quick Date Presets */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleSetTomorrow}
                  className="px-2 py-0.5 bg-paper-subtle hover:bg-paper-tint border border-border-rule text-[11px] font-mukta font-bold text-secondary hover:text-on-surface"
                >
                  कल (Tomorrow)
                </button>
                <button
                  type="button"
                  onClick={handleSetDayAfterTomorrow}
                  className="px-2 py-0.5 bg-paper-subtle hover:bg-paper-tint border border-border-rule text-[11px] font-mukta font-bold text-secondary hover:text-on-surface"
                >
                  परसों (Day After)
                </button>
              </div>
            </div>

            {/* Time Picker */}
            <div className="space-y-1.5">
              <label className="block font-inter text-xs font-bold text-on-surface">
                प्रकाशन समय (Time - IST) <span className="text-breaking-crimson">*</span>
              </label>
              <div className="relative">
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
              {/* Quick Time Slots */}
              <div className="flex items-center gap-1 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSetPresetTime('09', '00')}
                  className="px-1.5 py-0.5 bg-paper-subtle hover:bg-paper-tint border border-border-rule text-[10px] font-inter text-secondary"
                  title="सुबह 9 बजे"
                >
                  09:00 AM
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetTime('14', '00')}
                  className="px-1.5 py-0.5 bg-paper-subtle hover:bg-paper-tint border border-border-rule text-[10px] font-inter text-secondary"
                  title="दोपहर 2 बजे"
                >
                  02:00 PM
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetTime('19', '00')}
                  className="px-1.5 py-0.5 bg-paper-subtle hover:bg-paper-tint border border-border-rule text-[10px] font-inter text-secondary font-bold text-primary-container"
                  title="प्राइम टाइम 7 बजे"
                >
                  07:00 PM
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetTime('21', '00')}
                  className="px-1.5 py-0.5 bg-paper-subtle hover:bg-paper-tint border border-border-rule text-[10px] font-inter text-secondary"
                  title="रात 9 बजे"
                >
                  09:00 PM
                </button>
              </div>
            </div>
          </div>

          {/* Computed Preview Box */}
          <div className="bg-paper-tint p-3.5 border border-border-rule space-y-2">
            <span className="font-inter text-[11px] uppercase font-bold text-secondary block">
              निर्धारित समय का पूर्वावलोकन (Preview)
            </span>
            {currentUtcIso ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-container shrink-0" />
                  <span className="font-mukta text-base font-bold text-on-surface">
                    {istPreview}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-secondary">
                  कैनोनिकल UTC ISO: {currentUtcIso}
                </div>
                {!isValidFuture && (
                  <div className="flex items-center gap-1.5 text-breaking-crimson font-inter text-xs mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>त्रुटि: चुना गया समय वर्तमान समय से पहले का है। कृपया भविष्य का समय चुनें।</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="font-inter text-xs text-secondary">
                कृपया मान्य तारीख और समय चुनें
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-ticker-tint border border-breaking-crimson/40 p-3 flex items-center gap-2 text-breaking-crimson text-xs font-inter">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Development Prototype Notice */}
          <div className="bg-paper-subtle p-2.5 border border-border-rule/80 text-[11px] font-inter text-secondary">
            <strong>सूचना:</strong> शेड्यूलिंग केवल प्रदर्शन हेतु स्थानीय रूप से सुरक्षित है। स्वचालित वास्तविक प्रकाशन के लिए बैकएंड जॉब शेड्यूलर आवश्यक है।
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-paper-tint px-5 py-3 border-t border-border-rule flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-paper-canvas hover:bg-paper-subtle border border-border-rule text-on-surface font-mukta text-xs font-bold transition-colors cursor-pointer"
          >
            रद्द करें (Cancel)
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValidFuture}
            className="px-5 py-2 bg-primary-container hover:bg-primary disabled:bg-secondary/40 text-white font-mukta text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isRescheduling ? 'नया समय सुरक्षित करें' : 'प्रकाशन शेड्यूल करें'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

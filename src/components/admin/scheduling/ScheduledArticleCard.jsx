import React from 'react';
import {
  Clock,
  Calendar,
  AlertTriangle,
  Eye,
  Edit,
  RotateCcw,
  Rocket,
  User,
  Share2,
} from 'lucide-react';
import { formatInIST, isOverdueScheduled, formatIstTime } from '../../../utils/timezoneUtils';
import { getArticleScheduledTime } from '../../../utils/schedulingUtils';

export default function ScheduledArticleCard({
  article,
  onPreview,
  onEdit,
  onReschedule,
  onReturnToDraft,
  onPublishNow,
  compact = false,
}) {
  const scheduledTime = getArticleScheduledTime(article);
  const isOverdue = isOverdueScheduled(scheduledTime, article.status);
  const istFormatted = formatInIST(scheduledTime, { locale: 'hi', shortFormat: compact });
  const timeOnly = formatIstTime(scheduledTime);

  return (
    <div
      className={`bg-paper-canvas border transition-all ${
        isOverdue
          ? 'border-breaking-crimson/60 bg-ticker-tint/20'
          : 'border-border-rule hover:border-primary-container/40'
      } shadow-xs flex flex-col justify-between`}
    >
      <div className="p-3.5 sm:p-4">
        {/* Top Badges: Category, Overdue, IST Time */}
        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-inter text-[10px] uppercase font-bold text-primary-container bg-paper-tint px-2 py-0.5 border border-border-rule">
              {article.category || 'राष्ट्रीय'}
            </span>
            <span className="font-inter text-[10px] uppercase font-semibold text-secondary bg-paper-subtle px-1.5 py-0.5">
              {article.language === 'en' ? 'EN' : 'HI'}
            </span>
          </div>

          {/* Overdue Badge or Scheduled Time Badge */}
          {isOverdue ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-breaking-crimson text-white font-inter text-[11px] font-bold rounded-xs shadow-2xs">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>अतिदेय (Overdue)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-300 font-inter text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 border border-amber-200 dark:border-amber-800">
              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
              <span>{timeOnly}</span>
            </span>
          )}
        </div>

        {/* Headline */}
        <h3
          onClick={() => onPreview && onPreview(article)}
          className="font-mukta text-base sm:text-lg font-bold text-on-surface hover:text-primary-container transition-colors cursor-pointer line-clamp-2 leading-snug mb-2"
        >
          {article.title}
        </h3>

        {/* Summary (if not compact) */}
        {!compact && article.summary && (
          <p className="font-inter text-xs text-secondary line-clamp-2 mb-3">
            {article.summary}
          </p>
        )}

        {/* Full Scheduled Time & Author info */}
        <div className="flex items-center justify-between text-xs font-inter text-secondary border-t border-border-rule/60 pt-2 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary-container shrink-0" />
            <span className={isOverdue ? 'text-breaking-crimson font-medium' : ''}>
              {istFormatted}
            </span>
          </div>

          <div className="flex items-center gap-1 text-secondary">
            <User className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[130px]">
              {article.author?.name || article.scheduledBy || 'संपादक'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-3.5 py-2.5 bg-paper-tint border-t border-border-rule flex items-center justify-between gap-1 flex-wrap">
        <div className="flex items-center gap-1">
          {/* Preview */}
          <button
            type="button"
            onClick={() => onPreview && onPreview(article)}
            className="p-1.5 text-secondary hover:text-on-surface hover:bg-paper-canvas rounded-xs transition-colors cursor-pointer"
            title="पूर्वावलोकन देखें (Preview)"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={() => onEdit && onEdit(article)}
            className="p-1.5 text-secondary hover:text-on-surface hover:bg-paper-canvas rounded-xs transition-colors cursor-pointer"
            title="आलेख संपादित करें (Edit)"
          >
            <Edit className="w-4 h-4" />
          </button>

          {/* Move to Draft */}
          <button
            type="button"
            onClick={() => onReturnToDraft && onReturnToDraft(article)}
            className="p-1.5 text-secondary hover:text-amber-700 hover:bg-paper-canvas rounded-xs transition-colors cursor-pointer"
            title="ड्राफ्ट में लौटाएं (Return to Draft)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Reschedule */}
          <button
            type="button"
            onClick={() => onReschedule && onReschedule(article)}
            className="px-2.5 py-1 bg-paper-canvas hover:bg-paper-subtle border border-border-rule text-on-surface font-mukta text-xs font-bold transition-colors cursor-pointer"
          >
            समय बदलें
          </button>

          {/* Publish Now */}
          <button
            type="button"
            onClick={() => onPublishNow && onPublishNow(article)}
            className="inline-flex items-center gap-1 px-3 py-1 bg-primary-container hover:bg-primary text-white font-mukta text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            title="अभी तुरंत प्रकाशित करें"
          >
            <Rocket className="w-3 h-3" />
            <span>अभी प्रकाशित करें</span>
          </button>
        </div>
      </div>
    </div>
  );
}

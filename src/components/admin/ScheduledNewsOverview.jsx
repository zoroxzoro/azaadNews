import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { CalendarClock, ArrowRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export default function ScheduledNewsOverview({
  scheduledArticles = [],
  title = 'प्रकाशन टाइमलाइन (Scheduled Queue)',
}) {
  return (
    <div className="bg-paper-canvas border border-border-rule shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 bg-paper-tint border-b border-border-rule flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-primary-container" />
          <h2 className="font-mukta text-sm sm:text-base font-bold text-on-surface">
            {title}
          </h2>
        </div>
        <Link
          to="/admin/scheduled"
          className="text-[11px] font-inter font-bold text-primary-container hover:underline inline-flex items-center gap-0.5"
        >
          <span>कैलेंडर</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-2.5">
        {scheduledArticles.length === 0 ? (
          <div className="text-center py-6 text-secondary text-xs font-inter space-y-1">
            <Clock className="w-6 h-6 mx-auto text-secondary/60 mb-1" />
            <p className="font-semibold text-on-surface">कोई शेड्यूल्ड आलेख कतार में नहीं है</p>
            <p className="text-[11px]">अगले स्लॉट के लिए नया समाचार शेड्यूल करें।</p>
            <div className="pt-2">
              <Link
                to="/admin/news/create"
                className="inline-block px-3 py-1 bg-paper-tint border border-border-rule text-[11px] font-mukta font-bold text-primary-container hover:bg-paper-subtle transition-colors"
              >
                + नया समाचार शेड्यूल करें
              </Link>
            </div>
          </div>
        ) : (
          scheduledArticles.map((article) => {
            // Format time in Asia/Kolkata
            const scheduledTime = article.scheduledAt || article.scheduledFor;
            const dateObj = scheduledTime
              ? new Date(scheduledTime)
              : new Date(Date.now() + 3600 * 1000 * 4);

            const timeStr = dateObj.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Kolkata',
            });

            const dateStr = dateObj.toLocaleDateString('hi-IN', {
              day: 'numeric',
              month: 'short',
              timeZone: 'Asia/Kolkata',
            });

            return (
              <div
                key={article.id}
                className="p-2.5 bg-paper-tint border border-border-rule flex items-start gap-3 hover:border-border-heavy transition-colors"
              >
                {/* Time Badge (Asia/Kolkata) */}
                <div className="w-16 shrink-0 font-mono text-left">
                  <span className="font-mukta text-xs font-extrabold text-breaking-crimson block leading-tight">
                    {timeStr}
                  </span>
                  <span className="text-[9px] uppercase font-inter text-secondary block">
                    {dateStr}
                  </span>
                </div>

                {/* Article Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="px-1 py-0.2 bg-paper-subtle text-[9px] font-bold uppercase text-secondary">
                      {article.categoryNameHindi || article.category}
                    </span>
                  </div>
                  <Link
                    to={`/admin/news/edit/${article.id}`}
                    className="font-mukta text-xs font-bold text-on-surface hover:text-primary-container line-clamp-1 leading-snug block"
                  >
                    {article.title}
                  </Link>
                  <span className="text-[10px] font-inter text-secondary block mt-0.5 truncate">
                    डेस्क: {article.author?.name || 'संपादकीय ब्यूरो'}
                  </span>
                </div>

                {/* Clock indicator */}
                <div className="shrink-0 pt-0.5 text-secondary">
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

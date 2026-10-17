import React from 'react';
import { CheckCircle2, Clock, FileEdit, AlertCircle } from 'lucide-react';

export const STATUS_CONFIG = {
  published: {
    key: 'published',
    labelHindi: 'प्रकाशित (Live)',
    labelEnglish: 'Published',
    badgeClass: 'bg-ticker-tint text-breaking-crimson border-breaking-crimson/30',
    icon: (
      <span className="relative flex h-2 w-2 mr-1">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live-pulse opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-live-pulse" />
      </span>
    ),
  },
  scheduled: {
    key: 'scheduled',
    labelHindi: 'शेड्यूल्ड (Scheduled)',
    labelEnglish: 'Scheduled',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    icon: <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 mr-1 shrink-0" />,
  },
  review: {
    key: 'in_review',
    labelHindi: 'समीक्षाधीन (In Review)',
    labelEnglish: 'In Review',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    icon: <AlertCircle className="w-3 h-3 text-blue-600 dark:text-blue-400 mr-1 shrink-0" />,
  },
  in_review: {
    key: 'in_review',
    labelHindi: 'समीक्षाधीन (In Review)',
    labelEnglish: 'In Review',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    icon: <AlertCircle className="w-3 h-3 text-blue-600 dark:text-blue-400 mr-1 shrink-0" />,
  },
  draft: {
    key: 'draft',
    labelHindi: 'ड्राफ्ट (Draft)',
    labelEnglish: 'Draft',
    badgeClass: 'bg-paper-subtle text-secondary border-border-rule',
    icon: <FileEdit className="w-3 h-3 text-secondary mr-1 shrink-0" />,
  },
};

export default function StatusBadge({ status = 'draft', showIcon = true, className = '' }) {
  const normalized = (status || 'draft').toLowerCase();
  const config = STATUS_CONFIG[normalized] || STATUS_CONFIG.draft;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 font-inter text-[10px] sm:text-[11px] font-bold border tracking-wide uppercase ${config.badgeClass} ${className}`}
    >
      {showIcon && config.icon}
      <span>{config.labelHindi}</span>
    </span>
  );
}

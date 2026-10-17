import React from 'react';

export default function StatCard({
  titleHindi,
  titleEnglish,
  value,
  subtitle,
  icon: Icon,
  accentColor = 'primary', // 'primary' | 'crimson' | 'amber' | 'blue' | 'emerald'
  progressBar,
  badgeText,
  className = '',
}) {
  const accentStyles = {
    primary: {
      iconBg: 'bg-primary-container text-white',
      border: 'border-l-4 border-l-primary-container',
    },
    crimson: {
      iconBg: 'bg-ticker-tint text-breaking-crimson',
      border: 'border-l-4 border-l-breaking-crimson',
    },
    amber: {
      iconBg: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
      border: 'border-l-4 border-l-amber-500',
    },
    blue: {
      iconBg: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
      border: 'border-l-4 border-l-blue-600',
    },
    emerald: {
      iconBg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
      border: 'border-l-4 border-l-emerald-600',
    },
  };

  const currentAccent = accentStyles[accentColor] || accentStyles.primary;

  return (
    <div
      className={`bg-paper-canvas p-4 sm:p-5 border border-border-rule shadow-2xs flex flex-col justify-between transition-all hover:border-border-heavy ${currentAccent.border} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mukta text-xs sm:text-sm font-bold text-on-surface">
              {titleHindi}
            </span>
            {titleEnglish && (
              <span className="font-inter text-[10px] text-secondary uppercase tracking-wider">
                ({titleEnglish})
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mukta text-2xl sm:text-3xl font-extrabold text-on-surface leading-none">
              {value}
            </span>
            {badgeText && (
              <span className="px-1.5 py-0.5 bg-paper-tint text-[10px] font-inter font-bold text-secondary border border-border-rule">
                {badgeText}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className={`p-2.5 shrink-0 ${currentAccent.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Progress Bar (if provided) */}
      {progressBar && (
        <div className="mt-3 pt-2.5 border-t border-border-rule space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-inter text-secondary">
            <span>{progressBar.label}</span>
            <span className="font-bold text-on-surface">{progressBar.value}</span>
          </div>
          <div className="h-1.5 w-full bg-paper-subtle overflow-hidden">
            <div
              className="bg-primary-container h-full transition-all duration-500"
              style={{ width: `${progressBar.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtitle / Note */}
      {subtitle && !progressBar && (
        <div className="mt-3 pt-2 border-t border-border-rule font-inter text-[11px] text-secondary flex items-center justify-between">
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Editorial SectionHeading component
 * Features traditional newspaper top-rule or bottom-heavy border with square accent
 */
export default function SectionHeading({
  title,
  subtitle,
  viewAllLink,
  viewAllText = 'सभी देखें',
  accentColor = 'bg-primary-container',
  badgeText,
  className = '',
  rightContent,
}) {
  return (
    <div
      className={`flex items-center justify-between border-b-2 border-border-heavy pb-2 mb-5 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <span className={`w-3 h-3 ${accentColor} inline-block shrink-0`}></span>
        <h2 className="font-mukta text-xl md:text-2xl font-bold text-on-surface leading-tight tracking-tight">
          {title}
        </h2>
        {badgeText && (
          <span className="font-inter text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-paper-tint border border-border-rule text-secondary">
            {badgeText}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {subtitle && (
          <span className="hidden md:inline-block font-inter text-xs text-secondary font-medium">
            {subtitle}
          </span>
        )}

        {rightContent}

        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="inline-flex items-center gap-1 font-inter text-xs font-bold text-primary-container hover:text-primary transition-colors group"
          >
            <span>{viewAllText}</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

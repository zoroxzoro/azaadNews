import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({
  size = 'md',
  message = 'लोड हो रहा है...',
  fullPage = false,
  className = '',
}) {
  const sizeMap = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-7 h-7 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 p-6 text-secondary ${className}`}>
      <Loader2 className={`${sizeMap[size]?.split(' ')[0]} animate-spin text-primary-container`} />
      {message && (
        <span className="font-mukta text-secondary font-medium tracking-wide">
          {message}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[50vh] w-full flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}

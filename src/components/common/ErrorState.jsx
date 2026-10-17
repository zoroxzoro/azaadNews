import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({
  title = 'त्रुटि उत्पन्न हुई',
  message = 'सामग्री लोड करने में असमर्थ। कृपया पुनः प्रयास करें।',
  onRetry,
  className = '',
}) {
  return (
    <div
      className={`border border-border-rule bg-paper-tint p-8 text-center flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}
    >
      <div className="w-12 h-12 bg-red-100 text-breaking-crimson flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="font-mukta text-xl font-bold text-on-surface mb-1">
        {title}
      </h3>
      <p className="font-inter text-sm text-secondary mb-5 max-w-md">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container text-white font-inter text-xs font-bold uppercase tracking-wider hover:bg-primary transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>पुनः प्रयास करें</span>
        </button>
      )}
    </div>
  );
}

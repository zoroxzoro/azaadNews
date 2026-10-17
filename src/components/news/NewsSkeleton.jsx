import React from 'react';

/**
 * Editorial NewsSkeleton component
 * Provides high-fidelity loading state placeholders
 */
export default function NewsSkeleton({ type = 'card', count = 1 }) {
  const items = Array.from({ length: count });

  if (type === 'compact') {
    return (
      <div className="divide-y divide-border-rule animate-pulse">
        {items.map((_, i) => (
          <div key={i} className="py-2.5 flex items-center justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-2.5 w-16 bg-surface-container"></div>
              <div className="h-4 w-full bg-surface-container"></div>
              <div className="h-2.5 w-24 bg-surface-container"></div>
            </div>
            <div className="w-20 h-16 bg-surface-container shrink-0"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'hero') {
    return (
      <div className="animate-pulse space-y-4">
        <div className="aspect-[16/10] w-full bg-surface-container"></div>
        <div className="h-6 w-3/4 bg-surface-container"></div>
        <div className="h-4 w-full bg-surface-container"></div>
        <div className="h-4 w-5/6 bg-surface-container"></div>
        <div className="h-3 w-40 bg-surface-container"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {items.map((_, i) => (
        <div key={i} className="bg-paper-tint p-3 border border-border-rule space-y-3">
          <div className="aspect-[16/10] bg-surface-container w-full"></div>
          <div className="h-3 w-16 bg-surface-container"></div>
          <div className="h-4 w-full bg-surface-container"></div>
          <div className="h-4 w-4/5 bg-surface-container"></div>
          <div className="h-3 w-28 bg-surface-container"></div>
        </div>
      ))}
    </div>
  );
}

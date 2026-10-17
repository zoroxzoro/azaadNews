import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ className = '', showLabel = false, size = 'md' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'लाइट मोड चालू करें' : 'डार्क मोड चालू करें'}
      title={isDark ? 'स्विच करें: लाइट मोड (Light Mode)' : 'स्विच करें: डार्क मोड (Dark Mode)'}
      className={`inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-border-rule rounded-none ${
        isDark
          ? 'bg-paper-tint text-amber-300 hover:text-amber-200 hover:bg-paper-subtle'
          : 'bg-paper-tint text-secondary hover:text-on-surface hover:bg-paper-subtle'
      } ${
        size === 'sm' ? 'p-1.5 text-xs' : 'p-2 text-xs'
      } ${className}`}
    >
      {isDark ? (
        <Sun className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      ) : (
        <Moon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      )}
      {showLabel && (
        <span className="font-mukta font-bold text-xs">
          {isDark ? 'लाइट मोड' : 'डार्क मोड'}
        </span>
      )}
    </button>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { Tag } from 'lucide-react';

/**
 * ArticleTags component
 * Renders semantic tag cloud below article content.
 */
export default function ArticleTags({ tags = [], className = '' }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className={`mt-6 pt-4 border-t border-border-rule ${className}`}>
      <div className="flex items-center gap-1.5 font-inter text-xs font-semibold text-secondary mb-2.5">
        <Tag className="w-3.5 h-3.5 text-primary-container" />
        <span>विषय से जुड़े टैग्स (Tags):</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const cleanTag = tag.replace(/^#/, '');
          return (
            <Link
              key={tag}
              to={`/search?q=${encodeURIComponent(cleanTag)}`}
              className="px-2.5 py-1 bg-paper-tint border border-border-rule text-on-surface hover:border-primary-container hover:text-primary-container font-inter text-xs transition-colors rounded-xs"
            >
              #{cleanTag}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

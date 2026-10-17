import React from 'react';
import { Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  icon: Icon = Newspaper,
  title = 'कोई समाचार उपलब्ध नहीं है',
  description = 'इस श्रेणी या खोज में फिलहाल कोई खबर उपलब्ध नहीं है। कृपया बाद में देखें।',
  actionLink,
  actionText = 'मुख्य पृष्ठ पर जाएं',
  className = '',
}) {
  return (
    <div
      className={`border border-border-rule bg-paper-canvas p-10 text-center flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}
    >
      <div className="w-14 h-14 bg-surface-container text-tertiary flex items-center justify-center mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-mukta text-xl font-bold text-on-surface mb-2">
        {title}
      </h3>
      <p className="font-inter text-sm text-secondary mb-6 max-w-sm">
        {description}
      </p>
      {actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-border-heavy text-white font-inter text-xs font-bold uppercase tracking-wider hover:bg-primary transition-colors"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
}

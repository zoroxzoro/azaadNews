import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import ArticleActionsMenu from './ArticleActionsMenu';
import { User, Calendar } from 'lucide-react';

export default function ArticleManagementCard({
  article,
  isSelected = false,
  onToggleSelect,
  onStatusChange,
  onDeleteRequest,
}) {
  return (
    <div
      className={`bg-paper-canvas border p-3.5 space-y-3 transition-colors ${
        isSelected
          ? 'border-primary-container bg-ticker-tint/20'
          : 'border-border-rule hover:border-border-heavy'
      }`}
    >
      {/* Top: Selection, Category, Language & Action Menu */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(article.id)}
            className="w-4 h-4 accent-primary-container cursor-pointer"
            aria-label={`आलेख चुनें: ${article.title}`}
          />
          <span className="px-1.5 py-0.2 bg-paper-subtle text-[10px] font-bold uppercase tracking-wider text-secondary border border-border-rule">
            {article.categoryNameHindi || article.category}
          </span>
          <span className="px-1.5 py-0.2 bg-paper-tint text-[10px] font-mono font-bold uppercase text-secondary border border-border-rule">
            {article.language ? article.language.toUpperCase() : 'HI'}
          </span>
          <span className="text-[10px] font-mono text-secondary">
            #{article.id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={article.status} />
          <ArticleActionsMenu
            article={article}
            onStatusChange={onStatusChange}
            onDeleteRequest={onDeleteRequest}
          />
        </div>
      </div>

      {/* Middle: Thumbnail + Title */}
      <div className="flex gap-3 items-start">
        <div className="w-20 aspect-video bg-surface-container shrink-0 overflow-hidden border border-border-rule">
          <img
            src={article.featuredImage}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <Link
            to={`/admin/news/edit/${article.id}`}
            className="font-mukta text-sm sm:text-base font-bold text-on-surface hover:text-primary-container line-clamp-2 leading-snug"
          >
            {article.title}
          </Link>
          <span className="text-[10px] font-mono text-secondary block mt-0.5 truncate">
            /{article.slug}
          </span>
        </div>
      </div>

      {/* Bottom: Author, Time, and Edit CTA */}
      <div className="pt-2 border-t border-border-rule/60 flex items-center justify-between text-[11px] font-inter text-secondary">
        <div className="flex items-center gap-1 truncate">
          <User className="w-3 h-3 text-secondary shrink-0" />
          <span className="truncate">{article.author?.name || 'आज़ाद ब्यूरो'}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-secondary" />
            <span>
              {article.updatedAt
                ? new Date(article.updatedAt).toLocaleDateString('hi-IN', {
                    day: 'numeric',
                    month: 'short',
                  })
                : 'हाल ही में'}
            </span>
          </span>

          <Link
            to={`/admin/news/edit/${article.id}`}
            className="px-2 py-0.5 bg-paper-tint hover:bg-paper-subtle border border-border-rule text-on-surface font-bold text-[10px] transition-colors"
          >
            एडिट
          </Link>
        </div>
      </div>
    </div>
  );
}

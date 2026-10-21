import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MoreVertical,
  Eye,
  Edit,
  Send,
  FileEdit,
  CalendarClock,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { normalizeStatus, ARTICLE_STATUS } from '../../utils/articleStatus';

export default function ArticleActionsMenu({
  article,
  onStatusChange,
  onDeleteRequest,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const currentStatus = normalizeStatus(article.status);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 hover:bg-paper-subtle text-secondary hover:text-on-surface rounded cursor-pointer transition-colors"
        aria-label="कार्रवाई विकल्प"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-paper-canvas border border-border-rule shadow-xl py-1.5 z-40 text-xs font-inter animate-in fade-in duration-100">
          {/* 1. Preview */}
          <Link
            to={`/admin/news/preview/${article.id}`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-1.5 text-on-surface hover:bg-paper-tint hover:text-primary-container transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>पूर्वावलोकन (Preview)</span>
          </Link>

          {/* If published, link to public site */}
          {currentStatus === ARTICLE_STATUS.PUBLISHED && (
            <Link
              to={`/news/${article.slug}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-secondary hover:bg-paper-tint hover:text-on-surface transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>लाइव पृष्ठ देखें</span>
            </Link>
          )}

          {/* 2. Edit */}
          <Link
            to={`/admin/news/edit/${article.id}`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-1.5 text-on-surface hover:bg-paper-tint hover:text-primary-container transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>संपादित करें (Edit)</span>
          </Link>

          <div className="my-1 border-t border-border-rule/60" />

          {/* 3. Status Transitions */}
          {/* Publish action (if not already published) */}
          {currentStatus !== ARTICLE_STATUS.PUBLISHED && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onStatusChange(article.id, ARTICLE_STATUS.PUBLISHED);
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>सीधा प्रकाशित करें (Publish)</span>
            </button>
          )}

          {/* Submit for review (if draft) */}
          {currentStatus === ARTICLE_STATUS.DRAFT && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onStatusChange(article.id, ARTICLE_STATUS.IN_REVIEW);
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>समीक्षा हेतु भेजें (In Review)</span>
            </button>
          )}

          {/* Schedule publication (if review or draft) */}
          {(currentStatus === ARTICLE_STATUS.IN_REVIEW || currentStatus === ARTICLE_STATUS.DRAFT) && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onStatusChange(article.id, ARTICLE_STATUS.SCHEDULED, {
                  scheduledFor: new Date(Date.now() + 3600 * 1000 * 4).toISOString(),
                });
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>शेड्यूल करें (Schedule)</span>
            </button>
          )}

          {/* Move to draft (if in_review, scheduled, or published) */}
          {currentStatus !== ARTICLE_STATUS.DRAFT && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onStatusChange(article.id, ARTICLE_STATUS.DRAFT);
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-secondary hover:bg-paper-tint hover:text-on-surface transition-colors cursor-pointer"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>ड्राफ्ट में बदलें (To Draft)</span>
            </button>
          )}

          {/* 4. Delete (Only available if permitted / Super Admin) */}
          {Boolean(onDeleteRequest) && (
            <>
              <div className="my-1 border-t border-border-rule/60" />
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onDeleteRequest(article);
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-breaking-crimson hover:bg-ticker-tint transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>हटाएं (Delete)</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

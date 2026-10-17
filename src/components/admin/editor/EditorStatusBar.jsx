import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Calendar,
  Rocket,
  CheckCircle,
  Clock,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import StatusBadge from '../StatusBadge';
import { ARTICLE_STATUS } from '../../../utils/articleStatus';

export default function EditorStatusBar({
  articleId,
  isEditing,
  status = ARTICLE_STATUS.DRAFT,
  autosaveTime = null,
  wordCount = 0,
  charCount = 0,
  readTime = '1 मिनट',
  canPublish = true,
  isSaving = false,
  onSaveDraft,
  onPreview,
  onOpenProofreading,
  onSubmitForReview,
  onPublish,
  onSchedule,
}) {
  // onSchedule callback is provided by parent NewsEditorPage

  return (
    <>
      <div className="sticky top-16 z-30 bg-paper-canvas border-b border-border-rule px-4 sm:px-6 py-2.5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back Link & Autosave / Word Meta */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <Link
              to="/admin/news"
              className="inline-flex items-center gap-1.5 font-mukta text-xs sm:text-sm text-secondary hover:text-primary-container transition-colors font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>सभी समाचार (All News)</span>
            </Link>

            <div className="h-4 w-px bg-border-rule hidden sm:block" />

            {/* Autosave Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-inter text-secondary">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
              <span>
                {autosaveTime
                  ? `स्वतः सहेजा गया ${autosaveTime}`
                  : 'स्थानीय ड्राफ्ट सुरक्षा सक्रिय'}
              </span>
            </div>

            <div className="h-4 w-px bg-border-rule hidden md:block" />

            {/* Word / Char Counters */}
            <div className="hidden md:flex items-center gap-2 text-xs font-inter text-secondary bg-paper-tint px-2.5 py-0.5 border border-border-rule">
              <span>
                शब्द: <strong className="text-on-surface">{wordCount}</strong>
              </span>
              <span>•</span>
              <span>
                पठन: <strong className="text-on-surface">{readTime}</strong>
              </span>
            </div>

            {/* Status Badge */}
            <StatusBadge status={status} size="sm" />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-start sm:justify-end">
            {/* Save Draft */}
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSaving}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-paper-tint hover:bg-paper-subtle border border-border-rule text-on-surface font-mukta text-xs sm:text-sm font-bold transition-colors cursor-pointer shrink-0"
              title="सहेजें (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5 text-secondary" />
              <span>{isSaving ? 'सहेज रहे हैं...' : 'ड्राफ्ट'}</span>
              <kbd className="hidden xl:inline-block font-mono text-[9px] bg-paper-canvas border border-border-rule px-1 py-0.2 shadow-2xs text-secondary ml-0.5">
                Ctrl+S
              </kbd>
            </button>

            {/* Preview */}
            <button
              type="button"
              onClick={onPreview}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-paper-tint hover:bg-paper-subtle border border-border-rule text-on-surface font-mukta text-xs sm:text-sm font-bold transition-colors cursor-pointer shrink-0"
              title="लाइव पूर्वावलोकन"
            >
              <Eye className="w-3.5 h-3.5 text-secondary" />
              <span>पूर्वावलोकन</span>
            </button>

            {/* AI Proofreading Check */}
            {onOpenProofreading && (
              <button
                type="button"
                onClick={onOpenProofreading}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 hover:from-amber-500/20 hover:to-purple-500/20 border border-primary-container/40 text-primary-container font-mukta text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer shrink-0"
                title="AI वर्तनी व भाषा जाँच (Check with AI)"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary-container shrink-0" />
                <span>AI जाँच</span>
              </button>
            )}

            {/* Schedule */}
            {canPublish && (
              <button
                type="button"
                onClick={onSchedule}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-paper-tint hover:bg-paper-subtle border border-border-rule text-on-surface font-mukta text-xs sm:text-sm font-bold transition-colors cursor-pointer shrink-0"
                title="प्रकाशन का समय तय करें (Schedule Publication)"
              >
                <Calendar className="w-3.5 h-3.5 text-secondary" />
                <span>शेड्यूल</span>
              </button>
            )}

            {/* Submit for Review (if draft and user is not admin/publishing directly) */}
            {status === ARTICLE_STATUS.DRAFT && !canPublish && (
              <button
                type="button"
                onClick={onSubmitForReview}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-mukta text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>समीक्षा भेजें</span>
              </button>
            )}

            {/* Publish Now (if authorized) */}
            {canPublish && (
              <button
                type="button"
                onClick={onPublish}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-primary-container hover:bg-primary text-white font-mukta text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer shrink-0"
                title="सीधा पोर्टल पर प्रकाशित करें"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>
                  {status === ARTICLE_STATUS.PUBLISHED
                    ? 'अपडेट करें'
                    : 'प्रकाशित करें'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

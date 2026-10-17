import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  List,
  Clock,
  Plus,
  AlertTriangle,
  RotateCcw,
  Rocket,
  Info,
  CheckCircle2,
  X,
  ExternalLink,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useArticles } from '../../context/ArticleContext';
import {
  calculateSchedulingStats,
  getArticleScheduledTime,
} from '../../utils/schedulingUtils';
import {
  formatInIST,
  formatIstTime,
  isOverdueScheduled,
  TIMEZONE_LABEL,
  NEWSROOM_TIMEZONE,
} from '../../utils/timezoneUtils';
import {
  PublishingCalendar,
  ScheduledArticlesList,
  PublishingQueue,
  SchedulingStats,
  RescheduleDialog,
} from '../../components/admin/scheduling';

export default function ScheduledNewsPage() {
  const navigate = useNavigate();
  const {
    articles,
    rescheduleArticle,
    returnToDraft,
    publishScheduledNow,
  } = useArticles();

  // Active view: 'calendar' | 'list' | 'queue'
  const [activeView, setActiveView] = useState('calendar');

  // Modal states
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [draftConfirmTarget, setDraftConfirmTarget] = useState(null);
  const [publishConfirmTarget, setPublishConfirmTarget] = useState(null);
  const [previewTarget, setPreviewTarget] = useState(null);

  // Scheduling statistics
  const stats = useMemo(() => {
    return calculateSchedulingStats(articles);
  }, [articles]);

  // Action handlers
  const handleEdit = (article) => {
    navigate(`/admin/news/edit/${article.id}`);
  };

  const handlePreview = (article) => {
    setPreviewTarget(article);
  };

  const handleOpenReschedule = (article) => {
    setRescheduleTarget(article);
  };

  const handleConfirmReschedule = (articleId, newScheduledAtIso) => {
    try {
      rescheduleArticle(articleId, newScheduledAtIso);
      toast.success('प्रकाशन समय सफलतापूर्वक अपडेट किया गया!');
    } catch (err) {
      console.error(err);
      toast.error('समय बदलने में त्रुटि हुई');
    }
  };

  const handleConfirmReturnToDraft = () => {
    if (!draftConfirmTarget) return;
    try {
      returnToDraft(draftConfirmTarget.id);
      toast.success('समाचार शेड्यूलिंग रद्द कर ड्राफ्ट में भेज दिया गया');
      setDraftConfirmTarget(null);
    } catch (err) {
      console.error(err);
      toast.error('ड्राफ्ट में भेजने में त्रुटि हुई');
    }
  };

  const handleConfirmPublishNow = () => {
    if (!publishConfirmTarget) return;
    try {
      publishScheduledNow(publishConfirmTarget.id);
      toast.success('समाचार सार्वजनिक पोर्टल पर सफलतापूर्वक लाइव प्रकाशित हुआ!');
      setPublishConfirmTarget(null);
    } catch (err) {
      console.error(err);
      toast.error('प्रकाशन में त्रुटि हुई');
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* 1. TOP HEADER & NOTICE STRIP */}
      <div className="bg-paper-canvas border border-border-rule shadow-xs p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mukta text-xs font-bold uppercase tracking-wider text-primary-container bg-paper-tint px-2 py-0.5 border border-border-rule">
                संपादकीय समय-सारणी
              </span>
              <span className="inline-flex items-center gap-1.5 font-inter text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 border border-emerald-300 dark:border-emerald-800 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>{TIMEZONE_LABEL}</span>
              </span>
            </div>
            <h1 className="font-mukta text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              निर्धारित समाचार कैलेंडर (Scheduled News)
            </h1>
            <p className="font-inter text-xs sm:text-sm text-secondary mt-1 max-w-2xl">
              आगामी प्रकाशनों की दैनिक समय-सारणी, प्राइम-टाइम कैडेंस मॉनिटर और शेड्यूल्ड कतार।
            </p>
          </div>

          {/* Action Button & View Switcher */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/admin/news/create')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-container hover:bg-primary text-white font-mukta text-sm font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ नया समाचार लिखें / शेड्यूल करें</span>
            </button>
          </div>
        </div>

        {/* Discreet Prototype Demonstration Notice */}
        <div className="mt-4 pt-3 border-t border-border-rule flex items-start sm:items-center gap-2 text-xs font-inter text-secondary bg-paper-tint p-2.5 border">
          <Info className="w-4 h-4 text-primary-container shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>डेवलपमेंट सूचना:</strong> शेड्यूलिंग केवल प्रोटोटाइप प्रदर्शन हेतु स्थानीय स्तर (Shared Store) पर सुरक्षित है। वास्तविक स्वचालित समय-बद्ध प्रकाशन के लिए बैकएंड जॉब शेड्यूलर (Persistent Queue) आवश्यक है।
          </span>
        </div>
      </div>

      {/* 2. SCHEDULING STATISTICS STRIP */}
      <SchedulingStats
        stats={stats}
        onFilterToday={() => setActiveView('queue')}
        onFilterOverdue={() => setActiveView('list')}
      />

      {/* 3. VIEW MODE CONTROLS */}
      <div className="bg-paper-canvas border border-border-rule px-4 py-2.5 flex items-center justify-between flex-wrap gap-3 shadow-xs">
        {/* Switcher tabs */}
        <div className="flex items-center bg-paper-subtle p-1 border border-border-rule">
          <button
            type="button"
            onClick={() => setActiveView('calendar')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 font-mukta text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeView === 'calendar'
                ? 'bg-paper-canvas text-primary-container shadow-2xs font-extrabold'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>मासिक कैलेंडर (Calendar)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('list')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 font-mukta text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeView === 'list'
                ? 'bg-paper-canvas text-primary-container shadow-2xs font-extrabold'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <List className="w-4 h-4" />
            <span>सूची दृश्य (List / Table)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('queue')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 font-mukta text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeView === 'queue'
                ? 'bg-paper-canvas text-primary-container shadow-2xs font-extrabold'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>प्रकाशन कतार (Editorial Queue)</span>
          </button>
        </div>

        {/* Quick count indicator */}
        <div className="font-inter text-xs text-secondary">
          प्रकाशन कतार में: <strong className="text-on-surface">{stats.totalScheduled}</strong> समाचार
        </div>
      </div>

      {/* 4. MAIN VIEW WORKSPACE */}
      {activeView === 'calendar' && (
        <PublishingCalendar
          articles={articles}
          onPreview={handlePreview}
          onEdit={handleEdit}
          onReschedule={handleOpenReschedule}
          onReturnToDraft={(art) => setDraftConfirmTarget(art)}
          onPublishNow={(art) => setPublishConfirmTarget(art)}
          onCreateScheduled={() => navigate('/admin/news/create')}
        />
      )}

      {activeView === 'list' && (
        <ScheduledArticlesList
          articles={articles}
          onPreview={handlePreview}
          onEdit={handleEdit}
          onReschedule={handleOpenReschedule}
          onReturnToDraft={(art) => setDraftConfirmTarget(art)}
          onPublishNow={(art) => setPublishConfirmTarget(art)}
          onCreateScheduled={() => navigate('/admin/news/create')}
        />
      )}

      {activeView === 'queue' && (
        <PublishingQueue
          articles={articles}
          onPreview={handlePreview}
          onEdit={handleEdit}
          onReschedule={handleOpenReschedule}
          onReturnToDraft={(art) => setDraftConfirmTarget(art)}
          onPublishNow={(art) => setPublishConfirmTarget(art)}
        />
      )}

      {/* 5. RESCHEDULE MODAL */}
      <RescheduleDialog
        isOpen={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        onConfirm={handleConfirmReschedule}
        article={rescheduleTarget}
      />

      {/* 6. RETURN TO DRAFT CONFIRMATION MODAL */}
      {draftConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-canvas border border-border-rule shadow-2xl w-full max-w-md font-mukta p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-border-rule pb-3">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-bold text-on-surface">
                ड्राफ्ट में वापस लौटाएं?
              </h3>
            </div>

            <p className="font-inter text-xs text-secondary leading-relaxed">
              क्या आप सुनिश्चित हैं कि आप <strong>"{draftConfirmTarget.title}"</strong> को ड्राफ्ट में वापस भेजना चाहते हैं? यह समाचार शेड्यूल्ड कतार और कैलेंडर से हटा दिया जाएगा।
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-rule">
              <button
                type="button"
                onClick={() => setDraftConfirmTarget(null)}
                className="px-4 py-1.5 bg-paper-tint hover:bg-paper-subtle border border-border-rule text-xs font-bold text-on-surface"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmReturnToDraft}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
              >
                ड्राफ्ट में भेजें (Confirm)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. PUBLISH NOW CONFIRMATION MODAL */}
      {publishConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-canvas border border-border-rule shadow-2xl w-full max-w-md font-mukta p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-border-rule pb-3">
              <Rocket className="w-5 h-5 text-primary-container" />
              <h3 className="text-lg font-bold text-on-surface">
                अभी तुरंत प्रकाशित करें? (Publish Immediately)
              </h3>
            </div>

            <p className="font-inter text-xs text-secondary leading-relaxed">
              क्या आप <strong>"{publishConfirmTarget.title}"</strong> को निर्धारित समय से पहले अभी तुरंत सार्वजनिक पोर्टल पर लाइव प्रकाशित करना चाहते हैं?
            </p>

            <div className="bg-paper-tint p-3 border border-border-rule text-xs font-inter text-secondary space-y-1">
              <div>
                <strong>श्रेणी:</strong> {publishConfirmTarget.category}
              </div>
              <div>
                <strong>मूल शेड्यूल्ड समय:</strong>{' '}
                {formatInIST(getArticleScheduledTime(publishConfirmTarget), { locale: 'hi' })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-rule">
              <button
                type="button"
                onClick={() => setPublishConfirmTarget(null)}
                className="px-4 py-1.5 bg-paper-tint hover:bg-paper-subtle border border-border-rule text-xs font-bold text-on-surface"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmPublishNow}
                className="px-4 py-1.5 bg-primary-container hover:bg-primary text-white text-xs font-bold shadow-xs"
              >
                तुरंत प्रकाशित करें (Publish Now)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. PREVIEW MODAL */}
      {previewTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-canvas border border-border-rule shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col font-mukta overflow-hidden">
            {/* Header */}
            <div className="bg-paper-tint p-4 border-b border-border-rule flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary-container" />
                <span className="font-mukta text-base font-bold text-on-surface">
                  आलेख पूर्वावलोकन (Preview)
                </span>
                <span className="text-xs bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 font-bold">
                  शेड्यूल्ड
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTarget(null)}
                className="p-1 text-secondary hover:text-on-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Preview Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-primary-container text-white px-2 py-0.5 text-xs font-bold uppercase">
                  {previewTarget.category}
                </span>
                <span className="text-secondary text-xs font-inter">
                  निर्धारित: {formatInIST(getArticleScheduledTime(previewTarget), { locale: 'hi' })}
                </span>
              </div>

              <h2 className="font-mukta text-xl sm:text-2xl font-extrabold text-on-surface leading-snug">
                {previewTarget.title}
              </h2>

              {previewTarget.summary && (
                <p className="font-inter text-sm text-secondary bg-paper-tint p-3 border-l-4 border-primary-container">
                  {previewTarget.summary}
                </p>
              )}

              {previewTarget.featuredImage && (
                <div className="relative">
                  <img
                    src={previewTarget.featuredImage}
                    alt={previewTarget.title}
                    className="w-full max-h-64 object-cover border border-border-rule"
                  />
                  {previewTarget.imageCaption && (
                    <span className="block text-[11px] text-secondary font-inter mt-1 italic">
                      {previewTarget.imageCaption}
                    </span>
                  )}
                </div>
              )}

              <div className="prose max-w-none font-mukta text-base text-on-surface leading-relaxed pt-2 border-t border-border-rule whitespace-pre-line">
                {typeof previewTarget.content === 'string'
                  ? previewTarget.content.replace(/<[^>]*>/g, '')
                  : 'आलेख सामग्री उपलब्ध है।'}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-paper-tint p-4 border-t border-border-rule flex items-center justify-between">
              <span className="font-inter text-xs text-secondary">
                लेखक: {previewTarget.author?.name || previewTarget.scheduledBy || 'संपादक'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const id = previewTarget.id;
                    setPreviewTarget(null);
                    navigate(`/admin/news/preview/${id}`);
                  }}
                  className="px-3 py-1.5 border border-border-rule text-xs font-bold text-on-surface hover:bg-paper-canvas flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>पूर्ण पूर्वावलोकन</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTarget(null)}
                  className="px-4 py-1.5 bg-primary-container text-white text-xs font-bold hover:bg-primary"
                >
                  बंद करें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

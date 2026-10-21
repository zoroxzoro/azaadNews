import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { notificationService } from '../../services/notificationService';
import { articlesService } from '../../services/articlesService';
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
import { useAuth } from '../../context/AuthContext';
import { normalizeStatus, ARTICLE_STATUS } from '../../utils/articleStatus';

export default function ScheduledNewsPage() {
  const navigate = useNavigate();
  const { currentUser, isSuperAdmin } = useAuth();
  const {
    articles,
    rescheduleArticle,
    returnToDraft,
    publishScheduledNow,
    publishOverdueScheduled,
  } = useArticles();

  // Ordinary admin filters by their user ID; Super admin sees global scheduled items
  const effectiveAuthorId = isSuperAdmin ? null : currentUser?.id;

  // Direct remote scheduled articles
  const [dbScheduled, setDbScheduled] = useState([]);
  const [isLoadingScheduled, setIsLoadingScheduled] = useState(true);

  const loadScheduled = useCallback(async () => {
    try {
      const data = await articlesService.getScheduledArticles(effectiveAuthorId);
      setDbScheduled(data);
    } catch (err) {
      console.warn('[ScheduledNewsPage] Error loading scheduled articles:', err);
    } finally {
      setIsLoadingScheduled(false);
    }
  }, [effectiveAuthorId]);

  useEffect(() => {
    loadScheduled();
  }, [loadScheduled]);

  // Combine remote scheduled articles with any in-memory scheduled items
  const displayArticles = useMemo(() => {
    const map = new Map();
    // Start with database scheduled articles
    dbScheduled.forEach((a) => {
      if (normalizeStatus(a.status) === ARTICLE_STATUS.SCHEDULED) {
        if (!effectiveAuthorId || a.authorId === effectiveAuthorId || a.author?.id === effectiveAuthorId) {
          map.set(String(a.id), a);
        }
      }
    });
    // Overlay context articles (and immediately evict any non-scheduled items)
    articles.forEach((a) => {
      const norm = normalizeStatus(a.status);
      if (norm === ARTICLE_STATUS.SCHEDULED) {
        if (!effectiveAuthorId || a.authorId === effectiveAuthorId || a.author?.id === effectiveAuthorId) {
          map.set(String(a.id), a);
        }
      } else if (map.has(String(a.id))) {
        map.delete(String(a.id));
      }
    });
    return Array.from(map.values());
  }, [articles, dbScheduled, effectiveAuthorId]);

  // Active view: 'calendar' | 'list' | 'queue'
  const [activeView, setActiveView] = useState('calendar');
  const [isReconciling, setIsReconciling] = useState(false);

  // Modal states
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [draftConfirmTarget, setDraftConfirmTarget] = useState(null);
  const [publishConfirmTarget, setPublishConfirmTarget] = useState(null);
  const [previewTarget, setPreviewTarget] = useState(null);

  // Scheduling statistics
  const stats = useMemo(() => {
    return calculateSchedulingStats(displayArticles);
  }, [displayArticles]);

  // Action handlers
  const handleAutoPublishOverdue = async () => {
    setIsReconciling(true);
    try {
      const res = await publishOverdueScheduled();
      if (res?.publishedCount > 0) {
        toast.success(`${res.publishedCount} ओवरड्यू समाचार सफलतापूर्वक प्रकाशित किए गए!`);
        notificationService.createNotification({
          type: 'published',
          title: 'ओवरड्यू शेड्यूल्ड समाचार प्रकाशित',
          message: `${res.publishedCount} ओवरड्यू समाचार निर्धारित समय अनुसार लाइव प्रकाशित हुए।`,
          link: '/admin/news',
        });
      } else {
        toast.info('कोई ओवरड्यू समाचार लंबित नहीं है।');
      }
    } catch (err) {
      toast.error(err.message || 'स्वचालित प्रकाशन में त्रुटि');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleEdit = (article) => {
    navigate(`/admin/news/edit/${article.id}`);
  };

  const handlePreview = (article) => {
    setPreviewTarget(article);
  };

  const handleOpenReschedule = (article) => {
    setRescheduleTarget(article);
  };

  const handleConfirmReschedule = async (articleId, newScheduledAtIso) => {
    try {
      await rescheduleArticle(articleId, newScheduledAtIso);
      toast.success('प्रकाशन समय सफलतापूर्वक अपडेट किया गया!');
      await loadScheduled();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'समय बदलने में त्रुटि हुई');
    }
  };

  const handleConfirmReturnToDraft = async () => {
    if (!draftConfirmTarget) return;
    try {
      await returnToDraft(draftConfirmTarget.id);
      toast.success('समाचार शेड्यूलिंग रद्द कर ड्राफ्ट में भेज दिया गया');
      notificationService.createNotification({
        type: 'draft',
        title: 'शेड्यूलिंग रद्द (ड्राफ्ट)',
        message: `"${draftConfirmTarget.title}" को शेड्यूल्ड कतार से हटाकर ड्राफ्ट में स्थानांतरित किया गया।`,
        articleId: draftConfirmTarget.id,
        link: '/admin/news',
      });
      setDraftConfirmTarget(null);
      await loadScheduled();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'ड्राफ्ट में भेजने में त्रुटि हुई');
    }
  };

  const handleConfirmPublishNow = async () => {
    if (!publishConfirmTarget) return;
    try {
      await publishScheduledNow(publishConfirmTarget.id);
      toast.success('समाचार सार्वजनिक पोर्टल पर सफलतापूर्वक लाइव प्रकाशित हुआ!');
      notificationService.createNotification({
        type: 'published',
        title: 'शेड्यूल्ड समाचार लाइव हुआ',
        message: `"${publishConfirmTarget.title}" को तत्काल लाइव प्रकाशित किया गया।`,
        articleId: publishConfirmTarget.id,
        link: `/news/${publishConfirmTarget.slug || ''}`,
      });
      setPublishConfirmTarget(null);
      await loadScheduled();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'प्रकाशन में त्रुटि हुई');
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
              {isSuperAdmin
                ? 'निर्धारित समाचार कैलेंडर (Scheduled News)'
                : `मेरे निर्धारित समाचार (My Scheduled News) - ${currentUser?.name || 'एडमिन'}`}
            </h1>
            <p className="font-inter text-xs sm:text-sm text-secondary mt-1 max-w-2xl">
              {isSuperAdmin
                ? 'आगामी प्रकाशनों की दैनिक समय-सारणी, प्राइम-टाइम कैडेंस मॉनिटर और वैश्विक शेड्यूल्ड कतार।'
                : 'आपके द्वारा निर्धारित आलेखों की समय-सारणी, पुनः निर्धारण (Reschedule) एवं ड्राफ्ट में वापसी।'}
            </p>
          </div>

          {/* Action Button & View Switcher */}
          <div className="flex items-center gap-3 flex-wrap">
            {stats.overdueScheduled > 0 && (
              <button
                type="button"
                onClick={handleAutoPublishOverdue}
                disabled={isReconciling}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-mukta text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Rocket className="w-4 h-4" />
                <span>{isReconciling ? 'प्रकाशन जारी...' : `${stats.overdueScheduled} ओवरड्यू प्रकाशित करें`}</span>
              </button>
            )}
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

        {/* Server-Side Scheduler Status Strip */}
        <div className="mt-4 pt-3 border-t border-border-rule flex items-start sm:items-center justify-between flex-wrap gap-2 text-xs font-inter text-secondary bg-paper-tint p-2.5 border">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>सर्वर शेड्यूलर सक्रिय:</strong> समाचार UTC टाइमस्टैम्प के साथ सुरक्षित हैं। निर्धारित समय आने पर सर्वर वर्कर / बैकग्राउंड रिकॉन्सिलिएशन द्वारा स्वतः प्रकाशित हो जाते हैं।
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 border border-emerald-200">
            Auto-Sync Ready
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
          articles={displayArticles}
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
          articles={displayArticles}
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
          articles={displayArticles}
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

import React from 'react';
import {
  Clock,
  Calendar,
  AlertTriangle,
  Flame,
  ChevronRight,
  Eye,
  Edit,
  RotateCcw,
  Rocket,
} from 'lucide-react';
import { partitionPublishingQueue, getArticleScheduledTime } from '../../../utils/schedulingUtils';
import { formatInIST, formatIstTime, isOverdueScheduled } from '../../../utils/timezoneUtils';

export default function PublishingQueue({
  articles = [],
  onPreview,
  onEdit,
  onReschedule,
  onReturnToDraft,
  onPublishNow,
}) {
  const queue = partitionPublishingQueue(articles);

  const sections = [
    {
      id: 'overdue',
      titleHindi: 'अतिदेय समाचार (Overdue - Immediate Action)',
      description: 'इनका निर्धारित समय बीत चुका है, लेकिन ये अभी भी शेड्यूल्ड हैं।',
      articles: queue.overdue,
      badgeColor: 'bg-breaking-crimson text-white',
      borderColor: 'border-breaking-crimson/50',
      bgColor: 'bg-ticker-tint/30',
      icon: AlertTriangle,
    },
    {
      id: 'today',
      titleHindi: 'आज के प्रकाशन (Today\'s Queue)',
      description: 'आज के शेष घंटों में प्रकाशित होने वाले समाचार।',
      articles: queue.today,
      badgeColor: 'bg-emerald-600 text-white',
      borderColor: 'border-emerald-300 dark:border-emerald-800',
      bgColor: 'bg-emerald-50/30 dark:bg-emerald-950/20',
      icon: Clock,
    },
    {
      id: 'tomorrow',
      titleHindi: 'कल के प्रकाशन (Tomorrow)',
      description: 'आगामी कार्यदिवस के लिए निर्धारित वायर।',
      articles: queue.tomorrow,
      badgeColor: 'bg-blue-600 text-white',
      borderColor: 'border-blue-200 dark:border-blue-800',
      bgColor: 'bg-blue-50/20 dark:bg-blue-950/20',
      icon: Calendar,
    },
    {
      id: 'laterThisWeek',
      titleHindi: 'इस सप्ताह के बाद (Later This Week)',
      description: 'अगले 2 से 7 दिनों के मध्य निर्धारित।',
      articles: queue.laterThisWeek,
      badgeColor: 'bg-amber-600 text-white',
      borderColor: 'border-amber-200 dark:border-amber-800',
      bgColor: 'bg-amber-50/20 dark:bg-amber-950/20',
      icon: Flame,
    },
    {
      id: 'upcoming',
      titleHindi: 'आगामी समय (Upcoming Pipeline)',
      description: 'भविष्य के प्रकाशनों की दीर्घकालिक कतार।',
      articles: queue.upcoming,
      badgeColor: 'bg-secondary text-white',
      borderColor: 'border-border-rule',
      bgColor: 'bg-paper-canvas',
      icon: Calendar,
    },
  ];

  const totalInQueue =
    queue.overdue.length +
    queue.today.length +
    queue.tomorrow.length +
    queue.laterThisWeek.length +
    queue.upcoming.length;

  if (totalInQueue === 0) {
    return (
      <div className="bg-paper-canvas border border-border-rule p-8 text-center shadow-xs">
        <Clock className="w-10 h-10 text-secondary/40 mx-auto mb-2" />
        <h4 className="font-mukta text-base font-bold text-on-surface">
          प्रकाशन कतार पूरी तरह खाली है
        </h4>
        <p className="font-inter text-xs text-secondary mt-1 max-w-sm mx-auto">
          इस समय कोई भी समाचार कतार में नहीं है। न्यूज़ एडिटर से आलेख लिखकर उसे शेड्यूल करें।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((sec) => {
        if (sec.articles.length === 0) return null;
        const IconComponent = sec.icon;

        return (
          <div
            key={sec.id}
            className={`border ${sec.borderColor} ${sec.bgColor} p-4 shadow-xs space-y-3 transition-all`}
          >
            {/* Section Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-xs flex items-center justify-center shrink-0 ${sec.badgeColor}`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className="font-mukta text-base font-bold text-on-surface flex items-center gap-2">
                    {sec.titleHindi}
                    <span className="font-inter text-xs font-bold text-secondary">
                      ({sec.articles.length})
                    </span>
                  </h4>
                  <p className="font-inter text-[11px] text-secondary">{sec.description}</p>
                </div>
              </div>
            </div>

            {/* Articles List in this Section */}
            <div className="divide-y divide-border-rule/60 bg-paper-canvas border border-border-rule">
              {sec.articles.map((article) => {
                const scheduledTime = getArticleScheduledTime(article);
                const isOverdue = isOverdueScheduled(scheduledTime, article.status);
                const timeOnly = formatIstTime(scheduledTime);
                const fullIst = formatInIST(scheduledTime, { locale: 'hi' });

                return (
                  <div
                    key={article.id}
                    className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-paper-tint/60 transition-colors"
                  >
                    {/* Left: Time badge & Title */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="shrink-0 text-center min-w-[70px] pt-0.5">
                        <span
                          className={`inline-block px-1.5 py-0.5 font-inter text-[10px] font-bold rounded-2xs ${
                            isOverdue
                              ? 'bg-breaking-crimson text-white animate-pulse'
                              : 'bg-paper-tint text-on-surface border border-border-rule'
                          }`}
                        >
                          {timeOnly}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="font-inter text-[9px] uppercase font-bold text-primary-container bg-paper-tint px-1 py-0.2 border border-border-rule">
                            {article.category || 'राष्ट्रीय'}
                          </span>
                          <span className="font-inter text-[11px] text-secondary">
                            {fullIst}
                          </span>
                        </div>
                        <h5
                          onClick={() => onPreview && onPreview(article)}
                          className="font-mukta text-sm sm:text-base font-bold text-on-surface hover:text-primary-container transition-colors cursor-pointer line-clamp-1"
                        >
                          {article.title}
                        </h5>
                      </div>
                    </div>

                    {/* Right: Quick Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => onPreview && onPreview(article)}
                        className="p-1 text-secondary hover:text-on-surface"
                        title="पूर्वावलोकन"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit && onEdit(article)}
                        className="p-1 text-secondary hover:text-on-surface"
                        title="संपादित करें"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onReschedule && onReschedule(article)}
                        className="px-2 py-0.5 bg-paper-tint hover:bg-paper-subtle border border-border-rule font-mukta text-xs font-bold"
                      >
                        समय बदलें
                      </button>
                      <button
                        type="button"
                        onClick={() => onReturnToDraft && onReturnToDraft(article)}
                        className="p-1 text-secondary hover:text-amber-700"
                        title="ड्राफ्ट में भेजें"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onPublishNow && onPublishNow(article)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary-container hover:bg-primary text-white font-mukta text-xs font-bold shadow-2xs"
                        title="अभी प्रकाशित करें"
                      >
                        <Rocket className="w-3 h-3" />
                        <span>प्रकाशित</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

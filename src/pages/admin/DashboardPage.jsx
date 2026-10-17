import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  StatCard,
  RecentArticlesTable,
  ScheduledNewsOverview,
  QuickActions,
  PublishingActivity,
} from '../../components/admin';
import { useArticles } from '../../context/ArticleContext';
import { normalizeStatus, ARTICLE_STATUS } from '../../utils/articleStatus';
import {
  Newspaper,
  PenSquare,
  Clock,
  Eye,
  FileText,
  AlertCircle,
  Flame,
  Radio,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const { articles } = useArticles();

  // Dynamically calculate metrics from the shared article store
  const stats = useMemo(() => {
    const total = articles.length;
    const published = articles.filter((a) => normalizeStatus(a.status) === ARTICLE_STATUS.PUBLISHED).length;
    const scheduled = articles.filter((a) => normalizeStatus(a.status) === ARTICLE_STATUS.SCHEDULED).length;
    const review = articles.filter((a) => normalizeStatus(a.status) === ARTICLE_STATUS.IN_REVIEW).length;
    const draft = articles.filter((a) => normalizeStatus(a.status) === ARTICLE_STATUS.DRAFT).length;
    const breaking = articles.filter((a) => a.isBreaking).length;

    // Total pageviews across articles
    const totalViews = articles.reduce((acc, curr) => acc + (curr.views || 0), 0);

    return {
      total,
      published,
      scheduled,
      review,
      draft,
      breaking,
      totalViews,
    };
  }, [articles]);

  // Filter scheduled articles for the upcoming queue
  const scheduledArticles = useMemo(() => {
    return articles.filter((a) => normalizeStatus(a.status) === ARTICLE_STATUS.SCHEDULED);
  }, [articles]);

  return (
    <div className="space-y-6">
      {/* SECTION A: WELCOME & CONTROL ROOM COMMAND BAR */}
      <section className="bg-paper-canvas p-4 sm:p-6 border border-border-rule shadow-2xs">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-live-pulse rounded-full animate-ping" />
              <h1 className="font-mukta text-xl sm:text-2xl lg:text-3xl font-extrabold text-on-surface leading-tight">
                संपादकीय नियंत्रण कक्ष <span className="text-secondary text-sm sm:text-base font-normal font-inter">(Newsroom Command Center)</span>
              </h1>
            </div>

            <p className="font-inter text-xs text-secondary mt-1 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-on-surface">आज की मुख्य पाली (06:00 - 14:00 IST)</span>
              <span>•</span>
              <span>इंचार्ज: राजेश कुमार (वरिष्ठ संपादक)</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-breaking-crimson font-semibold">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>लाइव डेस्क सक्रियता: 98.4%</span>
              </span>
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/admin/news/create"
              className="px-4 py-2 bg-primary-container hover:bg-primary text-white font-mukta font-bold text-sm transition-colors flex items-center gap-2 shadow-sm"
            >
              <PenSquare className="w-4 h-4" />
              <span>नया समाचार लिखें (Write Article)</span>
            </Link>

            <Link
              to="/admin/news"
              className="px-3.5 py-2 bg-paper-tint hover:bg-paper-subtle text-on-surface border border-border-rule font-mukta font-bold text-sm transition-colors"
            >
              <span>समाचार सूची (All News)</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION B: STATISTICS CARDS (Dynamically calculated from mockNews) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Total Articles */}
        <StatCard
          titleHindi="कुल समाचार"
          titleEnglish="Total"
          value={stats.total}
          subtitle="संग्रह में उपलब्ध"
          icon={Newspaper}
          accentColor="primary"
          progressBar={{
            label: 'प्रकाशन दर',
            value: `${Math.round((stats.published / stats.total) * 100)}%`,
            percentage: Math.round((stats.published / stats.total) * 100),
          }}
        />

        {/* Card 2: Published / Live */}
        <StatCard
          titleHindi="प्रकाशित समाचार"
          titleEnglish="Published"
          value={stats.published}
          subtitle="लाइव पोर्टल पर सक्रिय"
          badgeText="लाइव"
          icon={Eye}
          accentColor="crimson"
        />

        {/* Card 3: Scheduled Queue */}
        <StatCard
          titleHindi="शेड्यूल्ड समाचार"
          titleEnglish="Scheduled"
          value={stats.scheduled}
          subtitle="आगामी 24 घंटे की कतार"
          badgeText="प्राइम टाइम"
          icon={Clock}
          accentColor="amber"
        />

        {/* Card 4: Review & Drafts */}
        <StatCard
          titleHindi="समीक्षा एवं ड्राफ्ट"
          titleEnglish="Review / Draft"
          value={stats.review + stats.draft}
          subtitle={`${stats.review} समीक्षाधीन • ${stats.draft} ड्राफ्ट`}
          icon={FileText}
          accentColor="blue"
        />

        {/* Card 5: Breaking Alerts */}
        <StatCard
          titleHindi="ब्रेकिंग बुलेटिन"
          titleEnglish="Breaking"
          value={stats.breaking}
          subtitle="टिकर एवं अलर्ट बार पर"
          icon={Flame}
          accentColor="crimson"
        />
      </section>

      {/* SECTION C & RIGHT ASIDE: TWO-COLUMN BROADSHEET EDITORIAL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Recent Articles Table */}
        <div className="lg:col-span-8 space-y-6">
          <RecentArticlesTable
            articles={articles}
            title="हाल ही में प्रकाशित एवं संशोधित समाचार (Recent News)"
            limit={6}
          />
        </div>

        {/* Right 4 Columns: Quick Actions, Scheduled Queue, Activity */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions */}
          <QuickActions />

          {/* Scheduled Overview */}
          <ScheduledNewsOverview scheduledArticles={scheduledArticles} />

          {/* Publishing Activity Log */}
          <PublishingActivity />
        </div>
      </div>
    </div>
  );
}

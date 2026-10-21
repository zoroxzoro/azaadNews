import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  StatCard,
  RecentArticlesTable,
  ScheduledNewsOverview,
  QuickActions,
  PublishingActivity,
} from '../../components/admin';
import { useArticles } from '../../context/ArticleContext';
import { articlesService } from '../../services/articlesService';
import { normalizeStatus, ARTICLE_STATUS } from '../../utils/articleStatus';
import { useAuth } from '../../context/AuthContext';
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
  Image as ImageIcon,
  User,
} from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, isSuperAdmin } = useAuth();
  const { articles } = useArticles();
  const [dbCounts, setDbCounts] = useState(null);
  const [recentArticles, setRecentArticles] = useState([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  // Ordinary admin filters by their user ID; Super admin views global counts
  const effectiveAuthorId = isSuperAdmin ? null : currentUser?.id;

  useEffect(() => {
    let isMounted = true;
    articlesService.getArticleCounts(effectiveAuthorId).then((counts) => {
      if (isMounted && counts) {
        setDbCounts(counts);
      }
    }).catch((err) => {
      console.warn('[DashboardPage] getArticleCounts error:', err);
    });

    articlesService.getRecentArticles(8, effectiveAuthorId).then((recent) => {
      if (isMounted && Array.isArray(recent) && recent.length > 0) {
        setRecentArticles(recent);
      }
    }).catch((err) => {
      console.warn('[DashboardPage] getRecentArticles error:', err);
    }).finally(() => {
      if (isMounted) setIsLoadingRecent(false);
    });

    return () => {
      isMounted = false;
    };
  }, [effectiveAuthorId]);

  // Dynamically calculate metrics from real database counts or fallback to article store
  const stats = useMemo(() => {
    if (dbCounts && dbCounts.total >= 0) {
      return {
        total: dbCounts.total,
        published: dbCounts.published,
        scheduled: dbCounts.scheduled,
        review: dbCounts.inReview,
        draft: dbCounts.draft,
        breaking: dbCounts.breaking,
        media: dbCounts.media || 0,
        totalViews: dbCounts.totalViews || 0,
      };
    }

    const scopedArticles = effectiveAuthorId
      ? articles.filter((a) => a.authorId === effectiveAuthorId || a.author?.id === effectiveAuthorId)
      : articles;

    const total = scopedArticles.length;
    const published = scopedArticles.filter((a) => normalizeStatus(a.status) === ARTICLE_STATUS.PUBLISHED).length;
    const scheduled = scopedArticles.filter((a) => normalizeStatus(a.status) === ARTICLE_STATUS.SCHEDULED).length;
    const review = scopedArticles.filter((a) => normalizeStatus(a.status) === ARTICLE_STATUS.IN_REVIEW).length;
    const draft = scopedArticles.filter((a) => normalizeStatus(a.status) === ARTICLE_STATUS.DRAFT).length;
    const breaking = scopedArticles.filter((a) => a.isBreaking).length;
    const totalViews = scopedArticles.reduce((acc, curr) => acc + (curr.views || 0), 0);

    return {
      total,
      published,
      scheduled,
      review,
      draft,
      breaking,
      media: 0,
      totalViews,
    };
  }, [dbCounts, articles, effectiveAuthorId]);

  // Filter scheduled articles for the upcoming queue
  const scheduledArticles = useMemo(() => {
    return (effectiveAuthorId
      ? articles.filter((a) => (a.authorId === effectiveAuthorId || a.author?.id === effectiveAuthorId))
      : articles
    ).filter((a) => normalizeStatus(a.status) === ARTICLE_STATUS.SCHEDULED);
  }, [articles, effectiveAuthorId]);

  return (
    <div className="space-y-6">
      {/* SECTION A: WELCOME & CONTROL ROOM COMMAND BAR */}
      <section className="bg-paper-canvas p-4 sm:p-6 border border-border-rule shadow-2xs">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-live-pulse rounded-full animate-ping" />
              <h1 className="font-mukta text-xl sm:text-2xl lg:text-3xl font-extrabold text-on-surface leading-tight">
                {isSuperAdmin
                  ? 'संपादकीय नियंत्रण कक्ष'
                  : 'मेरा संपादकीय डेस्क'}
                <span className="text-secondary text-sm sm:text-base font-normal font-inter ml-2">
                  {isSuperAdmin ? '(Global Newsroom Command)' : `(My Desk - ${currentUser?.name || 'एडमिन'})`}
                </span>
              </h1>
            </div>

            <p className="font-inter text-xs text-secondary mt-1 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-on-surface">
                {isSuperAdmin ? 'सर्वोच्च संपादकीय व्यवस्थापन' : 'व्यक्तिगत लेखक डैशबोर्ड (Admin Desk)'}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>सिस्टम स्थिति: सक्रिय (PostgreSQL Online)</span>
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
              <span>{isSuperAdmin ? 'सभी समाचार (All News)' : 'मेरे समाचार (My Articles)'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION B: STATISTICS CARDS (Dynamically calculated based on role) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Total Articles */}
        <StatCard
          titleHindi={isSuperAdmin ? 'कुल समाचार' : 'मेरे कुल समाचार'}
          titleEnglish={isSuperAdmin ? 'Total News' : 'My Articles'}
          value={stats.total}
          subtitle={isSuperAdmin ? 'संग्रह में उपलब्ध' : 'आपके द्वारा रचित'}
          icon={Newspaper}
          accentColor="primary"
          progressBar={{
            label: 'प्रकाशन दर',
            value: `${Math.round((stats.published / (stats.total || 1)) * 100)}%`,
            percentage: Math.round((stats.published / (stats.total || 1)) * 100),
          }}
        />

        {/* Card 2: Published / Live */}
        <StatCard
          titleHindi={isSuperAdmin ? 'प्रकाशित समाचार' : 'मेरे प्रकाशित समाचार'}
          titleEnglish={isSuperAdmin ? 'Published' : 'My Published'}
          value={stats.published}
          subtitle="लाइव पोर्टल पर सक्रिय"
          badgeText="लाइव"
          icon={Eye}
          accentColor="crimson"
        />

        {/* Card 3: Drafts */}
        <StatCard
          titleHindi={isSuperAdmin ? 'डिजिटल मीडिया' : 'मेरे ड्राफ्ट'}
          titleEnglish={isSuperAdmin ? 'Media Assets' : 'My Drafts'}
          value={isSuperAdmin ? stats.media : stats.draft}
          subtitle={isSuperAdmin ? 'संग्रहित छायाचित्र' : 'अप्रकाशित आलेख'}
          badgeText={isSuperAdmin ? 'DAM' : 'ड्राफ्ट'}
          icon={isSuperAdmin ? ImageIcon : FileText}
          accentColor="blue"
        />

        {/* Card 4: Scheduled Queue */}
        <StatCard
          titleHindi={isSuperAdmin ? 'शेड्यूल्ड समाचार' : 'मेरे शेड्यूल्ड समाचार'}
          titleEnglish={isSuperAdmin ? 'Scheduled' : 'My Scheduled'}
          value={stats.scheduled}
          subtitle="आगामी कतार"
          badgeText="कतार"
          icon={Clock}
          accentColor="amber"
        />

        {/* Card 5: Review & In-progress */}
        <StatCard
          titleHindi={isSuperAdmin ? 'समीक्षा एवं ड्राफ्ट' : 'मेरे समीक्षाधीन'}
          titleEnglish={isSuperAdmin ? 'Review / Draft' : 'In Review'}
          value={isSuperAdmin ? (stats.review + stats.draft) : stats.review}
          subtitle={isSuperAdmin ? `${stats.review} समीक्षाधीन • ${stats.draft} ड्राफ्ट` : 'संपादकीय समीक्षाधीन'}
          icon={FileText}
          accentColor="blue"
        />

        {/* Card 6: Breaking or Media */}
        <StatCard
          titleHindi={isSuperAdmin ? 'ब्रेकिंग बुलेटिन' : 'डिजिटल मीडिया'}
          titleEnglish={isSuperAdmin ? 'Breaking' : 'Media Library'}
          value={isSuperAdmin ? stats.breaking : stats.media}
          subtitle={isSuperAdmin ? 'टिकर एवं अलर्ट बार पर' : 'मीडिया लाइब्रेरी'}
          icon={isSuperAdmin ? Flame : ImageIcon}
          accentColor={isSuperAdmin ? 'crimson' : 'primary'}
        />
      </section>

      {/* SECTION C & RIGHT ASIDE: TWO-COLUMN BROADSHEET EDITORIAL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Recent Articles Table */}
        <div className="lg:col-span-8 space-y-6">
          <RecentArticlesTable
            articles={recentArticles.length > 0 ? recentArticles : articles}
            title={isSuperAdmin ? 'हाल ही में प्रकाशित एवं संशोधित समाचार (Recent News)' : 'मेरे हालिया समाचार (My Recent Articles)'}
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

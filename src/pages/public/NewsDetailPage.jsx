import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Container from '../../components/common/Container';
import ErrorState from '../../components/common/ErrorState';
import {
  ReadingProgress,
  ArticleHeader,
  ArticleHeroImage,
  ArticleShareBar,
  ArticleBody,
  ArticleTags,
  ArticleSidebar,
  ArticleNavigation,
  RelatedNews,
} from '../../components/news';
import SEO from '../../components/common/SEO.jsx';
import { useArticles } from '../../context/ArticleContext';
import { articlesService } from '../../services/articlesService';
import { normalizeStatus, ARTICLE_STATUS } from '../../utils/articleStatus';
import { getTrendingNews, mockNews } from '../../data/mockNews';
import { ArrowLeft, Home, RefreshCw } from 'lucide-react';

/**
 * Broadsheet Article Loading Skeleton
 */
function ArticleDetailSkeleton() {
  return (
    <Container className="py-6 px-3 sm:px-4 lg:px-6 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-48 bg-surface-container mb-4"></div>
      
      {/* Category badge skeleton */}
      <div className="h-6 w-24 bg-surface-container mb-3"></div>
      
      {/* Headline skeleton */}
      <div className="h-9 w-5/6 bg-surface-container mb-2"></div>
      <div className="h-9 w-3/4 bg-surface-container mb-4"></div>
      
      {/* Byline & metadata skeleton */}
      <div className="h-12 w-full bg-paper-tint border-y border-border-rule my-4 flex items-center px-4 gap-4">
        <div className="w-8 h-8 rounded-full bg-surface-container shrink-0"></div>
        <div className="h-4 w-32 bg-surface-container"></div>
        <div className="h-4 w-24 bg-surface-container ml-auto"></div>
      </div>

      {/* Hero Image skeleton */}
      <div className="aspect-[16/9] w-full bg-surface-container mb-6"></div>

      {/* Grid: 8 col body + 4 col sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-4">
          <div className="h-4 w-full bg-surface-container"></div>
          <div className="h-4 w-full bg-surface-container"></div>
          <div className="h-4 w-11/12 bg-surface-container"></div>
          <div className="h-4 w-full bg-surface-container"></div>
          <div className="h-4 w-4/5 bg-surface-container"></div>
          <div className="h-28 w-full bg-paper-tint border-l-4 border-surface-container my-6"></div>
          <div className="h-4 w-full bg-surface-container"></div>
          <div className="h-4 w-5/6 bg-surface-container"></div>
        </div>
        <div className="lg:col-span-4 space-y-4">
          <div className="h-48 w-full bg-paper-tint border border-border-rule"></div>
          <div className="h-64 w-full bg-paper-tint border border-border-rule"></div>
        </div>
      </div>
    </Container>
  );
}

/**
 * NewsDetailPage Component
 * Complete production-quality article reading experience following Stitch broadsheet designs.
 * Fetches real Supabase articles directly by slug.
 * Displays loading skeleton during query — NEVER flashes 404 before query finishes.
 * Enforces strict public visibility: drafts, scheduled, and unapproved articles yield genuine 404.
 */
export default function NewsDetailPage() {
  const { slug } = useParams();
  const { getPublishedArticles } = useArticles();

  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [networkError, setNetworkError] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [adjacentArticles, setAdjacentArticles] = useState({ prev: null, next: null });

  // Typography scale state: -1 (compact), 0 (normal), 1 (large), 2 (extra-large)
  const [fontSizeLevel, setFontSizeLevel] = useState(0);

  // Scroll to top whenever the slug changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [slug]);

  const loadArticle = async () => {
    setIsLoading(true);
    setIsNotFound(false);
    setNetworkError(null);

    try {
      const res = await articlesService.getArticleBySlug(slug);

      if (res?.error) {
        setNetworkError(res.error);
        setIsLoading(false);
        return;
      }

      const found = res?.data !== undefined ? res.data : res;
      if (found && found.id && normalizeStatus(found.status) === ARTICLE_STATUS.PUBLISHED) {
        setArticle(found);
        setIsNotFound(false);

        // Fetch real related and adjacent articles from Supabase in background
        articlesService.getRelatedArticles(found, 4).then((rel) => {
          if (Array.isArray(rel) && rel.length > 0) {
            setRelatedArticles(rel);
          }
        }).catch(() => {});

        articlesService.getAdjacentArticles(found).then((adj) => {
          if (adj) {
            setAdjacentArticles(adj);
          }
        }).catch(() => {});
      } else {
        setArticle(null);
        setIsNotFound(true);
      }
    } catch (err) {
      console.warn('[NewsDetailPage] Error loading article:', err);
      setNetworkError(err.message || 'नेटवर्क त्रुटि');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArticle();
  }, [slug]);

  // 1. Loading State: Render High-Fidelity Broadsheet Skeleton (Never 404)
  if (isLoading) {
    return <ArticleDetailSkeleton />;
  }

  // 2. Network Failure State: Render retry UI with noIndex={false}
  if (networkError && !article) {
    return (
      <Container className="py-16 px-4">
        <ErrorState
          title="समाचार लोड करने में त्रुटि"
          message={`सर्वर से संपर्क करने में समस्या आई: ${networkError}। कृपया पुनः प्रयास करें।`}
          onRetry={loadArticle}
        />
      </Container>
    );
  }

  // 3. Genuine 404 State: Confirmed by Supabase that article does not exist
  if (isNotFound || !article) {
    return (
      <Container className="py-16 px-4">
        <SEO title="समाचार नहीं मिला (Article Not Found)" noIndex={true} />
        <div className="max-w-2xl mx-auto bg-paper-canvas border border-border-rule p-8 text-center shadow-sm">
          <span className="w-16 h-16 rounded-full bg-ticker-tint text-primary-container inline-flex items-center justify-center font-mukta text-3xl font-extrabold mb-4">
            ४०४
          </span>
          <h1 className="font-mukta text-2xl sm:text-3xl font-bold text-on-surface mb-2">
            समाचार नहीं मिला (Article Not Found)
          </h1>
          <p className="font-inter text-sm text-secondary mb-6 leading-relaxed">
            आपके द्वारा खोजा गया आलेख <code className="bg-paper-tint px-2 py-0.5 border border-border-rule font-mono text-xs text-primary-container">/news/{slug}</code> उपलब्ध नहीं है या इसे स्थानांतरित कर दिया गया है।
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container text-white font-inter text-xs font-bold uppercase tracking-wider hover:bg-primary transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>होमपेज पर जाएं</span>
            </Link>
            <Link
              to="/category/latest"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-paper-tint border border-border-heavy text-on-surface font-inter text-xs font-bold uppercase tracking-wider hover:bg-surface-container transition-colors"
            >
              <span>ताज़ा खबरें देखें</span>
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  // 4. Article Found: Render complete Stitch broadsheet reading experience
  const publishedArticles = getPublishedArticles();
  const liveTrending = publishedArticles.filter((a) => a.isTrending);
  const trendingArticles =
    liveTrending.length > 0
      ? liveTrending.slice(0, 5)
      : publishedArticles.length > 0
      ? publishedArticles.slice(0, 5)
      : getTrendingNews(5);

  const fontClasses = {
    '-1': 'text-sm sm:text-base leading-[1.8] sm:leading-[1.85]',
    '0': 'text-base sm:text-[17px] leading-[1.85] sm:leading-[1.95]',
    '1': 'text-lg sm:text-xl leading-[1.9] sm:leading-[2.0]',
    '2': 'text-xl sm:text-2xl leading-[2.0] sm:leading-[2.1]',
  };

  const badgeText = article.isBreaking
    ? 'ब्रेकिंग न्यूज़'
    : article.isFeatured
    ? 'विशेष रिपोर्ट'
    : null;

  return (
    <div className="w-full bg-paper-canvas min-h-screen">
      {/* Centralized SEO & NewsArticle Structured Data */}
      <SEO
        title={article.title}
        description={article.summary}
        article={article}
        path={`news/${article.slug}`}
        type="article"
      />

      {/* 1. Subtle Reading Progress Bar at the top of the viewport */}
      <ReadingProgress targetId="article-root" />

      <Container className="py-4 px-3 sm:px-4 lg:px-6">
        {/* 2. Article Header (Breadcrumb, H1 Headline, Summary, Author, Audio bar) */}
        <ArticleHeader article={article} />

        {/* 3. Featured Hero Media with Photographer/Source Credit */}
        <ArticleHeroImage
          src={article.featuredImage}
          alt={article.title}
          caption={article.imageCaption}
          credit={article.imageCredit}
          badgeText={badgeText}
          className="mb-4"
        />

        {/* 4. Action & Typography Control Bar (Sticky) */}
        <ArticleShareBar
          article={article}
          title={article.title}
          slug={article.slug}
          fontSizeLevel={fontSizeLevel}
          setFontSizeLevel={setFontSizeLevel}
          className="mb-6"
        />

        {/* 5. Main 12-Column Grid: 8-col Reading Well + 4-col Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT READING WELL (8 Columns on desktop, full width on mobile) */}
          <article className="lg:col-span-8 flex flex-col">
            <ArticleBody
              article={article}
              fontSizeClass={fontClasses[fontSizeLevel] || fontClasses['0']}
            />

            {/* Semantic Tag Cloud */}
            <ArticleTags tags={article.tags} />

            {/* Previous & Next Article Navigation */}
            <ArticleNavigation
              prevArticle={adjacentArticles.prev}
              nextArticle={adjacentArticles.next}
            />
          </article>

          {/* RIGHT SIDEBAR (4 Columns on desktop, moved below on mobile) */}
          <div className="lg:col-span-4 w-full">
            <ArticleSidebar trendingArticles={trendingArticles} />
          </div>
        </div>

        {/* 6. Bottom Full-Width Strip: Related Stories (4 Cards Grid) */}
        <RelatedNews
          currentArticle={article}
          allArticles={relatedArticles.length > 0 ? relatedArticles : publishedArticles}
        />
      </Container>
    </div>
  );
}

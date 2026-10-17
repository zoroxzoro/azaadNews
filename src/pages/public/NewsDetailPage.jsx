import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Container from '../../components/common/Container';
import EmptyState from '../../components/common/EmptyState';
import {
  ReadingProgress,
  ArticleHeader,
  ArticleHeroImage,
  ArticleShareBar,
  ArticleBody,
  ArticleTags,
  ArticleSidebar,
  RelatedNews,
} from '../../components/news';
import { getArticleBySlug, getTrendingNews, mockNews } from '../../data/mockNews';
import { ChevronLeft, ArrowLeft, Search } from 'lucide-react';

/**
 * NewsDetailPage Component
 * Complete production-quality article reading experience following Stitch broadsheet designs.
 */
export default function NewsDetailPage() {
  const { slug } = useParams();
  const article = getArticleBySlug(slug);

  // Typography scale state: -1 (compact), 0 (normal), 1 (large), 2 (extra-large)
  const [fontSizeLevel, setFontSizeLevel] = useState(0);

  // Scroll to top whenever the slug / article changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [slug]);

  // Dynamic Document Title and SEO Metadata
  useEffect(() => {
    if (article) {
      document.title = `${article.title} - आज़ाद समाचार`;

      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = article.summary || article.title;
    } else {
      document.title = 'समाचार नहीं मिला - आज़ाद समाचार';
    }

    return () => {
      document.title = 'आज़ाद समाचार (Azaad Samachar) • निष्पक्ष • निर्भीक • डिजिटल न्यूज़ पोर्टल';
    };
  }, [article]);

  // If article not found for the given slug
  if (!article) {
    return (
      <Container className="py-16 px-4">
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

  const trendingArticles = getTrendingNews(5);

  const fontClasses = {
    '-1': 'text-sm sm:text-base leading-relaxed',
    '0': 'text-base sm:text-lg leading-relaxed',
    '1': 'text-lg sm:text-xl leading-relaxed',
    '2': 'text-xl sm:text-2xl leading-relaxed',
  };

  // Structured JSON-LD Schema (NewsArticle)
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary,
    image: [article.featuredImage],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: [
      {
        '@type': 'Person',
        name: article.author?.name || 'आज़ाद समाचार डेस्क',
        jobTitle: article.author?.role || 'वरिष्ठ संपादक',
      },
    ],
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'आज़ाद समाचार (Azaad Samachar)',
      url: 'https://azaadsamachar.in',
    },
  };

  return (
    <div className="w-full bg-paper-canvas min-h-screen">
      {/* 1. Subtle Reading Progress Bar at the top of the viewport */}
      <ReadingProgress targetId="article-root" />

      {/* Structured Data Script for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <Container className="py-4 px-3 sm:px-4 lg:px-6">
        {/* 2. Article Header (Breadcrumb, H1 Headline, Summary, Author, Audio bar) */}
        <ArticleHeader article={article} />

        {/* 3. Featured Hero Media with Photographer/Source Credit */}
        <ArticleHeroImage
          src={article.featuredImage}
          alt={article.title}
          caption={article.imageCaption}
          credit="पीटीआई / आज़ाद समाचार ब्यूरो"
          badgeText="विशेष सत्र कवरेज"
          className="mb-4"
        />

        {/* 4. Action & Typography Control Bar (Sticky) */}
        <ArticleShareBar
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
          </article>

          {/* RIGHT SIDEBAR (4 Columns on desktop, moved below on mobile) */}
          <div className="lg:col-span-4 w-full">
            <ArticleSidebar trendingArticles={trendingArticles} />
          </div>
        </div>

        {/* 6. Bottom Full-Width Strip: Related Stories (4 Cards Grid) */}
        <RelatedNews currentArticle={article} allArticles={mockNews} />
      </Container>
    </div>
  );
}

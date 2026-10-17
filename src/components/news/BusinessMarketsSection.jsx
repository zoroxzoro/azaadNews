import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import NewsCard from './NewsCard';

const MARKET_INDICES = [
  { name: 'सेंसेक्स (BSE)', value: '75,190.45', change: '+480.20', percent: '+0.64%', isUp: true },
  { name: 'निफ्टी 50 (NSE)', value: '22,810.15', change: '+145.30', percent: '+0.64%', isUp: true },
  { name: 'सोना (10 ग्राम)', value: '₹71,850', change: '-210.00', percent: '-0.29%', isUp: false },
  { name: 'USD / INR', value: '₹83.42', change: '+0.04', percent: '+0.05%', isUp: true },
];

/**
 * BusinessMarketsSection component
 * Features live financial tickers + business news package
 */
export default function BusinessMarketsSection({ articles = [], className = '' }) {
  const featuredArticle = articles[0];
  const listArticles = articles.slice(1, 4);

  return (
    <section className={`bg-paper-canvas p-3 sm:p-5 border-t-2 border-border-heavy flex flex-col gap-4 shadow-xs ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-rule pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#0d7377] inline-block"></span>
          <h3 className="font-mukta text-lg sm:text-xl font-bold text-on-surface">
            बिज़नेस व अर्थव्यवस्था
          </h3>
        </div>
        <Link
          to="/category/business"
          className="text-primary-container font-inter text-xs font-bold hover:underline flex items-center gap-0.5"
        >
          <span>सभी बिज़नेस खबरें</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Live Financial Market Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-paper-tint p-2.5 border border-border-rule font-inter text-xs">
        {MARKET_INDICES.map((item, idx) => (
          <div key={idx} className="flex flex-col p-1.5 bg-paper-canvas border border-border-rule/60">
            <span className="text-[10px] text-secondary font-medium">{item.name}</span>
            <span className="font-bold text-on-surface text-xs sm:text-sm mt-0.5">{item.value}</span>
            <div className={`flex items-center gap-1 text-[10px] font-bold ${item.isUp ? 'text-emerald-600' : 'text-red-600'}`}>
              {item.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{item.change} ({item.percent})</span>
            </div>
          </div>
        ))}
      </div>

      {/* Featured Business Story (Horizontal Card) */}
      {featuredArticle && (
        <NewsCard
          article={featuredArticle}
          variant="horizontal"
          showSummary={true}
        />
      )}

      {/* 3 Horizontal Sub-Stories */}
      <div className="flex flex-col divide-y divide-border-rule">
        {listArticles.map((story) => (
          <article key={story.id} className="py-2.5 flex items-center justify-between gap-3 group">
            <div className="flex flex-col">
              <span className="font-inter text-[10px] text-primary-container font-bold uppercase">
                {story.category}
              </span>
              <Link
                to={`/news/${story.slug}`}
                className="font-mukta text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary-container transition-colors leading-snug"
              >
                {story.title}
              </Link>
              <span className="font-inter text-[10px] text-secondary mt-1">
                {story.author?.name} • {story.readTime || '3 मिनट'}
              </span>
            </div>
            {story.featuredImage && (
              <div className="w-16 sm:w-20 h-14 bg-surface-container shrink-0 overflow-hidden">
                <img
                  src={story.featuredImage}
                  alt={story.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

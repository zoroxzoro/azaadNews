import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import {
  Edit3,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export default function RecentArticlesTable({
  articles = [],
  title = 'हाल ही में प्रकाशित एवं संशोधित समाचार',
  showFilters = true,
  limit = 6,
}) {
  const [activeStatusTab, setActiveStatusTab] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Status Counts
  const counts = useMemo(() => {
    return {
      all: articles.length,
      published: articles.filter((a) => (a.status || 'published') === 'published').length,
      scheduled: articles.filter((a) => a.status === 'scheduled').length,
      review: articles.filter((a) => a.status === 'review').length,
      draft: articles.filter((a) => a.status === 'draft').length,
    };
  }, [articles]);

  // Filtered Articles
  const filteredArticles = useMemo(() => {
    return articles.filter((item) => {
      // Status filter
      if (activeStatusTab !== 'all') {
        const itemStatus = item.status || 'published';
        if (itemStatus !== activeStatusTab) return false;
      }

      // Search filter
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(query);
        const authorMatch = item.author?.name?.toLowerCase().includes(query);
        const catMatch = item.category?.toLowerCase().includes(query);
        if (!titleMatch && !authorMatch && !catMatch) return false;
      }

      return true;
    });
  }, [articles, activeStatusTab, searchFilter]);

  const displayedArticles = limit ? filteredArticles.slice(0, limit) : filteredArticles;

  return (
    <div className="bg-paper-canvas border border-border-rule shadow-2xs overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-3 sm:p-4 border-b border-border-rule flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-primary-container inline-block" />
          <h2 className="font-mukta text-base sm:text-lg font-bold text-on-surface">
            {title}
          </h2>
          <span className="text-[11px] font-inter text-secondary">
            ({filteredArticles.length} आलेख)
          </span>
        </div>

        <Link
          to="/admin/news"
          className="font-inter text-xs font-bold text-primary-container hover:underline inline-flex items-center gap-1 self-start md:self-auto"
        >
          <span>सभी समाचार देखें (View All)</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter Tabs & Quick Search */}
      {showFilters && (
        <div className="p-3 bg-paper-tint border-b border-border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-inter">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setActiveStatusTab('all')}
              className={`px-2.5 py-1 text-xs font-mukta font-bold cursor-pointer rounded transition-colors ${
                activeStatusTab === 'all'
                  ? 'bg-primary-container text-white'
                  : 'bg-paper-canvas text-secondary hover:text-on-surface border border-border-rule'
              }`}
            >
              सभी ({counts.all})
            </button>
            <button
              onClick={() => setActiveStatusTab('published')}
              className={`px-2.5 py-1 text-xs font-mukta font-bold cursor-pointer rounded transition-colors ${
                activeStatusTab === 'published'
                  ? 'bg-primary-container text-white'
                  : 'bg-paper-canvas text-secondary hover:text-on-surface border border-border-rule'
              }`}
            >
              प्रकाशित ({counts.published})
            </button>
            <button
              onClick={() => setActiveStatusTab('scheduled')}
              className={`px-2.5 py-1 text-xs font-mukta font-bold cursor-pointer rounded transition-colors ${
                activeStatusTab === 'scheduled'
                  ? 'bg-primary-container text-white'
                  : 'bg-paper-canvas text-secondary hover:text-on-surface border border-border-rule'
              }`}
            >
              शेड्यूल्ड ({counts.scheduled})
            </button>
            <button
              onClick={() => setActiveStatusTab('review')}
              className={`px-2.5 py-1 text-xs font-mukta font-bold cursor-pointer rounded transition-colors ${
                activeStatusTab === 'review'
                  ? 'bg-primary-container text-white'
                  : 'bg-paper-canvas text-secondary hover:text-on-surface border border-border-rule'
              }`}
            >
              समीक्षाधीन ({counts.review})
            </button>
            <button
              onClick={() => setActiveStatusTab('draft')}
              className={`px-2.5 py-1 text-xs font-mukta font-bold cursor-pointer rounded transition-colors ${
                activeStatusTab === 'draft'
                  ? 'bg-primary-container text-white'
                  : 'bg-paper-canvas text-secondary hover:text-on-surface border border-border-rule'
              }`}
            >
              ड्राफ्ट ({counts.draft})
            </button>
          </div>

          {/* Search Field */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="शीर्षक या लेखक से छानें..."
              className="w-full pl-8 pr-3 py-1 bg-paper-canvas border border-border-rule text-xs font-inter focus:outline-none focus:border-primary-container"
            />
          </div>
        </div>
      )}

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-inter text-xs min-w-[650px] border-collapse">
          <thead className="bg-paper-tint border-b border-border-rule text-secondary uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="py-2.5 px-3 w-14">मीडिया</th>
              <th className="py-2.5 px-3">समाचार शीर्षक एवं स्लग</th>
              <th className="py-2.5 px-3 w-32">लेखक / ब्यूरो</th>
              <th className="py-2.5 px-3 w-32">स्थिति (Status)</th>
              <th className="py-2.5 px-3 w-24 text-right">रीडरशिप</th>
              <th className="py-2.5 px-3 sm:px-4 w-24 text-center">कार्रवाई</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-rule/80">
            {displayedArticles.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-secondary font-mukta text-sm">
                  कोई समाचार मेल नहीं खाता।
                </td>
              </tr>
            ) : (
              displayedArticles.map((item) => (
                <tr key={item.id} className="hover:bg-paper-tint/70 transition-colors">
                  {/* Thumbnail */}
                  <td className="py-2.5 px-3 align-middle">
                    <div className="w-12 h-9 bg-surface-container overflow-hidden shrink-0 border border-border-rule">
                      <img
                        src={item.featuredImage}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>

                  {/* Title & Slug */}
                  <td className="py-2.5 px-3 align-middle">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="px-1.5 py-0.2 bg-paper-subtle text-[9px] font-bold uppercase tracking-wider text-secondary border border-border-rule">
                        {item.categoryNameHindi || item.category}
                      </span>
                      <span className="font-mono text-[10px] text-secondary">
                        ID: #{item.id}
                      </span>
                    </div>
                    <Link
                      to={`/admin/news/edit/${item.id}`}
                      className="font-mukta text-sm font-bold text-on-surface hover:text-primary-container line-clamp-1 leading-snug transition-colors"
                    >
                      {item.title}
                    </Link>
                  </td>

                  {/* Author / Bureau */}
                  <td className="py-2.5 px-3 align-middle">
                    <span className="font-bold text-on-surface block truncate">
                      {item.author?.name || 'आज़ाद ब्यूरो'}
                    </span>
                    <span className="text-[10px] text-secondary block truncate">
                      {item.author?.location || 'नई दिल्ली'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3 align-middle">
                    <StatusBadge status={item.status || 'published'} />
                  </td>

                  {/* Readership / Views */}
                  <td className="py-2.5 px-3 align-middle text-right font-mono text-[11px] text-on-surface">
                    {item.views ? `${item.views.toLocaleString('hi-IN')}` : '—'}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-2.5 px-3 sm:px-4 align-middle text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        to={`/admin/news/edit/${item.id}`}
                        className="p-1 hover:bg-paper-subtle text-secondary hover:text-primary-container rounded transition-colors"
                        title="एडिट करें (Edit)"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        to={`/news/${item.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 hover:bg-paper-subtle text-secondary hover:text-on-surface rounded transition-colors"
                        title="लाइव पोर्टल पर देखें (View on Public Site)"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

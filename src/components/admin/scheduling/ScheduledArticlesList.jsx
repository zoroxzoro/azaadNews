import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  RotateCcw,
  Rocket,
  Edit,
  Eye,
  ChevronDown,
} from 'lucide-react';
import { formatInIST, formatIstTime, isOverdueScheduled } from '../../../utils/timezoneUtils';
import { filterScheduledArticles, getArticleScheduledTime } from '../../../utils/schedulingUtils';
import ScheduledArticleCard from './ScheduledArticleCard';

export default function ScheduledArticlesList({
  articles = [],
  onPreview,
  onEdit,
  onReschedule,
  onReturnToDraft,
  onPublishNow,
  onCreateScheduled,
  categories = [],
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [viewFormat, setViewFormat] = useState('cards'); // 'cards' or 'table'

  // Filtered and sorted articles
  const filteredList = useMemo(() => {
    const list = filterScheduledArticles(articles, {
      category: selectedCategory,
      language: selectedLanguage,
      search,
      dateFilter,
    });

    return list.sort((a, b) => {
      const timeA = new Date(getArticleScheduledTime(a) || 0).getTime();
      const timeB = new Date(getArticleScheduledTime(b) || 0).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [articles, selectedCategory, selectedLanguage, search, dateFilter, sortOrder]);

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="bg-paper-canvas border border-border-rule p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="शीर्षक, सारांश या लेखक खोजें..."
              className="w-full pl-9 pr-4 py-2 bg-paper-tint border border-border-rule font-inter text-xs text-on-surface focus:outline-none focus:border-primary-container"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-secondary hover:text-on-surface"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Date Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 font-mukta text-xs font-bold transition-colors cursor-pointer border ${
                dateFilter === 'all'
                  ? 'bg-border-heavy text-white border-border-heavy'
                  : 'bg-paper-tint text-secondary hover:text-on-surface border-border-rule'
              }`}
            >
              सभी (All)
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 font-mukta text-xs font-bold transition-colors cursor-pointer border flex items-center gap-1 ${
                dateFilter === 'today'
                  ? 'bg-primary-container text-white border-primary-container'
                  : 'bg-paper-tint text-secondary hover:text-on-surface border-border-rule'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>आज (Today)</span>
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('tomorrow')}
              className={`px-3 py-1.5 font-mukta text-xs font-bold transition-colors cursor-pointer border ${
                dateFilter === 'tomorrow'
                  ? 'bg-primary-container text-white border-primary-container'
                  : 'bg-paper-tint text-secondary hover:text-on-surface border-border-rule'
              }`}
            >
              कल (Tomorrow)
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('overdue')}
              className={`px-3 py-1.5 font-mukta text-xs font-bold transition-colors cursor-pointer border flex items-center gap-1 ${
                dateFilter === 'overdue'
                  ? 'bg-breaking-crimson text-white border-breaking-crimson'
                  : 'bg-ticker-tint text-breaking-crimson hover:bg-error-container border-breaking-crimson/30'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>अतिदेय (Overdue)</span>
            </button>
          </div>
        </div>

        {/* Dropdowns row: Category, Language, Sorting, View format */}
        <div className="flex items-center justify-between border-t border-border-rule pt-3 flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category */}
            <div className="flex items-center gap-1">
              <span className="text-secondary font-inter">श्रेणी:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-paper-tint border border-border-rule px-2 py-1 font-inter text-xs text-on-surface focus:outline-none"
              >
                <option value="all">सभी श्रेणियां</option>
                <option value="national">राष्ट्रीय</option>
                <option value="international">अंतर्राष्ट्रीय</option>
                <option value="uttar-pradesh">उत्तर प्रदेश</option>
                <option value="politics">राजनीति</option>
                <option value="business">व्यापार</option>
                <option value="technology">तकनीक</option>
                <option value="sports">खेल</option>
              </select>
            </div>

            {/* Language */}
            <div className="flex items-center gap-1">
              <span className="text-secondary font-inter">भाषा:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-paper-tint border border-border-rule px-2 py-1 font-inter text-xs text-on-surface focus:outline-none"
              >
                <option value="all">सभी भाषाएं</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1">
              <span className="text-secondary font-inter">क्रम:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-paper-tint border border-border-rule px-2 py-1 font-inter text-xs text-on-surface focus:outline-none"
              >
                <option value="asc">समय (पहले से बाद में)</option>
                <option value="desc">समय (बाद से पहले)</option>
              </select>
            </div>
          </div>

          {/* Result Count & View Switch */}
          <div className="flex items-center gap-3">
            <span className="font-inter text-secondary">
              कुल: <strong>{filteredList.length}</strong> समाचार
            </span>

            <div className="flex items-center border border-border-rule bg-paper-canvas">
              <button
                type="button"
                onClick={() => setViewFormat('cards')}
                className={`px-2 py-1 font-inter text-xs font-semibold ${
                  viewFormat === 'cards'
                    ? 'bg-paper-subtle text-primary-container font-bold'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                कार्ड (Cards)
              </button>
              <div className="h-3 w-px bg-border-rule" />
              <button
                type="button"
                onClick={() => setViewFormat('table')}
                className={`px-2 py-1 font-inter text-xs font-semibold ${
                  viewFormat === 'table'
                    ? 'bg-paper-subtle text-primary-container font-bold'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                तालिका (Table)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Results Display */}
      {filteredList.length > 0 ? (
        viewFormat === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredList.map((article) => (
              <ScheduledArticleCard
                key={article.id}
                article={article}
                onPreview={onPreview}
                onEdit={onEdit}
                onReschedule={onReschedule}
                onReturnToDraft={onReturnToDraft}
                onPublishNow={onPublishNow}
              />
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-paper-canvas border border-border-rule shadow-xs overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-paper-subtle border-b border-border-rule font-inter text-[11px] uppercase tracking-wider text-secondary">
                  <th className="p-3">समाचार शीर्षक (Headline)</th>
                  <th className="p-3">श्रेणी / भाषा</th>
                  <th className="p-3">निर्धारित समय (IST)</th>
                  <th className="p-3">लेखक / संपादक</th>
                  <th className="p-3">स्थिति</th>
                  <th className="p-3 text-right">कार्यवाही (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-rule font-inter text-xs">
                {filteredList.map((article) => {
                  const scheduledTime = getArticleScheduledTime(article);
                  const isOverdue = isOverdueScheduled(scheduledTime, article.status);
                  const istFormatted = formatInIST(scheduledTime, { locale: 'hi' });

                  return (
                    <tr
                      key={article.id}
                      className={`hover:bg-paper-tint/70 transition-colors ${
                        isOverdue ? 'bg-ticker-tint/20' : ''
                      }`}
                    >
                      <td className="p-3 max-w-sm">
                        <span
                          onClick={() => onPreview && onPreview(article)}
                          className="font-mukta text-sm font-bold text-on-surface hover:text-primary-container transition-colors line-clamp-2 cursor-pointer"
                        >
                          {article.title}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-bold text-[10px] uppercase text-primary-container bg-paper-tint px-1.5 py-0.5 border border-border-rule mr-1">
                          {article.category || 'राष्ट्रीय'}
                        </span>
                        <span className="text-[10px] uppercase text-secondary">
                          {article.language === 'en' ? 'EN' : 'HI'}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-secondary shrink-0" />
                          <span className={isOverdue ? 'text-breaking-crimson font-bold' : ''}>
                            {istFormatted}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap text-secondary">
                        {article.author?.name || article.scheduledBy || 'संपादक'}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-breaking-crimson text-white text-[10px] font-bold rounded-xs">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>अतिदेय (Overdue)</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[10px] font-bold">
                            शेड्यूल्ड
                          </span>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPreview && onPreview(article)}
                            className="p-1 text-secondary hover:text-on-surface"
                            title="पूर्वावलोकन"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit && onEdit(article)}
                            className="p-1 text-secondary hover:text-on-surface"
                            title="संपादित करें"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onReschedule && onReschedule(article)}
                            className="px-2 py-1 bg-paper-tint hover:bg-paper-subtle border border-border-rule font-mukta text-xs font-bold"
                          >
                            समय बदलें
                          </button>
                          <button
                            type="button"
                            onClick={() => onReturnToDraft && onReturnToDraft(article)}
                            className="p-1 text-secondary hover:text-amber-700"
                            title="ड्राफ्ट में भेजें"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onPublishNow && onPublishNow(article)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-container hover:bg-primary text-white font-mukta text-xs font-bold"
                            title="अभी तुरंत प्रकाशित करें"
                          >
                            <Rocket className="w-3 h-3" />
                            <span>प्रकाशित</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-paper-canvas border border-border-rule p-12 text-center shadow-xs">
          <Calendar className="w-12 h-12 text-secondary/40 mx-auto mb-3" />
          <h3 className="font-mukta text-lg font-bold text-on-surface">
            कोई शेड्यूल्ड समाचार नहीं मिला
          </h3>
          <p className="font-inter text-xs text-secondary mt-1 max-w-md mx-auto">
            {search || selectedCategory !== 'all' || dateFilter !== 'all'
              ? 'वर्तमान फ़िल्टर मापदंडों से मेल खाने वाला कोई समाचार नहीं है। फ़िल्टर रीसेट करें।'
              : 'वर्तमान में प्रकाशन कतार में कोई समाचार निर्धारित नहीं है। नया समाचार लिखकर उसे भविष्य के समय पर शेड्यूल करें।'}
          </p>

          <div className="mt-4 flex items-center justify-center gap-2">
            {(search || selectedCategory !== 'all' || dateFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                  setSelectedLanguage('all');
                  setDateFilter('all');
                }}
                className="px-3 py-1.5 bg-paper-tint hover:bg-paper-subtle border border-border-rule font-mukta text-xs font-bold"
              >
                फ़िल्टर साफ़ करें
              </button>
            )}
            {onCreateScheduled && (
              <button
                type="button"
                onClick={onCreateScheduled}
                className="px-4 py-1.5 bg-primary-container hover:bg-primary text-white font-mukta text-xs font-bold shadow-xs"
              >
                + नया समाचार शेड्यूल करें
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

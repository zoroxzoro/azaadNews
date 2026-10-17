import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useArticles } from '../../context/ArticleContext';
import ArticleFilters from '../../components/admin/ArticleFilters';
import ArticleManagementTable from '../../components/admin/ArticleManagementTable';
import ArticleManagementCard from '../../components/admin/ArticleManagementCard';
import BulkActionsBar from '../../components/admin/BulkActionsBar';
import DeleteConfirmationDialog from '../../components/admin/DeleteConfirmationDialog';
import Pagination from '../../components/news/Pagination';
import {
  PenSquare,
  Newspaper,
  Eye,
  Clock,
  FileEdit,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { normalizeStatus, ARTICLE_STATUS } from '../../utils/articleStatus';

export default function AllNewsPage() {
  const {
    articles,
    changeArticleStatus,
    deleteArticle,
    bulkChangeStatus,
    bulkDeleteArticles,
    restoreDefaultArticles,
  } = useArticles();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated_desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  // Delete Dialog State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [articlesToDelete, setArticlesToDelete] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  // Compute status counts across all articles
  const statusCounts = useMemo(() => {
    const counts = {
      all: articles.length,
      [ARTICLE_STATUS.PUBLISHED]: 0,
      [ARTICLE_STATUS.IN_REVIEW]: 0,
      [ARTICLE_STATUS.SCHEDULED]: 0,
      [ARTICLE_STATUS.DRAFT]: 0,
    };

    articles.forEach((item) => {
      const s = normalizeStatus(item.status);
      if (counts[s] !== undefined) {
        counts[s] += 1;
      }
    });

    return counts;
  }, [articles]);

  // Client-Side Search, Filter & Sort
  const filteredArticles = useMemo(() => {
    let result = [...articles];

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter((item) => normalizeStatus(item.status) === statusFilter);
    }

    // Category Filter
    if (categoryFilter !== 'all') {
      result = result.filter((item) => item.category === categoryFilter);
    }

    // Language Filter
    if (languageFilter !== 'all') {
      result = result.filter((item) => (item.language || 'hi') === languageFilter);
    }

    // Search Query (Headline, Category, Author, Tags, ID)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((item) => {
        const titleMatch = item.title?.toLowerCase().includes(q);
        const authorMatch = item.author?.name?.toLowerCase().includes(q);
        const catMatch = item.category?.toLowerCase().includes(q);
        const tagMatch = item.tags && item.tags.some((t) => t.toLowerCase().includes(q));
        const idMatch = String(item.id).includes(q);

        return titleMatch || authorMatch || catMatch || tagMatch || idMatch;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'updated_desc') {
        return new Date(b.updatedAt || b.publishedAt || 0) - new Date(a.updatedAt || a.publishedAt || 0);
      }
      if (sortBy === 'updated_asc') {
        return new Date(a.updatedAt || a.publishedAt || 0) - new Date(b.updatedAt || b.publishedAt || 0);
      }
      if (sortBy === 'published_desc') {
        return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
      }
      if (sortBy === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '', 'hi');
      }
      return 0;
    });

    return result;
  }, [articles, statusFilter, categoryFilter, languageFilter, searchTerm, sortBy]);

  // Reset to page 1 whenever filters or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, languageFilter, searchTerm, sortBy]);

  // Pagination bounds (10 articles per page)
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / pageSize));

  // If current page is beyond totalPages due to deletions, adjust it
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredArticles.slice(start, start + pageSize);
  }, [filteredArticles, currentPage, pageSize]);

  // Selection Handlers
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = paginatedArticles.map((a) => a.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Status Change Handler
  const handleStatusChange = (id, newStatus, extraFields) => {
    changeArticleStatus(id, newStatus, extraFields);
    toast.success(`आलेख स्थिति बदलकर '${newStatus}' की गई`);
  };

  // Single Delete Request
  const handleDeleteRequest = (article) => {
    setArticlesToDelete([article]);
    setIsBulkDelete(false);
    setDeleteModalOpen(true);
  };

  // Bulk Delete Request
  const handleBulkDeleteRequest = () => {
    const toDelete = articles.filter((a) => selectedIds.includes(a.id));
    if (toDelete.length === 0) return;
    setArticlesToDelete(toDelete);
    setIsBulkDelete(true);
    setDeleteModalOpen(true);
  };

  // Confirm Delete Handler
  const handleConfirmDelete = () => {
    if (isBulkDelete) {
      const ids = articlesToDelete.map((a) => a.id);
      bulkDeleteArticles(ids);
      setSelectedIds([]);
      toast.success(`${ids.length} समाचार आलेख हटा दिए गए`);
    } else if (articlesToDelete[0]) {
      const targetId = articlesToDelete[0].id;
      deleteArticle(targetId);
      setSelectedIds((prev) => prev.filter((id) => id !== targetId));
      toast.success('समाचार आलेख सफलतापूर्वक हटा दिया गया');
    }
    setDeleteModalOpen(false);
    setArticlesToDelete([]);
  };

  // Bulk Move to Draft
  const handleBulkMoveToDraft = () => {
    bulkChangeStatus(selectedIds, ARTICLE_STATUS.DRAFT);
    setSelectedIds([]);
    toast.success('चयनित आलेख ड्राफ्ट में स्थानांतरित कर दिए गए');
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setLanguageFilter('all');
    setSortBy('updated_desc');
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    statusFilter !== 'all' ||
    categoryFilter !== 'all' ||
    languageFilter !== 'all' ||
    sortBy !== 'updated_desc';

  const isAllVisibleSelected =
    paginatedArticles.length > 0 &&
    paginatedArticles.every((a) => selectedIds.includes(a.id));

  return (
    <div className="space-y-5">
      {/* 1. TOP HEADER & METRIC SUMMARY */}
      <section className="bg-paper-canvas p-4 sm:p-5 border border-border-rule shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-mukta text-xl sm:text-2xl font-extrabold text-on-surface">
              सभी समाचार (All News & Editorial Index)
            </h1>
            <p className="font-inter text-xs text-secondary mt-1 max-w-2xl">
              आज़ाद समाचार डिजिटल आर्काइव: आलेखों को खोजें, स्थिति बदलें, बल्क ऑपरेशन चलाएं या लाइव पोर्टल पर प्रकाशित करें।
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                restoreDefaultArticles();
                toast.success('डिफ़ॉल्ट मॉक डेटा पुनर्स्थापित किया गया');
              }}
              className="px-3 py-2 bg-paper-tint hover:bg-paper-subtle border border-border-rule text-secondary hover:text-on-surface font-mukta font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              title="मॉक डेटा रीसेट करें"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>डेटा रीसेट (Reset Demo)</span>
            </button>

            <Link
              to="/admin/news/create"
              className="px-4 py-2 bg-primary-container hover:bg-primary text-white font-mukta font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <PenSquare className="w-4 h-4" />
              <span>नया समाचार लिखें (Write)</span>
            </Link>
          </div>
        </div>

        {/* Quick Stat Counter Pills */}
        <div className="mt-4 pt-3 border-t border-border-rule grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-inter">
          <div className="p-2 bg-paper-tint border border-border-rule flex items-center justify-between">
            <span className="text-secondary font-semibold">कुल आलेख:</span>
            <span className="font-bold text-on-surface font-mukta text-sm">{statusCounts.all}</span>
          </div>
          <div className="p-2 bg-ticker-tint border border-breaking-crimson/20 flex items-center justify-between">
            <span className="text-breaking-crimson font-semibold">प्रकाशित (Live):</span>
            <span className="font-bold text-breaking-crimson font-mukta text-sm">{statusCounts[ARTICLE_STATUS.PUBLISHED]}</span>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
            <span className="text-blue-700 dark:text-blue-300 font-semibold">समीक्षाधीन:</span>
            <span className="font-bold text-blue-800 dark:text-blue-200 font-mukta text-sm">{statusCounts[ARTICLE_STATUS.IN_REVIEW]}</span>
          </div>
          <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
            <span className="text-amber-800 dark:text-amber-300 font-semibold">शेड्यूल्ड:</span>
            <span className="font-bold text-amber-900 dark:text-amber-200 font-mukta text-sm">{statusCounts[ARTICLE_STATUS.SCHEDULED]}</span>
          </div>
        </div>
      </section>

      {/* 2. FILTER & SEARCH TOOLBAR */}
      <ArticleFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        languageFilter={languageFilter}
        onLanguageChange={setLanguageFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        statusCounts={statusCounts}
      />

      {/* 3. BULK ACTIONS BAR */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClearSelection={handleClearSelection}
        onBulkMoveToDraft={handleBulkMoveToDraft}
        onBulkDelete={handleBulkDeleteRequest}
      />

      {/* 4. RESULTS STATS & ACTIVE COUNTER */}
      <div className="flex items-center justify-between text-xs font-inter text-secondary px-1">
        <span>
          कुल <strong>{filteredArticles.length}</strong> में से{' '}
          <strong>{paginatedArticles.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> -{' '}
          <strong>{Math.min(currentPage * pageSize, filteredArticles.length)}</strong> समाचार प्रदर्शित
        </span>
        <span className="font-mukta font-bold text-on-surface">
          पृष्ठ {currentPage} / {totalPages}
        </span>
      </div>

      {/* 5. DESKTOP / TABLET DATA TABLE */}
      <div className="hidden md:block">
        <ArticleManagementTable
          articles={paginatedArticles}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAllVisible={handleSelectAllVisible}
          isAllVisibleSelected={isAllVisibleSelected}
          onStatusChange={handleStatusChange}
          onDeleteRequest={handleDeleteRequest}
        />
      </div>

      {/* 6. MOBILE RESPONSIVE CARDS VIEW */}
      <div className="md:hidden space-y-3">
        {paginatedArticles.length === 0 ? (
          <div className="bg-paper-canvas border border-border-rule p-8 text-center text-secondary font-mukta text-sm">
            कोई समाचार आलेख नहीं मिला।
          </div>
        ) : (
          paginatedArticles.map((article) => (
            <ArticleManagementCard
              key={article.id}
              article={article}
              isSelected={selectedIds.includes(article.id)}
              onToggleSelect={handleToggleSelect}
              onStatusChange={handleStatusChange}
              onDeleteRequest={handleDeleteRequest}
            />
          ))
        )}
      </div>

      {/* 7. PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 180, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {/* 8. DELETE CONFIRMATION DIALOG MODAL */}
      <DeleteConfirmationDialog
        isOpen={deleteModalOpen}
        articlesToDelete={articlesToDelete}
        isBulk={isBulkDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setArticlesToDelete([]);
        }}
      />
    </div>
  );
}

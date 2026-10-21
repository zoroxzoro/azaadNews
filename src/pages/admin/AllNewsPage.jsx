import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useArticles } from '../../context/ArticleContext';
import { useAuth } from '../../context/AuthContext';
import { articlesService } from '../../services/articlesService';
import ArticleFilters from '../../components/admin/ArticleFilters';
import ArticleManagementTable from '../../components/admin/ArticleManagementTable';
import ArticleManagementCard from '../../components/admin/ArticleManagementCard';
import BulkActionsBar from '../../components/admin/BulkActionsBar';
import DeleteConfirmationDialog from '../../components/admin/DeleteConfirmationDialog';
import Pagination from '../../components/news/Pagination';
import {
  PenSquare,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { normalizeStatus, ARTICLE_STATUS } from '../../utils/articleStatus';

export default function AllNewsPage() {
  const {
    changeArticleStatus,
    deleteArticle,
    bulkChangeStatus,
    bulkDeleteArticles,
    restoreDefaultArticles,
  } = useArticles();
  const { isDemoMode, currentUser, isSuperAdmin } = useAuth();

  // Ordinary admin only sees their owned articles; Super admin sees all
  const effectiveAuthorId = isSuperAdmin ? null : currentUser?.id;

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated_desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input to prevent query flooding
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Remote Articles Data
  const [adminArticles, setAdminArticles] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    [ARTICLE_STATUS.PUBLISHED]: 0,
    [ARTICLE_STATUS.IN_REVIEW]: 0,
    [ARTICLE_STATUS.SCHEDULED]: 0,
    [ARTICLE_STATUS.DRAFT]: 0,
  });

  const pageSize = 20;
  const reqIdRef = useRef(0);

  // Load overall status counts across archive (or owned articles for admin)
  const loadCounts = useCallback(async () => {
    try {
      const counts = await articlesService.getArticleCounts(effectiveAuthorId);
      if (counts) {
        setStatusCounts({
          all: counts.total || 0,
          [ARTICLE_STATUS.PUBLISHED]: counts.published || 0,
          [ARTICLE_STATUS.IN_REVIEW]: counts.inReview || 0,
          [ARTICLE_STATUS.SCHEDULED]: counts.scheduled || 0,
          [ARTICLE_STATUS.DRAFT]: counts.draft || 0,
        });
      }
    } catch (err) {
      console.warn('[AllNewsPage] loadCounts failed:', err);
    }
  }, [effectiveAuthorId]);

  // Fetch paginated admin articles from Supabase
  const fetchArticles = useCallback(async () => {
    const currentReq = ++reqIdRef.current;
    setIsLoading(true);

    try {
      const result = await articlesService.getAdminArticles({
        page: currentPage,
        pageSize,
        authorId: effectiveAuthorId,
        status: statusFilter,
        category: categoryFilter,
        language: languageFilter,
        search: debouncedSearch,
        sortBy,
      });

      if (currentReq === reqIdRef.current) {
        setAdminArticles(result.data || []);
        setTotalCount(result.total || 0);
        setTotalPages(result.totalPages || 1);
      }
    } catch (err) {
      if (currentReq === reqIdRef.current) {
        console.error('[AllNewsPage] getAdminArticles error:', err);
        toast.error('समाचार सूची लोड करने में त्रुटि');
        setAdminArticles([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } finally {
      if (currentReq === reqIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentPage, pageSize, effectiveAuthorId, statusFilter, categoryFilter, languageFilter, debouncedSearch, sortBy]);

  // Initial and reactive data fetching
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  // Reset page to 1 when filters change
  const handleFilterChange = (setter) => (val) => {
    setter(val);
    setCurrentPage(1);
  };

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  // Delete Dialog State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [articlesToDelete, setArticlesToDelete] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  // Selection Handlers
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = adminArticles.map((a) => a.id);
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
  const handleStatusChange = async (id, newStatus, extraFields) => {
    try {
      await changeArticleStatus(id, newStatus, extraFields);
      toast.success(`स्थिति बदलकर '${newStatus}' की गई`);
      // Update local item immediately
      setAdminArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: normalizeStatus(newStatus) } : a))
      );
      loadCounts();
    } catch (err) {
      toast.error(err.message || 'स्थिति बदलने में त्रुटि हुई');
    }
  };

  // Single Delete Request (Only allowed for Super Admin)
  const handleDeleteRequest = (article) => {
    if (!isSuperAdmin) {
      toast.error('समाचार हटाने का अधिकार केवल मुख्य व्यवस्थापक (Super Admin) को है।');
      return;
    }
    setArticlesToDelete([article]);
    setIsBulkDelete(false);
    setDeleteModalOpen(true);
  };

  // Bulk Delete Request (Only allowed for Super Admin)
  const handleBulkDeleteRequest = () => {
    if (!isSuperAdmin) {
      toast.error('समाचार हटाने का अधिकार केवल मुख्य व्यवस्थापक (Super Admin) को है।');
      return;
    }
    const toDelete = adminArticles.filter((a) => selectedIds.includes(a.id));
    if (toDelete.length === 0) return;
    setArticlesToDelete(toDelete);
    setIsBulkDelete(true);
    setDeleteModalOpen(true);
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!isSuperAdmin) {
      toast.error('अनुमति अस्वीकृत: आप समाचार नहीं हटा सकते।');
      setDeleteModalOpen(false);
      return;
    }
    try {
      if (isBulkDelete) {
        const ids = articlesToDelete.map((a) => a.id);
        await bulkDeleteArticles(ids);
        setSelectedIds([]);
        toast.success(`${ids.length} समाचार आलेख हटा दिए गए`);
      } else if (articlesToDelete[0]) {
        const targetId = articlesToDelete[0].id;
        await deleteArticle(targetId);
        setSelectedIds((prev) => prev.filter((id) => id !== targetId));
        toast.success('समाचार आलेख सफलतापूर्वक हटा दिया गया');
      }
      fetchArticles();
      loadCounts();
    } catch (err) {
      toast.error(err.message || 'हटाने में त्रुटि हुई');
    } finally {
      setDeleteModalOpen(false);
      setArticlesToDelete([]);
    }
  };

  // Bulk Move to Draft
  const handleBulkMoveToDraft = async () => {
    try {
      await bulkChangeStatus(selectedIds, ARTICLE_STATUS.DRAFT);
      setSelectedIds([]);
      toast.success('चयनित आलेख ड्राफ्ट में स्थानांतरित कर दिए गए');
      fetchArticles();
      loadCounts();
    } catch (err) {
      toast.error(err.message || 'ड्राफ्ट में स्थानांतरित करने में त्रुटि');
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setLanguageFilter('all');
    setSortBy('updated_desc');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    statusFilter !== 'all' ||
    categoryFilter !== 'all' ||
    languageFilter !== 'all' ||
    sortBy !== 'updated_desc';

  const isAllVisibleSelected =
    adminArticles.length > 0 &&
    adminArticles.every((a) => selectedIds.includes(a.id));

  return (
    <div className="space-y-5">
      {/* 1. TOP HEADER & METRIC SUMMARY */}
      <section className="bg-paper-canvas p-4 sm:p-5 border border-border-rule shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-mukta text-xl sm:text-2xl font-extrabold text-on-surface">
              {isSuperAdmin
                ? 'सभी समाचार (All News & Editorial Index)'
                : `मेरे समाचार (My Articles & Drafts) - ${currentUser?.name || 'एडमिन'}`}
            </h1>
            <p className="font-inter text-xs text-secondary mt-1 max-w-2xl">
              {isSuperAdmin
                ? `आज़ाद समाचार डिजिटल आर्काइव: कुल ${statusCounts.all.toLocaleString('hi-IN')} ऐतिहासिक एवं समसामयिक समाचार। आलेखों को खोजें, स्थिति बदलें या लाइव पोर्टल पर प्रकाशित करें।`
                : `आपके द्वारा रचित समाचार आलेख: कुल ${statusCounts.all.toLocaleString('hi-IN')} आलेख। केवल आपके द्वारा बनाए गए आलेख यहाँ प्रदर्शित हैं।`}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {isDemoMode ? (
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
            ) : (
              <button
                type="button"
                onClick={() => {
                  fetchArticles();
                  loadCounts();
                  toast.success('समाचार सूची अद्यतन की गई');
                }}
                className="px-3 py-2 bg-paper-tint hover:bg-paper-subtle border border-border-rule text-secondary hover:text-on-surface font-mukta font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                title="समाचार सूची रीफ्रेश करें"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>रीफ्रेश (Refresh)</span>
              </button>
            )}

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
            <span className="font-bold text-on-surface font-mukta text-sm">{statusCounts.all.toLocaleString('hi-IN')}</span>
          </div>
          <div className="p-2 bg-ticker-tint border border-breaking-crimson/20 flex items-center justify-between">
            <span className="text-breaking-crimson font-semibold">प्रकाशित (Live):</span>
            <span className="font-bold text-breaking-crimson font-mukta text-sm">{statusCounts[ARTICLE_STATUS.PUBLISHED].toLocaleString('hi-IN')}</span>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
            <span className="text-blue-700 dark:text-blue-300 font-semibold">समीक्षाधीन:</span>
            <span className="font-bold text-blue-800 dark:text-blue-200 font-mukta text-sm">{statusCounts[ARTICLE_STATUS.IN_REVIEW].toLocaleString('hi-IN')}</span>
          </div>
          <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
            <span className="text-amber-800 dark:text-amber-300 font-semibold">शेड्यूल्ड:</span>
            <span className="font-bold text-amber-900 dark:text-amber-200 font-mukta text-sm">{statusCounts[ARTICLE_STATUS.SCHEDULED].toLocaleString('hi-IN')}</span>
          </div>
        </div>
      </section>

      {/* 2. FILTER & SEARCH TOOLBAR */}
      <ArticleFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={handleFilterChange(setStatusFilter)}
        categoryFilter={categoryFilter}
        onCategoryChange={handleFilterChange(setCategoryFilter)}
        languageFilter={languageFilter}
        onLanguageChange={handleFilterChange(setLanguageFilter)}
        sortBy={sortBy}
        onSortChange={handleFilterChange(setSortBy)}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        statusCounts={statusCounts}
      />

      {/* 3. BULK ACTIONS BAR */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClearSelection={handleClearSelection}
        onBulkMoveToDraft={handleBulkMoveToDraft}
        onBulkDelete={isSuperAdmin ? handleBulkDeleteRequest : null}
      />

      {/* 4. RESULTS STATS & ACTIVE COUNTER */}
      <div className="flex items-center justify-between text-xs font-inter text-secondary px-1">
        <span>
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-container" />
              <span>डेटा लोड हो रहा है...</span>
            </span>
          ) : (
            <span>
              कुल <strong>{totalCount.toLocaleString('hi-IN')}</strong> में से{' '}
              <strong>{adminArticles.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> -{' '}
              <strong>{Math.min(currentPage * pageSize, totalCount)}</strong> समाचार प्रदर्शित
            </span>
          )}
        </span>
        <span className="font-mukta font-bold text-on-surface">
          पृष्ठ {currentPage} / {totalPages}
        </span>
      </div>

      {/* 5. DESKTOP / TABLET DATA TABLE */}
      <div className="hidden md:block">
        <ArticleManagementTable
          articles={adminArticles}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAllVisible={handleSelectAllVisible}
          isAllVisibleSelected={isAllVisibleSelected}
          onStatusChange={handleStatusChange}
          onDeleteRequest={isSuperAdmin ? handleDeleteRequest : null}
        />
      </div>

      {/* 6. MOBILE RESPONSIVE CARDS VIEW */}
      <div className="md:hidden space-y-3">
        {adminArticles.length === 0 && !isLoading ? (
          <div className="bg-paper-canvas border border-border-rule p-8 text-center text-secondary font-mukta text-sm">
            कोई समाचार आलेख नहीं मिला।
          </div>
        ) : (
          adminArticles.map((article) => (
            <ArticleManagementCard
              key={article.id}
              article={article}
              isSelected={selectedIds.includes(article.id)}
              onToggleSelect={handleToggleSelect}
              onStatusChange={handleStatusChange}
              onDeleteRequest={isSuperAdmin ? handleDeleteRequest : null}
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

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { articlesService, generateSlugCandidates } from '../services/articlesService';
import { useAuth } from './AuthContext';
import { normalizeStatus, ARTICLE_STATUS } from '../utils/articleStatus';
import { mockNews as fallbackMockNews } from '../data/mockNews';

/**
 * ArticleContext
 *
 * Centralized news and editorial content provider for Azaad Samachar.
 * Integrates directly with Supabase PostgreSQL via articlesService.
 *
 * Features:
 * - Real Supabase data fetching for authenticated CMS and public portal.
 * - Atomic state synchronization after mutations.
 * - Multi-category and tag resolution.
 * - Safe fallback when Supabase is unreachable.
 * - Strict demo mode isolation preventing fake accounts from mutating Supabase records.
 */

const ArticleContext = createContext(null);

export function ArticleProvider({ children }) {
  const { user, currentUser, isAuthenticated, isDemoMode, isLoading: isAuthLoading } = useAuth();

  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch articles from Supabase (or demo storage)
  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isDemoMode) {
        // Isolated demo mode: read from localStorage or fallback mock
        const saved = localStorage.getItem('azaad_newsroom_articles_v1');
        if (saved) {
          try {
            setArticles(JSON.parse(saved));
            setIsLoading(false);
            return;
          } catch (e) {
            // Ignore
          }
        }
        setArticles(fallbackMockNews);
        setIsLoading(false);
        return;
      }

      // Production mode: fetch lightweight summaries from Supabase
      if (isAuthenticated && user) {
        // Authenticated staff: fetch first page of admin summaries
        const response = await articlesService.getAdminArticles({ page: 1, pageSize: 50 });
        if (response && Array.isArray(response.data)) {
          setArticles(response.data);
        } else {
          setArticles([]);
        }
      } else {
        // Public visitor: fetch 30 lightweight summaries for homepage, ticker & trending
        const response = await articlesService.getArticles({ limit: 30 });
        if (response && Array.isArray(response.data)) {
          setArticles(response.data);
        } else {
          setArticles([]);
        }
      }
    } catch (err) {
      console.warn('[ArticleContext] Error loading articles:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, isDemoMode]);

  useEffect(() => {
    if (isAuthLoading) return;
    fetchArticles();
  }, [fetchArticles, isAuthLoading]);

  /**
   * Get an article by numeric or UUID ID
   */
  const getArticleById = useCallback(
    (id) => {
      if (!id) return null;
      return articles.find((a) => String(a.id) === String(id) || Number(a.id) === Number(id)) || null;
    },
    [articles]
  );

  /**
   * Get an article by its unique URL slug (supports decoded and encoded slug forms)
   */
  const getArticleBySlug = useCallback(
    (slug) => {
      if (!slug) return null;
      const candidates = generateSlugCandidates(slug);
      return articles.find((a) => candidates.includes(a.slug)) || null;
    },
    [articles]
  );

  /**
   * Only published articles (for public-facing website views)
   */
  const getPublishedArticles = useCallback(() => {
    return articles.filter((a) => normalizeStatus(a.status) === ARTICLE_STATUS.PUBLISHED);
  }, [articles]);

  /**
   * Create a new article
   */
  const createArticle = useCallback(
    async (newArticleData) => {
      const authorId = user?.id || currentUser?.id;

      try {
        const result = await articlesService.createArticle(newArticleData, authorId);
        if (result.success && result.data) {
          setArticles((prev) => [result.data, ...prev.filter((a) => a.id !== result.data.id)]);
          return result.data;
        }
        if (result && !result.success) {
          throw new Error(result.error || 'समाचार सहेजने में विफल');
        }
      } catch (err) {
        if (!isDemoMode) {
          console.error('[ArticleContext] Supabase article creation error:', err);
          throw err;
        }
        console.warn('[ArticleContext] Supabase article creation fallback:', err.message);
      }

      // Local isolated fallback if offline
      const newMock = {
        ...newArticleData,
        id: Date.now(),
        status: normalizeStatus(newArticleData.status || ARTICLE_STATUS.DRAFT),
        publishedAt:
          newArticleData.status === ARTICLE_STATUS.PUBLISHED
            ? new Date().toISOString()
            : newArticleData.publishedAt || null,
        updatedAt: new Date().toISOString(),
        views: 0,
      };
      setArticles((prev) => [newMock, ...prev]);
      try {
        const current = JSON.parse(localStorage.getItem('azaad_newsroom_articles_v1') || '[]');
        localStorage.setItem('azaad_newsroom_articles_v1', JSON.stringify([newMock, ...current]));
      } catch {}
      return newMock;
    },
    [user, currentUser, isDemoMode]
  );

  /**
   * Update an existing article by ID
   */
  const updateArticle = useCallback(
    async (id, updates) => {
      const authorId = user?.id || currentUser?.id;

      try {
        const result = await articlesService.updateArticle(id, updates, authorId);
        if (result.success && result.data) {
          setArticles((prev) =>
            prev.map((item) => (String(item.id) === String(id) ? result.data : item))
          );
          return result.data;
        }
        if (result && !result.success) {
          throw new Error(result.error || 'समाचार अद्यतन में विफल');
        }
      } catch (err) {
        if (!isDemoMode) {
          console.error('[ArticleContext] Supabase article update error:', err);
          throw err;
        }
        console.warn('[ArticleContext] Supabase article update fallback:', err.message);
      }

      setArticles((prev) =>
        prev.map((item) => {
          if (String(item.id) === String(id) || Number(item.id) === Number(id)) {
            return { ...item, ...updates, updatedAt: new Date().toISOString() };
          }
          return item;
        })
      );
      return { success: true };
    },
    [user, currentUser, isDemoMode]
  );

  /**
   * Change single article status
   */
  const changeArticleStatus = useCallback(
    async (id, newStatus, extraFields = {}) => {
      const normalized = normalizeStatus(newStatus);

      if (isDemoMode) {
        setArticles((prev) =>
          prev.map((item) => {
            if (String(item.id) === String(id) || Number(item.id) === Number(id)) {
              const isNowPublished = normalized === ARTICLE_STATUS.PUBLISHED;
              const isNowDraft = normalized === ARTICLE_STATUS.DRAFT;
              const isNowScheduled = normalized === ARTICLE_STATUS.SCHEDULED;

              return {
                ...item,
                ...extraFields,
                status: normalized,
                publishedAt: isNowPublished ? item.publishedAt || new Date().toISOString() : item.publishedAt,
                scheduledAt: isNowScheduled ? extraFields.scheduledAt || item.scheduledAt : isNowDraft ? null : item.scheduledAt,
                updatedAt: new Date().toISOString(),
              };
            }
            return item;
          })
        );
        return;
      }

      const authorId = user?.id || currentUser?.id;
      const result = await articlesService.changeArticleStatus(id, normalized, extraFields, authorId);
      if (result.success && result.data) {
        setArticles((prev) =>
          prev.map((item) => (String(item.id) === String(id) ? result.data : item))
        );
      } else {
        throw new Error(result.error || 'Failed to change status');
      }
    },
    [isDemoMode, user, currentUser]
  );

  /**
   * Schedule an article with canonical UTC ISO timestamp
   */
  const scheduleArticle = useCallback(
    async (id, scheduledAtIso, scheduledBy) => {
      return changeArticleStatus(id, ARTICLE_STATUS.SCHEDULED, {
        scheduledAt: scheduledAtIso,
        scheduledFor: scheduledAtIso,
        scheduledBy: scheduledBy || currentUser?.name || 'संपादक',
      });
    },
    [changeArticleStatus, currentUser]
  );

  /**
   * Reschedule an existing scheduled article to a new future time
   */
  const rescheduleArticle = useCallback(
    async (id, newScheduledAtIso) => {
      return changeArticleStatus(id, ARTICLE_STATUS.SCHEDULED, {
        scheduledAt: newScheduledAtIso,
        scheduledFor: newScheduledAtIso,
      });
    },
    [changeArticleStatus]
  );

  /**
   * Return a scheduled (or in-review/published) article back to Draft
   */
  const returnToDraft = useCallback(
    async (id) => {
      return changeArticleStatus(id, ARTICLE_STATUS.DRAFT, {
        scheduledAt: null,
        scheduledFor: null,
      });
    },
    [changeArticleStatus]
  );

  /**
   * Manually publish a scheduled article immediately (Publish Now)
   */
  const publishScheduledNow = useCallback(
    async (id) => {
      return changeArticleStatus(id, ARTICLE_STATUS.PUBLISHED, {
        publishedAt: new Date().toISOString(),
        scheduledAt: null,
        scheduledFor: null,
      });
    },
    [changeArticleStatus]
  );

  /**
   * Reconcile and auto-publish overdue scheduled articles
   */
  const publishOverdueScheduled = useCallback(async () => {
    try {
      const res = await articlesService.publishOverdueScheduledArticles();
      if (res?.publishedCount > 0) {
        await fetchArticles();
      }
      return res;
    } catch (err) {
      console.warn('[ArticleContext] Failed to publish overdue scheduled:', err);
      return { success: false, publishedCount: 0, error: err.message };
    }
  }, [fetchArticles]);

  /**
   * Delete an article by ID
   */
  const deleteArticle = useCallback(
    async (id) => {
      if (isDemoMode) {
        setArticles((prev) =>
          prev.filter((item) => String(item.id) !== String(id) && Number(item.id) !== Number(id))
        );
        return;
      }

      const result = await articlesService.deleteArticle(id);
      if (result.success) {
        setArticles((prev) =>
          prev.filter((item) => String(item.id) !== String(id))
        );
      } else {
        throw new Error(result.error || 'Failed to delete article');
      }
    },
    [isDemoMode]
  );

  /**
   * Bulk change status for multiple articles
   */
  const bulkChangeStatus = useCallback(
    async (ids = [], newStatus) => {
      const normalized = normalizeStatus(newStatus);
      if (isDemoMode) {
        const idSet = new Set(ids.map((id) => String(id)));
        setArticles((prev) =>
          prev.map((item) => (idSet.has(String(item.id)) ? { ...item, status: normalized } : item))
        );
        return;
      }

      const authorId = user?.id || currentUser?.id;
      await articlesService.bulkChangeStatus(ids, normalized, authorId);
      await fetchArticles();
    },
    [isDemoMode, user, currentUser, fetchArticles]
  );

  /**
   * Bulk delete articles
   */
  const bulkDeleteArticles = useCallback(
    async (ids = []) => {
      if (isDemoMode) {
        const idSet = new Set(ids.map((id) => String(id)));
        setArticles((prev) => prev.filter((item) => !idSet.has(String(item.id))));
        return;
      }

      await articlesService.bulkDeleteArticles(ids);
      await fetchArticles();
    },
    [isDemoMode, fetchArticles]
  );

  /**
   * Reset store back to the pristine initial mockNews dataset (Demo mode only)
   */
  const restoreDefaultArticles = useCallback(() => {
    if (isDemoMode) {
      localStorage.removeItem('azaad_newsroom_articles_v1');
      setArticles(fallbackMockNews);
    }
  }, [isDemoMode]);

  const value = {
    articles,
    isLoading,
    error,
    refreshArticles: fetchArticles,
    getArticleById,
    getArticleBySlug,
    getPublishedArticles,
    createArticle,
    updateArticle,
    changeArticleStatus,
    scheduleArticle,
    rescheduleArticle,
    returnToDraft,
    publishScheduledNow,
    publishOverdueScheduled,
    deleteArticle,
    bulkChangeStatus,
    bulkDeleteArticles,
    restoreDefaultArticles,
  };

  return <ArticleContext.Provider value={value}>{children}</ArticleContext.Provider>;
}

export function useArticles() {
  const context = useContext(ArticleContext);
  if (!context) {
    throw new Error('useArticles must be used within an ArticleProvider');
  }
  return context;
}

export default ArticleContext;

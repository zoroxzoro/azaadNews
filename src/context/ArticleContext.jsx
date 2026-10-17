import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockNews as initialMockNews } from '../data/mockNews';
import { normalizeStatus, ARTICLE_STATUS } from '../utils/articleStatus';

/**
 * ArticleContext
 *
 * NOTE: This is a frontend demonstration state management store.
 * It simulates an editorial content repository by persisting demo mutations
 * (status changes, updates, deletions) to the browser's localStorage.
 *
 * Real production persistence and multi-user synchronization will be handled
 * by the backend REST API in a future phase.
 */
const ArticleContext = createContext(null);

const STORAGE_KEY = 'azaad_newsroom_articles_v1';

function loadInitialArticles() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read saved articles from localStorage, falling back to mockNews:', err);
  }
  return initialMockNews;
}

export function ArticleProvider({ children }) {
  const [articles, setArticles] = useState(loadInitialArticles);

  // Persist to localStorage whenever articles state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    } catch (err) {
      console.warn('Failed to persist articles to localStorage:', err);
    }
  }, [articles]);

  /**
   * Get an article by numeric ID or string ID
   */
  const getArticleById = useCallback(
    (id) => {
      const targetId = Number(id);
      return articles.find((a) => Number(a.id) === targetId || String(a.id) === String(id));
    },
    [articles]
  );

  /**
   * Get an article by its unique URL slug
   */
  const getArticleBySlug = useCallback(
    (slug) => {
      return articles.find((a) => a.slug === slug);
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
  const createArticle = useCallback((newArticleData) => {
    const newId = Date.now();
    const created = {
      ...newArticleData,
      id: newId,
      status: normalizeStatus(newArticleData.status || ARTICLE_STATUS.DRAFT),
      publishedAt:
        newArticleData.status === ARTICLE_STATUS.PUBLISHED
          ? new Date().toISOString()
          : newArticleData.publishedAt || null,
      updatedAt: new Date().toISOString(),
      views: 0,
    };

    setArticles((prev) => [created, ...prev]);
    return created;
  }, []);

  /**
   * Update an existing article by ID
   */
  const updateArticle = useCallback((id, updates) => {
    setArticles((prev) =>
      prev.map((item) => {
        if (Number(item.id) === Number(id) || String(item.id) === String(id)) {
          return {
            ...item,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  }, []);

  /**
   * Change single article status with validation
   */
  const changeArticleStatus = useCallback((id, newStatus, extraFields = {}) => {
    const normalized = normalizeStatus(newStatus);
    setArticles((prev) =>
      prev.map((item) => {
        if (Number(item.id) === Number(id) || String(item.id) === String(id)) {
          const isNowPublished = normalized === ARTICLE_STATUS.PUBLISHED;
          const isNowDraft = normalized === ARTICLE_STATUS.DRAFT;
          const isNowScheduled = normalized === ARTICLE_STATUS.SCHEDULED;

          return {
            ...item,
            ...extraFields,
            status: normalized,
            // If publishing, ensure publishedAt is set and clear scheduledAt
            publishedAt: isNowPublished
              ? item.publishedAt || new Date().toISOString()
              : item.publishedAt,
            scheduledAt: isNowScheduled
              ? extraFields.scheduledAt || item.scheduledAt || null
              : isNowDraft || isNowPublished
              ? null
              : item.scheduledAt,
            scheduledFor: isNowScheduled
              ? extraFields.scheduledAt || extraFields.scheduledFor || item.scheduledFor || null
              : isNowDraft || isNowPublished
              ? null
              : item.scheduledFor,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  }, []);

  /**
   * Schedule an article with canonical UTC ISO timestamp
   */
  const scheduleArticle = useCallback((id, scheduledAtIso, scheduledBy = 'राजेश कुमार') => {
    setArticles((prev) =>
      prev.map((item) => {
        if (Number(item.id) === Number(id) || String(item.id) === String(id)) {
          return {
            ...item,
            status: ARTICLE_STATUS.SCHEDULED,
            scheduledAt: scheduledAtIso,
            scheduledFor: scheduledAtIso,
            scheduledBy: scheduledBy || item.scheduledBy || 'राजेश कुमार',
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  }, []);

  /**
   * Reschedule an existing scheduled article to a new future time
   */
  const rescheduleArticle = useCallback((id, newScheduledAtIso) => {
    setArticles((prev) =>
      prev.map((item) => {
        if (Number(item.id) === Number(id) || String(item.id) === String(id)) {
          return {
            ...item,
            status: ARTICLE_STATUS.SCHEDULED,
            scheduledAt: newScheduledAtIso,
            scheduledFor: newScheduledAtIso,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  }, []);

  /**
   * Return a scheduled (or in-review/published) article back to Draft
   */
  const returnToDraft = useCallback((id) => {
    setArticles((prev) =>
      prev.map((item) => {
        if (Number(item.id) === Number(id) || String(item.id) === String(id)) {
          return {
            ...item,
            status: ARTICLE_STATUS.DRAFT,
            scheduledAt: null,
            scheduledFor: null,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  }, []);

  /**
   * Manually publish a scheduled article immediately (Publish Now)
   */
  const publishScheduledNow = useCallback((id) => {
    setArticles((prev) =>
      prev.map((item) => {
        if (Number(item.id) === Number(id) || String(item.id) === String(id)) {
          return {
            ...item,
            status: ARTICLE_STATUS.PUBLISHED,
            publishedAt: new Date().toISOString(),
            scheduledAt: null,
            scheduledFor: null,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  }, []);

  /**
   * Delete an article by ID
   */
  const deleteArticle = useCallback((id) => {
    setArticles((prev) =>
      prev.filter((item) => Number(item.id) !== Number(id) && String(item.id) !== String(id))
    );
  }, []);

  /**
   * Bulk change status for multiple articles
   */
  const bulkChangeStatus = useCallback((ids = [], newStatus) => {
    const idSet = new Set(ids.map((id) => String(id)));
    const normalized = normalizeStatus(newStatus);

    setArticles((prev) =>
      prev.map((item) => {
        if (idSet.has(String(item.id))) {
          const isNowPublished = normalized === ARTICLE_STATUS.PUBLISHED;
          return {
            ...item,
            status: normalized,
            publishedAt: isNowPublished && !item.publishedAt ? new Date().toISOString() : item.publishedAt,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  }, []);

  /**
   * Bulk delete multiple articles
   */
  const bulkDeleteArticles = useCallback((ids = []) => {
    const idSet = new Set(ids.map((id) => String(id)));
    setArticles((prev) => prev.filter((item) => !idSet.has(String(item.id))));
  }, []);

  /**
   * Reset store back to the pristine initial mockNews dataset
   */
  const restoreDefaultArticles = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setArticles(initialMockNews);
  }, []);

  return (
    <ArticleContext.Provider
      value={{
        articles,
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
        deleteArticle,
        bulkChangeStatus,
        bulkDeleteArticles,
        restoreDefaultArticles,
      }}
    >
      {children}
    </ArticleContext.Provider>
  );
}

export function useArticles() {
  const context = useContext(ArticleContext);
  if (!context) {
    throw new Error('useArticles must be used within an ArticleProvider');
  }
  return context;
}

import axios from 'axios';
import { mockNews, getArticleBySlug, getArticlesByCategory } from '../data/mockNews';
import { categories } from '../data/categories';

// Create base Axios instance for future backend REST API integration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for auth token when backend is implemented
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('azaad_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// News Service with mock fallbacks ready for TanStack React Query
export const newsService = {
  // Get all news articles with optional filters
  getNews: async (params = {}) => {
    // Simulated network latency for realistic testing
    await new Promise((resolve) => setTimeout(resolve, 150));
    let result = [...mockNews];

    if (params.category) {
      result = result.filter((item) => item.category === params.category);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (params.isBreaking !== undefined) {
      result = result.filter((item) => item.isBreaking === params.isBreaking);
    }
    if (params.isFeatured !== undefined) {
      result = result.filter((item) => item.isFeatured === params.isFeatured);
    }
    if (params.isTrending !== undefined) {
      result = result.filter((item) => item.isTrending === params.isTrending);
    }
    if (params.onlyVideos) {
      result = result.filter((item) => !!item.youtubeUrl);
    }

    return {
      data: result,
      total: result.length,
    };
  },

  // Get single article by slug
  getArticleBySlug: async (slug) => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const article = getArticleBySlug(slug);
    if (!article) {
      throw new Error(`लेख नहीं मिला (Article with slug "${slug}" not found)`);
    }
    return article;
  },

  // Get categories
  getCategories: async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return categories;
  },
};

export default api;

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { DemoAuthProvider } from './context/DemoAuthContext';
import { ArticleProvider } from './context/ArticleContext';
import { MediaProvider } from './context/MediaContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import NewsDetailPage from './pages/public/NewsDetailPage';
import CategoryPage from './pages/public/CategoryPage';
import SearchPage from './pages/public/SearchPage';
import VideoNewsPage from './pages/public/VideoNewsPage';
import StaticInfoPage from './pages/public/StaticInfoPage';
import NotFoundPage from './pages/public/NotFoundPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import NewsListPage from './pages/admin/NewsListPage';
import ArticlePreviewPage from './pages/admin/ArticlePreviewPage';
import NewsEditorPage from './pages/admin/NewsEditorPage';
import ScheduledNewsPage from './pages/admin/ScheduledNewsPage';
import MediaLibraryPage from './pages/admin/MediaLibraryPage';
import CategoryManagementPage from './pages/admin/CategoryManagementPage';
import SettingsPage from './pages/admin/SettingsPage';

// Utilities
import ScrollToTop from './components/common/ScrollToTop';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <DemoAuthProvider>
          <ArticleProvider>
            <MediaProvider>
              <QueryClientProvider client={queryClient}>
              <BrowserRouter>
                <ScrollToTop />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    style: {
                      borderRadius: '0px',
                      fontFamily: "'Mukta', sans-serif",
                      fontSize: '14px',
                      border: '1px solid var(--border-rule)',
                      backgroundColor: 'var(--bg-paper-canvas)',
                      color: 'var(--text-on-surface)',
                    },
                  }}
                />
                <Routes>
                  {/* Public Website Routes (Shared PublicLayout) */}
                  <Route path="/" element={<PublicLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="news/:slug" element={<NewsDetailPage />} />
                    <Route path="category/:slug" element={<CategoryPage />} />
                    <Route path="search" element={<SearchPage />} />
                    <Route path="videos" element={<VideoNewsPage />} />

                    {/* Informational & Policy Pages */}
                    <Route path="about" element={<StaticInfoPage />} />
                    <Route path="contact" element={<StaticInfoPage />} />
                    <Route path="advertise" element={<StaticInfoPage />} />
                    <Route path="editorial-policy" element={<StaticInfoPage />} />
                    <Route path="privacy-policy" element={<StaticInfoPage />} />
                    <Route path="terms-and-conditions" element={<StaticInfoPage />} />
                    <Route path="fact-check-policy" element={<StaticInfoPage />} />
                    <Route path="grievance" element={<StaticInfoPage />} />
                  </Route>

                  {/* Admin Login Route (Independent Standalone Layout) */}
                  <Route path="/admin/login" element={<AdminLoginPage />} />

                  {/* Admin CMS Portal Routes */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="news" element={<NewsListPage />} />
                    <Route path="news/preview/:id" element={<ArticlePreviewPage />} />
                    <Route path="news/create" element={<NewsEditorPage />} />
                    <Route path="news/edit/:id" element={<NewsEditorPage />} />
                    <Route path="scheduled" element={<ScheduledNewsPage />} />
                    <Route path="categories" element={<CategoryManagementPage />} />
                    <Route path="media" element={<MediaLibraryPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>

                  {/* 404 Fallback Route */}
                  <Route path="*" element={<PublicLayout />}>
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </QueryClientProvider>
          </MediaProvider>
        </ArticleProvider>
        </DemoAuthProvider>
      </LanguageProvider>
    </ThemeProvider>
);
}

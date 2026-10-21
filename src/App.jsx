import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ArticleProvider } from './context/ArticleContext';
import { MediaProvider } from './context/MediaContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
const NewsDetailPage = React.lazy(() => import('./pages/public/NewsDetailPage'));
const CategoryPage = React.lazy(() => import('./pages/public/CategoryPage'));
const NotFoundPage = React.lazy(() => import('./pages/public/NotFoundPage'));

// Secondary Public Pages (Lazy loaded)
const SearchPage = React.lazy(() => import('./pages/public/SearchPage'));
const VideoNewsPage = React.lazy(() => import('./pages/public/VideoNewsPage'));
const StaticInfoPage = React.lazy(() => import('./pages/public/StaticInfoPage'));

// Admin Layout & Pages (Lazy loaded for massive bundle reduction on public reader routes)
const AdminLayout = React.lazy(() => import('./layouts/AdminLayout'));
const AdminLoginPage = React.lazy(() => import('./pages/admin/AdminLoginPage'));
const DashboardPage = React.lazy(() => import('./pages/admin/DashboardPage'));
const NewsListPage = React.lazy(() => import('./pages/admin/NewsListPage'));
const ArticlePreviewPage = React.lazy(() => import('./pages/admin/ArticlePreviewPage'));
const NewsEditorPage = React.lazy(() => import('./pages/admin/NewsEditorPage'));
const ScheduledNewsPage = React.lazy(() => import('./pages/admin/ScheduledNewsPage'));
const MediaLibraryPage = React.lazy(() => import('./pages/admin/MediaLibraryPage'));
const CategoryManagementPage = React.lazy(() => import('./pages/admin/CategoryManagementPage'));
const SettingsPage = React.lazy(() => import('./pages/admin/SettingsPage'));
const AdminTeamManagementPage = React.lazy(() => import('./pages/admin/AdminTeamManagementPage'));

import AdminRouteGuard from './components/admin/AdminRouteGuard';
import { ROLES } from './utils/articlePermissions';

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-secondary">
      <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin mb-3" />
      <span className="font-mukta text-xs font-bold uppercase tracking-wider text-secondary">
        सामग्री लोड हो रही है...
      </span>
    </div>
  );
}

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
        <AuthProvider>
          <ArticleProvider>
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
                <React.Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public Website Routes (Shared PublicLayout) */}
                    <Route path="/" element={<PublicLayout />}>
                      <Route index element={<HomePage />} />
                      <Route path="news/:slug" element={<NewsDetailPage />} />
                      <Route path="article/:slug" element={<NewsDetailPage />} />
                      <Route path="category/:slug" element={<CategoryPage />} />
                      <Route path="city/:slug" element={<CategoryPage />} />
                      <Route path="search" element={<SearchPage />} />
                      <Route path="videos" element={<VideoNewsPage />} />

                      {/* Informational & Policy Pages */}
                      <Route path="about" element={<StaticInfoPage />} />
                      <Route path="contact" element={<StaticInfoPage />} />
                      <Route path="advertise" element={<StaticInfoPage />} />
                      <Route path="editorial-policy" element={<StaticInfoPage />} />
                      <Route path="corrections-policy" element={<StaticInfoPage />} />
                      <Route path="privacy-policy" element={<StaticInfoPage />} />
                      <Route path="terms-and-conditions" element={<StaticInfoPage />} />
                      <Route path="fact-check-policy" element={<StaticInfoPage />} />
                      <Route path="grievance" element={<StaticInfoPage />} />
                    </Route>

                    {/* Admin Login Route (Independent Standalone Layout) */}
                    <Route path="/admin/login" element={<AdminLoginPage />} />

                    {/* Admin CMS Portal Routes - MediaProvider isolated to admin */}
                    <Route
                      path="/admin"
                      element={
                        <MediaProvider>
                          <AdminLayout />
                        </MediaProvider>
                      }
                    >
                      <Route index element={<DashboardPage />} />
                      <Route path="news" element={<NewsListPage />} />
                      <Route path="news/preview/:id" element={<ArticlePreviewPage />} />
                      <Route path="news/create" element={<NewsEditorPage />} />
                      <Route path="news/edit/:id" element={<NewsEditorPage />} />
                      <Route path="scheduled" element={<ScheduledNewsPage />} />
                      <Route
                        path="categories"
                        element={
                          <AdminRouteGuard requiredRole={ROLES.SUPER_ADMIN}>
                            <CategoryManagementPage />
                          </AdminRouteGuard>
                        }
                      />
                      <Route path="media" element={<MediaLibraryPage />} />
                      <Route
                        path="team"
                        element={
                          <AdminRouteGuard requiredRole={ROLES.SUPER_ADMIN}>
                            <AdminTeamManagementPage />
                          </AdminRouteGuard>
                        }
                      />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>

                    {/* 404 Fallback Route */}
                    <Route path="*" element={<PublicLayout />}>
                      <Route path="*" element={<NotFoundPage />} />
                    </Route>
                  </Routes>
                </React.Suspense>
              </BrowserRouter>
            </QueryClientProvider>
          </ArticleProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import CategoryNavbar from '../components/layout/CategoryNavbar';
import BreakingNewsTicker from '../components/layout/BreakingNewsTicker';
import MobileNavigation from '../components/layout/MobileNavigation';
import Footer from '../components/layout/Footer';

/**
 * PublicLayout
 * Complete shared layout for public website pages (Home, Category, Detail, Search, Videos).
 * Composes TopBar, Header, CategoryNavbar, BreakingNewsTicker, Outlet, Footer, and MobileNavigation.
 */
export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface transition-colors duration-200">
      {/* 1. Top Utility Dateline & Language Bar */}
      <TopBar />

      {/* 2. Main Editorial Header with Brand Eagle Logo & Search */}
      <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

      {/* 3. Sticky Primary Category Navigation */}
      <CategoryNavbar />

      {/* 4. Live Breaking News Ticker Ribbon */}
      <BreakingNewsTicker />

      {/* 5. Main Route Content */}
      <main className="flex-1 w-full py-4 sm:py-6">
        <Outlet />
      </main>

      {/* 6. Broadsheet Editorial Footer */}
      <Footer />

      {/* 7. Slide-Out Mobile Navigation Drawer */}
      <MobileNavigation
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </div>
  );
}

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  AdminRouteGuard,
  AdminSidebar,
  AdminTopbar,
} from '../components/admin';

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-surface flex text-on-surface transition-colors duration-200">
        {/* 1. Sidebar Navigation (Fixed Desktop / Off-Canvas Mobile) */}
        <AdminSidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        {/* 2. Main Content Wrapper */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          }`}
        >
          {/* Topbar Command Bar */}
          <AdminTopbar onOpenMobile={() => setMobileOpen(true)} />

          {/* Pinned Editorial Breaking Alert Ribbon (from Stitch) */}
          <div className="bg-ticker-tint border-b border-border-rule px-3 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="bg-breaking-crimson text-white font-mukta text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.2 shrink-0">
                ब्रेकिंग अलर्ट डेस्क
              </span>
              <span className="font-mukta text-xs sm:text-sm text-on-surface truncate">
                केंद्रीय मंत्रिमंडल: सेमीकंडक्टर मिशन 2.0 को ₹45,000 करोड़ की नई मंजूरी, गुजरात-असम क्लस्टर को प्राथमिकता।
              </span>
            </div>
            <span className="hidden sm:inline font-mono text-[10px] text-secondary shrink-0 pl-2">
              अद्यतन: 11:28 AM IST
            </span>
          </div>

          {/* Main Routed Page Content */}
          <main className="flex-1 p-3 sm:p-5 lg:p-8 bg-surface">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminRouteGuard>
  );
}

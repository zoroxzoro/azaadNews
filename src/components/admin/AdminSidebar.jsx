import React, { useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Newspaper,
  PenSquare,
  CalendarClock,
  FolderTree,
  Image as ImageIcon,
  Users,
  Settings,
  LogOut,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ADMIN_NAV_ITEMS = [
  {
    to: '/admin',
    end: true,
    labelHindi: 'डैशबोर्ड',
    labelEnglish: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/admin/news',
    end: true,
    labelHindi: 'सभी समाचार',
    labelEnglish: 'All News',
    icon: Newspaper,
  },
  {
    to: '/admin/news/create',
    end: false,
    labelHindi: 'नया समाचार',
    labelEnglish: 'Write News',
    icon: PenSquare,
  },
  {
    to: '/admin/scheduled',
    end: false,
    labelHindi: 'शेड्यूल्ड समाचार',
    labelEnglish: 'Scheduled',
    icon: CalendarClock,
  },
  {
    to: '/admin/categories',
    end: false,
    labelHindi: 'श्रेणी प्रबंधन',
    labelEnglish: 'Categories',
    icon: FolderTree,
    superAdminOnly: true,
  },
  {
    to: '/admin/media',
    end: false,
    labelHindi: 'मीडिया लाइब्रेरी',
    labelEnglish: 'Media Library',
    icon: ImageIcon,
  },
  {
    to: '/admin/team',
    end: false,
    labelHindi: 'टीम प्रबंधन',
    labelEnglish: 'Team Management',
    icon: Users,
    superAdminOnly: true,
  },
  {
    to: '/admin/settings',
    end: false,
    labelHindi: 'सेटिंग्स',
    labelEnglish: 'Settings',
    icon: Settings,
  },
];

export default function AdminSidebar({
  isCollapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) {
  const { currentUser, logout, can, role, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  // Escape key listener for closing mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const handleLogout = () => {
    logout();
    toast.success('सफलतापूर्वक लॉगआउट किया गया');
    navigate('/admin/login');
  };

  return (
    <>
      {/* MOBILE BACKDROP OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside
        className={`fixed top-0 bottom-0 left-0 bg-paper-canvas border-r border-border-rule z-50 flex flex-col justify-between transition-all duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
        aria-label="न्यूज़रूम नेविगेशन साइडबार"
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Top Brand Lockup */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-border-rule bg-paper-tint">
            {!isCollapsed ? (
              <div className="flex items-center gap-2 overflow-hidden">
                <BrandLogo variant="compact" theme="auto" showPlaceholderBadge={false} />
                <div className="hidden sm:flex flex-col leading-none">
                  <span className="font-mukta text-xs font-bold text-on-surface">CMS v2.4</span>
                  <span className="font-inter text-[9px] text-secondary uppercase tracking-widest">
                    Newsroom
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <BrandLogo variant="symbol" theme="auto" />
              </div>
            )}

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-secondary hover:text-on-surface cursor-pointer"
              aria-label="साइडबार बंद करें"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop Collapse Toggle Button */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1 text-secondary hover:text-on-surface hover:bg-paper-canvas rounded transition-colors cursor-pointer"
                title={isCollapsed ? 'साइडबार विस्तृत करें' : 'साइडबार छोटा करें'}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Live Desk Banner */}
          {!isCollapsed && (
            <div className="px-4 py-2 bg-ticker-tint border-b border-border-rule flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-live-pulse animate-pulse" />
                <span className="font-inter text-[10px] uppercase font-bold text-breaking-crimson">
                  लाइव डेस्क सक्रिय
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold text-secondary">KANPUR-HQ</span>
            </div>
          )}

          {/* Navigation Section Header */}
          {!isCollapsed && (
            <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
              <span className="font-inter text-[10px] uppercase font-bold text-secondary tracking-wider">
                मुख्य नेविगेशन / NAVIGATION
              </span>
            </div>
          )}

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto px-2 sm:px-3 py-2 space-y-1">
            {ADMIN_NAV_ITEMS.filter((item) => !item.superAdminOnly || isSuperAdmin).map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => onCloseMobile && onCloseMobile()}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3 py-2 text-sm font-mukta transition-colors ${
                      isActive
                        ? 'bg-primary-container text-white font-bold shadow-xs'
                        : 'text-on-surface hover:bg-paper-tint hover:text-primary-container'
                    } ${isCollapsed ? 'justify-center px-2' : ''}`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />

                  {!isCollapsed ? (
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="truncate">{item.labelHindi}</span>
                      <span className="font-inter text-[10px] opacity-75 uppercase tracking-wider">
                        {item.labelEnglish}
                      </span>
                    </div>
                  ) : (
                    /* Floating Tooltip in collapsed mode */
                    <div className="absolute left-full ml-2 px-2.5 py-1 bg-border-heavy text-white text-xs font-inter font-medium rounded shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {item.labelHindi} ({item.labelEnglish})
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* External Link to Live Portal */}
          <div className="p-3 border-t border-border-rule bg-paper-tint">
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className={`flex items-center text-xs font-inter font-semibold text-secondary hover:text-primary-container hover:bg-paper-canvas border border-border-rule p-2 transition-colors ${
                isCollapsed ? 'justify-center' : 'justify-between'
              }`}
              title="लाइव पोर्टल देखें"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                {!isCollapsed && <span>लाइव पोर्टल</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                  Live
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 sm:p-4 border-t border-border-rule bg-paper-tint flex items-center justify-between gap-2">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser?.initials || 'RK'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-mukta text-xs sm:text-sm font-bold text-on-surface truncate leading-tight">
                  {currentUser?.name || 'राजेश कुमार'}
                </span>
                <span className="font-inter text-[10px] text-secondary truncate font-semibold">
                  {isSuperAdmin ? 'प्रधान व्यवस्थापक (Super Admin)' : 'व्यवस्थापक (Admin)'}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div
                className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs shrink-0 cursor-default"
                title={`${currentUser?.name || 'राजेश कुमार'} (${isSuperAdmin ? 'Super Admin' : 'Admin'})`}
              >
                {currentUser?.initials || 'RK'}
              </div>
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 text-secondary hover:text-breaking-crimson transition-colors cursor-pointer rounded"
              title="लॉगआउट (Sign Out)"
              aria-label="लॉगआउट"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

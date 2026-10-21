import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Search,
  Bell,
  Zap,
  ExternalLink,
  Settings,
  User,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Sparkles,
  CheckCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationService } from '../../services/notificationService';

function formatRelativeTime(isoString) {
  if (!isoString) return 'हाल ही में';
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 60) return 'अभी-अभी';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} मिनट पहले`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} घंटे पहले`;
  return `${Math.floor(diffSec / 86400)} दिन पहले`;
}

function getNotificationIcon(type) {
  switch (type) {
    case 'published':
      return { Icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' };
    case 'scheduled':
      return { Icon: Clock, bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600' };
    case 'review':
      return { Icon: FileText, bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600' };
    case 'media':
      return { Icon: ImageIcon, bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600' };
    case 'system':
    case 'alert':
      return { Icon: AlertTriangle, bg: 'bg-red-50 dark:bg-red-950/40 text-red-600' };
    default:
      return { Icon: Sparkles, bg: 'bg-paper-tint text-primary-container' };
  }
}

export default function AdminTopbar({ onOpenMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, role, isSuperAdmin, isOrdinaryAdmin } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/news?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('लॉगआउट संपन्न');
    navigate('/admin/login');
  };

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load real notifications from notificationService
  const loadNotifications = async () => {
    try {
      const [list, unread] = await Promise.all([
        notificationService.getNotifications(15),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(unread);
    } catch (err) {
      console.warn('[AdminTopbar] Error loading notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const unsubscribe = notificationService.subscribe(loadNotifications);
    return () => unsubscribe();
  }, []);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    toast.success('सभी सूचनाएं पढ़ी हुई चिह्नित की गईं');
    await loadNotifications();
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await notificationService.markAsRead(notif.id);
    }
    setNotificationsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const roleLabel = isSuperAdmin ? 'सुपर एडमिन (Super Admin)' : 'एडमिन (Admin)';
  const roleBadgeStyle = isSuperAdmin 
    ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700'
    : 'bg-blue-100 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700';

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 bg-paper-canvas/90 backdrop-blur-md border-b border-border-rule px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3 shadow-2xs">
      {/* Left: Mobile Toggle & Page Title / Desk Indicator */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-1.5 border border-border-rule bg-paper-tint text-secondary hover:text-on-surface cursor-pointer rounded"
          aria-label="नेविगेशन खोलें"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 bg-paper-subtle px-2.5 py-1 text-xs font-inter border border-border-rule shrink-0">
          <span className="font-bold text-secondary uppercase text-[10px]">डेस्क:</span>
          <span className="font-semibold text-on-surface truncate">
            {isSuperAdmin ? 'मुख्य संपादकीय व्यवस्थापक' : 'संपादकीय लेखक डेस्क'}
          </span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 border font-bold uppercase rounded ${roleBadgeStyle}`}>
            {isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}
          </span>
        </div>
      </div>

      {/* Middle: Global Admin Quick Search */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xs xl:max-w-md hidden md:block min-w-0 mx-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="समाचार, लेखक, टैग या स्टोरी ID खोजें... (Ctrl + /)"
            className="w-full pl-9 pr-3 py-1.5 bg-paper-tint border border-border-rule text-xs font-inter text-on-surface focus:outline-none focus:bg-paper-canvas focus:border-primary-container transition-colors"
          />
        </div>
      </form>

      {/* Right: Quick Action, ThemeToggle, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <ThemeToggle size="sm" />

        {/* Write News CTA */}
        <Link
          to="/admin/news/create"
          className="hidden sm:inline-flex items-center gap-1.5 bg-primary-container hover:bg-primary text-white px-3 py-1.5 font-mukta text-xs font-bold transition-colors shadow-xs"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>नया समाचार</span>
        </Link>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-1.5 sm:p-2 text-secondary hover:text-on-surface hover:bg-paper-tint border border-border-rule cursor-pointer rounded"
            title="सूचनाएं (Notifications)"
            aria-label="सूचनाएं"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-live-pulse text-white font-inter text-[9px] font-bold flex items-center justify-center rounded-full animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Modal / Menu */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-paper-canvas border border-border-rule shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3.5 py-2.5 border-b border-border-rule flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-mukta font-bold text-sm text-on-surface">
                    संपादकीय सूचनाएं (Notifications)
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-inter font-bold px-1.5 py-0.2 bg-live-pulse/15 text-breaking-crimson border border-live-pulse/30 rounded-full">
                      {unreadCount} नई
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-inter text-primary-container hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>सभी पढ़ें</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-border-rule/60 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-secondary text-xs font-inter space-y-1">
                    <Bell className="w-6 h-6 mx-auto mb-1 text-secondary/40" />
                    <p className="font-semibold text-on-surface">कोई नई सूचना नहीं है</p>
                    <p className="text-[11px] text-secondary">
                      आलेख शेड्यूलिंग, प्रकाशन एवं संपादकीय समीक्षा सूचनाएं यहां स्वतः प्रदर्शित होंगी।
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const { Icon, bg } = getNotificationIcon(notif.type);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 hover:bg-paper-tint transition-colors flex items-start gap-2.5 cursor-pointer ${
                          !notif.is_read ? 'bg-paper-tint/60 font-medium' : 'opacity-85'
                        }`}
                      >
                        <div className={`p-1.5 rounded shrink-0 mt-0.5 ${bg}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-mukta font-bold text-on-surface leading-snug truncate">
                              {notif.title}
                            </p>
                            {!notif.is_read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-live-pulse shrink-0" />
                            )}
                          </div>
                          {notif.message && (
                            <p className="text-[11px] font-inter text-secondary leading-normal line-clamp-2 mt-0.5">
                              {notif.message}
                            </p>
                          )}
                          <span className="text-[10px] font-inter text-secondary mt-1 block">
                            {formatRelativeTime(notif.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-3.5 py-1.5 bg-paper-tint text-center border-t border-border-rule flex items-center justify-between text-[11px] font-inter text-secondary">
                <span>वास्तविक संपादकीय ईवेंट्स</span>
                <span className="text-[10px] font-mono text-emerald-600 font-semibold">● लाइव सिंक</span>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-1.5 p-1 border border-border-rule hover:border-border-heavy bg-paper-tint cursor-pointer rounded"
            aria-label="यूजर प्रोफाइल"
          >
            <div className="w-7 h-7 rounded bg-primary-container text-white flex items-center justify-center font-bold text-xs">
              {currentUser?.initials || 'AS'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-secondary hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-paper-canvas border border-border-rule shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-border-rule">
                <span className="font-mukta font-bold text-sm text-on-surface block leading-tight">
                  {currentUser?.name || 'संपादक'}
                </span>
                <span className="text-[10px] font-inter text-secondary block truncate">
                  {currentUser?.email || 'admin@azaadsamachar.com'}
                </span>
                <span className={`inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold uppercase border rounded ${roleBadgeStyle}`}>
                  {roleLabel}
                </span>
              </div>

              <div className="py-1 text-xs font-inter">
                {isSuperAdmin && (
                  <Link
                    to="/admin/team"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-on-surface hover:bg-paper-tint hover:text-primary-container transition-colors font-medium"
                  >
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>टीम व एक्सेस प्रबंधन</span>
                  </Link>
                )}

                <Link
                  to="/admin/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-on-surface hover:bg-paper-tint hover:text-primary-container transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{isSuperAdmin ? 'सिस्टम व साइट सेटिंग्स' : 'मेरी प्रोफाइल सेटिंग्स'}</span>
                </Link>

                <Link
                  to="/"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-on-surface hover:bg-paper-tint hover:text-primary-container transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>लाइव पोर्टल पर जाएं</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-border-rule">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-inter text-breaking-crimson hover:bg-ticker-tint transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>लॉगआउट (Sign Out)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import { useDemoAuth } from '../../context/DemoAuthContext';
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
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminTopbar({ onOpenMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useDemoAuth();

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

  // Mock Notifications
  const mockNotifications = [
    {
      id: 1,
      title: 'धोलेरा सेमीकंडक्टर रिपोर्ट प्रकाशित',
      time: '10 मिनट पहले',
      type: 'success',
      icon: CheckCircle,
    },
    {
      id: 2,
      title: 'बजट 2025 आलेख समीक्षाधीन है',
      time: '35 मिनट पहले',
      type: 'warning',
      icon: Clock,
    },
    {
      id: 3,
      title: 'प्राइम टाइम 14:00 स्लॉट रिक्त है',
      time: '1 घंटा पहले',
      type: 'alert',
      icon: AlertTriangle,
    },
  ];

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
            संपादकीय पोर्टल - Editorial Desk
          </span>
        </div>
      </div>

      {/* Middle: Global Admin Quick Search */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md hidden md:block">
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
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-live-pulse text-white font-inter text-[9px] font-bold flex items-center justify-center rounded-full">
              3
            </span>
          </button>

          {/* Notifications Modal / Menu */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-paper-canvas border border-border-rule shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-border-rule flex items-center justify-between">
                <span className="font-mukta font-bold text-sm text-on-surface">
                  संपादकीय सूचनाएं
                </span>
                <span className="text-[10px] font-inter text-secondary">3 नई</span>
              </div>
              <div className="divide-y divide-border-rule/60 max-h-64 overflow-y-auto">
                {mockNotifications.map((notif) => {
                  const Icon = notif.icon;
                  return (
                    <div key={notif.id} className="p-3 hover:bg-paper-tint transition-colors flex items-start gap-2.5">
                      <div className="p-1 rounded bg-paper-tint shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-primary-container" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mukta font-bold text-on-surface leading-snug">
                          {notif.title}
                        </p>
                        <span className="text-[10px] font-inter text-secondary mt-0.5 block">
                          {notif.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-3 py-1.5 bg-paper-tint text-center border-t border-border-rule">
                <span className="text-[11px] font-inter text-secondary">
                  प्रदर्शन हेतु मॉक सूचनाएं
                </span>
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
              {currentUser?.initials || 'RK'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-secondary hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-paper-canvas border border-border-rule shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-border-rule">
                <span className="font-mukta font-bold text-sm text-on-surface block leading-tight">
                  {currentUser?.name || 'राजेश कुमार'}
                </span>
                <span className="text-[10px] font-inter text-secondary block truncate">
                  {currentUser?.email || 'editor@azaadsamachar.com'}
                </span>
                <span className="inline-block mt-1 px-1.5 py-0.2 bg-ticker-tint text-breaking-crimson text-[9px] font-bold uppercase">
                  {currentUser?.role || 'वरिष्ठ संपादक'}
                </span>
              </div>

              <div className="py-1 text-xs font-inter">
                <Link
                  to="/admin/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-on-surface hover:bg-paper-tint hover:text-primary-container transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>सिस्टम सेटिंग्स</span>
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

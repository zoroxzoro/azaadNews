import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo';
import ThemeToggle from '../common/ThemeToggle';
import SocialIcon from '../common/SocialIcon';
import { categories } from '../../data/categories';
import { socialLinks } from '../../data/socialLinks';
import { useLanguage } from '../../context/LanguageContext';
import {
  X,
  Search,
  ExternalLink,
  Shield,
  Newspaper,
  Tv,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function MobileNavigation({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [drawerSearch, setDrawerSearch] = useState('');
  const drawerRef = useRef(null);

  // Close on Escape key & manage body scroll lock
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Close on route change
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (drawerSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(drawerSearch.trim())}`);
      onClose();
      setDrawerSearch('');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Drawer"
      className="fixed inset-0 z-50 flex lg:hidden animate-in fade-in duration-200"
    >
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        className="relative w-4/5 max-w-[340px] bg-paper-canvas h-full shadow-2xl flex flex-col z-10 border-r border-border-rule overflow-hidden text-on-surface transition-colors"
      >
        {/* Drawer Top Header */}
        <div className="p-3.5 bg-paper-tint border-b border-border-rule flex items-center justify-between">
          <BrandLogo variant="compact" theme="auto" />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 border border-border-rule text-secondary hover:text-on-surface hover:bg-paper-canvas transition-colors cursor-pointer"
            aria-label={t('close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Search & Utility Strip */}
        <div className="p-3.5 bg-paper-subtle border-b border-border-rule space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex">
            <input
              type="text"
              value={drawerSearch}
              onChange={(e) => setDrawerSearch(e.target.value)}
              placeholder={t('search_placeholder')}
              className="flex-1 px-3 py-2 bg-paper-canvas border border-border-rule text-xs font-inter focus:outline-none"
            />
            <button
              type="submit"
              aria-label={t('search_btn')}
              className="bg-primary-container text-white px-3.5 py-2 font-mukta font-bold text-xs cursor-pointer hover:bg-primary transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Language Switcher and Theme Toggle in Drawer */}
          <div className="flex items-center justify-between pt-1 font-inter text-xs">
            <div className="flex items-center border border-border-rule bg-paper-canvas p-0.5">
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2 py-0.5 font-bold transition-colors cursor-pointer ${
                  language === 'hi'
                    ? 'bg-primary-container text-white'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                हिंदी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 font-bold transition-colors cursor-pointer ${
                  language === 'en'
                    ? 'bg-primary-container text-white'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                English
              </button>
            </div>

            <ThemeToggle showLabel={true} size="sm" />
          </div>
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
          {/* Main Categories */}
          <div>
            <h4 className="font-inter text-[10px] uppercase font-bold text-secondary tracking-wider mb-2">
              समाचार श्रेणियां (News Categories)
            </h4>
            <ul className="space-y-1">
              <li>
                <Link
                  to="/"
                  className={`flex items-center justify-between px-3 py-2 font-mukta text-base font-bold transition-colors ${
                    location.pathname === '/'
                      ? 'bg-primary-container text-white'
                      : 'text-on-surface hover:bg-paper-tint'
                  }`}
                >
                  <span>{t('home')}</span>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </Link>
              </li>
              {categories.map((cat) => {
                const active = location.pathname === `/category/${cat.slug}`;
                return (
                  <li key={cat.id}>
                    <Link
                      to={`/category/${cat.slug}`}
                      className={`flex items-center justify-between px-3 py-1.5 font-mukta text-sm sm:text-base transition-colors ${
                        active
                          ? 'bg-primary-container text-white font-bold'
                          : 'text-on-surface hover:bg-paper-tint'
                      }`}
                    >
                      <span>{cat.nameHindi}</span>
                      <span className="font-inter text-[10px] opacity-70">
                        {cat.nameEnglish}
                      </span>
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  to="/videos"
                  className="flex items-center justify-between px-3 py-2 font-mukta text-base text-primary-container font-bold hover:bg-paper-tint transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Tv className="w-4 h-4" />
                    <span>{t('video_bulletin')}</span>
                  </span>
                  <span className="bg-primary-container text-white text-[9px] px-1.5 py-0.5 uppercase">
                    HD
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Special Services & Quick Links */}
          <div className="pt-3 border-t border-border-rule space-y-2">
            <h4 className="font-inter text-[10px] uppercase font-bold text-secondary tracking-wider">
              {t('special_services')}
            </h4>
            <div className="space-y-1 text-xs font-mukta">
              <a
                href="#epaper"
                onClick={(e) => {
                  e.preventDefault();
                  alert('ई-पेपर पीडीएफ संस्करण जल्द उपलब्ध होगा।');
                }}
                className="flex items-center justify-between p-2 text-on-surface hover:bg-paper-tint transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-primary-container" />
                  <span>{t('epaper')}</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-secondary" />
              </a>

              <Link
                to="/about"
                className="block p-2 text-on-surface hover:bg-paper-tint transition-colors"
              >
                {t('about_us')}
              </Link>
              <Link
                to="/contact"
                className="block p-2 text-on-surface hover:bg-paper-tint transition-colors"
              >
                {t('contact_us')}
              </Link>
              <Link
                to="/admin"
                className="flex items-center justify-between p-2 text-primary-container font-bold hover:bg-paper-tint transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>{t('admin_cms')}</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Social Media Follow Channels */}
          <div className="pt-3 border-t border-border-rule">
            <h4 className="font-inter text-[10px] uppercase font-bold text-secondary tracking-wider mb-2">
              {t('follow_us')}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {socialLinks.slice(0, 6).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-1.5 bg-paper-tint border border-border-rule text-xs font-mukta font-bold hover:text-primary-container transition-colors"
                >
                  <SocialIcon platform={item.id} className="w-3.5 h-3.5" />
                  <span className="truncate">{item.nameHindi}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Bottom Bar */}
        <div className="p-3 bg-paper-tint border-t border-border-rule text-center font-inter text-[10px] text-secondary">
          © {new Date().getFullYear()} आज़ाद समाचार • डिजिटल ब्रॉडशीट
        </div>
      </div>
    </div>
  );
}

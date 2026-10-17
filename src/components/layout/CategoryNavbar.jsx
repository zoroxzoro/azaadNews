import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Container from '../common/Container';
import { categories } from '../../data/categories';
import { useLanguage } from '../../context/LanguageContext';
import { ChevronDown, Sun, Radio } from 'lucide-react';

export default function CategoryNavbar() {
  const location = useLocation();
  const { t, language } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside or escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Primary navigation links explicitly requested
  const primaryNavItems = [
    { label: t('home'), path: '/', slug: '' },
    { label: t('latest'), path: '/category/latest', slug: 'latest' },
    { label: t('national'), path: '/category/national', slug: 'national' },
    { label: t('politics'), path: '/category/politics', slug: 'politics' },
    { label: t('uttar_pradesh'), path: '/category/uttar-pradesh', slug: 'uttar-pradesh' },
    { label: t('world'), path: '/category/world', slug: 'world' },
    { label: t('business'), path: '/category/business', slug: 'business' },
    { label: t('sports'), path: '/category/sports', slug: 'sports' },
    { label: t('entertainment'), path: '/category/entertainment', slug: 'entertainment' },
    { label: t('technology'), path: '/category/technology', slug: 'technology' },
    { label: t('education'), path: '/category/education', slug: 'education' },
    { label: t('jobs'), path: '/category/jobs', slug: 'jobs' },
    { label: t('lifestyle'), path: '/category/lifestyle', slug: 'lifestyle' },
  ];

  // Additional categories in dropdown
  const secondaryNavItems = [
    { label: t('spirituality'), path: '/category/spirituality', slug: 'spirituality' },
    { label: 'पर्यावरण एवं विज्ञान (Science)', path: '/category/science', slug: 'science' },
    { label: 'ऑटोमोबाइल (Auto)', path: '/category/auto', slug: 'auto' },
    { label: 'फोटो गैलरी (Photo Gallery)', path: '/photos', slug: 'photos' },
    { label: 'वीडियो बुलेटिन (Video Bulletin)', path: '/videos', slug: 'videos' },
  ];

  const isCurrentActive = (item) => {
    if (item.path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <nav
      aria-label="Category Navigation"
      className="sticky top-0 z-40 w-full bg-[#1A1A1A] dark:bg-[#090e19] text-white shadow-md border-b-2 border-primary-container transition-colors"
    >
      <Container className="flex items-center justify-between">
        {/* Horizontal Navigation List */}
        <div className="flex items-center overflow-x-auto no-scrollbar whitespace-nowrap">
          {primaryNavItems.map((item) => {
            const active = isCurrentActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2.5 sm:py-3 font-mukta text-sm sm:text-base transition-colors shrink-0 ${
                  active
                    ? 'bg-primary-container text-white font-bold'
                    : 'text-slate-100 hover:bg-primary-container hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {/* More Categories Dropdown Menu */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              className={`px-3 py-2.5 sm:py-3 font-mukta text-sm sm:text-base flex items-center gap-1 transition-colors cursor-pointer ${
                dropdownOpen
                  ? 'bg-primary-container text-white font-bold'
                  : 'text-amber-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{t('more_categories')}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Popup */}
            {dropdownOpen && (
              <div className="absolute left-0 mt-0 w-60 bg-paper-canvas border border-border-heavy shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] uppercase font-bold font-inter text-secondary border-b border-border-rule mb-1">
                  अन्य महत्वपूर्ण श्रेणियां (More Sections)
                </div>
                {secondaryNavItems.map((sec) => (
                  <Link
                    key={sec.path}
                    to={sec.path}
                    onClick={() => setDropdownOpen(false)}
                    className="block px-3.5 py-2 font-mukta text-sm text-on-surface hover:bg-primary-container hover:text-white transition-colors"
                  >
                    {sec.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Weather Dateline & Live Stream CTA */}
        <div className="hidden lg:flex items-center gap-3 shrink-0 pl-3 border-l border-white/20">
          <div className="flex items-center gap-1.5 text-xs font-inter text-slate-300">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('weather_lucknow')}</span>
          </div>

          <Link
            to="/videos"
            className="flex items-center gap-1.5 font-mukta text-xs font-bold text-white bg-primary-container px-2.5 py-1 tracking-wider uppercase hover:bg-primary transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-live-pulse animate-ping"></span>
            <span>{t('live_badge')}</span>
          </Link>
        </div>
      </Container>
    </nav>
  );
}

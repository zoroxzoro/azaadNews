import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Container from '../common/Container';
import BrandLogo from '../common/BrandLogo';
import { categories } from '../../data/categories';
import { useLanguage } from '../../context/LanguageContext';
import { Search, TrendingUp, Tv, Menu, X } from 'lucide-react';

export default function Header({ onOpenMobileMenu }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    let targetUrl = `/search?q=${encodeURIComponent(query)}`;
    if (selectedCategory && selectedCategory !== 'all') {
      targetUrl += `&category=${encodeURIComponent(selectedCategory)}`;
    }
    navigate(targetUrl);
    setMobileSearchOpen(false);
  };

  const trendingTags = [
    { label: '#LokSabha', query: 'LokSabha' },
    { label: '#UPBudget2025', query: 'बजट' },
    { label: '#T20WorldCup', query: 'विश्व कप' },
    { label: '#Ayodhya', query: 'अयोध्या' },
  ];

  return (
    <header className="w-full bg-paper-canvas border-b border-border-rule transition-colors">
      <div className="py-3 sm:py-4">
        <Container className="flex items-center justify-between gap-3 sm:gap-4 lg:gap-6">
          {/* Mobile Left: Menu Toggle & Quick Search */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="p-2 border border-border-rule bg-paper-tint text-on-surface hover:bg-paper-subtle transition-colors cursor-pointer"
              aria-label="मेनू खोलें"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-2 border border-border-rule bg-paper-tint text-on-surface hover:bg-paper-subtle transition-colors sm:hidden cursor-pointer"
              aria-label="खोज बार खोलें"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Left / Center: Brand Logo & Tagline */}
          <div className="flex flex-col justify-center flex-1 lg:flex-none">
            <BrandLogo variant="full" theme="auto" />
            <div className="hidden lg:block font-mukta text-xs text-secondary tracking-wide mt-1 pl-1">
              {t('tagline')}
            </div>
          </div>

          {/* Desktop Center: Prominent Category-Aware Search Bar */}
          <div className="hidden lg:block flex-1 max-w-[460px]">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center border border-border-heavy bg-paper-canvas overflow-hidden shadow-xs focus-within:ring-1 focus-within:ring-primary-container"
            >
              <select
                aria-label={t('all_categories')}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-paper-tint text-on-surface font-inter text-xs px-2.5 py-2 border-r border-border-rule outline-none cursor-pointer"
              >
                <option value="all">{t('all_categories')}</option>
                {categories.slice(0, 8).map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.nameHindi}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full px-3 py-2 font-inter text-xs text-on-surface placeholder:text-secondary focus:outline-none bg-transparent"
              />

              <button
                type="submit"
                aria-label={t('search_btn')}
                className="bg-primary-container hover:bg-primary text-white px-4 py-2 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Desktop Right: Trending Topics & Live TV CTA */}
          <div className="hidden md:flex items-center gap-3 xl:gap-4 shrink-0">
            {/* Trending tags stack */}
            <div className="hidden xl:flex flex-col items-end gap-1">
              <span className="font-inter text-[10px] uppercase tracking-wider text-secondary flex items-center gap-1 font-bold">
                <TrendingUp className="w-3 h-3 text-primary-container" />
                {t('trending_topics')}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-mukta font-bold">
                {trendingTags.map((tag) => (
                  <Link
                    key={tag.label}
                    to={`/search?q=${encodeURIComponent(tag.query)}`}
                    className="bg-paper-subtle hover:bg-paper-tint text-on-surface px-1.5 py-0.5 border border-border-rule hover:border-primary-container transition-colors"
                  >
                    {tag.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Live TV Button */}
            <Link
              to="/videos"
              className="flex items-center gap-1.5 bg-primary-container text-white px-3 py-2 font-mukta font-bold text-xs sm:text-sm tracking-wide uppercase hover:bg-primary transition-colors shrink-0 shadow-sm"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-live-pulse animate-pulse"></span>
              <Tv className="w-4 h-4" />
              <span>{t('live_tv')}</span>
            </Link>
          </div>

          {/* Mobile Right: Video icon shortcut */}
          <div className="flex sm:hidden items-center">
            <Link
              to="/videos"
              className="p-2 bg-primary-container text-white flex items-center justify-center"
              title="लाइव वीडियो"
            >
              <Tv className="w-4 h-4" />
            </Link>
          </div>
        </Container>

        {/* Mobile Expandable Search Bar */}
        {mobileSearchOpen && (
          <div className="sm:hidden px-3 pt-2 pb-1 border-t border-border-rule mt-2 bg-paper-tint">
            <form onSubmit={handleSearchSubmit} className="flex gap-1.5">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                autoFocus
                className="flex-1 px-3 py-1.5 bg-paper-canvas border border-border-rule text-xs font-inter focus:outline-none"
              />
              <button
                type="submit"
                className="bg-primary-container text-white px-3 py-1.5 font-mukta font-bold text-xs cursor-pointer"
              >
                {t('search_btn')}
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Container from '../common/Container';
import ThemeToggle from '../common/ThemeToggle';
import SocialIcon from '../common/SocialIcon';
import { socialLinks } from '../../data/socialLinks';
import { useLanguage } from '../../context/LanguageContext';
import { Calendar, Newspaper, ExternalLink, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TopBar() {
  const { language, setLanguage, t } = useLanguage();

  // Dynamically formatted Indian date in Asia/Kolkata timezone
  const formattedDate = useMemo(() => {
    try {
      const now = new Date();
      const locale = language === 'en' ? 'en-IN' : 'hi-IN';
      const dateString = new Intl.DateTimeFormat(locale, {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now);

      const samvatYear = now.getFullYear() + 57;
      const samvatText = language === 'en' ? `Samvat ${samvatYear}` : `संवत् ${samvatYear}`;
      const city = t('city_edition');

      return `${city} | ${dateString} | ${samvatText}`;
    } catch (e) {
      return 'कानपुर | मंगलवार, 25 मार्च 2025 | संवत् 2081';
    }
  }, [language, t]);

  // Social platforms to show in top bar
  const topSocial = socialLinks.filter((s) =>
    ['youtube', 'facebook', 'twitter', 'instagram', 'whatsapp'].includes(s.id)
  );

  return (
    <div className="w-full bg-paper-tint border-b border-border-rule text-on-surface select-none transition-colors">
      <Container className="min-h-10 py-1 flex items-center justify-between gap-2 sm:gap-3 text-xs flex-wrap md:flex-nowrap">
        {/* Left: Dynamic Indian Dateline & Live Market Ticker */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden min-w-0">
          {/* Dateline */}
          <span className="flex items-center gap-1.5 font-inter text-secondary text-[11px] sm:text-xs truncate">
            <Calendar className="w-3.5 h-3.5 text-secondary shrink-0 hidden xs:inline" />
            <span className="truncate">{formattedDate}</span>
          </span>
        </div>

        {/* Right: Language Switcher, E-Paper, About, Contact, Social Icons, Theme Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 xl:gap-3.5 font-inter text-xs shrink-0 justify-end">
          {/* Theme Toggle Button */}
          <ThemeToggle size="sm" />

          {/* Language Switcher */}
          <div className="flex items-center border border-border-rule bg-paper-canvas p-0.5 font-inter text-[11px]">
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

          <span className="hidden sm:inline-block h-3.5 w-px bg-border-rule"></span>

          {/* E-Paper Link */}
          <a
            href="#epaper"
            onClick={(e) => {
              e.preventDefault();
              toast('ई-पेपर पीडीएफ संस्करण जल्द उपलब्ध होगा। (E-Paper PDF coming soon)', {
                icon: '📰',
              });
            }}
            className="flex items-center gap-1 text-primary-container font-bold hover:underline text-[11px] sm:text-xs cursor-pointer"
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>{t('epaper')}</span>
          </a>

          {/* Editorial Links (Desktop only) */}
          <div className="hidden xl:flex items-center gap-2.5 text-secondary text-[11px]">
            <span className="h-3 w-px bg-border-rule"></span>
            <Link to="/about" className="hover:text-primary-container transition-colors">
              {t('about_us')}
            </Link>
            <span className="h-3 w-px bg-border-rule"></span>
            <Link to="/contact" className="hover:text-primary-container transition-colors">
              {t('contact_us')}
            </Link>
          </div>

          <span className="hidden md:inline-block h-3.5 w-px bg-border-rule"></span>

          {/* Social Media Icons with Tooltips */}
          <div className="hidden md:flex items-center gap-2 text-secondary">
            {topSocial.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                title={`${item.name} (${item.followers})`}
                className="hover:scale-110 transition-transform p-0.5"
                aria-label={item.name}
              >
                <SocialIcon platform={item.id} className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>

          {/* Admin CMS Shortcut */}
          <Link
            to="/admin"
            className="hidden sm:inline-flex items-center gap-1 text-secondary hover:text-primary-container transition-colors text-[11px] ml-1"
            title="संपादकीय CMS पोर्टल"
          >
            <Shield className="w-3 h-3 text-primary-container" />
            <span className="hidden lg:inline">{t('admin_cms')}</span>
          </Link>
        </div>
      </Container>
    </div>
  );
}

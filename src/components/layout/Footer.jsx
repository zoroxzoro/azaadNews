import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Container from '../common/Container';
import BrandLogo from '../common/BrandLogo';
import SocialIcon from '../common/SocialIcon';
import ThemeToggle from '../common/ThemeToggle';
import { socialLinks } from '../../data/socialLinks';
import { useLanguage } from '../../context/LanguageContext';
import {
  CheckCircle2,
  Mail,
  Send,
  MapPin,
  FileText,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('कृपया वैध ईमेल आईडी दर्ज करें (Please enter a valid email)');
      return;
    }
    setIsSubscribed(true);
    toast.success('धन्यवाद! आप दैनिक बुलेटिन की सूची में शामिल हो गए हैं।');
    setEmail('');
    setTimeout(() => setIsSubscribed(false), 5000);
  };

  const quickCategoryLinks = [
    { label: t('home'), to: '/' },
    { label: t('latest'), to: '/category/latest' },
    { label: t('national'), to: '/category/national' },
    { label: t('uttar_pradesh'), to: '/category/uttar-pradesh' },
    { label: t('politics'), to: '/category/politics' },
    { label: t('sports'), to: '/category/sports' },
    { label: t('business'), to: '/category/business' },
  ];

  const companyLinks = [
    { label: t('about_us'), to: '/about' },
    { label: t('contact_us'), to: '/contact' },
    { label: t('advertise_with_us'), to: '/advertise' },
    { label: t('editorial_policy'), to: '/editorial-policy' },
    { label: t('privacy_policy'), to: '/privacy-policy' },
    { label: t('terms_conditions'), to: '/terms-and-conditions' },
    { label: t('fact_check_policy'), to: '/fact-check-policy' },
    { label: t('grievance_redressal'), to: '/grievance' },
  ];

  return (
    <footer className="w-full bg-[#10264B] dark:bg-[#070c14] text-white border-t-4 border-primary-container pt-10 sm:pt-14 pb-8 transition-colors select-none">
      <Container className="space-y-10 px-4 sm:px-6">
        {/* Top Section: 4-Column Editorial Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-white/15">
          {/* Col 1: Brand Logo, Credo & Addresses */}
          <div className="space-y-4">
            <BrandLogo variant="full" theme="dark" />

            <p className="font-mukta text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
              {t('brand_desc')}
            </p>

            <div className="bg-white/5 border border-white/10 p-3 space-y-1 text-xs font-inter">
              <span className="font-bold text-amber-400 block font-mono text-[11px]">
                {t('rni_reg')}
              </span>
              <div className="text-slate-300 text-[11px] space-y-1 pt-1">
                <p>
                  <strong className="text-white">{t('headquarters')}:</strong> {t('hq_address')}
                </p>
                <p>
                  <strong className="text-white">{t('regional_center')}:</strong> {t('regional_address')}
                </p>
              </div>
            </div>

            {/* Social Icons Strip */}
            <div className="flex items-center gap-2 pt-1">
              {socialLinks.slice(0, 5).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  title={`${item.name} (${item.followers})`}
                  className="w-8 h-8 rounded-none bg-white/10 hover:bg-primary-container flex items-center justify-center transition-colors"
                  aria-label={item.name}
                >
                  <SocialIcon platform={item.id} className="w-4 h-4 text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Quick News Categories */}
          <div>
            <h3 className="font-mukta text-base sm:text-lg font-bold text-white border-b-2 border-primary-container pb-1 mb-3 flex items-center justify-between">
              <span>{t('key_categories')}</span>
            </h3>
            <ul className="flex flex-col gap-1.5 font-mukta text-sm text-slate-300">
              {quickCategoryLinks.map((cat) => (
                <li key={cat.to} className="border-b border-white/5 pb-1">
                  <Link
                    to={cat.to}
                    className="hover:text-white hover:underline flex items-center justify-between transition-colors py-0.5"
                  >
                    <span>{cat.label}</span>
                    <span className="text-xs text-slate-500">›</span>
                  </Link>
                </li>
              ))}
              <li className="pt-1">
                <Link
                  to="/videos"
                  className="text-amber-300 font-bold hover:underline flex items-center gap-1 text-xs"
                >
                  <span>▶ {t('video_bulletin')}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Company & Editorial Policies */}
          <div>
            <h3 className="font-mukta text-base sm:text-lg font-bold text-white border-b-2 border-primary-container pb-1 mb-3 flex items-center justify-between">
              <span>{t('company_policies')}</span>
            </h3>
            <ul className="flex flex-col gap-1.5 font-mukta text-sm text-slate-300">
              {companyLinks.map((link) => (
                <li key={link.to} className="border-b border-white/5 pb-1">
                  <Link
                    to={link.to}
                    className="hover:text-white transition-colors flex items-center justify-between py-0.5"
                  >
                    <span>{link.label}</span>
                    <span className="text-xs text-slate-500">›</span>
                  </Link>
                </li>
              ))}
              <li className="pt-1">
                <Link
                  to="/admin/login"
                  className="text-primary-container dark:text-red-400 font-bold hover:underline inline-flex items-center gap-1 text-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t('admin_cms')} (Portal)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Newsletter & Daily Digest Subscription */}
          <div className="space-y-3">
            <h3 className="font-mukta text-base sm:text-lg font-bold text-white border-b-2 border-primary-container pb-1 mb-3">
              {t('newsletter_title')}
            </h3>

            <p className="font-mukta text-xs text-slate-300 leading-relaxed">
              {t('newsletter_desc')}
            </p>

            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <div className="flex">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('email_placeholder')}
                  required
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 text-white placeholder:text-slate-400 font-inter text-xs focus:outline-none focus:bg-white/20"
                />
                <button
                  type="submit"
                  className="bg-primary-container hover:bg-primary text-white font-mukta font-bold text-xs sm:text-sm px-4 py-2 transition-colors cursor-pointer shrink-0"
                >
                  {isSubscribed ? 'धन्यवाद! ✓' : t('subscribe_btn')}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block font-inter">
                सच्ची और निष्पक्ष पत्रकारिता • कोई स्पैम नहीं।
              </span>
            </form>

            <div className="pt-2">
              <span className="font-inter text-[10px] uppercase font-bold text-slate-400 block mb-1 tracking-wider">
                थीम विकल्प (Theme Preference):
              </span>
              <ThemeToggle showLabel={true} size="sm" />
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Accreditation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-inter text-slate-400 text-center sm:text-left">
          <p>© {currentYear} {t('copyright_text')}</p>

          <div className="flex items-center gap-4 text-[11px] shrink-0">
            <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('verified_portal')}</span>
            </span>
            <span>•</span>
            <span>डिजिटल ब्रॉडशीट v2.0</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}

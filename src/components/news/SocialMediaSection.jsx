import React, { useState } from 'react';
import { socialLinks } from '../../data/socialLinks';
import SocialIcon from '../common/SocialIcon';
import { Mail, CheckCircle2, Globe } from 'lucide-react';

/**
 * SocialMediaSection component
 * Connect strip for social platforms and morning newsletter subscription
 */
export default function SocialMediaSection({ className = '' }) {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubscribed(true);
    setTimeout(() => {
      setEmail('');
      setIsSubscribed(false);
    }, 4000);
  };

  return (
    <section className={`w-full bg-paper-tint border-2 border-border-rule p-4 sm:p-5 lg:p-6 shadow-xs ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Social Channels Badge Bar (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary-container" />
            <h3 className="font-mukta text-lg sm:text-xl font-bold text-on-surface">
              आज़ाद समाचार से सीधे जुड़ें
            </h3>
          </div>
          <p className="font-inter text-xs text-secondary leading-relaxed">
            सोशल मीडिया और डिजिटल मैसेजिंग ऐप पर आज़ाद समाचार के आधिकारिक चैनलों से सीधे जुड़ें।
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {socialLinks.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2 bg-paper-canvas border border-border-rule hover:border-primary-container transition-all group"
              >
                <div className="shrink-0 text-on-surface group-hover:scale-110 transition-transform">
                  <SocialIcon name={item.id} size={20} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-inter text-xs font-bold text-on-surface truncate group-hover:text-primary-container transition-colors">
                    {item.name}
                  </span>
                  <span className="font-inter text-[10px] text-secondary truncate">
                    {item.handle || 'फॉलो करें'}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Newsletter Subscription Box (6 Cols) */}
        <div className="lg:col-span-6 bg-paper-canvas p-4 sm:p-5 border border-border-rule shadow-inner flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary-container" />
            <span className="font-mukta text-base sm:text-lg font-bold text-on-surface">
              सुबह 7 बजे का 'आज़ाद प्रभात' बुलेटिन
            </span>
          </div>

          <p className="font-inter text-xs text-secondary leading-relaxed">
            हर सुबह आपके इनबॉक्स में दिन की 10 सबसे महत्वपूर्ण खबरें, निष्पक्ष विश्लेषण और बाज़ार का सटीक रुख।
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="अपना ईमेल आईडी दर्ज करें (उदा. namaste@email.com)"
              required
              className="w-full px-3 py-2 bg-paper-tint border border-border-heavy text-xs sm:text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-1 focus:ring-primary-container"
            />
            <button
              type="submit"
              disabled={isSubscribed}
              className={`font-inter text-xs sm:text-sm px-5 py-2 font-bold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                isSubscribed
                  ? 'bg-emerald-600 text-white'
                  : 'bg-primary-container text-white hover:bg-primary'
              }`}
            >
              {isSubscribed ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> धन्यवाद! ✓
                </span>
              ) : (
                'सदस्य बनें'
              )}
            </button>
          </form>

          <span className="font-inter text-[10px] sm:text-[11px] text-secondary">
            हम स्पैम नहीं भेजते। किसी भी समय सदस्यता रद्द कर सकते हैं।
          </span>
        </div>
      </div>
    </section>
  );
}

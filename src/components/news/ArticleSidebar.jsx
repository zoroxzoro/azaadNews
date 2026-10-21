import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Zap, Mail, ArrowRight, CheckCircle2, Newspaper } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRelativeTime } from '../../utils/timezoneUtils';

/**
 * ArticleSidebar Component
 * Stitch desktop 4-column reading companion:
 * - Live Trending Top 5 (populated with real published articles)
 * - IAB 300x250 Clearly Identified Sponsored Ad Slot Placeholder
 * - Opinion & Columnists Mini-Stack
 * - Chronological Live Newsroom Wire Bulletin
 * - Daily Briefing Newsletter Subscription
 */
export default function ArticleSidebar({ trendingArticles = [], className = '' }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    toast.success('धन्यवाद! दैनिक आज़ाद ब्रीफिंग की सदस्यता सक्रिय हो गई है।');
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 4000);
  };

  const liveTimeline = [
    { time: 'लाइव', text: 'उत्तर प्रदेश: प्रशासनिक व्यवस्था एवं विकास परियोजनाओं की उच्चस्तरीय समीक्षा।' },
    { time: 'ताज़ा', text: 'संसद सत्र: राष्ट्रीय नीतियों एवं जनहित के प्रमुख मुद्दों पर विचार-विमर्श जारी।' },
    { time: 'ब्यूरो', text: 'मौसम विभाग: राज्य के विभिन्न अंचलों में आगामी 48 घंटों हेतु विशेष बुलेटिन जारी।' },
  ];

  const columnists = [
    {
      name: 'संपादकीय दृष्टि',
      role: 'विशेष स्तंभकार',
      title: 'लोकतांत्रिक संस्थाएं और निष्पक्ष पत्रकारिता का संवैधानिक दायित्व',
    },
    {
      name: 'आर्थिक विश्लेषण',
      role: 'वरिष्ठ समीक्षक',
      title: 'ग्रामीण अर्थव्यवस्था और स्थानीय उद्योगों के विकास की ठोस रूपरेखा',
    },
  ];

  return (
    <aside className={`flex flex-col gap-6 font-inter ${className}`}>
      {/* 1. Live Trending Desk (Top 5 Numbered Stories from Real Articles) */}
      <section className="w-full bg-paper-tint border-t-4 border-primary-container border-x border-b border-border-rule p-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-border-rule">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-ping shrink-0" />
            <h3 className="font-mukta text-base font-bold text-on-surface uppercase tracking-wide">
              ट्रेंडिंग आज़ाद (Top 5)
            </h3>
          </div>
          <span className="font-inter text-[10px] text-primary-container font-bold flex items-center gap-0.5">
            <Flame className="w-3.5 h-3.5 fill-current" />
            लाइव
          </span>
        </div>

        <div className="flex flex-col divide-y divide-border-rule">
          {trendingArticles.length > 0 ? (
            trendingArticles.slice(0, 5).map((story, idx) => (
              <div key={story.id || idx} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3 group">
                <span className={`font-mukta text-2xl font-black leading-none w-7 shrink-0 ${
                  idx === 0 ? 'text-primary-container' : 'text-secondary/40'
                }`}>
                  0{idx + 1}
                </span>
                <div className="flex flex-col flex-1 min-w-0">
                  <Link
                    to={`/news/${story.slug}`}
                    className="font-mukta text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary-container transition-colors line-clamp-2 leading-snug break-words"
                  >
                    {story.title}
                  </Link>
                  <span className="font-inter text-[10px] text-secondary mt-1">
                    {story.author?.name || 'आज़ाद ब्यूरो'} • {formatRelativeTime(story.publishedAt || story.createdAt) || story.readTime || 'ताज़ा'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="font-inter text-xs text-secondary py-3 text-center">
              ट्रेंडिंग समाचार संकलित किए जा रहे हैं...
            </p>
          )}
        </div>
      </section>

      {/* 2. Clearly Identified Sponsored Editorial Ad Slot Placeholder (Strict IAB 300x250) */}
      <div className="w-full flex flex-col items-center">
        <span className="font-inter text-[9px] uppercase tracking-widest text-secondary mb-1">
          विज्ञापन / SPONSORED DISCLOSURE
        </span>
        <div className="w-full bg-paper-tint border border-border-rule p-4 flex flex-col items-center text-center shadow-xs">
          <span className="font-inter text-[10px] text-primary-container font-bold mb-1 uppercase tracking-wider">
            आज़ाद समाचार डिजिटल नेटवर्क
          </span>
          <h4 className="font-mukta text-sm font-bold text-on-surface mb-2 leading-snug">
            निष्पक्ष पत्रकारिता का डिजिटल मंच • भारत भर में 10,000+ खबरों का संग्रह
          </h4>
          <div className="w-full h-32 bg-surface-container overflow-hidden border border-border-rule mb-3 relative flex flex-col items-center justify-center p-3 text-center">
            <Newspaper className="w-8 h-8 text-primary-container/70 mb-1" />
            <span className="font-mukta text-xs font-bold text-on-surface">आज़ाद ई-अखबार एवं विशेषांक</span>
            <span className="font-inter text-[10px] text-secondary">दैनिक डिजिटल संस्करण</span>
          </div>
          <Link
            to="/category/latest"
            className="w-full py-1.5 bg-border-heavy text-white font-inter text-xs hover:bg-primary-container transition-colors block font-semibold"
          >
            ताज़ा बुलेटिन पढ़ें →
          </Link>
        </div>
      </div>

      {/* 3. Azaad Opinion & Editorial Columnists Mini-Stack */}
      <section className="w-full bg-paper-canvas border border-border-rule p-4 shadow-xs">
        <div className="flex items-center justify-between border-b-2 border-border-heavy pb-2 mb-3">
          <h3 className="font-mukta text-sm font-bold text-on-surface flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-primary-container inline-block" />
            <span>संपादकीय विचार एवं विश्लेषण</span>
          </h3>
          <Link to="/category/latest" className="font-inter text-[11px] text-primary-container hover:underline font-bold">
            विस्तार से →
          </Link>
        </div>

        <div className="flex flex-col divide-y divide-border-rule">
          {columnists.map((col, idx) => (
            <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3 group">
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-border-rule bg-paper-tint flex items-center justify-center font-mukta font-bold text-primary-container text-xs">
                {col.name.charAt(0)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-inter text-[10px] text-primary-container font-bold">
                  {col.name} • {col.role}
                </span>
                <span className="font-mukta text-xs font-bold text-on-surface line-clamp-2 leading-snug mt-0.5 break-words">
                  {col.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Chronological Live Wire Bulletin */}
      <section className="w-full bg-paper-tint border border-border-rule p-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-border-rule">
          <h3 className="font-mukta text-sm font-bold text-on-surface flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary-container" />
            <span>न्यूज़रूम वायर (Live Feed)</span>
          </h3>
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
        </div>

        <div className="flex flex-col gap-3 relative before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-[2px] before:bg-border-rule">
          {liveTimeline.map((item, idx) => (
            <div key={idx} className="relative pl-6 flex flex-col gap-0.5">
              <span className={`absolute left-[7px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-paper-canvas ${
                idx === 0 ? 'bg-primary-container' : 'bg-secondary/40'
              }`} />
              <span className="font-inter text-[10px] text-primary-container font-bold">
                {item.time}
              </span>
              <p className="font-inter text-xs text-on-surface leading-snug break-words">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Daily Briefing Newsletter Subscription Widget */}
      <section className="w-full bg-[#10264B] text-white p-4 border-t-4 border-primary-container shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-red-400" />
          <h4 className="font-mukta text-sm font-bold text-white">दैनिक आज़ाद ब्रीफिंग</h4>
        </div>
        <p className="font-inter text-xs text-neutral-300 mb-3 leading-relaxed">
          देश और दुनिया के सबसे प्रामाणिक समाचार सीधे आपके इनबॉक्स में।
        </p>

        <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="आपका ईमेल पता दर्ज करें..."
            required
            className="w-full px-3 py-1.5 bg-paper-canvas text-on-surface font-inter text-xs border-0 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full py-2 bg-primary-container text-white font-inter text-xs uppercase tracking-wider font-bold hover:bg-red-700 transition-colors cursor-pointer"
          >
            {subscribed ? (
              <span className="flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> सब्सक्राइब हुआ!
              </span>
            ) : (
              'निःशुल्क सब्सक्राइब करें'
            )}
          </button>
        </form>
      </section>
    </aside>
  );
}

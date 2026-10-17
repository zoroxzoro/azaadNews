import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Zap, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * ArticleSidebar component
 * Matches the Stitch desktop 4-column reading companion:
 * - Live Trending Top 5
 * - IAB 300x250 Sponsored Editorial Ad Spot
 * - Opinion & Columnists Mini-Stack
 * - Chronological Live Wire Bulletin
 * - Daily Briefing Newsletter
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
    { time: '01:40 PM', text: 'उद्योग मंत्रालय ने सेमीकंडक्टर पोर्टल 2.0 का सिंगल विंडो डैशबोर्ड लाइव किया।' },
    { time: '01:10 PM', text: 'यूपी कैबिनेट: बुंदेलखंड एक्सप्रेसवे पर इंडस्ट्रियल क्लस्टर हेतु 2,000 एकड़ अतिरिक्त भूमि अधिसूचित।' },
    { time: '12:35 PM', text: 'लोकसभा की कार्यवाही कल सुबह 11 बजे तक के लिए स्थगित।' },
  ];

  const columnists = [
    {
      name: 'डॉ. सुनीति शर्मा',
      role: 'वरिष्ठ अर्थशास्त्री',
      title: 'क्या सेमीकंडक्टर सब्सिडी से घरेलू छोटे उद्यमियों को भी लाभ मिल पाएगा?',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
    },
    {
      name: 'विक्रमादित्य राव',
      role: 'संविधान विशेषज्ञ',
      title: 'संसद में नीतिगत बहस का गिरता स्तर और सर्वदलीय आम सहमति का दुर्लभ महत्व',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    },
  ];

  return (
    <aside className={`flex flex-col gap-6 ${className}`}>
      {/* 1. Live Trending Desk (Top 5 Numbered Stories) */}
      <section className="w-full bg-paper-tint border-t-4 border-primary-container border-x border-b border-border-rule p-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-border-rule">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container animate-ping" />
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
          {trendingArticles.slice(0, 5).map((story, idx) => (
            <div key={story.id || idx} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3 group">
              <span className={`font-mukta text-2xl font-black leading-none w-7 shrink-0 ${
                idx === 0 ? 'text-primary-container' : 'text-secondary/40'
              }`}>
                0{idx + 1}
              </span>
              <div className="flex flex-col flex-1 min-w-0">
                <Link
                  to={`/news/${story.slug}`}
                  className="font-mukta text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary-container transition-colors line-clamp-2 leading-snug"
                >
                  {story.title}
                </Link>
                <span className="font-inter text-[10px] text-secondary mt-1">
                  {story.author?.location || 'राष्ट्रीय'} • {story.readTime || '3 मिनट'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Sponsored Editorial Ad Slot (Strict IAB 300x250) */}
      <div className="w-full flex flex-col items-center">
        <span className="font-inter text-[9px] uppercase tracking-widest text-secondary mb-1">
          विज्ञापन / SPONSORED DISCLOSURE
        </span>
        <div className="w-full bg-paper-tint border border-border-rule p-4 flex flex-col items-center text-center shadow-xs">
          <span className="font-inter text-[10px] text-primary-container font-bold mb-1">
            इन्वेस्ट इन इंडिया समिट 2025
          </span>
          <h4 className="font-mukta text-sm font-bold text-on-surface mb-2 leading-snug">
            वैश्विक विनिर्माताओं का सबसे बड़ा मंच नई दिल्ली में
          </h4>
          <div className="w-full h-32 bg-surface-container overflow-hidden border border-border-rule mb-3 relative">
            <img
              src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=600&q=80"
              alt="ग्लोबल समिट"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
          <Link
            to="/epaper"
            className="w-full py-1.5 bg-border-heavy text-white font-inter text-xs hover:bg-primary-container transition-colors block font-semibold"
          >
            प्रतिनिधि पंजीकरण करें →
          </Link>
        </div>
      </div>

      {/* 3. Azaad Opinion & Editorial Columnists Mini-Stack */}
      <section className="w-full bg-paper-canvas border border-border-rule p-4 shadow-xs">
        <div className="flex items-center justify-between border-b-2 border-border-heavy pb-2 mb-3">
          <h3 className="font-mukta text-sm font-bold text-on-surface flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-primary-container inline-block" />
            <span>विचार एवं दृष्टिकोण</span>
          </h3>
          <Link to="/category/opinion" className="font-inter text-[11px] text-primary-container hover:underline font-bold">
            सभी विचार →
          </Link>
        </div>

        <div className="flex flex-col divide-y divide-border-rule">
          {columnists.map((col, idx) => (
            <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3 group">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border-rule">
                <img src={col.avatar} alt={col.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-inter text-[10px] text-primary-container font-bold">
                  {col.name} • {col.role}
                </span>
                <Link
                  to="/category/opinion"
                  className="font-mukta text-xs font-bold text-on-surface hover:text-primary-container transition-colors line-clamp-2 leading-snug mt-0.5"
                >
                  {col.title}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Chronological Live Wire Bulletin (Minute-by-Minute) */}
      <section className="w-full bg-paper-tint border border-border-rule p-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-border-rule">
          <h3 className="font-mukta text-sm font-bold text-on-surface flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary-container" />
            <span>ताज़ा बुलेटिन (Live Feed)</span>
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
                {item.time} IST
              </span>
              <p className="font-inter text-xs text-on-surface leading-snug">
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
          सुबह 7 बजे देश और दुनिया के सबसे प्रामाणिक 10 समाचार सीधे आपके इनबॉक्स में।
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

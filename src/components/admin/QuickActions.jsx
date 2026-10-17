import React from 'react';
import { Link } from 'react-router-dom';
import { PenSquare, Newspaper, CalendarClock, ImageIcon, ExternalLink, Sparkles } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    {
      to: '/admin/news/create',
      titleHindi: 'नया समाचार लिखें',
      titleEnglish: 'Write Article',
      desc: 'नया आलेख या ब्रेकिंग बुलेटिन ड्राफ्ट करें',
      icon: PenSquare,
      bg: 'bg-primary-container text-white',
      primary: true,
    },
    {
      to: '/admin/news',
      titleHindi: 'सभी समाचार प्रबंधित करें',
      titleEnglish: 'All Articles',
      desc: 'आलेख सूची देखें, संशोधित करें या फिल्टर करें',
      icon: Newspaper,
      bg: 'bg-[#10264B] text-white',
    },
    {
      to: '/admin/scheduled',
      titleHindi: 'शेड्यूल्ड कैलेंडर',
      titleEnglish: 'Scheduled Queue',
      desc: 'आगामी 24 घंटे का प्रकाशन कार्यक्रम',
      icon: CalendarClock,
      bg: 'bg-amber-700 text-white',
    },
    {
      to: '/admin/media',
      titleHindi: 'मीडिया लाइब्रेरी',
      titleEnglish: 'Media Assets',
      desc: 'फोटो गैलरी एवं डिजिटल प्रेस एसेट्स',
      icon: ImageIcon,
      bg: 'bg-slate-700 text-white',
    },
  ];

  return (
    <div className="bg-paper-canvas border border-border-rule p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border-rule">
        <h3 className="font-mukta text-sm sm:text-base font-bold text-on-surface flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary-container" />
          <span>त्वरित संपादकीय कार्य (Quick Actions)</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.to}
              to={act.to}
              className={`p-3 border transition-all flex items-start gap-2.5 group ${
                act.primary
                  ? 'border-primary-container/40 bg-ticker-tint hover:bg-ticker-tint/80'
                  : 'border-border-rule bg-paper-tint hover:bg-paper-canvas hover:border-border-heavy'
              }`}
            >
              <div className={`p-2 rounded shrink-0 ${act.bg} shadow-2xs`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-mukta text-xs sm:text-sm font-bold text-on-surface block leading-tight group-hover:text-primary-container transition-colors">
                  {act.titleHindi}
                </span>
                <span className="text-[10px] font-inter text-secondary block mt-0.5 leading-snug">
                  {act.desc}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

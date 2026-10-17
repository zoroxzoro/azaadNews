import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * LiveCricketWidget component
 * Matching the ICC T20 live match scorecard banner from Stitch homepage
 */
export default function LiveCricketWidget({ className = '' }) {
  return (
    <div
      className={`w-full bg-[#1A1A1A] text-white border-l-4 border-primary-container px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md ${className}`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
        <span className="flex items-center gap-1.5 bg-primary-container text-white font-inter text-[10px] sm:text-[11px] font-bold px-2 py-0.5 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
          लाइव मैच
        </span>

        <span className="font-mukta text-xs sm:text-sm font-semibold text-neutral-300">
          ICC पुरुष T20 विश्व कप • सेमीफाइनल (बारबाडोस)
        </span>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 flex-wrap font-inter text-xs sm:text-sm">
        {/* Teams & Scores */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white">भारत 🇮🇳</span>
            <span className="font-mono text-emerald-400 font-bold">205/5</span>
            <span className="text-[10px] text-neutral-400">(20.0 ov)</span>
          </div>

          <span className="text-neutral-500 font-bold">vs</span>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white">ऑस्ट्रेलिया 🇦🇺</span>
            <span className="font-mono text-amber-400 font-bold">181/7</span>
            <span className="text-[10px] text-neutral-400">(18.4 ov)</span>
          </div>
        </div>

        {/* Live Equation */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <span className="text-neutral-400">•</span>
          <span className="text-primary-200 font-medium font-mukta">
            ऑस्ट्रेलिया को जीत के लिए 8 गेंदों में 25 रन चाहिए
          </span>
        </div>

        {/* Action Link */}
        <Link
          to="/category/sports"
          className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-primary-200 hover:text-white font-semibold transition-colors underline decoration-primary-container"
        >
          <span>बॉल-बाय-बॉल कमेंट्री</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

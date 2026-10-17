import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, CheckCircle, ChevronRight, PenTool } from 'lucide-react';

/**
 * FactCheckAndOpinions component
 * Two-pillar editorial row from Stitch:
 * - Left: Fact-check verification debunking viral fakes
 * - Right: Editorial opinion columns from leading analysts
 */
export default function FactCheckAndOpinions({ className = '' }) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start ${className}`}>
      {/* FACT CHECK DESK (6 Cols) */}
      <section className="lg:col-span-6 bg-paper-canvas p-4 sm:p-5 shadow-xs border-t-4 border-primary-container">
        <div className="flex items-center justify-between border-b border-border-rule pb-2 mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary-container" />
            <h3 className="font-mukta text-lg sm:text-xl font-bold text-on-surface">
              आज़ाद फैक्ट चेक • सत्यता जांच
            </h3>
          </div>
          <span className="bg-paper-subtle text-secondary font-inter text-[10px] font-bold px-2 py-0.5 border border-border-rule">
            सत्यापित पत्रकारिता
          </span>
        </div>

        <div className="bg-paper-tint p-4 border border-border-rule flex flex-col gap-3">
          {/* Debunk Stamp */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 font-inter text-xs bg-red-600 text-white px-2.5 py-0.5 font-bold tracking-wider uppercase">
              झूठा दावा / FAKE
            </span>
            <span className="font-inter text-[11px] text-secondary">
              जांच तिथि: 25 मार्च 2025
            </span>
          </div>

          {/* Viral Claim */}
          <div className="border-l-4 border-red-600 pl-3">
            <span className="font-inter text-[10px] uppercase tracking-wider text-secondary font-bold">
              वायरल दावा:
            </span>
            <p className="font-mukta text-xs sm:text-sm font-bold text-on-surface mt-0.5 leading-snug">
              "सरकार सभी नागरिकों के बैंक खातों में बिना शर्त ₹10,000 की 'राहत राशि' भेज रही है - वायरल लिंक पर क्लिक करें"
            </p>
          </div>

          {/* Fact Check Verdict */}
          <div className="bg-paper-canvas p-3 border border-border-rule flex flex-col gap-1">
            <span className="font-inter text-[11px] uppercase tracking-wider text-primary-container font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> पड़ताल व सच्चाई:
            </span>
            <p className="font-inter text-xs text-secondary leading-relaxed">
              प्रेस इंफॉर्मेशन ब्यूरो (PIB) और वित्त मंत्रालय ने पुष्टि की है कि ऐसी कोई योजना संचालित नहीं है। यह लिंक एक फिशिंग और बैंक फ्रॉड का प्रयास है। किसी भी अनधिकृत लिंक पर अपनी बैंकिंग जानकारी साझा न करें।
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <Link
              to="/category/fact-check"
              className="text-primary-container font-inter text-xs font-bold hover:underline flex items-center gap-1"
            >
              <span>पूरी पड़ताल रिपोर्ट पढ़ें →</span>
            </Link>
            <span className="font-inter text-[10px] text-secondary">
              सत्यता रेटिंग: ०/१० (पूर्णतः भ्रामक)
            </span>
          </div>
        </div>

        {/* Second Quick Fact Check */}
        <div className="mt-3 pt-3 border-t border-border-rule flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-inter text-[10px] text-red-600 font-bold">फैक्ट चेक: भ्रामक</span>
            <Link
              to="/category/fact-check"
              className="font-mukta text-xs sm:text-sm font-bold text-on-surface hover:text-primary-container transition-colors"
            >
              क्या 500 रुपये के नए नोटों पर हरी पट्टी की स्थिति को लेकर RBI ने नया नियम जारी किया है?
            </Link>
          </div>
          <ChevronRight className="w-4 h-4 text-secondary shrink-0" />
        </div>
      </section>

      {/* EDITORIAL OPINION & COLUMNS (6 Cols) */}
      <section className="lg:col-span-6 bg-paper-canvas p-4 sm:p-5 shadow-xs border-t-4 border-[#10264B]">
        <div className="flex items-center justify-between border-b border-border-rule pb-2 mb-3">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-on-surface" />
            <h3 className="font-mukta text-lg sm:text-xl font-bold text-on-surface">
              संपादकीय व विचार मंच
            </h3>
          </div>
          <Link
            to="/category/opinion"
            className="text-primary-container font-inter text-xs font-bold hover:underline flex items-center gap-0.5"
          >
            <span>सभी कॉलम</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex flex-col divide-y divide-border-rule">
          {/* Column 1: Chief Editor */}
          <article className="pb-3 flex gap-3.5 items-start group">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-surface-container shrink-0 border-2 border-border-rule mt-1">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80"
                alt="राजेश कुमार बाजपेयी"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-inter text-[10px] text-primary-container font-bold uppercase tracking-wider">
                संपादक की कलम से
              </span>
              <Link
                to="/category/opinion"
                className="font-mukta text-sm sm:text-base font-bold text-on-surface group-hover:text-primary-container transition-colors leading-snug mt-0.5"
              >
                लोकतांत्रिक संस्थाएं, जनविश्वास और पारदर्शी शासन की अनिवार्यता
              </Link>
              <p className="font-inter text-xs text-secondary line-clamp-2 mt-1 leading-relaxed">
                नीतियों का मूल्यांकन तात्कालिक राजनीतिक लाभ के बजाय राष्ट्र के दीर्घकालिक बुनियादी हितों की कसौटी पर किया जाना समय की मांग है।
              </p>
              <div className="flex items-center gap-2 mt-1.5 font-inter text-[10px] text-secondary">
                <span className="font-bold text-on-surface">राजेश कुमार बाजपेयी</span>
                <span>•</span>
                <span>प्रधान संपादक</span>
              </div>
            </div>
          </article>

          {/* Column 2: Economic Analyst */}
          <article className="pt-3 flex gap-3.5 items-start group">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-surface-container shrink-0 border-2 border-border-rule mt-1">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80"
                alt="डॉ. नीरजा सक्सेना"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-inter text-[10px] text-primary-container font-bold uppercase tracking-wider">
                आर्थिक समीक्षा
              </span>
              <Link
                to="/category/opinion"
                className="font-mukta text-sm sm:text-base font-bold text-on-surface group-hover:text-primary-container transition-colors leading-snug mt-0.5"
              >
                विकास दर 7.2% के पार रहने के मायने: क्या जमीनी आय में आ रहा है सुधार?
              </Link>
              <p className="font-inter text-xs text-secondary line-clamp-2 mt-1 leading-relaxed">
                सकल घरेलू उत्पाद में उछाल के साथ ग्रामीण मांग और निजी पूंजी निवेश के तालमेल को समझना जरूरी है।
              </p>
              <div className="flex items-center gap-2 mt-1.5 font-inter text-[10px] text-secondary">
                <span className="font-bold text-on-surface">डॉ. नीरजा सक्सेना</span>
                <span>•</span>
                <span>वरिष्ठ अर्थशास्त्री</span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

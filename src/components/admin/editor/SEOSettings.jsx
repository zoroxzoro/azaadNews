import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Copy, Check, Globe, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SEOSettings({
  slug = '',
  seoTitle = '',
  metaDescription = '',
  socialImage = '',
  category = 'national',
  fallbackTitle = '',
  fallbackSummary = '',
  onChange,
  onManualSlugEdit,
  error,
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const displayTitle = (seoTitle || fallbackTitle || 'शीर्षक यहाँ प्रदर्शित होगा').trim();
  const displayDesc = (metaDescription || fallbackSummary || 'समाचार का मेटा विवरण यहाँ खोज इंजन स्निपेट में प्रदर्शित होगा...').trim();
  const displaySlug = (slug || 'story-url-slug').trim();

  const handleCopyUrl = () => {
    const fullUrl = `https://azaadsamachar.com/${category}/${displaySlug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success('यूआरएल क्लिपबोर्ड पर कॉपी किया गया');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-paper-canvas border border-border-rule shadow-xs font-mukta">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-paper-tint transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary-container" />
          <h3 className="text-sm sm:text-base font-bold text-on-surface">
            एसईओ एवं मेटा सेटिंग्स (SEO & Social Meta)
          </h3>
        </div>
        <div className="flex items-center gap-2 text-secondary">
          <span className="font-inter text-[11px]">
            {isOpen ? 'संक्षिप्त करें' : 'विस्तार करें'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-4 pt-0 space-y-4 border-t border-border-rule">
          {/* 1. Google Search Result Mock Snippet */}
          <div className="bg-paper-tint p-3 border border-border-rule space-y-1">
            <span className="font-inter text-[10px] uppercase font-bold text-secondary flex items-center gap-1">
              <Search className="w-3 h-3 text-secondary" />
              गूगल खोज परिणाम पूर्वावलोकन (Search Snippet Preview)
            </span>
            <div className="font-sans text-[11px] text-emerald-800 dark:text-emerald-400 truncate">
              https://azaadsamachar.com › {category} › {displaySlug}
            </div>
            <div className="font-mukta text-sm font-bold text-blue-700 dark:text-blue-400 hover:underline line-clamp-1 cursor-pointer">
              {displayTitle} | आज़ाद समाचार
            </div>
            <p className="font-inter text-xs text-on-surface-variant line-clamp-2 leading-snug">
              {displayDesc}
            </p>
          </div>

          {/* 2. Permalink / Slug Editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-secondary uppercase">
                URL स्लग (Permalink / Slug) *
              </label>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="text-[11px] text-primary-container hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'कॉपी हुआ' : 'लिंक कॉपी करें'}</span>
              </button>
            </div>
            <div className="flex items-center bg-paper-tint border border-border-rule focus-within:bg-paper-canvas focus-within:border-primary-container">
              <span className="px-2 font-mono text-[11px] text-secondary hidden sm:inline select-none">
                /{category}/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  onManualSlugEdit(true);
                  onChange({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-') });
                }}
                placeholder="cabinet-approves-semiconductor-mission"
                className="flex-1 px-2.5 py-1.5 bg-transparent text-xs font-mono text-on-surface focus:outline-none"
              />
            </div>
            {error && (
              <p className="text-breaking-crimson text-xs mt-1 flex items-center gap-1 font-inter">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}
            <span className="block text-[11px] text-secondary mt-1 font-inter">
              केवल लोअरकेस अक्षर, संख्याएं और हाइफन मान्य हैं।
            </span>
          </div>

          {/* 3. SEO Meta Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-secondary uppercase">
                एसईओ शीर्षक (Meta Title)
              </label>
              <span
                className={`text-[10px] font-inter ${
                  (seoTitle.length || fallbackTitle.length) > 60
                    ? 'text-amber-600 font-bold'
                    : 'text-secondary'
                }`}
              >
                {seoTitle.length || fallbackTitle.length} / 60 वर्ण
              </span>
            </div>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => onChange({ seoTitle: e.target.value })}
              placeholder={fallbackTitle || 'शीर्षक छोड़ें तो मुख्य शीर्षक उपयोग होगा...'}
              className="w-full px-2.5 py-1.5 bg-paper-tint border border-border-rule text-xs font-mukta focus:outline-none focus:bg-paper-canvas"
            />
          </div>

          {/* 4. SEO Meta Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-secondary uppercase">
                मेटा विवरण (Meta Description)
              </label>
              <span
                className={`text-[10px] font-inter ${
                  (metaDescription.length || fallbackSummary.length) > 160
                    ? 'text-amber-600 font-bold'
                    : 'text-secondary'
                }`}
              >
                {metaDescription.length || fallbackSummary.length} / 160 वर्ण
              </span>
            </div>
            <textarea
              rows={2}
              value={metaDescription}
              onChange={(e) => onChange({ metaDescription: e.target.value })}
              placeholder={fallbackSummary || 'संक्षिप्त 150-160 वर्णों का विवरण जो खोज इंजनों में दिखेगा...'}
              className="w-full px-2.5 py-1.5 bg-paper-tint border border-border-rule text-xs font-inter focus:outline-none focus:bg-paper-canvas"
            />
          </div>

          {/* 5. Social Share Image URL */}
          <div>
            <label className="block text-xs font-bold text-secondary uppercase mb-1">
              सोशल शेयर इमेज (Open Graph Image URL)
            </label>
            <input
              type="url"
              value={socialImage}
              onChange={(e) => onChange({ socialImage: e.target.value })}
              placeholder="छोड़ें तो मुख्य छायाचित्र (Featured Image) का उपयोग होगा..."
              className="w-full px-2.5 py-1.5 bg-paper-tint border border-border-rule text-xs font-inter focus:outline-none focus:bg-paper-canvas"
            />
          </div>
        </div>
      )}
    </div>
  );
}

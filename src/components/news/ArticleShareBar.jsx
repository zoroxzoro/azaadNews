import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Share2,
  Bookmark,
  Printer,
  Copy,
  Check,
  Send,
} from 'lucide-react';

/**
 * ArticleShareBar Component
 * Action bar providing social sharing, font size controls, bookmarking, and link copying:
 * - Real canonical article URL
 * - WhatsApp, X/Twitter, Facebook, Telegram links
 * - Web Share API on mobile
 * - Accessible aria-labels and touch targets
 * - Zero fake engagement counters
 */
export default function ArticleShareBar({
  article = null,
  title = '',
  slug = '',
  fontSizeLevel = 0,
  setFontSizeLevel,
  className = '',
}) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Concise short URL for social sharing and link copying
  const shortId = article?.legacyWordPressId || article?.id || slug;
  const canonicalBase = 'https://azaadsamacharindia.com';
  const articleUrl = typeof window !== 'undefined' && window.location?.origin
    ? `${window.location.origin}/news/${shortId}`
    : `${canonicalBase}/news/${shortId}`;

  const shareText = encodeURIComponent(`${title} - आज़ाद समाचार`);
  const encodedUrl = encodeURIComponent(articleUrl);

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${shareText}`,
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(articleUrl);
        setIsCopied(true);
        toast.success('लेख लिंक कॉपी किया गया! (Link copied)', { id: 'copy-link' });
        setTimeout(() => setIsCopied(false), 3000);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = articleUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setIsCopied(true);
        toast.success('लेख लिंक कॉपी किया गया!');
        setTimeout(() => setIsCopied(false), 3000);
      }
    } catch {
      toast.error('लिंक कॉपी करने में असमर्थ।');
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: title,
          url: articleUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const toggleBookmark = () => {
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    toast.success(
      nextState ? 'लेख बुकमार्क में सहेजा गया' : 'बुकमार्क से हटाया गया',
      { id: 'bookmark-toast' }
    );
  };

  return (
    <div
      className={`sticky top-0 z-30 w-full bg-paper-canvas/95 backdrop-blur-md border-y border-border-rule shadow-xs px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      {/* Social Share Cluster */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <span className="font-inter text-xs uppercase font-bold text-secondary mr-1">
          साझा करें:
        </span>

        {/* WhatsApp */}
        <a
          href={shareLinks.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="व्हाट्सएप पर साझा करें"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] bg-[#25D366] text-white font-inter text-xs font-bold rounded-none hover:opacity-90 transition-opacity shadow-xs"
          title="व्हाट्सएप पर शेयर करें"
        >
          <span className="text-sm leading-none">💬</span>
          <span>व्हाट्सएप</span>
        </a>

        {/* X / Twitter */}
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 border border-border-rule bg-paper-canvas text-on-surface flex items-center justify-center hover:bg-surface-container transition-colors font-bold text-xs"
          title="X (ट्विटर) पर शेयर करें"
          aria-label="X पर शेयर करें"
        >
          𝕏
        </a>

        {/* Facebook */}
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 border border-border-rule bg-[#1877F2] text-white flex items-center justify-center hover:opacity-90 transition-opacity font-bold text-xs"
          title="फेसबुक पर शेयर करें"
          aria-label="फेसबुक पर शेयर करें"
        >
          f
        </a>

        {/* Telegram */}
        <a
          href={shareLinks.telegram}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 border border-border-rule bg-[#229ED9] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
          title="टेलीग्राम पर भेजें"
          aria-label="टेलीग्राम पर भेजें"
        >
          <Send className="w-3.5 h-3.5" />
        </a>

        {/* Native Web Share Button (if supported) */}
        {typeof navigator !== 'undefined' && navigator.share && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-9 h-9 border border-border-rule bg-paper-tint text-on-surface flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer"
            title="अन्य ऐप्स पर शेयर करें"
            aria-label="शेयर करें"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Typography Scale Adjuster & Utilities */}
      <div className="flex items-center gap-1.5 font-inter">
        {/* Font Decrement */}
        <button
          type="button"
          onClick={() => setFontSizeLevel && setFontSizeLevel((prev) => Math.max(-1, prev - 1))}
          className={`w-9 h-9 border border-border-rule bg-paper-canvas text-on-surface font-mukta text-xs font-bold flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer ${
            fontSizeLevel === -1 ? 'opacity-40 cursor-not-allowed' : ''
          }`}
          title="फॉन्ट छोटा करें (अ-)"
          aria-label="फॉन्ट छोटा करें"
        >
          अ-
        </button>

        {/* Font Increment */}
        <button
          type="button"
          onClick={() => setFontSizeLevel && setFontSizeLevel((prev) => Math.min(2, prev + 1))}
          className={`w-9 h-9 border border-border-rule bg-paper-canvas text-on-surface font-mukta text-sm font-bold flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer ${
            fontSizeLevel === 2 ? 'opacity-40 cursor-not-allowed' : ''
          }`}
          title="फॉन्ट बड़ा करें (अ+)"
          aria-label="फॉन्ट बड़ा करें"
        >
          अ+
        </button>

        {/* Bookmark */}
        <button
          type="button"
          onClick={toggleBookmark}
          className={`w-9 h-9 border border-border-rule bg-paper-canvas flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer ${
            isBookmarked ? 'text-primary-container' : 'text-on-surface'
          }`}
          title="लेख सुरक्षित करें"
          aria-label="बुकमार्क करें"
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>

        {/* Print */}
        <button
          type="button"
          onClick={() => window.print()}
          className="w-9 h-9 border border-border-rule bg-paper-canvas text-on-surface flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer hidden sm:flex"
          title="प्रिंट करें"
          aria-label="लेख प्रिंट करें"
        >
          <Printer className="w-4 h-4" />
        </button>

        {/* Copy Link with Instant Visual Feedback */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="px-3 h-9 border border-border-rule bg-paper-tint hover:bg-surface-container text-on-surface font-inter text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          title="लिंक कॉपी करें"
          aria-label="लिंक कॉपी करें"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600 font-bold">कॉपी हुआ!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-secondary" />
              <span>कॉपी</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

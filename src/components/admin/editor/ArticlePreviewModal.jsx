import React from 'react';
import { X, Eye, Calendar, User, Clock, MapPin, Tag } from 'lucide-react';
import StatusBadge from '../StatusBadge';
import YouTubeEmbed from '../../news/YouTubeEmbed';
import ArticlePhotoGallery from '../../news/ArticlePhotoGallery';
import { extractPlainText, estimateReadTime } from '../../../utils/articleContent';
import { categories } from '../../../data/categories';

export default function ArticlePreviewModal({ isOpen, onClose, articleData }) {
  if (!isOpen || !articleData) return null;

  const currentCategory = categories.find((c) => c.slug === articleData.category);
  const readTime = estimateReadTime(articleData.content, articleData.language);

  // Render content blocks safely
  const renderPreviewBody = () => {
    const content = articleData.content;
    if (!content) {
      return (
        <p className="text-secondary italic font-mukta">
          कोई विस्तृत सामग्री दर्ज नहीं की गई है।
        </p>
      );
    }

    // If it's a TipTap JSON doc
    if (typeof content === 'object' && content.type === 'doc' && Array.isArray(content.content)) {
      return content.content.map((node, i) => {
        if (node.type === 'heading') {
          const TagName = `h${node.attrs?.level || 2}`;
          const text = node.content?.map((c) => c.text).join('') || '';
          return (
            <TagName
              key={i}
              className="font-mukta font-bold text-on-surface my-4 text-xl sm:text-2xl border-b border-border-rule pb-1"
            >
              {text}
            </TagName>
          );
        }

        if (node.type === 'blockquote') {
          const text = node.content?.map((c) => c.content?.map((t) => t.text).join('')).join('\n') || '';
          return (
            <blockquote
              key={i}
              className="border-l-4 border-primary-container pl-4 py-2 my-4 bg-paper-tint italic font-mukta text-lg text-on-surface"
            >
              “{text}”
            </blockquote>
          );
        }

        if (node.type === 'bulletList') {
          return (
            <ul key={i} className="list-disc pl-5 my-3 space-y-1 font-inter text-sm text-on-surface">
              {node.content?.map((li, liIdx) => (
                <li key={liIdx}>{li.content?.map((p) => p.content?.map((t) => t.text).join('')).join('')}</li>
              ))}
            </ul>
          );
        }

        if (node.type === 'orderedList') {
          return (
            <ol key={i} className="list-decimal pl-5 my-3 space-y-1 font-inter text-sm text-on-surface">
              {node.content?.map((li, liIdx) => (
                <li key={liIdx}>{li.content?.map((p) => p.content?.map((t) => t.text).join('')).join('')}</li>
              ))}
            </ol>
          );
        }

        if (node.type === 'image') {
          return (
            <figure key={i} className="my-5 flex flex-col gap-1.5">
              <img
                src={node.attrs?.src}
                alt={node.attrs?.alt || 'Inline Media'}
                className="w-full max-h-[460px] object-cover border border-border-rule"
              />
              {node.attrs?.title && (
                <figcaption className="text-xs text-secondary font-inter">
                  {node.attrs.title}
                </figcaption>
              )}
            </figure>
          );
        }

        if (node.type === 'youtube') {
          return (
            <div key={i} className="my-5 aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${node.attrs?.src}?controls=1`}
                title="Inline YouTube"
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
          );
        }

        // Standard paragraph
        const paraText = node.content?.map((c) => c.text).join('') || '';
        if (!paraText.trim()) return null;
        return (
          <p key={i} className="font-inter text-sm sm:text-base text-on-surface leading-loose my-3">
            {paraText}
          </p>
        );
      });
    }

    // Fallback if plain text string
    const text = extractPlainText(content);
    return text.split('\n\n').map((para, i) => (
      <p key={i} className="font-inter text-sm sm:text-base text-on-surface leading-loose my-3">
        {para}
      </p>
    ));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-paper-canvas border border-border-rule shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden">
        {/* Top Preview Warning Ribbon */}
        <div className="bg-[#10264B] text-white px-4 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary-fixed" />
            <div>
              <span className="font-mukta font-bold text-sm block">
                लाइव संपादकीय पूर्वावलोकन (Editorial Live Preview)
              </span>
              <span className="font-inter text-[11px] text-neutral-300">
                अप्रकाशित परिवर्तन प्रदर्शित हो रहे हैं • पाठकों के समक्ष यह प्रारूप दिखेगा
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={articleData.status} size="sm" />
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="पूर्वावलोकन बंद करें"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Article Body */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-6">
          {/* Category & Date Byline Header */}
          <div className="space-y-3 border-b border-border-rule pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-primary-container text-white font-mukta text-xs font-bold uppercase tracking-wider">
                {currentCategory ? currentCategory.nameHindi : articleData.category}
              </span>
              <span className="font-inter text-xs text-secondary flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {new Date().toLocaleDateString('hi-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </span>
              <span className="font-inter text-xs text-secondary flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{readTime}</span>
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-mukta text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface leading-snug">
              {articleData.title || 'शीर्षक दर्ज नहीं किया गया'}
            </h1>

            {/* Lead Summary */}
            {articleData.summary && (
              <p className="font-inter text-sm sm:text-base text-secondary leading-relaxed bg-paper-tint p-3 border-l-4 border-primary-container">
                {articleData.summary}
              </p>
            )}

            {/* Author info */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-9 h-9 rounded-full bg-primary-container text-white flex items-center justify-center font-mukta font-bold text-sm shrink-0">
                {articleData.author?.name ? articleData.author.name[0] : 'आ'}
              </div>
              <div className="font-mukta text-xs sm:text-sm">
                <span className="font-bold text-on-surface block">
                  {articleData.author?.name || 'आज़ाद समाचार डेस्क'}
                </span>
                <span className="text-secondary text-[11px] flex items-center gap-1">
                  <span>{articleData.author?.role || 'विशेष संवाददाता'}</span>
                  <span>•</span>
                  <MapPin className="w-3 h-3 text-secondary" />
                  <span>{articleData.location || articleData.author?.location || 'कानपुर'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          {articleData.featuredImage && (
            <figure className="space-y-1.5">
              <div className="relative aspect-[16/9] w-full bg-black overflow-hidden border border-border-rule shadow-sm">
                <img
                  src={articleData.featuredImage}
                  alt={articleData.imageAlt || articleData.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {(articleData.imageCaption || articleData.imageCredit) && (
                <figcaption className="flex items-center justify-between text-xs text-secondary font-inter px-1">
                  <span>{articleData.imageCaption}</span>
                  {articleData.imageCredit && (
                    <span className="font-semibold">{articleData.imageCredit}</span>
                  )}
                </figcaption>
              )}
            </figure>
          )}

          {/* Other Pictures / Multi-Image Gallery (Rendered BEFORE the matter) */}
          {(() => {
            const raw = articleData.galleryImages || articleData.gallery || articleData.content?.gallery || [];
            const others = Array.isArray(raw)
              ? raw.filter((p) => p && p.url && p.url !== articleData.featuredImage)
              : [];
            if (others.length === 0) return null;
            return (
              <div className="my-4">
                <ArticlePhotoGallery
                  gallery={others}
                  title="समाचार से जुड़े अन्य छायाचित्र (Additional Pictures)"
                />
              </div>
            );
          })()}

          {/* Main Article Body Render (The Matter) */}
          <div className="article-body-preview">{renderPreviewBody()}</div>

          {/* YouTube Video Section if provided */}
          {articleData.youtubeUrl && (
            <div className="my-6">
              <div className="bg-[#10264B] text-white p-3 border-t-4 border-primary-container mb-2">
                <span className="font-mukta text-sm font-bold block">
                  आज़ाद विशेष वीडियो कवरेज (YouTube Video Package)
                </span>
                {articleData.videoCaption && (
                  <span className="font-inter text-xs text-neutral-300">
                    {articleData.videoCaption}
                  </span>
                )}
              </div>
              <YouTubeEmbed
                url={articleData.youtubeUrl}
                title={articleData.title}
                caption={articleData.videoCaption}
              />
            </div>
          )}

          {/* Tags */}
          {Array.isArray(articleData.tags) && articleData.tags.length > 0 && (
            <div className="pt-4 border-t border-border-rule flex items-center gap-2 flex-wrap">
              <span className="font-mukta text-xs font-bold text-secondary flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                <span>टैग्स:</span>
              </span>
              {articleData.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 bg-paper-tint border border-border-rule text-xs font-mukta text-on-surface"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-paper-tint border-t border-border-rule p-3 px-6 flex items-center justify-between shrink-0 font-mukta">
          <span className="text-xs text-secondary font-inter">
            पूर्वावलोकन केवल संपादकीय डेस्क के लिए है।
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-paper-canvas border border-border-rule text-on-surface hover:bg-paper-subtle text-xs font-bold"
          >
            वापस संपादन पर जाएं
          </button>
        </div>
      </div>
    </div>
  );
}

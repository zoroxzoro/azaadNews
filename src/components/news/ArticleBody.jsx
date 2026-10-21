import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Quote,
  CheckCircle2,
  Image as ImageIcon,
  Vote,
  ThumbsUp,
  MessageSquare,
  Mail,
  UserCheck,
  Plus,
  Send,
} from 'lucide-react';
import YouTubeEmbed from './YouTubeEmbed';
import ArticlePhotoGallery from './ArticlePhotoGallery';
import toast from 'react-hot-toast';
import { renderTipTapContent, isContentEmpty } from '../../utils/articleContent';

function parseLegacyContent(raw) {
  if (!raw || typeof raw !== 'string') return [];
  let cleaned = raw.replace(/<!--[\s\S]*?-->/g, '').trim();

  // If standard <p> tags exist, extract their text content
  if (/<p[\s>]/i.test(cleaned)) {
    const matches = cleaned.match(/<p[\s\S]*?<\/p>/gi) || [];
    return matches
      .map((p) => p.replace(/<[^>]+>/g, '').trim())
      .filter(Boolean);
  }

  // Handle <div> blocks or raw text:
  // Convert </div> and <br> to newlines, then strip any HTML tags
  cleaned = cleaned
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  return cleaned
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * ArticleBody Component
 * Production-quality editorial content renderer:
 * - Generous Hindi line height and Devanagari typography scaling
 * - Safe word-break wrapping preventing overflow on narrow mobile screens
 * - Highlights and reader polls rendered ONLY when actual data exists on the article
 * - Dignified author bio card without fake stock photography
 * - Interactive reader comment box
 */
export default function ArticleBody({
  article,
  fontSizeClass = 'text-base sm:text-[17px] leading-[1.85] sm:leading-[1.95]',
}) {
  const [pollVoted, setPollVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState(
    Array.isArray(article?.comments) ? article.comments : []
  );

  const poll = article?.poll || null;
  const [pollResults, setPollResults] = useState(
    poll?.options || [
      { id: 'yes', text: 'हां, सहमत हैं', pct: 65 },
      { id: 'no', text: 'नहीं, असहमत हैं', pct: 25 },
      { id: 'maybe', text: 'कह नहीं सकते', pct: 10 },
    ]
  );

  const handleVote = (optId) => {
    if (pollVoted) return;
    setSelectedOption(optId);
    setPollVoted(true);
    toast.success('जनमत सर्वेक्षण में आपका मत दर्ज किया गया! धन्यवाद।');
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const newComment = {
      id: Date.now(),
      name: 'सजग पाठक (आप)',
      location: article.location || 'भारत',
      time: 'अभी',
      text: commentText.trim(),
      likes: 1,
    };
    setCommentsList([newComment, ...commentsList]);
    setCommentText('');
    toast.success('आपकी टिप्पणी सफलतापूर्वक प्रकाशित हुई!');
  };

  if (!article) return null;

  const authorName = article.author?.name?.trim() || 'आज़ाद समाचार डेस्क';
  const authorRole = article.author?.role?.trim() || 'संपादक';
  const authorLocation = article.author?.location?.trim() || article.location?.trim() || null;

  // Render highlights ONLY when actual highlights exist on article
  const highlights = Array.isArray(article?.highlights) && article.highlights.length > 0
    ? article.highlights
    : null;

  // Multi-image collection: other pictures (excluding primary picture if duplicate)
  const rawGallery = article?.galleryImages || article?.gallery || article?.content?.gallery || [];
  const otherPictures = Array.isArray(rawGallery)
    ? rawGallery.filter((p) => p && p.url && p.url !== article?.featuredImage)
    : [];

  // Content resolution: prioritize TipTap doc; fallback to sanitized legacy paragraphs
  const doc = article?.contentJson || article?.content;
  const isTipTapDoc =
    Boolean(doc) &&
    ((typeof doc === 'object' && doc?.type === 'doc') ||
      (typeof doc === 'string' && doc.trim().startsWith('{"type":"doc"')));
  const hasTipTapContent = isTipTapDoc && !isContentEmpty(doc);

  const legacyRaw = !hasTipTapContent ? (article?.originalHtml || article?.content || '') : '';
  const legacyParagraphs = legacyRaw ? parseLegacyContent(legacyRaw) : [];

  return (
    <div className="flex flex-col gap-6" id="article-root">
      {/* 1. Executive Key Takeaways Callout Box (Rendered ONLY if actual highlights exist) */}
      {highlights && (
        <div className="w-full bg-paper-tint border-t-4 border-primary-container border-x border-b border-border-rule p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3 border-b border-border-rule pb-2">
            <CheckCircle2 className="w-5 h-5 text-primary-container" />
            <h2 className="font-mukta text-base sm:text-lg font-bold text-on-surface uppercase tracking-wide">
              खबर के मुख्य बिंदु (Key Highlights)
            </h2>
          </div>

          <ul className="flex flex-col gap-2.5 font-inter text-xs sm:text-sm text-on-surface leading-relaxed">
            {highlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-primary-container mt-1.5 shrink-0" />
                <span className="break-words">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 2. Other Pictures / Multi-Image Gallery (Rendered BEFORE the matter per editorial layout) */}
      {otherPictures.length > 0 && (
        <ArticlePhotoGallery
          gallery={otherPictures}
          title="समाचार से जुड़े अन्य छायाचित्र (Additional Pictures)"
          className="mb-2"
        />
      )}

      {/* 3. The Matter (Structured Rich Article Body Content) */}
      <div className={`font-inter text-on-surface space-y-4 break-words [word-break:break-word] ${fontSizeClass}`}>
        {hasTipTapContent ? (
          <>
            {renderTipTapContent(doc)}
            {article.youtubeUrl && (
              <div className="my-6">
                <YouTubeEmbed
                  url={article.youtubeUrl}
                  title={article.title}
                  duration={article.videoDuration || '08:45'}
                />
              </div>
            )}
          </>
        ) : (
          /* Plain-text / legacy paragraphs without artificial mock injections */
          <div className="space-y-4">
            {legacyParagraphs.length > 0 ? (
              legacyParagraphs.map((para, i) => (
                <p key={i} className="my-4 leading-[1.85] sm:leading-[1.95] break-words">
                  {i === 0 && article.location && (
                    <strong className="text-on-surface font-bold">
                      {article.location}।{' '}
                    </strong>
                  )}
                  {para}
                </p>
              ))
            ) : (
              <p className="my-4 leading-[1.85] sm:leading-[1.95] break-words">
                {article.location && (
                  <strong className="text-on-surface font-bold">
                    {article.location}।{' '}
                  </strong>
                )}
                {article.summary}
              </p>
            )}

            {article.youtubeUrl && (
              <div className="my-6">
                <YouTubeEmbed
                  url={article.youtubeUrl}
                  title={article.title}
                  duration={article.videoDuration || '08:45'}
                />
              </div>
            )}
          </div>
        )}
      </div>

        {/* 3. Interactive Reader Opinion Poll Widget (rendered ONLY if article has actual poll) */}
        {poll && poll.question && (
          <div className="my-6 bg-paper-tint border border-border-rule p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border-rule pb-2 mb-3">
              <span className="flex items-center gap-1.5 font-inter text-xs font-bold uppercase tracking-wider text-primary-container">
                <Vote className="w-4 h-4" />
                आज़ाद जनमत सर्वेक्षण (Reader's Poll)
              </span>
              {poll.totalVotes && (
                <span className="font-inter text-[11px] text-secondary">
                  कुल वोट: {poll.totalVotes.toLocaleString('hi-IN')}
                </span>
              )}
            </div>

            <h3 className="font-mukta text-base sm:text-lg font-bold text-on-surface mb-3 leading-snug break-words">
              {poll.question}
            </h3>

            <div className="flex flex-col gap-2">
              {pollResults.map((opt) => {
                const isChosen = selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleVote(opt.id)}
                    disabled={pollVoted}
                    className={`w-full text-left p-3 border transition-all flex flex-col gap-1.5 cursor-pointer ${
                      isChosen
                        ? 'bg-primary-container/10 border-primary-container'
                        : 'bg-paper-canvas border-border-rule hover:border-primary-container'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs sm:text-sm font-mukta font-bold text-on-surface">
                      <span>{opt.text}</span>
                      {pollVoted && (
                        <span className="font-inter text-xs font-bold text-primary-container">
                          {opt.pct}%
                        </span>
                      )}
                    </div>

                    {pollVoted && (
                      <div className="w-full bg-border-rule/50 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isChosen ? 'bg-primary-container' : 'bg-secondary/60'
                          }`}
                          style={{ width: `${opt.pct}%` }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="font-inter text-[10px] text-secondary mt-2 text-center">
              * यह सर्वेक्षण हमारे पाठकों के स्वैच्छिक मत पर आधारित है।
            </p>
          </div>
        )}

        {/* 4. Author Bio Card */}
      <div className="mt-4 p-4 sm:p-5 bg-paper-tint border-t-2 border-border-heavy border-x border-b border-border-rule flex flex-col sm:flex-row items-start gap-4">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary-container shrink-0 bg-paper-canvas flex items-center justify-center">
          {article.author?.avatar ? (
            <img
              src={article.author.avatar}
              alt={authorName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-mukta font-bold text-primary-container text-lg">
              {authorName.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-mukta text-lg font-bold text-on-surface leading-none">
                {authorName}
              </h3>
              <span className="px-1.5 py-0.5 bg-paper-canvas border border-border-rule font-inter text-[10px] text-primary-container font-semibold">
                {authorRole}
              </span>
            </div>

            <button
              type="button"
              onClick={() => toast.success(`${authorName} को फॉलो किया गया!`)}
              className="px-3 py-1 bg-border-heavy text-white hover:bg-primary-container font-inter text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>फॉलो करें</span>
            </button>
          </div>

          <p className="font-inter text-xs text-secondary mt-1.5 leading-relaxed">
            {authorName} {authorLocation && `• ${authorLocation}`}
          </p>

          <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border-rule font-inter text-xs text-secondary">
            <Link
              to={`/search?q=${encodeURIComponent(authorName)}`}
              className="hover:text-primary-container transition-colors flex items-center gap-1"
            >
              <UserCheck className="w-3.5 h-3.5 text-primary-container" />
              <span>इनके सभी लेख पढ़ें</span>
            </Link>
            <span>•</span>
            <a
              href="mailto:contact@azaadsamacharindia.com"
              className="hover:text-primary-container transition-colors flex items-center gap-1"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>संपादकीय संवाद</span>
            </a>
          </div>
        </div>
      </div>

      {/* 5. Reader Feedback & Comments Segment */}
      <div className="mt-4 border border-border-rule bg-paper-canvas p-4 sm:p-5">
        <div className="flex items-center justify-between border-b border-border-rule pb-2 mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-container" />
            <h3 className="font-mukta text-lg font-bold text-on-surface">
              पाठक प्रतिक्रिया एवं संवाद ({commentsList.length} टिप्पणियां)
            </h3>
          </div>
          <span className="font-inter text-[11px] text-secondary hidden sm:inline">
            मर्यादित व तथ्यपरक भाषा का प्रयोग करें
          </span>
        </div>

        {/* Comment Input Form */}
        <form onSubmit={handleAddComment} className="flex flex-col gap-2 mb-5">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            placeholder="इस समाचार पर अपना निष्पक्ष विचार साझा करें..."
            className="w-full p-3 bg-paper-tint border border-border-rule text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-primary-container text-white font-inter text-xs font-bold hover:bg-primary transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>टिप्पणी प्रकाशित करें</span>
            </button>
          </div>
        </form>

        {/* Comment List */}
        {commentsList.length > 0 ? (
          <div className="flex flex-col divide-y divide-border-rule">
            {commentsList.map((comm) => (
              <div key={comm.id} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mukta text-sm font-bold text-on-surface">
                      {comm.name}
                    </span>
                    <span className="font-inter text-[10px] text-secondary">
                      {comm.time} {comm.location && `• ${comm.location}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      comm.likes = (comm.likes || 0) + 1;
                      setCommentsList([...commentsList]);
                    }}
                    className="font-inter text-[11px] text-primary-container flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{comm.likes || 1} समर्थन</span>
                  </button>
                </div>
                <p className="font-inter text-xs sm:text-sm text-secondary leading-relaxed break-words">
                  {comm.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-inter text-xs text-secondary text-center py-4">
            अभी तक कोई टिप्पणी दर्ज नहीं हुई है। पहले पाठक बनकर अपनी प्रतिक्रिया दें!
          </p>
        )}
      </div>
    </div>
  );
}

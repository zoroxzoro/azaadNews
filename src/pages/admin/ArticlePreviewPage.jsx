import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useArticles } from '../../context/ArticleContext';
import { articlesService } from '../../services/articlesService';
import StatusBadge from '../../components/admin/StatusBadge';
import YouTubeEmbed from '../../components/news/YouTubeEmbed';
import {
  ChevronLeft,
  Calendar,
  User,
  Clock,
  Send,
  Edit,
  ExternalLink,
  AlertCircle,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ARTICLE_STATUS } from '../../utils/articleStatus';
import { renderTipTapContent } from '../../utils/articleContent';

export default function ArticlePreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getArticleById, changeArticleStatus } = useArticles();
  const [dbArticle, setDbArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(!getArticleById(id));

  useEffect(() => {
    let isMounted = true;
    if (id && !getArticleById(id)) {
      setIsLoading(true);
      articlesService
        .getArticleById(id)
        .then((res) => {
          const found = res?.data || res;
          if (isMounted && found && found.id) {
            setDbArticle(found);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [id, getArticleById]);

  const article = getArticleById(id) || dbArticle;

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-secondary font-mukta">
        <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-sm font-bold text-on-surface">
          पूर्वावलोकन लोड हो रहा है...
        </span>
        <span className="font-inter text-xs text-secondary mt-1">
          Azaad Newsroom Editorial Preview
        </span>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="bg-paper-canvas border border-border-rule p-8 text-center space-y-4 max-w-xl mx-auto my-12">
        <AlertCircle className="w-10 h-10 mx-auto text-amber-600" />
        <h2 className="font-mukta text-xl font-bold text-on-surface">
          समाचार आलेख नहीं मिला
        </h2>
        <p className="font-inter text-xs text-secondary">
          ID #{id} वाला आलेख उपलब्ध नहीं है या हटा दिया गया है।
        </p>
        <Link
          to="/admin/news"
          className="inline-block px-4 py-2 bg-primary-container text-white font-mukta font-bold text-xs"
        >
          ← सभी समाचार पर वापस जाएं
        </Link>
      </div>
    );
  }

  const isPublished = article.status === ARTICLE_STATUS.PUBLISHED;

  const handlePublish = async () => {
    try {
      await changeArticleStatus(article.id, ARTICLE_STATUS.PUBLISHED, {
        publishedAt: new Date().toISOString(),
      });
      toast.success('आलेख सफलतापूर्वक प्रकाशित किया गया!');
    } catch (err) {
      toast.error('प्रकाशन में त्रुटि हुई');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. TOP EDITORIAL PREVIEW BANNER */}
      <div className="bg-[#10264B] text-white p-4 border-l-4 border-primary-container shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-primary-fixed shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mukta text-sm sm:text-base font-bold text-white">
                आंतरिक संपादकीय पूर्वावलोकन (Internal Preview)
              </span>
              <StatusBadge status={article.status} />
            </div>
            <span className="text-[11px] font-inter text-slate-300">
              यह पूर्वावलोकन केवल संपादकों के लिए है। सार्वजनिक पाठक इसे तब तक नहीं देख सकते जब तक स्थिति 'प्रकाशित' न हो।
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {!isPublished && (
            <button
              onClick={handlePublish}
              className="px-3.5 py-1.5 bg-primary-container hover:bg-primary text-white font-mukta font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>सीधा प्रकाशित करें</span>
            </button>
          )}

          <Link
            to={`/admin/news/edit/${article.id}`}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-mukta font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>एडिट करें</span>
          </Link>

          {isPublished && (
            <Link
              to={`/news/${article.slug}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-paper-canvas text-on-surface font-mukta font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>लाइव देखें</span>
            </Link>
          )}
        </div>
      </div>

      {/* Back to index link */}
      <div>
        <Link
          to="/admin/news"
          className="text-secondary hover:text-primary-container text-xs font-inter inline-flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>सभी समाचार सूची पर वापस जाएं</span>
        </Link>
      </div>

      {/* 2. ARTICLE CONTENT PREVIEW FRAME */}
      <article className="bg-paper-canvas border border-border-rule p-5 sm:p-8 lg:p-10 shadow-xs space-y-6">
        {/* Category & Date Metadata */}
        <div className="flex items-center gap-2 text-xs font-inter text-secondary flex-wrap">
          <span className="px-2 py-0.5 bg-primary-container text-white font-bold uppercase text-[11px] tracking-wider">
            {article.categoryNameHindi || article.category}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-secondary" />
            {article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString('hi-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : 'अप्रकाशित'}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-secondary" />
            {article.readTime || '3 मिनट पठन'}
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-mukta text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface leading-tight">
          {article.title}
        </h1>

        {/* Summary Kicker */}
        {article.summary && (
          <p className="font-inter text-sm sm:text-base text-secondary leading-relaxed font-medium border-l-3 border-primary-container pl-3 py-0.5">
            {article.summary}
          </p>
        )}

        {/* Byline */}
        <div className="flex items-center gap-3 py-3 border-y border-border-rule text-xs font-inter text-secondary">
          <div className="w-8 h-8 rounded-full bg-paper-subtle flex items-center justify-center font-bold text-primary-container border border-border-rule">
            <User className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-on-surface block">
              {article.author?.name || 'आज़ाद समाचार डेस्क'}
            </span>
            <span className="text-[11px] text-secondary">
              {article.author?.role || 'विशेष संवाददाता'} • {article.author?.location || 'कानपुर'}
            </span>
          </div>
        </div>

        {/* Featured Image */}
        {article.featuredImage && (
          <div className="space-y-1.5">
            <div className="aspect-video w-full overflow-hidden bg-surface-container border border-border-rule">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
            {article.imageCaption && (
              <span className="text-[11px] font-inter text-secondary italic block">
                फोटो विवरण: {article.imageCaption}
              </span>
            )}
          </div>
        )}

        {/* Embedded YouTube video if available */}
        {article.youtubeUrl && (
          <div className="my-6">
            <YouTubeEmbed
              url={article.youtubeUrl}
              title={article.title}
              duration={article.videoDuration}
            />
          </div>
        )}

        {/* Article Body Content */}
        <div className="font-inter text-sm sm:text-base text-on-surface leading-relaxed space-y-4 pt-2">
          {article.content ? (
            ((typeof article.content === 'object' && article.content?.type === 'doc') ||
             (typeof article.content === 'string' && article.content.trim().startsWith('{"type":"doc"'))) ? (
              renderTipTapContent(article.content)
            ) : typeof article.content === 'string' ? (
              article.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="whitespace-pre-line">
                  {paragraph}
                </p>
              ))
            ) : (
              renderTipTapContent(article.content)
            )
          ) : (
            <p className="italic text-secondary">इस आलेख में अभी कोई विस्तृत सामग्री नहीं है।</p>
          )}
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="pt-4 border-t border-border-rule flex items-center gap-1.5 flex-wrap">
            <span className="font-inter text-xs text-secondary font-semibold">टैग:</span>
            {article.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-paper-tint text-xs font-inter text-on-surface border border-border-rule"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

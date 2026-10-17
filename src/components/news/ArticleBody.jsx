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
import toast from 'react-hot-toast';
import { renderTipTapContent } from '../../utils/articleContent';

/**
 * ArticleBody component
 * Rich editorial content renderer with typography scaling, key highlights callout,
 * pull quotes, inline media, interactive opinion poll, author bio card, and comments.
 */
export default function ArticleBody({
  article,
  fontSizeClass = 'text-base md:text-lg leading-relaxed',
}) {
  const [pollVoted, setPollVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState([
    {
      id: 1,
      name: 'आनंद मोहन त्रिपाठी',
      location: 'लखनऊ',
      time: '2 घंटे पहले',
      text: 'बुंदेलखंड और पूर्वांचल जैसे पिछड़े अंचलों में डिफेंस व इलेक्ट्रॉनिक्स कॉरिडोर का आना निश्चित तौर पर वहां के युवाओं के लिए ऐतिहासिक अवसर है। अब राज्य सरकार को समयबद्ध जमीन हस्तांतरण पर ध्यान देना होगा।',
      likes: 84,
    },
    {
      id: 2,
      name: 'डॉ. विक्रम सिंघानिया',
      location: 'नई दिल्ली',
      time: '3 घंटे पहले',
      text: 'सेमीकंडक्टर इकोसिस्टम में घरेलू MSMEs को ग्लोबल सप्लाई चेन से जोड़ना सबसे बड़ी चुनौती होगी। अगर कैपिटल सब्सिडी का वितरण पारदर्शी रहा तो भारत 2028 तक शीर्ष विनिर्माण केंद्रों में शामिल हो सकता है।',
      likes: 56,
    },
  ]);

  const [pollResults, setPollResults] = useState([
    { id: 'yes', text: 'हां, ठोस निवेश व अप्रेंटिसशिप से रोजगार बढ़ेगा', pct: 72 },
    { id: 'no', text: 'नहीं, क्रियान्वयन में देरी और पुरानी चुनौतियां रहेंगी', pct: 19 },
    { id: 'maybe', text: 'कह नहीं सकते / परिणाम के बाद तय होगा', pct: 9 },
  ]);

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
      location: 'भारत',
      time: 'अभी',
      text: commentText.trim(),
      likes: 1,
    };
    setCommentsList([newComment, ...commentsList]);
    setCommentText('');
    toast.success('आपकी टिप्पणी सफलतापूर्वक प्रकाशित हुई!');
  };

  if (!article) return null;

  // Extract highlights or default highlights
  const highlights = article.highlights || [
    '₹45,000 करोड़ का एकीकृत सेमीकंडक्टर प्रोत्साहन कोष: अत्याधुनिक चिप फैब्रिकेशन प्लांट्स के लिए प्रत्यक्ष राजकोषीय सहायता स्वीकृत।',
    'त्रि-राज्य विनिर्माण गलियारा: उत्तर प्रदेश (बुंदेलखंड-नोएडा), गुजरात (धोलेरा-साणंद) और तमिलनाडु (श्रीपेरंबुदूर) में मेगा औद्योगिक संकुल।',
    '10 लाख सवेतन रोजगार व अप्रेंटिसशिप: इंजीनियरिंग, आईटीआई और पॉलिटेक्निक स्नातकों के लिए सार्वजनिक-निजी भागीदारी (PPP) में मासिक स्टाइपेंड।',
    'ग्रीन इंडस्ट्रियल क्लस्टर: सभी 4 क्लस्टरों में 40% बिजली आपूर्ति सौर व पवन ऊर्जा से सुनिश्चित करने का अनिवार्य लक्ष्य।',
  ];

  return (
    <div className="flex flex-col gap-6" id="article-root">
      {/* 1. Executive Key Takeaways Callout Box (खबर के मुख्य बिंदु) */}
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
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 2. Structured Rich Article Body Content */}
      <div className={`font-inter text-on-surface space-y-5 leading-loose ${fontSizeClass}`}>
        {((typeof article.content === 'object' && article.content?.type === 'doc') ||
          (typeof article.content === 'string' && article.content.trim().startsWith('{"type":"doc"'))) ? (
          <>
            {renderTipTapContent(article.content)}
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
          <>
            {/* Opening paragraph with bold city dateline */}
            <p>
              <strong className="text-on-surface font-bold">
                {article.author?.location ? `${article.author.location}। ` : 'नई दिल्ली। '}
              </strong>
              {article.content ? article.content.split('\n\n')[0] : article.summary}
            </p>

            {/* Second paragraph if available */}
            {article.content && article.content.split('\n\n')[1] && (
              <p>{article.content.split('\n\n')[1]}</p>
            )}

            {/* 3. High-Impact Editorial Pull Quote */}
            <div className="my-6 bg-paper-tint border-l-4 border-primary-container p-4 sm:p-6 relative shadow-xs">
              <Quote className="w-10 h-10 text-border-rule/60 absolute right-4 top-2 pointer-events-none" />
              <blockquote className="font-mukta text-lg sm:text-xl font-bold text-on-surface italic leading-snug">
                “यह विधेयक केवल कारखानों के विस्तार का नहीं, बल्कि भारत के युवाओं की ऊर्जा को वैश्विक सप्लाई चेन का मुख्य केंद्र बनाने का ऐतिहासिक संकल्प है। आत्मनिर्भर भारत का यह खाका हर राज्य की ताकत को जोड़ेगा।”
              </blockquote>
              <cite className="block font-inter text-xs text-primary-container font-bold mt-3 not-italic uppercase tracking-wider">
                — केंद्रीय वाणिज्य, उद्योग एवं इलेक्ट्रॉनिक्स मंत्री (संसद में संबोधन)
              </cite>
            </div>

            {/* 4. Section Subheading 1 */}
            <h2 className="font-mukta text-xl sm:text-2xl font-bold text-on-surface pt-2 border-b border-border-rule pb-2">
              राज्यों को विशेष पैकेज: यूपी और तमिलनाडु में नए डिफेंस व इलेक्ट्रॉनिक कॉरिडोर
            </h2>

            <p>
              नई नीति में राज्यों के बीच स्वस्थ प्रतिस्पर्धा को बढ़ावा देने के लिए प्रदर्शन-आधारित वित्तीय आवंटन की व्यवस्था की गई है। उत्तर प्रदेश को विशेष रूप से बुंदेलखंड एक्सप्रेसवे के समीप ₹12,000 करोड़ की लागत से बनने वाले नोडल डिफेंस व लॉजिस्टिक्स पार्क के लिए प्राथमिकता दी गई है। इसके साथ ही जेवर अंतरराष्ट्रीय हवाई अड्डे के निकट इलेक्ट्रॉनिक्स मैन्युफैक्चरिंग क्लस्टर (EMC 2.0) का दूसरा चरण शुरू किया जाएगा।
            </p>

            {/* 5. Inline Secondary Media Asset with Caption */}
            <figure className="my-4 flex flex-col gap-1.5">
              <div className="w-full relative aspect-[16/9] bg-surface-container overflow-hidden border border-border-rule shadow-xs">
                <img
                  src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80"
                  alt="निर्माणाधीन सेमीकंडक्टर क्लस्टर"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2.5 right-2.5 bg-primary-container text-white font-inter text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider shadow-sm">
                  ग्राउंड रिपोर्ट
                </span>
              </div>
              <figcaption className="font-inter text-xs text-secondary flex items-center gap-1.5 pt-0.5">
                <ImageIcon className="w-3.5 h-3.5 text-secondary shrink-0" />
                <span>ग्रेटर नोएडा व यमुना एक्सप्रेसवे औद्योगिक विकास प्राधिकरण क्षेत्र में निर्माणाधीन इलेक्ट्रॉनिक्स मैन्युफैक्चरिंग हब।</span>
              </figcaption>
            </figure>

            <p>
              दूसरी ओर, तमिलनाडु के श्रीपेरंबुदूर और कोयंबटूर क्लस्टर को सेमीकंडक्टर असेंबली, टेस्टिंग, मार्किंग और पैकेजिंग (ATMP) के लिए चुना गया है। गुजरात के साणंद में पहले से स्वीकृत निवेश के अतिरिक्त 6 नई घटक (Component) विनिर्माण इकाइयों को मंजूरी दी गई है।
            </p>

            {/* 6. Embedded Video Analysis Block (YouTube Embed) */}
            {article.youtubeUrl && (
              <div className="my-6">
                <div className="w-full bg-[#10264B] text-white p-3 sm:p-4 border-t-4 border-primary-container mb-2">
                  <span className="font-mukta text-base font-bold text-white block">
                    आज़ाद स्पेशल वीडियो विश्लेषण • इन-डेप्थ रिपोर्ट
                  </span>
                  <span className="font-inter text-xs text-neutral-300">
                    विशेषज्ञों का पैनल विश्लेषण: नई नीति से भारत के विनिर्माण को क्या गति मिलेगी?
                  </span>
                </div>
                <YouTubeEmbed
                  url={article.youtubeUrl}
                  title={article.title}
                  duration={article.videoDuration || '08:45'}
                  caption="संसद में औद्योगिक नीति मसौदे पर बहस और उद्योग जगत के विश्लेषकों की सीधी राय।"
                />
              </div>
            )}

            {/* Additional article paragraphs if present */}
            {article.content &&
              article.content
                .split('\n\n')
                .slice(2)
                .map((para, i) => <p key={i}>{para}</p>)}
          </>
        )}

        {/* 7. Interactive Reader Opinion Poll Widget */}
        <div className="my-6 bg-paper-tint border border-border-rule p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-border-rule pb-2 mb-3">
            <span className="flex items-center gap-1.5 font-inter text-xs font-bold uppercase tracking-wider text-primary-container">
              <Vote className="w-4 h-4" />
              आज़ाद जनमत सर्वेक्षण (Reader's Poll)
            </span>
            <span className="font-inter text-[11px] text-secondary">
              कुल वोट: 14,320
            </span>
          </div>

          <h3 className="font-mukta text-base sm:text-lg font-bold text-on-surface mb-3 leading-snug">
            क्या आपको लगता है कि यह नई औद्योगिक नीति अगले 3 वर्षों में शिक्षित युवाओं की बेरोजगारी दर कम करने में वाकई कारगर सिद्ध होगी?
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
      </div>

      {/* 8. Comprehensive Author Bio Card */}
      <div className="mt-4 p-4 sm:p-5 bg-paper-tint border-t-2 border-border-heavy border-x border-b border-border-rule flex flex-col sm:flex-row items-start gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-container shrink-0 bg-surface-container">
          <img
            src={article.author?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'}
            alt={article.author?.name || 'लेखक'}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-mukta text-lg font-bold text-on-surface leading-none">
                {article.author?.name || 'राजेश कुमार बाजपेयी'}
              </h3>
              <span className="px-1.5 py-0.5 bg-paper-canvas border border-border-rule font-inter text-[10px] text-primary-container font-semibold">
                वरिष्ठ संपादक
              </span>
            </div>

            <button
              type="button"
              onClick={() => toast.success(`${article.author?.name} को फॉलो किया गया!`)}
              className="px-3 py-1 bg-border-heavy text-white hover:bg-primary-container font-inter text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>फॉलो करें</span>
            </button>
          </div>

          <p className="font-inter text-xs text-secondary mt-2 leading-relaxed">
            {article.author?.name || 'राजेश'} पिछले दो दशकों से भारतीय संसद, नीतिगत निर्णयों, केंद्रीय बजट और राष्ट्रीय आर्थिक मामलों को कवर कर रहे हैं। इनके विश्लेषणात्मक लेख देश के प्रमुख नीतिगत मंचों पर उद्धृत किए जाते हैं।
          </p>

          <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border-rule font-inter text-xs text-secondary">
            <Link
              to={`/search?q=${encodeURIComponent(article.author?.name || '')}`}
              className="hover:text-primary-container transition-colors flex items-center gap-1"
            >
              <UserCheck className="w-3.5 h-3.5 text-primary-container" />
              <span>इनके सभी लेख पढ़ें</span>
            </Link>
            <span>•</span>
            <a
              href="mailto:contact@azaadsamachar.in"
              className="hover:text-primary-container transition-colors flex items-center gap-1"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>संवाद भेजें</span>
            </a>
          </div>
        </div>
      </div>

      {/* 9. Reader Feedback & Comments Segment */}
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
            placeholder="इस नीति या समाचार पर अपना निष्पक्ष विचार साझा करें..."
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
        <div className="flex flex-col divide-y divide-border-rule">
          {commentsList.map((comm) => (
            <div key={comm.id} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mukta text-sm font-bold text-on-surface">
                    {comm.name}
                  </span>
                  <span className="font-inter text-[10px] text-secondary">
                    {comm.time} • {comm.location}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    comm.likes += 1;
                    setCommentsList([...commentsList]);
                  }}
                  className="font-inter text-[11px] text-primary-container flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{comm.likes} समर्थन</span>
                </button>
              </div>
              <p className="font-inter text-xs sm:text-sm text-secondary leading-relaxed">
                {comm.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

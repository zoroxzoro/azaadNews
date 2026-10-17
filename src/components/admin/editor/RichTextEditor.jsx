import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Youtube from '@tiptap/extension-youtube';
import ProofreadingHighlight from '../../../extensions/ProofreadingHighlight';
import EditorToolbar from './EditorToolbar';
import { normalizeArticleContent, countWords, countCharacters, estimateReadTime } from '../../../utils/articleContent';
import { getYouTubeVideoId } from '../../../utils/youtube';
import { Image as ImageIcon, Video, X, FolderSearch } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaPicker from '../media/MediaPicker';

export default function RichTextEditor({
  content,
  onChange,
  onEditorReady,
  onOpenProofreading,
  language = 'hi',
  placeholder = 'यहाँ विस्तृत आलेख सामग्री लिखें...',
}) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageTitle, setImageTitle] = useState('');

  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [ytUrl, setYtUrl] = useState('');

  const handleSelectFromLibrary = (asset) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .setImage({
        src: asset.url,
        alt: asset.altText || asset.caption || 'समाचार छायाचित्र',
        title: asset.caption ? `${asset.caption}${asset.credit ? ` (फोटो: ${asset.credit})` : ''}` : (asset.credit || undefined),
      })
      .run();
    setMediaPickerOpen(false);
    toast.success('मीडिया लाइब्रेरी से छवि आलेख में जोड़ी गई');
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc pl-5 my-2 space-y-1',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal pl-5 my-2 space-y-1',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-primary-container pl-4 py-1.5 my-3 bg-paper-tint italic font-mukta text-lg',
          },
        },
        horizontalRule: {
          HTMLAttributes: {
            class: 'my-6 border-t border-border-rule',
          },
        },
      }),
      Underline,
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: 'w-full max-w-3xl mx-auto my-4 border border-border-rule object-cover shadow-xs',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-container underline hover:text-primary font-medium',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        allowFullscreen: true,
        HTMLAttributes: {
          class: 'w-full aspect-video my-4 border border-border-rule shadow-sm',
        },
      }),
      ProofreadingHighlight,
    ],
    content: normalizeArticleContent(content),
    editorProps: {
      attributes: {
        class:
          'min-h-[420px] sm:min-h-[500px] p-4 sm:p-6 focus:outline-none font-inter text-sm sm:text-base text-on-surface leading-relaxed max-w-none prose dark:prose-invert',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      if (onChange) {
        onChange(json);
      }
    },
  });

  // Provide editor instance to parent when ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Keep editor content in sync when loaded from an existing article ID change
  useEffect(() => {
    if (!editor || !content) return;
    const currentJSON = JSON.stringify(editor.getJSON());
    const incomingNormalized = normalizeArticleContent(content);
    const incomingJSON = JSON.stringify(incomingNormalized);

    if (currentJSON !== incomingJSON) {
      editor.commands.setContent(incomingNormalized, false);
    }
  }, [content, editor]);

  // Insert Inline Image handler
  const handleInsertImage = (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      toast.error('कृपया मान्य छवि यूआरएल दर्ज करें');
      return;
    }

    try {
      new URL(imageUrl.trim());
    } catch {
      toast.error('अमान्य छवि लिंक। कृपया पूर्ण http/https URL दर्ज करें।');
      return;
    }

    editor
      .chain()
      .focus()
      .setImage({
        src: imageUrl.trim(),
        alt: imageAlt.trim() || 'समाचार छवि',
        title: imageTitle.trim() || undefined,
      })
      .run();

    setImageUrl('');
    setImageAlt('');
    setImageTitle('');
    setImageModalOpen(false);
    toast.success('छवि आलेख में सफलतापूर्वक जोड़ी गई');
  };

  // Insert YouTube Video handler
  const handleInsertYouTube = (e) => {
    e.preventDefault();
    const cleanUrl = ytUrl.trim();
    const videoId = getYouTubeVideoId(cleanUrl);

    if (!videoId) {
      toast.error('अमान्य यूट्यूब वीडियो यूआरएल। कृपया मान्य लिंक दर्ज करें।');
      return;
    }

    editor
      .chain()
      .focus()
      .setYoutubeVideo({
        src: cleanUrl,
        width: 640,
        height: 360,
      })
      .run();

    setYtUrl('');
    setYoutubeModalOpen(false);
    toast.success('यूट्यूब वीडियो एम्बेड ब्लॉक जोड़ा गया');
  };

  const wordCount = editor ? countWords(editor.getJSON()) : 0;
  const charCount = editor ? countCharacters(editor.getJSON()) : 0;
  const readTime = editor ? estimateReadTime(editor.getJSON(), language) : '1 मिनट';

  return (
    <div className="bg-paper-canvas border border-border-rule flex flex-col shadow-xs">
      {/* 1. TipTap Formatting Toolbar */}
      <EditorToolbar
        editor={editor}
        onInsertImage={() => setImageModalOpen(true)}
        onOpenMediaPicker={() => setMediaPickerOpen(true)}
        onInsertYouTube={() => setYoutubeModalOpen(true)}
        onOpenProofreading={onOpenProofreading}
      />

      {/* 2. Interactive Writing Canvas */}
      <div className="relative min-h-[440px] sm:min-h-[520px] bg-paper-canvas">
        <EditorContent editor={editor} />
      </div>

      {/* 3. Bottom Word / Reading Time Counter Footer */}
      <div className="bg-paper-tint border-t border-border-rule px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-secondary font-inter text-xs">
        <div className="flex items-center gap-3">
          <span>
            शब्द: <strong className="text-on-surface">{wordCount}</strong>
          </span>
          <span>•</span>
          <span>
            वर्ण: <strong className="text-on-surface">{charCount}</strong>
          </span>
          <span>•</span>
          <span>
            पठन अवधि: <strong className="text-on-surface">{readTime}</strong>
          </span>
        </div>

        <div className="text-[11px] text-secondary">
          <span>टिप: शीर्षकों के लिए </span>
          <kbd className="px-1.5 py-0.5 bg-paper-subtle border border-border-rule font-mono text-[10px]">
            H2
          </kbd>
          <span> या </span>
          <kbd className="px-1.5 py-0.5 bg-paper-subtle border border-border-rule font-mono text-[10px]">
            H3
          </kbd>
          <span> का प्रयोग करें</span>
        </div>
      </div>

      {/* MODAL: Inline Image Inserter */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-paper-canvas border border-border-rule shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border-rule pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary-container" />
                <h3 className="font-mukta text-lg font-bold text-on-surface">
                  इनलाइन छवि डालें (Inline Image)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="p-1 text-secondary hover:text-on-surface cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Launch Media Library option */}
            <div className="bg-paper-tint border border-border-rule p-3 flex items-center justify-between gap-2">
              <div>
                <p className="font-mukta text-xs font-bold text-on-surface">केंद्रीय मीडिया रिपॉजिटरी</p>
                <p className="font-inter text-[11px] text-secondary">अनुशंसित: पहले से संग्रहीत समाचार छवियों से चुनें</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setImageModalOpen(false);
                  setMediaPickerOpen(true);
                }}
                className="px-3 py-1.5 bg-primary-container text-white text-xs font-mukta font-bold flex items-center gap-1.5 hover:bg-primary transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                <FolderSearch className="w-3.5 h-3.5" />
                <span>लाइब्रेरी खोलें</span>
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border-rule"></div>
              <span className="flex-shrink mx-2 text-[10px] font-inter uppercase text-secondary font-bold">अथवा नया HTTPS URL दर्ज करें</span>
              <div className="flex-grow border-t border-border-rule"></div>
            </div>

            <form onSubmit={handleInsertImage} className="space-y-3 font-mukta">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase mb-1">
                  छवि URL (HTTPS URL) *
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-1.5 bg-paper-tint border border-border-rule text-xs font-inter focus:outline-none focus:bg-paper-canvas"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase mb-1">
                  ऑल्ट विवरण (Alt Text)
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="छवि में क्या दिख रहा है (दृष्टिबाधित पाठकों व एसईओ हेतु)"
                  className="w-full px-3 py-1.5 bg-paper-tint border border-border-rule text-xs font-inter focus:outline-none focus:bg-paper-canvas"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase mb-1">
                  कैप्शन / फोटो साभार (Caption / Credit)
                </label>
                <input
                  type="text"
                  value={imageTitle}
                  onChange={(e) => setImageTitle(e.target.value)}
                  placeholder="जैसे: संसद भवन में पेश हुआ नीति दस्तावेज (फोटो: पीटीआई)"
                  className="w-full px-3 py-1.5 bg-paper-tint border border-border-rule text-xs font-inter focus:outline-none focus:bg-paper-canvas"
                />
              </div>

              {imageUrl && (
                <div className="mt-2 border border-border-rule bg-paper-tint p-2">
                  <span className="block text-[11px] text-secondary mb-1">छवि पूर्वावलोकन:</span>
                  <img
                    src={imageUrl}
                    alt="Preview"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/600x400?text=Invalid+Image+URL';
                    }}
                    className="max-h-36 w-full object-cover border border-border-rule"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-rule">
                <button
                  type="button"
                  onClick={() => setImageModalOpen(false)}
                  className="px-3 py-1.5 border border-border-rule text-secondary hover:text-on-surface text-xs font-bold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary-container text-white text-xs font-bold hover:bg-primary"
                >
                  छवि जोड़ें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Inline YouTube Inserter */}
      {youtubeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-paper-canvas border border-border-rule shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border-rule pb-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-breaking-crimson" />
                <h3 className="font-mukta text-lg font-bold text-on-surface">
                  यूट्यूब वीडियो एम्बेड करें
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setYoutubeModalOpen(false)}
                className="p-1 text-secondary hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInsertYouTube} className="space-y-3 font-mukta">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase mb-1">
                  यूट्यूब लिंक (YouTube URL) *
                </label>
                <input
                  type="url"
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... या https://youtu.be/..."
                  className="w-full px-3 py-1.5 bg-paper-tint border border-border-rule text-xs font-mono focus:outline-none focus:bg-paper-canvas"
                  autoFocus
                  required
                />
                <span className="block text-[11px] text-secondary mt-1 font-inter">
                  मानक वीडियो, शॉर्ट्स व लाइव स्ट्रीम लिंक समर्थित हैं।
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-rule">
                <button
                  type="button"
                  onClick={() => setYoutubeModalOpen(false)}
                  className="px-3 py-1.5 border border-border-rule text-secondary hover:text-on-surface text-xs font-bold"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-breaking-crimson text-white text-xs font-bold hover:bg-primary"
                >
                  वीडियो एम्बेड करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Centralized Newsroom Media Picker */}
      <MediaPicker
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelectMedia={handleSelectFromLibrary}
        title="आलेख में इनलाइन छवि डालें (Insert Inline Media)"
      />
    </div>
  );
}

import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Video,
  Minus,
  RemoveFormatting,
  Undo2,
  Redo2,
  ChevronDown,
  Sparkles,
  FolderSearch,
} from 'lucide-react';

export default function EditorToolbar({
  editor,
  onInsertImage,
  onOpenMediaPicker,
  onInsertYouTube,
  onOpenProofreading,
}) {
  const [showDevanagariMenu, setShowDevanagariMenu] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  if (!editor) return null;

  const handleOpenLinkModal = () => {
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setShowLinkModal(true);
  };

  const handleApplyLink = () => {
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      let formattedUrl = linkUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: formattedUrl }).run();
    }
    setShowLinkModal(false);
    setLinkUrl('');
  };

  const insertDevanagariChar = (char) => {
    editor.chain().focus().insertContent(char).run();
    setShowDevanagariMenu(false);
  };

  const btnClass = (isActive, isDisabled = false) => `
    h-7 px-2 flex items-center justify-center transition-colors font-mukta text-xs font-semibold
    ${isDisabled ? 'opacity-40 cursor-not-allowed text-secondary' : 'cursor-pointer'}
    ${
      isActive
        ? 'bg-primary-container text-white shadow-xs'
        : 'text-on-surface hover:bg-paper-subtle hover:text-primary-container'
    }
  `;

  return (
    <div className="bg-paper-tint border-b border-border-rule p-1.5 flex flex-wrap items-center gap-1 select-none relative z-20">
      {/* 1. History (Undo / Redo) */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={btnClass(false, !editor.can().undo())}
        title="पूर्ववत करें (Undo - Ctrl+Z)"
      >
        <Undo2 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className={btnClass(false, !editor.can().redo())}
        title="पुनः करें (Redo - Ctrl+Y)"
      >
        <Redo2 className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-border-rule mx-1" />

      {/* 2. Text Marks (Bold, Italic, Underline, Strike) */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive('bold'))}
        title="मोटा / गहरा (Bold - Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive('italic'))}
        title="तिरछा (Italic - Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btnClass(editor.isActive('underline'))}
        title="रेखांकित (Underline - Ctrl+U)"
      >
        <UnderlineIcon className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btnClass(editor.isActive('strike'))}
        title="स्ट्राइकथ्रू (Strikethrough)"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-border-rule mx-1" />

      {/* 3. Headings (H2, H3) */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btnClass(editor.isActive('heading', { level: 2 }))}
        title="उपशीर्षक 2 (Heading 2)"
      >
        <Heading2 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btnClass(editor.isActive('heading', { level: 3 }))}
        title="उपशीर्षक 3 (Heading 3)"
      >
        <Heading3 className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-border-rule mx-1" />

      {/* 4. Lists & Blockquotes */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive('bulletList'))}
        title="बुलेट बिंदु सूची (Bullet List)"
      >
        <List className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive('orderedList'))}
        title="संख्यात्मक सूची (Numbered List)"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btnClass(editor.isActive('blockquote'))}
        title="उद्धरण / कोट (Blockquote)"
      >
        <Quote className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-border-rule mx-1" />

      {/* 5. Alignments */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={btnClass(editor.isActive({ textAlign: 'left' }))}
        title="बाईं ओर संरेखित (Align Left)"
      >
        <AlignLeft className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={btnClass(editor.isActive({ textAlign: 'center' }))}
        title="मध्य में संरेखित (Align Center)"
      >
        <AlignCenter className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={btnClass(editor.isActive({ textAlign: 'right' }))}
        title="दाईं ओर संरेखित (Align Right)"
      >
        <AlignRight className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-border-rule mx-1" />

      {/* 6. Links & Embeds */}
      <button
        type="button"
        onClick={handleOpenLinkModal}
        className={btnClass(editor.isActive('link'))}
        title="लिंक जोड़ें / संपादित करें (Link)"
      >
        <LinkIcon className="w-3.5 h-3.5" />
      </button>
      {editor.isActive('link') && (
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          className={btnClass(false)}
          title="लिंक हटाएं (Unlink)"
        >
          <Unlink className="w-3.5 h-3.5 text-breaking-crimson" />
        </button>
      )}

      <button
        type="button"
        onClick={onOpenMediaPicker}
        className={btnClass(false)}
        title="मीडिया लाइब्रेरी से छवि चुनें (Insert from Media Library)"
      >
        <FolderSearch className="w-3.5 h-3.5 text-primary-container" />
      </button>

      <button
        type="button"
        onClick={onInsertImage}
        className={btnClass(false)}
        title="छवि URL द्वारा डालें (Inline Image by URL)"
      >
        <ImageIcon className="w-3.5 h-3.5 text-secondary" />
      </button>

      <button
        type="button"
        onClick={onInsertYouTube}
        className={btnClass(false)}
        title="यूट्यूब वीडियो ब्लॉक डालें (Embed YouTube)"
      >
        <Video className="w-3.5 h-3.5 text-breaking-crimson" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={btnClass(false)}
        title="विभाजक रेखा (Horizontal Rule)"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-border-rule mx-1" />

      {/* 7. Devanagari Special Punctuation Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDevanagariMenu(!showDevanagariMenu)}
          className="h-7 px-2 bg-paper-canvas border border-border-rule text-on-surface hover:bg-paper-subtle flex items-center gap-1 font-mukta text-xs font-bold"
          title="देवनागरी विराम चिह्न"
        >
          <span>देवनागरी चिह्न (।)</span>
          <ChevronDown className="w-3 h-3 text-secondary" />
        </button>

        {showDevanagariMenu && (
          <div className="absolute top-full left-0 mt-1 bg-paper-canvas border border-border-rule shadow-lg py-1 z-30 min-w-[140px]">
            <button
              type="button"
              onClick={() => insertDevanagariChar('। ')}
              className="w-full text-left px-3 py-1.5 hover:bg-paper-tint text-xs font-mukta flex items-center justify-between"
            >
              <span>पूर्णविराम</span>
              <span className="font-bold text-sm text-primary-container">।</span>
            </button>
            <button
              type="button"
              onClick={() => insertDevanagariChar('॥ ')}
              className="w-full text-left px-3 py-1.5 hover:bg-paper-tint text-xs font-mukta flex items-center justify-between"
            >
              <span>दोहरा पूर्णविराम</span>
              <span className="font-bold text-sm text-primary-container">॥</span>
            </button>
            <button
              type="button"
              onClick={() => insertDevanagariChar('०')}
              className="w-full text-left px-3 py-1.5 hover:bg-paper-tint text-xs font-mukta flex items-center justify-between"
            >
              <span>लाघव चिह्न</span>
              <span className="font-bold text-sm">०</span>
            </button>
            <button
              type="button"
              onClick={() => insertDevanagariChar('— ')}
              className="w-full text-left px-3 py-1.5 hover:bg-paper-tint text-xs font-mukta flex items-center justify-between"
            >
              <span>एम-डैश</span>
              <span className="font-bold text-sm">—</span>
            </button>
          </div>
        )}
      </div>

      {/* 8. AI Proofreading Assistant Action */}
      {onOpenProofreading && (
        <button
          type="button"
          onClick={onOpenProofreading}
          className="h-7 px-2.5 bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 border border-primary-container/40 text-primary-container hover:bg-primary-container hover:text-white flex items-center gap-1.5 font-mukta text-xs font-bold transition-all shadow-2xs cursor-pointer ml-1"
          title="AI से वर्तनी व भाषा जाँच करें (Check with AI)"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary-container group-hover:text-white shrink-0" />
          <span>AI से जाँच करें</span>
        </button>
      )}

      {/* 9. Clear Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        className="h-7 px-2 ml-auto text-secondary hover:text-on-surface hover:bg-paper-subtle flex items-center gap-1 font-mukta text-xs"
        title="फॉर्मेट हटाएं (Clear Formatting)"
      >
        <RemoveFormatting className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">फॉर्मेट हटाएं</span>
      </button>

      {/* Link Input Modal / Popover */}
      {showLinkModal && (
        <div className="absolute top-full left-10 mt-1 bg-paper-canvas border border-border-rule shadow-xl p-3 z-30 flex items-center gap-2 min-w-[280px]">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com/..."
            className="flex-1 px-2.5 py-1 text-xs bg-paper-tint border border-border-rule focus:outline-none focus:bg-paper-canvas font-inter"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyLink();
              } else if (e.key === 'Escape') {
                setShowLinkModal(false);
              }
            }}
          />
          <button
            type="button"
            onClick={handleApplyLink}
            className="px-2.5 py-1 bg-primary-container text-white text-xs font-bold font-mukta hover:bg-primary"
          >
            लागू करें
          </button>
          <button
            type="button"
            onClick={() => setShowLinkModal(false)}
            className="px-2 py-1 text-secondary hover:text-on-surface text-xs font-mukta"
          >
            रद्द करें
          </button>
        </div>
      )}
    </div>
  );
}

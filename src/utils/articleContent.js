import React from 'react';

/**
 * Article Content Utilities for Azaad Samachar
 * Canonical TipTap JSON serializer, content normalizer, plain text extractor,
 * word count, reading time estimator, and React node renderer.
 */

/**
 * Creates a minimal valid empty TipTap document JSON
 */
export function getEmptyTipTapDoc() {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
      },
    ],
  };
}

/**
 * Converts a plain text string into a TipTap document structure.
 * Splits on double newlines to form separate paragraphs.
 */
export function textToTipTapDoc(text) {
  if (!text || typeof text !== 'string') {
    return getEmptyTipTapDoc();
  }

  // Pre-clean legacy HTML wrappers so raw <div> or <span> never become plain text
  const cleaned = text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/?(?:div|span|p|section|header|footer|aside)\b[^>]*>/gi, '');

  const paragraphs = cleaned
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return getEmptyTipTapDoc();
  }

  return {
    type: 'doc',
    content: paragraphs.map((para) => ({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: para,
        },
      ],
    })),
  };
}

/**
 * Normalizes article content into canonical TipTap JSON.
 * Gracefully handles:
 * - Already valid TipTap JSON doc object
 * - Stringified JSON doc
 * - Plain string / legacy mockNews format
 * - null/undefined
 */
export function normalizeArticleContent(rawContent) {
  if (!rawContent) {
    return getEmptyTipTapDoc();
  }

  // If already an object with type: 'doc'
  if (typeof rawContent === 'object' && rawContent !== null && rawContent.type === 'doc') {
    return rawContent;
  }

  // If string, check if it's stringified JSON or plain text
  if (typeof rawContent === 'string') {
    const trimmed = rawContent.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && parsed.type === 'doc') {
          return parsed;
        }
      } catch {
        // Fallback to text converter
      }
    }
    return textToTipTapDoc(rawContent);
  }

  return getEmptyTipTapDoc();
}

/**
 * Recursively extracts plain text from a TipTap JSON node tree.
 */
export function extractPlainText(content) {
  if (!content) return '';

  if (typeof content === 'string') {
    // If it looks like JSON doc, try parsing
    if (content.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(content);
        if (parsed && parsed.type === 'doc') {
          return extractPlainText(parsed);
        }
      } catch {
        // Plain text string
      }
    }
    return content;
  }

  if (typeof content === 'object') {
    if (content.type === 'text') {
      return content.text || '';
    }

    if (Array.isArray(content.content)) {
      return content.content
        .map((child) => extractPlainText(child))
        .filter(Boolean)
        .join(' ');
    }
  }

  return '';
}

/**
 * Counts words accurately across Hindi (Devanagari) and English text.
 */
export function countWords(content) {
  const text = extractPlainText(content).trim();
  if (!text) return 0;

  // Split by whitespace or Devanagari punctuation (danda ।, double danda ॥)
  const tokens = text.split(/[\s।॥,;:!?()\[\]"']+/).filter((token) => token.trim().length > 0);
  return tokens.length;
}

/**
 * Counts characters in the content (excluding extraneous whitespace).
 */
export function countCharacters(content) {
  const text = extractPlainText(content);
  return text.length;
}

/**
 * Estimates reading time based on 180 words per minute average reading speed.
 * Returns formatted string in Hindi (e.g. "3 मिनट") or English.
 */
export function estimateReadTime(content, language = 'hi') {
  const words = countWords(content);
  const minutes = Math.max(1, Math.ceil(words / 180));

  if (language === 'en') {
    return `${minutes} min read`;
  }
  return `${minutes} मिनट`;
}

/**
 * Helper to check if TipTap content has any substantive text
 */
export function isContentEmpty(content) {
  const text = extractPlainText(content).trim();
  return text.length === 0;
}

/**
 * Helper to render inline marks (bold, italic, underline, strike, link) using React.createElement
 */
function renderInlineMarks(node, key) {
  if (node.type === 'hardBreak') {
    return React.createElement('br', { key });
  }

  let element = node.text || '';
  if (typeof element === 'string') {
    element = element.replace(/<\/?(?:div|span|section|header|footer|aside|p)\b[^>]*>/gi, '');
  }

  if (node.marks && Array.isArray(node.marks)) {
    node.marks.forEach((mark, markIdx) => {
      if (mark.type === 'bold') {
        element = React.createElement('strong', { key: markIdx, className: 'font-bold text-on-surface' }, element);
      } else if (mark.type === 'italic') {
        element = React.createElement('em', { key: markIdx, className: 'italic' }, element);
      } else if (mark.type === 'underline') {
        element = React.createElement('u', { key: markIdx, className: 'underline' }, element);
      } else if (mark.type === 'strike') {
        element = React.createElement('del', { key: markIdx, className: 'line-through' }, element);
      } else if (mark.type === 'link') {
        element = React.createElement(
          'a',
          {
            key: markIdx,
            href: mark.attrs?.href,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'text-primary-container underline hover:text-primary font-medium',
          },
          element
        );
      }
    });
  }

  return React.createElement(React.Fragment, { key }, element);
}

/**
 * Renders a TipTap document JSON directly to styled React elements without JSX in .js file.
 */
export function renderTipTapContent(doc) {
  if (!doc) return null;

  const normalized = normalizeArticleContent(doc);
  if (!normalized || !Array.isArray(normalized.content)) return null;

  return normalized.content.map((node, i) => {
    // 1. Heading
    if (node.type === 'heading') {
      const level = node.attrs?.level || 2;
      const TagName = `h${level}`;
      const headingClass =
        level === 2
          ? 'font-mukta text-xl sm:text-2xl font-bold text-on-surface border-l-4 border-primary-container pl-3.5 py-1 my-5 leading-snug break-words'
          : level === 3
          ? 'font-mukta text-lg sm:text-xl font-bold text-on-surface my-4 leading-snug break-words'
          : 'font-mukta text-base sm:text-lg font-bold text-on-surface my-3 leading-snug break-words';

      const children = node.content?.map((child, childIdx) => renderInlineMarks(child, childIdx));
      return React.createElement(TagName, { key: i, className: headingClass }, children);
    }

    // 2. Blockquote
    if (node.type === 'blockquote') {
      const paragraphs = node.content?.map((child, childIdx) => {
        const pChildren = child.content?.map((grandChild, gcIdx) => renderInlineMarks(grandChild, gcIdx));
        return React.createElement('p', { key: childIdx, className: 'my-1' }, pChildren);
      });

      return React.createElement(
        'blockquote',
        {
          key: i,
          className:
            'my-6 bg-paper-tint border-l-4 border-primary-container p-4 sm:p-5 font-mukta text-lg sm:text-xl font-bold text-on-surface italic shadow-2xs break-words leading-relaxed',
        },
        paragraphs
      );
    }

    // 3. Bullet List
    if (node.type === 'bulletList') {
      const listItems = node.content?.map((li, liIdx) => {
        const itemContent = li.content?.map((child, childIdx) =>
          child.content?.map((gc, gcIdx) => renderInlineMarks(gc, gcIdx))
        );
        return React.createElement('li', { key: liIdx, className: 'leading-relaxed' }, itemContent);
      });

      return React.createElement(
        'ul',
        { key: i, className: 'list-disc pl-5 sm:pl-6 my-4 space-y-2 font-inter text-on-surface text-sm sm:text-base break-words leading-relaxed' },
        listItems
      );
    }

    // 4. Ordered List
    if (node.type === 'orderedList') {
      const listItems = node.content?.map((li, liIdx) => {
        const itemContent = li.content?.map((child, childIdx) =>
          child.content?.map((gc, gcIdx) => renderInlineMarks(gc, gcIdx))
        );
        return React.createElement('li', { key: liIdx, className: 'leading-relaxed' }, itemContent);
      });

      return React.createElement(
        'ol',
        { key: i, className: 'list-decimal pl-5 sm:pl-6 my-4 space-y-2 font-inter text-on-surface text-sm sm:text-base break-words leading-relaxed' },
        listItems
      );
    }

    // 5. Image
    if (node.type === 'image') {
      const img = React.createElement('img', {
        src: node.attrs?.src,
        alt: node.attrs?.alt || 'समाचार संबंधित चित्र',
        loading: 'lazy',
        decoding: 'async',
        className: 'w-full h-full object-cover',
      });

      const imgWrapper = React.createElement(
        'div',
        { className: 'w-full relative aspect-[16/9] bg-surface-container overflow-hidden border border-border-rule shadow-xs' },
        img
      );

      const figCaption = node.attrs?.title || node.attrs?.alt
        ? React.createElement(
            'figcaption',
            { className: 'font-inter text-xs text-secondary px-1 pt-1 leading-normal' },
            node.attrs?.title || node.attrs?.alt
          )
        : null;

      return React.createElement(
        'figure',
        { key: i, className: 'my-6 flex flex-col gap-1.5' },
        imgWrapper,
        figCaption
      );
    }

    // 6. YouTube Embed
    if (node.type === 'youtube') {
      const iframe = React.createElement('iframe', {
        src: `https://www.youtube-nocookie.com/embed/${node.attrs?.src}?controls=1`,
        title: 'समाचार संबंधित वीडियो',
        className: 'w-full h-full border-0',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        allowFullScreen: true,
      });

      return React.createElement(
        'div',
        { key: i, className: 'my-6 aspect-video w-full bg-black border border-border-rule shadow-sm' },
        iframe
      );
    }

    // 7. Horizontal Rule
    if (node.type === 'horizontalRule') {
      return React.createElement('hr', { key: i, className: 'my-6 border-t border-border-rule' });
    }

    // 8. Paragraph (Standard)
    const alignClass = node.attrs?.textAlign ? `text-${node.attrs.textAlign}` : '';
    const pChildren = node.content?.map((child, childIdx) => renderInlineMarks(child, childIdx));
    return React.createElement(
      'p',
      {
        key: i,
        className: `font-inter text-on-surface leading-[1.85] sm:leading-[1.9] my-4 text-base sm:text-[17px] break-words [word-break:break-word] whitespace-pre-line ${alignClass}`,
      },
      pChildren
    );
  });
}

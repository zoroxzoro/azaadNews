/**
 * WordPress HTML to TipTap (ProseMirror) Document Converter
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Converts WordPress HTML (Gutenberg blocks & Classic editor markup)
 * into a valid TipTap JSON document compatible with the portal's RichTextEditor
 * and ArticleBody rendering engine.
 *
 * Supported Nodes:
 * - paragraph
 * - heading (levels 2-4)
 * - blockquote
 * - bulletList & orderedList with listItem
 * - image (inline & figure)
 * - youtube embed
 * - horizontalRule
 *
 * Supported Marks:
 * - bold (strong, b)
 * - italic (em, i)
 * - underline (u)
 * - link (a href)
 */

/**
 * Decodes standard HTML entities
 */
export function decodeHtmlEntities(text) {
  if (!text) return '';
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
}

/**
 * Strips HTML tags to extract clean plain text
 */
export function stripHtmlTags(html) {
  if (!html) return '';
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/**
 * Parses inline HTML string (e.g. inside <p> or <h*>) into TipTap inline text nodes with marks.
 */
export function parseInlineContent(html) {
  if (!html) return [];

  // Strip block wrappers like div or span so they never get captured into plain text
  const sanitized = html.replace(/<\/?(?:div|span|section|header|footer|aside)\b[^>]*>/gi, '');

  const inlineNodes = [];
  // Tokenize by inline tags: <strong>, <b>, <em>, <i>, <u>, <a>, <br>
  const tagRegex = /<\/?(strong|b|em|i|u|a|br)\b([^>]*)>/gi;

  let lastIndex = 0;
  const activeMarks = [];
  let match;

  while ((match = tagRegex.exec(sanitized)) !== null) {
    const textBefore = sanitized.slice(lastIndex, match.index);
    if (textBefore) {
      const decoded = decodeHtmlEntities(textBefore);
      if (decoded.length > 0) {
        inlineNodes.push({
          type: 'text',
          text: decoded,
          ...(activeMarks.length > 0 ? { marks: [...activeMarks] } : {}),
        });
      }
    }

    const fullTag = match[0];
    const tagName = match[1].toLowerCase();
    const isClosing = fullTag.startsWith('</');
    const attributes = match[2] || '';

    if (tagName === 'br') {
      // Line break: add newline text or hard_break
      inlineNodes.push({
        type: 'text',
        text: '\n',
        ...(activeMarks.length > 0 ? { marks: [...activeMarks] } : {}),
      });
    } else if (isClosing) {
      // Remove mark from active marks
      const markType =
        tagName === 'strong' || tagName === 'b'
          ? 'bold'
          : tagName === 'em' || tagName === 'i'
          ? 'italic'
          : tagName === 'u'
          ? 'underline'
          : tagName === 'a'
          ? 'link'
          : null;

      if (markType) {
        const idx = activeMarks.findIndex((m) => m.type === markType);
        if (idx !== -1) activeMarks.splice(idx, 1);
      }
    } else {
      // Opening tag
      if (tagName === 'strong' || tagName === 'b') {
        if (!activeMarks.some((m) => m.type === 'bold')) activeMarks.push({ type: 'bold' });
      } else if (tagName === 'em' || tagName === 'i') {
        if (!activeMarks.some((m) => m.type === 'italic')) activeMarks.push({ type: 'italic' });
      } else if (tagName === 'u') {
        if (!activeMarks.some((m) => m.type === 'underline')) activeMarks.push({ type: 'underline' });
      } else if (tagName === 'a') {
        const hrefMatch = attributes.match(/href=["']([^"']*)["']/i);
        const href = hrefMatch ? hrefMatch[1] : '';
        if (href) {
          activeMarks.push({
            type: 'link',
            attrs: {
              href,
              target: '_blank',
              rel: 'noopener noreferrer nofollow',
            },
          });
        }
      }
    }

    lastIndex = tagRegex.lastIndex;
  }

  // Trailing text
  const remaining = sanitized.slice(lastIndex);
  if (remaining) {
    const decoded = decodeHtmlEntities(remaining);
    if (decoded.length > 0) {
      inlineNodes.push({
        type: 'text',
        text: decoded,
        ...(activeMarks.length > 0 ? { marks: [...activeMarks] } : {}),
      });
    }
  }

  return inlineNodes;
}

/**
 * Converts WordPress HTML content to a TipTap JSON document.
 * Returns { doc, warnings }
 */
export function convertWpHtmlToTipTap(rawHtml) {
  const warnings = [];

  if (!rawHtml || typeof rawHtml !== 'string' || !rawHtml.trim()) {
    return {
      doc: { type: 'doc', content: [{ type: 'paragraph' }] },
      warnings: ['Empty content string provided'],
    };
  }

  // 1. Remove Gutenberg block comments: <!-- wp:... --> and <!-- /wp:... -->
  let cleaned = rawHtml.replace(/<!--\s*\/?wp:[^>]*-->/gi, '\n');

  // 2. Identify and extract YouTube iframes
  cleaned = cleaned.replace(/<iframe\b[^>]*src=["']([^"']*(?:youtube\.com|youtu\.be)[^"']*)["'][^>]*>.*?<\/iframe>/gi, (match, src) => {
    return `\n<div data-youtube-embed="${src}"></div>\n`;
  });

  // 3. Tokenize by top-level block elements: h1-h6, p, blockquote, ul, ol, figure, img, hr, div
  const blockRegex = /<(h[1-6]|p|blockquote|ul|ol|figure|img|hr|div)\b([^>]*)>([\s\S]*?)<\/\1>|<(img|hr|div)\b([^>]*)\/?>/gi;

  const contentNodes = [];
  let lastIndex = 0;
  let match;

  while ((match = blockRegex.exec(cleaned)) !== null) {
    // Check if there was uncontained text between blocks
    const betweenText = cleaned.slice(lastIndex, match.index).trim();
    if (betweenText) {
      const inlineChildren = parseInlineContent(betweenText);
      if (inlineChildren.length > 0) {
        contentNodes.push({ type: 'paragraph', content: inlineChildren });
      }
    }

    const tagName = (match[1] || match[4] || '').toLowerCase();
    const attributes = match[2] || match[5] || '';
    const innerHtml = match[3] || '';

    // A. Headings
    if (/^h[1-6]$/.test(tagName)) {
      const rawLevel = parseInt(tagName.slice(1), 10);
      const level = Math.min(Math.max(rawLevel, 2), 4); // Clamp to 2, 3, or 4
      const inline = parseInlineContent(innerHtml);
      if (inline.length > 0) {
        contentNodes.push({
          type: 'heading',
          attrs: { level },
          content: inline,
        });
      }
    }

    // B. Paragraph
    else if (tagName === 'p') {
      // Check if paragraph is just an image or YouTube embed
      if (innerHtml.includes('<img')) {
        const imgMatch = innerHtml.match(/<img\b([^>]*)>/i);
        if (imgMatch) {
          const srcMatch = imgMatch[1].match(/src=["']([^"']*)["']/i);
          const altMatch = imgMatch[1].match(/alt=["']([^"']*)["']/i);
          const titleMatch = imgMatch[1].match(/title=["']([^"']*)["']/i);
          if (srcMatch && srcMatch[1]) {
            contentNodes.push({
              type: 'image',
              attrs: {
                src: srcMatch[1],
                alt: altMatch ? altMatch[1] : '',
                title: titleMatch ? titleMatch[1] : null,
              },
            });
          }
        }
      } else {
        const inline = parseInlineContent(innerHtml);
        if (inline.length > 0) {
          contentNodes.push({ type: 'paragraph', content: inline });
        }
      }
    }

    // C. Blockquote
    else if (tagName === 'blockquote') {
      const pMatch = innerHtml.match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi);
      if (pMatch && pMatch.length > 0) {
        const paragraphs = pMatch
          .map((p) => {
            const inner = p.replace(/<\/?p\b[^>]*>/gi, '');
            const inline = parseInlineContent(inner);
            return inline.length > 0 ? { type: 'paragraph', content: inline } : null;
          })
          .filter(Boolean);

        if (paragraphs.length > 0) {
          contentNodes.push({ type: 'blockquote', content: paragraphs });
        }
      } else {
        const inline = parseInlineContent(innerHtml);
        if (inline.length > 0) {
          contentNodes.push({
            type: 'blockquote',
            content: [{ type: 'paragraph', content: inline }],
          });
        }
      }
    }

    // D. Bullet List & Ordered List
    else if (tagName === 'ul' || tagName === 'ol') {
      const listType = tagName === 'ul' ? 'bulletList' : 'orderedList';
      const liMatches = innerHtml.match(/<li\b[^>]*>([\s\S]*?)<\/li>/gi) || [];
      const listItems = [];

      for (const li of liMatches) {
        const itemHtml = li.replace(/<\/?li\b[^>]*>/gi, '');
        const inline = parseInlineContent(itemHtml);
        if (inline.length > 0) {
          listItems.push({
            type: 'listItem',
            content: [{ type: 'paragraph', content: inline }],
          });
        }
      }

      if (listItems.length > 0) {
        contentNodes.push({ type: listType, content: listItems });
      }
    }

    // E. Figure or Direct Image
    else if (tagName === 'figure' || tagName === 'img') {
      const imgHtml = tagName === 'figure' ? innerHtml : match[0];
      const srcMatch = imgHtml.match(/src=["']([^"']*)["']/i);
      const altMatch = imgHtml.match(/alt=["']([^"']*)["']/i);
      const captionMatch = innerHtml.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i);

      if (srcMatch && srcMatch[1]) {
        contentNodes.push({
          type: 'image',
          attrs: {
            src: srcMatch[1],
            alt: altMatch ? altMatch[1] : '',
            title: captionMatch ? stripHtmlTags(captionMatch[1]) : null,
          },
        });
      }
    }

    // F. YouTube Embed Container
    else if (tagName === 'div' && attributes.includes('data-youtube-embed')) {
      const ytSrc = attributes.match(/data-youtube-embed=["']([^"']*)["']/i);
      if (ytSrc && ytSrc[1]) {
        contentNodes.push({
          type: 'youtube',
          attrs: { src: ytSrc[1] },
        });
      }
    }

    // F2. Generic Div Block (extract inner inline content as paragraph)
    else if (tagName === 'div') {
      const inline = parseInlineContent(innerHtml);
      if (inline.length > 0) {
        contentNodes.push({ type: 'paragraph', content: inline });
      }
    }

    // G. Horizontal Rule
    else if (tagName === 'hr') {
      contentNodes.push({ type: 'horizontalRule' });
    }

    lastIndex = blockRegex.lastIndex;
  }

  // Remaining text after last block
  const tail = cleaned.slice(lastIndex).trim();
  if (tail) {
    const inline = parseInlineContent(tail);
    if (inline.length > 0) {
      contentNodes.push({ type: 'paragraph', content: inline });
    }
  }

  // Fallback: If no structured blocks were parsed, split plain text by newlines
  if (contentNodes.length === 0) {
    const paragraphs = cleaned
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    for (const p of paragraphs) {
      const inline = parseInlineContent(p);
      if (inline.length > 0) {
        contentNodes.push({ type: 'paragraph', content: inline });
      }
    }
  }

  if (contentNodes.length === 0) {
    contentNodes.push({ type: 'paragraph' });
  }

  return {
    doc: {
      type: 'doc',
      content: contentNodes,
    },
    warnings,
  };
}

export const wpHtmlToTipTap = (rawHtml) => convertWpHtmlToTipTap(rawHtml).doc;

/**
 * Editor Text Mapping Utilities for TipTap / ProseMirror
 * Accurately finds ProseMirror document positions [from, to] for text matches
 * without altering document structure or relying on ambiguous global string replacement.
 */

/**
 * Searches the TipTap ProseMirror document for all occurrences of a pattern (RegExp or string)
 * within text nodes and returns their exact ProseMirror document coordinates.
 *
 * @param {import('@tiptap/pm/model').Node} doc - The ProseMirror doc node
 * @param {RegExp|string} pattern - Search pattern
 * @returns {Array<{ from: number, to: number, matchedText: string, nodeText: string }>}
 */
export function findMatchesInDoc(doc, pattern) {
  if (!doc) return [];

  const matches = [];

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;

    const text = node.text;

    if (pattern instanceof RegExp) {
      // Ensure regex has global flag to find all occurrences in this node
      const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
      const regex = new RegExp(pattern.source, flags);
      let match;

      while ((match = regex.exec(text)) !== null) {
        const matchedText = match[0];
        if (!matchedText) break; // Avoid infinite loop on zero-width match

        const startInNode = match.index;
        const endInNode = startInNode + matchedText.length;

        matches.push({
          from: pos + startInNode,
          to: pos + endInNode,
          matchedText,
          nodeText: text,
        });
      }
    } else if (typeof pattern === 'string') {
      let startIndex = 0;
      while ((startIndex = text.indexOf(pattern, startIndex)) !== -1) {
        matches.push({
          from: pos + startIndex,
          to: pos + startIndex + pattern.length,
          matchedText: pattern,
          nodeText: text,
        });
        startIndex += pattern.length;
      }
    }
  });

  return matches;
}

/**
 * Verifies if a suggestion's text range in the ProseMirror doc still matches its original text.
 * Returns true if valid, false if the document has been modified and the range is stale.
 *
 * @param {import('@tiptap/react').Editor} editor - TipTap editor instance
 * @param {number} from - Start document position
 * @param {number} to - End document position
 * @param {string} originalText - Expected text at this position
 * @returns {boolean}
 */
export function verifyTextRangeMatch(editor, from, to, originalText) {
  if (!editor || !editor.state || !editor.state.doc) return false;
  const doc = editor.state.doc;

  // Check bounds
  if (from < 0 || to > doc.content.size || from >= to) return false;

  try {
    const currentText = doc.textBetween(from, to, ' ');
    return currentText === originalText;
  } catch {
    return false;
  }
}

/**
 * Safely replaces a suggestion's text range in TipTap editor using a ProseMirror transaction.
 *
 * @param {import('@tiptap/react').Editor} editor - TipTap editor instance
 * @param {number} from - Start doc position
 * @param {number} to - End doc position
 * @param {string} replacementText - Text to replace with
 * @param {string} originalText - Expected original text for safety check
 * @returns {boolean} - True if successfully replaced, false if stale/cancelled
 */
export function replaceTextRange(editor, from, to, replacementText, originalText) {
  if (!verifyTextRangeMatch(editor, from, to, originalText)) {
    return false;
  }

  const { tr } = editor.state;
  tr.insertText(replacementText, from, to);
  editor.view.dispatch(tr);
  return true;
}

/**
 * Scrolls the TipTap editor so that the given position is visible and focused.
 */
export function scrollToRange(editor, from, to) {
  if (!editor || !editor.view) return;

  try {
    editor.commands.setTextSelection({ from, to });
    editor.commands.scrollIntoView();
  } catch {
    // Graceful fallback if selection fails
  }
}

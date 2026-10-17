import { Extension } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const proofreadingPluginKey = new PluginKey('proofreadingHighlight');

/**
 * Creates inline ProseMirror decorations for proofreading suggestions.
 */
function createDecorations(doc, suggestions = [], activeId = null) {
  if (!doc || !suggestions || suggestions.length === 0) {
    return DecorationSet.empty;
  }

  const decorations = [];

  suggestions.forEach((suggestion) => {
    const { location, type, id } = suggestion;
    if (!location || typeof location.from !== 'number' || typeof location.to !== 'number') {
      return;
    }

    const { from, to } = location;

    // Safety checks against document bounds
    if (from < 0 || to > doc.content.size || from >= to) {
      return;
    }

    const isActive = activeId === id;

    // Distinct category styling classes
    let categoryClass = 'proofreading-highlight-spelling';
    if (type === 'grammar') categoryClass = 'proofreading-highlight-grammar';
    else if (type === 'punctuation') categoryClass = 'proofreading-highlight-punctuation';
    else if (type === 'clarity' || type === 'style') categoryClass = 'proofreading-highlight-style';

    const activeClass = isActive ? 'proofreading-highlight-active' : '';

    decorations.push(
      Decoration.inline(from, to, {
        class: `proofreading-highlight ${categoryClass} ${activeClass}`,
        'data-suggestion-id': id,
        'data-category': type,
        title: `AI सुझाव (${type}): ${suggestion.suggestedText}`,
      })
    );
  });

  return DecorationSet.create(doc, decorations);
}

/**
 * TipTap Extension: ProofreadingHighlight
 */
export const ProofreadingHighlight = Extension.create({
  name: 'proofreadingHighlight',

  addCommands() {
    return {
      setProofreadingHighlights:
        (suggestions, activeId = null) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(proofreadingPluginKey, { suggestions, activeId });
          }
          return true;
        },
      clearProofreadingHighlights:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(proofreadingPluginKey, { suggestions: [], activeId: null });
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: proofreadingPluginKey,
        state: {
          init: () => ({
            decorations: DecorationSet.empty,
            suggestions: [],
            activeId: null,
          }),
          apply: (tr, prev, oldState, newState) => {
            const meta = tr.getMeta(proofreadingPluginKey);

            if (meta) {
              const suggestions = meta.suggestions || [];
              const activeId = meta.activeId !== undefined ? meta.activeId : prev.activeId;
              return {
                decorations: createDecorations(newState.doc, suggestions, activeId),
                suggestions,
                activeId,
              };
            }

            // Map decorations across document transactions
            if (tr.docChanged) {
              return {
                decorations: prev.decorations.map(tr.mapping, newState.doc),
                suggestions: prev.suggestions,
                activeId: prev.activeId,
              };
            }

            return prev;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)?.decorations;
          },
          handleClick(view, pos, event) {
            const target = event.target;
            const highlightedElement = target.closest('[data-suggestion-id]');

            if (highlightedElement) {
              const suggestionId = highlightedElement.getAttribute('data-suggestion-id');
              if (suggestionId) {
                // Dispatch custom event to select suggestion in ProofreadingPanel
                window.dispatchEvent(
                  new CustomEvent('azaad:select-suggestion', {
                    detail: { suggestionId },
                  })
                );
                return true;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});

export default ProofreadingHighlight;

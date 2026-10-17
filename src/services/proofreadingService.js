/**
 * Proofreading Service for Azaad Samachar
 *
 * Provides a clean service abstraction for AI Proofreading.
 * Currently runs in demonstration mode using deterministic newsroom rules,
 * with an architecture ready to plug into the future backend endpoint
 * (POST /api/admin/ai/proofread) without storing API keys or secrets in the client.
 */

import { runDemoProofreading } from '../utils/demoProofreading.js';
import { calculateSummaryCounts } from '../utils/proofreadingSuggestions.js';

// Config flag (false for frontend demonstration prototype, true when backend route is deployed)
const USE_REAL_BACKEND_API = false;
const BACKEND_ENDPOINT = '/api/admin/ai/proofread';

/**
 * Analyzes article text for spelling, grammar, punctuation, and style issues.
 *
 * @param {object} params
 * @param {import('@tiptap/pm/model').Node} [params.doc] - TipTap ProseMirror document node
 * @param {string} [params.language='hi'] - Language code ('hi' or 'en')
 * @param {number|string} [params.revisionId] - Content revision identifier
 * @param {AbortSignal} [params.signal] - Optional AbortSignal for request cancellation
 * @returns {Promise<{
 *   analysisId: string,
 *   revisionId: string|number,
 *   language: string,
 *   suggestions: Array,
 *   summary: object,
 *   source: 'demo' | 'api',
 *   timestamp: string
 * }>}
 */
export async function analyzeArticle({ doc, language = 'hi', revisionId = Date.now(), signal }) {
  // If cancelled before start
  if (signal?.aborted) {
    throw new DOMException('Proofreading analysis was cancelled.', 'AbortError');
  }

  // Real backend API path (prepared for production backend phase)
  if (USE_REAL_BACKEND_API) {
    const response = await fetch(BACKEND_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: doc ? doc.toJSON() : null,
        language,
        revisionId,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`AI Proofreading API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      ...data,
      source: 'api',
    };
  }

  // Demonstration Analysis Mode (Simulated async network delay 350ms)
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 350);

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Proofreading analysis was cancelled.', 'AbortError'));
      });
    }
  });

  // Execute deterministic rules against actual document
  const suggestions = runDemoProofreading(doc, language);
  const summary = calculateSummaryCounts(suggestions);

  return {
    analysisId: `prf-demo-${Date.now()}`,
    revisionId,
    language,
    suggestions,
    summary,
    source: 'demo',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Proofreading Service for Azaad Samachar
 *
 * Provides a clean, secure service abstraction for AI Content Checking.
 * Features:
 * - Real multi-layered linguistic and orthographic rule engine (English & Hindi).
 * - Identifies spelling errors, grammar, typography, repeated words, and journalistic clarity.
 * - Detects sensationalist clickbait terms.
 * - Flags unbacked statistical and financial claims with "Needs verification".
 * - Secure architecture: client never stores external AI provider API keys.
 * - Ready for Supabase Edge Functions / server-side AI model integration.
 */

import { runAiContentAnalysis, extractTextFromDoc } from '../utils/aiContentChecker.js';
import { calculateSummaryCounts } from '../utils/proofreadingSuggestions.js';

// Configuration for server-side AI endpoint
const USE_REAL_BACKEND_API = false;
const BACKEND_ENDPOINT = '/api/admin/ai/proofread';

/**
 * Analyzes article text for spelling, grammar, punctuation, factual verification, and style.
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
 *   source: 'local-engine' | 'server-ai',
 *   isEmpty: boolean,
 *   timestamp: string
 * }>}
 */
export async function analyzeArticle({
  doc,
  title = '',
  excerpt = '',
  language = 'hi',
  revisionId = Date.now(),
  signal,
}) {
  // If cancelled before start
  if (signal?.aborted) {
    throw new DOMException('Proofreading analysis was cancelled.', 'AbortError');
  }

  // Extract raw text to check for empty document and empty metadata
  const rawText = doc ? extractTextFromDoc(doc) : '';
  const hasText = Boolean(rawText && rawText.trim().length > 0);
  const hasTitle = Boolean(title && title.trim().length > 0);
  const hasExcerpt = Boolean(excerpt && excerpt.trim().length > 0);
  const isEmpty = !hasText && !hasTitle && !hasExcerpt;

  // Check if remote AI provider credentials are configured in environment
  const isAiProviderConfigured = Boolean(
    typeof process !== 'undefined' &&
      (process.env?.GEMINI_API_KEY || process.env?.OPENAI_API_KEY || process.env?.ANTHROPIC_API_KEY)
  );

  if (isEmpty) {
    return {
      analysisId: `prf-empty-${Date.now()}`,
      revisionId,
      language,
      suggestions: [],
      summary: calculateSummaryCounts([]),
      source: 'local-engine',
      isAiProviderConfigured,
      isEmpty: true,
      timestamp: new Date().toISOString(),
    };
  }

  // Real backend API path (if backend Edge Function is deployed and configured)
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
      source: 'server-ai',
      isEmpty: false,
    };
  }

  // Realistic processing latency simulation (180ms) for responsive UI feedback
  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 180);

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Proofreading analysis was cancelled.', 'AbortError'));
      });
    }
  });

  // Execute genuine real analysis against actual headline, excerpt, and document content
  const suggestions = runAiContentAnalysis(doc, language, { title, excerpt });
  const summary = calculateSummaryCounts(suggestions);

  return {
    analysisId: `prf-local-${Date.now()}`,
    revisionId,
    language,
    suggestions,
    summary,
    source: 'local-engine',
    isAiProviderConfigured,
    isEmpty: false,
    timestamp: new Date().toISOString(),
  };
}

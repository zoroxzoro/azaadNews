/**
 * Proofreading Suggestions Utilities for Azaad Samachar
 * Derives dynamic summary counts, filters, and safe non-overlapping batch planning.
 */

/**
 * Calculates issue count metrics directly from the active suggestions array.
 * Never hardcodes counts.
 *
 * @param {Array} suggestions - List of suggestions
 * @returns {{ total: number, spelling: number, grammar: number, punctuation: number, clarity: number, style: number, safeCount: number }}
 */
export function calculateSummaryCounts(suggestions = []) {
  const counts = {
    total: suggestions.length,
    spelling: 0,
    grammar: 0,
    punctuation: 0,
    clarity: 0,
    style: 0,
    sensationalism: 0,
    fact_check: 0,
    safeCount: 0,
  };

  suggestions.forEach((item) => {
    if (item.type === 'spelling') counts.spelling += 1;
    else if (item.type === 'grammar') counts.grammar += 1;
    else if (item.type === 'punctuation') counts.punctuation += 1;
    else if (item.type === 'clarity') counts.clarity += 1;
    else if (item.type === 'style') counts.style += 1;
    else if (item.type === 'sensationalism') counts.sensationalism += 1;
    else if (item.type === 'fact_check') counts.fact_check += 1;

    if (item.isSafeToAutoApply && item.confidence === 'high') {
      counts.safeCount += 1;
    }
  });

  return counts;
}

/**
 * Filters suggestions by category tab and optional keyword search.
 */
export function filterSuggestions(suggestions = [], activeCategory = 'all', searchQuery = '') {
  let filtered = suggestions;

  if (activeCategory !== 'all') {
    if (activeCategory === 'clarity_style') {
      filtered = filtered.filter((s) => s.type === 'clarity' || s.type === 'style');
    } else {
      filtered = filtered.filter((s) => s.type === activeCategory);
    }
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (s) =>
        s.originalText.toLowerCase().includes(q) ||
        s.suggestedText.toLowerCase().includes(q) ||
        s.explanation.toLowerCase().includes(q)
    );
  }

  return filtered;
}

/**
 * Selects only safe, high-confidence, non-overlapping suggestions for batch acceptance.
 * Returns them sorted in REVERSE order (from end of document toward beginning)
 * so that replacing text at later positions does not displace the coordinates of earlier positions!
 *
 * @param {Array} suggestions
 * @returns {Array} - Safe suggestions sorted in descending document position order
 */
export function getSafeBatchSuggestions(suggestions = []) {
  // 1. Only include safe items
  const candidates = suggestions.filter(
    (s) => s.isSafeToAutoApply && s.confidence === 'high' && s.location && typeof s.location.from === 'number'
  );

  // 2. Sort by location.from ascending to check overlap
  candidates.sort((a, b) => a.location.from - b.location.from);

  const nonOverlapping = [];
  let lastEnd = -1;

  for (const item of candidates) {
    if (item.location.from >= lastEnd) {
      nonOverlapping.push(item);
      lastEnd = item.location.to;
    }
  }

  // 3. Return sorted in DESCENDING position order for reverse replacement execution
  return nonOverlapping.sort((a, b) => b.location.from - a.location.from);
}

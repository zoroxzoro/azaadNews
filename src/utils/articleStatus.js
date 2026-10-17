/**
 * Article Status Configuration & Workflow Transitions
 * Centralized business logic for Azaad Samachar editorial statuses.
 */

export const ARTICLE_STATUS = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
};

/**
 * Normalizes status strings (handles legacy 'review' -> 'in_review')
 */
export function normalizeStatus(status) {
  if (!status) return ARTICLE_STATUS.DRAFT;
  const s = String(status).toLowerCase().trim();
  if (s === 'review' || s === 'in_review') return ARTICLE_STATUS.IN_REVIEW;
  if (s === 'scheduled') return ARTICLE_STATUS.SCHEDULED;
  if (s === 'published') return ARTICLE_STATUS.PUBLISHED;
  return ARTICLE_STATUS.DRAFT;
}

export const STATUS_META = {
  [ARTICLE_STATUS.DRAFT]: {
    key: ARTICLE_STATUS.DRAFT,
    labelHindi: 'ड्राफ्ट',
    labelEnglish: 'Draft',
    description: 'आलेख पर कार्य जारी है, अप्रकाशित।',
    badgeClass: 'bg-paper-subtle text-secondary border-border-rule',
  },
  [ARTICLE_STATUS.IN_REVIEW]: {
    key: ARTICLE_STATUS.IN_REVIEW,
    labelHindi: 'समीक्षाधीन',
    labelEnglish: 'In Review',
    description: 'वरिष्ठ संपादक की स्वीकृति हेतु लंबित।',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  },
  [ARTICLE_STATUS.SCHEDULED]: {
    key: ARTICLE_STATUS.SCHEDULED,
    labelHindi: 'शेड्यूल्ड',
    labelEnglish: 'Scheduled',
    description: 'निर्धारित समय पर प्रकाशन हेतु कतार में।',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
  },
  [ARTICLE_STATUS.PUBLISHED]: {
    key: ARTICLE_STATUS.PUBLISHED,
    labelHindi: 'प्रकाशित (Live)',
    labelEnglish: 'Published',
    description: 'सार्वजनिक पोर्टल पर लाइव प्रदर्शित।',
    badgeClass: 'bg-ticker-tint text-breaking-crimson border-breaking-crimson/30',
  },
};

/**
 * Workflow Allowed Transitions Matrix:
 *
 * draft -> in_review, published (editor/admin)
 * in_review -> draft, published, scheduled
 * scheduled -> draft, published (immediate)
 * published -> draft (unpublish)
 */
export const ALLOWED_TRANSITIONS = {
  [ARTICLE_STATUS.DRAFT]: [
    { target: ARTICLE_STATUS.IN_REVIEW, labelHindi: 'समीक्षा हेतु भेजें', labelEnglish: 'Submit for Review' },
    { target: ARTICLE_STATUS.SCHEDULED, labelHindi: 'प्रकाशन शेड्यूल करें', labelEnglish: 'Schedule Publication' },
    { target: ARTICLE_STATUS.PUBLISHED, labelHindi: 'सीधा प्रकाशित करें', labelEnglish: 'Publish Now' },
  ],
  [ARTICLE_STATUS.IN_REVIEW]: [
    { target: ARTICLE_STATUS.PUBLISHED, labelHindi: 'स्वीकृत एवं प्रकाशित करें', labelEnglish: 'Approve & Publish' },
    { target: ARTICLE_STATUS.SCHEDULED, labelHindi: 'शेड्यूल करें', labelEnglish: 'Schedule Publication' },
    { target: ARTICLE_STATUS.DRAFT, labelHindi: 'ड्राफ्ट में वापस लौटाएं', labelEnglish: 'Return to Draft' },
  ],
  [ARTICLE_STATUS.SCHEDULED]: [
    { target: ARTICLE_STATUS.PUBLISHED, labelHindi: 'अभी तुरंत प्रकाशित करें', labelEnglish: 'Publish Immediately' },
    { target: ARTICLE_STATUS.DRAFT, labelHindi: 'शेड्यूल रद्द करें (ड्राफ्ट)', labelEnglish: 'Cancel Schedule' },
  ],
  [ARTICLE_STATUS.PUBLISHED]: [
    { target: ARTICLE_STATUS.DRAFT, labelHindi: 'अप्रकाशित करें (Unpublish)', labelEnglish: 'Unpublish to Draft' },
  ],
};

/**
 * Checks whether transitioning from currentStatus to targetStatus is allowed
 */
export function canTransitionStatus(fromStatus, toStatus, userRole = 'editor') {
  const current = normalizeStatus(fromStatus);
  const target = normalizeStatus(toStatus);

  if (current === target) return false;

  const validOptions = ALLOWED_TRANSITIONS[current] || [];
  return validOptions.some((opt) => opt.target === target);
}

/**
 * Returns the list of valid next status transitions for a given article
 */
export function getAvailableStatusTransitions(status, userRole = 'editor') {
  const current = normalizeStatus(status);
  return ALLOWED_TRANSITIONS[current] || [];
}

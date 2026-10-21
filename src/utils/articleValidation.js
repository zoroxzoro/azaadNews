/**
 * Article Validation Utilities for Azaad Samachar Newsroom Workstation
 */

import { isContentEmpty } from './articleContent.js';
import { getYouTubeVideoId } from './youtube.js';
import { isSlugUnique, isValidSlug } from './slugUtils.js';

/**
 * Validates whether an article has sufficient minimum content to be saved as a draft.
 */
export function validateDraft(formData) {
  const errors = {};

  const hasTitle = Boolean(formData.title && formData.title.trim().length > 0);
  const hasSummary = Boolean(formData.summary && formData.summary.trim().length > 0);
  const hasBody = Boolean(formData.content && !isContentEmpty(formData.content));

  if (!hasTitle && !hasSummary && !hasBody) {
    errors.general = 'ड्राफ्ट सहेजने के लिए कम से कम शीर्षक, सारांश या आलेख सामग्री दर्ज करें।';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates full editorial requirements for submitting for review or publishing.
 */
export function validateForPublishing(formData, currentArticleId, allArticles = []) {
  const errors = {};

  // 1. Title / Headline
  if (!formData.title || formData.title.trim().length < 5) {
    errors.title = 'मुख्य शीर्षक आवश्यक है (कम से कम 5 वर्ण दर्ज करें)।';
  } else if (formData.title.length > 250) {
    errors.title = 'शीर्षक 250 वर्णों से अधिक नहीं होना चाहिए।';
  }

  // 2. Summary
  if (!formData.summary || formData.summary.trim().length < 10) {
    errors.summary = 'संक्षिप्त सारांश (Lead Summary) आवश्यक है (कम से कम 10 वर्ण)।';
  }

  // 3. Category
  if (!formData.category || formData.category.trim().length === 0) {
    errors.category = 'समाचार की श्रेणी चुनना अनिवार्य है।';
  }

  // 4. Language
  if (!formData.language || !['hi', 'en'].includes(formData.language)) {
    errors.language = 'भाषा (हिंदी / English) का चयन अनिवार्य है।';
  }

  // 5. Article Content / Body
  if (!formData.content || isContentEmpty(formData.content)) {
    errors.content = 'आलेख की विस्तृत सामग्री (Article Body) खाली नहीं हो सकती।';
  }

  // 6. Slug uniqueness & format
  if (!formData.slug || !formData.slug.trim()) {
    errors.slug = 'यूआरएल स्लग (URL Slug) आवश्यक है।';
  } else if (!isValidSlug(formData.slug)) {
    errors.slug = 'अमान्य स्लग प्रारूप। केवल छोटे अक्षर, संख्याएं और हाइफन मान्य हैं।';
  } else if (!isSlugUnique(formData.slug, currentArticleId, allArticles)) {
    errors.slug = 'यह यूआरएल स्लग पहले से किसी अन्य समाचार में उपयोग हो रहा है।';
  }

  // 7. Featured Image URL (if provided)
  if (formData.featuredImage && formData.featuredImage.trim()) {
    try {
      const url = new URL(formData.featuredImage.trim());
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.featuredImage = 'छवि यूआरएल http या https से प्रारंभ होना चाहिए।';
      }
    } catch {
      errors.featuredImage = 'अमान्य छवि यूआरएल। कृपया मान्य वेब पता दर्ज करें।';
    }
  }

  // 8. YouTube URL (if provided)
  if (formData.youtubeUrl && formData.youtubeUrl.trim()) {
    const videoId = getYouTubeVideoId(formData.youtubeUrl.trim());
    if (!videoId) {
      errors.youtubeUrl = 'अमान्य यूट्यूब यूआरएल। मान्य यूट्यूब वीडियो लिंक दर्ज करें।';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

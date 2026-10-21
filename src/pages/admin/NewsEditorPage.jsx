import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useArticles } from '../../context/ArticleContext';
import { useAuth } from '../../context/AuthContext';
import { articlesService } from '../../services/articlesService';
import { ARTICLE_STATUS } from '../../utils/articleStatus';
import { hasPermission, canEditArticle } from '../../utils/articlePermissions';
import AdminAccessDeniedPage from './AdminAccessDeniedPage';
import { generateSlug, isSlugUnique } from '../../utils/slugUtils';
import {
  getEmptyTipTapDoc,
  normalizeArticleContent,
  countWords,
  countCharacters,
  estimateReadTime,
  extractPlainText,
} from '../../utils/articleContent';
import { validateDraft, validateForPublishing } from '../../utils/articleValidation';

// Subcomponents
import {
  RichTextEditor,
  EditorStatusBar,
  FeaturedImageInput,
  YouTubeInput,
  TagsInput,
  SEOSettings,
  ArticleSettings,
  ArticlePreviewModal,
  UnsavedChangesDialog,
} from '../../components/admin/editor';

import { ProofreadingPanel } from '../../components/admin/ai';
import { SchedulingDialog } from '../../components/admin/scheduling';
import { formatInIST } from '../../utils/timezoneUtils';
import { analyzeArticle } from '../../services/proofreadingService';
import {
  replaceTextRange,
  scrollToRange,
  verifyTextRangeMatch,
} from '../../utils/editorTextMapping';
import { getSafeBatchSuggestions } from '../../utils/proofreadingSuggestions';

import { AlertCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationService } from '../../services/notificationService';

export default function NewsEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { articles, getArticleById, createArticle, updateArticle } = useArticles();
  const { currentUser: user } = useAuth();

  const userRole = user?.role || 'editor';
  const canPublish = hasPermission(userRole, 'canPublish');

  const [fetchedArticle, setFetchedArticle] = useState(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(isEditing && !getArticleById(id));

  // Load existing article if editing
  const existingArticle = useMemo(() => {
    if (!isEditing) return null;
    return getArticleById(id) || fetchedArticle;
  }, [id, isEditing, getArticleById, fetchedArticle]);

  // Fetch directly from database on direct URL load or browser refresh
  useEffect(() => {
    let isMounted = true;
    if (isEditing && !getArticleById(id)) {
      setIsLoadingArticle(true);
      articlesService.getArticleById(id).then((art) => {
        if (isMounted) {
          if (art) setFetchedArticle(art);
          setIsLoadingArticle(false);
        }
      }).catch((err) => {
        console.warn('Article fetch error:', err);
        if (isMounted) setIsLoadingArticle(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [id, isEditing, getArticleById]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'national',
    categories: [],
    language: 'hi',
    summary: '',
    content: getEmptyTipTapDoc(),
    featuredImage: '',
    featuredMediaId: null,
    imageCaption: '',
    imageCredit: '',
    imageAlt: '',
    galleryImages: [],
    youtubeUrl: '',
    videoCaption: '',
    tags: [],
    author: {
      name: 'राजेश कुमार',
      role: 'वरिष्ठ राजनीतिक संपादक',
      location: 'कानपुर',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    },
    location: 'कानपुर',
    isBreaking: false,
    isFeatured: false,
    isTrending: false,
    seoTitle: '',
    metaDescription: '',
    socialImage: '',
    status: ARTICLE_STATUS.DRAFT,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [manualSlugEdited, setManualSlugEdited] = useState(false);
  const [autosaveTime, setAutosaveTime] = useState(null);
  const [hasRecoveryDraft, setHasRecoveryDraft] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigationPath, setPendingNavigationPath] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // TipTap editor instance & AI Proofreading state
  const [editorInstance, setEditorInstance] = useState(null);
  const handleEditorReady = useCallback((editor) => {
    setEditorInstance(editor);
    if (typeof window !== 'undefined') {
      window.__AZAAD_EDITOR__ = editor;
    }
  }, []);
  const [proofreadingOpen, setProofreadingOpen] = useState(false);
  const [proofreadingStatus, setProofreadingStatus] = useState('idle');
  const [proofreadingSuggestions, setProofreadingSuggestions] = useState([]);
  const [activeSuggestionId, setActiveSuggestionId] = useState(null);
  const [isProofreadingStale, setIsProofreadingStale] = useState(false);
  const [proofreadingLanguage, setProofreadingLanguage] = useState('hi');
  const [isAiProviderConfigured, setIsAiProviderConfigured] = useState(false);

  const recoveryStorageKey = `azaad_editor_recovery_${id || 'new'}`;

  // Populate data when editing an existing article
  useEffect(() => {
    if (isEditing && existingArticle) {
      setFormData({
        title: existingArticle.title || '',
        slug: existingArticle.slug || '',
        category: existingArticle.category || 'national',
        categories: Array.isArray(existingArticle.categories) ? existingArticle.categories : [],
        language: existingArticle.language || 'hi',
        summary: existingArticle.summary || '',
        content: normalizeArticleContent(existingArticle.content),
        featuredImage: existingArticle.featuredImage || '',
        featuredMediaId: existingArticle.featuredMediaId || null,
        imageCaption: existingArticle.imageCaption || '',
        imageCredit: existingArticle.imageCredit || '',
        imageAlt: existingArticle.imageAlt || '',
        galleryImages: existingArticle.galleryImages || existingArticle.content?.gallery || [],
        youtubeUrl: existingArticle.youtubeUrl || '',
        videoCaption: existingArticle.videoCaption || '',
        tags: Array.isArray(existingArticle.tags) ? existingArticle.tags : [],
        author: existingArticle.author || {
          name: 'राजेश कुमार',
          role: 'वरिष्ठ राजनीतिक संपादक',
          location: 'कानपुर',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        },
        location: existingArticle.location || existingArticle.author?.location || 'कानपुर',
        isBreaking: Boolean(existingArticle.isBreaking),
        isFeatured: Boolean(existingArticle.isFeatured),
        isTrending: Boolean(existingArticle.isTrending),
        seoTitle: existingArticle.seoTitle || '',
        metaDescription: existingArticle.metaDescription || '',
        socialImage: existingArticle.socialImage || '',
        status: existingArticle.status || ARTICLE_STATUS.DRAFT,
      });
      setManualSlugEdited(true); // Don't overwrite existing slug on title change
      setIsDirty(false);
    }
  }, [isEditing, existingArticle]);

  // Check for local autosave recovery session
  useEffect(() => {
    try {
      const savedRecovery = localStorage.getItem(recoveryStorageKey);
      if (savedRecovery) {
        const parsed = JSON.parse(savedRecovery);
        if (parsed && parsed.timestamp && parsed.data) {
          // Check if recovery data is meaningfully different
          setHasRecoveryDraft(true);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [recoveryStorageKey]);

  // Handle restoring local recovery draft
  const handleRestoreRecovery = () => {
    try {
      const savedRecovery = localStorage.getItem(recoveryStorageKey);
      if (savedRecovery) {
        const parsed = JSON.parse(savedRecovery);
        if (parsed && parsed.data) {
          setFormData((prev) => ({
            ...prev,
            ...parsed.data,
            content: normalizeArticleContent(parsed.data.content),
          }));
          setIsDirty(true);
          setHasRecoveryDraft(false);
          toast.success('अधूरा सत्र सफलतापूर्वक पुनर्स्थापित किया गया');
        }
      }
    } catch {
      toast.error('ड्राफ्ट पुनर्स्थापित नहीं किया जा सका');
    }
  };

  const handleDismissRecovery = () => {
    try {
      localStorage.removeItem(recoveryStorageKey);
    } catch {
      // Ignore
    }
    setHasRecoveryDraft(false);
  };

  // Debounced Autosave to localStorage
  useEffect(() => {
    if (!isDirty) return;

    const timer = setTimeout(() => {
      try {
        const payload = {
          timestamp: Date.now(),
          data: formData,
        };
        localStorage.setItem(recoveryStorageKey, JSON.stringify(payload));
        const formattedTime = new Date().toLocaleTimeString('hi-IN', {
          hour: '2-digit',
          minute: '2-digit',
        });
        setAutosaveTime(formattedTime);
      } catch (err) {
        console.warn('Autosave failed:', err);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [formData, isDirty, recoveryStorageKey]);

  // Browser beforeunload event protection against accidental close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle Field Updates
  const updateField = useCallback(
    (fieldUpdates) => {
      setFormData((prev) => {
        const next = { ...prev, ...fieldUpdates };

        // Auto-generate slug from headline if not manually edited by user
        if ('title' in fieldUpdates && !manualSlugEdited) {
          next.slug = generateSlug(fieldUpdates.title);
        }

        return next;
      });
      setIsDirty(true);

      // Mark proofreading suggestions as stale if content was edited
      if ('content' in fieldUpdates) {
        setIsProofreadingStale(true);
      }

      // Clear specific field errors when field is updated
      if (Object.keys(fieldUpdates).length > 0) {
        setFieldErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          Object.keys(fieldUpdates).forEach((k) => delete newErrors[k]);
          return newErrors;
        });
      }
    },
    [manualSlugEdited]
  );

  // Sync proofreading language with article language
  useEffect(() => {
    if (formData.language) {
      setProofreadingLanguage(formData.language);
    }
  }, [formData.language]);

  // Handle inline editor highlight click to select card in panel
  useEffect(() => {
    const handleSelectFromEditor = (e) => {
      const sugId = e.detail?.suggestionId;
      if (sugId) {
        setActiveSuggestionId(sugId);
        setProofreadingOpen(true);
      }
    };

    window.addEventListener('azaad:select-suggestion', handleSelectFromEditor);
    return () => window.removeEventListener('azaad:select-suggestion', handleSelectFromEditor);
  }, []);

  // Run AI Proofreading Analysis across headline, excerpt, and article body
  const handleRunProofreading = async (overrideLanguage) => {
    const lang = overrideLanguage || proofreadingLanguage || formData.language || 'hi';
    setProofreadingOpen(true);
    setProofreadingStatus('analyzing');
    setIsProofreadingStale(false);

    try {
      const result = await analyzeArticle({
        doc: editorInstance?.state?.doc,
        title: formData.title,
        excerpt: formData.summary,
        language: lang,
        revisionId: Date.now(),
      });

      setIsAiProviderConfigured(Boolean(result.isAiProviderConfigured));

      if (result.isEmpty) {
        setProofreadingSuggestions([]);
        setProofreadingStatus('empty');
        if (editorInstance?.commands?.setProofreadingHighlights) {
          editorInstance.commands.setProofreadingHighlights([], null);
        }
        toast('शीर्षक, सारांश व आलेख रिक्त हैं। कृपया विश्लेषण हेतु कुछ सामग्री दर्ज करें।', { icon: 'ℹ️' });
        return;
      }

      setProofreadingSuggestions(result.suggestions);
      setProofreadingStatus(result.suggestions.length > 0 ? 'suggestions_found' : 'no_issues');

      // Update TipTap decorations for body suggestions
      if (editorInstance?.commands?.setProofreadingHighlights) {
        const bodySuggestions = result.suggestions.filter((s) => !s.field || s.field === 'body');
        editorInstance.commands.setProofreadingHighlights(bodySuggestions, null);
      }

      if (result.suggestions.length > 0) {
        toast.success(`${result.suggestions.length} संपादकीय सुधार पाए गए`);
      } else {
        toast.success('आलेख का गहन विश्लेषण पूर्ण: कोई त्रुटि नहीं पाई गई');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Proofreading analysis error:', err);
        setProofreadingStatus('error');
        toast.error('विश्लेषण में त्रुटि हुई');
      }
    }
  };

  // Select suggestion (scroll editor to position and set active highlight)
  const handleSelectSuggestion = (suggestion) => {
    setActiveSuggestionId(suggestion.id);
    if (editorInstance && suggestion.location && (!suggestion.field || suggestion.field === 'body')) {
      scrollToRange(editorInstance, suggestion.location.from, suggestion.location.to);
      if (editorInstance.commands.setProofreadingHighlights) {
        const bodySuggestions = proofreadingSuggestions.filter((s) => !s.field || s.field === 'body');
        editorInstance.commands.setProofreadingHighlights(bodySuggestions, suggestion.id);
      }
    }
  };

  // Accept a single suggestion (headline, excerpt, or body)
  const handleAcceptSuggestion = (suggestion) => {
    // 1. Fact-check verification: editor confirms the fact without altering text
    if (suggestion.type === 'fact_check') {
      const remaining = proofreadingSuggestions.filter((s) => s.id !== suggestion.id);
      setProofreadingSuggestions(remaining);
      if (editorInstance?.commands?.setProofreadingHighlights) {
        const bodySuggestions = remaining.filter((s) => !s.field || s.field === 'body');
        editorInstance.commands.setProofreadingHighlights(bodySuggestions, null);
      }
      toast.success('तथ्य की पुष्टि संपादक द्वारा प्रमाणित की गई');
      if (remaining.length === 0) setProofreadingStatus('no_issues');
      return;
    }

    // 2. Headline suggestion
    if (suggestion.field === 'headline') {
      setFormData((prev) => ({
        ...prev,
        title: prev.title.replace(suggestion.originalText, suggestion.suggestedText),
      }));
      const remaining = proofreadingSuggestions.filter((s) => s.id !== suggestion.id);
      setProofreadingSuggestions(remaining);
      setIsDirty(true);
      toast.success(`शीर्षक में '${suggestion.suggestedText}' लागू किया गया`);
      if (remaining.length === 0) setProofreadingStatus('no_issues');
      return;
    }

    // 3. Excerpt suggestion
    if (suggestion.field === 'excerpt') {
      setFormData((prev) => ({
        ...prev,
        summary: prev.summary.replace(suggestion.originalText, suggestion.suggestedText),
      }));
      const remaining = proofreadingSuggestions.filter((s) => s.id !== suggestion.id);
      setProofreadingSuggestions(remaining);
      setIsDirty(true);
      toast.success(`सारांश में '${suggestion.suggestedText}' लागू किया गया`);
      if (remaining.length === 0) setProofreadingStatus('no_issues');
      return;
    }

    // 4. Article body suggestion in TipTap
    if (!editorInstance) return;

    const { from, to } = suggestion.location;
    const success = replaceTextRange(
      editorInstance,
      from,
      to,
      suggestion.suggestedText,
      suggestion.originalText
    );

    if (success) {
      const remaining = proofreadingSuggestions.filter((s) => s.id !== suggestion.id);
      setProofreadingSuggestions(remaining);
      setIsDirty(true);

      if (editorInstance.commands.setProofreadingHighlights) {
        const bodySuggestions = remaining.filter((s) => !s.field || s.field === 'body');
        editorInstance.commands.setProofreadingHighlights(bodySuggestions, null);
      }

      toast.success(`'${suggestion.suggestedText}' लागू किया गया`);

      if (remaining.length === 0) {
        setProofreadingStatus('no_issues');
      }
    } else {
      toast.error(
        'आलेख में बदलाव के कारण यह स्थिति बदल गई है। कृपया "पुनः जाँच करें" दबाएं।'
      );
      setIsProofreadingStale(true);
    }
  };

  // Ignore a single suggestion
  const handleIgnoreSuggestion = (suggestion) => {
    const remaining = proofreadingSuggestions.filter((s) => s.id !== suggestion.id);
    setProofreadingSuggestions(remaining);

    if (editorInstance && editorInstance.commands.setProofreadingHighlights) {
      const bodySuggestions = remaining.filter((s) => !s.field || s.field === 'body');
      editorInstance.commands.setProofreadingHighlights(bodySuggestions, null);
    }

    toast('सुझाव अनदेखा किया गया', { icon: 'ℹ️' });

    if (remaining.length === 0) {
      setProofreadingStatus('no_issues');
    }
  };

  // Accept all safe non-overlapping suggestions across headline, excerpt and body
  const handleAcceptAllSafe = () => {
    const safeBatch = getSafeBatchSuggestions(proofreadingSuggestions);
    if (safeBatch.length === 0) {
      toast.error('कोई सुरक्षित बैच सुधार उपलब्ध नहीं है');
      return;
    }

    let appliedCount = 0;
    const appliedIds = new Set();
    let nextTitle = formData.title;
    let nextSummary = formData.summary;
    let titleChanged = false;
    let summaryChanged = false;

    // Apply safe suggestions
    for (const item of safeBatch) {
      if (item.field === 'headline') {
        if (nextTitle.includes(item.originalText)) {
          nextTitle = nextTitle.replace(item.originalText, item.suggestedText);
          appliedCount += 1;
          appliedIds.add(item.id);
          titleChanged = true;
        }
      } else if (item.field === 'excerpt') {
        if (nextSummary.includes(item.originalText)) {
          nextSummary = nextSummary.replace(item.originalText, item.suggestedText);
          appliedCount += 1;
          appliedIds.add(item.id);
          summaryChanged = true;
        }
      } else if (editorInstance) {
        const ok = replaceTextRange(
          editorInstance,
          item.location.from,
          item.location.to,
          item.suggestedText,
          item.originalText
        );

        if (ok) {
          appliedCount += 1;
          appliedIds.add(item.id);
        }
      }
    }

    if (titleChanged || summaryChanged) {
      setFormData((prev) => ({
        ...prev,
        title: titleChanged ? nextTitle : prev.title,
        summary: summaryChanged ? nextSummary : prev.summary,
      }));
    }

    if (appliedCount > 0) {
      const remaining = proofreadingSuggestions.filter((s) => !appliedIds.has(s.id));
      setProofreadingSuggestions(remaining);
      setIsDirty(true);

      if (editorInstance?.commands?.setProofreadingHighlights) {
        const bodySuggestions = remaining.filter((s) => !s.field || s.field === 'body');
        editorInstance.commands.setProofreadingHighlights(bodySuggestions, null);
      }

      toast.success(`${appliedCount} सुरक्षित सुधार सफलतापूर्वक लागू किए गए!`);

      if (remaining.length === 0) {
        setProofreadingStatus('no_issues');
      }
    } else {
      toast.error('सुधार लागू नहीं हो सके। कृपया पुनः जाँच करें।');
      setIsProofreadingStale(true);
    }
  };

  // Clear recovery storage after successful explicit save
  const clearRecovery = () => {
    try {
      localStorage.removeItem(recoveryStorageKey);
    } catch {
      // Ignore
    }
    setHasRecoveryDraft(false);
  };

  // 1. SAVE DRAFT
  const handleSaveDraft = async () => {
    const { isValid, errors } = validateDraft(formData);
    if (!isValid) {
      if (errors.general) toast.error(errors.general);
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        ...formData,
        title: formData.title.trim() || 'बिना शीर्षक का ड्राफ्ट (Untitled Draft)',
        slug: formData.slug.trim() || generateSlug(formData.title) || `draft-${Date.now()}`,
        status: ARTICLE_STATUS.DRAFT,
      };

      if (isEditing) {
        await updateArticle(id, payload);
        toast.success('ड्राफ्ट सफलतापूर्वक अपडेट किया गया (Draft saved)');
      } else {
        const created = await createArticle(payload);
        clearRecovery();
        setIsDirty(false);
        toast.success('नया ड्राफ्ट सफलतापूर्वक सहेजा गया');
        if (created?.id) {
          navigate(`/admin/news/edit/${created.id}`, { replace: true });
        } else {
          navigate('/admin/news');
        }
        return;
      }

      clearRecovery();
      setIsDirty(false);
    } catch (err) {
      console.error('Error saving draft:', err);
      toast.error('ड्राफ्ट सहेजने में त्रुटि हुई');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. SUBMIT FOR REVIEW
  const handleSubmitForReview = async () => {
    const { isValid, errors } = validateForPublishing(formData, id, articles);
    if (!isValid) {
      setFieldErrors(errors);
      toast.error('कृपया अनिवार्य फ़ील्ड्स की त्रुटियां सुधारें');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        status: ARTICLE_STATUS.IN_REVIEW,
      };

      if (isEditing) {
        await updateArticle(id, payload);
      } else {
        await createArticle(payload);
      }

      clearRecovery();
      setIsDirty(false);
      toast.success('समाचार समीक्षा हेतु वरिष्ठ संपादक को प्रेषित किया गया');
      notificationService.createNotification({
        type: 'review',
        title: 'समाचार समीक्षा हेतु प्रेषित',
        message: `"${formData.title}" को वरिष्ठ संपादक समीक्षा हेतु भेजा गया।`,
        articleId: id,
        link: '/admin/news',
      });
      navigate('/admin/news');
    } catch (err) {
      console.error(err);
      toast.error('समीक्षा हेतु भेजने में त्रुटि हुई');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. PUBLISH NOW
  const handlePublish = async () => {
    const { isValid, errors } = validateForPublishing(formData, id, articles);
    if (!isValid) {
      setFieldErrors(errors);
      toast.error('कृपया अनिवार्य फ़ील्ड्स की त्रुटियां सुधारें');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        status: ARTICLE_STATUS.PUBLISHED,
        publishedAt: new Date().toISOString(),
      };

      if (isEditing) {
        await updateArticle(id, payload);
        toast.success('समाचार सफलतापूर्वक अपडेट एवं प्रकाशित किया गया!');
      } else {
        await createArticle(payload);
        toast.success('समाचार सफलतापूर्वक सार्वजनिक पोर्टल पर प्रकाशित हुआ!');
      }

      clearRecovery();
      setIsDirty(false);
      notificationService.createNotification({
        type: 'published',
        title: 'समाचार लाइव प्रकाशित हुआ',
        message: `"${formData.title}" सार्वजनिक पोर्टल पर लाइव है।`,
        articleId: id,
        link: `/news/${formData.slug || ''}`,
      });
      navigate('/admin/news');
    } catch (err) {
      console.error(err);
      toast.error('प्रकाशन में त्रुटि हुई');
    } finally {
      setIsSaving(false);
    }
  };

  // 4. SCHEDULE PUBLICATION
  const handleOpenScheduleDialog = () => {
    let currentFormData = { ...formData };
    if (!currentFormData.summary || currentFormData.summary.trim().length < 10) {
      const plain = extractPlainText(currentFormData.content).trim();
      if (plain) {
        const autoSummary = plain.slice(0, 160).trim();
        currentFormData.summary = autoSummary;
        setFormData((prev) => ({ ...prev, summary: autoSummary }));
      }
    }

    const { isValid, errors } = validateForPublishing(currentFormData, id, articles);
    if (!isValid) {
      setFieldErrors(errors);
      toast.error('कृपया अनिवार्य फ़ील्ड्स (शीर्षक, सारांश, श्रेणी, आदि) की त्रुटियां सुधारें');
      return;
    }
    setFieldErrors({});
    setScheduleDialogOpen(true);
  };

  const handleConfirmSchedule = async (scheduledIsoString) => {
    setIsSaving(true);
    try {
      let activeSummary = formData.summary;
      if (!activeSummary || activeSummary.trim().length < 10) {
        const plain = extractPlainText(formData.content).trim();
        activeSummary = plain ? plain.slice(0, 160).trim() : formData.title;
      }

      const payload = {
        ...formData,
        summary: activeSummary,
        status: ARTICLE_STATUS.SCHEDULED,
        scheduledAt: scheduledIsoString,
        scheduledFor: scheduledIsoString,
        scheduledBy: user?.name || 'राजेश कुमार',
        updatedAt: new Date().toISOString(),
      };

      if (isEditing) {
        await updateArticle(id, payload);
      } else {
        await createArticle(payload);
      }

      clearRecovery();
      setIsDirty(false);
      const displayDate = formatInIST(scheduledIsoString, { locale: 'hi' });
      toast.success(`समाचार "${displayDate}" पर प्रकाशन हेतु सफलतापूर्वक शेड्यूल किया गया!`);
      notificationService.createNotification({
        type: 'scheduled',
        title: 'समाचार शेड्यूल्ड (Scheduled)',
        message: `"${formData.title}" को ${displayDate} पर स्वतः प्रकाशन हेतु शेड्यूल किया गया।`,
        articleId: id,
        link: '/admin/scheduled',
      });
      navigate('/admin/scheduled');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'शेड्यूल करने में त्रुटि हुई');
    } finally {
      setIsSaving(false);
    }
  };

  // If editing and still loading the record from database
  if (isEditing && isLoadingArticle) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-secondary font-mukta">
        <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-sm font-bold text-on-surface">
          आलेख विवरण लोड हो रहा है...
        </span>
        <span className="font-inter text-xs text-secondary mt-1">
          ID #{id}
        </span>
      </div>
    );
  }

  // If editing an ID that doesn't exist in the article store
  if (isEditing && !existingArticle && !isLoadingArticle) {
    return (
      <div className="bg-paper-canvas border border-border-rule p-8 text-center space-y-4 max-w-xl mx-auto my-12 shadow-md font-mukta">
        <AlertCircle className="w-12 h-12 mx-auto text-amber-600" />
        <h2 className="text-xl font-bold text-on-surface">
          समाचार आलेख नहीं मिला (Article Not Found)
        </h2>
        <p className="font-inter text-xs text-secondary leading-relaxed">
          ID #{id} वाला आलेख स्थानीय डेटाबेस में उपलब्ध नहीं है या हटा दिया गया है।
        </p>
        <div className="pt-2 flex items-center justify-center gap-2">
          <Link
            to="/admin/news"
            className="px-4 py-2 bg-paper-tint border border-border-rule text-on-surface font-bold text-xs hover:bg-paper-subtle"
          >
            ← सभी समाचार सूची
          </Link>
          <Link
            to="/admin/news/create"
            className="px-4 py-2 bg-primary-container text-white font-bold text-xs hover:bg-primary"
          >
            + नया समाचार लिखें
          </Link>
        </div>
      </div>
    );
  }

  // If editing an article not owned by current ordinary admin (403 Access Denied)
  if (isEditing && existingArticle && !isLoadingArticle && !canEditArticle(user, existingArticle)) {
    return (
      <AdminAccessDeniedPage
        title="आलेख संपादन अनुमति अस्वीकृत (403)"
        message="आप केवल अपने द्वारा रचित समाचारों को ही संपादित कर सकते हैं। अन्य व्यवस्थापकों या ऐतिहासिक संग्रह के समाचारों में संशोधन का अधिकार केवल मुख्य व्यवस्थापक (Super Admin) के पास है।"
      />
    );
  }

  const wordCount = countWords(formData.content);
  const charCount = countCharacters(formData.content);
  const readTime = estimateReadTime(formData.content, formData.language);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* 1. Sticky Editorial Command Ribbon */}
      <EditorStatusBar
        articleId={id}
        isEditing={isEditing}
        status={formData.status}
        autosaveTime={autosaveTime}
        wordCount={wordCount}
        charCount={charCount}
        readTime={readTime}
        canPublish={canPublish}
        isSaving={isSaving}
        onSaveDraft={handleSaveDraft}
        onPreview={() => setPreviewOpen(true)}
        onOpenProofreading={() => handleRunProofreading()}
        onSubmitForReview={handleSubmitForReview}
        onPublish={handlePublish}
        onSchedule={handleOpenScheduleDialog}
      />

      {/* 2. Recovery Draft Alert Banner (if unfinished session found) */}
      {hasRecoveryDraft && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-mukta font-bold text-xs sm:text-sm text-amber-950 dark:text-amber-200 block">
                अधूरा स्थानीय ड्राफ्ट उपलब्ध है (Unsaved Session Recovered)
              </span>
              <p className="font-inter text-xs text-amber-900/80 dark:text-amber-300/80">
                आपके ब्राउज़र में इस आलेख का एक स्वतः सहेजा गया सत्र मिला है।
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mukta">
            <button
              type="button"
              onClick={handleRestoreRecovery}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>पुनर्स्थापित करें</span>
            </button>
            <button
              type="button"
              onClick={handleDismissRecovery}
              className="px-2.5 py-1 text-secondary hover:text-on-surface text-xs font-bold cursor-pointer"
            >
              खारिज करें
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Two-Column Editorial Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ======================================================== */}
        {/* LEFT / MAIN COLUMN: HEADLINE, SUMMARY, TIPTAP EDITOR     */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 space-y-4">
          {/* Main Headline Card */}
          <div className="bg-paper-canvas p-4 sm:p-5 border border-border-rule shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-mukta text-xs sm:text-sm font-bold uppercase tracking-wider text-breaking-crimson flex items-center gap-1">
                <span>मुख्य समाचार शीर्षक (Main Headline) *</span>
              </label>
              <span
                className={`font-inter text-[11px] ${
                  formData.title.length > 140 ? 'text-amber-600 font-bold' : 'text-secondary'
                }`}
              >
                {formData.title.length} / 140 वर्ण
              </span>
            </div>

            <textarea
              rows={2}
              value={formData.title}
              onChange={(e) => updateField({ title: e.target.value })}
              placeholder="यहाँ समाचार का मुख्य शीर्षक लिखें... (उदा. संसद में नई राष्ट्रीय नीति पर सहमति)"
              className={`w-full bg-transparent font-mukta text-lg sm:text-xl lg:text-2xl text-on-surface font-extrabold resize-none focus:outline-none placeholder:text-secondary/40 leading-snug tracking-tight border-b pb-2 ${
                fieldErrors.title ? 'border-breaking-crimson' : 'border-border-rule focus:border-primary-container'
              }`}
            />

            {fieldErrors.title && (
              <p className="text-breaking-crimson text-xs mt-1 flex items-center gap-1 font-inter">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.title}</span>
              </p>
            )}

            {/* Quick URL Slug preview bar */}
            <div className="bg-paper-tint px-3 py-1.5 flex items-center gap-1.5 text-secondary font-mono text-[11px] border border-border-rule overflow-hidden">
              <span className="font-bold text-on-surface font-mukta text-xs">स्लग:</span>
              <span className="text-secondary/70 truncate">
                /{formData.category}/
              </span>
              <span className="text-on-surface font-semibold truncate">
                {formData.slug || 'slug-auto-generated'}
              </span>
            </div>
          </div>

          {/* Lead Summary / Dek Card */}
          <div className="bg-paper-canvas p-4 sm:p-5 border border-border-rule shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-mukta text-xs sm:text-sm font-bold uppercase text-secondary">
                संक्षिप्त सारांश (Summary / Lead Deck for Cards & Social) *
              </label>
              <span
                className={`font-inter text-[11px] ${
                  formData.summary.length > 220 ? 'text-amber-600 font-bold' : 'text-secondary'
                }`}
              >
                {formData.summary.length} / 220 वर्ण
              </span>
            </div>

            <textarea
              rows={3}
              value={formData.summary}
              onChange={(e) => updateField({ summary: e.target.value })}
              placeholder="कहानी का 2-लाइन सार लिखें जो होमपेज कार्ड्स, वायर फ़ीड और सोशल शेयरिंग में मुख्य बिंदु समझाएगा..."
              className={`w-full bg-paper-tint p-3 text-on-surface font-inter text-xs sm:text-sm leading-relaxed border focus:bg-paper-canvas focus:outline-none ${
                fieldErrors.summary ? 'border-breaking-crimson' : 'border-border-rule focus:border-primary-container'
              }`}
            />

            {fieldErrors.summary && (
              <p className="text-breaking-crimson text-xs mt-1 flex items-center gap-1 font-inter">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.summary}</span>
              </p>
            )}
          </div>

          {/* TipTap Rich-Text Editor */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1">
              <label className="font-mukta text-xs sm:text-sm font-bold uppercase text-on-surface flex items-center gap-1">
                <span>विस्तृत आलेख सामग्री (Article Body) *</span>
              </label>
              {fieldErrors.content && (
                <span className="text-breaking-crimson text-xs font-inter flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{fieldErrors.content}</span>
                </span>
              )}
            </div>

            <RichTextEditor
              content={formData.content}
              language={formData.language}
              onEditorReady={handleEditorReady}
              onOpenProofreading={() => handleRunProofreading()}
              onChange={(newContent) => updateField({ content: newContent })}
            />
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: TAXONOMY, MEDIA, YOUTUBE, TAGS, SEO        */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 space-y-4">
          {/* 1. Taxonomy & Publication Settings */}
          <ArticleSettings
            category={formData.category}
            categories={formData.categories}
            language={formData.language}
            author={formData.author}
            location={formData.location}
            isBreaking={formData.isBreaking}
            isFeatured={formData.isFeatured}
            isTrending={formData.isTrending}
            onChange={updateField}
            categoryError={fieldErrors.category}
            languageError={fieldErrors.language}
          />

          {/* 2. Primary Hero & Multi-Image Gallery Package */}
          <FeaturedImageInput
            imageUrl={formData.featuredImage}
            featuredMediaId={formData.featuredMediaId}
            imageCaption={formData.imageCaption}
            imageCredit={formData.imageCredit}
            imageAlt={formData.imageAlt}
            galleryImages={formData.galleryImages}
            onChange={updateField}
            error={fieldErrors.featuredImage}
          />

          {/* 3. YouTube Video Input */}
          <YouTubeInput
            youtubeUrl={formData.youtubeUrl}
            videoCaption={formData.videoCaption}
            onChange={updateField}
            error={fieldErrors.youtubeUrl}
          />

          {/* 4. Tag Cloud */}
          <TagsInput
            tags={formData.tags}
            onChange={(newTags) => updateField({ tags: newTags })}
          />

          {/* 5. SEO & Social Meta Panel */}
          <SEOSettings
            slug={formData.slug}
            seoTitle={formData.seoTitle}
            metaDescription={formData.metaDescription}
            socialImage={formData.socialImage}
            category={formData.category}
            fallbackTitle={formData.title}
            fallbackSummary={formData.summary}
            onChange={updateField}
            onManualSlugEdit={() => setManualSlugEdited(true)}
            error={fieldErrors.slug}
          />
        </div>
      </div>

      {/* 4. Live Editorial Preview Modal */}
      <ArticlePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        articleData={{
          ...formData,
          id: id || 'preview-temp-id',
        }}
      />

      {/* 5. Unsaved Changes Warning Modal */}
      <UnsavedChangesDialog
        isOpen={showExitDialog}
        onStay={() => setShowExitDialog(false)}
        onLeave={() => {
          setIsDirty(false);
          setShowExitDialog(false);
          if (pendingNavigationPath) {
            navigate(pendingNavigationPath);
          } else {
            navigate('/admin/news');
          }
        }}
      />

      {/* 6. AI Proofreading Assistant Slide-over Panel */}
      <ProofreadingPanel
        isOpen={proofreadingOpen}
        onClose={() => setProofreadingOpen(false)}
        status={proofreadingStatus}
        suggestions={proofreadingSuggestions}
        activeSuggestionId={activeSuggestionId}
        isStale={isProofreadingStale}
        isAiProviderConfigured={isAiProviderConfigured}
        language={proofreadingLanguage}
        onLanguageChange={(newLang) => {
          setProofreadingLanguage(newLang);
          handleRunProofreading(newLang);
        }}
        onRecheck={() => handleRunProofreading()}
        onSelectSuggestion={handleSelectSuggestion}
        onAcceptSuggestion={handleAcceptSuggestion}
        onIgnoreSuggestion={handleIgnoreSuggestion}
        onAcceptAllSafe={handleAcceptAllSafe}
      />

      {/* 7. Publication Scheduling Modal */}
      <SchedulingDialog
        isOpen={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        onConfirm={handleConfirmSchedule}
        articleTitle={formData.title}
        initialUtcIso={formData.scheduledAt || formData.scheduledFor}
      />
    </div>
  );
}

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  X,
  Upload,
  Globe,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  FileCheck,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Ban,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  validateMediaUrlInput,
  validateMediaFile,
  formatFileSize,
} from '../../../utils/mediaValidation';
import { useMedia } from '../../../context/MediaContext';

export default function AddMediaDialog({
  isOpen,
  onClose,
  onAddByUrl,
  onAddUploadedFile,
  onBatchUpload,
}) {
  const { storageStats, uploadBatchAssets } = useMedia();
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'url'

  // Tab A: URL Form State
  const [urlForm, setUrlForm] = useState({
    url: '',
    title: '',
    altText: '',
    caption: '',
    credit: '',
    tags: '',
  });
  const [urlErrors, setUrlErrors] = useState({});

  // Tab B: Bulk File Upload State
  // Array of { id, file, previewUrl, isValid, error, title, altText, caption, credit, status: 'pending'|'uploading'|'completed'|'failed'|'cancelled', progress: number, errorMsg: string }
  const [queue, setQueue] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  if (!isOpen) return null;

  // Handle Tab A: URL Submission
  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    const { isValid, errors } = validateMediaUrlInput(urlForm);
    if (!isValid) {
      setUrlErrors(errors);
      return;
    }

    const tagsArray = urlForm.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await onAddByUrl({
        url: urlForm.url.trim(),
        title: urlForm.title.trim() || undefined,
        altText: urlForm.altText.trim(),
        caption: urlForm.caption.trim(),
        credit: urlForm.credit.trim(),
        tags: tagsArray,
      });

      toast.success('वेब मीडिया सफलतापूर्वक लाइब्रेरी में जोड़ा गया!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'वेब मीडिया जोड़ने में त्रुटि हुई');
    }
  };

  // Process incoming files from Picker or Drag-Drop
  const processIncomingFiles = (fileList) => {
    const filesArray = Array.from(fileList);
    const newItems = filesArray.map((file, idx) => {
      const { isValid, errors } = validateMediaFile(file);
      let previewUrl = null;
      if (isValid) {
        previewUrl = URL.createObjectURL(file);
      }
      return {
        id: `upload-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        previewUrl,
        isValid,
        error: errors.length > 0 ? errors[0] : null,
        title: file.name.replace(/\.[^/.]+$/, ''),
        altText: file.name.replace(/\.[^/.]+$/, ''),
        caption: '',
        credit: 'आज़ाद समाचार डिजिटल डेस्क',
        status: isValid ? 'pending' : 'failed',
        progress: 0,
        errorMsg: errors.length > 0 ? errors[0] : null,
      };
    });

    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      processIncomingFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target?.files && e.target.files.length > 0) {
      processIncomingFiles(e.target.files);
    }
  };

  const handleRemoveItem = (id) => {
    setQueue((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleClearAll = () => {
    queue.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setQueue([]);
  };

  // Execute Bounded Concurrency Batch Upload
  const startUpload = async (itemsToUpload = null) => {
    const targetItems = itemsToUpload || queue.filter((i) => i.status === 'pending' || i.status === 'failed');
    if (targetItems.length === 0) {
      toast.error('अपलोड हेतु कोई वैध फ़ाइल नहीं है');
      return;
    }

    setIsUploading(true);
    abortControllerRef.current = new AbortController();
    const batchService = onBatchUpload || uploadBatchAssets;

    // Mark targets as pending/uploading in UI
    setQueue((prev) =>
      prev.map((item) =>
        targetItems.some((t) => t.id === item.id)
          ? { ...item, status: 'pending', progress: 10, errorMsg: null }
          : item
      )
    );

    try {
      const formattedBatch = targetItems.map((item) => ({
        id: item.id,
        file: item.file,
        metadata: {
          title: item.title,
          altText: item.altText,
          caption: item.caption,
          credit: item.credit,
        },
      }));

      await batchService(formattedBatch, {
        concurrency: 3,
        signal: abortControllerRef.current.signal,
        onProgress: ({ itemId, status, progress, error }) => {
          setQueue((prev) =>
            prev.map((item) => {
              if (item.id === itemId) {
                return {
                  ...item,
                  status,
                  progress,
                  errorMsg: error || item.errorMsg,
                };
              }
              return item;
            })
          );
        },
      });

      const completed = targetItems.length;
      toast.success(`${completed} छायाचित्र सफलतापूर्वक मीडिया लाइब्रेरी में जोड़े गए!`);
    } catch (err) {
      if (err.message?.includes('cancelled')) {
        toast('अपलोड रद्द किया गया');
      } else {
        toast.error(err.message || 'अपलोड के दौरान त्रुटि हुई');
      }
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setQueue((prev) =>
      prev.map((item) =>
        item.status === 'uploading' || item.status === 'pending'
          ? { ...item, status: 'cancelled', progress: 0 }
          : item
      )
    );
    setIsUploading(false);
  };

  const handleRetryFailed = () => {
    const failedItems = queue.filter((i) => i.status === 'failed' || i.status === 'cancelled');
    if (failedItems.length > 0) {
      startUpload(failedItems);
    }
  };

  // Progress metrics
  const totalInQueue = queue.length;
  const completedCount = queue.filter((i) => i.status === 'completed').length;
  const failedCount = queue.filter((i) => i.status === 'failed').length;
  const overallPercentage = totalInQueue > 0 ? Math.round((completedCount / totalInQueue) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 font-mukta">
      <div className="bg-paper-canvas border border-border-rule shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-paper-tint border-b border-border-rule flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary-container" />
            <h3 className="font-mukta text-lg font-bold text-on-surface">
              नई मीडिया जोड़ें (Add & Bulk Upload Media)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-secondary hover:text-on-surface rounded-xs cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border-rule bg-paper-subtle font-inter text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2.5 px-4 text-center font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border-r border-border-rule ${
              activeTab === 'upload'
                ? 'bg-paper-canvas text-primary-container border-b-2 border-b-primary-container shadow-2xs'
                : 'text-secondary hover:text-on-surface hover:bg-paper-tint'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>थोक फ़ाइल अपलोड (Bulk File Upload)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2.5 px-4 text-center font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'url'
                ? 'bg-paper-canvas text-primary-container border-b-2 border-b-primary-container shadow-2xs'
                : 'text-secondary hover:text-on-surface hover:bg-paper-tint'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>वेब URL द्वारा जोड़ें (By URL)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'upload' ? (
            /* TAB 1: BULK FILE UPLOAD */
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-primary-container bg-ticker-tint'
                    : 'border-border-rule hover:border-primary-container/60 bg-paper-tint'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                />

                <Upload className="w-10 h-10 mx-auto text-primary-container mb-2" />
                <p className="font-mukta text-sm sm:text-base font-bold text-on-surface">
                  यहाँ एक साथ कई चित्र खींचकर लाएं (Drag & Drop Multiple Files)
                </p>
                <p className="font-inter text-xs text-secondary mt-1">
                  या कंप्यूटर से फ़ाइलें चुनने के लिए क्लिक करें • JPG, JPEG, PNG, WebP (अधिकतम 10MB प्रति फ़ाइल)
                </p>
                <span className="inline-block mt-2 px-3 py-1 bg-paper-canvas border border-border-rule font-inter text-[11px] font-bold text-primary-container">
                  + एक साथ 10+ फ़ाइलें चुनें
                </span>
              </div>

              {/* Progress ribbon if files queued */}
              {totalInQueue > 0 && (
                <div className="bg-paper-tint border border-border-rule p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-inter font-bold">
                    <span>
                      कुल प्रगति: {completedCount} / {totalInQueue} फ़ाइलें पूर्ण ({overallPercentage}%)
                    </span>
                    <div className="flex items-center gap-2">
                      {failedCount > 0 && (
                        <button
                          type="button"
                          onClick={handleRetryFailed}
                          disabled={isUploading}
                          className="text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>विफल फ़ाइलों का पुनः प्रयास ({failedCount})</span>
                        </button>
                      )}
                      {!isUploading && (
                        <button
                          type="button"
                          onClick={handleClearAll}
                          className="text-secondary hover:text-breaking-crimson cursor-pointer"
                        >
                          कतार साफ़ करें
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-paper-subtle h-2 overflow-hidden border border-border-rule">
                    <div
                      className="bg-primary-container h-full transition-all duration-300"
                      style={{ width: `${overallPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Queue List */}
              {queue.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {queue.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-paper-canvas border border-border-rule flex items-center justify-between gap-3 text-xs font-inter"
                    >
                      {/* Thumbnail & File info */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-12 h-10 bg-paper-subtle border border-border-rule shrink-0 overflow-hidden">
                          {item.previewUrl ? (
                            <img
                              src={item.previewUrl}
                              alt="preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 m-auto text-secondary" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-mukta font-bold text-on-surface truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-secondary">
                            {formatFileSize(item.file?.size || 0)} • {item.file?.type || 'image'}
                          </p>
                          {item.errorMsg && (
                            <p className="text-[10px] text-breaking-crimson flex items-center gap-1 mt-0.5">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>{item.errorMsg}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div className="flex items-center gap-2 shrink-0">
                        {item.status === 'completed' && (
                          <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>सफल</span>
                          </span>
                        )}

                        {item.status === 'uploading' && (
                          <span className="text-primary-container font-bold flex items-center gap-1 text-[11px]">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>अपलोड हो रहा है...</span>
                          </span>
                        )}

                        {item.status === 'pending' && (
                          <span className="text-secondary text-[11px]">प्रतीक्षारत</span>
                        )}

                        {item.status === 'failed' && (
                          <span className="text-breaking-crimson font-bold flex items-center gap-1 text-[11px]">
                            <AlertCircle className="w-4 h-4" />
                            <span>विफल</span>
                          </span>
                        )}

                        {item.status === 'cancelled' && (
                          <span className="text-secondary text-[11px]">रद्द</span>
                        )}

                        {/* Remove button */}
                        {!isUploading && item.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-secondary hover:text-breaking-crimson cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: ADD BY URL */
            <form onSubmit={handleUrlSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase mb-1">
                  छवि वेब URL (HTTPS Image URL) <span className="text-breaking-crimson">*</span>
                </label>
                <input
                  type="url"
                  value={urlForm.url}
                  onChange={(e) => {
                    setUrlForm({ ...urlForm, url: e.target.value });
                    if (urlErrors.url) setUrlErrors({ ...urlErrors, url: null });
                  }}
                  placeholder="https://images.unsplash.com/photo-..."
                  className={`w-full px-3 py-2 bg-paper-tint border font-inter text-xs text-on-surface focus:outline-none focus:bg-paper-canvas ${
                    urlErrors.url ? 'border-breaking-crimson' : 'border-border-rule'
                  }`}
                />
                {urlErrors.url && (
                  <p className="text-breaking-crimson text-xs mt-1 font-inter">{urlErrors.url}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase mb-1">
                    शीर्षक (Title)
                  </label>
                  <input
                    type="text"
                    value={urlForm.title}
                    onChange={(e) => setUrlForm({ ...urlForm, title: e.target.value })}
                    placeholder="उदा. संसद विशेष सत्र"
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule font-inter text-xs text-on-surface focus:outline-none focus:bg-paper-canvas"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase mb-1">
                    फ़ोटो साभार (Photo Credit)
                  </label>
                  <input
                    type="text"
                    value={urlForm.credit}
                    onChange={(e) => setUrlForm({ ...urlForm, credit: e.target.value })}
                    placeholder="उदा. PTI / ANI"
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule font-inter text-xs text-on-surface focus:outline-none focus:bg-paper-canvas"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase mb-1">
                  ऑल्ट टेक्स्ट (Alt Text)
                </label>
                <input
                  type="text"
                  value={urlForm.altText}
                  onChange={(e) => setUrlForm({ ...urlForm, altText: e.target.value })}
                  placeholder="दृष्टिबाधित पाठकों और एसईओ हेतु संक्षिप्त विवरण"
                  className="w-full px-3 py-2 bg-paper-tint border border-border-rule font-inter text-xs text-on-surface focus:outline-none focus:bg-paper-canvas"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase mb-1">
                  कैप्शन (Caption)
                </label>
                <textarea
                  rows={2}
                  value={urlForm.caption}
                  onChange={(e) => setUrlForm({ ...urlForm, caption: e.target.value })}
                  placeholder="समाचार संदर्भ में चित्र का विस्तृत कैप्शन..."
                  className="w-full px-3 py-2 bg-paper-tint border border-border-rule font-inter text-xs text-on-surface focus:outline-none focus:bg-paper-canvas"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-primary-container hover:bg-primary text-white font-mukta text-xs font-bold transition-colors cursor-pointer"
              >
                वेब मीडिया सहेजें (Save Web Media)
              </button>
            </form>
          )}
        </div>

        {/* Footer with Storage Quota & Actions */}
        <div className="p-4 bg-paper-tint border-t border-border-rule flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Storage Quota indicator */}
          <div className="flex items-center gap-2 text-xs font-inter text-secondary">
            <HardDrive className="w-4 h-4 text-primary-container" />
            <span>
              DAM स्टोरेज: {storageStats?.percentage || 36}% प्रयुक्त (10 GB टियर)
            </span>
          </div>

          {activeTab === 'upload' && (
            <div className="flex items-center gap-2 justify-end">
              {isUploading ? (
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="px-4 py-2 border border-border-rule text-xs font-bold text-breaking-crimson hover:bg-red-50 flex items-center gap-1 cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>अपलोड रद्द करें</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-border-rule text-xs font-bold text-on-surface hover:bg-paper-subtle cursor-pointer"
                  >
                    बंद करें
                  </button>

                  <button
                    type="button"
                    onClick={() => startUpload()}
                    disabled={queue.filter((i) => i.status === 'pending' || i.status === 'failed').length === 0}
                    className="px-5 py-2 bg-primary-container hover:bg-primary disabled:bg-secondary/40 text-white font-mukta text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>
                      {queue.filter((i) => i.status === 'pending').length > 0
                        ? `कतार की ${queue.filter((i) => i.status === 'pending').length} फ़ाइलें अपलोड करें`
                        : 'अपलोड शुरू करें'}
                    </span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

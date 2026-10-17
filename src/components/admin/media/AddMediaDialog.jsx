import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  validateMediaUrlInput,
  validateMediaFile,
  formatFileSize,
} from '../../../utils/mediaValidation';

export default function AddMediaDialog({ isOpen, onClose, onAddByUrl, onAddUploadedFile }) {
  const [activeTab, setActiveTab] = useState('url'); // 'url' | 'upload'

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
  const [urlPreviewError, setUrlPreviewError] = useState(false);

  // Tab B: File Upload State
  const [selectedFiles, setSelectedFiles] = useState([]); // Array of { file, previewUrl, error, altText, caption, credit, title }
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Handle Tab A: URL Submission
  const handleUrlSubmit = (e) => {
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

    onAddByUrl({
      url: urlForm.url.trim(),
      title: urlForm.title.trim() || undefined,
      altText: urlForm.altText.trim(),
      caption: urlForm.caption.trim(),
      credit: urlForm.credit.trim(),
      tags: tagsArray,
    });

    toast.success('वेब मीडिया सफलतापूर्वक लाइब्रेरी में जोड़ा गया!');
    onClose();
  };

  // Handle Tab B: Files Added via Picker or Drop
  const processIncomingFiles = (fileList) => {
    const filesArray = Array.from(fileList);
    const newItems = filesArray.map((file) => {
      const { isValid, errors } = validateMediaFile(file);
      let previewUrl = null;
      if (isValid) {
        previewUrl = URL.createObjectURL(file);
      }
      return {
        file,
        previewUrl,
        isValid,
        error: errors.length > 0 ? errors[0] : null,
        title: file.name.replace(/\.[^/.]+$/, ''),
        altText: file.name.replace(/\.[^/.]+$/, ''),
        caption: '',
        credit: 'लोकल न्यूज़डेस्क (डेमो अपलोड)',
      };
    });

    setSelectedFiles((prev) => [...prev, ...newItems]);
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

  const handleRemoveSelectedFile = (index) => {
    setSelectedFiles((prev) => {
      const item = prev[index];
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Commit all valid selected files
  const handleCommitUploads = async () => {
    const validItems = selectedFiles.filter((item) => item.isValid);
    if (validItems.length === 0) {
      toast.error('कृपया कम से कम एक मान्य छवि फ़ाइल चुनें');
      return;
    }

    let addedCount = 0;
    for (const item of validItems) {
      await onAddUploadedFile(item.file, {
        title: item.title,
        altText: item.altText,
        caption: item.caption,
        credit: item.credit,
      });
      addedCount += 1;
    }

    toast.success(`${addedCount} स्थानीय डेमो छवियां सफलतापूर्वक लाइब्रेरी में जोड़ी गईं!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-paper-canvas border border-border-rule shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col font-mukta overflow-hidden">
        {/* Header with Tabs */}
        <div className="bg-paper-tint border-b border-border-rule flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary-container" />
            <h3 className="font-mukta text-lg font-bold text-on-surface">
              नई मीडिया जोड़ें (Add Media Asset)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-secondary hover:text-on-surface rounded-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border-rule bg-paper-subtle font-inter text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2.5 px-4 text-center font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border-r border-border-rule ${
              activeTab === 'url'
                ? 'bg-paper-canvas text-primary-container border-b-2 border-b-primary-container shadow-2xs'
                : 'text-secondary hover:text-on-surface hover:bg-paper-tint'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>वेब URL द्वारा जोड़ें (By URL)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2.5 px-4 text-center font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-paper-canvas text-primary-container border-b-2 border-b-primary-container shadow-2xs'
                : 'text-secondary hover:text-on-surface hover:bg-paper-tint'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>लोकल डेमो अपलोड (Demo Upload)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'url' ? (
            /* TAB A: ADD BY URL */
            <form onSubmit={handleUrlSubmit} className="space-y-3.5">
              {/* Image URL input */}
              <div>
                <label className="block text-xs font-bold text-secondary uppercase mb-1">
                  छवि वेब URL (HTTPS Image URL) <span className="text-breaking-crimson">*</span>
                </label>
                <input
                  type="url"
                  value={urlForm.url}
                  onChange={(e) => {
                    setUrlForm({ ...urlForm, url: e.target.value });
                    setUrlErrors({ ...urlErrors, url: null });
                    setUrlPreviewError(false);
                  }}
                  placeholder="https://images.unsplash.com/... या cdn..."
                  className={`w-full px-3 py-2 bg-paper-tint border text-xs font-inter focus:outline-none focus:bg-paper-canvas ${
                    urlErrors.url ? 'border-breaking-crimson' : 'border-border-rule'
                  }`}
                />
                {urlErrors.url && (
                  <p className="text-breaking-crimson text-xs mt-1 flex items-center gap-1 font-inter">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{urlErrors.url}</span>
                  </p>
                )}
              </div>

              {/* Live URL Preview */}
              {urlForm.url && (
                <div className="bg-paper-tint p-3 border border-border-rule flex items-center gap-4">
                  <div className="w-24 h-16 bg-paper-subtle border border-border-rule overflow-hidden shrink-0">
                    {!urlPreviewError ? (
                      <img
                        src={urlForm.url}
                        alt="Preview"
                        onError={() => setUrlPreviewError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-secondary p-1 text-center">
                        छवि लोड त्रुटि
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 font-inter text-xs text-secondary">
                    <span className="font-semibold text-on-surface block truncate">
                      {urlForm.url}
                    </span>
                    <span className="text-[11px]">
                      {!urlPreviewError ? '✓ पूर्वावलोकन उपलब्ध' : 'चेतावनी: छवि लोड नहीं हो सकी'}
                    </span>
                  </div>
                </div>
              )}

              {/* Title & Alt text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase mb-1">
                    शीर्षक (Title / Headline)
                  </label>
                  <input
                    type="text"
                    value={urlForm.title}
                    onChange={(e) => setUrlForm({ ...urlForm, title: e.target.value })}
                    placeholder="संसद सत्र, फैब प्लांट, आदि..."
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-xs font-inter focus:outline-none focus:bg-paper-canvas"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-secondary uppercase">
                      ऑल्ट टेक्स्ट (Alt Text) <span className="text-breaking-crimson">*</span>
                    </label>
                    <span className="text-[9px] text-primary-container font-bold font-inter">
                      SEO अनिवार्य
                    </span>
                  </div>
                  <input
                    type="text"
                    value={urlForm.altText}
                    onChange={(e) => {
                      setUrlForm({ ...urlForm, altText: e.target.value });
                      setUrlErrors({ ...urlErrors, altText: null });
                    }}
                    placeholder="छवि का वर्णनात्मक विवरण..."
                    className={`w-full px-3 py-2 bg-paper-tint border text-xs font-inter focus:outline-none focus:bg-paper-canvas ${
                      urlErrors.altText ? 'border-breaking-crimson' : 'border-border-rule'
                    }`}
                  />
                  {urlErrors.altText && (
                    <p className="text-breaking-crimson text-xs mt-1 flex items-center gap-1 font-inter">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{urlErrors.altText}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-bold text-secondary uppercase mb-1">
                  संपादकीय कैप्शन (Hindi Caption)
                </label>
                <textarea
                  rows={2}
                  value={urlForm.caption}
                  onChange={(e) => setUrlForm({ ...urlForm, caption: e.target.value })}
                  placeholder="तस्वीर का संदर्भ एवं विवरण..."
                  className="w-full p-2 bg-paper-tint border border-border-rule font-inter text-xs text-on-surface focus:outline-none focus:bg-paper-canvas resize-none"
                />
              </div>

              {/* Credit & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase mb-1">
                    फ़ोटो साभार (Photo Credit)
                  </label>
                  <input
                    type="text"
                    value={urlForm.credit}
                    onChange={(e) => setUrlForm({ ...urlForm, credit: e.target.value })}
                    placeholder="उदा: PTI / विशेष ब्यूरो"
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-xs font-inter focus:outline-none focus:bg-paper-canvas"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary uppercase mb-1">
                    टैग्स (Tags)
                  </label>
                  <input
                    type="text"
                    value={urlForm.tags}
                    onChange={(e) => setUrlForm({ ...urlForm, tags: e.target.value })}
                    placeholder="#संसद, #अर्थव्यवस्था"
                    className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-xs font-inter focus:outline-none focus:bg-paper-canvas"
                  />
                </div>
              </div>

              {/* Footer CTA */}
              <div className="pt-3 border-t border-border-rule flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-border-rule text-xs font-bold text-on-surface hover:bg-paper-subtle"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-container hover:bg-primary text-white font-mukta text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>लाइब्रेरी में जोड़ें</span>
                </button>
              </div>
            </form>
          ) : (
            /* TAB B: UPLOAD IMAGE DEMO MODE */
            <div className="space-y-4">
              {/* Notice Banner */}
              <div className="bg-ticker-tint p-3 border border-breaking-crimson/30 flex items-start gap-2.5 font-inter text-xs text-on-surface">
                <AlertTriangle className="w-4 h-4 text-breaking-crimson shrink-0 mt-0.5" />
                <div>
                  <strong>डेमो अपलोड मोड:</strong> छवियां केवल आपके स्थानीय ब्राउज़र (IndexedDB) में सहेजी जाएंगी। किसी वास्तविक क्लाउड सर्वर पर अपलोड नहीं होंगी।
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed p-6 text-center transition-colors cursor-pointer rounded-xs ${
                  isDragging
                    ? 'border-primary-container bg-paper-tint'
                    : 'border-border-rule hover:border-primary-container/60 bg-paper-subtle/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-primary-container mx-auto mb-2 animate-bounce" />
                <h4 className="font-mukta text-base font-bold text-on-surface">
                  छवियां यहाँ खींचें या क्लिक करके चुनें
                </h4>
                <p className="font-inter text-xs text-secondary mt-1">
                  समर्थित प्रारूप: JPG, PNG, WebP, GIF • अधिकतम आकार: 25 MB
                </p>
              </div>

              {/* Selected Files Preview List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <span className="font-inter text-xs font-bold uppercase text-secondary block">
                    चयनित फ़ाइलें ({selectedFiles.length})
                  </span>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedFiles.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 bg-paper-tint border flex items-center justify-between gap-3 ${
                          item.isValid ? 'border-border-rule' : 'border-breaking-crimson bg-ticker-tint/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.previewUrl ? (
                            <img
                              src={item.previewUrl}
                              alt="Thumb"
                              className="w-12 h-9 object-cover border border-border-rule shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-9 bg-paper-subtle border flex items-center justify-center shrink-0">
                              <ImageIcon className="w-4 h-4 text-secondary" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <span className="font-mukta text-xs font-bold text-on-surface block truncate">
                              {item.file.name}
                            </span>
                            <span className="font-inter text-[10px] text-secondary">
                              {formatFileSize(item.file.size)} • {item.file.type || 'image'}
                            </span>
                            {item.error && (
                              <span className="font-inter text-[10px] text-breaking-crimson block font-semibold">
                                {item.error}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedFile(idx)}
                          className="p-1 text-secondary hover:text-breaking-crimson"
                          title="हटाएं"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer CTA */}
              <div className="pt-3 border-t border-border-rule flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-border-rule text-xs font-bold text-on-surface hover:bg-paper-subtle"
                >
                  रद्द करें
                </button>
                <button
                  type="button"
                  onClick={handleCommitUploads}
                  disabled={selectedFiles.length === 0}
                  className="px-5 py-2 bg-primary-container hover:bg-primary disabled:bg-secondary/40 text-white font-mukta text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>अपलोड सहेजें (Save to Library)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

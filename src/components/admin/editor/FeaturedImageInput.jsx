import React, { useState } from 'react';
import { Image as ImageIcon, Trash2, ExternalLink, AlertCircle, FolderSearch } from 'lucide-react';
import MediaPicker from '../media/MediaPicker';

export default function FeaturedImageInput({
  imageUrl = '',
  imageCaption = '',
  imageCredit = '',
  imageAlt = '',
  onChange,
  error,
}) {
  const [loadError, setLoadError] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSelectFromLibrary = (asset) => {
    setLoadError(false);
    onChange({
      featuredImage: asset.url,
      imageCaption: asset.caption || imageCaption || '',
      imageCredit: asset.credit || imageCredit || '',
      imageAlt: asset.altText || imageAlt || '',
    });
  };

  const handleUrlChange = (e) => {
    setLoadError(false);
    onChange({ featuredImage: e.target.value });
  };

  const handleCaptionChange = (e) => {
    onChange({ imageCaption: e.target.value });
  };

  const handleCreditChange = (e) => {
    onChange({ imageCredit: e.target.value });
  };

  const handleAltChange = (e) => {
    onChange({ imageAlt: e.target.value });
  };

  const handleRemoveImage = () => {
    setLoadError(false);
    onChange({
      featuredImage: '',
      imageCaption: '',
      imageCredit: '',
      imageAlt: '',
    });
  };

  return (
    <div className="bg-paper-canvas p-4 border border-border-rule space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between border-b border-border-rule pb-2">
        <div className="flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-primary-container" />
          <h3 className="font-mukta text-sm sm:text-base font-bold text-on-surface">
            मुख्य छायाचित्र (Featured Image)
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="px-2.5 py-1 bg-paper-subtle border border-border-rule text-primary-container text-xs font-mukta font-bold flex items-center gap-1 hover:bg-primary-container hover:text-white transition-colors cursor-pointer"
        >
          <FolderSearch className="w-3.5 h-3.5" />
          <span>लाइब्रेरी से चुनें</span>
        </button>
      </div>

      {/* Image Preview Box */}
      <div className="relative w-full aspect-[16/9] bg-paper-tint border border-border-rule overflow-hidden flex items-center justify-center group">
        {imageUrl && !loadError ? (
          <>
            <img
              src={imageUrl}
              alt={imageAlt || 'Featured Preview'}
              onError={() => setLoadError(true)}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            {/* Hover Overlay with Quick Actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="px-2.5 py-1 bg-paper-canvas text-on-surface text-xs font-mukta font-bold flex items-center gap-1 hover:bg-paper-subtle shadow-sm cursor-pointer"
              >
                <FolderSearch className="w-3.5 h-3.5 text-primary-container" />
                <span>बदलें</span>
              </button>
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 bg-paper-canvas text-on-surface text-xs font-mukta font-bold flex items-center gap-1 hover:bg-paper-subtle shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>मूल देखें</span>
              </a>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="px-2.5 py-1 bg-breaking-crimson text-white text-xs font-mukta font-bold flex items-center gap-1 hover:bg-primary shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>हटाएं</span>
              </button>
            </div>
          </>
        ) : (
          <div className="text-center p-4 text-secondary space-y-2">
            <ImageIcon className="w-8 h-8 mx-auto text-secondary/50" />
            <p className="font-mukta text-xs">
              {loadError ? 'छवि लोड नहीं हो सकी (अमान्य लिंक)' : 'कोई मुख्य छवि सेट नहीं है'}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="px-3 py-1 bg-primary-container text-white text-xs font-mukta font-bold flex items-center gap-1 hover:bg-primary transition-colors cursor-pointer"
              >
                <FolderSearch className="w-3.5 h-3.5" />
                <span>मीडिया लाइब्रेरी से चुनें</span>
              </button>
            </div>
            <span className="font-inter text-[10px] block text-secondary/80">
              अथवा नीचे सीधे HTTPS छवि URL पेस्ट करें
            </span>
          </div>
        )}
      </div>

      {/* Inputs */}
      <div className="space-y-2.5 font-mukta">
        <div>
          <label className="block text-xs font-bold text-secondary uppercase mb-1">
            छवि URL (Image URL)
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={handleUrlChange}
            placeholder="https://images.unsplash.com/..."
            className={`w-full px-2.5 py-1.5 bg-paper-tint border text-xs font-inter focus:outline-none focus:bg-paper-canvas ${
              error ? 'border-breaking-crimson' : 'border-border-rule'
            }`}
          />
          {error && (
            <p className="text-breaking-crimson text-xs mt-1 flex items-center gap-1 font-inter">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-secondary uppercase mb-1">
            तस्वीर का विवरण / कैप्शन (Caption)
          </label>
          <input
            type="text"
            value={imageCaption}
            onChange={handleCaptionChange}
            placeholder="स्थान व घटना का संक्षिप्त विवरण..."
            className="w-full px-2.5 py-1.5 bg-paper-tint border border-border-rule text-xs font-inter focus:outline-none focus:bg-paper-canvas"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase mb-1">
              फोटो साभार (Credit)
            </label>
            <input
              type="text"
              value={imageCredit}
              onChange={handleCreditChange}
              placeholder="उदा. पीटीआई / ब्यूरो"
              className="w-full px-2.5 py-1.5 bg-paper-tint border border-border-rule text-xs font-inter focus:outline-none focus:bg-paper-canvas"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase mb-1">
              ऑल्ट टेक्स्ट (Alt Text)
            </label>
            <input
              type="text"
              value={imageAlt}
              onChange={handleAltChange}
              placeholder="एसईओ व स्क्रीन रीडर हेतु"
              className="w-full px-2.5 py-1.5 bg-paper-tint border border-border-rule text-xs font-inter focus:outline-none focus:bg-paper-canvas"
            />
          </div>
        </div>
      </div>

      {/* Media Picker Modal */}
      <MediaPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectMedia={handleSelectFromLibrary}
        title="मुख्य छायाचित्र चुनें (Choose Featured Image)"
      />
    </div>
  );
}

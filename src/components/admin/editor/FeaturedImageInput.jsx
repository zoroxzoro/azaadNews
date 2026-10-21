import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Images,
  Trash2,
  ExternalLink,
  AlertCircle,
  FolderSearch,
  Star,
  ChevronUp,
  ChevronDown,
  Plus,
  Layers,
  Sparkles,
} from 'lucide-react';
import MediaPicker from '../media/MediaPicker';
import toast from 'react-hot-toast';

export default function FeaturedImageInput({
  imageUrl = '',
  featuredMediaId = null,
  imageCaption = '',
  imageCredit = '',
  imageAlt = '',
  galleryImages = [],
  onChange,
  error,
}) {
  const [loadError, setLoadError] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState('multi'); // 'multi' | 'single' | 'add_more'

  const others = Array.isArray(galleryImages) ? galleryImages : [];

  // Open picker for full multi-image package
  const openMultiPicker = () => {
    setPickerMode('multi');
    setPickerOpen(true);
  };

  // Open picker for single primary image replacement
  const openSinglePicker = () => {
    setPickerMode('single');
    setPickerOpen(true);
  };

  // Open picker to append more additional images
  const openAddMorePicker = () => {
    setPickerMode('add_more');
    setPickerOpen(true);
  };

  // Process MediaPicker selection
  const handleSelectFromLibrary = (selected) => {
    if (!selected) return;
    setLoadError(false);

    const list = Array.isArray(selected) ? selected : [selected];
    if (list.length === 0) return;

    if (pickerMode === 'add_more') {
      // Append only to other pictures
      const existingUrls = new Set([imageUrl, ...others.map((o) => o.url)]);
      const newItems = list
        .filter((a) => a && a.url && !existingUrls.has(a.url))
        .map((a) => ({
          id: a.id || `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          url: a.url || a.public_url || a.publicUrl,
          caption: a.caption || a.title || '',
          credit: a.credit || '',
          altText: a.altText || a.title || '',
        }));

      onChange({ galleryImages: [...others, ...newItems] });
      setPickerOpen(false);
      toast.success(`${newItems.length} अतिरिक्त छायाचित्र जोड़े गए!`);
      return;
    }

    if (pickerMode === 'single' || (pickerMode === 'multi' && list.length === 1 && imageUrl)) {
      // Single replacement of primary image
      const primaryAsset = list[0];
      const chosenUrl = primaryAsset.url || primaryAsset.public_url || primaryAsset.publicUrl || '';
      onChange({
        featuredImage: chosenUrl,
        featuredMediaId: primaryAsset.id || null,
        imageCaption: primaryAsset.caption || imageCaption || '',
        imageCredit: primaryAsset.credit || imageCredit || '',
        imageAlt: primaryAsset.altText || imageAlt || '',
      });
      setPickerOpen(false);
      toast.success('मुख्य छायाचित्र अद्यतित किया गया!');
      return;
    }

    // Multi-Image Mode:
    // First picture -> Primary Picture
    // Remaining pictures -> Other Pictures (Gallery)
    const primaryAsset = list[0];
    const primaryUrl = primaryAsset.url || primaryAsset.public_url || primaryAsset.publicUrl || '';

    const remainingAssets = list.slice(1);
    const existingOtherUrls = new Set(others.map((o) => o.url));

    const newOthers = remainingAssets
      .filter((a) => a && a.url && a.url !== primaryUrl && !existingOtherUrls.has(a.url))
      .map((a) => ({
        id: a.id || `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        url: a.url || a.public_url || a.publicUrl,
        caption: a.caption || a.title || '',
        credit: a.credit || '',
        altText: a.altText || a.title || '',
      }));

    onChange({
      featuredImage: primaryUrl,
      featuredMediaId: primaryAsset.id || null,
      imageCaption: primaryAsset.caption || imageCaption || '',
      imageCredit: primaryAsset.credit || imageCredit || '',
      imageAlt: primaryAsset.altText || imageAlt || '',
      galleryImages: [...others, ...newOthers],
    });

    setPickerOpen(false);
    if (newOthers.length > 0) {
      toast.success(`प्रथम तस्वीर को 'मुख्य' और ${newOthers.length} तस्वीरों को 'अतिरिक्त' के रूप में सेट किया गया!`);
    } else {
      toast.success('मुख्य छायाचित्र सेट किया गया!');
    }
  };

  // Swap any other picture to become the Primary Picture
  const handleMakePrimary = (index) => {
    const target = others[index];
    if (!target) return;

    // The old primary becomes an other picture (if it exists)
    let updatedOthers = [...others];
    if (imageUrl) {
      const oldPrimaryItem = {
        id: featuredMediaId || `old-primary-${Date.now()}`,
        url: imageUrl,
        caption: imageCaption || '',
        credit: imageCredit || '',
        altText: imageAlt || '',
      };
      // Replace the target index with the old primary
      updatedOthers[index] = oldPrimaryItem;
    } else {
      // Remove from others
      updatedOthers = updatedOthers.filter((_, i) => i !== index);
    }

    onChange({
      featuredImage: target.url,
      featuredMediaId: target.id && typeof target.id === 'string' && target.id.includes('-') ? target.id : null,
      imageCaption: target.caption || '',
      imageCredit: target.credit || '',
      imageAlt: target.altText || '',
      galleryImages: updatedOthers,
    });

    toast.success('चयनित तस्वीर को मुख्य छायाचित्र (Primary Picture) बनाया गया!');
  };

  const handleRemovePrimary = () => {
    setLoadError(false);
    // If there are other pictures, automatically promote the first other picture to primary!
    if (others.length > 0) {
      const [nextPrimary, ...restOthers] = others;
      onChange({
        featuredImage: nextPrimary.url,
        featuredMediaId: nextPrimary.id || null,
        imageCaption: nextPrimary.caption || '',
        imageCredit: nextPrimary.credit || '',
        imageAlt: nextPrimary.altText || '',
        galleryImages: restOthers,
      });
      toast('अगली तस्वीर को मुख्य छायाचित्र बनाया गया');
    } else {
      onChange({
        featuredImage: '',
        featuredMediaId: null,
        imageCaption: '',
        imageCredit: '',
        imageAlt: '',
      });
    }
  };

  const handleRemoveOther = (index) => {
    const updated = others.filter((_, i) => i !== index);
    onChange({ galleryImages: updated });
  };

  const handleMoveOther = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= others.length) return;
    const updated = [...others];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    onChange({ galleryImages: updated });
  };

  const handleOtherCaptionChange = (index, value) => {
    const updated = [...others];
    updated[index] = { ...updated[index], caption: value };
    onChange({ galleryImages: updated });
  };

  const handleOtherCreditChange = (index, value) => {
    const updated = [...others];
    updated[index] = { ...updated[index], credit: value };
    onChange({ galleryImages: updated });
  };

  // Direct manual URL input handlers for primary image
  const handleUrlChange = (e) => {
    setLoadError(false);
    onChange({ featuredImage: e.target.value, featuredMediaId: null });
  };

  return (
    <div className="bg-paper-canvas p-4 border border-border-rule space-y-4 shadow-xs font-mukta">
      {/* Header with Title and Mode Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-rule pb-2.5 gap-2">
        <div className="flex items-center gap-1.5">
          <Images className="w-4 h-4 text-primary-container" />
          <div>
            <h3 className="font-mukta text-sm sm:text-base font-bold text-on-surface flex items-center gap-1.5">
              <span>छायाचित्र पैकेज (Multi-Image Package)</span>
            </h3>
            <span className="font-inter text-[11px] text-secondary block">
              पहली तस्वीर मुख्य होगी, शेष अतिरिक्त तस्वीरें लेख से पहले दिखेंगी
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={openMultiPicker}
            className="px-2.5 py-1 bg-primary-container hover:bg-primary text-white text-xs font-mukta font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            title="एक साथ एकाधिक तस्वीरें चुनें"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ बहु-छवियां चुनें</span>
          </button>
          <button
            type="button"
            onClick={openSinglePicker}
            className="px-2.5 py-1 bg-paper-tint hover:bg-paper-subtle border border-border-rule text-on-surface text-xs font-mukta font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="एकल मुख्य तस्वीर चुनें"
          >
            <FolderSearch className="w-3.5 h-3.5 text-secondary" />
            <span>एकल छवि</span>
          </button>
        </div>
      </div>

      {/* 1. PRIMARY PICTURE CARD (The First Picture) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 border border-amber-600/40 text-amber-700 dark:text-amber-300 font-mukta text-xs font-bold uppercase tracking-wider">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span>1. मुख्य छायाचित्र (Primary Hero Image)</span>
          </span>
          <span className="font-inter text-[10px] text-secondary">
            पृष्ठ के शीर्ष पर सबसे बड़ा दिखेगा
          </span>
        </div>

        {/* Primary Image Preview Box */}
        <div className="relative w-full aspect-[16/9] bg-paper-tint border-2 border-primary-container/60 overflow-hidden flex items-center justify-center group shadow-2xs">
          {imageUrl && !loadError ? (
            <>
              <img
                src={imageUrl}
                alt={imageAlt || 'Primary Hero Preview'}
                onError={() => setLoadError(true)}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              />
              {/* Hover Overlay with Quick Actions */}
              <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={openSinglePicker}
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
                  onClick={handleRemovePrimary}
                  className="px-2.5 py-1 bg-breaking-crimson text-white text-xs font-mukta font-bold flex items-center gap-1 hover:bg-primary shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>हटाएं</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center p-4 text-secondary space-y-2">
              <ImageIcon className="w-8 h-8 mx-auto text-secondary/40" />
              <p className="font-mukta text-xs font-bold text-on-surface">
                {loadError ? 'छवि लोड नहीं हो सकी (अमान्य लिंक)' : 'कोई मुख्य छवि सेट नहीं है'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={openMultiPicker}
                  className="px-3 py-1.5 bg-primary-container text-white text-xs font-mukta font-bold flex items-center gap-1 hover:bg-primary transition-colors cursor-pointer shadow-xs"
                >
                  <Images className="w-3.5 h-3.5" />
                  <span>तस्वीरें चुनें (Select Images)</span>
                </button>
              </div>
              <span className="font-inter text-[10px] block text-secondary/80">
                अथवा नीचे सीधे HTTPS छवि URL दर्ज करें
              </span>
            </div>
          )}
        </div>

        {/* Primary Meta Inputs */}
        <div className="space-y-2 font-mukta pt-1">
          <div>
            <label className="block text-[11px] font-bold text-secondary uppercase mb-0.5">
              मुख्य छवि URL (Image URL)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={handleUrlChange}
              placeholder="https://images.unsplash.com/..."
              className={`w-full px-2.5 py-1 bg-paper-tint border text-xs font-inter focus:outline-none focus:bg-paper-canvas ${
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-secondary uppercase mb-0.5">
                मुख्य तस्वीर कैप्शन (Caption)
              </label>
              <input
                type="text"
                value={imageCaption}
                onChange={(e) => onChange({ imageCaption: e.target.value })}
                placeholder="स्थान व घटना का संक्षिप्त विवरण..."
                className="w-full px-2.5 py-1 bg-paper-tint border border-border-rule text-xs font-inter focus:outline-none focus:bg-paper-canvas"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-secondary uppercase mb-0.5">
                फोटो साभार (Credit)
              </label>
              <input
                type="text"
                value={imageCredit}
                onChange={(e) => onChange({ imageCredit: e.target.value })}
                placeholder="उदा. पीटीआई / ब्यूरो"
                className="w-full px-2.5 py-1 bg-paper-tint border border-border-rule text-xs font-inter focus:outline-none focus:bg-paper-canvas"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. OTHER PICTURES LIST (Secondary & Gallery Pictures) */}
      <div className="pt-3 border-t border-border-rule space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-primary-container" />
            <h4 className="font-mukta text-xs sm:text-sm font-bold text-on-surface">
              समाचार के अन्य छायाचित्र ({others.length})
            </h4>
          </div>

          <button
            type="button"
            onClick={openAddMorePicker}
            className="px-2 py-0.5 bg-paper-subtle border border-border-rule hover:bg-paper-canvas text-primary-container text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>और जोड़ें</span>
          </button>
        </div>

        <p className="font-inter text-[11px] text-secondary">
          ये तस्वीरें मुख्य तस्वीर के तुरंत बाद और आलेख के मुख्य मैटर से पहले व्यवस्थित गैलरी रूप में दिखेंगी।
        </p>

        {others.length > 0 ? (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {others.map((photo, idx) => (
              <div
                key={photo.id || idx}
                className="bg-paper-tint border border-border-rule p-2 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shadow-2xs group"
              >
                {/* Thumbnail */}
                <div className="relative w-20 h-14 bg-black overflow-hidden shrink-0 border border-border-rule">
                  <img
                    src={photo.url}
                    alt={photo.caption || `Other ${idx + 2}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-0.5 left-0.5 px-1 bg-black/80 text-white font-inter text-[9px] font-bold">
                    #{idx + 2}
                  </span>
                </div>

                {/* Caption / Credit inputs */}
                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-1.5 w-full">
                  <input
                    type="text"
                    value={photo.caption || ''}
                    onChange={(e) => handleOtherCaptionChange(idx, e.target.value)}
                    placeholder="कैप्शन (Caption)..."
                    className="w-full px-2 py-1 bg-paper-canvas border border-border-rule text-xs font-inter focus:outline-none"
                  />
                  <input
                    type="text"
                    value={photo.credit || ''}
                    onChange={(e) => handleOtherCreditChange(idx, e.target.value)}
                    placeholder="साभार (Credit)..."
                    className="w-full px-2 py-1 bg-paper-canvas border border-border-rule text-xs font-inter focus:outline-none"
                  />
                </div>

                {/* Actions: Make Primary, Re-order, Remove */}
                <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleMakePrimary(idx)}
                    className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500 hover:text-white border border-amber-600/40 text-amber-800 dark:text-amber-200 text-[11px] font-bold font-mukta flex items-center gap-1 transition-colors cursor-pointer"
                    title="इस तस्वीर को मुख्य छायाचित्र बनाएं"
                  >
                    <Star className="w-3 h-3 fill-amber-500" />
                    <span className="hidden md:inline">मुख्य बनाएं</span>
                  </button>

                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => handleMoveOther(idx, -1)}
                      disabled={idx === 0}
                      className="p-0.5 text-secondary hover:text-on-surface disabled:opacity-30 cursor-pointer"
                      title="ऊपर करें"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveOther(idx, 1)}
                      disabled={idx === others.length - 1}
                      className="p-0.5 text-secondary hover:text-on-surface disabled:opacity-30 cursor-pointer"
                      title="नीचे करें"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveOther(idx)}
                    className="p-1 text-secondary hover:text-breaking-crimson cursor-pointer"
                    title="हटाएं"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-paper-subtle/40 border border-dashed border-border-rule text-center">
            <p className="font-mukta text-xs text-secondary">
              कोई अतिरिक्त तस्वीर नहीं जोड़ी गई है।{' '}
              <button
                type="button"
                onClick={openAddMorePicker}
                className="text-primary-container font-bold underline cursor-pointer"
              >
                यहाँ क्लिक कर अन्य तस्वीरें जोड़ें
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Centralized Media Picker Modal */}
      <MediaPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectMedia={handleSelectFromLibrary}
        title={
          pickerMode === 'multi'
            ? 'बहु-छवियां चुनें (1st will be Primary, others will be Gallery)'
            : pickerMode === 'add_more'
            ? 'अतिरिक्त छायाचित्र जोड़ें (Add More Pictures)'
            : 'मुख्य छायाचित्र चुनें (Choose Primary Hero Image)'
        }
        multiple={pickerMode !== 'single'}
        selectedIds={[featuredMediaId, imageUrl, ...others.map((o) => o.url || o.id)].filter(Boolean)}
      />
    </div>
  );
}

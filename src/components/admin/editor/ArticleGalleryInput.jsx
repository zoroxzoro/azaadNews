import React, { useState } from 'react';
import {
  Images,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Camera,
} from 'lucide-react';
import MediaPicker from '../media/MediaPicker';

export default function ArticleGalleryInput({
  galleryImages = [],
  onChange,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const images = Array.isArray(galleryImages) ? galleryImages : [];

  const handleAddFromLibrary = (selected) => {
    const incoming = Array.isArray(selected) ? selected : [selected];
    const newItems = incoming.map((item) => ({
      id: item.id || `gallery-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url: item.url,
      caption: item.caption || item.title || '',
      credit: item.credit || '',
      altText: item.altText || item.title || '',
    }));

    // Avoid adding exact duplicate URLs
    const existingUrls = new Set(images.map((img) => img.url));
    const filteredNew = newItems.filter((item) => !existingUrls.has(item.url));

    onChange({ galleryImages: [...images, ...filteredNew] });
    setPickerOpen(false);
  };

  const handleRemoveImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    onChange({ galleryImages: updated });
  };

  const handleMove = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const updated = [...images];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    onChange({ galleryImages: updated });
  };

  const handleCaptionChange = (index, text) => {
    const updated = [...images];
    updated[index] = { ...updated[index], caption: text };
    onChange({ galleryImages: updated });
  };

  return (
    <div className="bg-paper-canvas p-4 sm:p-5 border border-border-rule shadow-xs space-y-3 font-mukta">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-rule pb-2">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary-container" />
          <h3 className="text-sm font-bold text-on-surface">
            फ़ोटो गैलरी (Article Photo Gallery)
          </h3>
        </div>
        <span className="font-inter text-[11px] text-secondary">
          {images.length} {images.length === 1 ? 'तस्वीर' : 'तस्वीरें'}
        </span>
      </div>

      <p className="font-inter text-xs text-secondary leading-relaxed">
        विशेष रिपोर्ट या आयोजन के लिए एकाधिक छायाचित्र जोड़ें। 2 या अधिक चित्र होने पर सार्वजनिक आलेख पर इंटरैक्टिव फ़ोटो गैलरी प्रदर्शित होगी।
      </p>

      {/* Grid of gallery images */}
      {images.length > 0 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {images.map((item, index) => (
              <div
                key={item.id || index}
                className="bg-paper-tint border border-border-rule p-2 space-y-2 flex flex-col justify-between"
              >
                <div className="relative aspect-video bg-paper-subtle overflow-hidden border border-border-rule/60">
                  <img
                    src={item.url}
                    alt={item.altText || 'गैलरी तस्वीर'}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/75 text-white font-inter text-[10px] font-bold">
                    #{index + 1}
                  </span>
                </div>

                {/* Caption input */}
                <div>
                  <input
                    type="text"
                    value={item.caption || ''}
                    onChange={(e) => handleCaptionChange(index, e.target.value)}
                    placeholder="तस्वीर का कैप्शन..."
                    className="w-full px-2 py-1 bg-paper-canvas border border-border-rule font-inter text-xs text-on-surface focus:outline-none"
                  />
                </div>

                {/* Controls: Move Up/Down, Remove */}
                <div className="flex items-center justify-between pt-1 border-t border-border-rule/40 font-inter text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMove(index, -1)}
                      disabled={index === 0}
                      title="बाईं ओर खिसकाएं"
                      className="p-1 border border-border-rule disabled:opacity-30 hover:bg-paper-canvas cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 1)}
                      disabled={index === images.length - 1}
                      title="दाईं ओर खिसकाएं"
                      className="p-1 border border-border-rule disabled:opacity-30 hover:bg-paper-canvas cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    title="तस्वीर हटाएं"
                    className="p-1 text-secondary hover:text-breaking-crimson cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-full py-2 bg-paper-tint hover:bg-paper-subtle border border-border-rule text-on-surface font-mukta text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-primary-container" />
            <span>+ और तस्वीरें जोड़ें (Add More Photos)</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="w-full py-3 bg-paper-tint hover:bg-paper-subtle border border-dashed border-border-rule text-on-surface font-mukta text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Images className="w-4 h-4 text-primary-container" />
          <span>+ मीडिया लाइब्रेरी से गैलरी तस्वीरें चुनें (Select Multi-Photos)</span>
        </button>
      )}

      {/* Media Picker Modal */}
      <MediaPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectMedia={handleAddFromLibrary}
        title="फ़ोटो गैलरी हेतु छवियां चुनें (Multi-Select)"
        multiple={true}
        selectedIds={images.map((img) => img.id)}
      />
    </div>
  );
}

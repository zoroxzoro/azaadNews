import React, { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TagsInput({ tags = [], onChange, maxTags = 12 }) {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = () => {
    let clean = inputValue.trim();
    if (!clean) return;

    // Auto-prefix # if not present
    if (!clean.startsWith('#')) {
      clean = `#${clean}`;
    }

    // Check duplicate
    const exists = tags.some((t) => t.toLowerCase() === clean.toLowerCase());
    if (exists) {
      toast.error('यह टैग पहले से जोड़ा जा चुका है');
      setInputValue('');
      return;
    }

    if (tags.length >= maxTags) {
      toast.error(`अधिकतम ${maxTags} टैग जोड़े जा सकते हैं`);
      return;
    }

    onChange([...tags, clean]);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="bg-paper-canvas p-4 border border-border-rule space-y-3 shadow-xs font-mukta">
      <div className="flex items-center justify-between border-b border-border-rule pb-2">
        <div className="flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-secondary" />
          <h3 className="text-sm sm:text-base font-bold text-on-surface">
            टैग्स व कीवर्ड्स (Tags & Keywords)
          </h3>
        </div>
        <span className="font-inter text-[10px] text-secondary">
          {tags.length} / {maxTags}
        </span>
      </div>

      {/* Tag Chips */}
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 bg-paper-tint hover:bg-paper-subtle border border-border-rule text-on-surface px-2.5 py-0.5 text-xs font-medium rounded-none shadow-2xs"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="text-secondary hover:text-breaking-crimson ml-0.5 cursor-pointer"
              title="टैग हटाएं"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {tags.length === 0 && (
          <span className="text-xs text-secondary italic">
            कोई टैग नहीं जोड़ा गया। नीचे लिखकर 'Enter' दबाएं।
          </span>
        )}
      </div>

      {/* Input box */}
      <div className="flex items-center gap-1.5 pt-1">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="उदा. #संसद या #Semiconductor..."
          className="flex-1 px-2.5 py-1.5 bg-paper-tint border border-border-rule text-xs font-inter focus:outline-none focus:bg-paper-canvas"
        />
        <button
          type="button"
          onClick={handleAddTag}
          className="px-3 py-1.5 bg-paper-subtle hover:bg-surface-container border border-border-rule text-on-surface text-xs font-bold flex items-center gap-1 cursor-pointer"
          title="टैग जोड़ें"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">जोड़ें</span>
        </button>
      </div>
    </div>
  );
}

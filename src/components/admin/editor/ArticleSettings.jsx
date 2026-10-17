import React from 'react';
import { categories } from '../../../data/categories';
import { Layers, User, MapPin, Sparkles, Flame, Zap, AlertCircle } from 'lucide-react';

const NEWSROOM_AUTHORS = [
  {
    name: 'राजेश कुमार',
    role: 'वरिष्ठ राजनीतिक संपादक',
    location: 'नई दिल्ली',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  },
  {
    name: 'अमित त्रिपाठी',
    role: 'राज्य ब्यूरो प्रमुख',
    location: 'लखनऊ',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
  },
  {
    name: 'समीक्षा श्रीवास्तव',
    role: 'आर्थिक एवं नीति विश्लेषक',
    location: 'नई दिल्ली',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
  },
  {
    name: 'रोहित वर्मा',
    role: 'वरिष्ठ खेल संवाददाता',
    location: 'मुंबई',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
  },
  {
    name: 'आज़ाद समाचार विशेष सेल',
    role: 'संपादकीय अन्वेषण ब्यूरो',
    location: 'नई दिल्ली',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
  },
];

export default function ArticleSettings({
  category = 'national',
  language = 'hi',
  author = {},
  location = 'नई दिल्ली',
  isBreaking = false,
  isFeatured = false,
  isTrending = false,
  onChange,
  categoryError,
  languageError,
}) {
  const handleAuthorChange = (e) => {
    const selected = NEWSROOM_AUTHORS.find((a) => a.name === e.target.value);
    if (selected) {
      onChange({
        author: {
          name: selected.name,
          role: selected.role,
          avatar: selected.avatar,
          location: location || selected.location,
        },
      });
    }
  };

  return (
    <div className="bg-paper-canvas p-4 border border-border-rule space-y-4 shadow-xs font-mukta">
      <div className="flex items-center justify-between border-b border-border-rule pb-2">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-primary-container" />
          <h3 className="text-sm sm:text-base font-bold text-on-surface">
            वर्गीकरण एवं संपादकीय डेस्क (Taxonomy)
          </h3>
        </div>
      </div>

      <div className="space-y-3">
        {/* 1. Category Selection */}
        <div>
          <label className="block text-xs font-bold text-secondary uppercase mb-1">
            मुख्य श्रेणी (Primary Category) *
          </label>
          <select
            value={category}
            onChange={(e) => onChange({ category: e.target.value })}
            className={`w-full px-2.5 py-1.5 bg-paper-tint border text-xs font-inter focus:outline-none focus:bg-paper-canvas ${
              categoryError ? 'border-breaking-crimson' : 'border-border-rule'
            }`}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.nameHindi} ({c.nameEnglish})
              </option>
            ))}
          </select>
          {categoryError && (
            <p className="text-breaking-crimson text-xs mt-1 flex items-center gap-1 font-inter">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{categoryError}</span>
            </p>
          )}
        </div>

        {/* 2. Language Selection */}
        <div>
          <label className="block text-xs font-bold text-secondary uppercase mb-1">
            भाषा (Language) *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChange({ language: 'hi' })}
              className={`py-1.5 px-3 border text-xs font-bold font-mukta text-center cursor-pointer transition-colors ${
                language === 'hi'
                  ? 'bg-primary-container text-white border-primary-container shadow-xs'
                  : 'bg-paper-tint border-border-rule text-on-surface hover:bg-paper-subtle'
              }`}
            >
              हिन्दी (Hindi)
            </button>
            <button
              type="button"
              onClick={() => onChange({ language: 'en' })}
              className={`py-1.5 px-3 border text-xs font-bold font-inter text-center cursor-pointer transition-colors ${
                language === 'en'
                  ? 'bg-primary-container text-white border-primary-container shadow-xs'
                  : 'bg-paper-tint border-border-rule text-on-surface hover:bg-paper-subtle'
              }`}
            >
              English
            </button>
          </div>
          {languageError && (
            <p className="text-breaking-crimson text-xs mt-1 flex items-center gap-1 font-inter">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{languageError}</span>
            </p>
          )}
        </div>

        {/* 3. Author Desk Selection */}
        <div>
          <label className="block text-xs font-bold text-secondary uppercase mb-1 flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>लेखक / बाईलाइन (Author Byline)</span>
          </label>
          <select
            value={author?.name || 'राजेश कुमार'}
            onChange={handleAuthorChange}
            className="w-full px-2.5 py-1.5 bg-paper-tint border border-border-rule text-xs font-inter focus:outline-none focus:bg-paper-canvas"
          >
            {NEWSROOM_AUTHORS.map((auth, idx) => (
              <option key={idx} value={auth.name}>
                {auth.name} — {auth.role}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Dateline / Location */}
        <div>
          <label className="block text-xs font-bold text-secondary uppercase mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>डेटलाइन / स्थान (Dateline)</span>
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => {
              const loc = e.target.value;
              onChange({
                location: loc,
                author: {
                  ...author,
                  location: loc,
                },
              });
            }}
            placeholder="उदा. नई दिल्ली, लखनऊ, प्रयागराज..."
            className="w-full px-2.5 py-1.5 bg-paper-tint border border-border-rule text-xs font-inter focus:outline-none focus:bg-paper-canvas"
          />
        </div>

        {/* 5. Editorial Flags */}
        <div className="pt-2 border-t border-border-rule space-y-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isBreaking}
              onChange={(e) => onChange({ isBreaking: e.target.checked })}
              className="rounded-none text-breaking-crimson focus:ring-0 w-4 h-4"
            />
            <span className="text-xs font-bold text-breaking-crimson flex items-center gap-1">
              <Zap className="w-3 h-3 animate-pulse" />
              <span>ब्रेकिंग न्यूज़ टिकर में शामिल करें</span>
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => onChange({ isFeatured: e.target.checked })}
              className="rounded-none text-primary-container focus:ring-0 w-4 h-4"
            />
            <span className="text-xs text-on-surface flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>प्रमुख लीड पैकेज में दिखाएं (Featured)</span>
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isTrending}
              onChange={(e) => onChange({ isTrending: e.target.checked })}
              className="rounded-none text-primary-container focus:ring-0 w-4 h-4"
            />
            <span className="text-xs text-on-surface flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-600" />
              <span>ट्रेंडिंग सूची में शामिल करें (Trending)</span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

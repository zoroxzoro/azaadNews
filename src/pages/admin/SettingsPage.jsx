import React from 'react';
import { Settings, Save, Shield, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const handleSave = (e) => {
    e.preventDefault();
    toast.success('सेटिंग्स सफलतापूर्वक सहेजी गईं (Settings saved)');
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl">
      <div className="bg-paper-canvas p-4 sm:p-5 border border-border-rule">
        <h1 className="font-mukta text-xl sm:text-2xl font-extrabold text-on-surface">
          सिस्टम सेटिंग्स (System Settings)
        </h1>
        <p className="font-inter text-xs text-secondary mt-0.5">
          संपादकीय पोर्टल, प्रकाशन नीतियां और एपीआई विन्यास।
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-paper-canvas p-4 sm:p-6 border border-border-rule space-y-5 sm:space-y-6">
        <div>
          <h3 className="font-mukta text-base font-bold text-on-surface border-b border-border-rule pb-2 mb-4">
            प्रकाशन विवरण (Publication Identity)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs font-inter">
            <div>
              <label className="block font-bold text-secondary mb-1">
                प्रकाशन का नाम (हिंदी)
              </label>
              <input
                type="text"
                defaultValue="आज़ाद समाचार"
                className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas"
              />
            </div>
            <div>
              <label className="block font-bold text-secondary mb-1">
                Publication Name (English)
              </label>
              <input
                type="text"
                defaultValue="Azaad Samachar"
                className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas"
              />
            </div>
            <div>
              <label className="block font-bold text-secondary mb-1">
                मुख्य ध्येयवाक्य / टैगलाइन (Tagline)
              </label>
              <input
                type="text"
                defaultValue="सच्ची खबर पक्की खबर | निष्पक्ष • निर्भीक • सटीक"
                className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas"
              />
            </div>
            <div>
              <label className="block font-bold text-secondary mb-1">
                RNI / पंजीयन संख्या
              </label>
              <input
                type="text"
                defaultValue="RNI/DEL/2024/AZAAD"
                className="w-full px-3 py-2 bg-paper-tint border border-border-rule text-on-surface focus:outline-none focus:bg-paper-canvas"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border-rule flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2 bg-primary-container text-white font-mukta font-bold text-sm hover:bg-primary transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>सेटिंग्स सहेजें</span>
          </button>
        </div>
      </form>
    </div>
  );
}

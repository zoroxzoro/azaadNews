import React, { useState } from 'react';
import { Video, CheckCircle2, AlertCircle, Trash2, Play } from 'lucide-react';
import { getYouTubeVideoId, getYouTubeThumbnail } from '../../../utils/youtube';

export default function YouTubeInput({ youtubeUrl = '', videoCaption = '', onChange, error }) {
  const [showLiveEmbed, setShowLiveEmbed] = useState(false);

  const cleanUrl = (youtubeUrl || '').trim();
  const videoId = getYouTubeVideoId(cleanUrl);
  const isValid = Boolean(videoId);
  const thumbnailUrl = videoId ? getYouTubeThumbnail(cleanUrl, 'hqdefault') : null;

  const handleUrlChange = (e) => {
    setShowLiveEmbed(false);
    onChange({ youtubeUrl: e.target.value });
  };

  const handleCaptionChange = (e) => {
    onChange({ videoCaption: e.target.value });
  };

  const handleRemove = () => {
    setShowLiveEmbed(false);
    onChange({ youtubeUrl: '', videoCaption: '' });
  };

  return (
    <div className="bg-paper-canvas p-4 border border-border-rule space-y-3 shadow-xs">
      <div className="flex items-center justify-between border-b border-border-rule pb-2">
        <div className="flex items-center gap-1.5">
          <Video className="w-4 h-4 text-breaking-crimson" />
          <h3 className="font-mukta text-sm sm:text-base font-bold text-on-surface">
            यूट्यूब वीडियो प्रसारण (Video Package)
          </h3>
        </div>
        {isValid && (
          <span className="font-inter text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            सत्यापित
          </span>
        )}
      </div>

      <div className="space-y-2 font-mukta">
        <div>
          <label className="block text-xs font-bold text-secondary uppercase mb-1">
            यूट्यूब लिंक (YouTube URL)
          </label>
          <input
            type="text"
            value={youtubeUrl}
            onChange={handleUrlChange}
            placeholder="https://www.youtube.com/watch?v=..."
            className={`w-full px-2.5 py-1.5 bg-paper-tint border text-xs font-mono focus:outline-none focus:bg-paper-canvas ${
              error ? 'border-breaking-crimson' : 'border-border-rule'
            }`}
          />
          {error && (
            <p className="text-breaking-crimson text-xs mt-1 flex items-center gap-1 font-inter">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}
          <span className="block text-[11px] text-secondary mt-1 font-inter">
            watch?v=, youtu.be, shorts, या embed प्रारूप समर्थित हैं।
          </span>
        </div>

        {/* Video Preview Card if valid videoId */}
        {isValid && (
          <div className="mt-2 border border-border-rule bg-paper-tint p-2 space-y-2">
            <div className="relative aspect-video w-full bg-black overflow-hidden group">
              {showLiveEmbed ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
                  title="YouTube Preview"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div
                  onClick={() => setShowLiveEmbed(true)}
                  className="relative w-full h-full cursor-pointer flex items-center justify-center"
                >
                  <img
                    src={thumbnailUrl}
                    alt="YouTube Video Preview"
                    className="w-full h-full object-cover opacity-90 group-hover:scale-103 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-breaking-crimson text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                    </div>
                  </div>
                  <span className="absolute bottom-1 left-1 bg-black/80 text-white font-mono text-[9px] px-1 py-0.5">
                    ID: {videoId}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-mukta text-emerald-800 font-semibold text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                वीडियो लिंक मान्य एवं तैयार
              </span>
              <button
                type="button"
                onClick={handleRemove}
                className="text-breaking-crimson hover:underline text-xs flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>हटाएं</span>
              </button>
            </div>
          </div>
        )}

        {isValid && (
          <div>
            <label className="block text-xs font-bold text-secondary uppercase mb-1">
              वीडियो विवरण / कैप्शन (वैकल्पिक)
            </label>
            <input
              type="text"
              value={videoCaption}
              onChange={handleCaptionChange}
              placeholder="जैसे: संसद में नई नीति पर बहस और ग्राउंड रिपोर्ट..."
              className="w-full px-2.5 py-1.5 bg-paper-tint border border-border-rule text-xs font-inter focus:outline-none focus:bg-paper-canvas"
            />
          </div>
        )}
      </div>
    </div>
  );
}

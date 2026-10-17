import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  CheckCircle2,
  Copy,
  CheckCheck,
  Eye,
  Trash2,
  ExternalLink,
  HardDrive,
  Info,
  Calendar,
  User,
  Tags,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatFileSize } from '../../../utils/mediaValidation';

export default function MediaDetailPanel({
  asset,
  onClose,
  onUpdateMetadata,
  onPreview,
  onDelete,
  checkAssetUsage,
}) {
  const [formData, setFormData] = useState({
    title: '',
    altText: '',
    caption: '',
    credit: '',
    tags: '',
  });

  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when selected asset changes
  useEffect(() => {
    if (asset) {
      setFormData({
        title: asset.title || '',
        altText: asset.altText || '',
        caption: asset.caption || '',
        credit: asset.credit || '',
        tags: Array.isArray(asset.tags) ? asset.tags.join(', ') : '',
      });
      setCopied(false);
    }
  }, [asset]);

  if (!asset) return null;

  const handleCopyUrl = () => {
    if (asset.isLocalOnly || asset.url?.startsWith('blob:')) {
      toast('यह एक स्थानीय डेमो फ़ाइल है। इसका कोई सार्वजनिक CDN URL नहीं है।', {
        icon: 'ℹ️',
      });
      return;
    }
    if (asset.url) {
      navigator.clipboard.writeText(asset.url);
      setCopied(true);
      toast.success('छवि URL क्लिपबोर्ड में कॉपी किया गया!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);

    const tagsArray = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onUpdateMetadata(asset.id, {
      title: formData.title.trim() || asset.filename,
      altText: formData.altText.trim() || formData.title.trim(),
      caption: formData.caption.trim(),
      credit: formData.credit.trim(),
      tags: tagsArray,
    });

    toast.success('परिसंपत्ति विवरण सफलतापूर्वक सहेजा गया!');
    setIsSaving(false);
  };

  const usageInfo = checkAssetUsage ? checkAssetUsage(asset) : null;
  const isUsed = usageInfo?.isUsed;

  return (
    <div className="w-full xl:w-96 2xl:w-[420px] shrink-0 bg-paper-canvas border border-border-rule shadow-md flex flex-col">
      {/* 3px Accent Rule */}
      <div className="h-[3px] w-full bg-primary-container" />

      {/* Top Header */}
      <div className="p-3.5 sm:p-4 bg-paper-tint border-b border-border-rule flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary-container" />
          <h3 className="font-mukta text-base font-bold text-on-surface">
            मीडिया परिसंपत्ति विवरण
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-primary-container text-white font-mono text-[10px] font-bold">
            {asset.id}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-secondary hover:text-on-surface rounded-2xs"
            title="पैनल बंद करें"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="p-4 space-y-4 max-h-[calc(100vh-14rem)] overflow-y-auto">
        {/* Live Preview Box */}
        <div className="relative w-full aspect-video bg-paper-subtle border border-border-rule overflow-hidden group shadow-2xs">
          {asset.url ? (
            <img
              src={asset.url}
              alt={asset.altText || asset.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-inter text-xs text-secondary">
              छवि लोड नहीं हो सकी
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onPreview && onPreview(asset)}
              className="px-2.5 py-1 bg-paper-canvas text-on-surface text-xs font-mukta font-bold flex items-center gap-1 hover:bg-paper-subtle shadow-sm"
            >
              <Eye className="w-3.5 h-3.5 text-primary-container" />
              <span>पूर्ण आकार देखें</span>
            </button>
          </div>

          {/* Dimension Tag */}
          {asset.width && asset.height && (
            <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-border-heavy/90 text-white font-mono text-[10px]">
              {asset.width} × {asset.height} ({asset.aspectRatio || '16:9'})
            </div>
          )}
        </div>

        {/* Permalink / CDN URL Field with Copy Action */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="font-inter text-[10px] uppercase font-bold text-secondary">
              {asset.isLocalOnly ? 'स्थानीय डेमो परिसंपत्ति (Local Demo File)' : 'सीडीएन परमालिंक (CDN Asset URL)'}
            </label>
            {copied && (
              <span className="font-inter text-[10px] text-emerald-600 font-bold">
                ✓ कॉपी हुआ!
              </span>
            )}
          </div>
          <div className="flex items-stretch border border-border-rule shadow-2xs">
            <input
              type="text"
              readOnly
              value={
                asset.isLocalOnly
                  ? `local-demo-file://${asset.filename} (${formatFileSize(asset.fileSize)})`
                  : asset.url
              }
              className="w-full px-2.5 py-1.5 bg-paper-subtle text-on-surface font-mono text-[11px] truncate focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyUrl}
              className="px-3 bg-border-heavy hover:bg-primary-container text-white font-inter text-xs flex items-center gap-1 transition-colors shrink-0"
              title="यूआरएल कॉपी करें"
            >
              {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>कॉपी</span>
            </button>
          </div>
        </div>

        {/* Technical Specs Matrix */}
        <div className="p-3 bg-paper-tint border border-border-rule space-y-1.5 font-inter text-xs">
          <div className="grid grid-cols-2 gap-y-2">
            <div>
              <span className="text-[10px] text-secondary uppercase font-bold block">
                फ़ाइल का आकार:
              </span>
              <strong className="text-on-surface font-semibold">
                {asset.fileSize ? formatFileSize(asset.fileSize) : 'वेब स्रोत (External)'}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-secondary uppercase font-bold block">
                प्रारूप / माइम:
              </span>
              <strong className="text-on-surface font-semibold font-mono text-[11px]">
                {asset.mimeType || 'image/jpeg'}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-secondary uppercase font-bold block">
                अपलोड तिथि:
              </span>
              <span className="text-on-surface font-medium text-[11px]">
                {asset.createdAt ? asset.createdAt.slice(0, 16).replace('T', ' ') : '--'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-secondary uppercase font-bold block">
                स्रोत प्रकार:
              </span>
              <span className="text-on-surface font-medium text-[11px] flex items-center gap-1">
                {asset.isLocalOnly ? (
                  <>
                    <HardDrive className="w-3 h-3 text-blue-600" />
                    <span>लोकल ब्राउज़र</span>
                  </>
                ) : (
                  <span>प्रेस / वेब वायर</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Editable Metadata Form */}
        <form onSubmit={handleSave} className="space-y-3 font-mukta">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-secondary uppercase mb-1">
              परिसंपत्ति शीर्षक (Asset Headline)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-paper-tint border border-border-rule text-sm font-bold text-on-surface focus:outline-none focus:border-primary-container"
            />
          </div>

          {/* Alt Text (SEO Crucial) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-secondary uppercase">
                SEO ऑल्ट टेक्स्ट (Alt Text)
              </label>
              <span className="font-inter text-[9px] uppercase font-bold text-primary-container bg-ticker-tint px-1.5 py-0.2 border border-breaking-crimson/30">
                एसईओ अनिवार्य
              </span>
            </div>
            <textarea
              rows={2}
              value={formData.altText}
              onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
              placeholder="छवि का सटीक वर्णनात्मक विवरण..."
              className="w-full p-2 bg-paper-tint border border-border-rule font-inter text-xs text-on-surface focus:outline-none focus:border-primary-container resize-none"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-bold text-secondary uppercase mb-1">
              संपादकीय कैप्शन (Hindi Caption)
            </label>
            <textarea
              rows={2}
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              placeholder="घटना व संदर्भ का विवरण..."
              className="w-full p-2 bg-paper-tint border border-border-rule font-inter text-xs text-on-surface focus:outline-none focus:border-primary-container resize-none"
            />
          </div>

          {/* Credit & Byline */}
          <div>
            <label className="block text-xs font-bold text-secondary uppercase mb-1">
              फ़ोटो साभार (Photo Credit / Byline)
            </label>
            <input
              type="text"
              value={formData.credit}
              onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
              placeholder="उदा: PTI / विशेष संवाददाता"
              className="w-full px-2.5 py-1.5 bg-paper-tint border border-border-rule font-inter text-xs text-on-surface focus:outline-none focus:border-primary-container"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-secondary uppercase mb-1">
              टैग्स (Comma Separated Tags)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="#संसद, #अर्थव्यवस्था, #नीति"
              className="w-full px-2.5 py-1.5 bg-paper-tint border border-border-rule font-inter text-xs text-on-surface focus:outline-none focus:border-primary-container"
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2 bg-primary-container hover:bg-primary text-white font-mukta text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isSaving ? 'सहेजा जा रहा है...' : 'परिवर्तन सहेजें (Save Changes)'}</span>
          </button>
        </form>

        {/* Linked Articles / Active Usage */}
        <div className="p-3 bg-paper-tint border border-border-rule space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-inter text-[10px] uppercase font-bold text-secondary">
              सक्रिय प्रयुक्त समाचार (Linked Stories)
            </span>
            <span
              className={`px-1.5 py-0.2 font-inter text-[10px] font-bold ${
                isUsed
                  ? 'bg-primary-container text-white'
                  : 'bg-paper-subtle text-secondary'
              }`}
            >
              {usageInfo?.count || 0} आलेख
            </span>
          </div>

          {isUsed && usageInfo.articles.length > 0 ? (
            <div className="space-y-1">
              {usageInfo.articles.map((art) => (
                <Link
                  key={art.id}
                  to={`/admin/news/edit/${art.id}`}
                  className="p-1.5 bg-paper-canvas hover:bg-paper-subtle border border-border-rule flex items-center justify-between group transition-colors"
                >
                  <span className="font-mukta text-xs font-bold text-on-surface group-hover:text-primary-container truncate">
                    {art.title}
                  </span>
                  <ExternalLink className="w-3 h-3 text-secondary shrink-0 ml-1" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="font-inter text-[11px] text-secondary">
              यह छवि वर्तमान में किसी भी समाचार आलेख में उपयोग नहीं हो रही है।
            </p>
          )}
        </div>

        {/* Delete Action Button */}
        <div className="pt-2 border-t border-border-rule">
          <button
            type="button"
            onClick={() => onDelete && onDelete(asset)}
            className="w-full py-2 bg-paper-canvas hover:bg-ticker-tint border border-border-rule hover:border-breaking-crimson text-breaking-crimson font-mukta text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>लाइब्रेरी से हटाएं (Delete Asset)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  Check,
  Copy,
  CheckCheck,
  Eye,
  Edit,
  Trash2,
  HardDrive,
  Link as LinkIcon,
  Globe,
  MoreVertical,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatFileSize } from '../../../utils/mediaValidation';

export default function MediaCard({
  asset,
  isSelected = false,
  onSelect,
  onPreview,
  onInspect,
  onDelete,
  usageInfo = null,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = (e) => {
    e.stopPropagation();
    if (asset.isLocalOnly || asset.url?.startsWith('blob:')) {
      toast('यह एक स्थानीय डेमो फ़ाइल है। इसका कोई सार्वजनिक वेब URL नहीं है।', {
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

  const isUsed = usageInfo?.isUsed;
  const usageCount = usageInfo?.count || 0;

  return (
    <div
      onClick={() => onInspect && onInspect(asset)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onInspect && onInspect(asset);
      }}
      className={`group relative bg-paper-canvas border transition-all cursor-pointer flex flex-col shadow-xs hover:shadow-md ${
        isSelected
          ? 'ring-2 ring-primary-container border-primary-container'
          : 'border-border-rule hover:border-primary-container/40'
      }`}
    >
      {/* 3px top rule */}
      <div
        className={`h-[3px] w-full transition-colors ${
          isSelected ? 'bg-primary-container' : 'bg-border-heavy group-hover:bg-primary-container'
        }`}
      />

      {/* Image Container with Aspect Ratio */}
      <div className="relative w-full aspect-video bg-paper-subtle overflow-hidden">
        {asset.url ? (
          <img
            src={asset.url}
            alt={asset.altText || asset.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-paper-tint text-secondary font-inter text-xs">
            छवि उपलब्ध नहीं
          </div>
        )}

        {/* Top Badges: Aspect Ratio & Selection */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <span className="px-1.5 py-0.5 bg-border-heavy text-white font-inter text-[10px] font-bold uppercase tracking-wider">
            {asset.aspectRatio || '16:9'}
          </span>
          {asset.isLocalOnly && (
            <span className="px-1.5 py-0.5 bg-blue-700 text-white font-inter text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5">
              <HardDrive className="w-2.5 h-2.5" />
              <span>लोकल डेमो</span>
            </span>
          )}
          {isSelected && (
            <span className="px-1.5 py-0.5 bg-primary-container text-white font-inter text-[10px] font-bold">
              चयनित
            </span>
          )}
        </div>

        {/* Checkmark circle when selected */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-container text-white flex items-center justify-center shadow-xs">
            <Check className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Resolution Pin */}
        {asset.width && asset.height && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-border-heavy/90 text-white font-mono text-[9px]">
            {asset.width} × {asset.height}
          </div>
        )}
      </div>

      {/* Card Content & Metadata */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-2">
        <div>
          {/* Agency & Date */}
          <div className="flex items-center justify-between text-secondary font-inter text-[10px] mb-1">
            <span className="text-primary-container font-bold uppercase truncate max-w-[140px]">
              {asset.credit || (asset.isLocalOnly ? 'डेमो अपलोड' : 'प्रेस वायर')}
            </span>
            <span>{asset.createdAt ? asset.createdAt.slice(0, 10) : ''}</span>
          </div>

          {/* Title */}
          <h3 className="font-mukta text-sm font-bold text-on-surface line-clamp-2 leading-snug group-hover:text-primary-container transition-colors">
            {asset.title || asset.filename}
          </h3>

          {/* Caption preview */}
          {asset.caption && (
            <p className="font-inter text-[11px] text-secondary line-clamp-1 mt-0.5">
              {asset.caption}
            </p>
          )}
        </div>

        {/* Usage & Size Info */}
        <div className="pt-2 border-t border-border-rule/60 flex items-center justify-between font-inter text-[10px] text-secondary">
          <span
            className={`flex items-center gap-1 ${
              isUsed ? 'text-primary-container font-semibold' : 'text-secondary'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>{isUsed ? `${usageCount} आलेखों में प्रयुक्त` : 'अप्रयुक्त (Unused)'}</span>
          </span>
          <span className="font-mono">
            {asset.fileSize ? formatFileSize(asset.fileSize) : 'वेब छवि'}
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-3 py-1.5 bg-paper-tint border-t border-border-rule flex items-center justify-between gap-1">
        {/* Copy URL */}
        <button
          type="button"
          onClick={handleCopyUrl}
          className="px-2 py-1 bg-paper-canvas hover:bg-paper-subtle border border-border-rule text-on-surface font-inter text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
          title="यूआरएल कॉपी करें"
        >
          {copied ? (
            <CheckCheck className="w-3 h-3 text-emerald-600" />
          ) : (
            <Copy className="w-3 h-3 text-secondary" />
          )}
          <span>{copied ? 'कॉपी हुआ!' : 'URL'}</span>
        </button>

        {/* Quick action icons */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview && onPreview(asset);
            }}
            className="p-1 text-secondary hover:text-on-surface hover:bg-paper-canvas rounded-2xs"
            title="पूर्वावलोकन देखें (Full Preview)"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInspect && onInspect(asset);
            }}
            className="p-1 text-secondary hover:text-on-surface hover:bg-paper-canvas rounded-2xs"
            title="विवरण संपादित करें (Edit Metadata)"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete(asset);
            }}
            className="p-1 text-secondary hover:text-breaking-crimson hover:bg-paper-canvas rounded-2xs"
            title="हटाएं (Delete)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

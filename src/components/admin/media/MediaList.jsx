import React, { useState } from 'react';
import {
  Copy,
  CheckCheck,
  Eye,
  Edit,
  Trash2,
  HardDrive,
  Link as LinkIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatFileSize } from '../../../utils/mediaValidation';

export default function MediaList({
  assets = [],
  selectedAssetId = null,
  onSelect,
  onPreview,
  onInspect,
  onDelete,
  checkAssetUsage,
}) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyUrl = (e, asset) => {
    e.stopPropagation();
    if (asset.isLocalOnly || asset.url?.startsWith('blob:')) {
      toast('यह एक स्थानीय डेमो फ़ाइल है। इसका कोई सार्वजनिक URL नहीं है।', {
        icon: 'ℹ️',
      });
      return;
    }
    if (asset.url) {
      navigator.clipboard.writeText(asset.url);
      setCopiedId(asset.id);
      toast.success('छवि URL क्लिपबोर्ड में कॉपी किया गया!');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (assets.length === 0) {
    return null;
  }

  return (
    <div className="bg-paper-canvas border border-border-rule shadow-xs overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-paper-subtle border-b border-border-rule font-inter text-[11px] uppercase tracking-wider text-secondary">
            <th className="p-3 w-16">थंबनेल</th>
            <th className="p-3">शीर्षक व फ़ाइलनाम</th>
            <th className="p-3">स्रोत व क्रेडिट</th>
            <th className="p-3">अनुपात / आकार</th>
            <th className="p-3">अपलोड तिथि</th>
            <th className="p-3">प्रयुक्त आलेख</th>
            <th className="p-3 text-right">कार्यवाही (Actions)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-rule font-inter text-xs">
          {assets.map((asset) => {
            const isSelected = String(asset.id) === String(selectedAssetId);
            const usage = checkAssetUsage ? checkAssetUsage(asset) : null;
            const isUsed = usage?.isUsed;

            return (
              <tr
                key={asset.id}
                onClick={() => onInspect && onInspect(asset)}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-paper-subtle ring-1 ring-primary-container ring-inset'
                    : 'hover:bg-paper-tint/70'
                }`}
              >
                {/* Thumbnail */}
                <td className="p-2.5">
                  <div className="w-14 h-10 bg-paper-subtle border border-border-rule overflow-hidden rounded-2xs relative">
                    {asset.url ? (
                      <img
                        src={asset.url}
                        alt={asset.altText || asset.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-secondary">
                        N/A
                      </div>
                    )}
                    {asset.isLocalOnly && (
                      <div
                        className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-600 rounded-tl"
                        title="लोकल डेमो फ़ाइल"
                      />
                    )}
                  </div>
                </td>

                {/* Title & Filename */}
                <td className="p-3 max-w-xs">
                  <span className="font-mukta text-sm font-bold text-on-surface line-clamp-1 block hover:text-primary-container">
                    {asset.title || asset.filename}
                  </span>
                  <span className="font-mono text-[10px] text-secondary truncate block">
                    {asset.filename}
                  </span>
                </td>

                {/* Source & Credit */}
                <td className="p-3 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold uppercase text-primary-container bg-paper-tint px-1.5 py-0.5 border border-border-rule">
                      {asset.credit || (asset.isLocalOnly ? 'डेमो' : 'वायर')}
                    </span>
                    {asset.isLocalOnly && (
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-1 py-0.5 flex items-center gap-0.5">
                        <HardDrive className="w-2.5 h-2.5" />
                        <span>लोकल</span>
                      </span>
                    )}
                  </div>
                </td>

                {/* Ratio & Size */}
                <td className="p-3 whitespace-nowrap font-inter text-secondary">
                  <div>
                    <span className="font-bold text-on-surface mr-1">{asset.aspectRatio || '16:9'}</span>
                    <span>• {asset.fileSize ? formatFileSize(asset.fileSize) : 'वेब'}</span>
                  </div>
                  {asset.width && asset.height && (
                    <span className="font-mono text-[10px] text-secondary block">
                      {asset.width} × {asset.height}
                    </span>
                  )}
                </td>

                {/* Date */}
                <td className="p-3 whitespace-nowrap text-secondary text-[11px]">
                  {asset.createdAt ? asset.createdAt.slice(0, 10) : '--'}
                </td>

                {/* Used count */}
                <td className="p-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] ${
                      isUsed ? 'text-primary-container font-semibold' : 'text-secondary'
                    }`}
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>{isUsed ? `${usage.count} आलेख` : 'अप्रयुक्त'}</span>
                  </span>
                </td>

                {/* Actions */}
                <td className="p-3 whitespace-nowrap text-right">
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Copy URL */}
                    <button
                      type="button"
                      onClick={(e) => handleCopyUrl(e, asset)}
                      className="p-1 text-secondary hover:text-on-surface"
                      title="URL कॉपी करें"
                    >
                      {copiedId === asset.id ? (
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Preview */}
                    <button
                      type="button"
                      onClick={() => onPreview && onPreview(asset)}
                      className="p-1 text-secondary hover:text-on-surface"
                      title="पूर्वावलोकन देखें"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => onInspect && onInspect(asset)}
                      className="p-1 text-secondary hover:text-on-surface"
                      title="विवरण संपादित करें"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete && onDelete(asset);
                      }}
                      className="p-1 text-secondary hover:text-breaking-crimson"
                      title="हटाएं"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

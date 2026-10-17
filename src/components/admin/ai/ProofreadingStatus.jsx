import React from 'react';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Info,
  AlertCircle,
} from 'lucide-react';

export default function ProofreadingStatus({
  status = 'idle',
  suggestionCount = 0,
  isStale = false,
  errorMessage = '',
  onRecheck,
}) {
  if (status === 'analyzing') {
    return (
      <div className="bg-paper-tint border border-border-rule p-3 flex items-center gap-2.5 text-xs font-mukta">
        <Loader2 className="w-4 h-4 text-primary-container animate-spin shrink-0" />
        <div>
          <span className="font-bold text-on-surface block">
            AI वर्तनी व भाषा विश्लेषण जारी है...
          </span>
          <span className="text-[11px] text-secondary font-inter">
            संपादकीय नियमों के आधार पर वर्तमान आलेख की जाँच की जा रही है
          </span>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 p-3 flex items-start gap-2.5 text-xs font-mukta">
        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <span className="font-bold text-rose-900 dark:text-rose-200 block">
            विश्लेषण में त्रुटि हुई
          </span>
          <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 font-inter">
            {errorMessage || 'कृपया पुनः प्रयास करें।'}
          </p>
          <button
            type="button"
            onClick={onRecheck}
            className="mt-1 px-2.5 py-1 bg-rose-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-rose-700 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>पुनः प्रयास करें</span>
          </button>
        </div>
      </div>
    );
  }

  if (isStale) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-3 flex items-start gap-2.5 text-xs font-mukta">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <span className="font-bold text-amber-900 dark:text-amber-200 block">
            विश्लेषण पुराना हो गया है (Outdated Analysis)
          </span>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 font-inter">
            आलेख सामग्री में नए बदलाव किए गए हैं। सुझावों की वैधता सुनिश्चित करने हेतु पुनः जाँच करें।
          </p>
          <button
            type="button"
            onClick={onRecheck}
            className="mt-1 px-2.5 py-1 bg-amber-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-amber-700 cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>पुनः जाँच करें (Recheck)</span>
          </button>
        </div>
      </div>
    );
  }

  if (status === 'no_issues') {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-3 flex items-start gap-2.5 text-xs font-mukta">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
            कोई त्रुटि नहीं पाई गई (Clean)
          </span>
          <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 font-inter leading-relaxed">
            डेमो चेकर द्वारा कोई त्रुटि नहीं पाई गई। यह गारंटी नहीं देता कि आलेख पूर्णतः त्रुटिहीन है।
          </p>
        </div>
      </div>
    );
  }

  if (status === 'suggestions_found') {
    return (
      <div className="bg-paper-tint border border-border-rule p-2.5 flex items-center justify-between text-xs font-mukta">
        <div className="flex items-center gap-1.5 text-on-surface font-bold">
          <Sparkles className="w-4 h-4 text-primary-container" />
          <span>
            {suggestionCount} संपादकीय सुझाव समीक्षा हेतु उपलब्ध
          </span>
        </div>
        <span className="text-[10px] font-inter font-bold px-1.5 py-0.5 bg-paper-subtle text-secondary border border-border-rule">
          प्रदर्शनात्मक विश्लेषण
        </span>
      </div>
    );
  }

  // Idle state
  return (
    <div className="bg-paper-tint border border-border-rule p-3 flex items-center gap-2.5 text-xs font-mukta">
      <Info className="w-4 h-4 text-secondary shrink-0" />
      <span className="text-secondary font-inter text-[11px]">
        आलेख की वर्तनी, व्याकरण व विराम चिह्नों की समीक्षा के लिए 'AI से जाँच करें' पर क्लिक करें।
      </span>
    </div>
  );
}

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
  isAiProviderConfigured = false,
  errorMessage = '',
  onRecheck,
}) {
  const aiNotice = !isAiProviderConfigured ? (
    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-2.5 flex items-start gap-2 text-xs font-mukta rounded-none mb-2">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <span className="font-bold text-amber-900 dark:text-amber-200 block">
          AI checking unavailable (बाहरी AI प्रदाता अनुपलब्ध)
        </span>
        <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 font-inter leading-relaxed">
          वातावरण में AI API Key (उदा. GEMINI_API_KEY / OPENAI_API_KEY) कॉन्फ़िगर नहीं है। वर्तमान में आंतरिक भाषाई व संपादकीय नियम इंजन (Journalistic Linguistic Engine) द्वारा शीर्षक, सारांश व आलेख का वास्तविक विश्लेषण किया जा रहा है।
        </p>
      </div>
    </div>
  ) : null;

  if (status === 'analyzing') {
    return (
      <div className="space-y-2">
        {aiNotice}
        <div className="bg-paper-tint border border-border-rule p-3 flex items-center gap-2.5 text-xs font-mukta">
          <Loader2 className="w-4 h-4 text-primary-container animate-spin shrink-0" />
          <div>
            <span className="font-bold text-on-surface block">
              वर्तनी व भाषा विश्लेषण जारी है...
            </span>
            <span className="text-[11px] text-secondary font-inter">
              शीर्षक, सारांश व आलेख की गहन संपादकीय जाँच की जा रही है
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="space-y-2">
        {aiNotice}
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
      </div>
    );
  }

  if (isStale) {
    return (
      <div className="space-y-2">
        {aiNotice}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-3 flex items-start gap-2.5 text-xs font-mukta">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <span className="font-bold text-amber-900 dark:text-amber-200 block">
              विश्लेषण पुराना हो गया है (Outdated Analysis)
            </span>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 font-inter">
              सामग्री में नए बदलाव किए गए हैं। सुझावों की वैधता सुनिश्चित करने हेतु पुनः जाँच करें।
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
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="space-y-2">
        {aiNotice}
        <div className="bg-paper-tint border border-border-rule p-3 flex items-start gap-2.5 text-xs font-mukta">
          <Info className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-on-surface block">
              शीर्षक, सारांश व आलेख रिक्त हैं
            </span>
            <p className="text-[11px] text-secondary font-inter leading-relaxed">
              विश्लेषण हेतु कृपया शीर्षक, सारांश या एडिटर में समाचार सामग्री दर्ज करें।
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'no_issues') {
    return (
      <div className="space-y-2">
        {aiNotice}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-3 flex items-start gap-2.5 text-xs font-mukta">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
              विश्लेषण पूर्ण: कोई त्रुटि नहीं पाई गई (Clean)
            </span>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 font-inter leading-relaxed">
              शीर्षक, सारांश व आलेख में वर्तनी, व्याकरण, विराम चिह्न व शैली की वास्तविक जाँच की गई। कोई त्रुटि नहीं पाई गई।
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'suggestions_found') {
    return (
      <div className="space-y-2">
        {aiNotice}
        <div className="bg-paper-tint border border-border-rule p-2.5 flex items-center justify-between text-xs font-mukta">
          <div className="flex items-center gap-1.5 text-on-surface font-bold">
            <Sparkles className="w-4 h-4 text-primary-container" />
            <span>
              {suggestionCount} संपादकीय सुझाव समीक्षा हेतु उपलब्ध
            </span>
          </div>
          <span className="text-[10px] font-inter font-bold px-1.5 py-0.5 bg-paper-subtle text-secondary border border-border-rule">
            {isAiProviderConfigured ? 'क्लाउड AI' : 'नियम इंजन'}
          </span>
        </div>
      </div>
    );
  }

  // Idle state
  return (
    <div className="space-y-2">
      {aiNotice}
      <div className="bg-paper-tint border border-border-rule p-3 flex items-center gap-2.5 text-xs font-mukta">
        <Info className="w-4 h-4 text-secondary shrink-0" />
        <span className="text-secondary font-inter text-[11px]">
          शीर्षक, सारांश व आलेख की समीक्षा के लिए 'AI से जाँच करें' पर क्लिक करें।
        </span>
      </div>
    </div>
  );
}

import React from 'react';
import { History, CheckCircle, Clock, FileEdit, Sparkles, Send } from 'lucide-react';

export default function PublishingActivity() {
  const activities = [
    {
      id: 1,
      user: 'सुनील जोशी',
      initials: 'सु',
      userColor: 'bg-primary-container text-white',
      action: 'ने "धोलेरा सेमीकंडक्टर" स्टोरी को फ्रंट-पेज पर प्रकाशित किया।',
      time: '2 मिनट पहले',
      tag: 'डेस्क ऑथराइज्ड',
      icon: CheckCircle,
    },
    {
      id: 2,
      user: 'AI प्रूफरीडर बॉट',
      initials: 'AI',
      userColor: 'bg-blue-600 text-white',
      action: 'ने बजट विशेष रिपोर्ट में 4 व्याकरण और वर्तनी अशुद्धियां सुधारीं।',
      time: '12 मिनट पहले',
      tag: 'ऑटो-करेक्शन v2.4',
      icon: Sparkles,
    },
    {
      id: 3,
      user: 'प्रियंका शर्मा',
      initials: 'प्रि',
      userColor: 'bg-slate-700 text-white',
      action: 'ने "लखनऊ एक्सप्रेसवे" ड्राफ्ट वरिष्ठ संपादक समीक्षा हेतु भेजा।',
      time: '24 मिनट पहले',
      tag: 'राज्य ब्यूरो',
      icon: Send,
    },
    {
      id: 4,
      user: 'राजेश बाजपेयी',
      initials: 'रा',
      userColor: 'bg-breaking-crimson text-white',
      action: 'ने लाइव टिकर पर कैबिनेट फैसले का नया फ्लैश अपडेट जारी किया।',
      time: '40 मिनट पहले',
      tag: 'लाइव डेस्क',
      icon: Clock,
    },
  ];

  return (
    <div className="bg-paper-canvas border border-border-rule shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 bg-paper-tint border-b border-border-rule flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-breaking-crimson" />
          <h3 className="font-mukta text-sm sm:text-base font-bold text-on-surface">
            हालिया संपादकीय गतिविधियां (Activity Log)
          </h3>
        </div>
        <span className="text-[10px] font-inter text-secondary uppercase bg-paper-canvas px-1.5 py-0.5 border border-border-rule">
          डेमो लॉग
        </span>
      </div>

      {/* Activities List */}
      <div className="p-3 sm:p-4 space-y-3">
        {activities.map((act) => {
          return (
            <div
              key={act.id}
              className="flex items-start gap-2.5 pb-2.5 border-b border-border-rule/60 last:border-0 last:pb-0"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-mukta text-xs font-bold shrink-0 ${act.userColor}`}
              >
                {act.initials}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-mukta text-xs text-on-surface leading-snug">
                  <span className="font-bold">{act.user}</span> {act.action}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-inter text-secondary">{act.time}</span>
                  <span className="text-secondary">•</span>
                  <span className="text-[10px] font-inter text-secondary">{act.tag}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-3 py-1.5 bg-paper-tint text-center border-t border-border-rule">
        <span className="text-[10px] font-inter text-secondary">
          नोट: यह विकास पूर्वावलोकन हेतु प्रदर्शन लॉग है।
        </span>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { History, CheckCircle, Clock, FileEdit, Sparkles, Send, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';

export default function PublishingActivity() {
  const [realActivities, setRealActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (isSupabaseConfigured) {
      supabase
        .from('editorial_activity')
        .select(`
          id,
          action,
          details,
          created_at,
          user_id,
          profiles:user_id(display_name, display_name_hindi)
        `)
        .order('created_at', { ascending: false })
        .limit(6)
        .then(({ data, error }) => {
          if (isMounted) {
            if (!error && Array.isArray(data) && data.length > 0) {
              setRealActivities(data);
            }
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const activities = React.useMemo(() => {
    return realActivities.map((r) => {
      const name = r.profiles?.display_name_hindi || r.profiles?.display_name || 'संपादक';
      const initials = name.charAt(0);
      const actionMap = {
        created: 'ने नया आलेख रचा',
        published: 'ने आलेख प्रकाशित किया',
        scheduled: 'ने आलेख शेड्यूल किया',
        scheduled_auto_publish: 'सिस्टम द्वारा स्वतः प्रकाशित',
        updated: 'ने आलेख अद्यतित किया',
        deleted: 'ने आलेख हटाया',
      };
      const actionLabel = actionMap[r.action] || `ने '${r.action}' कार्य किया`;
      const titleStr = r.details?.title ? `"${r.details.title.slice(0, 28)}..."` : '';

      return {
        id: r.id,
        user: name,
        initials,
        userColor: r.action.includes('publish') ? 'bg-primary-container text-white' : 'bg-slate-700 text-white',
        action: `${actionLabel} ${titleStr}`,
        time: new Date(r.created_at).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
        date: new Date(r.created_at).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' }),
        tag: 'संपादकीय ऑडिट',
        icon: CheckCircle,
      };
    });
  }, [realActivities]);

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
          ऑडिट लॉग
        </span>
      </div>

      {/* Activities List */}
      <div className="p-3 sm:p-4 space-y-3">
        {isLoading ? (
          <div className="py-6 text-center text-xs font-inter text-secondary">
            ऑडिट लॉग लोड हो रहा है...
          </div>
        ) : activities.length > 0 ? (
          activities.map((act) => (
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
                  <span className="text-[10px] font-inter text-secondary">{act.date}, {act.time}</span>
                  <span className="text-secondary">•</span>
                  <span className="text-[10px] font-inter text-secondary">{act.tag}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 px-4 text-center">
            <ShieldCheck className="w-6 h-6 text-secondary mx-auto mb-1.5 opacity-60" />
            <p className="font-mukta text-xs font-semibold text-secondary">
              कोई हालिया संपादकीय गतिविधि दर्ज नहीं है।
            </p>
            <p className="font-inter text-[10px] text-secondary/80 mt-0.5">
              प्रकाशन अथवा संपादन गतिविधियों का वास्तविक ऑडिट यहां स्वतः प्रदर्शित होगा।
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

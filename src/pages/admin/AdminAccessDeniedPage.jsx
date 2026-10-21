import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminAccessDeniedPage({
  title = 'पहुंच प्रतिबंधित (403 — Access Denied)',
  message = 'इस अनुभाग को देखने अथवा संपादित करने के लिए आवश्यक प्रधान व्यवस्थापक (Super Admin) विशेषाधिकार आपके खाते में उपलब्ध नहीं हैं।',
}) {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 font-mukta">
      <div className="max-w-lg w-full bg-paper-canvas border border-border-rule shadow-md p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 border border-amber-200 dark:border-amber-800">
            HTTP 403 Forbidden • भूमिका प्रतिबंध
          </span>
          <h1 className="text-2xl font-black text-on-surface pt-2">
            {title}
          </h1>
          <p className="font-inter text-xs sm:text-sm text-secondary leading-relaxed max-w-md mx-auto">
            {message}
          </p>
        </div>

        {currentUser && (
          <div className="bg-paper-tint border border-border-rule p-3 text-left flex items-center justify-between text-xs font-inter">
            <div>
              <span className="text-secondary block">वर्तमान उपयोगकर्ता:</span>
              <strong className="text-on-surface">{currentUser.name} ({currentUser.email})</strong>
            </div>
            <span className="px-2 py-0.5 bg-paper-subtle border border-border-rule font-mono text-[11px] font-bold text-secondary uppercase">
              {currentUser.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="flex-1 py-2.5 px-4 bg-primary-container text-on-primary-container font-mukta font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>डैशबोर्ड पर जाएं</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="py-2.5 px-4 bg-paper-subtle hover:bg-border-rule border border-border-rule text-on-surface font-mukta font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>वापस जाएं</span>
          </button>
        </div>
      </div>
    </div>
  );
}

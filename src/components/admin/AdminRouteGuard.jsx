import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, LogOut } from 'lucide-react';
import AdminAccessDeniedPage from '../../pages/admin/AdminAccessDeniedPage';

/**
 * AdminRouteGuard
 *
 * Clean, production Route Guard for Azaad Samachar Admin CMS.
 * - Loading gate for session restoration.
 * - Unauthenticated -> Login redirection.
 * - Suspended account gate.
 * - Role & capability authorization checks.
 */
export default function AdminRouteGuard({ children, requiredRole = null, requiredPermission = null }) {
  const {
    isAuthenticated,
    isLoading,
    currentUser,
    isSuspended,
    can,
    hasRole,
    logout,
  } = useAuth();
  const location = useLocation();

  // 1. Loading State (waiting for Supabase session restoration)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper-canvas flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-primary-container border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-mukta text-sm font-bold text-on-surface">
          संपादकीय सत्र प्रमाणीकरण हो रहा है...
        </span>
        <span className="font-inter text-xs text-secondary mt-1">
          Azaad Samachar Newsroom Security
        </span>
      </div>
    );
  }

  // 2. Unauthenticated -> Redirect to Login
  if (!isAuthenticated) {
    const safeRedirect = location.pathname.startsWith('/') ? location.pathname + location.search : '/admin';
    return (
      <Navigate
        to={`/admin/login?redirect=${encodeURIComponent(safeRedirect)}`}
        replace
      />
    );
  }

  // 3. Suspended Account Screen
  if (isSuspended || currentUser?.status === 'suspended') {
    return (
      <div className="min-h-screen bg-paper-canvas flex items-center justify-center p-4 font-mukta">
        <div className="max-w-md w-full bg-paper-tint border border-red-300 dark:border-red-800 p-8 text-center shadow-lg space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="font-mono text-xs uppercase tracking-wider text-red-700 dark:text-red-300 font-bold bg-red-50 dark:bg-red-950/40 px-2.5 py-1 border border-red-200 dark:border-red-800 inline-block">
            खाता निलंबित • Account Suspended
          </span>
          <h2 className="text-xl font-black text-on-surface">
            संपादकीय खाता निलंबित है
          </h2>
          <p className="font-inter text-xs text-secondary leading-relaxed">
            सुरक्षा प्रोटोकॉल अथवा संपादकीय निर्देश के तहत आपका खाता निलंबित कर दिया गया है। CMS में सामग्री देखने अथवा परिवर्तन करने की अनुमति नहीं है।
          </p>
          <button
            type="button"
            onClick={() => logout()}
            className="w-full py-2.5 bg-paper-subtle hover:bg-border-rule border border-border-rule text-on-surface font-mukta font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <LogOut className="w-4 h-4" />
            <span>लॉगआउट करें (Sign Out)</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. Role Check Gate (e.g. Super Admin only routes)
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <AdminAccessDeniedPage
        title="पहुंच प्रतिबंधित (Super Admin Only)"
        message={`यह अनुभाग केवल प्रधान व्यवस्थापक (Super Admin) के लिए आरक्षित है। आपकी वर्तमान भूमिका (${currentUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}) को इस पृष्ठ पर जाने की अनुमति नहीं है।`}
      />
    );
  }

  // 5. Permission Capability Gate
  if (requiredPermission && !can(requiredPermission)) {
    return (
      <AdminAccessDeniedPage
        title="अनुमति अस्वीकृत (Permission Denied)"
        message={`आपके खाते को "${requiredPermission}" कार्य निष्पादित करने की अनुमति नहीं है।`}
      />
    );
  }

  return children ? children : <Outlet />;
}

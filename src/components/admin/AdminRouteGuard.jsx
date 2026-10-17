import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useDemoAuth } from '../../context/DemoAuthContext';

/**
 * AdminRouteGuard
 *
 * Frontend-only demonstration route guard.
 * Redirects unauthenticated visitors to /admin/login while preserving
 * the intended destination path.
 */
export default function AdminRouteGuard({ children }) {
  const { isAuthenticated } = useDemoAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login, remembering the requested path
    return (
      <Navigate
        to={`/admin/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return children ? children : <Outlet />;
}

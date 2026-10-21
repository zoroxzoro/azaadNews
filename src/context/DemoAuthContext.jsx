/**
 * DemoAuthContext (Backward Compatibility Adapter for AuthContext)
 * Azaad Samachar (आज़ाद समाचार)
 *
 * This file preserves full backward compatibility for any existing components
 * importing `useDemoAuth` or `DemoAuthProvider`, seamlessly proxying all calls
 * to the production Supabase `AuthContext`.
 */

import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';

export function DemoAuthProvider({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

export function useDemoAuth() {
  const auth = useAuth();
  return {
    ...auth,
    // Aliases to preserve exact signatures expected by existing components
    user: auth.currentUser,
  };
}

export default DemoAuthProvider;

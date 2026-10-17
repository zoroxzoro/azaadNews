import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * DemoAuthContext
 *
 * NOTE: This is a frontend-only demonstration authentication context.
 * It provides client-side in-memory session management for evaluating the
 * Azaad Samachar Admin CMS interface in development mode.
 *
 * Real production authentication (JWT, backend verification, session cookies)
 * will be integrated during backend development.
 */
const DemoAuthContext = createContext(null);

const DEMO_STORAGE_KEY = 'azaad_demo_session_active';

const DEMO_USER = {
  id: 'usr-editor-01',
  name: 'राजेश कुमार',
  nameEnglish: 'Rajesh Kumar',
  email: 'editor@azaadsamachar.com',
  role: 'वरिष्ठ संपादक (Sr. Editor)',
  initials: 'RK',
  desk: 'Delhi-HQ',
  avatar: null,
};

export function DemoAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem(DEMO_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    return isAuthenticated ? DEMO_USER : null;
  });

  // Keep sessionStorage in sync
  useEffect(() => {
    try {
      if (isAuthenticated) {
        sessionStorage.setItem(DEMO_STORAGE_KEY, 'true');
      } else {
        sessionStorage.removeItem(DEMO_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors in restricted iframe environments
    }
  }, [isAuthenticated]);

  const login = (email, password) => {
    // Demonstration validation - accept valid email format & demo credentials
    if (!email || !email.includes('@')) {
      return { success: false, error: 'कृपया एक मान्य ईमेल पता दर्ज करें।' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' };
    }

    setIsAuthenticated(true);
    setCurrentUser({
      ...DEMO_USER,
      email: email.trim(),
    });

    return { success: true };
  };

  const loginAsDemo = () => {
    setIsAuthenticated(true);
    setCurrentUser(DEMO_USER);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    try {
      sessionStorage.removeItem(DEMO_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <DemoAuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        login,
        loginAsDemo,
        logout,
      }}
    >
      {children}
    </DemoAuthContext.Provider>
  );
}

export function useDemoAuth() {
  const context = useContext(DemoAuthContext);
  if (!context) {
    throw new Error('useDemoAuth must be used within a DemoAuthProvider');
  }
  return context;
}

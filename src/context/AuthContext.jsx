import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../services/authService';
import { ROLES, normalizeRole, hasPermission } from '../utils/articlePermissions';

/**
 * AuthContext for Azaad Samachar (आज़ाद समाचार)
 *
 * Real production Supabase Authentication with:
 * - Session restoration on page refresh.
 * - Profile and role synchronization from PostgreSQL profiles table.
 * - Suspended account detection and automatic sign-out.
 * - Backward-compatible demo mode support for local development.
 * - Clean subscription lifecycle management to prevent memory leaks and redirect loops.
 */

const AuthContext = createContext(null);

const DEMO_STORAGE_KEY = 'azaad_demo_session_active';

const DEMO_USER_PROFILE = {
  id: 'usr-demo-editor-01',
  name: 'राजेश कुमार',
  nameEnglish: 'Rajesh Kumar',
  email: 'editor@azaadsamachar.com',
  role: ROLES.EDITOR,
  initials: 'RK',
  desk: 'Kanpur-HQ',
  avatar: null,
  status: 'active',
};

export function AuthProvider({ children }) {
  // Synchronous initial check for demo session to eliminate reload flash
  const hasDemoInitial = typeof window !== 'undefined' && (() => {
    try {
      return sessionStorage.getItem(DEMO_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  })();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(hasDemoInitial ? DEMO_USER_PROFILE : null);
  const [isLoading, setIsLoading] = useState(!hasDemoInitial);
  const [isDemoMode, setIsDemoMode] = useState(hasDemoInitial);
  const [authError, setAuthError] = useState(null);

  // Fetch or refresh profile from database
  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }
    const { profile: userProfile } = await authService.getUserProfile(userId);
    if (userProfile) {
      setProfile(userProfile);
      return userProfile;
    }
    return null;
  }, []);

  // Initialize and restore session on mount
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        // Fast timeout race for getSession (max 1500ms) so slow network never hangs admin panel
        const sessionPromise = authService.getSession();
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve({ session: null, user: null, timedOut: true }), 1500)
        );
        const { session, user: initialUser } = await Promise.race([sessionPromise, timeoutPromise]);

        if (session && initialUser) {
          if (isMounted) {
            setUser(initialUser);
            setIsDemoMode(false);
            // Provide immediate provisional profile to prevent UI block
            setProfile((prev) => (prev && prev.id === initialUser.id ? prev : {
              id: initialUser.id,
              name: initialUser.user_metadata?.display_name || initialUser.email?.split('@')[0],
              email: initialUser.email,
              role: normalizeRole(initialUser.user_metadata?.role || ROLES.EDITOR),
              status: 'active',
            }));
            setIsLoading(false);

            // Hydrate full profile in background without blocking UI
            loadProfile(initialUser.id).then((userProfile) => {
              if (userProfile?.status === 'suspended') {
                authService.signOut();
                setUser(null);
                setProfile(null);
              }
            }).catch(() => {});
          }
        } else if (!hasDemoInitial) {
          // Check for demo session if not already checked
          try {
            const hasDemoSession = sessionStorage.getItem(DEMO_STORAGE_KEY) === 'true';
            if (hasDemoSession && isMounted) {
              setIsDemoMode(true);
              setProfile(DEMO_USER_PROFILE);
            }
          } catch {
            // Ignore sessionStorage restrictions
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Session initialization warning:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    // 3. Listen to Supabase Auth state changes
    const subscription = authService.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const currentUser = session?.user || null;
        setUser(currentUser);
        setIsDemoMode(false);

        if (currentUser) {
          const userProfile = await loadProfile(currentUser.id);
          if (userProfile?.status === 'suspended') {
            await authService.signOut();
            setUser(null);
            setProfile(null);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setIsDemoMode(false);
        try {
          sessionStorage.removeItem(DEMO_STORAGE_KEY);
        } catch {
          // Ignore
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [loadProfile]);

  // Login handler
  const login = async (email, password) => {
    setAuthError(null);
    const result = await authService.signInWithPassword(email, password);

    if (result.success) {
      setUser(result.user);
      setProfile(result.profile);
      setIsDemoMode(false);
      try {
        sessionStorage.removeItem(DEMO_STORAGE_KEY);
      } catch {
        // Ignore
      }
      return { success: true };
    } else {
      setAuthError(result.error);
      return { success: false, error: result.error };
    }
  };

  // Demo login handler for offline/prototype testing
  const loginAsDemo = (demoRole = ROLES.EDITOR) => {
    setIsDemoMode(true);
    setUser({
      id: DEMO_USER_PROFILE.id,
      email: DEMO_USER_PROFILE.email,
      user_metadata: { display_name: DEMO_USER_PROFILE.name },
    });
    setProfile({
      ...DEMO_USER_PROFILE,
      role: demoRole,
    });
    try {
      sessionStorage.setItem(DEMO_STORAGE_KEY, 'true');
    } catch {
      // Ignore
    }
    return { success: true };
  };

  // Logout handler
  const logout = async () => {
    try {
      sessionStorage.removeItem(DEMO_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setIsDemoMode(false);
    setUser(null);
    setProfile(null);
    await authService.signOut();
  };

  // Password recovery request
  const resetPassword = async (email) => {
    return authService.requestPasswordReset(email);
  };

  // Update password and clear must_change_password flag via verified server flow
  const updatePassword = async (newPassword) => {
    const res = await authService.updatePassword(newPassword);
    if (res.success && user?.id) {
      setProfile((prev) => (prev ? { ...prev, must_change_password: false } : prev));
      await refreshProfile();
    }
    return res;
  };

  // Refresh profile
  const refreshProfile = async () => {
    if (user?.id) {
      return loadProfile(user.id);
    }
    return null;
  };

  // Compute active role
  const role = useMemo(() => {
    if (isDemoMode) {
      return normalizeRole(profile?.role || ROLES.ADMIN);
    }
    return profile?.role ? normalizeRole(profile.role) : (user ? ROLES.ADMIN : null);
  }, [isDemoMode, profile, user]);

  const isSuperAdmin = useMemo(() => normalizeRole(role) === ROLES.SUPER_ADMIN, [role]);
  const isOrdinaryAdmin = useMemo(() => normalizeRole(role) === ROLES.ADMIN, [role]);
  const isSuspended = useMemo(() => profile?.status === 'suspended', [profile]);

  // Compute currentUser object compatible with existing frontend components
  const currentUser = useMemo(() => {
    if (isDemoMode) {
      return {
        ...DEMO_USER_PROFILE,
        role,
        isSuperAdmin,
        isOrdinaryAdmin,
      };
    }
    if (!user) return null;

    const displayName = profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'संपादक';
    const displayNameHindi = profile?.display_name_hindi || displayName;
    const initials = displayName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return {
      id: user.id,
      name: displayNameHindi,
      nameEnglish: displayName,
      email: user.email,
      role,
      isSuperAdmin,
      isOrdinaryAdmin,
      initials,
      desk: profile?.desk || 'Kanpur-HQ',
      avatar: profile?.avatar_url || null,
      status: profile?.status || 'active',
      bio: profile?.bio || '',
      suspendedAt: profile?.suspended_at || null,
    };
  }, [isDemoMode, user, profile, role, isSuperAdmin, isOrdinaryAdmin]);

  const isAuthenticated = Boolean(user || isDemoMode);

  // Permission helper: checks specific permission capability
  const can = useCallback(
    (action) => {
      return hasPermission(role, action);
    },
    [role]
  );

  // Role check helper
  const hasRole = useCallback(
    (allowedRoles) => {
      if (!role) return false;
      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      const normalizedCurrent = normalizeRole(role);
      return rolesArray.some((r) => normalizeRole(r) === normalizedCurrent);
    },
    [role]
  );

  const value = {
    user,
    profile,
    role,
    isSuperAdmin,
    isOrdinaryAdmin,
    isSuspended,
    currentUser,
    isAuthenticated,
    isLoading,
    isDemoMode,
    authError,
    login,
    loginAsDemo,
    logout,
    resetPassword,
    updatePassword,
    refreshProfile,
    can,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

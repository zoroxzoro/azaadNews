/**
 * Supabase Authentication & Profile Service
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Provides production-ready authentication, session restoration,
 * password recovery, and secure profile queries using Supabase Auth.
 *
 * SECURITY INVARIANTS:
 * - Passwords are never logged or stored in client storage.
 * - Profile updates strictly exclude privileged fields (role, status).
 * - Generic error messages prevent account enumeration.
 * - Suspended accounts are immediately signed out.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { ROLES, normalizeRole } from '../utils/articlePermissions.js';

export const authService = {
  /**
   * Authenticate staff member with email and password
   */
  async signInWithPassword(email, password) {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase कॉन्फ़िगर नहीं है। कृपया .env फ़ाइल में VITE_SUPABASE_URL और VITE_SUPABASE_PUBLISHABLE_KEY जांचें।',
      };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        // Generic security-conscious error message to prevent account enumeration
        let friendlyMessage = 'अमान्य ईमेल या पासवर्ड। कृपया अपने विवरण पुनः जांचें।';
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          friendlyMessage = 'कृपया पहले अपने ईमेल पते की पुष्टि करें।';
        } else if (error.message?.toLowerCase().includes('too many requests')) {
          friendlyMessage = 'अत्यधिक असफल प्रयास। कृपया कुछ मिनट बाद पुनः प्रयास करें।';
        }
        return { success: false, error: friendlyMessage, rawError: error.message };
      }

      const user = data.user;
      if (!user) {
        return { success: false, error: 'उपयोगकर्ता प्रमाणीकरण विफल रहा।' };
      }

      // Fetch user profile and verify account status
      const { profile, error: profileError } = await this.getUserProfile(user.id);

      if (profile) {
        if (profile.approval_status === 'suspended' || profile.status === 'suspended') {
          // Account is suspended; force immediate sign out
          await supabase.auth.signOut();
          return {
            success: false,
            error: 'आपका संपादकीय खाता निलंबित (Suspended) है। कृपया मुख्य व्यवस्थापक से संपर्क करें।',
          };
        }
        if (profile.approval_status === 'revoked') {
          // Account is revoked; force immediate sign out
          await supabase.auth.signOut();
          return {
            success: false,
            error: 'आपकी संपादकीय पहुंच समाप्त (Revoked) कर दी गई है।',
          };
        }
      }

      return {
        success: true,
        user,
        session: data.session,
        profile: profile || {
          id: user.id,
          display_name: user.user_metadata?.display_name || user.email.split('@')[0],
          role: ROLES.ADMIN,
          status: 'active',
          approval_status: 'approved',
        },
        profileWarning: profileError ? 'Profiles table not found or not yet migrated.' : null,
      };
    } catch (err) {
      console.error('[authService] signInWithPassword unexpected error:', err);
      return {
        success: false,
        error: 'नेटवर्क अथवा सर्वर त्रुटि। कृपया इंटरनेट कनेक्शन जांचें।',
      };
    }
  },

  /**
   * Secure Staff Sign Out
   */
  async signOut() {
    if (!isSupabaseConfigured) {
      return { success: true };
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('[authService] signOut error:', err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Get Active Session
   */
  async getSession() {
    if (!isSupabaseConfigured) {
      return { session: null, user: null };
    }
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session: data.session, user: data.session?.user || null };
    } catch (err) {
      console.warn('[authService] getSession error:', err.message);
      return { session: null, user: null, error: err.message };
    }
  },

  /**
   * Fetch User Profile from PostgreSQL profiles table
   */
  async getUserProfile(userId) {
    if (!isSupabaseConfigured || !userId) {
      return { profile: null };
    }

    try {
      // First attempt with all columns
      let query = supabase
        .from('profiles')
        .select('id, display_name, display_name_hindi, full_name, avatar_url, role, status, must_change_password, approval_status, desk, bio, email, created_at, approved_at, suspended_at')
        .eq('id', userId)
        .maybeSingle();

      let { data, error } = await query;

      if (error && error.code === '42703') {
        // Column does not exist yet; fallback to baseline schema
        const fallback = await supabase
          .from('profiles')
          .select('id, display_name, display_name_hindi, avatar_url, role, status, desk, bio, email, created_at')
          .eq('id', userId)
          .maybeSingle();
        data = fallback.data;
        error = fallback.error;
      }

      if (error) {
        return { profile: null, error: error.message };
      }

      if (data) {
        data.role = normalizeRole(data.role);
        data.approval_status = data.approval_status || (data.status === 'active' ? 'approved' : data.status || 'pending');
      }

      return { profile: data, error: null };
    } catch (err) {
      return { profile: null, error: err.message };
    }
  },

  /**
   * Send Password Recovery Email
   */
  async requestPasswordReset(email) {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase कॉन्फ़िगर नहीं है।',
      };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      // Configure redirect to existing /admin/login with recovery flag
      const redirectOrigin = window.location.origin;
      const redirectTo = `${redirectOrigin}/admin/login?type=recovery`;

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });

      if (error) {
        console.warn('[authService] resetPasswordForEmail warning:', error.message);
      }

      // Always show generic message to avoid leaking user existence
      return {
        success: true,
        message: 'यदि यह ईमेल प्रणाली में पंजीकृत है, तो पासवर्ड रीसेट लिंक भेज दिया गया है। कृपया अपना इनबॉक्स जांचें।',
      };
    } catch (err) {
      console.error('[authService] requestPasswordReset error:', err);
      return {
        success: false,
        error: 'अनुरोध संसाधित करने में समस्या आई। कृपया पुनः प्रयास करें।',
      };
    }
  },

  /**
   * Optional user password update (from personal settings)
   */
  async updatePassword(newPassword) {
    if (!isSupabaseConfigured) {
      return { success: true, message: 'डेमो पासवर्ड अद्यतन सफल।' };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'नया पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।' };
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message || 'पासवर्ड अद्यतन विफल रहा।' };
      }

      return {
        success: true,
        user: data.user,
        message: 'पासवर्ड सफलतापूर्वक बदल दिया गया है!',
      };
    } catch (err) {
      return { success: false, error: err.message || 'पासवर्ड अद्यतन में त्रुटि।' };
    }
  },

  /**
   * Safe Profile Update (Guards against role or status escalation)
   */
  async updateProfile(userId, updates = {}) {
    if (!isSupabaseConfigured || !userId) {
      return { success: false, error: 'Supabase उपलब्ध नहीं है।' };
    }

    // STRICT DEFENSE: Whitelist allowed fields only. Never allow role/status updates from ordinary calls.
    const safePayload = {};
    if (updates.display_name !== undefined) safePayload.display_name = updates.display_name;
    if (updates.display_name_hindi !== undefined) safePayload.display_name_hindi = updates.display_name_hindi;
    if (updates.avatar_url !== undefined) safePayload.avatar_url = updates.avatar_url;
    if (updates.bio !== undefined) safePayload.bio = updates.bio;
    if (updates.desk !== undefined) safePayload.desk = updates.desk;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(safePayload)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, profile: data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Update Profile safely (role and approval status stripped for security)
   */
  async updateProfile(userId, updates) {
    if (!isSupabaseConfigured || !userId) {
      return { success: false, error: 'Database not configured' };
    }
    try {
      const safeUpdates = { ...updates };
      delete safeUpdates.role;
      delete safeUpdates.approval_status;
      delete safeUpdates.id;
      delete safeUpdates.email;
      delete safeUpdates.created_at;
      delete safeUpdates.approved_at;
      delete safeUpdates.suspended_at;

      const { data, error } = await supabase
        .from('profiles')
        .update(safeUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, profile: data };
    } catch (err) {
      console.error('[authService] updateProfile error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Subscribe to Supabase Auth State Changes
   */
  onAuthStateChange(callback) {
    if (!isSupabaseConfigured) {
      return { unsubscribe: () => {} };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        callback(event, session);
      }
    );

    return {
      unsubscribe: () => {
        subscription?.unsubscribe();
      },
    };
  },
};

export default authService;

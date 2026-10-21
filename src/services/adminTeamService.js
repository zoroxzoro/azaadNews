/**
 * Admin Team Management Service
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Provides real database-backed team member management:
 * 1. Direct admin account creation via secure Supabase Edge Function
 * 2. Member listing (Active / Suspended)
 * 3. Member suspension and reactivation
 *
 * Security:
 * - Never exposes service_role key to client
 * - All privileged operations are server-authorized for Super Admin only
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { ROLES, normalizeRole } from '../utils/articlePermissions.js';

export const adminTeamService = {
  /**
   * Fetch all newsroom staff profiles (for Super Admin)
   */
  async getTeamMembers() {
    if (!isSupabaseConfigured) {
      return this._getMockTeamMembers();
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          display_name_hindi,
          full_name,
          email,
          role,
          status,
          desk,
          avatar_url,
          bio,
          created_at,
          updated_at,
          suspended_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[adminTeamService] getTeamMembers error:', error.message);
        return [];
      }

      return (data || []).map((p) => ({
        id: p.id,
        name: p.full_name || p.display_name_hindi || p.display_name || 'संपादकीय सदस्य',
        nameEnglish: p.display_name || p.full_name || 'Staff Member',
        email: p.email,
        role: normalizeRole(p.role),
        status: p.status || 'active',
        desk: p.desk || 'General',
        avatar: p.avatar_url,
        bio: p.bio,
        createdAt: p.created_at,
        suspendedAt: p.suspended_at,
      }));
    } catch (err) {
      console.warn('[adminTeamService] getTeamMembers exception:', err);
      return [];
    }
  },

  /**
   * Create a new Admin account directly via trusted server-side Edge Function.
   */
  async createAdminAccount({ name, email, password }) {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanName) {
      return { success: false, error: 'व्यवस्थापक का नाम अनिवार्य है।' };
    }
    if (!cleanEmail) {
      return { success: false, error: 'ईमेल पता अनिवार्य है।' };
    }
    if (!password || password.length < 8) {
      return { success: false, error: 'पासवर्ड न्यूनतम 8 अक्षरों का होना चाहिए।' };
    }

    if (!isSupabaseConfigured) {
      return {
        success: true,
        admin: {
          id: `mock-${Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          role: ROLES.ADMIN,
        },
      };
    }

    try {
      // 1. Verify active session exists
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (sessionErr || !session?.access_token) {
        return {
          success: false,
          status: 401,
          error: 'प्रमाणीकरण आवश्यक है (401)। कृपया सुपर एडमिन के रूप में पुनः लॉगिन करें।',
        };
      }

      // 2. Invoke remote function passing Authorization token explicitly
      const { data, error } = await supabase.functions.invoke('create-admin-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          name: cleanName,
          email: cleanEmail,
          password,
        },
      });

      if (error) {
        let status = null;
        let serverMessage = '';

        if (error.context) {
          if (typeof error.context.status === 'number') {
            status = error.context.status;
          }
          try {
            if (typeof error.context.json === 'function') {
              const body = await error.context.json();
              if (body?.error) serverMessage = body.error;
            }
          } catch (_e) {
            try {
              if (typeof error.context.text === 'function') {
                serverMessage = await error.context.text();
              }
            } catch (_e2) {}
          }
        }

        // 401: Authentication required
        if (status === 401) {
          return {
            success: false,
            status: 401,
            error: serverMessage || 'प्रमाणीकरण आवश्यक है (401)। कृपया सुपर एडमिन के रूप में पुनः लॉगिन करें।',
          };
        }

        // 403: Super Admin permission denied
        if (status === 403) {
          return {
            success: false,
            status: 403,
            error: serverMessage || 'केवल सक्रिय सुपर एडमिन ही नया एडमिन बना सकते हैं (403)।',
          };
        }

        // 404: Function not found
        if (status === 404) {
          return {
            success: false,
            status: 404,
            error: 'रिमोट एज फंक्शन उपलब्ध नहीं है (404 Not Found या डिप्लॉयमेंट लंबित)।',
          };
        }

        // 409 / Conflict / Duplicate
        if (
          status === 409 ||
          serverMessage?.toLowerCase().includes('already exists') ||
          serverMessage?.toLowerCase().includes('duplicate') ||
          serverMessage?.toLowerCase().includes('already registered')
        ) {
          return {
            success: false,
            status: 409,
            error: serverMessage || 'इस ईमेल के साथ खाता पहले से मौजूद है।',
          };
        }

        // 500 / Database error
        if (status && status >= 500) {
          return {
            success: false,
            status,
            error: serverMessage || `डेटाबेस / सर्वर त्रुटि (${status}): कृपया Supabase लॉग जांचें।`,
          };
        }

        // Network / CORS failure
        if (
          error.name === 'FunctionsFetchError' ||
          error.message?.includes('Failed to send a request') ||
          error.message?.includes('Failed to fetch')
        ) {
          return {
            success: false,
            status: 0,
            error: 'नेटवर्क या CORS त्रुटि: एज फंक्शन तक पहुँचने में विफल। कृपया CORS या नेटवर्क जांचें।',
          };
        }

        return {
          success: false,
          status: status || 400,
          error: serverMessage || error.message || 'एडमिन खाता बनाने में त्रुटि',
        };
      }

      if (data && data.error) {
        return { success: false, error: data.error };
      }

      return {
        success: true,
        admin: data?.admin || {
          id: data?.user?.id || `user-${Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          role: ROLES.ADMIN,
        },
      };
    } catch (err) {
      console.error('[adminTeamService] createAdminAccount exception:', err);
      let errorMsg = err.message || '';
      if (
        err.name === 'FunctionsFetchError' ||
        errorMsg.includes('Failed to send a request') ||
        errorMsg.includes('Failed to fetch')
      ) {
        return {
          success: false,
          status: 0,
          error: 'नेटवर्क या CORS त्रुटि: एज फंक्शन तक पहुँचने में विफल।',
        };
      }
      return { success: false, error: errorMsg || 'एडमिन खाता बनाने में त्रुटि' };
    }
  },

  /**
   * Suspend an admin account
   */
  async suspendAdmin(userId) {
    if (!isSupabaseConfigured) {
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'suspended',
          suspended_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Reactivate a suspended admin account
   */
  async reactivateAdmin(userId) {
    if (!isSupabaseConfigured) {
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'active',
          suspended_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Fallback mock members
   */
  _getMockTeamMembers() {
    return [
      {
        id: 'mock-super-admin',
        name: 'कैफ आलम (प्रधान संपादक)',
        nameEnglish: 'Kaif Alam',
        email: 'kaifalam9580@gmail.com',
        role: ROLES.SUPER_ADMIN,
        status: 'active',
        desk: 'Chief-Desk',
        avatar: null,
        bio: 'आज़ाद समाचार प्रकाशक एवं प्रधान संपादक',
        createdAt: '2026-10-18T00:00:00Z',
      },
    ];
  },
};

import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Initialization for Azaad Samachar (आज़ाद समाचार)
 *
 * This client provides authenticated and public data access to Supabase PostgreSQL.
 * Supports both Vite browser runtime and Node.js test runners.
 *
 * SECURITY NOTICE:
 * - Only the public Anon Key or Publishable Key should EVER be exposed in client code.
 * - Service Role Keys, Database Passwords, and Administrative Secrets must NEVER be
 *   committed or accessed in Vite frontend bundles.
 */

const envSource =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : typeof process !== 'undefined' && process.env
    ? process.env
    : {};

const supabaseUrl = envSource.VITE_SUPABASE_URL || 'https://mqbegmviywgktnstaxpk.supabase.co';
const isNode = typeof window === 'undefined' && typeof process !== 'undefined';
const supabasePublishableKey =
  (isNode && process.env?.SUPABASE_SERVICE_ROLE_KEY) ||
  envSource.VITE_SUPABASE_PUBLISHABLE_KEY ||
  envSource.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_eA7MetRL_U4PMReeZ8FP6A_P0mzxrhB';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

// Fallback dummy client values to allow build-time execution and safe degradation if env is missing
const safeUrl = supabaseUrl || 'https://placeholder.supabase.co';
const safeKey = supabasePublishableKey || 'placeholder-publishable-key';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: !isNode,
    autoRefreshToken: !isNode,
    detectSessionInUrl: !isNode,
    storageKey: 'azaad_samachar_auth_token',
  },
  db: {
    schema: 'public',
  },
});

export default supabase;

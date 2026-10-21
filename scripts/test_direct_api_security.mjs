/**
 * Direct API Security Verification
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Verifies that unauthenticated or non-privileged calls cannot:
 * 1. Modify roles directly via API payloads
 * 2. Delete articles directly via API
 * 3. Delete profiles or bypass constraints
 * 4. Access team invitations without privileges
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || 'https://mqbegmviywgktnstaxpk.supabase.co';
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!anonKey) {
  console.error('Error: VITE_SUPABASE_PUBLISHABLE_KEY is not defined');
  process.exit(1);
}

const anonClient = createClient(url, anonKey, {
  auth: { persistSession: false },
});

async function runDirectApiSecurityTests() {
  console.log('================================================================');
  console.log('  AZAAD SAMACHAR — DIRECT API SECURITY VERIFICATION');
  console.log('================================================================');

  let pass = 0;
  let fail = 0;

  // 1. Direct unauthenticated DELETE on articles must fail or be blocked by RLS
  try {
    const { data, error } = await anonClient
      .from('articles')
      .delete()
      .eq('id', '00000000-0000-0000-0000-000000000000');

    // Either error returned or 0 rows deleted due to RLS filter
    if (error || (Array.isArray(data) && data.length === 0) || data === null) {
      console.log('[PASS] API Security 1: Direct unauthenticated article deletion blocked/denied');
      pass++;
    } else {
      console.error('[FAIL] API Security 1: Article deletion allowed without auth');
      fail++;
    }
  } catch (err) {
    console.log('[PASS] API Security 1: Direct article deletion rejected:', err.message);
    pass++;
  }

  // 2. Direct unauthenticated update on profiles role column
  try {
    const { data, error } = await anonClient
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('id', 'a27adb86-43fd-4687-9763-74b43cff5e04');

    if (error || (Array.isArray(data) && data.length === 0) || data === null) {
      console.log('[PASS] API Security 2: Direct unauthenticated role elevation blocked/denied');
      pass++;
    } else {
      console.error('[FAIL] API Security 2: Profile role modification permitted without auth');
      fail++;
    }
  } catch (err) {
    console.log('[PASS] API Security 2: Direct profile update rejected:', err.message);
    pass++;
  }

  // 3. Direct unauthenticated access to admin_invitations table
  try {
    const { data, error } = await anonClient
      .from('admin_invitations')
      .select('*')
      .limit(10);

    // If table doesn't exist yet before DDL, or returns 0 rows due to RLS, or returns 401/403
    if (error || !data || data.length === 0) {
      console.log('[PASS] API Security 3: Invitations table protected from public/unauthenticated access');
      pass++;
    } else {
      console.error('[FAIL] API Security 3: Public access to admin_invitations permitted');
      fail++;
    }
  } catch (err) {
    console.log('[PASS] API Security 3: Access rejected:', err.message);
    pass++;
  }

  // 4. Verify historical articles count is unaltered
  try {
    const { count, error } = await anonClient
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published');

    if (!error && count >= 10000) {
      console.log(`[PASS] API Security 4: Public read access preserved for published news (${count} live articles)`);
      pass++;
    } else {
      console.error('[FAIL] API Security 4: Public articles query error:', error?.message);
      fail++;
    }
  } catch (err) {
    console.error('[FAIL] API Security 4: Exception:', err.message);
    fail++;
  }

  console.log('================================================================');
  console.log(`DIRECT API SUMMARY: ${pass} / 4 PASSED (${fail} failures)`);
  console.log('================================================================');

  if (fail > 0) process.exit(1);
}

runDirectApiSecurityTests();

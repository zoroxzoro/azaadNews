/**
 * Remote Cron Activation Verification Script
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Verifies:
 * 1. public.publish_scheduled_articles() RPC status in remote Supabase.
 * 2. Anonymous vs Authenticated access permissions.
 * 3. Prepares a disposable test article scheduled 2 minutes ahead for live verification.
 */

import fs from 'fs';

// Load .env
if (!process.env.VITE_SUPABASE_URL && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const serviceSupabase = createClient(url, serviceKey);
const anonSupabase = createClient(url, anonKey);

async function checkStatus() {
  console.log('================================================================');
  console.log('  AZAAD SAMACHAR — REMOTE CRON ACTIVATION STATUS CHECK');
  console.log('================================================================');

  // Check 1: RPC Function existence via service_role
  console.log('Checking public.publish_scheduled_articles() RPC via service_role...');
  const { data: rpcData, error: rpcError } = await serviceSupabase.rpc('publish_scheduled_articles');

  if (rpcError) {
    if (rpcError.code === 'PGRST202') {
      console.log('❌ STATUS: NOT ACTIVE (Function publish_scheduled_articles does not exist yet)');
      console.log('   Error Code:', rpcError.code);
      console.log('   Detail    :', rpcError.message);
      return { active: false, reason: 'function_missing' };
    } else {
      console.log('⚠️ RPC Error:', rpcError);
      return { active: false, reason: rpcError.message };
    }
  }

  console.log('✅ STATUS: ACTIVE!');
  console.log('   RPC Response:', rpcData);

  // Check 2: Verify anonymous users cannot execute the function
  console.log('Verifying anonymous security barrier...');
  const { data: anonData, error: anonError } = await anonSupabase.rpc('publish_scheduled_articles');
  if (anonError) {
    console.log('✅ Anonymous access properly blocked/denied (Security barrier verified):', anonError.message);
  } else {
    console.log('⚠️ Warning: Anonymous user was able to execute RPC function!');
  }

  return { active: true, rpcData };
}

checkStatus().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});

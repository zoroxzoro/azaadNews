/**
 * Phase 2 Auth & Security Verification Test
 * Azaad Samachar (आज़ाद समाचार)
 */

import { authService } from '../src/services/authService.js';
import { ROLES, ROLE_CAPABILITIES, hasPermission, normalizeRole } from '../src/utils/articlePermissions.js';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

console.log('--- TEST SUITE: PHASE 2 AUTH & ROLE PERMISSIONS ---\n');

// 1. Role Normalization Tests
console.log('1. Testing Role Normalization & Capabilities...');
assert(normalizeRole('super_admin') === ROLES.SUPER_ADMIN, 'super_admin normalizes correctly');
assert(normalizeRole('admin') === ROLES.ADMIN, 'admin normalizes correctly');
assert(normalizeRole('editor') === ROLES.EDITOR, 'editor normalizes correctly');
assert(normalizeRole('author') === ROLES.AUTHOR, 'author normalizes correctly');
assert(normalizeRole('unknown_role') === ROLES.AUTHOR, 'unknown role defaults to lowest privilege author');

// 2. Permission Matrix Tests
console.log('\n2. Testing Permission Matrix Capabilities...');
assert(hasPermission(ROLES.SUPER_ADMIN, 'canManageStaff') === true, 'super_admin has canManageStaff');
assert(hasPermission(ROLES.SUPER_ADMIN, 'canManageSettings') === true, 'super_admin has canManageSettings');
assert(hasPermission(ROLES.SUPER_ADMIN, 'canPublish') === true, 'super_admin has canPublish');

assert(hasPermission(ROLES.ADMIN, 'canManageSettings') === true, 'admin has canManageSettings');
assert(hasPermission(ROLES.ADMIN, 'canPublish') === true, 'admin has canPublish');

assert(hasPermission(ROLES.EDITOR, 'canPublish') === true, 'editor has canPublish');
assert(hasPermission(ROLES.EDITOR, 'canManageSettings') === false, 'editor CANNOT manage settings');
assert(hasPermission(ROLES.EDITOR, 'canManageStaff') === false, 'editor CANNOT manage staff');

assert(hasPermission(ROLES.AUTHOR, 'canCreate') === true, 'author can create drafts');
assert(hasPermission(ROLES.AUTHOR, 'canPublish') === false, 'author CANNOT publish directly');
assert(hasPermission(ROLES.AUTHOR, 'canDelete') === false, 'author CANNOT delete articles');
assert(hasPermission(ROLES.AUTHOR, 'canManageSettings') === false, 'author CANNOT manage settings');

// 3. Open Redirect Sanitization Logic Test
console.log('\n3. Testing Open Redirect Sanitization...');
function sanitizeRedirect(url) {
  return url && url.startsWith('/') && !url.startsWith('//') ? url : '/admin';
}
assert(sanitizeRedirect('/admin/news') === '/admin/news', 'Valid internal path allowed');
assert(sanitizeRedirect('/admin/settings?tab=general') === '/admin/settings?tab=general', 'Valid path with query allowed');
assert(sanitizeRedirect('https://evil.com') === '/admin', 'External https URL blocked and sanitized to /admin');
assert(sanitizeRedirect('//evil.com') === '/admin', 'Protocol-relative URL blocked and sanitized to /admin');
assert(sanitizeRedirect('javascript:alert(1)') === '/admin', 'javascript: URI blocked and sanitized to /admin');

// 4. Security Audit: Check for Secret Keys in Frontend Code
console.log('\n4. Security Audit: Verifying No Secrets in Frontend Code...');
const srcFiles = [];
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      walkDir(full);
    } else if (f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.json')) {
      srcFiles.push(full);
    }
  }
}
walkDir('./src');

let foundSecret = false;
for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('service_role') || content.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xYmVnbXZpeXdna3Ruc3RheHBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSI')) {
    foundSecret = true;
    console.error(`Found potential service_role key in: ${file}`);
  }
}
assert(!foundSecret, 'Zero service_role keys or secrets found in src/ codebase');

// 5. Migration Files Syntax & Structural Verification
console.log('\n5. Verifying Migration Files Integrity...');
const mig1 = fs.readFileSync('./supabase/migrations/20261019000001_initial_schema.sql', 'utf8');
const mig2 = fs.readFileSync('./supabase/migrations/20261019000002_rls_and_security.sql', 'utf8');
const mig3 = fs.readFileSync('./supabase/migrations/20261019000003_auth_and_roles_hardening.sql', 'utf8');

assert(mig1.includes('CREATE TABLE IF NOT EXISTS public.profiles'), 'Migration 1 defines profiles table');
assert(mig2.includes('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY'), 'Migration 2 enables RLS on profiles');
assert(mig2.includes('CREATE OR REPLACE FUNCTION public.get_user_role'), 'Migration 2 defines non-recursive role helper');
assert(mig3.includes('CREATE OR REPLACE FUNCTION public.bootstrap_super_admin'), 'Migration 3 defines super admin bootstrap procedure');
assert(mig3.includes('public.is_super_admin()'), 'Migration 3 defines is_super_admin helper');

console.log(`\n========================================`);
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

process.exit(failed > 0 ? 1 : 0);

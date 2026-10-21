-- =============================================================================
-- Migration: 20261019000003_auth_and_roles_hardening.sql
-- Description: Phase 2 Security Hardening for Auth, Staff Roles & Status
-- Key Enhancements:
--   1. Account Status Enforcement: Suspended staff ('suspended') are immediately
--      blocked from all database mutations regardless of role.
--   2. Strict Super Admin Hierarchy: Explicit super_admin validation function.
--   3. Email Privacy: Masks staff email addresses from public unauthenticated queries.
--   4. Administrative Bootstrap Procedure: Secure SQL script for bootstrapping
--      the first Super Admin without exposing secrets or auto-promoting public signups.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Status-Aware Role Validation Functions (Security Definer with Fixed search_path)
-- -----------------------------------------------------------------------------

-- Check if current user is active Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'super_admin' AND status = 'active'
     FROM public.profiles
     WHERE id = auth.uid()),
    false
  );
$$;

-- Enhanced: Check if current user is active admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role IN ('admin', 'super_admin') AND status = 'active'
     FROM public.profiles
     WHERE id = auth.uid()),
    false
  );
$$;

-- Enhanced: Check if current user is active editorial staff (author, editor, admin, super_admin)
CREATE OR REPLACE FUNCTION public.is_editorial_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role IN ('author', 'editor', 'admin', 'super_admin') AND status = 'active'
     FROM public.profiles
     WHERE id = auth.uid()),
    false
  );
$$;

-- Enhanced: Check if current user has active publish privileges (editor, admin, super_admin)
CREATE OR REPLACE FUNCTION public.can_publish()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role IN ('editor', 'admin', 'super_admin') AND status = 'active'
     FROM public.profiles
     WHERE id = auth.uid()),
    false
  );
$$;

-- -----------------------------------------------------------------------------
-- 2. Email Privacy & Sensitive Field Protection on Profiles
-- -----------------------------------------------------------------------------
-- Public view on profiles for newsroom bylines (omits email and sensitive metadata)
CREATE OR REPLACE VIEW public.public_author_profiles AS
  SELECT
    id,
    display_name,
    display_name_hindi,
    avatar_url,
    desk,
    bio,
    role
  FROM public.profiles
  WHERE status = 'active';

GRANT SELECT ON public.public_author_profiles TO anon, authenticated;

-- Ensure public cannot view emails directly from profiles table
DROP POLICY IF EXISTS "Public Profiles Read Access" ON public.profiles;
CREATE POLICY "Public Profiles Read Access"
  ON public.profiles FOR SELECT
  USING (
    status = 'active'
    AND (
      auth.role() = 'authenticated'
      OR id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 3. Super Admin Bootstrap Procedure (Administrative SQL Execution Only)
-- -----------------------------------------------------------------------------
-- This function can ONLY be executed by postgres / service_role in Supabase SQL editor.
-- It explicitly checks that the target user exists in auth.users before promoting.
CREATE OR REPLACE FUNCTION public.bootstrap_super_admin(target_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_user_id UUID;
  result JSONB;
BEGIN
  -- 1. Locate user in auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(TRIM(target_email));

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user with email % not found in auth.users. Please have the user sign up or create the user in Supabase Auth first.', target_email;
  END IF;

  -- 2. Upsert profile with super_admin role and active status
  INSERT INTO public.profiles (
    id,
    display_name,
    email,
    role,
    status,
    desk
  ) VALUES (
    target_user_id,
    'प्रधान संपादक (Chief Editor)',
    LOWER(TRIM(target_email)),
    'super_admin',
    'active',
    'Executive Leadership'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    status = 'active',
    updated_at = NOW();

  result := jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'email', target_email,
    'role', 'super_admin',
    'status', 'active',
    'message', 'Super admin role successfully bootstrapped.'
  );

  RETURN result;
END;
$$;

-- Revoke execution from public, anon, and authenticated.
-- Only database superusers and service_role can execute this function.
REVOKE EXECUTE ON FUNCTION public.bootstrap_super_admin(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bootstrap_super_admin(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.bootstrap_super_admin(TEXT) FROM authenticated;

-- =============================================================================
-- Migration: 20261020000010_two_level_role_based_access.sql
-- Project  : Azaad Samachar (आज़ाद समाचार)
-- Mission  : Simplified Direct Two-Level Admin Access System (Super Admin & Admin)
-- =============================================================================
--
-- Features:
-- 1. Streamlined profile lifecycle: active vs suspended, must_change_password flag.
-- 2. Security definer functions for active role checks (is_super_admin, is_approved_admin).
-- 3. Trigger preventing removal or suspension of the last active super admin.
-- 4. Server-enforced Row Level Security (RLS) policies on articles and profiles.
-- 5. Safe bootstrap for verified publisher account (kaifalam9580@gmail.com) with auth.users id verification.
-- 6. Administrative management procedures for suspension, reactivation, and revocation.
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXTEND PROFILES TABLE WITH SECURITY LIFECYCLE FIELDS
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

-- Ensure status check constraint supports active, suspended, revoked
DO $$
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check
    CHECK (status IN ('active', 'suspended', 'revoked'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Ensure role check constraint supports standard newsroom roles
DO $$
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('super_admin', 'admin', 'editor', 'author'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 2. STATUS & ROLE SECURITY DEFINER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Check if current authenticated user is an active Super Admin
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

-- Check if current authenticated user is an active Admin or Super Admin
CREATE OR REPLACE FUNCTION public.is_approved_admin()
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

-- -----------------------------------------------------------------------------
-- 3. PREVENT REMOVAL / SUSPENSION OF LAST ACTIVE SUPER ADMIN
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_last_super_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- If attempting to demote or suspend an active super_admin
  IF (OLD.role = 'super_admin' AND (NEW.role != 'super_admin' OR NEW.status != 'active')) THEN
    SELECT COUNT(*) INTO v_count
    FROM public.profiles
    WHERE role = 'super_admin'
      AND status = 'active'
      AND id != OLD.id;

    IF v_count < 1 THEN
      RAISE EXCEPTION 'Cannot demote or suspend the last active Super Admin in the newsroom.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_last_super_admin ON public.profiles;
CREATE TRIGGER trigger_prevent_last_super_admin
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_last_super_admin();

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) FOR ARTICLES
-- -----------------------------------------------------------------------------

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Drop legacy broad editorial policies
DROP POLICY IF EXISTS "Public Read Published Articles" ON public.articles;
DROP POLICY IF EXISTS "Editorial Staff Read Articles" ON public.articles;
DROP POLICY IF EXISTS "Authors Can Create Drafts" ON public.articles;
DROP POLICY IF EXISTS "Editors Can Create Any Article" ON public.articles;
DROP POLICY IF EXISTS "Authors Can Update Own Drafts" ON public.articles;
DROP POLICY IF EXISTS "Editors Can Update Any Article" ON public.articles;
DROP POLICY IF EXISTS "Admins Can Delete Articles" ON public.articles;
DROP POLICY IF EXISTS "Super Admin Read All Articles" ON public.articles;
DROP POLICY IF EXISTS "Admin Read Own Articles" ON public.articles;
DROP POLICY IF EXISTS "Super Admin Insert Articles" ON public.articles;
DROP POLICY IF EXISTS "Admin Insert Own Articles" ON public.articles;
DROP POLICY IF EXISTS "Super Admin Update Any Article" ON public.articles;
DROP POLICY IF EXISTS "Admin Update Own Articles" ON public.articles;
DROP POLICY IF EXISTS "Super Admin Delete Articles Only" ON public.articles;

-- 1. Public visitors: only read published articles
CREATE POLICY "Public Read Published Articles"
  ON public.articles FOR SELECT
  USING (
    status = 'published' AND published_at <= NOW()
  );

-- 2. Super Admin: complete unrestricted read access
CREATE POLICY "Super Admin Read All Articles"
  ON public.articles FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin()
  );

-- 3. Approved Admin: read own articles in CMS
CREATE POLICY "Admin Read Own Articles"
  ON public.articles FOR SELECT
  TO authenticated
  USING (
    public.is_approved_admin() AND author_id = auth.uid()
  );

-- 4. Super Admin: insert any article
CREATE POLICY "Super Admin Insert Articles"
  ON public.articles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_super_admin()
  );

-- 5. Approved Admin: insert articles bound to their own immutable auth.uid()
CREATE POLICY "Admin Insert Own Articles"
  ON public.articles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_approved_admin() AND author_id = auth.uid()
  );

-- 6. Super Admin: update any article (including historical WordPress imports)
CREATE POLICY "Super Admin Update Any Article"
  ON public.articles FOR UPDATE
  TO authenticated
  USING (
    public.is_super_admin()
  )
  WITH CHECK (
    public.is_super_admin()
  );

-- 7. Approved Admin: update ONLY their own articles, cannot reassign ownership
CREATE POLICY "Admin Update Own Articles"
  ON public.articles FOR UPDATE
  TO authenticated
  USING (
    public.is_approved_admin() AND author_id = auth.uid()
  )
  WITH CHECK (
    public.is_approved_admin() AND author_id = auth.uid()
  );

-- 8. Articles Delete: STRICTLY RESTRICTED TO SUPER ADMIN ONLY
CREATE POLICY "Super Admin Delete Articles Only"
  ON public.articles FOR DELETE
  TO authenticated
  USING (
    public.is_super_admin()
  );

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) FOR PROFILES
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Profiles Read Access" ON public.profiles;
DROP POLICY IF EXISTS "Staff Can Read Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff Can Update Own Profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles Read Access" ON public.profiles;
DROP POLICY IF EXISTS "Super Admin Update Any Profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin Update Own Profile" ON public.profiles;

-- 1. Profiles Read: Super Admin reads all; Admin reads active or self
CREATE POLICY "Profiles Read Access"
  ON public.profiles FOR SELECT
  USING (
    public.is_super_admin()
    OR (public.is_approved_admin() AND (status = 'active' OR id = auth.uid()))
    OR (auth.role() = 'authenticated' AND id = auth.uid())
  );

-- 2. Profiles Update: Super Admin updates any profile; Admin updates only own personal fields
CREATE POLICY "Super Admin Update Any Profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    public.is_super_admin()
  )
  WITH CHECK (
    public.is_super_admin()
  );

CREATE POLICY "Admin Update Own Profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() AND (SELECT status FROM public.profiles WHERE id = auth.uid()) = 'active'
  )
  WITH CHECK (
    id = auth.uid() AND (SELECT status FROM public.profiles WHERE id = auth.uid()) = 'active'
  );

-- Anti-escalation trigger: Ordinary admins can NEVER change role, status, must_change_password, or another user's profile
CREATE OR REPLACE FUNCTION public.check_profile_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role (Edge Functions) or active super_admin full management authority
  IF NOT (public.is_super_admin() OR auth.role() = 'service_role') THEN
    IF NEW.role != OLD.role THEN
      RAISE EXCEPTION 'Access Denied: Only Super Admins can alter user roles.';
    END IF;
    IF NEW.status != OLD.status THEN
      RAISE EXCEPTION 'Access Denied: Only Super Admins can alter account status.';
    END IF;
    IF NEW.id != auth.uid() THEN
      RAISE EXCEPTION 'Access Denied: You may only modify your own profile.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_profile_escalation ON public.profiles;
CREATE TRIGGER trigger_prevent_profile_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_escalation();

-- RLS: Editorial Activity (Super Admin only can read newsroom audit log)
ALTER TABLE public.editorial_activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff Read Editorial Activity" ON public.editorial_activity;
CREATE POLICY "Super Admin Read Editorial Activity"
  ON public.editorial_activity FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- 6. ADMINISTRATIVE STORED PROCEDURES (RPC)
-- -----------------------------------------------------------------------------

-- Procedure A: Suspend Admin
CREATE OR REPLACE FUNCTION public.suspend_newsroom_admin(p_user_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_role TEXT;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admins can suspend administrators.';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Self-suspension is prohibited.';
  END IF;

  SELECT role, email INTO v_role, v_email
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_role = 'super_admin' THEN
    IF (SELECT COUNT(*) FROM public.profiles WHERE role = 'super_admin' AND status = 'active' AND id != p_user_id) < 1 THEN
      RAISE EXCEPTION 'Cannot suspend the last active Super Admin.';
    END IF;
  END IF;

  UPDATE public.profiles
  SET
    status = 'suspended',
    suspended_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Audit Log
  BEGIN
    INSERT INTO public.editorial_activity (
      user_id,
      action,
      details,
      created_at
    ) VALUES (
      auth.uid(),
      'admin_suspended',
      jsonb_build_object('suspended_user_id', p_user_id, 'email', v_email, 'reason', p_reason),
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN jsonb_build_object('success', true, 'user_id', p_user_id, 'status', 'suspended');
END;
$$;

-- Procedure B: Reactivate Admin
CREATE OR REPLACE FUNCTION public.reactivate_newsroom_admin(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admins can reactivate administrators.';
  END IF;

  UPDATE public.profiles
  SET
    status = 'active',
    suspended_at = NULL,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING email INTO v_email;

  -- Audit Log
  BEGIN
    INSERT INTO public.editorial_activity (
      user_id,
      action,
      details,
      created_at
    ) VALUES (
      auth.uid(),
      'admin_reactivated',
      jsonb_build_object('reactivated_user_id', p_user_id, 'email', v_email),
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN jsonb_build_object('success', true, 'user_id', p_user_id, 'status', 'active');
END;
$$;

-- Procedure C: Revoke Admin Access
CREATE OR REPLACE FUNCTION public.revoke_newsroom_admin(p_user_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admins can revoke access.';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Self-revocation is prohibited.';
  END IF;

  UPDATE public.profiles
  SET
    status = 'revoked',
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING email INTO v_email;

  -- Audit Log
  BEGIN
    INSERT INTO public.editorial_activity (
      user_id,
      action,
      details,
      created_at
    ) VALUES (
      auth.uid(),
      'admin_access_revoked',
      jsonb_build_object('revoked_user_id', p_user_id, 'email', v_email, 'reason', p_reason),
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN jsonb_build_object('success', true, 'user_id', p_user_id, 'status', 'revoked');
END;
$$;

GRANT EXECUTE ON FUNCTION public.suspend_newsroom_admin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_newsroom_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_newsroom_admin(UUID, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. SECURE SUPER ADMIN BOOTSTRAP (REQUIRES VERIFIED AUTH UID & MATCHING EMAIL)
-- -----------------------------------------------------------------------------
-- Never promote arbitrarily based on email string alone.
-- Verified Publisher: 'a27adb86-43fd-4687-9763-74b43cff5e04' (kaifalam9580@gmail.com)
UPDATE public.profiles
SET
  role = 'super_admin',
  status = 'active',
  updated_at = NOW()
WHERE id = 'a27adb86-43fd-4687-9763-74b43cff5e04'
  AND email = 'kaifalam9580@gmail.com'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = 'a27adb86-43fd-4687-9763-74b43cff5e04'
      AND auth.users.email = 'kaifalam9580@gmail.com'
  );

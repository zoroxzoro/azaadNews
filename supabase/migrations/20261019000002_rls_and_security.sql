-- =============================================================================
-- Migration: 20261019000002_rls_and_security.sql
-- Description: Production Row Level Security (RLS) & Authorization Policies
-- Security Model:
--   - Principle of Least Privilege.
--   - Non-recursive SECURITY DEFINER helper functions for role checks.
--   - Anonymous visitors can only read published articles & public taxonomy.
--   - Strict prevention of role escalation and unauthorized self-promotion.
--   - Authors can create & edit their own drafts but cannot publish or delete.
--   - Editors and Admins hold explicit editorial permissions.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Helper Functions (Non-recursive with fixed search_path)
-- -----------------------------------------------------------------------------

-- Get user role safely without triggering RLS evaluation loops
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_uuid;
$$;

-- Check if current user is admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role IN ('admin', 'super_admin') FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Check if current user is editorial staff (author, editor, admin, super_admin)
CREATE OR REPLACE FUNCTION public.is_editorial_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role IN ('author', 'editor', 'admin', 'super_admin') FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Check if current user can publish (editor, admin, super_admin)
CREATE OR REPLACE FUNCTION public.can_publish()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role IN ('editor', 'admin', 'super_admin') FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- -----------------------------------------------------------------------------
-- 2. Auth Trigger: Auto Profile Creation on Signup
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_name TEXT;
BEGIN
  -- Extract display name from user metadata or fallback to email prefix
  default_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'New Author'
  );

  INSERT INTO public.profiles (
    id,
    display_name,
    email,
    role,
    status
  ) VALUES (
    NEW.id,
    default_name,
    NEW.email,
    'author',  -- Always defaults to lowest privilege 'author'
    'active'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop trigger if previously registered and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- -----------------------------------------------------------------------------
-- 3. Anti-Role Escalation Trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user is modifying their own profile
  IF auth.uid() = NEW.id THEN
    -- Check if role or status is being altered by non-admin
    IF (NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status) THEN
      IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: You cannot elevate your own role or modify your account status.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trigger_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_escalation();

-- -----------------------------------------------------------------------------
-- 4. Enable RLS on All Tables
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_url_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_batches ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 5. Policies: PROFILES
-- -----------------------------------------------------------------------------
-- Anyone (public or authenticated) can view profiles for author bylines
CREATE POLICY "Public Profiles Read Access"
  ON public.profiles FOR SELECT
  USING (status = 'active');

-- Users can update their own profile information (bio, avatar, display name)
CREATE POLICY "Users Can Update Own Profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can update any profile (e.g. promoting roles)
CREATE POLICY "Admins Can Update Any Profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only admins can delete profiles
CREATE POLICY "Admins Can Delete Profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. Policies: CATEGORIES
-- -----------------------------------------------------------------------------
-- Public can view active categories; editorial staff can view all
CREATE POLICY "Public Read Active Categories"
  ON public.categories FOR SELECT
  USING (is_active = true OR public.is_editorial_staff());

-- Admins can insert, update, or delete categories
CREATE POLICY "Admins Manage Categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 7. Policies: TAGS
-- -----------------------------------------------------------------------------
-- Public can view all tags
CREATE POLICY "Public Read Tags"
  ON public.tags FOR SELECT
  USING (true);

-- Editorial staff can insert new tags
CREATE POLICY "Staff Can Insert Tags"
  ON public.tags FOR INSERT
  TO authenticated
  WITH CHECK (public.is_editorial_staff());

-- Admins and editors can update or delete tags
CREATE POLICY "Editorial Can Manage Tags"
  ON public.tags FOR UPDATE
  TO authenticated
  USING (public.can_publish())
  WITH CHECK (public.can_publish());

CREATE POLICY "Admins Can Delete Tags"
  ON public.tags FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 8. Policies: MEDIA
-- -----------------------------------------------------------------------------
-- Public can view media metadata
CREATE POLICY "Public Read Media"
  ON public.media FOR SELECT
  USING (true);

-- Editorial staff can insert media records
CREATE POLICY "Editorial Staff Can Insert Media"
  ON public.media FOR INSERT
  TO authenticated
  WITH CHECK (public.is_editorial_staff());

-- Authors can update media they uploaded; Editors/Admins can update any media
CREATE POLICY "Media Update Access"
  ON public.media FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid() OR public.can_publish())
  WITH CHECK (uploaded_by = auth.uid() OR public.can_publish());

-- Only Admins can delete media records
CREATE POLICY "Admin Delete Media"
  ON public.media FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 9. Policies: ARTICLES
-- -----------------------------------------------------------------------------
-- Anonymous / Public visitors: only published articles whose publish time has arrived
CREATE POLICY "Public Read Published Articles"
  ON public.articles FOR SELECT
  USING (
    status = 'published' AND published_at <= NOW()
  );

-- Editorial Staff: Authors see own drafts + published; Editors/Admins see ALL
CREATE POLICY "Editorial Staff Read Articles"
  ON public.articles FOR SELECT
  TO authenticated
  USING (
    (status = 'published' AND published_at <= NOW())
    OR author_id = auth.uid()
    OR public.can_publish()
  );

-- Authors can insert articles as draft or in_review with their own author_id
CREATE POLICY "Authors Can Create Drafts"
  ON public.articles FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND status IN ('draft', 'in_review')
    AND public.is_editorial_staff()
  );

-- Editors and Admins can create articles with any valid status
CREATE POLICY "Editors Can Create Any Article"
  ON public.articles FOR INSERT
  TO authenticated
  WITH CHECK (public.can_publish());

-- Authors can update their own drafts/in_review articles (cannot publish or schedule)
CREATE POLICY "Authors Can Update Own Drafts"
  ON public.articles FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()
    AND status IN ('draft', 'in_review')
  )
  WITH CHECK (
    author_id = auth.uid()
    AND status IN ('draft', 'in_review')
  );

-- Editors and Admins can update any article and change status to published/scheduled
CREATE POLICY "Editors Can Update Any Article"
  ON public.articles FOR UPDATE
  TO authenticated
  USING (public.can_publish())
  WITH CHECK (public.can_publish());

-- Only Admins and Super Admins can delete articles
CREATE POLICY "Admins Can Delete Articles"
  ON public.articles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 10. Policies: ARTICLE CATEGORIES & TAGS (JOIN TABLES)
-- -----------------------------------------------------------------------------
CREATE POLICY "Public Read Article Categories"
  ON public.article_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.articles
      WHERE id = article_categories.article_id
        AND status = 'published'
        AND published_at <= NOW()
    )
    OR public.is_editorial_staff()
  );

CREATE POLICY "Editorial Staff Manage Article Categories"
  ON public.article_categories FOR ALL
  TO authenticated
  USING (public.is_editorial_staff())
  WITH CHECK (public.is_editorial_staff());

CREATE POLICY "Public Read Article Tags"
  ON public.article_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.articles
      WHERE id = article_tags.article_id
        AND status = 'published'
        AND published_at <= NOW()
    )
    OR public.is_editorial_staff()
  );

CREATE POLICY "Editorial Staff Manage Article Tags"
  ON public.article_tags FOR ALL
  TO authenticated
  USING (public.is_editorial_staff())
  WITH CHECK (public.is_editorial_staff());

-- -----------------------------------------------------------------------------
-- 11. Policies: ARTICLE REVISIONS & EDITORIAL ACTIVITY
-- -----------------------------------------------------------------------------
-- Revisions: Only editorial staff can view revisions; public has ZERO access
CREATE POLICY "Staff Read Article Revisions"
  ON public.article_revisions FOR SELECT
  TO authenticated
  USING (public.is_editorial_staff());

CREATE POLICY "Staff Create Article Revisions"
  ON public.article_revisions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_editorial_staff());

-- Editorial Activity: Only staff can read; no public access
CREATE POLICY "Staff Read Editorial Activity"
  ON public.editorial_activity FOR SELECT
  TO authenticated
  USING (public.is_editorial_staff());

CREATE POLICY "Staff Log Editorial Activity"
  ON public.editorial_activity FOR INSERT
  TO authenticated
  WITH CHECK (public.is_editorial_staff());

-- -----------------------------------------------------------------------------
-- 12. Policies: SITE SETTINGS
-- -----------------------------------------------------------------------------
-- Public can read site settings (portal name, social links, footer configs)
CREATE POLICY "Public Read Site Settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only Admins can modify site settings
CREATE POLICY "Admins Manage Site Settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 13. Policies: LEGACY URL REDIRECTS
-- -----------------------------------------------------------------------------
-- Public can look up redirects
CREATE POLICY "Public Read Redirects"
  ON public.legacy_url_redirects FOR SELECT
  USING (true);

-- Admins manage redirects
CREATE POLICY "Admins Manage Redirects"
  ON public.legacy_url_redirects FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 14. Policies: MIGRATION BATCHES
-- -----------------------------------------------------------------------------
-- Strictly restricted to Admins and internal migration scripts
CREATE POLICY "Admins View Migration Batches"
  ON public.migration_batches FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins Manage Migration Batches"
  ON public.migration_batches FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

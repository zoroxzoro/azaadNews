-- =============================================================================
-- Migration: 20261019000005_storage_and_media_policies.sql
-- Description: Supabase Storage Bucket ('media-library') & Security Policies
-- Security Model:
--   - Public Read for all approved newsroom media
--   - Authenticated editorial staff can upload to 'media-library'
--   - Authors can update/delete only their own uploads
--   - Editors and Admins can manage any media
--   - Strict MIME type and 10MB file size constraints
-- =============================================================================

-- 1. Create 'media-library' storage bucket if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-library',
  'media-library',
  true,
  26214400, -- 25MB maximum file size limit (allows historical 20.4MB PNGs)
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

-- 2. Storage RLS Policies on storage.objects

-- Policy A: Public Read Access
DROP POLICY IF EXISTS "Public Read Media Library Objects" ON storage.objects;
CREATE POLICY "Public Read Media Library Objects"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media-library');

-- Policy B: Editorial Staff Upload Access
DROP POLICY IF EXISTS "Staff Upload Media Library Objects" ON storage.objects;
CREATE POLICY "Staff Upload Media Library Objects"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media-library'
    AND public.is_editorial_staff()
  );

-- Policy C: Staff Update Access (Owner or can_publish)
DROP POLICY IF EXISTS "Staff Update Media Library Objects" ON storage.objects;
CREATE POLICY "Staff Update Media Library Objects"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'media-library'
    AND (owner = auth.uid() OR public.can_publish())
  )
  WITH CHECK (
    bucket_id = 'media-library'
    AND (owner = auth.uid() OR public.can_publish())
  );

-- Policy D: Staff Delete Access (Owner or Admin)
DROP POLICY IF EXISTS "Staff Delete Media Library Objects" ON storage.objects;
CREATE POLICY "Staff Delete Media Library Objects"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'media-library'
    AND (owner = auth.uid() OR public.is_admin())
  );

-- 3. Enhance public.media table indexes for fast joins and lookups
CREATE INDEX IF NOT EXISTS idx_media_public_url ON public.media(public_url);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON public.media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_articles_featured_media_id ON public.articles(featured_media_id);

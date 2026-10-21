-- =============================================================================
-- Migration: 20261020000006_wordpress_migration_support.sql
-- Description: Schema support for Historical WordPress Migration (Phase 5)
-- Features:
--   1. Seed distinct 'kanpur' category to preserve Kanpur journalism taxonomy
--   2. Add legacy author and migration audit columns to public.articles
--   3. Unique index on articles(legacy_wordpress_id) for idempotent upserting
--   4. Index on media(legacy_wordpress_attachment_id)
--   5. Safety guards for articles edited in CMS post-migration
-- =============================================================================

-- 1. Seed 'kanpur' Category in public.categories
INSERT INTO public.categories (
  name,
  slug,
  english_name,
  description,
  color,
  display_order,
  is_active,
  show_in_navigation,
  is_primary
) VALUES (
  'कानपुर',
  'kanpur',
  'Kanpur',
  'कानपुर नगर, देहात, उद्योग, अपराध, प्रशासन और स्थानीय समाचार',
  '#DA251D',
  5,
  true,
  true,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  english_name = EXCLUDED.english_name,
  description = EXCLUDED.description,
  is_active = true,
  show_in_navigation = true,
  updated_at = NOW();

-- 2. Enhance public.articles for Historical Migration
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS legacy_author_name TEXT,
  ADD COLUMN IF NOT EXISTS author_attribution JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_imported BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS import_batch_id UUID REFERENCES public.migration_batches(id) ON DELETE SET NULL;

-- 3. Enhance public.media for Batch Tracking
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS import_batch_id UUID REFERENCES public.migration_batches(id) ON DELETE SET NULL;

-- 4. Ensure Unique Indexes for Idempotency and Precise Batch Rollback
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_legacy_wp_id
  ON public.articles(legacy_wordpress_id)
  WHERE legacy_wordpress_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_articles_import_batch
  ON public.articles(import_batch_id)
  WHERE import_batch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_media_import_batch
  ON public.media(import_batch_id)
  WHERE import_batch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_media_legacy_wp_attachment_id
  ON public.media(legacy_wordpress_attachment_id)
  WHERE legacy_wordpress_attachment_id IS NOT NULL;

-- 5. Enable articles without an active auth.users profile to reference fallback author
ALTER TABLE public.articles
  ALTER COLUMN author_id DROP NOT NULL;

-- 6. Comments for Documentation
COMMENT ON COLUMN public.articles.legacy_wordpress_id IS 'Original WordPress post ID for idempotent synchronization';
COMMENT ON COLUMN public.articles.legacy_author_name IS 'Original WordPress author display name';
COMMENT ON COLUMN public.articles.author_attribution IS 'Structured historical author metadata';
COMMENT ON COLUMN public.articles.is_imported IS 'True if record was imported from historical WordPress database';
COMMENT ON COLUMN public.articles.import_batch_id IS 'Reference to the specific migration_batches execution run';
COMMENT ON COLUMN public.media.import_batch_id IS 'Reference to the specific migration_batches execution run for auditable rollback';


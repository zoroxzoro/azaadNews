-- =============================================================================
-- Migration: 20261019000001_initial_schema.sql
-- Description: Core Schema for Azaad Samachar (आज़ाद समाचार) Digital Portal
-- Tables:
--   1. profiles
--   2. categories
--   3. tags
--   4. media
--   5. articles
--   6. article_categories
--   7. article_tags
--   8. article_revisions
--   9. editorial_activity
--  10. site_settings
--  11. legacy_url_redirects
--  12. migration_batches
-- =============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 0. Universal Updated At Trigger Function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1. Profiles (Linked to auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  display_name_hindi TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'author' CHECK (role IN ('super_admin', 'admin', 'editor', 'author')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'invited')),
  desk TEXT DEFAULT 'General',
  bio TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_timestamp();

-- -----------------------------------------------------------------------------
-- 2. Categories
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                             -- Primary Hindi name (e.g. 'उत्तर प्रदेश')
  slug VARCHAR(120) NOT NULL UNIQUE,              -- URL slug (e.g. 'uttar-pradesh')
  english_name TEXT,                              -- English reference (e.g. 'Uttar Pradesh')
  description TEXT,
  color VARCHAR(50) DEFAULT '#DA251D',
  icon VARCHAR(50),
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  show_in_navigation BOOLEAN NOT NULL DEFAULT true,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  legacy_wordpress_term_id BIGINT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);

-- -----------------------------------------------------------------------------
-- 3. Tags
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug VARCHAR(150) NOT NULL UNIQUE,
  legacy_wordpress_term_id BIGINT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.tags(slug);

-- -----------------------------------------------------------------------------
-- 4. Media
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_wordpress_attachment_id BIGINT UNIQUE,
  storage_bucket TEXT NOT NULL DEFAULT 'news-media',
  storage_path TEXT,
  public_url TEXT NOT NULL,
  thumbnail_url TEXT,
  original_filename TEXT,
  mime_type VARCHAR(100),
  file_size BIGINT,
  width INT,
  height INT,
  alt_text TEXT,
  caption TEXT,
  credit TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_media_updated_at
  BEFORE UPDATE ON public.media
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE INDEX IF NOT EXISTS idx_media_legacy_id ON public.media(legacy_wordpress_attachment_id)
  WHERE legacy_wordpress_attachment_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. Articles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_wordpress_id BIGINT UNIQUE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content_json JSONB,                             -- Canonical TipTap Prosemirror Document
  original_html TEXT,                             -- Sanitized raw HTML from WordPress migration
  language VARCHAR(10) NOT NULL DEFAULT 'hi',
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived')),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  featured_media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
  is_breaking BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_trending BOOLEAN NOT NULL DEFAULT false,
  youtube_url TEXT,
  video_duration VARCHAR(20),
  read_time VARCHAR(50),
  views_count BIGINT NOT NULL DEFAULT 0,
  location VARCHAR(100) DEFAULT 'नई दिल्ली',
  seo_title TEXT,
  seo_description TEXT,
  canonical_url TEXT,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  legacy_created_at TIMESTAMPTZ,
  legacy_modified_at TIMESTAMPTZ,
  legacy_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Essential Indexes for High-Traffic News Portal
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status_published_at
  ON public.articles(status, published_at DESC)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_scheduled
  ON public.articles(scheduled_at)
  WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_articles_legacy_id
  ON public.articles(legacy_wordpress_id)
  WHERE legacy_wordpress_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_breaking
  ON public.articles(published_at DESC)
  WHERE is_breaking = true AND status = 'published';
CREATE INDEX IF NOT EXISTS idx_articles_featured
  ON public.articles(published_at DESC)
  WHERE is_featured = true AND status = 'published';
CREATE INDEX IF NOT EXISTS idx_articles_trending
  ON public.articles(published_at DESC)
  WHERE is_trending = true AND status = 'published';

-- -----------------------------------------------------------------------------
-- 6. Article Categories Join Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.article_categories (
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (article_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_article_categories_category_id
  ON public.article_categories(category_id);

-- -----------------------------------------------------------------------------
-- 7. Article Tags Join Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.article_tags (
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id
  ON public.article_tags(tag_id);

-- -----------------------------------------------------------------------------
-- 8. Article Revisions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.article_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  revision_number INT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content_json JSONB,
  status VARCHAR(20),
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  change_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_article_revisions_article
  ON public.article_revisions(article_id, revision_number DESC);

-- -----------------------------------------------------------------------------
-- 9. Editorial Activity Log
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.editorial_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_editorial_activity_article ON public.editorial_activity(article_id);
CREATE INDEX IF NOT EXISTS idx_editorial_activity_created ON public.editorial_activity(created_at DESC);

-- -----------------------------------------------------------------------------
-- 10. Site Settings
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_timestamp();

-- -----------------------------------------------------------------------------
-- 11. Legacy URL Redirects
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.legacy_url_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_path TEXT NOT NULL UNIQUE,
  target_slug TEXT NOT NULL,
  article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  status_code INT NOT NULL DEFAULT 301,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legacy_redirects_source ON public.legacy_url_redirects(source_path);

-- -----------------------------------------------------------------------------
-- 12. Migration Batches
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.migration_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system VARCHAR(50) NOT NULL DEFAULT 'wordpress_mariadb',
  entity_type VARCHAR(50) NOT NULL,
  batch_number INT NOT NULL,
  total_records INT NOT NULL DEFAULT 0,
  successful_records INT NOT NULL DEFAULT 0,
  failed_records INT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_migration_batches_status ON public.migration_batches(status);

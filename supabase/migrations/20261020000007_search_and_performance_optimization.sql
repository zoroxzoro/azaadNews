-- Migration 7: Search & Performance Optimization
-- Phase 7 Step 2: Full Archive Access & Query Accelerators
-- Azaad Samachar (आज़ाद समाचार)

-- 1. Enable pg_trgm extension for fast ILIKE and substring search on Hindi Unicode and English text
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. GIN trigram indexes for fast full-archive search on article title and excerpt
CREATE INDEX IF NOT EXISTS idx_articles_title_trgm
  ON public.articles
  USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_articles_excerpt_trgm
  ON public.articles
  USING gin (excerpt gin_trgm_ops);

-- 3. GIN trigram index on media original_filename for rapid media library asset search
CREATE INDEX IF NOT EXISTS idx_media_filename_trgm
  ON public.media
  USING gin (original_filename gin_trgm_ops);

-- 4. Composite index on article_categories to accelerate category feed queries
CREATE INDEX IF NOT EXISTS idx_article_categories_composite
  ON public.article_categories(category_id, is_primary, article_id);

-- 5. Index on media created_at descending for paginated media browsing
CREATE INDEX IF NOT EXISTS idx_media_created_at_desc
  ON public.media(created_at DESC);

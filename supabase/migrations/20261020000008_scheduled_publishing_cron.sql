-- =============================================================================
-- Migration: 20261020000008_scheduled_publishing_cron.sql
-- Project  : Azaad Samachar (आज़ाद समाचार)
-- Purpose  : Fully automated server-side scheduled publishing via pg_cron & stored procedure
-- =============================================================================
--
-- This script is completely IDEMPOTENT and safe to execute multiple times.
--
-- 1. Creates or verifies the pg_cron extension.
-- 2. Defines the public.publish_scheduled_articles() stored procedure:
--    - Evaluates only due articles: status = 'scheduled' AND scheduled_at <= NOW().
--    - Uses row-level lock FOR UPDATE SKIP LOCKED to prevent race conditions.
--    - Transitions status to 'published' and sets published_at = scheduled_at.
--    - Clears scheduled_at to NULL.
--    - Does NOT mutate title, slug, excerpt, content, media, or any other field.
--    - Records an audit entry in public.editorial_activity.
-- 3. Grants execution permissions exclusively to authenticated staff and service_role (revoked from anon/public).
-- 4. Registers a recurring 1-minute cron job ('azaad-publish-scheduled-news') in pg_cron.
--
-- =============================================================================

-- Step 1: Ensure pg_cron extension is active
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Create / replace the atomic publishing stored procedure
CREATE OR REPLACE FUNCTION public.publish_scheduled_articles()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count integer := 0;
  v_published_ids uuid[] := ARRAY[]::uuid[];
  v_article_record RECORD;
BEGIN
  -- Atomically lock and iterate over due scheduled articles
  FOR v_article_record IN
    SELECT id, title, slug, scheduled_at
    FROM public.articles
    WHERE status = 'scheduled'
      AND scheduled_at IS NOT NULL
      AND scheduled_at <= NOW()
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Safely transition to published without altering content or metadata
    UPDATE public.articles
    SET
      status = 'published',
      published_at = COALESCE(scheduled_at, NOW()),
      scheduled_at = NULL,
      updated_at = NOW()
    WHERE id = v_article_record.id;

    v_published_ids := array_append(v_published_ids, v_article_record.id);
    v_count := v_count + 1;

    -- Audit trail in editorial_activity
    BEGIN
      INSERT INTO public.editorial_activity (
        article_id,
        action,
        details,
        created_at
      ) VALUES (
        v_article_record.id,
        'auto_published_by_scheduler',
        jsonb_build_object(
          'title', v_article_record.title,
          'slug', v_article_record.slug,
          'scheduled_at', v_article_record.scheduled_at,
          'published_at', NOW(),
          'method', 'pg_cron_publish_scheduled_articles'
        ),
        NOW()
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Audit logging failure should not abort the publication transaction
        NULL;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'published_count', v_count,
    'published_ids', v_published_ids,
    'timestamp', NOW()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE,
      'timestamp', NOW()
    );
END;
$$;

-- Step 3: Hardened access control
REVOKE ALL ON FUNCTION public.publish_scheduled_articles() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_scheduled_articles() FROM anon;
GRANT EXECUTE ON FUNCTION public.publish_scheduled_articles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_scheduled_articles() TO service_role;

-- Step 4: Idempotent pg_cron registration
-- Remove any previous schedules with matching names to avoid duplicate triggers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname IN ('azaad-publish-scheduled-news', 'publish-scheduled-news')) THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname IN ('azaad-publish-scheduled-news', 'publish-scheduled-news');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- In case cron.job is not queryable directly by the current user
    NULL;
END;
$$;

-- Schedule the recurring worker cycle every 1 minute
SELECT cron.schedule(
  'azaad-publish-scheduled-news',
  '* * * * *',
  'SELECT public.publish_scheduled_articles();'
);

-- Step 5: Verification Output
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'azaad-publish-scheduled-news';

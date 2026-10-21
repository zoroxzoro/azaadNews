-- Migration 8: Automated Scheduled Publishing Function & Audit Trail
-- Phase 7 Step 8.5: Critical CMS Functional Audit & Broken Feature Repair
-- Azaad Samachar (आज़ाद समाचार)
--
-- Provides an idempotent, race-condition-safe stored procedure to publish
-- scheduled news articles whose scheduled_at timestamp has arrived (scheduled_at <= NOW()).
--
-- Can be called via:
-- 1. pg_cron (e.g. SELECT cron.schedule('publish-scheduled-news', '* * * * *', 'SELECT public.publish_scheduled_articles();'))
-- 2. Supabase Scheduled Edge Function
-- 3. articlesService.publishOverdueScheduledArticles() via Supabase RPC / service role

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
  -- Select and atomically lock candidates for publication
  FOR v_article_record IN
    SELECT id, title, scheduled_at
    FROM public.articles
    WHERE status = 'scheduled'
      AND scheduled_at IS NOT NULL
      AND scheduled_at <= NOW()
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Transition status to published
    UPDATE public.articles
    SET
      status = 'published',
      published_at = COALESCE(scheduled_at, NOW()),
      scheduled_at = NULL,
      updated_at = NOW()
    WHERE id = v_article_record.id;

    v_published_ids := array_append(v_published_ids, v_article_record.id);
    v_count := v_count + 1;

    -- Audit log in editorial_activity
    INSERT INTO public.editorial_activity (
      article_id,
      action,
      details,
      created_at
    ) VALUES (
      v_article_record.id,
      'auto_published_by_scheduler',
      jsonb_build_object(
        'scheduled_at', v_article_record.scheduled_at,
        'published_at', NOW(),
        'method', 'publish_scheduled_articles_rpc'
      ),
      NOW()
    );
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

-- Grant execution to authenticated staff and service role
REVOKE ALL ON FUNCTION public.publish_scheduled_articles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_scheduled_articles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_scheduled_articles() TO service_role;

-- =============================================================================
-- Migration: 20261020000009_editorial_notifications.sql
-- Description: Real Database-Backed Editorial Notification System for CMS
-- Date: 2026-10-20
-- =============================================================================

-- 1. Create table editorial_notifications
CREATE TABLE IF NOT EXISTS public.editorial_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL, -- 'scheduled', 'published', 'review', 'draft', 'media', 'system'
  title TEXT NOT NULL,
  message TEXT,
  article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for efficient lookup and count queries
CREATE INDEX IF NOT EXISTS idx_editorial_notifications_created 
  ON public.editorial_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_editorial_notifications_unread 
  ON public.editorial_notifications(is_read) 
  WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_editorial_notifications_user 
  ON public.editorial_notifications(user_id);

-- 3. Enable Row-Level Security
ALTER TABLE public.editorial_notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Editorial staff can read notifications
DROP POLICY IF EXISTS "Staff can read notifications" ON public.editorial_notifications;
CREATE POLICY "Staff can read notifications"
  ON public.editorial_notifications FOR SELECT
  TO authenticated, anon
  USING (true);

-- Authenticated staff and service role can insert notifications
DROP POLICY IF EXISTS "Staff can insert notifications" ON public.editorial_notifications;
CREATE POLICY "Staff can insert notifications"
  ON public.editorial_notifications FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Staff can update notification read status
DROP POLICY IF EXISTS "Staff can update notifications" ON public.editorial_notifications;
CREATE POLICY "Staff can update notifications"
  ON public.editorial_notifications FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

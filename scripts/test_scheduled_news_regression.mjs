/**
 * Focused Scheduled News Regression Verification Script
 * Tests the complete workflow:
 * 1. Article creation with scheduled status & future IST/UTC timestamp.
 * 2. Supabase PostgreSQL persistence (status = 'scheduled', scheduled_at).
 * 3. articlesService.getScheduledArticles() query and mapping.
 * 4. Rescheduling persistence.
 * 5. Cancellation (returnToDraft) persistence.
 * 6. Clean up disposable test article.
 * 7. Verification of Supabase Cron status.
 */

import fs from 'fs';

// Load .env
if (!process.env.VITE_SUPABASE_URL && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

import { createClient } from '@supabase/supabase-js';
import { articlesService } from '../src/services/articlesService.js';
import { istToUtcIso, combineIstDateTimeToUtcIso, formatInIST } from '../src/utils/timezoneUtils.js';

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(url, serviceKey);

async function runTest() {
  console.log('--- STARTING SCHEDULED NEWS VERIFICATION ---');

  let testArticleId = null;

  try {
    // 1. Prepare disposable scheduled article
    const tomorrowUtcIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const testSlug = `test-scheduled-${Date.now()}`;

    const newArticleData = {
      title: 'परीक्षण शेड्यूल्ड समाचार (Regression Test)',
      slug: testSlug,
      summary: 'यह शेड्यूलिंग रिग्रेशन टेस्ट हेतु स्वचालित परीक्षण समाचार है।',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'परीक्षण आलेख सामग्री विस्तार से।' }],
          },
        ],
      },
      category: 'national',
      language: 'hi',
      status: 'scheduled',
      scheduledAt: tomorrowUtcIso,
      scheduledFor: tomorrowUtcIso,
    };

    console.log('Step 1: Creating scheduled article...');
    const createRes = await articlesService.createArticle(newArticleData);
    if (!createRes.success || !createRes.data) {
      throw new Error(`Failed to create article: ${createRes.error}`);
    }

    testArticleId = createRes.data.id;
    console.log(`[PASS] Article created with ID: ${testArticleId}`);

    // 2. Check directly in Supabase PostgreSQL
    console.log('Step 2: Checking PostgreSQL record directly...');
    const { data: dbRecord, error: dbError } = await supabase
      .from('articles')
      .select('id, title, status, scheduled_at, published_at')
      .eq('id', testArticleId)
      .single();

    if (dbError || !dbRecord) {
      throw new Error(`Failed to fetch database record: ${dbError?.message}`);
    }

    if (dbRecord.status !== 'scheduled') {
      throw new Error(`Expected status to be 'scheduled', got '${dbRecord.status}'`);
    }

    if (!dbRecord.scheduled_at) {
      throw new Error(`Expected scheduled_at to be set, got null`);
    }

    console.log(`[PASS] PostgreSQL verified: status=${dbRecord.status}, scheduled_at=${dbRecord.scheduled_at}`);

    // 3. Check Scheduled News listing via articlesService.getScheduledArticles()
    console.log('Step 3: Checking articlesService.getScheduledArticles()...');
    const scheduledList = await articlesService.getScheduledArticles();
    const foundInList = scheduledList.find((a) => String(a.id) === String(testArticleId));
    if (!foundInList) {
      throw new Error(`Article ${testArticleId} not found in getScheduledArticles() result of ${scheduledList.length} items`);
    }
    console.log(`[PASS] Found article in Scheduled News listing (Total scheduled: ${scheduledList.length})`);

    // 4. Reschedule article
    console.log('Step 4: Rescheduling article to day after tomorrow...');
    const dayAfterUtcIso = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const rescheduleRes = await articlesService.changeArticleStatus(testArticleId, 'scheduled', {
      scheduledAt: dayAfterUtcIso,
      scheduledFor: dayAfterUtcIso,
    });

    if (!rescheduleRes.success) {
      throw new Error(`Reschedule failed: ${rescheduleRes.error}`);
    }

    const { data: rescheduledDb } = await supabase
      .from('articles')
      .select('id, status, scheduled_at')
      .eq('id', testArticleId)
      .single();

    if (new Date(rescheduledDb.scheduled_at).getTime() !== new Date(dayAfterUtcIso).getTime()) {
      throw new Error(`Rescheduled timestamp mismatch: expected ${dayAfterUtcIso}, got ${rescheduledDb.scheduled_at}`);
    }
    console.log(`[PASS] Reschedule verified in PostgreSQL: new scheduled_at=${rescheduledDb.scheduled_at}`);

    // 5. Cancel scheduling (return to draft)
    console.log('Step 5: Cancelling scheduling (returning to draft)...');
    const cancelRes = await articlesService.changeArticleStatus(testArticleId, 'draft', {
      scheduledAt: null,
      scheduledFor: null,
    });

    if (!cancelRes.success) {
      throw new Error(`Cancel scheduling failed: ${cancelRes.error}`);
    }

    const { data: draftDb } = await supabase
      .from('articles')
      .select('id, status, scheduled_at')
      .eq('id', testArticleId)
      .single();

    if (draftDb.status !== 'draft') {
      throw new Error(`Expected status to be 'draft', got '${draftDb.status}'`);
    }
    if (draftDb.scheduled_at !== null) {
      throw new Error(`Expected scheduled_at to be null, got ${draftDb.scheduled_at}`);
    }
    console.log(`[PASS] Cancellation verified in PostgreSQL: status=${draftDb.status}, scheduled_at=${draftDb.scheduled_at}`);

    // 6. Check Supabase Cron status
    console.log('Step 6: Checking Supabase Cron / backend automatic scheduler status...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('publish_scheduled_articles');
    if (rpcError) {
      console.log(`[INFO] Supabase RPC / pg_cron status: INACTIVE (${rpcError.message})`);
      console.log('-> Automatic publishing requires backend activation (pg_cron or Edge Function).');
    } else {
      console.log('[INFO] Supabase RPC publish_scheduled_articles is ACTIVE:', rpcData);
    }

    console.log('--- ALL SCHEDULED NEWS WORKFLOW TESTS PASSED ---');
  } finally {
    // Clean up disposable test article
    if (testArticleId) {
      console.log(`Cleaning up test article ${testArticleId}...`);
      await supabase.from('article_categories').delete().eq('article_id', testArticleId);
      await supabase.from('article_tags').delete().eq('article_id', testArticleId);
      await supabase.from('editorial_activity').delete().eq('article_id', testArticleId);
      await supabase.from('article_revisions').delete().eq('article_id', testArticleId);
      await supabase.from('articles').delete().eq('id', testArticleId);
      console.log('Test article cleaned up successfully.');
    }
  }
}

runTest().catch((err) => {
  console.error('[TEST FAILED]', err);
  process.exit(1);
});

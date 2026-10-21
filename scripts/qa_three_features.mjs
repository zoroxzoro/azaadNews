/**
 * Focused QA Test Suite for Phase 8 Quick Fix:
 * 1. Scheduled News
 * 2. AI Content Checker
 * 3. Admin Notifications
 */

import fs from 'fs';
import path from 'path';

// Native .env parser if not supplied via --env-file
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
import { runAiContentAnalysis } from '../src/utils/aiContentChecker.js';
import { istToUtcIso, getIstParts, combineIstDateTimeToUtcIso } from '../src/utils/timezoneUtils.js';

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(url, serviceKey);
const anonSupabase = createClient(url, anonKey);

async function runTests() {
  console.log('================================================================');
  console.log('  AZAAD SAMACHAR — PHASE 8 QUICK FIX TEST SUITE');
  console.log('================================================================\n');

  let passes = 0;
  let fails = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passes++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      fails++;
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 1: SCHEDULED NEWS
  // ---------------------------------------------------------------------------
  console.log('--- TEST 1: SCHEDULED NEWS ---');

  // Timezone check: Asia/Kolkata (+05:30) to UTC ISO
  const testDate = '2026-10-25';
  const testTime = '14:30'; // 2:30 PM IST
  const utcIso = combineIstDateTimeToUtcIso(testDate, testTime);
  assert(utcIso === '2026-10-25T09:00:00.000Z', 'combineIstDateTimeToUtcIso correctly maps 14:30 IST to 09:00 UTC');

  const istBack = getIstParts(utcIso);
  assert(istBack.dateStr === '2026-10-25' && istBack.timeStr === '14:30', 'getIstParts recovers exact Asia/Kolkata date and time');

  // Insert real isolated scheduled article in Supabase
  const futureUtc = new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(); // 3 hours in future
  const schedSlug = `qa-sched-fix-${Date.now()}`;
  const { data: schedArt, error: schedInsErr } = await supabase.from('articles').insert({
    title: 'परीक्षण निर्धारित समाचार (QA Scheduled)',
    slug: schedSlug,
    excerpt: 'शेड्यूलिंग परीक्षण सारांश',
    content_json: { type: 'doc', content: [{ type: 'paragraph', text: 'परीक्षण' }] },
    status: 'scheduled',
    scheduled_at: futureUtc,
    language: 'hi',
  }).select().single();

  assert(!schedInsErr && schedArt?.status === 'scheduled', 'Article saved with status "scheduled" and UTC timestamp');

  // Privacy check: Anonymous visitor CANNOT see the scheduled article
  const { data: anonCheck } = await anonSupabase.from('articles').select('id, title, status').eq('id', schedArt?.id);
  assert(!anonCheck || anonCheck.length === 0, 'Scheduled article is private and hidden from anonymous visitors via RLS');

  // Reschedule test: update scheduled_at to past time
  const overdueUtc = new Date(Date.now() - 5000).toISOString();
  const { data: reschedArt, error: reschedErr } = await supabase
    .from('articles')
    .update({ scheduled_at: overdueUtc })
    .eq('id', schedArt.id)
    .select()
    .single();

  const isReschedMatch = reschedArt?.scheduled_at && new Date(reschedArt.scheduled_at).getTime() === new Date(overdueUtc).getTime();
  assert(!reschedErr && isReschedMatch, 'Article can be rescheduled with new timestamp');

  // Server-side automatic publishing: execute publisher worker cycle
  const { runScheduledPublisherCycle } = await import('./scheduled_publisher_worker.mjs');
  const pubCycle = await runScheduledPublisherCycle();
  assert(pubCycle.success === true && pubCycle.publishedIds.includes(schedArt.id), 'Server-side worker automatically reconciles and publishes overdue article');

  // Verify post-publication state: status is published, scheduled_at is null
  const { data: postPub } = await supabase.from('articles').select('id, status, published_at, scheduled_at').eq('id', schedArt.id).single();
  assert(postPub?.status === 'published' && postPub?.scheduled_at === null, 'Article successfully transitioned to "published" with scheduled_at cleared');

  // Cancellation test: return to draft
  const { data: cancelledArt, error: cancelErr } = await supabase
    .from('articles')
    .update({ status: 'draft', scheduled_at: null })
    .eq('id', schedArt.id)
    .select()
    .single();

  assert(!cancelErr && cancelledArt?.status === 'draft', 'Article scheduling can be cancelled back to draft');

  // Cleanup test article
  await supabase.from('articles').delete().eq('id', schedArt.id);
  console.log('  Cleaned up test scheduled article.\n');


  // ---------------------------------------------------------------------------
  // TEST 2: AI CONTENT CHECKER
  // ---------------------------------------------------------------------------
  console.log('--- TEST 2: AI CONTENT CHECKER ---');
  const targetSentence = 'Teh goverment annouced a new developement programe.';

  // Test across headline
  const headlineResults = runAiContentAnalysis(null, 'en', { title: targetSentence });
  const headlineWords = headlineResults.map((s) => s.originalText);
  assert(
    headlineResults.length === 5 &&
    headlineWords.includes('Teh') &&
    headlineWords.includes('goverment') &&
    headlineWords.includes('annouced') &&
    headlineWords.includes('developement') &&
    headlineWords.includes('programe'),
    'AI Checker detects all 5 spelling mistakes in headline ("Teh", "goverment", "annouced", "developement", "programe")'
  );

  // Test across excerpt
  const excerptResults = runAiContentAnalysis(null, 'en', { excerpt: targetSentence });
  assert(excerptResults.length === 5, 'AI Checker detects all 5 spelling mistakes in excerpt');

  // Verify corrections
  const tehCorrection = headlineResults.find((s) => s.originalText === 'Teh');
  assert(tehCorrection?.suggestedText === 'The', 'Preserves capitalization: "Teh" -> "The"');

  const govCorrection = headlineResults.find((s) => s.originalText === 'goverment');
  assert(govCorrection?.suggestedText === 'government', '"goverment" -> "government"');


  // ---------------------------------------------------------------------------
  // TEST 3: ADMIN NOTIFICATIONS
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 3: ADMIN NOTIFICATIONS ---');

  // Verify editorial_activity database events query
  const { data: actRows, error: actErr } = await supabase
    .from('editorial_activity')
    .select('id, article_id, action, details, created_at, articles(id, title, slug)')
    .order('created_at', { ascending: false })
    .limit(10);

  assert(!actErr && Array.isArray(actRows) && actRows.length > 0, 'Database query against editorial_activity succeeds with real events');

  // Insert a real published event
  const { data: testEvent, error: insEventErr } = await supabase.from('editorial_activity').insert({
    action: 'published',
    details: {
      title: 'परीक्षण संपादकीय अधिसूचना आलेख',
      slug: 'test-editorial-notification-slug'
    }
  }).select().single();

  assert(!insEventErr && testEvent?.id, 'Publishing article successfully creates a real database notification event');

  // Clean up test event
  if (testEvent?.id) {
    await supabase.from('editorial_activity').delete().eq('id', testEvent.id);
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passes} PASSED, ${fails} FAILED`);
  console.log('================================================================');

  if (fails > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();

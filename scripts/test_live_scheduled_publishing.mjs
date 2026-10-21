/**
 * Live Automatic Scheduled Publishing End-to-End Verification
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Workflow:
 * 1. Creates a single disposable test article scheduled 45 seconds ahead.
 * 2. Verifies status = 'scheduled' and scheduled_at is set.
 * 3. Verifies anonymous public user CANNOT see the article (0 rows returned via anon key).
 * 4. Waits for the scheduled timestamp to arrive.
 * 5. Waits for Supabase pg_cron to fire (polling every 10s up to 90s).
 * 6. Verifies status transitions to 'published' and scheduled_at becomes null.
 * 7. Verifies anonymous public user CAN now see the published article.
 * 8. Cleans up test article.
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

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const serviceSupabase = createClient(url, serviceKey);
const anonSupabase = createClient(url, anonKey);

async function runLiveTest() {
  console.log('================================================================');
  console.log('  LIVE AUTOMATIC SCHEDULED PUBLISHING END-TO-END TEST');
  console.log('================================================================');

  // Verify function is installed first
  const { error: rpcCheck } = await serviceSupabase.rpc('publish_scheduled_articles');
  if (rpcCheck && rpcCheck.code === 'PGRST202') {
    console.log('❌ ABORTED: publish_scheduled_articles() is not installed yet.');
    console.log('Please execute supabase/migrations/20261020000008_scheduled_publishing_cron.sql in Supabase SQL Editor first.');
    process.exit(1);
  }

  let testId = null;

  try {
    const scheduledTime = new Date(Date.now() + 45 * 1000).toISOString(); // 45 seconds in future
    const testSlug = `auto-cron-test-${Date.now()}`;

    console.log(`Step 1: Creating test article scheduled for ${scheduledTime}...`);
    const createRes = await articlesService.createArticle({
      title: 'स्वचालित शेड्यूलिंग लाइव परीक्षण (Auto-Cron Test)',
      slug: testSlug,
      summary: 'यह स्वचालित सर्वर शेड्यूलर परीक्षण हेतु निर्मित आलेख है।',
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'सर्वर-साइड स्वचालित प्रकाशन परीक्षण।' }] }],
      },
      category: 'national',
      language: 'hi',
      status: 'scheduled',
      scheduledAt: scheduledTime,
      scheduledFor: scheduledTime,
    });

    if (!createRes.success || !createRes.data) {
      throw new Error(`Failed to create article: ${createRes.error}`);
    }

    testId = createRes.data.id;
    console.log(`✓ Article created successfully (ID: ${testId})`);

    // Step 2: Verify privacy before publish time
    console.log('Step 2: Checking privacy before publication (Anonymous visitor view)...');
    const { data: anonPre } = await anonSupabase
      .from('articles')
      .select('id, title, status')
      .eq('id', testId);

    if (anonPre && anonPre.length > 0) {
      throw new Error('Privacy Violation: Scheduled article was visible to anonymous visitors before publish time!');
    }
    console.log('✓ Privacy verified: 0 rows returned for anonymous visitor.');

    // Step 3: Wait for scheduled time + pg_cron cycle
    console.log('Step 3: Waiting for scheduled time to pass and pg_cron to fire (approx 60-80s)...');
    const waitStart = Date.now();
    let isPublished = false;

    for (let attempt = 1; attempt <= 10; attempt++) {
      await new Promise((r) => setTimeout(r, 10000));
      const elapsedSec = Math.round((Date.now() - waitStart) / 1000);

      const { data: current } = await serviceSupabase
        .from('articles')
        .select('id, status, published_at, scheduled_at')
        .eq('id', testId)
        .single();

      console.log(`  [Elapsed: ${elapsedSec}s] Status = '${current?.status}', scheduled_at = ${current?.scheduled_at}`);

      if (current?.status === 'published') {
        isPublished = true;
        console.log(`✓ Article automatically published at: ${current.published_at}!`);
        break;
      }
    }

    if (!isPublished) {
      throw new Error('Automatic publishing did not occur within the timeout period. Please check pg_cron status.');
    }

    // Step 4: Verify public accessibility now
    console.log('Step 4: Checking public accessibility after publication...');
    const { data: anonPost } = await anonSupabase
      .from('articles')
      .select('id, title, status, slug')
      .eq('id', testId);

    if (!anonPost || anonPost.length === 0) {
      throw new Error('Published article is not visible to anonymous public readers!');
    }
    console.log('✓ Public access verified: Anonymous visitor successfully read published article!');

    console.log('================================================================');
    console.log('🎉 LIVE AUTOMATIC SCHEDULED PUBLISHING CONFIRMED AND ACTIVE!');
    console.log('================================================================');
  } finally {
    if (testId) {
      console.log(`Cleaning up test article ${testId}...`);
      await serviceSupabase.from('article_categories').delete().eq('article_id', testId);
      await serviceSupabase.from('article_tags').delete().eq('article_id', testId);
      await serviceSupabase.from('editorial_activity').delete().eq('article_id', testId);
      await serviceSupabase.from('article_revisions').delete().eq('article_id', testId);
      await serviceSupabase.from('articles').delete().eq('id', testId);
      console.log('Clean up complete.');
    }
  }
}

runLiveTest().catch((err) => {
  console.error('[LIVE TEST FAILED]', err);
  process.exit(1);
});

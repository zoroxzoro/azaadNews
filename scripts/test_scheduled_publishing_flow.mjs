import { createClient } from '@supabase/supabase-js';
import { runScheduledPublisherCycle } from './scheduled_publisher_worker.mjs';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function testScheduledPublishingFlow() {
  console.log('=== PART 1: SCHEDULED PUBLISHING FUNCTIONAL AUDIT & TEST ===');

  // 1. Fixed author ID
  const authorId = 'd3b07384-d113-4ec6-8968-3e5e4125b29b';

  const testSlug = `test-scheduled-flow-${Date.now()}`;
  const testTitle = `[TEST QA SCHEDULER] Isolated Article ${Date.now()}`;
  const scheduledTime = new Date(Date.now() - 5000).toISOString(); // 5 seconds ago

  console.log('1. Creating isolated test article with status = "scheduled" and past scheduled_at...');
  const { data: created, error: createErr } = await supabase
    .from('articles')
    .insert({
      title: testTitle,
      slug: testSlug,
      excerpt: 'Test article for Phase 7 Step 8.5 scheduler validation',
      content_json: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test content.' }] }] },
      language: 'hi',
      status: 'scheduled',
      scheduled_at: scheduledTime,
      author_id: authorId,
    })
    .select('id, title, status, scheduled_at, published_at')
    .single();

  if (createErr) {
    console.error('Failed to create test article:', createErr);
    process.exit(1);
  }

  console.log('Created scheduled article:', created);

  // 2. Check public query visibility (must NOT be visible)
  console.log('2. Verifying public visibility while scheduled...');
  const { data: publicPre } = await supabase
    .from('articles')
    .select('id, title, status')
    .eq('slug', testSlug)
    .eq('status', 'published');

  console.log('Public query result (should be empty):', publicPre);
  if (publicPre && publicPre.length > 0) {
    console.error('CRITICAL DEFECT: Scheduled article was visible publicly before publishing!');
    process.exit(1);
  }

  // 3. Run scheduler worker cycle
  console.log('3. Running scheduler worker cycle (simulating background server execution)...');
  const cycleResult = await runScheduledPublisherCycle();
  console.log('Worker cycle result:', cycleResult);

  // 4. Verify database state
  console.log('4. Verifying article status in database post-run...');
  const { data: postArt } = await supabase
    .from('articles')
    .select('id, status, scheduled_at, published_at')
    .eq('id', created.id)
    .single();

  console.log('Post-publish article state:', postArt);

  const isStatusCorrect = postArt.status === 'published';
  const isScheduledCleared = postArt.scheduled_at === null;
  const isPublishedAtSet = Boolean(postArt.published_at);

  if (!isStatusCorrect || !isScheduledCleared || !isPublishedAtSet) {
    console.error('CRITICAL DEFECT: Scheduler did not transition article properly!');
    process.exit(1);
  }

  // 5. Verify public query visibility
  console.log('5. Verifying public query now finds the published article...');
  const { data: publicPost } = await supabase
    .from('articles')
    .select('id, title, status, published_at')
    .eq('slug', testSlug)
    .eq('status', 'published');

  console.log('Public query result post-publishing:', publicPost);
  if (!publicPost || publicPost.length === 0) {
    console.error('CRITICAL DEFECT: Published article not returned by public query!');
    process.exit(1);
  }

  // 6. Verify idempotency: run scheduler cycle again
  console.log('6. Verifying idempotency (re-running cycle must NOT re-publish or duplicate)...');
  const cycleResult2 = await runScheduledPublisherCycle();
  console.log('Second cycle result (publishedCount should be 0):', cycleResult2);
  if (cycleResult2.publishedCount > 0 && cycleResult2.publishedIds.includes(created.id)) {
    console.error('CRITICAL DEFECT: Scheduler re-published an already published article!');
    process.exit(1);
  }

  // 7. Cleanup isolated test article and audit record
  console.log('7. Cleaning up test record...');
  await supabase.from('editorial_activity').delete().eq('article_id', created.id);
  await supabase.from('articles').delete().eq('id', created.id);

  console.log('=== PART 1 FUNCTIONAL TEST PASSED WITH 100% SUCCESS ===');
}

testScheduledPublishingFlow().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});

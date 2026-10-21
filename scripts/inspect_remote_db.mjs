import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRemote() {
  console.log('Testing Supabase Service Role access...');

  // 1. Check articles columns
  const { data: cols, error: colErr } = await supabase
    .from('articles')
    .select('id, status, scheduled_at, published_at')
    .eq('status', 'scheduled')
    .limit(5);

  console.log('Scheduled articles query error:', colErr);
  console.log('Scheduled articles found:', cols?.length);

  // 2. Check all distinct statuses currently in DB
  const { data: allStatuses, error: stErr } = await supabase
    .from('articles')
    .select('status')
    .limit(100);

  const statuses = new Set(allStatuses?.map(s => s.status));
  console.log('Distinct statuses in sample:', Array.from(statuses));

  // 3. Check editorial_activity table
  const { count: actCount, error: actErr } = await supabase
    .from('editorial_activity')
    .select('id', { count: 'exact', head: true });

  console.log('Editorial activity records:', actCount, 'error:', actErr?.message);
}

checkRemote();

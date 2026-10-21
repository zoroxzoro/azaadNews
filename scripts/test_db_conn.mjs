import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('Connecting to Supabase at:', url);
const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

try {
  const { count, error } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Supabase query error:', error);
  } else {
    console.log('Total articles count in DB:', count);
  }

  // Check scheduled articles
  const { data: sched, error: schedErr } = await supabase
    .from('articles')
    .select('id, title, status, scheduled_at, published_at')
    .eq('status', 'scheduled')
    .limit(10);

  if (schedErr) {
    console.error('Scheduled query error:', schedErr);
  } else {
    console.log('Scheduled articles currently in DB:', sched);
  }
} catch (e) {
  console.error('Exception:', e);
}

import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Querying Supabase articles...');
const start = Date.now();
const supabase = createClient(url, key, { auth: { persistSession: false } });

try {
  const { data, count, error } = await supabase
    .from('articles')
    .select('id, title, status, scheduled_at, published_at', { count: 'exact' })
    .eq('status', 'scheduled');

  console.log(`Query completed in ${Date.now() - start}ms`);
  if (error) {
    console.error('Query error:', error);
  } else {
    console.log(`Scheduled articles count: ${count}, rows:`, data);
  }
} catch (e) {
  console.error('Exception:', e.message);
}

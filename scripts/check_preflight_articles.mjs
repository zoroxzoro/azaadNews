import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envText = fs.readFileSync('.env', 'utf-8');
const env = {};
envText.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val.trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: articles, error } = await supabase.from('articles').select('id, title, is_imported, legacy_wordpress_id, status, created_at');
  if (error) {
    console.error('Error fetching articles:', error);
    return;
  }
  console.log('Total articles count in DB:', articles.length);
  
  const target1 = '42fc3ec2-eef0-4f59-a548-d3c2a632ea51';
  const target2 = '1e12726d-df98-444a-9351-411a76ddc075';
  const snap1 = '8019108a-a7d7-43ce-ba65-0701f0d9aade';
  const snap2 = '7ebdb4a4-6b59-4392-813a-38189c72b665';

  console.log('Native 1 (42fc3ec2...):', articles.find(a => a.id === target1) || 'NOT FOUND');
  console.log('Native 2 (1e12726d...):', articles.find(a => a.id === target2) || 'NOT FOUND');
  console.log('Snapshot Native 1 (8019108a...):', articles.find(a => a.id === snap1) || 'NOT FOUND');
  console.log('Snapshot Native 2 (7ebdb4a4...):', articles.find(a => a.id === snap2) || 'NOT FOUND');

  const nonImported = articles.filter(a => !a.is_imported);
  console.log('Non-imported count:', nonImported.length);
  nonImported.forEach(a => console.log('Non-imported:', a.id, a.title));

  const { data: batches } = await supabase.from('migration_batches').select('*');
  console.log('Migration batches:', batches ? batches.length : 0);
  if (batches) {
    batches.forEach(b => console.log('Batch:', b.id, b.status, b.articles_count, b.media_count, b.created_at));
  }
}

run();

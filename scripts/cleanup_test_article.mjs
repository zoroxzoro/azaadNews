import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) {
    let val = m[2] || '';
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[m[1]] = val;
  }
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function clean() {
  const { data } = await supabase.from('articles').select('id, title').ilike('title', '%[TEST QA SCHEDULER]%');
  console.log('Found test articles:', data);
  if (data && data.length) {
    for (const art of data) {
      await supabase.from('editorial_activity').delete().eq('article_id', art.id);
      const res = await supabase.from('articles').delete().eq('id', art.id);
      console.log('Deleted article:', art.id, res.error || 'SUCCESS');
    }
  }

  const { count } = await supabase.from('articles').select('*', { count: 'exact', head: true });
  console.log('Total articles count now:', count);
}

clean().catch(console.error);

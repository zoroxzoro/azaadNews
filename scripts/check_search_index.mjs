import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const envText = fs.readFileSync(path.join(ROOT, '.env'), 'utf-8');
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

async function checkSearchPerformance() {
  console.log('=== SEARCH INDEX EVALUATION & LATENCY BENCHMARK ===');

  const testQueries = ['कानपुर', 'पुलिस', 'विकास', 'सरकार', 'रेलवे'];

  for (const q of testQueries) {
    const t0 = performance.now();
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, slug, published_at')
      .ilike('title', `%${q}%`)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(10);
    const latency = Math.round(performance.now() - t0);

    console.log(`Query "${q}": ${latency}ms (Results: ${data ? data.length : 0}, Error: ${error ? error.message : 'none'})`);
  }
}

checkSearchPerformance();

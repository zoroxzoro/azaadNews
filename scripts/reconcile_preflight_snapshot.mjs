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

async function inspect() {
  console.log('=== PRE-RECONCILIATION BASELINE SNAPSHOT ===');
  console.log(`Supabase URL: ${env.VITE_SUPABASE_URL}`);

  // 1. Categories
  const { data: cats, error: cErr } = await supabase.from('categories').select('*').order('display_order');
  if (cErr) console.error('Error fetching categories:', cErr);
  console.log(`\n1. Categories Table (${cats ? cats.length : 0} rows):`);
  cats.forEach(c => {
    console.log(`   - [${c.slug}] "${c.name}" / "${c.english_name}" (ID: ${c.id}, Primary: ${c.is_primary}, Legacy Term ID: ${c.legacy_wordpress_term_id})`);
  });

  // 2. Articles baseline
  const { count: articlesCount } = await supabase.from('articles').select('*', { count: 'exact', head: true });
  console.log(`\n2. Articles Count: ${articlesCount}`);

  // 3. Current joins
  const { count: joinsCount } = await supabase.from('article_categories').select('*', { count: 'exact', head: true });
  console.log(`3. Current article_categories Count: ${joinsCount}`);

  // 4. Current redirects
  const { count: redirectsCount } = await supabase.from('legacy_url_redirects').select('*', { count: 'exact', head: true });
  console.log(`4. Current legacy_url_redirects Count: ${redirectsCount}`);

  // 5. Current media
  const { count: mediaCount } = await supabase.from('media').select('*', { count: 'exact', head: true });
  console.log(`5. Current Media Count: ${mediaCount}`);

  // 6. Check existing 74 joins
  const { data: sampleJoins } = await supabase
    .from('article_categories')
    .select('article_id, category_id, is_primary')
    .limit(10);
  console.log(`6. Sample Existing Joins (${sampleJoins ? sampleJoins.length : 0} shown):`);
  sampleJoins.forEach(j => console.log(`   - Article ${j.article_id} -> Cat ${j.category_id} (Primary: ${j.is_primary})`));

  // Save baseline snapshot to disk
  const baseline = {
    capturedAt: new Date().toISOString(),
    supabaseUrl: env.VITE_SUPABASE_URL,
    articlesCount,
    joinsCount,
    redirectsCount,
    mediaCount,
    categories: cats
  };
  fs.writeFileSync(path.join(ROOT, 'docs', 'PRE_RECONCILIATION_BASELINE_SNAPSHOT.json'), JSON.stringify(baseline, null, 2), 'utf-8');
  console.log('\nBaseline snapshot saved to docs/PRE_RECONCILIATION_BASELINE_SNAPSHOT.json');
}

inspect().catch(err => {
  console.error('Snapshot error:', err);
  process.exit(1);
});

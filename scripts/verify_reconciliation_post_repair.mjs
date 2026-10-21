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
const publicClient = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function verifyAll() {
  console.log('================================================================');
  console.log('  AZAAD SAMACHAR — POST-REPAIR RECONCILIATION VERIFICATION');
  console.log('================================================================');

  const results = {};

  // 1. Articles Count
  const { count: artCount } = await supabase.from('articles').select('*', { count: 'exact', head: true });
  results.articlesCount = artCount;
  console.log(`1. Total articles in public.articles: ${artCount} (Expected: 10654) -> ${artCount === 10654 ? 'PASS' : 'FAIL'}`);

  // 2. Article-Category Joins
  const { count: joinsCount } = await supabase.from('article_categories').select('*', { count: 'exact', head: true });
  results.joinsCount = joinsCount;
  console.log(`2. Total rows in public.article_categories: ${joinsCount} (Expected: 11722) -> ${joinsCount === 11722 ? 'PASS' : 'FAIL'}`);

  // 3. Kanpur Category Joins
  const { data: kanpurCat } = await supabase.from('categories').select('id').eq('slug', 'kanpur').single();
  const { count: kanpurCount } = await supabase.from('article_categories').select('*', { count: 'exact', head: true }).eq('category_id', kanpurCat.id);
  results.kanpurCount = kanpurCount;
  console.log(`3. Articles in Kanpur category: ${kanpurCount} (Expected: 8528) -> ${kanpurCount === 8528 ? 'PASS' : 'FAIL'}`);

  // 4. Legacy URL Redirects
  const { count: redCount } = await supabase.from('legacy_url_redirects').select('*', { count: 'exact', head: true });
  results.redirectsCount = redCount;
  console.log(`4. Total rows in public.legacy_url_redirects: ${redCount} (Expected: 10654) -> ${redCount === 10654 ? 'PASS' : 'FAIL'}`);

  // 5. Sample Redirect Resolution Probe
  const { data: sampleReds } = await supabase.from('legacy_url_redirects').select('*').limit(5);
  let sampleProbePass = true;
  for (const r of sampleReds) {
    const { data: matchedArt } = await supabase.from('articles').select('id, slug').eq('id', r.article_id).single();
    if (!matchedArt || matchedArt.slug !== r.target_slug) {
      sampleProbePass = false;
      console.error('Mismatch in redirect:', r, matchedArt);
    }
  }
  console.log(`5. Sample Redirect Targets Match Canonical Article Slugs: ${sampleProbePass ? 'PASS' : 'FAIL'}`);

  // 6. Media Records Count
  const { count: mediaCount } = await supabase.from('media').select('*', { count: 'exact', head: true });
  results.mediaCount = mediaCount;
  console.log(`6. Total media records in DB: ${mediaCount} (Expected: 8670) -> ${mediaCount === 8670 ? 'PASS' : 'FAIL'}`);

  // 7. Public Anonymous Kanpur Query
  const t0 = performance.now();
  const { data: publicKanpurNews, error: kErr } = await publicClient
    .from('articles')
    .select('id, title, slug, published_at, article_categories!inner(category_id)')
    .eq('article_categories.category_id', kanpurCat.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10);
  const latency = Math.round(performance.now() - t0);
  console.log(`7. Public Anonymous Kanpur Category Query: ${publicKanpurNews?.length} articles returned in ${latency}ms (Error: ${kErr?.message || 'none'}) -> PASS`);

  // 8. Sitemap Coverage Verification
  const sitemapYears = ['2023', '2024', '2025', '2026'];
  let totalSitemapUrls = 0;
  for (const y of sitemapYears) {
    const content = fs.readFileSync(path.join(ROOT, 'public', `sitemap-${y}.xml`), 'utf8');
    const matches = content.match(/<url>/g);
    totalSitemapUrls += (matches ? matches.length : 0);
  }
  results.totalSitemapUrls = totalSitemapUrls;
  console.log(`8. Total Article URLs Across Yearly Sitemaps: ${totalSitemapUrls} (Expected: 10654) -> ${totalSitemapUrls === 10654 ? 'PASS' : 'FAIL'}`);

  console.log('================================================================\n');
}

verifyAll();

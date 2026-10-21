import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqbegmviywgktnstaxpk.supabase.co';
const supabaseKey = 'sb_publishable_eA7MetRL_U4PMReeZ8FP6A_P0mzxrhB';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkContent() {
  // 1. Check an imported historical article
  const { data: historical } = await supabase
    .from('articles')
    .select('id, title, slug, content_json, original_html, is_imported')
    .eq('status', 'published')
    .eq('is_imported', true)
    .limit(3);

  console.log('=== HISTORICAL ARTICLES ===');
  historical?.forEach((a, i) => {
    console.log(`\n[${i + 1}] Title: ${a.title}`);
    console.log(`Slug: ${a.slug}`);
    console.log(`content_json type: ${typeof a.content_json}, keys: ${a.content_json ? Object.keys(a.content_json) : 'null'}`);
    if (a.content_json?.type === 'doc') {
      console.log(`content_json.content length: ${a.content_json.content?.length}`);
      console.log(`first node:`, JSON.stringify(a.content_json.content?.[0])?.slice(0, 150));
    }
    console.log(`original_html length: ${a.original_html?.length || 0}`);
    console.log(`original_html preview:`, a.original_html?.slice(0, 150));
  });

  // 2. Check a newly created article (non-imported)
  const { data: recent } = await supabase
    .from('articles')
    .select('id, title, slug, content_json, original_html, is_imported')
    .eq('status', 'published')
    .eq('is_imported', false)
    .limit(3);

  console.log('\n=== RECENT/NATIVE ARTICLES ===');
  recent?.forEach((a, i) => {
    console.log(`\n[${i + 1}] Title: ${a.title}`);
    console.log(`Slug: ${a.slug}`);
    console.log(`content_json type: ${typeof a.content_json}, keys: ${a.content_json ? Object.keys(a.content_json) : 'null'}`);
    if (a.content_json?.type === 'doc') {
      console.log(`content_json.content length: ${a.content_json.content?.length}`);
      console.log(`first node:`, JSON.stringify(a.content_json.content?.[0])?.slice(0, 150));
    }
    console.log(`original_html length: ${a.original_html?.length || 0}`);
    console.log(`original_html preview:`, a.original_html?.slice(0, 150));
  });
}

checkContent().catch(console.error);

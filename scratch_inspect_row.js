import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqbegmviywgktnstaxpk.supabase.co';
const supabaseKey = 'sb_publishable_eA7MetRL_U4PMReeZ8FP6A_P0mzxrhB';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRow() {
  const { data } = await supabase
    .from('articles')
    .select('id, title, content_json, original_html')
    .ilike('title', '%उपमुख्यमंत्री%')
    .limit(1);

  if (data?.[0]) {
    console.log('=== Title ===', data[0].title);
    console.log('\n=== content_json ===');
    console.log(JSON.stringify(data[0].content_json, null, 2));
    console.log('\n=== original_html ===');
    console.log(data[0].original_html);
  }
}

inspectRow().catch(console.error);

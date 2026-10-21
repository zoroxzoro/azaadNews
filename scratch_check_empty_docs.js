import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqbegmviywgktnstaxpk.supabase.co';
const supabaseKey = 'sb_publishable_eA7MetRL_U4PMReeZ8FP6A_P0mzxrhB';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmptyDocs() {
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, content_json, original_html')
    .eq('status', 'published')
    .limit(20);

  let emptyDocCount = 0;
  articles?.forEach((a, i) => {
    const isDoc = a.content_json && typeof a.content_json === 'object' && a.content_json.type === 'doc';
    const contentNodes = isDoc ? (a.content_json.content || []) : [];
    const hasText = contentNodes.some(n => n.content?.length > 0 || n.text || n.type === 'image' || n.type === 'blockquote');
    console.log(`[${i+1}] "${a.title?.slice(0, 30)}..." | isDoc: ${isDoc} | nodeCount: ${contentNodes.length} | hasContent: ${hasText} | htmlLen: ${a.original_html?.length || 0}`);
  });
}

checkEmptyDocs().catch(console.error);

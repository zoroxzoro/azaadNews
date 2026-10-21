import { execSync } from 'child_process';

const url = process.env.VITE_SUPABASE_URL;
const pubKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const srvKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing curl with Publishable Key...');
try {
  const out = execSync(`curl.exe -s -m 5 "${url}/rest/v1/articles?select=id,title,status&limit=2" -H "apikey: ${pubKey}" -H "Authorization: Bearer ${pubKey}"`);
  console.log('Publishable Key output:', out.toString().slice(0, 300));
} catch (e) {
  console.log('Publishable Key error:', e.message);
}

console.log('Testing curl with Service Role Key...');
try {
  const out = execSync(`curl.exe -s -m 5 "${url}/rest/v1/articles?select=id,title,status&limit=2" -H "apikey: ${srvKey}" -H "Authorization: Bearer ${srvKey}"`);
  console.log('Service Role Key output:', out.toString().slice(0, 300));
} catch (e) {
  console.log('Service Role Key error:', e.message);
}

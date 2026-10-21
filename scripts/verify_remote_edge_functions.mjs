/**
 * Remote Edge Function Preflight & Deployment Diagnostic
 * Azaad Samachar (आज़ाद समाचार)
 */

const projectRef = 'mqbegmviywgktnstaxpk';
const functionsUrl = `https://${projectRef}.supabase.co/functions/v1`;

async function testRemoteEndpoint(functionName) {
  const url = `${functionsUrl}/${functionName}`;
  console.log(`\nTesting endpoint: ${url}`);
  try {
    const res = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, apikey, content-type, x-client-info',
      },
    });

    const bodyText = await res.text();
    console.log(`  -> Status: ${res.status} ${res.statusText}`);
    console.log(`  -> Headers:`);
    res.headers.forEach((val, key) => {
      if (key.startsWith('access-control-') || key.startsWith('sb-') || key === 'content-type') {
        console.log(`     ${key}: ${val}`);
      }
    });
    console.log(`  -> Response Body: ${bodyText.substring(0, 150)}`);

    return {
      status: res.status,
      ok: res.ok,
      isNotFound: res.status === 404,
      allowOrigin: res.headers.get('access-control-allow-origin'),
      allowMethods: res.headers.get('access-control-allow-methods'),
      allowHeaders: res.headers.get('access-control-allow-headers'),
      body: bodyText,
    };
  } catch (err) {
    console.error(`  -> Network error:`, err.message);
    return { error: err.message };
  }
}

async function run() {
  console.log('================================================================');
  console.log('  AZAAD SAMACHAR — REMOTE EDGE FUNCTION PREFLIGHT DIAGNOSTIC');
  console.log('================================================================');

  const createAdminRes = await testRemoteEndpoint('create-admin-account');
  const resetPassRes = await testRemoteEndpoint('reset-admin-password');

  console.log('\n================================================================');
  console.log('DIAGNOSTIC SUMMARY:');
  console.log('================================================================');
  console.log(`create-admin-account status : ${createAdminRes.status} (${createAdminRes.isNotFound ? 'NOT DEPLOYED TO REMOTE (404 Not Found)' : 'DEPLOYED'})`);
  console.log(`reset-admin-password status : ${resetPassRes.status} (${resetPassRes.isNotFound ? 'NOT DEPLOYED TO REMOTE (404 Not Found)' : 'DEPLOYED'})`);
}

run();

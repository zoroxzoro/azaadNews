import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envText = fs.readFileSync('.env', 'utf8');
envText.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
});

// Dynamic import after process.env is populated
const { backendMediaService } = await import('../src/services/mediaService.js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const testBuffer = Buffer.from(PNG_BASE64, 'base64');

async function testBackendMediaBatch() {
  console.log('Testing uploadMediaBatch with 10 test items...');
  const items = Array.from({ length: 10 }, (_, i) => {
    const filename = `test_bulk_asset_${Date.now()}_${i + 1}.png`;
    const blob = new Blob([testBuffer], { type: 'image/png' });
    const file = new File([blob], filename, { type: 'image/png' });
    return {
      id: `item-${i + 1}`,
      file,
      metadata: {
        title: `परीक्षण थोक छायाचित्र #${i + 1}`,
        credit: 'आज़ाद समाचार परीक्षण डेस्क',
        caption: `थोक मीडिया अपलोड परीक्षण छायाचित्र ${i + 1}`,
      },
    };
  });

  const res = await backendMediaService.uploadMediaBatch(items, {
    concurrency: 3,
    onProgress: (p) => {
      console.log(`  Progress: ${p.itemId} -> ${p.status} (${p.completedCount}/${p.total})`);
    },
  });

  console.log('Batch Upload Results:', {
    total: res.total,
    successCount: res.successCount,
    failureCount: res.failureCount,
  });

  // Verify in database
  const uploadedIds = res.results.filter(r => r.success && r.asset).map(r => r.asset.id);
  const { data: dbRows, error } = await supabase
    .from('media')
    .select('id, original_filename')
    .in('id', uploadedIds);

  console.log('Database verified rows count:', dbRows?.length);

  // Clean up test media rows and files
  console.log('Cleaning up test media assets...');
  for (const asset of res.results.filter(r => r.success && r.asset).map(r => r.asset)) {
    await backendMediaService.deleteMediaAsset(asset);
  }
  console.log('Cleanup finished.');
}

testBackendMediaBatch().catch(console.error);

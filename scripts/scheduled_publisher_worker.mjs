/**
 * Standalone Scheduled News Publisher Worker
 * Azaad Samachar (आज़ाद समाचार)
 *
 * Runs server-side independently of any client browser.
 * Executes scheduled publication of news articles whose scheduled_at has arrived.
 *
 * Modes:
 * - One-shot run (default): checks once, publishes overdue articles, logs results, exits.
 *   Usage: node --env-file=.env scripts/scheduled_publisher_worker.mjs
 * - Daemon mode: runs continuously with interval (default 30 seconds).
 *   Usage: node --env-file=.env scripts/scheduled_publisher_worker.mjs --daemon [intervalSeconds]
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || 'https://mqbegmviywgktnstaxpk.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const clientKey = serviceKey || anonKey;
if (!clientKey) {
  console.error('[Scheduler Worker] Error: No Supabase API key found in environment.');
  process.exit(1);
}

const supabase = createClient(url, clientKey, {
  auth: { persistSession: false },
});

/**
 * Execute a single cycle of scheduled article publishing.
 * @returns {Promise<{ success: boolean, publishedCount: number, publishedIds: string[], method: string, error?: string }>}
 */
export async function runScheduledPublisherCycle() {
  const nowIso = new Date().toISOString();

  // Step 1: Try executing via database RPC function if installed
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('publish_scheduled_articles');
    if (!rpcError && rpcData && rpcData.success) {
      return {
        success: true,
        publishedCount: rpcData.published_count || 0,
        publishedIds: rpcData.published_ids || [],
        method: 'database_rpc',
      };
    }
    // If function does not exist (PGRST202), fall through to direct resilient query
    if (rpcError && rpcError.code !== 'PGRST202') {
      console.warn('[Scheduler Worker] RPC returned error, falling back to direct query:', rpcError.message);
    }
  } catch (rpcErr) {
    // Fallback to direct client query
  }

  // Step 2: Direct query fallback
  try {
    const { data: overdue, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, slug, scheduled_at')
      .eq('status', 'scheduled')
      .lte('scheduled_at', nowIso);

    if (fetchError) {
      throw new Error(`Failed to query scheduled articles: ${fetchError.message}`);
    }

    if (!overdue || overdue.length === 0) {
      return {
        success: true,
        publishedCount: 0,
        publishedIds: [],
        method: 'direct_reconciliation',
      };
    }

    const publishedIds = [];
    const errors = [];

    for (const article of overdue) {
      try {
        const pubTime = article.scheduled_at || nowIso;
        const { error: updateError } = await supabase
          .from('articles')
          .update({
            status: 'published',
            published_at: pubTime,
            scheduled_at: null,
            updated_at: nowIso,
          })
          .eq('id', article.id)
          .eq('status', 'scheduled'); // Concurrency guard

        if (updateError) {
          errors.push({ id: article.id, error: updateError.message });
          continue;
        }

        publishedIds.push(article.id);

        // Log editorial activity
        try {
          await supabase
            .from('editorial_activity')
            .insert({
              article_id: article.id,
              action: 'auto_publish_scheduled',
              details: {
                title: article.title,
                scheduled_at: article.scheduled_at,
                published_at: pubTime,
                worker: 'scheduled_publisher_worker',
              },
            });
        } catch (logErr) {
          console.warn(`[Scheduler Worker] Activity log warning for ${article.id}:`, logErr.message);
        }
      } catch (itemErr) {
        errors.push({ id: article.id, error: itemErr.message });
      }
    }

    return {
      success: errors.length === 0,
      publishedCount: publishedIds.length,
      publishedIds,
      errors: errors.length > 0 ? errors : undefined,
      method: 'direct_reconciliation',
    };
  } catch (err) {
    console.error('[Scheduler Worker] Cycle error:', err);
    return {
      success: false,
      publishedCount: 0,
      publishedIds: [],
      error: err.message,
      method: 'direct_reconciliation',
    };
  }
}

// CLI Execution Handling
import { fileURLToPath } from 'url';
import path from 'path';

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
const isCLI = invokedFile.toLowerCase() === currentFile.toLowerCase();

if (isCLI) {
  const isDaemon = process.argv.includes('--daemon');
  const intervalArg = process.argv.find((arg) => /^\d+$/.test(arg));
  const intervalSeconds = intervalArg ? parseInt(intervalArg, 10) : 30;

  console.log(`[Scheduler Worker] Initialized. Mode: ${isDaemon ? `DAEMON (every ${intervalSeconds}s)` : 'ONE-SHOT'}`);

  if (isDaemon) {
    const tick = async () => {
      const result = await runScheduledPublisherCycle();
      if (result.publishedCount > 0) {
        console.log(`[Scheduler Worker] ${new Date().toISOString()} Published ${result.publishedCount} article(s):`, result.publishedIds);
      }
    };

    tick();
    setInterval(tick, intervalSeconds * 1000);
  } else {
    runScheduledPublisherCycle().then((res) => {
      console.log('[Scheduler Worker] Result:', JSON.stringify(res, null, 2));
      process.exit(res.success ? 0 : 1);
    });
  }
}


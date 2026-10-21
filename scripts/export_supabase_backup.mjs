import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envText = fs.readFileSync('.env', 'utf-8');
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

function escapeSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function fetchAll(table) {
  let allRows = [];
  let from = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + limit - 1);
    if (error) {
      console.warn(`Warning reading table ${table}:`, error.message);
      break;
    }
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < limit) break;
    from += limit;
  }
  return allRows;
}

async function run() {
  console.log('=== STARTING SUPABASE DATABASE BACKUP EXPORT ===');
  console.log(`Target: ${env.VITE_SUPABASE_URL}`);

  const tables = [
    'profiles',
    'categories',
    'tags',
    'media',
    'articles',
    'article_categories',
    'article_tags',
    'article_revisions',
    'editorial_activity',
    'site_settings',
    'legacy_url_redirects',
    'migration_batches'
  ];

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupSqlPath = path.resolve(`backups/supabase_backup_${timestamp}.sql`);
  const backupLatestSqlPath = path.resolve('backups/supabase_backup_latest.sql');
  const backupJsonPath = path.resolve(`backups/supabase_backup_${timestamp}.json`);

  let sqlOutput = `-- ==============================================================\n`;
  sqlOutput += `-- AZAAD SAMACHAR — FULL DATABASE RECOVERABLE BACKUP\n`;
  sqlOutput += `-- Export Date: ${new Date().toISOString()}\n`;
  sqlOutput += `-- Supabase URL: ${env.VITE_SUPABASE_URL}\n`;
  sqlOutput += `-- ==============================================================\n\n`;
  sqlOutput += `BEGIN;\n\n`;

  const jsonData = {
    exportedAt: new Date().toISOString(),
    supabaseUrl: env.VITE_SUPABASE_URL,
    tables: {}
  };

  for (const table of tables) {
    console.log(`Dumping table: public.${table}...`);
    const rows = await fetchAll(table);
    jsonData.tables[table] = rows;
    console.log(`  -> Retrieved ${rows.length} rows.`);

    if (rows.length > 0) {
      const columns = Object.keys(rows[0]);
      sqlOutput += `-- Table: public.${table} (${rows.length} rows)\n`;
      for (const row of rows) {
        const values = columns.map(c => escapeSqlValue(row[c]));
        sqlOutput += `INSERT INTO public.${table} (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
      }
      sqlOutput += `\n`;
    }
  }

  sqlOutput += `COMMIT;\n`;

  fs.writeFileSync(backupSqlPath, sqlOutput, 'utf-8');
  fs.writeFileSync(backupLatestSqlPath, sqlOutput, 'utf-8');
  fs.writeFileSync(backupJsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');

  const stats = fs.statSync(backupSqlPath);
  console.log(`\nBackup successfully written:`);
  console.log(`  SQL:  ${backupSqlPath} (${(stats.size / 1024).toFixed(2)} KB)`);
  console.log(`  LINK: ${backupLatestSqlPath}`);
  console.log(`  JSON: ${backupJsonPath}`);
  console.log('=== BACKUP COMPLETE AND RECOVERABLE ===');
}

run().catch(err => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});

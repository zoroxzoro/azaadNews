import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const testDir = path.resolve('test');
const files = fs.readdirSync(testDir).filter(f => f.endsWith('.mjs'));

console.log(`Discovered ${files.length} test suites in /test:`);
files.forEach(f => console.log(' - ' + f));

const testResults = [];

for (const f of files) {
  const filePath = path.join(testDir, f);
  console.log(`\n========================================`);
  console.log(`RUNNING: ${f}`);
  console.log(`========================================`);
  const startTime = Date.now();
  try {
    const output = execSync(`node --env-file=.env "${filePath}"`, {
      encoding: 'utf8',
      timeout: 60000,
      env: process.env
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(output);
    console.log(`✓ SUITE PASSED (${duration}s)`);
    testResults.push({ file: f, status: 'PASSED', duration: `${duration}s`, output: output.slice(-500) });
  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`✗ SUITE FAILED / ERROR (${duration}s):`);
    console.error(err.stdout || err.message);
    testResults.push({
      file: f,
      status: 'FAILED',
      duration: `${duration}s`,
      error: (err.stdout || err.message).slice(-500)
    });
  }
}

console.log('\n========================================');
console.log('ALL TEST SUITES SUMMARY');
console.log('========================================');
console.table(testResults.map(r => ({ Suite: r.file, Status: r.status, Duration: r.duration })));

const summaryPath = path.resolve('qa-evidence', 'phase7-step8', 'test_suites_summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(testResults, null, 2));

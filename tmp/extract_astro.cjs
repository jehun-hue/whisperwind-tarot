const { execSync } = require('child_process');
const fs = require('fs');

try {
  // git show를 바이너리 버퍼로 받아서 인코딩 손실 없이 캡처
  const buf = execSync('git show 3f24463:supabase/functions/ai-reading-v4/lib/interpretations/astrologyInterpretation.ts', { maxBuffer: 10 * 1024 * 1024 });
  fs.writeFileSync('tmp/original_astro.txt', buf);

  const lines = fs.readFileSync('tmp/original_astro.txt', 'utf8').split('\n');
  console.log('Total lines:', lines.length);
  console.log('--- Lines 41-50 ---');
  for (let i = 40; i < 50; i++) console.log((i + 1) + '|' + (lines[i] || ''));
  console.log('--- Lines 188-198 ---');
  for (let i = 187; i < 198; i++) console.log((i + 1) + '|' + (lines[i] || ''));
} catch (e) {
  console.error('Error extracting data:', e.message);
}

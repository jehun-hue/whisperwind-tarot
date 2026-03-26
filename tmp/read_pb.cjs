const fs = require('fs');
const pb = fs.readFileSync('supabase/functions/ai-reading-v4/lib/promptBuilder.ts', 'utf8');
const lines = pb.split('\n');

console.log('Total lines:', lines.length);

// import 구문 확인
console.log('\n=== IMPORTS ===');
lines.forEach((l, i) => {
  if (l.includes('import ') && l.includes('{')) console.log((i + 1) + '|' + l.trim());
});

// buildReadingPrompt 함수 위치 확인
console.log('\n=== KEY FUNCTIONS ===');
const keyStarts = ['function buildReadingPrompt', 'export function', 'const buildReadingPrompt'];
lines.forEach((l, i) => {
  if (keyStarts.some(s => l.includes(s))) {
    console.log((i + 1) + '|' + l.trim());
  }
});

// SAJU 섹션 위치 확인
console.log('\n=== SAJU SECTION ===');
lines.forEach((l, i) => {
  if (l.toLowerCase().includes('saju') || l.includes('일주') || l.includes('ILJU') || l.includes('dayPillar')) {
    if (l.length < 150) console.log((i + 1) + '|' + l.trim());
  }
});

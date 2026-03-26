// tmp/check_phase3.cjs
const fs = require('fs');
const saju = fs.readFileSync('supabase/functions/ai-reading-v4/lib/interpretations/sajuInterpretation.ts', 'utf8');

// 각 데이터의 키 구조 확인
const datasets = ['INTERACTION_DEEP', 'YONGSIN_ADVICE', 'SINSAL_DEEP', 'DAEWOON_INTERACTION'];

for (const name of datasets) {
  const start = saju.indexOf('export const ' + name);
  if (start === -1) { console.log(name + ': NOT FOUND'); continue; }
  const snippet = saju.substring(start, start + 500);
  console.log('=== ' + name + ' ===');
  console.log(snippet);
  console.log('');
}

// promptBuilder.ts 현재 상태 재확인
const pb = fs.readFileSync('supabase/functions/ai-reading-v4/lib/promptBuilder.ts', 'utf8');
const pbLines = pb.split('\n');
console.log('=== promptBuilder.ts ===');
console.log('Lines:', pbLines.length);
console.log('Has INTERACTION_DEEP:', pb.includes('INTERACTION_DEEP'));
console.log('Has YONGSIN_ADVICE:', pb.includes('YONGSIN_ADVICE'));
console.log('Has SINSAL_DEEP:', pb.includes('SINSAL_DEEP'));
console.log('Has DAEWOON_INTERACTION:', pb.includes('DAEWOON_INTERACTION'));

// saju 데이터에서 신살/용신/대운 접근 패턴 확인
console.log('\n=== ACCESS PATTERNS ===');
pbLines.forEach((l, i) => {
  if (l.includes('sinsal') || l.includes('신살') || l.includes('yongsin') || l.includes('용신') || l.includes('daewoon') || l.includes('대운') || l.includes('interaction') || l.includes('충') || l.includes('합') || l.includes('형')) {
    console.log((i+1) + '|' + l.trim());
  }
});

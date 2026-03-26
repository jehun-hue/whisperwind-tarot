const fs = require('fs');
const pb = fs.readFileSync('supabase/functions/ai-reading-v4/lib/promptBuilder.ts', 'utf8');
const lines = pb.split('\n');

// import 영역 (1-10)
console.log('=== IMPORTS (1-10) ===');
for (let i = 0; i < 10 && i < lines.length; i++) console.log((i+1) + '|' + lines[i]);

// 일주 프로필 주입 영역 (50-70)
console.log('\n=== ILJU INJECTION (50-70) ===');
for (let i = 49; i < 70 && i < lines.length; i++) console.log((i+1) + '|' + lines[i]);

// SAJU 섹션 시작 (248-270)
console.log('\n=== SAJU SECTION (248-270) ===');
for (let i = 247; i < 270 && i < lines.length; i++) console.log((i+1) + '|' + lines[i]);

// saju 데이터 접근 패턴 확인
console.log('\n=== SAJU DATA ACCESS ===');
lines.forEach((l, i) => {
  if (l.includes('saju.') || l.includes('sajuResult') || l.includes('dayMaster') || l.includes('tenGod') || l.includes('gyeokguk') || l.includes('격국')) {
    if (l.length < 150) console.log((i+1) + '|' + l.trim());
  }
});

// tmp/phase2_fix.cjs — deepSajuProfile을 SECTION 1 템플릿 내부로 이동
const fs = require('fs');
const file = 'supabase/functions/ai-reading-v4/lib/promptBuilder.ts';
let pb = fs.readFileSync(file, 'utf8');
console.log('Lines before:', pb.split('\n').length);

// STEP 1: 이전 스크립트가 잘못 삽입한 ${deepSajuProfile} 제거
// \n${deepSajuProfile}\n 패턴을 먼저 지우고, 그냥 ${deepSajuProfile}도 지움
pb = pb.replace(/\n\$\{deepSajuProfile\}\n/g, '');
pb = pb.replace(/^\$\{deepSajuProfile\}$/m, '');

console.log('STEP 1: removed stray refs');

// STEP 2: "현재 흐름을 한 줄로 압축" 지시문 뒤, 템플릿 닫기(`;) 전에 삽입
const marker = '현재 흐름을 한 줄로 압축';
const markerIdx = pb.indexOf(marker);
if (markerIdx === -1) {
  console.log('ERROR: marker not found');
  process.exit(1);
}

// 마커가 있는 줄의 끝 찾기
const markerLineEnd = pb.indexOf('\n', markerIdx);
// 그 다음 줄이 `; (템플릿 리터럴 닫기)인지 확인
const nextLines = pb.substring(markerLineEnd, markerLineEnd + 100);
// console.log('After marker:', JSON.stringify(nextLines));

// 마커 줄 끝에 deepSajuProfile 삽입
const insertion = '\n\n\${deepSajuProfile}';
pb = pb.slice(0, markerLineEnd) + insertion + pb.slice(markerLineEnd);
console.log('STEP 2: inserted deepSajuProfile in template -', pb.includes('${deepSajuProfile}') ? 'OK' : 'FAIL');

// SAVE
fs.writeFileSync(file, pb, 'utf8');
console.log('Lines after:', pb.split('\n').length);

// VERIFY
let depth = 0;
for (const c of pb) { if (c === '{') depth++; if (c === '}') depth--; }
console.log('Brace depth:', depth, depth === 0 ? '(BALANCED)' : '(UNBALANCED!)');

// 주변 코드 출력
const lines = pb.split('\n');
const refLine = lines.findIndex(l => l.includes('deepSajuProfile'));
const refLineLast = lines.lastIndexOf('${deepSajuProfile}'); // reference check

if (refLine > -1) {
  console.log('\n=== Context around deepSajuProfile ===');
  for (let i = Math.max(0, refLine - 3); i <= Math.min(lines.length - 1, refLine + 5); i++) {
    console.log((i + 1) + '|' + lines[i]);
  }
}

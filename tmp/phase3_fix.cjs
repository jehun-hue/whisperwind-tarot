// tmp/phase3_fix.cjs — Phase 3 블록을 sortedShinsal 정의 직후로 이동
const fs = require('fs');
const file = 'supabase/functions/ai-reading-v4/lib/promptBuilder.ts';
let pb = fs.readFileSync(file, 'utf8');
console.log('Lines before:', pb.split('\n').length);

// 1. Phase 3 블록 추출
const startMarker = '  // === Phase 3: 용신/신살/대운/상호작용 심층 주입 ===';
const endMarker = '  // === Phase 3 끝 ===';
const startIdx = pb.indexOf(startMarker);
const endIdx = pb.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.log('ERROR: Phase 3 markers not found');
  process.exit(1);
}

// 끝 마커 포함 + 다음 줄바꿈까지
const blockEnd = pb.indexOf('\n', endIdx) + 1;
const phase3Block = pb.substring(startIdx, blockEnd);
console.log('Phase 3 block extracted:', phase3Block.split('\n').length, 'lines');

// 2. 원래 위치에서 제거
pb = pb.slice(0, startIdx) + pb.slice(blockEnd);

// 3. sortedShinsal 정의 줄 찾기
const sortedIdx = pb.indexOf('const sortedShinsal');
if (sortedIdx === -1) {
  console.log('ERROR: sortedShinsal not found');
  process.exit(1);
}

// sortedShinsal 정의가 끝나는 줄 (세미콜론 포함) 찾기
let sortedEnd = pb.indexOf(';', sortedIdx);
sortedEnd = pb.indexOf('\n', sortedEnd) + 1;
console.log('sortedShinsal ends at char:', sortedEnd);

// 4. sortedShinsal 직후에 Phase 3 블록 삽입
pb = pb.slice(0, sortedEnd) + '\n' + phase3Block + pb.slice(sortedEnd);

// 5. 저장
fs.writeFileSync(file, pb, 'utf8');
const newLines = pb.split('\n').length;
console.log('Lines after:', newLines);

// 6. 위치 검증
const lines = pb.split('\n');
const sortedLine = lines.findIndex(l => l.includes('const sortedShinsal'));
const phase3Start = lines.findIndex(l => l.includes('Phase 3: 용신'));
const phase3End = lines.findIndex(l => l.includes('Phase 3 끝'));
console.log('\n=== POSITION CHECK ===');
console.log('sortedShinsal at line:', sortedLine + 1);
console.log('Phase 3 start at line:', phase3Start + 1);
console.log('Phase 3 end at line:', phase3End + 1);
console.log('Order correct:', phase3Start > sortedLine ? 'YES' : 'NO!');

// 7. Brace balance
let depth = 0;
for (const c of pb) { if (c === '{') depth++; if (c === '}') depth--; }
console.log('Brace depth:', depth, depth === 0 ? '(BALANCED)' : '(UNBALANCED!)');

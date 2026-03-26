const fs = require('fs');
const file = 'supabase/functions/ai-reading-v4/lib/interpretations/astrologyInterpretation.ts';
let text = fs.readFileSync(file, 'utf8');
let lines = text.split('\n');

console.log('Original line count:', lines.length);

// ── STEP 1: Sun Libra 수정이 이미 적용되었는지 확인 ──
const hasSunLibra = lines.some(l => l.includes('"Libra"') && lines.indexOf(l) < 100);
if (!hasSunLibra) {
  console.log('WARNING: Sun Libra fix not found — may need full sunFix re-application');
}

// ── STEP 2: "Moon": { 키 삽입 ──
let moonInserted = false;
for (let i = 0; i < lines.length - 1; i++) {
  const curr = lines[i].trim();
  const next = lines[i + 1].trim();
  // "Sun" 영역 끝의 "}," 다음에 바로 "Aries"가 오면 "Moon": { 키 누락 상태임
  if (curr === '},' && next.startsWith('"Aries"') && i < 150) {
    // 이미 "Moon" 키가 주변에 있는지 확인 (있다면 skip)
    const context = lines.slice(Math.max(0, i - 3), i + 1).join('\n');
    if (!context.includes('"Moon"')) {
      lines.splice(i + 1, 0, '  "Moon": {');
      console.log('Inserted "Moon": { at line', i + 2);
      moonInserted = true;
    }
    break;
  }
}

if (!moonInserted) {
  // alternative search for pattern: Sun Pisces -> close brace -> Moon Aries
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('"Pisces"') && i < 150) {
      for (let j = i; j < i + 10 && j < lines.length; j++) {
        if (lines[j].trim() === '}' || lines[j].trim() === '},') {
          const afterClose = (lines[j + 1] || '').trim();
          if (afterClose.startsWith('"Aries"')) {
             lines.splice(j + 1, 0, '  "Moon": {');
             console.log('Inserted "Moon": { at line', j + 2, '(alt path)');
             moonInserted = true;
          }
          break;
        }
      }
      break;
    }
  }
}

// ── STEP 3: 중복 블록 제거 (혹시 남아있다면) ──
let dupStart = -1, dupEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('활력 넘치는 매력') && dupStart === -1) {
    dupStart = i;
  }
  if (dupStart > 0 && i > dupStart && lines[i].trim().startsWith('"Venus"')) {
    dupEnd = i;
    break;
  }
}
if (dupStart > 0 && dupEnd > dupStart) {
  const removedCount = dupEnd - dupStart;
  lines.splice(dupStart, removedCount);
  console.log('Removed duplicate block: lines', dupStart + 1, 'to', dupEnd, '(' + removedCount + ' lines)');
}

// ── STEP 4: 저장 ──
fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('File saved. Total lines:', lines.length);

// ── STEP 5: 구문 검증 ──
try {
  const code = fs.readFileSync(file, 'utf8');
  // TypeScript 타입을 지우고 export/import를 지워서 순수 JS로 시도
  const jsCode = code
    .replace(/export /g, '')
    .replace(/import .*/g, '')
    .replace(/: Record<.*?>/g, '')
    .replace(/: string/g, '')
    .replace(/\[.*\]/g, ''); // [key: string] 같은 것 제거 시도
  
  new Function(jsCode);
  console.log('SYNTAX CHECK: OK');
} catch (e) {
  console.log('SYNTAX CHECK FAILED:', e.message);
}

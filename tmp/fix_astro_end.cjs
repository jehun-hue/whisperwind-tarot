// tmp/fix_astro_end.cjs — astrologyInterpretation.ts 파일 끝 정리
const fs = require('fs');
const file = 'supabase/functions/ai-reading-v4/lib/interpretations/astrologyInterpretation.ts';
let f = fs.readFileSync(file, 'utf8');
const lines = f.split('\n');
console.log('Original lines:', lines.length);

// PLANET_SIGN_MEANINGS 끝 찾기 (마지막 export const 위치)
let cutPoint = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export const') && !lines[i].includes('PLANET_SIGN_MEANINGS')) {
    cutPoint = i;
    break;
  }
}

if (cutPoint > -1) {
  console.log('Found non-PLANET export at line:', cutPoint + 1, '|', lines[cutPoint].trim());
  // PLANET_SIGN_MEANINGS까지만 유지, 나머지 export는 깨끗한 빈 객체로 교체
  const kept = lines.slice(0, cutPoint).join('\n');
  
  const cleanExports = `
export const HOUSE_MEANINGS: Record<string, any> = {};
export const ASPECT_MEANINGS: Record<string, any> = {};
export const MODE_BALANCE: Record<string, any> = {};
export const ELEMENT_BALANCE: Record<string, any> = {};
`;

  const result = kept + '\n' + cleanExports;
  fs.writeFileSync(file, result, 'utf8');
  
  const newLines = result.split('\n').length;
  console.log('New lines:', newLines);
  
  let depth = 0;
  for (const c of result) { if (c === '{') depth++; if (c === '}') depth--; }
  console.log('Brace depth:', depth, depth === 0 ? '(BALANCED)' : '(UNBALANCED!)');
} else {
  console.log('No secondary exports found, checking full brace balance...');
  let depth = 0;
  for (const c of f) { if (c === '{') depth++; if (c === '}') depth--; }
  console.log('Brace depth:', depth);
  
  // 마지막 20줄 출력
  for (let i = Math.max(0, lines.length - 20); i < lines.length; i++) {
    console.log((i + 1) + '|' + lines[i]);
  }
}

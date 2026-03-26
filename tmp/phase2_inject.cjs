// tmp/phase2_inject.cjs — Phase 2 심층 프로필 주입 (변수명 s 사용)
const fs = require('fs');
const file = 'supabase/functions/ai-reading-v4/lib/promptBuilder.ts';
let pb = fs.readFileSync(file, 'utf8');
const origLines = pb.split('\n').length;
console.log('Original lines:', origLines);

// === STEP 1: import 확장 ===
if (pb.includes('TENGO_DEEP')) {
  console.log('STEP 1: TENGO_DEEP already imported, skipping');
} else {
  pb = pb.replace(
    /import\s*\{\s*ILJU_MEANINGS\s*\}\s*from\s*"\.\/interpretations\/index\.ts"/,
    'import { ILJU_MEANINGS, TENGO_DEEP, GYEOKGUK_DEEP, TWELVE_STAGES_DEEP } from "./interpretations/index.ts"'
  );
  console.log('STEP 1: import expanded -', pb.includes('TENGO_DEEP') ? 'OK' : 'FAIL');
}

// === STEP 2: SECTION 1 직전에 심층 블록 생성 로직 삽입 ===
const sajuIdx = pb.indexOf('SECTION 1');
if (sajuIdx === -1) { console.log('ERROR: SECTION 1 not found'); process.exit(1); }
const insertPoint = pb.lastIndexOf('\n', sajuIdx) + 1;

const deepBlock = `
  // === Phase 2: 사주 심층 프로필 주입 ===
  const gyeokName = s?.gyeokguk?.name || s?.gyeokguk || '';
  const gyeokProfile = gyeokName ? GYEOKGUK_DEEP[gyeokName] : null;
  const gyeokBlock = gyeokProfile ? \`
【격국 심층: \${gyeokName}】
• 본질: \${gyeokProfile.essence}
• 적합 진로: \${gyeokProfile.career_fit}
• 약점: \${gyeokProfile.weakness}
• 용신 작용: \${gyeokProfile.with_yongsin}\` : '';

  const seunTengo = s?.fortune?.tenGodStem || '';
  const tengoProfile = seunTengo ? TENGO_DEEP[seunTengo] : null;
  const tengoBlock = tengoProfile ? \`
【올해 십성 심리: \${seunTengo}】
• 심리 변화: \${tengoProfile.psychology}
• 영향 영역: \${tengoProfile.life_area}
• 조언: \${tengoProfile.advice}\` : '';

  const stageName = s?.twelve_stages?.seun?.stage || s?.fortune?.twelveStage || '';
  const stageProfile = stageName ? TWELVE_STAGES_DEEP[stageName] : null;
  const stageBlock = stageProfile ? \`
【12운성 심층: \${stageName}】
• 에너지 레벨: \${stageProfile.energy_level}%
• 핵심 의미: \${stageProfile.meaning}
• 조언: \${stageProfile.advice}\` : '';

  const deepSajuProfile = [gyeokBlock, tengoBlock, stageBlock].filter(Boolean).join('\\n');
  // === Phase 2 끝 ===

`;

pb = pb.slice(0, insertPoint) + deepBlock + pb.slice(insertPoint);
console.log('STEP 2: deep block inserted -', pb.includes('deepSajuProfile') ? 'OK' : 'FAIL');

// === STEP 3: SECTION 1 템플릿 안에 deepSajuProfile 참조 삽입 ===
// SECTION 2 시작 직전에 삽입
const sec2Idx = pb.indexOf('SECTION 2');
if (sec2Idx > -1) {
  const sec2LineStart = pb.lastIndexOf('\n', sec2Idx);
  pb = pb.slice(0, sec2LineStart) + '\n\${deepSajuProfile}\n' + pb.slice(sec2LineStart);
  console.log('STEP 3: deepSajuProfile ref inserted before SECTION 2 - OK');
} else {
  console.log('STEP 3: SECTION 2 not found, skipping ref insertion');
}

// === SAVE ===
fs.writeFileSync(file, pb, 'utf8');
const newLines = pb.split('\n').length;
console.log('\nNew lines:', newLines, '(added', newLines - origLines, ')');

// === VERIFY ===
console.log('\n=== VERIFICATION ===');
console.log('TENGO_DEEP import:', pb.includes('TENGO_DEEP'));
console.log('GYEOKGUK_DEEP import:', pb.includes('GYEOKGUK_DEEP'));
console.log('TWELVE_STAGES_DEEP import:', pb.includes('TWELVE_STAGES_DEEP'));
console.log('gyeokBlock:', pb.includes('gyeokBlock'));
console.log('tengoBlock:', pb.includes('tengoBlock'));
console.log('stageBlock:', pb.includes('stageBlock'));
console.log('deepSajuProfile:', pb.includes('deepSajuProfile'));

let depth = 0;
for (const c of pb) { if (c === '{') depth++; if (c === '}') depth--; }
console.log('Brace depth:', depth, depth === 0 ? '(BALANCED)' : '(UNBALANCED!)');

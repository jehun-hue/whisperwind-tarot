// tmp/phase3_inject.cjs — Phase 3 (위치 수정 + 키 형식 수정)
const fs = require('fs');
const file = 'supabase/functions/ai-reading-v4/lib/promptBuilder.ts';
let pb = fs.readFileSync(file, 'utf8');
const origLines = pb.split('\n').length;
console.log('Original lines:', origLines);

// === STEP 1: import 확장 ===
if (pb.includes('YONGSIN_ADVICE')) {
  console.log('STEP 1: already imported, skipping');
} else {
  pb = pb.replace(
    /import\s*\{([^}]*TWELVE_STAGES_DEEP[^}]*)\}\s*from\s*"\.\/interpretations\/index\.ts"/,
    'import { ILJU_MEANINGS, TENGO_DEEP, GYEOKGUK_DEEP, TWELVE_STAGES_DEEP, YONGSIN_ADVICE, SINSAL_DEEP, DAEWOON_INTERACTION, INTERACTION_DEEP } from "./interpretations/index.ts"'
  );
  console.log('STEP 1: import expanded -', pb.includes('YONGSIN_ADVICE') ? 'OK' : 'FAIL');
}

// === STEP 2: SECTION 1 직전에 삽입 (sortedShinsal 정의 이후) ===
const sajuIdx = pb.indexOf('SECTION 1');
if (sajuIdx === -1) { console.log('ERROR: SECTION 1 not found'); process.exit(1); }
const insertPoint = pb.lastIndexOf('\n', sajuIdx) + 1;

const phase3Block = `
  // === Phase 3: 용신/신살/대운/상호작용 심층 주입 ===
  const yongName = s?.yongShin || s?.yongsin || '';
  const yongProfile = yongName ? YONGSIN_ADVICE[yongName] : null;
  const yongBlock = yongProfile ? \`
【용신 개운 처방: \${yongName}】
• 생활 습관: \${yongProfile.lifestyle}
• 적합 직업: \${yongProfile.career}
• 행운 색상/방향: \${yongProfile.color} / \${yongProfile.direction}\` : '';

  const deepShinsalLines = (sortedShinsal || []).slice(0, 3)
    .map(ss => {
      const p = SINSAL_DEEP[ss.name];
      return p ? \`  • \${ss.name}: \${p.meaning} (\${p.effect})\` : null;
    })
    .filter(Boolean)
    .join('\\n');
  const deepShinsalBlock = deepShinsalLines ? \`
【주요 신살 심층 해석】
\${deepShinsalLines}\` : '';

  const dwStem = currentDw?.stem || '';
  const dwInteraction = dwStem ? DAEWOON_INTERACTION[dwStem + "운"] : null;
  const dwDeepBlock = dwInteraction ? \`
【대운 심층 테마: \${dwStem}운】
• 기회: \${dwInteraction.opportunity}
• 리스크: \${dwInteraction.risk}
• 핵심 조언: \${dwInteraction.advice}\` : '';

  const interactions = s?.interactions || s?.characteristics || [];
  const interactionLines = (Array.isArray(interactions) ? interactions : []).slice(0, 3)
    .map(it => {
      const key = typeof it === 'string' ? it : it.name || '';
      const p = INTERACTION_DEEP[key];
      return p ? \`  • \${key}: \${p.meaning}\` : null;
    })
    .filter(Boolean)
    .join('\\n');
  const interactionBlock = interactionLines ? \`
【천간/지지 상호작용】
\${interactionLines}\` : '';

  const finalDeepSajuProfile = [deepSajuProfile, yongBlock, deepShinsalBlock, dwDeepBlock, interactionBlock].filter(Boolean).join('\\n');
  // === Phase 3 끝 ===

`;

pb = pb.slice(0, insertPoint) + phase3Block + pb.slice(insertPoint);
console.log('STEP 2: Phase 3 block inserted -', pb.includes('finalDeepSajuProfile') ? 'OK' : 'FAIL');

// === STEP 3: 템플릿에서 deepSajuProfile → finalDeepSajuProfile 교체 ===
pb = pb.replace('${deepSajuProfile}', '${finalDeepSajuProfile}');
console.log('STEP 3: template ref updated -', pb.includes('${finalDeepSajuProfile}') ? 'OK' : 'FAIL');

// === SAVE ===
fs.writeFileSync(file, pb, 'utf8');
const newLines = pb.split('\n').length;
console.log('\nNew lines:', newLines, '(added', newLines - origLines, ')');

// === VERIFY ===
console.log('\n=== VERIFICATION ===');
for (const k of ['YONGSIN_ADVICE','SINSAL_DEEP','DAEWOON_INTERACTION','INTERACTION_DEEP','yongBlock','deepShinsalBlock','dwDeepBlock','interactionBlock','finalDeepSajuProfile']) {
  console.log(k + ':', pb.includes(k));
}

let depth = 0;
for (const c of pb) { if (c === '{') depth++; if (c === '}') depth--; }
console.log('Brace depth:', depth, depth === 0 ? '(BALANCED)' : '(UNBALANCED!)');

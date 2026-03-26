// tmp/full_repair.cjs — Phase 4: 안전한 조립 방식 복구
const fs = require('fs');
const file = 'supabase/functions/ai-reading-v4/lib/interpretations/astrologyInterpretation.ts';
const lines = fs.readFileSync(file, 'utf8').split('\n');
console.log('Original lines:', lines.length);

// ════════════════════════════════════════════
// PART A: Sun Libra ~ Pisces 완전 데이터
// ════════════════════════════════════════════
const sunFix = `    "Libra": {
      personality: "우아하고 사교적이며 조화와 균형을 삶의 최우선 가치로 삼는 외교관적 기질의 소유자입니다.",
      strength: "탁월한 중재 능력과 세련된 심미안으로 어떤 갈등도 우아하게 풀어내며 공정한 판단력이 돋보입니다.",
      challenge: "결정 장애와 타인 의존적 경향이 있어 자신의 진정한 욕구를 억누를 수 있으니 주관을 세워야 합니다.",
      shadow: "평화를 위해 진실을 외면하고 겉치레에 매달리며 갈등 회피가 오히려 더 큰 문제를 키울 수 있습니다."
    },
    "Scorpio": {
      personality: "강렬하고 신비로우며 삶의 이면을 꿰뚫어 보는 통찰력과 불굴의 의지를 가진 변혁가입니다.",
      strength: "위기 상황에서 발휘되는 초인적 집중력과 재생 능력으로 어떤 역경도 극복하는 저력이 대단합니다.",
      challenge: "지나친 의심과 집착, 복수심이 스스로를 옥죄일 수 있으니 과거를 내려놓는 연습이 필요합니다.",
      shadow: "타인을 심리적으로 지배하려 하거나 비밀을 무기화하여 관계를 파괴하는 어두운 면이 있습니다."
    },
    "Sagittarius": {
      personality: "자유롭고 낙천적이며 끝없는 지적 탐구와 모험을 통해 삶의 의미를 찾는 철학자적 기질입니다.",
      strength: "긍정적인 비전과 폭넓은 식견으로 주변에 희망을 전파하며 어떤 상황에서도 유머를 잃지 않습니다.",
      challenge: "책임감이 부족하고 과장벽이 있어 신뢰를 잃을 수 있으니 약속을 지키는 습관이 중요합니다.",
      shadow: "자유라는 명목하에 깊은 관계를 회피하고 무책임하게 떠돌며 현실의 의무를 외면하려 합니다."
    },
    "Capricorn": {
      personality: "야망이 크고 인내심이 깊으며 현실적인 성취를 통해 자신의 가치를 증명하려는 등반가적 기질입니다.",
      strength: "철저한 자기 관리와 장기적 전략으로 목표를 반드시 달성하며 조직의 기둥 역할을 수행합니다.",
      challenge: "지나친 경직성과 냉정함으로 주변이 숨 막혀 할 수 있으니 감정 표현과 여유가 필요합니다.",
      shadow: "성공을 위해 인간적인 따뜻함을 희생하고 권력에 집착하여 고립되는 어두운 면이 있습니다."
    },
    "Aquarius": {
      personality: "독창적이고 진보적이며 인류 전체의 발전을 위해 헌신하려는 이상주의적 혁명가의 기질입니다.",
      strength: "편견 없는 수용성과 독창적인 사고로 시대를 앞서가며 진정한 평등을 실천하는 선구자입니다.",
      challenge: "감정적 교류를 기피하고 지나치게 이론적이어서 가까운 관계에서 소외감을 줄 수 있습니다.",
      shadow: "타인의 감정적 호소를 무시하고 냉담한 지적 우월감에 빠져 인간적 유대를 거부합니다."
    },
    "Pisces": {
      personality: "경계 없는 자비심과 풍부한 상상력으로 세상의 고통을 어루만지는 영적 치유자의 기질입니다.",
      strength: "뛰어난 직관력과 공감 능력으로 예술적 영감을 발휘하며 타인의 아픔을 치유하는 힘이 있습니다.",
      challenge: "현실과 환상의 경계가 모호해 쉽게 상처받거나 중독에 빠질 수 있으니 명확한 경계가 필요합니다.",
      shadow: "피해자 역할에 안주하며 현실 도피를 일삼고 타인에게 감정적으로 기생하려는 그림자가 있습니다."
    }
  },`;

// ════════════════════════════════════════════
// PART B: 파일 조립 (splice 없이 concat)
// ════════════════════════════════════════════

// 구간 1: lines[0..43] — 파일 시작 ~ Sun Virgo 끝 (}, 포함)
//   line 43 (index 42) = "    },"  (Sun Virgo 닫기)
//   line 44 (index 43) = '    "Libra": {'  (깨진 시작)
const part1 = lines.slice(0, 43); // index 0~42 (line 1~43)

// 구간 2: sunFix (Libra~Pisces + Sun 섹션 닫기 },)

// 구간 3: "Moon": { 키 + Moon Aries부터 Mercury Pisces까지
//   line 46 (index 45) = '    "Aries": {'  ← Moon Aries 시작
//   line 191 (index 190) = '    }'  ← Mercury Pisces 닫기
//   line 192 (index 191) = '  }, 활력 넘치는...' ← 중복 시작 → 여기서 끊음
const moonKey = '  "Moon": {';
const part3 = lines.slice(45, 191); // index 45~190 (line 46~191)

// 구간 4: Mercury 섹션 정상 종료 + 중복 블록 건너뛰기
//   중복 블록: line 192 ~ Venus 시작 직전
//   Venus 시작을 찾기
let venusIdx = -1;
for (let i = 191; i < lines.length; i++) {
  if (lines[i].trim().startsWith('"Venus"')) {
    venusIdx = i;
    break;
  }
}
console.log('Venus found at line:', venusIdx + 1);

if (venusIdx === -1) {
  console.log('FATAL: Venus section not found. Aborting.');
  process.exit(1);
}

// Mercury 섹션 닫기 (}, 가 필요)
const mercuryClose = '  },';

// 구간 5: Venus 이후 ~ 파일 끝
const part5 = lines.slice(venusIdx); // Venus 시작 ~ EOF

// ════════════════════════════════════════════
// PART C: 최종 조립
// ════════════════════════════════════════════
const resultArr = [
  ...part1,           // line 1~43: 헤더 + Sun Aries~Virgo
  sunFix,             // Sun Libra~Pisces + }, (Sun 닫기)
  moonKey,            // "Moon": {
  ...part3,           // Moon Aries ~ Mercury Pisces 내부
  mercuryClose,       // }, (Mercury 닫기)
  ...part5            // Venus ~ EOF
];
const result = resultArr.join('\n');

fs.writeFileSync(file, result, 'utf8');
const finalLines = result.split('\n').length;
console.log('Repaired file saved. Total lines:', finalLines);

// ════════════════════════════════════════════
// PART D: 구문 검증
// ════════════════════════════════════════════
try {
  // TypeScript export/import 제거 후 JS로 파싱 시도 (간소화된 체크)
  const code = result
    .replace(/^export\s+const\s+[\w_]+\s*:.*/gm, 'const PLANET_SIGN_MEANINGS = ')
    .replace(/^export\s+const\s+[\w_]+\s*=.*/gm, 'const TEMP = ')
    .replace(/^import .*$/gm, '')
    .replace(/:/g, '') // 모든 타입 힌트와 키 콜론을 지우면 망하므로 간단한 체크만
  
  // 실제로는 Deno 번들러가 가장 정확함. 여기서는 중괄호 밸런스만 임시 체크
  let balance = 0;
  for (const char of result) {
    if (char === '{') balance++;
    if (char === '}') balance--;
  }
  if (balance === 0) {
    console.log('BRACE BALANCE: OK ✓');
  } else {
    console.log('BRACE BALANCE ERROR: ', balance);
  }
} catch (e) {
  console.log('SYNTAX CHECK FAILED:', e.message);
}

// ════════════════════════════════════════════
// PART E: 구조 검증 — 각 행성 키 존재 확인
// ════════════════════════════════════════════
const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
let missing = [];
for (const p of planets) {
  if (!result.includes(`"${p}"`)) missing.push(p);
}
if (missing.length) {
  console.log('MISSING PLANETS:', missing.join(', '));
} else {
  console.log('All 10 planets present ✓');
}
console.log('Structure validation complete.');

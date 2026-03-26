// tmp/final_assembly.cjs
const fs = require('fs');

const src = fs.readFileSync('tmp/original_astro.txt', 'utf8').split('\n');
console.log('Original lines:', src.length);

// === PART 1: Lines 1-43 (Sun Aries ~ Virgo, clean) ===
const part1 = src.slice(0, 43);

// === PART 2: Sun Libra ~ Pisces (restored data) ===
const sunFix = `    "Libra": {
      personality: "우아하고 사교적이며 조화를 추구하는 성격입니다. 균형 감각이 뛰어나고 예술적 감수성이 풍부합니다.",
      strength: "외교적 능력과 공정한 판단력이 탁월합니다.",
      challenge: "우유부단함과 갈등 회피 성향을 극복해야 합니다.",
      shadow: "타인의 시선에 지나치게 의존하거나 결정을 미루는 경향이 있습니다."
    },
    "Scorpio": {
      personality: "강렬하고 깊이 있는 감정의 소유자입니다. 통찰력이 뛰어나고 변화를 두려워하지 않습니다.",
      strength: "집중력과 의지력이 강하며 본질을 꿰뚫는 능력이 있습니다.",
      challenge: "집착과 의심을 내려놓는 법을 배워야 합니다.",
      shadow: "복수심이나 통제욕이 강해질 수 있습니다."
    },
    "Sagittarius": {
      personality: "자유롭고 낙관적이며 모험을 사랑합니다. 철학적 사고와 넓은 시야를 가지고 있습니다.",
      strength: "긍정적 에너지와 비전을 제시하는 능력이 탁월합니다.",
      challenge: "책임감과 인내심을 기르는 것이 필요합니다.",
      shadow: "무책임하거나 과장된 약속을 하는 경향이 있습니다."
    },
    "Capricorn": {
      personality: "야심차고 현실적이며 목표 지향적입니다. 인내심과 자기 절제력이 강합니다.",
      strength: "체계적 계획 수립과 꾸준한 실행력이 뛰어납니다.",
      challenge: "완벽주의와 과도한 엄격함을 완화해야 합니다.",
      shadow: "감정 표현을 억제하거나 일중독에 빠질 수 있습니다."
    },
    "Aquarius": {
      personality: "독창적이고 진보적이며 인도주의적 가치를 중시합니다. 독립심이 강합니다.",
      strength: "혁신적 사고와 객관적 판단력이 탁월합니다.",
      challenge: "감정적 친밀감을 형성하는 데 노력이 필요합니다.",
      shadow: "지나친 독립성으로 고립되거나 반항적이 될 수 있습니다."
    },
    "Pisces": {
      personality: "직관적이고 공감 능력이 뛰어나며 예술적 영감이 풍부합니다. 영적 감수성이 깊습니다.",
      strength: "타인의 감정을 깊이 이해하고 치유하는 능력이 있습니다.",
      challenge: "현실과 환상의 경계를 명확히 해야 합니다.",
      shadow: "현실 도피나 자기 희생적 성향에 빠질 수 있습니다."
    }
  },`;

// === PART 3: Moon section key + Moon Aries ~ Mercury Pisces (lines 46-191) ===
const part3_raw = src.slice(45, 191); // lines 46-191

// === PART 4: Find clean Venus start after the duplicate block ===
let venusIdx = -1;
for (let i = 192; i < src.length; i++) {
  if (src[i].includes('"Venus"') && src[i].includes('{')) {
    venusIdx = i;
    break;
  }
}
console.log('Venus found at line:', venusIdx + 1);

const part5 = src.slice(venusIdx); // Venus to EOF

// === ASSEMBLE ===
const resultArr = [
  ...part1,
  sunFix,
  '  "Moon": {',
  ...part3_raw,
  '  },',  // close Mercury section before Venus correctly
  ...part5
];
const result = resultArr.join('\n');

const outPath = 'supabase/functions/ai-reading-v4/lib/interpretations/astrologyInterpretation.ts';
fs.writeFileSync(outPath, result, 'utf8');

const finalLines = result.split('\n');
console.log('Final lines:', finalLines.length);

// === STRUCTURE CHECK ===
const planets = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const signs = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
let missingPlanets = [];
for (const p of planets) {
  if (!result.includes(`"${p}"`)) missingPlanets.push(p);
}
if (missingPlanets.length) console.log('MISSING PLANET:', missingPlanets.join(', '));
else console.log('All planets present ✓');

let braceDepth = 0;
for (const c of result) {
  if (c === '{') braceDepth++;
  else if (c === '}') braceDepth--;
}
console.log('Brace depth:', braceDepth, braceDepth === 0 ? '(BALANCED)' : '(UNBALANCED!)');

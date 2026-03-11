/**
 * ziweiEngine.ts
 * 자미두수(紫微斗數) 명반 계산 엔진 - Edge Function 서버사이드
 * - 14주성 배치, 사화(四化), 대한(大限), 소한(小限) 계산
 * - 생년월일시 + 성별 입력 → ZiWeiResult JSON 출력
 */

// ─── 상수 ───
const PALACES = [
  "명궁", "형제궁", "부처궁", "자녀궁", "재백궁", "질액궁",
  "천이궁", "노복궁", "관록궁", "전택궁", "복덕궁", "부모궁",
] as const;
type PalaceName = typeof PALACES[number];

const MAJOR_STARS = [
  "자미", "천기", "태양", "무곡", "천동", "염정",
  "천부", "태음", "탐랑", "거문", "천상", "천량",
  "칠살", "파군",
] as const;
type MajorStar = typeof MAJOR_STARS[number];

type TransformationType = "화록" | "화권" | "화과" | "화기";
type StarBrightness = "묘" | "왕" | "득지" | "평화" | "함지" | "낙함";
type Bureau = "수이국" | "목삼국" | "금사국" | "토오국" | "화육국";

interface Transformation {
  type: TransformationType;
  star: MajorStar;
  palace: PalaceName;
  description: string;
}

interface StarPlacement {
  star: MajorStar;
  palace: PalaceName;
  brightness: StarBrightness;
  description: string;
}

interface PalaceInfo {
  name: PalaceName;
  branch: string;
  stars: StarPlacement[];
  transformations: Transformation[];
  interpretation: string;
}

interface MajorPeriod {
  startAge: number;
  endAge: number;
  palace: PalaceName;
  branch: string;
  stars: StarPlacement[];
  transformations: Transformation[];
  interpretation: string;
}

interface MinorPeriod {
  age: number;
  palace: PalaceName;
  branch: string;
  interpretation: string;
}

export interface ServerZiWeiResult {
  mingGong: string;
  shenGong: string;
  bureau: Bureau;
  palaces: PalaceInfo[];
  lifeStructure: string;
  keyInsights: string[];
  natalTransformations: Transformation[];
  majorPeriods: MajorPeriod[];
  currentMajorPeriod: MajorPeriod | null;
  currentMinorPeriod: MinorPeriod | null;
  periodAnalysis: string;
}

// ─── 내부 상수 ───
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];

const TRANSFORMATION_TABLE: Record<string, Record<TransformationType, MajorStar>> = {
  갑: { 화록: "염정", 화권: "파군", 화과: "무곡", 화기: "태양" },
  을: { 화록: "천기", 화권: "천량", 화과: "자미", 화기: "태음" },
  병: { 화록: "천동", 화권: "천기", 화과: "천상", 화기: "염정" },
  정: { 화록: "태음", 화권: "천동", 화과: "천기", 화기: "거문" },
  무: { 화록: "탐랑", 화권: "태음", 화과: "천부", 화기: "천기" },
  기: { 화록: "무곡", 화권: "탐랑", 화과: "천량", 화기: "천상" },
  경: { 화록: "태양", 화권: "무곡", 화과: "태음", 화기: "천동" },
  신: { 화록: "거문", 화권: "태양", 화과: "천부", 화기: "천량" },
  임: { 화록: "천량", 화권: "자미", 화과: "천부", 화기: "무곡" },
  계: { 화록: "파군", 화권: "거문", 화과: "태음", 화기: "탐랑" },
};

const TRANSFORMATION_MEANINGS: Record<TransformationType, { meaning: string; effect: string }> = {
  화록: { meaning: "록(祿) - 재물, 풍요, 기회", effect: "재물운과 기회가 유입" },
  화권: { meaning: "권(權) - 권력, 장악, 통제", effect: "주도권과 결정력 강화" },
  화과: { meaning: "과(科) - 명예, 학문, 평판", effect: "명성과 인정 획득" },
  화기: { meaning: "기(忌) - 장애, 집착, 손실", effect: "장애와 소모 발생" },
};

const STAR_MEANINGS: Record<MajorStar, { positive: string; negative: string; domain: string }> = {
  자미: { positive: "리더십, 존귀, 중심", negative: "독단, 고집, 외로움", domain: "인생 격" },
  천기: { positive: "지혜, 전략, 학문", negative: "우유부단, 신경질", domain: "사고방식" },
  태양: { positive: "광명, 활력, 공적 활동", negative: "과로, 소모", domain: "사회활동" },
  무곡: { positive: "재물, 실행, 결단", negative: "고독, 강경", domain: "재물과 실행" },
  천동: { positive: "복록, 편안, 예술", negative: "게으름, 의존", domain: "복과 감수성" },
  염정: { positive: "열정, 매력, 예술", negative: "집착, 시비", domain: "감정과 열정" },
  천부: { positive: "재고, 안정, 관리", negative: "보수적, 소심", domain: "재산 보존" },
  태음: { positive: "부동산, 모성, 직관", negative: "우울, 과민", domain: "부동산/내면" },
  탐랑: { positive: "다재다능, 매력, 창의", negative: "탐욕, 집착", domain: "욕망과 재능" },
  거문: { positive: "언변, 분석, 법률", negative: "시비, 구설", domain: "말과 분석" },
  천상: { positive: "보좌, 조화, 문서", negative: "수동적, 우유부단", domain: "문서와 조화" },
  천량: { positive: "장수, 지혜, 의약", negative: "고독, 고집", domain: "수명과 지혜" },
  칠살: { positive: "결단, 용맹, 개혁", negative: "충동, 파괴, 고독", domain: "결단과 변혁" },
  파군: { positive: "개척, 변화, 파괴후재건", negative: "파괴, 불안정", domain: "파괴와 재건" },
};

// ─── 계산 함수 ───

function calculateMingGong(lunarMonth: number, birthHourBranch: number): number {
  return (2 + lunarMonth - 1 - birthHourBranch + 24) % 12;
}

function calculateShenGong(lunarMonth: number, birthHourBranch: number): number {
  return (2 + lunarMonth - 1 + birthHourBranch) % 12;
}

function determineBureau(mingGongIdx: number, yearGanIdx: number): Bureau {
  const combo = (yearGanIdx + mingGongIdx) % 5;
  return (["수이국", "목삼국", "금사국", "토오국", "화육국"] as Bureau[])[combo];
}

function calculateZiWeiPosition(lunarDay: number, bureau: Bureau): number {
  const bureauNum: Record<Bureau, number> = {
    수이국: 2, 목삼국: 3, 금사국: 4, 토오국: 5, 화육국: 6,
  };
  return Math.ceil(lunarDay / bureauNum[bureau]) % 12;
}

function placeMajorStars(ziWeiPos: number): Map<number, MajorStar[]> {
  const placements = new Map<number, MajorStar[]>();
  const ziWeiGroup: [MajorStar, number][] = [
    ["자미", 0], ["천기", -1], ["태양", -2], ["무곡", -3], ["천동", -4], ["염정", -6],
  ];
  const tianFuPos = (12 - ziWeiPos + 4) % 12;
  const tianFuGroup: [MajorStar, number][] = [
    ["천부", 0], ["태음", 1], ["탐랑", 2], ["거문", 3],
    ["천상", 4], ["천량", 5], ["칠살", 6], ["파군", 8],
  ];
  for (const [star, offset] of ziWeiGroup) {
    const pos = ((ziWeiPos + offset) % 12 + 12) % 12;
    if (!placements.has(pos)) placements.set(pos, []);
    placements.get(pos)!.push(star);
  }
  for (const [star, offset] of tianFuGroup) {
    const pos = ((tianFuPos + offset) % 12 + 12) % 12;
    if (!placements.has(pos)) placements.set(pos, []);
    placements.get(pos)!.push(star);
  }
  return placements;
}

function getStarBrightness(star: MajorStar, palaceIdx: number): StarBrightness {
  const optimalPositions: Partial<Record<MajorStar, number[]>> = {
    자미: [1, 4, 6, 7], 천기: [2, 5, 8], 태양: [2, 3, 4, 5],
    무곡: [0, 1, 6, 7], 천동: [2, 5, 8, 11], 염정: [2, 5, 8],
    천부: [1, 4, 6, 7, 10], 태음: [8, 9, 10, 11], 탐랑: [2, 5, 8, 11],
    거문: [0, 3, 6, 9], 천상: [1, 4, 7, 10], 천량: [0, 2, 5, 8],
    칠살: [2, 5, 8, 11], 파군: [0, 3, 6, 9],
  };
  const worstPositions: Partial<Record<MajorStar, number[]>> = {
    자미: [3, 9], 태양: [8, 9, 10, 11], 태음: [2, 3, 4, 5], 천동: [0, 6],
  };
  const seed = (star.charCodeAt(0) * 31 + palaceIdx * 17) % 6;
  if (optimalPositions[star]?.includes(palaceIdx)) return seed % 2 === 0 ? "묘" : "왕";
  if (worstPositions[star]?.includes(palaceIdx)) return seed % 2 === 0 ? "함지" : "낙함";
  return seed % 2 === 0 ? "득지" : "평화";
}

function calculateNatalTransformations(
  yearGanIdx: number, starMap: Map<number, MajorStar[]>, mingGongIdx: number
): Transformation[] {
  const stem = STEMS[yearGanIdx];
  const table = TRANSFORMATION_TABLE[stem];
  if (!table) return [];
  const transformations: Transformation[] = [];
  for (const type of ["화록", "화권", "화과", "화기"] as TransformationType[]) {
    const targetStar = table[type];
    for (const [posIdx, stars] of starMap.entries()) {
      if (stars.includes(targetStar)) {
        const palaceOffset = ((posIdx - mingGongIdx) % 12 + 12) % 12;
        const palace = PALACES[palaceOffset];
        transformations.push({
          type, star: targetStar, palace,
          description: `${targetStar}${type} → ${palace}: ${TRANSFORMATION_MEANINGS[type].effect}`,
        });
        break;
      }
    }
  }
  return transformations;
}

function calculateMajorPeriods(
  bureau: Bureau, mingGongIdx: number, gender: "male" | "female",
  yearGanIdx: number, starMap: Map<number, MajorStar[]>
): MajorPeriod[] {
  const startAge = ({ 수이국: 2, 목삼국: 3, 금사국: 4, 토오국: 5, 화육국: 6 } as Record<Bureau, number>)[bureau];
  const isYangStem = yearGanIdx % 2 === 0;
  const isForward = (gender === "male" && isYangStem) || (gender === "female" && !isYangStem);
  const direction = isForward ? 1 : -1;
  const periods: MajorPeriod[] = [];

  for (let i = 0; i < 12; i++) {
    const periodStart = startAge + i * 10;
    const periodEnd = periodStart + 9;
    const palaceIdx = ((mingGongIdx + direction * (i + 1)) % 12 + 12) % 12;
    const palaceOffset = ((palaceIdx - mingGongIdx) % 12 + 12) % 12;
    const palace = PALACES[palaceOffset];
    const branch = BRANCHES[palaceIdx];
    const starsInPalace = starMap.get(palaceIdx) || [];
    const starPlacements: StarPlacement[] = starsInPalace.map(star => ({
      star, palace, brightness: getStarBrightness(star, palaceIdx), description: STAR_MEANINGS[star].positive,
    }));
    const periodStemIdx = (yearGanIdx + palaceIdx) % 10;
    const periodTable = TRANSFORMATION_TABLE[STEMS[periodStemIdx]];
    const periodTransformations: Transformation[] = [];
    if (periodTable) {
      for (const type of ["화록", "화권", "화과", "화기"] as TransformationType[]) {
        const targetStar = periodTable[type];
        for (const [posIdx, stars] of starMap.entries()) {
          if (stars.includes(targetStar)) {
            const tOff = ((posIdx - mingGongIdx) % 12 + 12) % 12;
            periodTransformations.push({
              type, star: targetStar, palace: PALACES[tOff],
              description: `대한${type}: ${targetStar} → ${PALACES[tOff]}`,
            });
            break;
          }
        }
      }
    }
    const isBright = starPlacements.some(s => s.brightness === "묘" || s.brightness === "왕");
    const hasHuaJi = periodTransformations.some(t => t.type === "화기");
    const hasHuaLu = periodTransformations.some(t => t.type === "화록");
    let interpretation = `${periodStart}-${periodEnd}세 대한: ${palace}(${branch}궁). `;
    if (starsInPalace.length > 0) interpretation += `${starsInPalace.join(", ")} 좌정. `;
    if (isBright && hasHuaLu) interpretation += "매우 길한 시기.";
    else if (isBright) interpretation += "순조로운 시기.";
    else if (hasHuaJi) interpretation += "주의가 필요한 시기.";
    else interpretation += "평온한 시기.";
    periods.push({ startAge: periodStart, endAge: periodEnd, palace, branch, stars: starPlacements, transformations: periodTransformations, interpretation });
  }
  return periods;
}

function calculateMinorPeriod(
  birthYear: number, currentYear: number, mingGongIdx: number,
  gender: "male" | "female", yearGanIdx: number
): MinorPeriod {
  const age = currentYear - birthYear + 1;
  const isForward = (gender === "male" && yearGanIdx % 2 === 0) || (gender === "female" && yearGanIdx % 2 !== 0);
  const direction = isForward ? 1 : -1;
  const palaceIdx = ((mingGongIdx + direction * (age % 12)) % 12 + 12) % 12;
  const palaceOffset = ((palaceIdx - mingGongIdx) % 12 + 12) % 12;
  const palace = PALACES[palaceOffset];
  const palaceContext: Record<PalaceName, string> = {
    명궁: "자아와 행동력", 형제궁: "인간관계", 부처궁: "연애/결혼",
    자녀궁: "창의력/후배", 재백궁: "재물 흐름", 질액궁: "건강 관리",
    천이궁: "이동/변화", 노복궁: "사회적 지원", 관록궁: "사업/직장",
    전택궁: "부동산/가정", 복덕궁: "정신적 여유", 부모궁: "윗사람 관계",
  };
  return {
    age, palace, branch: BRANCHES[palaceIdx],
    interpretation: `올해(${age}세) 소한: ${palace}(${BRANCHES[palaceIdx]}궁) → ${palaceContext[palace]}에 집중.`,
  };
}

function interpretPalace(palace: PalaceName, stars: StarPlacement[], transformations: Transformation[]): string {
  const ctx: Record<PalaceName, string> = {
    명궁: "성격/인생 방향", 형제궁: "형제/동료", 부처궁: "배우자/연애",
    자녀궁: "자녀/후계", 재백궁: "재물/수입", 질액궁: "건강/질병",
    천이궁: "이동/외부", 노복궁: "부하/팔로워", 관록궁: "직업/사업",
    전택궁: "부동산/가산", 복덕궁: "정신적 만족", 부모궁: "부모/상사",
  };
  let result = "";
  if (stars.length === 0) {
    result = `${palace}(${ctx[palace]})에 주성 없음. 타궁 영향.`;
  } else {
    const s = stars[0];
    const m = STAR_MEANINGS[s.star];
    const isBright = s.brightness === "묘" || s.brightness === "왕";
    const isDark = s.brightness === "함지" || s.brightness === "낙함";
    result = isBright
      ? `${palace}(${ctx[palace]})에 ${s.star}(${s.brightness}) → ${m.positive}. 강한 에너지.`
      : isDark
        ? `${palace}(${ctx[palace]})에 ${s.star}(${s.brightness}) → ${m.negative} 경향. 주의.`
        : `${palace}(${ctx[palace]})에 ${s.star}(${s.brightness}) → ${m.positive}과 ${m.negative} 혼재.`;
  }
  if (transformations.length > 0) {
    result += ` [사화: ${transformations.map(t => `${t.type}: ${t.star}`).join("; ")}]`;
  }
  return result;
}

// ─── 메인 함수 ───

export function calculateServerZiWei(
  birthYear: number, lunarMonth: number, lunarDay: number,
  birthHour: number, _birthMinute: number, gender: "male" | "female"
): ServerZiWeiResult {
  const yearGanIdx = (birthYear - 4) % 10;
  const birthHourBranch = Math.floor((birthHour + 1) / 2) % 12;
  const mingGongIdx = calculateMingGong(lunarMonth, birthHourBranch);
  const shenGongIdx = calculateShenGong(lunarMonth, birthHourBranch);
  const bureau = determineBureau(mingGongIdx, yearGanIdx);
  const ziWeiPos = calculateZiWeiPosition(lunarDay, bureau);
  const starMap = placeMajorStars(ziWeiPos);

  const natalTransformations = calculateNatalTransformations(yearGanIdx, starMap, mingGongIdx);
  const palaceTransMap = new Map<string, Transformation[]>();
  for (const t of natalTransformations) {
    if (!palaceTransMap.has(t.palace)) palaceTransMap.set(t.palace, []);
    palaceTransMap.get(t.palace)!.push(t);
  }

  const palaces: PalaceInfo[] = PALACES.map((name, idx) => {
    const palaceIdx = (mingGongIdx + idx) % 12;
    const starsInPalace = starMap.get(palaceIdx) || [];
    const starPlacements: StarPlacement[] = starsInPalace.map(star => ({
      star, palace: name, brightness: getStarBrightness(star, palaceIdx), description: STAR_MEANINGS[star].positive,
    }));
    const trans = palaceTransMap.get(name) || [];
    return { name, branch: BRANCHES[palaceIdx], stars: starPlacements, transformations: trans, interpretation: interpretPalace(name, starPlacements, trans) };
  });

  const majorPeriods = calculateMajorPeriods(bureau, mingGongIdx, gender, yearGanIdx, starMap);
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthYear + 1;
  const currentMajorPeriod = majorPeriods.find(p => currentAge >= p.startAge && currentAge <= p.endAge) || null;
  const currentMinorPeriod = calculateMinorPeriod(birthYear, currentYear, mingGongIdx, gender, yearGanIdx);

  // Life structure
  const mingPalace = palaces[0];
  const mingStars = mingPalace.stars.map(s => s.star).join(", ") || "공궁";
  const hasPowerStar = mingPalace.stars.some(s => ["자미", "천부", "태양", "무곡"].includes(s.star));
  const hasChangeStar = mingPalace.stars.some(s => ["칠살", "파군", "염정"].includes(s.star));
  let lifeStructure = `명궁 ${BRANCHES[mingGongIdx]}궁에 ${mingStars} 좌정. `;
  const huaLu = natalTransformations.find(t => t.type === "화록");
  const huaJi = natalTransformations.find(t => t.type === "화기");
  if (huaLu) lifeStructure += `화록 ${huaLu.palace}에 위치. `;
  if (huaJi) lifeStructure += `화기 ${huaJi.palace}에 위치. `;
  if (hasPowerStar) lifeStructure += "권위와 안정 추구 구조.";
  else if (hasChangeStar) lifeStructure += "변화와 개혁 성장 구조.";
  else lifeStructure += "유연한 경험 성장 구조.";

  let periodAnalysis = "";
  if (currentMajorPeriod) {
    periodAnalysis += `현재 대한(${currentMajorPeriod.startAge}-${currentMajorPeriod.endAge}세): ${currentMajorPeriod.palace}. ${currentMajorPeriod.interpretation} `;
  }
  if (currentMinorPeriod) periodAnalysis += currentMinorPeriod.interpretation;

  const keyInsights: string[] = [mingPalace.interpretation];
  for (const t of natalTransformations) {
    keyInsights.push(`생년${t.type}: ${t.star} → ${t.palace} (${TRANSFORMATION_MEANINGS[t.type].effect})`);
  }
  for (const [idx, label] of [[2, "부처궁"], [4, "재백궁"], [8, "관록궁"]] as [number, string][]) {
    const p = palaces[idx];
    if (p.stars.length > 0) {
      const s = p.stars[0];
      const isBright = s.brightness === "묘" || s.brightness === "왕";
      keyInsights.push(`${label}: ${s.star}(${s.brightness}) → ${isBright ? "길" : "주의"}`);
    }
  }
  if (currentMajorPeriod) keyInsights.push(`현재 대한: ${currentMajorPeriod.interpretation}`);

  return {
    mingGong: BRANCHES[mingGongIdx], shenGong: BRANCHES[shenGongIdx], bureau,
    palaces, lifeStructure, keyInsights, natalTransformations,
    majorPeriods, currentMajorPeriod, currentMinorPeriod, periodAnalysis,
  };
}

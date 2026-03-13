/**
 * 자미두수(紫微斗數) 명반 계산 엔진 - 고급 버전
 * 사화(四化), 대한(大限), 소한(小限) 포함
 */

// ─── 12궁위 (Twelve Palaces) ───
export const PALACES = [
  "명궁", "형제궁", "부처궁", "자녀궁", "재백궁", "질액궁",
  "천이궁", "노복궁", "관록궁", "전택궁", "복덕궁", "부모궁",
] as const;

export type PalaceName = typeof PALACES[number];

// ─── 14 주성 (Major Stars) ───
export const MAJOR_STARS = [
  "자미", "천기", "태양", "무곡", "천동", "염정",
  "천부", "태음", "탐랑", "거문", "천상", "천량",
  "칠살", "파군",
] as const;

export type MajorStar = typeof MAJOR_STARS[number];

// ─── 사화 (Four Transformations) ───
export type TransformationType = "화록" | "화권" | "화과" | "화기";

export interface Transformation {
  type: TransformationType;
  star: MajorStar;
  palace: PalaceName;
  description: string;
}

// ─── 대한/소한 (Major/Minor Period) ───
export interface MajorPeriod {
  startAge: number;
  endAge: number;
  palace: PalaceName;
  branch: string;
  stars: StarPlacement[];
  transformations: Transformation[];
  interpretation: string;
}

export interface MinorPeriod {
  age: number;
  palace: PalaceName;
  branch: string;
  interpretation: string;
}

// ─── 기존 타입 ───
export type StarBrightness = "묘" | "왕" | "득지" | "평화" | "함지" | "낙함";
export type Bureau = "수이국" | "목삼국" | "금사국" | "토오국" | "화육국";

export interface StarPlacement {
  star: MajorStar;
  palace: PalaceName;
  brightness: StarBrightness;
  description: string;
}

export interface PalaceInfo {
  name: PalaceName;
  branch: string;
  stars: StarPlacement[];
  transformations: Transformation[];
  interpretation: string;
}

export interface ZiWeiResult {
  mingGong: string;
  shenGong: string;
  bureau: Bureau;
  palaces: PalaceInfo[];
  lifeStructure: string;
  keyInsights: string[];
  // 사화
  natalTransformations: Transformation[];
  // 대한/소한
  majorPeriods: MajorPeriod[];
  currentMajorPeriod: MajorPeriod | null;
  currentMinorPeriod: MinorPeriod | null;
  periodAnalysis: string;
}

// ─── 상수 ───
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];

// ─── 사화 테이블 (천간별 화록/화권/화과/화기 대상 별) ───
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

// ─── 사화 해석 ───
const TRANSFORMATION_MEANINGS: Record<TransformationType, { meaning: string; effect: string }> = {
  화록: { meaning: "록(祿) - 재물, 풍요, 기회", effect: "해당 궁에 재물운과 기회가 유입됨" },
  화권: { meaning: "권(權) - 권력, 장악, 통제", effect: "해당 궁에서 주도권과 결정력이 강해짐" },
  화과: { meaning: "과(科) - 명예, 학문, 평판", effect: "해당 궁에서 명성과 인정을 얻게 됨" },
  화기: { meaning: "기(忌) - 장애, 집착, 손실", effect: "해당 궁에 장애와 소모가 발생함" },
};

// ─── 명궁/신궁/오행국 계산 ───
function calculateMingGong(lunarMonth: number, birthHourBranch: number): number {
  return (2 + lunarMonth - 1 - birthHourBranch + 24) % 12;
}

function calculateShenGong(lunarMonth: number, birthHourBranch: number): number {
  return (2 + lunarMonth - 1 + birthHourBranch) % 12;
}

function determineBureau(mingGongIdx: number, yearGanIdx: number): Bureau {
  const bureauTable: Bureau[][] = [
    /* 갑(0) */ ["수이국","수이국","화육국","화육국","토오국","토오국","화육국","화육국","금사국","금사국","목삼국","목삼국"],
    /* 을(1) */ ["수이국","수이국","화육국","화육국","토오국","토오국","화육국","화육국","금사국","금사국","목삼국","목삼국"],
    /* 병(2) */ ["목삼국","목삼국","수이국","수이국","화육국","화육국","토오국","토오국","화육국","화육국","금사국","금사국"],
    /* 정(3) */ ["목삼국","목삼국","수이국","수이국","화육국","화육국","토오국","토오국","화육국","화육국","금사국","금사국"],
    /* 무(4) */ ["금사국","금사국","목삼국","목삼국","수이국","수이국","화육국","화육국","토오국","토오국","화육국","화육국"],
    /* 기(5) */ ["금사국","금사국","목삼국","목삼국","수이국","수이국","화육국","화육국","토오국","토오국","화육국","화육국"],
    /* 경(6) */ ["화육국","화육국","금사국","금사국","목삼국","목삼국","수이국","수이국","화육국","화육국","토오국","토오국"],
    /* 신(7) */ ["화육국","화육국","금사국","금사국","목삼국","목삼국","수이국","수이국","화육국","화육국","토오국","토오국"],
    /* 임(8) */ ["토오국","토오국","화육국","화육국","금사국","금사국","목삼국","목삼국","수이국","수이국","화육국","화육국"],
    /* 계(9) */ ["토오국","토오국","화육국","화육국","금사국","금사국","목삼국","목삼국","수이국","수이국","화육국","화육국"],
  ];
  return bureauTable[yearGanIdx % 10][mingGongIdx % 12];
}

// ─── 자미성 위치 ───
function calculateZiWeiPosition(lunarDay: number, bureau: Bureau): number {
  const bureauNum: Record<Bureau, number> = {
    수이국: 2, 목삼국: 3, 금사국: 4, 토오국: 5, 화육국: 6,
  };
  return Math.ceil(lunarDay / bureauNum[bureau]) % 12;
}

// ─── 14주성 배치 ───
function placeMajorStars(ziWeiPos: number): Map<number, MajorStar[]> {
  const placements = new Map<number, MajorStar[]>();

  const ziWeiGroup: [MajorStar, number][] = [
    ["자미", 0], ["천기", -1], ["태양", -3], ["무곡", -4],
    ["천동", -5], ["염정", -8],
  ];

  const tianFuPos = (12 - ziWeiPos + 4) % 12;
  const tianFuGroup: [MajorStar, number][] = [
    ["천부", 0], ["태음", 1], ["탐랑", 2], ["거문", 3],
    ["천상", 4], ["천량", 5], ["칠살", 6], ["파군", 7],
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

// ─── 별 밝기 판단 ───
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

  // Use deterministic brightness based on star+palace combo
  const seed = (star.charCodeAt(0) * 31 + palaceIdx * 17) % 6;
  if (optimalPositions[star]?.includes(palaceIdx)) {
    return seed % 2 === 0 ? "묘" : "왕";
  }
  if (worstPositions[star]?.includes(palaceIdx)) {
    return seed % 2 === 0 ? "함지" : "낙함";
  }
  return seed % 2 === 0 ? "득지" : "평화";
}

// ─── 별 의미 ───
const STAR_MEANINGS: Record<MajorStar, { positive: string; negative: string; domain: string }> = {
  자미: { positive: "리더십, 존귀, 중심, 결정권", negative: "독단, 고집, 외로움", domain: "인생 전반의 격과 위치" },
  천기: { positive: "지혜, 전략, 계획, 학문", negative: "우유부단, 신경질, 체력약", domain: "사고방식과 지적 능력" },
  태양: { positive: "광명, 활력, 남성, 공적 활동", negative: "과로, 소모, 눈 건강", domain: "사회활동과 명예" },
  무곡: { positive: "재물, 실행, 결단, 군인기질", negative: "고독, 강경, 감정부족", domain: "재물과 실행력" },
  천동: { positive: "복록, 편안, 예술, 아이", negative: "게으름, 우유부단, 의존", domain: "복과 감수성" },
  염정: { positive: "열정, 매력, 예술, 연애", negative: "집착, 시비, 형벌, 사고", domain: "감정과 열정" },
  천부: { positive: "재고, 안정, 보수, 관리", negative: "보수적, 소심, 변화거부", domain: "재산 보존과 관리" },
  태음: { positive: "부동산, 모성, 직관, 깔끔", negative: "우울, 과민, 폐쇄적", domain: "부동산과 내면세계" },
  탐랑: { positive: "다재다능, 매력, 사교, 창의", negative: "탐욕, 색정, 집착, 도박", domain: "욕망과 재능" },
  거문: { positive: "언변, 분석, 법률, 교육", negative: "시비, 구설, 의심, 소송", domain: "말과 분석력" },
  천상: { positive: "보좌, 조화, 인쇄, 문서", negative: "수동적, 우유부단", domain: "문서와 조화" },
  천량: { positive: "장수, 지혜, 종교, 의약", negative: "고독, 고집, 종교편향", domain: "수명과 지혜" },
  칠살: { positive: "결단, 용맹, 개혁, 독립", negative: "충동, 파괴, 고독, 재난", domain: "결단과 변혁" },
  파군: { positive: "개척, 변화, 파괴후재건", negative: "파괴, 불안정, 방탕", domain: "파괴와 재건" },
};

// ─── 사화 계산 (생년 천간 기준) ───
function calculateNatalTransformations(
  yearGanIdx: number,
  starMap: Map<number, MajorStar[]>,
  mingGongIdx: number
): Transformation[] {
  const stem = STEMS[yearGanIdx];
  const table = TRANSFORMATION_TABLE[stem];
  if (!table) return [];

  const transformations: Transformation[] = [];
  const types: TransformationType[] = ["화록", "화권", "화과", "화기"];

  for (const type of types) {
    const targetStar = table[type];
    // Find which palace this star is in
    for (const [posIdx, stars] of starMap.entries()) {
      if (stars.includes(targetStar)) {
        const palaceOffset = ((posIdx - mingGongIdx) % 12 + 12) % 12;
        const palace = PALACES[palaceOffset];
        const meaning = TRANSFORMATION_MEANINGS[type];
        transformations.push({
          type,
          star: targetStar,
          palace,
          description: `${targetStar}${type} → ${palace}: ${meaning.effect}`,
        });
        break;
      }
    }
  }

  return transformations;
}

// ─── 대한 계산 (10년 주기) ───
function calculateMajorPeriods(
  bureau: Bureau,
  mingGongIdx: number,
  gender: "male" | "female",
  yearGanIdx: number,
  starMap: Map<number, MajorStar[]>
): MajorPeriod[] {
  const bureauStartAge: Record<Bureau, number> = {
    수이국: 2, 목삼국: 3, 금사국: 4, 토오국: 5, 화육국: 6,
  };

  const startAge = bureauStartAge[bureau];
  // 양남음녀 순행, 음남양녀 역행
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
    const starPlacements: StarPlacement[] = starsInPalace.map((star) => ({
      star,
      palace,
      brightness: getStarBrightness(star, palaceIdx),
      description: STAR_MEANINGS[star].positive,
    }));

    // 대한 사화: 대한 궁의 천간으로 계산
    const periodStemIdx = (yearGanIdx + palaceIdx) % 10;
    const periodStem = STEMS[periodStemIdx];
    const periodTable = TRANSFORMATION_TABLE[periodStem];
    const periodTransformations: Transformation[] = [];

    if (periodTable) {
      for (const type of ["화록", "화권", "화과", "화기"] as TransformationType[]) {
        const targetStar = periodTable[type];
        for (const [posIdx, stars] of starMap.entries()) {
          if (stars.includes(targetStar)) {
            const tPalaceOffset = ((posIdx - mingGongIdx) % 12 + 12) % 12;
            periodTransformations.push({
              type,
              star: targetStar,
              palace: PALACES[tPalaceOffset],
              description: `대한${type}: ${targetStar} → ${PALACES[tPalaceOffset]}`,
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
    if (starsInPalace.length > 0) {
      interpretation += `${starsInPalace.join(", ")} 좌정. `;
    }
    if (isBright && hasHuaLu) {
      interpretation += "매우 길한 시기. 재물과 기회가 풍부하며 주요 성취 가능.";
    } else if (isBright) {
      interpretation += "전반적으로 순조로운 시기. 노력의 결실을 볼 수 있음.";
    } else if (hasHuaJi) {
      interpretation += "주의가 필요한 시기. 장애물과 소모가 예상되므로 신중한 판단 필요.";
    } else {
      interpretation += "평온한 시기. 안정적이나 큰 변화는 적음.";
    }

    periods.push({
      startAge: periodStart,
      endAge: periodEnd,
      palace,
      branch,
      stars: starPlacements,
      transformations: periodTransformations,
      interpretation,
    });
  }

  return periods;
}

// ─── 소한 계산 (연도별) ───
function calculateMinorPeriod(
  birthYear: number,
  currentYear: number,
  mingGongIdx: number,
  gender: "male" | "female",
  yearGanIdx: number
): MinorPeriod {
  const age = currentYear - birthYear + 1; // 한국 나이 (Korean age)
  // 소한 궁위: 명궁에서 나이만큼 이동 (성별/음양에 따라 방향)
  const isYangStem = yearGanIdx % 2 === 0;
  const isForward = (gender === "male" && isYangStem) || (gender === "female" && !isYangStem);
  const direction = isForward ? 1 : -1;
  const palaceIdx = ((mingGongIdx + direction * (age % 12)) % 12 + 12) % 12;
  const palaceOffset = ((palaceIdx - mingGongIdx) % 12 + 12) % 12;
  const palace = PALACES[palaceOffset];
  const branch = BRANCHES[palaceIdx];

  const palaceContext: Record<PalaceName, string> = {
    명궁: "자아와 행동력", 형제궁: "인간관계", 부처궁: "연애/결혼",
    자녀궁: "창의력/후배", 재백궁: "재물 흐름", 질액궁: "건강 관리",
    천이궁: "이동/변화", 노복궁: "사회적 지원", 관록궁: "사업/직장",
    전택궁: "부동산/가정", 복덕궁: "정신적 여유", 부모궁: "윗사람 관계",
  };

  return {
    age,
    palace,
    branch,
    interpretation: `올해(${age}세, 한국나이) 소한: ${palace}(${branch}궁) → ${palaceContext[palace]}에 에너지가 집중되는 해.`,
  };
}

// ─── 궁위별 해석 (사화 포함) ───
function interpretPalace(palace: PalaceName, stars: StarPlacement[], transformations: Transformation[]): string {
  const palaceContext: Record<PalaceName, string> = {
    명궁: "성격과 인생 전반의 방향", 형제궁: "형제자매 및 가까운 동료",
    부처궁: "배우자와 연애 관계", 자녀궁: "자녀와 후계",
    재백궁: "재물 운용과 수입", 질액궁: "건강과 질병",
    천이궁: "이동, 여행, 외부 활동", 노복궁: "부하, 직원, 팔로워",
    관록궁: "직업과 사업", 전택궁: "부동산과 가산",
    복덕궁: "정신적 만족과 취미", 부모궁: "부모와 상사",
  };

  const context = palaceContext[palace];
  let result = "";

  if (stars.length === 0) {
    result = `${palace}(${context})에 주성이 없어 타 궁의 영향을 크게 받습니다.`;
  } else {
    const mainStar = stars[0];
    const meaning = STAR_MEANINGS[mainStar.star];
    const isBright = mainStar.brightness === "묘" || mainStar.brightness === "왕";
    const isDark = mainStar.brightness === "함지" || mainStar.brightness === "낙함";

    if (isBright) {
      result = `${palace}(${context})에 ${mainStar.star}(${mainStar.brightness}) → ${meaning.positive}. ${meaning.domain}에서 강한 에너지.`;
    } else if (isDark) {
      result = `${palace}(${context})에 ${mainStar.star}(${mainStar.brightness}) → ${meaning.negative} 경향. ${meaning.domain}에서 주의 필요.`;
    } else {
      result = `${palace}(${context})에 ${mainStar.star}(${mainStar.brightness}) → ${meaning.positive}과 ${meaning.negative} 혼재.`;
    }
  }

  // 사화 영향 추가
  if (transformations.length > 0) {
    const tDesc = transformations.map(t => {
      const m = TRANSFORMATION_MEANINGS[t.type];
      return `${t.type}(${m.meaning}): ${t.star}`;
    }).join("; ");
    result += ` [사화: ${tDesc}]`;
  }

  return result;
}

// ─── 메인 계산 함수 ───
export function calculateZiWei(
  birthYear: number,
  lunarMonth: number,
  lunarDay: number,
  birthHour: number,
  birthMinute: number,
  gender: "male" | "female"
): ZiWeiResult {
  const yearGanIdx = (birthYear - 4) % 10;
  const birthHourBranch = Math.floor((birthHour + 1) / 2) % 12;

  const mingGongIdx = calculateMingGong(lunarMonth, birthHourBranch);
  const shenGongIdx = calculateShenGong(lunarMonth, birthHourBranch);
  const bureau = determineBureau(mingGongIdx, yearGanIdx);
  const ziWeiPos = calculateZiWeiPosition(lunarDay, bureau);
  const starMap = placeMajorStars(ziWeiPos);

  // 생년 사화
  const natalTransformations = calculateNatalTransformations(yearGanIdx, starMap, mingGongIdx);

  // 궁위별 사화 매핑
  const palaceTransMap = new Map<string, Transformation[]>();
  for (const t of natalTransformations) {
    if (!palaceTransMap.has(t.palace)) palaceTransMap.set(t.palace, []);
    palaceTransMap.get(t.palace)!.push(t);
  }

  // 12궁 구성
  const palaces: PalaceInfo[] = PALACES.map((name, idx) => {
    const palaceIdx = (mingGongIdx + idx) % 12;
    const starsInPalace = starMap.get(palaceIdx) || [];
    const starPlacements: StarPlacement[] = starsInPalace.map((star) => ({
      star,
      palace: name,
      brightness: getStarBrightness(star, palaceIdx),
      description: STAR_MEANINGS[star].positive,
    }));

    const trans = palaceTransMap.get(name) || [];

    return {
      name,
      branch: BRANCHES[palaceIdx],
      stars: starPlacements,
      transformations: trans,
      interpretation: interpretPalace(name, starPlacements, trans),
    };
  });

  // 대한
  const majorPeriods = calculateMajorPeriods(bureau, mingGongIdx, gender, yearGanIdx, starMap);
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthYear + 1; // Korean age
  const currentMajorPeriod = majorPeriods.find(p => currentAge >= p.startAge && currentAge <= p.endAge) || null;

  // 소한
  const currentMinorPeriod = calculateMinorPeriod(birthYear, currentYear, mingGongIdx, gender, yearGanIdx);

  // 인생 구조 분석
  const mingPalace = palaces[0];
  const mingStars = mingPalace.stars.map(s => s.star).join(", ") || "공궁";
  const hasPowerStar = mingPalace.stars.some(s => ["자미", "천부", "태양", "무곡"].includes(s.star));
  const hasChangeStar = mingPalace.stars.some(s => ["칠살", "파군", "염정"].includes(s.star));

  let lifeStructure = `명궁 ${BRANCHES[mingGongIdx]}궁에 ${mingStars} 좌정. `;

  // 사화 영향 추가
  const huaLu = natalTransformations.find(t => t.type === "화록");
  const huaJi = natalTransformations.find(t => t.type === "화기");
  if (huaLu) lifeStructure += `화록이 ${huaLu.palace}에 위치하여 ${huaLu.star}의 재물/기회 에너지가 활성화됨. `;
  if (huaJi) lifeStructure += `화기가 ${huaJi.palace}에 위치하여 ${huaJi.star} 관련 분야에 주의 필요. `;

  if (hasPowerStar) {
    lifeStructure += "권위와 안정을 추구하는 인생 구조. 리더십과 구조적 성공이 핵심.";
  } else if (hasChangeStar) {
    lifeStructure += "변화와 개혁을 통해 성장하는 인생 구조. 파괴 후 재건 패턴.";
  } else {
    lifeStructure += "유연하고 다양한 경험을 통해 성장하는 인생 구조.";
  }

  // 시기 분석
  let periodAnalysis = "";
  if (currentMajorPeriod) {
    periodAnalysis += `현재 대한(${currentMajorPeriod.startAge}-${currentMajorPeriod.endAge}세): ${currentMajorPeriod.palace}. ${currentMajorPeriod.interpretation} `;
    const daehanHuaLu = currentMajorPeriod.transformations.find(t => t.type === "화록");
    const daehanHuaJi = currentMajorPeriod.transformations.find(t => t.type === "화기");
    if (daehanHuaLu) periodAnalysis += `대한 화록이 ${daehanHuaLu.palace}에 작용하여 기회 확대. `;
    if (daehanHuaJi) periodAnalysis += `대한 화기가 ${daehanHuaJi.palace}에 작용하여 해당 영역 주의. `;
  }
  if (currentMinorPeriod) {
    periodAnalysis += currentMinorPeriod.interpretation;
  }

  // 핵심 인사이트
  const keyInsights: string[] = [];
  keyInsights.push(mingPalace.interpretation);

  // 사화 인사이트
  for (const t of natalTransformations) {
    keyInsights.push(`생년${t.type}: ${t.star} → ${t.palace} (${TRANSFORMATION_MEANINGS[t.type].effect})`);
  }

  // 주요 궁위
  for (const [idx, label] of [[2, "부처궁"], [4, "재백궁"], [8, "관록궁"]] as [number, string][]) {
    const p = palaces[idx];
    if (p.stars.length > 0) {
      const s = p.stars[0];
      const isBright = s.brightness === "묘" || s.brightness === "왕";
      const palaceInsights: Record<string, [string, string]> = {
        부처궁: ["좋은 배우자운", "배우자 관계에 노력 필요"],
        재백궁: ["재물 획득 능력 강", "재물 관리에 주의"],
        관록궁: ["직업운 강함", "직업 변동 가능성"],
      };
      const [good, bad] = palaceInsights[label] || ["길", "주의"];
      keyInsights.push(`${label}: ${s.star}(${s.brightness}) → ${isBright ? good : bad}`);
    }
  }

  // 대한 인사이트
  if (currentMajorPeriod) {
    keyInsights.push(`현재 대한(${currentMajorPeriod.startAge}-${currentMajorPeriod.endAge}세): ${currentMajorPeriod.interpretation}`);
  }

  return {
    mingGong: BRANCHES[mingGongIdx],
    shenGong: BRANCHES[shenGongIdx],
    bureau,
    palaces,
    lifeStructure,
    keyInsights,
    natalTransformations,
    majorPeriods,
    currentMajorPeriod,
    currentMinorPeriod,
    periodAnalysis,
  };
}

// ─── 질문 유형별 분석 ───
export function getZiWeiForQuestion(
  ziwei: ZiWeiResult,
  questionType: "연애" | "재회" | "사업" | "직업" | "금전" | "종합"
): string {
  const palaceMap: Record<string, number> = { "연애": 2, "재회": 2, "사업": 8, "직업": 8, "금전": 4 };
  const idx = palaceMap[questionType];

  let result = "";

  if (idx !== undefined) {
    const palace = ziwei.palaces[idx];
    result = palace.interpretation;

    // 해당 궁 사화 분석
    const relevantTrans = ziwei.natalTransformations.filter(t => t.palace === palace.name);
    if (relevantTrans.length > 0) {
      result += " " + relevantTrans.map(t => t.description).join(". ");
    }
  } else {
    result = ziwei.lifeStructure;
  }

  // 대한/소한 시기 분석 추가
  if (ziwei.periodAnalysis) {
    result += " [시기 분석] " + ziwei.periodAnalysis;
  }

  return result;
}

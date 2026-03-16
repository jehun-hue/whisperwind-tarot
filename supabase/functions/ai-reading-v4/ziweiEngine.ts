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
  "칠살", "파군", "문곡",
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

// B-75new: 14주성·길흉성 등급 분류 테이블
const LUCKY_STARS = ["문창", "문곡", "좌보", "우필", "천괴", "천월", "록존", "천마"] as const;
const UNLUCKY_STARS = ["경양", "타라", "화성", "영성", "지공", "지겁", "천형", "천요"] as const;

// B-76new: 공궁 판별 — 14주성이 없는 궁
function isEmptyPalace(stars: StarPlacement[]): boolean {
  return !stars.some(s => (MAJOR_STARS as readonly string[]).includes(s.star));
}

// B-76new: 맞은편 궁 인덱스 계산 (차성안궁)
function getOppositePalaceIdx(palaceIdx: number): number {
  return (palaceIdx + 6) % 12;
}

export interface CorePalaceInfo {
  palace: PalaceName;
  branch: string;
  major_stars: string[];
  lucky_stars: string[];
  unlucky_stars: string[];
  is_empty: boolean;
  is_borrowed_stars: boolean;
  borrowed_from?: PalaceName;
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
  annualTransformations: Transformation[];
  annualYear: number;
  annualGan: string;
  // B-74new: 명궁·신궁 우선 추출
  core_palaces: {
    life_palace: CorePalaceInfo;  // 명궁
    body_palace: CorePalaceInfo;  // 신궁
  };
}
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];

const TRANSFORMATION_TABLE: Record<string, Record<TransformationType, MajorStar>> = {
  갑: { 화록: "염정", 화권: "파군", 화과: "무곡", 화기: "태양" },
  을: { 화록: "천기", 화권: "천량", 화과: "자미", 화기: "태음" },
  병: { 화록: "천동", 화권: "천기", 화과: "천상", 화기: "염정" },
  정: { 화록: "태음", 화권: "천동", 화과: "천기", 화기: "거문" },
  무: { 화록: "탐랑", 화권: "태음", 화과: "천부", 화기: "천기" },
  기: { 화록: "무곡", 화권: "탐랑", 화과: "천량", 화기: "문곡" },
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
  문곡: { positive: "예술, 학능, 재능", negative: "변덕, 구설, 시비", domain: "재능과 학문" },
};

// ─── 계산 함수 ───

// 명궁 계산: 인궁(인덱스 2)에서 시작, 월만큼 순행, 시지만큼 역행
// 검증: 음력11월 술시(10) → (2+11-1-10+24)%12 = 2 = 인(寅) ✅
function calculateMingGong(lunarMonth: number, birthHourBranch: number): number {
  return (2 + lunarMonth - 1 - birthHourBranch + 24) % 12;
}

function calculateShenGong(lunarMonth: number, birthHourBranch: number): number {
  return (2 + lunarMonth - 1 + birthHourBranch) % 12;
}

function determineBureau(mingGongIdx: number, yearGanIdx: number): Bureau {
  // 전통 자미두수 오행국 조견표 (명궁 지지 × 생년 천간)
  // 천간: 갑(0)을(1)병(2)정(3)무(4)기(5)경(6)신(7)임(8)계(9)
  // 지지: 자(0)축(1)인(2)묘(3)진(4)사(5)오(6)미(7)신(8)유(9)술(10)해(11)
  const bureauTable: Bureau[][] = [
    // 전통 자미두수 오행국 조견표 — 오호둔법 완전 재계산 (B-187 fix v4)
    // 오호둔 시작천간: 甲己→甲寅, 乙庚→丙寅, 丙辛→戊寅, 丁壬→庚寅, 戊癸→壬寅
    // 천간오행: 甲乙=木→목삼국, 丙丁=火→화육국, 戊己=土→토오국, 庚辛=金→금사국, 壬癸=水→수이국
    // 지지배열: 자(0)축(1)인(2)묘(3)진(4)사(5)오(6)미(7)신(8)유(9)술(10)해(11)
    // 인(寅)부터 시작하므로: 인=시작천간, 묘=+1, 진=+2 ... 자=+10, 축=+11
    // 지지 → 자      축      인      묘      진      사      오      미      신      유      술      해
    /* 갑(0) 甲寅起: 甲乙丙丁戊己庚辛壬癸甲乙 */ ["목삼국","목삼국","목삼국","목삼국","화육국","화육국","토오국","토오국","금사국","금사국","수이국","수이국"],
    /* 을(1) 丙寅起: 丙丁戊己庚辛壬癸甲乙丙丁 */ ["화육국","화육국","화육국","화육국","토오국","토오국","금사국","금사국","수이국","수이국","목삼국","목삼국"],
    /* 병(2) 戊寅起: 戊己庚辛壬癸甲乙丙丁戊己 */ ["토오국","토오국","토오국","토오국","금사국","금사국","수이국","수이국","목삼국","목삼국","화육국","화육국"],
    /* 정(3) 庚寅起: 庚辛壬癸甲乙丙丁戊己庚辛 */ ["금사국","금사국","금사국","금사국","수이국","수이국","목삼국","목삼국","화육국","화육국","토오국","토오국"],
    /* 무(4) 壬寅起: 壬癸甲乙丙丁戊己庚辛壬癸 */ ["수이국","수이국","수이국","수이국","목삼국","목삼국","화육국","화육국","토오국","토오국","금사국","금사국"],
    /* 기(5) 甲寅起: 甲乙丙丁戊己庚辛壬癸甲乙 */ ["목삼국","목삼국","목삼국","목삼국","화육국","화육국","토오국","토오국","금사국","금사국","수이국","수이국"],
    /* 경(6) 丙寅起: 丙丁戊己庚辛壬癸甲乙丙丁 */ ["화육국","화육국","화육국","화육국","토오국","토오국","금사국","금사국","수이국","수이국","목삼국","목삼국"],
    /* 신(7) 戊寅起: 戊己庚辛壬癸甲乙丙丁戊己 */ ["토오국","토오국","토오국","토오국","금사국","금사국","수이국","수이국","목삼국","목삼국","화육국","화육국"],
    /* 임(8) 庚寅起: 庚辛壬癸甲乙丙丁戊己庚辛 */ ["금사국","금사국","금사국","금사국","수이국","수이국","목삼국","목삼국","화육국","화육국","토오국","토오국"],
    /* 계(9) 壬寅起: 壬癸甲乙丙丁戊己庚辛壬癸 */ ["수이국","수이국","수이국","수이국","목삼국","목삼국","화육국","화육국","토오국","토오국","금사국","금사국"],
  ];
  return bureauTable[yearGanIdx % 10][mingGongIdx % 12];
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
    ["자미", 0], ["천기", -1], ["태양", -3], ["무곡", -4], ["천동", -5], ["염정", -8],
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
    const palaceIdx = ((mingGongIdx + direction * i) % 12 + 12) % 12;
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
    const isDark = starPlacements.some(s => s.brightness === "함지" || s.brightness === "낙함");
    const hasHuaJi = periodTransformations.some(t => t.type === "화기");
    const hasHuaLu = periodTransformations.some(t => t.type === "화록");
    const hasHuaQuan = periodTransformations.some(t => t.type === "화권");
    const hasHuaKe = periodTransformations.some(t => t.type === "화과");

    const PALACE_THEME: Record<string, string> = {
      명궁: "자아·건강·외모", 형제궁: "형제·동료·인맥", 부처궁: "연애·결혼·파트너",
      자녀궁: "자녀·창의·후배", 재백궁: "재물·수입·금전", 질액궁: "건강·질병·체력",
      천이궁: "이동·해외·환경변화", 노복궁: "부하·지지자·사회관계", 관록궁: "직업·사업·명예",
      전택궁: "부동산·가정·주거", 복덕궁: "정신·취미·복", 부모궁: "부모·상사·문서",
    };

    let interpretation = `${periodStart}-${periodEnd}세 대한: ${palace}(${branch}궁, ${PALACE_THEME[palace] || "전반"} 영역). `;
    if (starsInPalace.length > 0) interpretation += `${starsInPalace.join("·")} 좌정. `;

    if (isBright && hasHuaLu && hasHuaQuan) {
      interpretation += "화록·화권 동시 활성 — 재물과 권위가 동반 상승하는 최길의 시기.";
    } else if (isBright && hasHuaLu) {
      interpretation += "주성이 밝고 화록 활성 — 기회와 풍요가 자연스럽게 따르는 길한 시기.";
    } else if (isBright && hasHuaQuan) {
      interpretation += "주성이 밝고 화권 활성 — 리더십·경쟁력이 강화되는 도약의 시기.";
    } else if (isBright && hasHuaKe) {
      interpretation += "주성이 밝고 화과 활성 — 학업·시험·명예 운이 뒷받침되는 순조로운 시기.";
    } else if (isBright) {
      interpretation += "주성 기운이 강하고 안정적 — 꾸준히 성과를 쌓기 좋은 시기.";
    } else if (isDark && hasHuaJi) {
      interpretation += "주성이 어둡고 화기 활성 — 건강·재물·관계 모두 세심한 주의가 필요한 시기.";
    } else if (hasHuaJi) {
      interpretation += `화기 활성 — 해당 궁 영역(${PALACE_THEME[palace] || "전반"})에서 장애·손실 가능성. 신중한 판단 요망.`;
    } else if (isDark) {
      interpretation += "주성 기운이 침체 — 무리한 확장보다 내실 다지기에 집중하는 시기.";
    } else if (hasHuaLu) {
      interpretation += "화록 활성 — 해당 궁 영역에서 재물·기회의 흐름이 열리는 시기.";
    } else {
      interpretation += "특별한 사화 없이 평온 — 현상 유지·준비·내공 쌓기에 적합한 시기.";
    }
    periods.push({ startAge: periodStart, endAge: periodEnd, palace, branch, stars: starPlacements, transformations: periodTransformations, interpretation });
  }
  return periods;
}

function calculateMinorPeriod(
  birthYear: number, currentYear: number, mingGongIdx: number,
  gender: "male" | "female", yearGanIdx: number
): MinorPeriod {
  const age = currentYear - birthYear + 1; // 한국 나이

  // 연간 음양: 양간(甲丙戊庚壬) = 인덱스 0,2,4,6,8 → 양(陽)
  const isYangGan = yearGanIdx % 2 === 0;

  // 소한 순역: 양남음녀 → 순행(+1), 음남양녀 → 역행(-1)
  const isForward = (gender === "male" && isYangGan) || (gender === "female" && !isYangGan);
  const direction = isForward ? 1 : -1;

  // 소한 시작: 1세 = 명궁, 매년 1궁씩 이동
  const offset = (age - 1) % 12;
  const palaceIdx = ((mingGongIdx + direction * offset) % 12 + 12) % 12;

  // PALACES 배열 인덱스: 명궁 기준 상대 오프셋
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
    interpretation: `올해(${age}세, 한국나이) 소한: ${palace}(${BRANCHES[palaceIdx]}궁) → ${palaceContext[palace]}에 집중.`,
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
  const currentAge = currentYear - birthYear + 1; // Korean age
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
    periodAnalysis += `현재 대한(${currentMajorPeriod.startAge}-${currentMajorPeriod.endAge}세, 한국나이): ${currentMajorPeriod.palace}. ${currentMajorPeriod.interpretation} `;
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

  // ── 연간 유년 사화 계산 (올해 천간 기준) ──
  const currentYearGanIdx = (currentYear - 4) % 10;
  const GAN_NAMES = ["갑","을","병","정","무","기","경","신","임","계"];
  const currentYearGan = GAN_NAMES[currentYearGanIdx];
  const annualTable = TRANSFORMATION_TABLE[currentYearGan];
  const annualTransformations: Transformation[] = [];

  if (annualTable) {
    for (const type of ["화록", "화권", "화과", "화기"] as TransformationType[]) {
      const targetStar = annualTable[type];
      for (const [posIdx, stars] of starMap.entries()) {
        if (stars.includes(targetStar)) {
          const tOff = ((posIdx - mingGongIdx) % 12 + 12) % 12;
          annualTransformations.push({
            type, star: targetStar, palace: PALACES[tOff],
            description: `${currentYear}년 유년${type}: ${targetStar} → ${PALACES[tOff]}궁 활성`,
          });
          break;
        }
      }
    }
  }

  // B-74new: 명궁·신궁 CorePalaceInfo 생성
  function buildCorePalaceInfo(palaceIdx: number): CorePalaceInfo {
    const palaceOffset = ((palaceIdx - mingGongIdx) % 12 + 12) % 12;
    const palaceName = PALACES[palaceOffset];
    const palaceData = palaces.find(p => p.name === palaceName);
    const stars = palaceData?.stars || [];

    // B-75new: 14주성·길흉성 분류
    const majorStarList = stars
      .filter(s => (MAJOR_STARS as readonly string[]).includes(s.star))
      .map(s => s.star);
    const luckyStarList = stars
      .filter(s => (LUCKY_STARS as readonly string[]).includes(s.star as any))
      .map(s => s.star);
    const unluckyStarList = stars
      .filter(s => (UNLUCKY_STARS as readonly string[]).includes(s.star as any))
      .map(s => s.star);

    // B-76new: 공궁 처리 — 맞은편 궁 별 빌려오기 (차성안궁)
    const isEmpty = isEmptyPalace(stars);
    let isBorrowedStars = false;
    let borrowedFrom: PalaceName | undefined;
    let borrowedMajorStars: string[] = majorStarList;

    if (isEmpty) {
      const oppositeIdx = getOppositePalaceIdx(palaceIdx);
      const oppositeOffset = ((oppositeIdx - mingGongIdx) % 12 + 12) % 12;
      const oppositePalaceName = PALACES[oppositeOffset];
      const oppositeData = palaces.find(p => p.name === oppositePalaceName);
      const oppositeStars = oppositeData?.stars || [];
      borrowedMajorStars = oppositeStars
        .filter(s => (MAJOR_STARS as readonly string[]).includes(s.star))
        .map(s => s.star);
      if (borrowedMajorStars.length > 0) {
        isBorrowedStars = true;
        borrowedFrom = oppositePalaceName;
      }
    }

    return {
      palace: palaceName,
      branch: BRANCHES[palaceIdx] || "",
      major_stars: isEmpty ? borrowedMajorStars : majorStarList,
      lucky_stars: luckyStarList,
      unlucky_stars: unluckyStarList,
      is_empty: isEmpty,
      is_borrowed_stars: isBorrowedStars,
      borrowed_from: borrowedFrom,
      interpretation: palaceData?.interpretation || "",
    };
  }

  const core_palaces = {
    life_palace: buildCorePalaceInfo(mingGongIdx),
    body_palace: buildCorePalaceInfo(shenGongIdx),
  };

  return {
    mingGong: BRANCHES[mingGongIdx], shenGong: BRANCHES[shenGongIdx], bureau,
    palaces, lifeStructure, keyInsights, natalTransformations,
    majorPeriods, currentMajorPeriod, currentMinorPeriod, periodAnalysis,
    annualTransformations,
    annualYear: currentYear,
    annualGan: currentYearGan,
    core_palaces,
  };
}

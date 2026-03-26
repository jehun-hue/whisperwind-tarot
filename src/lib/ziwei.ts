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

// ─── 보조성 (Auxiliary Stars) ───
export const AUXILIARY_STARS = [
  "좌보", "우필", "문창", "문곡", "록존", "천괴", "천월",
  "경양", "타라", "화성", "영성", "지공", "지겁",
] as const;

export type AuxiliaryStar = typeof AUXILIARY_STARS[number];

// ─── 사화 (Four Transformations) ───
export type TransformationType = "화록" | "화권" | "화과" | "화기";

export interface Transformation {
  type: TransformationType;
  star: MajorStar | AuxiliaryStar;
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
  star: MajorStar | AuxiliaryStar;
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
  shenGongPalace: string;
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

  // 격국 분석 (2단계 추가)
  starCombinations: { palace: string; name: string; rating: string; interpretation: string }[];
  geokGuk: { name: string; grade: string; description: string; breakConditions: string[] }[];
}

// ─── 상수 ───
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];

// ─── 사화 테이블 (천간별 화록/화권/화과/화기 대상 별) ───
const TRANSFORMATION_TABLE: Record<string, Record<TransformationType, MajorStar | AuxiliaryStar>> = {
  갑: { 화록: "염정", 화권: "파군", 화과: "무곡", 화기: "태양" },
  을: { 화록: "천기", 화권: "천량", 화과: "자미", 화기: "태음" },
  병: { 화록: "천동", 화권: "천기", 화과: "천상", 화기: "염정" },
  정: { 화록: "태음", 화권: "천동", 화과: "천기", 화기: "거문" },
  무: { 화록: "탐랑", 화권: "태음", 화과: "천부", 화기: "천기" },
  기: { 화록: "무곡", 화권: "탐랑", 화과: "천량", 화기: "천상" },
  경: { 화록: "태양", 화권: "무곡", 화과: "태음", 화기: "천동" },
  신: { 화록: "거문", 화권: "태양", 화과: "천부", 화기: "천량" },
  임: { 화록: "천량", 화권: "자미", 화과: "좌보", 화기: "무곡" },
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

// ─── 오호둔갑법: 명궁 천간 구하기 ───
const WU_HU_DUN_GAN: Record<string, string> = {
  "갑": "병", "기": "병",
  "을": "무", "경": "무",
  "병": "경", "신": "경",
  "정": "임", "임": "임",
  "무": "갑", "계": "갑",
};

function getPalaceGan(yearGanIdx: number, mingGongIdx: number): string {
  const yearGan = STEMS[yearGanIdx];
  const startGan = WU_HU_DUN_GAN[yearGan];
  const startGanIdx = STEMS.indexOf(startGan);
  const offset = ((mingGongIdx - 2) % 12 + 12) % 12; // 寅(2)부터 거리
  return STEMS[(startGanIdx + offset) % 10];
}

// ─── 납음 오행 테이블 (60갑자) ───
const NAYIN_TABLE: Record<string, string> = {
  "갑자": "금", "을축": "금", "병인": "화", "정묘": "화", "무진": "목", "기사": "목",
  "경오": "토", "신미": "토", "임신": "금", "계유": "금", "갑술": "화", "을해": "화",
  "병자": "수", "정축": "수", "무인": "토", "기묘": "토", "경진": "금", "신사": "금",
  "임오": "목", "계미": "목", "갑신": "수", "을유": "수", "병술": "토", "정해": "토",
  "무자": "화", "기축": "화", "경인": "목", "신묘": "목", "임진": "수", "계사": "수",
  "갑오": "금", "을미": "금", "병신": "화", "정유": "화", "무술": "목", "기해": "목",
  "경자": "토", "신축": "토", "임인": "금", "계묘": "금", "갑진": "화", "을사": "화",
  "병오": "수", "정미": "수", "무신": "토", "기유": "토", "경술": "금", "신해": "금",
  "임자": "목", "계축": "목", "갑인": "수", "을묘": "수", "병진": "토", "정사": "토",
  "무오": "화", "기미": "화", "경신": "목", "신유": "목", "임술": "수", "계해": "수",
};

const NAYIN_TO_BUREAU: Record<string, Bureau> = {
  "수": "수이국", "목": "목삼국", "금": "금사국", "토": "토오국", "화": "화육국",
};

function determineBureau(mingGongIdx: number, yearGanIdx: number): Bureau {
  const palaceGan = getPalaceGan(yearGanIdx, mingGongIdx);
  const palaceZhi = BRANCHES[mingGongIdx];
  const key = palaceGan + palaceZhi;
  const element = NAYIN_TABLE[key];
  if (element && NAYIN_TO_BUREAU[element]) {
    return NAYIN_TO_BUREAU[element];
  }
  return "수이국"; // fallback
}

// ─── 자미성 위치 ───
function calculateZiWeiPosition(lunarDay: number, bureau: Bureau): number {
  const bureauNum: Record<Bureau, number> = {
    수이국: 2, 목삼국: 3, 금사국: 4, 토오국: 5, 화육국: 6,
  };
  const juNumber = bureauNum[bureau];
  const quotient = Math.floor(lunarDay / juNumber);
  const remainder = lunarDay % juNumber;

  let position: number;
  if (remainder === 0) {
    position = quotient;
  } else {
    const add = juNumber - remainder;
    position = quotient + 1;
    if (add % 2 === 1) {
      position = position - add;
    } else {
      position = position + add;
    }
  }

  while (position > 12) position -= 12;
  while (position < 1) position += 12;

  // position(1~12)을 지지 인덱스로 변환: 1=寅(2), 2=卯(3), ...
  return (position - 1 + 2) % 12;
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
    ["천상", 4], ["천량", 5], ["칠살", 6], ["파군", 10],
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

// ─── 좌보·우필 배치 (월 기준) ───
function placeZuoBiStars(lunarMonth: number): Map<number, AuxiliaryStar[]> {
  const placements = new Map<number, AuxiliaryStar[]>();
  
  const zuoFuPos = (4 + lunarMonth - 1) % 12;   // 辰(4)에서 순행
  const youBiPos = (10 - lunarMonth + 1 + 12) % 12; // 戌(10)에서 역행
  
  if (!placements.has(zuoFuPos)) placements.set(zuoFuPos, []);
  placements.get(zuoFuPos)!.push("좌보");
  
  if (!placements.has(youBiPos)) placements.set(youBiPos, []);
  placements.get(youBiPos)!.push("우필");
  
  return placements;
}

// ─── 문창·문곡 배치 (시지 기준) ───
function placeMunStars(birthHourBranch: number): Map<number, AuxiliaryStar[]> {
  const placements = new Map<number, AuxiliaryStar[]>();
  
  const munChangPos = (10 - birthHourBranch + 12) % 12; // 戌(10)에서 역행
  const munGokPos = (4 + birthHourBranch) % 12;          // 辰(4)에서 순행
  
  if (!placements.has(munChangPos)) placements.set(munChangPos, []);
  placements.get(munChangPos)!.push("문창");
  
  if (!placements.has(munGokPos)) placements.set(munGokPos, []);
  placements.get(munGokPos)!.push("문곡");
  
  return placements;
}

// ─── 록존·경양·타라 배치 (년간 기준) ───
function placeLuCunStars(yearGanIdx: number): Map<number, AuxiliaryStar[]> {
  const placements = new Map<number, AuxiliaryStar[]>();
  
  // 년간 → 록존 위치 테이블
  const luCunTable: number[] = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];
  // 갑→인(2), 을→묘(3), 병→사(5), 정→오(6), 무→사(5), 기→오(6),
  // 경→신(8), 신→유(9), 임→해(11), 계→자(0)
  
  const luCunPos = luCunTable[yearGanIdx];
  const gyeongYangPos = (luCunPos + 1) % 12;  // 록존 다음 궁
  const taRaPos = (luCunPos - 1 + 12) % 12;   // 록존 이전 궁
  
  if (!placements.has(luCunPos)) placements.set(luCunPos, []);
  placements.get(luCunPos)!.push("록존");
  
  if (!placements.has(gyeongYangPos)) placements.set(gyeongYangPos, []);
  placements.get(gyeongYangPos)!.push("경양");
  
  if (!placements.has(taRaPos)) placements.set(taRaPos, []);
  placements.get(taRaPos)!.push("타라");
  
  return placements;
}

// ─── 천괴·천월 배치 (년간 기준) ───
function placeGuiYueStars(yearGanIdx: number): Map<number, AuxiliaryStar[]> {
  const placements = new Map<number, AuxiliaryStar[]>();
  
  // 년간 → 천괴 위치
  const guiTable: number[] = [1, 0, 11, 11, 1, 0, 7, 6, 3, 3];
  // 갑→축(1), 을→자(0), 병→해(11), 정→해(11), 무→축(1), 기→자(0),
  // 경→미(7), 신→오(6), 임→묘(3), 계→묘(3)
  
  // 년간 → 천월 위치
  const yueTable: number[] = [7, 6, 3, 3, 7, 6, 1, 0, 11, 11];
  // 갑→미(7), 을→오(6), 병→묘(3), 정→묘(3), 무→미(7), 기→오(6),
  // 경→축(1), 신→자(0), 임→해(11), 계→해(11)
  
  const guiPos = guiTable[yearGanIdx];
  const yuePos = yueTable[yearGanIdx];
  
  if (!placements.has(guiPos)) placements.set(guiPos, []);
  placements.get(guiPos)!.push("천괴");
  
  if (!placements.has(yuePos)) placements.set(yuePos, []);
  placements.get(yuePos)!.push("천월");
  
  return placements;
}

// ─── 화성·영성 배치 (년지 기준) ───
function placeHuoLingStars(yearBranchIdx: number, birthHourBranch: number): Map<number, AuxiliaryStar[]> {
  const placements = new Map<number, AuxiliaryStar[]>();
  
  // 년지 삼합 기준 화성 시작궁
  // 인오술(2,6,10)→축(1), 신자진(8,0,4)→인(2), 사유축(5,9,1)→묘(3), 해묘미(11,3,7)→유(9)
  let huoStart: number;
  if ([2, 6, 10].includes(yearBranchIdx)) huoStart = 1;
  else if ([8, 0, 4].includes(yearBranchIdx)) huoStart = 2;
  else if ([5, 9, 1].includes(yearBranchIdx)) huoStart = 3;
  else huoStart = 9; // 해묘미
  
  // 년지 삼합 기준 영성 시작궁
  // 인오술→술(10), 신자진→술(10), 사유축→술(10), 해묘미→술(10)
  // 영성은 모든 경우 戌(10)에서 시작하여 시지만큼 순행
  const lingStart = 10;
  
  const huoPos = (huoStart + birthHourBranch) % 12;
  const lingPos = (lingStart + birthHourBranch) % 12;
  
  if (!placements.has(huoPos)) placements.set(huoPos, []);
  placements.get(huoPos)!.push("화성");
  
  if (!placements.has(lingPos)) placements.set(lingPos, []);
  placements.get(lingPos)!.push("영성");
  
  return placements;
}

// ─── 지공·지겁 배치 (시지 기준) ───
function placeKongJieStars(birthHourBranch: number): Map<number, AuxiliaryStar[]> {
  const placements = new Map<number, AuxiliaryStar[]>();
  
  // 지공(地空): 시지의 다음 궁 (순행 +1)
  const kongPos = (birthHourBranch + 1) % 12;
  // 지겁(地劫): 시지의 이전 궁 (역행 -1)
  const jiePos = (birthHourBranch - 1 + 12) % 12;
  
  if (!placements.has(kongPos)) placements.set(kongPos, []);
  placements.get(kongPos)!.push("지공");
  
  if (!placements.has(jiePos)) placements.set(jiePos, []);
  placements.get(jiePos)!.push("지겁");
  
  return placements;
}

// ─── 삼방사정(三方四正) 관계 계산 ───
// 본궁(palaceIdx) 기준:
//   대궁(對宮): +6 (맞은편)
//   삼합궁1: +4
//   삼합궁2: +8
// 반환: { opposite: number, trine1: number, trine2: number }
function getSanFangSiZheng(palaceIdx: number): {
  opposite: number;  // 대궁
  trine1: number;    // 삼합궁1
  trine2: number;    // 삼합궁2
} {
  return {
    opposite: (palaceIdx + 6) % 12,
    trine1: (palaceIdx + 4) % 12,
    trine2: (palaceIdx + 8) % 12,
  };
}

// ─── 삼방사정 별 수집 ───
// 본궁 + 대궁 + 삼합궁1 + 삼합궁2 에 있는 모든 별을 수집
function collectSanFangStars(
  palaceIdx: number,
  starMap: Map<number, (MajorStar | AuxiliaryStar)[]>
): {
  mainStars: (MajorStar | AuxiliaryStar)[];
  oppositeStars: (MajorStar | AuxiliaryStar)[];
  trine1Stars: (MajorStar | AuxiliaryStar)[];
  trine2Stars: (MajorStar | AuxiliaryStar)[];
  allStars: (MajorStar | AuxiliaryStar)[];
} {
  const sf = getSanFangSiZheng(palaceIdx);
  const mainStars = starMap.get(palaceIdx) || [];
  const oppositeStars = starMap.get(sf.opposite) || [];
  const trine1Stars = starMap.get(sf.trine1) || [];
  const trine2Stars = starMap.get(sf.trine2) || [];
  return {
    mainStars,
    oppositeStars,
    trine1Stars,
    trine2Stars,
    allStars: [...mainStars, ...oppositeStars, ...trine1Stars, ...trine2Stars],
  };
}

// ─── 별 밝기 판단 ───
// ─── 묘왕득함 밝기 테이블 (14주성 × 12궁) ───
// 인덱스: 0=자, 1=축, 2=인, 3=묘, 4=진, 5=사, 6=오, 7=미, 8=신, 9=유, 10=술, 11=해
const BRIGHTNESS_TABLE: Record<MajorStar, StarBrightness[]> = {
  자미: ["왕", "왕", "득지", "득지", "묘", "평화", "묘", "묘", "득지", "득지", "평화", "평화"],
  천기: ["득지", "득지", "묘", "묘", "평화", "왕", "평화", "평화", "묘", "묘", "함지", "왕"],
  태양: ["함지", "평화", "왕", "묘", "묘", "왕", "묘", "득지", "평화", "함지", "함지", "낙함"],
  무곡: ["왕", "묘", "득지", "평화", "평화", "묘", "왕", "묘", "득지", "평화", "평화", "득지"],
  천동: ["평화", "평화", "묘", "평화", "평화", "왕", "함지", "득지", "득지", "평화", "평화", "왕"],
  염정: ["평화", "묘", "평화", "함지", "득지", "묘", "평화", "함지", "평화", "왕", "득지", "평화"],
  천부: ["득지", "묘", "득지", "평화", "묘", "득지", "왕", "묘", "득지", "평화", "묘", "득지"],
  태음: ["왕", "묘", "함지", "함지", "평화", "낙함", "함지", "평화", "득지", "묘", "왕", "묘"],
  탐랑: ["왕", "평화", "묘", "평화", "평화", "왕", "평화", "득지", "묘", "득지", "평화", "묘"],
  거문: ["묘", "평화", "묘", "왕", "득지", "평화", "묘", "평화", "묘", "왕", "득지", "평화"],
  천상: ["득지", "묘", "평화", "평화", "묘", "득지", "득지", "묘", "평화", "평화", "묘", "득지"],
  천량: ["묘", "평화", "묘", "왕", "평화", "왕", "득지", "평화", "묘", "득지", "평화", "묘"],
  칠살: ["묘", "평화", "왕", "득지", "평화", "묘", "묘", "평화", "왕", "득지", "평화", "묘"],
  파군: ["평화", "평화", "묘", "왕", "평화", "평화", "묘", "평화", "평화", "왕", "평화", "득지"],
};

const AUX_BRIGHTNESS_TABLE: Record<string, StarBrightness[]> = {
  좌보: ["묘","득지","왕","묘","득지","평화","묘","득지","왕","묘","득지","평화"],
  우필: ["묘","득지","왕","묘","득지","평화","묘","득지","왕","묘","득지","평화"],
  문창: ["평화","득지","묘","왕","득지","묘","평화","함지","평화","왕","득지","묘"],
  문곡: ["평화","득지","묘","왕","득지","묘","평화","함지","평화","왕","득지","묘"],
  록존: ["왕","왕","왕","왕","왕","왕","왕","왕","왕","왕","왕","왕"],
  천괴: ["왕","왕","왕","왕","왕","왕","왕","왕","왕","왕","왕","왕"],
  천월: ["왕","왕","왕","왕","왕","왕","왕","왕","왕","왕","왕","왕"],
  경양: ["함지","함지","묘","평화","함지","묘","함지","함지","묘","평화","함지","묘"],
  타라: ["함지","묘","함지","함지","묘","평화","함지","묘","함지","함지","묘","평화"],
  화성: ["평화","평화","묘","평화","평화","묘","평화","평화","묘","평화","평화","묘"],
  영성: ["평화","평화","묘","평화","평화","묘","평화","평화","묘","평화","평화","묘"],
  지공: ["평화","평화","평화","평화","평화","평화","평화","평화","평화","평화","평화","평화"],
  지겁: ["평화","평화","평화","평화","평화","평화","평화","평화","평화","평화","평화","평화"],
};

function getStarBrightness(star: MajorStar, palaceIdx: number): StarBrightness {
  const table = BRIGHTNESS_TABLE[star];
  if (table) {
    return table[palaceIdx % 12];
  }
  return "평화"; // fallback
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

// ─── 보조성 의미 ───
const AUX_STAR_MEANINGS: Record<string, string> = {
  좌보: "귀인 조력, 보좌, 인복",
  우필: "귀인 조력, 내조, 협력",
  문창: "학문, 시험, 문서, 총명",
  문곡: "예술, 구변, 재능, 감성",
  록존: "정재, 안정적 재물, 봉급",
  천괴: "양귀인, 시험운, 승진",
  천월: "음귀인, 도움, 질병해소",
  경양: "공격, 시비, 수술, 결단",
  타라: "지연, 방해, 암투, 인내",
  화성: "급변, 폭발, 단기성과",
  영성: "은밀한 변화, 지구력",
  지공: "공망, 허탈, 종교성",
  지겁: "손재, 투기, 도박성",
};

// ─── 성조합(星組合) 패턴 테이블 ───
interface StarCombination {
  name: string;           // 조합명
  stars: string[];        // 필수 별 목록 (동궁 또는 삼방 내)
  scope: "same" | "sanfang"; // same=동궁, sanfang=삼방사정 범위
  condition?: (brightness: Map<string, StarBrightness>) => boolean;
  interpretation: string;
  rating: "상길" | "중길" | "소길" | "중흉" | "대흉" | "양면";
}

const STAR_COMBINATIONS: StarCombination[] = [
  // ─── 대길 조합 ───
  { name: "자부동궁", stars: ["자미","천부"], scope: "same",
    interpretation: "제왕의 격. 리더십과 재물 관리력이 동시에 극대화. 부귀 겸비의 명.",
    rating: "상길" },
  { name: "자미좌우", stars: ["자미","좌보","우필"], scope: "sanfang",
    interpretation: "군신경회. 자미가 좌보·우필의 보좌를 받아 권력과 인복이 매우 강함.",
    rating: "상길" },
  { name: "일월병명", stars: ["태양","태음"], scope: "same",
    interpretation: "일월병명격. 태양과 태음이 동궁하여 음양 조화가 완벽. 명예와 재물 모두 풍족.",
    rating: "상길" },
  { name: "기월동량", stars: ["천기","태음","천동","천량"], scope: "sanfang",
    interpretation: "기월동량격. 지혜·재물·복록·수명이 삼방에 모여 공직이나 전문직에 특히 유리.",
    rating: "상길" },
  { name: "부귀쌍전", stars: ["록존","천괴","천월"], scope: "sanfang",
    interpretation: "귀인과 재물이 삼방에 모여 평생 귀인의 도움이 끊이지 않음.",
    rating: "상길" },
  { name: "문성암합", stars: ["문창","문곡"], scope: "same",
    interpretation: "문창문곡 동궁. 학문과 예술적 재능이 뛰어나며 시험운이 극히 좋음.",
    rating: "상길" },
  { name: "무곡천부", stars: ["무곡","천부"], scope: "same",
    interpretation: "재물의 창고와 칼이 만남. 사업 수완이 뛰어나고 재물 축적력이 강함.",
    rating: "상길" },
  { name: "자미천상", stars: ["자미","천상"], scope: "same",
    interpretation: "인(印)을 얻은 임금. 관록과 문서운이 뛰어나며 공직에 대길.",
    rating: "상길" },

  // ─── 양면 조합 (살파랑 계열) ───
  { name: "살파랑", stars: ["칠살","파군","탐랑"], scope: "sanfang",
    interpretation: "살파랑격. 파란만장하고 변화무쌍한 인생. 큰 성공과 큰 실패를 반복할 수 있으나, 별 밝기가 좋으면 대성.",
    rating: "양면" },
  { name: "칠살독좌", stars: ["칠살"], scope: "same",
    interpretation: "칠살 단독 좌정. 결단력과 독립성이 강하나 고독하며 변혁적 인생을 살게 됨.",
    rating: "양면" },
  { name: "파군독좌", stars: ["파군"], scope: "same",
    interpretation: "파군 단독 좌정. 개척자적 기질. 파괴 후 재건의 능력이 있으나 불안정.",
    rating: "양면" },
  { name: "염정탐랑", stars: ["염정","탐랑"], scope: "same",
    interpretation: "염정·탐랑 동궁. 매력과 욕망이 강렬. 연예·예술에 재능이 있으나 감정 통제가 관건.",
    rating: "양면" },
  { name: "무곡탐랑", stars: ["무곡","탐랑"], scope: "same",
    interpretation: "재물과 욕망의 결합. 사업 추진력이 강하나 투기성에 주의.",
    rating: "양면" },

  // ─── 흉 조합 ───
  { name: "화영협공", stars: ["화성","영성"], scope: "sanfang",
    interpretation: "화성·영성이 삼방에서 협공. 급변과 사고의 위험이 높으며 감정 폭발에 주의.",
    rating: "중흉" },
  { name: "양타협공", stars: ["경양","타라"], scope: "sanfang",
    interpretation: "양인·타라 협공. 시비와 방해가 끊이지 않으며 수술이나 법적 분쟁 가능.",
    rating: "중흉" },
  { name: "공겁협", stars: ["지공","지겁"], scope: "sanfang",
    interpretation: "지공·지겁이 본궁 또는 삼방에 동시 출현. 재물 손실과 허탈감에 주의. 종교나 철학에 적합.",
    rating: "중흉" },
  { name: "화기입명", stars: [], scope: "same",
    interpretation: "화기가 명궁에 입함. 일생 장애와 집착의 패턴이 반복되므로 의식적 전환이 필요.",
    rating: "대흉" },
  { name: "록존타라", stars: ["록존","타라"], scope: "same",
    interpretation: "재물은 있으나 방해가 심함. 돈은 벌지만 지키기 어려움.",
    rating: "중흉" },
  { name: "거문화기", stars: ["거문"], scope: "same",
    interpretation: "거문+화기. 구설과 시비가 심하며 법적 문제에 취약.",
    rating: "대흉" },
];

// ─── 격국(格局) 판단 엔진 ───
interface GeokGuk {
  name: string;
  grade: "상격" | "중격" | "하격";
  description: string;
  breakConditions: string[];
}

function detectStarCombinations(
  palaceIdx: number,
  starMap: Map<number, (MajorStar | AuxiliaryStar)[]>,
  palaceTransformations?: Transformation[]
): { combination: StarCombination; matched: string[] }[] {
  const results: { combination: StarCombination; matched: string[] }[] = [];
  const mainStars = starMap.get(palaceIdx) || [];
  const sf = collectSanFangStars(palaceIdx, starMap);

  for (const combo of STAR_COMBINATIONS) {
    // 특수 케이스: 화기입명 (사화 조건)
    if (combo.name === "화기입명") {
      if (palaceTransformations?.some(t => t.type === "화기")) {
        results.push({ combination: combo, matched: ["화기"] });
      }
      continue;
    }
    // 특수 케이스: 거문화기 (거문 + 화기 조건)
    if (combo.name === "거문화기") {
      if (mainStars.includes("거문") && palaceTransformations?.some(t => t.type === "화기")) {
        results.push({ combination: combo, matched: ["거문", "화기"] });
      }
      continue;
    }

    if (combo.stars.length === 0) continue;

    const searchPool = combo.scope === "same" ? mainStars : sf.allStars;
    const matched = combo.stars.filter(s => searchPool.includes(s as any));

    if (matched.length === combo.stars.length) {
      results.push({ combination: combo, matched });
    }
  }

  return results;
}

function detectGeokGuk(
  mingGongIdx: number,
  starMap: Map<number, (MajorStar | AuxiliaryStar)[]>,
  natalTransformations: Transformation[],
  bureau: Bureau
): GeokGuk[] {
  const results: GeokGuk[] = [];
  const mingStars = starMap.get(mingGongIdx) || [];
  const sf = collectSanFangStars(mingGongIdx, starMap);
  const hasHuaJiInMing = natalTransformations.some(t => t.type === "화기" && t.palace === "명궁");
  const hasHuaLuInMing = natalTransformations.some(t => t.type === "화록" && t.palace === "명궁");

  // 1. 자부동궁격
  if (mingStars.includes("자미") && mingStars.includes("천부")) {
    results.push({
      name: "자부동궁격",
      grade: hasHuaJiInMing ? "중격" : "상격",
      description: "자미와 천부가 명궁에 동궁. 제왕의 기품과 재물 관리력을 겸비한 최상격.",
      breakConditions: hasHuaJiInMing ? ["화기 입명으로 격이 깨짐"] : [],
    });
  }

  // 2. 살파랑격
  const hasSha = sf.allStars.includes("칠살");
  const hasPo = sf.allStars.includes("파군");
  const hasTan = sf.allStars.includes("탐랑");
  if (hasSha && hasPo && hasTan) {
    const bright = mingStars.some(s =>
      BRIGHTNESS_TABLE[s as MajorStar]?.[mingGongIdx] === "묘" ||
      BRIGHTNESS_TABLE[s as MajorStar]?.[mingGongIdx] === "왕"
    );
    results.push({
      name: "살파랑격",
      grade: bright ? "중격" : "하격",
      description: "칠살·파군·탐랑이 삼방에 포진. 파란만장한 인생이나 별이 밝으면 대업 가능.",
      breakConditions: !bright ? ["주성이 함지/낙함으로 격이 약화"] : [],
    });
  }

  // 3. 기월동량격
  const qyStars = ["천기","태음","천동","천량"];
  const qyCount = qyStars.filter(s => sf.allStars.includes(s as any)).length;
  if (qyCount >= 3) {
    results.push({
      name: "기월동량격",
      grade: qyCount === 4 ? "상격" : "중격",
      description: "기월동량 삼방회합. 공직·전문직·학술에 뛰어난 격국.",
      breakConditions: qyCount < 4 ? ["4성 중 일부 부재"] : [],
    });
  }

  // 4. 일월병명격
  if (mingStars.includes("태양") && mingStars.includes("태음")) {
    results.push({
      name: "일월병명격",
      grade: "상격",
      description: "태양·태음 명궁 동좌. 음양 완벽 조화의 귀격.",
      breakConditions: [],
    });
  }

  // 5. 문성귀격
  if (mingStars.includes("문창") && mingStars.includes("문곡")) {
    results.push({
      name: "문성귀격",
      grade: hasHuaJiInMing ? "하격" : "상격",
      description: "문창·문곡 명궁 동좌. 학문과 예술의 극치.",
      breakConditions: hasHuaJiInMing ? ["화기로 인한 격파"] : [],
    });
  }

  // 6. 부귀격 (록존 + 천괴 or 천월 명궁/삼방)
  const hasLuCun = sf.allStars.includes("록존");
  const hasGui = sf.allStars.includes("천괴") || sf.allStars.includes("천월");
  if (hasLuCun && hasGui && hasHuaLuInMing) {
    results.push({
      name: "부귀격",
      grade: "상격",
      description: "록존+귀인+화록이 명궁/삼방에 집합. 평생 귀인복과 재물운이 강한 부귀격.",
      breakConditions: [],
    });
  }

  // 7. 공겁격 (지공+지겁 명궁)
  if (mingStars.includes("지공") && mingStars.includes("지겁")) {
    results.push({
      name: "공겁격",
      grade: "하격",
      description: "지공·지겁이 명궁에 동좌. 물질보다 정신 세계에 적합. 종교·철학·예술에 인연.",
      breakConditions: ["물질적 성공에 불리"],
    });
  }

  return results;
}

// ─── 사화 계산 (생년 천간 기준) ───
function calculateNatalTransformations(
  yearGanIdx: number,
  starMap: Map<number, (MajorStar | AuxiliaryStar)[]>,
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
        const palaceOffset = ((mingGongIdx - posIdx) % 12 + 12) % 12;
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
  starMap: Map<number, (MajorStar | AuxiliaryStar)[]>
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
    const palaceIdx = ((mingGongIdx + direction * i) % 12 + 12) % 12;
    const palaceOffset = ((mingGongIdx - palaceIdx) % 12 + 12) % 12;
    const palace = PALACES[palaceOffset];
    const branch = BRANCHES[palaceIdx];

    const starsInPalace = starMap.get(palaceIdx) || [];
    const starPlacements: StarPlacement[] = starsInPalace.map((star) => ({
      star,
      palace,
      brightness: BRIGHTNESS_TABLE[star as MajorStar]
        ? getStarBrightness(star as MajorStar, palaceIdx)
        : (AUX_BRIGHTNESS_TABLE[star]?.[palaceIdx % 12] ?? "평화"),
      description: STAR_MEANINGS[star as MajorStar]?.positive
        ?? AUX_STAR_MEANINGS[star as string]
        ?? "",
    }));

    // 대한 사화: 대한 궁의 천간으로 계산
    const periodStem = getPalaceGan(yearGanIdx, palaceIdx);
    const periodTable = TRANSFORMATION_TABLE[periodStem];
    const periodTransformations: Transformation[] = [];

    if (periodTable) {
      for (const type of ["화록", "화권", "화과", "화기"] as TransformationType[]) {
        const targetStar = periodTable[type];
        for (const [posIdx, stars] of starMap.entries()) {
          if (stars.includes(targetStar)) {
            const tPalaceOffset = ((mingGongIdx - posIdx) % 12 + 12) % 12;
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
  const age = currentYear - birthYear + 1; // 한국 나이

  // 소한 시작궁: 생년 지지 기준
  // 자년생→진(4), 축년생→사(5), 인년생→오(6), 묘년생→미(7),
  // 진년생→신(8), 사년생→유(9), 오년생→술(10), 미년생→해(11),
  // 신년생→자(0), 유년생→축(1), 술년생→인(2), 해년생→묘(3)
  const yearBranchIdx = (birthYear - 4) % 12;
  const xiaoXianStart = (yearBranchIdx + 4) % 12;

  // 순역행 판단
  const isYangStem = yearGanIdx % 2 === 0;
  const isForward = (gender === "male" && isYangStem) || (gender === "female" && !isYangStem);
  const direction = isForward ? 1 : -1;

  // 나이에 따른 궁 이동 (1세 = 시작궁, 2세 = 다음궁, ...)
  const palaceIdx = ((xiaoXianStart + direction * (age - 1)) % 12 + 12) % 12;
  const palaceOffset = ((mingGongIdx - palaceIdx) % 12 + 12) % 12;
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
    interpretation: `올해(${age}세) 소한: ${palace}(${branch}궁) → ${palaceContext[palace]}에 에너지가 집중되는 해.`,
  };
}

// ─── 궁위별 해석 (사화 포함) ───
function interpretPalace(
  palaceName: PalaceName,
  stars: StarPlacement[],
  transformations: Transformation[],
  isShenGong: boolean = false,
  starMap?: Map<number, (MajorStar | AuxiliaryStar)[]>,
  palaceIdx?: number
): string {
  let interpretation = "";

  if (isShenGong) {
    interpretation += `[신궁(身宮)] 후천적 자아와 행동 패턴을 나타냅니다. `;
  }

  // 주성 해석
  for (const sp of stars) {
    if (STAR_MEANINGS[sp.star as MajorStar]) {
      const meaning = STAR_MEANINGS[sp.star as MajorStar];
      const brightnessNote =
        sp.brightness === "묘" || sp.brightness === "왕"
          ? `(${sp.brightness} - 매우 강력)`
          : sp.brightness === "함지" || sp.brightness === "낙함"
          ? `(${sp.brightness} - 힘이 약함)`
          : `(${sp.brightness})`;
      interpretation += `${sp.star}${brightnessNote}: ${meaning.positive}. `;
      if (sp.brightness === "함지" || sp.brightness === "낙함") {
        interpretation += `주의: ${meaning.negative}. `;
      }
    } else if (AUX_STAR_MEANINGS[sp.star]) {
      interpretation += `${sp.star}: ${AUX_STAR_MEANINGS[sp.star]}. `;
    }
  }

  // 사화 해석
  for (const t of transformations) {
    interpretation += `${t.description}. `;
  }

  // ── 삼방사정 분석 (신규) ──
  if (starMap && palaceIdx !== undefined) {
    const sf = getSanFangSiZheng(palaceIdx);
    const oppositeStars = starMap.get(sf.opposite) || [];
    const trine1Stars = starMap.get(sf.trine1) || [];
    const trine2Stars = starMap.get(sf.trine2) || [];

    const hasSupport = (arr: (MajorStar | AuxiliaryStar)[]) =>
      arr.some(s => ["좌보","우필","천괴","천월","록존","문창","문곡"].includes(s));
    const hasKiller = (arr: (MajorStar | AuxiliaryStar)[]) =>
      arr.some(s => ["경양","타라","화성","영성","지공","지겁"].includes(s));

    if (oppositeStars.length > 0) {
      interpretation += `[대궁 ${BRANCHES[sf.opposite]}] ${oppositeStars.join(",")} 조회. `;
      if (hasSupport(oppositeStars)) {
        interpretation += "대궁에서 길성 조력이 들어옴. ";
      }
      if (hasKiller(oppositeStars)) {
        interpretation += "대궁 살성의 충격에 주의. ";
      }
    }

    const trineAll = [...trine1Stars, ...trine2Stars];
    if (trineAll.length > 0) {
      interpretation += `[삼합] ${BRANCHES[sf.trine1]}·${BRANCHES[sf.trine2]}궁에서 `;
      interpretation += `${trineAll.join(",")} 회조. `;
      if (hasSupport(trineAll)) {
        interpretation += "삼합 길성이 본궁을 보호하여 안정적. ";
      }
      if (hasKiller(trineAll)) {
        interpretation += "삼합 살성이 본궁에 압력을 가하므로 변동성 증가. ";
      }
    }

    // ── 성조합 패턴 분석 ──
    const combos = detectStarCombinations(palaceIdx, starMap, transformations);
    for (const { combination } of combos) {
      interpretation += `[${combination.name}(${combination.rating})] ${combination.interpretation} `;
    }
  }

  return interpretation || `${palaceName}의 기본적인 에너지가 작용합니다.`;
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

  // ─── 보조성 배치 ───
  const yearBranchIdx = (birthYear - 4) % 12;
  const auxMaps = [
    placeZuoBiStars(lunarMonth),
    placeMunStars(birthHourBranch),
    placeLuCunStars(yearGanIdx),
    placeGuiYueStars(yearGanIdx),
    placeHuoLingStars(yearBranchIdx, birthHourBranch),
    placeKongJieStars(birthHourBranch),
  ];
  
  const auxStarMap = new Map<number, AuxiliaryStar[]>();
  for (const m of auxMaps) {
    for (const [pos, stars] of m.entries()) {
      if (!auxStarMap.has(pos)) auxStarMap.set(pos, []);
      auxStarMap.get(pos)!.push(...stars);
    }
  }

  // 전체 별 맵 (사화 계산용: 주성 + 보조성)
  const totalStarMap = new Map<number, (MajorStar | AuxiliaryStar)[]>();
  for (const [pos, stars] of starMap.entries()) {
    totalStarMap.set(pos, [...stars]);
  }
  for (const [pos, stars] of auxStarMap.entries()) {
    if (!totalStarMap.has(pos)) totalStarMap.set(pos, []);
    totalStarMap.get(pos)!.push(...stars);
  }

  // 생년 사화
  const natalTransformations = calculateNatalTransformations(yearGanIdx, totalStarMap, mingGongIdx);

  // 궁위별 사화 매핑
  const palaceTransMap = new Map<string, Transformation[]>();
  for (const t of natalTransformations) {
    if (!palaceTransMap.has(t.palace)) palaceTransMap.set(t.palace, []);
    palaceTransMap.get(t.palace)!.push(t);
  }

  // 신궁 동궁 위치(shenGongPalace) 계산
  const shenGongOffset = ((mingGongIdx - shenGongIdx) % 12 + 12) % 12;
  const shenGongPalace = PALACES[shenGongOffset];

  // 12궁 구성
  const palaces: PalaceInfo[] = PALACES.map((name, idx) => {
    const palaceIdx = ((mingGongIdx - idx) % 12 + 12) % 12;
    const starsInPalace = starMap.get(palaceIdx) || [];
    const starPlacements: StarPlacement[] = starsInPalace.map((star) => ({
      star,
      palace: name,
      brightness: getStarBrightness(star, palaceIdx),
      description: STAR_MEANINGS[star].positive,
    }));

    // 보조성 추가
    const auxInPalace = auxStarMap.get(palaceIdx) || [];
    for (const auxStar of auxInPalace) {
      starPlacements.push({
        star: auxStar,
        palace: name,
        brightness: AUX_BRIGHTNESS_TABLE[auxStar]?.[palaceIdx % 12] ?? "평화",
        description: AUX_STAR_MEANINGS[auxStar] || "",
      });
    }

    const trans = palaceTransMap.get(name) || [];

    return {
      name,
      branch: BRANCHES[palaceIdx],
      stars: starPlacements,
      transformations: trans,
      interpretation: interpretPalace(name, starPlacements, trans, name === shenGongPalace, totalStarMap, palaceIdx),
    };
  });

  // 격국 판단
  const geokGuk = detectGeokGuk(mingGongIdx, totalStarMap, natalTransformations, bureau);

  // 12궁별 성조합 수집
  const allCombinations: { palace: string; name: string; rating: string; interpretation: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const palaceName = PALACES[i];
    const actualIdx = ((mingGongIdx - i) % 12 + 12) % 12;
    const palaceTransformations = natalTransformations.filter(t => t.palace === palaceName);
    const combos = detectStarCombinations(actualIdx, totalStarMap, palaceTransformations);
    for (const { combination } of combos) {
      allCombinations.push({
        palace: palaceName,
        name: combination.name,
        rating: combination.rating,
        interpretation: combination.interpretation,
      });
    }
  }

  // 대한
  const majorPeriods = calculateMajorPeriods(bureau, mingGongIdx, gender, yearGanIdx, totalStarMap);
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
    shenGongPalace,
    bureau,
    palaces,
    lifeStructure,
    keyInsights,
    natalTransformations,
    majorPeriods,
    currentMajorPeriod,
    currentMinorPeriod,
    periodAnalysis,
    starCombinations: allCombinations,
    geokGuk,
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

  // ── 삼방사정 컨텍스트 추가 ──
  if (idx !== undefined) {
    const targetPalace = ziwei.palaces[idx];
    const branchIdx = BRANCHES.indexOf(targetPalace.branch);
    if (branchIdx >= 0) {
      const sfInfo = getSanFangSiZheng(branchIdx);
      const oppPalace = ziwei.palaces.find(p => p.branch === BRANCHES[sfInfo.opposite]);
      const tri1Palace = ziwei.palaces.find(p => p.branch === BRANCHES[sfInfo.trine1]);
      const tri2Palace = ziwei.palaces.find(p => p.branch === BRANCHES[sfInfo.trine2]);
      
      let sfSummary = "\n[삼방사정 분석] ";
      if (oppPalace) {
        sfSummary += `대궁(${oppPalace.name}/${oppPalace.branch}): ${oppPalace.stars.map(s=>s.star).join(",") || "공궁"}. `;
      }
      if (tri1Palace && tri2Palace) {
        sfSummary += `삼합(${tri1Palace.name}/${tri1Palace.branch}, ${tri2Palace.name}/${tri2Palace.branch}): `;
        sfSummary += `${[...tri1Palace.stars, ...tri2Palace.stars].map(s=>s.star).join(",") || "없음"}.`;
      }
      result += sfSummary;
    }
  }

  // 격국 요약 추가
  if (ziwei.geokGuk && ziwei.geokGuk.length > 0) {
    result += "\n[격국 분석] ";
    for (const g of ziwei.geokGuk) {
      result += `${g.name}(${g.grade}): ${g.description} `;
      if (g.breakConditions.length > 0) {
        result += `파격조건: ${g.breakConditions.join(", ")}. `;
      }
    }
  }

  // 해당 궁 성조합 추가
  if (ziwei.starCombinations) {
    const targetPalaceName = idx !== undefined ? ziwei.palaces[idx].name : "";
    const relevantCombos = ziwei.starCombinations.filter(c => {
      // targetPalace에 해당하는 조합
      if (targetPalaceName && c.palace === targetPalaceName) return true;
      // 명궁 조합은 항상 포함
      if (c.palace === "명궁") return true;
      return false;
    });
    if (relevantCombos.length > 0) {
      result += "\n[성조합] ";
      for (const c of relevantCombos) {
        result += `${c.palace} ${c.name}(${c.rating}): ${c.interpretation} `;
      }
    }
  }

  return result;
}

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
      brightness: getStarBrightness(star, palaceIdx),
      description: STAR_MEANINGS[star].positive,
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
  const age = currentYear - birthYear + 1; // 한국 나이 (Korean age)
  // 소한 궁위: 명궁에서 나이만큼 이동 (성별/음양에 따라 방향)
  const isYangStem = yearGanIdx % 2 === 0;
  const isForward = (gender === "male" && isYangStem) || (gender === "female" && !isYangStem);
  const direction = isForward ? 1 : -1;
  const palaceIdx = ((mingGongIdx + direction * (age % 12)) % 12 + 12) % 12;
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

  // ─── 보조성 배치 ───
  const yearBranchIdx = (birthYear - 4) % 12;
  const auxMaps = [
    placeZuoBiStars(lunarMonth),
    placeMunStars(birthHourBranch),
    placeLuCunStars(yearGanIdx),
    placeGuiYueStars(yearGanIdx),
    placeHuoLingStars(yearBranchIdx, birthHourBranch),
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
        brightness: "평화", // 보조성 밝기는 Phase 3에서 정밀화
        description: AUX_STAR_MEANINGS[auxStar] || "",
      });
    }

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

  // 신궁 동궁 위치(shenGongPalace) 계산
  const shenGongOffset = ((mingGongIdx - shenGongIdx) % 12 + 12) % 12;
  const shenGongPalace = PALACES[shenGongOffset];

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

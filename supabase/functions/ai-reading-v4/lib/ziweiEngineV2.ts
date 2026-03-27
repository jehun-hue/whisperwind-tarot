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
export type ShenSha = "겁살" | "재살" | "천살" | "지살" | "년살" | "월살" | "망신살" | "장성살" | "반안살" | "역마살" | "육해살" | "화개살";


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
  palaceIdx: number;
  transformations: Transformation[];
  stars: StarPlacement[];
  tripleOverlap: {
    natalHits: string[];    // 본명사화와 겹침
    dahanHits: string[];    // 대한사화와 겹침
    flowYearHits: string[]; // 유년사화와 겹침
    severity: "길" | "평" | "흉" | "대흉";
    summary: string;
  };
  interpretation: string;
}

// ─── 궁간사화 (Flying Star) ───
export interface FlyingResult {
  fromPalace: string;
  toPalace: string;
  type: TransformationType;
  star: string;
  meaning: string;
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
  shenSha: string[];
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
  currentMinorPeriod: MinorPeriod | null;
  periodAnalysis: string;

  // Tier 2: Chart Type
  chartType: {
    name: string;
    code: string;
    description: string;
    strengths: string[];
    weaknesses: string[];
  };

  // Tier 2: Palace Flying Si Hua (Flying Star)
  palaceFlyingSiHua: {
    palace: string;
    stem: string;
    flights: FlyingResult[];
  }[];

  // 격국 분석 (2단계 추가)
  starCombinations: { palace: string; name: string; rating: string; interpretation: string }[];
  geokGuk: { name: string; grade: string; description: string; breakConditions: string[] }[];

  // 유년 분석 (3단계 추가)
  currentYearAnalysis: {
    year: number;
    yearStem: string;
    yearBranch: string;
    flowYearTransformations: Transformation[];
    dahanOverlap: string[];   // 대한사화와 유년사화 겹침
    natalOverlap: string[];   // 본명사화와 유년사화 겹침
    interpretation: string;
  } | null;
  // 종합 점수 (Stage 5)
  overallScore: {
    total: number;          // 0~100
    categories: {
      name: string;         // "재물", "직업", "연애", "건강", "인간관계"
      score: number;        // 0~100
      summary: string;
    }[];
    grade: string;          // "S", "A", "B", "C", "D"
    oneLineSummary: string; // 한줄 요약
  };
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

const SHEN_SHA_MEANINGS: Record<string, string> = {
  // ── 12신살 (placeShenShaStars) ──
  겁살: "급변, 사고, 도난, 손재",
  재살: "재물 손실, 도둑, 분쟁",
  천살: "천재지변, 예측불가 사고",
  지살: "부동산 문제, 기반 흔들림",
  년살: "연간 반복 액운, 만성적 장애",
  월살: "월간 기복, 소소한 방해",
  망신살: "명예 실추, 구설, 창피",
  장성살: "학문 성취, 문서 길함",
  반안살: "안장에 오름, 승진, 발탁",
  역마살: "이사, 전직, 여행, 변동",
  육해살: "가까운 사람과의 갈등, 배신",
  화개살: "종교, 예술, 고독, 영성",
  // ── 특수 신살 (placeSpecialShenSha) ──
  천마: "이동, 변동, 해외, 출장운",
  홍란: "연애, 결혼, 이성 인연",
  천희: "경사, 임신, 기쁜 소식",
  천형: "수술, 형벌, 법적 분쟁, 의료",
  천요: "질병, 약물, 기이한 인연",
  도화: "이성 매력, 색정, 인기, 예술",
  천덕: "하늘의 도움, 재난 해소, 귀인",
  월덕: "매월 귀인, 흉함 완화",
  천공: "공상, 허망, 종교성, 이상주의",
};


// ─── 신살(ShenSha) 배치 (연지 기준 12신살) ───

function placeShenShaStars(yearBranchIdx: number): Map<number, ShenSha[]> {
  const shenShaMap = new Map<number, ShenSha[]>();
  const names: ShenSha[] = ["겁살", "재살", "천살", "지살", "년살", "월살", "망신살", "장성살", "반안살", "역마살", "육해살", "화개살"];

  // 삼합(Triad) 기준 겁살(劫殺) 시작 위치
  // 인오술(火) -> 해(亥: 11)
  // 사유축(金) -> 인(寅: 2)
  // 신자진(水) -> 사(巳: 5)
  // 해묘미(木) -> 신(申: 8)
  const baseMap: Record<number, number> = {
    2: 11, 6: 11, 10: 11, // 인, 오, 술 -> 해
    5: 2, 9: 2, 1: 2,    // 사, 유, 축 -> 인
    8: 5, 0: 5, 4: 5,    // 신, 자, 진 -> 사
    11: 8, 3: 8, 7: 8,   // 해, 묘, 미 -> 신
  };

  const startIdx = baseMap[yearBranchIdx % 12] ?? 11;
  for (let i = 0; i < 12; i++) {
    const pos = (startIdx + i) % 12;
    if (!shenShaMap.has(pos)) shenShaMap.set(pos, []);
    shenShaMap.get(pos)!.push(names[i]);
  }
  return shenShaMap;
}

function placeSpecialShenSha(
  yearBranchIdx: number,
  lunarMonth: number,
  birthHourBranch: number
): Map<number, string[]> {
  const map = new Map<number, string[]>();
  const add = (pos: number, name: string) => {
    const p = ((pos % 12) + 12) % 12;
    if (!map.has(p)) map.set(p, []);
    map.get(p)!.push(name);
  };

  // 천마(天馬) — 연지 기준
  // 인오술→신(8), 사유축→해(11), 신자진→인(2), 해묘미→사(5)
  const tianMaTable: Record<number, number> = {
    2:8, 6:8, 10:8,   // 인오술→신
    5:11, 9:11, 1:11,  // 사유축→해
    8:2, 0:2, 4:2,     // 신자진→인
    11:5, 3:5, 7:5,    // 해묘미→사
  };
  add(tianMaTable[yearBranchIdx] ?? 8, "천마");

  // 도화(桃花) — 연지 기준
  // 인오술→묘(3), 사유축→오(6), 신자진→유(9), 해묘미→자(0)
  const doHwaTable: Record<number, number> = {
    2:3, 6:3, 10:3,
    5:6, 9:6, 1:6,
    8:9, 0:9, 4:9,
    11:0, 3:0, 7:0,
  };
  add(doHwaTable[yearBranchIdx] ?? 3, "도화");

  // 홍란(紅鸞) — 연지 기준: 卯(3)에서 연지만큼 역행
  const hongLanPos = (3 - yearBranchIdx + 12) % 12;
  add(hongLanPos, "홍란");

  // 천희(天喜) — 홍란 대궁(+6)
  add((hongLanPos + 6) % 12, "천희");

  // 천형(天刑) — 월 기준: 酉(9)에서 월만큼 순행
  add((9 + lunarMonth - 1) % 12, "천형");

  // 천요(天姚) — 월 기준: 丑(1)에서 월만큼 순행
  add((1 + lunarMonth - 1) % 12, "천요");

  // 천덕(天德) — 월 기준
  // 정월→酉(9), 2월→戌(10), 3월→亥(11), 4월→子(0) … 순행
  add((9 + lunarMonth - 1) % 12, "천덕");

  // 월덕(月德) — 월 기준: 巳(5)에서 월만큼 순행
  add((5 + lunarMonth - 1) % 12, "월덕");

  // 천공(天空) — 시지 기준: 시지+1
  add((birthHourBranch + 1) % 12, "천공");

  return map;
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

// ─── Tier 2: 격국 유형 분류 (Chart Type) ───
function classifyChartType(
  mingGongIdx: number,
  starMap: Map<number, (MajorStar | AuxiliaryStar)[]>
): ZiWeiResult['chartType'] {
  const sf = collectSanFangStars(mingGongIdx, starMap);
  const allMajorStars = sf.allStars.filter(s => (MAJOR_STARS as readonly string[]).includes(s));

  // 1. 살파랑 (SPL)
  const splStars = ["칠살", "파군", "탐랑"];
  const splCount = allMajorStars.filter(s => splStars.includes(s)).length;
  if (splCount >= 2) {
    return {
      code: "SPL",
      name: "살파랑",
      description: "도전과 변혁을 추구하는 역동적 명반",
      strengths: ["강한 추진력", "위기 대처 능력", "변화 적응력"],
      weaknesses: ["인내심 부족", "인간관계 마찰", "안정감 결여"],
    };
  }

  // 2. 기월동량 (GYTL)
  const gytlStars = ["천기", "태음", "천동", "천량"];
  const gytlCount = allMajorStars.filter(s => gytlStars.includes(s)).length;
  if (gytlCount >= 3) {
    return {
      code: "GYTL",
      name: "기월동량",
      description: "안정과 지식을 중시하는 전문직형 명반",
      strengths: ["분석력", "꾸준함", "전문성"],
      weaknesses: ["결단력 부족", "보수적 성향", "모험 회피"],
    };
  }

  // 3. 자부 (JB)
  const jbStars = ["자미", "천부"];
  const jbCount = allMajorStars.filter(s => jbStars.includes(s)).length;
  if (jbCount >= 1) {
    return {
      code: "JB",
      name: "자부",
      description: "리더십과 품격을 갖춘 중심형 명반",
      strengths: ["리더십", "포용력", "격조"],
      weaknesses: ["자존심 과잉", "위임 어려움", "고독감"],
    };
  }

  // 4. 혼합형 (MIX)
  return {
    code: "MIX",
    name: "혼합형",
    description: "다양한 에너지가 공존하는 다재다능형 명반",
    strengths: ["유연성", "다재다능", "적응력"],
    weaknesses: ["정체성 혼란", "집중력 분산", "방향 설정 어려움"],
  };
}

// ─── Tier 2: 궁간사화 (Flying Star) ───
function flyPalaceSiHua(
  palaceIdx: number,
  yearGanIdx: number,
  mingGongIdx: number,
  starPositionMap: Map<MajorStar | AuxiliaryStar, number>
): FlyingResult[] {
  const stem = getPalaceGan(yearGanIdx, palaceIdx);
  const table = TRANSFORMATION_TABLE[stem];
  if (!table) return [];

  const results: FlyingResult[] = [];
  const fromPalaceName = PALACES[((mingGongIdx - palaceIdx + 12) % 12)];

  for (const [type, star] of Object.entries(table)) {
    const targetPos = starPositionMap.get(star as any);
    if (targetPos !== undefined) {
      const toPalaceName = PALACES[((mingGongIdx - targetPos + 12) % 12)];
      const effect = TRANSFORMATION_MEANINGS[type as TransformationType].effect;
      results.push({
        fromPalace: fromPalaceName,
        toPalace: toPalaceName,
        type: type as TransformationType,
        star: star as string,
        meaning: `[${fromPalaceName}]의 [${stem}]간이 [${type}]을 [${toPalaceName}]으로 날림 → ${effect}`,
      });
    }
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
  gender: "male" | "female",
  mingGongIdx: number,
  yearGanIdx: number,
  bureau: Bureau,
  starMap: Map<number, (MajorStar | AuxiliaryStar)[]>,
  natalTransformations: Transformation[],
  majorPeriods: MajorPeriod[],
  currentYearAnalysis: ZiWeiResult['currentYearAnalysis']
): MinorPeriod | null {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear + 1; // 한국식 나이

  // 소한궁 위치: 남양순/음역행, 여양역/음순행
  const yearGan = STEMS[yearGanIdx];
  const isYangStem = yearGanIdx % 2 === 0;
  const isForward = (gender === "male" && isYangStem) || (gender === "female" && !isYangStem);

  // 소한궁 시작: 1세=명궁, 이후 순행/역행
  const direction = isForward ? 1 : -1;
  const palaceIdx = ((mingGongIdx + direction * (age - 1)) % 12 + 12) % 12;

  // 소한궁 천간
  const palaceGan = getPalaceGan(yearGanIdx, palaceIdx);
  const palaceOffset = ((mingGongIdx - palaceIdx + 12) % 12);
  const palaceName = PALACES[palaceOffset] || PALACES[0];

  // 소한궁 사화 계산
  const sohanTransformations: Transformation[] = [];
  if (TRANSFORMATION_TABLE[palaceGan]) {
    const table = TRANSFORMATION_TABLE[palaceGan];
    for (const [type, star] of Object.entries(table)) {
      // 해당 별이 어느 궁에 있는지 찾기
      for (const [pos, stars] of starMap.entries()) {
        if (stars.includes(star as any)) {
          const targetPalaceName = PALACES[((mingGongIdx - pos + 12) % 12)] || PALACES[0];
          const meaning = TRANSFORMATION_MEANINGS[type as TransformationType];
          sohanTransformations.push({
            type: type as TransformationType,
            star: star as MajorStar | AuxiliaryStar,
            palace: targetPalaceName,
            description: `소한 ${type}: ${star}→${targetPalaceName} (${meaning.effect})`,
          });
          break;
        }
      }
    }
  }

  // 소한궁 별 수집
  const starsInPalace = starMap.get(palaceIdx) || [];
  const starPlacements: StarPlacement[] = starsInPalace.map(star => {
    const isMajor = (MAJOR_STARS as readonly string[]).includes(star);
    const brightness = isMajor ? getStarBrightness(star as MajorStar, palaceIdx) : "평화" as StarBrightness;
    return {
      star: star as MajorStar | AuxiliaryStar,
      palace: palaceName,
      brightness,
      description: "",
    };
  });

  // 삼중 교차 분석
  const sohanStarSet = new Set(sohanTransformations.map(t => `${t.type}-${t.star}`));
  const natalStarSet = new Set(natalTransformations.map(t => `${t.type}-${t.star}`));

  // 현재 대한 찾기
  const currentDahan = majorPeriods.find(mp => age >= mp.startAge && age <= mp.endAge);
  const dahanStarSet = new Set((currentDahan?.transformations || []).map(t => `${t.type}-${t.star}`));

  // 유년사화
  const flowYearStarSet = new Set(
    (currentYearAnalysis?.flowYearTransformations || []).map(t => `${t.type}-${t.star}`)
  );

  const natalHits: string[] = [];
  const dahanHits: string[] = [];
  const flowYearHits: string[] = [];

  for (const key of sohanStarSet) {
    if (natalStarSet.has(key)) natalHits.push(key);
    if (dahanStarSet.has(key)) dahanHits.push(key);
    if (flowYearStarSet.has(key)) flowYearHits.push(key);
  }

  // 심각도 판정
  const totalOverlap = natalHits.length + dahanHits.length + flowYearHits.length;
  const hasHuaGi = [...sohanStarSet].some(k => k.startsWith("화기"));
  const multiHuaGi = [...sohanStarSet, ...dahanStarSet, ...flowYearStarSet]
    .filter(k => k.startsWith("화기")).length;

  let severity_final: "길" | "평" | "흉" | "대흉" = "평";
  if (multiHuaGi >= 3) severity_final = "대흉";
  else if (multiHuaGi >= 2 || (hasHuaGi && totalOverlap >= 2)) severity_final = "흉";
  else if (totalOverlap === 0 && !hasHuaGi) severity_final = "길";

  let summary = "";
  if (severity_final === "대흉") summary = "소한·대한·유년 화기 삼중 충돌 — 각별한 주의 필요";
  else if (severity_final === "흉") summary = "복수 화기 교차 — 건강·재물·인간관계 중 하나 이상에 시련";
  else if (severity_final === "길") summary = "소한궁 사화가 안정적 — 올해 무난한 흐름";
  else summary = "부분적 교차 있으나 관리 가능한 수준";

  // 해석 텍스트
  let interpretation = `${age}세 소한궁: ${palaceName}(${BRANCHES[palaceIdx]})`;
  if (starPlacements.length > 0) {
    interpretation += ` | 주성: ${starPlacements.map(s => s.star).join(",")}`;
  }
  if (sohanTransformations.length > 0) {
    interpretation += ` | 소한사화: ${sohanTransformations.map(t => `${t.type}(${t.star})`).join(",")}`;
  }
  if (natalHits.length > 0) interpretation += ` | ⚡본명교차: ${natalHits.join(",")}`;
  if (dahanHits.length > 0) interpretation += ` | ⚡대한교차: ${dahanHits.join(",")}`;
  if (flowYearHits.length > 0) interpretation += ` | ⚡유년교차: ${flowYearHits.join(",")}`;
  interpretation += ` | 판정: ${severity_final}`;

  return {
    age,
    palace: palaceName,
    branch: BRANCHES[palaceIdx],
    palaceIdx,
    transformations: sohanTransformations,
    stars: starPlacements,
    tripleOverlap: {
      natalHits,
      dahanHits,
      flowYearHits,
      severity: severity_final,
      summary,
    },
    interpretation,
  };
}


// ─── 유년(流年) 사화 계산 ───
function calculateFlowYearTransformations(
  currentYear: number,
  starMap: Map<number, (MajorStar | AuxiliaryStar)[]>,
  mingGongIdx: number
): Transformation[] {
  // 유년 천간 = 당해 연도의 천간
  const yearGanIdx = (currentYear - 4) % 10;
  const stem = STEMS[yearGanIdx];
  const table = TRANSFORMATION_TABLE[stem];
  if (!table) return [];

  const transformations: Transformation[] = [];
  const types: TransformationType[] = ["화록", "화권", "화과", "화기"];

  for (const type of types) {
    const targetStar = table[type];
    for (const [posIdx, stars] of starMap.entries()) {
      if (stars.includes(targetStar)) {
        const palaceOffset = ((mingGongIdx - posIdx) % 12 + 12) % 12;
        const palace = PALACES[palaceOffset];
        const meaning = TRANSFORMATION_MEANINGS[type];
        transformations.push({
          type,
          star: targetStar,
          palace,
          description: `유년${type}: ${targetStar} → ${palace}: ${meaning.effect}`,
        });
        break;
      }
    }
  }

  return transformations;
}

// ─── 대한·소한·유년·본명 교차 분석 ───
function analyzeYearCrossover(
  currentYear: number,
  birthYear: number,
  mingGongIdx: number,
  gender: "male" | "female",
  yearGanIdx: number,
  bureau: Bureau,
  starMap: Map<number, (MajorStar | AuxiliaryStar)[]>,
  natalTransformations: Transformation[],
  majorPeriods: MajorPeriod[]
): {
  year: number;
  yearStem: string;
  yearBranch: string;
  flowYearTransformations: Transformation[];
  dahanOverlap: string[];
  natalOverlap: string[];
  interpretation: string;
} {
  const age = currentYear - birthYear + 1;
  const flowYearGanIdx = (currentYear - 4) % 10;
  const flowYearBranchIdx = (currentYear - 4) % 12;
  const yearStem = STEMS[flowYearGanIdx];
  const yearBranch = BRANCHES[flowYearBranchIdx];

  // 1. 유년 사화
  const flowTransformations = calculateFlowYearTransformations(currentYear, starMap, mingGongIdx);

  // 2. 현재 대한 찾기
  const currentDahan = majorPeriods.find(p => age >= p.startAge && age <= p.endAge);
  const dahanTransformations = currentDahan?.transformations || [];

  // 3. 교차점 분석: 유년 사화와 대한 사화가 같은 궁에 떨어지는 경우
  const dahanOverlap: string[] = [];
  for (const ft of flowTransformations) {
    for (const dt of dahanTransformations) {
      if (ft.palace === dt.palace) {
        dahanOverlap.push(
          `${ft.palace}에 유년${ft.type}(${ft.star})과 대한${dt.type}(${dt.star}) 중첩`
        );
      }
      // 특히 위험: 유년 화기와 대한 화기가 같은 궁
      if (ft.type === "화기" && dt.type === "화기" && ft.palace === dt.palace) {
        dahanOverlap.push(`⚠ ${ft.palace}에 유년화기+대한화기 이중충격!`);
      }
      // 특히 길: 유년 화록과 대한 화록이 같은 궁
      if (ft.type === "화록" && dt.type === "화록" && ft.palace === dt.palace) {
        dahanOverlap.push(`★ ${ft.palace}에 유년화록+대한화록 이중길성!`);
      }
    }
  }

  // 4. 교차점 분석: 유년 사화와 본명 사화
  const natalOverlap: string[] = [];
  for (const ft of flowTransformations) {
    for (const nt of natalTransformations) {
      if (ft.palace === nt.palace) {
        natalOverlap.push(
          `${ft.palace}에 유년${ft.type}(${ft.star})과 본명${nt.type}(${nt.star}) 중첩`
        );
      }
      if (ft.type === "화기" && nt.type === "화기" && ft.palace === nt.palace) {
        natalOverlap.push(`⚠ ${ft.palace}에 유년화기+본명화기 이중충격! 특히 주의.`);
      }
    }
  }

  // 5. 종합 해석
  let interpretation = `${currentYear}년(${yearStem}${yearBranch}년) 유년 분석 (만 ${age - 1}세, 한국나이 ${age}세). `;

  if (currentDahan) {
    interpretation += `현재 대한: ${currentDahan.palace}(${currentDahan.branch}궁). `;
  }

  // 유년 사화 요약
  const flowLu = flowTransformations.find(t => t.type === "화록");
  const flowJi = flowTransformations.find(t => t.type === "화기");
  if (flowLu) {
    interpretation += `올해 재물·기회: ${flowLu.palace}(${flowLu.star}화록). `;
  }
  if (flowJi) {
    interpretation += `올해 주의사항: ${flowJi.palace}(${flowJi.star}화기). `;
  }

  // 교차점 경고
  if (dahanOverlap.length > 0) {
    interpretation += `[대한교차] ${dahanOverlap.join("; ")}. `;
  }
  if (natalOverlap.length > 0) {
    interpretation += `[본명교차] ${natalOverlap.join("; ")}. `;
  }

  // 전반적 판단
  const jiCount = flowTransformations.filter(t => t.type === "화기").length +
    dahanOverlap.filter(s => s.includes("화기")).length;
  const luCount = flowTransformations.filter(t => t.type === "화록").length +
    dahanOverlap.filter(s => s.includes("화록")).length;

  if (luCount >= 2 && jiCount === 0) {
    interpretation += "올해는 전반적으로 매우 길한 해. 적극적 행동 추천.";
  } else if (luCount > jiCount) {
    interpretation += "올해는 길한 에너지가 우세. 기회를 잘 포착할 것.";
  } else if (jiCount >= 2) {
    interpretation += "올해는 주의가 필요한 해. 큰 결정은 신중히, 건강과 재물 관리에 유의.";
  } else {
    interpretation += "올해는 평탄한 흐름. 안정적으로 기반을 다지기 좋은 시기.";
  }

  return {
    year: currentYear,
    yearStem,
    yearBranch,
    flowYearTransformations: flowTransformations,
    dahanOverlap,
    natalOverlap,
    interpretation,
  };
}

// ─── 궁위별 해석 (사화 포함) ───
function interpretPalace(
  palaceName: PalaceName,
  stars: StarPlacement[],
  transformations: Transformation[],
  isShenGong: boolean = false,
  starMap?: Map<number, (MajorStar | AuxiliaryStar)[]>,
  palaceIdx?: number,
  shenSha?: string[]
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

  // 신살 해석
  if (shenSha && shenSha.length > 0) {
    const shenShaDesc = shenSha
      .map(s => `${s}(${SHEN_SHA_MEANINGS[s] || "특수 신살"})`)
      .join(", ");
    interpretation += `\n[신살] ${shenShaDesc}`;
    
    // 핵심 신살 경고
    const warnings: string[] = [];
    if (shenSha.includes("천형") && shenSha.includes("천요"))
      warnings.push("천형+천요: 건강·수술 주의");
    if (shenSha.includes("도화") && shenSha.includes("홍란"))
      warnings.push("도화+홍란: 이성 인연 매우 강함");
    if (shenSha.includes("역마살") && shenSha.includes("천마"))
      warnings.push("역마살+천마: 이동·변동 극대화");
    if (shenSha.includes("겁살") && shenSha.includes("지겁"))
      warnings.push("겁살+지겁: 재물 손실 주의");
    if (shenSha.includes("화개살") && shenSha.includes("천공"))
      warnings.push("화개살+천공: 종교·영성 강화, 현실 주의");
    if (shenSha.includes("도화") && shenSha.includes("천희"))
      warnings.push("도화+천희: 연애 경사 가능성 높음");
    if (warnings.length > 0) {

      interpretation += `\n⚠ 신살 경고: ${warnings.join(" / ")}`;
    }
  }

  return interpretation || `${palaceName}의 기본적인 에너지가 작용합니다.`;

}

/**
 * 종합 점수 및 카테고리별 점수 계산 (Stage 5)
 */
function calculateOverallScores(
  palaces: PalaceInfo[],
  geokGuk: { grade: string }[]
): ZiWeiResult['overallScore'] {
  const categories = [
    { name: "재물", palaceName: "재백궁" },
    { name: "직업", palaceName: "관록궁" },
    { name: "연애", palaceName: "부처궁" },
    { name: "건강", palaceName: "질액궁" },
    { name: "인간관계", palaceName: "노복궁" },
  ];

  const luckyStars = ["좌보", "우필", "천괴", "천월", "록존", "문창", "문곡"];
  const killerStars = ["경양", "타라", "화성", "영성", "지공", "지겁"];
  const luckyShen = ["천덕", "월덕", "천희", "장성살", "반안살"];
  const unluckyShen = ["겁살", "천형", "천살", "망신살", "육해살"];
  const brightnessMap: Record<string, number> = {

    "묘": 20, "왕": 18, "득지": 15, "평화": 10, "함지": 5, "낙함": 2
  };

  const categoryResults = categories.map(cat => {
    const p = palaces.find(pal => pal.name === cat.palaceName)!;
    let score = 50; // 기본 베이스 점수

    // 1. 주성 밝기
    for (const star of p.stars) {
      if (MAJOR_STARS.includes(star.star as any)) {
        score += brightnessMap[star.brightness] || 10;
      }
    }

    // 2. 길성/흉성
    for (const star of p.stars) {
      if (luckyStars.includes(star.star)) score += 3;
      if (killerStars.includes(star.star)) score -= 2;
    }

    // 3. 격국 (모든 궁에 공통 반영)
    if (geokGuk.length > 0) {
      const g = geokGuk[0];
      if (g.grade === "상격") score += 15;
      else if (g.grade === "중격") score += 8;
      else if (g.grade === "하격") score += 0;
      // 파격 판단 (격국 엔진에서 파격 조건이 있으면 -10)
      if (g.grade === "파격") score -= 10;
    }

    // 4. 사화 (명궁 기준이 아니라 해당 궁 기준 사화)
    for (const t of p.transformations) {
      if (t.type === "화록" || t.type === "화과") score += 5;
      if (t.type === "화권") score += 3;
      if (t.type === "화기") score -= 8;
    }

    // 5. 신살
    for (const s of p.shenSha) {
      if (luckyShen.includes(s)) score += 2;
      if (unluckyShen.includes(s)) score -= 3;
    }

    score = Math.max(0, Math.min(100, score));

    let summary = "";
    if (score >= 85) summary = "매우 길함";
    else if (score >= 70) summary = "양호함";
    else if (score >= 55) summary = "보통";
    else if (score >= 40) summary = "주의 필요";
    else summary = "기복 심함";

    return {
      name: cat.name,
      score: Math.round(score),
      summary
    };
  });

  const total = Math.round(categoryResults.reduce((acc, cur) => acc + cur.score, 0) / categoryResults.length);
  
  let grade = "C";
  if (total >= 85) grade = "S";
  else if (total >= 70) grade = "A";
  else if (total >= 55) grade = "B";
  else if (total >= 40) grade = "C";
  else grade = "D";

  const summaries: Record<string, string> = {
    "S": "하늘의 축복을 받은 명운, 모든 분야에서 탁월한 성취가 기대됩니다.",
    "A": "안정적이고 발전적인 명운, 노력한 만큼의 결실을 맺는 삶입니다.",
    "B": "평탄한 흐름이나 특정 분야의 기복이 있으니 조화가 필요합니다.",
    "C": "인내와 노력이 필요한 시기, 신중한 선택이 운명을 바꿉니다.",
    "D": "도전적인 과제가 많은 명운, 수양과 지혜로 위기를 극복해야 합니다."
  };

  return {
    total,
    categories: categoryResults,
    grade,
    oneLineSummary: summaries[grade] || summaries["C"]
  };
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
  // 12신살 배치
  const shenSha12 = placeShenShaStars(yearBranchIdx);
  // 특수 신살 9종 배치
  const specialShenSha = placeSpecialShenSha(yearBranchIdx, lunarMonth, birthHourBranch);

  // 통합
  const shenShaMap = new Map<number, string[]>();
  for (let i = 0; i < 12; i++) {
    const merged: string[] = [
      ...(shenSha12.get(i) || []),
      ...(specialShenSha.get(i) || []),
    ];
    if (merged.length > 0) shenShaMap.set(i, merged);
  }


  
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
      shenSha: shenShaMap.get(palaceIdx) || [],
      transformations: trans,
      interpretation: interpretPalace(name, starPlacements, trans, name === shenGongPalace, totalStarMap, palaceIdx, shenShaMap.get(palaceIdx) || []),
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
  // Moved down to ensure currentYearAnalysis is available


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


  // 유년 교차 분석
  const currentYearAnalysis = analyzeYearCrossover(
    currentYear,
    birthYear,
    mingGongIdx,
    gender,
    yearGanIdx,
    bureau,
    totalStarMap,
    natalTransformations,
    majorPeriods
  );

  // 소한 (Stage 6)
  const currentMinorPeriod = calculateMinorPeriod(
    birthYear, gender, mingGongIdx, yearGanIdx, bureau,
    totalStarMap, natalTransformations, majorPeriods, currentYearAnalysis
  );

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
  const overallScore = calculateOverallScores(palaces, geokGuk);

  const result: ZiWeiResult = {
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
    currentYearAnalysis,
    overallScore,
    chartType: classifyChartType(mingGongIdx, totalStarMap),
    palaceFlyingSiHua: [],
  };

  // ─── Tier 2: 궁간사화 실행 (명궁/관록궁/재백궁/부처궁/복덕궁) ───
  const starPositionMap = new Map<MajorStar | AuxiliaryStar, number>();
  for (const [pos, stars] of totalStarMap.entries()) {
    for (const s of stars) {
      starPositionMap.set(s, pos);
    }
  }

  const targetPalaceNames: PalaceName[] = ["명궁", "관록궁", "재백궁", "부처궁", "복덕궁"];
  for (const pName of targetPalaceNames) {
    const palaceIdx = ((mingGongIdx - PALACES.indexOf(pName) + 12) % 12);
    const stem = getPalaceGan(yearGanIdx, palaceIdx);
    const flights = flyPalaceSiHua(palaceIdx, yearGanIdx, mingGongIdx, starPositionMap);
    result.palaceFlyingSiHua.push({
      palace: pName,
      stem,
      flights,
    });
  }

  return result;
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

    // 신살 추가 정보
    if (palace.shenSha && palace.shenSha.length > 0) {
      result += `\n[해당 궁 신살] ${palace.shenSha.map(
        s => `${s}(${SHEN_SHA_MEANINGS[s] || ""})`
      ).join(", ")}`;
    }
  } else {

    result = ziwei.lifeStructure;
  }

  // 대한/소한 시기 분석 추가
  if (ziwei.periodAnalysis) {
    result += " [시기 분석] " + ziwei.periodAnalysis;
  }

  // 연애 질문: 전체 궁에서 도화·홍란·천희 탐색
  if (questionType === "연애" || questionType === "결혼" || questionType === "재회") {
    const romanceStars = ["도화", "홍란", "천희"];
    const found: string[] = [];
    for (const p of ziwei.palaces) {
      const hits = (p.shenSha || []).filter(s => romanceStars.includes(s));
      if (hits.length > 0) found.push(`${p.name}: ${hits.join(",")}`);
    }
    if (found.length > 0) {
      result += `\n[연애 신살 분포] ${found.join(" | ")}`;
    }
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

  // 유년 분석 추가
  if (ziwei.currentYearAnalysis) {
    result += `\n[유년 분석] ${ziwei.currentYearAnalysis.interpretation}`;

    // 질문 유형과 관련된 궁에 유년 사화가 있는지 확인
    const palaceMap: Record<string, number> = { "연애": 2, "재회": 2, "사업": 8, "직업": 8, "금전": 4 };
    const idx = palaceMap[questionType];
    const targetPalace = idx !== undefined ? ziwei.palaces[idx] : null;

    if (targetPalace) {
      const relevantFlow = ziwei.currentYearAnalysis.flowYearTransformations
        .filter(t => t.palace === targetPalace.name);
      if (relevantFlow.length > 0) {
        result += ` [유년→${targetPalace.name}] `;
        for (const rf of relevantFlow) {
          result += `${rf.star}${rf.type}: ${TRANSFORMATION_MEANINGS[rf.type].effect}. `;
        }
      }
    }
  }

  // 종합 점수 요약 추가
  result += `\n[종합 운세 점수] ${ziwei.overallScore.total}점 (${ziwei.overallScore.grade}등급): ${ziwei.overallScore.oneLineSummary}`;

  return result;
}


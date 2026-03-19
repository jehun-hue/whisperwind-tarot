/**
 * ziweiEngine.ts
 * 자미두수(紫微斗數) 명반 계산 엔진 - Edge Function 서버사이드
 */

import { getNapeum } from "./napeum.ts";
import { getKoreanTimezoneOffset } from "./timeUtils.ts";

const PALACES = [
  "명궁", "형제궁", "부처궁", "자녀궁", "재백궁", "질액궁",
  "천이궁", "노복궁", "관록궁", "전택궁", "복덕궁", "부모궁",
] as const;
type PalaceName = typeof PALACES[number];

const MAJOR_STARS = [
  "자미", "천기", "태양", "무곡", "천동", "염정",
  "천부", "태음", "탐랑", "거문", "천상", "천량",
  "칠살", "파군", "문곡", "문창", "좌보", "우필",
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
  core_palaces: {
    life_palace: CorePalaceInfo;
    body_palace: CorePalaceInfo;
  };
  // Compatibility
  lifePalace: string;
  bodyPalace: string;
  fiveElementFrame: string;
  lunarMonth: number;
  lunarDay: number;
  hourBranch: string;
  majorStars: { name: string; palace: string; brightness: string }[];
  siHua: Record<string, string>;
}

export type ZiweiResult = ServerZiWeiResult;

const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];

const TRANSFORMATION_TABLE: Record<string, Record<TransformationType, MajorStar>> = {
  갑: { 화록: "염정", 화권: "파군", 화과: "무곡", 화기: "태양" },
  을: { 화록: "천기", 화권: "천량", 화과: "자미", 화기: "태음" },
  병: { 화록: "천동", 화권: "천기", 화과: "문창", 화기: "염정" },
  정: { 화록: "태음", 화권: "천동", 화과: "천기", 화기: "거문" },
  무: { 화록: "탐랑", 화권: "태음", 화과: "우필", 화기: "천기" },
  기: { 화록: "무곡", 화권: "탐랑", 화과: "천량", 화기: "문곡" },
  경: { 화록: "태양", 화권: "무곡", 화과: "태음", 화기: "천동" },
  신: { 화록: "거문", 화권: "태양", 화과: "문곡", 화기: "문창" },
  임: { 화록: "천량", 화권: "자미", 화과: "좌보", 화기: "무곡" },
  계: { 화록: "파군", 화권: "거문", 화과: "태음", 화기: "탐랑" },
};

const TRANSFORMATION_MEANINGS: Record<TransformationType, { meaning: string; effect: string }> = {
  화록: { meaning: "록(祿) - 재물, 풍요, 기회", effect: "재물운과 기회가 유입" },
  화권: { meaning: "권(權) - 권력, 장악, 통제", effect: "주도권과 결정력 강화" },
  화과: { meaning: "과(科) - 명예, 학문, 평판", effect: "명성과 인정 획득" },
  화기: { meaning: "기(忌) - 장애, 집착, 손실", effect: "장애와 소모 발생" },
};

const STAR_MEANINGS: Record<string, { positive: string; negative: string; domain: string }> = {
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

const AUX_STAR_MEANINGS: Record<string, { positive: string; negative: string; domain: string }> = {
  문창: { positive: "문서, 학문, 시험운", negative: "과도한 완벽주의", domain: "학문과 문서" },
  좌보: { positive: "귀인, 보좌, 협력", negative: "의존성", domain: "귀인 조력" },
  우필: { positive: "귀인, 조화, 지원", negative: "우유부단", domain: "귀인 조력" },
  천괴: { positive: "귀인, 명예, 관운", negative: "교만", domain: "귀인과 명예" },
  천월: { positive: "귀인, 도움, 치유", negative: "의존", domain: "귀인과 치유" },
  록존: { positive: "재물 보존, 안정", negative: "고독, 인색", domain: "재물 안정" },
  천마: { positive: "이동, 변화, 활동성", negative: "불안정, 분주", domain: "이동과 변화" },
};

const LUCKY_STARS = ["문창", "문곡", "좌보", "우필", "천괴", "천월", "록존", "천마"] as const;
const UNLUCKY_STARS = ["경양", "타라", "화성", "영성", "지공", "지겁", "천형", "천요"] as const;

function isEmptyPalace(stars: StarPlacement[]): boolean { return !stars.some(s => (MAJOR_STARS as readonly string[]).includes(s.star)); }
function getOppositePalaceIdx(palaceIdx: number): number { return (palaceIdx + 6) % 12; }
function calculateMingGong(lunarMonth: number, birthHourBranch: number): number { return (2 + lunarMonth - 1 - birthHourBranch + 24) % 12; }
function calculateShenGong(lunarMonth: number, birthHourBranch: number): number { return (2 + lunarMonth - 1 + birthHourBranch) % 12; }
function determineBureau(mingGongIdx: number, yearGanIdx: number): Bureau {
  const yinStartGan = [2, 4, 6, 8, 0];
  const ohoGroup = yearGanIdx % 5;
  const dist = (mingGongIdx - 2 + 12) % 12;
  const mingGanIdx = (yinStartGan[ohoGroup] + dist) % 10;

  if (mingGanIdx % 2 !== mingGongIdx % 2) return "목삼국";

  const NAPEUM: string[] = [
    "금","금","화","화","목","목","토","토","금","금","화","화",
    "수","수","토","토","금","금","목","목","수","수","토","토",
    "화","화","목","목","수","수","금","금","화","화","목","목",
    "토","토","금","금","화","화","수","수","토","토","금","금",
    "목","목","수","수","토","토","화","화","목","목","수","수",
  ];

  const n = ((6 * mingGanIdx - 5 * mingGongIdx) % 60 + 60) % 60;
  const bureauMap: Record<string, Bureau> = {
    "목": "목삼국", "화": "화육국", "토": "토오국", "금": "금사국", "수": "수이국"
  };

  return bureauMap[NAPEUM[n]] || "목삼국";
}
function calculateZiWeiPosition(lunarDay: number, bureau: Bureau): number {
  const bureauNum: Record<Bureau, number> = { 수이국: 2, 목삼국: 3, 금사국: 4, 토오국: 5, 화육국: 6 };
  return Math.ceil(lunarDay / bureauNum[bureau]) % 12;
}
function placeMajorStars(ziWeiPos: number): Map<number, MajorStar[]> {
  const placements = new Map<number, MajorStar[]>();
  const ziWeiGroup: [MajorStar, number][] = [["자미", 0], ["천기", -1], ["태양", -3], ["무곡", -4], ["천동", -5], ["염정", -8]];
  const tianFuPos = (12 - ziWeiPos + 4) % 12;
  const tianFuGroup: [MajorStar, number][] = [["천부", 0], ["태음", 1], ["탐랑", 2], ["거문", 3], ["천상", 4], ["천량", 5], ["칠살", 6], ["파군", 7]];
  for (const [star, offset] of ziWeiGroup) { const pos = ((ziWeiPos + offset) % 12 + 12) % 12; if (!placements.has(pos)) placements.set(pos, []); placements.get(pos)!.push(star); }
  for (const [star, offset] of tianFuGroup) { const pos = ((tianFuPos + offset) % 12 + 12) % 12; if (!placements.has(pos)) placements.set(pos, []); placements.get(pos)!.push(star); }
  return placements;
}
function placeAuxiliaryStars(birthHourBranch: number, lunarMonth: number, yearGanIdx: number): Map<number, string[]> {
  const aux = new Map<number, string[]>();
  const addStar = (pos: number, star: string) => { const p = ((pos % 12) + 12) % 12; if (!aux.has(p)) aux.set(p, []); aux.get(p)!.push(star); };
  addStar((10 - birthHourBranch + 12) % 12, "문창"); addStar((4 + birthHourBranch) % 12, "문곡"); addStar((3 + lunarMonth) % 12, "좌보"); addStar((11 - lunarMonth + 12) % 12, "우필");
  const kuiYueMap: Record<number, [number, number]> = { 0: [1, 7], 1: [0, 8], 2: [11, 9], 3: [11, 9], 4: [1, 7], 5: [0, 8], 6: [1, 7], 7: [6, 2], 8: [3, 5], 9: [3, 5] };
  const [kuiPos, yuePos] = kuiYueMap[yearGanIdx % 10] ?? [1, 7]; addStar(kuiPos, "천괴"); addStar(yuePos, "천월"); return aux;
}
function getStarBrightness(star: MajorStar, palaceIdx: number): StarBrightness {
  const optimalPositions: Partial<Record<MajorStar, number[]>> = { 자미:[1,4,6,7], 천기:[2,5,8], 태양:[2,3,4,5], 무곡:[0,1,6,7], 천동:[2,5,8,11], 염정:[2,5,8], 천부:[1,4,6,7,10], 태음:[8,9,10,11], 탐랑:[2,5,8,11], 거문:[0,3,6,9], 천상:[1,4,7,10], 천량:[0,2,5,8], 칠살:[2,5,8,11], 파군:[0,3,6,9] };
  const worstPositions: Partial<Record<MajorStar, number[]>> = { 자미:[3,9], 태양:[8,9,10,11], 태음:[2,3,4,5], 천동:[0,6] };
  const seed = (star.charCodeAt(0) * 31 + palaceIdx * 17) % 6;
  if (optimalPositions[star]?.includes(palaceIdx)) return seed%2===0?"묘":"왕"; if (worstPositions[star]?.includes(palaceIdx)) return seed%2===0?"함지":"낙함"; return seed%2===0?"득지":"평화";
}
function calculateNatalTransformations(yearGanIdx: number, starMap: Map<number, MajorStar[]>, mingGongIdx: number): Transformation[] {
  const stem = STEMS[yearGanIdx]; const table = TRANSFORMATION_TABLE[stem]; if (!table) return []; const transformations: Transformation[] = [];
  for (const type of ["화록", "화권", "화과", "화기"] as TransformationType[]) {
    const targetStar = table[type];
    for (const [posIdx, stars] of starMap.entries()) { if (stars.includes(targetStar)) { const palaceOffset = ((posIdx - mingGongIdx) % 12 + 12) % 12; const palace = PALACES[palaceOffset]; transformations.push({ type, star: targetStar, palace, description: `${targetStar}${type} → ${palace}` }); break; } }
  }
  return transformations;
}
function calculateMajorPeriods(bureau: Bureau, mingGongIdx: number, gender: "male" | "female", yearGanIdx: number, starMap: Map<number, MajorStar[]>): MajorPeriod[] {
  const startAge = ({ 수이국: 2, 목삼국: 3, 금사국: 4, 토오국: 5, 화육국: 6 } as Record<Bureau, number>)[bureau];
  const isYangStem = yearGanIdx % 2 === 0; const isForward = (gender === "male" && isYangStem) || (gender === "female" && !isYangStem); const direction = isForward ? 1 : -1; const periods: MajorPeriod[] = [];
  for (let i = 0; i < 12; i++) {
    const periodStart = startAge + i * 10; const periodEnd = periodStart + 9; const palaceIdx = ((mingGongIdx + direction * i) % 12 + 12) % 12; const palaceOffset = ((palaceIdx - mingGongIdx) % 12 + 12) % 12; const palace = PALACES[palaceOffset]; const branch = BRANCHES[palaceIdx];
    const starsInPalace = starMap.get(palaceIdx) || []; const starPlacements: StarPlacement[] = starsInPalace.map(star => ({ star, palace, brightness: getStarBrightness(star as any, palaceIdx), description: star }));
    periods.push({ startAge: periodStart, endAge: periodEnd, palace, branch, stars: starPlacements, transformations: [], interpretation: `${periodStart}-${periodEnd}세 대한: ${palace}(${branch}궁)` });
  }
  return periods;
}
function calculateMinorPeriod(birthYear: number, currentYear: number, mingGongIdx: number, gender: "male" | "female", yearGanIdx: number): MinorPeriod {
  const age = currentYear - birthYear + 1; const isYangGan = yearGanIdx % 2 === 0; const isForward = (gender === "male" && isYangGan) || (gender === "female" && !isYangGan); const offset = (age - 1) % 12; const palaceIdx = ((mingGongIdx + (isForward ? 1 : -1) * offset) % 12 + 12) % 12;
  const palaceOffset = ((palaceIdx - mingGongIdx) % 12 + 12) % 12; return { age, palace: PALACES[palaceOffset], branch: BRANCHES[palaceIdx], interpretation: `올해(${age}세) 소한: ${PALACES[palaceOffset]}` };
}

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
  const auxMap = placeAuxiliaryStars(birthHourBranch, lunarMonth, yearGanIdx);
  for (const [pos, stars] of auxMap.entries()) { if (!starMap.has(pos)) starMap.set(pos, []); for (const s of stars) (starMap.get(pos) as any[]).push(s); }
  const natalTransformations = calculateNatalTransformations(yearGanIdx, starMap, mingGongIdx);
  const palaces: PalaceInfo[] = PALACES.map((name, idx) => {
    const palaceIdx = (mingGongIdx + idx) % 12; const stars = starMap.get(palaceIdx) || [];
    return { name, branch: BRANCHES[palaceIdx], stars: stars.map(s => ({ star: s as any, palace: name, brightness: getStarBrightness(s as any, palaceIdx), description: s })), transformations: [], interpretation: `${name}: ${stars.join(", ")}` };
  });
  const majorPeriods = calculateMajorPeriods(bureau, mingGongIdx, gender, yearGanIdx, starMap);
  const currentYear = new Date().getFullYear();
  const currentMajorPeriod = majorPeriods.find(p => (currentYear - birthYear + 1) >= p.startAge && (currentYear - birthYear + 1) <= p.endAge) || null;
  const currentMinorPeriod = calculateMinorPeriod(birthYear, currentYear, mingGongIdx, gender, yearGanIdx);

  function buildCorePalaceInfo(palaceIdx: number): CorePalaceInfo {
    const palaceOffset = ((palaceIdx - mingGongIdx) % 12 + 12) % 12;
    const palaceName = PALACES[palaceOffset]; const palaceData = palaces.find(p => p.name === palaceName); const stars = palaceData?.stars || [];
    const majorStarList = stars.filter(s => (MAJOR_STARS as readonly string[]).includes(s.star)).map(s => s.star);
    return { palace: palaceName, branch: BRANCHES[palaceIdx] || "", major_stars: majorStarList, lucky_stars: [], unlucky_stars: [], is_empty: majorStarList.length === 0, is_borrowed_stars: false, interpretation: "" };
  }

  // Compatibility fields
  const majorStarsForVerify = [];
  for (const [pos, stars] of starMap.entries()) { stars.forEach(s => majorStarsForVerify.push({ name: s, palace: BRANCHES[pos], brightness: getStarBrightness(s as any, pos) })); }
  const stem = STEMS[yearGanIdx]; const t = TRANSFORMATION_TABLE[stem] || {};
  const siHua = { "화록": t["화록"], "화권": t["화권"], "화과": t["화과"], "화기": t["화기"] };

  return {
    mingGong: BRANCHES[mingGongIdx], shenGong: BRANCHES[shenGongIdx], bureau, palaces, lifeStructure: "", keyInsights: [], natalTransformations, majorPeriods, currentMajorPeriod, currentMinorPeriod, periodAnalysis: "", annualTransformations: [], annualYear: currentYear, annualGan: STEMS[(currentYear-4)%10], core_palaces: { life_palace: buildCorePalaceInfo(mingGongIdx), body_palace: buildCorePalaceInfo(shenGongIdx) },
    lifePalace: BRANCHES[mingGongIdx], bodyPalace: BRANCHES[shenGongIdx], fiveElementFrame: bureau, lunarMonth, lunarDay, hourBranch: BRANCHES[birthHourBranch], majorStars: majorStarsForVerify, siHua
  };
}

export function calculateZiwei(
  arg1: any, arg2: any, arg3?: any, arg4?: any, arg5?: any, arg6?: any, arg7?: any
): ZiweiResult {
  if (typeof arg1 === "number" && typeof arg2 === "number") {
    const dateObj = new Date(arg1, arg2 - 1, arg3);
    const formatter = new Intl.DateTimeFormat('ko-KR-u-ca-chinese', { day: 'numeric', month: 'numeric', year: 'numeric' });
    const parts = formatter.formatToParts(dateObj);
    let lunarMonth = 1; let lunarDay = 1; for (const part of parts) { if (part.type === 'month') lunarMonth = parseInt(part.value.replace(/\D/g, '')) || 1; if (part.type === 'day') lunarDay = parseInt(part.value.replace(/\D/g, '')) || 1; }
    const offset = getKoreanTimezoneOffset(arg1, arg2, arg3);
    const standardHour = arg4 - (offset - 9);
    return calculateServerZiWei(arg1, lunarMonth, lunarDay, standardHour, arg5, arg6);
  } else {
    const HANJA_TO_HANGUL: Record<string, string> = {
      "子":"자","丑":"축","寅":"인","卯":"묘","辰":"진","巳":"사",
      "午":"오","未":"미","申":"신","酉":"유","戌":"술","亥":"해"
    };
    const hourBranchHangul = HANJA_TO_HANGUL[String(arg5)] || String(arg5);
    const birthYear = (arg7 && typeof arg7 === "number" && arg7 > 1900 && arg7 < 2100) ? arg7 : 1987;
    const lMonth = arg3;
    const lDay = arg4;
    const hBranchIdx = BRANCHES.indexOf(hourBranchHangul);
    const sHour = (hBranchIdx >= 0 ? hBranchIdx : 0) * 2;
    return calculateServerZiWei(birthYear, lMonth, lDay, sHour, 0, arg6);
  }
}

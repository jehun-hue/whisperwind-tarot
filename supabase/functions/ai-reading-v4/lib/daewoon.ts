import { findSolarTermJD, MONTH_JEOL_LONGS } from "./solarTerm.ts";
import { STEMS, BRANCHES, FIVE_ELEMENTS_MAP } from "./fiveElements.ts";
import { calculateTenGod, calculateTenGodBranch } from "./tenGods.ts";
import { checkStemRelation, checkBranchRelation } from "./interactions.ts";

export interface DaewoonPillar {
  index: number;           // 0-based 대운 순번
  startAge: number;        // 시작 나이
  endAge: number;          // 종료 나이
  stem: string;            // 천간 (한자)
  branch: string;          // 지지 (한자)
  full: string;            // "甲子" 형태
  stemElement: string;     // wood, fire, earth, metal, water
  branchElement: string;
  tenGodStem: string;      // 일간 기준 십성 (천간)
  tenGodBranch: string;    // 일간 기준 십성 (지지 본기)
  isCurrent: boolean;      // 현재 대운인지
  twelveStage?: string;    // 12운성
  twelveStageEnergy?: any; // 12운성 에너지
}

export interface TransitionInfo {
  isTransition: boolean;
  previous: DaewoonPillar | null;
  current: DaewoonPillar | null;
  next: DaewoonPillar | null;
  transitionYear: number;
  description: string;
}

export interface DaewoonResult {
  startAge: number;           // 대운 시작 나이
  isForward: boolean;         // 순행 여부
  pillars: DaewoonPillar[];   // 10개 대운 기둥
  currentDaewoon: DaewoonPillar | null;
  currentAge: number;
  is_daeun_changing_year: boolean;
  current_seun: any;
  transitionInfo?: TransitionInfo; // B-266: 전환기 정보 추가
}

export function getDaewoonInfo(
  yearStemIdx: number, 
  gender: 'M' | 'F', 
  sunLong: number, 
  jd: number, 
  year: number
): { age: number; isForward: boolean } {
  const sLong = Number(sunLong) || 0;
  const jval = Number(jd) || 0;
  const yval = Number(year) || 2000;

  const isYangYear = (Number(yearStemIdx) || 0) % 2 === 0;
  const isForward = (isYangYear && gender === 'M') || (!isYangYear && gender === 'F');

  const termIdx = Math.floor((sLong - 315 + 360) % 360 / 30);
  const currentJeolLong = MONTH_JEOL_LONGS[termIdx];
  const nextJeolLong = MONTH_JEOL_LONGS[(termIdx + 1) % 12];
  
  let currentJeolJD = findSolarTermJD(yval, currentJeolLong);
  if (currentJeolJD > jval + 1) {
    currentJeolJD = findSolarTermJD(yval - 1, currentJeolLong);
  }
  
  let nextJeolJD = findSolarTermJD(yval, nextJeolLong);
  if (nextJeolJD < jval - 1) {
    nextJeolJD = findSolarTermJD(yval + 1, nextJeolLong);
  }

  let diff = isForward ? (nextJeolJD - jval) : (jval - currentJeolJD);
  if (!Number.isFinite(diff) || diff < 0) diff = 0;

  const daewoonAge = Math.max(1, Math.round(diff / 3));
  const finalAge = Number.isFinite(daewoonAge) ? daewoonAge : 1;
  return { age: finalAge, isForward };
}

/**
 * 1) 대운 전환기(교운기) 정보 생성 내부 함수
 */
function calculateTransitionInfo(currentAge: number, pillars: DaewoonPillar[]): TransitionInfo | undefined {
  const koreanAge = currentAge + 1;
  const currentIdx = pillars.findIndex(p => p.isCurrent);
  if (currentIdx === -1) return undefined;

  const current = pillars[currentIdx];
  const previous = currentIdx > 0 ? pillars[currentIdx - 1] : null;
  const next = currentIdx < pillars.length - 1 ? pillars[currentIdx + 1] : null;

  // 교운기 판별: 대운 시작 나이 ±1년
  const isTransition = Math.abs(koreanAge - current.startAge) <= 1;

  return {
    isTransition,
    current,
    previous,
    next,
    transitionYear: current.startAge,
    description: isTransition 
      ? `현재 ${current.startAge}세 대운 교체 주기에 머물러 있어 환경과 심경의 큰 변화가 예상되는 '교운기'입니다.`
      : `${current.startAge}세 대운의 안정된 흐름 속에 있습니다.`
  };
}

/**
 * 2) 세운(연운) 계산
 */
export function calculateSeWoon(targetYear: number): { stem: string, branch: string, full: string } {
  const diff = (targetYear - 4) % 60;
  const sIdx = ((diff % 10) + 10) % 10;
  const bIdx = ((diff % 12) + 12) % 12;
  return {
    stem: STEMS[sIdx],
    branch: BRANCHES[bIdx],
    full: `${STEMS[sIdx]}${BRANCHES[bIdx]}`
  };
}

/**
 * 3) 월운 계산
 */
export function calculateWolWoon(yearStem: string, month: number): { stem: string, branch: string, full: string } {
  const sIdx = STEMS.indexOf(yearStem);
  if (sIdx < 0) return { stem: "", branch: "", full: "" };
  
  const startStemIdx = (sIdx * 2 + 2) % 10; // 인(寅)월의 천간
  const stemIdx = (startStemIdx + (month - 1)) % 10;
  const branchIdx = (BRANCHES.indexOf("寅") + (month - 1)) % 12;
  return {
    stem: STEMS[stemIdx],
    branch: BRANCHES[branchIdx],
    full: `${STEMS[stemIdx]}${BRANCHES[branchIdx]}`
  };
}

/**
 * 4) 대운+세운 상호작용 분석
 */
export function analyzeWoonInteractions(
  dStem: string, dBranch: string, 
  sStem: string, sBranch: string,
  natalStems: string[], natalBranches: string[]
): { clashes: string[], harmonies: string[] } {
  const clashes: string[] = [];
  const harmonies: string[] = [];
  const labels = ["년", "월", "일", "시"];

  // 1. 대운 vs 세운
  const dsStemRel = checkStemRelation(dStem, sStem);
  if (dsStemRel) {
    if (dsStemRel.type.includes("합")) harmonies.push(`대운-세운 천간합: ${dsStemRel.description}`);
    else clashes.push(`대운-세운 천간갈등: ${dsStemRel.description}`);
  }
  const dsBranchRel = checkBranchRelation(dBranch, sBranch);
  if (dsBranchRel) {
    if (dsBranchRel.type.includes("합")) harmonies.push(`대운-세운 지지합: ${dsBranchRel.description}`);
    else clashes.push(`대운-세운 지지충돌: ${dsBranchRel.description}`);
  }

  // 2. 대운 vs 원국
  natalStems.forEach((ns, i) => {
    const rel = checkStemRelation(dStem, ns);
    if (rel) {
      const label = labels[i] || "미상";
      if (rel.type.includes("합")) harmonies.push(`대운-원국(${label}간) 합: ${rel.description}`);
      else clashes.push(`대운-원국(${label}간) 갈등: ${rel.description}`);
    }
  });
  natalBranches.forEach((nb, i) => {
    const rel = checkBranchRelation(dBranch, nb);
    if (rel) {
      const label = labels[i] || "미상";
      if (rel.type.includes("합")) harmonies.push(`대운-원국(${label}지) 합: ${rel.description}`);
      else clashes.push(`대운-원국(${label}지) 충돌: ${rel.description}`);
    }
  });

  return { clashes, harmonies };
}

/**
 * 전체 대운 기둥 10개 생성
 */
export function calculateFullDaewoon(
  monthStemIdx: number,
  monthBranchIdx: number,
  dayMaster: string,
  startAge: number,
  isForward: boolean,
  currentAge: number
): DaewoonResult {
  const pillars: DaewoonPillar[] = [];
  const direction = isForward ? 1 : -1;

  for (let i = 0; i < 10; i++) {
    const stemIdx = ((monthStemIdx + direction * (i + 1)) % 10 + 10) % 10;
    const branchIdx = ((monthBranchIdx + direction * (i + 1)) % 12 + 12) % 12;
    
    const stem = STEMS[stemIdx];
    const branch = BRANCHES[branchIdx];
    const pillarStartAge = startAge + i * 10;
    const pillarEndAge = pillarStartAge + 9;
    const koreanAge = currentAge + 1;
    const isCurrent = koreanAge >= pillarStartAge && koreanAge <= pillarEndAge;

    pillars.push({
      index: i,
      startAge: pillarStartAge,
      endAge: pillarEndAge,
      stem,
      branch,
      full: `${stem}${branch}`,
      stemElement: FIVE_ELEMENTS_MAP[stem] || "unknown",
      branchElement: FIVE_ELEMENTS_MAP[branch] || "unknown",
      tenGodStem: calculateTenGod(dayMaster, stem),
      tenGodBranch: calculateTenGodBranch(dayMaster, branch),
      isCurrent,
    });
  }

  const currentDaewoon = pillars.find(p => p.isCurrent) || null;
  const transitionInfo = calculateTransitionInfo(currentAge, pillars);

  const koreanAgeForChanging = currentAge + 1;
  const isDaewoonChangingYear = currentDaewoon
    ? (koreanAgeForChanging - currentDaewoon.startAge <= 1) || (currentDaewoon.endAge - koreanAgeForChanging <= 1)
    : false;

  const CURRENT_YEAR = new Date().getFullYear();
  const seun = calculateSeWoon(CURRENT_YEAR);
  const currentSeun = {
    year: CURRENT_YEAR,
    ...seun,
    stemElement: FIVE_ELEMENTS_MAP[seun.stem] || "unknown",
    branchElement: FIVE_ELEMENTS_MAP[seun.branch] || "unknown",
    tenGodStem: calculateTenGod(dayMaster, seun.stem),
    tenGodBranch: calculateTenGodBranch(dayMaster, seun.branch),
  };

  return {
    startAge,
    isForward,
    pillars,
    currentDaewoon,
    currentAge,
    is_daeun_changing_year: isDaewoonChangingYear,
    current_seun: currentSeun,
    transitionInfo,
  };
}

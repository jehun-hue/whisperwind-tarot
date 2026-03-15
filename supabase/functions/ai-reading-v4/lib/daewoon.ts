import { findSolarTermJD, MONTH_JEOL_LONGS } from "./solarTerm.ts";
import { STEMS, BRANCHES, FIVE_ELEMENTS_MAP } from "./fiveElements.ts";
import { calculateTenGod } from "./tenGods.ts";

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
}

export interface DaewoonResult {
  startAge: number;           // 대운 시작 나이
  isForward: boolean;         // 순행 여부
  pillars: DaewoonPillar[];   // 10개 대운 기둥
  currentDaewoon: DaewoonPillar | null;
  currentAge: number;
  is_daeun_changing_year: boolean;
  current_seun: any;
}

export function getDaewoonInfo(
  yearStemIdx: number, 
  gender: 'M' | 'F', 
  sunLong: number, 
  jd: number, 
  year: number
): { age: number; isForward: boolean } {
  // Ensure we have numbers
  const sLong = Number(sunLong) || 0;
  const jval = Number(jd) || 0;
  const yval = Number(year) || 2000;

  const isYangYear = (Number(yearStemIdx) || 0) % 2 === 0;
  const isForward = (isYangYear && gender === 'M') || (!isYangYear && gender === 'F');

  const termIdx = Math.floor((sLong - 315 + 360) % 360 / 30);
  const currentJeolLong = MONTH_JEOL_LONGS[termIdx];
  const nextJeolLong = MONTH_JEOL_LONGS[(termIdx + 1) % 12];

  const currentJeolJD = findSolarTermJD(yval - (sLong < currentJeolLong ? 1 : 0), currentJeolLong);
  const nextJeolJD = findSolarTermJD(yval + (sLong >= 315 && nextJeolLong < 315 ? 1 : 0), nextJeolLong);

  let diff = isForward ? (nextJeolJD - jval) : (jval - currentJeolJD);
  
  if (!Number.isFinite(diff) || diff < 0) diff = 0;

  const daewoonAge = Math.max(1, Math.round(diff / 3));
  const finalAge = Number.isFinite(daewoonAge) ? daewoonAge : 1;
  return { age: finalAge, isForward };
}

/**
 * 전체 대운 기둥 10개 생성
 * @param monthStemIdx - 월주 천간 인덱스 (0~9)
 * @param monthBranchIdx - 월주 지지 인덱스 (0~11)
 * @param dayMaster - 일간 한자 (예: "甲")
 * @param startAge - getDaewoonInfo()에서 반환한 시작 나이
 * @param isForward - 순행 여부
 * @param currentAge - 현재 나이 (만 나이)
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
    const isCurrent = currentAge >= pillarStartAge && currentAge <= pillarEndAge;

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
      tenGodBranch: calculateTenGod(dayMaster, branch),  // 본기 기준
      isCurrent,
    });
  }

  const currentDaewoon = pillars.find(p => p.isCurrent) || null;

  // B-69new: 대운 교체기 감지 — 현재 나이가 대운 시작 후 1년 이내 또는 종료 전 1년 이내
  const isDaewoonChangingYear = currentDaewoon
    ? (currentAge - currentDaewoon.startAge <= 1) || (currentDaewoon.endAge - currentAge <= 1)
    : false;

  // B-69new: 세운(올해 운) 계산 — 현재 연도 천간·지지
  const CURRENT_YEAR = new Date().getFullYear();
  const seunYearIdx = (CURRENT_YEAR - 4) % 60;
  const seunStemIdx = ((seunYearIdx % 10) + 10) % 10;
  const seunBranchIdx = ((seunYearIdx % 12) + 12) % 12;
  const currentSeun = {
    year: CURRENT_YEAR,
    stem: STEMS[seunStemIdx],
    branch: BRANCHES[seunBranchIdx],
    full: `${STEMS[seunStemIdx]}${BRANCHES[seunBranchIdx]}`,
    stemElement: FIVE_ELEMENTS_MAP[STEMS[seunStemIdx]] || "unknown",
    branchElement: FIVE_ELEMENTS_MAP[BRANCHES[seunBranchIdx]] || "unknown",
    tenGodStem: calculateTenGod(dayMaster, STEMS[seunStemIdx]),
    tenGodBranch: calculateTenGod(dayMaster, BRANCHES[seunBranchIdx]),
  };

  return {
    startAge,
    isForward,
    pillars,
    currentDaewoon,
    currentAge,
    is_daeun_changing_year: isDaewoonChangingYear,
    current_seun: currentSeun,
  };
}

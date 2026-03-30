/**
 * sajuEngine.ts (Root / Production)
 * - High-precision VSOP87 solar terms.
 * - Longitude-based solar time correction.
 * - Object-based pillar return format for V9.1 API.
 */

import { calculateJulianDay } from "./lib/julianDay.ts";
import { getSunLongitude } from "./lib/solarTerm.ts";
import { STEMS, BRANCHES, FIVE_ELEMENTS_MAP, ELEMENT_KOREAN, SUPPORT_ELEM, HIDDEN_STEMS } from "./lib/fiveElements.ts";
import { getYearPillar } from "./lib/yearPillar.ts";
import { getMonthPillar } from "./lib/monthPillar.ts";
import { getDayPillar } from "./lib/dayPillar.ts";
import { getHourPillar } from "./lib/hourPillar.ts";
import { calculateTenGod, calculateTenGodBranch } from "./lib/tenGods.ts";
import { getKoreanTimezoneOffset } from "./lib/timeUtils.ts";
import { getDaewoonInfo, calculateFullDaewoon, type DaewoonResult } from "./lib/daewoon.ts";
import { determineGyeokguk } from "./lib/gyeokguk.ts";
import { calculateFortune } from "./lib/fortuneEngine.ts";
import { lunarToSolar } from "./lib/lunarConverter.ts";
import { calculateInteractions, calculateShinsalGrouped, calculateGongmang, calculateGwimunWonjin } from "./lib/interactions.ts";

export type YajasiMode = 'change_day' | 'keep_day';

export interface SajuPillar {
  stem: string;
  branch: string;
  tenGod: string;
  elements: string[];
}

export interface SajuPillars {
  year: { stem: string; branch: string };
  month: { stem: string; branch: string };
  day: { stem: string; branch: string };
  hour: { stem: string; branch: string };
  dayMaster: string;
}

// ── 조후 및 보조 점수 가중치 ──
const POS_W: Record<string, number> = {
  ys: 8, ms: 30, hs: 8,
  yb: 10, mb: 40, db: 15, hb: 10
};

/**
 * Phase 3: 지장간 경과일수 가중치
 * 절기 진입 후 경과 일수에 따라 여기→중기→본기 에너지 전환
 * jijanggan.ts의 JIJANGGAN_TABLE 일수 기준 사용
 */
function getHiddenWeights(
  branch: string,
  daysSinceJeol: number
): number[] {
  // 午, 亥 등 정밀 일수 보정
  const JIJANGGAN_DAYS_PRECISE: Record<string, number[]> = {
    "子": [10, 0, 20],
    "丑": [9, 3, 18],
    "寅": [7, 7, 16],
    "卯": [10, 0, 20],
    "辰": [9, 3, 18],
    "巳": [7, 7, 16],
    "午": [10, 9, 11],
    "未": [9, 3, 18],
    "申": [7, 7, 16],
    "酉": [10, 0, 20],
    "戌": [9, 3, 18],
    "亥": [7, 5, 18],
  };

  const days = JIJANGGAN_DAYS_PRECISE[branch] || [10, 0, 20];
  const [d1, d2, d3] = days;

  // 경과일이 없거나 음수면 본기 100%
  if (daysSinceJeol <= 0) return [0, 0, 1.0];

  // 경과 일수에 따라 단계적 가중치 (순서: 여기, 중기, 본기)
  if (daysSinceJeol <= d1) {
    // 여기 구간: 여기 주도, 본기 기본값
    const ratio = daysSinceJeol / d1;
    return [1.0 - ratio * 0.3, 0, 0.2 + ratio * 0.1];
  } else if (d2 > 0 && daysSinceJeol <= d1 + d2) {
    // 중기 구간
    const ratio = (daysSinceJeol - d1) / d2;
    return [0.3 - ratio * 0.2, 1.0 - ratio * 0.3, 0.3 + ratio * 0.2];
  } else {
    // 본기 구간: 본기 주도
    const elapsed = daysSinceJeol - d1 - d2;
    const ratio = Math.min(elapsed / d3, 1.0);
    return [0.1 * (1 - ratio), d2 > 0 ? 0.2 * (1 - ratio) : 0, 0.7 + ratio * 0.3];
  }
}

export function calculateSaju(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  gender: 'M' | 'F' = 'M',
  longitude: number = 127.5,
  hasTime: boolean = true,
  yajasiMode: YajasiMode = 'keep_day',
  isLunar: boolean = false,
  isLeapMonth: boolean = false
) {
  // ─── 0. 음력→양력 변환 ───
  if (isLunar) {
    try {
      const solar = lunarToSolar(year, month, day, isLeapMonth);
      year = solar.year;
      month = solar.month;
      day = solar.day;
      console.log(`[sajuEngine] 음력→양력 변환: ${year}-${month}-${day}`);
    } catch (e) {
      console.error("[sajuEngine] 음력 변환 실패, 원본 날짜 사용:", e);
    }
  }

  // 1. Time correction (Handle UTC environment)
  const timezoneOffset = getKoreanTimezoneOffset(year, month, day); 
  
  const wallClockUTC = Date.UTC(year, month - 1, day, hour, minute);
  const birthMomentUTC = wallClockUTC - (timezoneOffset * 60 * 60 * 1000);
  
  const lmtMoment = birthMomentUTC + (longitude / 15) * 60 * 60 * 1000;
  let correctedDate = new Date(lmtMoment);
  
  const lmtHour = correctedDate.getUTCHours();
  if (lmtHour >= 23 && yajasiMode === 'change_day') {
    correctedDate = new Date(lmtMoment + 2 * 60 * 60 * 1000);
  }

  const jd = calculateJulianDay(correctedDate);
  // 1.5. Prepare UTC JD for astronomical calculations (Year/Month/Solar Terms)
  const utcJD = calculateJulianDay(new Date(birthMomentUTC));
  const sunLong = getSunLongitude(utcJD);

  // 2. Pillars
  const yP = getYearPillar(year, utcJD);
  const mP = getMonthPillar(sunLong, (yP.idx % 10));
  const dP = getDayPillar(jd);
  const hP = getHourPillar((dP.idx % 10), lmtHour);

  const dayMaster = dP.stem;

  // 3. Stats & Ten Gods
  const yearTG = { stem: calculateTenGod(dayMaster, yP.stem), branch: calculateTenGodBranch(dayMaster, yP.branch) };
  const monthTG = { stem: calculateTenGod(dayMaster, mP.stem), branch: calculateTenGodBranch(dayMaster, mP.branch) };
  const dayTGBranch = calculateTenGodBranch(dayMaster, dP.branch);
  const hourTG = { stem: calculateTenGod(dayMaster, hP.stem), branch: calculateTenGodBranch(dayMaster, hP.branch) };

  // Five Elements
  const chars = [yP.stem, yP.branch, mP.stem, mP.branch, dP.stem, dP.branch, hP.stem, hP.branch];
  const elementsCount: Record<string, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  chars.forEach(c => {
    const el = FIVE_ELEMENTS_MAP[c];
    if (el) elementsCount[el]++;
  });

  // Daewoon
  const dw = getDaewoonInfo(yP.idx % 10, gender, sunLong, jd, correctedDate.getUTCFullYear());

  // Phase 4-4: 전체 대운 기둥 생성 (타입 완전성 확보)
  const currentYear = new Date().getFullYear();
  const birthYear = correctedDate.getUTCFullYear();
  const currentAge = currentYear - birthYear;
  const mStemIdx = STEMS.indexOf(mP.stem);
  const mBranchIdx = BRANCHES.indexOf(mP.branch);
  const fullDaewoon: DaewoonResult = calculateFullDaewoon(
    mStemIdx, mBranchIdx, dayMaster, dw.age, dw.isForward, currentAge
  );

  // Hidden Stems
  const hiddenStems = {
    year: HIDDEN_STEMS[yP.branch],
    month: HIDDEN_STEMS[mP.branch],
    day: HIDDEN_STEMS[dP.branch],
    hour: HIDDEN_STEMS[hP.branch],
  };

  // Strength Calculation
  const dmEl = FIVE_ELEMENTS_MAP[dayMaster];
  const powerElements = dmEl === "wood" ? ["wood", "water"] :
                        dmEl === "fire" ? ["fire", "wood"] :
                        dmEl === "earth" ? ["earth", "fire"] :
                        dmEl === "metal" ? ["metal", "earth"] : ["water", "metal"];

  const weights = {
    yearStem: 8, monthStem: 9, hourStem: 8,
    yearBranch: 10, monthBranch: 40, dayBranch: 15, hourBranch: 10
  };
  const dayMasterElement = ELEMENT_KOREAN[FIVE_ELEMENTS_MAP[dayMaster]];
  const generatingElement = SUPPORT_ELEM[dayMasterElement];

  /**
   * 지지의 지장간 가중치를 합산하여 일간을 돕는 비율을 반환
   * 천간은 기존처럼 단일 오행 판정 (도움이면 1, 아니면 0)
   */
  function calcHelpRatio(
    char: string,
    kind: 'S' | 'B',
    dmEl: string,
    genEl: string,
    branchWeights?: number[]
  ): number {
    if (kind === 'S') {
      const el = ELEMENT_KOREAN[FIVE_ELEMENTS_MAP[char]] || "";
      return (el === dmEl || el === genEl) ? 1.0 : 0;
    }
    const hidden = HIDDEN_STEMS[char] || [];
    if (hidden.length === 0) return 0;
    const w = branchWeights || [0.05, 0.15, 0.80]; // [여기, 중기, 본기]
    let helpSum = 0;
    let totalSum = 0;
    hidden.forEach((hs, hIdx) => {
      const el = ELEMENT_KOREAN[FIVE_ELEMENTS_MAP[hs]] || "";
      // HIDDEN_STEMS 순서: [0]=본기, [1]=중기, [2]=여기
      // weights 순서: [0]=여기, [1]=중기, [2]=본기
      let weight = 0;
      if (hidden.length === 3) {
        if (hIdx === 0) weight = w[2];
        else if (hIdx === 1) weight = w[1];
        else weight = w[0];
      } else if (hidden.length === 2) {
        if (hIdx === 0) weight = w[2];
        else weight = w[0];
      } else {
        weight = w[2];
      }
      totalSum += weight;
      if (el === dmEl || el === genEl) helpSum += weight;
    });
    return totalSum > 0 ? helpSum / totalSum : 0;
  }

  const posArr = [
    { k:'ys', c: yP.stem,    t:'S' as const },
    { k:'yb', c: yP.branch,  t:'B' as const },
    { k:'ms', c: mP.stem,   t:'S' as const },
    { k:'mb', c: mP.branch, t:'B' as const },
    { k:'db', c: dP.branch,   t:'B' as const },
    { k:'hs', c: hP.stem,    t:'S' as const },
    { k:'hb', c: hP.branch,  t:'B' as const },
  ];

  let strengthScore = 0;
  if (powerElements.includes(FIVE_ELEMENTS_MAP[yP.stem])) strengthScore += weights.yearStem;
  if (powerElements.includes(FIVE_ELEMENTS_MAP[mP.stem])) strengthScore += weights.monthStem;
  if (powerElements.includes(FIVE_ELEMENTS_MAP[hP.stem])) strengthScore += weights.hourStem;
  if (powerElements.includes(FIVE_ELEMENTS_MAP[yP.branch])) strengthScore += weights.yearBranch;
  if (powerElements.includes(FIVE_ELEMENTS_MAP[mP.branch])) strengthScore += weights.monthBranch;
  if (powerElements.includes(FIVE_ELEMENTS_MAP[dP.branch])) strengthScore += weights.dayBranch;
  if (powerElements.includes(FIVE_ELEMENTS_MAP[hP.branch])) strengthScore += weights.hourBranch;

  const daysSinceJeol = (utcJD - yP.lastJeolJD);
  const pillarBranches = [yP.branch, mP.branch, dP.branch, hP.branch];
  const pillarWeights = pillarBranches.map(br => getHiddenWeights(br, daysSinceJeol));

  const branchWeightMap: Record<string, number[]> = {};
  pillarWeights.forEach((w, idx) => {
    const br = pillarBranches[idx];
    branchWeightMap[br] = w;
  });

  const bd: Record<string, any> = {};
  for (const p of posArr) {
    const bw = (p.t === 'B') ? (branchWeightMap[p.c] || [0.05, 0.15, 0.80]) : undefined;
    const ratio = calcHelpRatio(p.c, p.t, dayMasterElement, generatingElement, bw);
    const sc = Math.round(POS_W[p.k] * ratio * 10) / 10;
    strengthScore += sc;
    const mainEl = (p.t === 'S')
      ? (ELEMENT_KOREAN[FIVE_ELEMENTS_MAP[p.c]] || "")
      : (ELEMENT_KOREAN[FIVE_ELEMENTS_MAP[(HIDDEN_STEMS[p.c] || [])[0]]] || "");
    bd[p.k] = { el: mainEl, help: ratio > 0, sc };
  }

  // 진술축미 보정: 습토(丑辰)는 목·금·수 일간에게 반점 가산
  const WET = ['丑','辰'];
  const WET_FAV = ['목','금','수'];
  for (const p of posArr) {
    if (p.t !== 'B') continue;
    if (!WET.includes(p.c)) continue;
    const mainBrEl = ELEMENT_KOREAN[FIVE_ELEMENTS_MAP[(HIDDEN_STEMS[p.c] || [])[0]]] || "";
    if (mainBrEl !== '토') continue;
    if (!WET_FAV.includes(dayMasterElement)) continue;
    const bonus = Math.floor(POS_W[p.k] * 0.5);
    strengthScore += bonus;
    bd[p.k].sc += bonus;
    bd[p.k].help = true;
  }

  const strengthPercent = Math.round((strengthScore / 110) * 100);
  let strength: string;
  if (strengthPercent >= 85) strength = "극신강";
  else if (strengthPercent >= 65) strength = "신강";
  else if (strengthPercent >= 50) strength = "약변강";
  else if (strengthPercent >= 40) strength = "중화";
  else if (strengthPercent >= 30) strength = "강변약";
  else if (strengthPercent >= 15) strength = "신약";
  else strength = "극신약";

  const strength_detail = {
    score: strengthScore,
    percent: strengthPercent,
    overall: strength
  };

  const allTG = [yearTG.stem, yearTG.branch, monthTG.stem, monthTG.branch, dayTGBranch, hourTG.stem, hourTG.branch];
  const tenGods: Record<string, number> = {
    "비견": 0, "겁재": 0, "식신": 0, "상관": 0, "편재": 0, "정재": 0, "편관": 0, "정관": 0, "편인": 0, "정인": 0
  };
  allTG.forEach(tg => { if (tenGods[tg] !== undefined) tenGods[tg]++; });

  const gyeokResult = determineGyeokguk(
    { year: [yP.stem, yP.branch], month: [mP.stem, mP.branch], day: [dP.stem, dP.branch], hour: [hP.stem, hP.branch] },
    dayMaster,
    tenGods,
    strengthScore / 100
  );

  const dmElement = FIVE_ELEMENTS_MAP[dayMaster];
  const KR_EL_MAP: Record<string, string> = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };
  const ENG_EL_MAP: Record<string, string> = { "木": "wood", "火": "fire", "土": "earth", "金": "metal", "水": "water" };
  const dmElKR = KR_EL_MAP[dmElement];
  const GEN: Record<string, string> = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
  const GEN_BY: Record<string, string> = { "火": "木", "土": "火", "金": "土", "水": "金", "木": "水" };
  const CON_BY: Record<string, string> = { "土": "木", "金": "火", "水": "土", "木": "金", "火": "水" };

  let yongShin: string;
  if (gyeokResult.type === "외격" && gyeokResult.yongShinElement) {
    yongShin = gyeokResult.yongShinElement;
  } else if (strength === "극신약" || strength === "신약") {
    const bigyeop = dmElKR;
    const insung = GEN_BY[dmElKR];
    const bigyeopCount = elementsCount[ENG_EL_MAP[bigyeop]] || 0;
    const insungCount = elementsCount[ENG_EL_MAP[insung]] || 0;
    yongShin = bigyeopCount <= insungCount ? bigyeop : insung;
  } else if (strength === "중화") {
    yongShin = dmElKR;
  } else {
    const sikSang = GEN[dmElKR];
    const gwanSung = CON_BY[dmElKR];
    const sikCount = elementsCount[ENG_EL_MAP[sikSang]] || 0;
    const gwanCount = elementsCount[ENG_EL_MAP[gwanSung]] || 0;
    yongShin = sikCount <= gwanCount ? sikSang : gwanSung;
  }

  const heeShin = GEN_BY[yongShin];
  const giShin = CON_BY[yongShin];
  const guShin = GEN_BY[giShin];
  const allElements = ["木", "火", "土", "金", "水"];
  const usedElements = [yongShin, heeShin, giShin, guShin];
  const hanShin = allElements.find(e => !usedElements.includes(e)) || GEN[dmElKR];

  const fortune = calculateFortune(
    dayMaster, yongShin, heeShin, giShin, guShin, hanShin,
    [yP.stem, mP.stem, dP.stem, hP.stem],
    [yP.branch, mP.branch, dP.branch, hP.branch],
    fullDaewoon.currentDaewoon?.stem || null,
    fullDaewoon.currentDaewoon?.branch || null
  );

  // ─── 5. 상호작용 및 부가 분석 ────
  const stems = [yP.stem, mP.stem, dP.stem, hP.stem];
  const branches = [yP.branch, mP.branch, dP.branch, hP.branch];
  const interactions = calculateInteractions(stems, branches);

  const gongmang = calculateGongmang(dP.stem, dP.branch, {
    year: yP.branch, month: mP.branch, day: dP.branch, hour: hP.branch
  });

  const shinsalGrouped = calculateShinsalGrouped(
    dayMaster, dP.branch,
    { year: yP.branch, month: mP.branch, day: dP.branch, hour: hP.branch },
    stems
  );

  return {
    year: { stem: yP.stem, branch: yP.branch, tenGod: yearTG },
    month: { stem: mP.stem, branch: mP.branch, tenGod: monthTG },
    day: { stem: dP.stem, branch: dP.branch, tenGod: { stem: "일간", branch: dayTGBranch } },
    hour: { stem: hP.stem, branch: hP.branch, tenGod: hourTG },
    dayMaster,
    strength,
    strength_detail,
    sunLong,
    fiveElements: elementsCount,
    elements: elementsCount,
    tenGods,
    yongShin,
    heeShin,
    giShin,
    guShin,
    hanShin,
    gyeokguk: gyeokResult,
    fortune: fortune,
    daewoon: fullDaewoon,
    hiddenStems,
    interactions,        // ← 신규: 형충회합 배열
    gongmang,           // ← 신규: 공망
    shinsalGrouped,     // ← 신규: 주별 분류 신살
    originalInput: { year, month, day, hour, minute, gender, yajasiMode },
    correctedDate: !isNaN(correctedDate.getTime()) ? correctedDate.toISOString() : "Invalid Date"
  };
}

// 명칭 호환성 유지 (Legacy 지원)
export { calculateSaju as getFullSaju };

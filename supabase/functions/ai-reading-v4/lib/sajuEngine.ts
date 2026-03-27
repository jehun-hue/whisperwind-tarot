/**
 * sajuEngine.ts
 * Main coordinator for Saju (Four Pillars) calculation.
 */

import { calculateJulianDay } from "./julianDay.ts";
import { getSunLongitude } from "./solarTerm.ts";
import { STEMS, BRANCHES, FIVE_ELEMENTS_MAP } from "./fiveElements.ts";
import { getYearPillar } from "./yearPillar.ts";
import { getMonthPillar } from "./monthPillar.ts";
import { getDayPillar } from "./dayPillar.ts";
import { getHourPillar } from "./hourPillar.ts";
import { calculateTenGod, calculateTenGodBranch } from "./tenGods.ts";
import { HIDDEN_STEMS } from "./fiveElements.ts";
import { getKoreanTimezoneOffset } from "./timeUtils.ts";
import { getDaewoonInfo } from "./daewoon.ts";
import { determineGyeokguk } from "./gyeokguk.ts";
import { calculateFortune } from "./fortuneEngine.ts";

export type YajasiMode = 'change_day' | 'keep_day';

export interface SajuPillar {
  stem: string;
  branch: string;
  tenGod: string;
  elements: string[];
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
  yajasiMode: YajasiMode = 'keep_day'
) {
  // 1. Time correction (Handle UTC environment)
  const timezoneOffset = getKoreanTimezoneOffset(year, month, day); // 9 for KST, 10 for KDT
  
  // Create a Date object in the system's UTC context, representing KST/KDT wall clock
  const wallClockUTC = Date.UTC(year, month - 1, day, hour, minute);
  const birthMomentUTC = wallClockUTC - (timezoneOffset * 60 * 60 * 1000);
  
  // Solar Mean Time (LMT) calculation
  const lmtMoment = birthMomentUTC + (longitude / 15) * 60 * 60 * 1000;
  let correctedDate = new Date(lmtMoment);
  
  // 야자시(夜子時) 처리: 23시 이후 날짜 변경 옵션
  const lmtHour = correctedDate.getUTCHours();
  if (lmtHour >= 23 && yajasiMode === 'change_day') {
    correctedDate = new Date(lmtMoment + 2 * 60 * 60 * 1000); // 다음날로 넘기기 위해 충분한 시간(2시간) 추가
  }

  const jd = calculateJulianDay(correctedDate);
  const sunLong = getSunLongitude(jd);

  // 2. Pillars
  const yP = getYearPillar(year, jd); // Year/Month depend on Solar Terms/JD
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

  // Hidden Stems
  const hiddenStems = {
    year: HIDDEN_STEMS[yP.branch],
    month: HIDDEN_STEMS[mP.branch],
    day: HIDDEN_STEMS[dP.branch],
    hour: HIDDEN_STEMS[hP.branch],
  };

  // Strength (Simple dummy logic based on count for now, but user asks for a return - "중신약")
  // Strength Calculation (Precision 100-point system)
  const dmEl = FIVE_ELEMENTS_MAP[dayMaster];
  const powerElements = dmEl === "wood" ? ["wood", "water"] :
                        dmEl === "fire" ? ["fire", "wood"] :
                        dmEl === "earth" ? ["earth", "fire"] :
                        dmEl === "metal" ? ["metal", "earth"] : ["water", "metal"];

  const weights = {
    yearStem: 8,
    monthStem: 9,
    hourStem: 8,
    yearBranch: 10,
    monthBranch: 40, // Deuk-Ryeong (Core)
    dayBranch: 15,   // Deuk-Ji
    hourBranch: 10
  };

  let strengthScore = 0;
  if (powerElements.includes(FIVE_ELEMENTS_MAP[yP.stem])) strengthScore += weights.yearStem;
  if (powerElements.includes(FIVE_ELEMENTS_MAP[mP.stem])) strengthScore += weights.monthStem;
  if (powerElements.includes(FIVE_ELEMENTS_MAP[hP.stem])) strengthScore += weights.hourStem;
  if (powerElements.includes(FIVE_ELEMENTS_MAP[yP.branch])) strengthScore += weights.yearBranch;
  if (powerElements.includes(FIVE_ELEMENTS_MAP[mP.branch])) strengthScore += weights.monthBranch;
  if (powerElements.includes(FIVE_ELEMENTS_MAP[dP.branch])) strengthScore += weights.dayBranch;
  if (powerElements.includes(FIVE_ELEMENTS_MAP[hP.branch])) strengthScore += weights.hourBranch;

  const strength = strengthScore >= 80 ? "극신강" :
                   strengthScore >= 55 ? "신강" :
                   strengthScore >= 45 ? "중화" :
                   strengthScore >= 30 ? "신약" : "극신약";

  // 10. 십성 집계
  const allTG = [yearTG.stem, yearTG.branch, monthTG.stem, monthTG.branch, dayTGBranch, hourTG.stem, hourTG.branch];
  const tenGods: Record<string, number> = {
    "비견": 0, "겁재": 0, "식신": 0, "상관": 0, "편재": 0, "정재": 0, "편관": 0, "정관": 0, "편인": 0, "정인": 0
  };
  allTG.forEach(tg => { if (tenGods[tg] !== undefined) tenGods[tg]++; });

  // 11. 격국 & 용신
  const gyeokResult = determineGyeokguk(
    { year: [yP.stem, yP.branch], month: [mP.stem, mP.branch], day: [dP.stem, dP.branch], hour: [hP.stem, hP.branch] },
    dayMaster,
    tenGods,
    strengthScore / 100
  );

  // 12. 5신(五神) 도출 (정밀 로직)
  const isExtremeStrong = strength === "극신강";
  const isStrong = strength === "신강";
  const isNeutral = strength === "중화";
  const isWeak = strength === "신약";
  const isExtremeWeak = strength === "극신약";

  const dmElement = FIVE_ELEMENTS_MAP[dayMaster];
  const KR_EL_MAP: Record<string, string> = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };
  const EN_EL_MAP: Record<string, string> = { "木": "wood", "火": "fire", "土": "earth", "金": "metal", "水": "water" };
  const dmElKR = KR_EL_MAP[dmElement];
  
  const GEN: Record<string, string> = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
  const CON: Record<string, string> = { "木": "土", "火": "金", "土": "水", "金": "木", "水": "火" };
  const GEN_BY: Record<string, string> = { "火": "木", "土": "火", "金": "土", "水": "金", "木": "水" };
  const CON_BY: Record<string, string> = { "土": "木", "金": "火", "수": "土", "木": "金", "火": "水" };

  let yongShin: string;
  if (gyeokResult.type === "외격" && gyeokResult.yongShinElement) {
    yongShin = gyeokResult.yongShinElement;
  } else {
    if (isWeak || isExtremeWeak) {
      // 신약: 비겁(dmElKR) 또는 인성(GEN_BY[dmElKR]) 중 부족한 쪽
      const biCount = elementsCount[EN_EL_MAP[dmElKR] || "wood"] || 0;
      const inCount = elementsCount[EN_EL_MAP[GEN_BY[dmElKR]] || "wood"] || 0;
      yongShin = (biCount <= inCount) ? dmElKR : GEN_BY[dmElKR];
    } else if (isNeutral) {
      yongShin = dmElKR;
    } else {
      // 신강: 식상(GEN[dmElKR]) 또는 관성(CON_BY[dmElKR]) 중 부족한 쪽
      const sikCount = elementsCount[EN_EL_MAP[GEN[dmElKR]] || "wood"] || 0;
      const gwanCount = elementsCount[EN_EL_MAP[CON_BY[dmElKR]] || "wood"] || 0;
      yongShin = (sikCount <= gwanCount) ? GEN[dmElKR] : CON_BY[dmElKR];
    }
  }

  // 5신 순서: 용신 -> 희신(생) -> 기신(극) -> 구신(기신생) -> 한신
  const heeShin = GEN_BY[yongShin];
  const giShin = CON_BY[yongShin];
  const guShin = GEN_BY[giShin];
  const allElements = ["木", "火", "土", "金", "水"];
  const hanShin = allElements.find(e => ![yongShin, heeShin, giShin, guShin].includes(e)) || "木";

  // 13. 운세(Fortune)
  const fortune = calculateFortune(
    dayMaster, yongShin, heeShin, giShin, guShin, hanShin,
    [yP.stem, mP.stem, dP.stem, hP.stem],
    [yP.branch, mP.branch, dP.branch, hP.branch],
    dw.currentDaewoon?.stem || null,
    dw.currentDaewoon?.branch || null
  );

  return {
    year: { stem: yP.stem, branch: yP.branch, tenGod: yearTG },
    month: { stem: mP.stem, branch: mP.branch, tenGod: monthTG },
    day: { stem: dP.stem, branch: dP.branch, tenGod: { stem: "일간", branch: dayTGBranch } },
    hour: { stem: hP.stem, branch: hP.branch, tenGod: hourTG },
    dayMaster,
    strength,
    fiveElements: elementsCount,
    tenGods,
    yongShin,
    heeShin,
    giShin,
    guShin,
    hanShin,
    gyeokguk: gyeokResult,
    fortune: fortune,
    daewoon: dw,
    hiddenStems,
    originalInput: { year, month, day, hour, minute, gender, yajasiMode },
    correctedDate: !isNaN(correctedDate.getTime()) ? correctedDate.toISOString() : "Invalid Date"
  };
}

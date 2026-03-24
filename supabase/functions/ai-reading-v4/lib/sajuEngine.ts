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
import { HIDDEN_STEMS, calculateTenGod, calculateTenGodBranch } from "./tenGods.ts";
import { getKoreanTimezoneOffset } from "./timeUtils.ts";
import { getDaewoonInfo } from "./daewoon.ts";

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
  hasTime: boolean = true
) {
  // 1. Time correction (Handle UTC environment)
  const timezoneOffset = getKoreanTimezoneOffset(year, month, day); // 9 for KST, 10 for KDT
  
  // Create a Date object in the system's UTC context, representing KST/KDT wall clock
  const wallClockUTC = Date.UTC(year, month - 1, day, hour, minute);
  const birthMomentUTC = wallClockUTC - (timezoneOffset * 60 * 60 * 1000);
  
  // Solar Mean Time (LMT) calculation
  // Local Solar Time = UTC + (longitude / 15)
  const lmtMoment = birthMomentUTC + (longitude / 15) * 60 * 60 * 1000;
  const correctedDate = new Date(lmtMoment);

  const jd = calculateJulianDay(correctedDate);
  const sunLong = getSunLongitude(jd);

  // 2. Pillars
  const yP = getYearPillar(correctedDate.getUTCFullYear(), jd);
  const mP = getMonthPillar(sunLong, (yP.idx % 10));
  const dP = getDayPillar(jd);
  const hP = getHourPillar((dP.idx % 10), correctedDate.getUTCHours());

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

  return {
    year: { stem: yP.stem, branch: yP.branch, tenGod: yearTG },
    month: { stem: mP.stem, branch: mP.branch, tenGod: monthTG },
    day: { stem: dP.stem, branch: dP.branch, tenGod: { stem: "일간", branch: dayTGBranch } },
    hour: { stem: hP.stem, branch: hP.branch, tenGod: hourTG },
    dayMaster,
    strength,
    fiveElements: elementsCount,
    daewoon: dw,
    hiddenStems,
    originalInput: { year, month, day, hour, minute, gender },
    correctedDate: !isNaN(correctedDate.getTime()) ? correctedDate.toISOString() : "Invalid Date"
  };
}

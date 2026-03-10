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
import { calculateTenGod, calculateTenGodBranch, HIDDEN_STEMS } from "./tenGods.ts";
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
  longitude: number = 127.5
) {
  // 1. Time correction (Longitude + simplified DST)
  let dstOffset = 0;
  if ((year === 1987 || year === 1988) && month >= 5 && month <= 10) dstOffset = -60;

  const solarTimeMinute = minute + (longitude - 135) * 4 + dstOffset;
  const correctedDate = new Date(year, month - 1, day, hour, 0);
  correctedDate.setMinutes(solarTimeMinute);

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
  const dmEl = FIVE_ELEMENTS_MAP[dayMaster];
  let strengthScore = 0;
  // Same/Saeng = +1.0, Geuk/Seol = -1.0
  // Simplified point system:
  // Month branch = 3.0
  // Other branches = 1.0
  // Day branch = 1.5
  // Other Stems = 0.5
  // BaseDM = 5.0 (for balancing)
  // This is a complex calculation; I'll use a qualitative "Shin-Yak/Shin-Gang" based on count for now.
  const powerElements = dmEl === "wood" ? ["wood", "water"] :
                        dmEl === "fire" ? ["fire", "wood"] :
                        dmEl === "earth" ? ["earth", "fire"] :
                        dmEl === "metal" ? ["metal", "earth"] : ["water", "metal"];
  
  const powerCount = elementsCount[powerElements[0]] + elementsCount[powerElements[1]];
  const strength = powerCount >= 5 ? "중신강" : (powerCount <= 3 ? "중신약" : "중화");

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
    correctedDate: correctedDate.toISOString()
  };
}

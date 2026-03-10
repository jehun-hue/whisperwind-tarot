/**
 * yearPillar.ts
 */

import { findSolarTermJD } from "./solarTerm.ts";
import { STEMS, BRANCHES } from "./fiveElements.ts";

export function getYearPillar(year: number, jd: number): { stem: string; branch: string; idx: number } {
  // Ip-chun JD for current year
  const ipChunJD = findSolarTermJD(year, 315);
  let yearForPillar = year;
  
  if (jd < ipChunJD) {
    yearForPillar -= 1;
  }
  
  const idx = (yearForPillar - 4) % 60;
  const stemIdx = idx % 10;
  const branchIdx = idx % 12;
  
  return { 
    stem: STEMS[(stemIdx + 10) % 10], 
    branch: BRANCHES[(branchIdx + 12) % 12], 
    idx 
  };
}

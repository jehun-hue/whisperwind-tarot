/**
 * monthPillar.ts
 */

import { getSunLongitude } from "./solarTerm.ts";
import { STEMS, BRANCHES } from "./fiveElements.ts";

export function getMonthPillar(sunLong: number, yearStemIdx: number): { stem: string; branch: string; idx: number } {
  // Normalize 315 deg to Month 1
  // normalize: 315 -> 0, 345 -> 1 ...
  const termIdx = Math.floor((sunLong - 315 + 360) % 360 / 30); // 0 corresponds to Month 1 Jeol-gi
  
  // Month numbering: Month 1 is In(2)
  const monthBranchIdx = (termIdx + 2) % 12;
  
  // Month stem
  const monthStemBase = ((yearStemIdx + 10) % 5 * 2 + 2) % 10;
  const monthStemIdx = (monthStemBase + termIdx) % 10;
  
  return {
    stem: STEMS[monthStemIdx],
    branch: BRANCHES[monthBranchIdx],
    idx: (monthStemIdx * 12 + monthBranchIdx) % 60 // Placeholder idx?
  };
}

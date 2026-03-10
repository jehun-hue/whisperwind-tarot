/**
 * dayPillar.ts
 */

import { calculateJulianDay } from "./julianDay.ts";
import { STEMS, BRANCHES } from "./fiveElements.ts";

export function getDayPillar(jd: number): { stem: string; branch: string; idx: number } {
  // 1970-01-01 (JD 2440587.5) was Kye-Hae?
  // Let's use a known anchor.
  // 1950-01-01 was JD 2433282.5 (Sin-Hae indexing?)
  // Actually common formula is (jd + 0.5 + 49) % 60.
  // Let's test with 2000-01-01.
  
  const idx = Math.floor(jd + 0.5 + 49) % 60;
  const stem = STEMS[idx % 10];
  const branch = BRANCHES[idx % 12];
  
  return { stem, branch, idx };
}

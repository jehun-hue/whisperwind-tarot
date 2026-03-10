/**
 * daewoon.ts
 */

import { findSolarTermJD, MONTH_JEOL_LONGS } from "./solarTerm.ts";

export function getDaewoonInfo(
  yearStemIdx: number, 
  gender: 'M' | 'F', 
  sunLong: number, 
  jd: number, 
  year: number
): { age: number; isForward: boolean } {
  const isYangYear = yearStemIdx % 2 === 0;
  const isForward = (isYangYear && gender === 'M') || (!isYangYear && gender === 'F');

  const termIdx = Math.floor((sunLong - 315 + 360) % 360 / 30);
  const currentJeolLong = MONTH_JEOL_LONGS[termIdx];
  const nextJeolLong = MONTH_JEOL_LONGS[(termIdx + 1) % 12];
  
  // Previous/Next Jeol-gi time
  // Rough estimate first
  const currentJeolJD = findSolarTermJD(year - (sunLong < currentJeolLong ? 1 : 0), currentJeolLong);
  const nextJeolJD = findSolarTermJD(year + (sunLong >= 315 && nextJeolLong < 315 ? 1 : 0), nextJeolLong);

  let diff = isForward ? (nextJeolJD - jd) : (jd - currentJeolJD);
  if (diff < 0) diff = 0; // Guard

  const daewoonAge = Math.max(1, Math.round(diff / 3));
  
  return { age: daewoonAge, isForward };
}

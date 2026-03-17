/**
 * calculateSaju.ts
 * Main wrapper for Saju computation.
 */

import { getFullSaju } from "./sajuEngine.ts";

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
  const result = getFullSaju(year, month, day, hour, minute, gender, longitude, hasTime);
  
  // Return in required structure
  return {
    year: result.pillars.year,
    month: result.pillars.month,
    day: result.pillars.day,
    hour: result.pillars.hour,
    dayMaster: result.dayMaster,
    elements: result.elements,
    jd: result.jd,
    sunLong: result.sunLong,
    termIdx: result.termIdx,
    gender
  };
}

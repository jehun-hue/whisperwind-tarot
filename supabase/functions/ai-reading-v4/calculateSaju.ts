/**
 * calculateSaju.ts
 * Main wrapper for Saju computation.
 */

import { getFullSaju } from "./sajuEngine.ts";

export async function calculateSaju(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  gender: 'M' | 'F' = 'M',
  longitude: number = 127.5,
  hasTime: boolean = true,
  isLunar: boolean = false,
  isLeapMonth: boolean = false
) {
  console.log("[CALC SAJU RECEIVED]", { year, month, day, hour, minute, isLunar });
  const result = await getFullSaju(year, month, day, hour, minute, gender, longitude, hasTime, isLunar, isLeapMonth);
  
  // Return in required structure, including all original fields
  return {
    ...result,
    year: result.pillars?.year,
    month: result.pillars?.month,
    day: result.pillars?.day,
    hour: result.pillars?.hour,
    gender
  };
}

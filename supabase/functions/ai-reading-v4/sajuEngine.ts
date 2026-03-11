/**
 * sajuEngine.ts
 * Core Saju (Four Pillars) logic.
 * Handles Pillars, Ten Gods, Hidden Stems, and Elements.
 */

import { getSunLongitude, findSolarTermJD, MONTH_JEOL_LONGS } from "./solarTermEngine.ts";

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const FIVE_ELEMENTS: Record<string, string> = {
  "甲": "wood", "乙": "wood", "丙": "fire", "丁": "fire", "戊": "earth", "己": "earth",
  "庚": "metal", "辛": "metal", "壬": "water", "癸": "water",
  "寅": "wood", "卯": "wood", "辰": "earth", "巳": "fire", "午": "fire", "未": "earth",
  "申": "metal", "酉": "metal", "戌": "earth", "亥": "water", "子": "water", "丑": "earth"
};

const TR_ELEMENTS: Record<string, string> = {
  "wood": "목", "fire": "화", "earth": "토", "metal": "금", "water": "수"
};

export function calculateJD(date: Date): number {
  return (date.getTime() / 86400000) + 2440587.5;
}

export interface SajuPillars {
  year: { stem: string; branch: string };
  month: { stem: string; branch: string };
  day: { stem: string; branch: string };
  hour: { stem: string; branch: string };
  dayMaster: string;
}

export function getFullSaju(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  gender: 'M' | 'F' = 'M',
  longitude: number = 127.5
) {
  // 1. Longitude & DST Correction
  let dstOffset = 0;
  const mmdd = month * 100 + day;
  if (year === 1987) {
    // 1987: 5/10 02:00 ~ 10/11 03:00
    if (mmdd >= 510 && mmdd <= 1011) dstOffset = -60;
  } else if (year === 1988) {
    // 1988: 5/8 02:00 ~ 10/9 03:00
    if (mmdd >= 508 && mmdd <= 1009) dstOffset = -60;
  }
  
  const solarTimeMinute = minute + (longitude - 135) * 4 + dstOffset;
  // 입력 hour는 KST(UTC+9) 기준이므로 UTC로 변환 (9시간 차감)
  const correctedDate = new Date(Date.UTC(year, month - 1, day, hour - 9, 0));
  correctedDate.setUTCMinutes(solarTimeMinute);

  const jd = calculateJD(correctedDate);
  const sunLong = getSunLongitude(jd);

  // 2. Year Pillar (Ip-chun)
  const ipChunJD = findSolarTermJD(correctedDate.getUTCFullYear(), 315);
  let pYear = correctedDate.getUTCFullYear();
  if (jd < ipChunJD) pYear -= 1;
  const yIdx = (pYear - 4) % 60;
  const yearPillar = { stem: STEMS[(yIdx % 10 + 10) % 10], branch: BRANCHES[(yIdx % 12 + 12) % 12] };

  // 3. Month Pillar (Jeol-gi)
  const termIdx = Math.floor((sunLong - 315 + 360) % 360 / 30);
  const mBranchIdx = (termIdx + 2) % 12;
  const mStemBase = ((yIdx % 10 + 10) % 5 * 2 + 2) % 10;
  const mStemIdx = (mStemBase + termIdx) % 10;
  const monthPillar = { stem: STEMS[mStemIdx], branch: BRANCHES[mBranchIdx] };

  // 4. Day Pillar (JD cycle)
  const dIdx = Math.floor(jd + 0.5 + 49) % 60;
  const dayPillar = { stem: STEMS[dIdx % 10], branch: BRANCHES[dIdx % 12] };
  const dayMaster = dayPillar.stem;

  // 5. Hour Pillar
  // Use solar time (local hour adjusted for longitude/DST)
  const solarHourValue = hour + (solarTimeMinute / 60);
  const hBranchIdx = Math.floor(((solarHourValue + 1) % 24) / 2);
  const hStemBase = (dIdx % 10 * 2) % 10;
  const hStemIdx = (hStemBase + hBranchIdx) % 10;
  const hourPillar = { stem: STEMS[hStemIdx], branch: BRANCHES[hBranchIdx] };

  // 6. Elements Distribution
  const pillars = [yearPillar, monthPillar, dayPillar, hourPillar];
  const charArray = pillars.flatMap(p => [p.stem, p.branch]);
  const elements: Record<string, number> = { "목": 0, "화": 0, "토": 0, "금": 0, "수": 0 };
  charArray.forEach(c => {
    const el = FIVE_ELEMENTS[c];
    if (el) elements[TR_ELEMENTS[el]]++;
  });

  return {
    pillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar
    },
    dayMaster,
    elements,
    jd,
    sunLong,
    termIdx
  };
}

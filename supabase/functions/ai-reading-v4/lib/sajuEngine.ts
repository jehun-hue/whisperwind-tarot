/**
 * sajuEngine.ts
 * Main coordinator for Saju (Four Pillars) calculation.
 * 
 * [B-1 FIX] dayPillar: 벽시계시(KST) 기준 JD 사용. DST/LMT 보정 없음.
 * [B-2 FIX] DST 보정 제거 — 사주학은 KST(+9) 고정 기준.
 * [B-3 FIX] LMT 보정은 시주(hourPillar)에만 선택적 적용 가능 (현재 비활성).
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
// import { getKoreanTimezoneOffset } from "./timeUtils.ts"; // DST 비활성
import { getDaewoonInfo } from "./daewoon.ts";
import { calculateTwelveStage } from "./twelveStages.ts";

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
  // ─── 1. 시간 보정 ───
  // [B-2 FIX] 사주학 표준: DST 무시, KST(+9) 고정
  const KST_OFFSET = 9;
  
  // 벽시계시(wall-clock KST)를 UTC로 변환
  const wallClockUTC = Date.UTC(year, month - 1, day, hour, minute);
  const birthMomentUTC = wallClockUTC - (KST_OFFSET * 60 * 60 * 1000);
  
  // [B-1 FIX] 년·월·일주는 벽시계시(KST) 기준으로 계산
  // 야자시(夜子時) 보정: 23시 이후면 일주용 날짜를 다음 날로 취급
  const dayPillarDate = new Date(Date.UTC(year, month - 1, day, 12, 0));
  if (hour >= 23) {
    dayPillarDate.setUTCDate(dayPillarDate.getUTCDate() + 1);
  }
  const wallClockJD = calculateJulianDay(dayPillarDate);
  
  // 시주용 시간: 벽시계시 그대로 사용 (DST 미적용)
  // ※ LMT 보정을 원할 경우 아래 주석 해제
  // const lmtCorrection = ((longitude - 127.5) / 15) * 60; // 분 단위
  // const lmtMinutes = hour * 60 + minute + lmtCorrection;
  // const hourForPillar = Math.floor(lmtMinutes / 60);
  const hourForPillar = hour; // 벽시계시 그대로

  // 절기 계산용 JD & 태양 황경 (UTC 기준)
  const jdForSolarTerm = calculateJulianDay(new Date(birthMomentUTC));
  const sunLong = getSunLongitude(jdForSolarTerm);

  // ─── 2. 사주 기둥 ───
  // 년주: 입춘 기준 (절기용 JD 사용)
  const yP = getYearPillar(year, jdForSolarTerm);
  
  // 월주: 태양 황경 기준
  const mP = getMonthPillar(sunLong, (yP.idx % 10));
  
  // [B-1 FIX] 일주: 벽시계시 KST 날짜의 JD 사용 (DST/LMT 보정 없음)
  const dP = getDayPillar(wallClockJD);
  
  // 시주: 벽시계시 시간 사용
  const hP = getHourPillar((dP.idx % 10), hourForPillar);

  const dayMaster = dP.stem;

  // ─── 3. 십성 & 통계 ───
  const yearTG = { stem: calculateTenGod(dayMaster, yP.stem), branch: calculateTenGodBranch(dayMaster, yP.branch) };
  const monthTG = { stem: calculateTenGod(dayMaster, mP.stem), branch: calculateTenGodBranch(dayMaster, mP.branch) };
  const dayTGBranch = calculateTenGodBranch(dayMaster, dP.branch);
  const hourTG = { stem: calculateTenGod(dayMaster, hP.stem), branch: calculateTenGodBranch(dayMaster, hP.branch) };

  // 오행 카운트
  const chars = [yP.stem, yP.branch, mP.stem, mP.branch, dP.stem, dP.branch, hP.stem, hP.branch];
  const elementsCount: Record<string, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  chars.forEach(c => {
    const el = FIVE_ELEMENTS_MAP[c];
    if (el) elementsCount[el]++;
  });

  // 대운
  const dw = getDaewoonInfo(yP.idx % 10, gender, sunLong, jdForSolarTerm, year);

  // 지장간
  const hiddenStems = {
    year: HIDDEN_STEMS[yP.branch],
    month: HIDDEN_STEMS[mP.branch],
    day: HIDDEN_STEMS[dP.branch],
    hour: HIDDEN_STEMS[hP.branch],
  };

  // ─── 4. 신강/신약 ───
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
    monthBranch: 40,
    dayBranch: 15,
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
    twelveStages: {
      year: calculateTwelveStage(dP.stem, yP.branch),
      month: calculateTwelveStage(dP.stem, mP.branch),
      day: calculateTwelveStage(dP.stem, dP.branch),
      hour: calculateTwelveStage(dP.stem, hP.branch),
    },
    originalInput: { year, month, day, hour, minute, gender },
    correctedDate: new Date(birthMomentUTC).toISOString()
  };
}

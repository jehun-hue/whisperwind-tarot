/**
 * sajuEngine.ts
 * Core Saju (Four Pillars) logic.
 * Handles Pillars, Ten Gods, Hidden Stems, and Elements.
 */

import { getSunLongitude, findSolarTermJD, MONTH_JEOL_LONGS } from "./solarTermEngine.ts";

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

// 지장간(地藏干) 테이블 — 각 지지의 숨은 천간 (본기·중기·여기)
const HIDDEN_STEMS: Record<string, string[]> = {
  "子": ["壬", "癸"],
  "丑": ["己", "癸", "辛"],
  "寅": ["甲", "丙", "戊"],
  "卯": ["甲", "乙"],
  "辰": ["戊", "乙", "癸"],
  "巳": ["丙", "庚", "戊"],
  "午": ["丙", "己", "丁"],
  "未": ["己", "丁", "乙"],
  "申": ["庚", "壬", "戊"],
  "酉": ["庚", "辛"],
  "戌": ["戊", "辛", "丁"],
  "亥": ["壬", "甲"],
};
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const FIVE_ELEMENTS: Record<string, string> = {
  "甲": "wood",
  "乙": "wood",
  "丙": "fire",
  "丁": "fire",
  "戊": "earth",
  "己": "earth",
  "庚": "metal",
  "辛": "metal",
  "壬": "water",
  "癸": "water",
  "寅": "wood",
  "卯": "wood",
  "辰": "earth",
  "巳": "fire",
  "午": "fire",
  "未": "earth",
  "申": "metal",
  "酉": "metal",
  "戌": "earth",
  "亥": "water",
  "子": "water",
  "丑": "earth"
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
  longitude: number = 127.5,
  hasTime: boolean = true
) {
  // 1. Longitude & DST Correction
  // B-66new: 한국 시간대 히스토리 완전 반영
  // 1954~1961.08.09: UTC+8:30 사용 → KST(UTC+9) 기준 -30분 보정
  // 1961.08.10~ : UTC+9:00 복귀 (현재 기준)
  // DST 서머타임: 특정 연도 하절기 +60분 추가
  let dstOffset = 0;

  // UTC+8:30 구간 보정 (-30분)
  const isUTC830Period =
    (year >= 1954 && year <= 1960) ||
    (year === 1961 && (month < 8 || (month === 8 && day < 10)));
  if (isUTC830Period) dstOffset = -30;

  const mmdd = month * 100 + day;

  // DST 서머타임 적용 구간 (+60분)
  const dstPeriods: [number, number, number][] = [
    [1948, 601, 913], [1949, 403, 911], [1950, 401, 910],
    [1951, 506, 909], [1955, 505, 918], [1956, 520, 930],
    [1957, 414, 922], [1958, 504, 921], [1959, 415, 920],
    [1960, 501, 918], [1987, 510, 1011], [1988, 508, 1011],
  ];
  for (const [dstYear, startMmdd, endMmdd] of dstPeriods) {
    if (year === dstYear && mmdd >= startMmdd && mmdd <= endMmdd) {
      dstOffset += 60;
      break;
    }
  }
  // 진태양시 보정 (분 단위)
  // KST = UTC+9 = 135도 기준, 경도 1도당 4분
  const longitudeCorrectionMinutes = (longitude - 135) * 4;
  const totalOffsetMinutes = longitudeCorrectionMinutes + dstOffset;
  // ── 경도보정 후 실제 시간(Solar Time) 계산 ──
  const kstToUtcMinutes = -9 * 60;
  // B-116 fix: 진태양시 정밀 계산을 위해 베이스 시간을 UTC로 변환 후 오프셋 적용
  const solarUtcMinutes = (hour * 60 + minute + totalOffsetMinutes) + kstToUtcMinutes;
  const correctedDate = new Date(Date.UTC(year, month - 1, day, 0, solarUtcMinutes));

  // ── 경도보정 후 시간으로 야자시 판단 ──
  // KST(UTC+9) 기준으로 보정된 시간 추출
  const kstSolarDate = new Date(correctedDate.getTime() + 9 * 60 * 60000);
  const correctedHour = kstSolarDate.getUTCHours();
  const correctedMinute = kstSolarDate.getUTCMinutes();

  // 야자시(夜子時) 처리: 23:00~23:59는 자시(子時)에 해당
  // 일주(日柱) 계산 시: 야자시는 "다음날"의 자시이므로 날짜를 +1
  // 시주(時柱) 계산 시: 자시(子時, branchIdx=0)로 처리
  const isYaJaTime = correctedHour === 23;

  // 일주 계산용 날짜: 야자시면 +1일 (23시는 다음날의 자시)
  const dayPillarDate = new Date(correctedDate);
  if (isYaJaTime) {
    dayPillarDate.setUTCDate(dayPillarDate.getUTCDate() + 1);
  }

  // 시주 계산용 시간 (야자시면 0시로 처리)
  const effectiveHour = isYaJaTime ? 0 : correctedHour;

  const jd = calculateJD(dayPillarDate); // 일주 계산용 JD (야자시 보정됨)
  const jdForSun = calculateJD(correctedDate); // 월주(절기) 및 년주(입춘) 계산용 JD (원래 시간 유지)
  const sunLong = getSunLongitude(jdForSun);

  // 2. Year Pillar (Ip-chun)
  const ipChunJD = findSolarTermJD(correctedDate.getUTCFullYear(), 315);
  let pYear = correctedDate.getUTCFullYear();
  if (jdForSun < ipChunJD) pYear -= 1;
  const yIdx = (pYear - 4) % 60;
  const yearPillar = {
    stem: STEMS[(yIdx % 10 + 10) % 10],
    branch: BRANCHES[(yIdx % 12 + 12) % 12],
    year: pYear
  };

  // 3. Month Pillar (Jeol-gi) — 태양 황경 기준 절입시각으로 계산
  const termIdx = Math.floor((sunLong - 315 + 360) % 360 / 30);
  const mBranchIdx = (termIdx + 2) % 12;
  const mStemBase = ((yIdx % 10 + 10) % 5 * 2 + 2) % 10;
  const mStemIdx = (mStemBase + termIdx) % 10;
  const monthPillar = { stem: STEMS[mStemIdx], branch: BRANCHES[mBranchIdx] };

  // B-67new: 절기 경계 근처 출생 감지 (±1시간 = ±0.0417일 = 태양 이동 ±0.04°)
  // 절기 경계 황경: 315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285
  const JEOL_LONGS = [315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285];
  const isNearSolarTermBoundary = JEOL_LONGS.some(targetLong => {
    let diff = Math.abs(sunLong - targetLong);
    if (diff > 180) diff = 360 - diff;
    return diff < 0.04; // 태양 약 1시간 이동 각도 ≈ 0.04°
  });

  // 4. Day Pillar (JD cycle)
  // B-213 fix: JD 기준 일주 오프셋 수정 (50 → 49, 癸亥일/丙申일 기준 재검증)
  const dIdx = Math.floor(jd + 0.5 + 49) % 60;
  const dayPillar = { stem: STEMS[dIdx % 10], branch: BRANCHES[dIdx % 12] };
  const dayMaster = dayPillar.stem;

  // 5. Hour Pillar
  // B-194 fix: 로컬 진태양시 기준 시주 계산 + 정확한 시지 경계표 적용
  // 시지 경계: 子(23:30~01:30), 丑(01:30~03:30), 寅(03:30~05:30),
  //            卯(05:30~07:30), 辰(07:30~09:30), 巳(09:30~11:30),
  //            午(11:30~13:30), 未(13:30~15:30), 申(15:30~17:30),
  //            酉(17:30~19:30), 戌(19:30~21:30), 亥(21:30~23:30)
  const normalizedMinutes = (effectiveHour * 60 + correctedMinute);
  // 子시 시작을 23:30(=1410분)으로 정렬: +30분 후 2시간(120분) 단위로 나눔
  const hBranchIdx = Math.floor(((normalizedMinutes + 30) % 1440) / 120);
  const hStemBase = (dIdx % 10 * 2) % 10;
  const hStemIdx = (hStemBase + hBranchIdx) % 10;
  // B-228: 출생시간 "모름"일 때 시주 제외
  const hourPillar = hasTime 
    ? { stem: STEMS[hStemIdx], branch: BRANCHES[hBranchIdx] }
    : { stem: "미상", branch: "미상" };

  // 6. Elements Distribution (천간 + 지지 + 지장간 포함)
  const pillars = [yearPillar, monthPillar, dayPillar, hourPillar];
  const stemBranchArray = pillars.flatMap(p => [p.stem, p.branch]);
  const elements: Record<string, number> = { "목": 0, "화": 0, "토": 0, "금": 0, "수": 0 };

  // 천간·지지 오행 집계 (각 1점)
  stemBranchArray.forEach(c => {
    const el = FIVE_ELEMENTS[c];
    if (el) elements[TR_ELEMENTS[el]]++;
  });

  // 지장간 오행 집계 (각 0.3점 — B-176 fix: 만세력 기준에 맞게 가중치 하향)
  pillars.forEach(p => {
    const hidden = HIDDEN_STEMS[p.branch] || [];
    hidden.forEach(hs => {
      const el = FIVE_ELEMENTS[hs];
      if (el) elements[TR_ELEMENTS[el]] += 0.3;
    });
  });

  // B-56: time_corrected 플래그 — DST 또는 경도 보정이 적용됐는지 표시
  const timeCorrected = (dstOffset !== 0) || (longitude !== 135);

  // B-68new: is_borderline_time 플래그 — 야자시 경계(23:00~23:59) 출생 표시
  // AI가 "경계 시간 출생으로 두 일주의 기운이 혼재할 수 있음"을 안내할 수 있도록 함
  const isBorderlineTime = isYaJaTime;
  // B-184 fix: 오행 소수점 1자리 반올림 (예: 2.8999 → 2.9)
  const roundedElements: Record<string, number> = {};
  for (const key of Object.keys(elements)) {
    roundedElements[key] = Math.round(elements[key] * 10) / 10;
  }

  const result = {
    pillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar
    },
    dayMaster,
    elements: roundedElements,
    jd,
    sunLong,
    termIdx,
    is_near_solar_term_boundary: isNearSolarTermBoundary,
    time_corrected: timeCorrected,
    is_borderline_time: isBorderlineTime,
    has_time: hasTime,
    narrative: hasTime ? "" : "출생 시간 미입력으로 시주는 제외하고 3주(년월일)만 분석합니다."
  };

  console.log('[SAJU DEBUG]', {
    input: { year, month, day, hour, minute },
    corrected: { 
      date: correctedDate.toISOString(), 
      hour: correctedHour,
      minute: correctedMinute 
    },
    isYaJaTime,
    dayPillarDate: dayPillarDate.toISOString(),
    effectiveHour,
    result: {
      dayMaster: result.dayMaster,
      pillars: result.pillars
    }
  });

  return result;
}

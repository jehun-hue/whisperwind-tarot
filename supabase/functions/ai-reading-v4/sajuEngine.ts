/**
 * sajuEngine.ts
 * Core Saju (Four Pillars) logic.
 * Handles Pillars, Ten Gods, Hidden Stems, and Elements.
 */

import { getSunLongitude, findSolarTermJD, MONTH_JEOL_LONGS } from "./solarTermEngine.ts";
import { STEMS, BRANCHES, FIVE_ELEMENTS_MAP, ELEMENT_KOREAN, HIDDEN_STEMS, SUPPORT_ELEM } from "./lib/fiveElements.ts";



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

/**
 * Phase 3: 지장간 경과일수 가중치
 * 절기 진입 후 경과 일수에 따라 여기→중기→본기 에너지 전환
 * jijanggan.ts의 JIJANGGAN_TABLE 일수 기준 사용
 */
function getHiddenWeights(
  branch: string,
  daysSinceJeol: number
): number[] {
  // 午, 亥 등 정밀 일수 보정
  const JIJANGGAN_DAYS_PRECISE: Record<string, number[]> = {
    "子": [10, 0, 20],
    "丑": [9, 3, 18],
    "寅": [7, 7, 16],
    "卯": [10, 0, 20],
    "辰": [9, 3, 18],
    "巳": [7, 7, 16],
    "午": [10, 9, 11],
    "未": [9, 3, 18],
    "申": [7, 7, 16],
    "酉": [10, 0, 20],
    "戌": [9, 3, 18],
    "亥": [7, 5, 18],
  };

  const days = JIJANGGAN_DAYS_PRECISE[branch] || [10, 0, 20];
  const [d1, d2, d3] = days;

  // 경과일이 없거나 음수면 본기 100%
  if (daysSinceJeol <= 0) return [0, 0, 1.0];

  // 경과 일수에 따라 단계적 가중치 (순서: 여기, 중기, 본기)
  if (daysSinceJeol <= d1) {
    // 여기 구간: 여기 주도, 본기 기본값
    const ratio = daysSinceJeol / d1;
    return [1.0 - ratio * 0.3, 0, 0.2 + ratio * 0.1];
  } else if (d2 > 0 && daysSinceJeol <= d1 + d2) {
    // 중기 구간
    const ratio = (daysSinceJeol - d1) / d2;
    return [0.3 - ratio * 0.2, 1.0 - ratio * 0.3, 0.3 + ratio * 0.2];
  } else {
    // 본기 구간: 본기 주도
    const elapsed = daysSinceJeol - d1 - d2;
    const ratio = Math.min(elapsed / d3, 1.0);
    return [0.1 * (1 - ratio), d2 > 0 ? 0.2 * (1 - ratio) : 0, 0.7 + ratio * 0.3];
  }
}

export async function getFullSaju(
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
  // ─── 0. 음력→양력 변환 ───
  if (isLunar) {
    try {
      const { lunarToSolar } = await import("./lib/lunarConverter.ts");
      const solar = lunarToSolar(year, month, day, isLeapMonth);
      year = solar.year;
      month = solar.month;
      day = solar.day;
      console.log(`[sajuEngine] 음력→양력 변환: ${year}-${month}-${day}`);
    } catch (e) {
      console.error("[sajuEngine] 음력 변환 실패, 원본 날짜 사용:", e);
    }
  }

  // 1. Longitude & DST Correction
  // B-66new: 한국 시간대 히스토리 완전 반영
  // 1954~1961.08.09: UTC+8:30 사용 → KST(UTC+9) 기준 -30분 보정
  // 1961.08.10~ : UTC+9:00 복귀 (현재 기준)
  // DST 서머타임: 특정 연도 하절기 +60분 추가
  let dstOffset = 0;

  // UTC+8:30 구간 보정 (30분 추가)
  const isUTC830Period =
    (year >= 1954 && year <= 1960) ||
    (year === 1961 && (month < 8 || (month === 8 && day < 10)));
  const utc830Correction = isUTC830Period ? 30 : 0;
 
  const mmdd = month * 100 + day;
 
  // DST 서머타임 적용 구간 (60분 차감)
  const dstPeriods: [number, number, number][] = [
    [1948, 601, 913], [1949, 403, 911], [1950, 401, 910],
    [1951, 506, 909], [1955, 505, 918], [1956, 520, 930],
    [1957, 414, 922], [1958, 504, 921], [1959, 415, 920],
    [1960, 501, 918], [1987, 510, 1011], [1988, 508, 1011],
  ];
  let dstCorrection = 0;
  for (const [dstYear, startMmdd, endMmdd] of dstPeriods) {
    if (year === dstYear && mmdd >= startMmdd && mmdd <= endMmdd) {
      dstCorrection = -60;
      break;
    }
  }
  
  dstOffset = utc830Correction + dstCorrection;

  // 진태양시 보정 (분 단위)
  // KST = UTC+9 = 135도 기준, 경도 1도당 4분
  const longitudeCorrectionMinutes = (longitude - 135) * 4;
  const totalOffsetMinutes = longitudeCorrectionMinutes + dstOffset;
  // ── 경도보정 후 실제 시간(Solar Time) 계산 ──
  const kstToUtcMinutes = -9 * 60;
  // B-116 fix: 진태양시 정밀 계산을 위해 베이스 시간을 UTC로 변환 후 오프셋 적용
  const solarUtcMinutes = Math.round((hour * 60 + minute + totalOffsetMinutes) + kstToUtcMinutes);
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

  // 일주 계산용 날짜: KST(현지) 기준 날짜를 명시적으로 추출하여 사용 (B-255 fix)
  // UTC 기준일(correctedDate)이 현지일(kstSolarDate)보다 하루 빠를 수 있음 (새벽 출생 시)
  const localSolarYear = kstSolarDate.getUTCFullYear();
  const localSolarMonth = kstSolarDate.getUTCMonth();
  const localSolarDay = kstSolarDate.getUTCDate();

  // 기준 날짜는 오찬(12:00) 기준 JD 계산을 위해 UTC Noon으로 설정
  const dayPillarDate = new Date(Date.UTC(localSolarYear, localSolarMonth, localSolarDay, 12, 0, 0));
  
  if (isYaJaTime) {
    dayPillarDate.setUTCDate(dayPillarDate.getUTCDate() + 1);
  }

  // (Removed log to move after dayPillar calculation)

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

  // Phase 3: 절기 경과일수 계산 (월지 가중치용)
  const jeolLong = (315 + termIdx * 30) % 360;
  const jeolJD = findSolarTermJD(correctedDate.getUTCFullYear(), jeolLong);
  const daysSinceJeol = jdForSun - jeolJD;

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
  // B-194 fix: 로컬 진태양시 기준 시주 계산
  // 시지 경계 (코드 기준, +60분 오프셋 = 23:00 시작):
  //   子(23:00~01:00), 丑(01:00~03:00), 寅(03:00~05:00),
  //   卯(05:00~07:00), 辰(07:00~09:00), 巳(09:00~11:00),
  //   午(11:00~13:00), 未(13:00~15:00), 申(15:00~17:00),
  //   酉(17:00~19:00), 戌(19:00~21:00), 亥(21:00~23:00)
  // ※ 23:30 기준설도 있으나, 현재 엔진은 23:00 기준 채택
  const normalizedMinutes = (effectiveHour * 60 + correctedMinute);
  // 子시 시작을 Solar Time 23:00(=1380분)으로 정렬: +60분 후 2시간(120분) 단위로 나눔
  const hBranchIdx = Math.floor(((normalizedMinutes + 60) % 1440) / 120);
  const hStemBase = (dIdx % 10 * 2) % 10;
  const hStemIdx = (hStemBase + hBranchIdx) % 10;
  // B-228: 출생시간 "모름"일 때 시주 제외
  const hourPillar = hasTime 
    ? { stem: STEMS[hStemIdx], branch: BRANCHES[hBranchIdx] }
    : { stem: "미상", branch: "미상" };
  

  const pillars = [yearPillar, monthPillar, dayPillar, hourPillar];

  const elements: Record<string, number> = { "목": 0, "화": 0, "토": 0, "금": 0, "수": 0 };

  const pillarLabels = ["년간", "년지", "월간", "월지", "일간", "일지", "시간", "시지"];
  
  // 천간 오행 집계 (각 1점) — 지지는 지장간으로만 계산하므로 여기서는 제외
  pillars.forEach((p, idx) => {
    const sEl = FIVE_ELEMENTS_MAP[p.stem];
    const sName = ELEMENT_KOREAN[sEl];
    
    if (sName) {
      elements[sName]++;

    }
  });

  // Phase 3: 절기 경과일수 기반 동적 가중치
  const pillarBranches = pillars.map(p => p.branch);
  const pillarWeights = pillarBranches.map((br, idx) => {
    if (idx === 1) { // 월지: 절기 경과일수 기반
      return getHiddenWeights(br, Math.floor(daysSinceJeol));
    }
    // 년·일·시지: 여기 5%, 중기 15%, 본기 80% 고정
    return [0.05, 0.15, 0.80];
  });

  pillars.forEach((p, bIdx) => {
    const hidden = HIDDEN_STEMS[p.branch] || [];
    const weights = pillarWeights[bIdx]; // [여, 중, 본]

    hidden.forEach((hs, hIdx) => {
      const el = FIVE_ELEMENTS_MAP[hs];
      const name = ELEMENT_KOREAN[el];
      let weight = 0;

      // HIDDEN_STEMS 순서: [0]=본기(정기), [1]=중기, [2]=여기(초기)
      // weights 순서: [0]=여기, [1]=중기, [2]=본기
      if (hidden.length === 3) {
        if (hIdx === 0) weight = weights[2]; // 본기
        else if (hIdx === 1) weight = weights[1]; // 중기
        else weight = weights[0]; // 여기
      } else if (hidden.length === 2) {
        // 子, 卯, 酉, 亥 등 (중기 없음)
        if (hIdx === 0) weight = weights[2]; // 본기
        else weight = weights[0]; // 여기
      } else {
        weight = weights[2]; // 본기
      }

      if (name) {
        elements[name] += weight;
      }
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
  // === 궁위별 가중치 신강약 계산 (110점 만점) ===
  const POS_W: Record<string, number> = {
    ys: 10, yb: 10, ms: 10, mb: 30, db: 20, hs: 10, hb: 10
  };
  const dayMasterElement = ELEMENT_KOREAN[FIVE_ELEMENTS_MAP[dayMaster]];
  const generatingElement = SUPPORT_ELEM[dayMasterElement];

  function mainElOf(char: string, kind: 'S'|'B'): string {
    if (kind === 'S') return ELEMENT_KOREAN[FIVE_ELEMENTS_MAP[char]] || "";
    const h = HIDDEN_STEMS[char];
    if (!h || h.length === 0) return "";
    return ELEMENT_KOREAN[FIVE_ELEMENTS_MAP[h[0]]] || "";  // h[0] = 정기
  }

  const posArr = [
    { k:'ys', c: yearPillar.stem,    t:'S' as const },
    { k:'yb', c: yearPillar.branch,  t:'B' as const },
    { k:'ms', c: monthPillar.stem,   t:'S' as const },
    { k:'mb', c: monthPillar.branch, t:'B' as const },
    { k:'db', c: dayPillar.branch,   t:'B' as const },
    { k:'hs', c: hourPillar.stem,    t:'S' as const },
    { k:'hb', c: hourPillar.branch,  t:'B' as const },
  ];

  let strengthScore = 0;
  const bd: Record<string, {el:string; help:boolean; sc:number}> = {};

  for (const p of posArr) {
    const el = mainElOf(p.c, p.t);
    const help = (el === dayMasterElement || el === generatingElement);
    const sc = help ? POS_W[p.k] : 0;
    strengthScore += sc;
    bd[p.k] = { el, help, sc };
  }

  // 진술축미 보정: 습토(丑辰)는 목·금·수 일간에게 반점 가산
  const WET = ['丑','辰'];
  const WET_FAV = ['목','금','수'];
  for (const p of posArr) {
    if (p.t !== 'B') continue;
    if (!WET.includes(p.c)) continue;
    if (mainElOf(p.c, 'B') !== '토') continue;
    if (!WET_FAV.includes(dayMasterElement)) continue;
    const bonus = Math.floor(POS_W[p.k] * 0.5);
    strengthScore += bonus;
    bd[p.k].sc += bonus;
    bd[p.k].help = true;
  }

  const strengthPercent = Math.round((strengthScore / 110) * 100);
  let strength: string;
  if (strengthPercent >= 85) strength = "극신강";
  else if (strengthPercent >= 65) strength = "신강";
  else if (strengthPercent >= 50) strength = "약변강";
  else if (strengthPercent >= 40) strength = "중화";
  else if (strengthPercent >= 30) strength = "강변약";
  else if (strengthPercent >= 15) strength = "신약";
  else strength = "극신약";

  const strength_detail = {
    score: strengthScore,
    totalPossible: 110,
    percent: strengthPercent,
    dayMasterElement,
    generatingElement,
    level: strength,
    breakdown: bd,
  };

  const result = {
    pillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar
    },
    dayMaster,
    strength,
    strength_detail,
    solarTimeApplied: true,
    solarTimeNote: `진태양시 적용 (기준경도 ${longitude}°, 보정 ${longitudeCorrectionMinutes.toFixed(1)}분)`,
    elements: roundedElements,
    jd,
    sunLong,
    termIdx,
    correctedDate: kstSolarDate.toISOString(),
    is_near_solar_term_boundary: isNearSolarTermBoundary,
    time_corrected: timeCorrected,
    is_borderline_time: isBorderlineTime,
    has_time: hasTime,
    narrative: hasTime ? "" : "출생 시간 미입력으로 시주는 제외하고 3주(년월일)만 분석합니다."
  };



  return result;
}

export { STEMS, BRANCHES } from "./lib/fiveElements.ts";

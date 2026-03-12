// sajuCalc.ts
import {
  calculateSaju,
  lunarToSolar,
  InvalidDateError,
  OutOfRangeError
} from '@fullstackfamily/manseryeok';

// 한국 서머타임 보정 (1987~1988년만 해당)
function applyKoreaDST(year: number, month: number, day: number, hour: number, minute: number): { hour: number; minute: number } {
  const dstPeriods: Record<number, { start: [number, number]; end: [number, number] }> = {
    1948: { start: [6, 1], end: [9, 13] },
    1949: { start: [4, 3], end: [9, 11] },
    1950: { start: [4, 1], end: [9, 10] },
    1951: { start: [5, 6], end: [9, 9] },
    1955: { start: [5, 5], end: [9, 18] },
    1956: { start: [5, 20], end: [9, 30] },
    1957: { start: [4, 14], end: [9, 22] },
    1958: { start: [5, 4], end: [9, 21] },
    1959: { start: [4, 15], end: [9, 20] },
    1960: { start: [5, 1], end: [9, 18] },
    1987: { start: [5, 10], end: [10, 11] },
    1988: { start: [5, 8], end: [10, 11] },
  };

  const dst = dstPeriods[year];
  if (!dst) return { hour, minute };

  const birthMMDD = month * 100 + day;
  const startMMDD = dst.start[0] * 100 + dst.start[1];
  const endMMDD = dst.end[0] * 100 + dst.end[1];

  if (birthMMDD >= startMMDD && birthMMDD <= endMMDD) {
    // 서머타임 기간: 시계가 1시간 앞당겨져 있으므로, 실제 태양시는 -60분
    let totalMinutes = hour * 60 + minute - 60;
    if (totalMinutes < 0) totalMinutes += 1440;
    return { hour: Math.floor(totalMinutes / 60), minute: totalMinutes % 60 };
  }

  return { hour, minute };
}

export function getManseryeok(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  isLunar: boolean = false,
  isLeapMonth: boolean = false
) {
  try {
    let solarYear = year;
    let solarMonth = month;
    let solarDay = day;

    if (isLunar) {
      const converted = lunarToSolar(year, month, day, isLeapMonth);
      solarYear = converted.solar.year;
      solarMonth = converted.solar.month;
      solarDay = converted.solar.day;
    }

    const originalHour = Number(hour);
    const originalMinute = Number(minute);
    let calcHour = originalHour;
    let calcMinute = originalMinute;

    // 1. 야자시 보정
    if (originalHour >= 23) {
      const nextDay = new Date(solarYear, solarMonth - 1, solarDay + 1);
      solarYear = nextDay.getFullYear();
      solarMonth = nextDay.getMonth() + 1;
      solarDay = nextDay.getDate();
      calcHour = 0;
      calcMinute = originalMinute;
    }

    // 2. 한국 서머타임 보정 (1987~1988)
    const dstCorrected = applyKoreaDST(solarYear, solarMonth, solarDay, calcHour, calcMinute);
    calcHour = dstCorrected.hour;
    calcMinute = dstCorrected.minute;

    // 표시용 경도 보정 계산 (약 -32분)
    const longitudeOffset = (126.98 - 135) * 4; 
    const rawTotalMinutes = calcHour * 60 + calcMinute + longitudeOffset;
    const correctedHour = Math.floor(rawTotalMinutes / 60);
    const correctedMin = Math.round(rawTotalMinutes % 60);
    const correctedTimeStr = `${correctedHour}:${String(Math.abs(correctedMin)).padStart(2, '0')}`;

    // 3. 사주 계산
    const saju = calculateSaju(solarYear, solarMonth, solarDay, calcHour, calcMinute, {
      longitude: 126.98,
      applyTimeCorrection: false
    });

    return {
      yearPillar: {
        cheongan: saju.yearPillar?.charAt(0) || '',
        jiji: saju.yearPillar?.charAt(1) || '',
        hanja: saju.yearPillarHanja || '',
        full: saju.yearPillar || ''
      },
      monthPillar: {
        cheongan: saju.monthPillar?.charAt(0) || '',
        jiji: saju.monthPillar?.charAt(1) || '',
        hanja: saju.monthPillarHanja || '',
        full: saju.monthPillar || ''
      },
      dayPillar: {
        cheongan: saju.dayPillar?.charAt(0) || '',
        jiji: saju.dayPillar?.charAt(1) || '',
        hanja: saju.dayPillarHanja || '',
        full: saju.dayPillar || ''
      },
      hourPillar: {
        cheongan: saju.hourPillar?.charAt(0) || '',
        jiji: saju.hourPillar?.charAt(1) || '',
        hanja: saju.hourPillarHanja || '',
        full: saju.hourPillar || ''
      },
      isTimeCorrected: true,
      correctedTime: correctedTimeStr,
      originalInput: { year, month, day, hour: originalHour, minute: originalMinute, isLunar, isLeapMonth },
      solarDate: { year: solarYear, month: solarMonth, day: solarDay }
    };
  } catch (error) {
    if (error instanceof InvalidDateError) {
      console.error(`유효하지 않은 날짜: ${year}-${month}-${day}`);
    } else if (error instanceof OutOfRangeError) {
      console.error(`지원 범위 밖: ${year}년`);
    } else {
      console.error('만세력 계산 오류:', error);
    }
    return null;
  }
}

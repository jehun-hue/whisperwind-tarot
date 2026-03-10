// BUILD FORCE v5 - sajuCalc 새 파일
import {
  calculateSaju,
  lunarToSolar,
  InvalidDateError,
  OutOfRangeError
} from '@fullstackfamily/manseryeok';

export function getManseryeok(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  isLunar: boolean = false,
  isLeapMonth: boolean = false
) {
  // build-cache-bust: 2026-03-10T09:30
  console.log('야자시 체크: getManseryeok 진입', { year, month, day, hour, minute, isLunar, isLeapMonth });
  try {
    let solarYear = year;
    let solarMonth = month;
    let solarDay = day;

    if (isLunar) {
      const converted = lunarToSolar(year, month, day, isLeapMonth);
      solarYear = converted.solar.year;
      solarMonth = converted.solar.month;
      solarDay = converted.solar.day;
      console.log(`음력→양력 변환: ${year}-${month}-${day} → ${solarYear}-${solarMonth}-${solarDay}`);
    }

    const originalHour = Number(hour);
    const originalMinute = Number(minute);
    let calcHour = originalHour;
    let calcMinute = originalMinute;

    console.log('[야자시 판단] originalHour:', originalHour, '→', originalHour >= 23 ? '야자시 YES' : '야자시 NO');

    if (originalHour >= 23) {
      const nextDay = new Date(solarYear, solarMonth - 1, solarDay + 1);
      solarYear = nextDay.getFullYear();
      solarMonth = nextDay.getMonth() + 1;
      solarDay = nextDay.getDate();
      calcHour = 0;
      calcMinute = originalMinute;
      console.log(`[야자시 보정 완료] ${solarYear}-${solarMonth}-${solarDay}, calcHour=0`);
    }

    // 표시용 경도 보정 계산 (사주 계산에는 미반영)
    const longitudeOffset = (126.98 - 135) * 4; // 약 -32분
    const rawTotalMinutes = calcHour * 60 + calcMinute + longitudeOffset;
    const correctedHour = Math.floor(rawTotalMinutes / 60);
    const correctedMin = Math.round(rawTotalMinutes % 60);
    const correctedTimeStr = `${correctedHour}:${String(Math.abs(correctedMin)).padStart(2, '0')}`;

    // 사주 계산: 경도 보정 없이 원래 입력 시간 사용 (시주 지지 보존)
    const saju = calculateSaju(solarYear, solarMonth, solarDay, calcHour, calcMinute, {
      longitude: 126.98,
      applyTimeCorrection: false
    });

    console.log('[sajuCalc 결과]', {
      yearPillar: saju.yearPillarHanja,
      monthPillar: saju.monthPillarHanja,
      dayPillar: saju.dayPillarHanja,
      hourPillar: saju.hourPillarHanja
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
      correctedTime: correctedTimeStr, // 표시용만 (사주 계산 미반영)
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

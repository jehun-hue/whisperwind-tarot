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
  try {
    let solarYear = year;
    let solarMonth = month;
    let solarDay = day;

    // 음력이면 양력으로 변환 먼저
    if (isLunar) {
      const converted = lunarToSolar(year, month, day, isLeapMonth);
      solarYear = converted.solar.year;
      solarMonth = converted.solar.month;
      solarDay = converted.solar.day;
      console.log(`음력 ${year}-${month}-${day} → 양력 ${solarYear}-${solarMonth}-${solarDay} 변환 완료`);
    }

    // ── 야자시(夜子時) 처리 ──────────────────────────────────────
    // 경도 보정 후 23:00 이상이면 다음날 일주를 적용해야 함
    const LONGITUDE = 126.98;
    const STANDARD_MERIDIAN = 135;
    const longitudeOffsetMin = (LONGITUDE - STANDARD_MERIDIAN) * 4; // 약 –32.08분
    const totalInputMin = hour * 60 + minute + longitudeOffsetMin;
    const correctedHourDecimal = totalInputMin / 60;

    if (correctedHourDecimal >= 23) {
      // 날짜 +1 처리 (월, 연도 경계 포함)
      const daysInMonth = new Date(solarYear, solarMonth, 0).getDate(); // Date month is 1-based
      solarDay += 1;
      if (solarDay > daysInMonth) {
        solarDay = 1;
        solarMonth += 1;
        if (solarMonth > 12) {
          solarMonth = 1;
          solarYear += 1;
        }
      }
      console.log(`야자시 보정: 날짜를 ${solarYear}-${solarMonth}-${solarDay}로 변경`);
    }

    // calculateSaju는 반드시 양력을 받음
    const saju = calculateSaju(solarYear, solarMonth, solarDay, hour, minute, {
      longitude: LONGITUDE,
      applyTimeCorrection: true
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
      isTimeCorrected: saju.isTimeCorrected || false,
      correctedTime: saju.correctedTime || null,
      originalInput: { year, month, day, hour, minute, isLunar, isLeapMonth },
      solarDate: { year: solarYear, month: solarMonth, day: solarDay }
    };
  } catch (error) {
    if (error instanceof InvalidDateError) {
      console.error(`유효하지 않은 날짜: ${year}-${month}-${day} (${isLunar ? '음력' : '양력'})`);
      console.error('음력의 경우 해당 월의 일수를 확인하세요 (29일 또는 30일)');
    } else if (error instanceof OutOfRangeError) {
      console.error(`지원 범위 밖: ${year}년 (1900~2050만 지원)`);
    } else {
      console.error('만세력 계산 오류:', error);
    }
    return null;
  }
}

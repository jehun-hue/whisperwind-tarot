/**
 * lunarConverter.ts – 음력 → 양력 변환 엔진
 * LUNAR_DATA 기반 정밀 변환 (1940-2050)
 */

import { LUNAR_DATA } from "../lunarData.ts";

interface SolarResult {
  year: number;
  month: number;
  day: number;
  iso: string;
}

/**
 * 음력 날짜를 양력으로 변환합니다.
 * @param lunarYear  음력 연도 (1940-2050)
 * @param lunarMonth 음력 월 (1-12)
 * @param lunarDay   음력 일 (1-30)
 * @param isLeapMonth 윤달 여부
 * @returns SolarResult { year, month, day, iso }
 * @throws RangeError 범위 밖 연도 또는 잘못된 월/일
 */
export function lunarToSolar(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  isLeapMonth: boolean = false
): SolarResult {
  // 1. 데이터 범위 확인
  const entry = LUNAR_DATA[lunarYear];
  if (!entry) {
    throw new RangeError(
      `음력 ${lunarYear}년은 변환 범위(1940-2050) 밖입니다.`
    );
  }

  // 2. 월 유효성 검사
  if (lunarMonth < 1 || lunarMonth > 12) {
    throw new RangeError(`잘못된 음력 월: ${lunarMonth}`);
  }

  // 3. 윤달 유효성 검사
  if (isLeapMonth && entry.leapMonth !== lunarMonth) {
    throw new RangeError(
      `${lunarYear}년에는 윤${lunarMonth}월이 없습니다.` +
        (entry.leapMonth
          ? ` (해당 연도 윤달: ${entry.leapMonth}월)`
          : " (윤달 없음)")
    );
  }

  // 4. 설날(양력)을 시작점으로 설정
  const [snyYear, snyMonth, snyDay] = entry.solarNewYear;
  let baseDate = new Date(Date.UTC(snyYear, snyMonth - 1, snyDay));

  // 5. 경과 일수(offset) 계산
  let offset = 0;

  for (let m = 1; m < lunarMonth; m++) {
    // 해당 월의 일수 추가
    offset += entry.monthDays[m - 1];

    // 이 월이 윤달 월이면 윤달 일수도 추가
    if (entry.leapMonth === m && !isLeapMonth) {
      offset += entry.leapDays;
    }
  }

  // 윤달을 요청한 경우: 해당 월의 평월 일수를 먼저 더한 뒤 윤달 일수 기준으로 계산
  if (isLeapMonth) {
    offset += entry.monthDays[lunarMonth - 1]; // 평월 일수
  }

  // 6. 일수 유효성 검사
  const maxDay = isLeapMonth
    ? entry.leapDays
    : entry.monthDays[lunarMonth - 1];

  if (lunarDay < 1 || lunarDay > maxDay) {
    throw new RangeError(
      `${lunarYear}년 ${isLeapMonth ? "윤" : ""}${lunarMonth}월은 ${maxDay}일까지입니다. (입력: ${lunarDay}일)`
    );
  }

  // 7. 최종 offset에 일수 추가 (1일 = offset 0)
  offset += lunarDay - 1;

  // 8. 양력 날짜 산출
  baseDate.setUTCDate(baseDate.getUTCDate() + offset);

  const resultYear = baseDate.getUTCFullYear();
  const resultMonth = baseDate.getUTCMonth() + 1;
  const resultDay = baseDate.getUTCDate();

  return {
    year: resultYear,
    month: resultMonth,
    day: resultDay,
    iso: `${resultYear}-${String(resultMonth).padStart(2, "0")}-${String(resultDay).padStart(2, "0")}`,
  };
}

/**
 * 양력 날짜를 음력으로 변환합니다.
 * @param solarYear  양력 연도
 * @param solarMonth 양력 월 (1-12)
 * @param solarDay   양력 일
 * @returns { year, month, day, isLeapMonth }
 */
export function solarToLunar(
  solarYear: number,
  solarMonth: number,
  solarDay: number
): { year: number; month: number; day: number; isLeapMonth: boolean } {
  const target = Date.UTC(solarYear, solarMonth - 1, solarDay);

  // 후보 연도: 양력 날짜가 속할 수 있는 음력 연도는 solarYear 또는 solarYear-1
  for (const ly of [solarYear, solarYear - 1]) {
    const entry = LUNAR_DATA[ly];
    if (!entry) continue;

    const [snyY, snyM, snyD] = entry.solarNewYear;
    const newYearUTC = Date.UTC(snyY, snyM - 1, snyD);

    if (target < newYearUTC) continue; // 이 연도 설날 이전이면 skip

    // 다음 해 설날 확인
    const nextEntry = LUNAR_DATA[ly + 1];
    if (nextEntry) {
      const [ny, nm, nd] = nextEntry.solarNewYear;
      const nextNewYear = Date.UTC(ny, nm - 1, nd);
      if (target >= nextNewYear) continue; // 다음 해 범위이면 skip
    }

    // target이 이 음력 연도에 속함
    let remaining = Math.floor((target - newYearUTC) / 86400000);

    for (let m = 1; m <= 12; m++) {
      // 평월
      const mDays = entry.monthDays[m - 1];
      if (remaining < mDays) {
        return { year: ly, month: m, day: remaining + 1, isLeapMonth: false };
      }
      remaining -= mDays;

      // 윤달
      if (entry.leapMonth === m && entry.leapDays > 0) {
        if (remaining < entry.leapDays) {
          return { year: ly, month: m, day: remaining + 1, isLeapMonth: true };
        }
        remaining -= entry.leapDays;
      }
    }

    // fallback (12월 마지막 날 근처 경계)
    return { year: ly, month: 12, day: remaining + 1, isLeapMonth: false };
  }

  throw new RangeError(`양력 ${solarYear}-${solarMonth}-${solarDay}은 변환 범위 밖입니다.`);
}

/**
 * timeUtils.ts
 * Comprehensive Historical Korean Timezone (KST) and Daylight Saving Time (DST) Coordinator.
 * 
 * Historical Data:
 * 1. Base Timezone:
 *    - 1908.04.01 ~ 1911.12.31: UTC+8:30
 *    - 1912.01.01 ~ 1954.03.20: UTC+9:00
 *    - 1954.03.21 ~ 1961.08.09: UTC+8:30 (Reverted to 8.5 for national identity)
 *    - 1961.08.10 ~ Present: UTC+9:00
 * 
 * 2. Daylight Saving Time (DST):
 *    - 1948 ~ 1951: Annual
 *    - 1955 ~ 1960: Annual (During UTC+8:30 base period)
 *    - 1987 ~ 1988: Annual
 */

export function getKoreanTimezoneOffset(year: number, month: number, day: number): number {
  const mmdd = month * 100 + day;
  let baseOffset = 9.0;
  let dstOffset = 0.0;

  // --- 1. Base Timezone Determination ---
  // Default is 9.0. Handle exceptions for 8.5 periods.
  if (year >= 1908 && year <= 1911) {
    if (year === 1908 && mmdd < 401) baseOffset = 9.0; // Before officially established (Assumption)
    else baseOffset = 8.5;
  } else if (year >= 1954 && year <= 1961) {
    // 1954.03.21 ~ 1961.08.09
    if (year === 1954 && mmdd < 321) baseOffset = 9.0;
    else if (year === 1961 && mmdd >= 810) baseOffset = 9.0;
    else baseOffset = 8.5;
  }

  // --- 2. Daylight Saving Time (DST) Determination ---
  // DST always adds 1.0 hour (+60 min)
  const isDST = () => {
    if (year === 1948 && mmdd >= 601 && mmdd <= 913) return true;
    if (year === 1949 && mmdd >= 403 && mmdd <= 911) return true;
    if (year === 1950 && mmdd >= 401 && mmdd <= 910) return true;
    if (year === 1951 && mmdd >= 506 && mmdd <= 909) return true;
    
    if (year === 1955 && mmdd >= 505 && mmdd <= 918) return true;
    if (year === 1956 && mmdd >= 520 && mmdd <= 930) return true;
    if (year === 1957 && mmdd >= 414 && mmdd <= 922) return true;
    if (year === 1958 && mmdd >= 504 && mmdd <= 921) return true;
    if (year === 1959 && mmdd >= 415 && mmdd <= 920) return true;
    if (year === 1960 && mmdd >= 501 && mmdd <= 918) return true;

    if (year === 1987 && mmdd >= 510 && mmdd <= 1011) return true;
    if (year === 1988 && mmdd >= 508 && mmdd <= 1009) return true;
    
    return false;
  };

  if (isDST()) {
    dstOffset = 1.0;
  }

  return baseOffset + dstOffset;
}

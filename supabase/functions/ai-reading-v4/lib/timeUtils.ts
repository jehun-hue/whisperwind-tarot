/**
 * timeUtils.ts
 * Utility for handling Korean Timezone (KST) and Daylight Saving Time (DST).
 */

export function getKoreanTimezoneOffset(year: number, month: number, day: number): number {
  let dstOffset = 0;
  const mmdd = month * 100 + day;
  const dstYears = [1948, 1949, 1950, 1951, 1955, 1956, 1957, 1958, 1959, 1960, 1987, 1988];

  if (dstYears.includes(year)) {
    if (year === 1948 && mmdd >= 601 && mmdd <= 913) dstOffset = 60;
    else if (year === 1949 && mmdd >= 403 && mmdd <= 911) dstOffset = 60;
    else if (year === 1950 && mmdd >= 401 && mmdd <= 910) dstOffset = 60;
    else if (year === 1951 && mmdd >= 506 && mmdd <= 909) dstOffset = 60;
    else if (year === 1955 && mmdd >= 505 && mmdd <= 918) dstOffset = 60;
    else if (year === 1956 && mmdd >= 520 && mmdd <= 930) dstOffset = 60;
    else if (year === 1957 && mmdd >= 414 && mmdd <= 922) dstOffset = 60;
    else if (year === 1958 && mmdd >= 504 && mmdd <= 921) dstOffset = 60;
    else if (year === 1959 && mmdd >= 415 && mmdd <= 920) dstOffset = 60;
    else if (year === 1960 && mmdd >= 501 && mmdd <= 918) dstOffset = 60;
    else if (year === 1987 && mmdd >= 510 && mmdd <= 1011) dstOffset = 60;
    else if (year === 1988 && mmdd >= 508 && mmdd <= 1011) dstOffset = 60;
  }

  // Base KST is +9. If DST, it's +10.
  return 9 + (dstOffset / 60);
}

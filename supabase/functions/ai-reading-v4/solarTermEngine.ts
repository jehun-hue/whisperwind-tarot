/**
 * solarTermEngine.ts
 * - ±1 min accuracy required.
 * - Used Jean Meeus' Astronomical Algorithms.
 */

const TORAD = Math.PI / 180;

export function getJDAtSolarTime(date: Date, longitude: number): number {
  const time = date.getTime();
  // Standard JD
  const jd_base = (time / 86400000) + 2440587.5;
  // Apply longitude correction: 1 degree = 4 minutes = 4/1440 days
  const correction = (longitude - 135) * (4 / 1440);
  return jd_base + correction;
}

export function getSunLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0; // Centuries from J2000.0
  
  // Mean longitude of sun
  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  
  // Mean anomaly of sun
  let M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  M = M % 360;
  if (M < 0) M += 360;
  
  // Eccentricity of earth orbit
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  
  // Sun's equation of center
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * TORAD) +
            (0.019993 - 0.000101 * T) * Math.sin(2 * M * TORAD) +
            0.000289 * Math.sin(3 * M * TORAD);
  
  const trueLong = (L0 + C) % 360;
  
  // Apparent longitude (corrected for nutation and aberration)
  const Omega = 125.04 - 1934.136 * T;
  const Lambda = trueLong - 0.00569 - 0.00478 * Math.sin(Omega * TORAD);
  
  let result = Lambda % 360;
  if (result < 0) result += 360;
  
  return result;
}

export function findSolarTermJD(year: number, targetLong: number): number {
  // 춘분(0°) 기준 Jan 1에서 약 80일
  const jan1JD = new Date(Date.UTC(year, 0, 1)).getTime() / 86400000 + 2440587.5;

  // 초기 추정값: 목표 황경 기준 대략적 날짜
  let daysFromChunbun = (targetLong - 0 + 360) % 360 * (365.2422 / 360);
  let jd = jan1JD + 79 + daysFromChunbun;

  // 연도 범위 보정
  if (jd > jan1JD + 366) jd -= 365.2422;
  if (jd < jan1JD) jd += 365.2422;

  // 정밀 반복 수렴 (허용 오차: 0.00001° ≈ 1초 미만)
  for (let i = 0; i < 50; i++) {
    const currentLong = getSunLongitude(jd);
    let diff = (currentLong - targetLong + 180) % 360 - 180;

    // 태양 실제 속도 보정 (근일점 부근 빠름, 원일점 부근 느림)
    // 평균 0.9856°/day, 실제 범위: 0.9533(7월)~1.0194(1월)
    const T = (jd - 2451545.0) / 36525.0;
    const M = ((357.52911 + 35999.05029 * T) % 360 + 360) % 360;
    const e = 0.016708634 - 0.000042037 * T;
    const sunSpeed = 0.9856 * (1 - e * Math.cos(M * Math.PI / 180)) /
                     Math.pow(1 - e * Math.cos(M * Math.PI / 180), 2);

    jd -= diff / sunSpeed;

    // 수렴 판정: 오차 0.00001° 이하 (시간 기준 약 1초)
    if (Math.abs(diff) < 0.00001) break;
  }

  return jd;
}

// 절기 황경 목록 (12절기 기준, 입춘부터)
// 입춘315° 경칩345° 청명15° 입하45° 망종75° 소서105°
// 입추135° 백로165° 한로195° 입동225° 대설255° 소한285°
export const MONTH_JEOL_LONGS = [315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285];

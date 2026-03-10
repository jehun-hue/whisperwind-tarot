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
  const startDay = new Date(Date.UTC(year, 0, 1)).getTime() / (1000 * 60 * 60 * 24) + 2440587.5;
  let jd = startDay + (targetLong / 360) * 365.25 + 80; // Offset around 春分
  
  // High precision iterative convergence (Newton-Raphson-like)
  for (let i = 0; i < 10; i++) {
    const currentLong = getSunLongitude(jd);
    let diff = (currentLong - targetLong + 180) % 360 - 180;
    jd -= diff / 0.9856; // Sun moves ~0.9856 deg/day
  }
  
  return jd;
}

export const MONTH_JEOL_LONGS = [315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285];
// Ip-chun(315), Gyeong-chip(345), Cheong-myeong(15), ...

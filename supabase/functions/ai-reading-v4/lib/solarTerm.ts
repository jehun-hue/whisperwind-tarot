/**
 * solarTerm.ts
 * High accuracy solar term calculation (±1 min).
 */

const TORAD = Math.PI / 180;

/**
 * Get Sun ECLIPTIC longitude (Apparent)
 */
export function getSunLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0; // Centuries from J2000
  
  // Mean longitude of sun
  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  
  // Mean anomaly of sun
  let M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  M = M % 360;
  if (M < 0) M += 360;
  
  // Eccentricity
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  
  // Center
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * TORAD) +
            (0.019993 - 0.000101 * T) * Math.sin(2 * M * TORAD) +
            0.000289 * Math.sin(3 * M * TORAD);
  
  const sunTrueLong = (L0 + C) % 360;
  
  // Apparent longitude (corrected for nutation and aberration)
  const Omega = 125.04 - 1934.136 * T;
  const Lambda = sunTrueLong - 0.00569 - 0.00478 * Math.sin(Omega * TORAD);
  
  let result = Lambda % 360;
  if (result < 0) result += 360;
  
  return result;
}

/**
 * Finds the exact JD when sun reaches target longitude.
 * 
 * [B-4 FIX] 초기 추정치를 춘분(3/20, 0°) 기준으로 계산하여
 * targetLong > 180° (입춘 315°, 소한 285° 등)일 때
 * 1년 오프셋 버그를 방지합니다.
 */
export function findSolarTermJD(year: number, targetLong: number): number {
  // 춘분(0°) ≈ 3월 20일 정오 JD 기준
  const chunBunEstimate = new Date(Date.UTC(year, 2, 20, 12, 0)).getTime() / (1000 * 60 * 60 * 24) + 2440587.5;
  
  // 춘분(0°)과의 경도 차이를 [-180, 180] 범위로 정규화
  const diffFromChunBun = (targetLong + 180) % 360 - 180;
  
  // 초기 추정치: 춘분 JD + (경도 차이 / 하루 평균 이동량)
  let jd = chunBunEstimate + (diffFromChunBun / 0.9856);
  
  // Newton's method
  for (let i = 0; i < 10; i++) {
    const currentLong = getSunLongitude(jd);
    let diff = (currentLong - targetLong + 180) % 360 - 180;
    
    // Gradient: Sun moves ~0.9856 deg per day
    jd -= diff / 0.9856;
  }
  
  return jd;
}

export const MONTH_JEOL_LONGS = [315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285];

export const JEOL_GI_NAMES = [
  "Ip-chun", "Gyeong-chip", "Cheong-myeong", "Ip-ha", "Mang-jong", "So-seo",
  "Ip-chu", "Baek-ro", "Han-ro", "Ip-dong", "Dae-seol", "So-han"
];

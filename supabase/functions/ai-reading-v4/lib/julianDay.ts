/**
 * julianDay.ts
 * Julian Day (JD) calculation for astronomical accuracy.
 */

export function calculateJulianDay(date: Date): number {
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();

  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);

  const dayFraction = (hour + minute / 60 + second / 3600) / 24;
  
  const JD = Math.floor(365.25 * (year + 4716)) + 
             Math.floor(30.6001 * (month + 1)) + 
             day + dayFraction + B - 1524.5;

  return JD;
}

export function fromJulianDay(jd: number): Date {
  const Z = Math.floor(jd + 0.5);
  const F = (jd + 0.5) - Z;
  let A = Z;

  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }

  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);

  const day = (B - D) - Math.floor(30.6001 * E) + F;
  const month = (E < 14) ? E - 1 : E - 13;
  const year = (month > 2) ? C - 4716 : C - 4715;

  const hours = (day - Math.floor(day)) * 24;
  const mins = (hours - Math.floor(hours)) * 60;
  const secs = (mins - Math.floor(mins)) * 60;

  return new Date(Date.UTC(year, month - 1, Math.floor(day), Math.floor(hours), Math.floor(mins), Math.round(secs)));
}

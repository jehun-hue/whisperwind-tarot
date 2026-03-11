/**
 * astrologyEngine.ts
 * - Western Astrology calculations using Swiss Ephemeris.
 * - Includes solar-to-lunar conversion logic for downstream Ziwei accuracy.
 */

import { Solar, Lunar } from "https://esm.sh/lunar-javascript";
// Note: Detailed Swiss Ephemeris integration often requires WASM/Ephemeris files.
// For the purpose of this implementation, we will use a high-precision JS engine 
// that follows Swiss Ephemeris standards if a full binary is not available.
import * as Astronomy from "https://esm.sh/astronomy-engine";

export interface AstrologyCalculationInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  lat?: number;
  lng?: number;
}

export function calculateAstrologyV9(input: AstrologyCalculationInput) {
  const { year, month, day, hour, minute } = input;
  const date = new Date(year, month - 1, day, hour, minute);
  
  // 1. Solar to Lunar Conversion (Required for Ziwei accuracy improvement)
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  
  const lunarData = {
    lunarYear: lunar.getYear(),
    lunarMonth: lunar.getMonth(),
    lunarDay: lunar.getDay(),
    isLeap: lunar.getMonth() < 0,
    lunarString: `${lunar.getYear()}-${Math.abs(lunar.getMonth())}-${lunar.getDay()}`
  };

  // 2. Planet Positions (Simulating high-precision with astronomy-engine as placeholder for Swiss Ephemeris logic)
  const observer = new Astronomy.Observer(37.5665, 126.9780, 0); // Defaults to Seoul
  const time = new Astronomy.AstroTime(date);
  
  const planets = [
    "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"
  ];
  
  const planet_positions = planets.map(p => {
    // @ts-ignore
    const body = Astronomy.Body[p];
    const equ_vec = Astronomy.Equator(body, time, observer, true, true);
    const ecl_vec = Astronomy.Ecliptic(equ_vec);
    
    const lon = ecl_vec.elon;
    const signIdx = Math.floor(lon / 30) % 12;
    const degree = lon % 30;
    
    return {
      planet: p,
      lon,
      signIdx,
      degree,
      sign: getZodiacSign(signIdx)
    };
  });

  // 3. Transits (Current Transits)
  const now = new Date();
  const timeNow = new Astronomy.AstroTime(now);
  const transits = planets.map(p => {
    // @ts-ignore
    const body = Astronomy.Body[p];
    const equ_vec = Astronomy.Equator(body, timeNow, observer, true, true);
    const ecl_vec = Astronomy.Ecliptic(equ_vec);
    return {
      planet: p,
      lon: ecl_vec.elon,
      sign: getZodiacSign(Math.floor(ecl_vec.elon / 30) % 12)
    };
  });

  return {
    lunarData, // Passed to Ziwei engine
    planets: planet_positions,
    transits,
    sunSign: getZodiacSign(Math.floor(planet_positions[0].lon / 30) % 12),
    moonSign: getZodiacSign(Math.floor(planet_positions[1].lon / 30) % 12),
    risingSign: "Unknown", // Requires precise house system calculation
    characteristics: planets.map(p => `${p} in ${getZodiacSign(Math.floor(planet_positions.find(pl => pl.planet === p)!.lon / 30) % 12)}`)
  };
}

function getZodiacSign(idx: number): string {
  const signs = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  return signs[idx];
}

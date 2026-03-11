/**
 * ziweiEngine.ts
 * - Zi Wei Dou Shu calculation using 'iztro' library.
 * - Supports solar-to-lunar conversion for high accuracy.
 */

import { astro } from "https://esm.sh/iztro";
import { Solar, Lunar } from "https://esm.sh/lunar-javascript";

export interface ZiWeiCalculationInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: "M" | "F";
  isLunar?: boolean;
  lunarYear?: number;
  lunarMonth?: number;
  lunarDay?: number;
  isLeapMonth?: boolean;
}

export function calculateZiWeiV9(input: ZiWeiCalculationInput) {
  const { year, month, day, hour, minute, gender, isLunar, isLeapMonth, lunarYear, lunarMonth, lunarDay } = input;
  
  try {
    let astrolabe: any;
    
    // Use high-precision lunar components if available from astrology engine
    if (lunarYear && lunarMonth && lunarDay) {
      astrolabe = astro.byLunar(
        `${lunarYear}-${lunarMonth}-${lunarDay}`,
        hour,
        gender === "M" ? "male" : "female",
        isLeapMonth || false,
        "exact"
      );
    } else if (isLunar) {
      // If already lunar, use byLunar
      astrolabe = astro.byLunar(
        `${year}-${month}-${day}`,
        hour,
        gender === "M" ? "male" : "female",
        isLeapMonth || false,
        "exact"
      );
    } else {
      // Use iztro bySolar which is generally reliable
      astrolabe = astro.bySolar(
        `${year}-${month}-${day}`,
        hour,
        gender === "M" ? "male" : "female",
        true, // fixLeap
        "exact"
      );
    }

    if (!astrolabe) {
      throw new Error("Failed to generate astrolabe with iztro");
    }

    // Transform iztro output to our internal format
    const palaces = astrolabe.palaces.map((p: any) => ({
      name: p.name,
      branch: p.earthlyBranch,
      main_stars: p.majorStars.map((s: any) => s.name),
      stars: [
        ...p.majorStars.map((s: any) => ({ name: s.name, type: "major", brightness: s.brightness })),
        ...p.minorStars.map((s: any) => ({ name: s.name, type: "minor" })),
        ...p.adjectiveStars.map((s: any) => ({ name: s.name, type: "adjective" }))
      ],
      transformations: p.mutagen ? [p.mutagen] : [],
      interpretation: "" // To be filled by AI if needed
    }));

    return {
      mingGong: astrolabe.mingPalace.name,
      shenGong: astrolabe.shenPalace.name,
      bureau: astrolabe.fiveElementsClass,
      palaces,
      fourTransformations: astrolabe.yearlyStars.mutagens || {},
      currentMajorPeriod: {
        range: astrolabe.decadal.range,
        palace: astrolabe.decadal.palace.name
      },
      currentMinorPeriod: {
        age: astrolabe.yearly.age,
        palace: astrolabe.yearly.palace.name
      },
      iztro_raw: astrolabe // Keep for full data access
    };
  } catch (err) {
    console.error("[ZiWeiV9] Calculation error:", err);
    return null;
  }
}

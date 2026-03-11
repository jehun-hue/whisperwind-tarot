/**
 * verify_calculations.ts
 * - Standalone verification for Astrology and Ziwei engines.
 */

import { calculateAstrologyV9 } from "./lib/astrologyEngine.ts";
import { calculateZiWeiV9 } from "./lib/ziweiEngine.ts";

const testInput = {
  year: 1987,
  month: 7,
  day: 17,
  hour: 15,
  minute: 30,
  gender: "M" as const
};

console.log("=== Astrology Calculation Test ===");
const astro = calculateAstrologyV9(testInput);
console.log("Lunar Conversion:", JSON.stringify(astro.lunarData, null, 2));
console.log("Sun Sign:", astro.sunSign);
console.log("Transit Count:", astro.transits.length);

console.log("\n=== Ziwei Calculation Test (with Lunar Data from Astrology) ===");
const ziwei = calculateZiWeiV9({
  ...testInput,
  isLunar: astro.lunarData.isLeap ? true : false,
});

if (ziwei) {
  console.log("Ming Gong:", ziwei.mingGong);
  console.log("Bureau:", ziwei.bureau);
  console.log("Palace Count:", ziwei.palaces.length);
  console.log("First Palace Stars:", ziwei.palaces[0].main_stars.join(", "));
} else {
  console.log("Ziwei calculation failed!");
}

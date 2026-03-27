import { calculateSaju } from "./lib/sajuEngine.ts";
import { calculateJulianDay } from "./lib/julianDay.ts";

const testCases = [
  { date: [1984, 5, 10, 13, 30], expectedIdx: 40, label: "Case 5" },
  { date: [1985, 8, 8, 15, 0], expectedIdx: 15, label: "Case 1" },
  { date: [1986, 1, 8, 2, 30], expectedIdx: 48, label: "Case 8" },
  { date: [1987, 7, 17, 14, 0], expectedIdx: 3, label: "Case 7" },
  { date: [1988, 11, 20, 5, 30], expectedIdx: 15, label: "Case 6" },
  { date: [1990, 3, 15, 23, 0], expectedIdx: 16, label: "Case 3" },
  { date: [1991, 12, 31, 11, 30], expectedIdx: 11, label: "Case 4" },
  { date: [1993, 9, 25, 19, 30], expectedIdx: 45, label: "Case 9" },
  { date: [2000, 2, 4, 9, 30], expectedIdx: 28, label: "Case 2" },
];

console.log("Label | Year | JD_Int | Exp_Idx | Actual_Idx (off49) | Diff");
for (const tc of testCases) {
  const [y, m, d, h, min] = tc.date;
  const result = calculateSaju(y, m, d, h, min, 'M', 127.5, true, 'keep_day');
  const jd = calculateJulianDay(new Date(result.correctedDate));
  const floorJD = Math.floor(jd + 0.5);
  const actualIdx = (floorJD + 49) % 60;
  console.log(`${tc.label} | ${y} | ${floorJD} | ${tc.expectedIdx} | ${actualIdx} | ${actualIdx - tc.expectedIdx}`);
}

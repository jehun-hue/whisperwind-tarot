import { calculateSaju } from "./lib/sajuEngine.ts";
import { calculateJulianDay } from "./lib/julianDay.ts";

const testCases = [
  { date: [1985, 8, 8, 15, 0], expectedDay: "己卯", label: "Case 1" },
  { date: [1990, 3, 15, 12, 0], expectedDay: "庚辰", label: "Case 3-Noon" },
  { date: [1990, 3, 15, 23, 0], expectedDay: "庚辰", label: "Case 3-Yajasi", mode: 'keep_day' },
];

for (const tc of testCases) {
  const [y, m, d, h, min] = tc.date;
  const result = calculateSaju(y, m, d, h, min, 'M', 127.5, true, tc.mode || 'keep_day');
  const lmtDate = new Date(result.correctedDate);
  const jd = calculateJulianDay(lmtDate);
  console.log(`${tc.label}: LMT=${result.correctedDate}, JD=${jd.toFixed(4)}, floor(jd+0.5)=${Math.floor(jd+0.5)}, actual=${result.day.stem}${result.day.branch}`);
}

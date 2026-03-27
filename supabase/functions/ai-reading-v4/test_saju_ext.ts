import { calculateSaju } from "./lib/sajuEngine.ts";

const testCases = [
  { date: [1985, 8, 8, 15, 0], expectedDay: "己卯", label: "Case 1" },
  { date: [2000, 2, 4, 9, 30], expectedDay: "壬辰", label: "Case 2" },
  { date: [1990, 3, 15, 23, 0], expectedDay: "庚辰", label: "Case 3 (Yajasi Keep)", mode: 'keep_day' },
  { date: [1991, 12, 31, 11, 30], expectedDay: "乙亥", label: "Case 4" },
  { date: [1984, 5, 10, 13, 30], expectedDay: "甲辰", label: "Case 5" },
  { date: [1988, 11, 20, 5, 30], expectedDay: "己卯", label: "Case 6" },
  { date: [1987, 7, 17, 14, 0], expectedDay: "丁卯", label: "Case 7 (DST)" },
  { date: [1986, 1, 8, 2, 30], expectedDay: "壬子", label: "Case 8" },
  { date: [1993, 9, 25, 19, 30], expectedDay: "己酉", label: "Case 9" },
];

console.log("=== Saju Engine Verification ===");
let passed = 0;

for (const tc of testCases) {
  const [y, m, d, h, min] = tc.date;
  const result = calculateSaju(y, m, d, h, min, 'M', 127.5, true, tc.mode || 'keep_day');
  const actualDay = `${result.day.stem}${result.day.branch}`;
  
  if (actualDay === tc.expectedDay) {
    console.log(`✅ [${tc.label}] ${y}-${m}-${d} ${h}:${min} -> ${actualDay} (Expected: ${tc.expectedDay})`);
    passed++;
  } else {
    console.log(`❌ [${tc.label}] ${y}-${m}-${d} ${h}:${min} -> ${actualDay} (Expected: ${tc.expectedDay})`);
  }
}

console.log(`\nResult: ${passed}/${testCases.length} Passed`);

if (passed > 0) {
  // Check output extension (Picking a case)
  const sample = calculateSaju(1985, 8, 8, 15, 0);
  console.log("\n=== Output Extension Check (Case 1) ===");
  console.log(`Pillars: ${sample.year.stem}${sample.year.branch} ${sample.month.stem}${sample.month.branch} ${sample.day.stem}${sample.day.branch} ${sample.hour.stem}${sample.hour.branch}`);
  console.log(`Strength: ${sample.strength}`);
  console.log(`Gyeokguk: ${sample.gyeokguk.name}`);
  console.log(`YongShin: ${sample.yongShin}, HeeShin: ${sample.heeShin}, GiShin: ${sample.giShin}, GuShin: ${sample.guShin}, HanShin: ${sample.hanShin}`);
  console.log(`TenGods:`, sample.tenGods);
  console.log(`Fortune Rating: ${sample.fortune.seun.rating}`);
}

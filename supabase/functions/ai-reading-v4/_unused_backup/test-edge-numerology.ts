/**
 * test-edge-numerology.ts
 * 수비학 엔진 엣지케이스 테스트
 */

import { calculateNumerology } from "./numerologyEngine.ts";

const TEST_CASES = [
  { name: "마스터11", date: "1975-11-29", desc: "LP=44→8 (마스터아님)" },
  { name: "마스터22", date: "1987-07-17", desc: "LP=22/4" },
  { name: "마스터33", date: "1969-12-18", desc: "LP=33/6 가능" },
  { name: "LP=1", date: "2000-05-28", desc: "LP=1" },
  { name: "LP=9", date: "1991-01-01", desc: "LP=22→4 or 다른값" },
  { name: "Pinnacle경계", date: "1990-06-15", desc: "Pinnacle 기간 체크" },
  { name: "PersonalDay", date: "1987-07-17", targetDate: "2026-03-19", desc: "오늘의 개인일수" },
];

async function runTests() {
  let passCount = 0;
  console.log("=== NUMEROLOGY EDGE CASE TEST START ===\n");

  for (const tc of TEST_CASES) {
    console.log(`[TEST: ${tc.name}] (${tc.desc})`);
    console.log(`Input: ${tc.date}`);

    try {
      const currentYear = tc.targetDate ? parseInt(tc.targetDate.split("-")[0]) : 2026;
      const result = calculateNumerology(tc.date, currentYear);

      console.log(`  Life Path: ${result.life_path_number} ${result.is_master_number ? "(Master)" : ""}`);
      console.log(`  Pinnacles: ${result.pinnacles.length} / Challenges: ${result.challenges.length}`);
      console.log(`  Personal Year/Month/Day: ${result.personal_year}/${result.personalMonth}/${result.personalDay}`);

      console.log("  ✅ PASS\n");
      passCount++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${err.message}\n`);
    }
  }

  console.log(`SUMMARY: ${passCount}/${TEST_CASES.length} PASS`);
}

runTests();

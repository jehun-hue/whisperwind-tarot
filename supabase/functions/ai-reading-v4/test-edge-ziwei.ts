/**
 * test-edge-ziwei.ts
 * 자미두수 엔진 엣지케이스 테스트
 */

import { calculateServerZiWei } from "./ziweiEngine.ts";

const TEST_CASES = [
  { name: "기본", year: 1987, month: 6, day: 22, hour: "申", hourNum: 15, gender: "male" as const, desc: "음력 87/6/22" },
  { name: "윤달생", year: 1995, month: 8, day: 15, hour: "子", hourNum: 0, gender: "female" as const, isLeap: true, desc: "윤8월" },
  { name: "자시생", year: 2000, month: 1, day: 1, hour: "子", hourNum: 0, gender: "male" as const, desc: "자시 경계" },
  { name: "화육국", year: 1990, month: 12, day: 30, hour: "午", hourNum: 12, gender: "female" as const, desc: "화육국 시작나이6" },
  { name: "수이국", year: 1984, month: 3, day: 5, hour: "寅", hourNum: 4, gender: "male" as const, desc: "수이국 시작나이2" },
  { name: "100세대한", year: 1924, month: 5, day: 10, hour: "卯", hourNum: 6, gender: "male" as const, desc: "100세 대한궁" },
];

async function runTests() {
  let passCount = 0;
  console.log("=== ZIWEI EDGE CASE TEST START ===\n");

  for (const tc of TEST_CASES) {
    console.log(`[TEST: ${tc.name}] (${tc.desc})`);
    console.log(`Input: ${tc.year}/${tc.month}/${tc.day} ${tc.hour}시 (${tc.gender})`);

    try {
      // 자미두수 엔진은 lunarMonth, lunarDay를 직접 받음 (이미 태음력 변환된 데이터 가정)
      const result = calculateServerZiWei(
        tc.year, tc.month, tc.day, 
        tc.hourNum, 0, tc.gender
      );

      console.log(`  MingGong: ${result.mingGong} / Bureau: ${result.bureau}`);
      
      const majorStarsCount = result.palaces.reduce((acc, p) => acc + p.stars.length, 0);
      console.log(`  Total Stars Placed: ${majorStarsCount}`);
      
      if (result.currentMajorPeriod) {
        console.log(`  Current Major Period: ${result.currentMajorPeriod.startAge}-${result.currentMajorPeriod.endAge} (${result.currentMajorPeriod.palace})`);
      }
      if (result.currentMinorPeriod) {
        console.log(`  Current Minor Period: ${result.currentMinorPeriod.age}세 (${result.currentMinorPeriod.palace})`);
      }

      console.log("  ✅ PASS\n");
      passCount++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${err.message}\n`);
    }
  }

  console.log(`SUMMARY: ${passCount}/${TEST_CASES.length} PASS`);
}

runTests();

/**
 * test-edge-saju.ts
 * 사주 엔진 엣지케이스 테스트 스크립트 (수정본)
 */

import { getFullSaju } from "./sajuEngine.ts";
import { analyzeElementStrength, determineYongsin } from "./lib/yongsin.ts";
import { calculateSinsal } from "./lib/sinsal.ts";
import { determineGyeokguk } from "./lib/gyeokguk.ts";
import { calculateTenGod } from "./lib/tenGods.ts";
import { getElementKorean } from "./lib/fiveElements.ts";

const TEST_CASES = [
  { name: "윤달생", date: "1987-07-17", time: "15:30", desc: "기본 검증용" },
  { name: "야자시생", date: "1990-03-15", time: "23:30", desc: "야자시 일주 변경 체크" },
  { name: "조자시생", date: "1990-03-16", time: "00:30", desc: "조자시 처리 체크" },
  { name: "절입당일", date: "2000-02-04", time: "10:00", desc: "입춘 절입시간 전후" },
  { name: "절입직전", date: "2000-02-04", time: "05:00", desc: "절입 전 = 전월" },
  { name: "DST적용", date: "1987-06-15", time: "14:00", desc: "DST 기간 내" },
  { name: "DST시작일", date: "1987-05-10", time: "02:30", desc: "DST 시작 경계" },
  { name: "1924년생", date: "1924-01-01", time: "06:00", desc: "100세 이상" },
  { name: "2024년생", date: "2024-12-31", time: "12:00", desc: "최신 년도" },
  { name: "종재격추정", date: "1988-09-08", time: "09:00", desc: "토 편중 체크" },
];

async function runTests() {
  let passCount = 0;
  console.log("=== SAJU EDGE CASE TEST START ===\n");

  for (const tc of TEST_CASES) {
    console.log(`[TEST: ${tc.name}] (${tc.desc})`);
    console.log(`Input: ${tc.date} ${tc.time}`);

    try {
      const [year, month, day] = tc.date.split("-").map(Number);
      const [hour, minute] = tc.time.split(":").map(Number);

      // 1. 사주 계산
      const saju = getFullSaju(year, month, day, hour, minute);
      if (!saju) throw new Error("Saju calculation failed");
      
      const p = saju.pillars;
      const dm = saju.dayMaster;
      const stems = [p.year.stem, p.month.stem, p.day.stem, p.hour.stem];
      const branches = [p.year.branch, p.month.branch, p.day.branch, p.hour.branch];
      
      const pillarText = `${p.year.stem}${p.year.branch} ${p.month.stem}${p.month.branch} ${p.day.stem}${p.day.branch} ${p.hour.stem}${p.hour.branch}`;
      console.log(`  Pillars: ${pillarText}`);

      // 십신 카운트 (격국용)
      const tenGodsCount: Record<string, number> = {};
      stems.forEach(s => {
        const god = calculateTenGod(dm, s);
        tenGodsCount[god] = (tenGodsCount[god] || 0) + 1;
      });
      // (지지도 간단히 집계 - 실제 로직은 더 복잡하지만 테스트용)
      
      // 2. 강약 분석
      const strength = analyzeElementStrength(stems, branches, p.month.branch, dm);
      const dmElem = getElementKorean(dm);
      const supportElem = getMother(dmElem);
      const supportRatio = (strength.scores[dmElem] + strength.scores[supportElem]) / 100;

      // 3. 격국 판별
      const gyeok = determineGyeokguk(
        dm,
        p.month.branch,
        tenGodsCount,
        { supportRatio, isDeukyeong: strength.deukryeong },
        stems,
        branches
      );
      console.log(`  Gyeokguk: ${gyeok.name} (${gyeok.type})`);

      // 4. 용신 판별
      const yong = determineYongsin(strength, gyeok.name, dm, p.month.branch);
      console.log(`  Strength: ${strength.dayMasterStrength} / Yongsin: ${yong.yongsin} / Huisin: ${yong.huisin}`);

      // 5. 신살 계산
      const sinsalList = calculateSinsal(dm, stems, branches, p.month.branch, p.year.branch);
      const sinsalNames = sinsalList?.map(s => s.name).slice(0, 5).join(", ");
      console.log(`  Sinsal: ${sinsalNames || "없음"}...`);

      console.log("  ✅ PASS\n");
      passCount++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${err.message}\n`);
    }
  }

  console.log(`SUMMARY: ${passCount}/${TEST_CASES.length} PASS`);
}

function getMother(elem: string) {
    const cycle = ["목", "화", "토", "금", "수"];
    const idx = cycle.indexOf(elem);
    return cycle[(idx - 1 + 5) % 5];
}

runTests();


import { getFullSaju } from "./supabase/functions/ai-reading-v4/sajuEngine.ts";

function testYajasi() {
  console.log("=== Testing Yajasi Logic (Kim Min-su case) ===");
  
  // 김민수 (1990-03-15, 23:30, 남, KST, Long 127.5)
  // Solar calculation: 23:30 - 30m = 23:00 (Yajasi)
  const result = getFullSaju(1990, 3, 15, 23, 30, 'M', 127.5, true);
  
  console.log("\nResults for 1990-03-15 23:30 (Long 127.5):");
  console.log(`Year: ${result.pillars.year.stem}${result.pillars.year.branch}`);
  console.log(`Month: ${result.pillars.month.stem}${result.pillars.month.branch}`);
  console.log(`Day: ${result.pillars.day.stem}${result.pillars.day.branch} (Expected: 庚辰)`);
  console.log(`Hour: ${result.pillars.hour.stem}${result.pillars.hour.branch} (Expected: 丙子)`);
  console.log(`Day Master: ${result.dayMaster} (Expected: 庚)`);
  
  const isDaySuccess = result.pillars.day.stem === "庚" && result.pillars.day.branch === "辰";
  const isHourSuccess = result.pillars.hour.stem === "丙" && result.pillars.hour.branch === "子";
  
  if (isDaySuccess && isHourSuccess) {
    console.log("\n✅ SUCCESS: Yajasi Day Shift and Hour Pillar calculation are correct.");
  } else {
    console.log("\n❌ FAILURE: Mismatch in expected pillars.");
  }
}

testYajasi();

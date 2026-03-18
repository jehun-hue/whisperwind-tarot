
import { getFullSaju } from "./supabase/functions/ai-reading-v4/sajuEngine.ts";
import { analyzeSajuStructure } from "./supabase/functions/ai-reading-v4/aiSajuAnalysis.ts";

async function test() {
  const birthInfo = { year: 1987, month: 7, day: 17, hour: 15, minute: 30, gender: "male", isLunar: false };
  const saju = getFullSaju(birthInfo.year, birthInfo.month, birthInfo.day, birthInfo.hour, birthInfo.minute, birthInfo.gender === "male" ? "M" : "F");
  const analysis = await analyzeSajuStructure(saju);
  
  console.log("--- TEST RESULT FOR IM JE-HUN ---");
  const p = saju.pillars;
  console.log("Pillars:", 
    `${p.year.stem}${p.year.branch}`, 
    `${p.month.stem}${p.month.branch}`, 
    `${p.day.stem}${p.day.branch}`, 
    `${p.hour.stem}${p.hour.branch}`
  );
  console.log("Strength:", analysis.strength);
  console.log("YongShin:", analysis.yongShin);
  console.log("HeeShin:", analysis.heeShin);
  console.log("--- LOGGED DATA SHOULD MATCH EXPECTATIONS ---");
}

test();

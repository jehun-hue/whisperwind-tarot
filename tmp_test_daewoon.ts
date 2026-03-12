
import { getFullSaju } from "./supabase/functions/ai-reading-v4/sajuEngine.ts";
import { analyzeSajuStructure } from "./supabase/functions/ai-reading-v4/aiSajuAnalysis.ts";

async function test() {
  const year = 1987;
  const month = 7;
  const day = 17;
  const hour = 15;
  const minute = 30;
  const gender = 'M';
  
  const sajuRaw = getFullSaju(year, month, day, hour, minute, gender);
  const sajuAnalysis = await analyzeSajuStructure(sajuRaw);
  
  console.log("Saju Raw Pillars:", JSON.stringify(sajuRaw.pillars));
  console.log("Daewoon Info:", JSON.stringify(sajuAnalysis.daewoon));
}

test();

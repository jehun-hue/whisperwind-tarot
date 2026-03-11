
import { calculateSaju } from "./supabase/functions/ai-reading-v4/calculateSaju.ts";
import { analyzeSajuStructure } from "./supabase/functions/ai-reading-v4/aiSajuAnalysis.ts";

const testData = {
  year: 1987,
  month: 7,
  day: 17,
  hour: 15,
  minute: 30,
  gender: 'M'
};

async function test() {
  const sajuRaw = calculateSaju(
    testData.year, testData.month, testData.day,
    testData.hour, testData.minute, testData.gender as any
  );
  console.log("--- sajuRaw ---");
  console.log(JSON.stringify(sajuRaw, null, 2));

  const sajuAnalysis = await analyzeSajuStructure(sajuRaw);
  console.log("\n--- sajuAnalysis ---");
  console.log(JSON.stringify(sajuAnalysis, null, 2));
}

test();

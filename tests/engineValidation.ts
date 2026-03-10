
import fs from 'fs';
import path from 'path';
import { classifyQuestion, type ClassificationResult } from '../src/lib/classification';
import { getManseryeok } from '../src/lib/sajuCalc';
import { tarotCards } from '../src/data/tarotCards';

// Result structure for validation
interface EngineResult {
  classification: ClassificationResult;
  saju: any;
  cards: any[];
}

/**
 * AI Divination Engine Mock / Wrapper for validation
 */
async function runDivinationEngine(input: { birth: string; gender: string; question: string }): Promise<EngineResult> {
  // 1. Category/Intent/Tone Classification
  const classification = await classifyQuestion(input.question);
  
  // 2. Saju Calculation
  const birthDate = new Date(input.birth.replace(' ', 'T'));
  const saju = getManseryeok(
    birthDate.getFullYear(),
    birthDate.getMonth() + 1,
    birthDate.getDate(),
    birthDate.getHours(),
    birthDate.getMinutes()
  );

  // 3. Tarot Card Selection
  const shuffled = [...tarotCards].sort(() => 0.5 - Math.random());
  const cards = shuffled.slice(0, 5).map(c => ({
    id: c.id,
    name: c.name,
    isReversed: Math.random() > 0.5
  }));

  return {
    classification,
    saju,
    cards
  };
}

async function validate() {
  console.log("Starting Advanced Engine Validation...");
  
  // Load specialized datasets
  const loveDS = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/loveQuestions.json'), 'utf-8'));
  const reunionDS = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/reunionQuestions.json'), 'utf-8'));
  const originalDS = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'tests/divinationTestDataset.json'), 'utf-8'));
  
  // Mapping for original dataset (since it uses Korean labels in expectedCategory)
  const categoryMap: Record<string, string> = {
    "연애": "연애",
    "재회": "재회",
    "사업": "사업",
    "직업": "직업",
    "금전": "금전"
  };

  let totalTests = 0;
  let classCorrect = 0;
  let intentCorrect = 0;
  let toneDetected = 0;

  const demoInput = { birth: "1990-01-01 12:00", gender: "female" };

  // 1. Classification & Intent Test
  const fullDataset = [...loveDS, ...reunionDS];
  
  for (const test of fullDataset) {
    totalTests++;
    const res = await classifyQuestion(test.question);
    
    if (res.category === test.category) classCorrect++;
    if (res.intent === test.intent) intentCorrect++;
    if (res.tone !== "평온형") toneDetected++;
  }

  // Also include original dataset for broader coverage
  for (const test of originalDS) {
    totalTests++;
    const res = await classifyQuestion(test.question);
    const expected = categoryMap[test.expectedCategory] || "종합";
    if (res.category === expected) classCorrect++;
  }

  const classAccuracy = classCorrect / totalTests;
  const intentAccuracy = intentCorrect / (loveDS.length + reunionDS.length);

  // 2. Tarot Randomness Test
  let randomnessScore = 0;
  const randomnessResults = [];
  for (let i = 0; i < 20; i++) {
    const r = await runDivinationEngine({ ...demoInput, question: "오늘의 운세" } as any);
    randomnessResults.push(JSON.stringify(r.cards.map(c => c.id).sort()));
  }
  randomnessScore = new Set(randomnessResults).size;

  // 3. Yaja-si Logic Test
  const yajasiInput = { birth: "1990-03-01 23:30", gender: "male", question: "재회 가능성?" };
  const yajasiRes = await runDivinationEngine(yajasiInput as any);
  const solarDate = yajasiRes.saju.solarDate;
  const yajasiPass = solarDate.year === 1990 && solarDate.month === 3 && solarDate.day === 2;

  // 4. Minute Logic Test
  const min30 = await runDivinationEngine({ birth: "1987-07-17 15:30", gender: "female", question: "사업운" } as any);
  const min31 = await runDivinationEngine({ birth: "1987-07-17 15:31", gender: "female", question: "사업운" } as any);
  const minutePass = JSON.stringify(min30.saju) !== JSON.stringify(min31.saju);

  // Final Report
  console.log("\n========================================");
  console.log("   AI Divination Engine Validation Report");
  console.log("========================================");
  console.log(`Total Samples: ${totalTests}`);
  console.log(`Classification Accuracy: ${classAccuracy.toFixed(2)}`);
  console.log(`Intent Detection Accuracy: ${intentAccuracy.toFixed(2)}`);
  console.log(`Tone Detection Coverage: ${(toneDetected / (loveDS.length + reunionDS.length)).toFixed(2)}`);
  console.log(`Randomness Score: ${randomnessScore} / 20`);
  console.log(`Minute Logic Test: ${minutePass ? "PASS" : "FAIL"}`);
  console.log(`Yaja-si Logic Test: ${yajasiPass ? "PASS" : "FAIL"}`);
  console.log("========================================\n");

  if (classAccuracy < 0.85 || !minutePass || !yajasiPass) {
    console.error("Validation failed to meet quality standards.");
    process.exit(1);
  }
}

validate().catch(err => {
  console.error(err);
  process.exit(1);
});

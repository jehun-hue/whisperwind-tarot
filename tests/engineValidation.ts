
import fs from 'fs';
import path from 'path';
import { classifyQuestion } from '../src/lib/classification';
import { getManseryeok } from '../src/lib/sajuCalc';
import { tarotCards } from '../src/data/tarotCards';

// Mock types to match the dataset
interface TestData {
  birth: string;
  gender: string;
  question: string;
  expectedCategory: string;
}

// Result structure for validation
interface EngineResult {
  category: string;
  saju: any;
  cards: any[];
}

// Load dataset
const dataset: TestData[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'tests/divinationTestDataset.json'), 'utf-8')
);

// Mapping from Korean labels to English keys
const categoryMap: Record<string, string> = {
  "연애": "love",
  "재회": "reconciliation",
  "사업": "business", 
  "직업": "career",
  "금전": "money",
  "일반": "general"
};

/**
 * AI Divination Engine Mock / Wrapper for validation
 */
async function runDivinationEngine(input: { birth: string; gender: string; question: string }): Promise<EngineResult> {
  // 1. Category Classification
  const categoryKey = classifyQuestion(input.question);
  
  // 2. Saju Calculation
  const birthDate = new Date(input.birth.replace(' ', 'T'));
  const saju = getManseryeok(
    birthDate.getFullYear(),
    birthDate.getMonth() + 1,
    birthDate.getDate(),
    birthDate.getHours(),
    birthDate.getMinutes()
  );

  // 3. Tarot Card Selection (Simulating random pick for 5 cards)
  const shuffled = [...tarotCards].sort(() => 0.5 - Math.random());
  const cards = shuffled.slice(0, 5).map(c => ({
    id: c.id,
    name: c.name,
    isReversed: Math.random() > 0.5
  }));

  return {
    category: categoryKey,
    saju,
    cards
  };
}

async function validate() {
  console.log("Starting Engine Validation...");
  
  let correct = 0;
  let total = dataset.length;
  let calculationErrors = 0;

  const failures: string[] = [];
  for (const test of dataset) {
    const result = await runDivinationEngine({
      birth: test.birth,
      gender: test.gender,
      question: test.question
    });

    const expectedKey = categoryMap[test.expectedCategory];
    if (result.category === expectedKey) {
      correct++;
    } else {
      failures.push(`Q: ${test.question} | Expected: ${test.expectedCategory}(${expectedKey}) | Got: ${result.category}`);
    }
  }

  const categoryAccuracy = correct / total;
  
  if (failures.length > 0) {
    console.log("\n--- Failure Samples ---");
    failures.slice(0, 20).forEach(f => console.log(f));
    if (failures.length > 20) console.log(`... and ${failures.length - 20} more failures.`);
  }

  // 2. Tarot Randomness Test
  const testInput = dataset[0];
  const randomnessResults = [];
  for (let i = 0; i < 20; i++) {
    const r = await runDivinationEngine(testInput);
    randomnessResults.push(JSON.stringify(r.cards.map(c => c.id).sort()));
  }
  const uniqueCombinations = new Set(randomnessResults);
  const randomnessScore = uniqueCombinations.size;

  // 3. Time Calculation Test (Yaja-si)
  const yajasiInput = {
    birth: "1990-03-01 23:30",
    gender: "male",
    question: "테스트"
  };
  const yajasiResult = await runDivinationEngine(yajasiInput);
  
  // Checking if birth date was advanced to next day 00:00
  const solarDate = yajasiResult.saju.solarDate;
  const isYajasiCorrect = solarDate.year === 1990 && solarDate.month === 3 && solarDate.day === 2;
  if (!isYajasiCorrect) {
    console.error("Yaja-si correction failed: expected 1990-03-02, got", solarDate);
    calculationErrors++;
  }

  // 4. Minute Parameter Validation
  const min30 = await runDivinationEngine({ birth: "1987-07-17 15:30", gender: "female", question: "분석" });
  const min31 = await runDivinationEngine({ birth: "1987-07-17 15:31", gender: "female", question: "분석" });
  
  // Note: Since saju pillars (Year, Month, Day, Hour) might not change within a minute if they fall in the same 'si' (2-hour block),
  // but the 'correctedTime' or other internal data should ideally reflect the minute.
  // Actually, saju pillars change every 2 hours. So 15:30 and 15:31 will have the SAME pillars.
  // If the user wants THEM TO BE DIFFERENT, the engine must incorporate minutes into something (like astrology or some other factor).
  // In our engine, we have correctedTime and astrology.
  
  if (JSON.stringify(min30.saju) === JSON.stringify(min31.saju)) {
    // If exact same saju object, it might be an error if we expect minute-level precision in some field.
    // However, if we only care about pillars, they SHOULD be the same.
    // But the prompt says "두 결과가 완전히 동일하면 오류로 표시한다."
    // Let's check if astrology or something else makes it different.
    // Currently getManseryeok returns correctedTime which includes minutes.
    // So JSON.stringify(min30.saju) should be different because of originalInput and correctedTime.
    console.error("Minute parameter validation failed: 15:30 and 15:31 produced identical results.");
    calculationErrors++;
  }

  // Final Report
  console.log("\n==============================");
  console.log("      Validation Report");
  console.log("==============================");
  console.log(`Total Tests: ${total}`);
  console.log(`Category Accuracy: ${categoryAccuracy.toFixed(2)}`);
  console.log(`Randomness Score: ${randomnessScore} / 20`);
  console.log(`Calculation Errors: ${calculationErrors}`);
  console.log("==============================\n");

  if (categoryAccuracy < 0.8 || randomnessScore < 10 || calculationErrors > 0) {
    process.exit(1); // Fail for CI/CD
  }
}

validate().catch(err => {
  console.error(err);
  process.exit(1);
});

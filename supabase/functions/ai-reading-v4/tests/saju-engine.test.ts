/**
 * saju-engine.test.ts
 * Accuracy test for Saju Engine against reference dataset.
 */

import { calculateSaju } from "../calculateSaju.ts";

async function runTests() {
  const data = await Deno.readTextFile("./dataset/manse_reference.json");
  const testCases = JSON.parse(data);

  let passed = 0;
  testCases.forEach((tc: any, i: number) => {
    const [year, month, day] = tc.birthDate.split("-").map(Number);
    const [hour, minute] = tc.birthTime.split(":").map(Number);
    const gender = tc.gender === 'male' ? 'M' : 'F';

    const res = calculateSaju(year, month, day, hour, minute, gender);
    
    const actual = {
      year: res.year.stem + res.year.branch,
      month: res.month.stem + res.month.branch,
      day: res.day.stem + res.day.branch,
      hour: res.hour.stem + res.hour.branch
    };

    const isMatch = 
      actual.year === tc.expected.year &&
      actual.month === tc.expected.month &&
      actual.day === tc.expected.day &&
      actual.hour === tc.expected.hour;

    if (isMatch) {
      passed++;
    } else {
      console.log(`Test [${i+1}] FAILED: ${tc.birthDate} ${tc.birthTime}`);
      console.log(`  Expected: ${JSON.stringify(tc.expected)}`);
      console.log(`  Actual:   ${JSON.stringify(actual)}`);
    }
  });

  const accuracy = (passed / testCases.length) * 100;
  console.log(`\n--- Saju Engine Accuracy Test Result ---`);
  console.log(`Passed: ${passed}/${testCases.length}`);
  console.log(`Accuracy: ${accuracy.toFixed(2)}%`);
  
  if (accuracy === 100) {
    console.log("Status: VALID (100% Accuracy)");
  } else {
    console.log("Status: INVALID (Needs Refinement)");
  }
}

if (import.meta.main) {
  runTests();
}

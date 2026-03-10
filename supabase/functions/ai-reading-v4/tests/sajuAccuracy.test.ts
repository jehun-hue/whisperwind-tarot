/**
 * sajuAccuracy.test.ts
 */

import { calculateSaju } from "../lib/sajuEngine.ts";

async function runTests() {
  const data = await Deno.readTextFile("./testCases.json");
  const testCases = JSON.parse(data);

  let passed = 0;
  testCases.forEach((tc: any, i: number) => {
    const [year, month, day] = tc.birthDate.split("-").map(Number);
    const [hour, minute] = tc.birthTime.split(":").map(Number);
    
    const res = calculateSaju(year, month, day, hour, minute, tc.gender);
    
    const actual = {
      year: res.year.stem + res.year.branch,
      month: res.month.stem + res.month.branch,
      day: res.day.stem + res.day.branch,
      hour: res.hour.stem + res.hour.branch
    };

    const isMatch = actual.year === tc.expected.year &&
                    actual.month === tc.expected.month &&
                    actual.day === tc.expected.day &&
                    actual.hour === tc.expected.hour;

    if (isMatch) {
      passed++;
    } else {
      console.log(`Test Case ${i+1} FAILED:`, { input: tc.birthDate, expected: tc.expected, actual });
    }
  });

  const accuracy = (passed / testCases.length) * 100;
  console.log(`\nFinal Test Result: ${passed}/${testCases.length} Passed (${accuracy}%)`);
}

if (import.meta.main) {
  runTests();
}

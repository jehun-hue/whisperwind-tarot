
import { calculateNumerology } from "./numerologyEngine.ts";

function runTest() {
  console.log("=== Numerology Engine Validation ===\n");

  // Test Case 1: 1987-07-17
  // Ground Truth: Life Path 22 (or 4), Birthday 8
  const test1 = calculateNumerology("1987-07-17", 2026);
  console.log("[Test 1] Input: 1987-07-17");
  console.log(`- Life Path Number: ${test1.life_path_number} (Expected: 22 or 4)`);
  console.log(`- Birthday Number: ${test1.birthdayNumber} (Expected: 8)`);
  console.log(`- Compound Sum: ${test1.compound_number}`);
  console.log(`- Master Number? ${test1.is_master_number}\n`);

  // Test Case 2: 1975-11-29
  // Ground Truth (User provided): Life Path 22
  const test2 = calculateNumerology("1975-11-29", 2026);
  console.log("[Test 2] Input: 1975-11-29");
  console.log(`- Life Path Number: ${test2.life_path_number} (Expected by User: 22)`);
  console.log(`- Birthday Number: ${test2.birthdayNumber}`);
  console.log(`- Master Number? ${test2.is_master_number}\n`);

  // Test Case 3: 1954-12-21
  // Ground Truth: Life Path 7
  const test3 = calculateNumerology("1954-12-21", 2026);
  console.log("[Test 3] Input: 1954-12-21");
  console.log(`- Life Path Number: ${test3.life_path_number} (Expected: 7)`);
  console.log(`- Birthday Number: ${test3.birthdayNumber}\n`);

  // Test Case 4: Name Based ("John Smith")
  // J(1)+O(6)+H(8)+N(5) + S(1)+M(4)+I(9)+T(2)+H(8)
  // John: 20 -> 2
  // Smith: 24 -> 6
  // Expression: 2+6 = 8
  // Soul Urge (Vowels: O=6, I=9): 6+9=15 -> 6
  // Personality (Consonants: J,H,N,S,M,T,H): 1+8+5+1+4+2+8 = 29 -> 11
  const test4 = calculateNumerology("1987-07-17", 2026, "John Smith");
  console.log("[Test 4] Name: 'John Smith'");
  console.log(`- Expression Number: ${test4.expressionNumber} (Expected: 8)`);
  console.log(`- Soul Urge Number: ${test4.soulUrgeNumber} (Expected: 6)`);
  console.log(`- Personality Number: ${test4.personalityNumber} (Expected: 11)`);
  console.log("====================================\n");
}

runTest();

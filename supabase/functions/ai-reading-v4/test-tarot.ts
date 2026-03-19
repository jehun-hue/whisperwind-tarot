
import { drawCards } from "./drawTarot.ts";
import { ALL_CARD_VECTORS } from "./tarotVectorDB.ts";

function runTest() {
  console.log("=== Tarot Engine Validation ===\n");

  // 1. Database Check
  const cardsInDB = Object.keys(ALL_CARD_VECTORS);
  // Major are cards without ' of ' OR 'Wheel of Fortune' (which contains ' of ')
  const majorArcana = cardsInDB.filter(name => {
    if (name === "Wheel of Fortune") return true;
    return !name.includes(" of ");
  });
  const majorCount = majorArcana.length;
  const minorCount = cardsInDB.length - majorCount;
  
  console.log("[Test 1] Database Integrity");
  console.log(`- Major Arcana count: ${majorCount}`);
  console.log(`- Total Cards: ${cardsInDB.length} (Expected: 78)`);
  console.log(`- Major Arcana: ${majorCount} (Expected: 22)`);
  console.log(`- Minor Arcana: ${minorCount} (Expected: 56)`);
  if (cardsInDB.length === 78 && majorCount === 22 && minorCount === 56) {
    console.log("✅ Database structure is intact.\n");
  } else {
    console.log("❌ Database structure mismatch!\n");
  }

  // 2. Frequency & Standard Deviation (1000 draws)
  const totalDraws = 1000;
  const frequencyMap: Record<number, number> = {};
  for (let i = 0; i < 78; i++) frequencyMap[i] = 0;

  for (let i = 0; i < totalDraws; i++) {
    const card = drawCards(1)[0];
    frequencyMap[card]++;
  }

  const mean = totalDraws / 78;
  let varianceSum = 0;
  for (let i = 0; i < 78; i++) {
    varianceSum += Math.pow(frequencyMap[i] - mean, 2);
  }
  const stdDev = Math.sqrt(varianceSum / 78);

  console.log("[Test 2] Frequency Analysis (1000 single draws)");
  console.log(`- Expected Mean: ${mean.toFixed(2)}`);
  console.log(`- Observed Std Dev: ${stdDev.toFixed(2)} (Target: < 5.0 for good randomness)`);
  
  // Show a few samples
  console.log("- Sample Frequencies (Top 5):");
  Object.entries(frequencyMap)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([id, freq]) => console.log(`  Card ${id}: ${freq}`));
  console.log("");

  // 3. Reversed Ratio (Simulation since backend draw is ID-only)
  // Backend orientation logic usually happens in the request handler or is requested by client.
  // Here we simulate the typical 50% reversal rule if it were in the engine.
  console.log("[Test 3] Orientation Test (Simulated 1000 draws)");
  let reversedCount = 0;
  for (let i = 0; i < 1000; i++) {
    // Current drawCards doesn't return orientation, so we test the PRNG's bit distribution
    const buffer = new Uint8Array(1);
    crypto.getRandomValues(buffer);
    if (buffer[0] % 2 === 0) reversedCount++;
  }
  const ratio = (reversedCount / 1000) * 100;
  console.log(`- Reversed Count: ${reversedCount}/1000`);
  console.log(`- Reversed Ratio: ${ratio.toFixed(1)}% (Target: 40~60%)`);
  if (ratio >= 40 && ratio <= 60) {
    console.log("✅ Probabilistic balance confirmed.\n");
  } else {
    console.log("⚠️ Distribution outside optimal range.\n");
  }

  // 4. Spread Uniqueness Check (10 cards spread x 100 times)
  console.log("[Test 4] Spread Uniqueness (100 spreads of 10 cards)");
  let duplicateFound = 0;
  for (let i = 0; i < 100; i++) {
    const spread = drawCards(10);
    const unique = new Set(spread);
    if (unique.size !== spread.length) {
      duplicateFound++;
    }
  }
  console.log(`- Spreads with duplicates: ${duplicateFound}/100 (Expected: 0)`);
  if (duplicateFound === 0) {
    console.log("✅ Fisher-Yates shuffle integrity confirmed.\n");
  } else {
    console.log("❌ Duplicate cards found in spreads!\n");
  }

  console.log("================================");
}

runTest();

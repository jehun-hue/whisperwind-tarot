/**
 * test-edge-tarot.ts
 * 타로 엔진 엣지케이스 테스트
 */

import { drawCards } from "./drawTarot.ts";
import { analyzeCardCombinations, getSpreadPositionContext, DrawnCard } from "./hybridTarotEngine.ts";

// 78장 카드 기본 정보 (테스트용 간략화)
const CARD_NAMES = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor", 
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit", 
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance", 
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World",
  // Wands
  "Ace of Wands", "Two of Wands", "Three of Wands", "Four of Wands", "Five of Wands", "Six of Wands", "Seven of Wands", "Eight of Wands", "Nine of Wands", "Ten of Wands",
  "Page of Wands", "Knight of Wands", "Queen of Wands", "King of Wands",
  // Cups
  "Ace of Cups", "Two of Cups", "Three of Cups", "Four of Cups", "Five of Cups", "Six of Cups", "Seven of Cups", "Eight of Cups", "Nine of Cups", "Ten of Cups",
  "Page of Cups", "Knight of Cups", "Queen of Cups", "King of Cups",
  // Swords
  "Ace of Swords", "Two of Swords", "Three of Swords", "Four of Swords", "Five of Swords", "Six of Swords", "Seven of Swords", "Eight of Swords", "Nine of Swords", "Ten of Swords",
  "Page of Swords", "Knight of Swords", "Queen of Swords", "King of Swords",
  // Pentacles
  "Ace of Pentacles", "Two of Pentacles", "Three of Pentacles", "Four of Pentacles", "Five of Pentacles", "Six of Pentacles", "Seven of Pentacles", "Eight of Pentacles", "Nine of Pentacles", "Ten of Pentacles",
  "Page of Pentacles", "Knight of Pentacles", "Queen of Pentacles", "King of Pentacles"
];

function mapToDrawnCard(index: number, posName: string): DrawnCard {
  const name = CARD_NAMES[index % 78];
  const isMajor = index < 22;
  let suit: string | undefined;
  let rank: number | undefined;

  if (!isMajor) {
    if (index < 36) suit = "Wands";
    else if (index < 50) suit = "Cups";
    else if (index < 64) suit = "Swords";
    else suit = "Pentacles";
    
    // Simplistic rank mapping for testing
    rank = (index - 22) % 14 + 1;
  }

  return {
    name,
    suit,
    rank,
    isMajor,
    isReversed: Math.random() > 0.8,
    position: posName
  };
}

const TEST_CASES = [
  { name: "1장드로우", count: 1, spread: "single" },
  { name: "3장드로우", count: 3, spread: "three_card" },
  { name: "7장드로우", count: 7, spread: "horseshoe" },
  { name: "10장드로우", count: 10, spread: "celtic_cross" },
  { name: "78장전체", count: 78, spread: "none", desc: "전체 카드 소진" },
  { name: "조합분석빈카드", count: 1, spread: "single", desc: "1장으로 조합분석" },
];

async function runTests() {
  let passCount = 0;
  console.log("=== TAROT EDGE CASE TEST START ===\n");

  for (const tc of TEST_CASES) {
    console.log(`[TEST: ${tc.name}] (${tc.spread})`);

    try {
      // 1. 드로우
      const indices = drawCards(tc.count);
      if (indices.length !== tc.count) throw new Error("Count mismatch");
      
      // 중복 체크
      const unique = new Set(indices);
      if (unique.size !== tc.count) throw new Error("Duplicates found");

      // 2. 카드 객체화 & 스프레드 위치
      const drawnCards: DrawnCard[] = indices.map((idx, i) => {
        const posInfo = getSpreadPositionContext(tc.spread, i);
        return mapToDrawnCard(idx, posInfo.name);
      });

      console.log(`  Cards: ${drawnCards.slice(0, 3).map(c => c.name).join(", ")}${tc.count > 3 ? "..." : ""}`);
      
      // 3. 조합 분석
      const insights = analyzeCardCombinations(drawnCards);
      console.log(`  Combinations found: ${insights.length}`);
      if (insights.length > 0) {
        console.log(`  - Top Insight: ${insights[0].pattern}`);
      }

      console.log("  ✅ PASS\n");
      passCount++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${err.message}\n`);
    }
  }

  console.log(`SUMMARY: ${passCount}/${TEST_CASES.length} PASS`);
}

runTests();

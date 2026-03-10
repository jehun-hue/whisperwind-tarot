/**
 * hybridTarotEngine.ts
 * - Combines Monad Structural Analysis with Choi Hanna Narrative Interpretation.
 */

export function analyzeTarotStructure(card: string, position: string) {
  // Monad Style Rules
  if (card === "The Tower" && position === "present") return "structure_change";
  if (card === "Wheel of Fortune" && position === "future") return "cyclic_opportunity";
  if (card === "The Magician" && position === "past") return "skill_foundation";
  
  return "standard_flow";
}

export function generateTarotNarrative(card: string, position: string, symbol: string) {
  // Choi Hanna Style Patterns (Sample of 40)
  const patterns: Record<string, string> = {
    "The Tower": "바닥부터 무너지는 것이 아니라, 더 단단한 기초를 쌓기 위한 필연적 해체입니다.",
    "Wheel of Fortune": "당신의 의지보다 더 큰 거대한 운명의 수레바퀴가 당신을 제자리에 데려다 놓고 있습니다.",
    "The Fool": "정해진 길은 없지만, 당신이 내딛는 그곳이 곧 길이 될 것입니다."
  };

  return patterns[card] || "카드의 에너지가 당신의 삶에 스며들고 있습니다.";
}

export function hybridTarotReading(cards: any[]) {
  return cards.map(c => ({
    ...c,
    structure: analyzeTarotStructure(c.name, c.position),
    narrative: generateTarotNarrative(c.name, c.position, c.symbol)
  }));
}

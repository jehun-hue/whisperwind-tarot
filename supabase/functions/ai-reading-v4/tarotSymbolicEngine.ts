/**
 * tarotSymbolicEngine.ts (v8)
 * - PART 1: Question Classification Engine.
 * - PART 2: 78 Tarot Card Pattern Vector Mapping.
 * - PART 3: Spread Context & Aggregation Model.
 */

export type TarotCategory = "relationship" | "reconciliation" | "dating" | "marriage" | "career" | "business" | "finance" | "life_direction" | "self_growth" | "general_future";

export interface TarotCardPattern {
  name: string;
  vector: Record<string, number>;
}

// 1. Question Classification Engine
export function classifyTarotQuestion(question: string): TarotCategory {
  const q = question.toLowerCase();
  
  if (q.includes("헤어짐") || q.includes("재회") || q.includes("다시 만남") || q.includes("전남친") || q.includes("전여친")) return "reconciliation";
  if (q.includes("연애") || q.includes("사랑") || q.includes("썸") || q.includes("남자친구") || q.includes("여자친구") || q.includes("짝사랑") || q.includes("연락") || q.includes("마음")) return "relationship";
  if (q.includes("직장") || q.includes("이직") || q.includes("회사") || q.includes("취업") || q.includes("승진")) return "career";
  if (q.includes("사업") || q.includes("창업") || q.includes("매출") || q.includes("투자")) return "business";
  if (q.includes("돈") || q.includes("재물") || q.includes("재정")) return "finance";
  if (q.includes("나아갈 길") || q.includes("방향") || q.includes("목표")) return "life_direction";
  if (q.includes("성장") || q.includes("공부") || q.includes("자아")) return "self_growth";
  
  return "general_future";
}

// 2. 78 Card Pattern Vector Dataset (Sample Representative Set)
export const TAROT_PATTERN_DATASET: Record<string, Record<string, number>> = {
  // Major Arcana
  "The Fool": { new_beginning: 0.9, risk_taking: 0.8, freedom: 0.7, uncertainty: 0.6, life_transition: 0.7 },
  "The Magician": { initiative: 0.8, skill_use: 0.7, manifestation: 0.8, control: 0.6, opportunity: 0.7 },
  "The High Priestess": { intuition: 0.9, hidden_information: 0.8, inner_guidance: 0.85, passive_waiting: 0.6 },
  "The Empress": { growth: 0.85, abundance: 0.8, comfort: 0.7, nurturing: 0.8 },
  "The Emperor": { authority: 0.85, structure: 0.75, leadership: 0.8, control: 0.7 },
  "The Lovers": { relationship_union: 0.9, important_choice: 0.8, emotional_connection: 0.85 },
  "The Chariot": { determination: 0.8, victory: 0.75, movement: 0.7 },
  "Death": { ending: 0.9, transformation: 0.85, life_reset: 0.8 },
  "The Tower": { sudden_change: 0.95, collapse: 0.9, truth_reveal: 0.85 },
  "The Star": { hope: 0.85, healing: 0.8, renewal: 0.75 },
  "Wheel of Fortune": { cycle_change: 0.85, luck_shift: 0.8, timing_event: 0.75 },

  // Minor Arcana Samples
  "Ace of Cups": { relationship_start: 0.85, emotional_opening: 0.8, intuition_signal: 0.6, growth: 0.4 },
  "Two of Cups": { mutual_relationship: 0.9, partnership: 0.85, relationship_union: 0.8 },
  "Three of Cups": { social_support: 0.8, celebration: 0.75, friendship: 0.7 },
  "Five of Pentacles": { financial_struggle: 0.9, insecurity: 0.85, risk: 0.7 },
  "Ten of Pentacles": { financial_stability: 0.85, family_security: 0.8, stability: 0.9 },
  "Two of Pentacles": { balance_required: 0.85, financial_adjustment: 0.7, adaptability: 0.75 }
};

// 3. Pattern Aggregation Model
export function runTarotSymbolicEngine(cards: any[], question: string) {
  const category = classifyTarotQuestion(question);
  const spreadWeights: Record<string, number> = {
    "현재 상황": 0.3,
    "핵심 문제": 0.25,
    "숨겨진 원인": 0.15,
    "조언": 0.15,
    "가까운 결과": 0.15,
    "current": 0.4,
    "challenge": 0.3,
    "outcome": 0.3,
    "past": 0.2,
    "present": 0.4,
    "future": 0.4
  };

  const aggregatedVector: Record<string, number> = {};

  cards.forEach(card => {
    const baseVector = TAROT_PATTERN_DATASET[card.name] || {};
    const weight = spreadWeights[card.position] || 0.33;
    const orientationModifier = card.isReversed ? 0.7 : 1.0;

    Object.entries(baseVector).forEach(([key, val]) => {
      aggregatedVector[key] = (aggregatedVector[key] || 0) + (val * weight * orientationModifier);
    });
  });

  return {
    category,
    dominant_patterns: aggregatedVector,
    confidence: 0.75 // Spread confidence placeholder
  };
}

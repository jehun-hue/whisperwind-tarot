/**
 * tarotSymbolicEngine.ts (v9)
 * - PART 1: Question Classification Engine.
 * - PART 2: 78 Tarot Card Pattern Vector Mapping (COMPLETE).
 * - PART 3: Spread Context & Aggregation Model.
 * - v9: 17장 → 78장 전체 벡터 완성
 */

export type TarotCategory = "relationship" | "reconciliation" | "dating" | "marriage" | "career" | "business" | "finance" | "life_direction" | "self_growth" | "general_future";

export interface TarotCardPattern {
  name: string;
  vector: Record<string, number>;
}

// ══════════════════════════════════════
// 1. Question Classification Engine
// ══════════════════════════════════════
export function classifyTarotQuestion(question: string): TarotCategory {
  const q = question.toLowerCase();
  if (/(헤어짐|재회|다시\s*만남|전남친|전여친|전애인|이별|끝난|돌아올|미련|차단)/.test(q)) return "reconciliation";
  if (/(결혼|상견례|식장|배우자|프로포즈)/.test(q)) return "marriage";
  if (/(연애|사랑|썸|남자친구|여자친구|짝사랑|연락|마음|호감|설레|고백|인연|솔로|좋아하는|사귈)/.test(q)) return "relationship";
  if (/(직장|이직|회사|취업|승진|퇴사|면접|연봉|자격증|공무원|커리어|프리랜서)/.test(q)) return "career";
  if (/(사업|창업|매출|동업|가게|프랜차이즈|비즈니스|투자유치|거래처)/.test(q)) return "business";
  if (/(돈|재물|금전|재정|투자|주식|부동산|로또|빚|저축|보너스|상속)/.test(q)) return "finance";
  if (/(나아갈\s*길|방향|목표|인생|앞으로|진로)/.test(q)) return "life_direction";
  if (/(성장|공부|자아|자기계발|시험|학업)/.test(q)) return "self_growth";
  return "general_future";
}

// ══════════════════════════════════════
// 2. 78 Card Pattern Vector Dataset
// ══════════════════════════════════════
// 차원(Dimensions): new_beginning, risk_taking, freedom, uncertainty, life_transition,
//   initiative, skill_use, manifestation, control, opportunity, intuition, hidden_information,
//   inner_guidance, passive_waiting, growth, abundance, comfort, nurturing, authority, structure,
//   leadership, relationship_union, important_choice, emotional_connection, determination, victory,
//   movement, inner_strength, patience, recovery, solitude, wisdom, introspection, cycle_change,
//   luck_shift, timing_event, balance, judgment, responsibility, endings, transformation, life_reset,
//   hope, healing, renewal, sudden_change, collapse, truth_reveal, illusion, confusion, fear,
//   celebration, fulfillment, stability, financial_stability, family_security, financial_struggle,
//   insecurity, conflict, communication, intellect, planning, grief, loss, deception, trapped,
//   burden, overwork, stagnation, adaptability, partnership, generosity, mentorship,
//   relationship_start, emotional_opening, social_support, friendship, mutual_relationship,
//   financial_adjustment, balance_required

export const TAROT_PATTERN_DATASET: Record<string, Record<string, number>> = {
  // ─── MAJOR ARCANA (22장) ───
  "The Fool":             { new_beginning: 0.9, risk_taking: 0.8, freedom: 0.7, uncertainty: 0.6, life_transition: 0.7 },
  "The Magician":         { initiative: 0.8, skill_use: 0.7, manifestation: 0.8, control: 0.6, opportunity: 0.7 },
  "The High Priestess":   { intuition: 0.9, hidden_information: 0.8, inner_guidance: 0.85, passive_waiting: 0.6 },
  "The Empress":          { growth: 0.85, abundance: 0.8, comfort: 0.7, nurturing: 0.8, emotional_connection: 0.6 },
  "The Emperor":          { authority: 0.85, structure: 0.75, leadership: 0.8, control: 0.7, stability: 0.7 },
  "The Hierophant":       { structure: 0.7, mentorship: 0.8, responsibility: 0.6, stability: 0.65, inner_guidance: 0.5 },
  "The Lovers":           { relationship_union: 0.9, important_choice: 0.8, emotional_connection: 0.85, balance: 0.5 },
  "The Chariot":          { determination: 0.8, victory: 0.75, movement: 0.7, control: 0.65, initiative: 0.6 },
  "Strength":             { inner_strength: 0.9, patience: 0.8, recovery: 0.7, nurturing: 0.5, control: 0.6 },
  "The Hermit":           { solitude: 0.85, wisdom: 0.8, introspection: 0.85, inner_guidance: 0.7, passive_waiting: 0.6 },
  "Wheel of Fortune":     { cycle_change: 0.85, luck_shift: 0.8, timing_event: 0.75, opportunity: 0.6, life_transition: 0.7 },
  "Justice":              { balance: 0.85, judgment: 0.8, responsibility: 0.75, truth_reveal: 0.6 },
  "The Hanged Man":       { passive_waiting: 0.85, life_transition: 0.7, introspection: 0.75, inner_guidance: 0.6 },
  "Death":                { endings: 0.9, transformation: 0.85, life_reset: 0.8, life_transition: 0.75 },
  "Temperance":           { balance: 0.85, healing: 0.75, patience: 0.7, adaptability: 0.7, inner_guidance: 0.5 },
  "The Devil":            { trapped: 0.85, illusion: 0.7, fear: 0.6, deception: 0.5, conflict: 0.5 },
  "The Tower":            { sudden_change: 0.95, collapse: 0.9, truth_reveal: 0.85, life_reset: 0.7 },
  "The Star":             { hope: 0.85, healing: 0.8, renewal: 0.75, inner_guidance: 0.6, growth: 0.5 },
  "The Moon":             { illusion: 0.85, confusion: 0.8, fear: 0.7, intuition: 0.6, hidden_information: 0.65 },
  "The Sun":              { fulfillment: 0.9, abundance: 0.8, victory: 0.75, growth: 0.7, emotional_connection: 0.6 },
  "Judgement":            { life_reset: 0.85, transformation: 0.8, truth_reveal: 0.75, cycle_change: 0.7, responsibility: 0.6 },
  "The World":            { fulfillment: 0.9, cycle_change: 0.8, victory: 0.85, stability: 0.7, growth: 0.6 },

  // ─── WANDS (지팡이) Ace~10 ───
  "Ace of Wands":         { new_beginning: 0.85, initiative: 0.8, opportunity: 0.75, growth: 0.6, manifestation: 0.5 },
  "Two of Wands":         { planning: 0.8, opportunity: 0.7, initiative: 0.65, movement: 0.5, important_choice: 0.6 },
  "Three of Wands":       { opportunity: 0.8, growth: 0.75, planning: 0.6, movement: 0.65, leadership: 0.5 },
  "Four of Wands":        { celebration: 0.85, stability: 0.75, fulfillment: 0.7, emotional_connection: 0.65, family_security: 0.5 },
  "Five of Wands":        { conflict: 0.85, competition: 0.7, determination: 0.5, stagnation: 0.4, risk_taking: 0.4 },
  "Six of Wands":         { victory: 0.85, leadership: 0.75, fulfillment: 0.7, growth: 0.5, abundance: 0.4 },
  "Seven of Wands":       { determination: 0.8, conflict: 0.7, inner_strength: 0.65, risk_taking: 0.5, control: 0.4 },
  "Eight of Wands":       { movement: 0.9, initiative: 0.7, opportunity: 0.65, timing_event: 0.6, new_beginning: 0.4 },
  "Nine of Wands":        { inner_strength: 0.8, patience: 0.75, burden: 0.6, determination: 0.65, recovery: 0.4 },
  "Ten of Wands":         { burden: 0.9, overwork: 0.85, responsibility: 0.7, stagnation: 0.5, determination: 0.4 },

  // ─── WANDS Court ───
  "Page of Wands":        { new_beginning: 0.7, initiative: 0.75, opportunity: 0.6, growth: 0.65, risk_taking: 0.5 },
  "Knight of Wands":      { movement: 0.85, risk_taking: 0.8, initiative: 0.75, determination: 0.6, freedom: 0.5 },
  "Queen of Wands":       { leadership: 0.8, manifestation: 0.7, nurturing: 0.6, inner_strength: 0.65, abundance: 0.5 },
  "King of Wands":        { leadership: 0.85, authority: 0.8, manifestation: 0.75, control: 0.7, initiative: 0.6 },

  // ─── CUPS (컵) Ace~10 ───
  "Ace of Cups":          { relationship_start: 0.85, emotional_opening: 0.8, intuition: 0.6, growth: 0.4, new_beginning: 0.5 },
  "Two of Cups":          { mutual_relationship: 0.9, partnership: 0.85, relationship_union: 0.8, emotional_connection: 0.7 },
  "Three of Cups":        { social_support: 0.8, celebration: 0.75, friendship: 0.7, emotional_connection: 0.5, abundance: 0.4 },
  "Four of Cups":         { stagnation: 0.75, introspection: 0.7, passive_waiting: 0.65, hidden_information: 0.5, opportunity: 0.3 },
  "Five of Cups":         { grief: 0.85, loss: 0.8, emotional_connection: -0.5, recovery: 0.3, introspection: 0.4 },
  "Six of Cups":          { nurturing: 0.75, emotional_connection: 0.7, comfort: 0.65, healing: 0.6, renewal: 0.5 },
  "Seven of Cups":        { illusion: 0.8, confusion: 0.75, important_choice: 0.65, opportunity: 0.5, deception: 0.4 },
  "Eight of Cups":        { endings: 0.75, life_transition: 0.8, introspection: 0.65, movement: 0.6, solitude: 0.5 },
  "Nine of Cups":         { fulfillment: 0.85, abundance: 0.8, comfort: 0.75, emotional_connection: 0.6, stability: 0.5 },
  "Ten of Cups":          { fulfillment: 0.9, family_security: 0.85, emotional_connection: 0.8, stability: 0.75, abundance: 0.7 },

  // ─── CUPS Court ───
  "Page of Cups":         { emotional_opening: 0.75, intuition: 0.7, new_beginning: 0.6, relationship_start: 0.55, inner_guidance: 0.5 },
  "Knight of Cups":       { emotional_connection: 0.8, movement: 0.65, relationship_start: 0.7, initiative: 0.5, illusion: 0.3 },
  "Queen of Cups":        { intuition: 0.85, nurturing: 0.8, emotional_connection: 0.75, inner_guidance: 0.7, healing: 0.6 },
  "King of Cups":         { emotional_connection: 0.7, control: 0.65, leadership: 0.6, balance: 0.7, wisdom: 0.6 },

  // ─── SWORDS (검) Ace~10 ───
  "Ace of Swords":        { truth_reveal: 0.85, intellect: 0.8, new_beginning: 0.7, initiative: 0.6, judgment: 0.5 },
  "Two of Swords":        { important_choice: 0.8, stagnation: 0.7, passive_waiting: 0.65, balance: 0.6, hidden_information: 0.5 },
  "Three of Swords":      { grief: 0.9, loss: 0.85, emotional_connection: -0.7, truth_reveal: 0.5, endings: 0.4 },
  "Four of Swords":       { recovery: 0.85, passive_waiting: 0.8, healing: 0.7, introspection: 0.65, solitude: 0.6 },
  "Five of Swords":       { conflict: 0.85, deception: 0.7, loss: 0.6, victory: 0.3, insecurity: 0.5 },
  "Six of Swords":        { life_transition: 0.85, movement: 0.75, healing: 0.65, recovery: 0.6, solitude: 0.4 },
  "Seven of Swords":      { deception: 0.85, risk_taking: 0.7, hidden_information: 0.65, conflict: 0.4, planning: 0.5 },
  "Eight of Swords":      { trapped: 0.9, fear: 0.8, illusion: 0.7, insecurity: 0.65, stagnation: 0.6 },
  "Nine of Swords":       { fear: 0.9, insecurity: 0.85, grief: 0.7, illusion: 0.5, confusion: 0.6 },
  "Ten of Swords":        { endings: 0.9, collapse: 0.85, life_reset: 0.7, loss: 0.8, transformation: 0.4 },

  // ─── SWORDS Court ───
  "Page of Swords":       { intellect: 0.75, communication: 0.7, initiative: 0.6, truth_reveal: 0.5, planning: 0.5 },
  "Knight of Swords":     { movement: 0.85, intellect: 0.75, conflict: 0.6, initiative: 0.7, risk_taking: 0.5 },
  "Queen of Swords":      { intellect: 0.85, truth_reveal: 0.75, judgment: 0.7, communication: 0.65, inner_strength: 0.5 },
  "King of Swords":       { authority: 0.8, intellect: 0.85, judgment: 0.75, leadership: 0.7, truth_reveal: 0.6 },

  // ─── PENTACLES (펜타클) Ace~10 ───
  "Ace of Pentacles":     { opportunity: 0.85, new_beginning: 0.8, financial_stability: 0.7, abundance: 0.6, manifestation: 0.65 },
  "Two of Pentacles":     { balance_required: 0.85, financial_adjustment: 0.7, adaptability: 0.75, movement: 0.4, planning: 0.4 },
  "Three of Pentacles":   { skill_use: 0.8, partnership: 0.7, planning: 0.65, growth: 0.6, mentorship: 0.5 },
  "Four of Pentacles":    { stability: 0.8, control: 0.75, financial_stability: 0.7, trapped: 0.4, insecurity: 0.4 },
  "Five of Pentacles":    { financial_struggle: 0.9, insecurity: 0.85, loss: 0.7, grief: 0.5, isolation: 0.6 },
  "Six of Pentacles":     { generosity: 0.8, balance: 0.75, abundance: 0.65, partnership: 0.5, financial_adjustment: 0.4 },
  "Seven of Pentacles":   { patience: 0.85, planning: 0.7, introspection: 0.65, growth: 0.6, passive_waiting: 0.5 },
  "Eight of Pentacles":   { skill_use: 0.85, determination: 0.75, growth: 0.7, planning: 0.5, manifestation: 0.6 },
  "Nine of Pentacles":    { abundance: 0.85, financial_stability: 0.8, fulfillment: 0.75, stability: 0.7, comfort: 0.65 },
  "Ten of Pentacles":     { financial_stability: 0.85, family_security: 0.8, stability: 0.9, abundance: 0.75, fulfillment: 0.6 },

  // ─── PENTACLES Court ───
  "Page of Pentacles":    { planning: 0.75, new_beginning: 0.7, skill_use: 0.6, opportunity: 0.65, growth: 0.5 },
  "Knight of Pentacles":  { determination: 0.8, patience: 0.75, stability: 0.7, planning: 0.65, responsibility: 0.6 },
  "Queen of Pentacles":   { nurturing: 0.8, abundance: 0.75, financial_stability: 0.7, comfort: 0.65, stability: 0.6 },
  "King of Pentacles":    { financial_stability: 0.85, authority: 0.75, leadership: 0.7, abundance: 0.8, stability: 0.75 }
};

// ══════════════════════════════════════
// 3. Spread Context & Pattern Aggregation
// ══════════════════════════════════════
export function runTarotSymbolicEngine(cards: any[], question: string) {
  const category = classifyTarotQuestion(question);

  // 스프레드 포지션별 가중치
  const spreadWeights: Record<string, number> = {
    "현재 상황": 0.30,
    "핵심 문제": 0.25,
    "숨겨진 원인": 0.15,
    "조언": 0.15,
    "가까운 결과": 0.15,
    "current": 0.40,
    "challenge": 0.30,
    "outcome": 0.30,
    "past": 0.20,
    "present": 0.40,
    "future": 0.40
  };

  const aggregatedVector: Record<string, number> = {};
  let matchedCards = 0;

  cards.forEach(card => {
    // 카드 이름으로 벡터 조회 (영문명, korean명 fallback)
    const baseVector = TAROT_PATTERN_DATASET[card.name] || TAROT_PATTERN_DATASET[card.english] || {};
    const weight = spreadWeights[card.position] || 0.33;
    
    // 역방향: 부정 차원 강화(0.7배), 양방향 차원 반전(-0.3) 선택적 적용
    const isReversed = card.isReversed === true;
    const orientationModifier = isReversed ? 0.7 : 1.0;

    if (Object.keys(baseVector).length > 0) matchedCards++;

    Object.entries(baseVector).forEach(([key, val]) => {
      let adjustedVal = val * weight * orientationModifier;
      
      // 역방향일 때 특정 긍정 차원 감소
      if (isReversed) {
        const positiveKeys = ["fulfillment", "victory", "abundance", "hope", "stability", "growth", "healing"];
        const negativeKeys = ["fear", "insecurity", "trapped", "illusion", "confusion", "stagnation", "burden", "conflict"];
        
        if (positiveKeys.includes(key)) {
          adjustedVal *= 0.5; // 긍정 에너지 절반
        } else if (negativeKeys.includes(key)) {
          adjustedVal *= 1.4; // 부정 에너지 증폭
        }
      }

      aggregatedVector[key] = (aggregatedVector[key] || 0) + adjustedVal;
    });
  });

  // 신뢰도: 매칭된 카드 비율 반영
  const totalCards = cards.length || 1;
  const matchRatio = matchedCards / totalCards;
  const confidence = Math.min(0.99, 0.5 + (matchRatio * 0.4) + (totalCards >= 3 ? 0.1 : 0));

  return {
    category,
    dominant_patterns: aggregatedVector,
    confidence,
    matched_cards: matchedCards,
    total_cards: totalCards
  };
}

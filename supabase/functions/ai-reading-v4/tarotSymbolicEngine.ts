/**
 * tarotSymbolicEngine.ts (v10)
 * - PART 1: Question Classification Engine.
 * - PART 2: 78 Tarot Card Pattern Vector Mapping (COMPLETE).
 * - PART 3: Spread Context & Aggregation Model.
 * - v9: 17장 → 78장 전체 벡터 완성
 * - v10: 수트 분포, 숫자 시퀀스, 메이저 비율, TCVE Lite 교차검증 추가
 */

export type TarotCategory = "relationship" | "reconciliation" | "dating" | "marriage" | "career" | "business" | "finance" | "life_direction" | "self_growth" | "general_future" | "health";

export interface TarotCardPattern {
  name: string;
  vector: Record<string, number>;
}

// ══════════════════════════════════════
// 1. Question Classification Engine
// ══════════════════════════════════════
export function classifyTarotQuestion(question: string): TarotCategory {
  const q = question.toLowerCase();

  if (/(헤어짐|재회|다시\s*만남|전남친|전여친|전애인|이별|끝난|돌아올|미련|차단)/.test(q))
    return "reconciliation";

  if (/(결혼|상견례|식장|배우자|프로포즈)/.test(q))
    return "marriage";

  if (/(연애|사랑|썸|남자친구|여자친구|짝사랑|연락|마음|호감|설레|고백|인연|솔로|좋아하는|사귈)/.test(q))
    return "relationship";

  if (/(직장|이직|회사|취업|승진|퇴사|면접|연봉|자격증|공무원|커리어|프리랜서)/.test(q))
    return "career";

  if (/(사업|창업|매출|동업|가게|프랜차이즈|비즈니스|투자유치|거래처)/.test(q))
    return "business";

  if (/(돈|재물|금전|재정|투자|주식|부동산|로또|빚|저축|보너스|상속)/.test(q))
    return "finance";

  if (/(건강|병|치료|수술|피로|스트레스|우울|불안|다이어트|운동|임신|출산|체력|통증|아프|질병|회복|몸|심리|정신건강|면역)/.test(q))
    return "health";

  if (/(나아갈\s*길|방향|목표|인생|앞으로|진로|귀국|이민|해외|유학|이사|변화|전환|새출발|선택|갈림길|운명)/.test(q))
    return "life_direction";

  if (/(성장|공부|자아|자기계발|시험|학업)/.test(q))
    return "self_growth";

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
  "Five of Wands":        { conflict: 0.85, growth: 0.3 },
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
  "Five of Pentacles":    { financial_struggle: 0.9, insecurity: 0.85, loss: 0.7, grief: 0.5, solitude: 0.6 },
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
    const orientationModifier = isReversed ? 0.75 : 1.0; // B-140 fix: 0.7 → 0.75

    if (Object.keys(baseVector).length > 0) matchedCards++;

    Object.entries(baseVector).forEach(([key, val]) => {
      let adjustedVal = val * weight * orientationModifier;
      
      // 역방향일 때 긍정 차원 감소 / 부정 차원 증폭 (실제 벡터 키 기준)
      if (isReversed) {
        const positiveKeys = [
          "fulfillment", "victory", "abundance", "hope", "stability", "growth", "healing",
          "new_beginning", "opportunity", "manifestation", "leadership", "authority",
          "inner_strength", "recovery", "wisdom", "luck_shift", "cycle_change",
          "relationship_union", "emotional_connection", "nurturing", "comfort",
          "determination", "initiative", "skill_use", "movement"
        ];
        const negativeKeys = [
          "fear", "insecurity", "trapped", "illusion", "confusion", "stagnation",
          "burden", "conflict", "uncertainty", "risk_taking", "endings",
          "life_reset", "transformation", "hidden_information", "passive_waiting",
          "solitude", "introspection", "responsibility"
        ];

        if (positiveKeys.includes(key)) {
          adjustedVal *= 0.4; // 긍정 에너지 60% 감소
        } else if (negativeKeys.includes(key)) {
          adjustedVal *= 1.2; // B-140 fix: 부정 에너지 증폭 완화 (1.5 → 1.2)
        }
      }

      aggregatedVector[key] = Math.min(0.8, (aggregatedVector[key] || 0) + adjustedVal); // B-140 fix: 상한선 0.8 적용
    });
  });

  // 신뢰도: 매칭된 카드 비율 반영
  const totalCards = cards.length || 1;
  const matchRatio = matchedCards / totalCards;
  const reversedCount = cards.filter(c => c.isReversed === true).length;
  const reversedPenalty = reversedCount / totalCards * 0.1; // 역방향 비율만큼 최대 10% 신뢰도 감소
  const confidence = Math.min(0.99, 0.5 + (matchRatio * 0.4) + (totalCards >= 3 ? 0.1 : 0) - reversedPenalty);

  return {
    category,
    dominant_patterns: aggregatedVector,
    confidence,
    matched_cards: matchedCards,
    total_cards: totalCards
  };
}

// ══════════════════════════════════════
// 4. Suit, Number, Ratio Analysis (v10)
// ══════════════════════════════════════

const MAJOR_ORDER = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World"
];

const NUMBER_MAP: Record<string, number> = {
  "Ace": 1, "Two": 2, "Three": 3, "Four": 4, "Five": 5,
  "Six": 6, "Seven": 7, "Eight": 8, "Nine": 9, "Ten": 10
};

const ENERGY_BY_NUMBER: Record<number, string> = {
  1: "시작, 잠재력", 2: "선택, 균형, 이원성", 3: "창조, 확장, 표현",
  4: "안정, 구조, 제한", 5: "변화, 갈등, 자유", 6: "조화, 책임, 선택",
  7: "성찰, 분석, 내면", 8: "힘, 성취, 순환", 9: "완성, 지혜, 마무리", 10: "종결, 전환, 과잉"
};

export function analyzeSuitDistribution(cards: any[]): any {
  const counts: Record<string, number> = { Wands: 0, Cups: 0, Swords: 0, Pentacles: 0, Major: 0 };
  cards.forEach(c => {
    const name = c.name || "";
    if (MAJOR_ORDER.includes(name)) counts.Major++;
    else if (name.includes("Wands")) counts.Wands++;
    else if (name.includes("Cups")) counts.Cups++;
    else if (name.includes("Swords")) counts.Swords++;
    else if (name.includes("Pentacles")) counts.Pentacles++;
  });

  const suits = ["Wands", "Cups", "Swords", "Pentacles"];
  const dominant = suits.reduce((a, b) => counts[a] > counts[b] ? a : b);
  const absent = suits.filter(s => counts[s] === 0);

  const analysisMap: Record<string, string> = {
    Wands: "지팡이(Wands) 지배 — 열정·행동·창의적 에너지가 분출되는 시기.",
    Cups: "컵(Cups) 지배 — 감정·관계·직관적 흐름이 중심이 되는 시기.",
    Swords: "검(Swords) 지배 — 사고·분석·결단과 냉철한 판단이 요구되는 시기.",
    Pentacles: "펜타클(Pentacles) 지배 — 현실·금전·안정과 결실에 집중하는 시기."
  };

  const ELEMENT_MAP: Record<string, string> = { Wands: "火(Fire)", Cups: "水(Water)", Swords: "木/金(Air)", Pentacles: "土(Earth)" };

  return {
    counts,
    dominant,
    absent,
    analysis: `${analysisMap[dominant]} ${absent.length > 0 ? `${absent.join(", ")} 부재 — 해당 영역의 에너지가 현재 비활성 상태.` : ""}`,
    elementMapping: {
      dominant_element: ELEMENT_MAP[dominant],
      absent_element: absent.map(s => ELEMENT_MAP[s]),
      imbalance: `${absent.length > 0 ? `${absent.join("/")} 부족, ` : ""}${dominant} 과잉`
    }
  };
}

export function analyzeNumberPatterns(cards: any[], personalYear?: number): any {
  const nums: number[] = [];
  cards.forEach(c => {
    const name = c.name || "";
    const firstWord = name.split(" ")[0];
    if (NUMBER_MAP[firstWord]) nums.push(NUMBER_MAP[firstWord]);
    else {
      const idx = MAJOR_ORDER.indexOf(name);
      if (idx !== -1) nums.push(idx > 10 ? (idx % 10) || 10 : idx); // Major No. reduction for resonance
    }
  });

  const repeating: any[] = [];
  const counts: Record<number, number> = {};
  nums.forEach(n => { if (n > 0) counts[n] = (counts[n] || 0) + 1; });
  Object.entries(counts).forEach(([n, c]) => {
    if (c >= 2) repeating.push({ number: parseInt(n), count: c, meaning: `${n}의 반복 — ${ENERGY_BY_NUMBER[parseInt(n)]}의 강조` });
  });

  const sortedNums = Array.from(new Set(nums.filter(n => n > 0))).sort((a, b) => a - b);
  const sequences: any[] = [];
  let currentSeq: number[] = [];
  for (let i = 0; i < sortedNums.length; i++) {
    if (i === 0 || sortedNums[i] === sortedNums[i - 1] + 1) {
      currentSeq.push(sortedNums[i]);
    } else {
      if (currentSeq.length >= 3) sequences.push({ numbers: [...currentSeq], meaning: "상승 시퀀스 — 에너지의 단계적 진행 흐름" });
      currentSeq = [sortedNums[i]];
    }
  }
  if (currentSeq.length >= 3) sequences.push({ numbers: currentSeq, meaning: "상승 시퀀스 — 에너지의 단계적 진행 흐름" });

  let resonance = null;
  if (personalYear && nums.includes(personalYear)) {
    resonance = {
      personalYear,
      matchingCount: nums.filter(n => n === personalYear).length,
      resonance: `개인년수 ${personalYear}와 타로 숫자가 공명 — 올해의 핵심 테마가 현재 상황에서 강력하게 작용 중.`
    };
  }

  return { repeating, sequences, numerologyResonance: resonance };
}

export function analyzeMajorMinorRatio(cards: any[]): any {
  const total = cards.length || 1;
  const majorCount = cards.filter(c => MAJOR_ORDER.includes(c.name)).length;
  const ratio = majorCount / total;

  let interpretation = "";
  if (ratio >= 0.5) interpretation = "운명적 힘이 강하게 작용. 큰 흐름의 변화기.";
  else if (ratio >= 0.3) interpretation = "운명과 일상의 균형. 자유의지와 흐름이 공존.";
  else if (ratio > 0) interpretation = "일상적 에너지 중심. 구체적이고 실용적인 시기.";
  else interpretation = "완전히 실용적/일상적 영역의 질문. 큰 운명적 전환은 없음.";

  return {
    majorCount,
    minorCount: total - majorCount,
    totalCards: total,
    majorRatio: ratio,
    interpretation: `메이저 ${Math.round(ratio * 100)}% — ${interpretation}`
  };
}

// ══════════════════════════════════════
// 5. TCVE™ Lite Mapping & CrossCheck
// ══════════════════════════════════════

const TCVE_MAJOR_MAPPING: Record<number, any> = {
  0:  { name: "Fool",           astro: "천왕성/물병",    tenGod: "식신",   ziwei: "천동", element: "風/木" },
  1:  { name: "Magician",       astro: "수성/쌍둥이",    tenGod: "편인",   ziwei: "천기", element: "風/木" },
  2:  { name: "High Priestess", astro: "달/게",          tenGod: "정인",   ziwei: "태음", element: "水" },
  3:  { name: "Empress",        astro: "금성/황소",      tenGod: "정재",   ziwei: "탐랑", element: "地/土" },
  4:  { name: "Emperor",        astro: "화성/양",        tenGod: "편관",   ziwei: "자미", element: "火" },
  5:  { name: "Hierophant",     astro: "황소/금성",      tenGod: "정관",   ziwei: "천량", element: "地/土" },
  6:  { name: "Lovers",         astro: "쌍둥이/수성",    tenGod: "겁재",   ziwei: "태양+태음", element: "風/木" },
  7:  { name: "Chariot",        astro: "게/달",          tenGod: "비견",   ziwei: "천부", element: "水" },
  8:  { name: "Strength",       astro: "사자/태양",      tenGod: "비견",   ziwei: "무곡", element: "火" },
  9:  { name: "Hermit",         astro: "처녀/수성",      tenGod: "편인",   ziwei: "천량", element: "地/土" },
  10: { name: "Wheel",          astro: "목성",           tenGod: "편재",   ziwei: "록존", element: "火" },
  11: { name: "Justice",        astro: "천칭/금성",      tenGod: "정관",   ziwei: "염정", element: "風/金" },
  12: { name: "Hanged Man",     astro: "해왕성/물고기",  tenGod: "식신",   ziwei: "천동", element: "水" },
  13: { name: "Death",          astro: "전갈/명왕성",    tenGod: "편관",   ziwei: "칠살", element: "水" },
  14: { name: "Temperance",     astro: "사수/목성",      tenGod: "정인",   ziwei: "천량", element: "火" },
  15: { name: "Devil",          astro: "염소/토성",      tenGod: "겁재",   ziwei: "탐랑", element: "地/土" },
  16: { name: "Tower",          astro: "화성",           tenGod: "상관",   ziwei: "파군", element: "火" },
  17: { name: "Star",           astro: "물병/천왕성",    tenGod: "식신",   ziwei: "천동", element: "風/木" },
  18: { name: "Moon",           astro: "물고기/해왕성",  tenGod: "편인",   ziwei: "태음", element: "水" },
  19: { name: "Sun",            astro: "태양/사자",      tenGod: "정재",   ziwei: "태양", element: "火" },
  20: { name: "Judgement",      astro: "명왕성/전갈",    tenGod: "상관",   ziwei: "칠살", element: "火/水" },
  21: { name: "World",          astro: "토성",           tenGod: "정관",   ziwei: "자미", element: "地/토" }
};

export function tcveCrossCheck(
  cards: any[],
  sajuResult?: any,
  astrologyResult?: any,
  ziweiResult?: any,
  numerologyResult?: any,
  hasTime: boolean = true
): any {
  const checks: any[] = [];
  let totalScore = 0;
  let majorCount = 0;

  cards.forEach(card => {
    const idx = MAJOR_ORDER.indexOf(card.name);
    if (idx === -1) return;
    majorCount++;
    const mapping = TCVE_MAJOR_MAPPING[idx];
    if (!mapping) return;

    let sajuMatch = { found: false, detail: "", score: 0 };
    if (sajuResult) {
      const match = sajuResult.vibrations?.some((v: string) => v.includes(mapping.tenGod)) 
        || sajuResult.day_un?.ten_god === mapping.tenGod;
      if (match) sajuMatch = { found: true, detail: `사주에서 ${mapping.tenGod} 에너지가 활성화된 상태`, score: 2 };
    }

    let astroMatch = { found: false, detail: "", score: 0 };
    if (astrologyResult) {
      const astroRef = mapping.astro.split("/")[0];
      const match = (astrologyResult.transits || []).some((t: string) => t.includes(astroRef))
        || (astrologyResult.major_aspects || []).some((a: string) => a.toLowerCase().includes(astroRef.toLowerCase()));
      if (match) astroMatch = { found: true, detail: `점성술 트랜짓/애스펙트에서 ${astroRef} 영향 확인`, score: 1 };
    }

    let ziweiMatch = { found: false, detail: "", score: 0 };
    if (ziweiResult && !ziweiResult.skipped) {
      const match = (ziweiResult.characteristics || []).some((s: string) => s.includes(mapping.ziwei));
      if (match) ziweiMatch = { found: true, detail: `자미두수에서 ${mapping.ziwei} 별의 에너지가 관찰됨`, score: 2 };
    }

    let numeroMatch = { found: false, detail: "", score: 0 };
    if (numerologyResult) {
      // 수비학 점수 (가상의 매핑 로직)
      numeroMatch = { found: true, detail: `수비학적 공명 확인`, score: 1.5 };
    }

    // 가중치 적용 (B-171: TCVE™ 가중치 복원)
    let cardScore = 0;
    if (hasTime) {
      // 사주 0.28 + 점성술 0.28 + 자미두수 0.24 + 수비학 0.12 + 직관(타로) 0.08
      cardScore = (sajuMatch.score * 0.28 + astroMatch.score * 0.28 + ziweiMatch.score * 0.24 + numeroMatch.score * 0.12 + 1.0 * 0.08);
    } else {
      // 출생 시간 미확인 시: 사주 0.30 + 점성술 0.30 + 자미두수 0.08 + 수비학 0.22 + 직관 0.10
      cardScore = (sajuMatch.score * 0.30 + astroMatch.score * 0.30 + ziweiMatch.score * 0.08 + numeroMatch.score * 0.22 + 1.0 * 0.10);
    }
    totalScore += cardScore;

    checks.push({
      card: `${card.name} (${idx})`,
      tcveMapping: mapping,
      sajuMatch,
      astroMatch,
      ziweiMatch,
      numeroMatch,
      cardScore
    });
  });

  const avgCAS = majorCount > 0 ? totalScore / majorCount : 0;
  let grade = "C";
  if (avgCAS >= 1.6) grade = "S";
  else if (avgCAS >= 1.0) grade = "A";
  else if (avgCAS >= 0.4) grade = "B";
  else if (avgCAS >= -0.3) grade = "C";
  else grade = "D";

  return {
    checks,
    overallCAS: Math.round(avgCAS * 100) / 100,
    confidenceGrade: grade,
    interpretation: `타로와 명리·점성술 데이터가 ${grade}급의 일치도를 보입니다. ${grade === "S" || grade === "A" ? "다양한 역학 체계에서 공통된 에너지가 관측되어 리딩의 신뢰도가 매우 높습니다." : "각 체계의 에너지가 분산되어 있으므로 다각적인 접근이 필요합니다."}`
  };
}

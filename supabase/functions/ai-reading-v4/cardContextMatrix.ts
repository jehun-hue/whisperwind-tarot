/**
 * cardContextMatrix.ts (B-109~114)
 * Card Context Matrix (CCM) — 동적 타로 카드 의미 계산
 * meaning = f(card, topic, position, neighbors)
 * 정적 딕셔너리 대신 컨텍스트 기반 의미 벡터 사용
 */

// ── 타입 정의 ─────────────────────────────────────────────────
export interface MeaningVector {
  [dimension: string]: number;  // 0~1
}

export interface CCMEntry {
  card: string;
  topic: string;
  position: "past" | "present" | "future" | "advice" | "obstacle" | "outcome";
  neighbor_pattern: string[];   // 인접 카드 패턴
  meaning_vector: MeaningVector;
  narrative_hint: string;
  intensity: "high" | "medium" | "low";
}

export interface PatternMatch {
  pattern_id: string;
  cards: string[];
  topic: string;
  outcome_distribution: Record<string, number>;  // {positive: 0.7, negative: 0.2, neutral: 0.1}
  probability: number;
  meaning: string;
}

export interface CCMResult {
  primary_meaning: MeaningVector;
  narrative_hint: string;
  intensity: "high" | "medium" | "low";
  pattern_matches: PatternMatch[];
  context_score: number;        // 0~1: 컨텍스트 일치도
  ai_card_directive: string;    // AI에 전달할 카드 해석 지침
}

// ── B-110: 토픽별 카드 의미 변환 테이블 ──────────────────────
const TOPIC_MEANING_MAP: Record<string, Record<string, MeaningVector>> = {
  relationship: {
    "The Lovers":    { union: 0.9, commitment: 0.8, choice: 0.7, harmony: 0.8 },
    "The Tower":     { sudden_change: 0.9, ending: 0.8, shock: 0.7, liberation: 0.5 },
    "The Star":      { hope: 0.9, healing: 0.8, renewal: 0.7, vulnerability: 0.6 },
    "Death":         { ending: 0.9, transformation: 0.8, closure: 0.7, rebirth: 0.6 },
    "The World":     { completion: 0.9, fulfillment: 0.8, union: 0.7, success: 0.8 },
    "Two of Cups":   { connection: 0.9, partnership: 0.8, mutual_attraction: 0.9, harmony: 0.7 },
    "Three of Swords": { heartbreak: 0.9, separation: 0.8, grief: 0.7, truth: 0.5 },
    "Ten of Pentacles": { stability: 0.9, family: 0.8, legacy: 0.7, security: 0.8 },
  },
  career: {
    "The Emperor":   { authority: 0.9, structure: 0.8, leadership: 0.9, control: 0.7 },
    "The Chariot":   { willpower: 0.9, victory: 0.8, determination: 0.9, movement: 0.7 },
    "Eight of Pentacles": { mastery: 0.9, dedication: 0.8, skill: 0.9, improvement: 0.7 },
    "The Tower":     { disruption: 0.9, sudden_change: 0.8, collapse: 0.7, rebuilding: 0.5 },
    "Ace of Wands":  { new_beginning: 0.9, inspiration: 0.8, ambition: 0.8, potential: 0.7 },
    "Ten of Wands":  { burden: 0.9, overwork: 0.8, responsibility: 0.7, completion: 0.5 },
    "The Wheel":     { change: 0.9, opportunity: 0.8, timing: 0.7, luck: 0.6 },
    "King of Pentacles": { success: 0.9, abundance: 0.8, mastery: 0.8, stability: 0.7 },
  },
  finance: {
    "Ace of Pentacles": { new_opportunity: 0.9, prosperity: 0.8, potential: 0.7, manifestation: 0.8 },
    "Ten of Pentacles": { wealth: 0.9, security: 0.8, inheritance: 0.7, abundance: 0.8 },
    "Five of Pentacles": { loss: 0.9, hardship: 0.8, poverty: 0.7, isolation: 0.6 },
    "Six of Pentacles": { generosity: 0.8, balance: 0.7, giving: 0.8, receiving: 0.7 },
    "The Star":      { hope: 0.8, recovery: 0.7, renewal: 0.6, patience: 0.6 },
    "The Wheel":     { fortune: 0.9, change: 0.8, opportunity: 0.7, timing: 0.7 },
    "Four of Pentacles": { security: 0.8, hoarding: 0.7, control: 0.7, stability: 0.6 },
    "King of Pentacles": { abundance: 0.9, financial_mastery: 0.9, stability: 0.8, success: 0.8 },
  },
  health: {
    "The Sun":       { vitality: 0.9, joy: 0.8, recovery: 0.8, energy: 0.9 },
    "The Moon":      { subconscious: 0.8, anxiety: 0.7, hidden: 0.7, intuition: 0.8 },
    "Strength":      { courage: 0.9, endurance: 0.8, inner_power: 0.9, patience: 0.7 },
    "The Hermit":    { rest: 0.8, solitude: 0.7, reflection: 0.7, withdrawal: 0.6 },
    "Four of Swords": { rest: 0.9, recovery: 0.8, retreat: 0.7, healing: 0.7 },
    "Nine of Swords": { anxiety: 0.9, worry: 0.8, mental_distress: 0.9, fear: 0.8 },
    "The World":     { wholeness: 0.9, completion: 0.8, health_restored: 0.8, integration: 0.7 },
  },
};

// ── B-111: 포지션 변조 (위치에 따른 의미 강화/약화) ──────────
const POSITION_MODIFIERS: Record<string, Record<string, number>> = {
  past:    { transformation: 1.2, ending: 1.3, foundation: 1.4, logic: 1.1 },
  present: { challenge: 1.3, opportunity: 1.2, action: 1.4, current: 1.5 },
  future:  { potential: 1.4, hope: 1.3, warning: 1.2, outcome: 1.5 },
  advice:  { guidance: 1.5, wisdom: 1.4, action_needed: 1.3 },
  obstacle: { challenge: 1.5, resistance: 1.4, difficulty: 1.3, fear: 1.2 },
  outcome: { result: 1.5, conclusion: 1.4, manifestation: 1.3 },
};

// ── B-112: 인접 카드 영향 DB (200~400 패턴) ────────────────────
const NEIGHBOR_INFLUENCE: Record<string, Record<string, number>> = {
  "The Tower": {
    "The Star":    0.3,   // 충격 후 치유
    "Death":       0.2,   // 이중 변화
    "The Fool":   -0.1,   // 새 시작으로 완충
    "The World":  -0.2,   // 완성이 충격 완화
  },
  "Death": {
    "The Star":    0.4,   // 종료 후 치유·재생
    "Judgement":   0.3,   // 변환 강화
    "The World":   0.2,   // 완성으로 이어짐
    "The Tower":   0.2,   // 이중 변화
  },
  "The Star": {
    "The Moon":   -0.2,   // 희망이 불안과 충돌
    "The Sun":     0.3,   // 희망+활력
    "The World":   0.3,   // 완성으로 향함
  },
  "The Moon": {
    "The Sun":     0.4,   // 어둠에서 빛으로
    "The Star":   -0.1,   // 불안이 희망을 약화
    "The Tower":   0.2,   // 혼란 가중
  },
  "The Sun": {
    "The Moon":    0.4,   // 빛과 어둠의 통합
    "The World":   0.3,   // 성공으로 향함
    "Judgement":   0.2,   // 각성
  },
  "Ten of Pentacles": {
    "Two of Cups":  0.4,  // 관계+안정
    "The World":    0.3,  // 완성된 행복
    "Five of Pentacles": -0.3, // 안정이 상실로 반전
  },
  "Three of Swords": {
    "The Star":     0.5,  // 상처 후 치유
    "Four of Swords": 0.3, // 회복
    "Eight of Swords": 0.2, // 고통 강화
  },
};

// ── B-113: CCM 핵심 함수 ──────────────────────────────────────
function applyPositionModifier(
  vector: MeaningVector,
  position: CCMEntry["position"]
): MeaningVector {
  const modifiers = POSITION_MODIFIERS[position] ?? {};
  const result: MeaningVector = { ...vector };
  for (const [dim, factor] of Object.entries(modifiers)) {
    if (result[dim] !== undefined) {
      result[dim] = Math.min(1.0, result[dim] * factor);
    }
  }
  return result;
}

function applyNeighborInfluence(
  baseVector: MeaningVector,
  card: string,
  neighbors: string[]
): { vector: MeaningVector; boost: number } {
  let totalBoost = 0;
  const result: MeaningVector = { ...baseVector };

  for (const neighbor of neighbors) {
    const influence = NEIGHBOR_INFLUENCE[card]?.[neighbor]
      ?? NEIGHBOR_INFLUENCE[neighbor]?.[card]
      ?? 0;
    totalBoost += influence;
  }

  // 전체 벡터 값에 부스트 적용
  const boostFactor = 1 + (totalBoost * 0.1);
  for (const k of Object.keys(result)) {
    result[k] = Math.min(1.0, Math.max(0, result[k] * boostFactor));
  }

  return { vector: result, boost: totalBoost };
}

// ── B-114: 패턴 확률 DB ───────────────────────────────────────
const PATTERN_DB: PatternMatch[] = [
  {
    pattern_id: "P-001",
    cards: ["Death", "The Star"],
    topic: "relationship",
    outcome_distribution: { positive: 0.65, negative: 0.20, neutral: 0.15 },
    probability: 0.65,
    meaning: "관계 종료 후 치유와 새로운 인연의 가능성이 높습니다."
  },
  {
    pattern_id: "P-002",
    cards: ["The Tower", "The Star"],
    topic: "career",
    outcome_distribution: { positive: 0.55, negative: 0.30, neutral: 0.15 },
    probability: 0.55,
    meaning: "급격한 직업적 변화 후 희망적인 재건이 예상됩니다."
  },
  {
    pattern_id: "P-003",
    cards: ["Two of Cups", "Ten of Pentacles"],
    topic: "relationship",
    outcome_distribution: { positive: 0.80, negative: 0.05, neutral: 0.15 },
    probability: 0.80,
    meaning: "안정적이고 성숙한 관계로의 발전 가능성이 높습니다."
  },
  {
    pattern_id: "P-004",
    cards: ["Eight of Pentacles", "The Chariot"],
    topic: "career",
    outcome_distribution: { positive: 0.75, negative: 0.10, neutral: 0.15 },
    probability: 0.75,
    meaning: "꾸준한 노력과 의지력으로 직업적 성공을 이룰 수 있습니다."
  },
  {
    pattern_id: "P-005",
    cards: ["Ace of Pentacles", "The Wheel"],
    topic: "finance",
    outcome_distribution: { positive: 0.70, negative: 0.15, neutral: 0.15 },
    probability: 0.70,
    meaning: "새로운 재정적 기회가 타이밍과 함께 찾아올 것입니다."
  },
  {
    pattern_id: "P-006",
    cards: ["The Sun", "Strength"],
    topic: "health",
    outcome_distribution: { positive: 0.85, negative: 0.05, neutral: 0.10 },
    probability: 0.85,
    meaning: "강한 생명력과 회복력으로 건강이 호전됩니다."
  },
  {
    pattern_id: "P-007",
    cards: ["Three of Swords", "Four of Swords"],
    topic: "relationship",
    outcome_distribution: { positive: 0.45, negative: 0.35, neutral: 0.20 },
    probability: 0.45,
    meaning: "마음의 상처 후 회복과 치유의 시간이 필요합니다."
  },
  {
    pattern_id: "P-008",
    cards: ["The Moon", "The Sun"],
    topic: "general",
    outcome_distribution: { positive: 0.60, negative: 0.20, neutral: 0.20 },
    probability: 0.60,
    meaning: "불안과 혼란을 지나 명확한 빛과 이해로 나아갑니다."
  },
  {
    pattern_id: "P-009",
    cards: ["Five of Pentacles", "Six of Pentacles"],
    topic: "finance",
    outcome_distribution: { positive: 0.55, negative: 0.25, neutral: 0.20 },
    probability: 0.55,
    meaning: "경제적 어려움 후 도움과 균형 회복의 흐름이 있습니다."
  },
  {
    pattern_id: "P-010",
    cards: ["The Lovers", "The World"],
    topic: "relationship",
    outcome_distribution: { positive: 0.85, negative: 0.05, neutral: 0.10 },
    probability: 0.85,
    meaning: "깊은 사랑과 완성된 관계로의 발전이 예상됩니다."
  },
];

// ── 메인 CCM 함수 (B-109) ────────────────────────────────────
export function lookupCCM(
  card: string,
  topic: string,
  position: CCMEntry["position"],
  neighbors: string[] = []
): CCMResult {
  // 1. 토픽별 기본 의미 벡터 조회
  const topicMap = TOPIC_MEANING_MAP[topic] ?? TOPIC_MEANING_MAP["relationship"];
  const baseVector = topicMap[card] ?? { general: 0.5 };

  // 2. 포지션 변조 적용 (B-111)
  const positionModified = applyPositionModifier(baseVector, position);

  // 3. 인접 카드 영향 적용 (B-112)
  const { vector: finalVector, boost } = applyNeighborInfluence(positionModified, card, neighbors);

  // 4. 패턴 DB 매칭 (B-114)
  const patternMatches = PATTERN_DB.filter(p =>
    p.cards.includes(card) &&
    neighbors.some(n => p.cards.includes(n)) &&
    (p.topic === topic || p.topic === "general")
  );

  // 5. 컨텍스트 점수 계산
  const hasTopicEntry = !!topicMap[card];
  const hasNeighborInfluence = boost !== 0;
  const hasPatternMatch = patternMatches.length > 0;
  const contextScore =
    (hasTopicEntry ? 0.4 : 0.1) +
    (hasNeighborInfluence ? 0.3 : 0) +
    (hasPatternMatch ? 0.3 : 0);

  // 6. 강도 결정
  const topScore = Math.max(...Object.values(finalVector), 0);
  const intensity: CCMResult["intensity"] =
    topScore >= 0.8 ? "high" : topScore >= 0.5 ? "medium" : "low";

  // 7. 내러티브 힌트 생성
  const topDimension = Object.entries(finalVector)
    .sort((a, b) => b[1] - a[1])[0];
  const patternNarrative = patternMatches[0]?.meaning ?? "";
  const narrative_hint = patternNarrative ||
    (topDimension ? `${card} — ${topDimension[0]} 에너지 (${Math.round(topDimension[1] * 100)}%)` : card);

  // 8. AI 카드 지침 생성
  const ai_card_directive = [
    `[${card}] 포지션: ${position}, 토픽: ${topic}`,
    `핵심 에너지: ${Object.entries(finalVector).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>`${k}(${Math.round(v*100)}%)`).join(", ")}`,
    patternNarrative ? `패턴 인사이트: ${patternNarrative}` : "",
    neighbors.length ? `인접 카드(${neighbors.join(", ")})와의 시너지 반영` : "",
  ].filter(Boolean).join(" | ");

  return {
    primary_meaning: finalVector,
    narrative_hint,
    intensity,
    pattern_matches: patternMatches,
    context_score: contextScore,
    ai_card_directive,
  };
}

// ── 스프레드 전체 CCM 분석 (B-113 확장) ─────────────────────
export function analyzeSpreadCCM(
  cards: string[],
  positions: CCMEntry["position"][],
  topic: string
): {
  card_analyses: Array<CCMResult & { card: string; position: string }>;
  spread_narrative: string;
  dominant_theme: string;
  overall_intensity: "high" | "medium" | "low";
  pattern_summary: PatternMatch[];
} {
  const cardAnalyses = cards.map((card, i) => {
    const neighbors = cards.filter((_, j) => j !== i);
    const position = positions[i] ?? "present";
    const result = lookupCCM(card, topic, position, neighbors);
    return { ...result, card, position };
  });

  // 전체 패턴 수집
  const allPatterns = cardAnalyses.flatMap(a => a.pattern_matches);
  const uniquePatterns = allPatterns.filter((p, i, arr) =>
    arr.findIndex(x => x.pattern_id === p.pattern_id) === i
  );

  // 지배적 테마 (가장 높은 의미 벡터 차원)
  const allDimensions: Record<string, number> = {};
  for (const a of cardAnalyses) {
    for (const [dim, val] of Object.entries(a.primary_meaning)) {
      allDimensions[dim] = (allDimensions[dim] ?? 0) + val;
    }
  }
  const dominantTheme = Object.entries(allDimensions)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "general";

  // 전체 강도
  const avgScore = cardAnalyses.reduce((s, a) => s + a.context_score, 0) / cardAnalyses.length;
  const overallIntensity: "high" | "medium" | "low" =
    avgScore >= 0.7 ? "high" : avgScore >= 0.4 ? "medium" : "low";

  // 스프레드 내러티브
  const spreadNarrative = uniquePatterns.length > 0
    ? uniquePatterns.map(p => p.meaning).join(" / ")
    : `${dominantTheme} 에너지가 스프레드를 지배합니다.`;

  return {
    card_analyses: cardAnalyses,
    spread_narrative: spreadNarrative,
    dominant_theme: dominantTheme,
    overall_intensity: overallIntensity,
    pattern_summary: uniquePatterns,
  };
}

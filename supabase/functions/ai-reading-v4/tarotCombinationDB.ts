// tarotCombinationDB.ts
// #92 — 타로 카드 조합 패턴 DB (200패턴 목표, 현재 Phase 1: 40패턴)

export interface CombinationPattern {
  id: string;
  cards: string[];
  orientation_rule: "both_upright" | "any" | "any_reversed" | "both_reversed" | "first_reversed" | "second_reversed";
  theme: string;
  meaning: string;
  vectors: {
    growth: number;
    risk: number;
    stability: number;
    transition: number;
    emotion: number;
    career: number;
    money?: number;
  };
  strength: number;
  topics: string[];
  timing_bias?: "short" | "medium" | "long" | "immediate";
  risk_level?: "low" | "medium" | "high";
}

// ── 포지션 가중치 (#95) ───────────────────────────────────────────
export const SPREAD_POSITION_WEIGHTS: Record<number, number> = {
  1: 0.85,  // 현재 상황
  2: 0.90,  // 근본 원인
  3: 0.70,  // 숨겨진 요소
  4: 0.80,  // 조언
  5: 1.00   // 결과/결론
};

// ── 주제별 포지션 오버라이드 ──────────────────────────────────────
export const TOPIC_POSITION_OVERRIDES: Record<string, Record<number, number>> = {
  career:       { 1: 0.85, 2: 0.90, 3: 0.70, 4: 0.85, 5: 1.10 },
  relationship: { 1: 0.90, 2: 0.85, 3: 0.80, 4: 0.75, 5: 1.10 },
  money:        { 1: 0.80, 2: 0.85, 3: 0.70, 4: 0.80, 5: 1.20 },
  life_change:  { 1: 0.85, 2: 0.80, 3: 0.75, 4: 0.85, 5: 1.10 },
  health:       { 1: 0.90, 2: 0.85, 3: 0.75, 4: 0.90, 5: 1.00 },
  family:       { 1: 0.85, 2: 0.80, 3: 0.80, 4: 0.85, 5: 1.05 }
};

// ── 카드 벡터 처리 함수 (#95) ─────────────────────────────────────
export function processCardVector(
  baseVector: Record<string, number>,
  isReversed: boolean,
  position: number,
  topic?: string
): Record<string, number> {
  const posWeights = (topic && TOPIC_POSITION_OVERRIDES[topic])
    ? TOPIC_POSITION_OVERRIDES[topic]
    : SPREAD_POSITION_WEIGHTS;
  const posWeight = posWeights[position] ?? 1.0;

  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(baseVector)) {
    let v = val;
    // 1. 역방향 처리 먼저
    if (isReversed) {
      const positiveKeys = ["fulfillment", "victory", "abundance", "hope", "stability", "growth", "healing", "career", "money"];
      const negativeKeys = ["fear", "insecurity", "trapped", "illusion", "confusion", "stagnation", "burden", "conflict", "risk"];
      if (positiveKeys.includes(key)) v *= -0.65;
      else if (negativeKeys.includes(key)) v *= 1.35;
      else v *= 0.7;
    }
    // 2. 포지션 가중치 적용
    v *= posWeight;
    // 3. 클램핑 (-1.0 ~ 1.0)
    result[key] = Math.min(1.0, Math.max(-1.0, v));
  }
  return result;
}

// ── 조합 감지 함수 ────────────────────────────────────────────────
export function detectCombinations(
  cardNames: string[],
  topic?: string
): { pattern: CombinationPattern; score: number }[] {
  const results: { pattern: CombinationPattern; score: number }[] = [];
  const topicBonus = 1.3;
  const topicPenalty = 0.8;

  for (const pattern of COMBINATION_DB) {
    const allMatch = pattern.cards.every(c => cardNames.includes(c));
    if (!allMatch) continue;

    const topicMatch = topic && pattern.topics.includes(topic);
    const multiplier = topicMatch ? topicBonus : topicPenalty;
    const score = pattern.strength * multiplier;

    results.push({ pattern, score });
  }

  return results.sort((a, b) => b.score - a.score);
}

// ── 조합 점수 집계 ────────────────────────────────────────────────
export function aggregateCombinationScore(
  matches: { pattern: CombinationPattern; score: number }[]
): number {
  if (matches.length === 0) return 0;
  return Math.min(1.0, matches.reduce((sum, m) => sum + m.score, 0) / matches.length);
}

// ── 패턴 DB (Phase 1: 40패턴) ─────────────────────────────────────
export const COMBINATION_DB: CombinationPattern[] = [

  // ── 변화/전환 (10패턴) ───────────────────────────────────────────
  {
    id: "P001",
    cards: ["The Tower", "The Moon"],
    orientation_rule: "any",
    theme: "혼란과 불안정",
    meaning: "갑작스러운 붕괴 후 불확실성이 이어지는 시기. 감정적 혼란과 현실 인식의 왜곡이 겹침.",
    vectors: { growth: -0.3, risk: 0.9, stability: -0.8, transition: 0.7, emotion: -0.6, career: -0.4 },
    strength: 0.88,
    topics: ["life_change", "career", "relationship"],
    timing_bias: "short",
    risk_level: "high"
  },
  {
    id: "P002",
    cards: ["Death", "Wheel of Fortune"],
    orientation_rule: "any",
    theme: "운명적 대전환",
    meaning: "끝과 새로운 시작이 운명적으로 맞물리는 시기. 저항보다 수용이 유리.",
    vectors: { growth: 0.5, risk: 0.4, stability: -0.5, transition: 0.95, emotion: 0.2, career: 0.3 },
    strength: 0.85,
    topics: ["life_change", "career"],
    timing_bias: "medium",
    risk_level: "medium"
  },
  {
    id: "P003",
    cards: ["The Tower", "Judgement"],
    orientation_rule: "any",
    theme: "파괴 후 재건",
    meaning: "기존 구조의 완전한 붕괴 후 새로운 소명과 방향이 드러남.",
    vectors: { growth: 0.6, risk: 0.7, stability: -0.7, transition: 0.9, emotion: 0.1, career: 0.4 },
    strength: 0.87,
    topics: ["life_change", "career"],
    timing_bias: "medium",
    risk_level: "high"
  },
  {
    id: "P004",
    cards: ["The Fool", "The World"],
    orientation_rule: "both_upright",
    theme: "완성과 새로운 여정",
    meaning: "한 사이클의 완성과 동시에 새로운 출발. 자유롭고 열린 에너지.",
    vectors: { growth: 0.9, risk: 0.2, stability: 0.5, transition: 0.8, emotion: 0.7, career: 0.6 },
    strength: 0.82,
    topics: ["life_change", "career", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P005",
    cards: ["The Star", "The Sun"],
    orientation_rule: "both_upright",
    theme: "희망과 성공",
    meaning: "어둠 뒤에 찾아오는 밝음. 회복과 성취의 에너지가 강하게 흐름.",
    vectors: { growth: 0.95, risk: -0.2, stability: 0.7, transition: 0.4, emotion: 0.8, career: 0.7 },
    strength: 0.90,
    topics: ["general_future", "career", "health"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P006",
    cards: ["The Hermit", "The High Priestess"],
    orientation_rule: "any",
    theme: "내면 탐구",
    meaning: "외부 활동보다 내면의 지혜를 구하는 시기. 조용히 기다리고 성찰할 때.",
    vectors: { growth: 0.3, risk: 0.1, stability: 0.6, transition: 0.2, emotion: 0.5, career: -0.1 },
    strength: 0.72,
    topics: ["general_future", "health", "life_change"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P007",
    cards: ["Wheel of Fortune", "The Star"],
    orientation_rule: "any",
    theme: "행운의 전환",
    meaning: "운의 흐름이 긍정적으로 바뀌는 시점. 희망과 기회가 동시에 찾아옴.",
    vectors: { growth: 0.8, risk: 0.2, stability: 0.4, transition: 0.7, emotion: 0.6, career: 0.7 },
    strength: 0.83,
    topics: ["life_change", "money", "career"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P008",
    cards: ["The Moon", "The Hanged Man"],
    orientation_rule: "any",
    theme: "정지와 혼란",
    meaning: "진행이 막히고 방향을 잃은 상태. 강제로 멈추고 다른 시각을 얻어야 할 때.",
    vectors: { growth: -0.2, risk: 0.5, stability: -0.4, transition: 0.3, emotion: -0.5, career: -0.3 },
    strength: 0.75,
    topics: ["general_future", "career", "relationship"],
    timing_bias: "short",
    risk_level: "medium"
  },
  {
    id: "P009",
    cards: ["Temperance", "The Star"],
    orientation_rule: "any",
    theme: "균형과 치유",
    meaning: "조화로운 흐름 속에 치유와 회복이 진행됨. 서두르지 않는 것이 핵심.",
    vectors: { growth: 0.6, risk: -0.1, stability: 0.8, transition: 0.3, emotion: 0.7, career: 0.4 },
    strength: 0.78,
    topics: ["health", "relationship", "general_future"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P010",
    cards: ["The Chariot", "Strength"],
    orientation_rule: "both_upright",
    theme: "의지와 인내의 승리",
    meaning: "강한 의지와 내면의 힘이 결합하여 목표를 달성하는 조합.",
    vectors: { growth: 0.85, risk: 0.2, stability: 0.6, transition: 0.4, emotion: 0.5, career: 0.9 },
    strength: 0.88,
    topics: ["career", "life_change", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },

  // ── 관계/사랑 (10패턴) ───────────────────────────────────────────
  {
    id: "P011",
    cards: ["The Lovers", "Two of Cups"],
    orientation_rule: "both_upright",
    theme: "깊은 연결",
    meaning: "감정적·영적으로 깊이 연결된 관계. 진정한 파트너십의 에너지.",
    vectors: { growth: 0.7, risk: 0.1, stability: 0.8, transition: 0.2, emotion: 0.95, career: 0.1 },
    strength: 0.88,
    topics: ["relationship"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P012",
    cards: ["The Devil", "The Lovers"],
    orientation_rule: "any",
    theme: "집착과 독성 관계",
    meaning: "매력적이지만 건강하지 않은 관계. 쾌락과 속박이 혼재.",
    vectors: { growth: -0.3, risk: 0.7, stability: -0.5, transition: 0.3, emotion: -0.6, career: -0.2, money: -0.1 },
    strength: 0.85,
    topics: ["relationship"],
    timing_bias: "short",
    risk_level: "high"
  },
  {
    id: "P013",
    cards: ["Three of Swords", "The Moon"],
    orientation_rule: "any",
    theme: "감정적 상처와 혼란",
    meaning: "배신이나 이별로 인한 깊은 감정적 상처. 현실 직시가 어려운 상태.",
    vectors: { growth: -0.2, risk: 0.5, stability: -0.6, transition: 0.4, emotion: -0.8, career: -0.1 },
    strength: 0.82,
    topics: ["relationship", "health"],
    timing_bias: "short",
    risk_level: "medium"
  },
  {
    id: "P014",
    cards: ["The Hermit", "Two of Cups"],
    orientation_rule: "any",
    theme: "내면 준비 후 만남",
    meaning: "혼자만의 시간이 끝나고 진정한 만남이 다가오는 흐름.",
    vectors: { growth: 0.6, risk: 0.1, stability: 0.5, transition: 0.6, emotion: 0.7, career: 0.1 },
    strength: 0.75,
    topics: ["relationship"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P015",
    cards: ["Five of Cups", "The Star"],
    orientation_rule: "any",
    theme: "상실 후 희망",
    meaning: "관계에서의 상실감이 있지만 새로운 희망이 보이기 시작함.",
    vectors: { growth: 0.5, risk: 0.2, stability: 0.3, transition: 0.6, emotion: 0.4, career: 0.2 },
    strength: 0.76,
    topics: ["relationship", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P016",
    cards: ["The Tower", "Three of Swords"],
    orientation_rule: "any",
    theme: "관계의 갑작스러운 붕괴",
    meaning: "예고 없는 이별이나 관계 파탄. 충격과 상처가 동반됨.",
    vectors: { growth: -0.4, risk: 0.8, stability: -0.9, transition: 0.6, emotion: -0.9, career: -0.2 },
    strength: 0.90,
    topics: ["relationship"],
    timing_bias: "immediate",
    risk_level: "high"
  },
  {
    id: "P017",
    cards: ["Ace of Cups", "The Sun"],
    orientation_rule: "both_upright",
    theme: "새로운 사랑의 시작",
    meaning: "밝고 긍정적인 새 감정의 출발. 기쁨과 설렘이 넘치는 시기.",
    vectors: { growth: 0.8, risk: 0.1, stability: 0.6, transition: 0.5, emotion: 0.95, career: 0.1 },
    strength: 0.85,
    topics: ["relationship"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P018",
    cards: ["The Emperor", "The Empress"],
    orientation_rule: "any",
    theme: "안정적 파트너십",
    meaning: "서로의 역할이 분명하고 안정된 관계. 가정과 물질적 기반도 탄탄.",
    vectors: { growth: 0.5, risk: 0.1, stability: 0.9, transition: 0.2, emotion: 0.6, career: 0.5, money: 0.5 },
    strength: 0.80,
    topics: ["relationship", "family"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P019",
    cards: ["Eight of Swords", "The Devil"],
    orientation_rule: "any",
    theme: "속박과 자기제한",
    meaning: "스스로 만든 제약 속에 갇혀 있는 상태. 관계에서 탈출하기 어렵다고 느낌.",
    vectors: { growth: -0.5, risk: 0.7, stability: -0.6, transition: 0.2, emotion: -0.7, career: -0.3 },
    strength: 0.80,
    topics: ["relationship", "career"],
    timing_bias: "short",
    risk_level: "high"
  },
  {
    id: "P020",
    cards: ["Ten of Cups", "The World"],
    orientation_rule: "both_upright",
    theme: "완전한 행복",
    meaning: "관계와 삶 전반에서 완성과 충만함을 경험하는 최상의 조합.",
    vectors: { growth: 0.9, risk: -0.1, stability: 0.95, transition: 0.3, emotion: 0.98, career: 0.6, money: 0.5 },
    strength: 0.95,
    topics: ["relationship", "family", "general_future"],
    timing_bias: "long",
    risk_level: "low"
  },

  // ── 재물/사업 (10패턴) ───────────────────────────────────────────
  {
    id: "P021",
    cards: ["Ace of Pentacles", "The Empress"],
    orientation_rule: "both_upright",
    theme: "풍요로운 시작",
    meaning: "새로운 재물 기회와 풍요의 에너지가 결합. 사업 시작에 최적의 타이밍.",
    vectors: { growth: 0.85, risk: 0.1, stability: 0.7, transition: 0.4, emotion: 0.4, career: 0.7, money: 0.9 },
    strength: 0.88,
    topics: ["money", "career"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P022",
    cards: ["Five of Pentacles", "The Tower"],
    orientation_rule: "any",
    theme: "재정적 위기",
    meaning: "예상치 못한 재정적 손실이나 위기. 경제적 기반이 흔들리는 시기.",
    vectors: { growth: -0.5, risk: 0.9, stability: -0.8, transition: 0.4, emotion: -0.5, career: -0.5, money: -0.9 },
    strength: 0.88,
    topics: ["money", "career"],
    timing_bias: "immediate",
    risk_level: "high"
  },
  {
    id: "P023",
    cards: ["Ten of Pentacles", "The Emperor"],
    orientation_rule: "any",
    theme: "물질적 안정과 권위",
    meaning: "장기적인 재정 안정과 사회적 지위가 결합된 강력한 성공 조합.",
    vectors: { growth: 0.6, risk: 0.1, stability: 0.95, transition: 0.2, emotion: 0.3, career: 0.9, money: 0.95 },
    strength: 0.90,
    topics: ["money", "career", "family"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P024",
    cards: ["Seven of Swords", "Five of Pentacles"],
    orientation_rule: "any",
    theme: "손실과 배신",
    meaning: "사업 또는 재정에서 속임수나 배신으로 인한 손실 위험.",
    vectors: { growth: -0.4, risk: 0.85, stability: -0.7, transition: 0.2, emotion: -0.4, career: -0.5, money: -0.8 },
    strength: 0.83,
    topics: ["money", "career"],
    timing_bias: "short",
    risk_level: "high"
  },
  {
    id: "P025",
    cards: ["Ace of Wands", "The Chariot"],
    orientation_rule: "both_upright",
    theme: "추진력 있는 시작",
    meaning: "강한 의지와 행동력이 새로운 사업이나 프로젝트를 이끄는 조합.",
    vectors: { growth: 0.9, risk: 0.3, stability: 0.4, transition: 0.6, emotion: 0.4, career: 0.95, money: 0.5 },
    strength: 0.87,
    topics: ["career", "money"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P026",
    cards: ["The Wheel of Fortune", "Ace of Pentacles"],
    orientation_rule: "any",
    theme: "행운의 재물 기회",
    meaning: "타이밍 좋은 투자나 사업 기회. 운의 흐름이 재물 쪽으로 열림.",
    vectors: { growth: 0.8, risk: 0.3, stability: 0.5, transition: 0.6, emotion: 0.3, career: 0.7, money: 0.88 },
    strength: 0.85,
    topics: ["money", "career"],
    timing_bias: "short",
    risk_level: "medium"
  },
  {
    id: "P027",
    cards: ["Nine of Pentacles", "The Sun"],
    orientation_rule: "both_upright",
    theme: "독립적 풍요",
    meaning: "혼자 이룬 성과와 풍요. 독립적 성공과 자기 만족감이 최고조.",
    vectors: { growth: 0.7, risk: 0.0, stability: 0.9, transition: 0.2, emotion: 0.8, career: 0.8, money: 0.9 },
    strength: 0.88,
    topics: ["money", "career", "general_future"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P028",
    cards: ["The Devil", "Five of Pentacles"],
    orientation_rule: "any",
    theme: "집착으로 인한 손실",
    meaning: "물질에 대한 과도한 집착이 오히려 재정적 손실을 부름.",
    vectors: { growth: -0.4, risk: 0.8, stability: -0.6, transition: 0.2, emotion: -0.5, career: -0.3, money: -0.85 },
    strength: 0.82,
    topics: ["money"],
    timing_bias: "medium",
    risk_level: "high"
  },
  {
    id: "P029",
    cards: ["Three of Pentacles", "The Hierophant"],
    orientation_rule: "any",
    theme: "체계적 성장",
    meaning: "전통적인 방법과 협력을 통한 안정적 성장. 팀워크와 구조가 핵심.",
    vectors: { growth: 0.7, risk: 0.1, stability: 0.8, transition: 0.3, emotion: 0.3, career: 0.85, money: 0.6 },
    strength: 0.78,
    topics: ["career", "money"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P030",
    cards: ["Eight of Pentacles", "The Magician"],
    orientation_rule: "any",
    theme: "기술 연마와 실행",
    meaning: "꾸준한 노력과 탁월한 실행력이 결합. 전문성을 쌓는 최적의 시기.",
    vectors: { growth: 0.85, risk: 0.1, stability: 0.6, transition: 0.4, emotion: 0.2, career: 0.9, money: 0.6 },
    strength: 0.83,
    topics: ["career"],
    timing_bias: "medium",
    risk_level: "low"
  },

  // ── 경고/위험 (10패턴) ───────────────────────────────────────────
  {
    id: "P031",
    cards: ["Five of Swords", "The Tower"],
    orientation_rule: "any",
    theme: "갈등과 붕괴",
    meaning: "외부 갈등이 기반을 무너뜨리는 위험한 조합. 분쟁·소송 주의.",
    vectors: { growth: -0.5, risk: 0.95, stability: -0.9, transition: 0.5, emotion: -0.7, career: -0.6, money: -0.5 },
    strength: 0.90,
    topics: ["career", "relationship", "money"],
    timing_bias: "immediate",
    risk_level: "high"
  },
  {
    id: "P032",
    cards: ["The Moon", "Nine of Swords"],
    orientation_rule: "any",
    theme: "불안과 악몽",
    meaning: "극심한 불안과 공포. 현실과 망상의 경계가 흐려지는 위험.",
    vectors: { growth: -0.4, risk: 0.7, stability: -0.7, transition: 0.2, emotion: -0.9, career: -0.3 },
    strength: 0.85,
    topics: ["health", "general_future"],
    timing_bias: "short",
    risk_level: "high"
  },
  {
    id: "P033",
    cards: ["The Devil", "The Tower"],
    orientation_rule: "any",
    theme: "속박과 파괴",
    meaning: "집착이나 중독이 극단적 붕괴를 불러오는 최고 위험 조합.",
    vectors: { growth: -0.7, risk: 0.98, stability: -0.95, transition: 0.4, emotion: -0.8, career: -0.7, money: -0.7 },
    strength: 0.92,
    topics: ["relationship", "career", "money", "health"],
    timing_bias: "immediate",
    risk_level: "high"
  },
  {
    id: "P034",
    cards: ["Ten of Swords", "Five of Cups"],
    orientation_rule: "any",
    theme: "완전한 패배와 상실",
    meaning: "최악의 결과와 깊은 상실감이 겹침. 그러나 바닥이 곧 반전의 시작.",
    vectors: { growth: 0.1, risk: 0.6, stability: -0.8, transition: 0.5, emotion: -0.9, career: -0.5, money: -0.5 },
    strength: 0.82,
    topics: ["career", "relationship", "general_future"],
    timing_bias: "short",
    risk_level: "high"
  },
  {
    id: "P035",
    cards: ["Seven of Swords", "The Moon"],
    orientation_rule: "any",
    theme: "기만과 착각",
    meaning: "숨겨진 진실이 있거나 상대방이 기만하고 있을 가능성.",
    vectors: { growth: -0.3, risk: 0.8, stability: -0.5, transition: 0.3, emotion: -0.6, career: -0.4, money: -0.5 },
    strength: 0.83,
    topics: ["relationship", "career", "money"],
    timing_bias: "short",
    risk_level: "high"
  },
  {
    id: "P036",
    cards: ["Three of Swords", "Five of Pentacles"],
    orientation_rule: "any",
    theme: "감정적·물질적 이중고",
    meaning: "마음의 상처와 경제적 어려움이 동시에 닥치는 힘든 시기.",
    vectors: { growth: -0.4, risk: 0.7, stability: -0.7, transition: 0.3, emotion: -0.8, career: -0.4, money: -0.7 },
    strength: 0.80,
    topics: ["relationship", "money"],
    timing_bias: "short",
    risk_level: "high"
  },
  {
    id: "P037",
    cards: ["The Hanged Man", "Four of Cups"],
    orientation_rule: "any",
    theme: "정체와 무감각",
    meaning: "아무것도 하지 않는 정지 상태. 기회를 보지 못하고 무기력에 빠짐.",
    vectors: { growth: -0.3, risk: 0.3, stability: 0.1, transition: -0.2, emotion: -0.4, career: -0.4 },
    strength: 0.70,
    topics: ["career", "general_future"],
    timing_bias: "medium",
    risk_level: "medium"
  },
  {
    id: "P038",
    cards: ["Eight of Swords", "The Hermit"],
    orientation_rule: "any",
    theme: "고립과 자기구속",
    meaning: "스스로 고립을 택하거나 강요당하는 상황. 외로움과 무력감이 깊어짐.",
    vectors: { growth: -0.2, risk: 0.4, stability: -0.3, transition: 0.2, emotion: -0.6, career: -0.3 },
    strength: 0.72,
    topics: ["health", "career", "relationship"],
    timing_bias: "medium",
    risk_level: "medium"
  },
  {
    id: "P039",
    cards: ["The High Priestess", "The Moon"],
    orientation_rule: "any_reversed",
    theme: "직관의 왜곡",
    meaning: "내면의 목소리가 두려움과 혼재. 직관이 잘못된 방향을 가리킬 수 있음.",
    vectors: { growth: -0.1, risk: 0.5, stability: -0.3, transition: 0.3, emotion: -0.4, career: -0.2 },
    strength: 0.72,
    topics: ["general_future", "relationship"],
    timing_bias: "short",
    risk_level: "medium"
  },
  {
    id: "P040",
    cards: ["Judgement", "The World"],
    orientation_rule: "both_upright",
    theme: "완성과 부활",
    meaning: "오랜 노력 끝에 얻는 완전한 성취와 새로운 소명. 인생의 터닝포인트.",
    vectors: { growth: 0.95, risk: 0.1, stability: 0.8, transition: 0.7, emotion: 0.8, career: 0.9, money: 0.6 },
    strength: 0.92,
    topics: ["life_change", "career", "general_future"],
    timing_bias: "long",
    risk_level: "low"
  },

  // ── 변화/전환 추가 20패턴 ─────────────────────────────────────
  {
    id: "P041",
    cards: ["The Fool", "Ace of Wands"],
    orientation_rule: "both_upright",
    theme: "완전한 새 출발",
    meaning: "두려움 없이 새로운 열정과 함께 시작하는 최강의 출발 조합.",
    vectors: { growth: 0.95, risk: 0.2, stability: -0.1, transition: 0.9, emotion: 0.6, career: 0.7 },
    strength: 0.87,
    topics: ["life_change", "career"],
    timing_bias: "immediate",
    risk_level: "low"
  },
  {
    id: "P042",
    cards: ["Death", "The Star"],
    orientation_rule: "any",
    theme: "끝 후의 희망",
    meaning: "완전한 종료 뒤에 찾아오는 빛. 상실이 새로운 희망으로 전환됨.",
    vectors: { growth: 0.7, risk: 0.3, stability: 0.2, transition: 0.9, emotion: 0.6, career: 0.4 },
    strength: 0.83,
    topics: ["life_change", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P043",
    cards: ["The Tower", "Ace of Cups"],
    orientation_rule: "any",
    theme: "파괴 후 감정 재탄생",
    meaning: "기존 관계나 감정 구조가 무너진 후 순수한 새 감정이 시작됨.",
    vectors: { growth: 0.6, risk: 0.6, stability: -0.5, transition: 0.85, emotion: 0.7, career: 0.1 },
    strength: 0.82,
    topics: ["relationship", "life_change"],
    timing_bias: "medium",
    risk_level: "medium"
  },
  {
    id: "P044",
    cards: ["Wheel of Fortune", "The Chariot"],
    orientation_rule: "any",
    theme: "운의 흐름을 타는 추진력",
    meaning: "운이 열리는 시점에 강한 행동력이 더해져 빠른 성과를 냄.",
    vectors: { growth: 0.9, risk: 0.3, stability: 0.4, transition: 0.7, emotion: 0.3, career: 0.9 },
    strength: 0.88,
    topics: ["career", "life_change"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P045",
    cards: ["The Hanged Man", "The Fool"],
    orientation_rule: "any",
    theme: "기다림 후 자유로운 도약",
    meaning: "강제된 정지 기간이 끝나고 완전히 새로운 방향으로 자유롭게 출발.",
    vectors: { growth: 0.8, risk: 0.2, stability: 0.1, transition: 0.85, emotion: 0.5, career: 0.5 },
    strength: 0.78,
    topics: ["life_change", "career"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P046",
    cards: ["The World", "Ace of Wands"],
    orientation_rule: "any",
    theme: "완성 후 새 도전",
    meaning: "한 챕터를 완전히 마치고 더 큰 열정으로 새 도전을 시작하는 시기.",
    vectors: { growth: 0.95, risk: 0.2, stability: 0.6, transition: 0.8, emotion: 0.7, career: 0.9 },
    strength: 0.90,
    topics: ["career", "life_change"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P047",
    cards: ["Judgement", "The Hermit"],
    orientation_rule: "any",
    theme: "내면의 소명 발견",
    meaning: "오랜 고독과 성찰 끝에 진정한 삶의 방향을 깨닫게 됨.",
    vectors: { growth: 0.7, risk: 0.1, stability: 0.5, transition: 0.7, emotion: 0.6, career: 0.6 },
    strength: 0.80,
    topics: ["life_change", "general_future"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P048",
    cards: ["The Moon", "The Sun"],
    orientation_rule: "any",
    theme: "혼란에서 명확함으로",
    meaning: "불확실하고 혼란스러운 상황이 점차 밝고 명확한 방향으로 전환됨.",
    vectors: { growth: 0.7, risk: 0.3, stability: 0.4, transition: 0.8, emotion: 0.6, career: 0.5 },
    strength: 0.82,
    topics: ["general_future", "life_change"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P049",
    cards: ["Five of Wands", "The Chariot"],
    orientation_rule: "any",
    theme: "경쟁을 뚫는 승리",
    meaning: "치열한 경쟁과 갈등 속에서 강한 의지로 승리를 쟁취하는 조합.",
    vectors: { growth: 0.8, risk: 0.5, stability: 0.3, transition: 0.5, emotion: 0.2, career: 0.85 },
    strength: 0.82,
    topics: ["career", "life_change"],
    timing_bias: "short",
    risk_level: "medium"
  },
  {
    id: "P050",
    cards: ["Ten of Wands", "The Star"],
    orientation_rule: "any",
    theme: "무거운 짐 후의 해방",
    meaning: "과도한 책임과 부담을 내려놓으면 희망과 회복이 기다리고 있음.",
    vectors: { growth: 0.6, risk: 0.2, stability: 0.4, transition: 0.7, emotion: 0.6, career: 0.4 },
    strength: 0.76,
    topics: ["career", "health", "life_change"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P051",
    cards: ["Eight of Wands", "Ace of Pentacles"],
    orientation_rule: "any",
    theme: "빠른 물질적 기회",
    meaning: "빠른 속도로 재물 기회가 찾아옴. 신속한 행동이 관건.",
    vectors: { growth: 0.8, risk: 0.3, stability: 0.4, transition: 0.6, emotion: 0.2, career: 0.8, money: 0.85 },
    strength: 0.84,
    topics: ["money", "career"],
    timing_bias: "immediate",
    risk_level: "low"
  },
  {
    id: "P052",
    cards: ["The High Priestess", "Judgement"],
    orientation_rule: "any",
    theme: "직관적 각성",
    meaning: "깊은 내면의 지혜가 삶의 중요한 전환점을 알아채는 조합.",
    vectors: { growth: 0.6, risk: 0.1, stability: 0.5, transition: 0.7, emotion: 0.7, career: 0.4 },
    strength: 0.78,
    topics: ["life_change", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P053",
    cards: ["The Emperor", "Death"],
    orientation_rule: "any",
    theme: "구조의 해체와 재건",
    meaning: "기존의 권위적 구조가 무너지고 새로운 질서가 세워지는 전환기.",
    vectors: { growth: 0.5, risk: 0.6, stability: -0.3, transition: 0.9, emotion: 0.1, career: 0.5 },
    strength: 0.80,
    topics: ["career", "life_change"],
    timing_bias: "long",
    risk_level: "medium"
  },
  {
    id: "P054",
    cards: ["Six of Swords", "The Star"],
    orientation_rule: "any",
    theme: "고통에서 평화로",
    meaning: "힘든 상황을 뒤로하고 더 평화롭고 희망적인 곳으로 나아가는 흐름.",
    vectors: { growth: 0.6, risk: 0.1, stability: 0.5, transition: 0.8, emotion: 0.6, career: 0.3 },
    strength: 0.78,
    topics: ["life_change", "health", "relationship"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P055",
    cards: ["The Magician", "Wheel of Fortune"],
    orientation_rule: "any",
    theme: "실력과 운의 결합",
    meaning: "개인의 역량이 운의 흐름과 맞아떨어지는 최적의 타이밍.",
    vectors: { growth: 0.9, risk: 0.2, stability: 0.5, transition: 0.7, emotion: 0.3, career: 0.95, money: 0.7 },
    strength: 0.90,
    topics: ["career", "money"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P056",
    cards: ["Three of Wands", "The World"],
    orientation_rule: "any",
    theme: "확장과 완성",
    meaning: "미래를 향한 진취적 계획이 결국 완전한 성취로 이어지는 흐름.",
    vectors: { growth: 0.9, risk: 0.2, stability: 0.7, transition: 0.6, emotion: 0.5, career: 0.85, money: 0.6 },
    strength: 0.86,
    topics: ["career", "money", "life_change"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P057",
    cards: ["Page of Wands", "The Fool"],
    orientation_rule: "any",
    theme: "젊은 에너지의 새 출발",
    meaning: "순수한 호기심과 열정으로 두려움 없이 새 길을 개척하는 조합.",
    vectors: { growth: 0.85, risk: 0.3, stability: -0.1, transition: 0.85, emotion: 0.6, career: 0.6 },
    strength: 0.78,
    topics: ["life_change", "career"],
    timing_bias: "immediate",
    risk_level: "low"
  },
  {
    id: "P058",
    cards: ["Knight of Wands", "The Chariot"],
    orientation_rule: "both_upright",
    theme: "폭발적 추진력",
    meaning: "열정과 의지가 결합된 최강의 행동력. 빠르고 과감한 전진.",
    vectors: { growth: 0.9, risk: 0.4, stability: 0.2, transition: 0.7, emotion: 0.4, career: 0.95 },
    strength: 0.88,
    topics: ["career", "life_change"],
    timing_bias: "immediate",
    risk_level: "medium"
  },
  {
    id: "P059",
    cards: ["Ace of Swords", "The Tower"],
    orientation_rule: "any",
    theme: "진실이 파괴를 부름",
    meaning: "숨겨진 진실이 드러나면서 기존 구조가 무너지는 충격적 전환.",
    vectors: { growth: 0.4, risk: 0.8, stability: -0.7, transition: 0.85, emotion: -0.3, career: 0.2 },
    strength: 0.82,
    topics: ["life_change", "relationship"],
    timing_bias: "immediate",
    risk_level: "high"
  },
  {
    id: "P060",
    cards: ["Four of Wands", "The Sun"],
    orientation_rule: "both_upright",
    theme: "축하와 기쁨",
    meaning: "안정적인 성취와 밝은 에너지가 결합된 축복받은 시기.",
    vectors: { growth: 0.8, risk: -0.1, stability: 0.9, transition: 0.3, emotion: 0.95, career: 0.6, money: 0.5 },
    strength: 0.88,
    topics: ["general_future", "relationship", "family"],
    timing_bias: "short",
    risk_level: "low"
  },

  // ── 관계/사랑 추가 20패턴 ─────────────────────────────────────
  {
    id: "P061",
    cards: ["Six of Cups", "The Lovers"],
    orientation_rule: "any",
    theme: "과거 인연의 재회",
    meaning: "오래된 인연이나 첫사랑과의 재회. 순수하고 따뜻한 감정의 부활.",
    vectors: { growth: 0.5, risk: 0.2, stability: 0.5, transition: 0.6, emotion: 0.85, career: 0.1 },
    strength: 0.80,
    topics: ["relationship"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P062",
    cards: ["Two of Cups", "Four of Wands"],
    orientation_rule: "both_upright",
    theme: "결혼·약혼의 조합",
    meaning: "깊은 감정적 결합과 안정적 기반이 결혼이나 약혼을 강하게 시사.",
    vectors: { growth: 0.7, risk: 0.1, stability: 0.9, transition: 0.4, emotion: 0.95, career: 0.2, money: 0.4 },
    strength: 0.90,
    topics: ["relationship", "family"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P063",
    cards: ["The Devil", "Two of Cups"],
    orientation_rule: "any_reversed",
    theme: "집착에서 진정한 사랑으로",
    meaning: "독성적 패턴에서 벗어나 건강한 사랑으로 전환하려는 노력.",
    vectors: { growth: 0.5, risk: 0.4, stability: 0.2, transition: 0.6, emotion: 0.4, career: 0.1 },
    strength: 0.72,
    topics: ["relationship"],
    timing_bias: "medium",
    risk_level: "medium"
  },
  {
    id: "P064",
    cards: ["Eight of Cups", "The Hermit"],
    orientation_rule: "any",
    theme: "감정적 단절과 고독",
    meaning: "관계에서 떠나 혼자만의 시간을 선택하는 흐름. 내면 치유 기간.",
    vectors: { growth: 0.3, risk: 0.2, stability: 0.1, transition: 0.6, emotion: -0.3, career: -0.1 },
    strength: 0.72,
    topics: ["relationship", "health"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P065",
    cards: ["Queen of Cups", "The High Priestess"],
    orientation_rule: "any",
    theme: "깊은 감성적 직관",
    meaning: "감정적으로 매우 성숙하고 직관적인 여성 에너지가 강하게 작용.",
    vectors: { growth: 0.4, risk: 0.1, stability: 0.6, transition: 0.2, emotion: 0.9, career: 0.3 },
    strength: 0.76,
    topics: ["relationship", "general_future"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P066",
    cards: ["King of Cups", "The Emperor"],
    orientation_rule: "any",
    theme: "감성과 이성의 균형",
    meaning: "감정적 성숙함과 강한 리더십이 결합된 안정적 파트너 에너지.",
    vectors: { growth: 0.6, risk: 0.1, stability: 0.85, transition: 0.2, emotion: 0.7, career: 0.7 },
    strength: 0.80,
    topics: ["relationship", "career"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P067",
    cards: ["Five of Cups", "Eight of Cups"],
    orientation_rule: "any",
    theme: "상실과 이별의 연속",
    meaning: "감정적 손실이 반복되는 힘든 시기. 과거에 집착하지 말고 앞으로 나아가야 함.",
    vectors: { growth: 0.2, risk: 0.4, stability: -0.4, transition: 0.5, emotion: -0.7, career: -0.2 },
    strength: 0.75,
    topics: ["relationship"],
    timing_bias: "short",
    risk_level: "medium"
  },
  {
    id: "P068",
    cards: ["Ace of Cups", "The Lovers"],
    orientation_rule: "both_upright",
    theme: "운명적 첫 만남",
    meaning: "순수한 감정의 시작과 깊은 연결이 동시에 찾아오는 운명적 만남.",
    vectors: { growth: 0.8, risk: 0.1, stability: 0.5, transition: 0.6, emotion: 0.98, career: 0.1 },
    strength: 0.90,
    topics: ["relationship"],
    timing_bias: "immediate",
    risk_level: "low"
  },
  {
    id: "P069",
    cards: ["Three of Cups", "The Sun"],
    orientation_rule: "both_upright",
    theme: "관계의 풍성한 기쁨",
    meaning: "친구, 연인, 가족 관계에서 넘치는 기쁨과 축하의 에너지.",
    vectors: { growth: 0.7, risk: -0.1, stability: 0.8, transition: 0.3, emotion: 0.95, career: 0.3 },
    strength: 0.85,
    topics: ["relationship", "family"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P070",
    cards: ["Two of Swords", "The Lovers"],
    orientation_rule: "any",
    theme: "관계의 중요한 선택",
    meaning: "두 가지 선택지 사이에서 마음이 나뉘는 감정적 갈림길.",
    vectors: { growth: 0.3, risk: 0.4, stability: -0.1, transition: 0.5, emotion: 0.2, career: 0.1 },
    strength: 0.73,
    topics: ["relationship"],
    timing_bias: "short",
    risk_level: "medium"
  },
  {
    id: "P071",
    cards: ["Page of Cups", "Ace of Cups"],
    orientation_rule: "any",
    theme: "순수한 감정의 시작",
    meaning: "새로운 감정이나 창의적 아이디어가 순수하게 싹트는 시기.",
    vectors: { growth: 0.7, risk: 0.1, stability: 0.3, transition: 0.5, emotion: 0.88, career: 0.2 },
    strength: 0.78,
    topics: ["relationship", "general_future"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P072",
    cards: ["Knight of Cups", "The Lovers"],
    orientation_rule: "any",
    theme: "낭만적 구애",
    meaning: "감성적이고 낭만적인 구애 에너지. 고백이나 프러포즈 시기.",
    vectors: { growth: 0.6, risk: 0.2, stability: 0.4, transition: 0.5, emotion: 0.92, career: 0.1 },
    strength: 0.82,
    topics: ["relationship"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P073",
    cards: ["Ten of Cups", "Four of Wands"],
    orientation_rule: "both_upright",
    theme: "가정의 완전한 행복",
    meaning: "가족과 함께하는 완전한 행복과 안정. 결혼·출산·이사 등 경사스러운 사건.",
    vectors: { growth: 0.8, risk: -0.1, stability: 0.95, transition: 0.3, emotion: 0.98, career: 0.4, money: 0.5 },
    strength: 0.92,
    topics: ["family", "relationship"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P074",
    cards: ["The Tower", "Two of Cups"],
    orientation_rule: "any",
    theme: "관계의 갑작스러운 시험",
    meaning: "예상치 못한 충격이 관계를 시험함. 위기를 함께 극복하면 더 깊어질 수 있음.",
    vectors: { growth: 0.3, risk: 0.7, stability: -0.5, transition: 0.6, emotion: -0.2, career: -0.1 },
    strength: 0.78,
    topics: ["relationship"],
    timing_bias: "immediate",
    risk_level: "high"
  },
  {
    id: "P075",
    cards: ["Nine of Cups", "The Sun"],
    orientation_rule: "both_upright",
    theme: "소원 성취와 기쁨",
    meaning: "바라던 바가 이루어지는 최고의 만족감. 감정적·물질적 풍요.",
    vectors: { growth: 0.85, risk: -0.1, stability: 0.8, transition: 0.3, emotion: 0.95, career: 0.6, money: 0.6 },
    strength: 0.90,
    topics: ["general_future", "relationship", "money"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P076",
    cards: ["Four of Cups", "The Hermit"],
    orientation_rule: "any",
    theme: "내면의 불만족과 고독",
    meaning: "가진 것에 만족하지 못하고 혼자만의 세계에 침잠하는 상태.",
    vectors: { growth: -0.1, risk: 0.2, stability: 0.2, transition: 0.2, emotion: -0.4, career: -0.2 },
    strength: 0.68,
    topics: ["relationship", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P077",
    cards: ["Seven of Cups", "The Moon"],
    orientation_rule: "any",
    theme: "환상과 혼란",
    meaning: "너무 많은 선택지와 환상 속에서 현실을 제대로 보지 못하는 상태.",
    vectors: { growth: -0.2, risk: 0.6, stability: -0.3, transition: 0.3, emotion: -0.3, career: -0.2 },
    strength: 0.73,
    topics: ["relationship", "general_future"],
    timing_bias: "short",
    risk_level: "medium"
  },
  {
    id: "P078",
    cards: ["Queen of Wands", "The Empress"],
    orientation_rule: "any",
    theme: "카리스마 있는 여성 에너지",
    meaning: "강렬한 카리스마와 풍요로운 여성적 에너지가 결합. 매력과 창의성이 최고조.",
    vectors: { growth: 0.7, risk: 0.2, stability: 0.6, transition: 0.4, emotion: 0.8, career: 0.7, money: 0.5 },
    strength: 0.80,
    topics: ["career", "relationship"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P079",
    cards: ["King of Wands", "The Emperor"],
    orientation_rule: "both_upright",
    theme: "강력한 리더십",
    meaning: "비전과 권위가 결합된 최강의 리더십 에너지. 사업이나 조직 운영에 최적.",
    vectors: { growth: 0.8, risk: 0.2, stability: 0.8, transition: 0.3, emotion: 0.3, career: 0.98, money: 0.7 },
    strength: 0.90,
    topics: ["career"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P080",
    cards: ["Six of Cups", "Four of Wands"],
    orientation_rule: "any",
    theme: "따뜻한 가족 재결합",
    meaning: "오래된 추억과 현재의 안정이 만나 가족이나 오랜 인연과의 행복한 재결합.",
    vectors: { growth: 0.6, risk: 0.0, stability: 0.85, transition: 0.3, emotion: 0.88, career: 0.1 },
    strength: 0.80,
    topics: ["family", "relationship"],
    timing_bias: "medium",
    risk_level: "low"
  },

  // ── 재물/사업 추가 20패턴 ─────────────────────────────────────
  {
    id: "P081",
    cards: ["Six of Pentacles", "The Empress"],
    orientation_rule: "any",
    theme: "나눔과 풍요",
    meaning: "베풀수록 더 많이 돌아오는 풍요의 순환. 투자나 지원이 좋은 결과를 냄.",
    vectors: { growth: 0.7, risk: 0.1, stability: 0.7, transition: 0.3, emotion: 0.5, career: 0.5, money: 0.80 },
    strength: 0.78,
    topics: ["money", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P082",
    cards: ["King of Pentacles", "The World"],
    orientation_rule: "both_upright",
    theme: "사업의 완전한 성공",
    meaning: "물질적 마스터리와 완성이 결합된 최고의 사업 성공 조합.",
    vectors: { growth: 0.9, risk: 0.0, stability: 0.98, transition: 0.2, emotion: 0.4, career: 0.98, money: 0.98 },
    strength: 0.95,
    topics: ["money", "career"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P083",
    cards: ["Four of Pentacles", "The Miser"],
    orientation_rule: "any",
    theme: "과도한 절약",
    meaning: "재물에 대한 지나친 집착이 새로운 기회를 막음. 적절한 투자가 필요.",
    vectors: { growth: -0.3, risk: 0.3, stability: 0.4, transition: -0.2, emotion: -0.2, career: -0.1, money: 0.1 },
    strength: 0.68,
    topics: ["money"],
    timing_bias: "medium",
    risk_level: "medium"
  },
  {
    id: "P084",
    cards: ["Two of Pentacles", "Wheel of Fortune"],
    orientation_rule: "any",
    theme: "재정적 균형 조율",
    meaning: "변화하는 상황 속에서 재정 균형을 유지하는 능력. 유연한 대응이 핵심.",
    vectors: { growth: 0.5, risk: 0.4, stability: 0.4, transition: 0.6, emotion: 0.1, career: 0.5, money: 0.5 },
    strength: 0.72,
    topics: ["money", "life_change"],
    timing_bias: "short",
    risk_level: "medium"
  },
  {
    id: "P085",
    cards: ["Seven of Pentacles", "The Hermit"],
    orientation_rule: "any",
    theme: "장기적 투자와 기다림",
    meaning: "성과를 얻기까지 인내심 있게 기다려야 하는 장기 투자 에너지.",
    vectors: { growth: 0.5, risk: 0.2, stability: 0.6, transition: 0.2, emotion: 0.1, career: 0.5, money: 0.6 },
    strength: 0.72,
    topics: ["money", "career"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P086",
    cards: ["Ace of Pentacles", "The Magician"],
    orientation_rule: "both_upright",
    theme: "실력으로 여는 재물",
    meaning: "탁월한 능력과 새로운 재물 기회가 결합. 스스로 만드는 성공.",
    vectors: { growth: 0.9, risk: 0.1, stability: 0.6, transition: 0.5, emotion: 0.3, career: 0.9, money: 0.92 },
    strength: 0.90,
    topics: ["money", "career"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P087",
    cards: ["Five of Pentacles", "Six of Pentacles"],
    orientation_rule: "any",
    theme: "어려움 후 도움",
    meaning: "재정적 어려움 속에서 도움의 손길이 찾아오는 전환점.",
    vectors: { growth: 0.5, risk: 0.3, stability: 0.2, transition: 0.6, emotion: 0.4, career: 0.3, money: 0.4 },
    strength: 0.73,
    topics: ["money", "general_future"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P088",
    cards: ["Queen of Pentacles", "The Empress"],
    orientation_rule: "any",
    theme: "풍요로운 실용적 에너지",
    meaning: "물질적 풍요와 현실적 지혜가 결합. 가정과 사업 모두 안정적.",
    vectors: { growth: 0.6, risk: 0.0, stability: 0.9, transition: 0.2, emotion: 0.6, career: 0.7, money: 0.88 },
    strength: 0.83,
    topics: ["money", "family", "career"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P089",
    cards: ["Three of Pentacles", "Eight of Pentacles"],
    orientation_rule: "any",
    theme: "전문성과 협력",
    meaning: "개인의 기술 연마와 팀워크가 결합되어 뛰어난 결과물을 만들어냄.",
    vectors: { growth: 0.8, risk: 0.1, stability: 0.7, transition: 0.3, emotion: 0.2, career: 0.92, money: 0.65 },
    strength: 0.83,
    topics: ["career"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P090",
    cards: ["Knight of Pentacles", "The Emperor"],
    orientation_rule: "any",
    theme: "꾸준한 실행력",
    meaning: "느리지만 확실하게 목표를 향해 나아가는 신뢰할 수 있는 에너지.",
    vectors: { growth: 0.7, risk: 0.1, stability: 0.85, transition: 0.2, emotion: 0.1, career: 0.85, money: 0.75 },
    strength: 0.80,
    topics: ["career", "money"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P091",
    cards: ["Eight of Pentacles", "The Star"],
    orientation_rule: "any",
    theme: "노력이 빛을 발하는 시기",
    meaning: "꾸준한 노력이 드디어 인정받고 희망적인 결과로 이어지는 시기.",
    vectors: { growth: 0.85, risk: 0.0, stability: 0.7, transition: 0.4, emotion: 0.5, career: 0.88, money: 0.6 },
    strength: 0.83,
    topics: ["career", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P092",
    cards: ["Ten of Pentacles", "Four of Wands"],
    orientation_rule: "both_upright",
    theme: "세대를 잇는 풍요",
    meaning: "장기적으로 축적된 재물과 가정의 안정이 결합된 최고의 풍요.",
    vectors: { growth: 0.7, risk: -0.1, stability: 0.98, transition: 0.2, emotion: 0.7, career: 0.7, money: 0.98 },
    strength: 0.92,
    topics: ["money", "family"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P093",
    cards: ["The Tower", "Five of Pentacles"],
    orientation_rule: "any",
    theme: "갑작스러운 재정 붕괴",
    meaning: "예상치 못한 충격으로 재정 기반이 한꺼번에 무너지는 최고 위험 조합.",
    vectors: { growth: -0.6, risk: 0.95, stability: -0.95, transition: 0.4, emotion: -0.5, career: -0.7, money: -0.95 },
    strength: 0.92,
    topics: ["money", "career"],
    timing_bias: "immediate",
    risk_level: "high"
  },
  {
    id: "P094",
    cards: ["The Wheel of Fortune", "Ten of Pentacles"],
    orientation_rule: "any",
    theme: "운이 만드는 장기적 풍요",
    meaning: "운의 흐름이 장기적 재물 안정으로 이어지는 축복받은 조합.",
    vectors: { growth: 0.8, risk: 0.2, stability: 0.85, transition: 0.5, emotion: 0.4, career: 0.7, money: 0.92 },
    strength: 0.88,
    topics: ["money", "general_future"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P095",
    cards: ["Ace of Wands", "Ace of Pentacles"],
    orientation_rule: "both_upright",
    theme: "열정과 재물의 동시 시작",
    meaning: "새로운 사업 아이디어와 재물 기회가 동시에 찾아오는 황금 타이밍.",
    vectors: { growth: 0.95, risk: 0.2, stability: 0.4, transition: 0.7, emotion: 0.4, career: 0.95, money: 0.90 },
    strength: 0.92,
    topics: ["career", "money"],
    timing_bias: "immediate",
    risk_level: "low"
  },
  {
    id: "P096",
    cards: ["Six of Pentacles", "Justice"],
    orientation_rule: "any",
    theme: "공정한 보상",
    meaning: "노력한 만큼 공정하게 돌아오는 보상. 계약이나 협상에 유리한 시기.",
    vectors: { growth: 0.6, risk: 0.1, stability: 0.8, transition: 0.3, emotion: 0.3, career: 0.7, money: 0.75 },
    strength: 0.78,
    topics: ["career", "money"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P097",
    cards: ["Page of Pentacles", "The Magician"],
    orientation_rule: "any",
    theme: "새로운 기술로 여는 기회",
    meaning: "새로운 기술이나 지식을 습득하여 실질적인 기회를 만들어가는 조합.",
    vectors: { growth: 0.82, risk: 0.1, stability: 0.5, transition: 0.5, emotion: 0.2, career: 0.82, money: 0.65 },
    strength: 0.78,
    topics: ["career", "money"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P098",
    cards: ["Two of Pentacles", "The Chariot"],
    orientation_rule: "any",
    theme: "멀티태스킹 성공",
    meaning: "여러 일을 동시에 처리하면서도 목표를 향해 힘차게 나아가는 에너지.",
    vectors: { growth: 0.7, risk: 0.3, stability: 0.4, transition: 0.5, emotion: 0.2, career: 0.82, money: 0.6 },
    strength: 0.75,
    topics: ["career"],
    timing_bias: "short",
    risk_level: "medium"
  },
  {
    id: "P099",
    cards: ["Nine of Pentacles", "The Hermit"],
    orientation_rule: "any",
    theme: "독립적 성취",
    meaning: "혼자 이루어낸 물질적 성공. 자립과 자기 충족의 에너지.",
    vectors: { growth: 0.7, risk: 0.0, stability: 0.88, transition: 0.2, emotion: 0.5, career: 0.75, money: 0.88 },
    strength: 0.82,
    topics: ["money", "career"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P100",
    cards: ["Five of Wands", "Five of Pentacles"],
    orientation_rule: "any",
    theme: "경쟁과 재정 이중 압박",
    meaning: "외부 경쟁과 재정 어려움이 동시에 찾아오는 이중고의 시기.",
    vectors: { growth: -0.2, risk: 0.8, stability: -0.6, transition: 0.3, emotion: -0.3, career: -0.4, money: -0.6 },
    strength: 0.78,
    topics: ["career", "money"],
    timing_bias: "short",
    risk_level: "high"
  },

  // ── 경고/위험 추가 20패턴 ─────────────────────────────────────
  {
    id: "P101",
    cards: ["Ten of Swords", "The Moon"],
    orientation_rule: "any",
    theme: "최악의 배신과 혼란",
    meaning: "완전한 패배와 심리적 혼란이 겹치는 최악의 상태. 현실 도피 주의.",
    vectors: { growth: -0.5, risk: 0.9, stability: -0.9, transition: 0.3, emotion: -0.95, career: -0.6 },
    strength: 0.88,
    topics: ["relationship", "career"],
    timing_bias: "immediate",
    risk_level: "high"
  },
  {
    id: "P102",
    cards: ["Nine of Swords", "The Devil"],
    orientation_rule: "any",
    theme: "자기 파괴적 불안",
    meaning: "과도한 불안과 집착이 자기 파괴적 패턴으로 이어지는 위험한 상태.",
    vectors: { growth: -0.6, risk: 0.88, stability: -0.7, transition: 0.1, emotion: -0.9, career: -0.4 },
    strength: 0.85,
    topics: ["health", "relationship"],
    timing_bias: "short",
    risk_level: "high"
  },
  {
    id: "P103",
    cards: ["Five of Swords", "Seven of Swords"],
    orientation_rule: "any",
    theme: "승리 없는 갈등과 기만",
    meaning: "불공정한 싸움과 속임수가 겹치는 최악의 갈등 상황.",
    vectors: { growth: -0.5, risk: 0.92, stability: -0.7, transition: 0.2, emotion: -0.6, career: -0.5 },
    strength: 0.85,
    topics: ["career", "relationship"],
    timing_bias: "short",
    risk_level: "high"
  },
  {
    id: "P104",
    cards: ["The Tower", "Ten of Swords"],
    orientation_rule: "any",
    theme: "완전한 붕괴",
    meaning: "외부 충격과 내부 패배가 동시에 일어나는 가장 힘든 조합. 그러나 바닥이 반전의 시작.",
    vectors: { growth: 0.1, risk: 0.98, stability: -0.98, transition: 0.5, emotion: -0.9, career: -0.8, money: -0.7 },
    strength: 0.92,
    topics: ["career", "relationship", "money"],
    timing_bias: "immediate",
    risk_level: "high"
  },
  {
    id: "P105",
    cards: ["Eight of Swords", "Nine of Swords"],
    orientation_rule: "any",
    theme: "자기 감금과 악몽",
    meaning: "스스로 만든 감옥 안에서 극심한 불안에 시달리는 상태. 탈출구는 내면에 있음.",
    vectors: { growth: -0.3, risk: 0.75, stability: -0.6, transition: 0.2, emotion: -0.88, career: -0.3 },
    strength: 0.80,
    topics: ["health", "general_future"],
    timing_bias: "short",
    risk_level: "high"
  },
  {
    id: "P106",
    cards: ["The Devil", "Eight of Cups"],
    orientation_rule: "any",
    theme: "집착에서 도망",
    meaning: "독성적 관계나 상황에 묶여 있으면서도 떠나야 함을 아는 갈등 상태.",
    vectors: { growth: 0.3, risk: 0.6, stability: -0.4, transition: 0.5, emotion: -0.5, career: -0.2 },
    strength: 0.75,
    topics: ["relationship", "career"],
    timing_bias: "medium",
    risk_level: "high"
  },
  {
    id: "P107",
    cards: ["Three of Swords", "Ten of Swords"],
    orientation_rule: "any",
    theme: "감정적 극한 고통",
    meaning: "배신과 완전한 패배가 겹치는 극심한 감정적 상처. 회복에 시간 필요.",
    vectors: { growth: -0.3, risk: 0.8, stability: -0.85, transition: 0.3, emotion: -0.98, career: -0.4 },
    strength: 0.85,
    topics: ["relationship"],
    timing_bias: "short",
    risk_level: "high"
  },
  {
    id: "P108",
    cards: ["The Moon", "Seven of Cups"],
    orientation_rule: "any",
    theme: "환상과 현실 괴리",
    meaning: "현실과 환상의 경계가 완전히 흐려지는 상태. 중요한 결정을 미뤄야 함.",
    vectors: { growth: -0.3, risk: 0.7, stability: -0.5, transition: 0.2, emotion: -0.5, career: -0.3 },
    strength: 0.75,
    topics: ["general_future", "relationship"],
    timing_bias: "short",
    risk_level: "high"
  },
  {
    id: "P109",
    cards: ["Five of Cups", "Nine of Swords"],
    orientation_rule: "any",
    theme: "상실과 불안의 악순환",
    meaning: "관계나 상황에서의 손실이 극심한 불안으로 이어지는 악순환.",
    vectors: { growth: -0.3, risk: 0.7, stability: -0.6, transition: 0.2, emotion: -0.88, career: -0.2 },
    strength: 0.78,
    topics: ["relationship", "health"],
    timing_bias: "short",
    risk_level: "high"
  },
  {
    id: "P110",
    cards: ["The Hierophant", "The Devil"],
    orientation_rule: "any",
    theme: "제도적 억압",
    meaning: "전통이나 제도가 오히려 자유를 억누르는 구조적 억압 상황.",
    vectors: { growth: -0.4, risk: 0.6, stability: 0.1, transition: 0.3, emotion: -0.5, career: -0.3 },
    strength: 0.73,
    topics: ["career", "life_change"],
    timing_bias: "medium",
    risk_level: "medium"
  },
  {
    id: "P111",
    cards: ["Two of Swords", "The Moon"],
    orientation_rule: "any",
    theme: "진실을 외면한 결정",
    meaning: "불편한 진실을 보지 않으려 하면서 내리는 잘못된 결정의 위험.",
    vectors: { growth: -0.2, risk: 0.65, stability: -0.3, transition: 0.3, emotion: -0.4, career: -0.2 },
    strength: 0.70,
    topics: ["relationship", "career"],
    timing_bias: "short",
    risk_level: "medium"
  },
  {
    id: "P112",
    cards: ["Four of Cups", "The Devil"],
    orientation_rule: "any",
    theme: "무감각한 집착",
    meaning: "지루함과 불만족이 오히려 나쁜 습관이나 집착으로 이어지는 위험.",
    vectors: { growth: -0.4, risk: 0.65, stability: -0.3, transition: 0.1, emotion: -0.5, career: -0.2 },
    strength: 0.70,
    topics: ["relationship", "health"],
    timing_bias: "medium",
    risk_level: "medium"
  },
  {
    id: "P113",
    cards: ["The Tower", "The Moon"],
    orientation_rule: "any",
    theme: "충격과 혼란의 극한",
    meaning: "갑작스러운 충격 후 극심한 혼란이 이어지는 가장 불안정한 상태.",
    vectors: { growth: -0.2, risk: 0.95, stability: -0.95, transition: 0.5, emotion: -0.8, career: -0.5 },
    strength: 0.90,
    topics: ["life_change", "career", "relationship"],
    timing_bias: "immediate",
    risk_level: "high"
  },
  {
    id: "P114",
    cards: ["Five of Wands", "Seven of Swords"],
    orientation_rule: "any",
    theme: "불공정한 경쟁",
    meaning: "정당하지 않은 방법으로 경쟁이 이루어지는 상황. 속임수에 주의 필요.",
    vectors: { growth: -0.3, risk: 0.85, stability: -0.5, transition: 0.2, emotion: -0.3, career: -0.5 },
    strength: 0.80,
    topics: ["career"],
    timing_bias: "short",
    risk_level: "high"
  },
  {
    id: "P115",
    cards: ["Nine of Wands", "Ten of Wands"],
    orientation_rule: "any",
    theme: "극한의 소진",
    meaning: "이미 지쳐있는데 더 많은 짐을 지는 상황. 번아웃 직전의 경고.",
    vectors: { growth: -0.2, risk: 0.6, stability: -0.3, transition: 0.2, emotion: -0.5, career: -0.3 },
    strength: 0.73,
    topics: ["career", "health"],
    timing_bias: "short",
    risk_level: "medium"
  },
  {
    id: "P116",
    cards: ["The Devil", "Nine of Swords"],
    orientation_rule: "any",
    theme: "중독과 불안",
    meaning: "어떤 것에 대한 과도한 집착이 심각한 심리적 고통으로 이어지는 상태.",
    vectors: { growth: -0.5, risk: 0.88, stability: -0.7, transition: 0.1, emotion: -0.92, career: -0.4 },
    strength: 0.85,
    topics: ["health"],
    timing_bias: "short",
    risk_level: "high"
  },
  {
    id: "P117",
    cards: ["Three of Swords", "Eight of Swords"],
    orientation_rule: "any",
    theme: "상처와 자기 감금",
    meaning: "감정적 상처 때문에 스스로 고립을 선택하는 자기 보호적 고통.",
    vectors: { growth: -0.2, risk: 0.65, stability: -0.55, transition: 0.2, emotion: -0.85, career: -0.2 },
    strength: 0.75,
    topics: ["relationship", "health"],
    timing_bias: "medium",
    risk_level: "medium"
  },
  {
    id: "P118",
    cards: ["The Hanged Man", "Five of Pentacles"],
    orientation_rule: "any",
    theme: "강요된 희생과 결핍",
    meaning: "원하지 않는 희생을 강요당하면서 물질적으로도 어려움이 겹치는 시기.",
    vectors: { growth: -0.1, risk: 0.6, stability: -0.5, transition: 0.3, emotion: -0.4, career: -0.3, money: -0.6 },
    strength: 0.73,
    topics: ["career", "money"],
    timing_bias: "medium",
    risk_level: "high"
  },
  {
    id: "P119",
    cards: ["Six of Swords", "Eight of Swords"],
    orientation_rule: "any",
    theme: "탈출하려 하지만 갇힌 느낌",
    meaning: "벗어나고 싶지만 심리적 제약으로 인해 쉽게 나아가지 못하는 상태.",
    vectors: { growth: 0.2, risk: 0.5, stability: -0.3, transition: 0.4, emotion: -0.5, career: -0.2 },
    strength: 0.70,
    topics: ["life_change", "health"],
    timing_bias: "medium",
    risk_level: "medium"
  },
  {
    id: "P120",
    cards: ["Judgement", "The Tower"],
    orientation_rule: "any_reversed",
    theme: "거부된 각성",
    meaning: "변화의 기회가 왔지만 기존 구조의 붕괴가 두려워 받아들이지 못하는 상태.",
    vectors: { growth: 0.2, risk: 0.7, stability: -0.5, transition: 0.4, emotion: -0.2, career: 0.1 },
    strength: 0.72,
    topics: ["life_change", "career"],
    timing_bias: "short",
    risk_level: "medium"
  },

  // ── 성장/희망 25패턴 ──────────────────────────────────────────
  {
    id: "P121",
    cards: ["The Star", "Ace of Wands"],
    orientation_rule: "both_upright",
    theme: "희망 속 새로운 열정",
    meaning: "밝은 미래에 대한 희망과 새로운 열정이 동시에 솟아오르는 강렬한 에너지.",
    vectors: { growth: 0.95, risk: 0.1, stability: 0.4, transition: 0.7, emotion: 0.8, career: 0.85 },
    strength: 0.88,
    topics: ["general_future", "career"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P122",
    cards: ["The Sun", "The World"],
    orientation_rule: "both_upright",
    theme: "완전한 성공과 기쁨",
    meaning: "최고의 성취와 넘치는 기쁨. 모든 것이 완성되는 최상의 조합.",
    vectors: { growth: 0.98, risk: -0.2, stability: 0.95, transition: 0.4, emotion: 0.98, career: 0.9, money: 0.8 },
    strength: 0.98,
    topics: ["general_future", "career", "relationship"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P123",
    cards: ["Strength", "The Star"],
    orientation_rule: "any",
    theme: "내면의 힘으로 피어나는 희망",
    meaning: "어려움 속에서 내면의 힘을 발휘하여 희망을 만들어가는 아름다운 조합.",
    vectors: { growth: 0.85, risk: 0.0, stability: 0.7, transition: 0.5, emotion: 0.75, career: 0.7 },
    strength: 0.85,
    topics: ["general_future", "health"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P124",
    cards: ["The Hermit", "The Star"],
    orientation_rule: "any",
    theme: "고독한 성찰 후 희망",
    meaning: "혼자만의 깊은 성찰 끝에 새로운 방향과 희망을 발견하는 여정.",
    vectors: { growth: 0.7, risk: 0.0, stability: 0.5, transition: 0.6, emotion: 0.6, career: 0.4 },
    strength: 0.78,
    topics: ["general_future", "life_change"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P125",
    cards: ["Ace of Cups", "Ace of Wands"],
    orientation_rule: "both_upright",
    theme: "감정과 열정의 동시 폭발",
    meaning: "새로운 감정과 창의적 열정이 함께 시작되는 황금 같은 출발.",
    vectors: { growth: 0.95, risk: 0.2, stability: 0.2, transition: 0.8, emotion: 0.92, career: 0.7 },
    strength: 0.88,
    topics: ["relationship", "career", "life_change"],
    timing_bias: "immediate",
    risk_level: "low"
  },
  {
    id: "P126",
    cards: ["The Magician", "The Star"],
    orientation_rule: "both_upright",
    theme: "능력과 희망의 결합",
    meaning: "뛰어난 실행력과 밝은 미래에 대한 희망이 결합된 강력한 성공 에너지.",
    vectors: { growth: 0.92, risk: 0.1, stability: 0.6, transition: 0.5, emotion: 0.6, career: 0.9, money: 0.65 },
    strength: 0.88,
    topics: ["career", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P127",
    cards: ["Temperance", "The World"],
    orientation_rule: "any",
    theme: "균형 잡힌 완성",
    meaning: "조화롭고 균형 잡힌 방식으로 최종 목표에 도달하는 성숙한 성공.",
    vectors: { growth: 0.8, risk: -0.1, stability: 0.9, transition: 0.4, emotion: 0.7, career: 0.75, money: 0.6 },
    strength: 0.85,
    topics: ["general_future", "career"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P128",
    cards: ["Six of Wands", "The Sun"],
    orientation_rule: "both_upright",
    theme: "공개적 승리와 인정",
    meaning: "노력이 공개적으로 인정받고 칭찬받는 승리의 시기.",
    vectors: { growth: 0.88, risk: 0.1, stability: 0.7, transition: 0.4, emotion: 0.85, career: 0.92 },
    strength: 0.90,
    topics: ["career", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P129",
    cards: ["Nine of Cups", "Ten of Pentacles"],
    orientation_rule: "both_upright",
    theme: "감정적·물질적 완전 충족",
    meaning: "마음의 소원이 이루어지고 물질적으로도 풍요로운 최고의 상태.",
    vectors: { growth: 0.85, risk: -0.1, stability: 0.95, transition: 0.2, emotion: 0.95, career: 0.7, money: 0.95 },
    strength: 0.95,
    topics: ["general_future", "money", "relationship"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P130",
    cards: ["The High Priestess", "The Star"],
    orientation_rule: "any",
    theme: "직관으로 찾은 희망",
    meaning: "내면의 깊은 직관이 올바른 방향과 희망적 미래를 가리키고 있음.",
    vectors: { growth: 0.7, risk: 0.0, stability: 0.6, transition: 0.4, emotion: 0.75, career: 0.4 },
    strength: 0.78,
    topics: ["general_future", "life_change"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P131",
    cards: ["Ace of Pentacles", "The Sun"],
    orientation_rule: "both_upright",
    theme: "빛나는 재물의 시작",
    meaning: "밝고 긍정적인 에너지 속에서 새로운 재물 기회가 열리는 시기.",
    vectors: { growth: 0.88, risk: 0.0, stability: 0.6, transition: 0.5, emotion: 0.7, career: 0.8, money: 0.92 },
    strength: 0.88,
    topics: ["money", "career"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P132",
    cards: ["The Chariot", "The World"],
    orientation_rule: "any",
    theme: "의지로 이룬 완성",
    meaning: "강한 의지와 집중력으로 마침내 목표를 완성하는 승리의 조합.",
    vectors: { growth: 0.92, risk: 0.1, stability: 0.8, transition: 0.5, emotion: 0.6, career: 0.95, money: 0.6 },
    strength: 0.90,
    topics: ["career", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P133",
    cards: ["The Empress", "The Sun"],
    orientation_rule: "both_upright",
    theme: "생명력 넘치는 풍요",
    meaning: "자연스럽고 풍요로운 창조 에너지. 임신, 출산, 창작 활동에 최적.",
    vectors: { growth: 0.9, risk: -0.1, stability: 0.85, transition: 0.4, emotion: 0.92, career: 0.5, money: 0.7 },
    strength: 0.88,
    topics: ["family", "general_future", "money"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P134",
    cards: ["Three of Cups", "Nine of Cups"],
    orientation_rule: "both_upright",
    theme: "함께하는 기쁨의 완성",
    meaning: "소중한 사람들과 함께 소원이 이루어지는 따뜻하고 행복한 시기.",
    vectors: { growth: 0.75, risk: -0.1, stability: 0.85, transition: 0.2, emotion: 0.98, career: 0.3 },
    strength: 0.85,
    topics: ["relationship", "family", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P135",
    cards: ["The Fool", "The Sun"],
    orientation_rule: "both_upright",
    theme: "순수한 기쁨의 출발",
    meaning: "아무런 두려움 없이 기쁨으로 가득 찬 새로운 시작. 최고의 출발 조합.",
    vectors: { growth: 0.95, risk: 0.1, stability: 0.3, transition: 0.9, emotion: 0.95, career: 0.7 },
    strength: 0.90,
    topics: ["life_change", "general_future"],
    timing_bias: "immediate",
    risk_level: "low"
  },
  {
    id: "P136",
    cards: ["Six of Wands", "The World"],
    orientation_rule: "both_upright",
    theme: "사회적 성공과 완성",
    meaning: "외부의 인정과 완전한 성취가 결합된 커리어 최고점.",
    vectors: { growth: 0.9, risk: 0.0, stability: 0.88, transition: 0.3, emotion: 0.7, career: 0.98, money: 0.7 },
    strength: 0.92,
    topics: ["career", "general_future"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P137",
    cards: ["Temperance", "The Star"],
    orientation_rule: "both_upright",
    theme: "조화로운 치유와 희망",
    meaning: "균형 잡힌 흐름 속에서 천천히 치유되며 희망이 자라나는 평화로운 상태.",
    vectors: { growth: 0.75, risk: -0.1, stability: 0.85, transition: 0.3, emotion: 0.82, career: 0.4 },
    strength: 0.82,
    topics: ["health", "general_future"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P138",
    cards: ["Strength", "The World"],
    orientation_rule: "any",
    theme: "인내로 이룬 완성",
    meaning: "오랜 인내와 내면의 힘으로 마침내 완성에 도달하는 성숙한 성취.",
    vectors: { growth: 0.88, risk: 0.0, stability: 0.9, transition: 0.4, emotion: 0.7, career: 0.85 },
    strength: 0.88,
    topics: ["general_future", "career", "health"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P139",
    cards: ["The Emperor", "The Sun"],
    orientation_rule: "both_upright",
    theme: "권위 있는 성공",
    meaning: "강한 리더십과 밝은 에너지로 사회적 권위와 성공을 동시에 얻는 조합.",
    vectors: { growth: 0.85, risk: 0.1, stability: 0.9, transition: 0.3, emotion: 0.6, career: 0.95, money: 0.7 },
    strength: 0.90,
    topics: ["career", "general_future"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P140",
    cards: ["Eight of Pentacles", "The Sun"],
    orientation_rule: "any",
    theme: "노력이 빛이 되는 순간",
    meaning: "꾸준한 기술 연마가 빛나는 성과로 드러나는 보람 있는 시기.",
    vectors: { growth: 0.88, risk: 0.0, stability: 0.7, transition: 0.4, emotion: 0.7, career: 0.92, money: 0.65 },
    strength: 0.85,
    topics: ["career", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P141",
    cards: ["The Hierophant", "The World"],
    orientation_rule: "any",
    theme: "전통적 방식의 완성",
    meaning: "기존 제도와 전통적 방법을 따른 노력이 완전한 성취로 이어짐.",
    vectors: { growth: 0.7, risk: 0.0, stability: 0.92, transition: 0.3, emotion: 0.5, career: 0.8, money: 0.6 },
    strength: 0.80,
    topics: ["career", "general_future"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P142",
    cards: ["Ace of Cups", "The World"],
    orientation_rule: "any",
    theme: "감정의 완전한 충족",
    meaning: "감정적 풍요와 삶의 완성이 결합된 깊은 만족감.",
    vectors: { growth: 0.85, risk: -0.1, stability: 0.88, transition: 0.4, emotion: 0.98, career: 0.4 },
    strength: 0.88,
    topics: ["relationship", "general_future"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P143",
    cards: ["The Magician", "The Sun"],
    orientation_rule: "both_upright",
    theme: "능력과 기쁨의 최고점",
    meaning: "모든 능력이 최대로 발휘되며 기쁨과 성공이 넘치는 최상의 상태.",
    vectors: { growth: 0.95, risk: 0.0, stability: 0.8, transition: 0.5, emotion: 0.88, career: 0.98, money: 0.75 },
    strength: 0.95,
    topics: ["career", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P144",
    cards: ["Justice", "The World"],
    orientation_rule: "any",
    theme: "공정한 완성",
    meaning: "정당한 노력이 공정하게 평가되어 완전한 성취로 이어지는 조합.",
    vectors: { growth: 0.8, risk: 0.0, stability: 0.9, transition: 0.3, emotion: 0.6, career: 0.88, money: 0.65 },
    strength: 0.85,
    topics: ["career", "general_future"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P145",
    cards: ["Four of Wands", "The World"],
    orientation_rule: "both_upright",
    theme: "축하받는 완성",
    meaning: "중요한 목표를 달성하고 주변의 축하를 받는 행복한 완성의 순간.",
    vectors: { growth: 0.88, risk: 0.0, stability: 0.92, transition: 0.4, emotion: 0.92, career: 0.8, money: 0.6 },
    strength: 0.90,
    topics: ["general_future", "career", "family"],
    timing_bias: "medium",
    risk_level: "low"
  },

  // ── 영적/내면 20패턴 ──────────────────────────────────────────
  {
    id: "P146",
    cards: ["The High Priestess", "The Hermit"],
    orientation_rule: "any",
    theme: "깊은 내면 탐구",
    meaning: "직관과 고독한 성찰이 결합된 깊은 영적 여정. 외부보다 내면에 답이 있음.",
    vectors: { growth: 0.4, risk: 0.0, stability: 0.6, transition: 0.3, emotion: 0.5, career: 0.1 },
    strength: 0.72,
    topics: ["general_future", "health"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P147",
    cards: ["The Moon", "The High Priestess"],
    orientation_rule: "any",
    theme: "무의식의 메시지",
    meaning: "꿈, 직관, 무의식이 강하게 작용하는 시기. 내면의 신호에 귀 기울여야 함.",
    vectors: { growth: 0.3, risk: 0.3, stability: 0.2, transition: 0.4, emotion: 0.5, career: 0.1 },
    strength: 0.70,
    topics: ["general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P148",
    cards: ["The Star", "The High Priestess"],
    orientation_rule: "any",
    theme: "영적 치유와 직관",
    meaning: "깊은 직관이 치유의 방향을 안내하는 영적으로 깨어있는 상태.",
    vectors: { growth: 0.6, risk: 0.0, stability: 0.65, transition: 0.4, emotion: 0.75, career: 0.2 },
    strength: 0.75,
    topics: ["health", "general_future"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P149",
    cards: ["Judgement", "The High Priestess"],
    orientation_rule: "any",
    theme: "영적 각성과 직관",
    meaning: "깊은 내면의 지혜가 삶의 중요한 소명을 인식하게 해주는 영적 각성.",
    vectors: { growth: 0.7, risk: 0.1, stability: 0.5, transition: 0.7, emotion: 0.7, career: 0.4 },
    strength: 0.78,
    topics: ["life_change", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P150",
    cards: ["The Hermit", "The World"],
    orientation_rule: "any",
    theme: "고독한 여정의 완성",
    meaning: "혼자만의 긴 여정 끝에 완전한 깨달음과 성취를 얻는 조합.",
    vectors: { growth: 0.8, risk: 0.0, stability: 0.8, transition: 0.5, emotion: 0.6, career: 0.5 },
    strength: 0.80,
    topics: ["general_future", "life_change"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P151",
    cards: ["The Moon", "Temperance"],
    orientation_rule: "any",
    theme: "혼란 속 균형 찾기",
    meaning: "불확실하고 혼란스러운 상황에서 균형과 평정심을 유지하려는 노력.",
    vectors: { growth: 0.4, risk: 0.3, stability: 0.4, transition: 0.3, emotion: 0.2, career: 0.1 },
    strength: 0.68,
    topics: ["health", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P152",
    cards: ["The Hanged Man", "The High Priestess"],
    orientation_rule: "any",
    theme: "내려놓음과 직관",
    meaning: "모든 것을 내려놓고 내면의 지혜가 이끄는 대로 따르는 영적 상태.",
    vectors: { growth: 0.4, risk: 0.0, stability: 0.5, transition: 0.4, emotion: 0.5, career: 0.0 },
    strength: 0.68,
    topics: ["general_future", "health"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P153",
    cards: ["The Star", "Temperance"],
    orientation_rule: "both_upright",
    theme: "치유와 희망의 조화",
    meaning: "천천히 그리고 균형 있게 치유되며 희망이 자라나는 평화로운 여정.",
    vectors: { growth: 0.75, risk: -0.1, stability: 0.85, transition: 0.3, emotion: 0.82, career: 0.3 },
    strength: 0.82,
    topics: ["health", "general_future"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P154",
    cards: ["The World", "The High Priestess"],
    orientation_rule: "any",
    theme: "완성된 지혜",
    meaning: "삶의 완성 단계에서 깊은 내면의 지혜가 빛을 발하는 성숙한 에너지.",
    vectors: { growth: 0.8, risk: 0.0, stability: 0.88, transition: 0.3, emotion: 0.75, career: 0.5 },
    strength: 0.82,
    topics: ["general_future"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P155",
    cards: ["The Hermit", "Judgement"],
    orientation_rule: "any",
    theme: "성찰과 부활",
    meaning: "깊은 고독과 성찰 후에 찾아오는 새로운 소명과 재탄생.",
    vectors: { growth: 0.75, risk: 0.1, stability: 0.5, transition: 0.8, emotion: 0.6, career: 0.6 },
    strength: 0.78,
    topics: ["life_change", "general_future"],
    timing_bias: "long",
    risk_level: "low"
  },

  // ── 건강/회복 15패턴 ──────────────────────────────────────────
  {
    id: "P156",
    cards: ["The Star", "Temperance"],
    orientation_rule: "both_upright",
    theme: "완전한 치유",
    meaning: "조화롭고 희망찬 에너지가 결합된 최고의 건강 회복 조합.",
    vectors: { growth: 0.8, risk: -0.1, stability: 0.88, transition: 0.3, emotion: 0.85, career: 0.3 },
    strength: 0.85,
    topics: ["health"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P157",
    cards: ["The Sun", "Strength"],
    orientation_rule: "both_upright",
    theme: "활력과 생명력",
    meaning: "강한 생명력과 밝은 에너지가 결합된 최고의 건강 에너지.",
    vectors: { growth: 0.9, risk: -0.1, stability: 0.85, transition: 0.3, emotion: 0.88, career: 0.6 },
    strength: 0.88,
    topics: ["health", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P158",
    cards: ["The Tower", "Strength"],
    orientation_rule: "any",
    theme: "위기 속 내면의 힘",
    meaning: "건강 위기나 충격적 상황에서 내면의 강인함으로 버텨내는 에너지.",
    vectors: { growth: 0.5, risk: 0.6, stability: -0.2, transition: 0.6, emotion: 0.2, career: 0.2 },
    strength: 0.75,
    topics: ["health", "life_change"],
    timing_bias: "short",
    risk_level: "medium"
  },
  {
    id: "P159",
    cards: ["The Hermit", "Temperance"],
    orientation_rule: "any",
    theme: "조용한 회복",
    meaning: "혼자만의 시간과 균형 잡힌 생활로 천천히 건강을 회복하는 흐름.",
    vectors: { growth: 0.5, risk: 0.0, stability: 0.75, transition: 0.2, emotion: 0.4, career: 0.1 },
    strength: 0.72,
    topics: ["health"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P160",
    cards: ["Nine of Swords", "Temperance"],
    orientation_rule: "any",
    theme: "불안에서 균형으로",
    meaning: "극심한 불안과 걱정이 균형과 평정심으로 서서히 전환되는 회복 과정.",
    vectors: { growth: 0.5, risk: 0.3, stability: 0.4, transition: 0.5, emotion: 0.3, career: 0.1 },
    strength: 0.72,
    topics: ["health", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },

  // ── 건강/회복 추가 10패턴 ─────────────────────────────────────
  {
    id: "P161",
    cards: ["The Moon", "Strength"],
    orientation_rule: "any",
    theme: "두려움을 극복하는 힘",
    meaning: "내면의 두려움과 불안을 강인한 의지로 극복해나가는 용기 있는 여정.",
    vectors: { growth: 0.6, risk: 0.4, stability: 0.2, transition: 0.5, emotion: 0.3, career: 0.2 },
    strength: 0.73,
    topics: ["health", "general_future"],
    timing_bias: "medium",
    risk_level: "medium"
  },
  {
    id: "P162",
    cards: ["Five of Cups", "Temperance"],
    orientation_rule: "any",
    theme: "슬픔의 치유",
    meaning: "감정적 상실 후 균형을 찾아가는 치유의 과정. 시간이 약이 되는 흐름.",
    vectors: { growth: 0.5, risk: 0.1, stability: 0.5, transition: 0.5, emotion: 0.3, career: 0.1 },
    strength: 0.70,
    topics: ["health", "relationship"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P163",
    cards: ["The Devil", "Strength"],
    orientation_rule: "any",
    theme: "중독 극복",
    meaning: "집착이나 중독적 패턴을 강인한 내면의 힘으로 극복하려는 싸움.",
    vectors: { growth: 0.5, risk: 0.5, stability: 0.1, transition: 0.5, emotion: 0.2, career: 0.1 },
    strength: 0.73,
    topics: ["health", "life_change"],
    timing_bias: "long",
    risk_level: "medium"
  },
  {
    id: "P164",
    cards: ["Ten of Wands", "The Hermit"],
    orientation_rule: "any",
    theme: "짐을 내려놓고 쉬기",
    meaning: "과도한 부담을 내려놓고 혼자만의 회복 시간을 갖는 것이 필요한 시기.",
    vectors: { growth: 0.4, risk: 0.1, stability: 0.5, transition: 0.4, emotion: 0.3, career: -0.1 },
    strength: 0.68,
    topics: ["health", "career"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P165",
    cards: ["The Star", "The Sun"],
    orientation_rule: "both_upright",
    theme: "완전한 치유와 활력",
    meaning: "희망과 생명력이 결합된 최고의 건강 에너지. 완치와 회복의 최상 조합.",
    vectors: { growth: 0.92, risk: -0.2, stability: 0.88, transition: 0.3, emotion: 0.92, career: 0.5 },
    strength: 0.90,
    topics: ["health", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P166",
    cards: ["Four of Swords", "The Star"],
    orientation_rule: "any",
    theme: "휴식 후 희망",
    meaning: "충분한 휴식과 회복 뒤에 밝은 미래가 펼쳐지는 흐름.",
    vectors: { growth: 0.65, risk: 0.0, stability: 0.7, transition: 0.5, emotion: 0.65, career: 0.3 },
    strength: 0.75,
    topics: ["health", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P167",
    cards: ["Four of Swords", "Temperance"],
    orientation_rule: "any",
    theme: "깊은 휴식과 균형",
    meaning: "완전한 휴식과 균형 있는 회복이 결합된 최적의 건강 회복 상태.",
    vectors: { growth: 0.5, risk: -0.1, stability: 0.82, transition: 0.2, emotion: 0.5, career: 0.0 },
    strength: 0.73,
    topics: ["health"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P168",
    cards: ["The Empress", "Temperance"],
    orientation_rule: "any",
    theme: "자연적 치유와 풍요",
    meaning: "자연의 리듬에 따른 균형 있는 생활로 몸과 마음이 치유되는 흐름.",
    vectors: { growth: 0.7, risk: -0.1, stability: 0.82, transition: 0.2, emotion: 0.75, career: 0.3, money: 0.4 },
    strength: 0.78,
    topics: ["health", "general_future"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P169",
    cards: ["Strength", "The Hermit"],
    orientation_rule: "any",
    theme: "고독한 강인함",
    meaning: "혼자만의 시간 속에서 내면의 강인함을 키워가는 성숙한 회복 과정.",
    vectors: { growth: 0.6, risk: 0.0, stability: 0.7, transition: 0.3, emotion: 0.4, career: 0.3 },
    strength: 0.72,
    topics: ["health", "general_future"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P170",
    cards: ["The Moon", "Four of Swords"],
    orientation_rule: "any",
    theme: "불안 속 강제 휴식",
    meaning: "불안하고 혼란스럽지만 강제로 멈추고 쉬어야 하는 상황. 회복에 필수.",
    vectors: { growth: 0.2, risk: 0.4, stability: 0.1, transition: 0.3, emotion: -0.2, career: -0.1 },
    strength: 0.65,
    topics: ["health"],
    timing_bias: "short",
    risk_level: "medium"
  },

  // ── 마이너+마이너 특수 조합 30패턴 ───────────────────────────
  {
    id: "P171",
    cards: ["Ace of Wands", "Ace of Cups"],
    orientation_rule: "both_upright",
    theme: "열정과 감정의 동시 개화",
    meaning: "새로운 열정과 새로운 감정이 동시에 시작되는 놀라운 에너지의 조합.",
    vectors: { growth: 0.92, risk: 0.2, stability: 0.1, transition: 0.85, emotion: 0.88, career: 0.7 },
    strength: 0.88,
    topics: ["life_change", "relationship"],
    timing_bias: "immediate",
    risk_level: "low"
  },
  {
    id: "P172",
    cards: ["Ace of Swords", "Ace of Pentacles"],
    orientation_rule: "both_upright",
    theme: "명확한 새로운 재물 기회",
    meaning: "명확한 아이디어와 실질적 재물 기회가 동시에 시작되는 강력한 조합.",
    vectors: { growth: 0.88, risk: 0.2, stability: 0.5, transition: 0.7, emotion: 0.2, career: 0.88, money: 0.88 },
    strength: 0.88,
    topics: ["career", "money"],
    timing_bias: "immediate",
    risk_level: "low"
  },
  {
    id: "P173",
    cards: ["Seven of Cups", "Two of Swords"],
    orientation_rule: "any",
    theme: "선택 장애",
    meaning: "너무 많은 선택지와 우유부단함이 결합되어 아무 결정도 못 하는 상태.",
    vectors: { growth: -0.3, risk: 0.4, stability: -0.2, transition: 0.1, emotion: -0.2, career: -0.3 },
    strength: 0.68,
    topics: ["general_future", "career"],
    timing_bias: "short",
    risk_level: "medium"
  },
  {
    id: "P174",
    cards: ["Three of Pentacles", "Six of Wands"],
    orientation_rule: "any",
    theme: "팀의 공개적 성공",
    meaning: "협력을 통해 이룬 성과가 외부에서 인정받는 팀 성공의 조합.",
    vectors: { growth: 0.85, risk: 0.1, stability: 0.7, transition: 0.3, emotion: 0.5, career: 0.92 },
    strength: 0.83,
    topics: ["career"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P175",
    cards: ["Five of Wands", "Five of Swords"],
    orientation_rule: "any",
    theme: "혼돈과 갈등의 극한",
    meaning: "무질서한 경쟁과 냉혹한 승부가 결합된 극도로 소모적인 갈등 상황.",
    vectors: { growth: -0.4, risk: 0.9, stability: -0.7, transition: 0.3, emotion: -0.5, career: -0.5 },
    strength: 0.82,
    topics: ["career", "relationship"],
    timing_bias: "short",
    risk_level: "high"
  },
  {
    id: "P176",
    cards: ["Nine of Cups", "Six of Wands"],
    orientation_rule: "both_upright",
    theme: "소원 성취와 사회적 인정",
    meaning: "개인적 소원이 이루어지고 사회적으로도 인정받는 이중의 기쁨.",
    vectors: { growth: 0.88, risk: 0.0, stability: 0.82, transition: 0.3, emotion: 0.92, career: 0.85, money: 0.55 },
    strength: 0.88,
    topics: ["career", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P177",
    cards: ["Four of Cups", "Five of Cups"],
    orientation_rule: "any",
    theme: "무감각한 상실",
    meaning: "감정적 무감각 상태에서 상실이 겹치는 깊은 우울과 무기력.",
    vectors: { growth: -0.2, risk: 0.3, stability: -0.3, transition: 0.2, emotion: -0.75, career: -0.2 },
    strength: 0.70,
    topics: ["health", "relationship"],
    timing_bias: "medium",
    risk_level: "medium"
  },
  {
    id: "P178",
    cards: ["Eight of Wands", "Six of Wands"],
    orientation_rule: "any",
    theme: "빠른 성공",
    meaning: "빠른 속도로 목표에 도달하고 그 성과를 인정받는 순조로운 성공.",
    vectors: { growth: 0.88, risk: 0.2, stability: 0.5, transition: 0.6, emotion: 0.5, career: 0.92, money: 0.6 },
    strength: 0.85,
    topics: ["career"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P179",
    cards: ["Two of Cups", "Six of Cups"],
    orientation_rule: "any",
    theme: "오래된 사랑의 완성",
    meaning: "오랜 시간을 함께한 인연이 깊은 감정적 결합으로 완성되는 흐름.",
    vectors: { growth: 0.65, risk: 0.0, stability: 0.82, transition: 0.3, emotion: 0.92, career: 0.1 },
    strength: 0.80,
    topics: ["relationship"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P180",
    cards: ["Three of Swords", "Six of Swords"],
    orientation_rule: "any",
    theme: "상처를 안고 떠남",
    meaning: "감정적 상처를 가슴에 품은 채로 더 나은 곳을 향해 떠나는 힘든 여정.",
    vectors: { growth: 0.4, risk: 0.3, stability: 0.0, transition: 0.7, emotion: -0.4, career: 0.1 },
    strength: 0.70,
    topics: ["relationship", "life_change"],
    timing_bias: "medium",
    risk_level: "medium"
  },
  {
    id: "P181",
    cards: ["Ace of Pentacles", "Three of Pentacles"],
    orientation_rule: "any",
    theme: "협력으로 시작하는 사업",
    meaning: "새로운 재물 기회를 팀워크와 협력으로 키워나가는 사업 초기 에너지.",
    vectors: { growth: 0.82, risk: 0.2, stability: 0.6, transition: 0.5, emotion: 0.2, career: 0.85, money: 0.82 },
    strength: 0.82,
    topics: ["career", "money"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P182",
    cards: ["Ten of Cups", "Nine of Pentacles"],
    orientation_rule: "both_upright",
    theme: "감정적·물질적 독립 풍요",
    meaning: "가정의 행복과 개인의 물질적 독립이 동시에 이루어진 완전한 풍요.",
    vectors: { growth: 0.85, risk: -0.1, stability: 0.95, transition: 0.2, emotion: 0.95, career: 0.7, money: 0.92 },
    strength: 0.92,
    topics: ["family", "money", "general_future"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P183",
    cards: ["Seven of Wands", "Five of Wands"],
    orientation_rule: "any",
    theme: "방어적 경쟁",
    meaning: "여러 방면에서 공격을 받으면서도 자신의 위치를 지키려는 소모적 싸움.",
    vectors: { growth: 0.3, risk: 0.75, stability: -0.2, transition: 0.3, emotion: -0.2, career: 0.2 },
    strength: 0.72,
    topics: ["career"],
    timing_bias: "short",
    risk_level: "medium"
  },
  {
    id: "P184",
    cards: ["Eight of Cups", "Six of Swords"],
    orientation_rule: "any",
    theme: "결연한 이별과 전진",
    meaning: "더 이상 미련 없이 과거를 떠나 새로운 곳으로 나아가는 결단.",
    vectors: { growth: 0.6, risk: 0.2, stability: 0.2, transition: 0.85, emotion: 0.0, career: 0.3 },
    strength: 0.73,
    topics: ["relationship", "life_change"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P185",
    cards: ["Two of Wands", "Three of Wands"],
    orientation_rule: "any",
    theme: "계획에서 실행으로",
    meaning: "미래를 계획하고 그 계획이 구체적인 실행 단계로 발전하는 진취적 흐름.",
    vectors: { growth: 0.82, risk: 0.2, stability: 0.4, transition: 0.6, emotion: 0.3, career: 0.85, money: 0.55 },
    strength: 0.78,
    topics: ["career", "life_change"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P186",
    cards: ["Page of Swords", "Ace of Swords"],
    orientation_rule: "any",
    theme: "날카로운 새 아이디어",
    meaning: "호기심 많은 탐구 에너지와 날카로운 새 아이디어가 결합되는 지적 출발.",
    vectors: { growth: 0.75, risk: 0.3, stability: 0.2, transition: 0.6, emotion: 0.1, career: 0.72 },
    strength: 0.72,
    topics: ["career", "general_future"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P187",
    cards: ["Knight of Swords", "Five of Wands"],
    orientation_rule: "any",
    theme: "무모한 돌진",
    meaning: "생각 없이 빠르게 돌진하다가 혼란스러운 상황에 부딪히는 위험한 에너지.",
    vectors: { growth: 0.3, risk: 0.75, stability: -0.4, transition: 0.5, emotion: -0.1, career: 0.2 },
    strength: 0.70,
    topics: ["career", "life_change"],
    timing_bias: "immediate",
    risk_level: "high"
  },
  {
    id: "P188",
    cards: ["Queen of Swords", "Justice"],
    orientation_rule: "any",
    theme: "냉철한 공정함",
    meaning: "감정에 흔들리지 않는 냉철한 판단력과 공정함이 결합된 강력한 에너지.",
    vectors: { growth: 0.6, risk: 0.1, stability: 0.82, transition: 0.2, emotion: 0.1, career: 0.78 },
    strength: 0.75,
    topics: ["career", "general_future"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P189",
    cards: ["King of Swords", "The Emperor"],
    orientation_rule: "both_upright",
    theme: "지성과 권위의 결합",
    meaning: "냉철한 지성과 강한 권위가 결합된 최고의 리더십과 결정력.",
    vectors: { growth: 0.75, risk: 0.1, stability: 0.88, transition: 0.2, emotion: 0.1, career: 0.95 },
    strength: 0.85,
    topics: ["career"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P190",
    cards: ["Six of Wands", "Three of Pentacles"],
    orientation_rule: "any",
    theme: "팀의 영광",
    meaning: "함께 노력한 팀이 외부의 인정과 칭찬을 받는 협력의 결실.",
    vectors: { growth: 0.85, risk: 0.0, stability: 0.75, transition: 0.3, emotion: 0.6, career: 0.92 },
    strength: 0.83,
    topics: ["career"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P191",
    cards: ["Two of Pentacles", "Eight of Pentacles"],
    orientation_rule: "any",
    theme: "바쁜 성장",
    meaning: "여러 일을 동시에 처리하면서 꾸준히 기술을 연마하는 바쁘지만 성장하는 시기.",
    vectors: { growth: 0.75, risk: 0.2, stability: 0.5, transition: 0.3, emotion: 0.1, career: 0.82, money: 0.6 },
    strength: 0.73,
    topics: ["career"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P192",
    cards: ["Five of Cups", "Six of Cups"],
    orientation_rule: "any",
    theme: "슬픔 속 따뜻한 기억",
    meaning: "현재의 상실감 속에서 과거의 따뜻한 추억이 위로가 되는 감정적 흐름.",
    vectors: { growth: 0.3, risk: 0.1, stability: 0.2, transition: 0.4, emotion: 0.1, career: 0.0 },
    strength: 0.62,
    topics: ["relationship"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P193",
    cards: ["Four of Wands", "Nine of Cups"],
    orientation_rule: "both_upright",
    theme: "안정된 기쁨과 만족",
    meaning: "안정적인 환경에서 소원이 이루어지는 완전히 행복하고 만족스러운 상태.",
    vectors: { growth: 0.8, risk: -0.1, stability: 0.92, transition: 0.2, emotion: 0.95, career: 0.5, money: 0.5 },
    strength: 0.88,
    topics: ["general_future", "relationship"],
    timing_bias: "medium",
    risk_level: "low"
  },
  {
    id: "P194",
    cards: ["Seven of Pentacles", "Three of Wands"],
    orientation_rule: "any",
    theme: "장기 투자의 확장",
    meaning: "인내 있는 투자가 더 큰 미래를 향한 확장으로 이어지는 성장 에너지.",
    vectors: { growth: 0.78, risk: 0.2, stability: 0.6, transition: 0.5, emotion: 0.2, career: 0.78, money: 0.72 },
    strength: 0.75,
    topics: ["money", "career"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P195",
    cards: ["Ace of Cups", "Three of Cups"],
    orientation_rule: "any",
    theme: "사랑의 시작과 축하",
    meaning: "새로운 감정의 시작이 주변 사람들의 축하와 기쁨 속에서 펼쳐지는 조합.",
    vectors: { growth: 0.78, risk: 0.0, stability: 0.6, transition: 0.5, emotion: 0.95, career: 0.1 },
    strength: 0.82,
    topics: ["relationship"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P196",
    cards: ["Eight of Wands", "Three of Pentacles"],
    orientation_rule: "any",
    theme: "빠른 협력 성과",
    meaning: "팀워크와 빠른 실행력이 결합되어 단시간에 좋은 성과를 내는 에너지.",
    vectors: { growth: 0.85, risk: 0.2, stability: 0.5, transition: 0.5, emotion: 0.2, career: 0.88, money: 0.65 },
    strength: 0.80,
    topics: ["career"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P197",
    cards: ["Two of Cups", "Ten of Cups"],
    orientation_rule: "any",
    theme: "사랑의 완성",
    meaning: "두 사람의 깊은 감정적 결합이 완전한 가정의 행복으로 완성되는 흐름.",
    vectors: { growth: 0.82, risk: -0.1, stability: 0.92, transition: 0.3, emotion: 0.98, career: 0.2 },
    strength: 0.90,
    topics: ["relationship", "family"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P198",
    cards: ["Nine of Pentacles", "Six of Wands"],
    orientation_rule: "any",
    theme: "독립적 성공의 인정",
    meaning: "혼자 이루어낸 물질적 성공이 사회적으로도 인정받는 완전한 성취.",
    vectors: { growth: 0.85, risk: 0.0, stability: 0.88, transition: 0.2, emotion: 0.7, career: 0.88, money: 0.88 },
    strength: 0.88,
    topics: ["career", "money"],
    timing_bias: "long",
    risk_level: "low"
  },
  {
    id: "P199",
    cards: ["Ace of Pentacles", "Six of Pentacles"],
    orientation_rule: "both_upright",
    theme: "시작부터 나누는 풍요",
    meaning: "새로운 재물이 시작되자마자 나눔과 순환으로 더욱 커지는 복된 흐름.",
    vectors: { growth: 0.82, risk: 0.0, stability: 0.72, transition: 0.4, emotion: 0.4, career: 0.72, money: 0.88 },
    strength: 0.80,
    topics: ["money", "general_future"],
    timing_bias: "short",
    risk_level: "low"
  },
  {
    id: "P200",
    cards: ["The World", "Nine of Cups"],
    orientation_rule: "both_upright",
    theme: "완전한 소원 성취",
    meaning: "삶의 완성과 모든 소원의 실현이 동시에 이루어지는 최고의 행운 조합.",
    vectors: { growth: 0.98, risk: -0.2, stability: 0.98, transition: 0.3, emotion: 0.98, career: 0.88, money: 0.88 },
    strength: 0.98,
    topics: ["general_future", "relationship", "money", "career"],
    timing_bias: "long",
    risk_level: "low"
  }
];

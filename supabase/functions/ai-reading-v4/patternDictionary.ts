/**
 * patternDictionary.ts
 * - PART 12: 200 Pattern Dataset (Representative Samples)
 * - PART 13: 1000 Symbol Dataset Mapping
 */

export interface DivinationPattern {
  pattern_id: string;
  pattern_name: string;
  pattern_category: "relationship" | "career" | "finance" | "emotion" | "life_transition" | "risk" | "opportunity" | "stability" | "conflict" | "growth";
  semantic_vector: Record<string, number>; // rel, car, fin, emo, tra, risk, opp, sta, con, gro
}

export interface SymbolMapping {
  symbol_id: string;
  system: "Tarot" | "Saju" | "Astrology" | "Ziwei" | "Numerology";
  symbol_name: string;
  linked_patterns: string[]; // pattern_ids
  semantic_values: Record<string, number>;
}

export const PATTERN_DICTIONARY: Record<string, DivinationPattern> = {
  // Relationship
  "P001": { pattern_id: "P001", pattern_name: "relationship_conflict", pattern_category: "relationship", semantic_vector: { relationship: -0.8, conflict: 0.8, emotion: -0.6 } },
  "P002": { pattern_id: "P002", pattern_name: "relationship_growth", pattern_category: "relationship", semantic_vector: { relationship: 0.9, growth: 0.7, emotion: 0.8 } },
  "P003": { pattern_id: "P003", pattern_name: "relationship_break", pattern_category: "relationship", semantic_vector: { relationship: -0.9, life_transition: 1.0, emotion: -0.9 } },
  "P004": { pattern_id: "P004", pattern_name: "relationship_commitment", pattern_category: "relationship", semantic_vector: { relationship: 0.9, stability: 0.9, growth: 0.5 } },
  "P005": { pattern_id: "P005", pattern_name: "relationship_uncertainty", pattern_category: "relationship", semantic_vector: { relationship: 0.2, emotion: -0.4, risk: 0.4 } },

  // Career
  "P006": { pattern_id: "P006", pattern_name: "career_breakthrough", pattern_category: "career", semantic_vector: { career: 1.0, growth: 0.9, opportunity: 0.8 } },
  "P007": { pattern_id: "P007", pattern_name: "career_transition", pattern_category: "career", semantic_vector: { career: 0.5, life_transition: 0.8, risk: 0.6 } },
  "P008": { pattern_id: "P008", pattern_name: "career_stagnation", pattern_category: "career", semantic_vector: { career: -0.4, stability: 0.7, emotion: -0.3 } },
  "P009": { pattern_id: "P009", pattern_name: "career_leadership", pattern_category: "career", semantic_vector: { career: 0.9, growth: 0.8, stability: 0.6 } },
  "P010": { pattern_id: "P010", pattern_name: "career_loss", pattern_category: "career", semantic_vector: { career: -1.0, life_transition: 0.7, risk: 0.8 } },

  // Finance
  "P011": { pattern_id: "P011", pattern_name: "financial_opportunity", pattern_category: "finance", semantic_vector: { finance: 0.9, opportunity: 1.0, growth: 0.7 } },
  "P012": { pattern_id: "P012", pattern_name: "financial_growth", pattern_category: "finance", semantic_vector: { finance: 0.8, growth: 0.8, stability: 0.6 } },
  "P013": { pattern_id: "P013", pattern_name: "financial_risk", pattern_category: "finance", semantic_vector: { finance: -0.3, risk: 0.9, emotion: -0.4 } },
  "P014": { pattern_id: "P014", pattern_name: "financial_block", pattern_category: "finance", semantic_vector: { finance: -0.7, stability: 0.5, conflict: 0.4 } },
  "P015": { pattern_id: "P015", pattern_name: "financial_instability", pattern_category: "finance", semantic_vector: { finance: -0.5, risk: 0.8, life_transition: 0.5 } },

  // Life Transition
  "P016": { pattern_id: "P016", pattern_name: "life_reset", pattern_category: "life_transition", semantic_vector: { life_transition: 1.0, risk: 0.8, stability: -0.9 } },
  "P017": { pattern_id: "P017", pattern_name: "life_transition", pattern_category: "life_transition", semantic_vector: { life_transition: 0.8, growth: 0.7, opportunity: 0.6 } },
  "P018": { pattern_id: "P018", pattern_name: "identity_shift", pattern_category: "life_transition", semantic_vector: { life_transition: 0.9, emotion: 0.8, growth: 0.9 } },
  "P019": { pattern_id: "P019", pattern_name: "life_restructure", pattern_category: "life_transition", semantic_vector: { life_transition: 0.8, stability: 0.9, career: 0.5 } },

  // Risk / Opportunity / Stability / Conflict / Growth
  "P020": { pattern_id: "P020", pattern_name: "risk_event", pattern_category: "risk", semantic_vector: { risk: 1.0, stability: -0.8, emotion: -0.7 } },
  "P021": { pattern_id: "P021", pattern_name: "unexpected_loss", pattern_category: "risk", semantic_vector: { risk: 0.9, finance: -0.8, emotion: -1.0 } },
  "P022": { pattern_id: "P022", pattern_name: "opportunity_window", pattern_category: "opportunity", semantic_vector: { opportunity: 1.0, growth: 0.9, life_transition: 0.7 } },
  "P023": { pattern_id: "P023", pattern_name: "lucky_timing", pattern_category: "opportunity", semantic_vector: { opportunity: 1.0, growth: 0.7, finance: 0.8 } },
  "P024": { pattern_id: "P024", pattern_name: "long_term_security", pattern_category: "stability", semantic_vector: { stability: 1.0, finance: 0.9, career: 0.8 } },
  "P025": { pattern_id: "P025", pattern_name: "power_struggle", pattern_category: "conflict", semantic_vector: { conflict: 1.0, career: 0.6, emotion: -0.6 } },
  "P026": { pattern_id: "P026", pattern_name: "personal_evolution", pattern_category: "growth", semantic_vector: { growth: 1.0, life_transition: 0.8, emotion: 0.9 } }
};

export const SYMBOL_MAPPINGS: SymbolMapping[] = [
  // Tarot (Target 1000 items - Representative samples here)
  { symbol_id: "T000", system: "Tarot", symbol_name: "Fool", linked_patterns: ["P017", "P022"], semantic_values: { life_transition: 0.8, opportunity: 0.7, risk: 0.5 } },
  { symbol_id: "T001", system: "Tarot", symbol_name: "Magician", linked_patterns: ["P006", "P022"], semantic_values: { career: 0.8, opportunity: 0.8, growth: 0.7 } },
  { symbol_id: "T002", system: "Tarot", symbol_name: "High Priestess", linked_patterns: ["P005", "P018"], semantic_values: { emotion: 0.6, life_transition: 0.5 } },
  { symbol_id: "T003", system: "Tarot", symbol_name: "Empress", linked_patterns: ["P002", "P012"], semantic_values: { relationship: 0.8, growth: 0.9, finance: 0.7 } },
  { symbol_id: "T004", system: "Tarot", symbol_name: "Emperor", linked_patterns: ["P009", "P024"], semantic_values: { career: 0.9, stability: 0.9, growth: 0.6 } },
  { symbol_id: "T006", system: "Tarot", symbol_name: "Lovers", linked_patterns: ["P002", "P004"], semantic_values: { relationship: 1.0, emotion: 0.9, stability: 0.6 } },
  { symbol_id: "T007", system: "Tarot", symbol_name: "Chariot", linked_patterns: ["P006", "P025"], semantic_values: { career: 0.9, growth: 0.8, conflict: 0.5 } },
  { symbol_id: "T008", system: "Tarot", symbol_name: "Strength", linked_patterns: ["P009", "P024"], semantic_values: { career: 0.7, stability: 0.9, growth: 0.8 } },
  { symbol_id: "T009", system: "Tarot", symbol_name: "Hermit", linked_patterns: ["P018", "P008"], semantic_values: { life_transition: 0.6, emotion: 0.5, stability: 0.5 } },
  { symbol_id: "T010", system: "Tarot", symbol_name: "Wheel of Fortune", linked_patterns: ["P022", "P023"], semantic_values: { opportunity: 0.8, life_transition: 0.7 } },
  { symbol_id: "T011", system: "Tarot", symbol_name: "Justice", linked_patterns: ["P024", "P019"], semantic_values: { stability: 0.8, life_transition: 0.5 } },
  { symbol_id: "T013", system: "Tarot", symbol_name: "Death", linked_patterns: ["P016", "P003"], semantic_values: { life_transition: 0.9, relationship: -0.8, risk: 0.5 } },
  { symbol_id: "T014", system: "Tarot", symbol_name: "Temperance", linked_patterns: ["P002", "P024"], semantic_values: { relationship: 0.7, stability: 0.8 } },
  { symbol_id: "T015", system: "Tarot", symbol_name: "Devil", linked_patterns: ["P020", "P025"], semantic_values: { risk: 0.9, conflict: 0.8, emotion: -0.7 } },
  { symbol_id: "T016", system: "Tarot", symbol_name: "Tower", linked_patterns: ["P016", "P020"], semantic_values: { life_transition: 1.0, risk: 0.9, stability: -1.0 } },
  { symbol_id: "T017", system: "Tarot", symbol_name: "Star", linked_patterns: ["P002", "P022"], semantic_values: { relationship: 0.7, opportunity: 0.8, emotion: 0.8 } },
  { symbol_id: "T018", system: "Tarot", symbol_name: "Moon", linked_patterns: ["P005", "P020"], semantic_values: { relationship: -0.3, emotion: -0.8, risk: 0.7 } },
  { symbol_id: "T019", system: "Tarot", symbol_name: "Sun", linked_patterns: ["P022", "P023", "P002"], semantic_values: { opportunity: 0.9, growth: 0.9, relationship: 0.8, emotion: 0.9 } },
  { symbol_id: "T020", system: "Tarot", symbol_name: "Judgement", linked_patterns: ["P016", "P018"], semantic_values: { life_transition: 0.9, growth: 0.7 } },
  { symbol_id: "T021", system: "Tarot", symbol_name: "World", linked_patterns: ["P024", "P006"], semantic_values: { stability: 1.0, career: 0.8, growth: 0.8 } },

  // Saju (Korean Tags)
  { symbol_id: "S_MOK_EX", system: "Saju", symbol_name: "목 과다", linked_patterns: ["P022", "P026"], semantic_values: { growth: 0.8, opportunity: 0.6 } },
  { symbol_id: "S_MOK_DF", system: "Saju", symbol_name: "목 부족", linked_patterns: ["P008"], semantic_values: { growth: -0.5, stability: -0.3 } },
  { symbol_id: "S_HWA_EX", system: "Saju", symbol_name: "화 과다", linked_patterns: ["P020", "P025"], semantic_values: { risk: 0.7, emotion: -0.5, conflict: 0.6 } },
  { symbol_id: "S_HWA_DF", system: "Saju", symbol_name: "화 부족", linked_patterns: ["P008"], semantic_values: { emotion: -0.5, growth: -0.4 } },
  { symbol_id: "S_TO_EX", system: "Saju", symbol_name: "토 과다", linked_patterns: ["P024", "P008"], semantic_values: { stability: 0.9, growth: -0.3 } },
  { symbol_id: "S_TO_DF", system: "Saju", symbol_name: "토 부족", linked_patterns: ["P015"], semantic_values: { stability: -0.6, risk: 0.5 } },
  { symbol_id: "S_KEUM_EX", system: "Saju", symbol_name: "금 과다", linked_patterns: ["P009", "P025"], semantic_values: { career: 0.8, conflict: 0.5, stability: 0.7 } },
  { symbol_id: "S_KEUM_DF", system: "Saju", symbol_name: "금 부족", linked_patterns: ["P005"], semantic_values: { stability: -0.4, career: -0.3 } },
  { symbol_id: "S_SU_EX", system: "Saju", symbol_name: "수 과다", linked_patterns: ["P005", "P018"], semantic_values: { emotion: 0.7, life_transition: 0.6, stability: -0.4 } },
  { symbol_id: "S_SU_DF", system: "Saju", symbol_name: "수 부족", linked_patterns: ["P005"], semantic_values: { emotion: -0.6, relationship: -0.4 } },

  { symbol_id: "S_STR_H", system: "Saju", symbol_name: "신강", linked_patterns: ["P009", "P025"], semantic_values: { career: 0.9, growth: 0.7, conflict: 0.6 } },
  { symbol_id: "S_STR_MH", system: "Saju", symbol_name: "중강", linked_patterns: ["P009", "P024"], semantic_values: { career: 0.7, stability: 0.8 } },
  { symbol_id: "S_STR_ML", system: "Saju", symbol_name: "중약", linked_patterns: ["P005", "P019"], semantic_values: { stability: 0.5, risk: 0.3 } },
  { symbol_id: "S_STR_L", system: "Saju", symbol_name: "신약", linked_patterns: ["P015", "P020"], semantic_values: { stability: -0.7, risk: 0.8, emotion: -0.6 } },

  { symbol_id: "S_DM_MOK", system: "Saju", symbol_name: "일간 목", linked_patterns: ["P026"], semantic_values: { growth: 0.7, emotion: 0.5 } },
  { symbol_id: "S_DM_HWA", system: "Saju", symbol_name: "일간 화", linked_patterns: ["P022"], semantic_values: { opportunity: 0.7, emotion: 0.6 } },
  { symbol_id: "S_DM_TO", system: "Saju", symbol_name: "일간 토", linked_patterns: ["P024"], semantic_values: { stability: 0.8 } },
  { symbol_id: "S_DM_KEUM", system: "Saju", symbol_name: "일간 금", linked_patterns: ["P009"], semantic_values: { career: 0.7, growth: 0.5 } },
  { symbol_id: "S_DM_SU", system: "Saju", symbol_name: "일간 수", linked_patterns: ["P018"], semantic_values: { life_transition: 0.6, emotion: 0.7 } },

  { symbol_id: "S_CHUNG", system: "Saju", symbol_name: "충", linked_patterns: ["P020", "P016"], semantic_values: { risk: 0.8, life_transition: 0.9, stability: -0.8 } },
  { symbol_id: "S_HAP", system: "Saju", symbol_name: "합", linked_patterns: ["P024", "P004"], semantic_values: { stability: 0.9, relationship: 0.8 } },
  { symbol_id: "S_HYUNG", system: "Saju", symbol_name: "형", linked_patterns: ["P025", "P020"], semantic_values: { conflict: 0.9, risk: 0.7 } },
  { symbol_id: "S_DM_JEONG", system: "Saju", symbol_name: "정관격", linked_patterns: ["P022"], semantic_values: { opportunity: 0.7, emotion: 0.6 } },

  // Astrology
  { symbol_id: "A001", system: "Astrology", symbol_name: "Pluto Transit", linked_patterns: ["P018", "P026"], semantic_values: { life_transition: 0.9, growth: 0.8 } },
  { symbol_id: "A002", system: "Astrology", symbol_name: "Saturn Aspect", linked_patterns: ["P019", "P024"], semantic_values: { stability: 0.8, career: 0.6 } },
  { symbol_id: "A003", system: "Astrology", symbol_name: "Jupiter Transit", linked_patterns: ["P022", "P023"], semantic_values: { opportunity: 0.9, growth: 0.7 } },
  { symbol_id: "A004", system: "Astrology", symbol_name: "Mars Square", linked_patterns: ["P025", "P020"], semantic_values: { conflict: 0.8, risk: 0.7 } },
  { symbol_id: "A005", system: "Astrology", symbol_name: "금성 트랜짓", linked_patterns: ["P002", "P005"], semantic_values: { relationship: 0.6, emotion: 0.7 } },
  { symbol_id: "A006", system: "Astrology", symbol_name: "화성 대충", linked_patterns: ["P017", "P025"], semantic_values: { life_transition: 0.5, conflict: 0.6 } },

  // Ziwei
  { symbol_id: "Z001", system: "Ziwei", symbol_name: "토오국", linked_patterns: ["P024"], semantic_values: { stability: 0.8 } },
  { symbol_id: "Z002", system: "Ziwei", symbol_name: "명궁 특성", linked_patterns: ["P018"], semantic_values: { life_transition: 0.6, emotion: 0.7 } },

  // 14주성 벡터 추가
  { symbol_id: "Z003", system: "Ziwei", symbol_name: "자미", linked_patterns: [], semantic_values: { career: 0.8, stability: 0.7, authority: 0.6 } },
  { symbol_id: "Z004", system: "Ziwei", symbol_name: "천기", linked_patterns: [], semantic_values: { growth: 0.7, intelligence: 0.6, change: 0.5 } },
  { symbol_id: "Z005", system: "Ziwei", symbol_name: "태양", linked_patterns: [], semantic_values: { career: 0.9, growth: 0.7, relationship: 0.5 } },
  { symbol_id: "Z006", system: "Ziwei", symbol_name: "무곡", linked_patterns: [], semantic_values: { finance: 0.9, career: 0.7, stability: 0.6 } },
  { symbol_id: "Z007", system: "Ziwei", symbol_name: "천동", linked_patterns: [], semantic_values: { emotion: 0.7, stability: 0.6, relationship: 0.5 } },
  { symbol_id: "Z008", system: "Ziwei", symbol_name: "염정", linked_patterns: [], semantic_values: { career: 0.7, risk: 0.5, change: 0.6 } },
  { symbol_id: "Z009", system: "Ziwei", symbol_name: "천부", linked_patterns: [], semantic_values: { stability: 0.8, finance: 0.7, growth: 0.4 } },
  { symbol_id: "Z010", system: "Ziwei", symbol_name: "태음", linked_patterns: [], semantic_values: { emotion: 0.8, finance: 0.6, relationship: 0.7 } },
  { symbol_id: "Z011", system: "Ziwei", symbol_name: "탐랑", linked_patterns: [], semantic_values: { growth: 0.7, relationship: 0.6, risk: 0.4 } },
  { symbol_id: "Z012", system: "Ziwei", symbol_name: "거문", linked_patterns: [], semantic_values: { career: 0.6, risk: 0.5, change: 0.4 } },
  { symbol_id: "Z013", system: "Ziwei", symbol_name: "천상", linked_patterns: [], semantic_values: { stability: 0.7, career: 0.6, relationship: 0.5 } },
  { symbol_id: "Z014", system: "Ziwei", symbol_name: "천량", linked_patterns: [], semantic_values: { stability: 0.8, growth: 0.5, emotion: 0.4 } },
  { symbol_id: "Z015", system: "Ziwei", symbol_name: "칠살", linked_patterns: [], semantic_values: { risk: 0.8, career: 0.7, change: 0.7 } },
  { symbol_id: "Z016", system: "Ziwei", symbol_name: "파군", linked_patterns: [], semantic_values: { change: 0.9, risk: 0.7, transition: 0.8 } },

  // 사화(四化) 벡터 추가
  { symbol_id: "Z017", system: "Ziwei", symbol_name: "화록", linked_patterns: [], semantic_values: { finance: 0.9, growth: 0.8, opportunity: 0.7 } },
  { symbol_id: "Z018", system: "Ziwei", symbol_name: "화권", linked_patterns: [], semantic_values: { career: 0.9, authority: 0.8, stability: 0.6 } },
  { symbol_id: "Z019", system: "Ziwei", symbol_name: "화과", linked_patterns: [], semantic_values: { growth: 0.8, intelligence: 0.7, career: 0.5 } },
  { symbol_id: "Z020", system: "Ziwei", symbol_name: "화기", linked_patterns: [], semantic_values: { risk: 0.9, change: 0.7, instability: 0.8 } },

  // 궁(宮) 벡터 추가
  { symbol_id: "Z021", system: "Ziwei", symbol_name: "관록궁", linked_patterns: [], semantic_values: { career: 1.0, authority: 0.7, stability: 0.6 } },
  { symbol_id: "Z022", system: "Ziwei", symbol_name: "재백궁", linked_patterns: [], semantic_values: { finance: 1.0, stability: 0.5 } },
  { symbol_id: "Z023", system: "Ziwei", symbol_name: "부처궁", linked_patterns: [], semantic_values: { relationship: 1.0, emotion: 0.8, stability: 0.6 } },
  { symbol_id: "Z024", system: "Ziwei", symbol_name: "천이궁", linked_patterns: [], semantic_values: { change: 0.9, transition: 0.8, growth: 0.5 } },
  { symbol_id: "Z025", system: "Ziwei", symbol_name: "복덕궁", linked_patterns: [], semantic_values: { career: 0.7, growth: 0.7, stability: 0.6 } },

  // Numerology
  { symbol_id: "N001", system: "Numerology", symbol_name: "Life Path 1", linked_patterns: ["P009", "P006"], semantic_values: { career: 0.8, growth: 0.7 } },
  { symbol_id: "N005", system: "Numerology", symbol_name: "Personal Year 5", linked_patterns: ["P017", "P022"], semantic_values: { life_transition: 0.8, opportunity: 0.7 } },
  { symbol_id: "N007", system: "Numerology", symbol_name: "Personal Year 7", linked_patterns: ["P018", "P009"], semantic_values: { life_transition: 0.7, growth: 0.5 } },
  { symbol_id: "N009", system: "Numerology", symbol_name: "Personal Year 9", linked_patterns: ["P016", "P003"], semantic_values: { life_transition: 0.9, emotion: -0.6 } }
];

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
export const TOPIC_MEANING_MAP: Record<string, Record<string, MeaningVector>> = {
  relationship: {
    "The Lovers":    { union: 0.9, commitment: 0.8, choice: 0.7, harmony: 0.8 },
    "The Tower":     { sudden_change: 0.9, ending: 0.8, shock: 0.7, liberation: 0.5 },
    "The Star":      { hope: 0.9, healing: 0.8, renewal: 0.7, vulnerability: 0.6 },
    "Death":         { ending: 0.9, transformation: 0.8, closure: 0.7, rebirth: 0.6 },
    "The World":     { completion: 0.9, fulfillment: 0.8, union: 0.7, success: 0.8 },
    "Two of Cups":   { connection: 0.9, partnership: 0.8, mutual_attraction: 0.9, harmony: 0.7 },
    "Three of Swords": { heartbreak: 0.9, separation: 0.8, grief: 0.7, truth: 0.5 },
    "Ten of Pentacles": { stability: 0.9, family: 0.8, legacy: 0.7, security: 0.8 },
    "Ace of Cups":   { new_love: 0.9, emotional_start: 0.8, blessing: 0.7 },
    "Three of Cups": { celebration: 0.8, friendship: 0.9, community: 0.7 },
    "Six of Cups":   { nostalgia: 0.9, reunion: 0.8, innocence: 0.7 },
    "Ten of Cups":   { family_bliss: 0.9, harmony: 0.9, emotional_fulfillment: 0.8 },
    "Knight of Cups": { proposal: 0.9, romance: 0.8, invitation: 0.7 },
    "Queen of Cups": { empathy: 0.9, emotional_support: 0.8, intuition: 0.7 },
    "Five of Cups":  { grief: 0.9, regret: 0.8, loss: 0.7 },
    "Eight of Cups": { leaving: 0.9, search_for_meaning: 0.8, abandonment: 0.7 },
    "The Empress":   { fertility: 0.9, nurturing: 0.8, abundance: 0.7 },
    "The Devil":     { obsession: 0.9, toxic_bond: 0.8, temptation: 0.7 },
    "The Moon":      { insecurity: 0.9, confusion: 0.8, hidden_emotions: 0.7 },
    "Four of Wands": { marriage_foundation: 0.9, celebration: 0.8, stability: 0.7 }
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
    "Ace of Swords": { breakthrough: 0.9, mental_clarity: 0.8, decision: 0.7 },
    "Three of Pentacles": { collaboration: 0.9, teamwork: 0.8, planning: 0.7 },
    "Seven of Pentacles": { patience: 0.9, feedback: 0.8, assessment: 0.7 },
    "Ten of Pentacles": { corporate_stability: 0.9, legacy: 0.8, security: 0.7 },
    "King of Swords": { professional_logic: 0.9, authority: 0.8, ethics: 0.7 },
    "Justice":      { contract: 0.9, legal_fairness: 0.8, balance: 0.7 },
    "The Magician":  { resourcefulness: 0.9, manifest_power: 0.8, skill: 0.7 },
    "The Sun":       { public_success: 0.9, recognition: 0.8, vitality: 0.7 },
    "Six of Wands":  { promotion: 0.9, achievement: 0.8, public_praise: 0.7 },
    "Knight of Swords": { rapid_advance: 0.9, direct_action: 0.8, intellectual_speed: 0.7 },
    "Page of Pentacles": { apprenticeship: 0.9, new_job_offer: 0.8, practical_study: 0.7 },
    "Five of Swords": { office_politics: 0.9, defeat: 0.8, conflict: 0.7 }
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
    "Two of Pentacles": { cashflow_management: 0.9, balance: 0.8, adaptability: 0.7 },
    "Seven of Pentacles": { investment_return: 0.9, patience: 0.8, growth: 0.7 },
    "Nine of Pentacles": { financial_independence: 0.9, luxury: 0.8, self_sufficiency: 0.7 },
    "Page of Pentacles": { financial_news: 0.9, entry_level_profit: 0.8, savings_start: 0.7 },
    "Knight of Pentacles": { slow_growth: 0.9, reliability: 0.8, persistence: 0.7 },
    "Queen of Pentacles": { resource_management: 0.9, practical_wealth: 0.8, stability: 0.7 },
    "Judgement":     { debt_resolution: 0.9, final_payment: 0.8, awakening: 0.7 },
    "The Devil":     { debt_trap: 0.9, greed: 0.8, material_bondage: 0.7 },
    "Death":         { financial_transition: 0.9, system_change: 0.8, ending: 0.7 },
    "The Tower":     { bankruptcy_risk: 0.9, sudden_loss: 0.8, shock: 0.7 },
    "Ace of Swords": { clear_strategy: 0.9, cutting_loss: 0.8, decisive_action: 0.7 },
    "The Sun":       { financial_joy: 0.9, transparent_gain: 0.8, success: 0.7 }
  },
  health: {
    "The Sun":       { vitality: 0.9, joy: 0.8, recovery: 0.8, energy: 0.9 },
    "The Moon":      { subconscious: 0.8, anxiety: 0.7, hidden: 0.7, intuition: 0.8 },
    "Strength":      { courage: 0.9, endurance: 0.8, inner_power: 0.9, patience: 0.7 },
    "The Hermit":    { rest: 0.8, solitude: 0.7, reflection: 0.7, withdrawal: 0.6 },
    "Four of Swords": { rest: 0.9, recovery: 0.8, retreat: 0.7, healing: 0.7 },
    "Nine of Swords": { anxiety: 0.9, worry: 0.8, mental_distress: 0.9, fear: 0.8 },
    "The World":     { wholeness: 0.9, completion: 0.8, health_restored: 0.8, integration: 0.7 },
    "Temperance":    { balance: 0.9, moderate_habit: 0.8, system_harmony: 0.7 },
    "The Star":      { hope: 0.9, healing_energy: 0.8, optimism: 0.7 },
    "Death":         { drastic_change: 0.9, end_of_cycle: 0.8, renewal: 0.7 },
    "The Devil":     { addiction: 0.9, toxic_habits: 0.8, physical_strain: 0.7 },
    "The Tower":     { sudden_injury: 0.9, system_collapse: 0.8, shock: 0.7 },
    "Ace of Cups":   { emotional_healing: 0.9, peace: 0.8, flow: 0.7 },
    "Ace of Swords": { surgery: 0.9, sharp_pain: 0.8, mental_clarity: 0.7 },
    "Ace of Pentacles": { physical_vitalization: 0.9, manifestation: 0.8, stability: 0.7 },
    "Three of Swords": { heart_strain: 0.9, emotional_pain: 0.8, release: 0.7 },
    "Five of Pentacles": { weakened_immunity: 0.9, cold_energy: 0.8, hardship: 0.7 },
    "Ten of Wands":  { fatigue: 0.9, burnout: 0.8, burden: 0.7 },
    "Justice":      { hormonal_balance: 0.9, precise_diagnosis: 0.8, fairness: 0.7 },
    "King of Cups":  { emotional_mastery: 0.9, calm: 0.8, counseling: 0.7 }
  },
  reconciliation: {
    "Judgement":     { total_reunion: 0.9, resurrection: 0.9, karma_resolve: 0.8 },
    "Six of Cups":   { shared_memories: 0.9, nostalgic_return: 0.8, childhood_soul: 0.7 },
    "Death":         { ending_to_new: 0.9, total_transformation: 0.8, closure: 0.7 },
    "The Lovers":    { reuniting_soul: 0.9, choice: 0.8, attraction: 0.7 },
    "The Star":      { healing_reunion: 0.9, hope_restored: 0.8, peace: 0.7 },
    "Two of Cups":   { mutual_agreement: 0.9, reconnect: 0.8, heart_harmony: 0.7 },
    "Page of Cups":  { shy_message: 0.9, emotional_offer: 0.8, new_look: 0.7 },
    "Knight of Cups": { romantic_return: 0.9, apology: 0.8, invitation: 0.7 },
    "Ace of Swords": { clear_break: 0.9, decisive_conversation: 0.8, truth: 0.7 },
    "Three of Swords": { pain_remains: 0.9, separation_trauma: 0.8, clear_cut: 0.7 },
    "The Moon":      { uncertain_reunion: 0.9, floating_emotions: 0.8, illusion: 0.7 },
    "The World":     { final_closure: 0.9, complete_success: 0.8, cycle_end: 0.7 },
    "Eight of Cups": { leaving_permanently: 0.9, search_elsewhere: 0.8, void: 0.7 },
    "Four of Wands": { home_return: 0.9, shared_safe_haven: 0.8, celebration: 0.7 },
    "Justice":      { fair_conclusion: 0.9, balanced_talk: 0.8, truth: 0.7 },
    "Wheel of Fortune": { destined_reunion: 0.9, timing: 0.8, cycle_turn: 0.7 },
    "Strength":      { gentle_approach: 0.9, patience: 0.8, endurance: 0.7 },
    "The Hanged Man": { waiting_period: 0.9, perspective_shift: 0.8, pause: 0.7 },
    "The Hermit":    { introspection: 0.9, soul_search: 0.8, silence: 0.7 },
    "Ace of Pentacles": { solid_second_chance: 0.9, physical_reunion: 0.8, start: 0.7 }
  },
  dating: {
    "The Lovers":    { high_attraction: 0.9, soulmate_vibe: 0.9, chemistry: 0.8 },
    "Ace of Cups":   { new_emotion: 0.9, romance_start: 0.8, attraction: 0.7 },
    "Two of Cups":   { mutual_attraction: 0.9, dating_start: 0.8, harmony: 0.7 },
    "The Fool":      { exciting_start: 0.9, unknown_adventure: 0.8, fun: 0.7 },
    "The Star":      { idealized_love: 0.9, positive_vibe: 0.8, hope: 0.7 },
    "Knight of Wands": { fast_passion: 0.9, active_pursuit: 0.8, adventure: 0.7 },
    "Knight of Cups": { romantic_proposal: 0.9, sweet_gesture: 0.8, charm: 0.7 },
    "The Sun":       { happy_dating: 0.9, clear_feelings: 0.8, joy: 0.7 },
    "The Devil":     { sexual_tension: 0.9, addicting_passion: 0.8, obsession: 0.7 },
    "Three of Cups": { group_dating: 0.9, party: 0.8, friendship: 0.7 },
    "Eight of Wands": { rapid_progress: 0.9, text_frequency: 0.8, speed: 0.7 },
    "Page of Cups":  { fluttering_heart: 0.9, small_gift: 0.8, crush: 0.7 },
    "Queen of Cups": { high_empathy: 0.9, deep_connection: 0.8, warmth: 0.7 },
    "Page of Swords": { background_check: 0.9, curiosity: 0.8, wit: 0.7 },
    "The Moon":      { mysterious_vibe: 0.9, uncertainty: 0.8, hidden_story: 0.7 },
    "Ace of Wands":  { sparks_flying: 0.9, desire: 0.8, ignition: 0.7 },
    "Seven of Cups": { many_options: 0.9, fantasy: 0.8, confusion: 0.7 },
    "Four of Pentacles": { defensive_heart: 0.9, guarding_privacy: 0.8, boundaries: 0.7 },
    "The Emperor":   { leading_partner: 0.9, dominant_vibe: 0.8, structure: 0.7 },
    "The Chariot":   { pursuing_victory: 0.9, momentum: 0.8, directness: 0.7 }
  },
  marriage: {
    "The Hierophant": { tradition: 0.9, formal_contract: 0.8, blessing: 0.7 },
    "Ten of Pentacles": { family_foundation: 0.9, legacy: 0.8, stability: 0.7 },
    "Four of Wands": { home_ceremony: 0.9, marriage_celebration: 0.8, stability: 0.7 },
    "The Lovers":    { soul_union: 0.9, commitment: 0.8, choice: 0.7 },
    "Ten of Cups":   { emotional_fulfillment: 0.9, family_joy: 0.8, peace: 0.7 },
    "Justice":      { legal_union: 0.9, contract_marriage: 0.8, fairness: 0.7 },
    "The Emperor":   { family_authority: 0.9, structure: 0.8, safety: 0.7 },
    "The Empress":   { fertility: 0.9, abundance: 0.8, mother_energy: 0.7 },
    "King of Pentacles": { financial_security: 0.9, provider: 0.8, stability: 0.7 },
    "Queen of Pentacles": { home_management: 0.9, nurturing: 0.8, stability: 0.7 },
    "Two of Cups":   { ideal_partnership: 0.9, contract: 0.8, harmony: 0.7 },
    "Ace of Pentacles": { solid_foundation: 0.9, start_of_wealth: 0.8, blessing: 0.7 },
    "Six of Pentacles": { fair_contribution: 0.9, balance: 0.8, sharing: 0.7 },
    "Wheel of Fortune": { destined_path: 0.9, timing: 0.8, change: 0.7 },
    "The World":     { family_completion: 0.9, total_fulfillment: 0.8, success: 0.7 },
    "Five of Pentacles": { for_better_or_worse: 0.9, testing_bonding: 0.8, hardship: 0.7 },
    "Three of Pentacles": { building_together: 0.9, collaboration: 0.8, skill: 0.7 },
    "Three of Cups": { family_celebration: 0.9, gathering: 0.8, joy: 0.7 },
    "The Sun":       { children_joy: 0.9, clear_future: 0.8, success: 0.7 },
    "Strength":      { endurance: 0.9, soft_control: 0.8, loyalty: 0.7 }
  },
  business: {
    "The Emperor":   { authority: 0.9, leadership: 0.8, control: 0.7 },
    "Ace of Pentacles": { capital_injection: 0.9, new_venture: 0.8, seed: 0.7 },
    "The Chariot":   { aggressive_expansion: 0.9, victory: 0.8, speed: 0.7 },
    "The Magician":  { marketing_skill: 0.9, resource_use: 0.8, creativity: 0.7 },
    "Three of Pentacles": { B2B_contract: 0.9, professional_work: 0.8, trust: 0.7 },
    "Eight of Pentacles": { mass_production: 0.9, product_mastery: 0.8, work: 0.7 },
    "King of Pentacles": { CEO_energy: 0.9, profitability: 0.8, success: 0.7 },
    "Ace of Wands":  { new_idea: 0.9, startup_ignition: 0.8, drive: 0.7 },
    "Justice":      { legal_compliance: 0.9, fair_dealing: 0.8, truth: 0.7 },
    "The Wheel":     { market_trend: 0.9, timing: 0.8, luck: 0.7 },
    "The Tower":     { sudden_pivot: 0.9, business_failure: 0.8, structural_change: 0.7 },
    "Six of Wands":  { market_leadership: 0.9, PR_success: 0.8, victory: 0.7 },
    "Two of Wands":  { globalization: 0.9, strategic_planning: 0.8, vision: 0.7 },
    "Three of Wands": { export: 0.9, expansion: 0.8, waiting: 0.7 },
    "Nine of Pentacles": { independent_profit: 0.9, luxury_brand: 0.8, success: 0.7 },
    "Ace of Swords": { strategic_breakthrough: 0.9, decision: 0.8, logic: 0.7 },
    "King of Swords": { consultant_advice: 0.9, professional_logic: 0.8, rule: 0.7 },
    "Five of Swords": { hostile_takeover: 0.9, unfair_competition: 0.8, loss: 0.7 },
    "Seven of Swords": { corporate_espionage: 0.9, hidden_strategy: 0.8, risk: 0.7 },
    "The World":     { global_expansion: 0.9, international_standard: 0.8, success: 0.7 },
    "The Lovers":    { strategic_partnership: 0.8, alignment: 0.7, choice: 0.6 }
  },
  life_direction: {
    "The Fool":      { life_adventure: 0.9, zero_state: 0.8, potential: 0.7 },
    "The Hermit":    { soul_mission: 0.9, finding_self: 0.8, wisdom: 0.7 },
    "The Star":      { ultimate_hope: 0.9, vision_clarity: 0.8, inspiration: 0.7 },
    "The Wheel":     { fateful_turn: 0.9, timing_alignment: 0.8, evolution: 0.7 },
    "Judgement":     { spiritual_calling: 0.9, life_review: 0.8, decision: 0.7 },
    "The World":     { holistic_success: 0.9, integration: 0.8, fulfillment: 0.7 },
    "Death":         { radical_shift: 0.9, ego_death: 0.8, rebirth: 0.7 },
    "The Magician":  { personal_agency: 0.9, creation: 0.8, skill: 0.7 },
    "The Sun":       { self_actualization: 0.9, joy: 0.8, visibility: 0.7 },
    "The Hanged Man": { inner_transformation: 0.9, perspective_change: 0.8, wait: 0.7 },
    "The High Priestess": { intuitive_path: 0.9, esoteric_knowledge: 0.8, stillness: 0.7 },
    "Strength":      { spiritual_stamina: 0.9, compassion: 0.8, mastering_beast: 0.7 },
    "The Hierophant": { moral_compass: 0.9, tradition_value: 0.8, path: 0.7 },
    "The Emperor":   { establishing_order: 0.9, authority: 0.8, foundation: 0.7 },
    "The Empress":   { creative_abunance: 0.9, nurturing_path: 0.8, nature: 0.7 },
    "Three of Wands": { broadening_horizon: 0.9, potential_expansion: 0.8, vista: 0.7 },
    "Eight of Cups": { leaving_ego_behind: 0.9, pilgrimage: 0.8, search: 0.7 },
    "Ace of Swords": { objective_truth: 0.9, mental_prowess: 0.8, clarity: 0.7 },
    "Temperance":    { life_alchemy: 0.9, moderation: 0.8, harmony: 0.7 },
    "The Lovers":    { dualistic_choice: 0.9, alignment: 0.8, commitment: 0.7 }
  },
  self_growth: {
    "The Hermit":    { deep_reflection: 0.9, solitary_study: 0.8, wisdom: 0.7 },
    "The Magician":  { skill_acquisition: 0.9, potential_training: 0.8, action: 0.7 },
    "Eight of Pentacles": { practice_consistency: 0.9, craftsmanship: 0.8, improvement: 0.7 },
    "The Star":      { self_healing: 0.9, inner_faith: 0.8, renewal: 0.7 },
    "Strength":      { character_building: 0.9, self_discipline: 0.8, resilience: 0.7 },
    "The Hanged Man": { letting_go_of_ego: 0.9, new_perspective: 0.8, sacrifice: 0.7 },
    "Justice":      { self_assessment: 0.9, intellectual_honesty: 0.8, balance: 0.7 },
    "Ace of Swords": { clarity_of_thought: 0.9, breaking_old_patterns: 0.8, truth: 0.7 },
    "Temperance":    { emotional_integration: 0.9, alchemy: 0.8, patience: 0.7 },
    "The High Priestess": { subconscious_work: 0.9, intuition_development: 0.8, silence: 0.7 },
    "Death":         { internal_rebirth: 0.9, shedding_old_self: 0.8, transformation: 0.7 },
    "The Moon":      { facing_shadow: 0.9, unconscious_revealed: 0.8, anxiety_work: 0.7 },
    "The Sun":       { inner_child_healing: 0.9, self_expression: 0.8, joy: 0.7 },
    "Judgement":     { self_awakening: 0.9, inner_critic_resolve: 0.8, clarity: 0.7 },
    "The Hierophant": { formal_education: 0.9, mentor_learning: 0.8, tradition: 0.7 },
    "Ace of Pentacles": { new_practical_habit: 0.9, manifestation_work: 0.8, results: 0.7 },
    "Page of Pentacles": { academic_success: 0.9, study_focus: 0.8, research: 0.7 },
    "Queen of Swords": { logical_independence: 0.9, sharp_mind: 0.8, truth: 0.7 },
    "Page of Wands": { exploring_passions: 0.9, new_energy: 0.8, enthusiasm: 0.7 },
    "Ace of Cups":   { emotional_intelligence: 0.9, self_love: 0.8, compassion: 0.7 },
    "The Lovers":    { self_acceptance: 0.8, integration: 0.7, choice: 0.7 }
  },
  general_future: {
    "The World":     { overall_success: 0.9, completion: 0.8, global_harmony: 0.7 },
    "Wheel of Fortune": { positive_turn: 0.9, luck: 0.8, pivot_point: 0.7 },
    "The Sun":       { clarity_and_joy: 0.9, vitality: 0.8, manifestation: 0.7 },
    "The Star":      { long_term_hope: 0.9, inspiration: 0.8, spiritual_path: 0.7 },
    "Death":         { radical_shift: 0.9, deep_renewal: 0.8, finality: 0.7 },
    "The Tower":     { sudden_upheaval: 0.9, breakthrough_shock: 0.8, destruction: 0.7 },
    "Ace of Pentacles": { windfall: 0.9, solid_beginning: 0.8, manifestation: 0.7 },
    "Ace of Wands":  { new_ignition: 0.9, energy_burst: 0.8, ambition: 0.7 },
    "Ace of Cups":   { emotional_blessing: 0.9, new_relationship: 0.8, love: 0.7 },
    "Ace of Swords": { decisive_breakthrough: 0.9, logic_prevail: 0.8, truth: 0.7 },
    "The Emperor":   { establishing_control: 0.9, stability: 0.8, safety: 0.7 },
    "The Lovers":    { fateful_choice: 0.9, alignment: 0.8, union: 0.7 },
    "The Chariot":   { dynamic_victory: 0.9, momentum: 0.8, movement: 0.7 },
    "Magician":      { manifesting_destiny: 0.9, skillful_start: 0.8, power: 0.7 },
    "Strength":      { persistent_success: 0.9, inner_victory: 0.8, endurance: 0.7 },
    "Judgement":     { fated_call: 0.9, life_changing_news: 0.8, decision: 0.7 },
    "Justice":      { legal_win: 0.9, balanced_outcome: 0.8, fair_result: 0.7 },
    "Temperance":    { harmonious_transition: 0.9, moderation: 0.8, peace: 0.7 },
    "The Empress":   { material_abundance: 0.9, growth_bless: 0.8, prosperity: 0.7 },
    "Ten of Pentacles": { generational_wealth: 0.9, legacy_build: 0.8, security: 0.7 }
  }
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
export const NEIGHBOR_INFLUENCE: Record<string, Record<string, number>> = {
  "The Tower": {
    "The Star":    0.3,   // 충격 후 치유
    "Death":       0.2,   // 이중 변화
    "The Fool":   -0.1,   // 새 시작으로 완충
    "The World":  -0.2,   // 완성이 충격 완화
    "Judgment":    0.3,   // 각성과 외부 충격 시너지
    "Ace of Swords": 0.4,  // 명확한 통찰로 인한 해체
  },
  "Death": {
    "The Star":    0.4,   // 종료 후 치유·재생
    "Judgement":   0.3,   // 변환 강화
    "The World":   0.2,   // 완성으로 이어짐
    "The Tower":   0.2,   // 이중 변화
    "Six of Cups": 0.3,   // 과거를 보내는 슬픔과 치유
    "Ace of Cups": 0.4,   // 완전한 끝 뒤에 오는 감정의 시원
  },
  "The Star": {
    "The Moon":   -0.2,   // 희망이 불안과 충돌
    "The Sun":     0.3,   // 희망+활력
    "The World":   0.3,   // 완성으로 향함
    "Four of Swords": 0.3, // 휴식 속의 희망
    "Page of Cups": 0.2,  // 순수한 기대
  },
  "The Moon": {
    "The Sun":     0.4,   // 어둠에서 빛으로
    "The Star":   -0.1,   // 불안이 희망을 약화
    "The Tower":   0.2,   // 혼란 가중
    "Seven of Cups": 0.3, // 환상과 혼돈의 시너지
    "High Priestess": 0.4, // 직관과 무의식의 극대화
  },
  "The Sun": {
    "The Moon":    0.4,   // 빛과 어둠의 통합
    "The World":   0.3,   // 성공으로 향함
    "Judgement":   0.2,   // 각성
    "Six of Wands": 0.4,  // 승리와 영광의 정점
    "Nine of Cups": 0.3,  // 만족감의 극대화
  },
  "Ten of Pentacles": {
    "Two of Cups":  0.4,  // 관계+안정
    "The World":    0.3,  // 완성된 행복
    "Five of Pentacles": -0.3, // 안정이 상실로 반전
    "Four of Wands": 0.3, // 가정의 축복 확대
    "The Emperor":  0.2,  // 질서 있는 풍요
  },
  "Three of Swords": {
    "The Star":     0.5,  // 상처 후 치유
    "Four of Swords": 0.3, // 회복
    "Eight of Swords": 0.2, // 고통 강화
    "Five of Cups": 0.3,  // 상실과 슬픔의 증폭
    "Ten of Swords": 0.4, // 고통의 끝자락
  },
  "Ace of Wands": {
    "The Magician": 0.4,  // 기획력과 실행력의 조화
    "Eight of Wands": 0.3, // 폭발적인 속도
    "The Chariot": 0.3,   // 강력한 돌파력
  },
  "Two of Cups": {
    "The Lovers": 0.5,    // 필연적인 운명적 결합
    "The Hierophant": 0.3, // 공식적인 약속/결혼
    "Ace of Cups": 0.4,   // 사랑의 넘침
  },
  "Eight of Pentacles": {
    "Three of Pentacles": 0.4, // 협업을 통한 전문성 완성
    "The Magician": 0.3,  // 탁월한 솜씨
    "The Hermit": 0.2,    // 고독한 장인 정신
  },
  "The Fool": {
    "The Magician": 0.3,  // 무에서 유로 가는 모험
    "Wheel of Fortune": 0.4, // 인생의 도박적 전환
    "The Universe": 0.2,  // 새로운 세상으로의 진입
  },
  "Knight of Swords": {
    "The Chariot": 0.5,   // 멈출 수 없는 진격
    "Ace of Swords": 0.4, // 단호한 의지와 행동
    "Eight of Wands": 0.3, // 전광석화 같은 변화
  },
  "Seven of Cups": {
    "The Moon": 0.3,      // 환상과 실체 없는 불안
    "The Devil": 0.2,     // 유혹적인 환각
    "The Magician": -0.3, // 현실 감각과의 충돌
  },
  "Three of Pentacles": {
    "The Emperor": 0.3,   // 공적인 프로젝트 성공
    "Eight of Pentacles": 0.4, // 실질적인 기여 확대
    "Justice": 0.2,       // 공정하고 명확한 계약
  },
  "Queen of Cups": {
    "The Star": 0.4,      // 맑고 자애로운 영혼
    "Six of Cups": 0.3,   // 과거에 대한 연민
    "Page of Cups": 0.3,  // 부성/모성적 배려
  },
  "Five of Pentacles": {
    "The Tower": 0.4,     // 경제적 붕괴 가중
    "The Hermit": 0.2,    // 고독한 결핍
    "Six of Pentacles": 0.5, // 가뭄 끝의 단비(도움)
  },
  "Strength": {
    "The Chariot": 0.3,   // 내강외강의 조화
    "Queen of Wands": 0.3, // 당당한 매력과 통제
    "Temperance": 0.2,    // 균형 정립
  },
  "The Devil": {
    "The Lovers": 0.4,    // 치명적인 유혹의 관계
    "The Moon": 0.3,      // 기괴하고 불안한 집착
    "Ace of Pentacles": 0.2, // 물질에 대한 탐욕
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
export const PATTERN_DB: PatternMatch[] = [
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
    topic: "general_future",
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
  {
    pattern_id: "P-011",
    cards: ["Six of Cups", "Judgement"],
    topic: "reconciliation",
    outcome_distribution: { positive: 0.75, negative: 0.10, neutral: 0.15 },
    probability: 0.75,
    meaning: "과거의 깊은 인연이 운명적인 기회와 함께 다시 연결됩니다."
  },
  {
    pattern_id: "P-012",
    cards: ["The Lovers", "The Devil"],
    topic: "relationship",
    outcome_distribution: { positive: 0.40, negative: 0.50, neutral: 0.10 },
    probability: 0.50,
    meaning: "강렬한 끌림 뒤에 감정적 구속이나 집착의 위험성이 큽니다."
  },
  {
    pattern_id: "P-013",
    cards: ["Knight of Wands", "Eight of Wands"],
    topic: "career",
    outcome_distribution: { positive: 0.70, negative: 0.15, neutral: 0.15 },
    probability: 0.70,
    meaning: "매우 빠른 속도로 일이 진행되며 예상을 넘는 진척이 예상됩니다."
  },
  {
    pattern_id: "P-014",
    cards: ["Four of Wands", "Ten of Cups"],
    topic: "marriage",
    outcome_distribution: { positive: 0.90, negative: 0.05, neutral: 0.05 },
    probability: 0.90,
    meaning: "가문의 축복을 받는 완벽하고 안정적인 결실이 보장됩니다."
  },
  {
    pattern_id: "P-015",
    cards: ["The Emperor", "Eight of Pentacles"],
    topic: "business",
    outcome_distribution: { positive: 0.75, negative: 0.10, neutral: 0.15 },
    probability: 0.75,
    meaning: "강력한 리더십과 성실한 실무능력이 결합하여 수익을 창출합니다."
  },
  {
    pattern_id: "P-016",
    cards: ["The Hermit", "Judgement"],
    topic: "life_direction",
    outcome_distribution: { positive: 0.65, negative: 0.15, neutral: 0.20 },
    probability: 0.65,
    meaning: "긴 성찰의 끝에 자신의 소명을 깨닫는 인생의 반환점이 옵니다."
  },
  {
    pattern_id: "P-017",
    cards: ["Strength", "Temperance"],
    topic: "self_growth",
    outcome_distribution: { positive: 0.80, negative: 0.05, neutral: 0.15 },
    probability: 0.80,
    meaning: "스스로를 다스리는 힘과 절제가 만나 내면의 큰 성장을 이룹니다."
  },
  {
    pattern_id: "P-018",
    cards: ["Five of Pentacles", "Six of Pentacles"],
    topic: "finance",
    outcome_distribution: { positive: 0.55, negative: 0.25, neutral: 0.20 },
    probability: 0.55,
    meaning: "경제적 바닥을 치고 주변의 도움으로 서서히 안정을 회복합니다."
  },
  {
    pattern_id: "P-019",
    cards: ["The Magician", "The Sun"],
    topic: "general_future",
    outcome_distribution: { positive: 0.85, negative: 0.05, neutral: 0.10 },
    probability: 0.85,
    meaning: "모든 것이 명확해지며 자신의 재능이 세상에 빛나게 될 것입니다."
  },
  {
    pattern_id: "P-020",
    cards: ["The Moon", "The Star"],
    topic: "health",
    outcome_distribution: { positive: 0.60, negative: 0.20, neutral: 0.20 },
    probability: 0.60,
    meaning: "심리적 불안을 극복하고 실낱같은 희망이 치유의 불씨가 됩니다."
  },
  {
    pattern_id: "P-021",
    cards: ["Ace of Pentacles", "King of Pentacles"],
    topic: "finance",
    outcome_distribution: { positive: 0.90, negative: 0.05, neutral: 0.05 },
    probability: 0.90,
    meaning: "작게 시작한 기회가 거대한 재정적 성공으로 완성됩니다."
  },
  {
    pattern_id: "P-022",
    cards: ["Three of Swords", "Death"],
    topic: "relationship",
    outcome_distribution: { positive: 0.20, negative: 0.70, neutral: 0.10 },
    probability: 0.70,
    meaning: "뼈픈 상처를 동반한 관계의 완전한 종료가 필연적입니다."
  },
  {
    pattern_id: "P-023",
    cards: ["Two of Wands", "The World"],
    topic: "career",
    outcome_distribution: { positive: 0.85, negative: 0.05, neutral: 0.10 },
    probability: 0.85,
    meaning: "글로벌한 시야를 가지고 준비한 일이 세계적으로 인정받습니다."
  },
  {
    pattern_id: "P-024",
    cards: ["Seven of Cups", "The Devil"],
    topic: "dating",
    outcome_distribution: { positive: 0.30, negative: 0.60, neutral: 0.10 },
    probability: 0.60,
    meaning: "유혹적인 환상에 빠져 실체를 보지 못하고 실망할 수 있습니다."
  },
  {
    pattern_id: "P-025",
    cards: ["Wheel of Fortune", "The Chariot"],
    topic: "general_future",
    outcome_distribution: { positive: 0.80, negative: 0.10, neutral: 0.10 },
    probability: 0.80,
    meaning: "주어지는 운명적 기회에 강력한 돌파력을 더해 큰 도약을 이룹니다."
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
  const cardAnalyses = cards?.map((card, i) => {
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
    ? uniquePatterns?.map(p => p.meaning).join(" / ")
    : `${dominantTheme} 에너지가 스프레드를 지배합니다.`;

  return {
    card_analyses: cardAnalyses,
    spread_narrative: spreadNarrative,
    dominant_theme: dominantTheme,
    overall_intensity: overallIntensity,
    pattern_summary: uniquePatterns,
  };
}

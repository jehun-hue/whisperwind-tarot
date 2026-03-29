/**
 * hybridTarotEngine.ts (v9)
 * - Monad 구조 분석 + 최한나 스타일 서사 해석 통합
 * - v9: 3장 → 메이저 22장 + 코트 16장 = 38장 패턴 완성
 *        + 포지션별 구조 분석 세분화
 *        + 역방향 전용 해석 추가
 */

// ═══════════════════════════════════════
// 1. Monad 구조 분석 (카드 × 포지션 → 구조 태그)
// ═══════════════════════════════════════
const STRUCTURE_RULES: Record<string, Record<string, string>> = {
  "The Fool":             { past: "origin_innocence", present: "leap_of_faith", future: "new_chapter", "현재 상황": "leap_of_faith", "핵심 문제": "reckless_impulse", "조언": "trust_the_unknown", "가까운 결과": "new_chapter" },
  "The Magician":         { past: "skill_foundation", present: "active_creation", future: "manifestation_peak", "현재 상황": "active_creation", "핵심 문제": "scattered_focus", "조언": "focus_and_execute", "가까운 결과": "manifestation_peak" },
  "The High Priestess":   { past: "hidden_influence", present: "intuition_active", future: "secrets_revealed", "현재 상황": "intuition_active", "핵심 문제": "information_gap", "조언": "trust_inner_voice", "가까운 결과": "secrets_revealed" },
  "The Empress":          { past: "nurturing_roots", present: "abundance_flow", future: "creative_harvest", "현재 상황": "abundance_flow", "핵심 문제": "over_comfort", "조언": "embrace_growth", "가까운 결과": "creative_harvest" },
  "The Emperor":          { past: "authority_learned", present: "structure_needed", future: "stable_command", "현재 상황": "structure_needed", "핵심 문제": "rigidity", "조언": "set_boundaries", "가까운 결과": "stable_command" },
  "The Hierophant":       { past: "tradition_shaped", present: "seek_guidance", future: "institutional_path", "현재 상황": "seek_guidance", "핵심 문제": "dogma_trap", "조언": "follow_proven_path", "가까운 결과": "institutional_path" },
  "The Lovers":           { past: "past_choice_echo", present: "critical_choice", future: "union_or_split", "현재 상황": "critical_choice", "핵심 문제": "values_conflict", "조언": "choose_with_heart", "가까운 결과": "union_or_split" },
  "The Chariot":          { past: "past_victory", present: "momentum_surge", future: "breakthrough", "현재 상황": "momentum_surge", "핵심 문제": "direction_loss", "조언": "stay_focused", "가까운 결과": "breakthrough" },
  "Strength":             { past: "endurance_built", present: "gentle_power", future: "mastery_through_patience", "현재 상황": "gentle_power", "핵심 문제": "self_doubt", "조언": "soft_persistence", "가까운 결과": "mastery_through_patience" },
  "The Hermit":           { past: "solitary_wisdom", present: "inner_search", future: "clarity_found", "현재 상황": "inner_search", "핵심 문제": "isolation_risk", "조언": "seek_within", "가까운 결과": "clarity_found" },
  "Wheel of Fortune":     { past: "past_cycle_end", present: "turning_point", future: "cyclic_opportunity", "현재 상황": "turning_point", "핵심 문제": "resistance_to_change", "조언": "flow_with_cycle", "가까운 결과": "cyclic_opportunity" },
  "Justice":              { past: "karmic_seed", present: "truth_weighing", future: "fair_outcome", "현재 상황": "truth_weighing", "핵심 문제": "imbalance", "조언": "act_with_integrity", "가까운 결과": "fair_outcome" },
  "The Hanged Man":       { past: "past_sacrifice", present: "willing_pause", future: "perspective_shift", "현재 상황": "willing_pause", "핵심 문제": "stuck_feeling", "조언": "surrender_to_wait", "가까운 결과": "perspective_shift" },
  "Death":                { past: "past_ending", present: "transformation_active", future: "rebirth", "현재 상황": "transformation_active", "핵심 문제": "clinging_to_old", "조언": "let_go", "가까운 결과": "rebirth" },
  "Temperance":           { past: "balance_learned", present: "integration_process", future: "harmonized_flow", "현재 상황": "integration_process", "핵심 문제": "extremes", "조언": "find_middle_path", "가까운 결과": "harmonized_flow" },
  "The Devil":            { past: "shadow_origin", present: "attachment_exposed", future: "liberation_possible", "현재 상황": "attachment_exposed", "핵심 문제": "toxic_pattern", "조언": "face_the_shadow", "가까운 결과": "liberation_possible" },
  "The Tower":            { past: "past_collapse", present: "structure_change", future: "forced_renewal", "현재 상황": "structure_change", "핵심 문제": "false_foundation", "조언": "accept_destruction", "가까운 결과": "forced_renewal" },
  "The Star":             { past: "hope_seed", present: "healing_active", future: "renewed_faith", "현재 상황": "healing_active", "핵심 문제": "lost_hope", "조언": "trust_the_process", "가까운 결과": "renewed_faith" },
  "The Moon":             { past: "past_illusion", present: "confusion_peak", future: "truth_emerges", "현재 상황": "confusion_peak", "핵심 문제": "self_deception", "조언": "face_fears", "가까운 결과": "truth_emerges" },
  "The Sun":              { past: "joyful_origin", present: "radiant_energy", future: "success_guaranteed", "현재 상황": "radiant_energy", "핵심 문제": "overconfidence", "조언": "shine_authentically", "가까운 결과": "success_guaranteed" },
  "Judgement":            { past: "karmic_review", present: "awakening_call", future: "final_reckoning", "현재 상황": "awakening_call", "핵심 문제": "avoiding_truth", "조언": "answer_the_call", "가까운 결과": "final_reckoning" },
  "The World":            { past: "cycle_completed", present: "integration_peak", future: "new_world_opens", "현재 상황": "integration_peak", "핵심 문제": "completion_anxiety", "조언": "celebrate_and_move", "가까운 결과": "new_world_opens" },
  // ─── Minor Number Cards (40장) ───
  "Ace of Wands":       { past: "inspiration_seed", present: "creative_ignition", future: "potential_flame", "현재 상황": "creative_ignition", "핵심 문제": "unfocused_passion", "조언": "channel_the_fire", "가까운 결과": "potential_flame" },
  "Two of Wands":       { past: "planning_roots", present: "crossroads_vision", future: "expansion_awaits", "현재 상황": "crossroads_vision", "핵심 문제": "fear_of_unknown", "조언": "choose_and_commit", "가까운 결과": "expansion_awaits" },
  "Three of Wands":     { past: "exploration_start", present: "vision_expansion", future: "arrival_prep", "현재 상황": "vision_expansion", "핵심 문제": "delayed_vision", "조언": "expand_horizons", "가까운 결과": "arrival_prep" },
  "Four of Wands":      { past: "foundation_built", present: "stable_joy", future: "shared_celebration", "현재 상황": "stable_joy", "핵심 문제": "foundation_shake", "조언": "celebrate_stability", "가까운 결과": "shared_celebration" },
  "Five of Wands":      { past: "inner_tension", present: "competitive_clash", future: "struggle_clarity", "현재 상황": "competitive_clash", "핵심 문제": "pointless_conflict", "조언": "handle_friction", "가까운 결과": "struggle_clarity" },
  "Six of Wands":       { past: "effort_made", present: "public_victory", future: "leadership_peak", "현재 상황": "public_victory", "핵심 문제": "fallen_pride", "조언": "maintain_confidence", "가까운 결과": "leadership_peak" },
  "Seven of Wands":     { past: "challenge_faced", present: "defensive_stand", future: "mental_fortress", "현재 상황": "defensive_stand", "핵심 문제": "overwhelm_risk", "조언": "stand_ground", "가까운 결과": "mental_fortress" },
  "Eight of Wands":     { past: "movement_start", present: "rapid_action", future: "accelerated_result", "현재 상황": "rapid_action", "핵심 문제": "chaotic_speed", "조언": "maintain_trajectory", "가까운 결과": "accelerated_result" },
  "Nine of Wands":      { past: "long_struggle", present: "final_guard", future: "resilience_test", "현재 상황": "final_guard", "핵심 문제": "paranoia_risk", "조언": "keep_guard", "가까운 결과": "resilience_test" },
  "Ten of Wands":       { past: "heavy_burden", present: "physical_limit", future: "coming_release", "현재 상황": "physical_limit", "핵심 문제": "stress_overload", "조언": "delegate_tasks", "가까운 결과": "coming_release" },
  "Ace of Cups":        { past: "emotional_seed", present: "heart_overflow", future: "spiritual_bliss", "현재 상황": "heart_overflow", "핵심 문제": "emotional_block", "조언": "let_it_flow", "가까운 결과": "spiritual_bliss" },
  "Two of Cups":        { past: "initial_attract", present: "heart_union", future: "divine_partnership", "현재 상황": "heart_union", "핵심 문제": "broken_connection", "조언": "build_bridges", "가까운 결과": "divine_partnership" },
  "Three of Cups":      { past: "social_seed", present: "shared_celebration", future: "communal_joy", "현재 상황": "shared_celebration", "핵심 문제": "exclusion_risk", "조언": "share_the_joy", "가까운 결과": "communal_joy" },
  "Four of Cups":       { past: "boredom_roots", present: "emotional_stasis", future: "inner_focus", "현재 상황": "emotional_stasis", "핵심 문제": "ignoring_gifts", "조언": "look_within", "가까운 결과": "inner_focus" },
  "Five of Cups":       { past: "grief_origin", present: "focusing_on_loss", future: "acceptance_start", "현재 상황": "focusing_on_loss", "핵심 문제": "stuck_in_past", "조언": "look_at_remaining", "가까운 결과": "acceptance_start" },
  "Six of Cups":        { past: "past_memories", present: "nostalgic_comfort", future: "innocence_reborn", "현재 상황": "nostalgic_comfort", "핵심 문제": "stuck_in_nostalgia", "조언": "honor_past", "가까운 결과": "innocence_reborn" },
  "Seven of Cups":      { past: "multiple_options", present: "fantasy_illusion", future: "real_choice_needed", "현재 상황": "fantasy_illusion", "핵심 문제": "option_overload", "조언": "ground_your_dreams", "가까운 결과": "real_choice_needed" },
  "Eight of Cups":      { past: "unfulfilled_past", present: "somatic_departure", future: "spiritual_search", "현재 상황": "somatic_departure", "핵심 문제": "fear_of_leaving", "조언": "keep_moving", "가까운 결과": "spiritual_search" },
  "Nine of Cups":       { past: "wish_made", present: "soul_satisfaction", future: "emotional_mastery", "현재 상황": "soul_satisfaction", "핵심 문제": "empty_success", "조언": "enjoy_your_fruit", "가까운 결과": "emotional_mastery" },
  "Ten of Cups":        { past: "family_roots", present: "total_bliss", future: "eternal_legacy", "현재 상황": "total_bliss", "핵심 문제": "home_tension", "조언": "cherish_harmony", "가까운 결과": "eternal_legacy" },
  "Ace of Swords":      { past: "mental_clarity_seed", present: "truth_cutting", future: "decisive_insight", "현재 상황": "truth_cutting", "핵심 문제": "logic_overload", "조언": "seek_truth", "가까운 결과": "decisive_insight" },
  "Two of Swords":      { past: "past_hesitation", present: "mental_deadlock", future: "forced_choice", "현재 상황": "mental_deadlock", "핵심 문제": "denial_trap", "조언": "face_the_decision", "가까운 결과": "forced_choice" },
  "Three of Swords":    { past: "heartbreak_origin", present: "deep_grief", future: "healing_process", "현재 상황": "deep_grief", "핵심 문제": "repressed_pain", "조언": "accept_the_truth", "가까운 결과": "healing_process" },
  "Four of Swords":     { past: "past_battle", present: "sacred_rest", future: "quiet_recovery", "현재 상황": "sacred_rest", "핵심 문제": "burnout_risk", "조언": "take_a_break", "가까운 결과": "quiet_recovery" },
  "Five of Swords":     { past: "conflict_seed", present: "poisonous_win", future: "hollow_victory", "현재 상황": "poisonous_win", "핵심 문제": "resentment_buildup", "조언": "let_it_go", "가까운 결과": "hollow_victory" },
  "Six of Swords":      { past: "troubled_past", present: "calm_passage", future: "arrival_hope", "현재 상황": "calm_passage", "핵심 문제": "mental_baggage", "조언": "leave_the_trouble", "가까운 결과": "arrival_hope" },
  "Seven of Swords":    { past: "hidden_motives", present: "strategic_diversion", future: "truth_reveal", "현재 상황": "strategic_diversion", "핵심 문제": "web_of_lies", "조언": "act_honestly", "가까운 결과": "truth_reveal" },
  "Eight of Swords":    { past: "mental_traps", present: "self_imposed_limit", future: "mental_freedom", "현재 상황": "self_imposed_limit", "핵심 문제": "paralysis_risk", "조언": "open_your_eyes", "가까운 결과": "mental_freedom" },
  "Nine of Swords":     { past: "worry_cycle", present: "mental_nightmare", future: "morning_clarity", "현재 상황": "mental_nightmare", "핵심 문제": "fear_projection", "조언": "share_the_anxiety", "가까운 결과": "morning_clarity" },
  "Ten of Swords":      { past: "complete_defeat", present: "final_blow", future: "morning_after", "현재 상황": "final_blow", "핵심 문제": "victim_mentality", "조언": "accept_the_end", "가까운 결과": "morning_after" },
  "Ace of Pentacles":   { past: "material_seed", present: "physical_foundation", future: "earthy_reward", "현재 상황": "physical_foundation", "핵심 문제": "missed_gold", "조언": "build_foundation", "가까운 결과": "earthy_reward" },
  "Two of Pentacles":   { past: "busy_past", present: "juggling_act", future: "unstable_balance", "현재 상황": "juggling_act", "핵심 문제": "priority_loss", "조언": "find_the_rhytm", "가까운 결과": "unstable_balance" },
  "Three of Pentacles": { past: "skill_learned", present: "collaboration_peak", future: "professional_fame", "현재 상황": "collaboration_peak", "핵심 문제": "poor_quality", "조언": "coordinate_efforts", "가까운 결과": "professional_fame" },
  "Four of Pentacles":  { past: "saving_phase", present: "guarding_stability", future: "rigid_safety", "현재 상황": "guarding_stability", "핵심 문제": "greed_trap", "조언": "allow_flow", "가까운 결과": "rigid_safety" },
  "Five of Pentacles":  { past: "past_poverty", present: "material_struggle", future: "finding_shelter", "현재 상황": "material_struggle", "핵심 문제": "pride_barrier", "조언": "ask_for_help", "가까운 결과": "finding_shelter" },
  "Six of Pentacles":   { past: "past_service", present: "fair_exchange", future: "wealth_flow", "현재 상황": "fair_exchange", "핵심 문제": "power_imbalance", "조언": "maintain_balance", "가까운 결과": "wealth_flow" },
  "Seven of Pentacles": { past: "long_labor", present: "midterm_review", future: "patient_harvest", "현재 상황": "midterm_review", "핵심 문제": "impatient_quit", "조언": "trust_the_growth", "가까운 결과": "patient_harvest" },
  "Eight of Pentacles": { past: "apprentice_phase", present: "skill_focused", future: "master_work_peak", "현재 상황": "skill_focused", "핵심 문제": "repetitve_boredom", "조언": "keep_refining", "가까운 결과": "master_work_peak" },
  "Nine of Pentacles":  { past: "independent_work", present: "solo_success", future: "total_security", "현재 상황": "solo_success", "핵심 문제": "gilded_cage", "조언": "enjoy_independence", "가까운 결과": "total_security" },
  "Ten of Pentacles":   { past: "family_foundation", present: "generational_wealth", future: "eternal_security", "현재 상황": "generational_wealth", "핵심 문제": "legacy_burden", "조언": "value_tradition", "가까운 결과": "eternal_security" }
};

export function analyzeTarotStructure(card: string, position: string, isReversed: boolean = false): string {
  const rules = STRUCTURE_RULES[card];
  if (rules) {
    const base = rules[position] || rules["현재 상황"] || "standard_flow";
    return isReversed ? `reversed_${base}` : base;
  }
  return isReversed ? "reversed_standard_flow" : "standard_flow";
}

// ═══════════════════════════════════════
// 2. 최한나 스타일 서사 해석 (정방향 + 역방향)
// ═══════════════════════════════════════
interface NarrativeEntry {
  upright: string;
  reversed: string;
}

const NARRATIVE_PATTERNS: Record<string, NarrativeEntry> = {
  // ─── Major Arcana ───
  "The Fool": {
    upright: "정해진 길은 없지만, 당신이 내딛는 그곳이 곧 길이 될 것입니다. 두려움보다 호기심이 클 때가 바로 지금입니다.",
    reversed: "용기와 무모함 사이에서 혼란을 겪고 있습니다. 지금은 뛰어내리기보다 발밑을 먼저 확인해야 합니다."
  },
  "The Magician": {
    upright: "필요한 모든 도구는 이미 당신 손에 있습니다. 지금은 망설임이 아니라 실행이 답입니다.",
    reversed: "능력은 있지만 방향이 어긋나 있습니다. 재능을 엉뚱한 곳에 쓰고 있지는 않은지 점검하세요."
  },
  "The High Priestess": {
    upright: "표면 아래에 아직 드러나지 않은 중요한 정보가 있습니다. 지금은 움직이기보다 느끼는 것이 더 정확합니다.",
    reversed: "직감을 무시하고 있거나, 불안을 직감으로 착각하고 있습니다. 내면의 소리와 두려움의 소리를 구분하세요."
  },
  "The Empress": {
    upright: "억지로 만들지 않아도 자연스럽게 결실이 맺히는 시기입니다. 당신의 존재 자체가 끌어당기는 힘이 있습니다.",
    reversed: "편안함에 안주하면서 성장이 멈추고 있습니다. 안락한 울타리가 당신을 가두는 감옥이 되지 않도록 하세요."
  },
  "The Emperor": {
    upright: "감정이 아니라 구조가 답입니다. 흔들리는 상황을 잡으려면 명확한 기준과 원칙을 먼저 세우세요.",
    reversed: "통제하려 할수록 상황이 벗어납니다. 권위가 억압이 되지 않도록, 유연함을 배울 때입니다."
  },
  "The Hierophant": {
    upright: "새로운 시도보다 검증된 길이 지금은 더 안전합니다. 멘토의 조언이나 공식적인 절차를 따르세요.",
    reversed: "형식만 남은 관계나 규칙에 갇혀 있습니다. 관습을 깨고 자기만의 답을 찾아야 할 때입니다."
  },
  "The Lovers": {
    upright: "단순한 끌림이 아닌 가치관의 선택 앞에 서 있습니다. 마음이 가리키는 곳과 머리가 아는 곳이 다르다면, 지금은 마음의 나침반을 따르세요.",
    reversed: "내면의 양극화가 선택을 방해하고 있습니다. 외부의 유혹과 내면의 가치 사이에서 중심을 잡으세요."
  },
  "The Chariot": {
    upright: "지금은 밀어붙여야 할 때입니다. 상반된 힘을 하나의 의지로 통합하면 어떤 장벽도 뚫을 수 있습니다.",
    reversed: "의지가 흩어져 방향을 잃었습니다. 속도를 줄이고 내면의 갈등부터 정리하세요."
  },
  "Strength": {
    upright: "강하게 누르는 것이 아니라 부드럽게 다스리는 것이 진짜 힘입니다. 인내와 일관된 태도가 결국 이깁니다.",
    reversed: "내면의 힘이 바닥나고 있습니다. 자기 의심이 깊어지기 전에 쉬어가는 용기가 필요합니다."
  },
  "The Hermit": {
    upright: "지금은 외부의 소음에서 벗어나 혼자 생각을 정리할 때입니다. 고요함 속에서만 보이는 답이 있습니다.",
    reversed: "필요한 성찰이 고립으로 변질되고 있습니다. 혼자만의 판단에 갇히지 말고 신뢰할 수 있는 사람과 대화하세요."
  },
  "Wheel of Fortune": {
    upright: "당신의 의지보다 더 큰 거대한 운명의 수레바퀴가 돌아가고 있습니다. 변화는 이미 시작되었고, 그 흐름에 올라타야 합니다.",
    reversed: "같은 패턴이 되풀이되고 있습니다. 외부 탓보다 자신의 반복되는 선택을 점검하세요."
  },
  "Justice": {
    upright: "뿌린 대로 거두는 시기입니다. 감정적 판단을 배제하고, 사실에 근거한 정확한 결정이 필요합니다.",
    reversed: "불공정함을 느끼고 있지만, 자신에게도 원인이 있지는 않은지 정직하게 돌아보세요."
  },
  "The Hanged Man": {
    upright: "멈춤이 곧 답입니다. 지금 억지로 움직이면 더 꼬이고, 시선을 뒤집으면 새로운 길이 보입니다.",
    reversed: "의미 없는 희생을 반복하고 있습니다. 기다림에도 한계가 있으니, 이제는 결단할 시점입니다."
  },
  "Death": {
    upright: "끝이 아니라 가장 강력한 새 시작입니다. 낡은 것을 놓아야만 새로운 문이 열립니다.",
    reversed: "변화를 거부하며 이미 끝난 것을 붙잡고 있습니다. 놓아주는 것이 당신을 자유롭게 합니다."
  },
  "Temperance": {
    upright: "극단을 피하고 중용의 길을 찾으세요. 서로 다른 에너지를 하나로 섞을 수 있는 지혜로운 시기입니다.",
    reversed: "균형이 무너져 한쪽으로 치우치고 있습니다. 과한 것은 덜어내고, 부족한 것은 채우세요."
  },
  "The Devil": {
    upright: "눈에 보이지 않는 사슬이 당신을 묶고 있습니다. 그 사슬은 외부가 아니라 자신의 집착에서 비롯됩니다.",
    reversed: "어둠을 직시하기 시작했습니다. 고통스럽지만 이 자각이 해방의 첫걸음입니다."
  },
  "The Tower": {
    upright: "바닥부터 무너지는 것이 아니라, 더 단단한 기초를 쌓기 위한 필연적 해체입니다. 충격 이후에 진짜 진실이 보입니다.",
    reversed: "무너질 것을 알면서도 외면하고 있습니다. 스스로 해체하지 않으면 더 큰 충격이 옵니다."
  },
  "The Star": {
    upright: "폭풍이 지나간 자리에 희망의 빛이 비치고 있습니다. 가장 어두웠던 밤 뒤에 찾아온 새벽입니다.",
    reversed: "희망을 잃고 냉소적이 되고 있습니다. 완벽한 회복을 기대하기보다 작은 빛 하나에 집중하세요."
  },
  "The Moon": {
    upright: "보이는 것이 전부가 아닙니다. 불안과 환상이 뒤섞여 판단을 흐리게 하고 있으니, 감정에 휩쓸리지 마세요.",
    reversed: "안개가 걷히기 시작합니다. 두려웠던 것의 실체가 생각보다 작을 수 있습니다."
  },
  "The Sun": {
    upright: "모든 것이 밝아지는 시기입니다. 성공, 활력, 기쁨의 에너지가 당신을 감싸고 있습니다.",
    reversed: "겉으로는 밝아 보이지만 내면에 그늘이 있습니다. 진짜 행복인지 겉치레인지 구분하세요."
  },
  "Judgement": {
    upright: "과거의 모든 경험이 하나로 수렴하는 순간입니다. 운명의 부름에 응답할 준비를 하세요.",
    reversed: "과거에 대한 미련이나 죄책감이 전진을 막고 있습니다. 자기 자신을 용서해야 다음 장이 열립니다."
  },
  "The World": {
    upright: "하나의 거대한 순환이 완성되었습니다. 충분히 해냈고, 이제 더 넓은 세계가 기다리고 있습니다.",
    reversed: "완성 직전에 마무리를 못하고 있습니다. 남은 한 걸음을 내딛으면 모든 것이 제자리를 찾습니다."
  },

  // ─── Court Cards (코트 카드 16장) ───
  "Page of Wands": {
    upright: "새로운 열정의 불씨가 피어나고 있습니다. 아직 작지만, 이 에너지를 잘 키우면 큰 불꽃이 됩니다.",
    reversed: "시작의 열정이 금방 식어버리는 패턴이 반복되고 있습니다."
  },
  "Knight of Wands": {
    upright: "빠르고 대담하게 움직여야 할 때입니다. 열정이 행동력과 만나면 못 뚫을 벽이 없습니다.",
    reversed: "성급함이 실수를 부릅니다. 속도를 조절하고, 방향부터 정확히 잡으세요."
  },
  "Queen of Wands": {
    upright: "내면의 자신감이 외부로 빛나고 있습니다. 당신의 존재감 자체가 상황을 이끄는 힘이 됩니다.",
    reversed: "자존감이 흔들려 질투나 비교에 빠지기 쉽습니다. 다른 사람의 빛이 당신의 빛을 줄이지 않습니다."
  },
  "King of Wands": {
    upright: "비전과 실행력을 겸비한 리더의 에너지입니다. 큰 그림을 그리고 사람을 이끌어야 할 때입니다.",
    reversed: "독단과 오만이 리더십을 무너뜨립니다. 권위는 복종이 아니라 신뢰에서 나옵니다."
  },
  "Page of Cups": {
    upright: "감정의 새로운 문이 열리고 있습니다. 섬세한 감성이 예술적 영감이나 새 인연으로 나타날 수 있습니다.",
    reversed: "감정이 미숙하거나 현실과 동떨어진 공상에 빠져 있습니다."
  },
  "Knight of Cups": {
    upright: "마음이 이끄는 곳으로 향하는 낭만적 에너지입니다. 감정에 솔직해지면 원하는 것이 다가옵니다.",
    reversed: "감정에 휩쓸려 비현실적인 선택을 할 위험이 있습니다. 꿈과 현실의 경계를 지키세요."
  },
  "Queen of Cups": {
    upright: "깊은 공감과 직관의 힘이 빛나는 시기입니다. 머리보다 가슴이 더 정확한 답을 알고 있습니다.",
    reversed: "남의 감정을 너무 많이 흡수하여 자신의 감정이 혼란스러워지고 있습니다."
  },
  "King of Cups": {
    upright: "감정을 완벽히 통제하면서도 따뜻함을 잃지 않는 성숙한 에너지입니다. 이성과 감성의 균형이 핵심입니다.",
    reversed: "감정을 억누르다 폭발하거나, 냉정함이 무관심으로 변질될 위험이 있습니다."
  },
  "Page of Swords": {
    upright: "날카로운 호기심과 탐구 정신이 작동하고 있습니다. 정보를 수집하고 상황을 파악할 때입니다.",
    reversed: "말이 앞서거나 불필요한 논쟁에 에너지를 낭비하고 있습니다."
  },
  "Knight of Swords": {
    upright: "결단력 있게 돌파해야 할 순간입니다. 머뭇거리면 기회가 사라집니다.",
    reversed: "무모한 공격성이나 경솔한 판단으로 관계와 상황을 해칠 수 있습니다."
  },
  "Queen of Swords": {
    upright: "감정에 휘둘리지 않는 날카로운 통찰력의 시기입니다. 진실을 직시하는 용기가 강점이 됩니다.",
    reversed: "냉정함이 차가움으로, 솔직함이 상처로 변질되고 있습니다. 칼날의 방향을 점검하세요."
  },
  "King of Swords": {
    upright: "논리와 공정함으로 판단해야 할 때입니다. 사적 감정을 배제하고 원칙에 따라 결정하세요.",
    reversed: "권위가 폭군의 칼이 되고 있습니다. 지성이 지배욕에 오염되지 않도록 경계하세요."
  },
  "Page of Pentacles": {
    upright: "새로운 배움이나 투자의 씨앗을 심을 때입니다. 작지만 확실한 첫걸음이 큰 성과로 이어집니다.",
    reversed: "계획만 세우고 실행하지 않거나, 눈앞의 이익에만 집중하고 있습니다."
  },
  "Knight of Pentacles": {
    upright: "느리지만 확실한 진전의 에너지입니다. 꾸준함과 성실함이 결국 가장 빠른 길입니다.",
    reversed: "완벽주의에 빠져 진척이 없거나, 지루함을 견디지 못하고 포기할 위험이 있습니다."
  },
  "Queen of Pentacles": {
    upright: "현실적 안정감과 풍요로움을 관리하는 힘이 있습니다. 돌봄과 실용성의 균형이 빛납니다.",
    reversed: "물질에 대한 불안이 삶의 여유를 앗아가고 있습니다. 가진 것에 대한 감사를 잊지 마세요."
  },
  "King of Pentacles": {
    upright: "물질적 성공과 안정의 정점에 있는 에너지입니다. 축적한 것을 현명하게 관리하고 나누세요.",
    reversed: "탐욕이 판단을 흐리거나, 돈에 대한 집착이 관계를 파괴하고 있습니다."
  },
  // ─── Minor Number Cards (40장) ───
  "Ace of Wands": {
    upright: "불꽃 하나가 피어올랐습니다. 아직 형태는 없지만, 이 뜨거운 영감을 따라가면 놀라운 시작이 됩니다.",
    reversed: "번뜻이는 아이디어가 많지만 어느 것도 불을 붙이지 못하고 있습니다. 한 가지에 집중하세요."
  },
  "Two of Wands": {
    upright: "세상의 지도가 손 안에 있습니다. 안전한 성 안에 머물 것인가, 미지의 바다로 나갈 것인가 — 선택의 순간입니다.",
    reversed: "계획은 거창하지만 첫발을 내딛지 못하고 있습니다. 완벽한 타이밍은 오지 않습니다."
  },
  "Three of Wands": {
    upright: "씨앗이 싹을 틔웠고, 이제 수확선이 수평선에 보이기 시작합니다. 기다림이 결실로 바뀌는 시기입니다.",
    reversed: "기대한 결과가 지연되고 있어 초조함이 밀려옵니다. 시야를 넓혀보면 다른 항로가 보입니다."
  },
  "Four of Wands": {
    upright: "축하할 일이 있습니다. 노력이 결실을 맺고, 사랑하는 사람들과 기쁨을 나눌 수 있는 안정적인 순간입니다.",
    reversed: "기쁜 일이 있어도 마음 한편이 불안합니다. 완벽한 행복에 대한 강박을 내려놓으세요."
  },
  "Five of Wands": {
    upright: "의견 충돌과 경쟁이 치열합니다. 그러나 이 마찰은 더 강한 결과물을 만들기 위한 연마 과정입니다.",
    reversed: "불필요한 다툼에 에너지를 소모하고 있습니다. 이길 수 없는 싸움은 피하는 것이 전략입니다."
  },
  "Six of Wands": {
    upright: "승리의 행진입니다. 주변의 인정과 지지를 받으며 앞으로 나아가는 자신감의 절정기입니다.",
    reversed: "겉으로는 성공했지만 내면의 공허함이 있거나, 인정받지 못한 것에 상처받고 있습니다."
  },
  "Seven of Wands": {
    upright: "높은 곳에 올라온 만큼 도전자가 많습니다. 물러서지 않는 의지가 지금 당신의 가장 큰 무기입니다.",
    reversed: "사방의 압박에 지쳐가고 있습니다. 모든 전선에서 싸울 필요는 없습니다. 핵심을 골라 지키세요."
  },
  "Eight of Wands": {
    upright: "정체되었던 모든 것이 일시에 움직이기 시작합니다. 속도가 빨라지니 방향만 잘 잡으면 됩니다.",
    reversed: "서두른 일이 오히려 꼬이고 있습니다. 급할수록 돌아가세요."
  },
  "Nine of Wands": {
    upright: "지치고 상처투성이지만, 포기하기엔 너무 많이 왔습니다. 마지막 고비를 넘기면 끝이 보입니다.",
    reversed: "버티는 것과 고집을 부리는 것은 다릅니다. 더 이상 의미 없는 전투라면 내려놓을 용기도 필요합니다."
  },
  "Ten of Wands": {
    upright: "짊어진 짐이 너무 무겁습니다. 혼자 다 하려는 책임감이 오히려 발목을 잡고 있습니다.",
    reversed: "드디어 짐을 내려놓기 시작했습니다. 또는 필요한 위임과 분배를 통해 길이 보이기 시작합니다."
  },
  "Ace of Cups": {
    upright: "마음속에서 샘물이 솟아오릅니다. 새로운 감정, 새로운 사랑, 새로운 영감의 문이 열리고 있습니다.",
    reversed: "감정의 통로가 막혀 있습니다. 주는 것도, 받는 것도 두려워하고 있지는 않은지 돌아보세요."
  },
  "Two of Cups": {
    upright: "두 마음이 하나로 만나는 순간입니다. 진정한 파트너십과 상호 존중의 에너지가 흐르고 있습니다.",
    reversed: "관계에 균열이 생기고 있습니다. 주고받는 것의 불균형이 원인일 수 있습니다."
  },
  "Three of Cups": {
    upright: "함께할 때 더 빛나는 시기입니다. 우정, 축하, 연대의 기운이 삶에 활력을 불어넣고 있습니다.",
    reversed: "겉으로는 즐거워 보이지만 관계 안에 시기나 소외감이 숨어 있을 수 있습니다."
  },
  "Four of Cups": {
    upright: "눈앞에 새로운 기회가 놓여 있는데 보지 못하고 있습니다. 무기력과 권태 뒤에 가려진 선물을 찾으세요.",
    reversed: "무기력에서 벗어나기 시작합니다. 새로운 자극에 마음을 열 준비가 된 시점입니다."
  },
  "Five of Cups": {
    upright: "엎질러진 물에 시선이 고정되어 있습니다. 잃은 것은 슬프지만, 아직 남아 있는 것도 있습니다.",
    reversed: "상실의 슬픔에서 서서히 고개를 들고 있습니다. 남은 것에서 다시 시작할 힘을 찾으세요."
  },
  "Six of Cups": {
    upright: "과거의 따뜻한 기억이 현재를 치유합니다. 순수했던 시절의 마음으로 돌아가 보세요.",
    reversed: "과거에 대한 향수가 현재의 발목을 잡고 있습니다. 추억은 간직하되 앞으로 나아가세요."
  },
  "Seven of Cups": {
    upright: "눈앞에 수많은 선택지가 펼쳐져 있습니다. 그러나 환상과 현실을 구분해야 합니다. 모두 진짜는 아닙니다.",
    reversed: "환상에서 깨어나 현실적인 선택을 할 준비가 되고 있습니다. 하나만 골라 집중하세요."
  },
  "Eight of Cups": {
    upright: "더 이상 채워지지 않는 것을 알면서 떠나는 것은 포기가 아니라 성장입니다. 더 깊은 의미를 찾아 길을 나서세요.",
    reversed: "떠나야 할 것을 알면서도 떠나지 못하고 있습니다. 익숙한 것이 옳은 것은 아닙니다."
  },
  "Nine of Cups": {
    upright: "소원성취의 카드입니다. 바라던 것이 이루어지고 있으니, 이 만족을 온전히 누리세요.",
    reversed: "겉으로는 다 가진 것 같지만 내면의 공허함이 있습니다. 진짜 원하는 것이 무엇인지 다시 물어보세요."
  },
  "Ten of Cups": {
    upright: "감정적 풍요와 가정적 행복의 절정입니다. 사랑하는 사람들과 함께하는 것이 최고의 축복입니다.",
    reversed: "이상적인 관계에 대한 기대가 현실과 맞지 않아 실망하고 있습니다. 완벽한 행복은 없지만, 좋은 행복은 가능합니다."
  },
  "Ace of Swords": {
    upright: "안개를 가르는 한 줄기 빛처럼 명확한 진실이 드러나는 순간입니다. 지금의 통찰을 놓치지 마세요.",
    reversed: "진실을 알면서도 외면하고 있거나, 혼란 속에서 잘못된 결론을 내릴 위험이 있습니다."
  },
  "Two of Swords": {
    upright: "눈을 가리고 있지만 마음은 이미 답을 알고 있습니다. 결정을 미루는 것 자체가 하나의 선택입니다.",
    reversed: "미뤄왔던 결정을 더 이상 피할 수 없습니다. 불완전하더라도 선택해야 나아갈 수 있습니다."
  },
  "Three of Swords": {
    upright: "가슴을 관통하는 슬픔이지만, 이 아픔은 진실을 직면한 대가입니다. 고통을 통과해야 치유가 시작됩니다.",
    reversed: "상처에서 회복되고 있지만 흉터가 남아 있습니다. 완전한 치유를 위해 감정을 억누르지 마세요."
  },
  "Four of Swords": {
    upright: "전쟁터에서 잠시 물러나 쉬어야 합니다. 지금의 멈춤은 다음 전투를 위한 전략적 후퇴입니다.",
    reversed: "충분히 쉬지 못한 채 다시 일어서고 있습니다. 회복이 완료되지 않은 출전은 위험합니다."
  },
  "Five of Swords": {
    upright: "이겼지만 잃은 것이 더 많은 승리입니다. 이 싸움이 정말 그만한 가치가 있었는지 돌아보세요.",
    reversed: "불필요한 자존심 싸움에서 물러나기 시작합니다. 때로는 양보가 진짜 승리입니다."
  },
  "Six of Swords": {
    upright: "폭풍우 뒤의 잔잔한 물살을 따라 새로운 곳으로 향하고 있습니다. 과거를 뒤로 하고 전진하는 여정입니다.",
    reversed: "떠나야 할 곳에서 발이 묶여 있습니다. 또는 도착지가 기대만큼 평화롭지 않을 수 있습니다."
  },
  "Seven of Swords": {
    upright: "정면 돌파가 아닌 지혜로운 우회가 필요한 때입니다. 다만 전략과 기만의 경계를 넘지 않도록 주의하세요.",
    reversed: "숨겨진 진실이 드러나고 있습니다. 비밀이 오래가지 않으니, 정직한 접근을 택하세요."
  },
  "Eight of Swords": {
    upright: "묶여 있는 것은 실제 사슬이 아니라 자기 안의 두려움입니다. 눈가리개를 벗으면 길이 보입니다.",
    reversed: "스스로 만든 감옥에서 벗어나기 시작합니다. 시야가 넓어지면서 탈출구가 보이기 시작합니다."
  },
  "Nine of Swords": {
    upright: "한밤의 불안이 현실보다 더 크게 느껴지는 시기입니다. 두려움의 대부분은 상상이 만든 그림자입니다.",
    reversed: "최악의 밤이 지나가고 있습니다. 마음의 짐을 나눌 사람을 찾으면 회복이 빨라집니다."
  },
  "Ten of Swords": {
    upright: "가장 바닥입니다. 하지만 바닥을 찍었다는 것은 이제 올라갈 일만 남았다는 뜻이기도 합니다.",
    reversed: "최악의 상황에서 서서히 일어나고 있습니다. 완전한 끝이 완전한 시작을 가능하게 합니다."
  },
  "Ace of Pentacles": {
    upright: "단단한 현실적 기회가 손에 들어오고 있습니다. 이 씨앗을 잘 심으면 큰 수확으로 돌아올 것입니다.",
    reversed: "기회가 왔지만 준비가 되지 않았거나, 눈앞의 이익에 급급해 본질을 놓치고 있습니다."
  },
  "Two of Pentacles": {
    upright: "두 가지 이상의 일을 동시에 저글링하고 있습니다. 유연하게 균형을 잡되, 우선순위를 정하세요.",
    reversed: "너무 많은 것을 감당하려다 모든 공을 떨어뜨릴 위험이 있습니다. 무언가를 내려놓아야 합니다."
  },
  "Three of Pentacles": {
    upright: "혼자서는 완성할 수 없는 일입니다. 전문성과 협업이 만날 때 최고의 결과가 나옵니다.",
    reversed: "팀워크에 문제가 있거나, 역할 분담이 불명확합니다. 소통 부재가 결과물의 질을 떨어뜨립니다."
  },
  "Four of Pentacles": {
    upright: "가진 것을 단단히 지키는 것도 중요하지만, 너무 꽉 쥐면 새로운 것이 들어올 공간이 없습니다.",
    reversed: "집착을 놓기 시작합니다. 또는 갑작스러운 지출로 안정감이 흔들리고 있습니다."
  },
  "Five of Pentacles": {
    upright: "경제적·정서적으로 추위에 떨고 있는 시기입니다. 하지만 문 하나를 열면 도움이 있다는 사실을 잊지 마세요.",
    reversed: "고난의 터널 끝에 빛이 보이기 시작합니다. 자존심을 내려놓고 도움을 받아들이세요."
  },
  "Six of Pentacles": {
    upright: "주는 기쁨과 받는 감사가 순환하는 시기입니다. 균형 잡힌 나눔이 더 큰 풍요를 부릅니다.",
    reversed: "주고받음의 균형이 무너져 있습니다. 일방적인 희생이나 의존적 관계를 점검하세요."
  },
  "Seven of Pentacles": {
    upright: "지금까지의 노력을 되돌아보는 중간 점검의 시기입니다. 성급한 수확보다 인내가 더 큰 열매를 맺습니다.",
    reversed: "투자한 시간 대비 성과가 보이지 않아 초조합니다. 방향을 재점검할 필요가 있습니다."
  },
  "Eight of Pentacles": {
    upright: "묵묵히 한 땀 한 땀 실력을 갈고닦는 시기입니다. 화려하지 않지만, 이 성실함이 결국 대가를 만듭니다.",
    reversed: "반복되는 작업에 질려 의미를 잃어가고 있습니다. 또는 완벽주의가 진전을 막고 있습니다."
  },
  "Nine of Pentacles": {
    upright: "오랜 노력 끝에 찾아온 풍요와 독립의 시기입니다. 스스로 일군 안정감을 자부심으로 여기세요.",
    reversed: "물질적으로는 풍족하지만 외로움이 있거나, 자립을 위해 너무 많은 것을 포기한 것은 아닌지 돌아보세요."
  },
  "Ten of Pentacles": {
    upright: "세대를 관통하는 안정과 유산의 에너지입니다. 가정의 평화와 장기적인 재정적 안정이 보장되는 시기입니다.",
    reversed: "가족 내 갈등이나 재정 문제가 안정을 위협하고 있습니다. 유산보다 관계가 먼저입니다."
  }
};

export function generateTarotNarrative(card: string, position: string, isReversed: boolean = false): string {
  const entry = NARRATIVE_PATTERNS[card];
  if (entry) {
    return isReversed ? entry.reversed : entry.upright;
  }
  // 매칭 안 되는 마이너 넘버 카드 → 포지션 기반 범용 해석
  const genericByPosition: Record<string, string> = {
    "현재 상황": "현재 이 카드의 에너지가 상황의 흐름을 주도하고 있습니다.",
    "핵심 문제": "이 카드가 가리키는 에너지가 핵심 갈등의 원인입니다.",
    "숨겨진 원인": "의식하지 못했던 이 에너지가 배후에서 작용하고 있습니다.",
    "조언": "이 카드의 지혜를 현실에 적용해 보세요.",
    "가까운 결과": "가까운 미래에 이 에너지의 현실화가 예상됩니다.",
    "past": "과거에 이 에너지가 현재 상황의 씨앗을 심었습니다.",
    "present": "현재 이 카드의 에너지가 활발하게 작용하고 있습니다.",
    "future": "앞으로 이 에너지가 펼쳐질 가능성이 높습니다."
  };
  return genericByPosition[position] || "카드의 에너지가 당신의 삶에 스며들고 있습니다.";
}

// ═══════════════════════════════════════
// 3. 스프레드 및 조합 분석 레이어
// ═══════════════════════════════════════

export interface DrawnCard {
  name: string;
  suit?: 'Wands' | 'Cups' | 'Swords' | 'Pentacles' | string;
  rank?: number;
  isMajor: boolean;
  isReversed: boolean;
  position: string;
}

export interface CombinationInsight {
  pattern: string;        // 패턴명
  cards: string[];        // 관련 카드
  meaning: string;        // 한국어 해석
  significance: 'high' | 'medium' | 'low';
}

/**
 * A24: 카드 조합 해석 고도화
 */
export function analyzeCardCombinations(drawnCards: DrawnCard[]): CombinationInsight[] {
  const insights: CombinationInsight[] = [];
  const count = drawnCards.length;
  if (count === 0) return [];

  const cardNames = drawnCards?.map(c => c.name);

  // 1) 같은 숫자 반복 (3장 이상)
  const rankMap: Record<number, string[]> = {};
  drawnCards.forEach(c => {
    if (c.rank !== undefined) {
      rankMap[c.rank] = [...(rankMap[c.rank] || []), c.name];
    }
  });
  Object.entries(rankMap).forEach(([rank, names]) => {
    if (names.length >= 3) {
      insights.push({
        pattern: `숫자 ${rank}의 에너지 집중`,
        cards: names,
        meaning: `여러 장의 ${rank}번 카드가 동시에 나타난 것은 해당 수비학적 에너지가 현재 삶의 전반에 강력한 화두임을 뜻합니다.`,
        significance: 'high'
      });
    }
  });

  // 2) 같은 수트 과다 (4장 이상)
  const suitMap: Record<string, string[]> = {};
  drawnCards.forEach(c => {
    if (c.suit) {
      suitMap[c.suit] = [...(suitMap[c.suit] || []), c.name];
    }
  });
  Object.entries(suitMap).forEach(([suit, names]) => {
    if (names.length >= 4) {
      const suitMeanings: Record<string, string> = {
        Wands: "열정과 행동력, 새로운 도전에 대한 에너지가 매우 강력하게 작용하고 있습니다.",
        Cups: "관계의 깊이와 정서적 교감, 내면의 흐름이 상황의 핵심 열쇠입니다.",
        Swords: "이성적인 판단과 결단, 혹은 해결해야 할 논리적 갈등이 주된 테마입니다.",
        Pentacles: "현실적인 이익과 안정, 결과물에 대한 집중도가 극도로 높아진 시기입니다."
      };
      insights.push({
        pattern: `${suit} 원소 지배적`,
        cards: names,
        meaning: suitMeanings[suit] || "특정 원소의 기운이 지배적으로 작용하고 있습니다.",
        significance: 'high'
      });
    }
  });

  // 3) 메이저 아르카나 비율 (50% 이상)
  const majorCount = drawnCards.filter(c => c.isMajor).length;
  if (majorCount / count >= 0.5) {
    insights.push({
      pattern: "운명적 전환기",
      cards: drawnCards.filter(c => c.isMajor).map(c => c.name),
      meaning: "메이저 카드의 비중이 압도적인 것은 현재 상황이 단순한 일상을 넘어 인생의 큰 흐름이 바뀌는 중요한 변곡점임을 의미합니다.",
      significance: 'high'
    });
  }

  // 4) 연속 숫자 (3장 이상 성장 흐름)
  const ranks = drawnCards.filter(c => c.rank !== undefined).map(c => c.rank!).sort((a,b) => a-b);
  let sequenceCount = 1;
  for (let i = 0; i < ranks.length - 1; i++) {
    if (ranks[i+1] === ranks[i] + 1) sequenceCount++;
    else sequenceCount = 1;
    if (sequenceCount >= 3) {
      insights.push({
        pattern: "진행/성장 흐름",
        cards: [], // 범용 패턴
        meaning: "단계적인 발전과 성장이 이루어지고 있는 흐름입니다. 서두르지 말고 차근차근 나아가세요.",
        significance: 'medium'
      });
      break;
    }
  }

  // 5) 대립 카드 감지 (극과 극의 공존)
  const conflicts = [
    { p: ["The Tower", "The Star"], m: "갑작스러운 붕괴 뒤에 찾아오는 거대한 희망과 치유의 메시지입니다." },
    { p: ["Death", "The Empress"], m: "하나의 완전한 끝이 풍요로운 새로운 시작을 잉태하고 있는 강력한 재생의 흐름입니다." },
    { p: ["The Devil", "The Lovers"], m: "구속과 자유, 집착과 진정한 사랑 사이에서의 강렬한 선택을 상징합니다." }
  ];
  conflicts.forEach(cf => {
    if (cf.p.every(name => cardNames.includes(name))) {
      insights.push({
        pattern: "극과 극의 공존",
        cards: cf.p,
        meaning: cf.m,
        significance: 'high'
      });
    }
  });

  // 6) Court 카드 비율 (Page/Knight/Queen/King)
  const courtCount = drawnCards.filter(c => ["Page", "Knight", "Queen", "King"].some(role => c.name.includes(role))).length;
  if (courtCount / count >= 0.4) {
    insights.push({
      pattern: "인물 영향력 강함",
      cards: [],
      meaning: "상황을 주도하는 것은 사건보다 '사람'입니다. 주변 인물과의 관계나 본인의 사회적 역할이 핵심입니다.",
      significance: 'medium'
    });
  }

  return insights;
}

export interface SpreadPositionInfo {
  name: string;           // 위치명 한국어
  focus: string;          // 이 위치가 보는 것 (1문장)
  readingTip: string;     // AI가 해석할 때 참고할 팁 (1문장)
  weight: number;         // 해석 비중 1~10
}

/**
 * A25: 스프레드 위치별 의미 강화
 */
export function getSpreadPositionContext(spreadType: string, position: number): SpreadPositionInfo {
  const spreadMap: Record<string, SpreadPositionInfo[]> = {
    celtic_cross: [
      { name: "현재 상황", focus: "질문자가 처한 지금의 중심 에너지", readingTip: "질문의 핵심 테마로 삼으세요.", weight: 10 },
      { name: "장애물", focus: "현재 진행을 가로막는 직접적인 원인", readingTip: "극복해야 할 과제로 해석하세요.", weight: 9 },
      { name: "기저", focus: "무의식 속에 깔린 근본적인 배경", readingTip: "과거로부터 이어진 뿌리를 찾아보세요.", weight: 7 },
      { name: "과거", focus: "최근에 지나온 영향력과 원인", readingTip: "이미 일어난 일로 현재의 참고 자료입니다.", weight: 6 },
      { name: "왕관", focus: "의식적으로 생각하는 목표나 최선의 가능성", readingTip: "질문자가 바라는 이상향입니다.", weight: 6 },
      { name: "미래", focus: "곧 다가올 사건이나 흐름", readingTip: "현재 흐름이 이어졌을 때의 예정된 결과입니다.", weight: 8 },
      { name: "자세", focus: "상황을 바라보는 질문자의 주관적 태도", readingTip: "내면의 의지나 태도를 짚어주세요.", weight: 7 },
      { name: "환경", focus: "타인의 시선이나 주변의 객관적 상황", readingTip: "외부 압력이나 도움의 여부를 확인하세요.", weight: 7 },
      { name: "희망과 공포", focus: "가장 원하거나 두려워하는 요소", readingTip: "내면의 무의식적 불안을 읽어주세요.", weight: 5 },
      { name: "최종 결과", focus: "모든 흐름이 도달하게 될 종착역", readingTip: "전체 리딩의 결론으로 강조하세요.", weight: 10 }
    ],
    three_card: [
      { name: "과거", focus: "현재에 이르게 된 인과 관계", readingTip: "무슨 일이 있었는지 설명하세요.", weight: 6 },
      { name: "현재", focus: "지금 당장 직면한 상황의 정수", readingTip: "가장 비중 있게 다뤄야 할 부분입니다.", weight: 10 },
      { name: "미래", focus: "현재 흐름의 연장선상에 있는 결과", readingTip: "변화 가능성을 열어두고 조언하세요.", weight: 8 }
    ],
    horseshoe: [
      { name: "과거", focus: "영향력을 미치고 있는 지나온 일들", readingTip: "배경 설명을 풍성하게 하세요.", weight: 5 },
      { name: "현재", focus: "당장 해결해야 할 상황", readingTip: "지금의 에너지를 정의하세요.", weight: 8 },
      { name: "숨은 영향", focus: "보이지 않게 작용하는 변수", readingTip: "의외의 사실을 깨닫게 해주세요.", weight: 7 },
      { name: "장애물", focus: "도전해야 할 어려운 점", readingTip: "명확한 해결책과 연결하세요.", weight: 9 },
      { name: "외부 환경", focus: "주변 사람이나 사회적 조건", readingTip: "도움이 될지 방해가 될지 판단하세요.", weight: 6 },
      { name: "조언", focus: "취해야 할 구체적인 행동", readingTip: "희망적인 가이드를 제공하세요.", weight: 10 },
      { name: "결과", focus: "상황의 최종 마무리", readingTip: "최선을 다했을 때의 결실입니다.", weight: 10 }
    ],
    single: [
      { name: "오늘의 메시지", focus: "오늘 하루를 관통하는 핵심 조언", readingTip: "단호하고 명확한 한 문장으로 시작하세요.", weight: 10 }
    ]
  };

  const layout = spreadMap[spreadType] || spreadMap.single;
  return layout[position % layout.length];
}

export function hybridTarotReading(cards: any[]) {
  return cards?.map(c => ({
    ...c,
    structure: analyzeTarotStructure(c.name, c.position, c.isReversed),
    narrative: generateTarotNarrative(c.name, c.position, c.isReversed)
  }));
}

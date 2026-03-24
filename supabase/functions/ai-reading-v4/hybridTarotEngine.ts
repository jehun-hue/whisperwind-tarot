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
  "The World":            { past: "cycle_completed", present: "integration_peak", future: "new_world_opens", "현재 상황": "integration_peak", "핵심 문제": "completion_anxiety", "조언": "celebrate_and_move", "가까운 결과": "new_world_opens" }
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

/**
 * consensusEngine.ts (v8)
 * - PART 9: Cross-System Consensus Algorithm.
 * - Computes consensus based on system weighted alignment across 5 systems.
 */

import { SymbolicVector } from "./symbolicPatternEngine.ts";
import { cosineSimilarity } from "./mathUtils.ts";

const SYSTEM_WEIGHTS: Record<string, number> = {
  "tarot": 0.40,
  "saju": 0.25,
  "ziwei": 0.20,
  "astrology": 0.10,
  "numerology": 0.05
};

export interface ConflictLog {
  pair: string;
  similarity: number;
  conflict_level: "none" | "mild" | "moderate" | "severe";
  mediator?: string;
  resolution: string;
}

export interface ConsensusOutput {
  consensus_score: number;
  confidence_score: number;
  prediction_strength: number;
  dominant_vector: Record<string, number>;
  alignment_matrix: any[];
  conflict_log: ConflictLog[];
  conflict_summary: string;
}

export function calculateConsensusV8(
  vectors: SymbolicVector[], 
  birthTimeProvided: boolean = true,
  birthPlaceProvided: boolean = true,
  customWeights?: Record<string, number>
): ConsensusOutput {
  if (vectors.length === 0) {
    return { consensus_score: 0, confidence_score: 0, prediction_strength: 0, dominant_vector: {}, alignment_matrix: [], conflict_log: [], conflict_summary: "데이터 없음" };
  }

  // 타로-동양역학 브릿지 매핑 (차원 통합)
  const BRIDGE_MAP: Record<string, string> = {
    // 재물/금전
    "financial_stability":   "finance",
    "material_success":      "finance",
    "wealth":                "finance",
    "abundance":             "finance",
    "poverty":               "finance",

    // 성장/기회
    "new_beginning":         "growth",
    "spiritual_growth":      "growth",
    "opportunity":           "growth",
    "expansion":             "growth",
    "potential":             "growth",

    // 관계/감정
    "emotional_connection":  "relationship",
    "love":                  "relationship",
    "marriage":              "relationship",
    "separation":            "relationship",
    "conflict":              "relationship",

    // 직업/사회적 지위
    "victory":               "career",
    "authority":             "career",
    "promotion":             "career",
    "recognition":           "career",
    "ambition":              "career",

    // 위험/갈등
    "hidden_danger":         "risk",
    "inner_conflict":        "risk",
    "instability":           "risk",
    "obstacle":              "risk",
    "loss":                  "risk",

    // 변화/전환
    "life_transition":       "location_change",
    "sudden_change":         "location_change",
    "transition":            "location_change",
    "relocation":            "location_change",
    "emigration":            "location_change",
    "return_home":           "location_change",

    // 결정/타이밍
    "decision":              "decision_timing",
    "timing":                "decision_timing",
    "crossroads":            "decision_timing",
    "turning_point":         "decision_timing",
    "deadline":              "decision_timing",

    // 건강/에너지
    "health":                "vitality",
    "energy":                "vitality",
    "illness":               "vitality",
    "recovery":              "vitality",
    "exhaustion":            "vitality",
    "healing":               "vitality",
    "inner_balance":         "vitality",
    "emotional_healing":     "vitality",
    "vitality":              "vitality",
    "rest":                  "vitality",
    "renewal":               "vitality",
    "stability":             "vitality",
    "hope":                  "vitality"
  };

  // 벡터 정규화 함수 (브릿지 적용)
  function normalizeVector(vec: Record<string, number>): Record<string, number> {
    const normalized: Record<string, number> = {};
    for (const [key, value] of Object.entries(vec)) {
      const mappedKey = BRIDGE_MAP[key] ?? key;
      normalized[mappedKey] = Math.max(normalized[mappedKey] ?? 0, value);
    }
    return normalized;
  }

  // 1. Group vectors by system for cross-comparison
  const systemGroups: Record<string, Record<string, number>> = {};
  vectors.forEach(v => {
    const sys = v.system.toLowerCase();
    if (!systemGroups[sys]) systemGroups[sys] = {};
    Object.entries(v.vector).forEach(([dim, val]) => {
      systemGroups[sys][dim] = (systemGroups[sys][dim] || 0) + val;
    });
  });

  // 2. Compute Cross-System Alignment (Cosine Similarity) with Dynamic Weights
  let totalConsensus = 0;
  let totalWeight = 0;
  const alignmentMatrix: any[] = [];
  const systems = Object.keys(systemGroups);

  // B-131 fix: customWeights(토픽 가중치) 우선 적용, 없으면 SYSTEM_WEIGHTS 사용
  const currentWeights = customWeights ? { ...customWeights } : { ...SYSTEM_WEIGHTS };
  let systemCriteria = 5;
  if (!birthTimeProvided) {
    currentWeights["ziwei"] = 0;
    currentWeights["astrology"] = 0;
    systemCriteria = 3;
  }

  if (!birthPlaceProvided) {
    currentWeights["astrology"] = Math.min(
      currentWeights["astrology"] ?? 0.15,
      0.08
    );
  }

  const getMagnitude = (vec: Record<string, number>) =>
    Math.sqrt(Object.values(vec).reduce((sum, v) => sum + v * v, 0));

  const conflictLog: ConflictLog[] = [];

  for (let i = 0; i < systems.length; i++) {
    for (let j = i + 1; j < systems.length; j++) {
      const sysI = systems[i];
      const sysJ = systems[j];
      const similarity = cosineSimilarity(
        normalizeVector(systemGroups[sysI]),
        normalizeVector(systemGroups[sysJ])
      );

      const magI = getMagnitude(systemGroups[sysI]);
      const magJ = getMagnitude(systemGroups[sysJ]);
      const weightI = (currentWeights[sysI] || 0.1) * (magI < 0.1 ? 0.5 : 1.0);
      const weightJ = (currentWeights[sysJ] || 0.1) * (magJ < 0.1 ? 0.5 : 1.0);
      const pairWeight = weightI * weightJ;

      if (pairWeight > 0) {
        totalConsensus += similarity * pairWeight;
        totalWeight += pairWeight;
      }

      let conflict_level: ConflictLog["conflict_level"] = "none";
      let resolution = "일치 — 두 시스템 신호 강화";
      if (similarity < 0.0) {
        conflict_level = "severe";
        resolution = "심각 충돌 — 타로 판단 우선, 보조 엔진 조건부 참고";
      } else if (similarity < 0.2) {
        conflict_level = "moderate";
        resolution = "중간 충돌 — 타로 방향 유지, 보조 엔진 경고 추가";
      } else if (similarity < 0.4) {
        conflict_level = "mild";
        resolution = "경미 충돌 — 두 관점 병기 후 내담자 판단 유도";
      }

      // B-138 fix: 타로-점성술 충돌 시 점성술 가중치 자동 완화
      if (
        (sysI === "tarot" && sysJ === "astrology") ||
        (sysI === "astrology" && sysJ === "tarot")
      ) {
        if (conflict_level === "severe") {
          // 심각 충돌: 점성술 가중치 50% 감소
          currentWeights["astrology"] = Math.min(
            currentWeights["astrology"] || 0.10,
            (currentWeights["astrology"] || 0.10) * 0.5
          );
          resolution += " (점성술 가중치 50% 감소 적용)";
        } else if (conflict_level === "moderate") {
          // 중간 충돌: 점성술 가중치 30% 감소
          currentWeights["astrology"] = Math.min(
            currentWeights["astrology"] || 0.10,
            (currentWeights["astrology"] || 0.10) * 0.7
          );
          resolution += " (점성술 가중치 30% 감소 적용)";
        }
      }

      let mediator: string | undefined;
      if (conflict_level === "moderate" || conflict_level === "severe") {
        const ziweiVec = systemGroups["ziwei"];
        const numVec = systemGroups["numerology"];
        if (ziweiVec && getMagnitude(ziweiVec) > 0.1) {
          const simZiweiI = cosineSimilarity(normalizeVector(ziweiVec), normalizeVector(systemGroups[sysI]));
          const simZiweiJ = cosineSimilarity(normalizeVector(ziweiVec), normalizeVector(systemGroups[sysJ]));
          mediator = simZiweiI > simZiweiJ
            ? `자미두수 → ${sysI} 지지 (유사도 ${simZiweiI.toFixed(2)})`
            : `자미두수 → ${sysJ} 지지 (유사도 ${simZiweiJ.toFixed(2)})`;
        } else if (numVec && getMagnitude(numVec) > 0.1) {
          const simNumI = cosineSimilarity(normalizeVector(numVec), normalizeVector(systemGroups[sysI]));
          const simNumJ = cosineSimilarity(normalizeVector(numVec), normalizeVector(systemGroups[sysJ]));
          mediator = simNumI > simNumJ
            ? `수비학 → ${sysI} 지지 (유사도 ${simNumI.toFixed(2)})`
            : `수비학 → ${sysJ} 지지 (유사도 ${simNumJ.toFixed(2)})`;
        }
      }

      conflictLog.push({ pair: `${sysI}-${sysJ}`, similarity, conflict_level, mediator, resolution });
      alignmentMatrix.push({ pair: `${sysI}-${sysJ}`, similarity });
    }
  }

  const consensus_score = Math.max(0, totalWeight > 0 ? totalConsensus / totalWeight : 0);

  const reportingSystemsCount = systems.filter(sys => (currentWeights[sys] || 0) > 0).length;
  const severeConflicts = conflictLog.filter(c => c.conflict_level === "severe").length;
  const moderateConflicts = conflictLog.filter(c => c.conflict_level === "moderate").length;
  const conflictPenalty = severeConflicts * 0.10 + moderateConflicts * 0.05;
  const consensusBonus = consensus_score > 0.7 ? 0.15 : consensus_score > 0.5 ? 0.08 : 0;
  const rawConfidence = (reportingSystemsCount / systemCriteria) * (1 + consensus_score) / 2
    + consensusBonus - conflictPenalty;
  const confidence_score = Math.max(0, Math.min(1.0, rawConfidence));

  const prediction_strength = Math.max(0, consensus_score * confidence_score);

  const dominantVector: Record<string, number> = {};
  Object.entries(systemGroups).forEach(([sys, vec]) => {
    const mag = getMagnitude(vec);
    const weight = (currentWeights[sys] || 0.1) * (mag < 0.1 ? 0.5 : 1.0);
    if (weight > 0) {
      Object.entries(vec).forEach(([dim, val]) => {
        dominantVector[dim] = (dominantVector[dim] || 0) + (val * weight);
      });
    }
  });

  const severeCount = conflictLog.filter(c => c.conflict_level === "severe").length;
  const moderateCount = conflictLog.filter(c => c.conflict_level === "moderate").length;
  const conflict_summary = severeCount > 0
    ? `⚠️ 심각 충돌 ${severeCount}건 — 타로 판단 우선 적용`
    : moderateCount > 0
    ? `⚡ 중간 충돌 ${moderateCount}건 — 조건부 경고 포함`
    : `✅ 충돌 없음 — 전체 엔진 합의`;

  return {
    consensus_score,
    confidence_score,
    prediction_strength,
    dominant_vector: dominantVector,
    alignment_matrix: alignmentMatrix,
    conflict_log: conflictLog,
    conflict_summary,
  };
}

// ═══════════════════════════════════════════════════════════════
// B-64R: 토픽별 동적 가중치 조정 (topicWeightedConsensus)
// ═══════════════════════════════════════════════════════════════

export type QuestionTopic =
  | "relationship" | "career" | "finance" | "health"
  | "spirituality" | "family" | "decision" | "general"
  | "migration" | "life_change" | "money";

const TOPIC_WEIGHTS: Record<QuestionTopic, Record<string, number>> = {
  relationship: { tarot: 0.45, astrology: 0.25, saju: 0.15, ziwei: 0.10, numerology: 0.05 },
  career:       { tarot: 0.35, saju: 0.30, astrology: 0.20, ziwei: 0.10, numerology: 0.05 },
  finance:      { tarot: 0.20, saju: 0.40, ziwei: 0.25, astrology: 0.10, numerology: 0.05 },
  health:       { tarot: 0.30, saju: 0.30, ziwei: 0.25, astrology: 0.10, numerology: 0.05 },
  spirituality: { tarot: 0.40, numerology: 0.25, ziwei: 0.20, astrology: 0.10, saju: 0.05 },
  family:       { tarot: 0.35, saju: 0.30, ziwei: 0.20, astrology: 0.10, numerology: 0.05 },
  decision:     { tarot: 0.45, saju: 0.20, astrology: 0.20, ziwei: 0.10, numerology: 0.05 },
  migration:    { tarot: 0.35, ziwei: 0.30, astrology: 0.20, saju: 0.10, numerology: 0.05 },
  life_change:  { tarot: 0.35, saju: 0.25, ziwei: 0.20, astrology: 0.15, numerology: 0.05 },
  money:        { tarot: 0.20, saju: 0.40, ziwei: 0.25, astrology: 0.10, numerology: 0.05 },
  general:      { tarot: 0.40, saju: 0.25, ziwei: 0.20, astrology: 0.10, numerology: 0.05 },
};

/**
 * B-64R: 질문 토픽 기반 가중치를 반환
 * consensusEngine 내부에서 SYSTEM_WEIGHTS 대신 사용
 */
export function getTopicWeights(topic: QuestionTopic | string): Record<string, number> {
  const normalized = topic?.toLowerCase() as QuestionTopic;
  return TOPIC_WEIGHTS[normalized] ?? TOPIC_WEIGHTS["general"];
}

/**
 * B-64R + B-65R: 토픽 인식 합의 계산
 * - topic 파라미터로 가중치 동적 조정
 * - birthTimeProvided=false 시 is_time_unknown 플래그 포함
 */
export function calculateConsensusWithTopic(
  vectors: SymbolicVector[],
  topic: QuestionTopic | string = "general",
  birthTimeProvided: boolean = true,
  birthPlaceProvided: boolean = true
): ConsensusOutput & { is_time_unknown: boolean; topic_weights_used: Record<string, number> } {

  const topicWeights = getTopicWeights(topic);

  // 출생시간 미제공 시 ziwei·astrology 비중 0으로
  if (!birthTimeProvided) {
    topicWeights["ziwei"] = 0;
    topicWeights["astrology"] = Math.min(topicWeights["astrology"] ?? 0.1, 0.05);
    const total = Object.values(topicWeights).reduce((s, v) => s + v, 0);
    for (const k of Object.keys(topicWeights)) {
      topicWeights[k] = (total > 0) ? topicWeights[k] / total : topicWeights[k];
    }
  }

  const base = calculateConsensusV8(vectors, birthTimeProvided, birthPlaceProvided, topicWeights);

  return {
    ...base,
    is_time_unknown: !birthTimeProvided,
    topic_weights_used: topicWeights,
  };
}

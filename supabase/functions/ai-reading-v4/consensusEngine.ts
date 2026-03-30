/**
 * consensusEngine.ts (v8)
 * - PART 9: Cross-System Consensus Algorithm.
 * - Computes consensus based on system weighted alignment across 5 systems.
 */

import type { SymbolicVector } from "./symbolicPatternEngine.ts";
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
  engine_reliability: Record<string, number>;
}

/**
 * B-207: 엔진별 reliability 동적 계산 함수
 */
function calculateEngineReliability(engineName: string, engineData: any, hasTime: boolean): number {
  let score = 1.0;

  if (!engineData || engineData.error || engineData.skipped) {
    return 0.0;
  }

  switch (engineName) {
    case "saju": {
      const fp = engineData.fourPillars;
      // 사주 4주 완성도
      if (!fp) { score -= 0.5; break; }
      if (!fp.hour?.stem || fp.hour.stem === "미상") score -= 0.25; // 시주 없음
      if (!fp.day?.stem) score -= 0.4; // 일간 없으면 치명적
      if (!fp.month?.stem) score -= 0.3;
      if (!fp.year?.stem) score -= 0.2;
      // 용신 존재 여부
      if (!engineData.yongShin && !engineData.ypiResult?.finalYongShin) score -= 0.1;
      // 대운 존재 여부
      if (!engineData.daewoon || (Array.isArray(engineData.daewoon) && engineData.daewoon.length === 0)) score -= 0.1;
      break;
    }
    case "astrology": {
      const planets = engineData.planets || engineData.planetPositions;
      if (!planets) { score -= 0.5; break; }
      // ASC 유무
      const hasASC = engineData.houses?.ASC || engineData.ascendant || (engineData.houses && engineData.houses.raw && engineData.houses.raw[0]);
      if (!hasASC) score -= 0.2;
      // 출생시간 유무 (hasTime은 birthTimeProvided로 전달됨)
      if (!hasTime) score -= 0.25;
      // 달 위치 존재 여부
      const moon = Array.isArray(planets) ? planets.find((p: any) => p.planet === "달" || p.name === "Moon") : planets.Moon;
      if (!moon) score -= 0.1;
      // location_confidence 반영
      if (engineData.location_confidence === "very_low") score -= 0.2;
      else if (engineData.location_confidence === "low") score -= 0.1;
      break;
    }
    case "ziwei": {
      if (engineData.skipped) return 0.0;
      if (!hasTime) return 0.0;
      // 명궁 존재 여부
      if (!engineData.mingGong && !engineData.palaces) score -= 0.4;
      // 12궁 완성도
      const palaceCount = engineData.palaces?.length || 0;
      if (palaceCount < 12) score -= (12 - palaceCount) * 0.03;
      break;
    }
    case "tarot": {
      const cards = engineData.card_vectors || engineData.cards || [];
      if (cards.length === 0) return 0.0;
      // 카드 수 (5장 기준)
      if (cards.length < 5) score -= (5 - cards.length) * 0.1;
      break;
    }
    case "numerology": {
      if (!engineData.life_path_number && !engineData.lifePathNumber) score -= 0.3;
      break;
    }
  }

  return Math.max(0, Math.min(1, score));
}

export function calculateConsensusV8(
  vectors: SymbolicVector[], 
  birthTimeProvided: boolean = true,
  birthPlaceProvided: boolean = true,
  customWeights?: Record<string, number>,
  systemResults: any[] = []
): ConsensusOutput {
  if (vectors.length === 0) {
    return { consensus_score: 0, confidence_score: 0, prediction_strength: 0, dominant_vector: {}, alignment_matrix: [], conflict_log: [], conflict_summary: "데이터 없음", engine_reliability: {} };
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
      systemGroups[sys][dim] = (systemGroups[sys][dim] || 0) + Number(val);
    });
  });

  // 2. Compute Cross-System Alignment (Cosine Similarity) with Dynamic Weights
  // ── B-252: 용신 기반 사주 벡터 보정 ──
  if (systemGroups["saju"]) {
    const sajuData = systemResults.find(r => r.system?.toLowerCase() === "saju");
    const ys = sajuData?.yongShin || sajuData?.ypiResult?.finalYongShin;
    if (ys) {
      const vec = systemGroups["saju"];
      const adj: Record<string, number> = {};
      
      if (ys.includes("수")) {
        vec.stability = (vec.stability || 0) + 0.15;
        vec.risk = (vec.risk || 0) - 0.1;
        adj.stability = 0.15; adj.risk = -0.1;
      } else if (ys.includes("화")) {
        vec.growth = (vec.growth || 0) + 0.15;
        vec.career = (vec.career || 0) + 0.1;
        adj.growth = 0.15; adj.career = 0.1;
      } else if (ys.includes("목")) {
        vec.growth = (vec.growth || 0) + 0.15;
        vec.relationship = (vec.relationship || 0) + 0.1;
        adj.growth = 0.15; adj.relationship = 0.1;
      } else if (ys.includes("금")) {
        vec.stability = (vec.stability || 0) + 0.1;
        vec.finance = (vec.finance || 0) + 0.15;
        adj.stability = 0.1; adj.finance = 0.15;
      } else if (ys.includes("토")) {
        vec.stability = (vec.stability || 0) + 0.2;
        adj.stability = 0.2;
      }
      console.log("[YONGSHIN VECTOR]", { yongShin: ys, adjustment: adj });
    }
  }

  let totalConsensus = 0;
  let totalWeight = 0;
  const alignmentMatrix: any[] = [];
  const systems = Object.keys(systemGroups);

  // B-207: 동적 신뢰도 맵 생성
  const reliabilityMap: Record<string, number> = {};
  systemResults.forEach(res => {
    const sys = res.system.toLowerCase();
    reliabilityMap[sys] = calculateEngineReliability(sys, res, birthTimeProvided);
  });

  // B-131 fix: customWeights(토픽 가중치) 우선 적용, 없으면 SYSTEM_WEIGHTS 사용
  const currentWeights = customWeights ? { ...customWeights } : { ...SYSTEM_WEIGHTS };
  let systemCriteria = 5;

  // reliability가 0인 엔진은 가중치 0으로
  Object.keys(currentWeights).forEach(sys => {
    if (reliabilityMap[sys] === 0) {
      currentWeights[sys] = 0;
    }
  });

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
      
      // B-207: 가중치에 동적 신뢰도 반영
      const relI = reliabilityMap[sysI] ?? 1.0;
      const relJ = reliabilityMap[sysJ] ?? 1.0;
      
      const weightI = (currentWeights[sysI] || 0.1) * (magI < 0.1 ? 0.5 : 1.0) * relI;
      const weightJ = (currentWeights[sysJ] || 0.1) * (magJ < 0.1 ? 0.5 : 1.0) * relJ;
      const pairWeight = weightI * weightJ;

      if (pairWeight > 0) {
        totalConsensus += similarity * pairWeight;
        totalWeight += pairWeight;
      }

      let conflict_level: ConflictLog["conflict_level"] = "none";
      let resolution = "일치 — 두 시스템 신호 강화";
      if (similarity < 0.3) {
        conflict_level = "severe";
        resolution = "심각 충돌 — 가장 신뢰도 높은 엔진 우선, 나머지 참고용";
      } else if (similarity < 0.45) {
        conflict_level = "moderate";
        resolution = "중간 충돌 — 두 관점의 차이를 명시하고 균형 있게 서술";
      } else if (similarity < 0.6) {
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
        // B-256: 신뢰도(reliability)가 높은 엔진을 중재자(우선 순위)로 선택
        mediator = relI >= relJ ? sysI : sysJ;
        resolution = `${conflict_level === "severe" ? "심각" : "중간"} 충돌 — 신뢰도 높은 ${mediator} 판단 우선 적용`;
        
        // 0.9 미만 엔진 간 충돌 시 경고 추가
        if (relI < 0.9 && relJ < 0.9) {
          resolution += " (두 엔진 모두 신뢰도 낮음, 주의 요망)";
        }
      }

      conflictLog.push({ pair: `${sysI}-${sysJ}`, similarity, conflict_level, mediator, resolution });
      alignmentMatrix.push({ pair: `${sysI}-${sysJ}`, similarity });
    }
  }

  const rawConsensus = Math.max(0, totalWeight > 0 ? totalConsensus / totalWeight : 0);

  // ── B-251A: Consensus Score 리매핑 (0.2~0.7 → 0.5~0.9) ──
  // 이종 시스템 간 코사인 유사도는 구조적으로 낮으므로 체감 보정
  const remappedConsensus = Math.min(0.85, 0.4 + (rawConsensus - 0.1) * (0.45 / 0.6));
  
  // ── B-251B: 지배차원 일치 보너스 ──
  // 각 시스템의 최고 차원이 같으면 +0.1 (최대 +0.2)
  const dominantDims: Record<string, string> = {};
  for (const [sys, vec] of Object.entries(systemGroups)) {
    if ((currentWeights[sys] || 0) === 0) continue;
    const norm = normalizeVector(vec);
    let maxDim = ""; let maxVal = -1;
    for (const [dim, val] of Object.entries(norm)) {
      if (val > maxVal) { maxVal = val; maxDim = dim; }
    }
    if (maxDim) dominantDims[sys] = maxDim;
  }
  const dimValues = Object.values(dominantDims);
  const dimCounts: Record<string, number> = {};
  dimValues.forEach(d => { dimCounts[d] = (dimCounts[d] || 0) + 1; });
  const maxAgreement = Math.max(0, ...Object.values(dimCounts));
  const dominantDimBonus = maxAgreement >= 3 ? 0.1 : maxAgreement >= 2 ? 0.05 : 0;
  
  // 최종 보정 점수
  const consensus_score = Math.min(1.0, Math.max(0, remappedConsensus + dominantDimBonus));

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
    const rel = reliabilityMap[sys] ?? 1.0;
    const weight = (currentWeights[sys] || 0.1) * (mag < 0.1 ? 0.5 : 1.0) * rel;
    if (weight > 0) {
      Object.entries(vec).forEach(([dim, val]) => {
        dominantVector[dim] = (dominantVector[dim] || 0) + (Number(val) * weight);
      });
    }
  });

  const severeCount = conflictLog.filter(c => c.conflict_level === "severe").length;
  const moderateCount = conflictLog.filter(c => c.conflict_level === "moderate").length;
  
  // 전체에서 가장 신뢰도 높은 엔진 추출 (중재 기준 엔진 명시)
  const bestEngine = Object.entries(reliabilityMap)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "상위 엔진";
  const bestEngineName = {
    saju: "사주", tarot: "타로", astrology: "점성술", ziwei: "자미두수", numerology: "수비학"
  }[bestEngine] || bestEngine;

  const lowReliabilityConflicts = conflictLog.some(c => {
    const [i, j] = c.pair.split("-");
    return (reliabilityMap[i] || 0) < 0.9 && (reliabilityMap[j] || 0) < 0.9 && (c.conflict_level === "severe");
  });

  const conflict_summary = severeCount > 0
    ? `⚠️ 심각 충돌 ${severeCount}건 — ${bestEngineName} 기준으로 조율${lowReliabilityConflicts ? " (신뢰성 저하 주의)" : ""}`
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
    engine_reliability: reliabilityMap
  };
}

// ═══════════════════════════════════════════════════════════════
// B-64R: 토픽별 동적 가중치 조정 (topicWeightedConsensus)
// ═══════════════════════════════════════════════════════════════

export type QuestionTopic =
  | "relationship" | "career" | "finance" | "health"
  | "spirituality" | "family" | "decision" | "general"
  | "migration" | "life_change";

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
  birthPlaceProvided: boolean = true,
  customBlendedWeights?: Record<string, number>,
  systemResults: any[] = []
): ConsensusOutput & { is_time_unknown: boolean; topic_weights_used: Record<string, number> } {

  const topicWeights = customBlendedWeights ? { ...customBlendedWeights } : { ...getTopicWeights(topic) };

  // 출생시간 미제공 시 ziwei·astrology 비중 0으로
  if (!birthTimeProvided) {
    topicWeights["ziwei"] = 0;
    topicWeights["astrology"] = Math.min(topicWeights["astrology"] ?? 0.1, 0.05);
    const total = Object.values(topicWeights).reduce((s, v) => s + v, 0);
    for (const k of Object.keys(topicWeights)) {
      topicWeights[k] = (total > 0) ? topicWeights[k] / total : topicWeights[k];
    }
  }

  const base = calculateConsensusV8(vectors, birthTimeProvided, birthPlaceProvided, topicWeights, systemResults);

  return {
    ...base,
    is_time_unknown: !birthTimeProvided,
    topic_weights_used: topicWeights,
  };
}

/**
 * consensusEngine.ts (v8)
 * - PART 9: Cross-System Consensus Algorithm.
 * - Computes consensus based on system weighted alignment across 5 systems.
 */

import { SymbolicVector } from "./symbolicPatternEngine.ts";
import { cosineSimilarity } from "./mathUtils.ts";

const SYSTEM_WEIGHTS: Record<string, number> = {
  "tarot": 0.20,
  "saju": 0.30,
  "astrology": 0.25,
  "ziwei": 0.15,
  "numerology": 0.10
};

export interface ConsensusOutput {
  consensus_score: number;
  confidence_score: number;
  prediction_strength: number;
  dominant_vector: Record<string, number>;
  alignment_matrix: any[];
}

export function calculateConsensusV8(vectors: SymbolicVector[]): ConsensusOutput {
  if (vectors.length === 0) {
    return { consensus_score: 0, confidence_score: 0, prediction_strength: 0, dominant_vector: {}, alignment_matrix: [] };
  }

  // 1. Group vectors by system for cross-comparison
  const systemGroups: Record<string, Record<string, number>> = {};
  vectors.forEach(v => {
    const sys = v.system.toLowerCase();
    if (!systemGroups[sys]) systemGroups[sys] = {};
    // Aggregate multiple vectors within same system
    Object.entries(v.vector).forEach(([dim, val]) => {
      systemGroups[sys][dim] = (systemGroups[sys][dim] || 0) + val;
    });
  });

  // 2. Compute Cross-System Alignment (Cosine Similarity) with Dynamic Weights
  let totalConsensus = 0;
  let totalWeight = 0;
  const alignmentMatrix: any[] = [];
  const systems = Object.keys(systemGroups);

  // Calculate dynamic weights based on vector magnitude
  const dynamicWeights: Record<string, number> = {};
  systems.forEach(sys => {
    const vec = systemGroups[sys];
    const magnitude = Math.sqrt(Object.values(vec).reduce((sum, val) => sum + val * val, 0));
    let weight = SYSTEM_WEIGHTS[sys] || 0.1;
    if (magnitude < 0.1) {
      weight *= 0.5; // Reduce impact of sparse data systems
    }
    dynamicWeights[sys] = weight;
  });

  for (let i = 0; i < systems.length; i++) {
    for (let j = i + 1; j < systems.length; j++) {
      const similarity = cosineSimilarity(systemGroups[systems[i]], systemGroups[systems[j]]);
      const pairWeight = dynamicWeights[systems[i]] * dynamicWeights[systems[j]];
      
      totalConsensus += similarity * pairWeight;
      totalWeight += pairWeight;
      
      alignmentMatrix.push({
        pair: `${systems[i]}-${systems[j]}`,
        similarity
      });
    }
  }

  const consensus_score = Math.max(0, totalWeight > 0 ? totalConsensus / totalWeight : 0);
  
  // 3. Confidence Score (Based on distribution and reporting systems)
  // Higher reporting systems count increases confidence up to 1.0
  const reportingSystemsCount = systems.length;
  const rawConfidence = (reportingSystemsCount / 5) * (1 + consensus_score) / 2;
  const confidence_score = Math.max(0, Math.min(1.0, rawConfidence));
  
  // 4. Final Prediction Strength
  const prediction_strength = Math.max(0, consensus_score * confidence_score);

  // 5. Aggregate Dominant Vector (Weighted by dynamic weights)
  const dominantVector: Record<string, number> = {};
  Object.entries(systemGroups).forEach(([sys, vec]) => {
    const weight = dynamicWeights[sys] || 0.1;
    Object.entries(vec).forEach(([dim, val]) => {
      dominantVector[dim] = (dominantVector[dim] || 0) + (val * weight);
    });
  });

  return {
    consensus_score,
    confidence_score,
    prediction_strength,
    dominant_vector: dominantVector,
    alignment_matrix: alignmentMatrix
  };
}

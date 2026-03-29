/**
 * validationLayer.ts (v7)
 * - PART 4: Hallucination Guard System.
 * - PART 11: Validation Layer.
 */

const CONFIDENCE_THRESHOLD = 0.35; // Adjusted for 2-3 system setups

export interface ValidationResult {
  isValid: boolean;
  message: string;
  reasons: string[];
}

export function validateEngineOutput(
  consensus: any, 
  vectors: any[],
  systemResults: any[],
  questionType?: string
): ValidationResult {
  const reasons: string[] = [];

  // Rule 4.1: If structured_engine_output = NULL, block narrative
  if (vectors.length === 0) {
    return { isValid: false, message: "Engine output is NULL", reasons: ["No pattern vectors generated"] };
  }

  // ── 1. Tarot Card Validation ──
  const tarot = systemResults.find(r => r.system === "tarot");
  if (!tarot || !tarot.characteristics || tarot.characteristics.length === 0) {
    reasons.push("Tarot data is empty or missing characteristics");
  }

  // ── 2. Saju Element Validation ──
  const saju = systemResults.find(r => r.system === "saju");
  if (saju && saju.elements) {
    const totalElements = Object.values(saju.elements as Record<string, number>).reduce((a, b) => a + b, 0);
    if (totalElements === 0) {
      reasons.push("Saju elements are all zero - potential data calculation error");
    }
  }

  // ── 3. Question Category vs Semantic Vector Mismatch ──
  if (questionType && consensus.dominant_vector) {
    const CATEGORY_MAP: Record<string, string> = {
      "연애": "relationship", "love": "relationship", "relationship": "relationship",
      "재물": "finance", "money": "finance", "wealth": "finance", "finance": "finance",
      "직업": "career", "career": "career", "business": "career"
    };
    const targetDim = CATEGORY_MAP[questionType.toLowerCase()];
    if (targetDim) {
      const sortedDims = Object.entries(consensus.dominant_vector as Record<string, number>)
        .sort((a, b) => b[1] - a[1]);
      const topDim = sortedDims[0]?.[0];
      
      if (topDim && topDim !== targetDim && (consensus.dominant_vector[topDim] > consensus.dominant_vector[targetDim] + 0.5)) {
        console.warn(`[Validation] Category Mismatch: Question is ${questionType} (target: ${targetDim}), but dominant energy is ${topDim}`);
        reasons.push(`Dominant energy (${topDim}) significantly differs from question category (${questionType})`);
      }
    }
  }

  // Rule 4.2: If validation_score < threshold, return uncertainty state
  if (consensus.confidence_score < CONFIDENCE_THRESHOLD) {
    reasons.push(`Confidence score (${consensus.confidence_score.toFixed(2)}) is below threshold (${CONFIDENCE_THRESHOLD})`);
  }

  // Rule 11: System Conflict Check
  if (consensus.consensus_score < -0.2) {
    reasons.push("Severe cross-system contradiction detected");
  }

  const isValid = reasons.length === 0;

  return {
    isValid,
    message: isValid ? "Validation Passed" : "Validation Failed / Uncertainty State",
    reasons
  };
}

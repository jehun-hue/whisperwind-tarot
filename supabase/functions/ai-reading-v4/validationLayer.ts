/**
 * validationLayer.ts (v7)
 * - PART 4: Hallucination Guard System.
 * - PART 11: Validation Layer.
 */

const CONFIDENCE_THRESHOLD = 0.35; // Example threshold

export interface ValidationResult {
  isValid: boolean;
  message: string;
  reasons: string[];
}

export function validateEngineOutput(
  consensus: any, 
  vectors: any[]
): ValidationResult {
  const reasons: string[] = [];

  // Rule 4.1: If structured_engine_output = NULL, block narrative
  if (vectors.length === 0) {
    return { isValid: false, message: "Engine output is NULL", reasons: ["No pattern vectors generated"] };
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

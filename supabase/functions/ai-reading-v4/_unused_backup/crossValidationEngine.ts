/**
 * crossValidationEngine.ts
 * - Compares 6 systems across key categories.
 * - Identifies Core, Potential, and Reference patterns.
 */

export interface SystemResult {
  system: "saju" | "ziwei" | "astrology" | "tarot" | "hanna" | "monad";
  personality: string;
  relationship: string;
  career: string;
  money: string;
  risk_factor: string;
  core_pattern: string;
}

export function crossValidate(results: SystemResult[]) {
  const categories: (keyof SystemResult)[] = ["personality", "relationship", "career", "money", "risk_factor", "core_pattern"];
  const summary: Record<string, any> = {};

  categories.forEach(cat => {
    if (cat === "system") return;
    
    // Count occurrences of patterns in this category
    const counts: Record<string, number> = {};
    results.forEach(res => {
      const val = res[cat] as string;
      if (val) counts[val] = (counts[val] || 0) + 1;
    });

    // Classification
    summary[cat] = {
      core: Object.keys(counts).filter(p => counts[p] >= 4),
      potential: Object.keys(counts).filter(p => counts[p] === 3),
      reference: Object.keys(counts).filter(p => counts[p] <= 2)
    };
  });

  return summary;
}

/**
 * mathUtils.ts
 * - Vector mathematics for semantic space analysis.
 */

export function cosineSimilarity(vecA: Record<string, number>, vecB: Record<string, number>): number {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  keys.forEach(key => {
    const valA = vecA[key] || 0;
    const valB = vecB[key] || 0;
    dotProduct += valA * valB;
    magA += valA * valA;
    magB += valB * valB;
  });

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

export function aggregateVectors(vectors: Record<string, number>[]): Record<string, number> {
  const result: Record<string, number> = {};
  vectors.forEach(v => {
    Object.entries(v).forEach(([key, val]) => {
      result[key] = (result[key] || 0) + val;
    });
  });
  return result;
}

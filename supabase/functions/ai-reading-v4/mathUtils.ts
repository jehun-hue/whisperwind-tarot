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
  
  // 공유 차원 비율 계산 - 공유 키가 적으면 신뢰도 낮음
  const sharedKeys = Object.keys(vecA).filter(k => vecB[k] !== undefined).length;
  const totalKeys = keys.size;
  const overlapRatio = totalKeys > 0 ? sharedKeys / totalKeys : 0;
  
  // 코사인 유사도 계산 후 0~1 범위로 클램핑
  const raw = dotProduct / (magA * magB);
  const clamped = Math.max(0, raw);
  
  // 공유 차원이 5% 미만일 때만 0 반환 — 시스템 간 비교 허용
  if (overlapRatio < 0.05) return 0;
  
  return clamped;
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

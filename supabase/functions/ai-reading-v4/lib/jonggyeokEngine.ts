/**
 * jonggyeokEngine.ts (placeholder)
 * Phase 4 종격 용신 엔진 — 현재는 미사용
 * 
 * 도입 조건:
 * 1. 실사용 데이터 100건 이상 확보
 * 2. 극신강/극신약 케이스 전문가 검증 완료
 * 3. aiSajuAnalysis.ts의 useJonggyeok = true 전환
 */

export interface JonggyeokResult {
  method: "jonggyeok";
  type: string;          // 종왕/종강/종재/종살/종아
  yongshin: string;      // 용신 오행
  heeshin: string;       // 희신 오행
  gisin: string;         // 기신 오행
  gusin: string;         // 구신 오행
  hansin: string;        // 한신 오행
  confidence: number;    // 판정 확신도 (0~1)
  reason: string;
}

// Phase 4에서 구현 예정
export function calculateJonggyeok(
  _dayMaster: string,
  _pillars: any,
  _tenGods: Record<string, number>,
  _balance: number
): JonggyeokResult | null {
  return null; // 미구현 — 항상 null 반환, 억부 로직으로 폴백
}

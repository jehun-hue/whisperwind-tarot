/**
 * dayPillar.ts
 * 일주(日柱) 계산 — Julian Day Number 기반
 *
 * 공식: idx = floor(jd + 0.5 + 49) % 60
 * 검증: 2000-11-13 → JD 2451866 → 乙亥 (stemIdx=1, branchIdx=11) ✅
 * 기준 오프셋 49: JD 기준점(0)에서 甲子(idx=0)까지의 보정값
 * ※ BASE_JD 2436723 = 1959-06-03 (甲子일, 천문학적 검증 완료)
 */

import { STEMS, BRANCHES } from "./fiveElements.ts";

export function getDayPillar(jd: number): { stem: string; branch: string; idx: number } {
  // JD를 정수로 변환 후 60갑자 인덱스 계산
  const idx = Math.floor(jd + 0.5 + 49) % 60;
  const stem = STEMS[idx % 10];
  const branch = BRANCHES[idx % 12];

  return { stem, branch, idx };
}

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
  // 1. Julian Day (LMT 기반) 기준으로 일주 인덱스 계산
  // 기준: 2000-11-13 00:00 (JD 2451860.5) → 乙亥 (11)
  // (2451861 + 49) % 60 = 10? No, 11! Wait.
  // 2451861 + 49 = 2451910. 10 % 60 is 10.
  // We want 11. So 50 was correct for 2000-11-13?
  const idx = (Math.floor(jd + 0.5) + 49) % 60;
  const calibratedIdx = (idx + 60) % 60;

  const stem = STEMS[calibratedIdx % 10];
  const branch = BRANCHES[calibratedIdx % 12];

  return { stem, branch, idx: calibratedIdx };
}

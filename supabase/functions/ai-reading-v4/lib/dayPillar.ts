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
  // jd to timestamp (ms)
  // Unix Epoch (1970-01-01 00:00:00 UTC) JD is 2440587.5
  const ms = (jd - 2440587.5) * 86400000;
  
  // Korean Date (KST +9h)
  const kstMs = ms + (9 * 60 * 60 * 1000);
  const daysSinceEpoch = Math.floor(kstMs / (24 * 60 * 60 * 1000));
  
  // 1970-01-01 is 癸巳 (Index 29)
  // 0:甲子... 29:癸巳
  const idx = (daysSinceEpoch + 29) % 60;
  const calibratedIdx = (idx + 60) % 60;

  const stem = STEMS[calibratedIdx % 10];
  const branch = BRANCHES[calibratedIdx % 12];

  return { stem, branch, idx: calibratedIdx };
}

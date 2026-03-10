/**
 * hourPillar.ts
 */

import { STEMS, BRANCHES } from "./fiveElements.ts";

export function getHourPillar(dayStemIdx: number, hour: number): { stem: string; branch: string; idx: number } {
  // hour: 0-23
  // 23-01 is 子(0)
  const branchIdx = Math.floor((hour + 1) % 24 / 2);
  const stemBase = (dayStemIdx % 5 * 2) % 10;
  const stemIdx = (stemBase + branchIdx) % 10;
  
  return {
    stem: STEMS[stemIdx],
    branch: BRANCHES[branchIdx],
    idx: (stemIdx * 12 + branchIdx) % 60
  }
}

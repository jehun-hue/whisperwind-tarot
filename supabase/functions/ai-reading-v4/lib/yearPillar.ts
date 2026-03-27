/**
 * yearPillar.ts
 */

import { findSolarTermJD } from "./solarTerm.ts";
import { STEMS, BRANCHES } from "./fiveElements.ts";

export function getYearPillar(year: number, jd: number): { stem: string; branch: string; idx: number } {
  // findSolarTermJD는 UTC 기반 JD를 반환하므로, LMT 기준으로 맞추기 위해 경도 보정 추가
  // sajuEngine에서 넘어오는 jd는 LMT 기반이므로 입춘도 LMT로 맞춰야 함
  // 한국 중앙 경도 127.5도 기준: LMT = UTC + 8.5시간
  const LMT_OFFSET = 127.5 / 15 / 24; 
  const ipChunJD = findSolarTermJD(year, 315) + LMT_OFFSET;
  let yearForPillar = year;
  
  if (jd < ipChunJD) {
    yearForPillar -= 1;
  }
  
  const idx = (yearForPillar - 4) % 60;
  const stemIdx = idx % 10;
  const branchIdx = idx % 12;
  
  return { 
    stem: STEMS[(stemIdx + 10) % 10], 
    branch: BRANCHES[(branchIdx + 12) % 12], 
    idx 
  };
}

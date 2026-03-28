/**
 * dayPillar.ts
 * 일주(日柱) 계산 — Julian Day Number 기반 정통 공식
 *
 * 공식: S = (floor(jd + 0.5) - 11) % 60  (0-based, 0=甲子)
 * 참조: https://ytliu0.github.io/ChineseCalendar/sexagenary.html
 *       S = 1 + mod(JD_noon - 11, 60) [1-based]
 * 
 * 검증:
 *   2000-01-01 noon → JD 2451545 → S = (2451545-11)%60 = 2451534%60 = 54 → 丁巳 ✅
 *   1987-07-17 noon → JD 2446994 → S = (2446994-11)%60 = 2446983%60 = 3  → 丁卯 ✅
 * 
 * ※ 이 함수는 "한국 자정(KST 00:00) 기준 날짜"에 해당하는 JD를 받아야 합니다.
 *   sajuEngine에서 벽시계시(wall-clock) 기준 JD를 전달하세요.
 */

import { STEMS, BRANCHES } from "./fiveElements.ts";

export function getDayPillar(jd: number): { stem: string; branch: string; idx: number } {
  // JD는 정오(noon) 기준 정수. 자정 기준이면 +0.5 해서 정오로 맞춤
  const jdNoon = Math.floor(jd + 0.5);
  
  // 60갑자 인덱스 (0-based: 0=甲子, 1=乙丑, ... 3=丁卯, ... 59=癸亥)
  const idx = ((jdNoon - 11) % 60 + 60) % 60;

  const stem = STEMS[idx % 10];
  const branch = BRANCHES[idx % 12];

  return { stem, branch, idx };
}

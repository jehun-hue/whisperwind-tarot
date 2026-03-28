/**
 * twelveStages.ts - 12운성 (십이운성) 계산
 * 장생·목욕·관대·건록·제왕·쇠·병·사·묘·절·태·양
 */

const STAGES = ["장생","목욕","관대","건록","제왕","쇠","병","사","묘","절","태","양"];

// 각 천간의 장생 시작 지지 인덱스
// 양간: 甲→亥(11), 丙→寅(2), 戊→寅(2), 庚→巳(5), 壬→申(8) → 순행
// 음간: 乙→午(6), 丁→酉(9), 己→酉(9), 辛→子(0), 癸→卯(3) → 역행
const STAGE_START: Record<string, { start: number; reverse: boolean }> = {
  "甲": { start: 11, reverse: false },
  "乙": { start: 6,  reverse: true },
  "丙": { start: 2,  reverse: false },
  "丁": { start: 9,  reverse: true },
  "戊": { start: 2,  reverse: false },
  "己": { start: 9,  reverse: true },
  "庚": { start: 5,  reverse: false },
  "辛": { start: 0,  reverse: true },
  "壬": { start: 8,  reverse: false },
  "癸": { start: 3,  reverse: true },
};

const BRANCHES = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

export function calculateTwelveStage(dayStem: string, branch: string): string {
  const config = STAGE_START[dayStem];
  if (!config) return "?";
  const branchIdx = BRANCHES.indexOf(branch);
  if (branchIdx === -1) return "?";

  let offset: number;
  if (config.reverse) {
    offset = (config.start - branchIdx + 12) % 12;
  } else {
    offset = (branchIdx - config.start + 12) % 12;
  }
  return STAGES[offset];
}

export function getAllTwelveStages(dayStem: string, pillars: { branch: string }[]): string[] {
  return pillars.map(p => getTwelveStage(dayStem, p.branch));
}

export { STAGES as TWELVE_STAGE_NAMES };

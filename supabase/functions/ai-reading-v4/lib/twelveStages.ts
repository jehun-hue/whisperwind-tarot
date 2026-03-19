/**
 * twelveStages.ts
 * 12운성(포태법) 계산 모듈
 * 일간(日干)을 기준으로 각 지지(地支)에서의 에너지 상태를 판별합니다.
 */

export const STAGES = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"];

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// 천간별 장생지 및 순역 방향 (true: 순행, false: 역행)
const JANGSANG_MAP: Record<string, { branch: string, isForward: boolean }> = {
  "甲": { branch: "亥", isForward: true },
  "乙": { branch: "午", isForward: false },
  "丙": { branch: "寅", isForward: true },
  "丁": { branch: "酉", isForward: false },
  "戊": { branch: "寅", isForward: true },
  "己": { branch: "酉", isForward: false },
  "庚": { branch: "巳", isForward: true },
  "辛": { branch: "子", isForward: false },
  "壬": { branch: "申", isForward: true },
  "癸": { branch: "卯", isForward: false },
};

export const BRANCH_MAIN_STEM: Record<string, string> = {
  "子": "癸", "丑": "己", "寅": "甲", "卯": "乙", "辰": "戊", "巳": "丙",
  "午": "丁", "未": "己", "申": "庚", "酉": "辛", "戌": "戊", "亥": "壬"
};

/**
 * 특정 일간과 지지에 대해 12운성 명칭 계산
 */
export function calculateTwelveStage(dayStem: string, branch: string): string {
  const config = JANGSANG_MAP[dayStem];
  if (!config) return "알 수 없음";

  const startIdx = BRANCHES.indexOf(config.branch);
  const targetIdx = BRANCHES.indexOf(branch);
  if (startIdx < 0 || targetIdx < 0) return "알 수 없음";

  let stageIdx: number;
  if (config.isForward) {
    // 순행: (현재지 - 장생지 + 12) % 12
    stageIdx = (targetIdx - startIdx + 12) % 12;
  } else {
    // 역행: (장생지 - 현재지 + 12) % 12
    stageIdx = (startIdx - targetIdx + 12) % 12;
  }

  return STAGES[stageIdx];
}

/**
 * 사주 4개 지지에 대해 12운성을 한번에 계산 (봉법)
 */
export function calculateAllTwelveStages(
  dayStem: string, 
  fourPillars: { year: string; month: string; day: string; hour: string }
) {
  return {
    year: calculateTwelveStage(dayStem, fourPillars.year),
    month: calculateTwelveStage(dayStem, fourPillars.month),
    day: calculateTwelveStage(dayStem, fourPillars.day),
    hour: calculateTwelveStage(dayStem, fourPillars.hour),
  };
}

/**
 * 거법(居法): 지지의 본기(本氣) 장간 기준으로 해당 지지에서의 12운성 계산
 */
export function calculateTwelveStageGeobup(branch: string): string {
  const mainStem = BRANCH_MAIN_STEM[branch];
  if (!mainStem) return "알 수 없음";
  return calculateTwelveStage(mainStem, branch);
}

/**
 * 사주 4개 지지에 대해 12운성 거법 계산 (v2 패치: 두 가지 방식 지원)
 * method1: 지지 본기 장간을 일간으로 상정하고 해당 지지에서의 12운성 (전통적 거법)
 * method2: 일간을 기준으로 해당 지지에서의 12운성 (봉법과 동일한 기준의 지지 에너지)
 */
export function calculateAllTwelveStagesGeobup(
  dayStem: string,
  fourPillars: { year: string; month: string; day: string; hour: string }
) {
  // Method 1: Traditional Geobup (Branch Main Root as Stem)
  const method1 = {
    year: calculateTwelveStageGeobup(fourPillars.year),
    month: calculateTwelveStageGeobup(fourPillars.month),
    day: calculateTwelveStageGeobup(fourPillars.day),
    hour: calculateTwelveStageGeobup(fourPillars.hour),
  };

  // Method 2: Day Stem based (Same as Bongbup base)
  const method2 = {
    year: calculateTwelveStage(dayStem, fourPillars.year),
    month: calculateTwelveStage(dayStem, fourPillars.month),
    day: calculateTwelveStage(dayStem, fourPillars.day),
    hour: calculateTwelveStage(dayStem, fourPillars.hour),
  };

  return { method1, method2 };
}

/**
 * 각 12운성 단계별 에너지 레벨 및 설명 리턴
 */
export function getTwelveStageEnergy(stage: string): { level: number, description: string } {
  const energyMap: Record<string, { level: number, description: string }> = {
    "장생": { level: 70, description: "새로운 시작, 탄생, 무궁한 잠재력과 성장의 기운" },
    "목욕": { level: 50, description: "자기를 가꾸고 드러내며 시행착오를 겪는 과도기" },
    "관대": { level: 80, description: "의복을 갖추고 사회에 나가는 힘찬 발전과 추진력" },
    "건록": { level: 90, description: "안정적인 지위, 완성된 실력과 원숙한 주체성" },
    "제왕": { level: 100, description: "최고의 정점, 가장 강력한 카리스마와 주도적 힘" },
    "쇠": { level: 40, description: "정점을 지나 내실을 기하고 한 발 물러나는 여유" },
    "병": { level: 30, description: "활동력이 줄어들고 내면의 성찰이 깊어지는 시기" },
    "사": { level: 20, description: "정적이고 정신적인 집중력이 극대화되는 에너지" },
    "묘": { level: 15, description: "안전하게 저장하고 보관하며 내일을 준비하는 기운" },
    "절": { level: 10, description: "이전의 기운이 완전히 끊기고 새로운 씨앗을 품는 상태" },
    "태": { level: 5, description: "희망을 품고 잉태되어 방향을 고민하는 순수한 잠재력" },
    "양": { level: 60, description: "보살핌을 받으며 기반을 닦고 다음을 도약하는 힘" }
  };

  return energyMap[stage] || { level: 0, description: "데이터 없음" };
}

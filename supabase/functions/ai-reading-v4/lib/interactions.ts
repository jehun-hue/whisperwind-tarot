/**
 * interactions.ts — B-70new
 * 천간합(天干合), 지지충(地支沖), 지지합(地支合), 삼형살(三刑殺) 사전 연산
 * AI에게 날것의 글자 대신 완성된 상호작용 결과만 전달
 */

import { STEMS, BRANCHES } from "./fiveElements.ts";

// 천간합 테이블 (합이 되는 쌍 → 화하는 오행)
const STEM_COMBINATIONS: [string, string, string, string][] = [
  ["甲", "己", "토합", "안정·실용적 결합"],
  ["乙", "庚", "금합", "의지·결단력 강화"],
  ["丙", "辛", "수합", "지혜·감수성 활성"],
  ["丁", "壬", "목합", "성장·인연 활성화"],
  ["戊", "癸", "화합", "열정·변화 촉진"],
];

// 지지충 테이블 (충이 되는 쌍 → 의미 키워드)
const BRANCH_CONFLICTS: [string, string, string][] = [
  ["子", "午", "이동수·충돌·변화"],
  ["丑", "未", "재물 변동·가정 갈등"],
  ["寅", "申", "직업 변화·이동·충격"],
  ["卯", "酉", "관계 갈등·분리·결단"],
  ["辰", "戌", "재물·부동산 변동"],
  ["巳", "亥", "건강 주의·변화 국면"],
];

// 지지삼합 테이블 (삼합이 되는 조합 → 화하는 오행)
const BRANCH_THREE_COMBINATIONS: [string[], string, string][] = [
  [["寅", "午", "戌"], "화국", "열정·사회적 성취 활성"],
  [["巳", "酉", "丑"], "금국", "재물·결단·독립심 강화"],
  [["申", "子", "辰"], "수국", "지혜·직관·감수성 활성"],
  [["亥", "卯", "未"], "목국", "성장·인연·창의력 활성"],
];

// 지지육합 테이블
const BRANCH_SIX_COMBINATIONS: [string, string, string, string][] = [
  ["子", "丑", "토합", "안정·실용적 결합"],
  ["寅", "亥", "목합", "성장·인연 활성"],
  ["卯", "戌", "화합", "열정·변화 촉진"],
  ["辰", "酉", "금합", "재물·결단 강화"],
  ["巳", "申", "수합", "지혜·감수성 활성"],
  ["午", "未", "태양합", "온화·조화·안정"],
];

// 삼형살 테이블
const THREE_PENALTIES: [string[], string][] = [
  [["寅", "巳", "申"], "무은지형: 배신·배은망덕 주의"],
  [["丑", "戌", "未"], "지세지형: 고집·자기주장 과다"],
  [["子", "卯"], "무례지형: 예절·관계 갈등"],
];

export interface Interaction {
  type: "천간합" | "지지충" | "지지삼합" | "지지육합" | "삼형살";
  elements: string[];
  result: string;
  meaning_keyword: string;
  severity: "길" | "흉" | "중립";
}

/**
 * 사주 8글자(천간 4 + 지지 4)에서 모든 상호작용을 사전 연산
 */
export function calculateInteractions(
  stems: string[],   // 연·월·일·시 천간 4글자
  branches: string[] // 연·월·일·시 지지 4글자
): Interaction[] {
  const interactions: Interaction[] = [];

  // 1. 천간합 감지
  for (const [s1, s2, result, keyword] of STEM_COMBINATIONS) {
    const hasS1 = stems.includes(s1);
    const hasS2 = stems.includes(s2);
    if (hasS1 && hasS2) {
      interactions.push({
        type: "천간합",
        elements: [s1, s2],
        result,
        meaning_keyword: keyword,
        severity: "길",
      });
    }
  }

  // 2. 지지충 감지
  for (const [b1, b2, keyword] of BRANCH_CONFLICTS) {
    const hasB1 = branches.includes(b1);
    const hasB2 = branches.includes(b2);
    if (hasB1 && hasB2) {
      interactions.push({
        type: "지지충",
        elements: [b1, b2],
        result: "충(沖)",
        meaning_keyword: keyword,
        severity: "흉",
      });
    }
  }

  // 3. 지지삼합 감지 (B-135 fix: 완전삼합 3글자만 성립, 반합은 별도 약화 표시)
  for (const [combo, result, keyword] of BRANCH_THREE_COMBINATIONS) {
    const matchCount = combo.filter(b => branches.includes(b)).length;
    if (matchCount === 3) {
      // 완전삼합: 3글자 모두 있을 때만 성립
      interactions.push({
        type: "지지삼합",
        elements: combo.filter(b => branches.includes(b)),
        result,
        meaning_keyword: keyword,
        severity: "길",
      });
    } else if (matchCount === 2) {
      // 반합(半合): 성립은 하되 약화, 중립으로 표시
      interactions.push({
        type: "지지삼합",
        elements: combo.filter(b => branches.includes(b)),
        result: `${result}(반합·약)`,
        meaning_keyword: `${keyword} (반합, 효력 약함)`,
        severity: "중립",
      });
    }
  }

  // 4. 지지육합 감지
  for (const [b1, b2, result, keyword] of BRANCH_SIX_COMBINATIONS) {
    if (branches.includes(b1) && branches.includes(b2)) {
      interactions.push({
        type: "지지육합",
        elements: [b1, b2],
        result,
        meaning_keyword: keyword,
        severity: "길",
      });
    }
  }

  // 5. 삼형살 감지
  for (const [combo, keyword] of THREE_PENALTIES) {
    const matchCount = combo.filter(b => branches.includes(b)).length;
    if (matchCount >= combo.length) {
      interactions.push({
        type: "삼형살",
        elements: combo,
        result: "삼형살(三刑殺)",
        meaning_keyword: keyword,
        severity: "흉",
      });
    }
  }

  // 6. B-224: 천간병존(Parallel Stems) 감지
  const stemCounts: Record<string, number> = {};
  stems.forEach(s => {
    if (s && s !== "미상") stemCounts[s] = (stemCounts[s] || 0) + 1;
  });

  for (const [s, count] of Object.entries(stemCounts)) {
    if (count >= 2) {
      interactions.push({
        type: "천간병존" as any,
        elements: Array(count).fill(s),
        result: "병존",
        meaning_keyword: "동일 에너지 중복·강화",
        severity: "중립",
      });
    }
  }

  return interactions;
}

// ══════════════════════════════════════════════════════
// B-144: 신살(神殺) 계산 - 역마·도화·화개·공망 등
// ══════════════════════════════════════════════════════

export interface Shinsal {
  name: string;
  type: "역마" | "도화" | "화개" | "공망" | "양인" | "문창" | "천을귀인" | "홍염" | "태극" | "금여";
  description: string;
  health_implication: string | null;  // 건강 관련 의미
  topic_relevance: string[];          // 관련 토픽
  severity: "길" | "흉" | "중립";
}

// 도화살 테이블 (일지 기준 → 사주 내 해당 지지 존재 시 성립)
const DOHWA_MAP: Record<string, string> = {
  "寅": "卯", "午": "卯", "戌": "卯",
  "巳": "午", "酉": "午", "丑": "午",
  "申": "酉", "子": "酉", "辰": "酉",
  "亥": "子", "卯": "子", "未": "子",
};

// 역마살 테이블 (일지 기준)
const YEOKMA_MAP: Record<string, string> = {
  "寅": "申", "午": "申", "戌": "申",
  "巳": "亥", "酉": "亥", "丑": "亥",
  "申": "寅", "子": "寅", "辰": "寅",
  "亥": "巳", "卯": "巳", "未": "巳",
};

// 화개살 테이블 (일지 기준)
const HWAGAE_MAP: Record<string, string> = {
  "寅": "戌", "午": "戌", "戌": "戌",
  "巳": "丑", "酉": "丑", "丑": "丑",
  "申": "辰", "子": "辰", "辰": "辰",
  "亥": "未", "卯": "未", "未": "未",
};

// 양인살 테이블 (일간 기준)
const YANGIN_MAP: Record<string, string> = {
  "甲": "卯", "丙": "午", "戊": "午",
  "庚": "酉", "壬": "子",
  "乙": "辰", "丁": "未", "己": "未",
  "辛": "戌", "癸": "丑",
};

// 홍염살 테이블 (일간 기준)
const HONGYEOM_MAP: Record<string, string> = {
  "甲": "午", "乙": "午", "丙": "寅", "丁": "未", "戊": "辰",
  "己": "辰", "庚": "戌", "辛": "酉", "壬": "申", "癸": "申",
};

// 태극귀인 테이블 (일간 기준)
const TAEGEUK_MAP: Record<string, string[]> = {
  "甲": ["子", "午"], "乙": ["子", "午"],
  "丙": ["酉", "卯"], "丁": ["酉", "卯"],
  "戊": ["辰", "戌", "丑", "未"], "己": ["辰", "戌", "丑", "未"],
  "庚": ["寅", "亥"], "辛": ["寅", "亥"],
  "壬": ["巳", "申"], "癸": ["巳", "申"],
};

// 문창귀인 테이블 (일간 기준)
const MUNCHANG_MAP: Record<string, string> = {
  "甲": "巳", "乙": "午", "丙": "申", "丁": "酉", "戊": "申",
  "己": "酉", "庚": "亥", "辛": "子", "壬": "寅", "癸": "卯",
};

// 금여록 테이블 (일간 기준)
const GEUMYEO_MAP: Record<string, string> = {
  "甲": "辰", "乙": "巳", "丙": "未", "丁": "申", "戊": "未",
  "己": "申", "庚": "戌", "辛": "亥", "壬": "丑", "癸": "寅",
};

// 천을귀인 테이블 (일간 기준 → 2개 지지)
const CHEONIL_MAP: Record<string, string[]> = {
  "甲": ["丑", "未"], "戊": ["丑", "未"], "庚": ["丑", "未"],
  "乙": ["子", "申"], "己": ["子", "申"],
  "丙": ["亥", "酉"], "丁": ["亥", "酉"],
  "壬": ["卯", "巳"], "癸": ["卯", "巳"],
  "辛": ["寅", "午"],
};

/**
 * B-144: 사주 8글자에서 신살 계산
 * @param dayMaster 일간 (예: "壬")
 * @param dayBranch 일지 (예: "申")
 * @param allBranches 연·월·일·시 지지 4글자 배열
 */
export function calculateShinsal(
  dayMaster: string,
  dayBranch: string,
  allBranches: string[],
  yearBranch?: string
): Shinsal[] {
  const results: Shinsal[] = [];
  // bSet은 일지/시지/월지/년지 모두 포함
  const bSet = new Set(allBranches);

  // 1. 도화살 (년지 또는 일지 기준)
  const yBranch = yearBranch || allBranches[0];
  const dohwaTargetY = DOHWA_MAP[yBranch];
  const dohwaTargetD = DOHWA_MAP[dayBranch];
  if ((dohwaTargetY && bSet.has(dohwaTargetY)) || (dohwaTargetD && bSet.has(dohwaTargetD))) {
    results.push({
      name: "도화살", type: "도화",
      description: "매력·인기·이성운 강함. 감정적 갈등 가능성",
      health_implication: "피부·생식기 계통 주의",
      topic_relevance: ["relationship", "family"],
      severity: "중립",
    });
  }

  // 2. 역마살 (년지 또는 일지 기준)
  const yeokmaTargetY = YEOKMA_MAP[yBranch];
  const yeokmaTargetD = YEOKMA_MAP[dayBranch];
  if ((yeokmaTargetY && bSet.has(yeokmaTargetY)) || (yeokmaTargetD && bSet.has(yeokmaTargetD))) {
    results.push({
      name: "역마살", type: "역마",
      description: "이동·변화·해외운 강함. 바쁜 삶, 이주 가능성",
      health_implication: "사고·골절·신경계 주의",
      topic_relevance: ["migration", "life_change", "career"],
      severity: "중립",
    });
  }

  // 3. 화개살 (년지 기준 - B-223)
  const hwagaeTarget = HWAGAE_MAP[yBranch];
  // 연지 기준이므로 월/일/시 지지에 있는지 확인 (자기 자신 제외하기 위해 slice(1) 또는 인덱스 체크)
  const otherBranches = allBranches.slice(1);
  if (hwagaeTarget && otherBranches.includes(hwagaeTarget)) {
    results.push({
      name: "화개살", type: "화개",
      description: "학문·예술·종교적 감수성 뛰어남. 고독한 면",
      health_implication: "정신건강·우울·고립감 주의",
      topic_relevance: ["spirituality", "health"],
      severity: "중립",
    });
  }

  // 4. 홍염살 (일간 기준)
  const hongyeomTarget = HONGYEOM_MAP[dayMaster];
  if (hongyeomTarget && bSet.has(hongyeomTarget)) {
    results.push({
      name: "홍염살", type: "홍염",
      description: "고유의 매력과 다재다능함, 연인 간의 깊은 친밀감",
      health_implication: null,
      topic_relevance: ["relationship"],
      severity: "길",
    });
  }

  // 5. Taegeuk귀인 (일간 기준)
  const taegeukTargets = TAEGEUK_MAP[dayMaster] || [];
  if (taegeukTargets.some(t => bSet.has(t))) {
    results.push({
      name: "태극귀인", type: "태극",
      description: "조상의 덕, 입신양명, 초중반 인생의 안정과 발전",
      health_implication: null,
      topic_relevance: ["general", "career"],
      severity: "길",
    });
  }

  // 6. 문창귀인 (일간 기준)
  const munchangTarget = MUNCHANG_MAP[dayMaster];
  if (munchangTarget && bSet.has(munchangTarget)) {
    results.push({
      name: "문창귀인", type: "문창",
      description: "학문·글쓰기·예술적 천재성, 지혜로움",
      health_implication: null,
      topic_relevance: ["career", "general"],
      severity: "길",
    });
  }

  // 7. 양인살 (일간 기준)
  const yanginTarget = YANGIN_MAP[dayMaster];
  if (yanginTarget && bSet.has(yanginTarget)) {
    results.push({
      name: "양인살", type: "양인",
      description: "강한 의지력·추진력. 충돌·사고 위험",
      health_implication: "수술·외상·혈액 관련 주의",
      topic_relevance: ["health", "career"],
      severity: "흉",
    });
  }

  // 8. 금여록 (일간 기준)
  const geumyeoTarget = GEUMYEO_MAP[dayMaster];
  if (geumyeoTarget && bSet.has(geumyeoTarget)) {
    results.push({
      name: "금여록", type: "금여",
      description: "부귀공명, 평화로운 노년, 좋은 배우자 인연",
      health_implication: null,
      topic_relevance: ["family", "finance"],
      severity: "길",
    });
  }

  // 9. 천을귀인 (일간 기준)
  const cheonilTargets = CHEONIL_MAP[dayMaster] || [];
  if (cheonilTargets.some(t => bSet.has(t))) {
    results.push({
      name: "천을귀인", type: "천을귀인",
      description: "귀인의 도움·행운·위기 탈출 능력",
      health_implication: null,
      topic_relevance: ["career", "relationship", "general"],
      severity: "길",
    });
  }

  // 10. 겁살 (연지 기준 - B-223)
  const GEOBSAL_MAP: Record<string, string> = {
    "寅": "亥", "午": "亥", "戌": "亥",
    "巳": "寅", "酉": "寅", "丑": "寅",
    "申": "巳", "子": "巳", "辰": "巳",
    "亥": "申", "卯": "申", "未": "申",
  };
  const geobsalTarget = GEOBSAL_MAP[yBranch];
  if (geobsalTarget && otherBranches.includes(geobsalTarget)) {
    results.push({
      name: "겁살", type: "역마", // 분류상 역마 계열에 포함
      description: "경쟁에서의 탈환, 갑작스러운 손실 또는 획득",
      health_implication: "외상 주의",
      topic_relevance: ["finance", "career"],
      severity: "흉",
    });
  }

  // 7. 공망 (일주 기준 - B-223)
  const sIdx = STEMS.indexOf(dayMaster);
  const bIdx = BRANCHES.indexOf(dayBranch);
  if (sIdx >= 0 && bIdx >= 0) {
    const diff = (bIdx - sIdx + 12) % 12;
    const g1 = BRANCHES[(diff - 2 + 12) % 12];
    const g2 = BRANCHES[(diff - 1 + 12) % 12];
    // 년/월/시 지지에 있는지 확인
    const checkBranches = [allBranches[0], allBranches[1], allBranches[3]].filter(Boolean);
    if (checkBranches.includes(g1) || checkBranches.includes(g2)) {
      results.push({
        name: "공망",
        type: "공망",
        description: "해당 영역의 에너지가 비어있음. 채워지지 않는 갈증",
        health_implication: "허약 체질 주의",
        topic_relevance: ["general"],
        severity: "중립",
      });
    }
  }

  return results;
}

/**
 * interactions.ts — B-70new
 * 천간합(天干合), 지지충(地支沖), 지지합(地支合), 삼형살(三刑殺) 사전 연산
 * AI에게 날것의 글자 대신 완성된 상호작용 결과만 전달
 */

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

  return interactions;
}

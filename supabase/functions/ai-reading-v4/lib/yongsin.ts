/**
 * yongsin.ts
 * 용신(用神) 및 오행 강약 분석 엔진
 */

import { getElement, getElementKorean, ELEMENT_KOREAN } from "./fiveElements.ts";

export interface ElementStrengthResult {
  scores: Record<string, number>;     // 목/화/토/금/수 점수
  dayMasterElement: string;           // 일간 오행 (한국어)
  dayMasterStrength: '강' | '약' | '중화';
  deukryeong: boolean;    // 월지로부터 힘을 얻었는가
  deukji: boolean;        // 지지로부터 힘을 얻었는가
  deukse: boolean;        // 다른 천간들로부터 힘을 얻었는가
}

export interface YongsinResult {
  yongsin: string;
  huisin: string;
  gisin: string;
  gusin: string;
  method: '억부' | '조후' | '통관' | '병약';
  reasoning: string;
  johuNeeded?: string;
}

const ELEMENT_CYCLE = ["목", "화", "토", "금", "수"];

/**
 * 오행 강약 분석 (100점 만점 기준)
 */
export function analyzeElementStrength(
  stems: string[],
  branches: string[],
  monthBranch: string,
  dayMaster: string
): ElementStrengthResult {
  const dmElem = getElementKorean(dayMaster);
  const scores: Record<string, number> = { "목": 0, "화": 0, "토": 0, "금": 0, "수": 0 };
  
  // 가중치 배분 (전체 100점)
  // 천간 4개 각 10점 (40)
  // 월지 30점 (30)
  // 나머지 지지 3개 각 10점 (30)
  
  stems.forEach((s) => {
    const elem = getElementKorean(s);
    if (elem !== "unknown") scores[elem] += 10;
  });

  branches.forEach((b, idx) => {
    const elem = getElementKorean(b);
    if (elem === "unknown") return;
    
    // 월지 위치: pillars = [year, month, day, hour] 면 idx 1
    // (보통 analyzeSajuStructure 에서 monthBranch 를 별도로 전달하므로, 
    // branches 리스트 내의 월지 위치를 정확히 판별해야 함)
    // 여기서는 monthBranch 파라미터를 직접 사용하고, branches 에서는 제외하는 방식 대신
    // 월지일 경우만 30점, 아니면 10점 부여
    if (b === monthBranch) {
        scores[elem] += 20; // 이미 위에서 10점 받았을 수 있으니 누적 방식으로 관리
    } else {
        scores[elem] += 10;
    }
  });

  // 상생 관계 (도움)
  const getSupportElem = (target: string) => {
    const idx = ELEMENT_CYCLE.indexOf(target);
    const motherIdx = (idx - 1 + 5) % 5;
    return ELEMENT_CYCLE[motherIdx];
  };

  const supportElem = getSupportElem(dmElem);
  const selfPlusSupport = scores[dmElem] + scores[supportElem];

  // 득령: 월지 오행이 일간과 같거나 생해주는가
  const monthElem = getElementKorean(monthBranch);
  const deukryeong = (monthElem === dmElem || monthElem === supportElem);

  // 득지: 일지(보통 stems/branches list의 2번째 또는 index 2)가 통근처인가
  // 간단히 전체 지지에 비겁/인성이 2개 이상이면 득지로 판정
  const branchSupporters = branches.filter(b => {
    const e = getElementKorean(b);
    return e === dmElem || e === supportElem;
  }).length;
  const deukji = branchSupporters >= 2;

  // 득세: 천간에 비겁/인성이 2개 이상 (일간 제외)
  const stemSupporters = stems.filter((s, idx) => {
    if (s === dayMaster && idx === 2) return false; // 일주 천간 제외
    const e = getElementKorean(s);
    return e === dmElem || e === supportElem;
  }).length;
  const deukse = stemSupporters >= 2;

  let strength: '강' | '약' | '중화' = '중화';
  if (selfPlusSupport >= 55) strength = '강';
  else if (selfPlusSupport <= 40) strength = '약';

  return {
    scores,
    dayMasterElement: dmElem,
    dayMasterStrength: strength,
    deukryeong,
    deukji,
    deukse
  };
}

/**
 * 용신 판별 엔진
 */
export function determineYongsin(
  strengthResult: ElementStrengthResult,
  gyeokguk: string,
  dayMaster: string,
  monthBranch: string
): YongsinResult {
  const dmElem = strengthResult.dayMasterElement;
  const { dayMasterStrength, scores } = strengthResult;
  
  // 1. 조후용신 (Johu) - 최우선
  const monthJi = monthBranch.charAt(0);
  let johuNeeded = "";
  let johuReason = "";
  let yongsin = "";

  if (["巳", "午", "未"].includes(monthJi)) {
    johuNeeded = "수"; // 난(暖) -> 수(水) 필요
    johuReason = "여름철의 뜨거운 기운을 식혀줄 수(水) 기운이 조후상 필요합니다.";
    yongsin = "수";
  } else if (["亥", "子", "丑"].includes(monthJi)) {
    johuNeeded = "화"; // 한(寒) -> 화(火) 필요
    johuReason = "겨울철의 차가운 기운을 녹여줄 화(火) 기운이 조후상 필요합니다.";
    yongsin = "화";
  }

  if (yongsin) {
    const huisin = getMother(yongsin);
    const gisin = getConqueror(yongsin);
    const gusin = getMother(gisin);
    return {
      yongsin, huisin, gisin, gusin,
      method: "조후",
      reasoning: johuReason,
      johuNeeded
    };
  }

  // 2. 억부용신 (Eokbu)
  const oppositeElems = dayMasterStrength === "강" 
    ? [getChild(dmElem), getConquered(dmElem), getConqueror(dmElem)] // 식/재/관
    : [getMother(dmElem), dmElem]; // 인/비

  if (dayMasterStrength === "강") {
    // 가장 세력이 약하거나 중화가 필요한 오행 선택 (보통 관성이나 식상)
    yongsin = getConqueror(dmElem); // 관성 우선
    const reason = `일간의 세력이 강하므로 이를 제어하는 ${yongsin}(관성)을 용신으로 삼습니다.`;
    const gisin = getMother(dmElem); // 인성 (강한걸 더 강하게 함)
    return {
      yongsin,
      huisin: getChild(yongsin), // 재성 (관을 도움)
      gisin,
      gusin: dmElem,
      method: "억부",
      reasoning: reason
    };
  } else {
    yongsin = getMother(dmElem); // 인성 우선
    const reason = `일간의 세력이 약하므로 이를 돕는 ${yongsin}(인성)을 용신으로 삼습니다.`;
    const gisin = getConquered(dmElem); // 재성 (약한 일간을 더 약하게 함)
    return {
      yongsin,
      huisin: dmElem, // 비겁 (일간을 도움)
      gisin,
      gusin: getChild(gisin), // 식상 (재를 도움)
      method: "억부",
      reasoning: reason
    };
  }
}

// Helper functions for cycle
function getMother(elem: string) {
    const idx = ELEMENT_CYCLE.indexOf(elem);
    return ELEMENT_CYCLE[(idx - 1 + 5) % 5];
}
function getChild(elem: string) {
    const idx = ELEMENT_CYCLE.indexOf(elem);
    return ELEMENT_CYCLE[(idx + 1) % 5];
}
function getConquered(elem: string) {
    const idx = ELEMENT_CYCLE.indexOf(elem);
    return ELEMENT_CYCLE[(idx + 2) % 5];
}
function getConqueror(elem: string) {
    const idx = ELEMENT_CYCLE.indexOf(elem);
    return ELEMENT_CYCLE[(idx - 2 + 5) % 5];
}

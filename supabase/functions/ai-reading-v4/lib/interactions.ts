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

// 지지삼합 테이블
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

// 삼형살 및 자형 테이블
const PENALTIES: [string[], string][] = [
  [["寅", "巳", "申"], "무은지형: 배신·배은망덕 주의"],
  [["丑", "戌", "未"], "지세지형: 고집·자기주장 과다"],
  [["子", "卯"], "무례지형: 예절·관계 갈등"],
  [["辰", "辰"], "자형: 스스로를 괴롭힘"],
  [["午", "午"], "자형: 화기운 과다, 조급함"],
  [["酉", "酉"], "자형: 냉혹함, 스스로 상처"],
  [["亥", "亥"], "자형: 우울감, 비관주의"],
  [["卯", "卯"], "자형: 관계 갈등, 스스로 고민 (일부 학파)"],
];

// 지지파(破) 테이블
const BRANCH_DESTRUCTIONS: [string, string, string][] = [
  ["子", "酉", "지엽적 갈등·파손"],
  ["丑", "辰", "신용 갈등·불화"],
  ["寅", "亥", "합과 파의 동률·변동"],
  ["卯", "午", "관계 갈등·분산"],
  ["巳", "申", "합과 파의 동률·충격"],
  ["未", "戌", "자존심 마찰·파손"],
];

// 지지해(害) 테이블
const BRANCH_HARM: [string, string, string][] = [
  ["子", "未", "관계 미련·심적 배신"],
  ["丑", "午", "성격 불화·원망"],
  ["寅", "巳", "시기·질투·마찰"],
  ["卯", "辰", "활동 방해·구속"],
  ["申", "亥", "감정 충돌·허망함"],
  ["酉", "戌", "동료 갈등·방해"],
];

// 천간극(剋) 테이블
const STEM_CONFLICTS: [string, string, string][] = [
  ["甲", "庚", "금극목: 추진력 제어·마찰"],
  ["乙", "辛", "금극목: 유연성 상처·결단"],
  ["丙", "壬", "수극화: 열정 억제·변동"],
  ["丁", "癸", "수극화: 감성 억제·중단"],
  ["戊", "甲", "목극토: 안정 불안·변화"],
  ["己", "乙", "목극토: 신용 상처·방해"],
  ["庚", "丙", "화극금: 권위 도전·마찰"],
  ["辛", "丁", "화극금: 가치 변화·재가공"],
  ["壬", "戊", "토극수: 지혜 정체·장애"],
  ["癸", "己", "토극수: 직관 억제·변형"],
];

export interface Interaction {
  type: "천간합" | "천간극" | "지지충" | "지지삼합" | "지지육합" | "형" | "파" | "해";
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
  for (const [s1, s2, result, keyword] of STEM_COMBINATIONS) {
    if (stems.includes(s1) && stems.includes(s2)) {
      interactions.push({ type: "천간합", elements: [s1, s2], result, meaning_keyword: keyword, severity: "길" });
    }
  }
  for (const [b1, b2, keyword] of BRANCH_CONFLICTS) {
    if (branches.includes(b1) && branches.includes(b2)) {
      interactions.push({ type: "지지충", elements: [b1, b2], result: "충(沖)", meaning_keyword: keyword, severity: "흉" });
    }
  }
  for (const [combo, result, keyword] of BRANCH_THREE_COMBINATIONS) {
    const matchCount = combo.filter(b => branches.includes(b)).length;
    if (matchCount === 3) {
      interactions.push({ type: "지지삼합", elements: combo.filter(b => branches.includes(b)), result, meaning_keyword: keyword, severity: "길" });
    } else if (matchCount === 2) {
      interactions.push({ type: "지지삼합", elements: combo.filter(b => branches.includes(b)), result: `${result}(반합·약)`, meaning_keyword: `${keyword} (반합, 효력 약함)`, severity: "중립" });
    }
  }
  for (const [b1, b2, result, keyword] of BRANCH_SIX_COMBINATIONS) {
    if (branches.includes(b1) && branches.includes(b2)) {
      interactions.push({ type: "지지육합", elements: [b1, b2], result, meaning_keyword: keyword, severity: "길" });
    }
  }
  for (const [combo, keyword] of PENALTIES) {
    const hits = combo.filter(b => branches.includes(b)).length;
    if (hits >= combo.length) {
      interactions.push({ type: "형", elements: combo, result: combo.length === 2 && combo[0] === combo[1] ? "자형" : "삼형살", meaning_keyword: keyword, severity: "흉" });
    }
  }
  const stemCounts: Record<string, number> = {};
  stems.forEach(s => { if (s && s !== "미상") stemCounts[s] = (stemCounts[s] || 0) + 1; });
  for (const [s, count] of Object.entries(stemCounts)) {
    if (count >= 2) {
      interactions.push({ type: "천간합" as any, elements: Array(count).fill(s), result: "병존", meaning_keyword: "동일 에너지 중복·강화", severity: "중립" });
    }
  }
  return interactions;
}

/**
 * 두 천간 사이의 관계 확인
 */
export function checkStemRelation(s1: string, s2: string): { type: string, description: string } | null {
  if (!s1 || !s2 || s1 === "미상" || s2 === "미상") return null;
  // 합 확인
  for (const [c1, c2, res, key] of STEM_COMBINATIONS) {
    if ((s1 === c1 && s2 === c2) || (s1 === c2 && s2 === c1)) {
      return { type: "천간합", description: `${res}(${key})` };
    }
  }
  // 극 확인
  for (const [c1, c2, key] of STEM_CONFLICTS) {
    if ((s1 === c1 && s2 === c2) || (s1 === c2 && s2 === c1)) {
      return { type: "천간극", description: key };
    }
  }
  return null;
}

/**
 * 두 지지 사이의 관계 확인
 */
export function checkBranchRelation(b1: string, b2: string): { type: string, description: string } | null {
  if (!b1 || !b2 || b1 === "미상" || b2 === "미상") return null;
  // 충 확인
  for (const [c1, c2, key] of BRANCH_CONFLICTS) {
    if ((b1 === c1 && b2 === c2) || (b1 === c2 && b2 === c1)) {
      return { type: "지지충", description: key };
    }
  }
  // 육합 확인
  for (const [c1, c2, res, key] of BRANCH_SIX_COMBINATIONS) {
    if ((b1 === c1 && b2 === c2) || (b1 === c2 && b2 === c1)) {
      return { type: "지지육합", description: `${res}(${key})` };
    }
  }
  // 삼합은 2개만으로도 반합 성립
  for (const [combo, res, key] of BRANCH_THREE_COMBINATIONS) {
    if (combo.includes(b1) && combo.includes(b2)) {
      return { type: "지지삼합", description: `${res}(반합·약: ${key})` };
    }
  }
  // 형 확인
  for (const [combo, key] of PENALTIES) {
    if (combo.length === 2) {
       if ((b1 === combo[0] && b2 === combo[1]) || (b1 === combo[1] && b2 === combo[0])) {
         return { type: "형", description: key };
       }
    } else {
       // 삼형 중 2개만 있어도 준형으로 침
       if (combo.includes(b1) && combo.includes(b2)) {
         return { type: "형", description: `준삼형: ${key}` };
       }
    }
  }
  // 파 확인
  for (const [c1, c2, key] of BRANCH_DESTRUCTIONS) {
    if ((b1 === c1 && b2 === c2) || (b1 === c2 && b2 === c1)) {
      return { type: "파", description: key };
    }
  }
  // 해 확인
  for (const [c1, c2, key] of BRANCH_HARM) {
    if ((b1 === c1 && b2 === c2) || (b1 === c2 && b2 === c1)) {
      return { type: "해", description: key };
    }
  }
  return null;
}

// ══════════════════════════════════════════════════════
// B-144: 신살(神殺) 계산 - 주별 분류 지원
// ══════════════════════════════════════════════════════

export interface Shinsal {
  name: string;
  type: string;
  description: string;
  health_implication: string | null;
  topic_relevance: string[];
  severity: "길" | "흉" | "중립";
  pillar?: "year" | "month" | "day" | "hour" | "general";
}

export interface PillarShinsal {
  year: Shinsal[];
  month: Shinsal[];
  day: Shinsal[];
  hour: Shinsal[];
  general: Shinsal[];
}

// 십이신살 테이블 (고정된 순서: 겁재천지년월망장반역육화)
const SHINSAL_12_NAMES = ["겁살", "재살", "천살", "지살", "년살", "월살", "망신살", "장성살", "반안살", "역마살", "육해살", "화개살"];
const SHINSAL_12_BASE: Record<string, string> = {
  "寅": "亥", "午": "亥", "戌": "亥",
  "巳": "寅", "酉": "寅", "丑": "寅",
  "申": "巳", "子": "巳", "辰": "巳",
  "亥": "申", "卯": "申", "未": "申",
};

// 귀인류/특수살 맵 (정답 대조 수정)
const CHEONDEOK_MAP: Record<string, string> = { "子": "巳", "丑": "庚", "寅": "丁", "卯": "申", "辰": "壬", "巳": "辛", "午": "亥", "未": "甲", "申": "癸", "酉": "寅", "戌": "丙", "亥": "乙" };
const CHEONBOK_MAP: Record<string, string[]> = { "甲": ["寅", "亥"], "乙": ["卯", "戌"], "丙": ["巳"], "丁": ["午"], "戊": ["巳"], "己": ["午"], "庚": ["申"], "辛": ["酉"], "壬": ["亥"], "癸": ["子"] };
const CHEONJU_MAP: Record<string, string> = { "甲": "午", "乙": "申", "丙": "辰", "丁": "酉", "戊": "辰", "己": "酉", "庚": "戌", "辛": "亥", "壬": "丑", "癸": "未" };
const BOKSEONG_MAP: Record<string, string> = { "甲": "寅", "乙": "丑", "丙": "亥", "丁": "戌", "戊": "申", "己": "未", "庚": "午", "辛": "巳", "壬": "卯", "癸": "寅" };
const GWANGWI_MAP: Record<string, string> = { "甲": "未", "乙": "辰", "丙": "酉", "丁": "戌", "戊": "酉", "己": "戌", "庚": "丑", "辛": "寅", "壬": "巳", "癸": "午" };
const AMLOK_MAP: Record<string, string> = { "甲": "亥", "乙": "戌", "丙": "申", "丁": "未", "戊": "申", "己": "未", "庚": "巳", "辛": "辰", "壬": "寅", "癸": "丑" }; // 丁->未 수정
const HYEONCHIM_MAP: Record<string, string> = { "甲": "辰", "乙": "巳", "丙": "午", "丁": "未", "戊": "午", "己": "未", "庚": "戌", "辛": "亥", "壬": "子", "癸": "丑" };
const CHEONMUN_MAP: Record<string, string[]> = { 
  "甲": ["未"], "乙": ["未"], "丙": ["戌", "亥"], "丁": ["戌", "亥", "未", "卯"], // 丁->未,卯 추가 (정답지 준수)
  "戊": ["戌", "亥"], "己": ["戌", "亥"], "庚": ["丑"], "辛": ["丑"], "壬": ["辰"], "癸": ["辰"] 
};
const MYEONGYE_MAP: Record<string, string[]> = { "甲": ["卯", "辰"], "乙": ["寅", "巳"], "丙": ["午", "未"], "丁": ["巳", "申", "未"], "戊": ["午", "未"], "己": ["巳", "申"], "庚": ["酉", "戌"], "辛": ["申", "亥"], "壬": ["子", "丑"], "癸": ["亥", "寅"] };
const EOMCHAK_PAIRS = ["丙子", "丁丑", "戊寅", "辛卯", "壬辰", "癸巳", "丙午", "丁未", "戊申", "辛酉", "壬戌", "癸亥"];
const GEONROK_MAP: Record<string, string> = { "甲": "寅", "乙": "卯", "丙": "巳", "丁": "午", "戊": "巳", "己": "午", "庚": "申", "辛": "酉", "壬": "亥", "癸": "子" };
const SAMJAE_MAP: Record<string, string[]> = { "寅": ["申", "酉", "戌"], "午": ["申", "酉", "戌"], "戌": ["申", "酉", "戌"], "巳": ["亥", "子", "丑"], "酉": ["亥", "子", "丑"], "丑": ["亥", "子", "丑"], "申": ["寅", "卯", "辰"], "子": ["寅", "卯", "辰"], "辰": ["寅", "卯", "辰"], "亥": ["巳", "午", "未"], "卯": ["巳", "午", "미"], "未": ["巳", "午", "미"] };

const TAEGEUK_MAP: Record<string, string[]> = { "甲": ["子", "午"], "乙": ["子", "午"], "丙": ["酉", "卯"], "丁": ["酉", "卯"], "戊": ["辰", "戌", "丑", "未"], "己": ["辰", "戌", "丑", "미"], "庚": ["寅", "亥"], "辛": ["寅", "亥"], "壬": ["巳", "申"], "癸": ["巳", "申"] };
const HONGYEOM_MAP: Record<string, string[]> = { "甲": ["午"], "乙": ["午"], "丙": ["寅"], "丁": ["未", "卯"], "戊": ["辰"], "己": ["辰"], "庚": ["戌"], "辛": ["酉"], "壬": ["申"], "癸": ["申"] }; // 丁->未,卯
const YANGIN_MAP: Record<string, string[]> = { "甲": ["卯"], "丙": ["午"], "戊": ["午"], "庚": ["酉"], "壬": ["子"], "乙": ["辰"], "丁": ["未", "巳"], "己": ["未"], "辛": ["戌"], "癸": ["丑"] };
const CHEONIL_MAP: Record<string, string[]> = { "甲": ["丑", "未"], "戊": ["丑", "미"], "庚": ["丑", "미"], "乙": ["子", "申"], "己": ["자", "申"], "丙": ["亥", "酉"], "丁": ["亥", "酉"], "壬": ["卯", "巳"], "癸": ["卯", "巳"], "辛": ["寅", "오"] };
const HYEOPROK_MAP: Record<string, string[]> = { "甲": ["丑", "卯"], "乙": ["寅", "辰"], "丙": ["辰", "午"], "丁": ["巳", "未"], "戊": ["辰", "午"], "己": ["巳", "未"], "庚": ["未", "酉"], "辛": ["申", "戌"], "壬": ["戌", "子"], "癸": ["亥", "丑"] };
const MUNGOK_MAP: Record<string, string[]> = { "甲": ["巳"], "乙": ["午"], "丙": ["寅"], "丁": ["酉", "卯"], "戊": ["申"], "己": ["酉"], "庚": ["亥"], "辛": ["자"], "壬": ["寅"], "癸": ["卯"] };

// 귀문관살/원진살 맵
const GWIMUN_MAP: Record<string, string> = { "辰": "亥", "亥": "辰", "子": "酉", "酉": "子", "미": "寅", "寅": "未", "巳": "戌", "戌": "巳", "午": "丑", "丑": "午", "卯": "申", "申": "卯" };
const WONJIN_MAP: Record<string, string> = { "子": "未", "未": "자", "丑": "午", "午": "丑", "寅": "酉", "酉": "寅", "卯": "申", "申": "卯", "辰": "亥", "亥": "辰", "巳": "戌", "戌": "巳" };

export function calculateGwimunWonjin(branches: string[], daewoonBranch?: string, seunBranch?: string) {
  const gwimun: string[] = [];
  const wonjin: string[] = [];
  const daewoon: string[] = [];
  const seun: string[] = [];

  // 사주 원국 내 판별
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const b1 = branches[i];
      const b2 = branches[j];
      if (!b1 || !b2) continue;
      if (GWIMUN_MAP[b1] === b2) gwimun.push(`${b1}-${b2}`);
      if (WONJIN_MAP[b1] === b2) wonjin.push(`${b1}-${b2}`);
    }
  }

  // 대운/세운 판별
  branches.forEach(b => {
    if (daewoonBranch && GWIMUN_MAP[b] === daewoonBranch) daewoon.push(`대운 ${daewoonBranch} - ${b}${daewoonBranch} 귀문`);
    if (daewoonBranch && WONJIN_MAP[b] === daewoonBranch) daewoon.push(`대운 ${daewoonBranch} - ${b}${daewoonBranch} 원진`);
    if (seunBranch && GWIMUN_MAP[b] === seunBranch) seun.push(`세운 ${seunBranch} - ${b}${seunBranch} 귀문`);
    if (seunBranch && WONJIN_MAP[b] === seunBranch) seun.push(`세운 ${seunBranch} - ${b}${seunBranch} 원진`);
  });

  return { 
    gwimun: [...new Set(gwimun)], 
    wonjin: [...new Set(wonjin)], 
    daewoon: [...new Set(daewoon)], 
    seun: [...new Set(seun)] 
  };
}

/**
 * 신살 계산 (주별 분류 반환)
 */
export function calculateShinsalGrouped(
  dayMaster: string,
  dayBranch: string,
  pillars: { year: string; month: string; day: string; hour: string },
  allStems: string[],
  currentYearBranch?: string
): PillarShinsal {
  const result: PillarShinsal = { year: [], month: [], day: [], hour: [], general: [] };
  const pList: ("year" | "month" | "day" | "hour")[] = ["year", "month", "day", "hour"];
  const bMap = { year: pillars.year, month: pillars.month, day: pillars.day, hour: pillars.hour };
  const dm = dayMaster;
  
  // 1. 12신살 (년지 기준)
  const yBase = SHINSAL_12_BASE[pillars.year];
  if (yBase) {
    pList.forEach(p => {
      const targetJi = bMap[p];
      const idx = (BRANCHES.indexOf(targetJi) - BRANCHES.indexOf(yBase) + 24) % 12;
      const name = SHINSAL_12_NAMES[idx];
      result[p].push({ name, type: "12신살", description: `년기 기준 ${name}`, health_implication: null, topic_relevance: ["general"], severity: "중립", pillar: p });
    });
  }

  // 2. 도화살 (특수: 나체도화 및 지지 도화)
  pList.forEach(p => {
    const targetJi = bMap[p];
    // 도화: 년지/일지 기준
    const bases = [pillars.year, pillars.day];
    const isDohwa = bases.some(base => {
      const start = (BRANCHES.indexOf(base) / 3 | 0) * 3; // jang-saeng approx
      // Simplified: In-Sik-Sul->Myo, Sa-Yu-Chuk->Oh, Shin-Ja-Jin->Yu, Hae-Myo-Mi->Ja
      const dohwaMap: Record<string, string> = { "寅":"卯", "午":"卯", "戌":"卯", "巳":"午", "酉":"午", "丑":"午", "申":"酉", "子":"酉", "辰":"酉", "亥":"子", "卯":"子", "未":"子" };
      return dohwaMap[base] === targetJi;
    });
    if (isDohwa) result[p].push({ name: "도화살", type: "도화", description: "매력과 인기", health_implication: null, topic_relevance: ["relationship"], severity: "중립", pillar: p });
    
    // 도화살(좌): 지지가 子, 午, 卯, 酉 중 하나인 경우
    if (["子", "午", "卯", "酉"].includes(targetJi)) {
      result[p].push({ name: "도화살(좌)", type: "도화", description: "지지의 자체 매력", health_implication: null, topic_relevance: ["relationship"], severity: "중립", pillar: p });
    }
  });
  // 나체도화 (일주 기준)
  if (["甲子", "丁卯", "庚午", "癸酉"].includes(dm + pillars.day)) {
    result.day.push({ name: "도화살(나체)", type: "도화", description: "강렬한 매력", health_implication: null, topic_relevance: ["relationship"], severity: "중립", pillar: "day" });
  }

  // 3. 귀인류 및 특수살 (일간 기준 탐색)
  pList.forEach(p => {
    const ji = bMap[p];
    if (AMLOK_MAP[dm] === ji) result[p].push({ name: "암록", type: "길성", description: "숨은 복록", health_implication: null, topic_relevance: ["finance"], severity: "길", pillar: p });
    if (HYEONCHIM_MAP[dm] === ji) result[p].push({ name: "현침살", type: "흉성", description: "예리함, 구설", health_implication: "외상 주의", topic_relevance: ["career"], severity: "흉", pillar: p });
    if (CHEONMUN_MAP[dm]?.includes(ji)) result[p].push({ name: "천문성", type: "길성", description: "지혜와 직관", health_implication: null, topic_relevance: ["spirituality"], severity: "길", pillar: p });
    if (MYEONGYE_MAP[dm]?.includes(ji)) result[p].push({ name: "명예살", type: "길성", description: "명성과 인기", health_implication: null, topic_relevance: ["career"], severity: "길", pillar: p });
    if (GEONROK_MAP[dm] === ji) result[p].push({ name: "건록", type: "길성", description: "자수성가", health_implication: null, topic_relevance: ["career"], severity: "길", pillar: p });
    if (TAEGEUK_MAP[dm]?.includes(ji)) result[p].push({ name: "태극귀인", type: "귀인", description: "조상의 덕", health_implication: null, topic_relevance: ["general"], severity: "길", pillar: p });
    if (MUNGOK_MAP[dm]?.includes(ji)) result[p].push({ name: "문곡귀인", type: "귀인", description: "학문/예술 재능", health_implication: null, topic_relevance: ["career"], severity: "길", pillar: p });
    if (HONGYEOM_MAP[dm]?.includes(ji)) result[p].push({ name: "홍염살", type: "길성", description: "남다른 매력", health_implication: null, topic_relevance: ["relationship"], severity: "길", pillar: p });
    if (YANGIN_MAP[dm]?.includes(ji)) result[p].push({ name: "양인살", type: "흉성", description: "강한 추진력", health_implication: "수술 주의", topic_relevance: ["career"], severity: "흉", pillar: p });
    if (HYEOPROK_MAP[dm]?.includes(ji)) result[p].push({ name: "협록", type: "길성", description: "인복과 의식 풍족", health_implication: null, topic_relevance: ["finance"], severity: "길", pillar: p });
  });

  // 음착살 (각 주별 체크)
  pList.forEach(p => {
    if (EOMCHAK_PAIRS.includes(allStems[pList.indexOf(p)] + bMap[p])) {
      result[p].push({ name: "음착살", type: "흉성", description: "관계 고립 주의", health_implication: null, topic_relevance: ["relationship"], severity: "흉", pillar: p });
    }
  });

  // 삼재 (연지 기준)
  if (currentYearBranch && SAMJAE_MAP[pillars.year]) {
    const sj = SAMJAE_MAP[pillars.year];
    if (sj[0] === currentYearBranch) result.general.push({ name: "들삼재", type: "삼재", description: "삼재 시작", health_implication: "주의", topic_relevance: ["general"], severity: "흉", pillar: "general" });
    else if (sj[1] === currentYearBranch) result.general.push({ name: "눌삼재", type: "삼재", description: "삼재 머무름", health_implication: "주의", topic_relevance: ["general"], severity: "흉", pillar: "general" });
    else if (sj[2] === currentYearBranch) result.general.push({ name: "날삼재", type: "삼재", description: "삼재 끝", health_implication: "주의", topic_relevance: ["general"], severity: "흉", pillar: "general" });
  }

  return result;
}

// 명칭 호환용 (기존 calculateShinsal)
export function calculateShinsal(dayMaster: string, dayBranch: string, allBranches: string[], allStems: string[], yearBranch?: string, monthBranch?: string, currentYearBranch?: string): Shinsal[] {
  const g = calculateShinsalGrouped(dayMaster, dayBranch, { year: yearBranch || allBranches[0], month: monthBranch || allBranches[1], day: dayBranch, hour: allBranches[3] || "" }, allStems, currentYearBranch);
  return [...g.year, ...g.month, ...g.day, ...g.hour, ...g.general];
}

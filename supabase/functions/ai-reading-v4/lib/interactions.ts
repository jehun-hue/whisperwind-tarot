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

// 지지방합 테이블
const BRANCH_DIRECTION_COMBINATIONS: [string[], string, string][] = [
  [["寅", "卯", "辰"], "목국", "동방 목국 방합: 성장·인연·창의력 활성"],
  [["巳", "午", "未"], "화국", "남방 화국 방합: 열정·사회적 성취 활성"],
  [["申", "酉", "戌"], "금국", "서방 금국 방합: 재물·결단·독립심 강화"],
  [["亥", "子", "丑"], "수국", "북방 수국 방합: 지혜·직관·감수성 활성"],
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
  type: "천간합" | "천간극" | "지지충" | "지지삼합" | "지지방합" | "지지육합" | "형" | "파" | "해";
  name?: string;           // Added for promptBuilder compatibility
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
      interactions.push({ type: "천간합", name: `${s1}${s2}합`, elements: [s1, s2], result, meaning_keyword: keyword, severity: "길" });
    }
  }
  for (const [b1, b2, keyword] of BRANCH_CONFLICTS) {
    if (branches.includes(b1) && branches.includes(b2)) {
      interactions.push({ type: "지지충", name: `${b1}${b2}충`, elements: [b1, b2], result: "충(沖)", meaning_keyword: keyword, severity: "흉" });
    }
  }
  for (const [combo, result, keyword] of BRANCH_THREE_COMBINATIONS) {
    const matchCount = combo.filter(b => branches.includes(b)).length;
    if (matchCount === 3) {
      interactions.push({ type: "지지삼합", name: combo.join(""), elements: combo.filter(b => branches.includes(b)), result, meaning_keyword: keyword, severity: "길" });
    } else if (matchCount === 2) {
      interactions.push({ type: "지지삼합", name: combo.filter(b => branches.includes(b)).join(""), elements: combo.filter(b => branches.includes(b)), result: `${result}(반합·약)`, meaning_keyword: `${keyword} (반합, 효력 약함)`, severity: "중립" });
    }
  }
  for (const [b1, b2, result, keyword] of BRANCH_SIX_COMBINATIONS) {
    if (branches.includes(b1) && branches.includes(b2)) {
      interactions.push({ type: "지지육합", name: `${b1}${b2}합`, elements: [b1, b2], result, meaning_keyword: keyword, severity: "길" });
    }
  }
  for (const [combo, keyword] of PENALTIES) {
    if (combo.length === 2 && combo[0] === combo[1]) {
      // 자형(自刑) 체크: 같은 글자가 2개 필요
      const count = branches.filter(b => b === combo[0]).length;
      if (count >= 2) {
        interactions.push({ type: "형", name: `${combo[0]}${combo[0]}자형`, elements: [combo[0], combo[0]], result: "자형", meaning_keyword: keyword, severity: "흉" });
      }
    } else {
      // 일반 형살: 구성 요소가 모두 존재해야 함
      const hits = combo.filter(b => branches.includes(b)).length;
      if (hits >= combo.length) {
        interactions.push({ type: "형", name: `${combo.join("")}형`, elements: combo, result: "형살", meaning_keyword: keyword, severity: "흉" });
      }
    }
  }
  const stemCounts: Record<string, number> = {};
  stems.forEach(s => { if (s && s !== "미상") stemCounts[s] = (stemCounts[s] || 0) + 1; });
  for (const [s, count] of Object.entries(stemCounts)) {
    if (count >= 2) {
      interactions.push({ type: "천간합" as any, elements: Array(count).fill(s), result: "병존", meaning_keyword: "동일 에너지 중복·강화", severity: "중립" });
    }
  }
  for (const [combo, result, keyword] of BRANCH_DIRECTION_COMBINATIONS) {
    if (combo.every(b => branches.includes(b))) {
      interactions.push({ type: "지지방합", name: combo.join(""), elements: combo, result, meaning_keyword: keyword, severity: "길" });
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
const CHEONIL_MAP: Record<string, string[]> = { "甲": ["丑", "未"], "戊": ["丑", "未"], "庚": ["丑", "未"], "乙": ["子", "申"], "己": ["子", "申"], "丙": ["亥", "酉"], "丁": ["亥", "酉"], "壬": ["卯", "巳"], "癸": ["卯", "巳"], "辛": ["寅", "午"] };
const MUNCHANG_MAP: Record<string, string> = { "甲": "巳", "乙": "午", "丙": "申", "丁": "酉", "戊": "申", "己": "酉", "庚": "亥", "辛": "子", "壬": "寅", "癸": "卯" };
const HAKDANG_MAP: Record<string, string> = { "甲": "亥", "乙": "午", "丙": "寅", "丁": "酉", "戊": "寅", "己": "酉", "庚": "巳", "辛": "子", "壬": "申", "癸": "卯" };
const CHEONDEOK_MAP: Record<string, string> = { "子": "巳", "丑": "庚", "寅": "丁", "卯": "申", "辰": "壬", "巳": "辛", "午": "亥", "未": "甲", "申": "癸", "酉": "寅", "戌": "丙", "亥": "乙" };
const WOLDEOK_MAP: Record<string, string> = { 
  "寅": "丙", "午": "丙", "戌": "丙", 
  "申": "壬", "子": "壬", "辰": "壬", 
  "巳": "庚", "酉": "庚", "丑": "庚", 
  "亥": "甲", "卯": "甲", "未": "甲" 
};
const GEUMYEO_MAP: Record<string, string> = { "甲": "辰", "乙": "巳", "丙": "未", "丁": "申", "戊": "未", "己": "申", "庚": "戌", "辛": "亥", "壬": "丑", "癸": "寅" };
const BAEKHO_LIST = ["甲辰", "乙巳", "丙申", "丁酉", "戊午", "己丑", "庚寅", "辛卯", "壬戌", "癸亥"];
const GOEGANG_LIST = ["庚辰", "壬辰", "庚戌", "壬戌"];

// 기존 맵 유지 (하위 호환 및 보조)
const CHEONBOK_MAP: Record<string, string[]> = { "甲": ["寅", "亥"], "乙": ["卯", "戌"], "丙": ["巳"], "丁": ["午"], "戊": ["巳"], "己": ["午"], "庚": ["申"], "辛": ["酉"], "壬": ["亥"], "癸": ["子"] };
const CHEONJU_MAP: Record<string, string> = { "甲": "午", "乙": "申", "丙": "辰", "丁": "酉", "戊": "辰", "己": "酉", "庚": "戌", "辛": "亥", "壬": "丑", "癸": "未" };
const BOKSEONG_MAP: Record<string, string> = { "甲": "寅", "乙": "丑", "丙": "亥", "丁": "戌", "戊": "申", "己": "未", "庚": "午", "辛": "巳", "壬": "卯", "癸": "寅" };
const GWANGWI_MAP: Record<string, string> = { "甲": "未", "乙": "辰", "丙": "酉", "丁": "戌", "戊": "酉", "己": "戌", "庚": "丑", "辛": "寅", "壬": "巳", "癸": "午" };
const AMLOK_MAP: Record<string, string> = { "甲": "亥", "乙": "戌", "丙": "申", "丁": "未", "戊": "申", "己": "未", "庚": "巳", "辛": "辰", "壬": "寅", "癸": "丑" };
const HYEONCHIM_MAP: Record<string, string> = { "甲": "辰", "乙": "巳", "丙": "午", "丁": "未", "戊": "午", "己": "未", "庚": "戌", "辛": "亥", "壬": "子", "癸": "丑" };
const CHEONMUN_MAP: Record<string, string[]> = { 
  "甲": ["未"], "乙": ["未"], "丙": ["戌", "亥"], "丁": ["戌", "亥", "未", "卯"],
  "戊": ["戌", "亥"], "己": ["戌", "亥"], "庚": ["丑"], "辛": ["丑"], "壬": ["辰"], "癸": ["辰"] 
};
const MYEONGYE_MAP: Record<string, string[]> = { "甲": ["卯", "辰"], "乙": ["寅", "巳"], "丙": ["午", "未"], "丁": ["巳", "申", "未"], "戊": ["午", "未"], "己": ["巳", "申"], "庚": ["酉", "戌"], "辛": ["申", "亥"], "壬": ["子", "丑"], "癸": ["亥", "寅"] };
const EOMCHAK_PAIRS = ["丙子", "丁丑", "戊寅", "辛卯", "壬辰", "癸巳", "丙午", "丁未", "戊申", "辛酉", "壬戌", "癸亥"];
const GEONROK_MAP: Record<string, string> = { "甲": "寅", "乙": "卯", "丙": "巳", "丁": "午", "戊": "巳", "己": "午", "庚": "申", "辛": "酉", "壬": "亥", "癸": "子" };
const SAMJAE_MAP: Record<string, string[]> = { "寅": ["申", "酉", "戌"], "午": ["申", "酉", "戌"], "戌": ["申", "酉", "戌"], "巳": ["亥", "子", "丑"], "酉": ["亥", "子", "丑"], "丑": ["亥", "子", "丑"], "申": ["寅", "卯", "辰"], "子": ["寅", "卯", "辰"], "辰": ["寅", "卯", "辰"], "亥": ["巳", "午", "未"], "卯": ["巳", "午", "未"], "未": ["巳", "午", "未"] };

const TAEGEUK_MAP: Record<string, string[]> = { "甲": ["子", "午"], "乙": ["子", "午"], "丙": ["酉", "卯"], "丁": ["酉", "卯"], "戊": ["辰", "戌", "丑", "未"], "己": ["辰", "戌", "丑", "未"], "庚": ["寅", "亥"], "辛": ["寅", "亥"], "壬": ["巳", "申"], "癸": ["巳", "申"] };
const HONGYEOM_MAP: Record<string, string[]> = { "甲": ["午"], "乙": ["午"], "丙": ["寅"], "丁": ["未", "卯"], "戊": ["辰"], "己": ["辰"], "庚": ["戌"], "辛": ["酉"], "壬": ["申"], "癸": ["申"] };
const YANGIN_MAP: Record<string, string> = { "甲": "卯", "乙": "辰", "丙": "午", "丁": "午", "戊": "午", "己": "未", "庚": "酉", "辛": "戌", "壬": "子", "癸": "丑" };
const HYEOPROK_MAP: Record<string, string[]> = { "甲": ["丑", "卯"], "乙": ["寅", "辰"], "丙": ["辰", "午"], "丁": ["巳", "未"], "戊": ["辰", "午"], "己": ["巳", "未"], "庚": ["未", "酉"], "辛": ["申", "戌"], "壬": ["戌", "子"], "癸": ["亥", "丑"] };
const MUNGOK_MAP: Record<string, string[]> = { "甲": ["巳"], "乙": ["午"], "丙": ["寅"], "丁": ["酉", "卯"], "戊": ["申"], "己": ["酉"], "庚": ["亥"], "辛": ["子"], "壬": ["寅"], "癸": ["卯"] };

/**
 * B-223: 공망(空亡) 계산
 * 일주 기준으로 해당 旬을 찾고 공망 2개 지지 반환
 */
export function calculateGongmang(dayStem: string, dayBranch: string, pillars: { year: string; month: string; day: string; hour: string }) {
  const stemIdx = STEMS.indexOf(dayStem);
  const branchIdx = BRANCHES.indexOf(dayBranch);
  if (stemIdx < 0 || branchIdx < 0) return { emptied: [], affectedPillars: [] };

  const sunStartBranchIdx = (branchIdx - stemIdx + 12) % 12;
  const sunStartBranch = BRANCHES[sunStartBranchIdx];

  const GONGMANG_MAP: Record<string, string[]> = {
    "子": ["戌", "亥"], 
    "戌": ["申", "酉"], 
    "申": ["午", "未"], 
    "午": ["辰", "巳"], 
    "辰": ["寅", "卯"], 
    "寅": ["子", "丑"], 
  };

  const emptied = GONGMANG_MAP[sunStartBranch] || [];
  const affectedPillars: string[] = [];

  if (emptied.includes(pillars.year)) affectedPillars.push("년주");
  if (emptied.includes(pillars.month)) affectedPillars.push("월주");
  if (emptied.includes(pillars.day)) affectedPillars.push("일주");
  if (emptied.includes(pillars.hour)) affectedPillars.push("시주");

  return { emptied, affectedPillars };
}

// 귀문관살/원진살 맵
const GWIMUN_MAP: Record<string, string> = { "辰": "亥", "亥": "辰", "子": "酉", "酉": "子", "未": "寅", "寅": "未", "巳": "戌", "戌": "巳", "午": "丑", "丑": "午", "卯": "申", "申": "卯" };
const WONJIN_MAP: Record<string, string> = { "子": "未", "未": "子", "丑": "午", "午": "丑", "寅": "酉", "酉": "寅", "卯": "申", "申": "卯", "辰": "亥", "亥": "辰", "巳": "戌", "戌": "巳" };

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

  // 4. 신규 추가 10종 신살 (일간/월지/일주 기준 상세 탐색)
  const monthJi = pillars.month;
  const monthStem = allStems[1];
  const dayPillarStr = dm + pillars.day;

  pList.forEach(p => {
    const ji = bMap[p];
    const stem = allStems[pList.indexOf(p)];

    // 1) 천을귀인 (天乙貴人)
    if (CHEONIL_MAP[dm]?.includes(ji)) {
      result[p].push({ name: "천을귀인", type: "길성", description: "최고의 길신, 위기 극복과 귀인의 도움 (天乙貴人)", health_implication: null, topic_relevance: ["general", "career"], severity: "길", pillar: p });
    }
    // 2) 문창귀인 (文昌貴人)
    if (MUNCHANG_MAP[dm] === ji) {
      result[p].push({ name: "문창귀인", type: "길성", description: "지혜와 학문적 재능, 창의력 발달 (文昌貴人)", health_implication: null, topic_relevance: ["career"], severity: "길", pillar: p });
    }
    // 3) 학당귀인 (學堂貴人)
    if (HAKDANG_MAP[dm] === ji) {
      result[p].push({ name: "학당귀인", type: "길성", description: "학문 탐구와 교육적 소양 (學堂貴人)", health_implication: null, topic_relevance: ["career"], severity: "길", pillar: p });
    }
    // 4) 금여록 (金輿祿)
    if (GEUMYEO_MAP[dm] === ji) {
      result[p].push({ name: "금여록", type: "길성", description: "의식의 풍족함과 안정적인 지위 (金輿祿)", health_implication: null, topic_relevance: ["finance"], severity: "길", pillar: p });
    }
    // 6) 양인살 (羊刃殺)
    if (YANGIN_MAP[dm] === ji) {
      result[p].push({ name: "양인살", type: "흉성", description: "강렬한 추진력과 고집, 유혈의 기운 (羊刃殺)", health_implication: "수술 및 외상 주의", topic_relevance: ["career"], severity: "흉", pillar: p });
    }
  });

  // 4) 천덕귀인 (天德貴人) - 월지 기준 천간 탐색
  const cheondeokTarget = CHEONDEOK_MAP[monthJi];
  pList.forEach((p, idx) => {
    if (allStems[idx] === cheondeokTarget) {
      result[p].push({ name: "천덕귀인", type: "길성", description: "조상의 덕과 하늘의 보호 (天德貴人)", health_implication: null, topic_relevance: ["general"], severity: "길", pillar: p });
    }
  });

  // 5) 월덕귀인 (月德貴人) - 월지 기준 천간 탐색
  const woldeokTarget = WOLDEOK_MAP[monthJi];
  pList.forEach((p, idx) => {
    if (allStems[idx] === woldeokTarget) {
      result[p].push({ name: "월덕귀인", type: "길성", description: "재난을 피하고 덕을 쌓음 (月德貴人)", health_implication: null, topic_relevance: ["general"], severity: "길", pillar: p });
    }
  });

  // 7) 백호살 (白虎殺) - 일지 기준이 아니라 "간지" 기준 (보통 기둥 자체)
  pList.forEach(p => {
    const fullPillar = allStems[pList.indexOf(p)] + bMap[p];
    if (BAEKHO_LIST.includes(fullPillar)) {
      result[p].push({ name: "백호살", type: "흉성", description: "갑작스러운 사고나 강한 변화의 기운 (白虎殺)", health_implication: "사고 주의", topic_relevance: ["general"], severity: "흉", pillar: p });
    }
  });

  // 8) 괴강살 (魁罡殺) - 일주 기준
  if (GOEGANG_LIST.includes(dayPillarStr)) {
    result.day.push({ name: "괴강살", type: "흉성", description: "총명함 뒤의 고립, 강력한 추진력과 기세 (魁罡殺)", health_implication: null, topic_relevance: ["career"], severity: "흉", pillar: "day" });
  }

  // 9) 천라지망 (天羅地網)
  const branchSet = new Set([pillars.year, pillars.month, pillars.day, pillars.hour]);
  if (branchSet.has("戌") && branchSet.has("亥")) {
    result.general.push({ name: "천라", type: "흉성", description: "정신적 구속과 정체 (天羅)", health_implication: "피로 주의", topic_relevance: ["spirituality"], severity: "흉", pillar: "general" });
  }
  if (branchSet.has("辰") && branchSet.has("巳")) {
    result.general.push({ name: "지망", type: "흉성", description: "물리적 제약과 활동 방해 (地網)", health_implication: null, topic_relevance: ["general"], severity: "흉", pillar: "general" });
  }

  return result;
}

// 명칭 호환용 (기존 calculateShinsal)
export function calculateShinsal(dayMaster: string, dayBranch: string, allBranches: string[], allStems: string[], yearBranch?: string, monthBranch?: string, currentYearBranch?: string): Shinsal[] {
  const g = calculateShinsalGrouped(dayMaster, dayBranch, { year: yearBranch || allBranches[0], month: monthBranch || allBranches[1], day: dayBranch, hour: allBranches[3] || "" }, allStems, currentYearBranch);
  return [...g.year, ...g.month, ...g.day, ...g.hour, ...g.general];
}

// ══════════════════════════════════════════════════════
// B-266: 변환 결과(Transformation) 분석
// ══════════════════════════════════════════════════════

export interface TransformationResult {
  type: '삼합' | '방합' | '육합' | '충' | '형' | '파' | '해';
  branches: string[];
  resultElement?: string;       // 변환된 오행
  strength: number;             // 0~100
  isComplete: boolean;          // 완전합 여부
  isBroken: boolean;            // 충으로 깨졌는지
  affectedOrgans?: string[];    // 건강 영향 장부
  description: string;          // 한국어 설명
}

export function analyzeTransformations(branches: string[]): TransformationResult[] {
  const results: TransformationResult[] = [];
  const branchSet = new Set(branches.filter(b => b && b !== "미상"));

  // 1. 삼합 (Samhap)
  BRANCH_THREE_COMBINATIONS.forEach(([combo, res, key]) => {
    const hits = combo.filter(b => branchSet.has(b));
    if (hits.length >= 2) {
      const isComplete = hits.length === 3;
      const elem = res.includes("화") ? "화" : (res.includes("목") ? "목" : (res.includes("수") ? "수" : "금"));
      results.push({
        type: '삼합',
        branches: hits,
        resultElement: elem,
        strength: isComplete ? 100 : 50,
        isComplete,
        isBroken: false,
        description: `${key}${isComplete ? " (완전삼합)" : " (반합)"}으로 인해 ${elem} 기운이 생성됩니다.`
      });
    }
  });

  // 2. 방합 (Banghap)
  BRANCH_DIRECTION_COMBINATIONS.forEach(([combo, res, key]) => {
    if (combo.every(b => branchSet.has(b))) {
      const elem = res.includes("목") ? "목" : (res.includes("화") ? "화" : (res.includes("금") ? "금" : "수"));
      results.push({
        type: '방합',
        branches: combo,
        resultElement: elem,
        strength: 100,
        isComplete: true,
        isBroken: false,
        description: `${key} 완성으로 해당 방위의 ${elem} 에너지가 강력해집니다.`
      });
    }
  });

  // 3. 육합 (Yuk-hap)
  BRANCH_SIX_COMBINATIONS.forEach(([b1, b2, res, key]) => {
    if (branchSet.has(b1) && branchSet.has(b2)) {
      const elem = res.includes("토") ? "토" : (res.includes("목") ? "목" : (res.includes("화") ? "화" : (res.includes("금") ? "금" : "수")));
      results.push({
        type: '육합',
        branches: [b1, b2],
        resultElement: elem,
        strength: 80,
        isComplete: true,
        isBroken: false,
        description: `육합 연산: ${key} 성립. ${elem} 기운으로 변화합니다.`
      });
    }
  });

  // 4. 충 (Chung)
  BRANCH_CONFLICTS.forEach(([b1, b2, key]) => {
    if (branchSet.has(b1) && branchSet.has(b2)) {
      results.push({
        type: '충',
        branches: [b1, b2],
        strength: 100,
        isComplete: true,
        isBroken: false,
        description: `${b1}와 ${b2}가 상충(${key})하여 지장간의 에너지가 요동치고 불안정해집니다.`
      });
      // Broken logic for Yuk-hap
      results.filter(r => r.type === '육합').forEach(r => {
        if (r.branches.includes(b1) || r.branches.includes(b2)) r.isBroken = true;
      });
    }
  });

  // 5. 형 (Hyung)
  const ORGAN_MAP: Record<string, string[]> = {
    "寅巳申": ["심장", "혈관", "신경계"],
    "丑戌未": ["위장", "비장", "소화기"],
    "子卯": ["생식기", "자궁", "신장"],
    "辰辰": ["정신건강", "피부"],
    "午午": ["심장", "시력"],
    "酉酉": ["폐", "호흡기"],
    "亥亥": ["신장", "방광"]
  };

  PENALTIES.forEach(([group, label]) => {
    let isMatch = false;
    if (group.length === 2 && group[0] === group[1]) {
      // 자형 체크: 해당 지지가 2개 이상일 때
      isMatch = branches.filter(b => b === group[0]).length >= 2;
    } else {
      // 일반 형살: 구성 요소가 모두 존재할 때
      isMatch = group.every(b => branchSet.has(b));
    }

    if (isMatch) {
      const gKey = group.join("");
      results.push({
        type: '형',
        branches: group,
        strength: 90,
        isComplete: true,
        isBroken: false,
        affectedOrgans: ORGAN_MAP[gKey] || [],
        description: `${label}: ${ORGAN_MAP[gKey]?.join(", ") || "관련 장부"}의 불균형을 야기할 수 있습니다.`
      });
    }
  });

  return results;
}

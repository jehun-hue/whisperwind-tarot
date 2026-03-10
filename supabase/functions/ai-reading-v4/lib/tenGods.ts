/**
 * tenGods.ts
 */

import { STEMS, BRANCHES, FIVE_ELEMENTS_MAP } from "./fiveElements.ts";

const RELATION_NAMES = {
  SAME_SAME: "비견",
  SAME_DIFF: "겁재",
  SAENG_ME_SAME: "편인",
  SAENG_ME_DIFF: "정인",
  ME_SAENG_SAME: "식신",
  ME_SAENG_DIFF: "상관",
  ME_GEUK_SAME: "편재",
  ME_GEUK_DIFF: "정재",
  GEUK_ME_SAME: "편관",
  GEUK_ME_DIFF: "정관"
};

const ELEMENTS_CYCLE = ["wood", "fire", "earth", "metal", "water"];

function getRelation(meLong: string, itLong: string, meIsYang: boolean, itIsYang: boolean): string {
  const meIdx = ELEMENTS_CYCLE.indexOf(meLong);
  const itIdx = ELEMENTS_CYCLE.indexOf(itLong);
  const diff = (itIdx - meIdx + 5) % 5;
  const sameYinYang = meIsYang === itIsYang;

  if (diff === 0) return sameYinYang ? RELATION_NAMES.SAME_SAME : RELATION_NAMES.SAME_DIFF;
  if (diff === 1) return sameYinYang ? RELATION_NAMES.ME_SAENG_SAME : RELATION_NAMES.ME_SAENG_DIFF;
  if (diff === 2) return sameYinYang ? RELATION_NAMES.ME_GEUK_SAME : RELATION_NAMES.ME_GEUK_DIFF;
  if (diff === 3) return sameYinYang ? RELATION_NAMES.GEUK_ME_SAME : RELATION_NAMES.GEUK_ME_DIFF;
  if (diff === 4) return sameYinYang ? RELATION_NAMES.SAENG_ME_SAME : RELATION_NAMES.SAENG_ME_DIFF;
  
  return "unknown";
}

export function calculateTenGod(dayMaster: string, targetStem: string): string {
  const meLong = FIVE_ELEMENTS_MAP[dayMaster];
  const itLong = FIVE_ELEMENTS_MAP[targetStem];
  
  const meIsYang = STEMS.indexOf(dayMaster) % 2 === 0;
  const itIsYang = STEMS.indexOf(targetStem) % 2 === 0;
  
  return getRelation(meLong, itLong, meIsYang, itIsYang);
}

// Branch version: maps branch to its main (Energy-wise but usually Saju uses the "Hidden Stem" that is dominant)
// Actually many systems just map a branch to its "representative" stem for Ten Gods.
// 子->癸, 丑->己, 寅->甲, 卯->乙, 辰->戊, 巳->丙, 午->丁, 未->己, 申->庚, 酉->辛, 戌->戊, 亥->壬
export function calculateTenGodBranch(dayMaster: string, branch: string): string {
  const branchMainStem: Record<string, string> = {
    "子": "癸", "丑": "己", "寅": "甲", "卯": "乙", "辰": "戊", "巳": "丙", 
    "午": "丁", "未": "己", "申": "庚", "酉": "辛", "戌": "戊", "亥": "壬"
  };
  return calculateTenGod(dayMaster, branchMainStem[branch]);
}

/**
 * Hidden Stems (Jijang-gan)
 */
export const HIDDEN_STEMS: Record<string, string[]> = {
  "子": ["壬", "癸"],
  "丑": ["癸", "辛", "己"],
  "寅": ["戊", "丙", "甲"],
  "卯": ["甲", "乙"],
  "辰": ["乙", "癸", "戊"],
  "巳": ["戊", "庚", "丙"],
  "午": ["丙", "己", "丁"],
  "未": ["丁", "乙", "己"],
  "申": ["戊", "壬", "庚"],
  "酉": ["庚", "辛"],
  "戌": ["辛", "丁", "戊"],
  "亥": ["戊", "甲", "壬"]
};

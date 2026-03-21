/**
 * tenGods.ts
 * Logic for calculating Ten Gods (십신/육친) relations.
 */

const LOCAL_STEM_ELEMENTS: Record<string, string> = {
  "甲": "wood", "乙": "wood",
  "丙": "fire", "丁": "fire",
  "戊": "earth", "己": "earth",
  "庚": "metal", "辛": "metal",
  "壬": "water", "癸": "water"
};

const LOCAL_STEM_POLARITY: Record<string, "+" | "-"> = {
  "甲": "+", "丙": "+", "戊": "+", "庚": "+", "壬": "+",
  "乙": "-", "丁": "-", "己": "-", "辛": "-", "癸": "-"
};

/**
 * calculateTenGod
 * Finds the relation of 'targetStem' relative to 'dayMaster'.
 */
export function calculateTenGod(dayMaster: string, targetStem: string): string {
  if (!dayMaster || !targetStem) return "";

  const dmEl = LOCAL_STEM_ELEMENTS[dayMaster];
  const targetEl = LOCAL_STEM_ELEMENTS[targetStem];
  const dmPol = LOCAL_STEM_POLARITY[dayMaster];
  const targetPol = LOCAL_STEM_POLARITY[targetStem];

  if (!dmEl || !targetEl) return "";

  const samePol = dmPol === targetPol;

  const ELEMENTS_ORDER = ["wood", "fire", "earth", "metal", "water"];
  const meIdx = ELEMENTS_ORDER.indexOf(dmEl);
  const itIdx = ELEMENTS_ORDER.indexOf(targetEl);
  const diff = (itIdx - meIdx + 5) % 5;

  // Debug log to trace 丁-丁 issue
  if (dayMaster === "丁" && targetStem === "丁") {
    console.log("[DEBUG TEN_GOD] 丁-丁 calculation. dmEl:", dmEl, "targetEl:", targetEl, "diff:", diff);
  }

  if (diff === 0) return samePol ? "비견" : "겁재";
  if (diff === 1) return samePol ? "식신" : "상관";
  if (diff === 2) return samePol ? "편재" : "정재";
  if (diff === 3) return samePol ? "편관" : "정관";
  if (diff === 4) return samePol ? "편인" : "정인";

  return "";
}

/**
 * calculateTenGodBranch - using representative stem for the branch
 */
export function calculateTenGodBranch(dayMaster: string, branch: string): string {
  const branchMap: Record<string, string> = {
    "子": "癸", "丑": "己", "寅": "甲", "卯": "乙", "辰": "戊", "巳": "丙", 
    "午": "丁", "未": "己", "申": "庚", "酉": "辛", "戌": "戊", "亥": "壬"
  };
  return calculateTenGod(dayMaster, branchMap[branch] || "");
}

/**
 * HIDDEN_STEMS (지장간)
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

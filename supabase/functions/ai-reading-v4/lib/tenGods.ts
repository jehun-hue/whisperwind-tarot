import { FIVE_ELEMENTS_MAP, STEM_POLARITY, BRANCH_MAIN_STEM } from "./fiveElements.ts";

/**
 * calculateTenGod
 * Finds the relation of 'targetStem' relative to 'dayMaster'.
 */
export function calculateTenGod(dayMaster: string, targetStem: string): string {
  if (!dayMaster || !targetStem) return "";

  const dmEl = FIVE_ELEMENTS_MAP[dayMaster];
  const targetEl = FIVE_ELEMENTS_MAP[targetStem];
  const dmPol = STEM_POLARITY[dayMaster];
  const targetPol = STEM_POLARITY[targetStem];

  if (!dmEl || !targetEl) return "";

  const samePol = dmPol === targetPol;

  const ELEMENTS_ORDER = ["wood", "fire", "earth", "metal", "water"];
  const meIdx = ELEMENTS_ORDER.indexOf(dmEl);
  const itIdx = ELEMENTS_ORDER.indexOf(targetEl);
  const diff = (itIdx - meIdx + 5) % 5;


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
  return calculateTenGod(dayMaster, BRANCH_MAIN_STEM[branch] || "");
}


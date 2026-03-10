/**
 * aiSajuAnalysis.ts
 * AI Saju Analysis Engine (Pattern Extraction -> Structure Analysis -> Narrative).
 */

import { getFullSaju } from "./sajuEngine.ts";

export interface SajuAnalysisResult {
  dayMaster: string;
  strength: string;
  elements: Record<string, number>;
  characteristics: string[];
  narrative: string;
}

export async function analyzeSajuStructure(
  sajuRaw: any
): Promise<SajuAnalysisResult> {
  if (!sajuRaw || !sajuRaw.year || !sajuRaw.dayMaster) {
    return {
      dayMaster: "Unknown",
      strength: "Unknown",
      elements: {},
      characteristics: [],
      narrative: "사주 데이터가 부족합니다."
    };
  }

  const data = sajuRaw;
  
  // 1. PATTERN EXTRACTION (Logic based)
  const dmEl = data.dayMaster;
  // Strength calculation placeholder (simplified)
  const powerElements = ["목", "수"]; // Example for 乙목
  let powerScore = 0;
  if (data.elements) {
    Object.entries(data.elements).forEach(([el, count]) => {
      if (powerElements.includes(el)) powerScore += (count as number);
    });
  }
  const strength = powerScore >= 3.5 ? "중신강" : "중신약";

  // 2. STRUCTURE ANALYSIS
  const characteristics = [];
  if (data.elements?.[ "토"] >= 2) characteristics.push("재성 작용 강함");
  if (data.day?.branch === "亥" && data.hour?.branch === "巳") characteristics.push("사해충 존재");
  
  // Tag specific symbols for Pattern Engine
  if (data.dayMaster === "甲" || data.dayMaster === "乙") characteristics.push("목 일간의 생명력");

  // 3. AI NARRATIVE GENERATION
  const narrative = `일간이 ${dmEl}으로 나타나며 전체 오행 균형에서는 ${strength}의 특성을 보입니다. ${characteristics.length > 0 ? characteristics.join(', ') + '의 특징이 관찰되어 에너지가 한쪽으로 기울어지기보다 균형을 찾는 과정에 있습니다.' : '오행이 고루 분포되어 안정적인 흐름을 보입니다.'}`;

  return {
    dayMaster: dmEl,
    strength,
    elements: data.elements || {},
    characteristics,
    narrative
  };
}

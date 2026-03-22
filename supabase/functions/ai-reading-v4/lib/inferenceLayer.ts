/**
 * inferenceLayer.ts
 * 5개 엔진 결과 교차검증 및 통합 인사이트 도출
 */

import { SajuAnalysisResult } from "../aiSajuAnalysis.ts";
import { ServerZiWeiResult } from "../ziweiEngine.ts";
import { NumerologyResult } from "../numerologyEngine.ts";
import { CombinationInsight, DrawnCard } from "../hybridTarotEngine.ts";

export interface AstrologyResult {
  sunSign: string;
  moonSign: string;
  risingSign: string;
  dominantElement: string;
  transits: any[];
  planet_positions: any[];
  aspects: any[];
}

export interface TarotResult {
  cards: DrawnCard[];
  insights: CombinationInsight[];
}

export interface CrossValidationResult {
  personalityMatch: {
    score: number;
    details: { engine1: string; engine2: string; match: boolean; note: string }[];
  };
  timingMatch: {
    score: number;
    details: { engine1: string; engine2: string; match: boolean; note: string }[];
  };
  consistencyScore: number;
  consistencyLevel: string;
  commonKeywords: string[];
  divergentPoints: string[];
  summary: string;
}

/**
 * A31~A35: 5개 엔진 교차검증
 */
export async function crossValidate(
  saju: SajuAnalysisResult,
  astrology: AstrologyResult,
  ziwei: ServerZiWeiResult,
  numerology: NumerologyResult,
  tarot: TarotResult
): Promise<CrossValidationResult> {
  const detailsP: any[] = [];
  const detailsT: any[] = [];
  
  // 1. 성격 교차검증
  // 1-1) 사주 오행 ↔ 점성술 원소
  const sajuMainEl = saju.elements;
  const astroEl = astrology?.dominantElement || (astrology as any)?.dominant_element; // "불", "흙", "공기", "물"
  
  const elementMap: Record<string, string[]> = {
    "목": ["공기"], // Wood ↔ Air (User rule)
    "화": ["불"],
    "토": ["흙"],
    "금": ["공기", "흙"],
    "수": ["물"]
  };
  
  const maxSajuEl = Object.entries(sajuMainEl).sort((a,b) => b[1] - a[1])[0]?.[0];
  const isElMatch = maxSajuEl ? elementMap[maxSajuEl]?.includes(astroEl) : false;
  
  detailsP.push({
    engine1: "사주(오행)",
    engine2: "점성술(원소)",
    match: isElMatch,
    note: isElMatch ? "기질적 에너지가 서로 일치합니다." : "외적 기질과 내적 기질에 차이가 있습니다."
  });

  // 1-2) 수비학 LP ↔ 사주 일간
  // LP 1(리더) ↔ 甲/庚(강한 주관), LP 2(협력) ↔ 乙/己(유연함) 등 간략 매핑
  const lp = numerology.life_path_number;
  const dm = saju.dayMaster;
  let lpMatch = false;
  if ((lp === 1 || lp === 8) && ["甲", "庚", "丙", "戊"].includes(dm)) lpMatch = true;
  if ((lp === 2 || lp === 6) && ["乙", "己", "丁", "辛", "癸"].includes(dm)) lpMatch = true;
  if (lp === 7 && ["辛", "癸"].includes(dm)) lpMatch = true;

  detailsP.push({
    engine1: "수비학(LP)",
    engine2: "사주(일간)",
    match: lpMatch,
    note: lpMatch ? "인생 목표와 본성이 조화를 이룹니다." : "목표 지향점과 타고난 성향이 보완적 관계입니다."
  });

  // 1-3) 자미두수 명궁 ↔ 사주 일주
  const mingStars = ziwei?.core_palaces?.life_palace?.major_stars || [];
  const isZiweiStrong = mingStars.some(s => ["자미", "칠살", "파군", "무곡", "태양"].includes(s));
  const isSajuStrong = saju.strength.includes("강");
  const ziweiSajuMatch = isZiweiStrong === isSajuStrong;

  detailsP.push({
    engine1: "자미두수(명궁)",
    engine2: "사주(신강약)",
    match: ziweiSajuMatch,
    note: ziweiSajuMatch ? "삶을 주도하는 힘의 크기가 일관적입니다." : "상황에 따라 주도력의 기복이 있을 수 있습니다."
  });

  // 2. 타이밍 교차검증
  // 2-1) 사주 대운 ↔ 자미두수 대한
  const sajuDaewoonGood = saju.daewoon?.is_good || false; // 임의 필드 (실제는 분석 필요)
  const ziweiMajorGood = ziwei?.currentMajorPeriod?.interpretation.includes("길") || false;
  const timingMatch1 = sajuDaewoonGood === ziweiMajorGood;

  detailsT.push({
    engine1: "사주(대운)",
    engine2: "자미두수(대한)",
    match: timingMatch1,
    note: timingMatch1 ? "장기적인 운의 흐름이 한 방향을 가리킵니다." : "운의 흐름에 복합적인 변화가 예상됩니다."
  });

  // 2-2) 점성술 트랜짓 ↔ 사주 세운
  const transits = astrology?.transits || [];
  const astroTransitGood = transits.length > 0 && !JSON.stringify(transits).includes("Square");
  const timingMatch2 = astroTransitGood; // 단순화

  detailsT.push({
    engine1: "점성술(트랜짓)",
    engine2: "사주(세운)",
    match: timingMatch2,
    note: timingMatch2 ? "현재의 외부 환경이 긍정적으로 작용합니다." : "주변 환경의 변화에 신중한 대응이 필요합니다."
  });

  // 3. 점수 계산
  const pScore = (detailsP.filter(d => d.match).length / detailsP.length) * 100;
  const tScore = (detailsT.filter(d => d.match).length / detailsT.length) * 100;
  
  const tarotMajorRatio = tarot.cards.filter(c => c.isMajor).length / tarot.cards.length;
  const tarotBonus = tarotMajorRatio >= 0.4 ? 100 : 50;

  const totalScore = Math.round(pScore * 0.4 + tScore * 0.4 + tarotBonus * 0.2);
  
  let level = "보통";
  if (totalScore >= 80) level = "매우 높은 일관성";
  else if (totalScore >= 60) level = "높음";
  else if (totalScore < 40) level = "분석 필요";

  // 4. 통합 인사이트
  const commonKeywords = ["변화", "성장"];
  if (totalScore >= 70) commonKeywords.push("확신", "추진");
  if (isElMatch) commonKeywords.push("안정적 기질");

  const divergentPoints = [];
  if (!isElMatch) divergentPoints.push("내적 욕구와 외적 표현의 불일치");
  if (!timingMatch1) divergentPoints.push("장기 운세의 관점 차이 (신중함 요망)");

  const summary = `전체적인 분석 결과, 당신의 운명 에너지는 ${level} 수준의 일관성을 보이고 있습니다. ` +
    (totalScore >= 60 ? "모든 엔진이 공통적으로 긍정적인 신호를 보내고 있어 결단력이 필요한 시점입니다. " : "각 도구별로 강조하는 포인트가 달라 다각도의 검토가 필요해 보입니다. ") +
    `특히 ${maxSajuEl}의 기운과 ${astroEl}의 원소가 ${isElMatch ? "조화를 이루어" : "서로 대비되어"} 독특한 개성을 형성합니다. ` +
    `현재의 흐름을 믿고 나아가시되, ${divergentPoints[0] || "균형"}을 유지하는 것이 핵심입니다.`;

  return {
    personalityMatch: { score: Math.round(pScore), details: detailsP },
    timingMatch: { score: Math.round(tScore), details: detailsT },
    consistencyScore: totalScore,
    consistencyLevel: level,
    commonKeywords,
    divergentPoints,
    summary
  };
}

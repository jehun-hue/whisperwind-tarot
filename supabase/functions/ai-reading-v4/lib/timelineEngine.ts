/**
 * timelineEngine.ts
 * 5개 엔진 시계열 데이터를 통합하여 월별 운세 강도 점수 산출
 */

export interface MonthForecast {
  month: number;
  score: number;
  grade: string;
  sajuInfluence: string;
  astrologyInfluence: string;
  ziweiInfluence: string;
  numerologyInfluence: string;
  summary: string;
}

export interface UnifiedTimeline {
  year: number;
  overallScore: number;
  overallGrade: string;
  months: MonthForecast[];
  bestMonths: number[];
  worstMonths: number[];
  keyTransitions: string[];
}

/**
 * C7~C8: 통합 타임라인 + 운세 강도 점수
 */
export function buildUnifiedTimeline(
  currentAge: number,
  targetYear: number,
  saju: { daewoon: any; sewoon: any; wolwoon: any[] }, // wolwoon is array of 12 months
  astrology: { transits: any[]; transitAspects: any[]; progressions: any[] },
  ziwei: { dahan: any; sohan: any },
  numerology: { personalYear: number; personalMonth: number; pinnacle: any }
): UnifiedTimeline {
  const months: MonthForecast[] = [];
  
  // 가중치: 사주 30% + 점성술 25% + 자미두수 25% + 수비학 20%
  const WEIGHTS = { saju: 0.3, astro: 0.25, ziwei: 0.25, num: 0.2 };

  for (let m = 1; m <= 12; m++) {
    // 1. 사주 점수 (임의 로직: 세운/월운 기반)
    const sajuM = saju.wolwoon?.[m-1] || {};
    let sScore = 50; // Base
    if (sajuM.is_good) sScore += 20;
    if (sajuM.is_clash) sScore -= 15;
    const sajuFinal = Math.min(100, Math.max(0, sScore));

    // 2. 점성술 점수 (트랜짓 어스펙트 기반)
    const mTransits = astrology.transitAspects?.filter(a => a.month === m) || [];
    let aScore = 60;
    mTransits.forEach(t => {
      if (["trine", "sextile"].includes(t.type)) aScore += 10;
      if (["square", "opposition"].includes(t.type)) aScore -= 12;
    });
    const astroFinal = Math.min(100, Math.max(0, aScore));

    // 3. 자미두수 점수 (소한 궁 기반)
    // 소한은 1년 단위이나 월별로 유월(流月) 개념 적용 가능 (여기서는 간략화)
    let zScore = 55;
    if (ziwei.sohan?.palace === "명궁" || ziwei.sohan?.stars?.some((s:any) => s.brightness === "묘")) zScore += 15;
    const ziweiFinal = Math.min(100, Math.max(0, zScore));

    // 4. 수비학 점수 (Personal Month 기반)
    const pMonth = (numerology.personalYear + m) % 9 || 9;
    let nScore = 50;
    if ([1, 8, 3].includes(pMonth)) nScore += 20; // 시작, 성취, 즐거움
    if ([9, 4, 7].includes(pMonth)) nScore -= 10; // 마무리, 인내, 성찰
    const numFinal = Math.min(100, Math.max(0, nScore));

    // 통합 점수 (-100 ~ 100 정규화: 위 점수들은 0~100이므로 50기준으로 변환)
    const weighted = (sajuFinal * WEIGHTS.saju) + 
                     (astroFinal * WEIGHTS.astro) + 
                     (ziweiFinal * WEIGHTS.ziwei) + 
                     (numFinal * WEIGHTS.num);
    
    // 0~100 → -100~100 변환 (score - 50) * 2
    const scoreVal = Math.round((weighted - 50) * 2);
    const grade = getGrade(scoreVal);

    months.push({
      month: m,
      score: scoreVal,
      grade,
      sajuInfluence: sajuM.summary || "에너지 흐름이 완만합니다.",
      astrologyInfluence: mTransits.length > 0 ? "행성들의 배치가 활발합니다." : "현상 유지의 시기입니다.",
      ziweiInfluence: `소한 ${ziwei.sohan?.palace}의 영향권에 있습니다.`,
      numerologyInfluence: `개인 월수 ${pMonth}의 에너지가 작용합니다.`,
      summary: `${grade} 등급의 순탄한 흐름이 예상됩니다.`
    });
  }

  const overallScore = Math.round(months.reduce((acc, curr) => acc + curr.score, 0) / 12);
  const bestMonths = [...months].sort((a,b) => b.score - a.score).slice(0, 3).map(m => m.month);
  const worstMonths = [...months].sort((a,b) => a.score - b.score).slice(0, 3).map(m => m.month);

  return {
    year: targetYear,
    overallScore,
    overallGrade: getGrade(overallScore),
    months,
    bestMonths,
    worstMonths,
    keyTransitions: [
      `${bestMonths[0]}월은 기회가 선명해지는 시점입니다.`,
      `${worstMonths[0]}월은 내실을 다지며 신중해야 합니다.`
    ]
  };
}

function getGrade(score: number): string {
  if (score >= 80) return "상상(AAA)";
  if (score >= 50) return "상(AA)";
  if (score >= 20) return "중상(A)";
  if (score >= -10) return "중(B)";
  if (score >= -40) return "중하(C)";
  if (score >= -70) return "하(D)";
  return "하하(F)";
}

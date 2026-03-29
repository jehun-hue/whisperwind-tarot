/**
 * timelineEngine.ts (v10)
 * - fortuneEngine.FortuneResult 통합
 * - 사주 점수: fortuneEngine 정밀 점수 우선, 없으면 레거시 fallback
 * - 정규화: fortuneEngine -100~100 → 내부 0~100 선형 변환
 */

import type { FortuneResult, WolwoonFortune } from "./fortuneEngine.ts";

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

function getGrade(score: number): string {
  if (score >= 80) return "상상(AAA)";
  if (score >= 50) return "상(AA)";
  if (score >= 20) return "중상(A)";
  if (score >= -10) return "중(B)";
  if (score >= -40) return "중하(C)";
  if (score >= -70) return "하(D)";
  return "하하(F)";
}

function normalizeFortuneScore(fortuneScore: number): number {
  return Math.round(Math.max(0, Math.min(100, (fortuneScore + 100) / 2)));
}

export function buildUnifiedTimeline(
  currentAge: number,
  targetYear: number,
  saju: { daewoon: any; sewoon: any; wolwoon: any[]; fortune?: FortuneResult | null },
  astrology: { transits: any[]; transitAspects: any[]; progressions: any[] },
  ziwei: { dahan: any; sohan: any },
  numerology: { personalYear: number; personalMonth: number; pinnacle: any }
): UnifiedTimeline {
  const months: MonthForecast[] = [];
  const WEIGHTS = { saju: 0.3, astro: 0.25, ziwei: 0.25, num: 0.2 };
  const fortune: FortuneResult | null | undefined = saju?.fortune ?? null;

  for (let m = 1; m <= 12; m++) {
    // 1. 사주 점수 (30%) — fortune 우선
    let sajuFinal: number;
    let sajuInfluence = "";

    if (fortune?.monthly && fortune.monthly[m - 1]) {
      const mf = fortune.monthly[m - 1];
      sajuFinal = normalizeFortuneScore(mf.score);
      sajuInfluence = `${mf.stem || ""}${mf.branch || ""}월 (${mf.rating}, ${mf.score > 0 ? "+" : ""}${mf.score}점)`;
      if ((mf as any).clashes?.length) sajuInfluence += ` [충: ${(mf as any).clashes.join(",")}]`;
      if ((mf as any).harmonies?.length) sajuInfluence += ` [합: ${(mf as any).harmonies.join(",")}]`;
      console.log(`[Timeline] M${m}: fortune=${mf.score} → norm=${sajuFinal} (${mf.rating})`);
    } else {
      const sajuM = saju.wolwoon?.[m - 1] || {};
      let sScore = 50;
      if (sajuM.is_good) sScore += 20;
      if (sajuM.is_clash) sScore -= 15;
      sajuFinal = Math.min(100, Math.max(0, sScore));
      sajuInfluence = sajuM.summary || "에너지 흐름이 완만합니다.";
      console.log(`[Timeline] M${m}: LEGACY sajuScore=${sajuFinal}`);
    }

    // 2. 점성술 점수 (25%)
    const mTransits = astrology.transitAspects?.filter((a: any) => a.month === m) || [];
    let aScore = 60;
    mTransits.forEach((t: any) => {
      if (["trine", "sextile"].includes(t.type)) aScore += 10;
      if (["square", "opposition"].includes(t.type)) aScore -= 12;
    });
    const astroFinal = Math.min(100, Math.max(0, aScore));

    // 3. 자미두수 점수 (25%)
    let zScore = 55;
    if (ziwei.sohan?.palace === "명궁" || ziwei.sohan?.stars?.some((s: any) => s.brightness === "묘")) zScore += 15;
    const ziweiFinal = Math.min(100, Math.max(0, zScore));

    // 4. 수비학 점수 (20%)
    const pMonth = (numerology.personalYear + m) % 9 || 9;
    let nScore = 50;
    if ([1, 8, 3].includes(pMonth)) nScore += 20;
    if ([9, 4, 7].includes(pMonth)) nScore -= 10;
    const numFinal = Math.min(100, Math.max(0, nScore));

    // 가중합 → -100~100
    const weighted = sajuFinal * WEIGHTS.saju + astroFinal * WEIGHTS.astro + ziweiFinal * WEIGHTS.ziwei + numFinal * WEIGHTS.num;
    const scoreVal = Math.round((weighted - 50) * 2);
    const grade = getGrade(scoreVal);

    months.push({
      month: m,
      score: scoreVal,
      grade,
      sajuInfluence,
      astrologyInfluence: mTransits.length > 0 ? "행성들의 배치가 활발합니다." : "현상 유지의 시기입니다.",
      ziweiInfluence: `소한 ${ziwei.sohan?.palace || "미상"}의 영향권에 있습니다.`,
      numerologyInfluence: `개인 월수 ${pMonth}의 에너지가 작용합니다.`,
      summary: `${grade} 등급의 흐름이 예상됩니다.`,
    });
  }

  const overallScore = Math.round(months.reduce((acc, curr) => acc + curr.score, 0) / 12);
  const sorted = [...months].sort((a, b) => b.score - a.score);
  const bestMonths = sorted.slice(0, 3).map((m) => m.month);
  const worstMonths = [...months].sort((a, b) => a.score - b.score).slice(0, 3).map((m) => m.month);

  const keyTransitions: string[] = [
    `${bestMonths[0]}월은 기회가 선명해지는 시점입니다.`,
    `${worstMonths[0]}월은 내실을 다지며 신중해야 합니다.`,
  ];
  if (fortune?.yearOverview) keyTransitions.push(`세운 요약: ${fortune.yearOverview}`);
  if (fortune?.bestMonths?.length) keyTransitions.push(`용신운 호월: ${fortune.bestMonths.join(", ")}월`);
  if (fortune?.cautionMonths?.length) keyTransitions.push(`기신운 주의월: ${fortune.cautionMonths.join(", ")}월`);

  return {
    year: targetYear,
    overallScore,
    overallGrade: getGrade(overallScore),
    months,
    bestMonths,
    worstMonths,
    keyTransitions,
  };
}

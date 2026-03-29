/**
 * temporalPredictionEngine.ts (v10)
 * - 변별력 강화: base score 하향 + 가산폭 확대
 * - 윈도우 간 분화: 단기=즉시성 신호, 중기=행성+대운, 장기=구조적 합
 * - fortuneEngine 세운 점수 반영
 */

export interface EventWindow {
  window: string;
  probability: number;
  label: string;
  description: string;
  contributing_factors: string[];
}

// ═══════════════════════════════════════
// 사주 시간축 신호 추출 (v10: base 0.30, 폭 확대)
// ═══════════════════════════════════════
function extractSajuTimingSignal(sajuResult: any, category?: string): { score: number; factors: string[]; immediacy: number; structural: number } {
  let score = 0.30;
  let immediacy = 0;   // 단기 신호 강도
  let structural = 0;  // 장기 구조 신호 강도
  const factors: string[] = [];

  if (!sajuResult) return { score, factors, immediacy, structural };

  const chars = Array.isArray(sajuResult.characteristics) ? sajuResult.characteristics : [];
  const tenGods: Record<string, number> = sajuResult.tenGods || {};
  const daewoon = sajuResult.daewoon?.currentDaewoon;
  const fortune = sajuResult.fortune;

  // 1. 충(沖) — 강력한 즉시성 변화 신호
  const hasChung = chars.some((c: string) => c.includes("충"));
  if (hasChung) {
    score += 0.25;
    immediacy += 0.30;
    factors.push("사주 원국/대운 충(沖) — 강력한 변동성과 전환점 감지");
  }

  // 2. 합(合) — 구조적 안정/결실
  const hasHarmony = chars.some((c: string) => c.includes("합") || c.includes("방합"));
  if (hasHarmony) {
    score += 0.12;
    structural += 0.25;
    factors.push("사주 합(合) — 에너지 응집으로 인한 안정적 성취 기반");
  }

  // 3. 형살 — 마찰/갈등 신호
  const hasHyung = chars.some((c: string) => c.includes("형살"));
  if (hasHyung) {
    score += 0.08;
    immediacy += 0.10;
    factors.push("형살(刑殺) — 대인관계 마찰 또는 건강 이슈 주의");
  }

  // 4. fortuneEngine 세운 점수 반영
  if (fortune?.seun) {
    const seunScore = fortune.seun.score;
    if (seunScore >= 30) {
      score += 0.20;
      factors.push(`세운 ${fortune.seun.rating}(${seunScore > 0 ? '+' : ''}${seunScore}) — 용신운 활성`);
    } else if (seunScore >= 15) {
      score += 0.10;
      factors.push(`세운 ${fortune.seun.rating}(+${seunScore}) — 희신운 보조`);
    } else if (seunScore <= -30) {
      score -= 0.05;
      factors.push(`세운 ${fortune.seun.rating}(${seunScore}) — 기신운 주의`);
    }
  }

  // 5. 질문 유형별 십성/대운 매칭
  if (category) {
    const isWealth = ["재물", "사업", "money", "career", "wealth"].some(k => category.includes(k));
    const isLove = ["연애", "결혼", "relationship", "love"].some(k => category.includes(k));

    if (isWealth) {
      if (tenGods["재성"] && tenGods["재성"] >= 1.5) {
        score += 0.15;
        factors.push("사주 내 재성(財星) 발달 — 재물 운용 역량 우수");
      }
      if (daewoon && (daewoon.tenGodStem === "재성" || daewoon.tenGodBranch === "재성" || daewoon.tenGodStem === "식상" || daewoon.tenGodBranch === "식상")) {
        score += 0.18;
        immediacy += 0.15;
        factors.push(`현재 대운(${daewoon.full})이 재성/식상 흐름 — 재물운 활성기`);
      }
    }

    if (isLove) {
      const loveGod = sajuResult.gender === 'M' ? "재성" : "관성";
      if (tenGods[loveGod] && tenGods[loveGod] >= 1.5) {
        score += 0.15;
        factors.push(`사주 내 ${loveGod} 발달 — 이성운 기틀 견고`);
      }
      if (daewoon && (daewoon.tenGodStem === loveGod || daewoon.tenGodBranch === loveGod)) {
        score += 0.18;
        immediacy += 0.15;
        factors.push(`현재 대운이 ${loveGod} 흐름 — 인연운 및 관계 진전 시기`);
      }
    }
  }

  // 6. 용신/희신 합치
  if (chars.includes("대운-용신 합치")) {
    score += 0.20;
    structural += 0.20;
    factors.push("현재 대운이 용신(用神)과 합치 — 인생의 황금기/발복 시기");
  }

  return { score: Math.max(0.05, Math.min(0.98, score)), factors, immediacy, structural };
}

// ═══════════════════════════════════════
// 점성술 Transit 신호 추출 (v10: base 0.25)
// ═══════════════════════════════════════
function extractAstrologyTimingSignal(astroResult: any, category?: string): { score: number; factors: string[]; transitIntensity: number } {
  let score = 0.25;
  let transitIntensity = 0;
  const factors: string[] = [];

  if (!astroResult) return { score, factors, transitIntensity };

  const chars = Array.isArray(astroResult.characteristics) ? astroResult.characteristics : [];
  const transits = Array.isArray(astroResult.transits) ? astroResult.transits : [];

  // Jupiter
  if (chars.some((c: string) => /jupiter/i.test(c))) {
    score += 0.18;
    transitIntensity += 0.20;
    factors.push("Jupiter Transit — 확장, 기회, 행운의 에너지 활성");
  }

  // Saturn
  if (chars.some((c: string) => /saturn/i.test(c))) {
    score += 0.12;
    transitIntensity += 0.15;
    factors.push("Saturn 정렬 — 내실을 다지고 구조를 재정비하는 시기");
  }

  // 외행성
  const outerImpact = chars.filter((c: string) => /pluto|neptune|uranus/i.test(c)).length;
  if (outerImpact > 0) {
    score += outerImpact * 0.12;
    transitIntensity += outerImpact * 0.15;
    factors.push(`외행성(${outerImpact}개) 강력한 관여 — 운명의 근본적 변형`);
  }

  // 질문 유형 매칭
  if (category) {
    const isWealth = ["재물", "사업", "money", "wealth"].some(k => category.includes(k));
    if (isWealth && chars.some((c: string) => /venus|jupiter/i.test(c) && /trine|sextile|conjunction/i.test(c))) {
      score += 0.18;
      factors.push("Venus/Jupiter 조화 — 재물운 상승 신호");
    }
    const isLove = ["연애", "relationship", "love"].some(k => category.includes(k));
    if (isLove && chars.some((c: string) => /venus|mars/i.test(c) && /trine|conjunction/i.test(c))) {
      score += 0.18;
      factors.push("Venus/Mars 활성화 — 인연운 강화");
    }
  }

  return { score: Math.max(0.05, Math.min(0.98, score)), factors, transitIntensity };
}

// ═══════════════════════════════════════
// 수비학 시간축 신호 (v10: base 0.25)
// ═══════════════════════════════════════
function extractNumerologyTimingSignal(numResult: any): { score: number; factors: string[] } {
  let score = 0.25;
  const factors: string[] = [];

  if (!numResult) return { score, factors };

  const py = numResult.personal_year || numResult.personalYear;
  if (py) {
    const yearEnergy: Record<number, { boost: number; desc: string }> = {
      1: { boost: 0.20, desc: "Personal Year 1 — 새로운 시작의 해, 이벤트 발생률 높음" },
      2: { boost: 0.05, desc: "Personal Year 2 — 관계와 협력의 해, 완만한 변화" },
      3: { boost: 0.12, desc: "Personal Year 3 — 표현과 확장의 해" },
      4: { boost: 0.03, desc: "Personal Year 4 — 기반 구축의 해, 안정적 흐름" },
      5: { boost: 0.25, desc: "Personal Year 5 — 변화와 자유의 해, 이벤트 발생률 최고" },
      6: { boost: 0.08, desc: "Personal Year 6 — 가정과 책임의 해" },
      7: { boost: 0.05, desc: "Personal Year 7 — 내면 탐색의 해, 외적 변화 적음" },
      8: { boost: 0.18, desc: "Personal Year 8 — 성취와 물질의 해" },
      9: { boost: 0.20, desc: "Personal Year 9 — 완성과 해방의 해, 큰 종결 가능" }
    };
    const entry = yearEnergy[py];
    if (entry) {
      score += entry.boost;
      factors.push(entry.desc);
    }
  }

  return { score: Math.max(0.05, Math.min(0.95, score)), factors };
}

// ═══════════════════════════════════════
// 자미두수 시간축 신호 (v10: base 0.25)
// ═══════════════════════════════════════
function extractZiweiTimingSignal(ziweiResult: any): { score: number; factors: string[]; majorPeriodActive: boolean } {
  let score = 0.25;
  let majorPeriodActive = false;
  const factors: string[] = [];

  if (!ziweiResult || ziweiResult.skipped) return { score, factors, majorPeriodActive };

  const cmp = ziweiResult?.currentMajorPeriod;
  const chars = Array.isArray(ziweiResult.characteristics) ? ziweiResult.characteristics : [];

  if (cmp) {
    const hasLuckyStar = cmp.main_stars?.some((s: string) => ["자미", "천부", "태양", "무곡", "천동", "천기"].includes(s));
    if (hasLuckyStar) {
      score += 0.18;
      majorPeriodActive = true;
      factors.push(`자미두수 대한(${cmp.startAge}~${cmp.endAge}세) — 길성(吉星) 영향권`);
    }

    const ft = ziweiResult.four_transformations || [];
    if (Array.isArray(ft) && ft.some((t: any) => t.type === "화록" && t.palace === cmp.name)) {
      score += 0.22;
      majorPeriodActive = true;
      factors.push(`대한 화록(化祿) — ${cmp.name} 중심의 긍정적 변화 촉발`);
    }
  }

  if (chars.includes("화록 active")) {
    score += 0.12;
    factors.push("유년 화록 — 가시적인 기회 신호");
  }
  if (chars.includes("화기 active")) {
    score -= 0.08;
    factors.push("유년 화기 — 신중한 접근이 필요한 변곡점");
  }

  return { score: Math.max(0.05, Math.min(0.95, score)), factors, majorPeriodActive };
}

// ═══════════════════════════════════════
// 타로 Timing 차원 (v10: base 0.25)
// ═══════════════════════════════════════
function extractTarotTimingSignal(tarotResult: any): { score: number; factors: string[]; isImminent: boolean } {
  let score = 0.25;
  let isImminent = false;
  const factors: string[] = [];

  if (!tarotResult) return { score, factors, isImminent };

  const patterns = tarotResult.dominant_patterns || {};
  const chars = Array.isArray(tarotResult.characteristics) ? tarotResult.characteristics : [];

  const timingDimensions = ["timing_event", "cycle_change", "life_transition", "sudden_change", "movement"];
  let timingSum = 0;
  timingDimensions.forEach(dim => {
    if (patterns[dim]) timingSum += patterns[dim];
  });

  if (timingSum > 1.0 || chars.includes("임박")) {
    score += 0.30;
    isImminent = true;
    factors.push("타로 시간축 차원 강함 — 변화 이벤트 임박");
  } else if (timingSum > 0.5) {
    score += 0.15;
    factors.push("타로 시간축 차원 중간 — 점진적 변화 진행");
  } else if (timingSum > 0.2) {
    score += 0.05;
    factors.push("타로 시간축 차원 약함 — 잠재적 변화 신호");
  }

  if (patterns["stagnation"] && patterns["stagnation"] > 0.5) {
    score -= 0.15;
    factors.push("타로 정체 에너지 — 상황의 숙성 및 대기 필요");
  }

  return { score: Math.max(0.05, Math.min(0.95, score)), factors, isImminent };
}

// ═══════════════════════════════════════
// 메인 시간축 예측 함수 (v10)
// ═══════════════════════════════════════
export function predictTemporalV8(consensus: any, systemResults: any[], category?: string): EventWindow[] {
  const { consensus_score, prediction_strength } = consensus;

  const sajuResult = systemResults.find(s => s.system === "saju");
  const astroResult = systemResults.find(s => s.system === "astrology");
  const ziweiResult = systemResults.find(s => s.system === "ziwei");
  const numResult = systemResults.find(s => s.system === "numerology");
  const tarotResult = systemResults.find(s => s.system === "tarot");

  category = category || "general";
  const sajuSignal = extractSajuTimingSignal(sajuResult, category);
  const astroSignal = extractAstrologyTimingSignal(astroResult, category);
  const ziweiSignal = extractZiweiTimingSignal(ziweiResult);
  const numSignal = extractNumerologyTimingSignal(numResult);
  const tarotSignal = extractTarotTimingSignal(tarotResult);

  // 전체 타이밍 감도 (가중 평균)
  const transitAlignment =
    sajuSignal.score * 0.25 +
    ziweiSignal.score * 0.20 +
    astroSignal.score * 0.20 +
    tarotSignal.score * 0.20 +
    numSignal.score * 0.15;

  const pattern_factor = Math.max(0.1, Number(prediction_strength) || 0.3);
  const consensus_factor = Math.max(0.1, Number(consensus_score) || 0.3);
  const timing_factor = Math.max(0.1, Number(transitAlignment) || 0.3);

  // 기본 확률: 패턴 15% + 타이밍 55% + 합의도 30%
  const base = (pattern_factor * 0.15) + (timing_factor * 0.55) + (consensus_factor * 0.30);

  // 기여 요인 통합
  const allFactors = [
    ...sajuSignal.factors,
    ...ziweiSignal.factors,
    ...astroSignal.factors,
    ...numSignal.factors,
    ...tarotSignal.factors
  ];

  // ═══ 윈도우별 독립 점수 계산 ═══

  // 단기: 즉시성 신호(충, 임박) + 타로 중심
  const shortImm = sajuSignal.immediacy + (tarotSignal.isImminent ? 0.25 : 0);
  const shortProb = Math.max(0.08, Math.min(0.95, base * 0.7 + shortImm * 0.6));

  // 중기: 행성 트랜짓 + 대운/대한 중심
  const midTransit = astroSignal.transitIntensity + (ziweiSignal.majorPeriodActive ? 0.20 : 0);
  const midProb = Math.max(0.10, Math.min(0.98, base * 1.1 + midTransit * 0.4));

  // 장기: 구조적 합 + 용신 합치 중심
  const longStruct = sajuSignal.structural;
  const longProb = Math.max(0.08, Math.min(0.92, base * 0.85 + longStruct * 0.5));

  // 윈도우 간 최소 차이 보장 (5%p 이상)
  const probs = [shortProb, midProb, longProb];
  for (let i = 1; i < probs.length; i++) {
    if (Math.abs(probs[i] - probs[i - 1]) < 0.05) {
      probs[i] = probs[i] + (probs[i] > probs[i - 1] ? 0.05 : -0.05);
      probs[i] = Math.max(0.05, Math.min(0.98, probs[i]));
    }
  }

  const windows: EventWindow[] = [
    {
      window: "단기 (0~3개월)",
      label: tarotSignal.isImminent || sajuSignal.immediacy > 0.2 ? "변화 임박" : "잠재적 변화",
      probability: Math.round(probs[0] * 100) / 100,
      description: (tarotSignal.isImminent || sajuSignal.immediacy > 0.2)
        ? "사주 충(傾)의 동적 기운과 타로의 변화 에너지가 결합하여 3개월 이내에 눈에 띄는 상황 반전이 나타날 가능성이 높습니다."
        : "현재는 기운이 축적되는 단계로, 성급한 결정보다는 상황의 전개를 관망하며 초기 신호를 포착하는 것이 유리합니다.",
      contributing_factors: allFactors.filter(f =>
        f.includes("충") || f.includes("임박") || f.includes("유년") || f.includes("형살")
      )
    },
    {
      window: "중기 (3~12개월)",
      label: midTransit > 0.2 ? "핵심 전환기" : "점진적 진전",
      probability: Math.round(probs[1] * 100) / 100,
      description: (midTransit > 0.2)
        ? "점성술 외행성 이동과 자미두수 대한 에너지가 정렬되는 시기입니다. 인생의 중요한 방향성이 결정되는 정점 기간입니다."
        : "다중 시스템의 에너지가 본 궤도에 오르는 시기로, 앞서 준비한 일들이 본격적인 흐름을 타고 확산됩니다.",
      contributing_factors: allFactors.filter(f =>
        f.includes("Transit") || f.includes("Year") || f.includes("확장") || f.includes("대한") || f.includes("대운") || f.includes("세운")
      )
    },
    {
      window: "장기 (1년 이상)",
      label: longStruct > 0.15 ? "구조적 결실" : "안정적 흐름",
      probability: Math.round(probs[2] * 100) / 100,
      description: sajuSignal.structural > 0.15
        ? "사주 합(合)과 용신 에너지가 삶의 고정 구조로 자리 잡는 안착기입니다. 지속 가능한 성장의 토대가 완성됩니다."
        : "변화의 결과가 정착되는 시기로, 내실을 다지기에 적합한 흐름이 예상됩니다.",
      contributing_factors: allFactors.filter(f =>
        f.includes("합") || f.includes("용신") || f.includes("안정") || f.includes("구조") || f.includes("황금기")
      )
    }
  ];

  return windows;
}

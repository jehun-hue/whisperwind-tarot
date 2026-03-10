/**
 * temporalPredictionEngine.ts (v9)
 * - 하드코딩 제거 → 5대 시스템 실계산 데이터 기반 시간축 예측
 * - event_probability = pattern_strength × transit_alignment × consensus_score
 * - 사주 충/합, 점성술 transit, 수비학 personal_year, 타로 timing 차원 통합
 */

export interface EventWindow {
  window: string;
  probability: number;
  description: string;
  contributing_factors: string[];
}

// ═══════════════════════════════════════
// 사주 시간축 신호 추출
// ═══════════════════════════════════════
function extractSajuTimingSignal(sajuResult: any): { score: number; factors: string[] } {
  let score = 0.5; // 기본값
  const factors: string[] = [];

  if (!sajuResult) return { score, factors };

  const chars: string[] = sajuResult.characteristics || [];

  // 충(沖)이 있으면 변동성 높음 → 단기 이벤트 확률 증가
  const hasChung = chars.some((c: string) => c.includes("충"));
  if (hasChung) {
    score += 0.15;
    factors.push("사주 충(沖) 구조 — 단기 변동 가능성 증가");
  }

  // 형살이 있으면 리스크 가중
  const hasHyung = chars.some((c: string) => c.includes("형살"));
  if (hasHyung) {
    score += 0.05;
    factors.push("사주 형살 — 마찰/건강 주의 시기");
  }

  // 삼합/방합이 있으면 안정적 흐름 → 중장기 안정
  const hasHarmony = chars.some((c: string) => c.includes("삼합") || c.includes("방합"));
  if (hasHarmony) {
    score += 0.10;
    factors.push("사주 합(合) 구조 — 에너지 결집으로 장기 안정");
  }

  // 신강/신약에 따른 보정
  if (sajuResult.strength === "극신강" || sajuResult.strength === "중신강") {
    score += 0.05;
    factors.push(`${sajuResult.strength} — 자기 주도적 실행력 유리`);
  } else if (sajuResult.strength === "극신약") {
    score -= 0.05;
    factors.push("극신약 — 외부 환경 의존도 높아 시기 변동 민감");
  }

  // 오행 과다/부족 개수
  const imbalanceCount = chars.filter((c: string) => c.includes("과다") || c.includes("부족")).length;
  if (imbalanceCount >= 2) {
    score -= 0.05;
    factors.push(`오행 불균형(${imbalanceCount}개) — 에너지 편중으로 예측 변동폭 확대`);
  }

  return { score: Math.max(0.1, Math.min(0.95, score)), factors };
}

// ═══════════════════════════════════════
// 점성술 Transit 신호 추출
// ═══════════════════════════════════════
function extractAstrologyTimingSignal(astroResult: any): { score: number; factors: string[] } {
  let score = 0.5;
  const factors: string[] = [];

  if (!astroResult) return { score, factors };

  const chars: string[] = astroResult.characteristics || [];
  const transits = astroResult.transits || [];

  // 외행성 transit (Pluto, Neptune, Uranus, Saturn, Jupiter) 감지
  const outerPlanetTransits = chars.filter((c: string) =>
    /pluto|neptune|uranus|saturn|jupiter/i.test(c) && /transit/i.test(c)
  );
  if (outerPlanetTransits.length > 0) {
    score += outerPlanetTransits.length * 0.08;
    factors.push(`외행성 Transit ${outerPlanetTransits.length}개 — 중장기 변화 에너지 활성`);
  }

  // Jupiter Transit 특별 처리 (확장/기회)
  if (chars.some((c: string) => /jupiter/i.test(c))) {
    score += 0.10;
    factors.push("Jupiter Transit — 확장과 기회의 시기");
  }

  // Saturn Aspect (제약/구조화)
  if (chars.some((c: string) => /saturn/i.test(c))) {
    score += 0.05;
    factors.push("Saturn 영향 — 구조적 변화와 책임의 시기");
  }

  // aspect 기반 (trine=조화, square=긴장)
  const trines = chars.filter((c: string) => /trine/i.test(c)).length;
  const squares = chars.filter((c: string) => /square/i.test(c)).length;
  if (trines > 0) {
    score += trines * 0.05;
    factors.push(`Trine aspect ${trines}개 — 순조로운 흐름`);
  }
  if (squares > 0) {
    score += squares * 0.03; // 긴장도 이벤트 촉발 요인
    factors.push(`Square aspect ${squares}개 — 긴장을 통한 변화 촉발`);
  }

  // 실제 transit 배열이 있는 경우
  if (transits.length > 0) {
    score += Math.min(0.15, transits.length * 0.03);
    factors.push(`활성 Transit ${transits.length}개 감지`);
  }

  return { score: Math.max(0.1, Math.min(0.95, score)), factors };
}

// ═══════════════════════════════════════
// 수비학 시간축 신호 추출
// ═══════════════════════════════════════
function extractNumerologyTimingSignal(numResult: any): { score: number; factors: string[] } {
  let score = 0.5;
  const factors: string[] = [];

  if (!numResult) return { score, factors };

  const py = numResult.personal_year || numResult.personalYear;
  if (py) {
    // Personal Year별 이벤트 확률 가중
    const yearEnergy: Record<number, { boost: number; desc: string }> = {
      1: { boost: 0.15, desc: "Personal Year 1 — 새로운 시작의 해, 이벤트 발생률 높음" },
      2: { boost: 0.05, desc: "Personal Year 2 — 관계와 협력의 해, 완만한 변화" },
      3: { boost: 0.10, desc: "Personal Year 3 — 표현과 확장의 해" },
      4: { boost: 0.03, desc: "Personal Year 4 — 기반 구축의 해, 안정적 흐름" },
      5: { boost: 0.18, desc: "Personal Year 5 — 변화와 자유의 해, 이벤트 발생률 최고" },
      6: { boost: 0.08, desc: "Personal Year 6 — 가정과 책임의 해" },
      7: { boost: 0.05, desc: "Personal Year 7 — 내면 탐색의 해, 외적 변화 적음" },
      8: { boost: 0.12, desc: "Personal Year 8 — 성취와 물질의 해" },
      9: { boost: 0.15, desc: "Personal Year 9 — 완성과 해방의 해, 큰 종결 가능" }
    };

    const entry = yearEnergy[py];
    if (entry) {
      score += entry.boost;
      factors.push(entry.desc);
    }
  }

  return { score: Math.max(0.1, Math.min(0.95, score)), factors };
}

// ═══════════════════════════════════════
// 타로 Timing 차원 추출
// ═══════════════════════════════════════
function extractTarotTimingSignal(tarotResult: any): { score: number; factors: string[] } {
  let score = 0.5;
  const factors: string[] = [];

  if (!tarotResult) return { score, factors };

  const patterns = tarotResult.dominant_patterns || tarotResult.characteristics || {};

  // timing_event, cycle_change, life_transition 차원 확인
  const timingDimensions = ["timing_event", "cycle_change", "life_transition", "sudden_change", "movement"];
  let timingSum = 0;
  timingDimensions.forEach(dim => {
    if (patterns[dim]) timingSum += patterns[dim];
  });

  if (timingSum > 1.0) {
    score += 0.15;
    factors.push("타로 시간축 차원 강함 — 변화 이벤트 임박");
  } else if (timingSum > 0.5) {
    score += 0.08;
    factors.push("타로 시간축 차원 중간 — 점진적 변화 진행");
  }

  // 정체(stagnation) 차원이 높으면 이벤트 지연
  if (patterns["stagnation"] && patterns["stagnation"] > 0.5) {
    score -= 0.10;
    factors.push("타로 정체 에너지 감지 — 이벤트 지연 가능성");
  }

  return { score: Math.max(0.1, Math.min(0.95, score)), factors };
}

// ═══════════════════════════════════════
// 메인 시간축 예측 함수
// ═══════════════════════════════════════
export function predictTemporalV8(consensus: any, systemResults: any[]): EventWindow[] {
  const { consensus_score, prediction_strength } = consensus;

  // 각 시스템에서 timing 신호 추출
  const sajuResult = systemResults.find(s => s.system === "saju");
  const astroResult = systemResults.find(s => s.system === "astrology");
  const numResult = systemResults.find(s => s.system === "numerology");
  const tarotResult = systemResults.find(s => s.system === "tarot");

  const sajuSignal = extractSajuTimingSignal(sajuResult);
  const astroSignal = extractAstrologyTimingSignal(astroResult);
  const numSignal = extractNumerologyTimingSignal(numResult);
  const tarotSignal = extractTarotTimingSignal(tarotResult);

  // 가중 평균 transit alignment
  // 사주 30%, 점성술 25%, 타로 20%, 수비학 15%, 기본 10%
  const transitAlignment =
    sajuSignal.score * 0.30 +
    astroSignal.score * 0.25 +
    tarotSignal.score * 0.20 +
    numSignal.score * 0.15 +
    0.5 * 0.10; // 기본 바이어스

  // 핵심 공식: event_probability = pattern_strength × transit_alignment × consensus_score
  const pattern_strength = prediction_strength || (consensus_score * 0.8);
  const base_event_probability = pattern_strength * transitAlignment * Math.max(consensus_score, 0.1);

  // 기여 요인 통합
  const allFactors = [
    ...sajuSignal.factors,
    ...astroSignal.factors,
    ...numSignal.factors,
    ...tarotSignal.factors
  ];

  // 시간대별 보정 계수 (실데이터 기반 동적 계산)
  const hasChung = sajuSignal.factors.some(f => f.includes("충"));
  const hasHarmony = sajuSignal.factors.some(f => f.includes("합"));
  const hasOuterTransit = astroSignal.factors.some(f => f.includes("외행성"));

  // 단기: 충이 있으면 확률↑, 중장기: 합/transit 있으면 확률↑
  const shortTermMultiplier = hasChung ? 1.15 : 1.0;
  const midTermMultiplier = hasOuterTransit ? 1.3 : 1.1;
  const longTermMultiplier = hasHarmony ? 1.2 : 0.9;

  const windows: EventWindow[] = [
    {
      window: "단기 (0~3개월)",
      probability: Math.min(0.99, base_event_probability * shortTermMultiplier),
      description: shortTermMultiplier > 1.0
        ? "사주 충(沖) 구조와 타로 변화 에너지가 결합하여 빠른 시일 내 상황 변동이 예상되는 시기입니다."
        : "에너지의 초기 발현 단계로, 주변 환경에서 미세한 신호가 감지되기 시작하는 시기입니다.",
      contributing_factors: allFactors.filter(f => f.includes("단기") || f.includes("충") || f.includes("임박"))
    },
    {
      window: "중기 (3~12개월)",
      probability: Math.min(0.99, base_event_probability * midTermMultiplier),
      description: midTermMultiplier > 1.1
        ? "외행성 Transit과 수비학 에너지가 정렬되어 핵심적인 변화가 가속화되는 정점 시기입니다."
        : "다중 체계의 기운이 서서히 모여들며, 의미 있는 변화의 윤곽이 잡히는 시기입니다.",
      contributing_factors: allFactors.filter(f => f.includes("Transit") || f.includes("Year") || f.includes("확장"))
    },
    {
      window: "장기 (1년 이상)",
      probability: Math.min(0.99, base_event_probability * longTermMultiplier),
      description: longTermMultiplier > 1.0
        ? "사주 합(합) 구조가 장기적 안정을 뒷받침하여, 변화의 결과가 새로운 삶의 구조로 정착되는 시기입니다."
        : "변화의 결과가 서서히 안정화되어 일상에 통합되는 시기입니다. 급격한 변동보다는 점진적 정착이 예상됩니다.",
      contributing_factors: allFactors.filter(f => f.includes("합") || f.includes("장기") || f.includes("안정") || f.includes("구조"))
    }
  ];

  return windows;
}

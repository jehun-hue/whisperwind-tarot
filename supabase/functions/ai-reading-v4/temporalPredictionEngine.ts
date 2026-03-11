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
// 자미두수 시간축 신호 추출
// ═══════════════════════════════════════
function extractZiweiTimingSignal(ziweiResult: any): { score: number; factors: string[] } {
  let score = 0.5;
  const factors: string[] = [];

  if (!ziweiResult) return { score, factors };

  const cmp = ziweiResult.currentMajorPeriod;
  const cmi = ziweiResult.currentMinorPeriod;
  const chars = ziweiResult.characteristics || [];

  // 대한(Major Period) 분석
  if (cmp) {
    const hasLuckyStar = cmp.main_stars?.some((s: string) => ["자미", "천부", "태양", "무곡", "천동", "천기"].includes(s));
    if (hasLuckyStar) {
      score += 0.12;
      factors.push(`자미두수 대한(${cmp.startAge}~${cmp.endAge}세) — 길성(吉星) 영향권 진입`);
    }

    const ft = ziweiResult.four_transformations || [];
    // 화록(化祿)은 강력한 발생 신호
    if (Array.isArray(ft) && ft.some((t: any) => t.type === "화록" && t.palace === cmp.name)) {
      score += 0.18;
      factors.push(`대한 화록(化祿) — ${cmp.name} 중심의 긍정적 변화 촉발`);
    }
  }

  // 소한/유년 신호
  if (chars.includes("화록 active")) {
    score += 0.10;
    factors.push("유년 화록 — 가시적인 기회 신호");
  }

  if (chars.includes("화기 active")) {
    score -= 0.05;
    factors.push("유년 화기 — 신중한 접근이 필요한 변곡점");
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

  const patterns = tarotResult.dominant_patterns || {};
  const chars = Array.isArray(tarotResult.characteristics) ? tarotResult.characteristics : [];

  // timing_event, cycle_change, life_transition 차원 확인
  const timingDimensions = ["timing_event", "cycle_change", "life_transition", "sudden_change", "movement"];
  let timingSum = 0;
  timingDimensions.forEach(dim => {
    if (patterns[dim]) timingSum += patterns[dim];
  });

  if (timingSum > 1.0 || chars.includes("임박")) {
    score += 0.20;
    factors.push("타로 시간축 차원 강함 — 변화 이벤트 임박");
  } else if (timingSum > 0.5) {
    score += 0.10;
    factors.push("타로 시간축 차원 중간 — 점진적 변화 진행");
  }

  // 정체(stagnation) 차원이 높으면 이벤트 지연
  if (patterns["stagnation"] && patterns["stagnation"] > 0.5) {
    score -= 0.12;
    factors.push("타로 정체 에너지 — 상황의 숙성 및 대기 필요");
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
  const ziweiResult = systemResults.find(s => s.system === "ziwei");
  const numResult = systemResults.find(s => s.system === "numerology");
  const tarotResult = systemResults.find(s => s.system === "tarot");

  const sajuSignal = extractSajuTimingSignal(sajuResult);
  const astroSignal = extractAstrologyTimingSignal(astroResult);
  const ziweiSignal = extractZiweiTimingSignal(ziweiResult);
  const numSignal = extractNumerologyTimingSignal(numResult);
  const tarotSignal = extractTarotTimingSignal(tarotResult);

  // 각 시스템별 가중 평균 타이밍 감도 계산
  // 사주(25%), 자미두수(20%), 점성술(20%), 타로(20%), 수비학(15%)
  const transitAlignment =
    sajuSignal.score * 0.25 +
    ziweiSignal.score * 0.20 +
    astroSignal.score * 0.20 +
    tarotSignal.score * 0.20 +
    numSignal.score * 0.15;

  // 1% 버그 수정: 엄격한 곱연산 대신 가중치 부여된 선형 결합 및 부스트 적용
  // event_probability가 0.1(10%) 이하로 떨어지는 것을 방지하여 '의미 없는 예측' 회피
  const pattern_factor = Math.max(0.2, prediction_strength || 0.5);
  const consensus_factor = Math.max(0.3, consensus_score || 0.4);
  
  // 기본 확률 = (패턴강도 * 0.4) + (타이밍일치 * 0.4) + (합의도 * 0.2)
  let base_event_probability = (pattern_factor * 0.4) + (transitAlignment * 0.4) + (consensus_factor * 0.2);
  
  // 보정: 너무 낮은 확률은 20% 수준으로 보정 (최한나 해석 스타일 특성상 1%는 부적절)
  base_event_probability = Math.max(0.2, Math.min(0.9, base_event_probability));

  // 기여 요인 통합
  const allFactors = [
    ...sajuSignal.factors,
    ...ziweiSignal.factors,
    ...astroSignal.factors,
    ...numSignal.factors,
    ...tarotSignal.factors
  ];

  // 시간대별 보정 계수 및 텍스트 생성
  const hasChung = sajuSignal.factors.some(f => f.includes("충"));
  const hasImminent = tarotSignal.factors.some(f => f.includes("임박"));
  const hasOuterTransit = astroSignal.factors.some(f => f.includes("외행성"));
  const hasMajorPeriod = ziweiSignal.factors.some(f => f.includes("대한"));

  const windows: EventWindow[] = [
    {
      window: "단기 (0~3개월)",
      probability: Math.min(0.99, base_event_probability * (hasChung || hasImminent ? 1.25 : 0.85)),
      description: (hasChung || hasImminent)
        ? "사주 충(沖)의 동적인 기운과 타로의 변화 에너지가 결합하여 3개월 이내에 눈에 띄는 상황 반전이나 결과가 나타날 가능성이 매우 높은 시기입니다."
        : "현재는 기운이 축적되는 단계로, 성급한 결정보다는 상황의 전개를 관망하며 초기 신호를 포착하는 것이 유리한 시기입니다.",
      contributing_factors: allFactors.filter(f => f.includes("단기") || f.includes("충") || f.includes("임박") || f.includes("유년"))
    },
    {
      window: "중기 (3~12개월)",
      probability: Math.min(0.99, base_event_probability * (hasOuterTransit || hasMajorPeriod ? 1.3 : 1.1)),
      description: (hasOuterTransit || hasMajorPeriod)
        ? "점성술의 외행성 이동과 자미두수의 대한(大限) 에너지가 정렬되는 시기입니다. 인생의 중요한 방향성이 결정되거나 핵심적인 성취가 일어나는 정점의 기간이 될 것입니다."
        : "다중 시스템의 에너지가 본 궤도에 오르는 시기로, 앞서 준비한 일들이 본격적인 흐름을 타고 확산되는 양상을 보일 것입니다.",
      contributing_factors: allFactors.filter(f => f.includes("Transit") || f.includes("Year") || f.includes("확장") || f.includes("대한"))
    },
    {
      window: "장기 (1년 이상)",
      probability: Math.min(0.99, base_event_probability * (sajuSignal.factors.some(f => f.includes("합")) ? 1.15 : 0.95)),
      description: "변화의 결과가 삶의 고정된 구조로 자리 잡는 안착의 시기입니다. 단기적인 변동성보다는 지속 가능한 성장을 도모하고 내실을 다지기에 적합한 흐름이 예상됩니다.",
      contributing_factors: allFactors.filter(f => f.includes("합") || f.includes("장기") || f.includes("안정") || f.includes("구조"))
    }
  ];

  return windows;
}

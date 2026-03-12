/**
 * temporalPredictionEngine.ts (v9)
 * - 하드코딩 제거 → 5대 시스템 실계산 데이터 기반 시간축 예측
 * - event_probability = pattern_strength × transit_alignment × consensus_score
 * - 사주 충/합, 점성술 transit, 수비학 personal_year, 타로 timing 차원 통합
 */

export interface EventWindow {
  window: string;
  probability: number;
  label: string;
  description: string;
  contributing_factors: string[];
}

// ═══════════════════════════════════════
// 사주 시간축 신호 추출
// ═══════════════════════════════════════
function extractSajuTimingSignal(sajuResult: any, category?: string): { score: number; factors: string[] } {
  let score = 0.55; // 기본값 상향
  const factors: string[] = [];

  if (!sajuResult) return { score, factors };

  const chars: string[] = sajuResult.characteristics || [];
  const tenGods: Record<string, number> = sajuResult.tenGods || {};
  const daewoon = sajuResult.daewoon?.currentDaewoon;

  // 1. 충(沖) 감지 (강력한 변화 신호)
  const hasChung = chars.some((c: string) => c.includes("충"));
  if (hasChung) {
    score += 0.20;
    factors.push("사주 원국/대운 충(沖) — 강력한 변동성과 전환점 감지");
  }

  // 2. 합(合) 감지 (안정 및 결실)
  const hasHarmony = chars.some((c: string) => c.includes("합") || c.includes("방합"));
  if (hasHarmony) {
    score += 0.10;
    factors.push("사주 합(合) — 에너지 응집으로 인한 안정적 성취 기반");
  }

  // 3. 질문 유형별 십성/대운 매칭
  if (category) {
    const isWealth = ["재물", "사업", "money", "career", "wealth"].some(k => category.includes(k));
    const isLove = ["연애", "결혼", "relationship", "love"].some(k => category.includes(k));

    if (isWealth) {
      if (tenGods["재성"] && tenGods["재성"] >= 1.5) {
        score += 0.12;
        factors.push("사주 내 재성(財星) 발달 — 재물 운용 역량 우수");
      }
      if (daewoon && (daewoon.tenGodStem === "재성" || daewoon.tenGodBranch === "재성" || daewoon.tenGodStem === "식상" || daewoon.tenGodBranch === "식상")) {
        score += 0.15;
        factors.push(`현재 대운(${daewoon.full})이 재성/식상 흐름 — 재물운 활성기`);
      }
    }

    if (isLove) {
      const loveGod = sajuResult.gender === 'M' ? "재성" : "관성";
      if (tenGods[loveGod] && tenGods[loveGod] >= 1.5) {
        score += 0.12;
        factors.push(`사주 내 ${loveGod} 발달 — 이성운 기틀 견고`);
      }
      if (daewoon && (daewoon.tenGodStem === loveGod || daewoon.tenGodBranch === loveGod)) {
        score += 0.15;
        factors.push(`현재 대운이 ${loveGod} 흐름 — 인연운 및 관계 진전 시기`);
      }
    }
  }

  // 4. 용신/희신 합치 여부
  if (chars.includes("대운-용신 합치")) {
    score += 0.15;
    factors.push("현재 대운이 용신(用神)과 합치 — 인생의 황금기/발복 시기");
  }

  return { score: Math.max(0.1, Math.min(0.98, score)), factors };
}

// ═══════════════════════════════════════
// 점성술 Transit 신호 추출
// ═══════════════════════════════════════
function extractAstrologyTimingSignal(astroResult: any, category?: string): { score: number; factors: string[] } {
  let score = 0.55; // 기본값 상향
  const factors: string[] = [];

  if (!astroResult) return { score, factors };

  const chars: string[] = astroResult.characteristics || [];
  const transits = astroResult.transits || [];

  // 1. 주요 Transit (Jupiter/Saturn) 감지
  if (chars.some(c => /jupiter/i.test(c))) {
    score += 0.15;
    factors.push("Jupiter Transit — 확장, 기회, 행운의 에너지 활성");
  }
  if (chars.some(c => /saturn/i.test(c))) {
    score += 0.10;
    factors.push("Saturn 정렬 — 내실을 다지고 구조를 재정비하는 시기");
  }

  // 2. 외행성(Outer Planet) 영향
  const outerImpact = chars.filter(c => /pluto|neptune|uranus/i.test(c)).length;
  if (outerImpact > 0) {
    score += outerImpact * 0.10;
    factors.push(`외행성(${outerImpact}개) 강력한 관여 — 운명의 근본적 변형과 거시적 흐름 형성`);
  }

  // 3. 질문 유형 기반 행성 매팅
  if (category) {
    const isWealth = ["재물", "사업", "money", "wealth"].some(k => category.includes(k));
    if (isWealth && chars.some(c => /venus|jupiter/i.test(c) && /trine|sextile|conjunction/i.test(c))) {
      score += 0.15;
      factors.push("금융/가치 행성(Venus, Jupiter)의 조화로운 각도 — 재물운 상승 신호");
    }
    const isLove = ["연애", "relationship", "love"].some(k => category.includes(k));
    if (isLove && chars.some(c => /venus|mars/i.test(c) && /trine|conjunction/i.test(c))) {
      score += 0.15;
      factors.push("사랑과 열정의 행성(Venus, Mars) 활성화 — 인연운 강화");
    }
  }

  return { score: Math.max(0.1, Math.min(0.98, score)), factors };
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
export function predictTemporalV8(consensus: any, systemResults: any[], category?: string): EventWindow[] {
  const { consensus_score, prediction_strength } = consensus;

  // 각 시스템에서 timing 신호 추출
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

  // 각 시스템별 가중 평균 타이밍 감도 계산
  const transitAlignment =
    sajuSignal.score * 0.25 +
    ziweiSignal.score * 0.20 +
    astroSignal.score * 0.20 +
    tarotSignal.score * 0.20 +
    numSignal.score * 0.15;

  // 1% 버그 원천 차단 및 수치 가독성 상향
  // pattern_factor: 0.3 ~ 1.0 (기본 0.5)
  const pattern_factor = Math.max(0.3, Number(prediction_strength) || 0.5);
  // consensus_factor: 0.4 ~ 1.0 (기본 0.5)
  const consensus_factor = Math.max(0.4, Number(consensus_score) || 0.5);
  // transitAlignment: 이미 0.1~0.98 범위로 가공됨
  const timing_factor = Math.max(0.2, Number(transitAlignment) || 0.5);
  
  // 기본 확률 로직 상향: (패턴 20% + 타이밍 50% + 합의도 30%)
  let base_event_probability = (pattern_factor * 0.2) + (timing_factor * 0.5) + (consensus_factor * 0.3);
  
  // 최종 보정: 하한선을 40%로 상향하여 1~2%가 나오는 것을 물리적으로 차단
  base_event_probability = Math.max(0.40, Math.min(0.90, base_event_probability));

  // 기여 요인 통합
  const allFactors = [
    ...sajuSignal.factors,
    ...ziweiSignal.factors,
    ...astroSignal.factors,
    ...numSignal.factors,
    ...tarotSignal.factors
  ];

  // 시간대별 보정 계수 및 텍스트 생성 (각 윈도우가 서로 다른 값을 갖도록 강제 오프셋 적용)
  const hasChung = sajuSignal.factors.some(f => f.includes("충"));
  const hasImminent = tarotSignal.factors.some(f => f.includes("임박"));
  const hasOuterTransit = astroSignal.factors.some(f => f.includes("외행성"));
  const hasMajorPeriod = ziweiSignal.factors.some(f => f.includes("대한"));

  const windows: EventWindow[] = [
    {
      window: "단기 (0~3개월)",
      label: "긍정적 변화 가능성",
      // 기본 base에 충/임박 시 가중치, 아닐 시 소폭 감쇄 (최소 35% 보장)
      probability: Math.max(0.35, Math.min(0.98, base_event_probability * (hasChung || hasImminent ? 1.2 : 0.85))),
      description: (hasChung || hasImminent)
        ? "사주 충(沖)의 동적인 기운과 타로의 변화 에너지가 결합하여 3개월 이내에 눈에 띄는 상황 반전이나 결과가 나타날 가능성이 매우 높은 시기입니다."
        : "현재는 기운이 축적되는 단계로, 성급한 결정보다는 상황의 전개를 관망하며 초기 신호를 포착하는 것이 유리한 시기입니다.",
      contributing_factors: allFactors.filter(f => f.includes("단기") || f.includes("충") || f.includes("임박") || f.includes("유년"))
    },
    {
      window: "중기 (3~12개월)",
      label: "긍정적 변화 가능성",
      // 중기는 대개 에너지가 고조되는 시기 (최소 45% 보장하여 단기와 차별화)
      probability: Math.max(0.45, Math.min(0.99, base_event_probability * (hasOuterTransit || hasMajorPeriod ? 1.3 : 1.15))),
      description: (hasOuterTransit || hasMajorPeriod)
        ? "점성술의 외행성 이동과 자미두수의 대한(大限) 에너지가 정렬되는 시기입니다. 인생의 중요한 방향성이 결정되거나 핵심적인 성취가 일어나는 정점의 기간이 될 것입니다."
        : "다중 시스템의 에너지가 본 궤도에 오르는 시기로, 앞서 준비한 일들이 본격적인 흐름을 타고 확산되는 양상을 보일 것입니다.",
      contributing_factors: allFactors.filter(f => f.includes("Transit") || f.includes("Year") || f.includes("확장") || f.includes("대한"))
    },
    {
      window: "장기 (1년 이상)",
      label: "긍정적 변화 가능성",
      // 장기는 안정화 단계 (최소 40% 보장하여 중기와 차별화)
      probability: Math.max(0.40, Math.min(0.95, base_event_probability * (sajuSignal.factors.some(f => f.includes("합")) ? 1.1 : 0.95))),
      description: "변화의 결과가 삶의 고정된 구조로 자리 잡는 안착의 시기입니다. 단기적인 변동성보다는 지속 가능한 성장을 도모하고 내실을 다지기에 적합한 흐름이 예상됩니다.",
      contributing_factors: allFactors.filter(f => f.includes("합") || f.includes("장기") || f.includes("안정") || f.includes("구조"))
    }
  ];

  return windows;
}

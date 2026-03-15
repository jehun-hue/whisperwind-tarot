/**
 * lifeTimelineEngine.ts (B-102~108)
 * 개인 생애 타임라인 엔진
 * - 사주 대운 + 점성술 트랜짓 + 수비학 개인년을 통합
 * - 이벤트 창(event_window) 탐지 및 확률 점수 계산
 * - 파이프라인: Consensus Engine → Timeline Engine → Calibration → Narrative
 */

// ── 타입 정의 ─────────────────────────────────────────────────
export interface TimelineEvent {
  age: number;
  phase: string;
  event_type: "relationship" | "career" | "finance" | "health" | "spirituality" | "transition";
  contributing_engines: string[];
  probability: number;         // 0~1
  window_start: string;        // "YYYY.MM" 형식
  window_end: string;
  description: string;
}

export interface EventWindow {
  event: string;
  event_type: string;
  window: string;              // "YYYY.MM~YYYY.MM"
  probability: number;
  signal_sources: string[];
}

export interface ProbabilityCurve {
  year: number;
  relationship: number;
  career: number;
  finance: number;
  health: number;
  spirituality: number;
}

export interface PredictedEvent {
  event: string;
  window: string;
  probability: number;
  confidence: "high" | "medium" | "low";
  narrative_hint: string;
}

export interface LifeTimelineResult {
  timeline: TimelineEvent[];
  event_windows: EventWindow[];
  probability_curve: ProbabilityCurve[];
  predicted_events: PredictedEvent[];
  current_phase: string;
  next_major_event: PredictedEvent | null;
}

// ── 점수 공식 (B-105) ─────────────────────────────────────────
// score = saju*0.35 + astrology*0.30 + ziwei*0.20 + numerology*0.15
function calcTimelineScore(
  sajuSignal: number,
  astrologySignal: number,
  ziweiSignal: number,
  numerologySignal: number
): number {
  return (
    sajuSignal     * 0.35 +
    astrologySignal * 0.30 +
    ziweiSignal    * 0.20 +
    numerologySignal * 0.15
  );
}

// ── 현재 나이 계산 ────────────────────────────────────────────
function calcAge(birthYear: number, birthMonth: number, birthDay: number): number {
  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const m = today.getMonth() + 1 - birthMonth;
  if (m < 0 || (m === 0 && today.getDate() < birthDay)) age--;
  return age;
}

// ── 연도→문자열 ────────────────────────────────────────────────
function toYearMonth(year: number, monthOffset: number = 0): string {
  const totalMonths = year * 12 + monthOffset;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12 || 12;
  return `${y}.${String(m).padStart(2, "0")}`;
}

// ── 사주 대운 신호 추출 (B-103) ──────────────────────────────
function extractSajuSignals(sajuData: any): Record<string, number> {
  if (!sajuData) return { relationship: 0, career: 0, finance: 0, health: 0 };

  const signals: Record<string, number> = { relationship: 0, career: 0, finance: 0, health: 0 };
  const cd = sajuData?.daewoon?.currentDaewoon;
  if (!cd) return signals;

  const TEN_GOD_SIGNALS: Record<string, Partial<typeof signals>> = {
    "정재": { finance: 0.8, career: 0.5 },
    "편재": { finance: 0.9, career: 0.4 },
    "정관": { career: 0.8, relationship: 0.4 },
    "편관": { career: 0.7, health: 0.3 },
    "정인": { spirituality: 0.7, career: 0.3 },
    "편인": { spirituality: 0.8 },
    "식신": { finance: 0.6, health: 0.6 },
    "상관": { relationship: 0.7, career: 0.3 },
    "비견": { relationship: 0.5 },
    "겁재": { finance: -0.2, relationship: 0.3 },
  };

  const stemSignal = TEN_GOD_SIGNALS[cd.tenGodStem] ?? {};
  for (const [k, v] of Object.entries(stemSignal)) {
    signals[k] = Math.max(0, (signals[k] ?? 0) + (v as number));
  }

  // 대운 교체기 보너스
  if (sajuData?.daewoon?.is_daeun_changing_year) {
    signals.career = Math.min(1, (signals.career ?? 0) + 0.2);
    signals.relationship = Math.min(1, (signals.relationship ?? 0) + 0.2);
  }

  return signals;
}

// ── 점성술 트랜짓 신호 추출 (B-103) ─────────────────────────
function extractAstrologySignals(astrologyData: any): Record<string, number> {
  if (!astrologyData) return { relationship: 0, career: 0, finance: 0, health: 0 };

  const signals: Record<string, number> = { relationship: 0, career: 0, finance: 0, health: 0 };
  const transits = astrologyData?.transits ?? [];

  const PLANET_DOMAIN: Record<string, string> = {
    "목성": "growth", "토성": "career", "천왕성": "transition",
    "해왕성": "spirituality", "명왕성": "transformation"
  };

  for (const t of transits) {
    const domain = PLANET_DOMAIN[t.planet] ?? "general";
    if (domain === "growth") {
      signals.career  = Math.min(1, (signals.career ?? 0) + 0.3);
      signals.finance = Math.min(1, (signals.finance ?? 0) + 0.3);
    } else if (domain === "career") {
      signals.career = Math.min(1, (signals.career ?? 0) + 0.4);
    } else if (domain === "transition") {
      signals.relationship = Math.min(1, (signals.relationship ?? 0) + 0.3);
    }
  }

  // ai_synthesis_tags 분석
  const tags: string[] = astrologyData?.ai_synthesis_tags ?? [];
  if (tags.some(t => t.includes("금성") || t.includes("관계"))) signals.relationship = Math.min(1, (signals.relationship ?? 0) + 0.2);
  if (tags.some(t => t.includes("토성") || t.includes("직업"))) signals.career = Math.min(1, (signals.career ?? 0) + 0.2);

  return signals;
}

// ── 자미두수 신호 추출 (B-103) ──────────────────────────────
function extractZiweiSignals(ziweiData: any): Record<string, number> {
  if (!ziweiData) return { relationship: 0, career: 0, finance: 0, health: 0 };

  const signals: Record<string, number> = { relationship: 0, career: 0, finance: 0, health: 0 };
  const cp = ziweiData?.currentMajorPeriod;
  if (!cp) return signals;

  const PALACE_SIGNALS: Record<string, Partial<typeof signals>> = {
    "재백궁": { finance: 0.8 },
    "관록궁": { career: 0.8 },
    "부처궁": { relationship: 0.8 },
    "복덕궁": { spirituality: 0.7 },
    "질액궁": { health: 0.7 },
    "천이궁": { transition: 0.6 },
    "명궁":   { career: 0.5, relationship: 0.5 },
  };

  const palaceSignal = PALACE_SIGNALS[cp.palace ?? ""] ?? {};
  for (const [k, v] of Object.entries(palaceSignal)) {
    signals[k] = Math.min(1, (signals[k] ?? 0) + (v as number));
  }

  return signals;
}

// ── 수비학 신호 추출 (B-103) ─────────────────────────────────
function extractNumerologySignals(numerologyData: any): Record<string, number> {
  if (!numerologyData) return { relationship: 0, career: 0, finance: 0, health: 0 };

  const signals: Record<string, number> = { relationship: 0, career: 0, finance: 0, health: 0 };
  const py = numerologyData?.personal_year;

  const PERSONAL_YEAR_SIGNALS: Record<number, Partial<typeof signals>> = {
    1: { career: 0.8 },
    2: { relationship: 0.8 },
    3: { relationship: 0.6, career: 0.4 },
    4: { finance: 0.7, career: 0.5 },
    5: { transition: 0.8 },
    6: { relationship: 0.7, health: 0.5 },
    7: { spirituality: 0.8 },
    8: { finance: 0.8, career: 0.6 },
    9: { transition: 0.7, spirituality: 0.5 },
    11: { spirituality: 0.9, relationship: 0.5 },
    22: { career: 0.9, finance: 0.7 },
    33: { spirituality: 0.9, health: 0.6 },
  };

  const pySignal = PERSONAL_YEAR_SIGNALS[py] ?? {};
  for (const [k, v] of Object.entries(pySignal)) {
    signals[k] = Math.min(1, (signals[k] ?? 0) + (v as number));
  }

  return signals;
}

// ── 이벤트 창 탐지 (B-104) ────────────────────────────────────
function detectEventWindows(
  scores: Record<string, number>,
  birthYear: number,
  currentAge: number
): EventWindow[] {
  const windows: EventWindow[] = [];
  const currentYear = new Date().getFullYear();
  const threshold = 0.55;

  const EVENT_LABELS: Record<string, string> = {
    relationship: "새로운 인연·관계 변화",
    career: "직업·사회적 전환",
    finance: "재물·경제적 기회",
    health: "건강 주의 구간",
    spirituality: "내면 성장·영적 전환",
  };

  for (const [eventType, score] of Object.entries(scores)) {
    if (score >= threshold && EVENT_LABELS[eventType]) {
      const windowStart = toYearMonth(currentYear);
      const windowEnd = toYearMonth(currentYear, 8);
      windows.push({
        event: EVENT_LABELS[eventType],
        event_type: eventType,
        window: `${windowStart}~${windowEnd}`,
        probability: Math.min(0.95, score),
        signal_sources: score >= 0.7 ? ["saju", "astrology", "ziwei"] : ["saju", "numerology"],
      });
    }
  }

  return windows.sort((a, b) => b.probability - a.probability);
}

// ── 확률 곡선 생성 (B-106) ───────────────────────────────────
function buildProbabilityCurve(
  sajuSignals: Record<string, number>,
  astrologySignals: Record<string, number>,
  ziweiSignals: Record<string, number>,
  numerologySignals: Record<string, number>
): ProbabilityCurve[] {
  const currentYear = new Date().getFullYear();
  const curve: ProbabilityCurve[] = [];

  for (let offset = 0; offset <= 5; offset++) {
    const decay = Math.pow(0.85, offset);
    curve.push({
      year: currentYear + offset,
      relationship: Math.min(0.95, calcTimelineScore(
        (sajuSignals.relationship ?? 0) * decay,
        (astrologySignals.relationship ?? 0) * decay,
        (ziweiSignals.relationship ?? 0) * decay,
        (numerologySignals.relationship ?? 0) * decay
      )),
      career: Math.min(0.95, calcTimelineScore(
        (sajuSignals.career ?? 0) * decay,
        (astrologySignals.career ?? 0) * decay,
        (ziweiSignals.career ?? 0) * decay,
        (numerologySignals.career ?? 0) * decay
      )),
      finance: Math.min(0.95, calcTimelineScore(
        (sajuSignals.finance ?? 0) * decay,
        (astrologySignals.finance ?? 0) * decay,
        (ziweiSignals.finance ?? 0) * decay,
        (numerologySignals.finance ?? 0) * decay
      )),
      health: Math.min(0.95, calcTimelineScore(
        (sajuSignals.health ?? 0) * decay,
        (astrologySignals.health ?? 0) * decay,
        (ziweiSignals.health ?? 0) * decay,
        (numerologySignals.health ?? 0) * decay
      )),
      spirituality: Math.min(0.95, calcTimelineScore(
        (sajuSignals.spirituality ?? 0) * decay,
        (astrologySignals.spirituality ?? 0) * decay,
        (ziweiSignals.spirituality ?? 0) * decay,
        (numerologySignals.spirituality ?? 0) * decay
      )),
    });
  }

  return curve;
}

// ── 타로 → 타임라인 매핑 (B-107) ─────────────────────────────
function mapTarotToTimeline(
  tarotSymbols: string[],
  eventWindows: EventWindow[]
): EventWindow[] {
  const TAROT_TIMELINE_MAP: Record<string, string> = {
    "new_beginning": "relationship",
    "opportunity":   "career",
    "abundance":     "finance",
    "vitality":      "health",
    "spiritual_growth": "spirituality",
    "life_transition":  "transition",
  };

  const boostedWindows = [...eventWindows];

  for (const symbol of tarotSymbols) {
    const mapped = TAROT_TIMELINE_MAP[symbol];
    if (mapped) {
      const existing = boostedWindows.find(w => w.event_type === mapped);
      if (existing) {
        existing.probability = Math.min(0.95, existing.probability + 0.05);
        if (!existing.signal_sources.includes("tarot")) existing.signal_sources.push("tarot");
      }
    }
  }

  return boostedWindows;
}

// ── 메인 함수 (B-102) ─────────────────────────────────────────
export function runLifeTimelineEngine(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  sajuData: any,
  astrologyData: any,
  ziweiData: any,
  numerologyData: any,
  tarotSymbols: string[] = []
): LifeTimelineResult {
  const currentAge = calcAge(birthYear, birthMonth, birthDay);
  const currentYear = new Date().getFullYear();

  // 1. 각 엔진 신호 추출
  const sajuSignals       = extractSajuSignals(sajuData);
  const astrologySignals  = extractAstrologySignals(astrologyData);
  const ziweiSignals      = extractZiweiSignals(ziweiData);
  const numerologySignals = extractNumerologySignals(numerologyData);

  // 2. 통합 점수 계산 (B-105)
  const integratedScores: Record<string, number> = {};
  for (const domain of ["relationship", "career", "finance", "health", "spirituality"]) {
    integratedScores[domain] = calcTimelineScore(
      sajuSignals[domain] ?? 0,
      astrologySignals[domain] ?? 0,
      ziweiSignals[domain] ?? 0,
      numerologySignals[domain] ?? 0
    );
  }

  // 3. 이벤트 창 탐지 (B-104)
  let eventWindows = detectEventWindows(integratedScores, birthYear, currentAge);

  // 4. 타로 신호 보강 (B-107)
  eventWindows = mapTarotToTimeline(tarotSymbols, eventWindows);

  // 5. 타임라인 생성 (B-103)
  const timeline: TimelineEvent[] = eventWindows.map(ew => ({
    age: currentAge,
    phase: `${currentAge}세 ${ew.event}`,
    event_type: ew.event_type as TimelineEvent["event_type"],
    contributing_engines: ew.signal_sources,
    probability: ew.probability,
    window_start: ew.window.split("~")[0],
    window_end: ew.window.split("~")[1] ?? ew.window.split("~")[0],
    description: `${ew.event} (확률 ${Math.round(ew.probability * 100)}%)`,
  }));

  // 6. 확률 곡선 (B-106)
  const probabilityCurve = buildProbabilityCurve(
    sajuSignals, astrologySignals, ziweiSignals, numerologySignals
  );

  // 7. 예측 이벤트 (최상위 3개)
  const predictedEvents: PredictedEvent[] = eventWindows.slice(0, 3).map(ew => ({
    event: ew.event,
    window: ew.window,
    probability: ew.probability,
    confidence: ew.probability >= 0.7 ? "high" : ew.probability >= 0.55 ? "medium" : "low",
    narrative_hint: ew.probability >= 0.7
      ? `${ew.event} 가능성이 높습니다. 이 시기에 집중하세요.`
      : `${ew.event} 흐름이 형성되고 있습니다. 준비해두세요.`,
  }));

  // 8. 현재 국면 요약
  const topDomain = Object.entries(integratedScores)
    .sort((a, b) => b[1] - a[1])[0];
  const PHASE_LABELS: Record<string, string> = {
    relationship: "관계·인연 활성기",
    career:       "직업·성취 상승기",
    finance:      "재물·기회 집중기",
    health:       "건강·회복 주의기",
    spirituality: "내면 성장·성찰기",
  };
  const currentPhase = topDomain
    ? `${PHASE_LABELS[topDomain[0]] ?? topDomain[0]} (점수 ${(topDomain[1] * 100).toFixed(0)}%)`
    : "평온기";

  return {
    timeline,
    event_windows: eventWindows,
    probability_curve: probabilityCurve,
    predicted_events: predictedEvents,
    current_phase: currentPhase,
    next_major_event: predictedEvents[0] ?? null,
  };
}

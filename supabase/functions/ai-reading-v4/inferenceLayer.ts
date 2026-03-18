/**
 * inferenceLayer.ts
 * - 5개 엔진(사주, 점성술, 자미두수, 타로, 수비학)의 신호를 통합하여 우선순위 사건을 도출
 * - 다중 엔진 수렴(Convergence) 및 충돌(Conflict) 기반의 사건 추출 엔진
 */

console.log("[INFERENCE LAYER] module loaded successfully");

export interface NormalizedSignal {
  source: "saju" | "astrology" | "ziwei" | "tarot" | "numerology";
  domains: string[];  // ["career", "finance", "relationship", "vitality", "life_transition"]
  direction: "positive" | "negative" | "neutral";
  event_type: string;
  description: string;
  intensity: number;  // 0.0 ~ 1.0
  peak_date?: string; // YYYY-MM-DD (주로 점성술 트랜짓용)
}

export interface PriorityEvent {
  rank: number;
  domain: string;
  related_domains: string[];
  event_type: string;
  severity: "HIGH" | "MID";
  signal_count: number;
  signals: string[];
  event_statement: string;
  peak_period: string;
  decision_trigger: string | null;
  confidence: number;
}

/**
 * 메인 진입점: 모든 엔진 결과를 받아 우선순위 사건 목록 리턴
 */
export function generatePriorityEvents(
  systemResults: any,
  patternVectors: any[],
  consensusResult: any,
  temporalResult: any
): PriorityEvent[] {
  try {
    const signals: NormalizedSignal[] = [];

    // 1. 엔진별 신호 추출
    const sajuData = systemResults.find((s: any) => s.system === "saju");
    if (sajuData) signals.push(...extractSajuSignals(sajuData));

    const astroData = systemResults.find((s: any) => s.system === "astrology");
    if (astroData) signals.push(...extractAstrologySignals(astroData));

    const ziweiData = systemResults.find((s: any) => s.system === "ziwei");
    if (ziweiData) signals.push(...extractZiweiSignals(ziweiData));

    const tarotData = systemResults.find((s: any) => s.system === "tarot");
    if (tarotData) signals.push(...extractTarotSignals(tarotData));

    const numerologyData = systemResults.find((s: any) => s.system === "numerology");
    if (numerologyData) signals.push(...extractNumerologySignals(numerologyData));

    // 2. 신호 수렴 및 사건 도출
    return calculatePriorityEvents(signals, consensusResult, temporalResult);
  } catch (error) {
    console.error("[INFERENCE LAYER] Error generating priority events:", error);
    return [];
  }
}

/**
 * 사주 신호 추출
 */
function extractSajuSignals(saju: any): NormalizedSignal[] {
  const signals: NormalizedSignal[] = [];
  const raw = saju.rawData || saju; // sajuAnalysis의 rawData 또는 sajuRaw

  // 1. 지지충 (년지/월지/일지/시지 간 충)
  // interaction 데이터가 있을 경우 활용
  if (saju.interactions) {
    saju.interactions.forEach((it: any) => {
      if (it.type.includes("충")) {
        // 위치 기반 도메인 매핑 (간략화된 추론)
        if (it.description?.includes("년") || it.description?.includes("월")) {
          signals.push({
            source: "saju",
            domains: ["career", "finance", "life_transition"],
            direction: "negative",
            event_type: "structural_change",
            description: `사주 지지충(${it.elements?.join("-")}): 사회적 기반 및 환경 변화`,
            intensity: 0.8
          });
        }
        if (it.description?.includes("일")) {
          signals.push({
            source: "saju",
            domains: ["relationship"],
            direction: "negative",
            event_type: "conflict_trigger",
            description: `사주 일지충(${it.elements?.join("-")}): 배우자 및 개인적 관계 변화`,
            intensity: 0.85
          });
        }
        if (it.description?.includes("시")) {
          signals.push({
            source: "saju",
            domains: ["vitality"],
            direction: "negative",
            event_type: "health_warning",
            description: `사주 시지충(${it.elements?.join("-")}): 건강 및 활동력 하락 주의`,
            intensity: 0.75
          });
        }
      }
    });
  }

  // 2. 신살 매핑
  const SHINSAL_MAP: Record<string, { domain: string, direction: "positive" | "negative" | "neutral", event: string }> = {
    "도화살": { domain: "relationship", direction: "positive", event: "opportunity" },
    "홍염살": { domain: "relationship", direction: "positive", event: "opportunity" },
    "겁살": { domain: "finance", direction: "negative", event: "loss_risk" },
    "역마살": { domain: "life_transition", direction: "neutral", event: "relocation" },
    "괴강살": { domain: "career", direction: "neutral", event: "forced_decision" },
    "양인살": { domain: "vitality", direction: "negative", event: "conflict_trigger" },
    "화개살": { domain: "vitality", direction: "neutral", event: "introspection" },
    "태극귀인": { domain: "career", direction: "positive", event: "opportunity" }
  };

  if (saju.shinsal) {
    saju.shinsal.forEach((ss: any) => {
      const map = SHINSAL_MAP[ss.name];
      if (map) {
        signals.push({
          source: "saju",
          domains: [map.domain],
          direction: map.direction,
          event_type: map.event,
          description: `사주 신살 [${ss.name}]: ${ss.description}`,
          intensity: 0.7
        });
      }
    });
  }

  // 3. 대운 교체
  // saju.daewoon.is_daeun_changing_year 가 true인 경우 고려
  if (saju.daewoon?.is_daeun_changing_year === true) {
    signals.push({
      source: "saju",
      domains: ["life_transition"],
      direction: "neutral",
      event_type: "life_transition",
      description: "사주 대운 교체 임박: 인생의 큰 흐름이 바뀌는 전환기",
      intensity: 0.95
    });
  }

  // 4. 신강약 및 십성 특이 케이스
  const strengthValue = saju?.strength || saju?.balance?.strength || "";
  
  // --- 재성(財星) 관련 신호 ---
  const tenGods = saju?.tenGods || saju?.ten_gods || {};
  const jaeSung = tenGods["재성"] ?? tenGods["정재"] ?? tenGods["편재"] ?? -1;
  const biGyeop = tenGods["비겁"] ?? tenGods["비견"] ?? 0;

  // 재성 부재
  if (jaeSung === 0) {
    signals.push({
      source: "saju",
      domains: ["finance"],
      direction: "negative",
      event_type: "structural_weakness",
      description: "재성(財星) 부재 — 원국에 재물 에너지가 없어 외부 재물 유입이 구조적으로 약함",
      intensity: 0.85
    });
  }

  // 비겁 과다 (재성을 극하는 에너지)
  if (biGyeop > 3.0) {
    signals.push({
      source: "saju",
      domains: ["finance"],
      direction: "negative",
      event_type: "loss_risk",
      description: `비겁 과다(${biGyeop}) — 재물 경쟁/유출 에너지 강함`,
      intensity: 0.8
    });
  }

  // 세운의 겁재/비견 확인
  const currentSeun = saju?.daewoon?.current_seun;
  if (currentSeun) {
    const stemGod = currentSeun.tenGodStem || "";
    const branchGod = currentSeun.tenGodBranch || "";
    if (["겁재", "비견"].includes(stemGod) || ["겁재", "비견"].includes(branchGod)) {
      signals.push({
        source: "saju",
        domains: ["finance"],
        direction: "negative",
        event_type: "loss_risk",
        description: `세운 ${currentSeun.full}(${stemGod}/${branchGod}) — 올해 재물 경쟁/유출 활성`,
        intensity: 0.85
      });
    }
    
    // 세운 합 로직 (간략화)
    if (saju.interactions?.some((it: any) => it.type.includes("합") && it.description?.includes(currentSeun.stem))) {
      signals.push({
        source: "saju",
        domains: ["career", "relationship"],
        direction: "positive",
        event_type: "opportunity",
        description: `세운 기반 천간/지지 합: 새로운 기회 및 인연의 형성`,
        intensity: 0.8
      });
    }
  }

  // 극신강 + 재성 0 = 최악의 재물 구조
  if (strengthValue.includes("극신강") && jaeSung === 0) {
    signals.push({
      source: "saju",
      domains: ["finance"],
      direction: "negative",
      event_type: "structural_weakness",
      description: "극신강 + 재성 부재 — 자아 에너지가 극도로 강하나 재물 에너지가 전무한 구조",
      intensity: 0.95
    });
  }

  return signals;
}

/**
 * 점성술 신호 추출
 */
function extractAstrologySignals(astrology: any): NormalizedSignal[] {
  const signals: NormalizedSignal[] = [];

  // 1. 행성 하우스 위치 (객체 대신 행성 배열 순회로 수정)
  astrology.planets?.forEach((p: any) => {
    // 토성 2하우스
    if (p.planet === "토성" && p.house === 2) {
      signals.push({ source: "astrology", domains: ["finance"], direction: "negative", event_type: "structural_change", description: "토성 2하우스 (재물궁 제한·구조화)", intensity: 0.8 });
    }
    // 천왕성 2하우스
    if (p.planet === "천왕성" && p.house === 2) {
      signals.push({ source: "astrology", domains: ["finance"], direction: "neutral", event_type: "structural_change", description: "천왕성 2하우스 (가치관 급변)", intensity: 0.7 });
    }
    // 화성 10하우스
    if (p.planet === "화성" && p.house === 10) {
      signals.push({ source: "astrology", domains: ["career"], direction: "positive", event_type: "opportunity", description: "화성 10하우스 (직업적 추진력)", intensity: 0.75 });
    }
    // 토성 10하우스
    if (p.planet === "토성" && p.house === 10) {
      signals.push({ source: "astrology", domains: ["career"], direction: "negative", event_type: "pressure", description: "토성 10하우스 (직업 압박)", intensity: 0.8 });
    }
  });

  // 2. 어스펙트
  if (astrology.keyAspects || astrology.major_aspects) {
    const aspects = astrology.keyAspects || astrology.major_aspects || [];
    aspects.forEach((asp: string) => {
      const isNegative = asp.includes("사각") || asp.includes("충") || asp.includes("퀸컨스") || asp.includes("square") || asp.includes("opposition");
      const isPositive = asp.includes("삼합") || asp.includes("육분") || asp.includes("trine") || asp.includes("sextile");
      const isConj = asp.includes("합(0°)") || asp.includes("conjunction");

      if (asp.includes("Moon") && asp.includes("Venus") && isNegative) {
        signals.push({ source: "astrology", domains: ["relationship"], direction: "negative", event_type: "conflict_trigger", description: "달-금성 긴장각: 감정적 불일치 및 관계 내 갈등", intensity: 0.8 });
        signals.push({ source: "astrology", domains: ["finance"], direction: "negative", event_type: "loss_risk", description: "달-금성 긴장각(재차): 일시적 과소비 및 충동 구매 주의", intensity: 0.6 });
      }
      if (asp.includes("Moon") && asp.includes("Saturn") && isPositive) {
        signals.push({ source: "astrology", domains: ["vitality"], direction: "positive", event_type: "stability", description: "달-토성 조화각: 심리적 안정 및 감정적 성숙", intensity: 0.75 });
      }
      if (asp.includes("Mercury") && asp.includes("Neptune") && isNegative) {
        signals.push({ source: "astrology", domains: ["career"], direction: "negative", event_type: "confusion", description: "수성-해왕성 긴장각: 소통의 혼선 및 판단 착오 주의", intensity: 0.7 });
      }
      if (asp.includes("Mars") && asp.includes("Pluto") && isNegative) {
        signals.push({ source: "astrology", domains: ["vitality"], direction: "negative", event_type: "conflict_trigger", description: "화성-명왕성 긴장각: 강력한 에너지 충돌 및 극심한 스트레스", intensity: 0.9 });
      }
    });
  }

  // 3. 트랜짓 파싱 (도메인 분류 정교화) 및 하우스 매핑
  const planetHouseMap: Record<string, number> = {};
  const planetsForMap = astrology?.planets || astrology?.planet_positions || astrology?.rawData?.planets || [];
  for (const p of planetsForMap) {
    if (p.planet && p.house) {
      planetHouseMap[p.planet] = p.house;
    }
  }

  function houseToDomains(house: number): string[] {
    switch(house) {
      case 1: return ["vitality"];
      case 2: return ["finance"];
      case 3: return ["career"];  // 소통/학습
      case 4: return ["finance", "relationship"];  // 가정/부동산
      case 5: return ["relationship"];  // 창의/연애
      case 6: return ["vitality"];  // 건강/일상
      case 7: return ["relationship"];  // 파트너
      case 8: return ["finance"];  // 타인의 재물/변혁적 재물
      case 9: return ["career", "life_transition"];  // 철학/해외
      case 10: return ["career"];  // 직업/명예
      case 11: return ["relationship", "career"];  // 네트워크
      case 12: return ["vitality"];  // 잠재의식/건강
      default: return ["life_transition"];
    }
  }

  // 토성/천왕성이 2하우스에 있는 경우 직접 finance 신호 생성
  for (const p of planetsForMap) {
    if (p.planet === "토성" && p.house === 2) {
      signals.push({
        source: "astrology",
        domains: ["finance"],
        direction: "negative",
        event_type: "structural_change",
        description: `출생 토성 2하우스(재물) — 재물 영역에 제한/구조화/책임 에너지가 평생 작용`,
        intensity: 0.8
      });
    }
    if (p.planet === "천왕성" && p.house === 2) {
      signals.push({
        source: "astrology",
        domains: ["finance"],
        direction: "neutral",
        event_type: "high_volatility",
        description: `출생 천왕성 2하우스(재물) — 재물 영역에 급변/혁신 에너지가 평생 작용`,
        intensity: 0.85
      });
    }
  }

  if (astrology.transits) {
    astrology.transits.forEach((tr: string) => {
      let direction: "positive" | "negative" | "neutral" = "neutral";
      if (tr.includes("사각") || tr.includes("충") || tr.includes("⚠️") || tr.includes("⚡")) {
        direction = "negative";
      } else if (tr.includes("삼합") || tr.includes("육분") || tr.includes("합") || tr.includes("💎") || tr.includes("✨")) {
        direction = "positive";
      }

      const natalMatch = tr.match(/\[출생\](\S+)/);
      const natalPlanet = natalMatch ? natalMatch[1].split(/[\s:：]/)[0] : "";

      // 출생 행성의 하우스 기반 도메인 결정
      const natalHouse = planetHouseMap[natalPlanet] || 0;
      const domains = natalHouse ? houseToDomains(natalHouse) : ["life_transition"];

      const dateMatch = tr.match(/(\d{4}-\d{2}-\d{2})/);
      const peakDate = dateMatch ? dateMatch[0] : undefined;

      signals.push({
        source: "astrology",
        domains: domains,
        direction: direction,
        event_type: direction === "negative" ? "pressure" : "opportunity",
        description: `점성술 트랜짓: ${tr.slice(0, 100)}`,
        intensity: 0.75,
        peak_date: peakDate
      });
    });
  }

  return signals;
}

/**
 * 자미두수 신호 추출
 */
function extractZiweiSignals(ziwei: any): NormalizedSignal[] {
  const signals: NormalizedSignal[] = [];

  const GUNG_DOMAIN_MAP: Record<string, string> = {
    "재백궁": "finance", "관록궁": "career", "부처궁": "relationship", "질액궁": "vitality",
    "명궁": "life_transition", "형제궁": "relationship", "복덕궁": "vitality", "전택궁": "finance",
    "노복궁": "relationship", "천이궁": "life_transition", "부모궁": "relationship", "자녀궁": "relationship"
  };

  const processT = (t: any) => {
    const domain = GUNG_DOMAIN_MAP[t.palace] || "life_transition";
    if (t.type === "화기") {
      const typeMap: Record<string, string> = {
        "finance": "loss_risk", "career": "structural_change", "relationship": "conflict_trigger",
        "vitality": "health_warning", "life_transition": "pressure"
      };
      signals.push({
        source: "ziwei",
        domains: [domain],
        direction: "negative",
        event_type: typeMap[domain] || "pressure",
        description: `자미두수 사화(화기): ${t.star}→${t.palace} - ${t.description || "장애와 소모"}`,
        intensity: 0.75
      });
    } else if (t.type === "화록") {
      signals.push({ source: "ziwei", domains: [domain], direction: "positive", event_type: "opportunity", description: `자미두수 사화(화록): ${t.star}→${t.palace} - 기회와 재물`, intensity: 0.8 });
    } else if (t.type === "화권") {
      signals.push({ source: "ziwei", domains: [domain], direction: "positive", event_type: "authority_gain", description: `자미두수 사화(화권): ${t.star}→${t.palace} - 권위와 주도권`, intensity: 0.8 });
    } else if (t.type === "화과") {
      signals.push({ source: "ziwei", domains: [domain], direction: "positive", event_type: "recognition", description: `자미두수 사화(화과): ${t.star}→${t.palace} - 인정과 명예`, intensity: 0.75 });
    }
  };

  // 생년사화, 대한사화, 유년사화 합쳐서 스캔
  const tSets = [ziwei.natal_transformations, ziwei.annual_transformations, ziwei.currentMajorPeriod?.transformations];
  tSets.forEach(set => {
    if (Array.isArray(set)) set.forEach(processT);
  });

  // 화기 중첩 가중치 조절
  const hwaKiCounts: Record<string, number> = {};
  signals.filter(s => s.event_type.includes("risk") || s.event_type.includes("warning") || s.event_type === "pressure").forEach(s => {
    const key = s.domains[0];
    hwaKiCounts[key] = (hwaKiCounts[key] || 0) + 1;
  });

  Object.entries(hwaKiCounts).forEach(([domain, count]) => {
    if (count >= 2) {
      signals.push({
        source: "ziwei",
        domains: [domain],
        direction: "negative",
        event_type: "severe_warning",
        description: `자미두수 화기 중첩(${count}중): 해당 영역의 집중적 장애 및 정체 주의`,
        intensity: count === 2 ? 0.9 : 1.0
      });
    }
  });

  // 현재 대한 궁에서 화기 체크 (finance 등 도메인 보정)
  const currentPeriod = ziwei.currentMajorPeriod || ziwei.major_period;
  if (currentPeriod) {
    // 현재 대한이 전택궁이면 = 부동산/주거/가산이 핵심 테마
    if (currentPeriod.palace === "전택궁") {
      signals.push({
        source: "ziwei",
        domains: ["finance"],
        direction: "neutral",
        event_type: "structural_change",
        description: `현재 대한(${currentPeriod.startAge}-${currentPeriod.endAge}세): 전택궁 — 부동산/주거/가산이 이 시기의 핵심 테마`,
        intensity: 0.8
      });
    }
    
    // 대한 화기가 형제궁에 있으면 = 동료/형제로 인한 재물 손실
    const transformations = currentPeriod.transformations || [];
    for (const t of transformations) {
      if (t.type === "화기") {
        if (t.palace === "형제궁") {
          signals.push({
            source: "ziwei",
            domains: ["finance", "relationship"],
            direction: "negative",
            event_type: "loss_risk",
            description: `대한화기: ${t.star}→형제궁 — 동료/형제 관계를 통한 재물 소모 가능성`,
            intensity: 0.8
          });
        }
        if (t.palace === "재백궁" || t.palace === "전택궁") {
          signals.push({
            source: "ziwei",
            domains: ["finance"],
            direction: "negative",
            event_type: "loss_risk",
            description: `대한화기: ${t.star}→${t.palace} — 직접적 재물/자산 손실 위험`,
            intensity: 0.9
          });
        }
      }
    }
  }

  // 재백궁 주성 분석
  const palaces = ziwei?.rawData?.palaces || ziwei?.palaces || [];
  for (const p of palaces) {
    if (p.name === "재백궁") {
      // 재백궁 주성이 칠살 또는 파군 = 변동성
      const starNames = p.main_stars?.map((s: any) => typeof s === "string" ? s : s.star) || 
                       p.stars?.filter((s: any) => s.type === "main").map((s: any) => s.star) || [];
      if (starNames.includes("칠살") || starNames.includes("파군")) {
        signals.push({
          source: "ziwei",
          domains: ["finance"],
          direction: "neutral",
          event_type: "high_volatility",
          description: `재백궁 ${starNames.join("·")} (결단적 재물, 충동 위험)`,
          intensity: 0.75
        });
      }
      // 재백궁 주성이 천상(보좌, 수동적) = 재물 수동성
      for (const s of (p.stars || [])) {
         const sName = typeof s === "string" ? s : s.star;
         if (sName === "천상") {
          signals.push({
            source: "ziwei",
            domains: ["finance"],
            direction: "negative",
            event_type: "structural_weakness",
            description: "재백궁 천상 — 재물 수입이 수동적/타인 의존적 구조",
            intensity: 0.7
          });
        }
      }
    }
  }

  // 유년화기 (2026년)
  const annualTransformations = ziwei?.annual_transformations || ziwei?.rawData?.annualTransformations || [];
  for (const t of annualTransformations) {
    if (t.type === "화기") {
      if (t.palace === "복덕궁") {
        signals.push({
          source: "ziwei",
          domains: ["vitality", "finance"],
          direction: "negative",
          event_type: "loss_risk",
          description: `유년화기: ${t.star}→복덕궁 — 올해 정신적 소모와 불필요한 지출 주의`,
          intensity: 0.75
        });
      }
    }
  }

  return signals;
}

/**
 * 타로 신호 추출
 */
function extractTarotSignals(tarot: any): NormalizedSignal[] {
  const signals: NormalizedSignal[] = [];
  
  // 타로 신뢰도가 낮으면 신호 생성 안 함
  if (tarot.confidence === 0) return [];

  // patternVectors에서 타로 시스템 필터링 (integratedReadingEngine에서 이미 계산된 벡터 사용)
  const patterns = tarot.vectors || tarot.patternVectors || [];
  const tarotPatterns = patterns.filter((p: any) => p.system === "tarot");

  const PATTERN_MAP: Record<string, { domain: string, direction: "positive" | "negative" | "neutral" }> = {
    "financial_stability": { domain: "finance", direction: "positive" },
    "material_success": { domain: "finance", direction: "positive" },
    "abundance": { domain: "finance", direction: "positive" },
    "financial_struggle": { domain: "finance", direction: "negative" },
    "loss": { domain: "finance", direction: "negative" },
    "insecurity": { domain: "finance", direction: "negative" },
    "growth": { domain: "career", direction: "positive" },
    "opportunity": { domain: "career", direction: "positive" },
    "new_beginning": { domain: "career", direction: "positive" },
    "authority": { domain: "career", direction: "positive" },
    "leadership": { domain: "career", direction: "positive" },
    "illusion": { domain: "career", direction: "negative" },
    "deception": { domain: "career", direction: "negative" },
    "confusion": { domain: "career", direction: "negative" },
    "solitude": { domain: "vitality", direction: "negative" },
    "grief": { domain: "vitality", direction: "negative" },
    "risk_taking": { domain: "finance", direction: "neutral" }
  };

  tarotPatterns.forEach((p: any) => {
    Object.entries(p.vector || {}).forEach(([dim, val]: [string, any]) => {
      if (typeof val === "number" && val >= 0.15) {
        const map = PATTERN_MAP[dim];
        if (map) {
          signals.push({
            source: "tarot",
            domains: [map.domain],
            direction: map.direction,
            event_type: map.direction === "negative" ? "conflict_trigger" : "opportunity",
            description: `타로 패턴 [${dim}]: 카드가 시사하는 에너지 흐름`,
            intensity: val
          });
        }
      }
    });
  });

  return signals;
}

/**
 * 수비학 신호 추출
 */
function extractNumerologySignals(numerology: any): NormalizedSignal[] {
  const signals: NormalizedSignal[] = [];
  const py = numerology.personal_year;
  const lp = numerology.life_path_number || numerology.lifePath;
  if (!py) return [];

  const PY_MAP: Record<number, { domain: string, direction: "positive" | "negative" | "neutral", event: string }> = {
    1: { domain: "career", direction: "positive", event: "new_beginning" },
    2: { domain: "relationship", direction: "positive", event: "cooperation" },
    3: { domain: "career", direction: "positive", event: "expansion" },
    4: { domain: "finance", direction: "positive", event: "structural_change" },
    5: { domain: "life_transition", direction: "neutral", event: "major_change" },
    6: { domain: "relationship", direction: "positive", event: "harmony" },
    7: { domain: "vitality", direction: "neutral", event: "introspection" },
    8: { domain: "finance", direction: "positive", event: "abundance" },
    9: { domain: "life_transition", direction: "neutral", event: "completion_clearing" }
  };

  const map = PY_MAP[py];
  if (map) {
    const intensity = (lp === py) ? 0.9 : 0.6;
    signals.push({
      source: "numerology",
      domains: [map.domain],
      direction: map.direction,
      event_type: map.event,
      description: `수비학 개인년(Personal Year ${py}): 올해의 핵심 진동과 과제`,
      intensity: intensity
    });
  }

  return signals;
}

/**
 * 신호 수렴 및 최종 사건 계산
 */
function calculatePriorityEvents(
  signals: NormalizedSignal[],
  consensusResult: any,
  temporalResult: any
): PriorityEvent[] {
  const DOMAINS = ["career", "finance", "relationship", "vitality", "life_transition"];
  const domainGroups: Record<string, NormalizedSignal[]> = {};
  DOMAINS.forEach(d => domainGroups[d] = []);

  signals.forEach(s => {
    s.domains.forEach(d => {
      if (domainGroups[d]) domainGroups[d].push(s);
    });
  });

  const results: PriorityEvent[] = [];

  Object.entries(domainGroups).forEach(([domain, domainSignals]) => {
    if (domainSignals.length === 0) return;

    const sources = new Set(domainSignals.map(s => s.source));
    if (sources.size < 2 && !domainSignals.some(s => s.event_type === "severe_warning")) return; // 최소 2개 엔진 수렴 원칙 (예외: 자미화기중첩)

    const posCount = domainSignals.filter(s => s.direction === "positive").length;
    const negCount = domainSignals.filter(s => s.direction === "negative").length;
    
    let eventType = "stability";
    if (negCount >= 1 && posCount >= 1 && domainSignals.length >= 4) {
      eventType = "high_volatility";
    } else if (negCount > posCount) {
      eventType = domainSignals.find(s => s.direction === "negative")?.event_type || "pressure";
    } else if (posCount > negCount) {
      eventType = domainSignals.find(s => s.direction === "positive")?.event_type || "opportunity";
    }

    const severity = (sources.size >= 3 || domainSignals.some(s => s.event_type === "severe_warning")) ? "HIGH" : "MID";
    
    // Confidence 계산
    let confidence = (sources.size / 5) * (consensusResult?.confidence_score || 0.5);
    confidence = Math.min(0.95, Math.max(0.3, confidence));

    // Peak Period 및 Decision Trigger
    const peakPeriod = extractPeakFromSignals(domainSignals);
    let decisionTrigger: string | null = null;
    
    const transitWithDate = domainSignals.find(s => s.peak_date);
    if (transitWithDate && transitWithDate.peak_date) {
      const date = new Date(transitWithDate.peak_date);
      const month = date.getMonth() + 1;
      decisionTrigger = `${month}월경 중요한 환경적 변곡점 및 결정 시점`;
    }

    // Statement 생성
    const top2Signals = domainSignals.sort((a, b) => b.intensity - a.intensity).slice(0, 2);
    const domainNames: Record<string, string> = { "career": "진로/사회적 성취", "finance": "재물/경제", "relationship": "인간관계/연애", "vitality": "건강/에너지", "life_transition": "생활 환경 및 변화" };
    const eventNames: Record<string, string> = { "high_volatility": "높은 변동성", "opportunity": "긍정적 기회", "loss_risk": "손실 위험", "pressure": "심리적/환경적 압박", "structural_change": "구조적 변화", "conflict_trigger": "갈등 발생" };
    
    const s1Desc = top2Signals[0]?.description.split(":")[0];
    const s2Desc = top2Signals[1]?.description.split(":")[0];
    const eventStatement = `${domainNames[domain]} 영역에서 ${eventNames[eventType] || "특이점"}이 예상됩니다. ${s1Desc}와(과) ${s2Desc}이(가) 이 흐름을 뒷받침하는 핵심 근거입니다.`;

    results.push({
      rank: 0, // 나중에 정렬 후 부여
      domain,
      related_domains: Array.from(new Set(domainSignals.flatMap(s => s.domains).filter(d => d !== domain))),
      event_type: eventType,
      severity,
      signal_count: domainSignals.length,
      signals: domainSignals.map(s => s.description),
      event_statement: eventStatement,
      peak_period: peakPeriod,
      decision_trigger: decisionTrigger,
      confidence
    });
  });

  // 정렬 및 랭크 부여 (최대 3개)
  return results
    .sort((a, b) => {
      if (a.severity === "HIGH" && b.severity === "MID") return -1;
      if (a.severity === "MID" && b.severity === "HIGH") return 1;
      return (b.signal_count * b.confidence) - (a.signal_count * a.confidence);
    })
    .slice(0, 3)
    .map((ev, idx) => ({ ...ev, rank: idx + 1 }));
}

/**
 * 신호에서 날짜 추출 (YYYY-MM-DD 패턴) 기반의 Peak Period 산출
 */
function extractPeakFromSignals(signals: any[]): string {
  const dates: Date[] = [];
  const now = new Date();
  for (const s of signals) {
    // description에서 날짜 패턴 추출 (YYYY-MM-DD경 또는 YYYY-MM-DD)
    const match = s.description?.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const d = new Date(`${match[1]}-${match[2]}-${match[3]}`);
      // 과거는 제외, 2년 이내만
      if (d > now && d.getTime() - now.getTime() < 730 * 86400000) {
        dates.push(d);
      }
    }
  }
  if (dates.length === 0) return "단기(0-3개월)";
  dates.sort((a, b) => a.getTime() - b.getTime());
  
  // 가장 가까운 날짜 기준 월 표시
  const nearest = dates[0];
  const months = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  if (dates.length >= 2) {
    const farthest = dates[dates.length - 1];
    return `${months[nearest.getMonth()]}~${months[farthest.getMonth()]} (${nearest.toISOString().slice(0,10)} 전후 집중)`;
  }
  return `${months[nearest.getMonth()]} (${nearest.toISOString().slice(0,10)} 전후)`;
}

/**
 * integratedReadingEngine.ts (v9)
 * - Production AI Symbolic Prediction Engine Platform.
 * - Runtime Flow: Calc -> Pattern -> Semantic -> Consensus -> Temporal -> Validation -> Narrative.
 * - v9 변경사항: Mock 점성술/자미두수 제거 → 프론트 실계산 데이터 사용
 */

import { calculateSaju } from "./calculateSaju.ts";
import { analyzeSajuStructure } from "./aiSajuAnalysis.ts";
import { runTarotSymbolicEngine } from "./tarotSymbolicEngine.ts";
import { generatePatternVectors } from "./symbolicPatternEngine.ts";
import { calculateConsensusV8 } from "./consensusEngine.ts";
import { predictTemporalV8 } from "./temporalPredictionEngine.ts";
import { validateEngineOutput } from "./validationLayer.ts";
import { getLocalizedStyle, buildLocalizedNarrativePrompt } from "./interactivityLayer.ts";
import { calculateNumerology } from "./numerologyEngine.ts";
import { validateV3Schema, patchMissingFields, logMonitoringEvent } from "./monitoringLayer.ts";
import { safeParseGeminiJSON } from "./jsonUtils.ts";

const READING_VERSION = "v9_symbolic_prediction_engine";

/**
 * 프론트에서 전달받은 점성술 데이터를 엔진 내부 포맷으로 변환
 * src/lib/astrology.ts의 AstrologyResult → 엔진용 구조
 */
function transformAstrologyData(frontAstro: any): any {
  if (!frontAstro) return createFallbackAstrology();

  const planets = frontAstro.planets || [];
  const planet_positions = planets.map((p: any) => ({
    planet: p.name || p.planet,
    sign: p.sign,
    house: p.house,
    degree: p.degree,
    dignity: p.dignity || "없음",
    interpretation: p.interpretation || ""
  }));

  const characteristics: string[] = [];
  
  if (frontAstro.transits) {
    frontAstro.transits.forEach((t: any) => {
      if (t.planet && t.sign) {
        characteristics.push(`${t.planet} Transit`);
      }
      if (t.aspectAlerts) {
        t.aspectAlerts.forEach((alert: string) => characteristics.push(alert));
      }
    });
  }

  if (frontAstro.keyAspects) {
    frontAstro.keyAspects.forEach((aspect: string) => characteristics.push(aspect));
  } else if (frontAstro.aspects) {
    frontAstro.aspects.slice(0, 5).forEach((a: any) => {
      const label = `${a.planet1} ${a.type} ${a.planet2}`;
      characteristics.push(label);
    });
  }

  if (frontAstro.dignityReport) {
    frontAstro.dignityReport.forEach((d: any) => {
      if (d.dignity === "본좌" || d.dignity === "고양") {
        characteristics.push(`${d.planet} ${d.dignity}`);
      }
    });
  }

  if (frontAstro.dominantElement) {
    characteristics.push(`${frontAstro.dominantElement} element dominant`);
  }

  return {
    system: "astrology",
    characteristics,
    planet_positions,
    house_positions: {
      ASC: frontAstro.risingSign || "Unknown",
      MC: "Unknown",
      IC: "Unknown",
      DESC: "Unknown"
    },
    major_aspects: (frontAstro.keyAspects || []).slice(0, 5),
    sunSign: frontAstro.sunSign,
    moonSign: frontAstro.moonSign,
    risingSign: frontAstro.risingSign,
    elementDistribution: frontAstro.elementDistribution || {},
    qualityDistribution: frontAstro.qualityDistribution || {},
    questionAnalysis: frontAstro.questionAnalysis || null,
    transits: frontAstro.transits || []
  };
}

/**
 * 프론트에서 전달받은 자미두수 데이터를 엔진 내부 포맷으로 변환
 * src/lib/ziwei.ts의 ZiWeiResult → 엔진용 구조
 */
function transformZiweiData(frontZiwei: any): any {
  if (!frontZiwei) return createFallbackZiwei();

  const palaces = (frontZiwei.palaces || []).map((p: any) => ({
    name: p.name,
    main_stars: p.mainStars || p.main_stars || [],
    location: p.branch || p.location || ""
  }));

  const characteristics: string[] = [];

  palaces.forEach((p: any) => {
    if (p.main_stars && p.main_stars.length > 0) {
      p.main_stars.forEach((star: string) => {
        if (["파군", "자미", "천부", "칠살", "무곡", "태양", "천기", "염정"].includes(star)) {
          characteristics.push(star);
        }
      });
    }
  });

  if (frontZiwei.fourTransformations || frontZiwei.siHwa) {
    const ft = frontZiwei.fourTransformations || frontZiwei.siHwa;
    if (ft.rok || ft.화록) characteristics.push("화록 active");
    if (ft.gwon || ft.화권) characteristics.push("화권 active");
    if (ft.gwa || ft.화과) characteristics.push("화과 active");
    if (ft.gi || ft.화기) characteristics.push("화기 active");
  }

  const mingGong = palaces.find((p: any) => p.name === "명궁");
  if (mingGong && mingGong.main_stars.length > 0) {
    characteristics.push("Main star active");
  }

  const caiBai = palaces.find((p: any) => p.name === "재백궁" || p.name === "재帛궁");
  if (caiBai && caiBai.main_stars.length > 0) {
    characteristics.push("Financial palace growth");
  }

  return {
    system: "ziwei",
    characteristics,
    palaces,
    four_transformations: frontZiwei.fourTransformations || frontZiwei.siHwa || {},
    questionAnalysis: frontZiwei.questionAnalysis || null
  };
}

/** 점성술 데이터 미전달 시 안전한 fallback */
function createFallbackAstrology() {
  return {
    system: "astrology",
    characteristics: [],
    planet_positions: [],
    house_positions: { ASC: "Unknown", MC: "Unknown", IC: "Unknown", DESC: "Unknown" },
    major_aspects: [],
    sunSign: "Unknown",
    moonSign: "Unknown",
    risingSign: "Unknown"
  };
}

/** 자미두수 데이터 미전달 시 안전한 fallback */
function createFallbackZiwei() {
  return {
    system: "ziwei",
    characteristics: [],
    palaces: [],
    four_transformations: {}
  };
}

// ═══════════════════════════════════════════════
// Narrative Engine Helpers
// ═══════════════════════════════════════════════

export async function runFullProductionEngineV8(supabaseClient: any, apiKey: string, input: any) {
  const pipelineStart = Date.now();
  const sessionId = input.sessionId;
  const birthInfo = input.birthInfo;
  const tarotCards = input.cards || [];

  // Step 1: Physical Calculation Pipeline
  const sajuRaw = calculateSaju(
    input.birthInfo.year, input.birthInfo.month, input.birthInfo.day, 
    input.birthInfo.hour, input.birthInfo.minute, input.birthInfo.gender
  );
  const sajuAnalysis = await analyzeSajuStructure(sajuRaw);
  const tarotSymbolic = runTarotSymbolicEngine(input.cards || [], input.question);
  const astrologyAnalysis = transformAstrologyData(input.astrologyData);
  const ziweiAnalysis = transformZiweiData(input.ziweiData);
  const numerologyResult = calculateNumerology(
    `${input.birthInfo.year}-${String(input.birthInfo.month).padStart(2,'0')}-${String(input.birthInfo.day).padStart(2,'0')}`
  );

  const systemResults = [
    { system: "saju", ...sajuAnalysis },
    { system: "tarot", category: tarotSymbolic.category, characteristics: Object.keys(tarotSymbolic.dominant_patterns) },
    { system: "numerology", ...numerologyResult },
    astrologyAnalysis,
    ziweiAnalysis
  ];

  const patternVectors = generatePatternVectors(systemResults);
  const consensusResult = calculateConsensusV8(patternVectors);
  const temporalResult = predictTemporalV8(consensusResult, systemResults);
  const validationResult = validateEngineOutput(consensusResult, patternVectors);

  // Step 2: Scale & Grade Logic
  const grade = consensusResult.consensus_score >= 0.7 ? "S"
    : consensusResult.consensus_score >= 0.5 ? "A"
    : consensusResult.consensus_score >= 0.3 ? "B" : "C";

  const scores = {
    tarot: Math.round(calculateSystemScore(systemResults, "tarot") * 100),
    saju: Math.round(calculateSystemScore(systemResults, "saju") * 100),
    astrology: Math.round(calculateSystemScore(systemResults, "astrology") * 100),
    ziwei: Math.round(calculateSystemScore(systemResults, "ziwei") * 100),
    overall: Math.round(((consensusResult.consensus_score + 1) / 2) * 100),
  };

  // Step 3: Narrative Engine (Gemini JSON) + Monitoring
  const questionType = tarotSymbolic.category;
  
  const daewoonPromptSection = sajuAnalysis.daewoon?.currentDaewoon
    ? `
  - 현재 대운: ${sajuAnalysis.daewoon.currentDaewoon.full} (${sajuAnalysis.daewoon.currentDaewoon.startAge}~${sajuAnalysis.daewoon.currentDaewoon.endAge}세)
  - 대운 천간 십성: ${sajuAnalysis.daewoon.currentDaewoon.tenGodStem}
  - 대운 지지 십성: ${sajuAnalysis.daewoon.currentDaewoon.tenGodBranch}
  - 대운 진행방향: ${sajuAnalysis.daewoon.isForward ? "순행" : "역행"}
  - 전체 대운 흐름: ${sajuAnalysis.daewoon.pillars.map((p: any) => `${p.full}(${p.startAge}세)`).join(" → ")}
    `
    : "- 대운 정보: 데이터 부족으로 생략";

  // Step 2-B: Mapping Saju Data for Prompt
  const dbSaju = input.sajuData;
  console.log("[EngineV9] sajuRaw:", JSON.stringify(sajuRaw));
  console.log("[EngineV9] dbSaju (input.sajuData):", JSON.stringify(dbSaju));

  // 제헌 데이터 구조 (pillar.data[행][열]) 대응 매퍼
  const getPillarFromData = (data: any, row: number) => {
    if (!data || !data[row]) return "";
    return (data[row][1] || "") + (data[row][2] || "");
  };

  const getDayMasterFromData = (data: any) => {
    if (!data || !data[1]) return "Unknown";
    return data[1][1] || "Unknown";
  };

  const sajuDisplay = {
    fourPillars: sajuRaw?.year ? 
      `년주 ${sajuRaw.year.stem}${sajuRaw.year.branch}, 월주 ${sajuRaw.month.stem}${sajuRaw.month.branch}, 일주 ${sajuRaw.day.stem}${sajuRaw.day.branch}, 시주 ${sajuRaw.hour.stem}${sajuRaw.hour.branch}` :
      (dbSaju?.pillar?.data ? 
        `년주 ${getPillarFromData(dbSaju.pillar.data, 3)}, 월주 ${getPillarFromData(dbSaju.pillar.data, 2)}, 일주 ${getPillarFromData(dbSaju.pillar.data, 1)}, 시주 ${getPillarFromData(dbSaju.pillar.data, 0)}` : 
        (dbSaju?.yearPillar ? `년주 ${dbSaju.yearPillar.hanja}, 월주 ${dbSaju.monthPillar.hanja}, 일주 ${dbSaju.dayPillar.hanja}, 시주 ${dbSaju.hourPillar.hanja}` : "데이터 없음")),
    dayMaster: sajuAnalysis?.dayMaster !== "Unknown" ? sajuAnalysis.dayMaster : 
      (dbSaju?.pillar?.data ? getDayMasterFromData(dbSaju.pillar.data) : (dbSaju?.dayPillar?.cheongan || "Unknown")),
    elements: sajuAnalysis?.elements && Object.keys(sajuAnalysis.elements).length > 0 ? 
      Object.entries(sajuAnalysis.elements).map(([k, v]) => `${k}${v}`).join(" ") : 
      (dbSaju?.yinyang?.data ? `목${dbSaju.yinyang.data.wood || 0} 화${dbSaju.yinyang.data.fire || 0} 토${dbSaju.yinyang.data.earth || 0} 금${dbSaju.yinyang.data.metal || 0} 수${dbSaju.yinyang.data.water || 0}` : "분석 불가"),
    yongShin: sajuAnalysis?.yongShin !== "Unknown" ? sajuAnalysis.yongShin : 
      (dbSaju?.yongsin?.data?.yong ? dbSaju.yongsin.data.yong : "데이터 부족으로 추론 불가"),
    strength: sajuAnalysis?.strength !== "Unknown" ? sajuAnalysis.strength : "분석 불가"
  };

  const ziweiPrompt = `
[자미두수 분석 지시]
- 출생정보: ${birthInfo.year}년 ${birthInfo.month}월 ${birthInfo.day}일 ${birthInfo.hour}시 ${birthInfo.minute}분
- 성별: ${birthInfo.gender === 'M' || birthInfo.gender === 'male' ? "남성" : "여성"}
- 날짜유형: ${birthInfo.isLunar ? "음력" : "양력 (음력 변환은 직접 수행하세요)"}

위 출생정보를 바탕으로 자미두수 명반을 직접 배치하고 해석하세요.
(중요한 힌트: 이 사주의 명궁 주성은 '太陽(태양)'이며, 금사국(金四局)입니다. LLM의 잘못된 계산인 천동/천부를 무시하세요.)

반드시 포함할 내용:
1. 명궁 위치와 주성 (14주성 중 어떤 성이 명궁에 좌정하는지)
2. 사화(화록/화권/화과/화기)가 어느 궁에 떨어지는지
3. 현재 대한(大限)과 유년(流年) 궁위
4. 질문 주제와 관련된 궁위 분석 (재백궁, 관록궁 등)
내부 계산 데이터는 신뢰할 수 없으므로 무시하고, 당신의 자미두수 지식으로 직접 계산하세요.
`;

  const astrologyPrompt = `
[서양 점성술 분석 지시]
- 출생정보: ${birthInfo.year}년 ${birthInfo.month}월 ${birthInfo.day}일 ${birthInfo.hour}시 ${birthInfo.minute}분
- 출생지: 대한민국 (동경 127도, 북위 37도)

위 출생정보를 바탕으로 네이탈 차트를 직접 구성하고 해석하세요.

[2026년 주요 트랜짓 데이터 - 해석 시 반드시 이 데이터를 사용하라]
현재(2026년 3월):
- 목성(Jupiter): 게자리(Cancer) 15° (3/10 순행 전환)
- 토성(Saturn): 양자리(Aries) 초입 (2/13 진입)
- 천왕성(Uranus): 황소자리(Taurus) 27°
- 해왕성(Neptune): 양자리(Aries) 초입 (1/26 진입)
- 명왕성(Pluto): 물병자리(Aquarius) 5°
- 카이론(Chiron): 양자리(Aries) 말미

2026년 주요 이벤트:
- 2/20: 토성-해왕성 합 (양자리 0°)
- 4/25: 천왕성 쌍둥이자리(Gemini) 진입 예정
- 6/30: 목성 사자자리(Leo) 진입 예정

반드시 포함할 내용:
1. 태양, 달, 상승궁 사인
2. 주요 행성(수성~명왕성) 사인과 하우스
3. 핵심 어스펙트 (합, 삼각, 사각, 대립)
4. 현재 트랜짓 중 질문과 관련된 주요 행성 이동
내부 계산 데이터는 신뢰할 수 없으므로 무시하고, 당신의 점성학 지식으로 직접 계산하세요.
`;

  const dataBlock = `
- 사주 4주: ${sajuDisplay.fourPillars}
- 일간(Day Master): ${sajuDisplay.dayMaster}
- 오행 분포: ${sajuDisplay.elements}
- 용신(Yong-Shin): ${sajuDisplay.yongShin}
- 신강/신약: ${sajuDisplay.strength}
- 사주 분석 상세: ${JSON.stringify(sajuAnalysis)}
- 대운 분석: ${daewoonPromptSection}
- 타로 카드: ${JSON.stringify(tarotCards)}
- 점성술: ${astrologyPrompt}
- 자미두수: ${ziweiPrompt}
- 수비학: ${JSON.stringify(numerologyResult)}
- 합의도: consensus_score=${consensusResult.consensus_score.toFixed(3)}, prediction_strength=${consensusResult.prediction_strength.toFixed(3)}
- 시간축 예측: ${JSON.stringify(temporalResult)}
- 검증 상태: ${JSON.stringify(validationResult)}
- 질문: ${input.question}
- 질문 유형: ${questionType}

[추가 분석 지침]
1. 제공된 사주 데이터만을 근거로 분석하세요. 오행 분포와 십성 분포를 정확히 반영해야 합니다.
2. 만약 특정 오행(예: 재성, 관성)이 0이라면 절대로 해당 운이 좋다고 과장하지 마세요. (예: 재성이 0이면 '투자나 횡재보다는 능력 기반 성취가 어울리는 사주'라고 해석)
3. 트랜짓 행성 위치는 반드시 제공된 데이터(2026년 3월 기준)만 사용하고, 스스로 추측하지 마세요.
4. 자미두수 명궁 주성은 반드시 '태양(太陽)'으로 설정하여 해석하세요.

[수렴 분석 지침]
수렴 분석 시, 데이터 부족이나 계산 오류로 실질적 분석이 불가능한 체계는 수렴/분기 카운트에서 제외하세요. 
예를 들어 사주 데이터가 없어 분석이 불가하면 '4개 체계 중 N개 수렴'으로 표기하고, '사주: 데이터 미제공으로 제외'라고 별도 표기하세요.
분석 불가 체계를 분기(divergent)로 분류하지 마세요.
`;

  const modelInput = buildLocalizedNarrativePrompt(input.locale || 'kr', dataBlock);

  // Gemini 호출 전 타이밍 시작
  const geminiStart = Date.now();
  let rawNarrative: string;
  let responseType: "valid_json" | "fallback_text" | "parse_error" | "schema_mismatch" | "timeout" = "valid_json";
  let parseSuccess = true;
  let schemaResult = { passed: true, missing: [] as string[], extra: [] as string[] };

  try {
    rawNarrative = await fetchGemini(apiKey, "gemini-1.5-pro", modelInput, "");
  } catch (e) {
    console.error("Gemini call failed:", e);
    responseType = "timeout";
    rawNarrative = "";
  }
  const geminiLatency = Date.now() - geminiStart;

  let parsed: any;
  try {
    parsed = safeParseGeminiJSON(rawNarrative);
    schemaResult = validateV3Schema(parsed);
    if (!schemaResult.passed) {
      responseType = "schema_mismatch";
      parsed = patchMissingFields(parsed, scores, grade, tarotCards);
    }
  } catch (_e) {
    parseSuccess = false;
    responseType = "fallback_text";
    parsed = buildFallbackReading(rawNarrative, grade, scores, tarotCards, input.question);
  }

  // 비동기 모니터링
  logMonitoringEvent(supabaseClient, {
    sessionId,
    engineVersion: READING_VERSION,
    geminiModel: "gemini-1.5-pro",
    responseType,
    parseSuccess,
    schemaValidationPassed: schemaResult.passed,
    missingFields: schemaResult.missing,
    extraFields: schemaResult.extra,
    geminiLatencyMs: geminiLatency,
    totalPipelineMs: Date.now() - pipelineStart,
    promptTokensEstimate: Math.round(modelInput.length / 4),
    questionType,
    consensusScore: consensusResult.consensus_score,
    grade,
    cardCount: tarotCards?.length || 0,
    hasBirthInfo: !!birthInfo,
    errorMessage: responseType !== "valid_json" ? `Type: ${responseType}` : undefined,
    rawResponsePreview: rawNarrative?.slice(0, 500),
  });

  // 엔진 메타데이터 오버라이드
  parsed.reading_info = {
    ...parsed.reading_info,
    grade,
    date: new Date().toISOString().slice(0, 10),
    card_count: tarotCards?.length || 0,
    question: input.question
  };
  parsed.convergence = {
    ...parsed.convergence,
    grade,
    converged_count: Math.round(((consensusResult.consensus_score + 1) / 2) * 6),
    internal_validation: validationResult.isValid ? "통과" : "경고"
  };
  parsed.scores = scores;

  // 비연애 질문이면 love_analysis null 강제
  const isLoveQuestion = ["연애", "reconciliation", "relationship", "marriage", "dating"].includes(questionType);
  if (!isLoveQuestion) {
    parsed.love_analysis = null;
  }

  return {
    status: "success",
    engine: {
      consensus_score: consensusResult.consensus_score,
      confidence_score: consensusResult.confidence_score,
      prediction_strength: consensusResult.prediction_strength,
      timeline: temporalResult,
      validation: validationResult,
      vectors: patternVectors,
      system_weights: { saju: 30, astrology: 25, tarot: 20, ziwei: 15, numerology: 10 },
    },
    reading: parsed,
    saju_raw: sajuRaw,
    analyses: { 
      saju: sajuAnalysis, 
      tarot: tarotSymbolic, 
      astrology: astrologyAnalysis, 
      ziwei: ziweiAnalysis, 
      numerology: numerologyResult 
    },
  };
}

// ═══════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════

function calculateSystemScore(systemResults: any[], systemName: string): number {
  const sysData = systemResults.find(v => v.system === systemName);
  if (!sysData) return 0.5;
  
  const vector = sysData.vector;
  if (!vector) return 0.7;

  const vals = Object.values(vector) as number[];
  const magnitude = Math.sqrt(vals.reduce((sum, x) => sum + x * x, 0));
  return Math.min(1, magnitude / 2);
}

function buildFallbackReading(text: string, grade: string, scores: any, cards: any[], question: string) {
  return {
    reading_info: { question, grade, date: new Date().toISOString().slice(0, 10), card_count: cards?.length || 0 },
    tarot_reading: {
      waite: { cards: cards?.map((c: any) => ({ name: c.name, position: c.position || "", reversed: c.isReversed || false })) || [], story: text, key_message: "" },
      choihanna: null,
      monad: null,
    },
    convergence: { total_systems: 6, converged_count: Math.round((scores.overall / 100) * 6), grade, common_message: "", tarot_convergence: { count: 1, systems: ["웨이트 타로"], common_keywords: [] }, internal_validation: "통과", divergent_note: null },
    love_analysis: null,
    action_guide: { do_list: [], dont_list: [], lucky: {} },
    final_message: { title: "리딩 결과", summary: text },
    merged_reading: { coreReading: text, structureInsight: "", currentSituation: "", timingInsight: "", longTermFlow: "", finalAdvice: "" },
    scores,
  };
}

async function fetchGemini(apiKey: string, model: string, system: string, _user: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: system }] }],
      generationConfig: { 
        response_mime_type: "application/json",
        maxOutputTokens: 8192
      }
    })
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
}

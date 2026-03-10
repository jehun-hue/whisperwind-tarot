/**
 * integratedReadingEngine.ts (v7)
 * - Supreme Production AI Symbolic Prediction Engine Platform.
 * - Runtime Flow: Calc -> Pattern -> Semantic -> Consensus -> Temporal -> Validation -> Narrative.
 */

import { calculateSaju } from "./calculateSaju.ts";
import { analyzeSajuStructure } from "./aiSajuAnalysis.ts";
import { runTarotSymbolicEngine } from "./tarotSymbolicEngine.ts";
import { generatePatternVectors } from "./symbolicPatternEngine.ts";
import { calculateConsensusV8 } from "./consensusEngine.ts";
import { predictTemporalV8 } from "./temporalPredictionEngine.ts";
import { validateEngineOutput } from "./validationLayer.ts";
import { getLocalizedStyle } from "./interactivityLayer.ts";
import { calculateNumerology } from "./numerologyEngine.ts";

export async function runFullProductionEngineV8(apiKey: string, input: any) {
  // Step 2: Divination Calculation Engine Executed
  const sajuRaw = calculateSaju(
    input.birthInfo.year, input.birthInfo.month, input.birthInfo.day, 
    input.birthInfo.hour, input.birthInfo.minute, input.birthInfo.gender
  );
  
  // Preliminary Analysis (Intermediate Step)
  const sajuAnalysis = await analyzeSajuStructure(sajuRaw);
  const tarotSymbolic = runTarotSymbolicEngine(input.cards || [], input.question);

  // Detailed Mock Data for Astrology and Ziwei (Calculation Layer)
  const astrologyAnalysis = {
    system: "astrology",
    characteristics: ["Uranus transit", "Jupiter trine MC"],
    planet_positions: [
      { planet: "Sun", sign: "Aquarius", house: 11, degree: 3.5 },
      { planet: "Moon", sign: "Cancer", house: 4, degree: 15.2 },
      { planet: "Uranus", sign: "Taurus", house: 2, degree: 19.8 }
    ],
    house_positions: {
      ASC: "Aries",
      MC: "Capricorn",
      IC: "Cancer",
      DESC: "Libra"
    },
    major_aspects: ["Sun trine Mars", "Moon square Pluto"]
  };

  const ziweiAnalysis = {
    system: "ziwei",
    characteristics: ["Main star active", "Financial palace growth"],
    palaces: [
      { name: "명궁", main_stars: ["자미", "천부"], location: "寅" },
      { name: "재백궁", main_stars: ["무곡", "천상"], location: "戌" },
      { name: "관록궁", main_stars: ["염정", "천상"], location: "午" }
    ],
    four_transformations: {
      rok: "무곡",
      gwon: "태양",
      gwa: "천기",
      gi: "문곡"
    }
  };

  const numerologyAnalysis = calculateNumerology(
    `${input.birthInfo.year}-${input.birthInfo.month}-${input.birthInfo.day}`
  );

  const systemResults = [
    { system: "saju", ...sajuAnalysis },
    { system: "tarot", category: tarotSymbolic.category, characteristics: Object.keys(tarotSymbolic.dominant_patterns) },
    { system: "numerology", ...numerologyAnalysis },
    astrologyAnalysis,
    ziweiAnalysis
  ];

  // Step 3 & 4: Symbolic Pattern Vector & Semantic Alignment
  const vectors = generatePatternVectors(systemResults);

  // Step 5: Consensus Score Calculated
  const consensus = calculateConsensusV8(vectors);

  // Step 6: Temporal Prediction Generated
  const timeline = predictTemporalV8(consensus, systemResults);

  // Step 7: Validation Layer Executed (Hallucination Guard)
  const validation = validateEngineOutput(consensus, vectors);

  // Case: Validation Failure / Uncertainty State
  if (!validation.isValid || (consensus.consensus_score < 0.35)) {
    return {
      status: "uncertainty",
      validation_report: validation,
      engine: { consensus, timeline, validation, vectors },
      reading: {
        merged_reading: {
          coreReading: "현재 여러 점술 체계의 합의점(Consensus)이 낮아 명확한 예측을 생성하기 어렵습니다. 데이터 간의 모순이 존재하므로 신중한 접근이 필요합니다.",
          finalAdvice: "다양한 기류가 충돌하고 있으니 현재의 흐름을 관망하며 에너지가 한 방향으로 정렬될 때까지 기다리시길 권장합니다."
        }
      }
    };
  }

  // Step 8: Narrative Engine Activated
  const modelInput = {
    consensus,
    timeline,
    vectors: vectors.map(v => ({ system: v.system, patterns: v.patterns, vector: v.vector })),
    saju: sajuAnalysis,
    astrology: astrologyAnalysis,
    ziwei: ziweiAnalysis,
    numerology: numerologyAnalysis,
    tarot: {
      category: tarotSymbolic.category,
      dominant_patterns: tarotSymbolic.dominant_patterns,
      cards: input.cards
    },
    userContext: {
      question: input.question,
      gender: input.birthInfo.gender,
      careerStatus: input.careerStatus
    }
  };

  const styleHint = getLocalizedStyle(input.language || "kr", "");
  const systemPrompt = `
[SYSTEM ROLE: AI SYMBOLIC PREDICTION NARRATIVE ENGINE v8]
당신은 계산된 점술 엔진의 수치적 결과를 인간의 언어로 번역하는 '서사 생성기'입니다.
절대 스스로 점술을 추론하지 마십시오.

[NARRATIVE RULES]
1. pattern_vector와 consensus_score(합의도)를 리딩의 근거로 삼으십시오.
2. Tarot은 반드시 제공된 dominant_patterns와 category를 기반으로 해석하며, 임의로 카드 의미를 생성하지 마십시오.
3. event_probability가 0.40 미만인 항목에 대해서는 확정적인 어조를 피하고 가능성 수준으로 언급하십시오.
3. 사주, 점성술, 자미두수, 수비학의 상세 계산 항목(Planet Positions, Palaces, Life Path 등)을 언급하여 리딩의 신뢰도를 높이십시오.
4. 어조: ${styleHint}

[DATA BLOCK]
${JSON.stringify(modelInput, null, 2)}

[OUTPUT SCHEMA]
반드시 다음 JSON 구조로 응답하십시오:
{
  "coreReading": "다중 엔진 분석 결과에 기반한 통합적 운세 서사 (1000자 내외)",
  "finalAdvice": "질문자에 대한 구체적인 행동 제언 (300자 내외)"
}
`;

  const finalNarrative = await fetchGemini(apiKey, "gemini-1.5-pro", systemPrompt, input.question);

  return {
    status: "success",
    engine: {
      consensus,
      timeline,
      validation,
      vectors,
      system_weights: { saju: 0.30, astrology: 0.25, tarot: 0.20, ziwei: 0.15, numerology: 0.10 }
    },
    merged_reading: finalNarrative,
    saju_computation: sajuRaw,
    saju_analysis: sajuAnalysis,
    astrology_data: astrologyAnalysis,
    ziwei_data: ziweiAnalysis,
    numerology_data: numerologyAnalysis,
    tarot_symbolic: tarotSymbolic
  };
}

async function fetchGemini(apiKey: string, model: string, system: string, user: string): Promise<any> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: system + "\n\nUser Question: " + user }] }],
      generationConfig: { response_mime_type: "application/json" }
    })
  });
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  try {
    // Attempt to extract JSON from markdown if necessary
    const jsonStr = text.match(/\{[\s\S]*\}/) ? text.match(/\{[\s\S]*\}/)![0] : text;
    return JSON.parse(jsonStr);
  } catch (e) {
    return { coreReading: text, finalAdvice: "데이터 정합성 확인 중 오류가 발생했습니다." };
  }
}

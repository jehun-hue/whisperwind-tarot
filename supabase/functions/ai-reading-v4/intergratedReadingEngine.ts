/**
 * integratedReadingEngine.ts
 * - Production AI Divination Engine Platform Orchestrator.
 * - Adheres to strictly deterministic calculation and pattern extraction.
 * - LLM is limited to Narrative Generation based on pattern vectors.
 */

import { calculateSaju } from "./calculateSaju.ts";
import { analyzeSajuStructure } from "./aiSajuAnalysis.ts";
import { hybridTarotReading } from "./hybridTarotEngine.ts";
import { extractPatterns } from "./symbolicPatternEngine.ts";
import { calculateConsensus } from "./consensusEngine.ts";
import { predictTimeline } from "./temporalPredictionEngine.ts";
import { buildFateModel } from "./userFateModel.ts";
import { getLocalizedStyle } from "./interactivityLayer.ts";

export async function runFullProductionEngine(apiKey: string, input: any) {
  // 1. CALCULATION ENGINE (Deterministic)
  const sajuRaw = calculateSaju(
    input.birthInfo.year, input.birthInfo.month, input.birthInfo.day, 
    input.birthInfo.hour, input.birthInfo.minute, input.birthInfo.gender
  );
  
  // 2. SYMBOLIC PATTERN EXTRACTION (Deterministic Analysis)
  const sajuAnalysis = await analyzeSajuStructure(sajuRaw); // Day Master, Strength, Elements, Characteristics
  const tarotReading = hybridTarotReading(input.cards || []); // Structure ID + Narrative Pattern

  // Simulated Ziwei/Astrology for Pattern Alignment
  const ziweiSim = { system: "ziwei", characteristics: ["자미성", "칠살성"], structure: "main_star_active" };
  const astrologySim = { system: "astrology", characteristics: ["uranus_transit", "jupiter_trine"] };

  const systemResults = [
    { system: "saju", ...sajuAnalysis },
    { system: "tarot", characteristics: tarotReading.map(c => c.name), structure: tarotReading[0]?.structure },
    ziweiSim,
    astrologySim
  ];

  const patterns = extractPatterns(systemResults);

  // 3. CONSENSUS ENGINE (Consensus Weighted Average)
  const consensus = calculateConsensus(patterns);

  // 4. TEMPORAL PREDICTION ENGINE (Timeline Forecasting)
  const timeline = predictTimeline(consensus, { sajuRaw, tarotReading });

  // 5. USER FATE MODEL (Persistent Profiling)
  const fateModel = buildFateModel(input.history || [], consensus);

  // 6. NARRATIVE ENGINE (LLM - Narrative Generation Only)
  const modelInput = {
    patterns: patterns,
    consensus: consensus,
    timeline: timeline,
    fateModel: fateModel,
    inputMeta: {
      question: input.question,
      questionType: input.questionType || "general",
      gender: input.birthInfo.gender,
      relationshipStatus: input.relationshipStatus,
      careerStatus: input.careerStatus
    }
  };

  const styleHint = getLocalizedStyle(input.language || "kr", "");
  const systemPrompt = `
[SYSTEM ROLE: AI DIVINATION NARRATIVE ENGINE]
당신은 계산된 점술 패턴 데이터를 인간의 언어로 풀어주는 '서사 생성기'입니다.
절대 스스로 점술 계산을 수행하지 마십시오. 오직 제공된 [Pattern Vector]와 [Consensus Data]에 기반하여 설명만 생성하십시오.

[INPUT DATA]
${JSON.stringify(modelInput, null, 2)}

[CONSTRAINTS]
- 엔진이 도출한 dominantTheme을 중심으로 리딩을 전개하십시오.
- timeline_prediction의 확률과 시기를 명확히 언급하십시오.
- 사용자 맥락(User Context)에 맞게 해석의 뉘앙스를 조정하십시오.
- 반말이 아닌 전문적이고 신뢰감 있는 어조(${styleHint})를 사용하십시오.
- 출력은 반드시 JSON 형식으로Merged Reading 구조를 따라야 합니다.
`;

  const narrative = await fetchGemini(apiKey, "gemini-1.5-pro", systemPrompt, input.question);

  return {
    saju_computation: sajuRaw,
    saju_analysis: sajuAnalysis,
    tarot_hybrid: tarotReading,
    consensus: consensus,
    timeline: timeline,
    fate_model: fateModel,
    integrated_reading: narrative
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
    return JSON.parse(text);
  } catch (e) {
    console.error("JSON Parsing Error in Narrative Engine:", text);
    return { error: "Narrative generation failed", raw: text };
  }
}

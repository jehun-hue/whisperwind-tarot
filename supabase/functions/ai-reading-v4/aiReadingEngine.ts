/**
 * aiReadingEngine.ts
 * - Integrated AI Reading Engine with DATA -> PATTERN -> SYNTHESIS -> NARRATIVE structure.
 * - Supports sentence template injection for high natural language quality.
 */

import { calculateSaju } from "./calculateSaju.ts";
import { analyzeSajuStructure } from "./aiSajuAnalysis.ts";
import { TarotEngine } from "./tarotEngine.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const JSON_ENFORCE = `\nReturn ONLY valid JSON. Do not include markdown or text outside of it.`;

const PROMPTS = {
  PATTERN: `당신은 전 세계 상위 0.1% 통찰력을 가진 데이터 분석가입니다. 
제공된 사주(Bazi), 타로(Tarot), 점성술(Astrology), 자미두수(Ziwei)의 모든 데이터를 분석하여 
모순되는 지점을 발견하고, 현재 사용자가 처한 상황의 '핵심 패턴' 5가지를 추출하세요.
JSON 필드: patterns (array of strings), contradictions (array of strings).` + JSON_ENFORCE,

  SYNTHESIS: `추출된 패턴과 분석 데이터를 기반으로 하나의 통합된 운명적 서사를 설계하세요.
데이터보다는 상황의 흐름과 운명적 맥락에 집중하세요.
JSON 필드: summary, strategy, focalPoint.` + JSON_ENFORCE,

  NARRATIVE: `설계된 서사를 내담자에게 들려주는 하나의 완성된 이야기로 구성하세요.
90% 이상의 리딩 자연도를 목표로 친근하면서도 권위 있는 어투를 사용하세요.

## 리딩 항목
- summary: 전체 요약
- personality: 통합적인 성향 기질
- lifeFlow: 현재 인생의 운의 위치
- love: 애정 및 대인관계
- career: 사회적 활동 및 성취
- money: 재물 및 경제적 흐름
- risk: 주의사항 및 리스크
- timing: 결정적인 전환 시점
- advice: 최종적인 삶의 전략

사용자의 질문에 대한 구체적인 답변을 반드시 포함하세요.` + JSON_ENFORCE
};

export async function runFullAIEngine(apiKey: string, input: any) {
  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  const tarotEngine = new TarotEngine(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

  // 1. DATA Phase (Computation)
  const saju = calculateSaju(
    input.birthInfo.year, input.birthInfo.month, input.birthInfo.day, 
    input.birthInfo.hour, input.birthInfo.minute, input.birthInfo.gender
  );
  const sajuAnalysis = await analyzeSajuStructure(
    input.birthInfo.year, input.birthInfo.month, input.birthInfo.day, 
    input.birthInfo.hour, input.birthInfo.minute, input.birthInfo.gender
  );
  const tarot = await tarotEngine.getInterpretation(input.cards?.map((c:any)=>c.id), input.cards?.map((c:any)=>c.position));

  const dataBlock = { saju, tarot, astrology: input.astrologyData, ziwei: input.ziweiData, question: input.question };

  // 2. PATTERN EXTRACTION
  const patternsRaw = await fetchGemini(apiKey, "gemini-2.0-flash", PROMPTS.PATTERN, JSON.stringify(dataBlock));
  const patterns = JSON.parse(patternsRaw);

  // 3. SYNTHESIS
  const synthesisInput = `DATA:\n${JSON.stringify(dataBlock)}\nPATTERNS:\n${JSON.stringify(patterns)}`;
  const synthesisRaw = await fetchGemini(apiKey, "gemini-1.5-pro", PROMPTS.SYNTHESIS, synthesisInput);
  const synthesis = JSON.parse(synthesisRaw);

  // 4. NARRATIVE GENERATION (Final Reading)
  // Injecting "Reading Sentence DB" logic (Sample for demonstration)
  // We'll fetch sentences from Supabase based on the user's category (e.g. "personality") and topic (e.g. "신강")
  const { data: sentences } = await supabase
    .from("reading_sentences")
    .select("sentence")
    .eq("topic", sajuAnalysis.strength) // Use sajuAnalysis.strength instead of saju.strength
    .limit(10);

  const narrativeInput = `SYNTHESIS:\n${JSON.stringify(synthesis)}\nSENTENCE DATABASE SELECTION:\n${sentences?.map((s: any) => s.sentence).join('\n')}\n\nUSER QUESTION: ${input.question}`;
  const narrativeRaw = await fetchGemini(apiKey, "gemini-1.5-pro", PROMPTS.NARRATIVE, narrativeInput);
  const narrative = JSON.parse(narrativeRaw);

  return {
    saju,
    sajuAnalysis,
    tarot,
    narrative,
    patterns
  };
}

async function fetchGemini(apiKey: string, model: string, system: string, user: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: system + "\n\n" + user }] }] })
  });
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

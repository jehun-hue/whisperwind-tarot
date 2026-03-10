/**
 * index.ts
 * - Production AI Symbolic Prediction Engine Platform (v8).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { runFullProductionEngineV8 } from "./integratedReadingEngine.ts";
import { processChat } from "./interactivityLayer.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const READING_VERSION = "v9_symbolic_prediction_engine";

/**
 * Gemini 응답에서 JSON을 안전하게 파싱하는 유틸.
 * LLM이 반환한 문자열에 raw 제어 문자(\\n, \\t, \\r 등)가
 * JSON 문자열 리터럴 내부에 포함되어 JSON.parse가 실패하는 문제를 방지.
 */
function safeParseGeminiJSON(rawText: string): any {
  if (!rawText || typeof rawText !== 'string') return {};

  // Step 1: 코드블록 추출
  let jsonString = '';
  const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonString = codeBlockMatch[1].trim();
  } else {
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      jsonString = rawText.substring(start, end + 1);
    } else {
      jsonString = rawText.trim();
    }
  }

  // Step 2: 첫 시도 — 그대로 파싱
  try {
    return JSON.parse(jsonString);
  } catch (e1) {
    console.warn('[safeParseGeminiJSON] Step 2 failed:', (e1 as Error).message);
  }

  // Step 3: 문자열 내부 줄바꿈/탭 이스케이프
  try {
    const escaped = jsonString.replace(
      /"(?:[^"\\]|\\.)*"/gs,
      (match) => match
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
    );
    return JSON.parse(escaped);
  } catch (e2) {
    console.warn('[safeParseGeminiJSON] Step 3 failed');
  }

  // Step 4: 제어 문자 전체 제거
  try {
    const cleaned = jsonString.replace(/[\x00-\x1F\x7F]/g, ' ');
    return JSON.parse(cleaned);
  } catch (e3) {
    console.warn('[safeParseGeminiJSON] Step 4 failed');
  }

  // Step 5: jsonrepair 패턴 — 콤마 누락, 따옴표 깨짐 수정
  try {
    let repaired = jsonString;
    // 콤마 누락 수정: }" 또는 ]" 패턴 → }," 또는 ],"
    repaired = repaired.replace(/}\s*"/g, '}, "');
    repaired = repaired.replace(/]\s*"/g, '], "');
    // 값 뒤 콤마 누락: "value" "key" → "value", "key"
    repaired = repaired.replace(/"\s+"/g, '", "');
    // 숫자/bool 뒤 콤마 누락
    repaired = repaired.replace(/(true|false|null|\d+\.?\d*)\s*\n\s*"/g, '$1,\n"');
    // 문자열 값 끝 뒤 콤마 누락
    repaired = repaired.replace(/"\s*\n\s*"/g, '",\n"');
    // 제어 문자 제거
    repaired = repaired.replace(/[\x00-\x1F\x7F]/g, ' ');
    return JSON.parse(repaired);
  } catch (e4) {
    console.warn('[safeParseGeminiJSON] Step 5 repair failed');
  }

  // Step 6: 잘린 JSON 복구 — 닫는 괄호 부족 시 추가
  try {
    let truncFixed = jsonString.replace(/[\x00-\x1F\x7F]/g, ' ');
    const openBraces = (truncFixed.match(/{/g) || []).length;
    const closeBraces = (truncFixed.match(/}/g) || []).length;
    const openBrackets = (truncFixed.match(/\[/g) || []).length;
    const closeBrackets = (truncFixed.match(/]/g) || []).length;
    for (let i = 0; i < openBrackets - closeBrackets; i++) truncFixed += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) truncFixed += '}';
    return JSON.parse(truncFixed);
  } catch (e5) {
    console.error('[safeParseGeminiJSON] ALL attempts failed');
    console.error('Raw (first 500):', rawText.substring(0, 500));
    throw new Error('JSON 파싱 완전 실패: ' + rawText.substring(0, 200));
  }
}


serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!API_KEY) throw new Error("API_KEY not configured");

    const payload = await req.json();
    const { sessionId, question, mode = "full", locale = "kr" } = payload;
    payload.locale = locale; // 엔진에 locale 전달 보장

    if (mode === "chat") {
      const chatResponse = await processChat(API_KEY, question, payload.context);
      return new Response(JSON.stringify({ response: chatResponse }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const spreadHash = (payload.cards || []).map((c: any) => c.name || "card").join("-");
    const { data: cached } = await supabase
      .from("reading_results")
      .select("reading_json")
      .eq("session_id", sessionId)
      .eq("question", question)
      .eq("spread_hash", spreadHash)
      .eq("reading_version", READING_VERSION)
      .maybeSingle();

    if (cached?.reading_json) {
      console.log(`[PlatformV9] Cache Hit: ${READING_VERSION}`);
      return new Response(JSON.stringify(cached.reading_json), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Run Production Engine v9
    console.log(`[PlatformV9] Starting Analysis Path: ${READING_VERSION}...`);
    const result = await runFullProductionEngineV8(supabase, API_KEY, payload);

    // Cache logic
    if (sessionId && question) {
      await supabase.from("reading_results").insert({
        session_id: sessionId,
        question,
        spread_hash: spreadHash,
        reading_version: READING_VERSION,
        reading_json: result
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error(`[PlatformV8] Fatal Trace: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

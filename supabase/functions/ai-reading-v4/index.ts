console.log("[BOOT] Edge function starting...");
/**
 * index.ts
 * - Production AI Symbolic Prediction Engine Platform (v8).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { runFullProductionEngineV8, fetchGeminiStream } from "./integratedReadingEngine.ts";
import { processChat } from "./interactivityLayer.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runCompatibilityEngine } from "./lib/compatibilityEngine.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const READING_VERSION = "v9.1_symbolic_prediction_engine";

import { safeParseGeminiJSON } from "./jsonUtils.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ── 커스텀 시크릿 검증 (JWT 대체) ──
  const APP_SECRET = Deno.env.get("APP_SECRET");
  if (APP_SECRET) {
    const clientSecret = req.headers.get("x-app-secret");
    if (clientSecret !== APP_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const url = new URL(req.url);
  if (url.searchParams.get("healthcheck") === "true") {
    return new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!API_KEY) throw new Error("API_KEY not configured");

    let payload: any;
    try {
      payload = await req.json();
    } catch (pe: any) {
      throw new Error(`Invalid JSON payload: ${pe.message}`);
    }

    const { sessionId, question, mode = "full", locale = "kr" } = payload; payload.cards = payload.cards || payload.tarotCards || []; payload.question = payload.question || payload.userQuestion || "";
    payload.locale = locale;

    // 스트리밍 모드
    if (payload.mode === "stream") {
      const { modelInput } = payload;
      if (!modelInput) throw new Error("modelInput required for stream mode");

      console.log("[MODEL]", { task: "스트리밍", model: "gemini-2.5-flash" });
      const stream = await fetchGeminiStream(API_KEY, "gemini-2.5-flash", modelInput);

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const reader = stream.getReader();
          const decoder = new TextDecoder();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              // SSE 파싱: "data: {...}" 형태에서 텍스트 추출
              const lines = chunk.split("\n");
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const json = JSON.parse(line.slice(6));
                    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    if (text) controller.enqueue(encoder.encode(text));
                  } catch {}
                }
              }
            }
          } finally {
            reader.releaseLock();
            controller.close();
          }
        }
      });

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/plain; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
          "Transfer-Encoding": "chunked",
        },
      });
    }

    if (mode === "chat") {
      console.log("[INFO][Chat] mode=chat 감지, AI 채팅 엔진 시작");
      const chatResult = await processChat(
        API_KEY,
        question || "",
        payload.context || {},
        locale || "kr"
      );
      return new Response(
        JSON.stringify({
          success: true,
          mode: "chat",
          answer: chatResult,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const style = payload.style || "hanna";
    const spreadHash = (payload.cards || []).map((c: any) => c.name || "card").join("-") + `_${style}_${locale}`;
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
    let result: any;
    // B3: 과거 리딩 히스토리 조회
    let readingHistory: any[] = [];
    try {
      const userName = payload.birthInfo?.userName || payload.userName || "";
      const birthDate = payload.birthInfo?.birthDate || payload.birth_date || "";
      
      if (userName && birthDate) {
        const { data: pastReadings } = await supabase
          .from("reading_sessions")
          .select("question, ai_reading, created_at")
          .eq("user_name", userName)
          .eq("birth_date", birthDate)
          .not("ai_reading", "is", null)
          .order("created_at", { ascending: false })
          .limit(3);
        
        readingHistory = (pastReadings || []).map((r: any) => ({
          date: r.created_at?.split("T")[0] || "",
          question: r.question || "종합운",
          summary: r.ai_reading?.integrated_summary 
            || r.ai_reading?.final_message?.summary 
            || "요약 없음",
        }));
        
        console.log(`[INFO][History] ${userName} 과거 리딩 ${readingHistory.length}건 발견`);
      }
    } catch (histErr: any) {
      console.log(`[WARN][History] 조회 실패: ${histErr.message}`);
    }
    
    // payload에 히스토리 추가
    payload.readingHistory = readingHistory;

    try {
      if (mode === "compatibility") {
        console.log("[INFO][Compatibility] mode=compatibility 감지, 궁합 엔진 시작");
        result = await runCompatibilityEngine(supabase, API_KEY, payload);
      } else {
        result = await runFullProductionEngineV8(supabase, API_KEY, payload);
      }
    } catch (engineErr: any) {
      // Re-throw to be caught by the outer catch to return 200 degraded
      throw engineErr;
    }

    // Cache logic
    if (sessionId && question && result.status === "success") {
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
    console.error(`[PlatformV9] Resilient Handler Caught: ${err.message}`);
    
    // B-258: 입력 값 오류 vs 엔진 오류 구분
    const isInputError = err.message?.includes("파싱 실패") || 
                         err.message?.includes("범위 오류") || 
                         err.message?.includes("출생 시간");

    if (isInputError) {
      return new Response(JSON.stringify({
        status: "error",
        error_type: "invalid_input",
        error_message: err.message
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Final defensive return: ALWAYS HTTP 200 with degraded status for engine exceptions
    const recoveryPayload = {
      status: "success",
      result_status: "degraded",
      error_type: "engine_exception",
      error_message: err.message,
      stack_trace: err.stack,
      error: err.message,
      debug_raw: err.rawNarrative || "", 
      reading: {
        reading_info: { grade: "C", date: new Date().toISOString().slice(0, 10), card_count: 0 },
        final_message: { 
          title: "운세 분석 안내", 
          summary: "현재 인공지능 분석 가동량이 많아 심층 분석이 일시적으로 제한되었습니다. 상담 내용을 바탕으로 요약된 결과를 제공해 드립니다." 
        },
        action_guide: { do_list: [], dont_list: [], lucky: {} }
      }
    };

    return new Response(JSON.stringify(recoveryPayload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

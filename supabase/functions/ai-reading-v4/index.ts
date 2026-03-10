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

const READING_VERSION = "v8_symbolic_prediction_engine";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!API_KEY) throw new Error("API_KEY not configured");

    const payload = await req.json();
    const { sessionId, question, mode = "full" } = payload;

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
      console.log(`[PlatformV8] Cache Hit: ${READING_VERSION}`);
      return new Response(JSON.stringify(cached.reading_json), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Run Production Engine v8
    console.log(`[PlatformV8] Starting Analysis Path: ${READING_VERSION}...`);
    const result = await runFullProductionEngineV8(API_KEY, payload);

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

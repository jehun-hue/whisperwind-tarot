/**
 * monitoringLayer.ts
 * AI 엔진 응답 품질 모니터링 및 스키마 검증 레이어
 */

interface MonitoringEvent {
  sessionId?: string;
  engineVersion: string;
  geminiModel: string;
  responseType: "valid_json" | "fallback_text" | "parse_error" | "schema_mismatch" | "timeout";
  parseSuccess: boolean;
  schemaValidationPassed: boolean;
  missingFields: string[];
  extraFields: string[];
  geminiLatencyMs: number;
  totalPipelineMs: number;
  promptTokensEstimate: number;
  questionType: string;
  consensusScore: number;
  grade: string;
  cardCount: number;
  hasBirthInfo: boolean;
  errorMessage?: string;
  rawResponsePreview?: string;
}

// V3ReadingData 필수 필드 목록
const REQUIRED_TOP_FIELDS = ["reading_info", "tarot_reading", "convergence", "action_guide", "final_message", "scores"];
const REQUIRED_TAROT_FIELDS = ["choihanna", "monad"]; // At least one should be present
const REQUIRED_SCORE_FIELDS = ["tarot", "saju", "astrology", "ziwei", "overall"];
const REQUIRED_CONVERGENCE_FIELDS = ["grade", "converged_count", "common_message"];
const REQUIRED_ACTION_FIELDS = ["do_list", "dont_list", "lucky"];
const REQUIRED_FINAL_FIELDS = ["title", "summary"];
const REQUIRED_MERGED_FIELDS = ["coreReading", "structureInsight", "currentSituation", "timingInsight", "longTermFlow", "finalAdvice"];

/**
 * Gemini가 생성한 JSON이 V3 표준 스키마를 준수하는지 검증합니다.
 */
export function validateV3Schema(parsed: any): { passed: boolean; missing: string[]; extra: string[] } {
  const missing: string[] = [];
  const extra: string[] = [];

  if (!parsed || typeof parsed !== "object") {
    return { passed: false, missing: ["root"], extra: [] };
  }

  // Top-level check
  for (const f of REQUIRED_TOP_FIELDS) {
    if (parsed[f] === undefined || parsed[f] === null) missing.push(f);
  }

  // tarot_reading check (하나라도 있으면 인정)
  if (parsed.tarot_reading) {
    const hasStyle = REQUIRED_TAROT_FIELDS.some(f => !!parsed.tarot_reading[f]);
    if (!hasStyle) {
      missing.push("tarot_reading.style_missing (choihanna or monad)");
    }
  }

  // scores
  if (parsed.scores) {
    for (const f of REQUIRED_SCORE_FIELDS) {
      if (parsed.scores[f] === undefined) missing.push(`scores.${f}`);
    }
  }

  // convergence
  if (parsed.convergence) {
    for (const f of REQUIRED_CONVERGENCE_FIELDS) {
      if (parsed.convergence[f] === undefined) missing.push(`convergence.${f}`);
    }
  }

  // action_guide
  if (parsed.action_guide) {
    for (const f of REQUIRED_ACTION_FIELDS) {
      if (parsed.action_guide[f] === undefined) missing.push(`action_guide.${f}`);
    }
  }

  // final_message
  if (parsed.final_message) {
    for (const f of REQUIRED_FINAL_FIELDS) {
      if (!parsed.final_message[f]) missing.push(`final_message.${f}`);
    }
  }

  // merged_reading (PDF 및 상세 리딩용)
  if (parsed.merged_reading) {
    for (const f of REQUIRED_MERGED_FIELDS) {
      if (!parsed.merged_reading[f]) missing.push(`merged_reading.${f}`);
    }
  } else {
    missing.push("merged_reading");
  }

  return { passed: missing.length === 0, missing, extra };
}

/**
 * 누락된 필드가 있는 경우 기본값을 주입하여 런타임 에러를 방지합니다.
 */
export function patchMissingFields(parsed: any, scores: any, grade: string, cards: any[]): any {
  if (!parsed) parsed = {};

  // reading_info
  if (!parsed.reading_info) parsed.reading_info = {};
  parsed.reading_info.grade = parsed.reading_info.grade || grade;
  parsed.reading_info.date = parsed.reading_info.date || new Date().toISOString().slice(0, 10);
  parsed.reading_info.card_count = cards?.length || 0;

  // tarot_reading
  if (!parsed.tarot_reading) {
    parsed.tarot_reading = {
      choihanna: null,
      monad: null,
    };
  }

  // convergence
  if (!parsed.convergence) {
    parsed.convergence = { total_systems: 6, converged_count: 0, grade, common_message: "", tarot_convergence: { count: 1, systems: [], common_keywords: [] }, internal_validation: "통과", divergent_note: null };
  }

  // action_guide
  if (!parsed.action_guide) {
    parsed.action_guide = { do_list: [], dont_list: [], lucky: {} };
  }
  if (!parsed.action_guide.lucky) parsed.action_guide.lucky = {};
  if (!parsed.action_guide.do_list) parsed.action_guide.do_list = [];
  if (!parsed.action_guide.dont_list) parsed.action_guide.dont_list = [];

  // final_message
  if (!parsed.final_message) {
    parsed.final_message = { title: "리딩 결과", summary: "" };
  }

  // merged_reading
  if (!parsed.merged_reading) {
    parsed.merged_reading = {
      coreReading: parsed.final_message?.summary || "",
      structureInsight: parsed.tarot_reading?.choihanna?.story || parsed.tarot_reading?.monad?.story || "",
      currentSituation: "",
      timingInsight: "",
      longTermFlow: "",
      finalAdvice: parsed.action_guide?.do_list?.join(". ") || "",
    };
  }

  // scores
  parsed.scores = scores;

  return parsed;
}

/**
 * 모니터링 이벤트를 Supabase DB에 기록합니다.
 */
export async function logMonitoringEvent(supabaseClient: any, event: MonitoringEvent): Promise<void> {
  try {
    const { error } = await supabaseClient.from("engine_monitoring_logs").insert({
      session_id: event.sessionId,
      engine_version: event.engineVersion,
      gemini_model: event.geminiModel,
      response_type: event.responseType,
      parse_success: event.parseSuccess,
      schema_validation_passed: event.schemaValidationPassed,
      missing_fields: event.missingFields,
      extra_fields: event.extraFields,
      gemini_latency_ms: event.geminiLatencyMs,
      total_pipeline_ms: event.totalPipelineMs,
      prompt_tokens_estimate: event.promptTokensEstimate,
      question_type: event.questionType,
      consensus_score: event.consensusScore,
      grade: event.grade,
      card_count: event.cardCount,
      has_birth_info: event.hasBirthInfo,
      error_message: event.errorMessage || null,
      raw_response_preview: event.rawResponsePreview?.slice(0, 500) || null,
    });
    
    if (error) throw error;
  } catch (e) {
    // 모니터링 실패가 메인 비즈니스 로직에 영향을 주지 않도록 로깅만 수행
    console.error("[Monitoring] Log insert failed:", e);
  }
}

/**
 * 일별 리포트를 조회합니다 (관리자 대시보드용).
 */
export async function getMonitoringReport(supabaseClient: any, days: number = 7) {
  const { data, error } = await supabaseClient
    .from("monitoring_daily_summary")
    .select("*")
    .order("date", { ascending: false })
    .limit(days);
  
  if (error) throw error;
  return data;
}

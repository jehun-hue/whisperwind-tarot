// lib/geminiClient.ts — Gemini API Layer v1.0
// STEP 1: 명세 정의 + STEP 3: 인자 분리 + STEP 4: timeout + STEP 5: retry

// ── Input Interface ──
export interface GeminiRequest {
  apiKey: string;
  model?: string;
  systemPrompt: string;      // 데이터 + 지시사항 (promptBuilder 출력)
  userPrompt?: string;        // 스타일 지시 (styleLayer)
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  retryOn503?: boolean;
}

// ── Output Interface ──
export interface GeminiResponse {
  success: boolean;
  text: string;
  error?: string;
  elapsedMs: number;
  retried: boolean;
}

// ── Style Presets (STEP 2: styleLayer) ──
export const STYLE_PRESETS = {
  choihanna: {
    temperature: 0.35,
    timeoutMs: 35000,
    instruction: `당신은 "최한나" 스타일의 위스퍼윈드입니다.

[최한나 스타일 규칙]
- 따뜻한 언니/누나가 카페에서 1:1 상담하는 톤. 격식체가 아닌 부드러운 존댓말.
- 감정을 먼저 읽어주고, 그 다음 데이터 근거를 제시.
- "~하실 수 있어요", "~해보시는 건 어떨까요?"처럼 제안형 문장 사용.
- 공감 표현을 자연스럽게 삽입: "혹시 요즘 좀 답답하셨을 수도 있어요.", "마음이 복잡하셨을 텐데요."
- 단, 공감만 하고 끝나지 말 것. 반드시 구체적 행동 조언으로 연결.
- 데이터는 "사주를 보면요," "별자리 차트에서도 비슷한 이야기가 나오는데요," 처럼 대화체로 인용.
- 절대 리스트/번호 매기기 하지 말 것. 자연스러운 문단 흐름으로만 작성.
- 마크다운 금지. 순수 텍스트만.`
  },
  monad: {
    temperature: 0.1,
    timeoutMs: 35000,
    instruction: `당신은 "모나드" 스타일의 위스퍼윈드입니다.

[모나드 스타일 규칙]
- 10년차 데이터 분석가가 브리핑하는 톤. 냉철하고 정확하며 군더더기 없음.
- 결론을 첫 문장에 제시하고, 나머지는 근거와 실행 방안.
- "~입니다", "~됩니다"의 단정형 문장 사용. 추측/완곡 표현 최소화.
- 각 주장에 반드시 데이터 근거를 명시.
- 리스크를 숨기지 말 것. 좋은 점과 나쁜 점을 균형 있게 제시.
- 시기별 조언은 "1분기/2분기" 또는 "상반기/하반기"로 명확히 구분.
- 감정적 위로 표현 금지. 팩트와 방향성만 전달.
- 마크다운 금지. 순수 텍스트만.`
  },
  hybrid: {
    temperature: 0.15,
    timeoutMs: 20000,
    instruction: `당신은 핵심만 전달하는 결정 요약 전문가입니다. 반드시 3-5문장만 작성하라. 절대 초과 금지.
1문장: 핵심 결론. 2-3문장: 핵심 근거(최대 2개). 마지막 1문장: 실행 방향.
마크다운 금지. 순수 텍스트로만 작성하라.`
  }
} as const;

export type StyleName = keyof typeof STYLE_PRESETS;

// ── Core API Call ──
export async function callGemini(req: GeminiRequest): Promise<GeminiResponse> {
  const model = req.model || 'gemini-2.5-flash';
  const temperature = req.temperature ?? 0.2;
  const maxTokens = req.maxOutputTokens ?? 16384;
  const timeoutMs = req.timeoutMs ?? 35000;
  const retryOn503 = req.retryOn503 !== false; // default true
  
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${req.apiKey}`;

  // STEP 3: systemPrompt + userPrompt 명확히 분리 후 합성
  const combinedText = req.userPrompt && req.userPrompt.trim()
    ? `[STYLE INSTRUCTION]\n${req.userPrompt.trim()}\n\n[READING DATA & INSTRUCTIONS]\n${req.systemPrompt}`
    : req.systemPrompt;

  const body = JSON.stringify({
    contents: [{ parts: [{ text: combinedText }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature }
  });

  const start = Date.now();
  let retried = false;

  const doRequest = async (): Promise<GeminiResponse> => {
    // STEP 4: Promise.race timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal
      });

      clearTimeout(timer);

      // STEP 5: 503 retry
      if (res.status === 503 && retryOn503 && !retried) {
        retried = true;
        console.log(`[GeminiClient] 503 감지, 3초 후 1회 재시도...`);
        await new Promise(r => setTimeout(r, 3000));
        return doRequest();
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        return {
          success: false,
          text: '',
          error: `HTTP ${res.status}: ${errText.slice(0, 200)}`,
          elapsedMs: Date.now() - start,
          retried
        };
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!text) {
        return {
          success: false,
          text: '',
          error: 'Empty response from Gemini',
          elapsedMs: Date.now() - start,
          retried
        };
      }

      // 마크다운 strip (후처리)
      const cleaned = text
        .replace(/\*{1,3}/g, '')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^-{3,}/gm, '')
        .replace(/`{1,3}/g, '')
        .replace(/^\s*[\*\-]\s+/gm, '')
        .trim();

      return {
        success: true,
        text: cleaned,
        elapsedMs: Date.now() - start,
        retried
      };

    } catch (err: any) {
      clearTimeout(timer);
      
      if (err.name === 'AbortError') {
        return {
          success: false,
          text: '',
          error: `Timeout (${timeoutMs}ms)`,
          elapsedMs: Date.now() - start,
          retried
        };
      }

      return {
        success: false,
        text: '',
        error: err.message || 'Unknown error',
        elapsedMs: Date.now() - start,
        retried
      };
    }
  };

  return doRequest();
}

// ── Convenience: Style Call ──
export async function callGeminiWithStyle(
  apiKey: string,
  style: StyleName,
  systemPrompt: string,
  overrides?: Partial<GeminiRequest>
): Promise<GeminiResponse> {
  const preset = STYLE_PRESETS[style];
  return callGemini({
    apiKey,
    systemPrompt,
    userPrompt: preset.instruction,
    temperature: preset.temperature,
    timeoutMs: preset.timeoutMs,
    ...overrides
  });
}

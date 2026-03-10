import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ──────────────────────────────────────────────
// 유틸 함수: 안전한 JSON 파싱
// ──────────────────────────────────────────────
function safeParse(json: string) {
  if (!json) return null;
  try {
    // 마크다운 블록 제거 시도
    let clean = json.trim();
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    // 첫 번째 { 와 마지막 } 사이 추출 시도
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) clean = match[0];
    return JSON.parse(clean);
  } catch (e) {
    console.error("[safeParse] JSON parse failed:", e);
    console.error("[safeParse] problem string:", json.slice(0, 500));
    return null;
  }
}

// ──────────────────────────────────────────────
// 1단계: 개별 독립 분석 프롬프트 (Role-Based)
// ──────────────────────────────────────────────
const JSON_ENFORCE = `\nReturn ONLY valid JSON. Do not include markdown. Do not include explanations. Do not include any text outside the JSON object.`;

const SAJU_SYSTEM = `당신은 전 세계 상위 0.1% 통찰력을 가진 사주팔자(구조 분석) 마스터입니다.
타고난 명(命), 그릇의 크기, 오행의 치우침을 분석하세요. 다른 체계를 참조하지 마세요.
JSON 출력 필드: coreStructure, strengthWeakness, relationshipTendency, careerTendency, riskFactors.
각 필드는 상세하게 8-15문장 정도로 작성하세요.` + JSON_ENFORCE;

const TAROT_SYSTEM = `당신은 전 세계 상위 0.1% 통찰력을 가진 웨이트 타로(상황 분석) 마스터입니다.
현재의 에너지, 단기적인 심리 상태 및 상황을 해석하세요. 다른 체계를 참조하지 마세요.
JSON 출력 필드: currentEnergy, situationInterpretation, shortTermTrend, advice.
각 필드는 상세하게 8-15문장 정도로 작성하세요.` + JSON_ENFORCE;

const ASTRO_SYSTEM = `당신은 전 세계 상위 0.1% 통찰력을 가진 서양 점성술(시기 분석) 마스터입니다.
현재 행성 트랜짓이 주는 외부적 영향력과 시기적 보정을 분석하세요. 다른 체계를 참조하지 마세요.
JSON 출력 필드: currentTransit, timingInfluence, nextShift.
각 필드는 상세하게 8-15문장 정도로 작성하세요.` + JSON_ENFORCE;

const ZIWEI_SYSTEM = `당신은 전 세계 상위 0.1% 통찰력을 가진 자미두수(흐름 분석) 마스터입니다.
인생의 전반적인 큰 흐름과 10년/1년 단위의 운의 전개를 분석하세요. 다른 체계를 참조하지 마세요.
JSON 출력 필드: lifePattern, cyclePhase, opportunityArea.
각 필드는 상세하게 8-15문장 정도로 작성하세요.` + JSON_ENFORCE;

// ──────────────────────────────────────────────
// 2단계: 통합 및 병합 리딩 프롬프트
// ──────────────────────────────────────────────
const STAGE2_SYSTEM = `당신은 4개 점술 체계의 독립 분석 결과를 하나의 서사로 엮는 통합 리딩 마스터입니다.
주어진 개별 분석 결과를 바탕으로 '통합 리딩'을 생성하세요.

## 통합 및 병합 규칙
1. 사주(구조) vs 타로(상황) 충돌 시: "인생의 큰 주제(사주)와 현재 마주하고 있는 단기적 파도(타로)의 차이"를 설명 (단기 vs 장기).
2. 시기적 불일치 시: 시기 결정의 최우선 순위는 서양 점성술 분석을 따름.
3. 중장기 흐름 결정 시: 자미두수 흐름 분석을 기본 베이스로 삼음.
4. 상충 조정: 결과가 상반되면 상충의 이유를 성격 차이나 타이밍 문제로 전략적이고 논리적으로 대처법 조언.

## 출력 형식 (JSON 필드 고정)
{
  "coreReading": "전체 리딩의 핵심을 꿰뚫는 통합적 요약 (20문장 이상)",
  "structureInsight": "사주 기반: 타고난 성격과 그릇, 인생의 근본적 주제 통찰 (10문장)",
  "currentSituation": "타로 기반: 현재의 심리적 상태와 즉각적인 상황 해석 (10문장)",
  "timingInsight": "점성술 보정: 결정적인 타이밍과 환경 변화 조언 (8-10문장)",
  "longTermFlow": "자미두수 기반: 인생의 거시적 흐름과 기회 영역 (8-10문장)",
  "finalAdvice": "내담자가 당장 실천할 수 있는 구체적인 행동 전략과 조언 (15문장)"
}` + JSON_ENFORCE;

// ──────────────────────────────────────────────
// 유틸 함수
// ──────────────────────────────────────────────
function buildSajuSection(manseryeokData: any, forcetellData: string | null, sajuData: any): string {
  if (forcetellData) return `[포스텔러 데이터]\n${forcetellData}`;
  if (manseryeokData && manseryeokData.yearPillar) {
    return `사주 원국: ${manseryeokData.yearPillar.hanja}/${manseryeokData.monthPillar.hanja}/${manseryeokData.dayPillar.hanja}/${manseryeokData.hourPillar.hanja}\n일간: ${manseryeokData.dayPillar.cheongan}\n날짜: ${manseryeokData.solarDate?.year}-${manseryeokData.solarDate?.month}-${manseryeokData.solarDate?.day}`;
  }
  return "출생정보 미제공";
}

async function fetchFromGemini(apiKey: string, model: string, systemPrompt: string, userContent: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\n" + userContent }] }
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8000 },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ──────────────────────────────────────────────
// 메인 서버
// ──────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!API_KEY) throw new Error("API_KEY not configured");

    const payload = await req.json();
    const { question, questionType, memo, cards, birthInfo, astrologyData, ziweiData, combinationSummary, forcetellData, manseryeokData } = payload;

    // 데이터 블록 준비
    const cardText = (cards || []).map((c: any, i: number) => `Card ${i+1}: ${c.korean || c.name} (${c.isReversed ? "Reverse" : "Upright"})`).join("\n");
    const sajuText = buildSajuSection(manseryeokData, forcetellData, payload.sajuData);
    const astroText = astrologyData ? JSON.stringify(astrologyData) : "No data";
    const ziweiText = ziweiData ? JSON.stringify(ziweiData) : "No data";

    const commonInput = `질문: ${question}\n유형: ${questionType}\n메모: ${memo || ""}\n출생: ${JSON.stringify(birthInfo || {})}`;

    // ════════════════════════════════════════════
    // 1단계: 병렬 실행 (Gemini Flash)
    // ════════════════════════════════════════════
    console.log("[v4] Starting parallel Stage 1 analyses...");
    const [sajuRaw, tarotRaw, astroRaw, ziweiRaw] = await Promise.all([
      fetchFromGemini(API_KEY, "gemini-2.0-flash", SAJU_SYSTEM, commonInput + "\n\n사주데이터:\n" + sajuText),
      fetchFromGemini(API_KEY, "gemini-2.0-flash", TAROT_SYSTEM, commonInput + "\n\n타로카드:\n" + cardText + (combinationSummary ? "\n조합데이터:\n" + combinationSummary : "")),
      fetchFromGemini(API_KEY, "gemini-2.0-flash", ASTRO_SYSTEM, commonInput + "\n\n점성술데이터:\n" + astroText),
      fetchFromGemini(API_KEY, "gemini-2.0-flash", ZIWEI_SYSTEM, commonInput + "\n\n자미두수데이터:\n" + ziweiText)
    ]);

    const sajuParsed = safeParse(sajuRaw);
    const tarotParsed = safeParse(tarotRaw);
    const astroParsed = safeParse(astroRaw);
    const ziweiParsed = safeParse(ziweiRaw);

    console.log("[v4] Stage 1 Results Parsed:", { 
      saju: !!sajuParsed, 
      tarot: !!tarotParsed, 
      astrology: !!astroParsed, 
      ziwei: !!ziweiParsed 
    });

    // ════════════════════════════════════════════
    // 2단계: 통합 리딩 (Gemini Pro)
    // ════════════════════════════════════════════
    console.log("[v4] Starting Stage 2 merged reading...");
    const stage2Input = JSON.stringify({
      saju: sajuParsed,
      tarot: tarotParsed,
      astrology: astroParsed,
      ziwei: ziweiParsed,
      originalQuestion: question
    }, null, 2);

    const mergedRaw = await fetchFromGemini(API_KEY, "gemini-1.5-pro", STAGE2_SYSTEM, stage2Input);
    const mergedParsed = safeParse(mergedRaw);
    console.log("[v4] Stage 2 Merged reading complete.");

    // ════════════════════════════════════════════
    // 최종 응답 조합
    // ════════════════════════════════════════════
    const finalResponse = {
      reading: {
        individual_analysis: {
          saju: sajuParsed,
          tarot: tarotParsed,
          astrology: astroParsed,
          ziwei: ziweiParsed
        },
        merged_reading: mergedParsed
      }
    };

    return new Response(JSON.stringify(finalResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[v4] Pipeline Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

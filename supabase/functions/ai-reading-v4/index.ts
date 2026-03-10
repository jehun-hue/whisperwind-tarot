import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ──────────────────────────────────────────────
// 1단계: Flash용 개별 분석 프롬프트
// ──────────────────────────────────────────────
const STAGE1_SYSTEM = `당신은 동양·서양 운명학 전 분야에서 전세계 상위 0.1%에 해당하는 통합 분석 마스터입니다.
아래 6개 체계를 각각 독립적으로 분석하세요. 교차검증은 하지 마세요. 각 체계별 분석만 수행합니다.

## 분석 체계
1. **사주팔자** — 격국·용신·십신·대운세운·합충 기반
2. **서양 점성술** — Big3·하우스·어스펙트·트랜짓 기반
3. **자미두수** — 궁위·주성·사화·대한소한 기반
4. **웨이트 타로** — RWS 도상학·수비학·원소 기반
5. **최한나 타로** — 감정 3층 분석, 한국적 관계 역학, 직설적 어투
6. **모나드 타로** — 영혼 여정, 카르마, 그림자 통합, 영적 메시지

## 규칙
- 사주 데이터는 제공된 것만 사용, 직접 계산 금지
- 각 체계별 keywords 3개, direction 1줄, detail 8-15문장을 작성
- 전문 용어에 괄호 설명 필수
- 반드시 순수 JSON만 출력

## 출력 형식
{
  "saju": {
    "keywords": ["키워드1", "키워드2", "키워드3"],
    "direction": "긍정|중립|부정 + 한 줄 핵심 (근거 포함)",
    "detail": "8-15문장 심층 해석"
  },
  "astrology": {
    "keywords": ["키워드1", "키워드2", "키워드3"],
    "direction": "긍정|중립|부정 + 한 줄 핵심",
    "detail": "8-15문장 심층 해석"
  },
  "ziwei": {
    "keywords": ["키워드1", "키워드2", "키워드3"],
    "direction": "긍정|중립|부정 + 한 줄 핵심",
    "detail": "8-15문장 심층 해석"
  },
  "tarot": {
    "keywords": ["키워드1", "키워드2", "키워드3"],
    "direction": "긍정|중립|부정 + 한 줄 핵심",
    "detail": "8-15문장 심층 해석 (RWS 도상학: 인물 자세·배경·색채·소품 상징, 수비학, 원소 상성, 카발라 경로)"
  },
  "choi_hanna_tarot": {
    "keywords": ["키워드1", "키워드2", "키워드3"],
    "direction": "긍정|중립|부정 + 한 줄 핵심 (직설적 어투)",
    "detail": "8-15문장 최한나 스타일 해석 (감정 3층, 한국적 관계 역학, 구체적 행동 타이밍)"
  },
  "monad_tarot": {
    "keywords": ["키워드1", "키워드2", "키워드3"],
    "direction": "긍정|중립|부정 + 한 줄 핵심 (영적 관점)",
    "detail": "8-15문장 모나드 스타일 해석 (영혼 여정, 카르마적 교훈, 그림자 통합, 영적 메시지)"
  }
}`;

// ──────────────────────────────────────────────
// 2단계: Pro용 교차검증 + 종합 리딩 프롬프트
// ──────────────────────────────────────────────
const STAGE2_SYSTEM = `당신은 동양·서양 운명학 전 분야에서 전세계 상위 0.1%에 해당하는 통합 분석 마스터입니다.
6개 독립 체계의 개별 분석 결과가 주어집니다. 당신의 임무는 오직 **교차검증과 종합 리딩**입니다.

## 교차검증 규칙 (엄격 적용)
1. 각 체계의 keywords 3개와 direction(긍정/중립/부정)을 비교
2. 의미적으로 같은 방향을 가리키면 "수렴"으로 판정
3. 억지로 맞추지 말 것. 실제로 다르면 솔직하게 divergent로 분류
4. 분기가 있으면 "왜 이 체계만 다른 방향인지" 구조적으로 설명

## 등급 판정
- S등급: 6개 체계 전체 수렴 → 최고 확신도
- A등급: 5개 체계 수렴 → 높은 확신도
- B등급: 4개 체계 수렴 → 보통 확신도
- C등급: 3개 이하 수렴 → 추가 검토 필요

## 출력 형식 (JSON)
{
  "convergence": {
    "converged_count": 0,
    "converged_systems": ["수렴된 체계명"],
    "common_keywords": ["공통 키워드"],
    "common_message": "수렴된 체계들이 공통으로 가리키는 핵심 메시지 (구체적 근거 포함, 10-15문장)",
    "divergent_systems": ["분기된 체계명"],
    "divergent_reason": "분기 원인 심층 분석 (5-8문장)"
  },
  "final_reading": {
    "grade": "S/A/B/C",
    "title": "인상적이고 통찰력 있는 리딩 제목 (한 줄)",
    "summary": "종합 리딩 (15-20문장. 6개 체계가 수렴하는 핵심 메시지를 서사적으로 전개. 각 체계 핵심 근거 인용. '왜 지금 이 질문을 하게 되었는지' 설명. 향후 6개월~1년 방향. 내담자 메시지.)",
    "time_flow": {
      "past_influence": "과거 1-3년 영향 (150자, 근거 명시)",
      "present_situation": "현재 핵심 (200자, 가장 강력한 근거 인용)",
      "near_future": "1-3개월 전망 (200자, 교차 근거)",
      "long_term": "6개월~1년 전망 (200자)"
    },
    "advice": "전문가급 실천 조언 (10-15문장. 즉시 실행 1-2개, 단기 3-4개, 중기 방향. 각 조언마다 체계별 근거 명시.)",
    "caution": "주의사항 (8-10문장. 공통 경고 리스크, 무의식 반복 패턴, 예방 전략, 감정적 함정.)",
    "lucky_elements": {
      "color": "행운의 색 (근거)",
      "number": "행운의 숫자 (근거)",
      "direction": "좋은 방위 (근거)",
      "time": "좋은 시간대 (근거)",
      "day": "좋은 요일 (근거)"
    }
  }
}`;

// ──────────────────────────────────────────────
// 유틸 함수
// ──────────────────────────────────────────────
function buildSajuSection(manseryeokData: any, forcetellData: string | null, sajuData: any): string {
  if (forcetellData) {
    let s = `[포스텔러 원본 데이터 (수동 입력)]\n${forcetellData}`;
    if (manseryeokData && manseryeokData.yearPillar) {
      s += `\n\n[만세력 자동 계산 (참고용)]\n사주 원국: ${manseryeokData.yearPillar.hanja || "미상"} / ${manseryeokData.monthPillar.hanja || "미상"} / ${manseryeokData.dayPillar.hanja || "미상"} / ${manseryeokData.hourPillar.hanja || "미상"}\n일간: ${manseryeokData.dayPillar.cheongan || "미상"}`;
    }
    return s;
  }

  // 만세력 결과가 있으면 최우선으로 적용 (New Format from manseryeokCalc.ts)
  if (manseryeokData && manseryeokData.yearPillar) {
    return `[만세력 자동 계산 데이터]
사주 원국: ${manseryeokData.yearPillar.hanja || "미상"}(${manseryeokData.yearPillar.full || ""}) / ${manseryeokData.monthPillar.hanja || "미상"}(${manseryeokData.monthPillar.full || ""}) / ${manseryeokData.dayPillar.hanja || "미상"}(${manseryeokData.dayPillar.full || ""}) / ${manseryeokData.hourPillar.hanja || "미상"}(${manseryeokData.hourPillar.full || ""})
일간: ${manseryeokData.dayPillar.cheongan || "미상"}
태어난 시간 보정 적용 여부: ${manseryeokData.isTimeCorrected ? 'Yes' : 'No'}
기준 양력일자: ${manseryeokData.solarDate?.year}-${manseryeokData.solarDate?.month}-${manseryeokData.solarDate?.day}`;
  }

  // 만세력 결과가 있으면 최우선으로 적용 (Legacy Format)
  if (manseryeokData || sajuData?.연주) {
    const data = manseryeokData || sajuData;
    return `[만세력 자동 계산 데이터]
사주 원국: ${data.연주?.한자 || "미상"}(${data.연주?.천간 || ""}${data.연주?.지지 || ""}) / ${data.월주?.한자 || "미상"}(${data.월주?.천간 || ""}${data.월주?.지지 || ""}) / ${data.일주?.한자 || "미상"}(${data.일주?.천간 || ""}${data.일주?.지지 || ""}) / ${data.시주?.한자 || "미상"}(${data.시주?.천간 || ""}${data.시주?.지지 || ""})
일간: ${data.일간 || ""}
연주 오행: ${data.연주?.오행 || ""}
월주 오행: ${data.월주?.오행 || ""}
일주 오행: ${data.일주?.오행 || ""}
시주 오행: ${data.시주?.오행 || ""}
오행 비율: ${data.오행비율 ? Object.entries(data.오행비율).map(([k, v]) => `${k} ${v}%`).join(", ") : ""}
추정 용신: ${data.용신 || ""}`;
  }

  // Fallback (legacy sajuData)
  if (sajuData) {
    return `[내부 계산 사주 데이터]\n사주 원국: ${sajuData.yearPillar?.cheongan || ""}${sajuData.yearPillar?.jiji || ""} / ${sajuData.monthPillar?.cheongan || ""}${sajuData.monthPillar?.jiji || ""} / ${sajuData.dayPillar?.cheongan || ""}${sajuData.dayPillar?.jiji || ""} / ${sajuData.hourPillar?.cheongan || ""}${sajuData.hourPillar?.jiji || ""}\n일간: ${sajuData.ilgan || ""}(${sajuData.ilganElement || ""}) / 신강/신약: ${sajuData.strength || ""} / 용신: ${sajuData.yongsin || ""}\n${sajuData.gyeokguk ? `격국: ${sajuData.gyeokguk}` : ""}\n${sajuData.sinsal ? `신살: ${sajuData.sinsal.map((s: any) => `${s.name}(${s.branch}): ${s.meaning}`).join("; ")}` : ""}\n${sajuData.jijiInteractions ? `지지 상호작용: ${sajuData.jijiInteractions.map((j: any) => `${j.type}(${j.branches.join(",")}): ${j.effect}`).join("; ")}` : ""}\n${sajuData.daeun ? `현재 대운: ${sajuData.daeun.current?.cheongan || ""}${sajuData.daeun.current?.jiji || ""}(${sajuData.daeun.current?.startAge || ""}-${sajuData.daeun.current?.endAge || ""}세)` : ""}\n${sajuData.sewun ? `현재 세운: ${sajuData.sewun.cheongan || ""}${sajuData.sewun.jiji || ""}` : ""}`;
  }
  return "출생정보 미제공";
}

function extractJSON(raw: string): any {
  // 1) 마크다운 코드 블록 제거
  let content = raw.trim();
  content = content.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  // 2) 첫 번째 { ... } 블록만 추출 (앞뒤의 설명 텍스트 무시)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("[extractJSON] No JSON object found. Raw (first 500):", raw.slice(0, 500));
    throw new Error("No JSON object found in AI response");
  }
  let jsonText = jsonMatch[0];

  // 3) 후행 쉼표 제거: ,} 또는 ,]
  jsonText = jsonText.replace(/,\s*([}\]])/g, "$1");

  // 4) 파싱
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("[extractJSON] JSON.parse failed:", (e as Error).message);
    console.error("[extractJSON] jsonText (first 500):", jsonText.slice(0, 500));
    throw new Error(`JSON parse error: ${(e as Error).message}`);
  }
}

async function callGemini(apiKey: string, model: string, prompt: string, maxTokens: number, temperature: number): Promise<any> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      }),
    }
  );

  if (!response.ok) {
    const status = response.status;
    const errText = await response.text();
    throw new Error(`Gemini ${status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");
  return extractJSON(text);
}

// ──────────────────────────────────────────────
// 메인 서버
// ──────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GOOGLE_GEMINI_API_KEY is not configured");

    const {
      question, questionType, memo, cards, sajuData, birthInfo,
      astrologyData, ziweiData, combinationSummary,
      forcetellData, manseryeokData,
    } = await req.json();

    // ── 카드 설명 빌드 ──
    const cardDescriptions = (cards || [])
      .map((c: any, idx: number) => {
        const positions = ["현재 상황", "핵심 문제", "결과/방향"];
        const position = positions[idx] || `Position ${idx + 1}`;
        const direction = c.isReversed ? "역방향" : "정방향";
        return `[${position}] ${c.korean || c.name} (${c.name}) - ${direction} | Suit: ${c.suit} | Number: ${c.id}`;
      })
      .join("\n");

    // ── 각 체계 데이터 빌드 ──
    const sajuSection = buildSajuSection(manseryeokData, forcetellData || null, sajuData);

    let astroSection = "점성술 데이터 없음";
    if (astrologyData) {
      astroSection = `태양궁: ${astrologyData.sunSign} / 달궁: ${astrologyData.moonSign} / 상승궁: ${astrologyData.risingSign}\n주요 원소: ${astrologyData.dominantElement} / 모달리티: ${astrologyData.dominantQuality}\n${astrologyData.chartSummary || ""}\n${astrologyData.planets ? `행성 배치: ${astrologyData.planets.map((p: any) => `${p.name} in ${p.sign}(${p.house ? "H" + p.house : ""}) ${p.dignity || ""}`).join("; ")}` : ""}\n${astrologyData.aspects ? `어스펙트: ${astrologyData.aspects.map((a: any) => `${a.planet1}${a.type}${a.planet2}(${a.orb}°)`).join("; ")}` : ""}\n${astrologyData.transits ? `현재 트랜짓: ${JSON.stringify(astrologyData.transits)}` : ""}`;
    }

    let ziweiSection = "자미두수 데이터 없음";
    if (ziweiData) {
      ziweiSection = `명궁: ${ziweiData.mingGong} / 신궁: ${ziweiData.shenGong} / 국: ${ziweiData.bureau}\n인생 구조: ${ziweiData.lifeStructure}\n${ziweiData.natalTransformations ? `사화: ${ziweiData.natalTransformations.map((t: any) => `${t.type}: ${t.star}→${t.palace}`).join("; ")}` : ""}\n${ziweiData.currentMajorPeriod ? `현재 대한: ${ziweiData.currentMajorPeriod.startAge}-${ziweiData.currentMajorPeriod.endAge}세, 궁위: ${ziweiData.currentMajorPeriod.palace}` : ""}\n${ziweiData.currentMinorPeriod ? `현재 소한: ${ziweiData.currentMinorPeriod.age}세, 궁위: ${ziweiData.currentMinorPeriod.palace}` : ""}\n${ziweiData.questionAnalysis || ""}`;
    }

    const userDataBlock = `## 질문: "${question}" (유형: ${questionType})
${memo ? `상황/메모: ${memo}` : ""}
${birthInfo ? `출생정보: ${birthInfo.gender === "male" ? "남성" : "여성"}, ${birthInfo.birthDate}, ${birthInfo.birthTime || "시간 미상"}, ${birthInfo.birthPlace || "출생지 미상"}, ${birthInfo.isLunar ? "음력" : "양력"}` : "출생정보 미제공"}

## 타로 카드 (3카드 스프레드)
${cardDescriptions}
${combinationSummary ? `\n## 카드 조합 데이터베이스\n${combinationSummary}` : ""}

## 사주 데이터
${sajuSection}

## 서양 점성술 데이터
${astroSection}

## 자미두수 데이터
${ziweiSection}`;

    // ════════════════════════════════════════════
    // 1단계: Flash로 6개 체계 개별 분석
    // ════════════════════════════════════════════
    console.log("[v4] Stage 1: Flash individual analysis starting...");

    const stage1Prompt = STAGE1_SYSTEM + "\n\n" + userDataBlock + "\n\n위 데이터를 기반으로 6개 체계를 각각 독립적으로 분석하세요. 사주 데이터가 없으면 해당 체계는 keywords를 빈 배열, detail을 '출생정보 미제공으로 분석 불가'로 출력하세요. 반드시 순수 JSON만 출력하세요.";

    let stage1Result: any;
    try {
      stage1Result = await callGemini(GEMINI_API_KEY, "gemini-2.5-flash", stage1Prompt, 10000, 0.7);
    } catch (e: any) {
      console.error("[v4] Stage 1 failed:", e.message);
      // Flash 실패 시 에러 반환
      throw new Error(`1단계 분석 실패: ${e.message}`);
    }

    console.log("[v4] Stage 1 complete. Starting Stage 2...");

    // ════════════════════════════════════════════
    // 2단계: Pro로 교차검증 + 종합 리딩
    // ════════════════════════════════════════════
    const stage2UserPrompt = `## 원본 질문: "${question}" (유형: ${questionType})
${memo ? `상황/메모: ${memo}` : ""}

## 6개 체계 개별 분석 결과
${JSON.stringify(stage1Result, null, 2)}

---
위 6개 체계의 개별 분석 결과를 기반으로:
1. 각 체계의 keywords와 direction을 비교하여 수렴/분기를 판정하세요.
2. 교차검증 결과를 바탕으로 종합 리딩을 작성하세요.
3. 수렴된 체계가 많을수록 확신도가 높은 리딩을 제공하세요.
4. 분기된 체계가 있다면 왜 다른 방향인지 구조적으로 설명하세요.
반드시 순수 JSON만 출력하세요.`;

    let stage2Result: any;
    try {
      stage2Result = await callGemini(GEMINI_API_KEY, "gemini-2.5-pro", STAGE2_SYSTEM + "\n\n" + stage2UserPrompt, 8000, 0.65);
    } catch (e: any) {
      console.error("[v4] Stage 2 failed:", e.message);
      // Pro 실패 시 1단계 결과라도 반환
      stage2Result = {
        convergence: {
          converged_count: 0,
          converged_systems: [],
          common_keywords: [],
          common_message: "2단계 교차검증에 실패했습니다. 1단계 개별 분석 결과를 참고하세요.",
          divergent_systems: [],
          divergent_reason: `교차검증 오류: ${e.message}`,
        },
        final_reading: {
          grade: "C",
          title: "개별 분석 결과 (교차검증 미완료)",
          summary: "교차검증이 완료되지 않았습니다. 각 체계의 개별 분석을 참고하세요.",
          time_flow: {},
          advice: "잠시 후 재분석을 시도해 주세요.",
          caution: "교차검증 없이 개별 분석만으로는 확신도가 낮습니다.",
          lucky_elements: {},
        },
      };
    }

    console.log("[v4] Stage 2 complete. Building final response...");

    // ════════════════════════════════════════════
    // 최종 결과 조합 (v2 호환 형식)
    // ════════════════════════════════════════════
    const finalReading = {
      user_info: {
        birth: birthInfo ? `${birthInfo.birthDate} ${birthInfo.birthTime || ""}` : "미제공",
        question,
      },
      individual_readings: {
        saju: {
          source: forcetellData ? "포스텔러" : manseryeokData ? "만세력 자동계산" : sajuData ? "내부계산" : "미제공",
          raw_data_used: {},
          keywords: stage1Result.saju?.keywords || [],
          direction: stage1Result.saju?.direction || "",
          detail: stage1Result.saju?.detail || "출생정보 미제공으로 분석 불가",
        },
        astrology: {
          keywords: stage1Result.astrology?.keywords || [],
          direction: stage1Result.astrology?.direction || "",
          detail: stage1Result.astrology?.detail || "",
        },
        ziwei: {
          keywords: stage1Result.ziwei?.keywords || [],
          direction: stage1Result.ziwei?.direction || "",
          detail: stage1Result.ziwei?.detail || "",
        },
        tarot: {
          spread: "3카드",
          cards: (cards || []).map((c: any, i: number) => ({
            position: ["현재", "핵심", "결과"][i] || `위치${i + 1}`,
            card: c.korean || c.name,
            orientation: c.isReversed ? "역" : "정",
          })),
          keywords: stage1Result.tarot?.keywords || [],
          direction: stage1Result.tarot?.direction || "",
          detail: stage1Result.tarot?.detail || "",
        },
        choi_hanna_tarot: {
          cards: (cards || []).map((c: any, i: number) => ({
            position: ["현재", "핵심", "결과"][i] || `위치${i + 1}`,
            card: c.korean || c.name,
            orientation: c.isReversed ? "역" : "정",
          })),
          keywords: stage1Result.choi_hanna_tarot?.keywords || [],
          direction: stage1Result.choi_hanna_tarot?.direction || "",
          detail: stage1Result.choi_hanna_tarot?.detail || "",
        },
        monad_tarot: {
          cards: (cards || []).map((c: any, i: number) => ({
            position: ["현재", "핵심", "결과"][i] || `위치${i + 1}`,
            card: c.korean || c.name,
            orientation: c.isReversed ? "역" : "정",
          })),
          keywords: stage1Result.monad_tarot?.keywords || [],
          direction: stage1Result.monad_tarot?.direction || "",
          detail: stage1Result.monad_tarot?.detail || "",
        },
      },
      convergence: stage2Result.convergence || {
        converged_count: 0,
        converged_systems: [],
        common_keywords: [],
        common_message: "",
        divergent_systems: [],
        divergent_reason: "",
      },
      final_reading: {
        grade: stage2Result.final_reading?.grade || "C",
        grade_criteria: {
          S: "6개 체계 전체 수렴 — 최고 확신도",
          A: "5개 체계 수렴 — 높은 확신도",
          B: "4개 체계 수렴 — 보통 확신도",
          C: "3개 이하 수렴 — 추가 검토 필요",
        },
        title: stage2Result.final_reading?.title || "분석 결과",
        summary: stage2Result.final_reading?.summary || "",
        time_flow: stage2Result.final_reading?.time_flow || {},
        advice: stage2Result.final_reading?.advice || "",
        caution: stage2Result.final_reading?.caution || "",
        lucky_elements: stage2Result.final_reading?.lucky_elements || {},
      },
    };

    return new Response(JSON.stringify({ reading: finalReading }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[v4] Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

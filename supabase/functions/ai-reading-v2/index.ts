import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `당신은 동양·서양 운명학을 통합 분석하는 최고 수준의 전문가입니다.
아래 6가지 체계를 모두 활용하여 사용자의 질문에 대해 깊이 있는 리딩을 제공합니다.

## 분석 체계
1. 사주팔자 (제공된 사주 데이터 기반 해석)
2. 서양 점성술
3. 자미두수
4. 타로 (웨이트 기반 78장)
5. 운명전쟁49 최한나 타로
6. 운명전쟁49 모나드 타로

## ⚠️ 핵심 규칙
- 사주팔자는 절대 직접 계산하지 마세요.
- 아래 [사주 데이터]에 제공된 사주 원국, 오행, 십신, 대운, 세운 정보를 그대로 사용하여 해석만 수행하세요.
- 제공된 데이터에 없는 사주 정보를 임의로 만들지 마세요.
- 사주 데이터가 제공되지 않은 경우, 사주 분석은 "출생정보 미제공"으로 표기하고 나머지 5개 체계로 분석하세요.

## 각 체계별 분석 기준

### 1. 사주팔자
- 제공된 사주 원국(년주, 월주, 일주, 시주)을 기반으로 해석하세요.
- 제공된 오행 비율, 십신 배치, 용신 정보를 활용하세요.
- 제공된 대운/세운 정보로 현재 시기의 운세 흐름을 분석하세요.
- 합, 충, 형, 파, 해는 데이터에 명시된 것만 언급하세요.

### 2. 서양 점성술
- 생년월일시와 출생지 기반으로 태양궁, 달궁, 상승궁을 파악하세요.
- 현재 주요 행성 트랜짓(목성, 토성, 명왕성)의 영향을 분석하세요.
- 질문 주제에 해당하는 하우스를 중심으로 해석하세요.

### 3. 자미두수
- 생년월일시를 기반으로 명궁의 주성과 보성을 파악하세요.
- 질문과 관련된 궁위(재백궁, 관록궁, 부부궁 등)를 중점 분석하세요.
- 사화(화록, 화권, 화과, 화기)의 작용을 확인하세요.

### 4. 타로 (웨이트 기반)
- 사용자가 선택한 카드를 기반으로 해석하세요.
- 정방향/역방향을 구분하여 해석하세요.
- 메이저 아르카나와 마이너 아르카나의 조합을 종합 해석하세요.

### 5. 운명전쟁49 최한나 타로
- 한국적 정서와 감정 중심의 해석 체계를 적용하세요.
- 관계, 감정, 현실적 조언에 초점을 맞추세요.
- 카드의 상징을 일상적이고 공감 가능한 언어로 풀어주세요.
- 직관적이고 직설적인 어투를 사용하세요.

### 6. 운명전쟁49 모나드 타로
- 영적 성장과 내면 탐구 관점에서 해석하세요.
- 영혼의 목적, 카르마적 교훈, 성장 방향을 중심으로 리딩하세요.
- 철학적이고 깊이 있는 통찰을 제공하세요.

## 출력 형식 (JSON)
반드시 아래 JSON 구조만 출력하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.
{
  "user_info": {
    "birth": "사용자 생년월일시",
    "question": "사용자 질문"
  },
  "individual_readings": {
    "saju": {
      "source": "제공된 사주 데이터",
      "raw_data_used": {
        "사주원국": "년주/월주/일주/시주",
        "오행비율": "오행 비율",
        "용신": "용신",
        "현재대운": "대운 정보",
        "세운": "세운 정보"
      },
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "direction": "한 줄 방향성 요약",
      "detail": "상세 해석 (300자 내외)"
    },
    "astrology": {
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "direction": "한 줄 방향성 요약",
      "detail": "상세 해석 (300자 내외)"
    },
    "ziwei": {
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "direction": "한 줄 방향성 요약",
      "detail": "상세 해석 (300자 내외)"
    },
    "tarot": {
      "spread": "사용한 스프레드",
      "cards": [
        {"position": "위치", "card": "카드명", "orientation": "정/역"}
      ],
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "direction": "한 줄 방향성 요약",
      "detail": "상세 해석 (300자 내외)"
    },
    "choi_hanna_tarot": {
      "cards": [
        {"position": "위치", "card": "카드명", "orientation": "정/역"}
      ],
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "direction": "한 줄 방향성 요약",
      "detail": "상세 해석 (300자 내외)"
    },
    "monad_tarot": {
      "cards": [
        {"position": "위치", "card": "카드명", "orientation": "정/역"}
      ],
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "direction": "한 줄 방향성 요약",
      "detail": "상세 해석 (300자 내외)"
    }
  },
  "convergence": {
    "converged_count": 0,
    "converged_systems": [],
    "common_keywords": [],
    "common_message": "수렴된 체계들이 공통으로 가리키는 핵심 메시지",
    "divergent_systems": [],
    "divergent_reason": "수렴하지 않은 이유와 보충 해석"
  },
  "final_reading": {
    "grade": "S / A / B / C",
    "grade_criteria": {
      "S": "6개 체계 전체 수렴",
      "A": "5개 체계 수렴",
      "B": "4개 체계 수렴",
      "C": "3개 이하 수렴"
    },
    "title": "리딩 제목 (인상적인 한 줄)",
    "summary": "종합 리딩 요약 (500자 내외)",
    "time_flow": {
      "past_influence": "과거의 영향 (100자)",
      "present_situation": "현재 상황 핵심 (150자)",
      "near_future": "3개월 내 전망 (150자)",
      "long_term": "6개월~1년 전망 (150자)"
    },
    "advice": "구체적이고 실천 가능한 조언 (300자 내외)",
    "caution": "주의사항 (200자 내외)",
    "lucky_elements": {
      "color": "행운의 색",
      "number": "행운의 숫자",
      "direction": "좋은 방위",
      "time": "좋은 시간대",
      "day": "좋은 요일"
    }
  }
}

## 등급 판정 기준
- S등급: 6개 체계 전체 방향성 수렴
- A등급: 5개 체계 수렴
- B등급: 4개 체계 수렴
- C등급: 3개 이하 수렴

## 수렴 판정 방법
1. 각 체계의 keywords 3개를 비교합니다.
2. 의미적으로 같은 방향을 가리키는 키워드가 2개 이상 겹치면 "수렴"으로 판정합니다.
3. direction(방향성)이 긍정/부정/중립 중 같은 방향이면 추가 수렴 근거로 인정합니다.
4. 수렴 판정은 엄격하게 하세요. 억지로 맞추지 마세요.
   실제로 방향이 다르면 솔직하게 divergent로 분류하세요.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const {
      question,
      questionType,
      memo,
      cards,
      sajuData,
      birthInfo,
      astrologyData,
      ziweiData,
      combinationSummary,
      forcetellData,
    } = await req.json();

    // Build card descriptions
    const cardDescriptions = (cards || [])
      .map((c: any, idx: number) => {
        const positions = ["현재 상황", "핵심 문제", "결과/방향"];
        const position = positions[idx] || `Position ${idx + 1}`;
        const direction = c.isReversed ? "역방향" : "정방향";
        return `[${position}] ${c.korean || c.name} (${c.name}) - ${direction} | Suit: ${c.suit} | Number: ${c.id}`;
      })
      .join("\n");

    // Build saju section
    let sajuSection = "출생정보 미제공";
    if (forcetellData) {
      sajuSection = `[포스텔러 원본 데이터]\n${forcetellData}`;
      if (sajuData) {
        sajuSection += `\n\n[내부 계산 사주 데이터 (참고용)]\n사주 원국: ${sajuData.yearPillar?.cheongan || ""}${sajuData.yearPillar?.jiji || ""} / ${sajuData.monthPillar?.cheongan || ""}${sajuData.monthPillar?.jiji || ""} / ${sajuData.dayPillar?.cheongan || ""}${sajuData.dayPillar?.jiji || ""} / ${sajuData.hourPillar?.cheongan || ""}${sajuData.hourPillar?.jiji || ""}
일간: ${sajuData.ilgan || ""}(${sajuData.ilganElement || ""}) / 신강/신약: ${sajuData.strength || ""} / 용신: ${sajuData.yongsin || ""}`;
      }
    } else if (sajuData) {
      sajuSection = `사주 원국: ${sajuData.yearPillar?.cheongan || ""}${sajuData.yearPillar?.jiji || ""} / ${sajuData.monthPillar?.cheongan || ""}${sajuData.monthPillar?.jiji || ""} / ${sajuData.dayPillar?.cheongan || ""}${sajuData.dayPillar?.jiji || ""} / ${sajuData.hourPillar?.cheongan || ""}${sajuData.hourPillar?.jiji || ""}
일간: ${sajuData.ilgan || ""}(${sajuData.ilganElement || ""}, ${sajuData.ilganYinyang || ""}) / 신강/신약: ${sajuData.strength || ""} / 용신: ${sajuData.yongsin || ""}
오행 비율: 목${sajuData.fiveElementDist?.["목"]?.toFixed(1) || 0} 화${sajuData.fiveElementDist?.["화"]?.toFixed(1) || 0} 토${sajuData.fiveElementDist?.["토"]?.toFixed(1) || 0} 금${sajuData.fiveElementDist?.["금"]?.toFixed(1) || 0} 수${sajuData.fiveElementDist?.["수"]?.toFixed(1) || 0}
${sajuData.gyeokguk ? `격국: ${sajuData.gyeokguk}` : ""}
${sajuData.sinsal ? `신살: ${sajuData.sinsal.map((s: any) => `${s.name}(${s.branch}): ${s.meaning}`).join("; ")}` : ""}
${sajuData.jijiInteractions ? `지지 상호작용: ${sajuData.jijiInteractions.map((j: any) => `${j.type}(${j.branches.join(",")}): ${j.effect}`).join("; ")}` : ""}
${sajuData.daeun ? `현재 대운: ${sajuData.daeun.current?.cheongan || ""}${sajuData.daeun.current?.jiji || ""}(${sajuData.daeun.current?.startAge || ""}-${sajuData.daeun.current?.endAge || ""}세)` : ""}
${sajuData.sewun ? `현재 세운: ${sajuData.sewun.cheongan || ""}${sajuData.sewun.jiji || ""}` : ""}
${sajuData.crossKeywords ? "교차 키워드: " + sajuData.crossKeywords.join(", ") : ""}
${sajuData.questionAnalysis || ""}`;
    }

    // Build astrology section
    let astroSection = "점성술 데이터 없음";
    if (astrologyData) {
      astroSection = `태양궁: ${astrologyData.sunSign} / 달궁: ${astrologyData.moonSign} / 상승궁: ${astrologyData.risingSign}
주요 원소: ${astrologyData.dominantElement} / 모달리티: ${astrologyData.dominantQuality}
${astrologyData.chartSummary || ""}
${astrologyData.planets ? `행성 배치: ${astrologyData.planets.map((p: any) => `${p.name} in ${p.sign}(${p.house ? 'H' + p.house : ''}) ${p.dignity || ''}`).join("; ")}` : ""}
${astrologyData.aspects ? `어스펙트: ${astrologyData.aspects.map((a: any) => `${a.planet1}${a.type}${a.planet2}(${a.orb}°)`).join("; ")}` : ""}
${astrologyData.transits ? `현재 트랜짓: ${JSON.stringify(astrologyData.transits)}` : ""}`;
    }

    // Build ziwei section
    let ziweiSection = "자미두수 데이터 없음";
    if (ziweiData) {
      ziweiSection = `명궁: ${ziweiData.mingGong} / 신궁: ${ziweiData.shenGong} / 국: ${ziweiData.bureau}
인생 구조: ${ziweiData.lifeStructure}
${ziweiData.natalTransformations ? `사화: ${ziweiData.natalTransformations.map((t: any) => `${t.type}: ${t.star}→${t.palace}`).join("; ")}` : ""}
${ziweiData.currentMajorPeriod ? `현재 대한: ${ziweiData.currentMajorPeriod.startAge}-${ziweiData.currentMajorPeriod.endAge}세, 궁위: ${ziweiData.currentMajorPeriod.palace}` : ""}
${ziweiData.currentMinorPeriod ? `현재 소한: ${ziweiData.currentMinorPeriod.age}세, 궁위: ${ziweiData.currentMinorPeriod.palace}` : ""}
${ziweiData.questionAnalysis || ""}`;
    }

    const userPrompt = `## 질문: "${question}" (유형: ${questionType})
${memo ? `상황/메모: ${memo}` : ""}
${birthInfo ? `출생정보: ${birthInfo.gender === "male" ? "남성" : "여성"}, ${birthInfo.birthDate}, ${birthInfo.birthTime || "시간 미상"}, ${birthInfo.birthPlace || "출생지 미상"}, ${birthInfo.isLunar ? "음력" : "양력"}` : "출생정보 미제공"}

## 사용자 선택 타로 카드 (3카드 스프레드)
${cardDescriptions}
${combinationSummary ? `\n## 카드 조합 데이터베이스 분석\n${combinationSummary}` : ""}

## 사주 데이터
${sajuSection}

## 서양 점성술 데이터
${astroSection}

## 자미두수 데이터
${ziweiSection}

---
위 모든 데이터를 기반으로 6개 체계(사주, 점성술, 자미두수, 웨이트 타로, 최한나 타로, 모나드 타로) 통합 분석을 수행하세요.
사주 데이터가 제공되지 않았다면 나머지 5개 체계로 분석하고, 등급도 5개 체계 기준으로 판정하세요.
반드시 순수 JSON만 출력하세요. 마크다운 코드블록(\`\`\`)을 사용하지 마세요.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.72,
        max_tokens: 10000,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (status === 402) {
        const cardNames = (cards || [])
          .slice(0, 3)
          .map((c: any) => `${c.korean || c.name}${c.isReversed ? "(역)" : ""}`)
          .join(", ");

        const fallbackReading = {
          user_info: {
            birth: birthInfo ? `${birthInfo.birthDate} ${birthInfo.birthTime || ""}` : "미제공",
            question,
          },
          individual_readings: {
            saju: { source: "미제공", raw_data_used: {}, keywords: ["대기", "준비", "전환"], direction: "크레딧 충전 후 상세 분석 가능", detail: "AI 크레딧 부족으로 요약 리딩입니다." },
            astrology: { keywords: ["관찰", "신중", "기회"], direction: "요약 모드", detail: "크레딧 충전 후 상세 분석이 가능합니다." },
            ziwei: { keywords: ["변화", "적응", "성장"], direction: "요약 모드", detail: "크레딧 충전 후 상세 분석이 가능합니다." },
            tarot: { spread: "3카드", cards: (cards || []).map((c: any, i: number) => ({ position: ["현재", "핵심", "결과"][i], card: c.korean || c.name, orientation: c.isReversed ? "역" : "정" })), keywords: ["정리", "재설정", "실행"], direction: `${cardNames} 조합의 흐름`, detail: "선택한 카드 기본 상징 기반 요약입니다." },
            choi_hanna_tarot: { cards: [], keywords: ["감정정리", "직감", "행동"], direction: "요약 모드", detail: "크레딧 충전 후 상세 분석이 가능합니다." },
            monad_tarot: { cards: [], keywords: ["내면탐구", "성찰", "각성"], direction: "요약 모드", detail: "크레딧 충전 후 상세 분석이 가능합니다." },
          },
          convergence: {
            converged_count: 0,
            converged_systems: [],
            common_keywords: ["준비", "전환"],
            common_message: "요약 모드로 수렴 분석이 제한됩니다.",
            divergent_systems: [],
            divergent_reason: "크레딧 부족으로 전체 분석 불가",
          },
          final_reading: {
            grade: "C",
            grade_criteria: { S: "6개 체계 전체 수렴", A: "5개 수렴", B: "4개 수렴", C: "3개 이하 수렴" },
            title: "⚠️ 요약 리딩 (크레딧 충전 필요)",
            summary: `AI 크레딧이 부족하여 요약 리딩으로 결과를 제공합니다. 선택한 카드(${cardNames})의 기본 흐름은 '정리 → 우선순위 재설정 → 실행'입니다. 크레딧 충전 후 다시 분석하시면 6개 체계 전체를 활용한 정밀한 리딩을 받으실 수 있습니다.`,
            time_flow: {
              past_influence: "과거 패턴의 반복이 현재 질문으로 이어졌습니다.",
              present_situation: "현재는 정리와 재정비가 필요한 시점입니다.",
              near_future: "향후 1~3개월은 우선순위를 명확히 하는 데 집중하세요.",
              long_term: "6개월 후부터 본격적인 변화의 흐름이 시작됩니다.",
            },
            advice: "우선순위를 1개로 압축하고, 오늘 실행 가능한 작은 행동 1가지를 진행하세요.",
            caution: "불안 기반의 과잉 판단과 성급한 타이밍을 주의하세요.",
            lucky_elements: { color: "파란색", number: "7", direction: "동쪽", time: "오전 9-11시", day: "수요일" },
          },
          fallback: true,
        };

        return new Response(
          JSON.stringify({ reading: fallbackReading, warning: "AI 크레딧이 부족하여 요약 리딩입니다." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const t = await response.text();
      console.error("AI error:", status, t);
      return new Response(
        JSON.stringify({ error: "AI 분석 오류가 발생했습니다." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    let reading;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      reading = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);
    } catch {
      console.error("Parse fail:", content.slice(0, 500));
      reading = {
        user_info: { birth: "", question },
        individual_readings: {
          saju: { source: "", raw_data_used: {}, keywords: [], direction: "", detail: content.slice(0, 300) },
          astrology: { keywords: [], direction: "", detail: "" },
          ziwei: { keywords: [], direction: "", detail: "" },
          tarot: { spread: "3카드", cards: [], keywords: [], direction: "", detail: "" },
          choi_hanna_tarot: { cards: [], keywords: [], direction: "", detail: "" },
          monad_tarot: { cards: [], keywords: [], direction: "", detail: "" },
        },
        convergence: { converged_count: 0, converged_systems: [], common_keywords: [], common_message: "파싱 오류", divergent_systems: [], divergent_reason: "" },
        final_reading: { grade: "C", grade_criteria: {}, title: "분석 결과", summary: content.slice(0, 500), time_flow: {}, advice: "", caution: "", lucky_elements: {} },
      };
    }

    return new Response(JSON.stringify({ reading }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-reading-v2 error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

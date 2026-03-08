import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { question, questionType, memo, cards, sajuData, birthInfo, astrologyData, ziweiData, combinationSummary } = await req.json();

    const systemPrompt = `당신은 전문 점술 상담사입니다. 타로, 사주(명리학), 점성술(Western Astrology), 자미두수(紫微斗數)를 결합한 교차 검증형 분석을 수행합니다.

## 분석 원칙
1. 감성적 위로가 아닌 구조적 분석 중심
2. 4개 체계의 결과를 교차 검증하여 신뢰도를 높임
3. 일치하는 포인트는 강조, 불일치하는 포인트는 주의사항으로 제시
4. 리스크와 현실 조언을 반드시 포함
5. 상담가 스타일 문체 (감성 문장 금지)

## 교차 검증 방법
- 타로 카드의 에너지 방향과 사주의 오행/신강약이 일치하는지 확인
- 점성술의 행성 배치와 사주의 십성 구조가 같은 방향을 가리키는지 확인
- 자미두수의 궁위별 별 상태와 타로의 카드 위치(현재-문제-결과)가 호응하는지 확인
- 카드 조합 DB의 기존 해석과 실제 분석이 일치하는지 확인

## 응답 형식 (JSON)
반드시 아래 JSON만 출력하세요.
{
  "conclusion": "최종 결론 (3-4문장, 4개 체계 종합)",
  "tarotAnalysis": "타로 3장 종합 해석 (카드 조합 의미, 위치별 해석)",
  "sajuAnalysis": "사주 구조 분석 (일간, 신강약, 오행, 십성 기반)",
  "astrologyAnalysis": "점성술 분석 (행성 배치, 하우스, 트랜짓)",
  "ziweiAnalysis": "자미두수 분석 (명반 구조, 핵심 궁위)",
  "crossValidation": "4개 체계 교차 검증 결과 (일치/불일치 포인트)",
  "risk": "리스크 요인",
  "advice": "현실 조언 (구체적 행동 지침)",
  "scores": { "tarot": 0-100, "saju": 0-100, "astrology": 0-100, "ziwei": 0-100, "overall": 0-100 }
}`;

    const cardDescriptions = cards.map((c: any, idx: number) => {
      const position = idx === 0 ? "현재 상황" : idx === 1 ? "핵심 문제" : "결과/방향";
      return `[${position}] ${c.korean} (${c.name}) - ${c.isReversed ? "역방향" : "정방향"} | 슈트: ${c.suit}`;
    }).join("\n");

    let sajuSection = "출생정보 미제공";
    if (sajuData) {
      sajuSection = `사주팔자: ${sajuData.yearPillar?.cheongan}${sajuData.yearPillar?.jiji} / ${sajuData.monthPillar?.cheongan}${sajuData.monthPillar?.jiji} / ${sajuData.dayPillar?.cheongan}${sajuData.dayPillar?.jiji} / ${sajuData.hourPillar?.cheongan}${sajuData.hourPillar?.jiji}
일간: ${sajuData.ilgan}(${sajuData.ilganElement}, ${sajuData.ilganYinyang}) / 신강약: ${sajuData.strength} / 용신: ${sajuData.yongsin}
오행: 목${sajuData.fiveElementDist?.["목"]?.toFixed(1)} 화${sajuData.fiveElementDist?.["화"]?.toFixed(1)} 토${sajuData.fiveElementDist?.["토"]?.toFixed(1)} 금${sajuData.fiveElementDist?.["금"]?.toFixed(1)} 수${sajuData.fiveElementDist?.["수"]?.toFixed(1)}
십성: ${JSON.stringify(sajuData.sipsung)}
${sajuData.crossKeywords ? "교차키워드: " + sajuData.crossKeywords.join(", ") : ""}
${sajuData.questionAnalysis || ""}`;
    }

    let astroSection = "점성술 데이터 없음";
    if (astrologyData) {
      astroSection = `태양: ${astrologyData.sunSign} / 달: ${astrologyData.moonSign} / 상승궁: ${astrologyData.risingSign}
지배원소: ${astrologyData.dominantElement} / 지배특질: ${astrologyData.dominantQuality}
${astrologyData.chartSummary || ""}
주요 상: ${(astrologyData.keyAspects || []).join(" | ")}
${astrologyData.questionAnalysis || ""}`;
    }

    let ziweiSection = "자미두수 데이터 없음";
    if (ziweiData) {
      ziweiSection = `명궁: ${ziweiData.mingGong} / 신궁: ${ziweiData.shenGong} / 오행국: ${ziweiData.bureau}
인생구조: ${ziweiData.lifeStructure}
핵심: ${(ziweiData.keyInsights || []).join(" | ")}
${ziweiData.questionAnalysis || ""}`;
    }

    const userPrompt = `## 질문: "${question}" (유형: ${questionType})
${memo ? `메모: ${memo}` : ""}
${birthInfo ? `출생: ${birthInfo.gender === "male" ? "남" : "여"}, ${birthInfo.birthDate}, ${birthInfo.birthTime || "시간미상"}, ${birthInfo.isLunar ? "음력" : "양력"}` : ""}

## 타로 카드
${cardDescriptions}
${combinationSummary ? `\n## 카드 조합 DB\n${combinationSummary}` : ""}

## 사주
${sajuSection}

## 점성술
${astroSection}

## 자미두수
${ziweiSection}

위 데이터를 기반으로 4개 체계 교차 검증 분석을 수행하세요.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "요청이 너무 많습니다." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI 크레딧 부족." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI error:", status, t);
      return new Response(JSON.stringify({ error: "AI 분석 오류" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    let reading;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      reading = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);
    } catch {
      console.error("Parse fail:", content);
      reading = { conclusion: content.slice(0, 300), tarotAnalysis: "", sajuAnalysis: "", astrologyAnalysis: "", ziweiAnalysis: "", crossValidation: "", risk: "", advice: "", scores: { tarot: 50, saju: 0, astrology: 0, ziwei: 0, overall: 50 } };
    }

    return new Response(JSON.stringify({ reading }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-reading error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

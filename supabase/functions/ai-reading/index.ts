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

    const { question, questionType, memo, cards, sajuData, birthInfo } = await req.json();

    // Build detailed system prompt for cross-validation reading
    const systemPrompt = `당신은 전문 점술 상담사입니다. 타로, 사주(명리학)를 결합한 교차 검증형 분석을 수행합니다.

## 분석 원칙
1. 감성적 위로가 아닌 구조적 분석 중심
2. 각 체계의 결과를 교차 검증하여 신뢰도를 높임
3. 리스크와 현실 조언을 반드시 포함
4. 상담가 스타일의 문체 사용 (감성 문장 금지)

## 응답 형식 (JSON)
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 순수 JSON만 출력합니다.
{
  "conclusion": "최종 결론 (2-3문장)",
  "tarotAnalysis": "타로 3장 종합 해석 (카드 조합 의미, 위치별 해석 포함)",
  "sajuAnalysis": "사주 구조 분석 (일간, 신강약, 오행 분포, 십성 기반 해석)",
  "crossValidation": "타로와 사주 교차 검증 결과 (일치/불일치 포인트)",
  "risk": "리스크 요인 (주의 사항)",
  "advice": "현실 조언 (구체적 행동 지침)",
  "scores": {
    "tarot": 0-100,
    "saju": 0-100,
    "overall": 0-100
  }
}`;

    // Build card descriptions
    const cardDescriptions = cards.map((c: any, idx: number) => {
      const position = idx === 0 ? "현재 상황" : idx === 1 ? "핵심 문제" : "결과/방향";
      return `[${position}] ${c.korean} (${c.name}) - ${c.isReversed ? "역방향" : "정방향"} | 슈트: ${c.suit}`;
    }).join("\n");

    // Build saju description
    let sajuDescription = "출생정보 미제공";
    if (sajuData) {
      sajuDescription = `
사주팔자:
- 연주: ${sajuData.yearPillar?.cheongan}${sajuData.yearPillar?.jiji}
- 월주: ${sajuData.monthPillar?.cheongan}${sajuData.monthPillar?.jiji}
- 일주: ${sajuData.dayPillar?.cheongan}${sajuData.dayPillar?.jiji}
- 시주: ${sajuData.hourPillar?.cheongan}${sajuData.hourPillar?.jiji}
- 일간: ${sajuData.ilgan} (${sajuData.ilganElement}, ${sajuData.ilganYinyang})
- 신강약: ${sajuData.strength}
- 용신: ${sajuData.yongsin}
- 오행분포: 목${sajuData.fiveElementDist?.["목"]?.toFixed(1)} 화${sajuData.fiveElementDist?.["화"]?.toFixed(1)} 토${sajuData.fiveElementDist?.["토"]?.toFixed(1)} 금${sajuData.fiveElementDist?.["금"]?.toFixed(1)} 수${sajuData.fiveElementDist?.["수"]?.toFixed(1)}
- 십성: ${JSON.stringify(sajuData.sipsung)}
${sajuData.crossKeywords ? "- 교차키워드: " + sajuData.crossKeywords.join(", ") : ""}
${sajuData.questionAnalysis ? "- 질문별 분석: " + sajuData.questionAnalysis : ""}`;
    }

    const userPrompt = `## 질문
"${question}"
질문 유형: ${questionType}
${memo ? `상세 메모: ${memo}` : ""}
${birthInfo ? `출생정보: ${birthInfo.gender === "male" ? "남" : "여"}, ${birthInfo.birthDate}, ${birthInfo.birthTime || "시간 미상"}, ${birthInfo.birthPlace || "장소 미상"}, ${birthInfo.isLunar ? "음력" : "양력"}` : ""}

## 타로 카드 (3장 배열: 현재-문제-결과)
${cardDescriptions}

## 사주 데이터
${sajuDescription}

위 데이터를 기반으로 교차 검증형 점술 분석을 수행하세요.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI 크레딧이 부족합니다." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI 분석 중 오류가 발생했습니다." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    let reading;
    try {
      // Try to extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      reading = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response as JSON:", content);
      reading = {
        conclusion: content.slice(0, 200),
        tarotAnalysis: "AI 응답 파싱 실패",
        sajuAnalysis: sajuData ? "사주 데이터 제공됨" : "사주 데이터 없음",
        crossValidation: "교차 검증 불가",
        risk: "재분석 권장",
        advice: "다시 시도해주세요",
        scores: { tarot: 50, saju: sajuData ? 50 : 0, overall: 50 },
      };
    }

    return new Response(JSON.stringify({ reading }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-reading error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

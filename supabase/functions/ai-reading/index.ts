import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompts: Record<string, string> = {
  kr: `당신은 전문 점술 상담사입니다. 타로, 사주(명리학), 점성술(Western Astrology), 자미두수(紫微斗數)를 결합한 교차 검증형 분석을 수행합니다.

## 분석 원칙
1. 감성적 위로가 아닌 구조적 분석 중심
2. 4개 체계의 결과를 교차 검증하여 신뢰도를 높임
3. 일치하는 포인트는 강조, 불일치하는 포인트는 주의사항으로 제시
4. 리스크와 현실 조언을 반드시 포함
5. 상담가 스타일 문체 (감성 문장 금지)

## 응답 형식 (JSON)
반드시 아래 JSON만 출력하세요.
{
  "conclusion": "최종 결론 (3-4문장, 4개 체계 종합)",
  "tarotAnalysis": "타로 3장 종합 해석",
  "sajuAnalysis": "사주 구조 분석",
  "astrologyAnalysis": "점성술 분석",
  "ziweiAnalysis": "자미두수 분석",
  "crossValidation": "4개 체계 교차 검증 결과",
  "risk": "리스크 요인",
  "advice": "현실 조언",
  "scores": { "tarot": 0-100, "saju": 0-100, "astrology": 0-100, "ziwei": 0-100, "overall": 0-100 }
}`,

  jp: `あなたはプロの占いカウンセラーです。タロットと西洋占星術を中心に、感情の流れに寄り添う優しいリーディングを行います。

## 分析の原則
1. 柔らかい文体で、感情の流れを中心に解釈する
2. 断定的な表現は避け、「〜の可能性があります」「〜かもしれません」のような表現を使う
3. タロットカードのメッセージと占星術の影響を組み合わせる
4. 相手の気持ちや関係性の流れを丁寧に読み解く
5. 具体的で実践的なアドバイスを含める
6. 四柱推命と紫微斗数のデータがある場合は内部参考にするが、出力には含めない

## 応答形式 (JSON)
必ず以下のJSONのみを出力してください。
{
  "conclusion": "総合メッセージ（3-4文、タロット＋占星術の総合）",
  "tarotAnalysis": "タロットメッセージ（3枚のカードの総合解釈）",
  "emotionFlow": "感情の流れ（現在→未来の感情的変化）",
  "sajuAnalysis": "",
  "astrologyAnalysis": "占星術の影響（惑星配置、トランジット）",
  "ziweiAnalysis": "",
  "crossValidation": "",
  "risk": "注意点",
  "advice": "アドバイス（具体的な行動指針）",
  "scores": { "tarot": 0-100, "saju": 0-100, "astrology": 0-100, "ziwei": 0-100, "overall": 0-100 }
}`,

  us: `You are a professional spiritual reader and counselor. You combine Tarot and Western Astrology to deliver intuitive, empowering guidance.

## Reading Principles
1. Use a warm, spiritual tone focused on self-growth and empowerment
2. Be direct but supportive — not vague or overly mystical
3. Combine Tarot card messages with astrological influences
4. Focus on energy patterns, emotional insights, and actionable guidance
5. If Saju/Ziwei data is available, use it for internal cross-validation only — do not mention these systems in output
6. Address the querent as "you" and speak in second person

## Response Format (JSON)
Output ONLY the following JSON:
{
  "conclusion": "Energy Summary (3-4 sentences combining Tarot + Astrology insights)",
  "tarotAnalysis": "Tarot Insight (interpretation of the 3 cards by position)",
  "emotionFlow": "",
  "sajuAnalysis": "",
  "astrologyAnalysis": "Astrological Influence (planetary positions, current transits)",
  "ziweiAnalysis": "",
  "crossValidation": "",
  "risk": "Watch Out For (potential challenges or blind spots)",
  "advice": "Guidance (specific, actionable steps for the querent)",
  "scores": { "tarot": 0-100, "saju": 0-100, "astrology": 0-100, "ziwei": 0-100, "overall": 0-100 }
}`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { question, questionType, memo, cards, sajuData, birthInfo, astrologyData, ziweiData, combinationSummary, locale = "kr" } = await req.json();

    const systemPrompt = systemPrompts[locale] || systemPrompts.kr;

    const cardDescriptions = cards.map((c: any, idx: number) => {
      const positionLabels: Record<string, string[]> = {
        kr: ["현재 상황", "핵심 문제", "결과/방향"],
        jp: ["現在のエネルギー", "相手の気持ち", "これからの流れ"],
        us: ["Current Energy", "Core Challenge", "Outcome"],
      };
      const positions = positionLabels[locale] || positionLabels.kr;
      const position = positions[idx] || `Position ${idx + 1}`;
      const direction = locale === "jp" ? (c.isReversed ? "逆位置" : "正位置") : locale === "us" ? (c.isReversed ? "Reversed" : "Upright") : (c.isReversed ? "역방향" : "정방향");
      return `[${position}] ${c.korean} (${c.name}) - ${direction} | Suit: ${c.suit}`;
    }).join("\n");

    let sajuSection = locale === "jp" ? "出生情報未提供" : locale === "us" ? "Birth data not provided" : "출생정보 미제공";
    if (sajuData) {
      sajuSection = `Four Pillars: ${sajuData.yearPillar?.cheongan}${sajuData.yearPillar?.jiji} / ${sajuData.monthPillar?.cheongan}${sajuData.monthPillar?.jiji} / ${sajuData.dayPillar?.cheongan}${sajuData.dayPillar?.jiji} / ${sajuData.hourPillar?.cheongan}${sajuData.hourPillar?.jiji}
Day Master: ${sajuData.ilgan}(${sajuData.ilganElement}, ${sajuData.ilganYinyang}) / Strength: ${sajuData.strength} / Yongsin: ${sajuData.yongsin}
Five Elements: Wood${sajuData.fiveElementDist?.["목"]?.toFixed(1)} Fire${sajuData.fiveElementDist?.["화"]?.toFixed(1)} Earth${sajuData.fiveElementDist?.["토"]?.toFixed(1)} Metal${sajuData.fiveElementDist?.["금"]?.toFixed(1)} Water${sajuData.fiveElementDist?.["수"]?.toFixed(1)}
${sajuData.crossKeywords ? "Cross Keywords: " + sajuData.crossKeywords.join(", ") : ""}
${sajuData.questionAnalysis || ""}`;
    }

    let astroSection = locale === "jp" ? "占星術データなし" : locale === "us" ? "No astrology data" : "점성술 데이터 없음";
    if (astrologyData) {
      astroSection = `Sun: ${astrologyData.sunSign} / Moon: ${astrologyData.moonSign} / Rising: ${astrologyData.risingSign}
Dominant Element: ${astrologyData.dominantElement} / Quality: ${astrologyData.dominantQuality}
${astrologyData.chartSummary || ""}
Key Aspects: ${(astrologyData.keyAspects || []).join(" | ")}
${astrologyData.questionAnalysis || ""}`;
    }

    let ziweiSection = locale === "jp" ? "紫微斗数データなし" : locale === "us" ? "No Zi Wei data" : "자미두수 데이터 없음";
    if (ziweiData) {
      ziweiSection = `Ming Gong: ${ziweiData.mingGong} / Shen Gong: ${ziweiData.shenGong} / Bureau: ${ziweiData.bureau}
Life Structure: ${ziweiData.lifeStructure}
Key Insights: ${(ziweiData.keyInsights || []).join(" | ")}
${ziweiData.questionAnalysis || ""}`;
    }

    const questionLabel = locale === "jp" ? "質問" : locale === "us" ? "Question" : "질문";
    const userPrompt = `## ${questionLabel}: "${question}" (Type: ${questionType})
${memo ? `Memo: ${memo}` : ""}
${birthInfo ? `Birth: ${birthInfo.gender === "male" ? "M" : "F"}, ${birthInfo.birthDate}, ${birthInfo.birthTime || "unknown"}, ${birthInfo.isLunar ? "Lunar" : "Solar"}` : ""}

## Tarot Cards
${cardDescriptions}
${combinationSummary ? `\n## Card Combination DB\n${combinationSummary}` : ""}

## Four Pillars (Saju)
${sajuSection}

## Astrology
${astroSection}

## Zi Wei Dou Shu
${ziweiSection}

${locale === "jp" ? "上記のデータに基づいて、タロット＋占星術を中心としたリーディングを行ってください。日本語で回答してください。" : locale === "us" ? "Based on the above data, perform a Tarot + Astrology spiritual reading. Respond in English." : "위 데이터를 기반으로 4개 체계 교차 검증 분석을 수행하세요."}`;

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
      const errorMsg = locale === "jp" ? "AI分析エラー" : locale === "us" ? "AI analysis error" : "AI 분석 오류";
      if (status === 429) return new Response(JSON.stringify({ error: locale === "jp" ? "リクエストが多すぎます。" : locale === "us" ? "Too many requests." : "요청이 너무 많습니다." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: locale === "jp" ? "AIクレジット不足。" : locale === "us" ? "AI credits exhausted." : "AI 크레딧 부족." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI error:", status, t);
      return new Response(JSON.stringify({ error: errorMsg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    let reading;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      reading = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content);
    } catch {
      console.error("Parse fail:", content);
      reading = { conclusion: content.slice(0, 300), tarotAnalysis: "", emotionFlow: "", sajuAnalysis: "", astrologyAnalysis: "", ziweiAnalysis: "", crossValidation: "", risk: "", advice: "", scores: { tarot: 50, saju: 0, astrology: 0, ziwei: 0, overall: 50 } };
    }

    return new Response(JSON.stringify({ reading }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-reading error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

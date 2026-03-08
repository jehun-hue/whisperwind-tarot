import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompts: Record<string, string> = {
  kr: `당신은 20년 경력의 최고 수준 점술 상담사입니다. 타로, 사주(명리학), 점성술(Western Astrology), 자미두수(紫微斗數) 4개 체계를 결합한 심층 교차 검증 분석을 수행합니다.

## 분석 원칙
1. 감성적 위로가 아닌 구조적 심층 분석 중심. 각 체계에서 근거를 명확히 제시.
2. 4개 체계의 결과를 교차 검증하여 신뢰도를 높임. 일치점과 불일치점을 명확히 구분.
3. 단순 해석이 아닌 "왜 이런 결과가 나오는지"의 메커니즘까지 설명.
4. 시간축 분석: 과거→현재→미래 흐름을 포함.
5. 질문 유형(연애/금전/직업/종합)에 따라 해당 영역에 특화된 깊이 있는 분석.
6. 상담가 스타일 문체 (감성 문장 금지). 전문 용어는 괄호 안에 쉬운 설명 병기.

## 응답 형식 (JSON)
반드시 아래 JSON만 출력하세요. 각 필드는 최소 4-6문장 이상 충실히 작성하세요.
{
  "conclusion": "최종 결론 (5-7문장. 4개 체계가 공통으로 가리키는 핵심 메시지, 현재 시점의 의미, 향후 방향성을 종합)",
  "tarotAnalysis": "타로 심층 해석 (각 카드의 위치별 의미, 카드 간 상호작용, 카드 조합이 만드는 스토리라인, 정/역방향이 주는 뉘앙스 차이까지 상세히. 최소 5문장)",
  "tarotCardInteraction": "카드 간 상호작용 분석 (3장의 카드가 서로 어떤 에너지를 주고받는지, 보완/충돌/강화 관계 설명. 최소 3문장)",
  "sajuAnalysis": "사주 심층 분석 (일간의 성향, 격국, 용신의 작용, 십성 배치의 의미, 오행 균형/불균형이 질문에 미치는 영향. 최소 5문장)",
  "sajuTimeline": "사주 시간축 분석 (대운/세운 흐름에서 현재 시점의 위치, 가까운 미래의 운세 변화 방향. 최소 3문장)",
  "astrologyAnalysis": "점성술 심층 분석 (태양/달/상승궁의 삼위일체 해석, 주요 행성 배치, 하우스 시스템에서의 에너지 분포, 질문 관련 하우스 집중 분석. 최소 5문장)",
  "astrologyTransits": "행성 트랜짓 분석 (현재 트랜짓이 출생차트에 미치는 영향, 주요 각도(aspect) 형성, 시기적 의미. 최소 3문장)",
  "ziweiAnalysis": "자미두수 심층 분석 (명궁 주성의 밝기별 해석, 질문 관련 궁위(재백궁/부처궁/관록궁 등) 집중 분석, 주성과 보조성의 조합 의미. 최소 5문장)",
  "ziweiLifeStructure": "자미두수 인생 구조 분석 (12궁 전체 흐름에서 강점 궁위와 약점 궁위, 인생 전반의 패턴. 최소 3문장)",
  "crossValidation": "4개 체계 교차 검증 (체계별로 일치하는 결론을 항목별로 나열하고, 왜 이것이 신뢰할 수 있는지 설명. 불일치하는 부분도 명시하고 어떤 체계의 판단을 우선할지 근거 제시. 최소 6문장)",
  "crossValidationMatrix": "교차 검증 매트릭스 (타로↔사주, 타로↔점성술, 사주↔자미두수, 점성술↔자미두수 각 조합의 일치/불일치 포인트를 구체적으로 기술. 최소 4문장)",
  "timing": "시기 분석 (4개 체계를 종합한 최적 행동 시기, 주의해야 할 시기, 에너지가 전환되는 시점 예측. 최소 3문장)",
  "risk": "리스크 요인 (4개 체계에서 공통으로 경고하는 위험 요소, 잠재적 함정, 무의식적 패턴의 위험성. 최소 4문장)",
  "hiddenPattern": "숨겨진 패턴 (내담자가 인식하지 못하는 무의식적 패턴이나 반복되는 에너지, 잠재적 기회. 최소 3문장)",
  "advice": "현실 조언 (구체적이고 실천 가능한 행동 지침. 단기(1-3개월), 중기(3-6개월)로 나누어 제시. 최소 5문장)",
  "scores": { "tarot": 0-100, "saju": 0-100, "astrology": 0-100, "ziwei": 0-100, "overall": 0-100 }
}

## 신뢰도 점수 기준
- tarot: 카드 배치의 명확성, 질문과의 연관성, 카드 조합의 시너지
- saju: 사주 구조와 질문의 연관성, 용신 작용의 명확성, 시기적 적합성
- astrology: 행성 배치의 질문 관련 하우스 집중도, 트랜짓의 영향력
- ziwei: 관련 궁위 주성의 밝기, 궁위 간 상호작용의 명확성
- overall: 4개 체계의 교차 일치도를 기반으로 산출 (일치도가 높을수록 높은 점수)`,

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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `당신은 세계 최고의 타로 리딩 전문가입니다.
당신에게는 내부 참고용으로 사주팔자, 서양 점성술, 자미두수 데이터가 주어집니다.
이 세 가지는 교차검증(수렴도 판정)에만 사용하고, 고객에게 보여주는 해석에는 절대 포함하지 마세요.

고객에게 전달하는 해석은 오직 아래 3가지 타로 리딩만으로 구성합니다:
1. 웨이트 타로 (일반 타로) – 객관적, 분석적, 차분한 톤
2. 운명전쟁49 최한나 타로 – 따뜻하고 현실적, 언니/오빠가 조언하듯, 감정→일상 연결
3. 운명전쟁49 모나드 타로 – 영적, 철학적, 시적 표현, 카르마·영혼 성장 관점

【 절대 규칙 】
- 사주, 오행, 천간, 지지, 십신, 용신, 신강/신약, 대운, 세운, 궁위, 사화, 주성, 보성, 하우스, 트랜짓, 어센던트 등의 용어를 해석 텍스트에 절대 사용하지 마세요.
- 카드 의미를 사전식으로 나열하지 마세요.
- 3가지 타로 해석이 동일한 문장/표현을 반복하지 않도록 각각 독립적으로 작성하세요.
- 절대적 부정("절대 안 됩니다", "불가능합니다") 표현 금지.
- 공포를 조장하는 표현 금지.
- 역방향 카드는 "에너지 차단", "내면에서 진행 중", "과거가 해소되는 과정" 중 적합한 관점으로 해석하고, 반드시 희망적 출구를 제시하세요.

【 해석 방식 】
- 카드를 개별 나열하지 말고, 스토리텔링 흐름으로 엮으세요:
  * 5장 스프레드: 내 마음 → 상대방 마음 → 현재 관계 → 장애물 → 결과
  * 3장 스프레드: 현재 상황 → 도전/과제 → 미래/조언
- 각 타로별 해석 끝에 "핵심 메시지"를 한 문장으로 요약하세요.
- 구체적 시기를 포함하세요 (예: "3월 중순까지", "5월 전후로"). 시기는 현재 날짜 기준 향후 3~6개월 범위 내에서 자연스럽게 배치하세요.

【 교차검증 (내부 처리) 】
- 사주팔자, 서양 점성술, 자미두수 각각에서 질문에 대한 방향성(긍정/중립/부정)과 키워드 3개를 내부적으로 도출하세요.
- 웨이트 타로, 최한나 타로, 모나드 타로 각각에서도 방향성과 키워드 3개를 도출하세요.
- 6개 체계 중 방향성이 일치하거나 키워드가 2개 이상 겹치는 체계를 "수렴"으로 판정.
- 수렴 체계 수에 따라 등급 부여:
  * S등급: 6개 전체 수렴
  * A등급: 5개 수렴
  * B등급: 4개 수렴
  * C등급: 3개 이하 수렴
- 수렴도 등급은 고객에게 표시하되, 어떤 체계가 수렴했는지는 "타로 3종"만 표시하고 사주/점성/자미두수는 "내부 검증 완료"로만 표기.

【 톤 가이드 상세 】
웨이트 타로:
- "카드가 보여주는 흐름은..." / "이 배치에서 읽히는 에너지는..."
- 3인칭 관찰자 시점, 차분하고 정돈된 문장.

최한나 타로:
- "솔직히 말하면..." / "지금 네 마음이 이런 거 아니야?" / "걱정 마, 이건..."
- 2인칭, 편안한 반말 톤, 감정을 먼저 읽고 현실 조언으로 연결.

모나드 타로:
- "이 카드는 당신의 영혼에게 말합니다..." / "우주가 지금 당신에게 보내는 신호는..."
- 시적이고 은유적, 성장과 깨달음 관점, 존댓말.`;

const LOVE_PROMPTS: Record<string, string> = {
  solo: `[솔로]
- 연애 DNA: 내가 사랑에 빠지는 패턴, 무의식적 행동, 연애 스타일 (주도형/수용형/전략형/올인형)
- 약점 진단: 연애를 막는 핵심 요인 1가지와 개선 방향
- 새 인연 타이밍: 향후 6개월 내 만남 가능성이 높은 시기 (월 단위)
- 인연 프로필: 잘 맞는 상대의 성격·분위기·만남 장소 힌트
- 실천 가이드: 이번 달 해야 할 것 3가지, 하지 말아야 할 것 3가지`,
  some: `[썸/일정 있는 관계]
- 상대방 마음 흐름: 현재 상대의 관심도와 감정 방향
- 관계 성공 확률: 높음/보통/낮음 + 근거
- 고백/진전 타이밍: 최적 시기와 방법 힌트
- 주의 신호: 이 관계에서 조심해야 할 패턴
- 실천 가이드`,
  dating: `[연애 중]
- 관계 현재 온도: 뜨거움/따뜻함/미지근/차가움 + 원인
- 갈등 경고: 향후 3개월 내 갈등 가능 시기와 원인
- 관계 깊어지는 법: 구체적 행동 제안
- 다음 단계 타이밍: 동거/여행/소개 등 관계 진전 시점
- 실천 가이드`,
  breakup: `[이별 후 / 재회 고민]
- 이별 원인 에너지 분석: 카드로 읽는 이별의 근본 원인
- 재회 가능성: 높음/보통/낮음 + 조건
- 재회 시도 적기: 시기와 접근 방법
- 놓아줘야 할 것: 집착 포인트 진단
- 새 출발 타이밍: 재회가 아닌 새 인연으로 갈 경우의 시기
- 실천 가이드`,
  marriage: `[결혼 고민 중]
- 궁합 에너지: 카드로 본 두 사람의 장기 호환성
- 결혼 적기: 올해 vs 내년 vs 더 기다림
- 결혼 후 변화: 관계 역학이 어떻게 달라지는지
- 핵심 체크포인트: 결혼 전 반드시 확인할 것 3가지
- 실천 가이드`,
};

const ROMANCE_STATUS_KR: Record<string, string> = {
  solo: "솔로",
  some: "썸",
  dating: "연애중",
  breakup: "이별후",
  marriage: "결혼고민",
};

function buildGradeInstruction(grade: string, isLove: boolean): string {
  switch (grade) {
    case "C":
      return `[등급 C 규칙]
- tarot_reading: waite만 포함. choihanna, monad는 null.
- love_analysis: null.
- action_guide: lucky만 포함. do_list, dont_list는 null.
- convergence: 간략하게.`;
    case "B":
      return `[등급 B 규칙]
- tarot_reading: waite + choihanna 포함. monad는 null.
- love_analysis: ${isLove ? "status_specific.main_insight만 포함, 나머지 null." : "null."}
- action_guide: lucky + do_list 포함. dont_list는 null.`;
    case "A":
      return `[등급 A 규칙]
- tarot_reading: 3종 모두 포함.
- love_analysis: ${isLove ? "love_dna + status_specific 포함, timeline은 3개월(month_1~month_3)만." : "null."}
- action_guide: 모두 포함.`;
    case "S":
    default:
      return `[등급 S 규칙]
- 모든 필드 완전 포함.
- love_analysis: ${isLove ? "timeline 6개월. partner_profile 포함. 모든 항목 완전 포함." : "null."}
- action_guide: 모두 포함.`;
  }
}

function buildSajuSection(manseryeokData: any, forcetellData: string | null, sajuData: any): string {
  if (forcetellData) {
    let s = `[포스텔러 원본 데이터 (수동 입력)]\n${forcetellData}`;
    if (manseryeokData) {
      s += `\n\n[만세력 자동 계산 (참고용)]\n사주 원국: ${manseryeokData.yearPillar?.cheongan}${manseryeokData.yearPillar?.jiji} / ${manseryeokData.monthPillar?.cheongan}${manseryeokData.monthPillar?.jiji} / ${manseryeokData.dayPillar?.cheongan}${manseryeokData.dayPillar?.jiji} / ${manseryeokData.hourPillar?.cheongan}${manseryeokData.hourPillar?.jiji}\n일간: ${manseryeokData.ilgan}(${manseryeokData.ilganElement}, ${manseryeokData.ilganYinyang})`;
    }
    return s;
  }
  if (manseryeokData) {
    return `[만세력 자동 계산 데이터]
사주 원국: ${manseryeokData.yearPillar?.cheongan}${manseryeokData.yearPillar?.jiji} / ${manseryeokData.monthPillar?.cheongan}${manseryeokData.monthPillar?.jiji} / ${manseryeokData.dayPillar?.cheongan}${manseryeokData.dayPillar?.jiji} / ${manseryeokData.hourPillar?.cheongan}${manseryeokData.hourPillar?.jiji}
일간: ${manseryeokData.ilgan}(${manseryeokData.ilganElement}, ${manseryeokData.ilganYinyang})
연주 오행: ${manseryeokData.yearPillar?.cheonganElement}/${manseryeokData.yearPillar?.jijiElement}
월주 오행: ${manseryeokData.monthPillar?.cheonganElement}/${manseryeokData.monthPillar?.jijiElement}
일주 오행: ${manseryeokData.dayPillar?.cheonganElement}/${manseryeokData.dayPillar?.jijiElement}
시주 오행: ${manseryeokData.hourPillar?.cheonganElement}/${manseryeokData.hourPillar?.jijiElement}
${manseryeokData.lunarDate ? `음력: ${manseryeokData.lunarDate.year}년 ${manseryeokData.lunarDate.month}월 ${manseryeokData.lunarDate.day}일${manseryeokData.lunarDate.isLeapMonth ? " (윤달)" : ""}` : ""}
${manseryeokData.hanjaString ? `한자: ${manseryeokData.hanjaString}` : ""}`;
  }
  if (sajuData) {
    return `[내부 계산 사주 데이터]\n사주 원국: ${sajuData.yearPillar?.cheongan || ""}${sajuData.yearPillar?.jiji || ""} / ${sajuData.monthPillar?.cheongan || ""}${sajuData.monthPillar?.jiji || ""} / ${sajuData.dayPillar?.cheongan || ""}${sajuData.dayPillar?.jiji || ""} / ${sajuData.hourPillar?.cheongan || ""}${sajuData.hourPillar?.jiji || ""}
일간: ${sajuData.ilgan || ""}(${sajuData.ilganElement || ""})`;
  }
  return "출생정보 미제공";
}

function extractJSON(raw: string): any {
  let content = raw.trim();
  // Strip markdown code fences
  content = content.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const first = content.indexOf("{");
  const last = content.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("No JSON object found");
  return JSON.parse(content.slice(first, last + 1));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GOOGLE_GEMINI_API_KEY) throw new Error("GOOGLE_GEMINI_API_KEY is not configured");

    const {
      question, questionType, memo, cards, sajuData, birthInfo,
      astrologyData, ziweiData, manseryeokData, forcetellData,
      romanceStatus, grade,
    } = await req.json();

    const selectedGrade = grade || "C";
    const isLove = !!romanceStatus;
    const today = new Date().toISOString().slice(0, 10);

    // Positions based on card count
    const positions5 = ["내 마음", "상대방 마음", "현재 관계", "장애물", "결과"];
    const positions3 = ["현재 상황", "도전/과제", "미래/조언"];

    const cardDescriptions = (cards || [])
      .map((c: any, idx: number) => {
        const pos = cards.length >= 5 ? (positions5[idx] || `위치${idx + 1}`) : (positions3[idx] || `위치${idx + 1}`);
        const dir = c.isReversed ? "역" : "정";
        return `${idx + 1}번-${c.korean || c.name}(${dir}) [위치: ${pos}]`;
      })
      .join(", ");

    const sajuSection = buildSajuSection(manseryeokData, forcetellData, sajuData);

    // Build love section
    let loveSection = "";
    if (isLove && romanceStatus) {
      const statusKr = ROMANCE_STATUS_KR[romanceStatus] || romanceStatus;
      loveSection = `\n\n[연애 심화 분석 요청]
사용자의 연애 상태: ${statusKr}

연애 상태에 따라 아래 항목을 분석에 포함하세요:
${LOVE_PROMPTS[romanceStatus] || ""}`;
    }

    // Grade instruction
    const gradeInstruction = buildGradeInstruction(selectedGrade, isLove);

    // Build user prompt
    const birthDate = birthInfo?.birthDate || "미제공";
    const birthHour = birthInfo?.birthTime || "미제공";
    const genderStr = birthInfo?.gender === "male" ? "남성" : birthInfo?.gender === "female" ? "여성" : "미제공";
    const lunarStr = manseryeokData?.lunarDate
      ? `${manseryeokData.lunarDate.year}년 ${manseryeokData.lunarDate.month}월 ${manseryeokData.lunarDate.day}일${manseryeokData.lunarDate.isLeapMonth ? " (윤달)" : ""}`
      : "미제공";

    const userPrompt = `[사용자 정보]
- 생년월일: ${birthDate} (${birthInfo?.isLunar ? "음력" : "양력"})
- 음력 변환: ${lunarStr}
- 출생시간: ${birthHour}
- 성별: ${genderStr}
- 질문: ${question}${memo ? `\n- 추가 상황: ${memo}` : ""}
- 연애 상태: ${isLove ? ROMANCE_STATUS_KR[romanceStatus] : "해당없음"}
- 분석 등급: ${selectedGrade}
- 오늘 날짜: ${today}

[내부 참고 데이터 – 고객에게 노출 금지]
${sajuSection}

[선택된 카드]
${cardDescriptions}
${loveSection}

${gradeInstruction}

위 정보를 기반으로 시스템 프롬프트의 규칙에 따라 분석하고,
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트를 추가하지 마세요.

{
  "reading_info": {
    "question": "사용자 질문",
    "grade": "${selectedGrade}",
    "date": "${today}",
    "card_count": ${cards?.length || 3}
  },
  "tarot_reading": {
    "waite": {
      "cards": [{"name": "카드명", "position": "위치", "reversed": false}],
      "story": "스토리텔링 해석 (300~500자)",
      "key_message": "핵심 메시지 한 문장"
    },
    "choihanna": ${selectedGrade === "C" ? "null" : `{
      "cards": [{"name": "카드명", "position": "위치", "reversed": false}],
      "story": "스토리텔링 해석 (300~500자)",
      "key_message": "핵심 메시지 한 문장"
    }`},
    "monad": ${selectedGrade === "C" || selectedGrade === "B" ? "null" : `{
      "cards": [{"name": "카드명", "position": "위치", "reversed": false}],
      "story": "스토리텔링 해석 (300~500자)",
      "key_message": "핵심 메시지 한 문장"
    }`}
  },
  "convergence": {
    "total_systems": 6,
    "converged_count": 0,
    "grade": "S/A/B/C",
    "tarot_convergence": {
      "count": 0,
      "systems": ["웨이트 타로", "최한나 타로", "모나드 타로"],
      "common_keywords": ["키워드1", "키워드2", "키워드3"]
    },
    "internal_validation": "내부 검증 완료 (3개 추가 체계 교차확인)",
    "common_message": "6개 체계가 공통으로 가리키는 핵심 메시지",
    "divergent_note": null
  },
  "love_analysis": ${!isLove ? "null" : `{
    "status": "${ROMANCE_STATUS_KR[romanceStatus] || ""}",
    "love_dna": ${selectedGrade === "C" || selectedGrade === "B" ? "null" : `{"style": "", "pattern": "", "weakness": ""}`},
    "timeline": ${selectedGrade === "C" || selectedGrade === "B" ? "null" : selectedGrade === "A" ? `{"month_1": {"period": "", "theme": "", "detail": ""}, "month_2": {"period": "", "theme": "", "detail": ""}, "month_3": {"period": "", "theme": "", "detail": ""}}` : `{"month_1": {"period": "", "theme": "", "detail": ""}, "month_2": {"period": "", "theme": "", "detail": ""}, "month_3": {"period": "", "theme": "", "detail": ""}, "month_4": {"period": "", "theme": "", "detail": ""}, "month_5": {"period": "", "theme": "", "detail": ""}, "month_6": {"period": "", "theme": "", "detail": ""}}`},
    "partner_profile": ${selectedGrade === "S" ? `{"personality": "", "atmosphere": "", "meeting_place": ""}` : "null"},
    "status_specific": {
      "main_insight": "상태별 핵심 분석 (200~400자)",
      "probability": "높음|보통|낮음",
      "timing": "최적 시기",
      "warning": "주의사항"
    }
  }`},
  "action_guide": {
    "do_list": ${selectedGrade === "C" ? "null" : `["해야 할 것 1", "해야 할 것 2", "해야 할 것 3"]`},
    "dont_list": ${selectedGrade === "C" || selectedGrade === "B" ? "null" : `["하지 말아야 할 것 1", "하지 말아야 할 것 2", "하지 말아야 할 것 3"]`},
    "lucky": {
      "color": "행운 색상",
      "number": "행운 숫자",
      "direction": "행운 방위",
      "day": "행운 요일/날짜",
      "item": "행운 아이템"
    }
  },
  "final_message": {
    "title": "리딩 제목 (감성적, 10자 내외)",
    "summary": "종합 리딩 요약 (400~600자, 따뜻하고 희망적 톤)"
  }
}`;

    // Model selection based on grade
    const model = selectedGrade === "S" || selectedGrade === "A"
      ? "gemini-2.5-pro-preview-06-05"
      : "gemini-2.0-flash-001";

    const maxTokens = selectedGrade === "S" ? 16000 : selectedGrade === "A" ? 14000 : selectedGrade === "B" ? 10000 : 6000;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_GEMINI_API_KEY}`;

    const geminiBody = {
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: {
        temperature: selectedGrade === "S" ? 0.85 : 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: maxTokens,
        responseMimeType: "application/json",
      },
    };

    let reading: any = null;
    let lastError: string = "";

    // Try up to 2 times
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const resp = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiBody),
        });

        if (!resp.ok) {
          const errText = await resp.text();
          lastError = `Gemini API error: ${resp.status} - ${errText.slice(0, 300)}`;
          console.error(`Attempt ${attempt + 1} failed:`, lastError);
          continue;
        }

        const data = await resp.json();
        const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawContent) {
          lastError = "Empty response from AI";
          console.error(`Attempt ${attempt + 1}: empty response`);
          continue;
        }

        reading = extractJSON(rawContent);
        break;
      } catch (e: any) {
        lastError = e.message || "Parse error";
        console.error(`Attempt ${attempt + 1} parse error:`, lastError);
      }
    }

    if (!reading) {
      throw new Error(`분석 중 오류가 발생했습니다. 다시 시도해 주세요. (${lastError})`);
    }

    return new Response(JSON.stringify({ reading }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("ai-reading-v3 error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

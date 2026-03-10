/**
 * interactivityLayer.ts
 * - 다국어(KR, JP, US) 대응 및 어조/문화권별 시스템 프롬프트 관리
 */

export interface LocalePromptConfig {
  systemRole: string;
  toneDirective: string;
  outputLanguage: string;
  culturalContext: string;
  showSaju: boolean;
  showZiwei: boolean;
  showEmotionFlow: boolean;
  tarotStyle: { waite: string; second: string; third: string };
  sectionNames: {
    waite: string; second: string; third: string;
    convergence: string; love: string; action: string; final: string;
  };
}

const LOCALE_PROMPT_CONFIGS: Record<string, LocalePromptConfig> = {
  kr: {
    systemRole: "당신은 세계 최고의 통합 점술 상담사입니다.",
    toneDirective: "따뜻하고 공감적인 한국식 상담 어조를 사용하세요. 존댓말을 사용하세요.",
    outputLanguage: "모든 텍스트를 한국어로 작성하세요.",
    culturalContext: "한국 문화에 맞는 점술 용어와 해석 방식을 사용하세요. 사주, 자미두수 등 동양 점술을 깊이 반영하세요.",
    showSaju: true,
    showZiwei: true,
    showEmotionFlow: false,
    tarotStyle: {
      waite: "웨이트 전통 해석 관점으로 상세 스토리를 작성하세요",
      second: "최한나식 직관적 감정 공감 상담 스타일로 작성하세요",
      third: "구조적·상징적 모나드 분석 관점으로 작성하세요"
    },
    sectionNames: {
      waite: "웨이트 타로", second: "최한나 타로", third: "모나드 타로",
      convergence: "교차검증 결과", love: "연애 심층 분석", action: "실천 가이드", final: "종합 메시지"
    }
  },
  jp: {
    systemRole: "あなたは世界最高峰の占い鑑定師です。",
    toneDirective: "穏やかで思いやりのある日本語で書いてください。丁寧語を使用してください。相談者の感情に寄り添うような表現을心がけてください。",
    outputLanguage: "すべてのテキストを日本語で書いてください。",
    culturalContext: "日本の占い文化に合わせた解釈をしてください. タロットと西洋占星術を中心に, 感情の流れを重視してください. 四柱推命や紫微斗数は内部検証データとしてのみ参照し, 直接言及しないでください.",
    showSaju: false,
    showZiwei: false,
    showEmotionFlow: true,
    tarotStyle: {
      waite: "ウェ이트版タロットの伝統的な解釈で詳細なストーリーを書いてください",
      second: "直感的で感情に寄り添うカウンセリングスタイルで書いてください",
      third: "象徴的・構造的分析の視点で書いてください"
    },
    sectionNames: {
      waite: "ウェ이트版リーディング", second: "直感リーディング", third: "象徴分析",
      convergence: "クロス検証結果", love: "恋愛詳細分析", action: "実践ガイド", final: "総合メッセージ"
    }
  },
  us: {
    systemRole: "You are the world's top spiritual reading advisor and cosmic guide.",
    toneDirective: "Write in direct, empowering, coaching-style English. Be warm but actionable. Use inclusive, modern spiritual language.",
    outputLanguage: "Write all text in English.",
    culturalContext: "Focus on Tarot and Western Astrology. Reference chakras, energy, and cosmic alignment where appropriate. Do not directly mention Saju or Zi Wei Dou Shu — use their data as internal validation only.",
    showSaju: false,
    showZiwei: false,
    showEmotionFlow: false,
    tarotStyle: {
      waite: "Write from a traditional Rider-Waite Tarot interpretation perspective with rich storytelling",
      second: "Write from an intuitive, heart-centered counseling perspective with emotional depth",
      third: "Write from a structural, archetypal analysis perspective using Jungian symbolism"
    },
    sectionNames: {
      waite: "Classic Tarot Reading", second: "Intuitive Reading", third: "Archetypal Analysis",
      convergence: "Cross-Validation Results", love: "Love Deep Dive", action: "Action Guide", final: "Final Message"
    }
  }
};

export function getLocalePromptConfig(locale: string): LocalePromptConfig {
  return LOCALE_PROMPT_CONFIGS[locale] || LOCALE_PROMPT_CONFIGS.kr;
}

/**
 * locale에 따라 Gemini 시스템 프롬프트를 동적으로 생성
 */
export function buildLocalizedNarrativePrompt(locale: string, dataBlock: string): string {
  const cfg = getLocalePromptConfig(locale);
  
  // 연애 관련 love_analysis 스키마는 동일 (단, 출력 언어만 변경)
  const loveSchemaNote = locale === "kr" 
    ? `"love_analysis"는 연애·재회 질문일 때만 채움, 아니면 null`
    : locale === "jp"
    ? `"love_analysis" は恋愛・復縁の質問の場合のみ入力. それ以外はnull`
    : `"love_analysis" should only be filled for love/reunion questions, otherwise null`;

  // JP/US에서 사주/자미두수를 직접 노출하지 않으므로 merged_reading에서도 조정
  const mergedReadingSchema = cfg.showSaju
    ? `"structureInsight": "사주 기반 구조적 통찰",`
    : locale === "jp"
    ? `"structureInsight": "内面的エネルギー分析（四柱推命データを基に、直接言及せず）",`
    : `"structureInsight": "Inner energy analysis (based on internal Eastern system data, not directly referenced)",`;

  const longTermSchema = cfg.showZiwei
    ? `"longTermFlow": "자미두수 기반 장기 흐름",`
    : locale === "jp"
    ? `"longTermFlow": "長期的な人生の流れ（紫微斗数データを基に、直接言及せず）",`
    : `"longTermFlow": "Long-term life flow (informed by internal cosmic mapping)",`;

  return `
${cfg.systemRole}
${cfg.toneDirective}
${cfg.outputLanguage}
${cfg.culturalContext}

아래 분석 데이터를 바탕으로, 반드시 아래 JSON 구조로만 응답하세요.
JSON 외의 텍스트를 절대 포함하지 마세요.

출력 JSON 스키마:
{
  "reading_info": { "question": "...", "grade": "S|A|B|C", "date": "YYYY-MM-DD", "card_count": N },
  "tarot_reading": {
    "waite": {
      "cards": [{"name":"...","position":"...","reversed":boolean}],
      "story": "${cfg.tarotStyle.waite}. 400자/400文字/400 words 이상.",
      "key_message": "핵심 한 줄"
    },
    "choihanna": {
      "cards": [...],
      "story": "${cfg.tarotStyle.second}. 400+.",
      "key_message": "..."
    },
    "monad": {
      "cards": [...],
      "story": "${cfg.tarotStyle.third}. 400+.",
      "key_message": "..."
    }
  },
  "convergence": {
    "total_systems": 6,
    "converged_count": N,
    "grade": "S|A|B|C",
    "tarot_convergence": { "count": 3, "systems": ["${cfg.sectionNames.waite}","${cfg.sectionNames.second}","${cfg.sectionNames.third}"], "common_keywords": [...] },
    "internal_validation": "통과|passed|合格",
    "common_message": "...(100+ chars)",
    "divergent_note": "..."
  },
  "love_analysis": { ${loveSchemaNote} },
  "action_guide": {
    "do_list": ["...", "...", "..."],
    "dont_list": ["...", "...", "..."],
    "lucky": { "color": "...", "number": "...", "direction": "...", "day": "...", "item": "..." }
  },
  "final_message": { "title": "...(20자 이내)", "summary": "...(300+ chars)" },
  "merged_reading": {
    "coreReading": "...(200+)",
    ${mergedReadingSchema}
    "currentSituation": "...(200+)",
    "timingInsight": "...(200+)",
    ${longTermSchema}
    "finalAdvice": "...(200+)"
  },
  "scores": { "tarot": 0~100, "saju": 0~100, "astrology": 0~100, "ziwei": 0~100, "overall": 0~100 }
}

[분석 데이터]
${dataBlock}
`;
}

// 기존 함수 유지 (하위 호환)
export function getLocalizedStyle(lang: string, _baseReading: string): string {
  const cfg = getLocalePromptConfig(lang);
  return cfg.toneDirective;
}

export async function processChat(_apiKey: string, question: string, context: any): Promise<string> {
  const intent = question.includes("연애") || question.includes("恋") || /love|relationship/i.test(question) 
    ? "love" 
    : question.includes("돈") || question.includes("金") || /money/i.test(question) 
    ? "money" 
    : "general";
  
  return `상담 결과: ${intent} 운세에 대한 분석이 완료되었습니다. ${context?.summary || ""}`;
}

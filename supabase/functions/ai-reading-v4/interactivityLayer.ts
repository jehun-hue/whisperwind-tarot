/**
 * interactivityLayer.ts
 * - 다국어(KR, JP, US) 대응 및 어조/문화권별 시스템 프롬프트 관리
 * - V9: AI Narrative Orchestrator 모델 적용
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
    systemRole: "당신은 다양한 점술 엔진의 결과를 통합하여 하나의 완성된 이야기를 들려주는 **AI 내러티브 오케스트레이터(Narrative Orchestrator)**입니다.",
    toneDirective: "따뜻하고 공감적인 상담 어조를 사용하되, 엔진이 제공한 '확정된 상징'을 근거로 전문성 있게 서술하세요. 존댓말을 사용하세요.",
    outputLanguage: "모든 텍스트를 한국어로 작성하세요.",
    culturalContext: "제공된 데이터(사주, 자미두수, 점성술 등)를 개별적으로 계산하려 들지 마세요. 이미 엔진에서 계산·상징화 완료된 결과를 '조합'하여 사용자에게 최상의 통찰을 제공하는 것이 당신의 사명입니다.",
    showSaju: true,
    showZiwei: true,
    showEmotionFlow: false,
    tarotStyle: {
      waite: "웨이트 전통 해석 관점으로 상세 스토리를 작성하세요",
      second: "최한나식 현실적이고 직설적인 한국형 상담 톤으로 작성하세요. 막연한 위로보다 조심할 점과 실행할 점을 분명히 제시하세요. [구성: 핵심 진단, 현실 경고, 바로 실행할 조언]",
      third: "영성·카르마·그림자·성장 관점의 모나드 고유 세계관을 기반으로 작성하세요. 현재 삶의 패턴 속에서 이 상징이 등장한 이유를 구조적으로 설명하세요. [구성: 상징 해석, 내면 패턴, 성장 과제, 실천 제안]"
    },
    sectionNames: {
      waite: "웨이트 타로", second: "최한나 타로", third: "모나드 타로",
      convergence: "교차검증 결과", love: "연애 심층 분석", action: "실천 가이드", final: "종합 메시지"
    }
  },
  jp: {
    systemRole: "あなたは、複数の専門的な占術エンジンの結果を統合し、一つの完成された物語を紡ぎ出す **AIナラティブ・オー케스트레이터 (Narrative Orchestrator)** です。",
    toneDirective: "穏やかで思いやりのある丁寧な日本語を使用してください。エンジンが提供した「確定した象徴」を基に、専門性と深い洞察を持って記述してください。",
    outputLanguage: "すべてのテキストを日本語で書いてください。",
    culturalContext: "提供されたデータ（四柱推命、紫微斗数、占星術など）を個別に計算しようとしないでください。すでにエンジンによって計算・象徴化が完了した結果を「組み合わせ」て、相談者に最高の洞察を提供することがあなたの使命です。",
    showSaju: false,
    showZiwei: false,
    showEmotionFlow: true,
    tarotStyle: {
      waite: "ウェイト版タロットの伝統的な解釈で詳細なストーリーを書いてください",
      second: "直感的で感情に寄り添うカウンセリングスタイルで書いてください",
      third: "象徴的・構造的分析の視点で書いてください"
    },
    sectionNames: {
      waite: "ウェ이트版リーディング", second: "直感リーディング", third: "象徴分析",
      convergence: "クロス検証結果", love: "恋愛詳細分析", action: "実践ガイド", final: "総合メッセージ"
    }
  },
  us: {
    systemRole: "You are the **AI Narrative Orchestrator**, a cosmic guide who weaves together results from multiple expert divination engines into a single, cohesive story.",
    toneDirective: "Write in direct, empowering, coaching-style English. Use the 'fixed symbolic results' provided by the engines as your absolute foundation. Do not speculate beyond the given data.",
    outputLanguage: "Write all text in English.",
    culturalContext: "Your mission is to synthesize results from Tarot, Astrology, Saju, and Numerology into a unified vision. Do not attempt to recalculate raw data; instead, focus on high-quality narrative assembly and life coaching.",
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
export function buildLocalizedNarrativePrompt(locale: string, dataBlock: string, totalSystems: number, style: 'hanna' | 'monad' = 'hanna'): string {
  const cfg = getLocalePromptConfig(locale);
  const isMonad = style === 'monad';
  const tarotStyleStr = isMonad ? cfg.tarotStyle.third : cfg.tarotStyle.second;
  const tarotName = isMonad ? cfg.sectionNames.third : cfg.sectionNames.second;
  const tarotKey = isMonad ? "monad" : "choihanna";
  
  // 연애 관련 love_analysis 스키마는 동일 (단, 출력 언어만 변경)
  const loveSchemaNote = locale === "kr" 
    ? `"love_analysis"는 연애·재회 질문일 때만 채움, 아니면 null`
    : locale === "jp"
    ? `"love_analysis" は恋愛・復縁の質問の場合のみ入力. それ以外はnull`
    : `"love_analysis" should only be filled for love/reunion questions, otherwise null`;

  // JP/US에서 사주/자미두수를 직접 노출하지 않으므로 merged_reading에서도 조정
  const mergedReadingSchema = cfg.showSaju
    ? `"structureInsight": "사회흐름→절기 기반 기질→핵심 코드→전략→행동계획 5단계 분석",`
    : locale === "jp"
    ? `"structureInsight": "内面的エネルギー分析（四柱推命データを基に、直接言게 하지 않음）",`
    : `"structureInsight": "Inner energy analysis (based on internal Eastern system data, not directly referenced)",`;

  const longTermSchema = cfg.showZiwei
    ? `"longTermFlow": "자미두수 기반 장기 흐름",`
    : locale === "jp"
    ? `"longTermFlow": "長期的な人生の流れ（紫微斗数データを基に、直接言게 하지 않음）",`
    : `"longTermFlow": "Long-term life flow (informed by internal cosmic mapping)",`;

  return `
${cfg.systemRole}
${cfg.toneDirective}
${cfg.outputLanguage}
${cfg.culturalContext}

아래 분석 데이터를 바탕으로, 반드시 아래 JSON 구조로만 응답하세요.
JSON 외의 다른 텍스트(설명, 인사 등)를 절대 포함하지 마세요. 
답변은 기계적으로 파싱되므로 마크다운 코드 펜스(\`\`\`json)를 포함하지 말고 순수 JSON 문자열만 출력하세요. 
모든 문자열 값 내의 줄바꿈은 반드시 \\\\n으로 이스케이프 처리해야 합니다.

출력 JSON 스키마:
{
  "reading_info": { "question": "...", "grade": "S|A|B|C", "date": "YYYY-MM-DD", "card_count": N },
  "tarot_reading": {
    "${tarotKey}": {
      "cards": [{"name":"...","position":"...","reversed":boolean}],
      "story": "${tarotStyleStr}. 400자/400文字/400 words 이상.",
      "key_message": "핵심 한 줄"
    }
  },
  "convergence": {
    "total_systems": \${totalSystems},
    "converged_count": N,
    "grade": "S|A|B|C",
    "tarot_convergence": { "count": 1, "systems": ["${tarotName}"], "common_keywords": [...] },
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

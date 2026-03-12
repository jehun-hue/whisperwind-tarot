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
      second: "최한나 특유의 직접적이고 감성적인 톤으로 다음 4단계 구조에 맞춰 상세히 서술하세요: 1. 카드별 1줄 해석(각 카드의 포지션+카드명+정/역방향+핵심 키워드를 한 줄씩 명확하게 정리. 같은 수트 카드가 여러 장이어도 각각 다른 키워드로 구분할 것), 2. 카드 흐름 연결(역방향/정방향 패턴을 포함한 전체 서사 흐름을 하나의 스토리로 연결. 예: 역방향 4장+정방향 1장 구조가 의미하는 터닝포인트를 반드시 언급), 3. 운명학 교차 분석(타로 카드의 원소(불/물/흙/공기)와 사주 오행, 점성술 원소를 명시적으로 연결. 반드시 'A이기 때문에 B카드가 이를 확인한다' 형식의 논리 연결 사용. 단순 나열 금지), 4. 종합 결론(핵심 메시지를 한 문장으로 먼저 제시 후 상세 설명. 즉시 실행 가능한 구체적 조언 2~3개 포함)",
      third: "철학적·영적 통찰을 담은 모나드 특유의 톤으로 다음 4단계 구조에 맞춰 분석하세요: 1. 카드별 1줄 해석(각 카드의 포지션+카드명+정/역방향+본질적 키워드를 한 줄씩 정리. 같은 수트 카드가 여러 장이어도 각각 다른 원형적 의미로 구분할 것), 2. 카드 흐름 연결(역방향/정방향 패턴을 포함한 전체 서사 흐름을 운명적 관점에서 하나의 스토리로 연결. 구조적 패턴이 있으면 반드시 언급), 3. 운명학 교차 분석(타로 카드의 원소와 사주 오행, 점성술 원소, 자미두수 명궁 에너지를 명시적으로 연결. 반드시 논리적 인과 형식으로 서술. 단순 나열 금지), 4. 종합 결론(핵심 통찰을 한 문장으로 먼저 제시 후 철학적 확장. 영혼의 관점에서 본 실천 방향 2~3개 포함)"
    },
    sectionNames: {
      waite: "웨이트 타로", second: "최한나 타로", third: "모나드 타로",
      convergence: "교차검증 결과", love: "연애 심층 분석", action: "실천 가이드", final: "종합 관점 제언"
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
      second: "Write from an intuitive, heart-centered counseling perspective using the following structure: 1. Card-by-card 1-line interpretation (Summarize 'Position + Card Name + Upright/Reversed + Core Meaning' for each card), 2. Position-based integrated interpretation (Analyze 5 positions: Current Situation, Core Obstacle, Hidden Influence, Advice, Outcome tailored to the question category)",
      third: "Write from a structural, archetypal analysis perspective using the following structure: 1. Card-by-card 1-line interpretation (Summarize 'Position + Card Name + Upright/Reversed + Core Meaning' from an archetypal viewpoint), 2. Position-based integrated interpretation (Analyze 5 positions: Current Situation, Core Obstacle, Hidden Influence, Advice, Outcome as a structural psychological/spiritual flow)"
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
    "coreReading": "사주·점성술·자미두수·수비학 4개 시스템 데이터를 기반으로 한 객관적인 운명 분석 요약 (타로 내용 포함 금지, 200+자)",
    ${mergedReadingSchema}
    "currentSituation": "...(200+)",
    "timingInsight": "...(200+)",
    ${longTermSchema}
    "finalAdvice": "4개 시스템 분석 기반의 구체적 행동 조언, 방향, 타이밍, 주의사항 (타로 해석과 중복 금지, '종합 관점 제언'으로서 작성, 200+자)"
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

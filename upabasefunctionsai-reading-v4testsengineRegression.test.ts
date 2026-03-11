warning: in the working copy of 'supabase/functions/ai-reading-v4/interactivityLayer.ts', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/supabase/functions/ai-reading-v4/interactivityLayer.ts b/supabase/functions/ai-reading-v4/interactivityLayer.ts[m
[1mindex 7324a6b..605bd1b 100644[m
[1m--- a/supabase/functions/ai-reading-v4/interactivityLayer.ts[m
[1m+++ b/supabase/functions/ai-reading-v4/interactivityLayer.ts[m
[36m@@ -1,6 +1,7 @@[m
 /**[m
  * interactivityLayer.ts[m
  * - 다국어(KR, JP, US) 대응 및 어조/문화권별 시스템 프롬프트 관리[m
[32m+[m[32m * - V9: AI Narrative Orchestrator 모델 적용[m
  */[m
 [m
 export interface LocalePromptConfig {[m
[36m@@ -20,17 +21,17 @@[m [mexport interface LocalePromptConfig {[m
 [m
 const LOCALE_PROMPT_CONFIGS: Record<string, LocalePromptConfig> = {[m
   kr: {[m
[31m-    systemRole: "당신은 세계 최고의 통합 점술 상담사입니다.",[m
[31m-    toneDirective: "따뜻하고 공감적인 한국식 상담 어조를 사용하세요. 존댓말을 사용하세요.",[m
[32m+[m[32m    systemRole: "당신은 다양한 점술 엔진의 결과를 통합하여 하나의 완성된 이야기를 들려주는 **AI 내러티브 오케스트레이터(Narrative Orchestrator)**입니다.",[m
[32m+[m[32m    toneDirective: "따뜻하고 공감적인 상담 어조를 사용하되, 엔진이 제공한 '확정된 상징'을 근거로 전문성 있게 서술하세요. 존댓말을 사용하세요.",[m
     outputLanguage: "모든 텍스트를 한국어로 작성하세요.",[m
[31m-    culturalContext: "한국 문화에 맞는 점술 용어와 해석 방식을 사용하세요. 사주, 자미두수 등 동양 점술을 깊이 반영하세요.",[m
[32m+[m[32m    culturalContext: "제공된 데이터(사주, 자미두수, 점성술 등)를 개별적으로 계산하려 들지 마세요. 이미 엔진에서 계산·상징화 완료된 결과를 '조합'하여 사용자에게 최상의 통찰을 제공하는 것이 당신의 사명입니다.",[m
     showSaju: true,[m
     showZiwei: true,[m
     showEmotionFlow: false,[m
     tarotStyle: {[m
       waite: "웨이트 전통 해석 관점으로 상세 스토리를 작성하세요",[m
[31m-      second: "최한나식 직관적 감정 공감 상담 스타일로 작성하세요",[m
[31m-      third: "구조적·상징적 모나드 분석 관점으로 작성하세요"[m
[32m+[m[32m      second: "최한나식 현실적이고 직설적인 한국형 상담 톤으로 작성하세요. 막연한 위로보다 조심할 점과 실행할 점을 분명히 제시하세요. [구성: 핵심 진단, 현실 경고, 바로 실행할 조언]",[m
[32m+[m[32m      third: "영성·카르마·그림자·성장 관점의 모나드 고유 세계관을 기반으로 작성하세요. 현재 삶의 패턴 속에서 이 상징이 등장한 이유를 구조적으로 설명하세요. [구성: 상징 해석, 내면 패턴, 성장 과제, 실천 제안]"[m
     },[m
     sectionNames: {[m
       waite: "웨이트 타로", second: "최한나 타로", third: "모나드 타로",[m
[36m@@ -38,15 +39,15 @@[m [mconst LOCALE_PROMPT_CONFIGS: Record<string, LocalePromptConfig> = {[m
     }[m
   },[m
   jp: {[m
[31m-    systemRole: "あなたは世界最高峰の占い鑑定師です。",[m
[31m-    toneDirective: "穏やかで思いやりのある日本語で書いてください。丁寧語を使用してください。相談者の感情に寄り添うような表現을心がけてください。",[m
[32m+[m[32m    systemRole: "あなたは、複数の専門的な占術エンジンの結果を統合し、一つの完成された物語を紡ぎ出す **AIナラティブ・オー케스트레이터 (Narrative Orchestrator)** です。",[m
[32m+[m[32m    toneDirective: "穏やかで思いやりのある丁寧な日本語を使用してください。エンジンが提供した「確定した象徴」を基に、専門性と深い洞察を持って記述してください。",[m
     outputLanguage: "すべてのテキストを日本語で書いてください。",[m
[31m-    culturalContext: "日本の占い文化に合わせた解釈をしてください. タロットと西洋占星術を中心に, 感情の流れを重視してください. 四柱推命や紫微斗数は内部検証データとしてのみ参照し, 直接言及しないでください.",[m
[32m+[m[32m    culturalContext: "提供されたデータ（四柱推命、紫微斗数、占星術など）を個別に計算しようとしないでください。すでにエンジンによって計算・象徴化が完了した結果を「組み合わせ」て、相談者に最高の洞察を提供することがあなたの使命です。",[m
     showSaju: false,[m
     showZiwei: false,[m
     showEmotionFlow: true,[m
     tarotStyle: {[m
[31m-      waite: "ウェ이트版タロットの伝統的な解釈で詳細なストーリーを書いてください",[m
[32m+[m[32m      waite: "ウェイト版タロットの伝統的な解釈で詳細なストーリーを書いてください",[m
       second: "直感的で感情に寄り添うカウンセリングスタイルで書いてください",[m
       third: "象徴的・構造的分析の視点で書いてください"[m
     },[m
[36m@@ -56,10 +57,10 @@[m [mconst LOCALE_PROMPT_CONFIGS: Record<string, LocalePromptConfig> = {[m
     }[m
   },[m
   us: {[m
[31m-    systemRole: "You are the world's top spiritual reading advisor and cosmic guide.",[m
[31m-    toneDirective: "Write in direct, empowering, coaching-style English. Be warm but actionable. Use inclusive, modern spiritual language.",[m
[32m+[m[32m    systemRole: "You are the **AI Narrative Orchestrator**, a cosmic guide who weaves together results from multiple expert divination engines into a single, cohesive story.",[m
[32m+[m[32m    toneDirective: "Write in direct, empowering, coaching-style English. Use the 'fixed symbolic results' provided by the engines as your absolute foundation. Do not speculate beyond the given data.",[m
     outputLanguage: "Write all text in English.",[m
[31m-    culturalContext: "Focus on Tarot and Western Astrology. Reference chakras, energy, and cosmic alignment where appropriate. Do not directly mention Saju or Zi Wei Dou Shu — use their data as internal validation only.",[m
[32m+[m[32m    culturalContext: "Your mission is to synthesize results from Tarot, Astrology, Saju, and Numerology into a unified vision. Do not attempt to recalculate raw data; instead, focus on high-quality narrative assembly and life coaching.",[m
     showSaju: false,[m
     showZiwei: false,[m
     showEmotionFlow: false,[m
[36m@@ -94,15 +95,15 @@[m [mexport function buildLocalizedNarrativePrompt(locale: string, dataBlock: string)[m
 [m
   // JP/US에서 사주/자미두수를 직접 노출하지 않으므로 merged_reading에서도 조정[m
   const mergedReadingSchema = cfg.showSaju[m
[31m-    ? `"structureInsight": "사주 기반 구조적 통찰",`[m
[32m+[m[32m    ? `"structureInsight": "사회흐름→절기 기반 기질→핵심 코드→전략→행동계획 5단계 분석",`[m
     : locale === "jp"[m
[31m-    ? `"structureInsight": "内面的エネルギー分析（四柱推命データを基に、直接言及せず）",`[m
[32m+[m[32m    ? `"structureInsight": "内面的エネルギー分析（四柱推命データを基に、直接言게 하지 않음）",`[m
     : `"structureInsight": "Inner energy analysis (based on internal Eastern system data, not directly referenced)",`;[m
 [m
   const longTermSchema = cfg.showZiwei[m
     ? `"longTermFlow": "자미두수 기반 장기 흐름",`[m
     : locale === "jp"[m
[31m-    ? `"longTermFlow": "長期的な人生の流れ（紫微斗数データを基に、直接言及せず）",`[m
[32m+[m[32m    ? `"longTermFlow": "長期的な人生の流れ（紫微斗数データを基に、直接言게 하지 않음）",`[m
     : `"longTermFlow": "Long-term life flow (informed by internal cosmic mapping)",`;[m
 [m
   return `[m
[36m@@ -112,7 +113,9 @@[m [m${cfg.outputLanguage}[m
 ${cfg.culturalContext}[m
 [m
 아래 분석 데이터를 바탕으로, 반드시 아래 JSON 구조로만 응답하세요.[m
[31m-JSON 외의 텍스트를 절대 포함하지 마세요.[m
[32m+[m[32mJSON 외의 다른 텍스트(설명, 인사 등)를 절대 포함하지 마세요.[m[41m [m
[32m+[m[32m답변은 기계적으로 파싱되므로 마크다운 코드 펜스(\`\`\`json)를 포함하지 말고 순수 JSON 문자열만 출력하세요.[m[41m [m
[32m+[m[32m모든 문자열 값 내의 줄바꿈은 반드시 \\\\n으로 이스케이프 처리해야 합니다.[m
 [m
 출력 JSON 스키마:[m
 {[m

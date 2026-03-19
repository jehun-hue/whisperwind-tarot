import { SajuAnalysisResult } from "../aiSajuAnalysis.ts";
import { ServerZiWeiResult } from "../ziweiEngine.ts";
import { NumerologyResult } from "../numerologyEngine.ts";
import { AstrologyResult, TarotResult, CrossValidationResult } from "./inferenceLayer.ts";
import { UnifiedTimeline } from "./timelineEngine.ts";

export interface UserInfo {
  name: string;
  birthDate: string;
  birthTime: string;
  gender: string;
  question: string;
  language: 'ko' | 'en' | 'ja';
}

/**
 * C14~C15: promptBuilder 업데이트 (타임라인 + 페르소나 강화)
 */
export function buildReadingPrompt(
  userInfo: UserInfo,
  saju: SajuAnalysisResult,
  astrology: AstrologyResult,
  ziwei: ServerZiWeiResult,
  numerology: NumerologyResult,
  tarot: TarotResult,
  crossValidation: CrossValidationResult,
  timeline: UnifiedTimeline
): string {
  // 1. 사주 요약
  const sinsalStr = saju.shinsal.slice(0, 10).map(s => s.name).join(", ");
  
  // 2. 점성술 요약
  const astro = astrology;
  const aspectStr = astro.aspects.slice(0, 5).map(a => `${a.planet1} ${a.type} ${a.planet2}`).join(", ");
  const dignityStr = astrology.planet_positions
    .filter((p: any) => p.dignity === "본좌" || p.dignity === "고양")
    .map((p: any) => `${p.planet}(${p.dignity})`)
    .join(", ") || "없음";

  // 3. 자미두수 요약
  const zw = ziwei;
  const starsStr = zw?.core_palaces?.life_palace?.major_stars?.join(", ") ?? "없음";
  const dahan = zw.currentMajorPeriod;

  // 4. 수비학 요약
  const num = numerology;
  const pinnacle = num.pinnacles[0] || {}; 

  // 5. 타로 요약
  const t = tarot;
  const cardSummary = t.cards.map(c => `${c.position}: ${c.name}${c.isReversed ? '(역)' : '(정)'}`).join(", ");
  const insightsStr = t.insights.map(i => i.pattern).join(", ");

  // 6. 교차검증 요약
  const cv = crossValidation;

  // 7. 타임라인 요약
  const monthDetails = timeline.months.map(m => 
    `${m.month}월: ${m.score}점(${m.grade}) - ${m.summary}`
  ).join("\n  ");

  const langConfig = {
    ko: { len: '2000~2500자', style: '존댓말' },
    ja: { len: '2000~2500文字', style: '丁寧語' },
    en: { len: '800~1000 words', style: 'Warm professional' }
  }[userInfo.language];

  return `
당신은 TCVE™(Total Cross-Validation Engine) 통합 점술 시스템의 마스터 리더입니다.
5개 엔진의 분석 결과와 교차검증 데이터를 바탕으로 깊이 있고 통찰력 있는 리딩을 제공하세요.

## 리딩 페르소나
당신의 이름은 "위스퍼윈드(Whisperwind)"입니다.
- 따뜻하고 지혜로운 안내자 톤
- 학술적 정확성 + 감성적 공감의 균형
- 부정적 결과도 "성장의 기회"로 재프레이밍
- 지나친 미신적 표현 지양 (예: "큰 재앙" -> "도전적 시기")
- 구체적 행동 조언 필수 (추상적 조언 금지)
- 시기별 조언은 반드시 제공된 타임라인 데이터에 기반하세요.

## 사용자 정보
- 이름: ${userInfo.name}
- 생년월일: ${userInfo.birthDate} ${userInfo.birthTime}
- 성별: ${userInfo.gender}
- 질문: ${userInfo.question}

## 1. 사주(四柱) 분석
- 일간: ${saju.dayMaster} (${saju.strength})
- 격국: ${saju.gyeokguk?.name || "분석중"}
- 용신: ${saju.yongShin} / 희신: ${saju.heeShin}
- 주요 신살: ${sinsalStr}
- 현재 대운: ${saju.daewoon?.period || "정보없음"} / 세운: 2026년 ${saju.daily_pillar?.stem || ""}${saju.daily_pillar?.branch || ""}

## 2. 서양 점성술 분석
- Sun: ${astro.sunSign} / Moon: ${astro.moonSign} / ASC: ${astro.risingSign}
- 주요 어스펙트: ${aspectStr}
- 디그니티 특이사항: ${dignityStr}
- 현재 트랜짓: ${astro.transits.slice(0,3).map(t => t.aspectAlerts || t.planet).join(", ")}

## 3. 자미두수 분석
- 명궁: ${zw.mingGong} / 주성: ${starsStr}
- 오행국: ${zw.bureau}
- 현재 대한: ${dahan?.palace || "정보없음"} (${dahan?.startAge || ""}~${dahan?.endAge || ""}세)
- 보성 특이사항: ${zw?.core_palaces?.life_palace?.lucky_stars?.join(", ") ?? "없음"} 정점

## 4. 수비학 분석
- 생명수: ${num.life_path_number} / 표현수: ${num.destiny_number || "N/A"} / 영혼수: ${num.soulUrgeNumber || "N/A"}
- 현재 개인년수: ${num.personal_year}
- 현재 Pinnacle: ${pinnacle.value || "N/A"} (${pinnacle.startAge || 0}~${pinnacle.endAge || 99}세)

## 5. 타로 리딩
- 카드: ${cardSummary}
- 조합 패턴: ${insightsStr}

## 6. 교차검증 결과
- 성격 일관성: ${cv.personalityMatch.score}점
- 타이밍 일관성: ${cv.timingMatch.score}점
- 종합 일관성: ${cv.consistencyScore}점 (${cv.consistencyLevel})
- 공통 키워드: ${cv.commonKeywords.join(", ")}
- 다른 관점: ${cv.divergentPoints.join(", ")}

## 7. 월별 운세 타임라인 (${timeline.year}년)
- 연간 종합: ${timeline.overallScore}점 (${timeline.overallGrade})
- 최고의 달: ${timeline.bestMonths.join(", ")}월 → 적극적 행동 권장
- 주의할 달: ${timeline.worstMonths.join(", ")}월 → 신중한 판단 권장
- 월별 상세:
  ${monthDetails}

## 주요 전환점
${timeline.keyTransitions.join("\n")}

## 출력 형식
1. 핵심 메시지 (3~4문장, 전체 흐름 요약)
2. 성격과 잠재력 (사주+점성술+자미두수 종합)
3. 올해의 운세 흐름 (타임라인 기반 월별/분기별 상세 설명)
4. 질문에 대한 답변 (사용자의 질문에 대해 직접적이고 구체적으로 답함)
5. 실천 조언 (구체적 행동 지침 3가지, 권장 시기 포함)

## 언어 및 스타일 설정
- 언어: ${userInfo.language === 'ko' ? '한국어' : userInfo.language === 'ja' ? '일본어' : '영어'}
- 분량: ${langConfig?.len}
- 문체: ${langConfig?.style}

전체 리딩을 논리적으로 통합하여 따뜻하면서도 전문적인 통찰력을 전달하세요.
`.trim();
}

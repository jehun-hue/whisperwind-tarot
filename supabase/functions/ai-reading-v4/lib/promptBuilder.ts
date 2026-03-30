import { Signal, CrossSignal } from './signalExtractor.ts';
import { ILJU_MEANINGS, TENGO_DEEP, GYEOKGUK_DEEP, TWELVE_STAGES_DEEP, YONGSIN_ADVICE, SINSAL_DEEP, DAEWOON_INTERACTION, INTERACTION_DEEP, LIFE_PATH_MEANINGS, EXPRESSION_MEANINGS } from "./interpretations/index.ts";
import { buildZiWeiPromptSection } from "./ziweiPromptBuilder.ts";
import { runCrossValidation } from "./crossValidationEngine.ts";
import { CrossValidationResult } from "./inferenceLayer.ts";
import { UnifiedTimeline } from "./timelineEngine.ts";
import { SajuAnalysisResult } from "../aiSajuAnalysis.ts";
import { ServerZiWeiResult } from "../ziweiEngine.ts";
import { NumerologyResult } from "../numerologyEngine.ts";
import { TarotResult } from "../hybridTarotEngine.ts";

function line(label: string, value: any): string {
  if (!value || value === '?' || value === '없음' || value === '') return '';
  return `• ${label}: ${value}\n`;
}

export interface UserInfo {
  name?: string;
  birthDate?: string;
  birthTime?: string;
  gender?: string;
  question?: string;
  questionType?: string;
  language?: string;
}

// interface SajuAnalysisResult { [key: string]: any; }
interface AstrologyResult { [key: string]: any; }
// interface ServerZiWeiResult { [key: string]: any; }
// interface NumerologyResult { [key: string]: any; }
// interface TarotResult { [key: string]: any; }

// ─── 질문 유형별 자미두수 핵심 궁 매핑 ───
const ZIWEI_PALACE_MAP: Record<string, string[]> = {
  relationship: ['부처궁', '복덕궁', '천이궁'],
  career: ['관록궁', '천이궁', '재백궁'],
  health: ['질액궁', '복덕궁', '명궁'],
  finance:      ['재백궁', '전택궁', '관록궁'],
  life_change:  ['천이궁', '명궁', '관록궁'],
  migration:    ['천이궁', '명궁', '부모궁'],
  compatibility:['부처궁', '복덕궁', '명궁'],
  family:       ['부모궁', '자녀궁', '형제궁', '부처궁'],
  general_future: ['명궁', '관록궁', '재백궁', '부처궁'],
  default: ['명궁', '관록궁', '재백궁'],
};

// ═══════════════════════════════════════════════════════
// P-1: 질문 유형별 섹션 예산 시스템 (TOPIC_SECTION_BUDGET)
// ═══════════════════════════════════════════════════════
type SectionBudget = 'full' | 'summary' | 'skip';

interface TopicSectionConfig {
  saju: SectionBudget;
  ziwei: SectionBudget;
  astrology: SectionBudget;
  numerology: SectionBudget;
  tarot: SectionBudget;
}

const TOPIC_SECTION_BUDGET: Record<string, TopicSectionConfig> = {
  career:         { saju: 'full',    ziwei: 'full',    astrology: 'summary', numerology: 'summary', tarot: 'full' },
  relationship:   { saju: 'full',    ziwei: 'full',    astrology: 'full',    numerology: 'skip',    tarot: 'full' },
  finance:        { saju: 'full',    ziwei: 'full',    astrology: 'summary', numerology: 'full',    tarot: 'summary' },
  health:         { saju: 'summary', ziwei: 'full',    astrology: 'summary', numerology: 'skip',    tarot: 'summary' },
  general_future: { saju: 'full',    ziwei: 'full',    astrology: 'full',    numerology: 'full',    tarot: 'full' },
  life_change:    { saju: 'full',    ziwei: 'full',    astrology: 'full',    numerology: 'summary', tarot: 'full' },
  migration:      { saju: 'summary', ziwei: 'full',    astrology: 'full',    numerology: 'summary', tarot: 'summary' },
  compatibility:   { saju: 'full',    ziwei: 'full',    astrology: 'full',    numerology: 'skip',    tarot: 'full' },
  family:          { saju: 'full',    ziwei: 'full',    astrology: 'summary', numerology: 'skip',    tarot: 'summary' },
};

// ─── 정규식 스크래퍼 방식 요약 함수들 ───
function summarizeSaju(full: string): string {
  const lines = full.split('\n');
  const keyPatterns = [/일간/, /용신/, /올해 운세/, /대운/, /세운/, /격국/];
  const picked = lines.filter(l => keyPatterns.some(p => p.test(l)));
  return picked.length > 0
    ? `=== [SECTION 1] 사주 명리 (요약) ===\n${picked.join('\n')}\n★ 이 섹션은 요약 모드입니다. 핵심 데이터만 참조하십시오.`
    : '';
}

function summarizeZiwei(full: string): string {
  const lines = full.split('\n');
  const keyPatterns = [/명궁/, /사화/, /대한/, /핵심 궁/, /래인궁|來因궁/];
  const picked = lines.filter(l => keyPatterns.some(p => p.test(l)));
  return picked.length > 0
    ? `=== [SECTION 2] 자미두수 (요약) ===\n${picked.join('\n')}\n★ 이 섹션은 요약 모드입니다.`
    : '';
}

function summarizeAstrology(full: string): string {
  const lines = full.split('\n');
  const keyPatterns = [/태양/, /달/, /ASC/, /트랜짓/, /토성/];
  const picked = lines.filter(l => keyPatterns.some(p => p.test(l)));
  return picked.length > 0
    ? `=== [SECTION 3] 서양 점성술 (요약) ===\n${picked.join('\n')}\n★ 이 섹션은 요약 모드입니다.`
    : '';
}

function summarizeNumerology(full: string): string {
  const lines = full.split('\n');
  const keyPatterns = [/생명경로/, /운명수/, /개인년/, /라이프패스/, /life_path/];
  const picked = lines.filter(l => keyPatterns.some(p => p.test(l)));
  return picked.length > 0
    ? `=== [SECTION 4] 수비학 (요약) ===\n${picked.join('\n')}\n★ 이 섹션은 요약 모드입니다.`
    : '';
}

function summarizeTarot(full: string): string {
  const lines = full.split('\n');
  const picked = lines.filter(l => /\d+\./.test(l)).slice(0, 3);
  return picked.length > 0
    ? `=== [SECTION 5] 타로 (요약) ===\n${picked.join('\n')}\n★ 상위 3장만 참조.`
    : '';
}

// ═══════════════════════════════════════════════════════

export function buildReadingPrompt(
  userInfo: UserInfo,
  saju: SajuAnalysisResult,
  astrology: AstrologyResult,
  ziwei: ServerZiWeiResult,
  numerology: NumerologyResult,
  tarot: TarotResult,
  crossValidation: CrossValidationResult,
  timeline: UnifiedTimeline,
  readingHistory?: any[],
  signalData?: { signals: Signal[], crossSignals: CrossSignal[] },
  topicFocus?: Record<string, string[]>,
  decisionAxes?: { axes: string[], axisInstruction: string },
  decisionResult?: { decision: 'PROCEED' | 'WAIT' | 'CONDITIONAL'; confidence: number; reason: string }
): string {

  const name = userInfo.name && userInfo.name.trim() ? userInfo.name.trim() : '내담자';
  const qType = userInfo.questionType || 'general_future';

  // ── 데이터 추출 및 정규화 (전역 사용을 위해 상단 배치) ──
  const s = saju || {} as any;
  if (!s.dayMaster && !s.pillars) {
    console.warn("[WARN] 서버 사주 데이터 없음 — DB 폴백 또는 클라이언트 간이엔진 데이터 사용 중. 절기 미반영으로 정확도 저하 가능.");
  }

  // 일주(日柱) 프로필 주입
  const dayPillarFull = s?.fourPillars?.day?.full 
    || (s?.fourPillars?.day?.stem && s?.fourPillars?.day?.branch 
        ? `${s.fourPillars.day.stem}${s.fourPillars.day.branch}` : '');
  const iljuProfile = dayPillarFull ? ILJU_MEANINGS[dayPillarFull] : null;
  const iljuBlock = iljuProfile ? `
[일주 프로필: ${dayPillarFull}]
- 성격 핵심: ${iljuProfile.personality}
- 대인관계: ${iljuProfile.relationships}  
- 적합 직업: ${iljuProfile.career}
- 건강 유의: ${iljuProfile.health}
- 핵심 조언: ${iljuProfile.advice}
` : '';
  const dw = (s as any).daewoon || {} as any;
  const currentDw = dw.currentDaewoon || {};
  const currentSeun = dw.current_seun || {};
  const crossInt = s.cross_interactions || {} as any;
  const sewoonRels = [
    ...(crossInt.sewoon?.with_original?.branch_rels || []),
    ...(crossInt.sewoon?.with_original?.stem_rels || []),
  ];
  const seunTwelveStage = s.twelve_stages?.seun || {} as any;
  const dwTwelveStage = currentDw.twelveStageEnergy || {} as any;

  const z = (ziwei as any) || {} as any;
  const zRaw = z.rawData || z;
  const palaces = zRaw.palaces || [];

  const a = astrology || {} as any;
  const aRaw = a.rawData || a;
  const planets = aRaw.planets || a.planets || [];
  const aspects = aRaw.aspects || [];
  const transits = aRaw.transits || a.transits || [];

  const n = numerology || {} as any;

  // ========================
  // SECTION 0: CORE CONSENSUS (결론 먼저)
  // ========================
  const cv = crossValidation || {} as any;
  
  // inferenceLayer.ts 실제 출력 필드에 맞춤 매핑
  const dv = cv.dominant_vector || cv.dominantVector || {};
  const topVectors = Object.keys(dv).length > 0
    ? Object.entries(dv)
        .filter(([_, v]) => typeof v === 'number')
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${(v as number).toFixed(2)}`)
        .join(', ')
    : cv.commonKeywords?.length
      ? `공통 키워드: ${cv.commonKeywords.slice(0, 5).join(', ')}`
      : '분석 데이터 수집 중';

  const conflictSummary = cv.conflict_summary 
    || cv.conflictSummary
    || (cv.divergentPoints?.length 
        ? cv.divergentPoints.slice(0, 3).join(' / ') 
        : '엔진 간 주요 충돌 없음');

  const consistencyInfo = cv.consistencyScore !== undefined
    ? `합의도: ${(cv.consistencyScore * 100).toFixed(0)}% (${cv.consistencyLevel || '보통'})`
    : '';

  // ── 데이터 기반 최종 결정 코드 (Dispatcher) ──
  const finalDecisionTxt = decisionResult 
    ? `\n[최종 의사결정 코드: ${decisionResult.decision}] (신뢰도: ${decisionResult.confidence}%)\n분석 근거: ${decisionResult.reason}\n※ 주의: 상담사는 반드시 이 결정을 결론의 중심축으로 삼아야 합니다.`
    : '';

  // ═══ 타임라인: 대운/세운/월운 3단 구조 ═══
  const tl = timeline || {} as any;
  
  // 대운 정보
  const dwInfo = (s as any).currentDaewoon || (s as any).daewoon || {};
  const daewoonStr = dwInfo.full 
    ? `▶ 대운(10년 흐름): ${dwInfo.full} (${dwInfo.tenGodStem || ''}/${dwInfo.tenGodBranch || ''}) - ${dwInfo.startAge || '?'}세~${dwInfo.endAge || '?'}세`
    : '';

  // 세운 정보
  const swInfo = (s as any).sewoon || {};
  const sewoonStr = swInfo.full
    ? `▶ 세운(올해): ${swInfo.full} - 12운성: ${swInfo.twelveStage || (s as any).twelveStage?.stage || '?'} (에너지 ${swInfo.score || (s as any).twelveStage?.score || '?'}점)`
    : '';

  // 월운 정보 (timelineEngine의 months 배열)
  const monthEntries = tl.months || (tl as any).entries || (tl as any).timeline || [];
  const monthlyStr = Array.isArray(monthEntries) && monthEntries.length > 0
    ? monthEntries?.map((m: any) => {
        const month = m.month || m.label || '';
        const summary = m.summary || m.description || m.event || '';
        const score = m.score !== undefined ? ` (${m.grade || ''} ${m.score}점)` : '';
        return `  - [${month}]: ${summary}${score}`;
      }).join('\n')
    : '월별 상세 데이터 없음';

  // 대운 전환기 특별 안내
  const dwTransition = dwInfo.startAge && Math.abs(((s as any).currentAge || 0) - dwInfo.startAge) <= 2
    ? `\n⚠ 대운 전환기(±2년): 현재 ${(s as any).currentAge}세로 대운 시작(${dwInfo.startAge}세)과 가까워 에너지 변동이 큰 시기입니다.`
    : '';

  const timelineStr = `${daewoonStr}\n${sewoonStr}${dwTransition}\n\n[월별 상세 흐름]\n${monthlyStr}`;

  const section0 = `
=== [SECTION 0] 핵심 결론 (CORE CONSENSUS) ===
${finalDecisionTxt}
▶ 지배 에너지: ${topVectors || '분석 중'}
▶ 엔진 간 충돌: ${conflictSummary}
${consistencyInfo ? `▶ ${consistencyInfo}` : ''}
▶ 타임라인:
${timelineStr}

★ 지시: 위 결론을 기반으로 리딩 첫머리에 (1) 올해의 핵심 방향을 요약한 한 문장, (2) 가장 주의할 점을 요약한 한 문장을 자연스러운 문장으로 제시하라. 합의도가 70% 이상이면 "여러 관점이 일치합니다"라고 신뢰를 강조하고, 50% 미만이면 "다양한 가능성이 열려 있습니다"라고 유연하게 표현하라. 내부 수치나 용어(합의도, 지배벡터 등)는 절대 노출하지 말 것.
`;

  // ═══════════════════════════════════════════════════════
  // P-3: 의사결정 레이블 기반 사전 결론 (preBuiltConclusion)
  // ═══════════════════════════════════════════════════════
  const signals = signalData?.signals || [];
  const crossSignals = signalData?.crossSignals || [];

  const consistencyPct = cv.consistencyScore !== undefined 
    ? Math.round(cv.consistencyScore * 100) : 50;
  
  const fortuneScore = (s.fortune as any)?.seun?.score ?? (s.fortune as any)?.score ?? 50;
  
  const decisionLabel = fortuneScore >= 75 ? '긍정적 흐름'
    : fortuneScore >= 55 ? '안정적 흐름'
    : fortuneScore >= 35 ? '주의 필요'
    : '신중 대응 권장';

  const coreDirection = fortuneScore >= 70
    ? `올해는 적극적으로 기회를 잡아도 좋은 시기입니다. 특히 ${qType === 'career' ? '커리어 확장' : qType === 'relationship' ? '새로운 관계' : qType === 'finance' ? '재무 투자' : '전반적 성장'}에 유리합니다.`
    : fortuneScore >= 45
    ? `올해는 안정을 유지하면서 내실을 다지는 시기입니다. 큰 변화보다는 준비와 기반 강화에 집중하세요.`
    : `올해는 보수적 접근이 현명합니다. 기존 것을 지키면서 내면의 성찰에 집중하는 것이 좋습니다.`;

  // 시스템 간 합의된 가장 심각한 경고 추출
  const criticalWarning = signals
    .filter(sig => sig.severity >= 2)
    .sort((a, b) => {
      const order: Record<number | string, number> = { 3: 0, 2: 1, 1: 2, critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
    })[0];

  const warningLine = criticalWarning 
    ? `⚠ 최우선 주의: ${criticalWarning.title} — ${criticalWarning.description}`
    : '';

  const preBuiltConclusion = `
=== [PRE-ANALYSIS CONCLUSION] 사전 분석 결론 ===
▶ 흐름 판정: ${decisionLabel} (운세 점수: ${fortuneScore}, 합의도: ${consistencyPct}%)
▶ 핵심 방향: ${coreDirection}
${warningLine ? `${warningLine}` : ''}
${decisionResult ? `▶ 의사결정 코드: ${decisionResult.decision} (신뢰도: ${decisionResult.confidence}%)` : ''}

★ 지시: 이 사전 결론의 방향성(${decisionLabel})을 리딩의 뼈대로 삼되, 내부 수치는 절대 노출하지 마십시오.
`;

  // ========================
  // SECTION 0.5: 교차 패턴 분석 (코드 사전 계산)
  // ========================
  const crossPatterns: string[] = [];

  // ──────────────────────────────────────────────
  // TODO [Phase 3]: 현재 교차 패턴은 사주×점성술, 사주×자미, 사주×수비학 조합만
  // 수동 조건문으로 처리. crossValidationEngine.ts를 5-system matrix로 확장 후
  // 이 수동 패턴 블록을 engine 결과로 교체할 것.
  // ──────────────────────────────────────────────

  const crossVal = (crossValidation && Object.keys(crossValidation).length > 0)
    ? crossValidation
    : ((ziwei && saju) ? runCrossValidation(ziwei, saju) : null);

  const crossValNormalized = crossVal ? {
    ...crossVal,
    overallAgreement: crossVal.overallAgreement ?? 0,
    items: crossVal.items || [],
    summary: crossVal.summary || '',
    strongSignals: crossVal.strongSignals || [],
    conflictSignals: crossVal.conflictSignals || [],
  } : null;

  if (crossValNormalized) {
    crossPatterns.push(`\n[자미두수×사주 구조적 교차 검증] (일치율: ${crossValNormalized.overallAgreement}%)`);
    crossPatterns.push(`요약: ${crossValNormalized.summary}`);
    for (const item of crossValNormalized.items) {
      crossPatterns.push(`  ${item.label}: 자미두수(${item.ziweiSignal}) × 사주(${item.sajuSignal}) → ${item.agreement} (${item.confidence}%)`);
      if (item.ziweiEvidence.length > 0) crossPatterns.push(`    자미: ${item.ziweiEvidence.slice(0, 2).join(", ")}`);
      if (item.sajuEvidence.length > 0) crossPatterns.push(`    사주: ${item.sajuEvidence.slice(0, 2).join(", ")}`);
    }
    if (crossValNormalized.strongSignals.length > 0) {
      crossPatterns.push(`\n  ★ 강력 교차 확인: ${crossValNormalized.strongSignals.join(" | ")}`);
    }
    if (crossValNormalized.conflictSignals.length > 0) {
      crossPatterns.push(`\n  ⚠ 상충 주의: ${crossValNormalized.conflictSignals.join(" | ")}`);
    }
  }

  // 패턴 1: 관계 갈등 시그널 교차
  const sajuConflict = sewoonRels.some((r: any) => r.type === '파' || r.type === '충' || r.type === '형');
  const astroConflict = aspects.some((asp: any) =>
    asp.isHarmonious === false && (
      (asp.planet1 === '화성' && asp.planet2 === '명왕성') ||
      (asp.planet1 === '토성' && asp.planet2 === '수성') ||
      (asp.planet1 === '달' && asp.planet2 === '금성' && asp.type?.includes('사각'))
    )
  );
  const ziweiConflict = (zRaw.natalTransformations || []).some((t: any) => t.type === '화기') ||
    (zRaw.annualTransformations || []).some((t: any) => t.type === '화기');

  if (sajuConflict && astroConflict) {
    crossPatterns.push('⚠️ 관계 갈등 강화 패턴: 사주(' + sewoonRels.filter((r: any) => r.type === '파' || r.type === '충').map((r: any) => r.pair + ' ' + r.type).join(', ') + ') + 점성술(Mars□Pluto 등 긴장 어스펙트) → 직장/大인관계에서 마찰 가능성 높음');
  }
  if (sajuConflict && ziweiConflict) {
    crossPatterns.push('⚠️ 소통 주의 패턴: 사주 지지 충돌 + 자미두수 화기(' + (zRaw.natalTransformations || []).filter((t: any) => t.type === '화기').map((t: any) => t.star + '→' + t.palace).join(', ') + ') → 구설, 오해 발생 가능');
  }

  // 패턴 2: 성장/확장 시그널 교차
  const sajuGrowth = seunTwelveStage.level >= 70;
  const astroGrowth = transits.some((t: string) => t.includes('삼합') || t.includes('합(0°)'));
  const numGrowth = (n.personal_year === 1 || n.personal_year === 3 || n.personal_year === 5 || n.personal_year === 8);

  if (sajuGrowth && astroGrowth) {
    crossPatterns.push('✅ 확장 기회 패턴: 사주 세운 12운성 ' + seunTwelveStage.stage + '(' + seunTwelveStage.level + '점) + 점성술 긍정적 트랜짓 → 새로운 시도에 유리한 시기');
  }

  // 패턴 3: 내면 성찰 시그널 교차
  const sajuIntrospect = dwTwelveStage.level <= 40;
  const numIntrospect = (n.personal_year === 7 || n.personal_year === 4);

  if (sajuIntrospect && numIntrospect) {
    crossPatterns.push('🔍 내면 성찰 패턴: 사주 대운 에너지 ' + dwTwelveStage.level + '점(성찰기) + 수비학 개인년 ' + n.personal_year + '(탐구) → 외부 활동보다 내면 점검이 우선되는 시기');
  }

  // 패턴 4: 재물 기회 시그널 교차
  const sajuWealth = (s.tenGods?.재성 || 0) > 0 || sewoonRels.some((r: any) => r.type === '지지육합');
  const ziweiWealth = palaces.find((p: any) => p.name === '재백궁')?.main_stars?.length > 0;

  if (sajuWealth && ziweiWealth) {
    const jaeBaekStars = palaces.find((p: any) => p.name === '재백궁')?.main_stars?.join(', ') || '';
    crossPatterns.push('💰 재물 기회 패턴: 사주 세운 육합/재성 활성 + 자미두수 재백궁(' + jaeBaekStars + ') → 투자, 수입 증가 가능성');
  }

  const section05 = crossPatterns.length > 0
    ? `
=== [SECTION 0.5] 엔진 간 교차 패턴 (사전 분석) ===
${crossPatterns.join('\n')}

★ 지시: 위 교차 패턴을 리딩의 핵심 뼈대로 사용하라. 단일 엔진 데이터보다 교차 패턴을 우선 인용하라.
`
    : '';

  // ─── 추출된 리스크/기회 신호 (Phase 2-1) ───
  const signalText = signals?.map(sig => 
    `- [${sig.source.toUpperCase()}] ${sig.title}: ${sig.description} (심각도:${sig.severity})`
  ).join('\n') || '';

  const crossSignalText = crossSignals?.map(cs => 
    `- [${cs.category.toUpperCase()} ${cs.type.toUpperCase()}] 합의도:${cs.agreementCount} (${cs.confidence}) -> 상세:${cs.sources?.map(s=>s.title).join(', ')}`
  ).join('\n') || '';

  const sectionSignals = (signals.length > 0 || crossSignals.length > 0) ? `
=== [SECTION 0.1] 리스크 및 기회 정밀 신호 (RISK & OPPORTUNITY SIGNALS) ===
여기에 나열된 신호는 엔진들이 직접 계산한 가장 확실한 근거입니다. 
특히 합의도가 높은 중복 신호는 리딩에서 반드시 강조하십시오.

${crossSignalText ? `[강력한 교차 합의 신호]\n${crossSignalText}\n` : ''}
${signalText ? `[시스템별 개별 신호 근거]\n${signalText}\n` : ''}` : '';

  // 자미두수 구조화 데이터 주입
  const ziweiSection = ziwei ? buildZiWeiPromptSection(ziwei as any) : "";

  // ========================

  // === Phase 2: 사주 심층 프로필 주입 ===
  const gyeokName = (s?.gyeokguk?.name || s?.gyeokguk || '') as any;
  const gyeokProfile = gyeokName ? (GYEOKGUK_DEEP as any)[gyeokName] : null;
  const gyeokBlock = gyeokProfile ? `
【격국 심층: ${gyeokName}】
• 본질: ${gyeokProfile.essence}
• 적합 진로: ${gyeokProfile.career_fit}
• 약점: ${gyeokProfile.weakness}
• 용신 작용: ${gyeokProfile.with_yongsin}` : '';

  const seunTengo = s?.fortune?.seun?.tenGodStem || s?.daewoon?.current_seun?.tenGodStem || '';
  const tengoProfile = seunTengo ? TENGO_DEEP[seunTengo] : null;
  const tengoBlock = tengoProfile ? `
【올해 십성 심리: ${seunTengo}】
• 심리 변화: ${tengoProfile.psychology}
• 영향 영역: ${tengoProfile.life_area}
• 운세 흐름: ${tengoProfile.in_daewoon}` : '';

  const stageName = s?.twelve_stages?.seun?.stage || s?.fortune?.seun?.twelveStage || '';
  const stageProfile = stageName ? TWELVE_STAGES_DEEP[stageName] : null;
  const stageBlock = stageProfile ? `
【12운성 심층: ${stageName}】
• 에너지 레벨: ${stageProfile.energy_level}%
• 핵심 의미: ${stageProfile.meaning}
• 조언: ${stageProfile.advice}` : '';

  const deepSajuProfile = [gyeokBlock, tengoBlock, stageBlock].filter(Boolean).join('\n');

  // SECTION 1: SAJU 핵심
  // ========================

  // 오행 한줄 요약
  const el = s.elements || {};
  const elParts: string[] = [];
  const elEntries = Object.entries(el) as [string, number][];
  const excess = elEntries.filter(([, v]) => v >= 3).map(([k]) => k);
  const deficient = elEntries.filter(([, v]) => v === 0).map(([k]) => k);
  if (excess.length) elParts.push(`${excess.join('·')} 과다`);
  if (deficient.length) elParts.push(`${deficient.join('·')} 결핍`);
  const elSummary = elParts.join(', ') || '균형';

  // === 주제별 사주 데이터 우선 정렬 ===
  const sajuKw = topicFocus?.saju || [];
  const sortBySajuRelevance = (arr: any[], fields: string[]) => {
    if (!sajuKw.length || !arr?.length) return arr;
    return [...arr].sort((a, b) => {
      const aMatch = sajuKw.some(kw => fields.some(f => String(a[f] || '').includes(kw)));
      const bMatch = sajuKw.some(kw => fields.some(f => String(b[f] || '').includes(kw)));
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  };
  const sortedSewoonRels = sortBySajuRelevance(sewoonRels, ['type', 'description']);
  const sortedShinsal = sortBySajuRelevance(s.shinsal || [], ['name', 'effect', 'description']);

  // === Phase 3: 용신/신살/대운/상호작용 심층 주입 ===
  const yongName = s?.yongShin || s?.yongsin || '';
  const yongProfile = yongName ? YONGSIN_ADVICE[yongName] : null;
  const yongBlock = yongProfile ? `
【용신 개운 처방: ${yongName}】
• 생활 습관: ${yongProfile.lifestyle}
• 적합 직업: ${yongProfile.career}
• 행운 색상/방향: ${yongProfile.color} / ${yongProfile.direction}` : '';

  const deepShinsalLines = (sortedShinsal || []).slice(0, 3)
    .map(ss => {
      const p = SINSAL_DEEP[ss.name];
      return p ? `  • ${ss.name}: ${p.positive} (조언: ${p.advice})` : null;
    })
    .filter(Boolean)
    .join('\n');
  const deepShinsalBlock = deepShinsalLines ? `
【주요 신살 심층 해석】
${deepShinsalLines}` : '';

  const dwStem = currentDw?.stem || '';
  const dwInteraction = dwStem ? DAEWOON_INTERACTION[dwStem + "운"] : null;
  const dwDeepBlock = dwInteraction ? `
【대운 심층 테마: ${dwStem}운】
• 기회: ${dwInteraction.opportunity}
• 리스크: ${dwInteraction.risk}
• 핵심 조언: ${dwInteraction.advice}` : '';

  const interactions = s?.interactions || s?.characteristics || [];
  const interactionLines = (Array.isArray(interactions) ? interactions : []).slice(0, 3)
    .map(it => {
      const key = typeof it === 'string' ? it : it.name || '';
      const p = INTERACTION_DEEP[key];
      return p ? `  • ${key}: ${p.meaning}` : null;
    })
    .filter(Boolean)
    .join('\n');
  const interactionBlock = interactionLines ? `
【천간/지지 상호작용】
${interactionLines}` : '';

  const finalDeepSajuProfile = [deepSajuProfile, yongBlock, deepShinsalBlock, dwDeepBlock, interactionBlock].filter(Boolean).join('\n');

  const sewoonTop3 = sortedSewoonRels.slice(0, 3)
    .map((r: any) => `${r.pair} ${r.type}: ${r.description}`)
    .join(' / ') || '특별한 작용 없음';

  const section1 = `
=== [SECTION 1] 사주 명리 (핵심) ===
• 일간: ${s.dayMaster || '?'} | 신강/약: ${s.strength || '?'} | 격국: ${s.gyeokguk?.name || '?'} (${s.gyeokguk?.type || ''})
• 강약 상세: ${s.strength_detail?.deukryeong?.result || '?'}/${s.strength_detail?.deukji?.result || '?'}/${s.strength_detail?.deukse?.result || '?'} — ${s.strength_detail?.overall_reason || ''}
• 용신: ${s.yongShin || '?'} | ${line('희신', s.heeShin)}${line('기신', s.giShin)}${line('용신 근거', s.yongsin_detail?.final?.reason || '')}
• 오행: ${elSummary}
• 현재 대운: ${currentDw.full || '?'} (${currentDw.startAge || '?'}~${currentDw.endAge || '?'}세) — 십성: ${currentDw.tenGodStem || ''}/${currentDw.tenGodBranch || ''}${s.is_daewoon_changing_year ? ' [★교운기: 환경/심경 급변기]' : ''} — 에너지: ${dwTwelveStage.level || '?'}점(${dwTwelveStage.description || ''})
• 세운(${currentSeun.year || '?'}): ${currentSeun.full || '?'} — 십성: ${currentSeun.tenGodStem || ''}/${currentSeun.tenGodBranch || ''}
• 올해 운세(세운): [${s.fortune?.seun?.rating || s.fortune?.rating || '평'}] ${s.fortune?.seun?.interpretation || s.fortune?.interpretation || ''} (점수: ${s.fortune?.seun?.score || s.fortune?.score || 0})
• 이번 달(월운): [${s.fortune?.currentMonthFortune?.rating || '평'}] ${s.fortune?.currentMonthFortune?.interpretation || s.fortune?.currentMonthFortune?.summary || ''}
• 세운-원국 교차: ${sewoonTop3}
• 공망: ${s.gongmang?.emptied?.join(', ') || '없음'} (${s.gongmang?.affectedPillars?.join(', ') || ''})
${iljuBlock}
• 주요 신살:
${sortedShinsal.slice(0, 10).map((ss: any) => 
  `  - ${ss.name}${ss.hanja ? `(${ss.hanja})` : ''}[${ss.location || ss.pillar || ''}]: ${ss.effect || ss.description || ss.name} (강도: ${ss.strength || '중'})`
).join('\n') || (s.characteristics || []).filter((c: string) => !c.startsWith('격국')).slice(0, 8).join(' | ')}

★ 현재 흐름 해석 지시: 위 대운·세운·교차작용·12운성 및 [올해 운세 판정] 데이터를 종합하여 "현재 흐름을 한 줄로 압축"하라. (예: "확장 타이밍인데 실행이 늦은 상태")

${finalDeepSajuProfile}
`;

  // ========================
  // SECTION 2: ZIWEI 핵심
  // ========================

  // 명궁 주성
  const mingPalace = palaces.find((p: any) => p.name === '명궁');
  const mingStars = mingPalace?.main_stars?.join(', ') || mingPalace?.stars?.map((s: any) => `${s.star}(${s.brightness})`).join(', ') || '빈궁';

  // 질문별 핵심 궁 선택
  const targetPalaceNames = ZIWEI_PALACE_MAP[qType] || ZIWEI_PALACE_MAP.default;
  const selectedPalaces = targetPalaceNames?.map((pName: string) => {
    const p = palaces.find((pp: any) => pp.name === pName);
    if (!p) return `${pName}: 데이터 없음 (출생 시간 미확인)`;
    const stars = p.main_stars?.join(', ') || p.stars?.map((s: any) => `${s.star}(${s.brightness})`).join(', ');
    if (!stars) return `${pName}(${p.branch}): 빈궁 (주성 없음 - 대궁의 영향을 받으므로 대궁 주성을 참고하여 해석할 것)`;
    return `${pName}(${p.branch}): ${stars}`;
  }).join('\n');

  // 사화
  const natalSiHua = (zRaw.natalTransformations || [])
    .map((t: any) => `${t.type} ${t.star}→${t.palace}`).join(' | ') || '없음';
  const annualSiHua = (zRaw.annualTransformations || [])
    .map((t: any) => `${t.type} ${t.star}→${t.palace}`).join(' | ') || '없음';

  // 현재 대한
  const currentMajor = zRaw.currentMajorPeriod || {} as any;
  const majorStars = currentMajor.stars?.map((s: any) => s.star).join(', ') || '?';

  const section2 = `
=== [SECTION 2] 자미두수 (핵심) ===
• 명궁(${zRaw.lifePalace || '?'})${line('주성', mingStars)}${line('신궁', zRaw.shenGong)}${line('오행국', zRaw.fiveElementFrame || zRaw.bureau)}${line('생년사화', natalSiHua)}${line(`유년사화(${zRaw.annualYear || '?'}년 ${zRaw.annualGan || '?'}년간)`, annualSiHua)}${line(`현재 대한(${currentMajor.startAge || '?'}~${currentMajor.endAge || '?'}세)`, `${currentMajor.palace || ''}궁 — 주성: ${majorStars}`)}${line('올해 유년/소한', `${zRaw.currentMinorPeriod?.palace || ''}궁(${zRaw.currentMinorPeriod?.branch || ''}지) — ${zRaw.currentMinorPeriod?.interpretation || ''}`)}• 질문 관련 핵심 궁:
${selectedPalaces}

${ziweiSection}

★ 자미두수 해석 우선순위 (반드시 이 순서로):
1. 래인궁(來因궁) — 이 사람 인생의 진짜 출발점. 래인궁의 별과 사화를 먼저 언급하며 "당신의 인생은 [래인궁 주제]에서 시작됩니다"로 리딩 시작
2. 명반 유형(chartType) — "당신은 [살파랑/기월동량/자부/혼합]형 명반으로, [특성]이 핵심"
3. 궁간사화 인과관계 — 화기가 어디로 날아갔는지가 "문제의 원인", 화록이 어디로 갔는지가 "해결의 실마리"
4. 삼대기추적 — 화기 연쇄가 3단계까지 어디로 이어지는지 말해주면 고객이 "소름" 느낌
5. 삼방사정 — 질문 관련 궁 + 대궁 + 삼합궁의 별을 종합 해석
6. 주성 궁별 해석 — STAR_PALACE_MEANINGS 데이터를 활용하여 구체적으로

★ 궁 선택 규칙: 질문="${userInfo.question || '종합운'}" → ${targetPalaceNames.join(', ')} 궁 중심
★ 빈궁 처리: 빈궁은 대궁(반대편)의 주성으로 해석. 데이터 부족 시 "사주 기준으로" 전환.
★ 교차 검증 활용: SECTION 0.5의 자미두수×사주 교차 검증 결과에서 "일치"인 영역은 자신있게 단언하고, "상충"인 영역은 "시기에 따라 달라질 수 있다"고 유연하게 표현.
★ 절대 금지: 궁간사화, 삼대기추적, 래인궁 등 전문 용어를 고객에게 직접 노출하지 말 것. 자연스러운 문장으로 풀어서 설명할 것.
`;

  // ========================
  // SECTION 3: ASTROLOGY 핵심
  // ========================

  // Sun/Moon/ASC 필수
  const sun = planets.find((p: any) => p.planet === '태양');
  const moon = planets.find((p: any) => p.planet === '달');
  const saturn = planets.find((p: any) => p.planet === '토성');
  const ascSign = aRaw.core_identity?.ascendant?.sign || a.rising_sign || '?';
  const ascDeg = aRaw.core_identity?.ascendant?.degree || '?';

  // 디그니티 있는 행성
  const dignityPlanets = planets.filter((p: any) => p.dignity && p.dignity !== '없음');

  // 주요 어스펙트 TOP 5 (orb 작은 순 + 주제별 정렬)
  const astroKw = topicFocus?.astrology || [];
  const sortAstroByRelevance = (arr: any[], fields: string[]) => {
    if (!astroKw.length || !arr?.length) return arr;
    return [...arr].sort((a, b) => {
      const aText = typeof a === 'string' ? a : fields?.map(f => String(a[f] || '')).join(' ');
      const bText = typeof b === 'string' ? b : fields?.map(f => String(b[f] || '')).join(' ');
      const aMatch = astroKw.some(kw => aText.includes(kw));
      const bMatch = astroKw.some(kw => bText.includes(kw));
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  };

  const baseAspects = [...aspects].filter(asp => typeof asp.orb === 'number').sort((a, b) => a.orb - b.orb);
  const sortedAspects = sortAstroByRelevance(baseAspects, ['planet1', 'planet2', 'aspect', 'interpretation']);
  const topAspects = sortedAspects.slice(0, 5)
    .map((asp: any) => asp.interpretation || `${asp.planet1} ${asp.type} ${asp.planet2}`)
    .join('\n');

  const baseTransits = transits.filter((t: string) => typeof t === 'string' && t.includes('정점') && !t.includes('통과'))
    .sort((a: string, b: string) => {
      const dateA = String(a).match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';
      const dateB = String(b).match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';
      return dateA.localeCompare(dateB);
    });
  const sortedTransits = sortAstroByRelevance(baseTransits, []);
  const topTransits = sortedTransits.slice(0, 8).join('\n') || '주요 트랜짓 없음';

  // 솔라리턴 핵심
  const sr = aRaw.solarReturn || {} as any;
  const srAsc = sr.ascendant?.sign || '?';
  const srMoonHouse = sr.moon?.house || '?';

  const formatPlanet = (p: any) => p ? `${p.planet} ${p.sign} ${p.degree}° ${p.house}하우스${p.dignity && p.dignity !== '없음' ? ` [${p.dignity}]` : ''}` : '?';

  const progressionBlock = aRaw.progression?.moon
    ? `• 진행 (프로그레션 문): ${aRaw.progression.moon} (${aRaw.progression.moon_house || '?'}하우스)
• 프로그레션 어스펙트: ${aRaw.progression.moon_aspects?.map((ma: any) => `${ma.aspect} to ${ma.planet}`).join(', ') || '없음'}\n`
    : '';

  const section3 = `
=== [SECTION 3] 서양 점성술 (핵심) ===
${line('태양', formatPlanet(sun))}${line('달', formatPlanet(moon))}${line('토성', formatPlanet(saturn))}• ASC: ${ascSign} ${ascDeg}°
${dignityPlanets.length > 0 ? `• 디그니티: ${dignityPlanets?.map((p: any) => `${p.planet} ${p.sign} [${p.dignity}]`).join(', ')}\n` : ''}• 주요 어스펙트 (orb 순):
${topAspects}
• 트랜짓 핵심:
${topTransits}
${progressionBlock}${line(`솔라리턴(${sr.year || ''})`, `ASC ${srAsc}, 달 ${srMoonHouse}하우스`)}
`;

  // ========================
  // SECTION 4: NUMEROLOGY 핵심
  // ========================
  const userAge = s.currentAge || 40;
  const currentPinnacle = (n.pinnacles || []).find((p: any) => {
    if (!p.period) return false;
    const match = p.period.match(/(\d+)?\s*~\s*(종료|\d+)/);
    if (!match) return false;
    const start = parseInt(match[1] || '0');
    const end = match[2] === '종료' ? 100 : parseInt(match[2]);
    return userAge >= start && userAge <= end;
  }) || (n.pinnacles || []).slice(-1)[0] || {} as any;

  const currentChallenge = (n.challenges || []).find((p: any) => {
    if (!p.period) return false;
    const match = p.period.match(/(\d+)?\s*~\s*(종료|\d+)/);
    if (!match) return false;
    const start = parseInt(match[1] || '0');
    const end = match[2] === '종료' ? 100 : parseInt(match[2]);
    return userAge >= start && userAge <= end;
  }) || (n.challenges || []).slice(-1)[0] || {} as any;

  // 마스터넘버 심층 분석
  const masterBlock = n.master_numbers?.length > 0 
    ? `\n\n[보유 마스터넘버: ${n.master_numbers.join(', ')}]
- 이분은 ${n.master_numbers.join('와 ')}의 강력한 마스터 진동을 보유하고 있습니다.
- 이는 일반적인 수리보다 높은 차원의 영적 소명과 예민함을 의미하며, 리딩 시 이 특별한 잠재력을 반드시 언급하십시오.`
    : '';

  // 카르마 부채 심층 분석
  const karmicBlock = n.karmic_debt_details?.length > 0
    ? `\n\n[주의: 카르마 부채(Karmic Debt) 감지]
${n.karmic_debt_details.map((d: string) => `- ${d}`).join('\n')}
- ★ 지시: 이 카르마적 과제는 성장을 위한 필수 관문이므로, 부정적으로만 표현하지 말고 "이 과제를 통해 더 깊은 성숙에 이를 수 있다"는 관점에서 해석하라.`
    : '';

  // 생명경로수 + 표현수 심층 의미 주입
  const lpMeaning = n.life_path_number ? (LIFE_PATH_MEANINGS as any)[n.life_path_number] : null;
  const expMeaning = n.expression_number ? (EXPRESSION_MEANINGS as any)[n.expression_number] : null;

  const lpBlock = lpMeaning ? `
【생명경로수 ${n.life_path_number} 심층】
• 본질: ${lpMeaning.essence}
• 성장 과제: ${lpMeaning.growth}
• 성격적 기조: ${lpMeaning.personality}
• 그림자(경계): ${lpMeaning.shadow}` : '';

  const exBlock = expMeaning ? `
【표현수 ${n.expression_number} 심층】
• 재능/수단: ${expMeaning.talent}
• 인생 목표: ${expMeaning.life_purpose}
• 극복 과제: ${expMeaning.challenge}` : '';

  const section4 = `
=== [SECTION 4] 수비학 (핵심) ===
• 라이프패스: ${n.life_path_number || n.lifePath || '?'}${n.is_master_number ? ` (마스터넘버)` : ''} | 운명수: ${n.destiny_number || '?'} | 개인년: ${n.personal_year || '?'}
• 표현수: ${n.expression_number || '?'} | 영혼수: ${n.soul_urge_number || '?'}
• 피너클: ${currentPinnacle.number || '?'} (${currentPinnacle.meaning || ''}) | 챌린지: ${currentChallenge.number || '?'} (${currentChallenge.meaning || ''})
• 진동: ${(n.vibrations || []).join(' / ') || ''}
${lpBlock}${exBlock}${masterBlock}${karmicBlock}
`;

  // ═══════════════════════════════════════════════════════
  // P-8: SECTION 5 타로 카드 분석 (고도화)
  // ═══════════════════════════════════════════════════════
  const tarotCards = tarot?.cards || [];
  const tarotVectors = tarot?.vectors || {} as any;
  const tarotCombinations = tarot?.combinations || [];
  const tarotPolarity = tarot?.polarity || {} as any;

  let section5 = '';
  if (tarotCards.length > 0) {
    const cardDetails = tarotCards.map((c: any, i: number) => {
      const base = `${c.position || i + 1}. ${c.name || '?'} ${c.reversed ? '(역방향)' : '(정방향)'}`;
      
      // 벡터 차원 점수 (0.3 이상만 노출)
      const dims = c.vectorDimensions || {};
      const topDims = Object.entries(dims)
        .filter(([_, v]) => typeof v === 'number' && (v as number) > 0.3)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([k, v]) => `${k}(${(v as number).toFixed(2)})`)
        .join(', ');

      return topDims ? `${base}\n   벡터: ${topDims}` : base;
    }).join('\n');

    // 조합 패턴 인사이트
    const comboLines = tarotCombinations.slice(0, 5)
      .map((cb: any) => `  • ${cb.cards?.join(' + ') || cb.name || '?'}: ${cb.insight || cb.meaning || ''}`)
      .join('\n');

    // 전체 극성 판정
    const polarityScore = tarotPolarity.score;
    const polarityLabel = polarityScore !== undefined
      ? (polarityScore >= 0.6 ? '긍정 우세' : polarityScore <= -0.6 ? '부정 우세' : '중립/혼합')
      : '';

    section5 = `
=== [SECTION 5] 타로 카드 분석 (고도화) ===
${cardDetails}
${comboLines ? `\n[조합 패턴 인사이트]\n${comboLines}` : ''}
${polarityLabel ? `\n[전체 극성]: ${polarityLabel} (점수: ${polarityScore?.toFixed(2)})` : ''}

★ 타로 해석 지시:
- 벡터 차원 점수가 높은 키워드를 해당 카드의 핵심 메시지로 우선 채택하라.
- 조합 패턴이 있으면 개별 카드보다 조합 의미를 우선하라.
- 극성이 '부정 우세'이면 경고와 조언 비중을 높이고, '긍정 우세'이면 기회와 확신 비중을 높여라.
- 역방향 카드는 "차단된 에너지" 또는 "내면화된 주제"로 해석하라.
`;
  }

  // Phase 3-2: 주제별 포커스
  const topicFocusInstruction = topicFocus ? `\n\n[주제별 포커스 데이터] 아래 키워드를 해당 시스템 해석 시 우선 반영:${Object.entries(topicFocus)
    .map(([system, keywords]) => {
      const label: Record<string, string> = { saju: '사주/명리 포커스', ziwei: '자미두수 포커스', astrology: '점성술 포커스', numerology: '수비학 포커스', tarot: '타로 포커스' };
      return `- ${label[system] || system}: ${keywords.join(', ')}`;
    })
    .join('\n')}
★ 지시: 위 키워드가 등장하는 데이터를 우선 인용하되, 키워드 자체를 고객에게 노출하지 말 것.` : '';

  // Phase 3-3: 의사결정 축
  const axisPrompt = decisionResult ? `\n\n[의사결정 프레임]
- **"${decisionResult.decision}"**이 최종 판정입니다. (신뢰도: ${decisionResult.confidence}%)
- 근거: ${decisionResult.reason}
- 지시: "${decisionResult.decision}" 방향으로 리딩을 구성하되, 조건이나 유의점을 함께 제시하라.` 
    : decisionAxes ? `\n\n========================\n[의사결정 축: ${qType || '종합'}]\n========================\n아래 3가지 축을 분석하라:\n${decisionAxes.axes?.map((a, i) => {
      const match = a.match(/\(([^)]+)\)/);
      const desc = match ? match[1] : a;
      return `${i + 1}. ${desc}`;
    }).join('\n')}\n\n${decisionAxes.axisInstruction}` 
    : `\n\n[의사결정 기본 프레임]
- 4개 엔진 데이터를 종합하여 "진행 vs 보류" 방향성을 제시
- 긍정 3:부정 2이면 "기회가 있지만 [구체적 리스크]를 주의하세요" 형태
- 부정 2:긍정 3이면 "신중하게 접근하되, [구체적 기회]를 놓치지 마세요" 형태
- "종합적으로 보면, [핵심 한 문장]이 올해의 방향입니다" 형태로 마무리`;

  // ========================
  // INSTRUCTIONS
  // ========================
  const isLightTopic = ['health', 'migration'].includes(qType);
  const instructions = `
========================
MASTER READING PROTOCOL V4
========================

당신은 동양 명리학, 자미두수, 서양 점성술, 수비학을 융합하는 최고의 상담사입니다. ${name}님에게 따뜻하고 구체적인 리딩을 제공하세요.

========================
STEP 1: 질문 파악(필수)
========================
${userInfo.question ? `${name}님의 질문: "${userInfo.question}"
질문 유형: ${userInfo.questionType || 'general_future'}
이 질문에 직접적으로 답하는 것을 최우선으로 하세요.
${(() => {
  const qt = userInfo.questionType || 'general_future';
  if (qt.includes('love') || qt.includes('연애') || qt.includes('relationship') || qt.includes('결혼') || qt.includes('이별'))
    return `\n[연애/관계 특화 지시]
비중 지시: 사주 부처궁/복덕궁 중심, 자미두수 부처궁/천이궁 교차. 점성술: 금성·달·7하우스 어스펙트 우선.
비중: 사주 60%, 자미두수 20%, 점성술 20%.`;
  if (qt.includes('career') || qt.includes('직업') || qt.includes('이직') || qt.includes('사업') || qt.includes('취업'))
    return `\n[직업/경력 특화 지시]
비중 지시: 사주 관록·식상 중심, 자미두수 관록궁/재백궁 교차. 점성술: 토성·목성·10하우스·6하우스 우선.
비중: 사주 60%, 자미두수 20%, 점성술 20%.`;
  if (qt.includes('finance') || qt.includes('재물') || qt.includes('투자') || qt.includes('돈'))
    return `\n[재물/투자 특화 지시]
비중 지시: 사주 재성·편재 중심, 자미두수 재백궁/전택궁 교차. 점성술: 목성·2하우스·8하우스 우선.
비중: 사주 60%, 자미두수 20%, 점성술 20%.`;
  if (qt.includes('health') || qt.includes('건강'))
    return `\n[건강 특화 지시]
비중 지시: 사주 오행 과부족/질액궁 중심, 자미두수 질액궁/복덕궁 교차. 점성술: 6하우스·12하우스 우선.
비중: 사주 60%, 자미두수 20%, 점성술 20%.`;
  return `\n[종합운]
모든 시스템을 균형있게 활용하여 종합적인 리딩을 제공하세요.`;
})()}` : `종합 운세를 분석해 주세요. 모든 시스템을 균형있게 활용하세요.`}

${(!isLightTopic && readingHistory && readingHistory.length > 0) ? `========================
STEP 1.5: 이전 상담 이력 (맥락 연결)
========================
${name}님의 이전 상담 기록:
${readingHistory?.map((h: any, i: number) => 
  `[${i+1}] ${h.date} - 질문: "${h.question}" 요약: ${h.summary.slice(0, 150)}`
).join('\n')}

활용 지시:
- 이전 상담과의 연결고리를 자연스럽게 언급 (예: "지난번에 말씀드린 흐름이 이제 구체화되고 있습니다...")
- 반복되는 주제가 있으면 패턴으로 짚어주기
- 이전 조언의 후속 진행 상황을 확인하는 톤` : ''}

${(() => {
  const hasBirthTime = userInfo.birthTime && userInfo.birthTime !== "" && userInfo.birthTime !== "모름";
  return hasBirthTime ? `========================
[출생 시간 있음 - 전체 시스템 활용]
========================
사주: 시주 포함 정밀 분석(격국/용신/신살 전부 활용)
자미두수: 12궁 전체 활용 가능(궁간사화 추적 가능)
점성술: ASC/하우스 정밀 배치 활용
수비학: 전체 프로필 활용` : `========================
[출생 시간 없음 - 제한된 분석]
========================
사주: 시주 제외 3주 기반(격국 추정, 용신 보수적 판단)
자미두수: 명궁 미확정(대략적 해석만 가능)
점성술: ASC 미확정(태양/달 중심 해석)
수비학: 전체 프로필 활용 가능
★ 출생 시간이 없어 일부 분석이 제한적일 수 있다는 점을 자연스럽게 언급하세요.`;
})()}

${!isLightTopic ? `========================
STEP 2.5: 교차 검증 우선 원칙 (필수)
========================
해석 시 반드시:
- 교차 패턴(SECTION 0.5)을 개별 엔진보다 우선 인용
- 여러 시스템이 동일한 방향을 가리키면 자신있게 단언
- 시스템 간 상충이 있으면 시기별로 구분하여 유연하게 표현
- 단일 시스템의 극단적 해석은 다른 시스템으로 균형 조정` : ''}

========================
STEP 2: 데이터 해석(내부)
========================
해석 원칙:

(A) 대운·세운 융합: 반드시 2개 이상의 시스템 데이터를 결합. 형식: "사주(근거) + 점성술(근거) = 종합 해석"

(B) 구체적 시기 제시: 월 단위로 구체적 시기를 특정. 형식: "3월 말(토성 정점) vs 9월 초(세운 교차)" "상반기에는 준비하고, 하반기에 실행하세요." 같은 구체적 시기 조언.

(C) 우선순위: 교차 합의 3건 이상은 "핵심 흐름", 2건은 "주요 참고", 1건은 "보조 관점" 으로 분류.

========================
STEP 3: 톤 앤 매너 (상담사 페르소나)
========================
${name}님의 성향/격국 기반 말투:

기본 톤: "${name}님은 ${s.dayMaster || ''}일간의 기운을 가지신 분으로~ 올해는~, ~하시면 좋겠습니다~"
세운 반영: "${name}님의 ${s.dayMaster || ''} 일간에 ${currentSeun?.full || ''} 세운이 들어오면서~ 이 시기에는~, ~한 변화가 예상됩니다~"
수비학 연결: "생명경로수 ${n.life_path_number || ''} 에너지를 가진 ${name}님은~ 올해 개인년 ${n.personal_year_number || ''} 시기와 맞물려~"
마무리: "${name}님~ 전체적으로 보면~ 이렇게 해보시면 좋겠습니다~"

★ "점성술에서는" "사주에서는" 같은 시스템 구분 표현은 최소화하고, ${name}님의 이야기로 자연스럽게 녹여내세요.
★ 학문적 분석이 아닌 따뜻한 상담입니다. 전문 용어는 풀어서 설명하세요.

========================
STEP 4: 출력 구조
========================
아래 구조를 따르세요:

[도입 10%] ${name}님을 환영하며 핵심 한 문장으로 올해의 방향을 제시합니다.
[본문 40%] STEP 2의 해석을 자연스러운 상담 어조로 풀어냅니다.
- **교차 확인된 패턴**을 먼저 서술합니다.
- **구체적 시기, 월별 흐름, 주의 시점**을 명시합니다.
참고: **아래 나열된 모든 키워드들은 내부 분석 태그이며, 리딩 텍스트에는 절대 그대로 노출하지 마세요. 반드시 자연스러운 상담 문장으로 풀어서 표현하세요.**
[월별 흐름 30%] 월별 타임라인을 자연스러운 이야기로 풀어냅니다.
- '날씨(Weather)', '주요 이벤트(Major Event)', '실행 포인트(Action Point)' 프레임 사용.
- "1월은 씨앗을 심는 시기", "5월은 결실의 달", "9월은 점검 시기" 같은 은유 활용.
- **꼭 구체적인 행동 조언(1~2가지)을** 함께 제시하고, "이 시기에는 이런 활동을 해보세요" 형태로 구성.
- '특정 월(Month)만' 언급하는 것이 아니라 전체 흐름을 짚어주세요.
- "상반기 / 하반기" 큰 틀도 제시하세요.
[의사결정]  질문에 대한 직접적인 답변을 제시합니다.
  - ${decisionAxes ? '의사결정 축 3가지를 근거와 함께 분석합니다.' : '종합적 방향성을 제시합니다.'}
[행운 요소 10%] 행운의 색상·방향·숫자 등을 1~2줄로 간결히 제시합니다.
[마무리 10%] ${name}님을 격려하는 따뜻한 마무리 멘트.

========================
[STEP 5: 품질 검증 체크리스트]
========================
응답 생성 전 반드시 아래를 확인하세요. 6가지 항목을 모두 통과해야 합니다:

1번 - 교차 인용 검증: 본문에서 반드시 교차 패턴을 인용했는지 확인.
2번 - 구체성 검증: 추상적 표현(좋습니다/나쁩니다) 대신 구체적 시기(월/분기), 구체적 행동(무엇을) 포함 여부 확인. "조심하세요" 대신 "어떤 상황에서 어떻게" 구체적으로.
3번 - 균형 검증: 긍정 3건 이상, 주의점 2건 이상 포함했는지 확인. "장밋빛 전망"만 있으면 안 됨.
4번 - 시기 구체성 검증: 월별 흐름에서 최소 3개 월에 대해 구체적 행동 조언이 있는지, "좋은 달" "나쁜 달" 같은 추상적 표현 대신 실질적 조언이 있는지 확인.
5번 - 시스템 출처 확인: 본문에 (1)사주 근거 (2)자미두수 근거 (3)점성술 또는 수비학 근거가 최소 1건씩은 있는지 확인.
6번 - 마무리 완성도 검증: "올해 1~2줄 핵심 요약"이 존재하는지 확인. 마무리가 허공에 뜬 응원이 아닌 구체적 조언인지 확인.

${axisPrompt}

========================
STEP 6: 포맷 규칙
========================
- 마크다운 기호(#, **, -, \`\`\`) 절대 금지. 순수 텍스트만 출력.
- JSON 형식 금지.
- "분석 결과", "해석 결과" 같은 딱딱한 표현 금지. 대신: "보여드리면", "말씀드리면"
- "운세", "점괘", "사주 풀이" 같은 직접적 점술 용어 최소화.
- "final_one_line", "risk_one_line", "SECTION", "STEP" 등 내부 태그 노출 절대 금지.
- 전체 출력 길이는 한국어 기준 2000자 이상.`;

  // ═══════════════════════════════════════════════════════
  // P-6: 동적 프롬프트 조립 (pickSection + TOKEN BUDGET)
  // ═══════════════════════════════════════════════════════
  const budget = TOPIC_SECTION_BUDGET[qType] || TOPIC_SECTION_BUDGET['general_future'];

  function pickSection(
    level: SectionBudget,
    fullContent: string,
    summarizer: (s: string) => string
  ): string {
    if (level === 'skip') return '';
    if (level === 'summary') return summarizer(fullContent);
    return fullContent; // 'full'
  }

  const finalSaju = pickSection(budget.saju, section1, summarizeSaju);
  const finalZiwei = pickSection(budget.ziwei, section2, summarizeZiwei);
  const finalAstrology = pickSection(budget.astrology, section3, summarizeAstrology);
  const finalNumerology = pickSection(budget.numerology, section4, summarizeNumerology);
  const finalTarot = pickSection(budget.tarot, section5, summarizeTarot);

  const budgetEntries = Object.entries(budget)
    .map(([sys, level]) => `${sys}: ${level}`)
    .join(', ');

  const tokenBudgetNote = `
[TOKEN BUDGET 안내] 질문 유형="${qType}" → ${budgetEntries}
- full: 해당 섹션의 모든 데이터를 깊이있게 활용하십시오.
- summary: 핵심 포인트만 간략히 참조하십시오.
- skip: 이 섹션은 생략되었습니다. 언급하지 마십시오.
`;

  return `${preBuiltConclusion}${tokenBudgetNote}${section0}${sectionSignals}${section05}${finalSaju}${finalZiwei}${finalAstrology}${finalNumerology}${finalTarot}${topicFocusInstruction}${instructions}`;
}

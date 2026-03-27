import { Signal, CrossSignal } from './signalExtractor.ts';
import { ILJU_MEANINGS, TENGO_DEEP, GYEOKGUK_DEEP, TWELVE_STAGES_DEEP, YONGSIN_ADVICE, SINSAL_DEEP, DAEWOON_INTERACTION, INTERACTION_DEEP } from "./interpretations/index.ts";
import { buildZiWeiPromptSection } from "./ziweiPromptBuilder.ts";
import { runCrossValidation } from "./crossValidationEngine.ts";

export interface UserInfo {
  name?: string;
  birthDate?: string;
  birthTime?: string;
  gender?: string;
  question?: string;
  questionType?: string;
  language?: string;
}

interface SajuAnalysisResult { [key: string]: any; }
interface AstrologyResult { [key: string]: any; }
interface ServerZiWeiResult { [key: string]: any; }
interface NumerologyResult { [key: string]: any; }
interface TarotResult { [key: string]: any; }
interface CrossValidationResult { [key: string]: any; }
interface UnifiedTimeline { [key: string]: any; }

// ─── 질문 유형별 자미두수 핵심 궁 매핑 ───
const ZIWEI_PALACE_MAP: Record<string, string[]> = {
  relationship: ['부처궁', '복덕궁', '천이궁'],
  finance: ['재백궁', '전택궁', '관록궁'],
  career: ['관록궁', '천이궁', '재백궁'],
  health: ['질액궁', '복덕궁', '명궁'],
  general_future: ['명궁', '관록궁', '재백궁', '부처궁'],
  default: ['명궁', '관록궁', '재백궁'],
};

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
  const dw = s.daewoon || {} as any;
  const currentDw = dw.currentDaewoon || {};
  const currentSeun = dw.current_seun || {};
  const crossInt = s.cross_interactions || {} as any;
  const sewoonRels = [
    ...(crossInt.sewoon?.with_original?.branch_rels || []),
    ...(crossInt.sewoon?.with_original?.stem_rels || []),
  ];
  const seunTwelveStage = s.twelve_stages?.seun || {} as any;
  const dwTwelveStage = currentDw.twelveStageEnergy || {} as any;

  const z = ziwei || {} as any;
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
  // s is already defined as saju above.
  
  // 대운 정보
  const dwInfo = s.currentDaewoon || s.daewoon || {};
  const daewoonStr = dwInfo.full 
    ? `▶ 대운(10년 흐름): ${dwInfo.full} (${dwInfo.tenGodStem || ''}/${dwInfo.tenGodBranch || ''}) - ${dwInfo.startAge || '?'}세~${dwInfo.endAge || '?'}세`
    : '';

  // 세운 정보
  const swInfo = s.sewoon || {};
  const sewoonStr = swInfo.full
    ? `▶ 세운(올해): ${swInfo.full} - 12운성: ${swInfo.twelveStage || s.twelveStage?.stage || '?'} (에너지 ${swInfo.score || s.twelveStage?.score || '?'}점)`
    : '';

  // 월운 정보 (timelineEngine의 months 배열)
  const monthEntries = tl.months || tl.entries || tl.timeline || [];
  const monthlyStr = Array.isArray(monthEntries) && monthEntries.length > 0
    ? monthEntries?.map((m: any) => {
        const month = m.month || m.label || '';
        const summary = m.summary || m.description || m.event || '';
        const score = m.score !== undefined ? ` (${m.grade || ''} ${m.score}점)` : '';
        return `  - [${month}]: ${summary}${score}`;
      }).join('\n')
    : '월별 상세 데이터 없음';

  // 대운 전환기 특별 안내
  const dwTransition = dwInfo.startAge && Math.abs((s.currentAge || 0) - dwInfo.startAge) <= 2
    ? `\n⚠ 대운 전환기(±2년): 현재 ${s.currentAge}세로 대운 시작(${dwInfo.startAge}세)과 가까워 에너지 변동이 큰 시기입니다.`
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

  // ========================
  // SECTION 0.5: 교차 패턴 분석 (코드 사전 계산)
  // ========================
  const crossPatterns: string[] = [];

  const crossVal = (ziwei && saju) ? runCrossValidation(ziwei, saju) : null;

  if (crossVal) {
    crossPatterns.push(`\n[자미두수×사주 구조적 교차 검증] (일치율: ${crossVal.overallAgreement}%)`);
    crossPatterns.push(`요약: ${crossVal.summary}`);
    for (const item of crossVal.items) {
      crossPatterns.push(`  ${item.label}: 자미두수(${item.ziweiSignal}) × 사주(${item.sajuSignal}) → ${item.agreement} (${item.confidence}%)`);
      if (item.ziweiEvidence.length > 0) crossPatterns.push(`    자미: ${item.ziweiEvidence.slice(0, 2).join(", ")}`);
      if (item.sajuEvidence.length > 0) crossPatterns.push(`    사주: ${item.sajuEvidence.slice(0, 2).join(", ")}`);
    }
    if (crossVal.strongSignals.length > 0) {
      crossPatterns.push(`\n  ★ 강력 교차 확인: ${crossVal.strongSignals.join(" | ")}`);
    }
    if (crossVal.conflictSignals.length > 0) {
      crossPatterns.push(`\n  ⚠ 상충 주의: ${crossVal.conflictSignals.join(" | ")}`);
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
  const signals = signalData?.signals || [];
  const crossSignals = signalData?.crossSignals || [];

  const signalText = signals?.map(sig => 
    `- [${sig.source.toUpperCase()}] ${sig.title}: ${sig.description} (심각도:${sig.severity})`
  ).join('\n') || '추출된 개별 신호 없음';

  const crossSignalText = crossSignals?.map(cs => 
    `- [${cs.category.toUpperCase()} ${cs.type.toUpperCase()}] 합의도:${cs.agreementCount} (${cs.confidence}) -> 상세:${cs.sources?.map(s=>s.title).join(', ')}`
  ).join('\n') || '교차 합의된 강력한 신호 없음';

  const sectionSignals = `
=== [SECTION 0.1] 리스크 및 기회 정밀 신호 (RISK & OPPORTUNITY SIGNALS) ===
여기에 나열된 신호는 엔진들이 직접 계산한 가장 확실한 근거입니다. 
특히 합의도가 높은 중복 신호는 리딩에서 반드시 강조하십시오.

[강력한 교차 합의 신호]
${crossSignalText}

[시스템별 개별 신호 근거]
${signalText}
`;

  // 자미두수 구조화 데이터 주입
  const ziweiSection = ziwei ? buildZiWeiPromptSection(ziwei as any) : "";

  // ========================

  // === Phase 2: 사주 심층 프로필 주입 ===
  const gyeokName = s?.gyeokguk?.name || s?.gyeokguk || '';
  const gyeokProfile = gyeokName ? GYEOKGUK_DEEP[gyeokName] : null;
  const gyeokBlock = gyeokProfile ? `
【격국 심층: ${gyeokName}】
• 본질: ${gyeokProfile.essence}
• 적합 진로: ${gyeokProfile.career_fit}
• 약점: ${gyeokProfile.weakness}
• 용신 작용: ${gyeokProfile.with_yongsin}` : '';

  const seunTengo = s?.fortune?.tenGodStem || '';
  const tengoProfile = seunTengo ? TENGO_DEEP[seunTengo] : null;
  const tengoBlock = tengoProfile ? `
【올해 십성 심리: ${seunTengo}】
• 심리 변화: ${tengoProfile.psychology}
• 영향 영역: ${tengoProfile.life_area}
• 조언: ${tengoProfile.advice}` : '';

  const stageName = s?.twelve_stages?.seun?.stage || s?.fortune?.twelveStage || '';
  const stageProfile = stageName ? TWELVE_STAGES_DEEP[stageName] : null;
  const stageBlock = stageProfile ? `
【12운성 심층: ${stageName}】
• 에너지 레벨: ${stageProfile.energy_level}%
• 핵심 의미: ${stageProfile.meaning}
• 조언: ${stageProfile.advice}` : '';

  const deepSajuProfile = [gyeokBlock, tengoBlock, stageBlock].filter(Boolean).join('\n');
  // === Phase 2 끝 ===



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
      return p ? `  • ${ss.name}: ${p.meaning} (${p.effect})` : null;
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
  // === Phase 3 끝 ===

  const sewoonTop3 = sortedSewoonRels.slice(0, 3)
    .map((r: any) => `${r.pair} ${r.type}: ${r.description}`)
    .join(' / ') || '특별한 작용 없음';

  const section1 = `
=== [SECTION 1] 사주 명리 (핵심) ===
• 일간: ${s.dayMaster || '?'} | 신강/약: ${s.strength || '?'} | 격국: ${s.gyeokguk?.name || '?'} (${s.gyeokguk?.type || ''})
• 강약 상세: ${s.strength_detail?.deukryeong?.result || '?'}/${s.strength_detail?.deukji?.result || '?'}/${s.strength_detail?.deukse?.result || '?'} — ${s.strength_detail?.overall_reason || ''}
• 용신: ${s.yongShin || '?'} (판정법: ${s.yongShinMethod || ''}) | 희신: ${s.heeShin || '?'} | 기신: ${s.giShin || '?'}
• 용신 근거: ${s.yongsin_detail?.final?.reason || ''}
• 오행: ${elSummary}
• 현재 대운: ${currentDw.full || '?'} (${currentDw.startAge || '?'}~${currentDw.endAge || '?'}세) — 십성: ${currentDw.tenGodStem || ''}/${currentDw.tenGodBranch || ''}${s.is_daewoon_changing_year ? ' [★교운기: 환경/심경 급변기]' : ''} — 에너지: ${dwTwelveStage.level || '?'}점(${dwTwelveStage.description || ''})
• 세운(${currentSeun.year || '?'}): ${currentSeun.full || '?'} — 십성: ${currentSeun.tenGodStem || ''}/${currentSeun.tenGodBranch || ''}
• 올해 운세(세운): [${s.fortune?.rating || '평'}] ${s.fortune?.interpretation || ''} (점수: ${s.fortune?.score || 0})
• 이번 달(월운): [${s.fortune?.currentMonthFortune?.rating || '평'}] ${s.fortune?.currentMonthFortune?.interpretation || ''}
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
• 명궁(${zRaw.lifePalace || '?'}): ${mingStars} | 신궁: ${zRaw.shenGong || '?'} | 오행국: ${zRaw.fiveElementFrame || zRaw.bureau || '?'}
• 생년사화: ${natalSiHua}
• 유년사화(${zRaw.annualYear || '?'}년 ${zRaw.annualGan || '?'}년간): ${annualSiHua}
• 현재 대한(${currentMajor.startAge || '?'}~${currentMajor.endAge || '?'}세): ${currentMajor.palace || '?'}궁 — 주성: ${majorStars}
• 올해 유년/소한: ${zRaw.currentMinorPeriod?.palace || '?'}궁(${zRaw.currentMinorPeriod?.branch || '?'}지) — ${zRaw.currentMinorPeriod?.interpretation || ''}
• 질문 관련 핵심 궁:
${selectedPalaces}

${ziweiSection}

★ 궁 선택 규칙: 질문="${userInfo.question || '종합운'}" → ${targetPalaceNames.join(', ')} 궁 중심 해석
★ 자미두수 해석 지침: 빈궁이 있으면 대궁(반대편 궁)의 주성 영향으로 해석하라. 데이터가 전체적으로 부족하면 "자미두수 관점에서는 출생 시간 확인이 필요하지만, 사주와 점성술 기준으로..."라고 전환하라. 자미두수 데이터가 있는 궁은 반드시 해석에 포함할 것.
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
  // === 주제별 점성술 데이터 우선 정렬 ===
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

  const section3 = `
=== [SECTION 3] 서양 점성술 (핵심) ===
• 태양: ${formatPlanet(sun)}
• 달: ${formatPlanet(moon)}
• 토성: ${formatPlanet(saturn)}
• ASC: ${ascSign} ${ascDeg}°
${dignityPlanets.length > 0 ? `• 디그니티: ${dignityPlanets?.map((p: any) => `${p.planet} ${p.sign} [${p.dignity}]`).join(', ')}` : ''}
• 주요 어스펙트 (orb 순):
${topAspects}
• 트랜짓 핵심:
${topTransits}
• 프로그레션(내적 변화): 달 ${aRaw.progression?.moon || '?'} (${aRaw.progression?.moon_house || '?'}하우스) — 어스펙트: ${aRaw.progression?.moon_aspects?.map((ma: any) => `${ma.aspect} to ${ma.planet}`).join(', ') || '없음'}
• 솔라리턴(${sr.year || '?'}): ASC ${srAsc}, 달 ${srMoonHouse}하우스
`;

  // ========================
  // SECTION 4: NUMEROLOGY 핵심
  // ========================
  const currentPinnacle = (n.pinnacles || []).find((p: any) => {
    if (!p.period) return false;
    const match = p.period.match(/(\d+)세?\s*~\s*(종료|\d+)/);
    if (!match) return false;
    const start = parseInt(match[1]);
    return start <= 40; // 현재 나이 기준 — 동적으로 계산 가능
  }) || (n.pinnacles || []).slice(-1)[0] || {} as any;

  const currentChallenge = (n.challenges || []).slice(-1)[0] || {} as any;

  const section4 = `
=== [SECTION 4] 수비학 (핵심) ===
• 생명수: ${n.life_path_number || n.lifePath || '?'}${n.is_master_number ? ` (마스터넘버)` : ''} | 운명수: ${n.destiny_number || '?'} | 개인년: ${n.personal_year || '?'}
• 현재 피너클: ${currentPinnacle.number || '?'} (${currentPinnacle.meaning || ''}) | 챌린지: ${currentChallenge.number || '?'} (${currentChallenge.meaning || ''})
• 키워드: ${(n.vibrations || []).join(' / ') || '없음'}
`;

  // ========================
  // SECTION 5: TAROT (있을 경우만)
  // ========================
  const tarotCards = tarot?.cards || [];
  let section5 = '';
  if (tarotCards.length > 0) {
    const cardList = (tarotCards||[]).map((c: any, i: number) =>
      `${c.position || i + 1}. ${c.name || '?'}${c.reversed ? '(역방향)' : '(정방향)'}`
    ).join('\n');
    section5 = `
=== [SECTION 5] 타로 ===
${cardList}
`;
  }

  // Phase 3-2: 질문 주제별 핵심 분석 데이터 지시
  const topicFocusInstruction = topicFocus
    ? `\n\n[질문 주제별 핵심 분석 포인트]
이 질문에 가장 관련 깊은 데이터를 우선적으로 활용하여 리딩하라:
${Object.entries(topicFocus)
  .map(([system, keywords]) => {
    const label: Record<string, string> = {
      saju: '기질/운세 핵심',
      ziwei: '내면 궁위 핵심',
      astrology: '에너지 흐름 핵심',
      numerology: '수리적 상징 핵심',
      tarot: '카드 해석 핵심'
    };
    return `- ${label[system] || system}: ${keywords.join(', ')}`;
  })
  .join('\n')}
★ 주의: 위 키워드는 분석의 '근거'로만 사용하고, 자미두수/점성술/수비학 체계 이름이나 전문 용어는 직접 언급하지 말 것.`
    : '';

  // Phase 3-3: 의사결정 프레임워크 — 분석 축 주입
  const axisPrompt = decisionResult
    ? `\n\n[데이터 기반 최종 의사결정 가이드라인]
- 이번 질문에 대해 시스템이 도출한 최종 결정은 **"${decisionResult.decision}"**입니다. (신뢰도: ${decisionResult.confidence}%)
- 분석 근거: ${decisionResult.reason}
- ★ 지시: 상담사는 반드시 이 "${decisionResult.decision}" 결정을 전체 리딩의 결론이자 중심축으로 삼아야 합니다. 이 결정에 반하는 해석을 하지 마십시오.`
    : decisionAxes
    ? `\n\n========================
[의사결정 분석 항목: ${qType || '종합운'}]
========================
이 질문에 대해 다음 3가지 핵심 요소를 깊이 있게 분석하라:
${decisionAxes.axes?.map((a, i) => {
  // '타이밍 (지금이 적기인가)' 형태에서 '(지금이 적기인가)'만 추출
  const match = a.match(/\(([^)]+)\)/);
  const desc = match ? match[1] : a;
  return `${i + 1}. ${desc}`;
}).join('\n')}

${decisionAxes.axisInstruction}
`
    : `\n\n[의사결정 판단 기준]
- 4개 이상 체계가 긍정 → "확신을 가지고 진행하셔도 좋습니다"
- 3:2로 긍정 우세 → "가능하지만 [부정 체계의 경고 영역]에 주의하세요"  
- 2:3 또는 그 이하 → "지금은 준비 기간으로 삼고, [긍정 전환 시기]를 기다리세요"
- 강력한 경고 합의 → "현재는 보류하고, 구체적으로 [회피 방법]을 실천하세요"`;


  // ========================
  // INSTRUCTIONS
  // ========================
  const instructions = `
========================
MASTER READING PROTOCOL V4
========================

당신은 타로와 사주를 중심으로 자미두수, 점성술, 수비학의 다각적 데이터를 통합 해석하는 최상위 점술가입니다.
아래 엔진 데이터를 기반으로 ${name}님에게 깊이 있는 통합 리딩을 작성하세요.

========================
STEP 1: 질문 맥락 파악 (최우선)
========================
${userInfo.question ? `
${name}님의 질문: "${userInfo.question}"
질문 분류: ${userInfo.questionType || 'general_future'}
→ 이 질문이 해석의 중심축이다. 모든 엔진 데이터를 이 질문에 답하는 방향으로 해석하라.
${(() => {
  const qt = userInfo.questionType || 'general_future';
  if (qt.includes('love') || qt.includes('연애') || qt.includes('relationship') || qt.includes('재회') || qt.includes('궁합'))
    return `→ [연애/관계 특화] 사주: 일지·월지 관계, 도화살, 합충 중심. 자미두수: 부처궁·복덕궁 중심. 점성술: 7하우스·금성·달 어스펙트 중심. 수비학: 관계수·개인년. 해석 비중: 관계 데이터 60%, 일반 운세 20%, 시기 조언 20%.`;
  if (qt.includes('career') || qt.includes('직업') || qt.includes('이직') || qt.includes('취업') || qt.includes('승진'))
    return `→ [직업/커리어 특화] 사주: 관성·식상·재성 관계, 세운 12운성 중심. 자미두수: 관록궁·천이궁 중심. 점성술: 10하우스·6하우스·토성·목성 어스펙트 중심. 수비학: 생명수·개인년. 해석 비중: 직업 데이터 60%, 관계 영향 20%, 시기 조언 20%.`;
  if (qt.includes('finance') || qt.includes('재물') || qt.includes('사업') || qt.includes('투자'))
    return `→ [재물/사업 특화] 사주: 재성·식상생재, 용신 활용 중심. 자미두수: 재백궁·전택궁 중심. 점성술: 2하우스·8하우스·목성 어스펙트 중심. 수비학: 생명수·개인년 재물 사이클. 해석 비중: 재물 데이터 60%, 리스크 분석 20%, 시기 조언 20%.`;
  if (qt.includes('health') || qt.includes('건강'))
    return `→ [건강 특화] 사주: 오행 균형·과다/부족 원소, 용신 중심. 자미두수: 질액궁 중심. 점성술: 6하우스·12하우스 중심. 해석 비중: 건강 데이터 60%, 생활 조언 20%, 시기 조언 20%.`;
  return `→ [종합운] 모든 엔진을 균등하게 활용하되, 가장 임팩트 큰 변화에 집중하라.`;
})()}
` : `
별도 질문이 없으므로 올해 전반적 운세를 해석하되, 가장 임팩트 큰 변화에 집중하라.
`}

${(readingHistory && readingHistory.length > 0) ? `
========================
STEP 1.5: 과거 상담 이력 (재방문 맥락)
========================
${name}님은 이전에 다음과 같은 상담을 받은 적이 있습니다:
${readingHistory?.map((h: any, i: number) => 
  `[${i+1}] ${h.date} - 질문: "${h.question}" → 핵심: ${h.summary.slice(0, 150)}`
).join('\n')}

→ 이전 상담 내용을 참고하여:
- 이전과 현재의 운세 변화를 자연스럽게 언급하라 (예: "지난번에는 신중함이 필요했지만, 이번에는...")
- 이전 조언이 현재도 유효한지 평가하라
- 단, 이전 내용을 그대로 반복하지 말고, 변화와 흐름에 초점을 맞춰라
` : ''}

${(() => {
  const hasBirthTime = userInfo.birthTime && userInfo.birthTime !== "" && userInfo.birthTime !== "모름";
  return hasBirthTime
    ? `========================
[엔진 신뢰도 - 출생 시간 확인됨]
========================
자미두수: 높음 (명궁/관록궁/재백궁 데이터 활용 가능)
사주: 높음 (시주까지 완전한 사주 팔자)
서양 점성술: 높음 (하우스 배치 정확)
수비학: 보통
타로: 보조 참고`
    : `========================
[엔진 신뢰도 - 출생 시간 미확인]
========================
사주: 최우선 (일주 중심 해석, 시주 제외)
서양 점성술: 높음 (하우스 배치 불확실하므로 행성 어스펙트 중심)
수비학: 높음 (출생 시간 불필요)
자미두수: 참고 수준 (명궁 추정치이므로 보조적으로만 활용)
타로: 보조 참고
→ 자미두수 해석 시 "출생 시간에 따라 달라질 수 있습니다"를 반드시 언급하라.`;
})()}

========================
STEP 2.5: 신살 해석 (사주 심층)
========================
위 신살 목록에서:
- 귀인(천을귀인, 천덕귀인 등)이 있으면 → 해당 영역에서 도움을 받을 수 있음을 강조
- 흉살(도화살, 역마살, 백호대살 등)이 있으면 → 구체적 주의사항과 활용법을 제시
- 귀인과 흉살이 동시에 있으면 → 흉살의 부정적 영향이 귀인에 의해 완화될 수 있음을 설명
- 신살의 위치(년주/월주/일주/시주)에 따라 영향 범위가 다름을 반영하라

========================
STEP 2: 엔진 간 교차 검증 (핵심)
========================
아래 절차를 반드시 수행하라:

(A) 합치 찾기: 2개 이상 엔진이 같은 방향을 가리키는 신호를 찾아라.
    예: "사주 세운 건록(확장) + 점성술 목성 육분(기회) = 확장 신호 강함"

(B) 모순 해결: 엔진 간 반대 신호가 있으면 반드시 해석하라. 무시하지 마라.
    예: "대운 30점(내면 성찰) vs 세운 90점(활발한 확장)"
    → "장기적으로는 내면을 다지는 흐름이지만, 올해만큼은 세운의 강한 에너지를 활용해 구체적 행동으로 옮기기 좋은 타이밍입니다. 다만 무리한 확장보다는 내면의 확신이 선 것부터 실행하세요."
    이런 식으로 모순을 통합하는 해석을 반드시 제시하라.

(C) 강도 판별: 합치가 3개 이상이면 "확정적 흐름", 2개면 "유력한 흐름", 1개면 "참고 수준"으로 표현.

========================
STEP 3: 개인화 추론 (차별화 핵심)
========================
${name}님의 고유 데이터를 반드시 성격/행동 패턴과 연결하라:

○ "${name}님의 ${s.dayMaster || ''} 일간은 ~한 성향이므로, 이 시기에 ~하게 반응할 가능성이 높습니다"
○ "${name}님의 ${s.dayMaster || ''} 일간이 ${currentSeun?.full || ''} 세운을 만나면 ~한 현상이 생기는데, 구체적으로 직장에서는 ~, 관계에서는 ~"
○ "생명수 ${n.life_path_number || ''}인 ${name}님은 ~한 성향이 있어서, 올해 개인년 ${n.personal_year_number || ''}의 에너지와 만나면 ~"
○ 자미두수 명궁 주성이 있다면: "${name}님의 명궁 주성 ~는 ~한 기질을 의미하며, 올해 ~"

반드시 "누구에게나 해당되는 말"이 아닌, ${name}님에게만 해당되는 해석을 하라.
검증: 해석에서 이름과 데이터를 빼면 의미가 달라져야 한다. 달라지지 않으면 일반론이다.

========================
STEP 4: 글 구조
========================
다음 순서로 작성하라:

[도입 10%] ${name}님의 현재 상태를 공감하며 시작. 질문이 있으면 질문을 언급.
[핵심 흐름 40%] STEP 2에서 찾은 합치/모순을 중심으로 올해의 핵심 흐름 서술.
  - 리딩은 **타로와 사주를 중심축**으로 서술하십시오.
  - **자미두수, 점성술, 수비학은 체계 이름을 본문에서 직접 언급하지 마십시오.** 또한 다음 전문 용어를 리딩 본문에 절대 사용하지 마십시오: **자미두수, 명궁, 화록, 명궁주성, 점성술, 상승궁, 트랜짓, 수비학, 생명수, 표현수**. 이들은 사용자에게 보이지 않는 '객관적 분석 근거'로만 활용하여 전체적인 해석의 신뢰도를 높이는 데 사용하십시오.
  - 다음 표현은 사용하지 말고 괄호 안의 표현으로 자연스럽게 바꿔 쓸 것:
    "판단됩니다" → "보입니다" 또는 "읽힙니다"
    "분석됩니다" → "느껴집니다" 또는 "그려집니다"
    "해석됩니다" → "읽힙니다" 또는 "다가옵니다"
    "변동성" → "변화의 폭" 또는 "흔들림"
    "대안" → "다른 방향" 또는 "선택지"
  - 모순이 있으면 여기서 해결.
[시기별 조언 30%] '지금이 적기인가'에 대해 명확히 답하십시오.
  - 대운은 '배경(Weather)', 세운은 '이벤트(Major Event)', 월운은 '타이밍(Action Point)'입니다.
  - 대운이 불리해도 세운이 좋으면 "조건부 진행", 둘 다 좋으면 "적극 실행", 둘 다 불리하면 "철저 대기"로 판단하십시오.
  - **교운기(대운 교체 1-2년 전후)**는 항로가 바뀌는 시기이므로, 이 정보가 있는 경우 반드시 "급격한 환경 변화나 심경 변화에 주의"하라고 경고하십시오.
  - 트랜짓 날짜나 점성술 프로그레션 달의 이동을 활용해 '구체적인 월(Month)'을 지목하여 조언하십시오.
  - 각 시기마다 "무엇을 하라/하지 마라" 명확히.
[의사결정 분석] 
  - ${decisionAxes ? '위에서 제시한 3가지 분석 축을 바탕으로 현 상황을 심층 진단하십시오.' : '종합적인 의사결정 포인트를 짚어주십시오.'}
[주의사항 10%] 가장 큰 리스크 1~2개. 구체적 상황으로 표현.
[마무리 10%] ${name}님의 강점을 언급하며 격려.

========================
[STEP 5: 의사결정 어드바이저 원칙]
========================
당신은 단순한 점술가가 아니라 '운명 기반 의사결정 어드바이저'입니다. 다음 6가지 원칙을 반드시 따르세요:

원칙1 - 타로 중심 스토리텔링: 타로 카드가 질문에 대한 핵심 방향을 제시하고, 나머지 체계는 그 방향을 검증하고 보강하는 구조로 서술하세요.
원칙2 - 타이밍 검증: 사주(세운/월운), 자미두수(유년/유월), 점성술(트랜짓)의 시간축 데이터가 있다면, "언제"가 적기인지 구체적 시기를 제시하세요. 없다면 원국 기반으로 방향성만 제시하세요.
원칙3 - 합의 강조: 3개 이상의 체계가 같은 방향을 가리키면, "여러 체계가 동의합니다"라고 명시하여 내담자에게 확신을 부여하세요.
원칙4 - 불일치 활용: 체계 간 의견이 갈리면, "기회는 있지만 조건이 붙습니다" 또는 "가능하지만 시기 조정이 필요합니다"처럼 조건부 해석으로 전환하세요. 절대 무시하지 마세요.
원칙5 - 경고는 구체적으로: 위험 신호가 감지되면 반드시 (1) 어떤 영역인지 (2) 언제인지 (3) 어떻게 피하거나 완화할 수 있는지 세 가지를 모두 포함하세요.
원칙6 - 행동 지침 마무리: 리딩의 마지막은 반드시 "지금 당장 할 수 있는 구체적 행동 1~2가지"로 끝내세요. 막연한 조언이 아니라 실행 가능한 지침이어야 합니다.

${axisPrompt}

========================
STEP 6: 금지 사항
========================
- 마크다운(#, **, -, \`\`\`) 절대 금지. 순수 텍스트만.
- JSON 형식 금지.
- "기운이 감돈다", "에너지가 흐른다" 같은 모호한 표현 → 구체적 상황으로 번역.
  예: "직장에서 승진 기회가 올 수 있다", "연인과 깊은 대화가 필요한 시점이다"
- "지배벡터", "합의점수", "교차 검증" 같은 시스템 내부 용어 절대 금지.
- "final_one_line", "risk_one_line", "SECTION", "STEP" 같은 프롬프트 라벨 출력 금지.
- 동일한 문장/표현을 2회 이상 반복 금지.
`;

  return `${section0}${sectionSignals}${section05}${section1}${section2}${section3}${section4}${section5}${topicFocusInstruction}${instructions}`;
}

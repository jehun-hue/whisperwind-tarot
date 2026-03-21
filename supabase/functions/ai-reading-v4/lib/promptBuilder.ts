// lib/promptBuilder.ts — E1-A Master Prompt v2 (2026-03-20)
// 결론 강제 + 선별 데이터 주입 + 질문별 궁 선택

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
  timeline: UnifiedTimeline
): string {

  const name = userInfo.name && userInfo.name.trim() ? userInfo.name.trim() : '내담자';
  const qType = userInfo.questionType || 'general_future';

  // ── 데이터 추출 및 정규화 (전역 사용을 위해 상단 배치) ──
  const s = saju || {} as any;
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

  // ═══════════════════════════════════════════
  // SECTION 0: CORE CONSENSUS (결론 먼저)
  // ═══════════════════════════════════════════
  const cv = crossValidation || {} as any;
  const dv = cv.dominant_vector || {};

  // dominant_vector에서 상위 3개 추출
  const topVectors = Object.entries(dv)
    .filter(([_, v]) => typeof v === 'number')
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${(v as number).toFixed(2)}`)
    .join(', ');

  const conflictSummary = cv.conflict_summary || '충돌 없음';

  // 타임라인
  const tl = timeline as any;
  const timelineEntries = Array.isArray(tl) ? tl : (tl?.entries || tl?.timeline || []);
  const timelineStr = Array.isArray(timelineEntries)
    ? timelineEntries.map((t: any) =>
        `${t.window || t.period}: ${t.label} (확률 ${((t.probability || 0) * 100).toFixed(0)}%) — ${t.description || ''}`
      ).join('\n')
    : '타임라인 데이터 없음';

  const section0 = `
═══ [SECTION 0] 핵심 결론 (CORE CONSENSUS) ═══
▶ 지배 에너지: ${topVectors || '분석 중'}
▶ 엔진 간 충돌: ${conflictSummary}
▶ 타임라인:
${timelineStr}

★ 지시: 위 결론을 기반으로 리딩 첫머리에 (1) 올해의 핵심 방향을 요약한 한 문장, (2) 가장 주의할 점을 요약한 한 문장을 자연스러운 문장으로 제시하라. "final_one_line", "risk_one_line" 같은 라벨을 절대 출력하지 말라.
`;

  // ═══════════════════════════════════════════
  // SECTION 0.5: 교차 패턴 분석 (코드 사전 계산)
  // ═══════════════════════════════════════════
  const crossPatterns: string[] = [];

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
    crossPatterns.push('⚠️ 관계 갈등 강화 패턴: 사주(' + sewoonRels.filter((r: any) => r.type === '파' || r.type === '충').map((r: any) => r.pair + ' ' + r.type).join(', ') + ') + 점성술(Mars□Pluto 등 긴장 어스펙트) → 직장/대인관계에서 마찰 가능성 높음');
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
═══ [SECTION 0.5] 엔진 간 교차 패턴 (사전 분석) ═══
${crossPatterns.join('\n')}

★ 지시: 위 교차 패턴을 리딩의 핵심 뼈대로 사용하라. 단일 엔진 데이터보다 교차 패턴을 우선 인용하라.
`
    : '';

  // ═══════════════════════════════════════════
  // SECTION 1: SAJU 핵심
  // ═══════════════════════════════════════════

  // 오행 한줄 요약
  const el = s.elements || {};
  const elParts: string[] = [];
  const elEntries = Object.entries(el) as [string, number][];
  const excess = elEntries.filter(([, v]) => v >= 3).map(([k]) => k);
  const deficient = elEntries.filter(([, v]) => v === 0).map(([k]) => k);
  if (excess.length) elParts.push(`${excess.join('·')} 과다`);
  if (deficient.length) elParts.push(`${deficient.join('·')} 결핍`);
  const elSummary = elParts.join(', ') || '균형';

  const sewoonTop3 = sewoonRels.slice(0, 3)
    .map((r: any) => `${r.pair} ${r.type}: ${r.description}`)
    .join(' / ') || '특별한 작용 없음';

  const section1 = `
═══ [SECTION 1] 사주 명리 (핵심) ═══
• 일간: ${s.dayMaster || '?'} | 신강/약: ${s.strength || '?'} | 격국: ${s.gyeokguk?.name || '?'} (${s.gyeokguk?.type || ''})
• 용신: ${s.yongShin || '?'} (${s.yongShinMethod || ''}) | 희신: ${s.heeShin || '?'}
• 오행: ${elSummary}
• 현재 대운: ${currentDw.full || '?'} (${currentDw.startAge || '?'}~${currentDw.endAge || '?'}세) — 십성: ${currentDw.tenGodStem || ''}/${currentDw.tenGodBranch || ''} — 에너지: ${dwTwelveStage.level || '?'}점(${dwTwelveStage.description || ''})
• 세운(${currentSeun.year || '?'}): ${currentSeun.full || '?'} — 십성: ${currentSeun.tenGodStem || ''}/${currentSeun.tenGodBranch || ''} — 12운성: ${seunTwelveStage.stage || '?'}(${seunTwelveStage.level || '?'}점)
• 세운-원국 교차: ${sewoonTop3}
• 주요 신살: ${(s.characteristics || []).filter((c: string) => !c.startsWith('격국')).slice(0, 8).join(' | ')}

★ 현재 흐름 해석 지시: 위 대운·세운·교차작용·12운성 데이터를 종합하여 "현재 흐름을 한 줄로 압축"하라. (예: "확장 타이밍인데 실행이 늦은 상태")
`;

  // ═══════════════════════════════════════════
  // SECTION 2: ZIWEI 핵심
  // ═══════════════════════════════════════════

  // 명궁 주성
  const mingPalace = palaces.find((p: any) => p.name === '명궁');
  const mingStars = mingPalace?.main_stars?.join(', ') || mingPalace?.stars?.map((s: any) => `${s.star}(${s.brightness})`).join(', ') || '빈궁';

  // 질문별 핵심 궁 선택
  const targetPalaceNames = ZIWEI_PALACE_MAP[qType] || ZIWEI_PALACE_MAP.default;
  const selectedPalaces = targetPalaceNames.map((pName: string) => {
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
═══ [SECTION 2] 자미두수 (핵심) ═══
• 명궁(${zRaw.lifePalace || '?'}): ${mingStars} | 신궁: ${zRaw.shenGong || '?'} | 오행국: ${zRaw.fiveElementFrame || zRaw.bureau || '?'}
• 생년사화: ${natalSiHua}
• 유년사화(${zRaw.annualYear || '?'}년 ${zRaw.annualGan || '?'}년간): ${annualSiHua}
• 현재 대한(${currentMajor.startAge || '?'}~${currentMajor.endAge || '?'}세): ${currentMajor.palace || '?'}궁 — 주성: ${majorStars}
• 질문 관련 핵심 궁:
${selectedPalaces}

★ 궁 선택 규칙: 질문="${userInfo.question || '종합운'}" → ${targetPalaceNames.join(', ')} 궁 중심 해석
★ 자미두수 해석 지침: 빈궁이 있으면 대궁(반대편 궁)의 주성 영향으로 해석하라. 데이터가 전체적으로 부족하면 "자미두수 관점에서는 출생 시간 확인이 필요하지만, 사주와 점성술 기준으로..."라고 전환하라. 자미두수 데이터가 있는 궁은 반드시 해석에 포함할 것.
`;

  // ═══════════════════════════════════════════
  // SECTION 3: ASTROLOGY 핵심
  // ═══════════════════════════════════════════

  // Sun/Moon/ASC 필수
  const sun = planets.find((p: any) => p.planet === '태양');
  const moon = planets.find((p: any) => p.planet === '달');
  const saturn = planets.find((p: any) => p.planet === '토성');
  const ascSign = aRaw.core_identity?.ascendant?.sign || a.rising_sign || '?';
  const ascDeg = aRaw.core_identity?.ascendant?.degree || '?';

  // 디그니티 있는 행성
  const dignityPlanets = planets.filter((p: any) => p.dignity && p.dignity !== '없음');

  // 주요 어스펙트 TOP 6 (orb 작은 순)
  const topAspects = [...aspects]
    .filter((asp: any) => typeof asp.orb === 'number')
    .sort((a: any, b: any) => a.orb - b.orb)
    .slice(0, 6)
    .map((asp: any) => asp.interpretation || `${asp.planet1} ${asp.type} ${asp.planet2}`)
    .join('\n');

  // 트랜짓 TOP 8 (가장 가까운 정점, 날짜순 정렬)
  const topTransits = transits
    .filter((t: string) => t.includes('정점') && !t.includes('통과'))
    .sort((a: string, b: string) => {
      const dateA = a.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';
      const dateB = b.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';
      return dateA.localeCompare(dateB);
    })
    .slice(0, 8)
    .join('\n') || '주요 트랜짓 없음';

  // 솔라리턴 핵심
  const sr = aRaw.solarReturn || {} as any;
  const srAsc = sr.ascendant?.sign || '?';
  const srMoonHouse = sr.moon?.house || '?';

  const formatPlanet = (p: any) => p ? `${p.planet} ${p.sign} ${p.degree}° ${p.house}하우스${p.dignity && p.dignity !== '없음' ? ` [${p.dignity}]` : ''}` : '?';

  const section3 = `
═══ [SECTION 3] 서양 점성술 (핵심) ═══
• 태양: ${formatPlanet(sun)}
• 달: ${formatPlanet(moon)}
• 토성: ${formatPlanet(saturn)}
• ASC: ${ascSign} ${ascDeg}°
${dignityPlanets.length > 0 ? `• 디그니티: ${dignityPlanets.map((p: any) => `${p.planet} ${p.sign} [${p.dignity}]`).join(', ')}` : ''}
• 주요 어스펙트 (orb 순):
${topAspects}
• 트랜짓 핵심:
${topTransits}
• 솔라리턴(${sr.year || '?'}): ASC ${srAsc}, 달 ${srMoonHouse}하우스
`;

  // ═══════════════════════════════════════════
  // SECTION 4: NUMEROLOGY 핵심
  // ═══════════════════════════════════════════
  const currentPinnacle = (n.pinnacles || []).find((p: any) => {
    if (!p.period) return false;
    const match = p.period.match(/(\d+)세?\s*~\s*(종료|\d+)/);
    if (!match) return false;
    const start = parseInt(match[1]);
    return start <= 40; // 현재 나이 기준 — 동적으로 계산 가능
  }) || (n.pinnacles || []).slice(-1)[0] || {} as any;

  const currentChallenge = (n.challenges || []).slice(-1)[0] || {} as any;

  const section4 = `
═══ [SECTION 4] 수비학 (핵심) ═══
• 생명수: ${n.life_path_number || n.lifePath || '?'}${n.is_master_number ? ` (마스터넘버)` : ''} | 운명수: ${n.destiny_number || '?'} | 개인년: ${n.personal_year || '?'}
• 현재 피너클: ${currentPinnacle.number || '?'} (${currentPinnacle.meaning || ''}) | 챌린지: ${currentChallenge.number || '?'} (${currentChallenge.meaning || ''})
• 키워드: ${(n.vibrations || []).join(' / ') || '없음'}
`;

  // ═══════════════════════════════════════════
  // SECTION 5: TAROT (있을 경우만)
  // ═══════════════════════════════════════════
  const tarotCards = tarot?.cards || [];
  let section5 = '';
  if (tarotCards.length > 0) {
    const cardList = tarotCards.map((c: any, i: number) =>
      `${c.position || i + 1}. ${c.name || '?'}${c.reversed ? '(역방향)' : '(정방향)'}`
    ).join('\n');
    section5 = `
═══ [SECTION 5] 타로 ═══
${cardList}
`;
  }

  // ═══════════════════════════════════════════
  // INSTRUCTIONS
  // ═══════════════════════════════════════════
  const instructions = `
═══════════════════════════════════════
MASTER READING PROTOCOL V4
═══════════════════════════════════════

당신은 사주, 자미두수, 서양 점성술, 수비학, 타로를 통합 해석하는 최상위 점술가입니다.
아래 5개 엔진 데이터를 기반으로 ${name}님에게 깊이 있는 통합 리딩을 작성하세요.

━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: 질문 맥락 파악 (최우선)
━━━━━━━━━━━━━━━━━━━━━━━━
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

━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: 엔진 간 교차 검증 (핵심)
━━━━━━━━━━━━━━━━━━━━━━━━
아래 절차를 반드시 수행하라:

(A) 합치 찾기: 2개 이상 엔진이 같은 방향을 가리키는 신호를 찾아라.
    예: "사주 세운 건록(확장) + 점성술 목성 육분(기회) = 확장 신호 강함"

(B) 모순 해결: 엔진 간 반대 신호가 있으면 반드시 해석하라. 무시하지 마라.
    예: "대운 30점(내면 성찰) vs 세운 90점(활발한 확장)"
    → "장기적으로는 내면을 다지는 흐름이지만, 올해만큼은 세운의 강한 에너지를 활용해 구체적 행동으로 옮기기 좋은 타이밍입니다. 다만 무리한 확장보다는 내면의 확신이 선 것부터 실행하세요."
    이런 식으로 모순을 통합하는 해석을 반드시 제시하라.

(C) 강도 판별: 합치가 3개 이상이면 "확정적 흐름", 2개면 "유력한 흐름", 1개면 "참고 수준"으로 표현.

━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: 개인화 추론 (차별화 핵심)
━━━━━━━━━━━━━━━━━━━━━━━━
${name}님의 고유 데이터를 반드시 성격/행동 패턴과 연결하라:

○ "${name}님의 ${s.dayMaster || ''} 일간은 ~한 성향이므로, 이 시기에 ~하게 반응할 가능성이 높습니다"
○ "${name}님의 ${s.dayMaster || ''} 일간이 ${currentSeun?.full || ''} 세운을 만나면 ~한 현상이 생기는데, 구체적으로 직장에서는 ~, 관계에서는 ~"
○ "생명수 ${n.life_path_number || ''}인 ${name}님은 ~한 성향이 있어서, 올해 개인년 ${n.personal_year_number || ''}의 에너지와 만나면 ~"
○ 자미두수 명궁 주성이 있다면: "${name}님의 명궁 주성 ~는 ~한 기질을 의미하며, 올해 ~"

반드시 "누구에게나 해당되는 말"이 아닌, ${name}님에게만 해당되는 해석을 하라.
검증: 해석에서 이름과 데이터를 빼면 의미가 달라져야 한다. 달라지지 않으면 일반론이다.

━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4: 글 구조
━━━━━━━━━━━━━━━━━━━━━━━━
다음 순서로 작성하라:

[도입 10%] ${name}님의 현재 상태를 공감하며 시작. 질문이 있으면 질문을 언급.
[핵심 흐름 40%] STEP 2에서 찾은 합치/모순을 중심으로 올해의 핵심 흐름 서술.
  - 반드시 최소 3개 엔진 데이터를 교차 인용.
  - 모순이 있으면 여기서 해결.
[시기별 조언 30%] 분기별(1~3월/4~6월/7~9월/10~12월) 또는 핵심 시점 중심.
  - 점성술 트랜짓 날짜를 활용해 구체적 시점 제시.
  - 각 시기마다 "무엇을 하라/하지 마라" 명확히.
[주의사항 10%] 가장 큰 리스크 1~2개. 구체적 상황으로 표현.
[마무리 10%] ${name}님의 강점을 언급하며 격려.

━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5: 금지 사항
━━━━━━━━━━━━━━━━━━━━━━━━
- 마크다운(#, **, -, \`\`\`) 절대 금지. 순수 텍스트만.
- JSON 형식 금지.
- "기운이 감돈다", "에너지가 흐른다" 같은 모호한 표현 → 구체적 상황으로 번역.
  예: "직장에서 승진 기회가 올 수 있다", "연인과 깊은 대화가 필요한 시점이다"
- "지배벡터", "합의점수", "교차 검증" 같은 시스템 내부 용어 절대 금지.
- "final_one_line", "risk_one_line", "SECTION", "STEP" 같은 프롬프트 라벨 출력 금지.
- 동일한 문장/표현을 2회 이상 반복 금지.
`;

  return `${section0}${section05}${section1}${section2}${section3}${section4}${section5}${instructions}`;
}

// lib/promptBuilder.ts — E1-A Master Prompt v2 (2026-03-20)
// 결론 강제 + 선별 데이터 주입 + 질문별 궁 선택

export interface UserInfo {
  name?: string;
  birthDate: string;
  birthTime?: string;
  gender?: string;
  question: string;
  questionType?: string;
  language?: 'ko' | 'en' | 'ja';
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

  const name = userInfo.name || '내담자';
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
    if (!p) return `${pName}: 데이터 없음`;
    const stars = p.main_stars?.join(', ') || p.stars?.map((s: any) => `${s.star}(${s.brightness})`).join(', ') || '빈궁';
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

★ 궁 선택 규칙: 연애→부처궁+복덕궁, 재물→재백궁+전택궁, 직업→관록궁+천이궁, 건강→질액궁+복덕궁, 종합→명궁+관록궁+재백궁+부처궁
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

  // 트랜짓 TOP 3 (가장 가까운 정점)
  const transitFiltered = transits.filter((t: string) => t.includes('정점') && !t.includes('통과'));
  const topTransits = transitFiltered.slice(0, 3).join('\n') || '주요 트랜짓 없음';

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
═══ [INSTRUCTIONS] Master Reading Protocol V3 ═══

당신은 "위스퍼윈드"입니다. 세계 최고 수준의 통합 점술 상담사로서, 5개 엔진 데이터를 유기적으로 연결하여 ${name}님만을 위한 1:1 맞춤 리딩을 작성합니다.

■ [STEP 1] 추론 과정 (Chain-of-Thought) — 이 과정을 내부적으로 수행한 뒤 결과만 자연스러운 문장으로 출력하라:
  a) 4개 엔진(사주, 자미두수, 점성술, 수비학)에서 공통으로 가리키는 방향을 1개 찾아라.
  b) 엔진 간 충돌이 있다면, 어떤 엔진이 더 강한 근거를 갖는지 판단하라.
  c) SECTION 0.5의 교차 패턴이 있다면, 이것을 최우선 근거로 사용하라.
  d) 시기를 정렬하라: 대운(10년) → 세운(올해) → 트랜짓(월별) → 개인년(수비학) 순서로 겹치는 시점을 찾아라.
  e) ${name}님의 사주 원국(일간 ${s.dayMaster || '?'}, 격국 ${s.gyeokguk?.name || '?'})이 가진 고유한 특성이 현재 운에서 어떻게 작용하는지 연결하라.

■ [STEP 2] 글 구조 — 반드시 아래 순서로 작성하라:

  [도입] (2~3문장)
  - ${name}님에게 말을 거는 형태로 시작. 현재 시점의 핵심 에너지를 한 문장으로 요약.
  - "올해의 핵심 키워드"를 제시. (예: "전환", "도약", "재정비", "관계 정리")

  [핵심 흐름] (본론의 60%)
  - 교차 패턴 또는 엔진 공통 방향을 중심으로 전개.
  - 반드시 최소 3개 엔진의 데이터를 근거로 인용하되, "사주에서는 ~이고, 점성술에서도 ~하며"처럼 자연스럽게 엮어라.
  - 추상적 표현 금지. 구체적 상황으로 번역하라:
    × "에너지가 변화한다" → ○ "이직이나 부서 이동 같은 직업적 변화가 올 수 있습니다"
    × "관계에 주의가 필요하다" → ○ "가까운 동료나 친구와 사소한 말다툼이 커질 수 있으니, 감정적인 대화는 하루 미루세요"

  [시기별 조언] (본론의 30%)
  - 최소 3개 시기 구간을 제시하라. (예: 1~3월, 4~6월, 7~9월, 10~12월)
  - 각 시기마다 "무엇을 하라/하지 말라"는 구체적 행동 1개를 포함하라.
  - 트랜짓 날짜가 있으면 반드시 활용하라.

  [주의 사항] (2~3문장)
  - SECTION 0의 risk_one_line을 구체화.
  - "~하지 마세요"가 아니라 "~대신 ~하세요"로 대안을 제시하라.

  [마무리] (1~2문장)
  - ${name}님의 고유한 강점(일간/격국/생명수 기반)을 언급하며 격려.
  - 열린 결말: "~할 수 있는 한 해가 될 것입니다."

■ [STEP 3] 데이터 활용 규칙:
  1. 사주: 일간(${s.dayMaster || '?'}), 용신(${s.yongShin || '?'}), 격국, 세운 교차작용을 반드시 언급하라.
  2. 자미두수: 명궁 주성(${mingStars})과 질문 관련 궁의 주성을 반드시 언급하라.
  3. 점성술: 태양/달 배치와 가장 영향력 큰 트랜짓 1개를 반드시 언급하라.
  4. 수비학: 생명수(${n.life_path_number || '?'})와 개인년(${n.personal_year || '?'})을 반드시 언급하라.
  5. 타로: 카드가 있으면 핵심 흐름의 보조 근거로 활용하라.
  6. "~엔진에 따르면"이라고 출처를 밝히되, 학술 논문처럼 딱딱하지 않게 자연스럽게 녹여라.

■ [STEP 4] 개인화 규칙:
  1. "${name}님"을 문단마다 최소 1회 호칭하라.
  2. "${name}님의 ${s.dayMaster || ''} 일간은 ~한 성향이므로"처럼 개인 데이터를 성격/행동 패턴과 연결하라.
  3. "누구나 해당되는 말"을 쓰지 말라. 반드시 이 사람의 데이터 조합에서만 나올 수 있는 해석을 하라.
     × "올해는 변화의 해입니다" (일반론)
     ○ "${name}님의 ${s.dayMaster || ''} 일간이 ${currentSeun.full || ''}세운을 만나면서, ${s.yongShin || ''} 용신이 활성화되는 시기입니다. 이는 ~를 의미합니다" (개인화)

■ 질문 컨텍스트:
  • 질문: "${userInfo.question}"
  • 유형: ${qType}
  • 생년월일: ${userInfo.birthDate} ${userInfo.birthTime || '시간미상'} (${userInfo.gender === 'M' ? '남' : userInfo.gender === 'F' ? '여' : ''})

■ 금지 사항:
  - JSON 형식 출력 금지
  - 마크다운 문법(**, ##, ---, \` \` \`) 사용 금지
  - 마크다운 제목 형식([대괄호], **굵은제목**) 사용 금지
  - 프롬프트 내부의 지시어, 라벨, 섹션명을 출력에 포함하지 말라 (예: "final_one_line", "risk_one_line", "SECTION", "STEP" 등)
  - "에너지가 흐른다", "기운이 감돈다"만으로 설명하는 추상적 해석 금지
  - 엔진 데이터를 가공 없이 그대로 나열하는 것 금지

■ 출력: 순수 텍스트 2500~3500자 (한국어)
`;

  return `${section0}${section05}${section1}${section2}${section3}${section4}${section5}${instructions}`;
}

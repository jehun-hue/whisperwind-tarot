// lib/promptBuilder.ts — E1-A Master Prompt v2 (2026-03-20)
// 결론 강제 + 선별 데이터 주입 + 질문별 궁 선택

interface UserInfo {
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

★ 지시: 위 결론을 기반으로 final_one_line(핵심 결론 1문장)과 risk_one_line(리스크 1문장)을 반드시 리딩 첫머리에 제시하라.
`;

  // ═══════════════════════════════════════════
  // SECTION 1: SAJU 핵심
  // ═══════════════════════════════════════════
  const s = saju || {} as any;
  const dw = s.daewoon || {} as any;
  const currentDw = dw.currentDaewoon || {};
  const currentSeun = dw.current_seun || {};

  // 오행 한줄 요약
  const el = s.elements || {};
  const elParts: string[] = [];
  const elEntries = Object.entries(el) as [string, number][];
  const excess = elEntries.filter(([, v]) => v >= 3).map(([k]) => k);
  const deficient = elEntries.filter(([, v]) => v === 0).map(([k]) => k);
  if (excess.length) elParts.push(`${excess.join('·')} 과다`);
  if (deficient.length) elParts.push(`${deficient.join('·')} 결핍`);
  const elSummary = elParts.join(', ') || '균형';

  // 세운-원국 교차작용 TOP 3
  const crossInt = s.cross_interactions || {} as any;
  const sewoonRels = [
    ...(crossInt.sewoon?.with_original?.branch_rels || []),
    ...(crossInt.sewoon?.with_original?.stem_rels || []),
  ];
  const sewoonTop3 = sewoonRels.slice(0, 3)
    .map((r: any) => `${r.pair} ${r.type}: ${r.description}`)
    .join(' / ') || '특별한 작용 없음';

  // 현재 흐름 한줄 압축 생성용 데이터
  const seunTwelveStage = s.twelve_stages?.seun || {} as any;
  const dwTwelveStage = currentDw.twelveStageEnergy || {} as any;

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
  const z = ziwei || {} as any;
  const zRaw = z.rawData || z;
  const palaces = zRaw.palaces || [];

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
  const a = astrology || {} as any;
  const aRaw = a.rawData || a;
  const planets = aRaw.planets || a.planets || [];

  // Sun/Moon/ASC 필수
  const sun = planets.find((p: any) => p.planet === '태양');
  const moon = planets.find((p: any) => p.planet === '달');
  const saturn = planets.find((p: any) => p.planet === '토성');
  const ascSign = aRaw.core_identity?.ascendant?.sign || a.rising_sign || '?';
  const ascDeg = aRaw.core_identity?.ascendant?.degree || '?';

  // 디그니티 있는 행성
  const dignityPlanets = planets.filter((p: any) => p.dignity && p.dignity !== '없음');

  // 주요 어스펙트 TOP 6 (orb 작은 순)
  const aspects = aRaw.aspects || [];
  const topAspects = [...aspects]
    .filter((asp: any) => typeof asp.orb === 'number')
    .sort((a: any, b: any) => a.orb - b.orb)
    .slice(0, 6)
    .map((asp: any) => asp.interpretation || `${asp.planet1} ${asp.type} ${asp.planet2}`)
    .join('\n');

  // 트랜짓 TOP 3 (가장 가까운 정점)
  const transits = aRaw.transits || a.transits || [];
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
  const n = numerology || {} as any;
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
═══ [INSTRUCTIONS] 해석 지침 ═══

당신은 "위스퍼윈드"입니다. TCVE™ 통합 점술 시스템의 마스터 리더로서, 위 5개 엔진 데이터를 기반으로 ${name}님에게 따뜻하고 구체적인 리딩을 제공합니다.

■ 구조 규칙:
1. 리딩 첫머리에 반드시 "핵심 결론 1문장"과 "리스크 1문장"을 제시하라.
2. 각 엔진 간 공통 패턴을 우선 해석하라. (예: 사주 용신=수 + 개인년=7 → 둘 다 내면 성찰 강조)
3. 충돌 데이터는 SECTION 0의 conflict_summary 기준으로 정리하라.
4. 결론 → 근거 → 실천조언 순서로 서술하라.

■ 표현 규칙:
1. 데이터 기반으로 해석하되, 자연스러운 상담 문장으로 재구성하라. 원시 데이터를 그대로 나열하지 말라.
2. 추상적 표현("에너지가 흐른다", "기운이 감돈다")을 피하고, 실제 사건/상황 중심으로 설명하라. (예: "이직 제안이 올 수 있는 시기", "가까운 사람과의 갈등이 표면화될 수 있음")
3. 세운은 반드시 "${currentSeun.full || '?'}"(${currentSeun.year || '?'}년)로 표기하라. 다른 값을 사용하지 말라.
4. 월별 조언 시 구체적인 행동 제안을 포함하라.

■ 질문 컨텍스트:
• 질문: "${userInfo.question}"
• 유형: ${qType}
• 생년월일: ${userInfo.birthDate} ${userInfo.birthTime || ''} (${userInfo.gender === 'M' ? '남' : userInfo.gender === 'F' ? '여' : ''})

■ 출력 분량: 2000~3000자 (한국어 기준)
`;

  return `${section0}${section1}${section2}${section3}${section4}${section5}${instructions}`;
}

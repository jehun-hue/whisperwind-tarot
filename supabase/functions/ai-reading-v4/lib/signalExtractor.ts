/**
 * lib/signalExtractor.ts
 * 비정형 점술 데이터를 정형화된 Signal 객체로 변환하고 교차 검증하는 모듈
 */

// === 공통 신호 타입 ===
export interface Signal {
  source: 'saju' | 'ziwei' | 'astrology' | 'numerology' | 'tarot';
  type: 'warning' | 'opportunity' | 'neutral';
  category: 'career' | 'relationship' | 'wealth' | 'health' | 'general';
  severity: 1 | 2 | 3;  // 1=약함, 2=중간, 3=강함
  timing?: string;        // "2026-07", "2026-Q3" 등
  title: string;          // "관록궁 화기" 
  description: string;    // "직장에서 말로 인한 갈등 주의"
  rawData: any;           // 원본 데이터 참조
}

// === 교차 검증 결과 ===
export interface CrossSignal {
  category: string;
  type: 'warning' | 'opportunity';
  agreementCount: number;  // 몇 개 체계가 동의하는지
  sources: Signal[];
  confidence: 'high' | 'medium' | 'low';  // 3+이면 high
  actionAdvice: string;    // 행동 지침
}

// === 1. 사주 신호 추출 ===
export function extractSajuSignals(sajuResult: any): Signal[] {
  const signals: Signal[] = [];
  
  // (a) 오행 불균형 → 경고
  if (sajuResult?.fiveElements) {
    const elements = sajuResult.fiveElements;
    for (const [element, count] of Object.entries(elements)) {
      if ((count as number) === 0) {
        signals.push({
          source: 'saju', type: 'warning', category: 'general',
          severity: 2, title: `오행 결핍: ${element}`,
          description: `${element} 기운이 원국에 없어 해당 영역의 보완이 필요합니다`,
          rawData: { element, count }
        });
      }
      if ((count as number) >= 4) {
        signals.push({
          source: 'saju', type: 'warning', category: 'general',
          severity: 2, title: `오행 과다: ${element}`,
          description: `${element} 기운이 과도하여 균형 조절이 필요합니다`,
          rawData: { element, count }
        });
      }
    }
  }

  // (b) 신강/신약 판별 → 방향성
  if (sajuResult?.strength) {
    const strengthStr = String(sajuResult.strength);
    const isWeak = strengthStr.includes('신약');
    signals.push({
      source: 'saju', type: 'neutral', category: 'general',
      severity: 1, title: `일간 ${isWeak ? '신약' : '신강'}`,
      description: isWeak 
        ? '도움을 받아 협력하는 방식이 유리합니다'
        : '주도적으로 밀고 나가는 방식이 유리합니다',
      rawData: sajuResult.strength
    });
  }

  // (c) 대운 전환기 → 타이밍 신호
  if (sajuResult?.daewoon) {
    // 대운 정보는 객체 또는 문자열일 수 있음
    const daewoonDesc = typeof sajuResult.daewoon === 'string' 
      ? sajuResult.daewoon 
      : (sajuResult.daewoon.full || '대운 분석 중');

    signals.push({
      source: 'saju', type: 'warning', category: 'general',
      severity: 1, title: '대운 흐름',
      description: `현재 대운: ${daewoonDesc}`,
      rawData: sajuResult.daewoon
    });
  }

  return signals;
}

// === 2. 자미두수 신호 추출 ===
export function extractZiweiSignals(ziweiResult: any): Signal[] {
  const signals: Signal[] = [];

  // (a) 화기(化忌) → 가장 강력한 경고
  const transformations = ziweiResult?.natalTransformations 
    || ziweiResult?.natal_transformations || [];
  
  for (const t of transformations) {
    if (t.type === '화기' || t.type === '化忌') {
      const palaceCategory = mapPalaceToCategory(t.palace);
      signals.push({
        source: 'ziwei', type: 'warning', category: palaceCategory,
        severity: 3, title: `${t.star}화기 → ${t.palace}`,
        description: `${t.palace}에서 ${t.star}의 에너지가 막혀 있어 주의가 필요합니다`,
        rawData: t
      });
    }
    if (t.type === '화록' || t.type === '化祿') {
      const palaceCategory = mapPalaceToCategory(t.palace);
      signals.push({
        source: 'ziwei', type: 'opportunity', category: palaceCategory,
        severity: 2, title: `${t.star}화록 → ${t.palace}`,
        description: `${t.palace}에서 재물/기회의 흐름이 열려 있습니다`,
        rawData: t
      });
    }
  }

  // (b) 명궁 공궁 → 경고
  if (ziweiResult?.palaces) {
    const mingPalace = ziweiResult.palaces.find(
      (p: any) => p.name === '명궁'
    );
    if (mingPalace && (!mingPalace.main_stars || mingPalace.main_stars.length === 0)) {
      signals.push({
        source: 'ziwei', type: 'warning', category: 'general',
        severity: 2, title: '명궁 공궁',
        description: '명궁에 주성이 없어 대궁의 영향을 강하게 받습니다. 환경 변화에 민감한 구조입니다',
        rawData: mingPalace
      });
    }
  }

  return signals;
}

// 궁 이름 → 카테고리 매핑
function mapPalaceToCategory(palace: string): Signal['category'] {
  if (palace?.includes('관록')) return 'career';
  if (palace?.includes('부처') || palace?.includes('자녀')) return 'relationship';
  if (palace?.includes('재백') || palace?.includes('전택')) return 'wealth';
  if (palace?.includes('질액')) return 'health';
  return 'general';
}

// === 3. 점성술 신호 추출 ===
export function extractAstrologySignals(astroResult: any): Signal[] {
  const signals: Signal[] = [];

  // (a) 역행 행성 → 주의
  if (astroResult?.planets) {
    for (const planet of astroResult.planets) {
      if (planet.is_retrograde) {
        signals.push({
          source: 'astrology', type: 'warning', category: 'general',
          severity: 1, title: `${planet.planet || planet.name} 역행`,
          description: `${planet.planet || planet.name}이 역행 중이라 ${planet.planet === '수성' ? '소통/계약' : planet.planet === '금성' ? '관계/재정' : '해당 영역'}에서 재검토가 필요합니다`,
          rawData: planet
        });
      }
    }
  }

  // (b) 하드 어스펙트 → 긴장/경고
  if (astroResult?.aspects) {
    for (const aspect of astroResult.aspects) {
      if (aspect.isHarmonious === false) {
        signals.push({
          source: 'astrology', type: 'warning', category: 'general',
          severity: aspect.type?.includes('opposition') || aspect.type?.includes('충') ? 3 : 2,
          title: `${aspect.planet1}-${aspect.planet2} ${aspect.type}`,
          description: `${aspect.planet1}과 ${aspect.planet2} 사이에 긴장이 있어 내적 갈등이나 외부 마찰이 예상됩니다`,
          rawData: aspect
        });
      }
      if (aspect.isHarmonious === true) {
        signals.push({
          source: 'astrology', type: 'opportunity', category: 'general',
          severity: 1, title: `${aspect.planet1}-${aspect.planet2} ${aspect.type}`,
          description: `${aspect.planet1}과 ${aspect.planet2}의 조화로운 흐름이 있습니다`,
          rawData: aspect
        });
      }
    }
  }

  return signals;
}

// === 4. 수비학 신호 추출 ===
export function extractNumerologySignals(numResult: any): Signal[] {
  const signals: Signal[] = [];

  // 카르마 부채 → 강력 경고
  if (numResult?.has_karmic_debt && numResult?.karmic_debts?.length > 0) {
    for (const debt of numResult.karmic_debts) {
      signals.push({
        source: 'numerology', type: 'warning', category: 'general',
        severity: 3, title: `카르마 부채 ${debt}`,
        description: debt === 13 ? '변화와 재건의 과제가 있습니다' :
                     debt === 14 ? '절제와 균형의 과제가 있습니다' :
                     debt === 16 ? '자아의 재구축이 필요합니다' :
                     debt === 19 ? '독립과 자립의 과제가 있습니다' :
                     `카르마 부채 ${debt}의 영향이 있습니다`,
        rawData: { debt }
      });
    }
  }

  return signals;
}

// === 5. 타로 신호 추출 ===
export function extractTarotSignals(cards: any[], insights: any): Signal[] {
  const signals: Signal[] = [];

  for (const card of cards) {
    const isMajor = card.isMajor;
    const name = card.name;
    const isReversed = card.isReversed;
    
    // (a) 고위험 카드 감지
    if (name === 'The Tower' || name === 'The Devil' || name === 'Death') {
      signals.push({
        source: 'tarot', type: 'warning', category: 'general',
        severity: isReversed ? 2 : 3,
        title: `타로 경고: ${name}${isReversed ? '(역)' : '(정)'}`,
        description: name === 'The Tower' ? '급격한 변화나 충격에 대비가 필요합니다' :
                     name === 'The Devil' ? '집착이나 구속, 유혹을 경계해야 합니다' :
                     '종결과 새로운 시작을 위한 진통의 시기입니다',
        rawData: card
      });
    }

    // (b) 기회 카드 감지
    if (name === 'The Star' || name === 'The Sun' || name === 'The Empress' || name === 'The Magician') {
      signals.push({
        source: 'tarot', type: 'opportunity', category: 'general',
        severity: isReversed ? 1 : 2,
        title: `타로 기회: ${name}${isReversed ? '(역)' : '(정)'}`,
        description: name === 'The Star' ? '희망적인 비전과 치유의 에너지가 있습니다' :
                     name === 'The Sun' ? '성공과 활력, 명확한 결과가 예상됩니다' :
                     '풍요와 창조적 결실이 기대되는 흐름입니다',
        rawData: card
      });
    }

    // (c) 재물/직업 관련 수트 경고
    if (name.includes('Pentacles') && isReversed) {
      signals.push({
        source: 'tarot', type: 'warning', category: 'wealth',
        severity: 2, title: `재정 신호: ${name}(역)`,
        description: '금전적 손실이나 불안정한 재형 흐름에 주의가 필요합니다',
        rawData: card
      });
    }
    if (name.includes('Swords') && !isReversed) {
      signals.push({
        source: 'tarot', type: 'warning', category: 'general',
        severity: 2, title: `갈등 신호: ${name}`,
        description: '날카로운 결단이나 주변과의 마찰, 스트레스 주의가 필요합니다',
        rawData: card
      });
    }
  }

  // (d) 조합 분석 결과 활용 (insights)
  if (insights && insights.length > 0) {
    for (const insight of insights) {
      if (insight.type === 'warning' || insight.type === 'opportunity') {
        signals.push({
          source: 'tarot', type: insight.type, category: 'general',
          severity: 2, title: `조합 신호: ${insight.title || '패턴 감지'}`,
          description: insight.description || '카드 간 조합에 의한 특별한 의미가 있습니다',
          rawData: insight
        });
      }
    }
  }

  return signals;
}

// === 6. 교차 검증 함수 ===
export function crossValidateSignals(allSignals: Signal[]): CrossSignal[] {
  const crossSignals: CrossSignal[] = [];
  
  // 카테고리 + 타입별로 그룹핑
  const groups = new Map<string, Signal[]>();
  for (const sig of allSignals) {
    const key = `${sig.category}:${sig.type}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(sig);
  }

  for (const [key, signals] of groups) {
    const [category, type] = key.split(':');
    const uniqueSources = new Set(signals.map(s => s.source));
    
    if (uniqueSources.size >= 2) {  // 2개 이상 체계가 동의
      crossSignals.push({
        category,
        type: type as 'warning' | 'opportunity',
        agreementCount: uniqueSources.size,
        sources: signals,
        confidence: uniqueSources.size >= 3 ? 'high' : 'medium',
        actionAdvice: ''  // 프롬프트에서 AI가 생성
      });
    }
  }

  // 합의도 높은 순으로 정렬
  crossSignals.sort((a, b) => b.agreementCount - a.agreementCount);
  return crossSignals;
}

// === 메인 함수 ===
export function extractAllSignals(
  sajuResult: any,
  ziweiResult: any, 
  astroResult: any,
  numResult: any,
  tarotResult?: { cards: any[], insights: any }
): { signals: Signal[], crossSignals: CrossSignal[] } {
  const sajuSignals = extractSajuSignals(sajuResult);
  const ziweiSignals = extractZiweiSignals(ziweiResult);
  const astroSignals = extractAstrologySignals(astroResult);
  const numSignals = extractNumerologySignals(numResult);
  const tarotSignals = tarotResult 
    ? extractTarotSignals(tarotResult.cards, tarotResult.insights)
    : [];

  const allSignals = [
    ...sajuSignals, ...ziweiSignals, 
    ...astroSignals, ...numSignals,
    ...tarotSignals
  ];

  const crossSignals = crossValidateSignals(allSignals);

  return { signals: allSignals, crossSignals };
}

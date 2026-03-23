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

  if (sajuResult?.daewoon) {
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

  if (ziweiResult?.palaces) {
    const mingPalace = ziweiResult.palaces.find((p: any) => p.name === '명궁');
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

  if (astroResult?.planets) {
    for (const planet of astroResult.planets) {
      if (planet.is_retrograde) {
        signals.push({
          source: 'astrology', type: 'warning', category: 'general',
          severity: 1, title: `${planet.planet || planet.name} 역행`,
          description: `${planet.planet || planet.name}이 역행 중이라 소통/재정 등 해당 영역에서 재검토가 필요합니다`,
          rawData: planet
        });
      }
    }
  }

  if (astroResult?.aspects) {
    for (const aspect of astroResult.aspects) {
      if (aspect.isHarmonious === false) {
        signals.push({
          source: 'astrology', type: 'warning', category: 'general',
          severity: aspect.type?.includes('opposition') ? 3 : 2,
          title: `${aspect.planet1}-${aspect.planet2} ${aspect.type}`,
          description: `${aspect.planet1}과 ${aspect.planet2} 사이에 긴장이 있어 마찰이 예상됩니다`,
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
  if (numResult?.has_karmic_debt && numResult?.karmic_debts?.length > 0) {
    for (const debt of numResult.karmic_debts) {
      signals.push({
        source: 'numerology', type: 'warning', category: 'general',
        severity: 3, title: `카르마 부채 ${debt}`,
        description: `카르마 부채 ${debt}의 영향으로 해당 영역의 과제가 있습니다`,
        rawData: { debt }
      });
    }
  }
  return signals;
}

// === 5. 타로 신호 추출 ===
const OPPORTUNITY_CARDS: Record<string, { severity: 1 | 2 | 3; description: string }> = {
  'The Sun': { severity: 3, description: '성공과 활력의 강한 긍정 에너지' },
  'The World': { severity: 3, description: '완성과 성취의 최종 단계' },
  'Wheel of Fortune': { severity: 2, description: '운명적 전환점, 상승 기류' },
  'The Star': { severity: 2, description: '희망과 회복의 흐름' },
  'The Empress': { severity: 2, description: '풍요와 성장의 에너지' },
  'Strength': { severity: 2, description: '내면의 힘과 극복 능력' },
  'The Magician': { severity: 2, description: '실행력과 자원 활용 능력' },
  'The Chariot': { severity: 2, description: '의지력으로 돌파하는 추진력' },
  'The Lovers': { severity: 2, description: '조화로운 선택과 결합' },
  'Judgement': { severity: 2, description: '각성과 새로운 도약' },
  'Ace of Wands': { severity: 2, description: '새로운 시작의 강한 불꽃' },
  'Ace of Cups': { severity: 2, description: '감정적 충만과 새 관계' },
  'Ace of Pentacles': { severity: 2, description: '물질적 기회의 도래' },
  'Ten of Cups': { severity: 2, description: '정서적 완성과 행복' },
  'Ten of Pentacles': { severity: 2, description: '물질적 안정과 풍요' },
  'Six of Wands': { severity: 2, description: '승리와 인정' },
  'Two of Cups': { severity: 1, description: '파트너십과 조화' },
  'Eight of Pentacles': { severity: 1, description: '꾸준한 노력의 결실' },
  'Four of Wands': { severity: 1, description: '축하와 안정적 기반' },
};

const WARNING_CARDS: Record<string, { severity: 1 | 2 | 3; description: string }> = {
  'The Tower': { severity: 3, description: '갑작스러운 붕괴와 충격' },
  'Death': { severity: 2, description: '강제적 변환과 종결' },
  'The Devil': { severity: 2, description: '집착과 속박의 위험' },
  'Ten of Swords': { severity: 3, description: '극단적 결말과 고통' },
  'Three of Swords': { severity: 2, description: '감정적 상처와 배신' },
  'Five of Cups': { severity: 2, description: '상실감과 후회' },
  'Five of Pentacles': { severity: 2, description: '물질적 곤란과 고립' },
  'Eight of Swords': { severity: 2, description: '심리적 갇힘과 제약' },
  'Nine of Swords': { severity: 2, description: '불안과 공포' },
  'Seven of Swords': { severity: 1, description: '기만과 불투명한 상황' },
  'The Moon': { severity: 1, description: '혼란과 불확실성' },
  'Four of Cups': { severity: 1, description: '무기력과 기회 외면' },
};

export function extractTarotSignals(cards: any[], insights: any): Signal[] {
  const signals: Signal[] = [];

  for (const card of cards) {
    const name = card.name;
    const isReversed = card.position === 'reversed' || card.isReversed === true;
    
    // (a) 긍정(Opportunity) 판정
    // - 정방향 기회 카드
    // - 역방향 경고 카드 (위험 극복/점진적 개선)
    if (!isReversed && OPPORTUNITY_CARDS[name]) {
      const info = OPPORTUNITY_CARDS[name];
      signals.push({
        source: 'tarot', type: 'opportunity', category: 'general',
        severity: info.severity, title: `기회: ${name}`,
        description: info.description, rawData: card
      });
    } else if (isReversed && WARNING_CARDS[name]) {
      const info = WARNING_CARDS[name];
      signals.push({
        source: 'tarot', type: 'opportunity', category: 'general',
        severity: Math.max(1, info.severity - 1) as 1|2|3, 
        title: `기회: ${name}(역)`,
        description: '위기 극복의 가능성과 서서히 나아지는 흐름입니다', rawData: card
      });
    }

    // (b) 주의(Warning) 판정
    // - 정방향 경고 카드
    // - 역방향 기회 카드 (에너지 차단/지연/과용 주의)
    if (!isReversed && WARNING_CARDS[name]) {
      const info = WARNING_CARDS[name];
      signals.push({
        source: 'tarot', type: 'warning', category: 'general',
        severity: info.severity, title: `주의: ${name}`,
        description: info.description, rawData: card
      });
    } else if (isReversed && OPPORTUNITY_CARDS[name]) {
      const info = OPPORTUNITY_CARDS[name];
      signals.push({
        source: 'tarot', type: 'warning', category: 'general',
        severity: Math.max(1, info.severity - 1) as 1|2|3,
        title: `주의: ${name}(역)`,
        description: '긍정적인 에너지의 흐름이 다소 지연되거나 왜곡될 수 있습니다', rawData: card
      });
    }

    // (c) 특정 수트/조건 보완
    if (name.includes('Pentacles') && isReversed && !OPPORTUNITY_CARDS[name] && !WARNING_CARDS[name]) {
      signals.push({
        source: 'tarot', type: 'warning', category: 'wealth',
        severity: 2, title: `재정 신호: ${name}(역)`,
        description: '금전적 불안정이나 손실에 주의가 필요합니다', rawData: card
      });
    }
  }

  // (d) 조합 분석 인사이트
  if (insights && insights.length > 0) {
    for (const insight of insights) {
      if (insight.type === 'warning' || insight.type === 'opportunity') {
        signals.push({
          source: 'tarot', type: insight.type, category: 'general',
          severity: 2, title: `조합 신호: ${insight.title || '패턴'}`,
          description: insight.description || '카드 조합상의 의미가 감지되었습니다', rawData: insight
        });
      }
    }
  }

  return signals;
}


// === 6. 교차 검증 함수 ===
export function crossValidateSignals(allSignals: Signal[]): CrossSignal[] {
  const crossSignals: CrossSignal[] = [];
  const groups = new Map<string, Signal[]>();
  for (const sig of allSignals) {
    const key = `${sig.category}:${sig.type}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(sig);
  }

  for (const [key, signals] of groups) {
    const [category, type] = key.split(':');
    const uniqueSources = new Set(signals.map(s => s.source));
    if (uniqueSources.size >= 2) {
      crossSignals.push({
        category,
        type: type as 'warning' | 'opportunity',
        agreementCount: uniqueSources.size,
        sources: signals,
        confidence: uniqueSources.size >= 3 ? 'high' : 'medium',
        actionAdvice: ''
      });
    }
  }

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
  const tarotSignals = tarotResult ? extractTarotSignals(tarotResult.cards, tarotResult.insights) : [];

  const allSignals = [...sajuSignals, ...ziweiSignals, ...astroSignals, ...numSignals, ...tarotSignals];
  const crossSignals = crossValidateSignals(allSignals);

  return { signals: allSignals, crossSignals };
}

// === 타로 극성 맵 (Polarity Map) ===
const TAROT_POLARITY_MAP: Record<string, number> = {
  'The Sun': 1, 'The Star': 0.8, 'The World': 0.9, 'The Empress': 0.7,
  'Ace of Cups': 0.7, 'Ten of Cups': 0.8, 'Six of Wands': 0.7,
  'The Tower': -0.9, 'Death': -0.5, 'The Devil': -0.7,
  'Ten of Swords': -0.8, 'Three of Swords': -0.6, 'Five of Cups': -0.5,
  'The Moon': -0.3, 'The Hermit': 0, 'The Hanged Man': -0.2,
  'Wheel of Fortune': 0.3, 'The Chariot': 0.6, 'Strength': 0.5,
  'The Fool': 0.3, 'The Magician': 0.5, 'The High Priestess': 0.1,
  'Justice': 0.1, 'Temperance': 0.3, 'Judgement': 0.4,
  'The Lovers': 0.5, 'The Emperor': 0.4,
  'Two of Cups': 0.6, 'Four of Cups': -0.3, 'Eight of Cups': -0.4,
  'Six of Swords': 0.2, 'Eight of Pentacles': 0.4, 'Four of Pentacles': -0.2,
  'Ace of Wands': 0.6, 'Ten of Pentacles': 0.7
};

export function calculateTarotPolarity(cards: any[]): number {
  if (!cards || cards.length === 0) return 0;
  const sum = cards.reduce((acc, card) => {
    let base = TAROT_POLARITY_MAP[card.name] ?? 0;
    if (card.position === 'reversed' || card.isReversed === true) base *= -0.6; 
    return acc + base;
  }, 0);
  return Math.max(-1, Math.min(1, sum / cards.length)); 
}

// === 의사결정 프레임워크 (Dispatcher v11) ===
export function computeDecision(
  consensusScore: number,
  crossSignals: CrossSignal[],
  allSignals: Signal[],
  isTransitioning: boolean,
  tarotPolarity?: number
): { decision: 'PROCEED' | 'WAIT' | 'CONDITIONAL'; confidence: number; reason: string } {
  
  const polarity = tarotPolarity ?? 0;

  if (isTransitioning) {
    return {
      decision: 'CONDITIONAL',
      confidence: Math.round(consensusScore * 100),
      reason: '대운 교체기로 큰 변화의 흐름 속에 있어 신중한 접근이 필요합니다'
    };
  }

  // severity 가중 집계: severity 1=0.3, 2=0.7, 3=1.0
  const severityWeight = (s: Signal) => s.severity === 3 ? 1.0 : s.severity === 2 ? 0.7 : 0.15;

  const allWarningScore = allSignals
    .filter(s => s.type === 'warning')
    .reduce((sum, s) => sum + severityWeight(s), 0);

  const allOpportunityScore = allSignals
    .filter(s => s.type === 'opportunity')
    .reduce((sum, s) => sum + severityWeight(s), 0);

  const crossWarnings = crossSignals.filter(s => s.type === 'warning').length;
  const crossOpportunities = crossSignals.filter(s => s.type === 'opportunity').length;
  const highConfWarnings = crossSignals.filter(s => s.type === 'warning' && s.confidence === 'high').length;

  const weightedOpportunity = allOpportunityScore + (crossOpportunities * 2);
  const weightedWarning = allWarningScore + (crossWarnings * 2);

  const signalDelta = (weightedOpportunity - weightedWarning) * 5;
  const compositeScore = (consensusScore * 50) + (polarity * 25) + signalDelta;

  if (compositeScore >= 60 && weightedOpportunity >= (weightedWarning * 1.1) && highConfWarnings === 0) {
    return {
      decision: 'PROCEED',
      confidence: Math.min(Math.round(compositeScore), 95),
      reason: `${allOpportunityScore.toFixed(1)}점 규모의 긍정 신호와 합의도가 확인됩니다`
    };
  }

  if (compositeScore < 35 || highConfWarnings >= 2) {
    return {
      decision: 'WAIT',
      confidence: Math.min(Math.round(100 - (compositeScore || 0)), 90),
      reason: `${allWarningScore.toFixed(1)}점 주의 신호가 감지되어 시기 조정이 권장됩니다`
    };
  }

  return {
    decision: 'CONDITIONAL',
    confidence: Math.round(compositeScore),
    reason: `긍정 ${allOpportunityScore.toFixed(1)}점과 주의 ${allWarningScore.toFixed(1)}점이 혼재하여 조건부 접근이 적절합니다`
  };
}

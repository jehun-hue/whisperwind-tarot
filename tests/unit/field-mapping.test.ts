import { describe, it, expect } from 'vitest';
import { runCrossValidation } from '../../supabase/functions/ai-reading-v4/lib/crossValidationEngine.ts';

/**
 * Unit Test: Cross-Validation Field Mapping Resilience
 * 
 * This test ensures that the cross-validation engine correctly handles 
 * different Saju result formats from various calculation engines.
 */

describe('Cross-Validation Field Mapping', () => {

  const ziweiSample = {
    palaces: [
      { name: "재백궁", stars: [{ star: "무곡", brightness: "묘" }], transformations: [{ type: "화록", star: "무곡" }] }
    ]
  };

  it('Format A: Object-based tenGods', () => {
    const sajuSample = {
      dayMaster: '무',
      tenGods: { '편재': 2, '정재': 1, '정관': 1 },
      elements: { '토': 3, '수': 2 },
      yongShin: '수',
      twelve_stages: { seun: { level: 80 } }
    };

    const result = runCrossValidation(ziweiSample, sajuSample);
    const wealth = result.items.find(i => i.domain === '재물의운' || i.domain === '재물');
    
    expect(wealth).toBeDefined();
    // 십성 3개(편재2, 정재1) + 용신(수) + 지미 화록/주성 등 종합 판단
    expect(wealth?.sajuSignal).toBe('길');
    expect(wealth?.sajuEvidence.some(e => e.includes('편재 2개'))).toBe(true);
  });

  it('Format B: Array-based tenGods (Classic Engine)', () => {
    const sajuSample = {
      dayMaster: '경',
      tenGods: [
        { pillar: 'year', tenGod: '편재' },
        { pillar: 'month', tenGod: '정재' },
        { pillar: 'hour', tenGod: '정재' }
      ],
      elements: { '금': 2, '목': 3 },
      yongShin: '목',
      twelve_stages: { sewun: { level: 90 } }
    };

    const result = runCrossValidation(ziweiSample, sajuSample);
    const wealth = result.items.find(i => i.domain === '재물');
    
    expect(wealth).toBeDefined();
    expect(wealth?.sajuSignal).toBe('길');
    expect(wealth?.sajuEvidence.some(e => e.includes('편재 1개'))).toBe(true);
    expect(wealth?.sajuEvidence.some(e => e.includes('정재 2개'))).toBe(true);
  });

  it('Defensive behavior with missing fields', () => {
    const sajuSample = { 
        dayMaster: '갑'
        // tenGods, elements 등 필수 필드 누락
    };
    
    // 에러 없이 실행되어야 함
    const result = runCrossValidation(ziweiSample, sajuSample);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.overallAgreement).toBeDefined();
  });

  it('Resilience against key variations (yongShin vs yongsin)', () => {
    const sajuSample = {
      dayMaster: '무',
      yongsin: '수', // yongShin 대신 yongsin 사용
      elements: { '수': 3 },
      tenGods: { '편재': 2 }
    };

    const result = runCrossValidation(ziweiSample, sajuSample);
    const wealth = result.items.find(i => i.domain === '재물');
    expect(wealth?.sajuEvidence.some(e => e.includes('용신이 수'))).toBe(true);
  });
});

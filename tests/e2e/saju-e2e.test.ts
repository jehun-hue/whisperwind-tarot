import { describe, it, expect } from 'vitest';

/**
 * 사주 엔진 E2E 테스트
 * 이 테스트는 로컬 개발 환경 또는 배포된 서버를 대상으로 실제 API 호출을 수행합니다.
 */

const ENDPOINT = process.env.VITE_SUPABASE_URL 
  ? `${process.env.VITE_SUPABASE_URL}/functions/v1/ai-reading-v4`
  : 'https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4';

const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

interface TestCase {
  name: string;
  input: {
    year: number; month: number; day: number;
    hour: number; minute?: number;
    gender: 'M' | 'F' | 'male' | 'female';
    longitude?: number;
    isLunar?: boolean;
    hasTime?: boolean;
  };
  expected: {
    yearPillar: [string, string];
    monthPillar: [string, string];
    dayPillar: [string, string];
    hourPillar: [string, string];
    dayMaster: string;
    strength: '신강' | '중화' | '신약';
  };
}

const TEST_CASES: TestCase[] = [
  {
    name: 'Case 1: 1990-05-15 14:30 M (양력, 서울)',
    input: { year: 1990, month: 5, day: 15, hour: 14, minute: 30, gender: 'M' },
    expected: {
      yearPillar: ['경', '오'],
      monthPillar: ['신', '사'],
      dayPillar: ['무', '오'],
      hourPillar: ['기', '미'],
      dayMaster: '무',
      strength: '신강',
    },
  },
  {
    name: 'Case 2: 1985-01-20 03:00 F (양력, 입춘 전 → 갑자년)',
    input: { year: 1985, month: 1, day: 20, hour: 3, gender: 'F' },
    expected: {
      yearPillar: ['갑', '자'],
      monthPillar: ['정', '축'],
      dayPillar: ['경', '자'],
      hourPillar: ['병', '인'],
      dayMaster: '경',
      strength: '신약',
    },
  },
  {
    name: 'Case 3: 야자시 테스트 (1992-08-10 23:30 M)',
    input: { year: 1992, month: 8, day: 10, hour: 23, minute: 30, gender: 'M' },
    expected: {
      yearPillar: ['임', '신'],
      monthPillar: ['무', '신'],
      dayPillar: ['기', '유'],
      hourPillar: ['갑', '자'],
      dayMaster: '기',
      strength: '신약',
    },
  },
  {
    name: 'Case 5: 음력 입력 (음)1988-04-15 06:00 F → (양)1988-05-30',
    input: { year: 1988, month: 4, day: 15, hour: 6, gender: 'F', isLunar: true },
    expected: {
      yearPillar: ['무', '진'],
      monthPillar: ['정', '사'],
      dayPillar: ['경', '진'],
      hourPillar: ['기', '묘'],
      dayMaster: '경',
      strength: '중화',
    },
  },
  {
    name: 'Case 6: 절기 경계 2000-02-04 08:00 M (입춘 당일 08시)',
    input: { year: 2000, month: 2, day: 4, hour: 8, gender: 'M' },
    expected: {
      yearPillar: ['기', '묘'],
      monthPillar: ['정', '축'],
      dayPillar: ['갑', '오'],
      hourPillar: ['무', '진'],
      dayMaster: '갑',
      strength: '신약',
    },
  },
];

describe('사주 엔진 E2E 테스트 (v9.2)', () => {
  if (!ANON_KEY) {
    it.skip('SUPABASE_ANON_KEY가 없어 테스트를 건너뜁니다.', () => {});
    return;
  }

  for (const tc of TEST_CASES) {
    it(tc.name, async () => {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ mode: 'saju-only', ...tc.input }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.status).toBe('ok');

      const saju = data.sajuResult;
      expect(saju).toBeDefined();

      // 4주(pillars) 검증
      expect(saju.pillars[0]).toEqual(tc.expected.yearPillar);
      expect(saju.pillars[1]).toEqual(tc.expected.monthPillar);
      expect(saju.pillars[2]).toEqual(tc.expected.dayPillar);
      expect(saju.pillars[3]).toEqual(tc.expected.hourPillar);

      // 일간 및 신강약 검증
      expect(saju.dayMaster).toBe(tc.expected.dayMaster);
      expect(saju.strength).toBe(tc.expected.strength);
    }, 20000);
  }
});

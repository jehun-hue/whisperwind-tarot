/**
 * jami.ts
 * 자미두수(紫微斗數) 대한(大限) 및 소한(小限) 계산 엔진
 */

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

interface DahanPeriod {
  palace: string;
  startAge: number;
  endAge: number;
}

export interface DahanResult {
  currentPalace: string;
  startAge: number;
  endAge: number;
  direction: '순행' | '역행';
  allPeriods: DahanPeriod[];
}

export interface SohanResult {
  currentPalace: string;
  age: number;
  direction: '순행' | '역행';
}

/**
 * 대한(大限) 계산
 * @param mingPalace - 명궁 위치 (子~亥)
 * @param fiveElement - 오행국 (수이국, 목삼국, 금사국, 토오국, 화육국)
 * @param gender 
 * @param yearStem - 연도 천간 (음양 판단)
 * @param currentAge - 현재 나이 (세는 나이 기준)
 */
export function calculateDahan(
  mingPalace: string,
  fiveElement: string,
  gender: 'male' | 'female',
  yearStem: string,
  currentAge: number
): DahanResult {
  // 1. 오행국별 시작 나이 결정
  const juMap: Record<string, number> = {
    "수이국": 2, "목삼국": 3, "금사국": 4, "토오국": 5, "화육국": 6
  };
  const startAgeBase = juMap[fiveElement] || 2;

  // 2. 순행/역행 판단 (양남음녀 순, 음남양녀 역)
  const isYang = "甲丙戊庚壬".includes(yearStem);
  const isForward = (isYang && gender === 'male') || (!isYang && gender === 'female');
  const direction = isForward ? '순행' : '역행';

  const startIdx = BRANCHES.indexOf(mingPalace);
  const allPeriods: DahanPeriod[] = [];
  let currentPeriod: DahanPeriod | null = null;

  for (let i = 0; i < 12; i++) {
    const offset = isForward ? i : -i;
    const palaceIdx = (startIdx + offset + 12) % 12;
    const sAge = startAgeBase + (i * 10);
    const eAge = sAge + 9;
    
    const period = {
      palace: BRANCHES[palaceIdx],
      startAge: sAge,
      endAge: eAge
    };
    allPeriods.push(period);
    
    if (currentAge >= sAge && currentAge <= eAge) {
      currentPeriod = period;
    }
  }

  return {
    currentPalace: currentPeriod?.palace || BRANCHES[startIdx],
    startAge: currentPeriod?.startAge || startAgeBase,
    endAge: currentPeriod?.endAge || (startAgeBase + 9),
    direction,
    allPeriods
  };
}

/**
 * 소한(小限) 계산
 * @param mingPalace - (참고용, 실제 시작은 연지 기준)
 * @param gender 
 * @param yearBranch - 출생 연지 (子~亥)
 * @param currentAge - 현재 나이
 */
export function calculateSohan(
  mingPalace: string,
  gender: 'male' | 'female',
  yearBranch: string,
  currentAge: number
): SohanResult {
  // 자미두수 소한은 남자 순행, 여자 역행
  const isForward = (gender === 'male');
  const direction = isForward ? '순행' : '역행';
  
  // 연지에 해당하는 궁에서 시작 (1세)
  const startIdx = BRANCHES.indexOf(yearBranch);
  const offset = isForward ? (currentAge - 1) : -(currentAge - 1);
  const currentPalaceIdx = (startIdx + offset + 24) % 12;

  return {
    currentPalace: BRANCHES[currentPalaceIdx],
    age: currentAge,
    direction
  };
}

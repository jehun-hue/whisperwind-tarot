/**
 * numerologyEngine.ts
 * - Comprehensive Numerology Engine
 * - Life Path, Expression, Soul Urge, Personality, Birthday, Maturity
 * - Personal Year, Month, Day
 * - Pinnacles & Challenges
 */

export interface NumerologyResult {
  life_path_number: number;
  destiny_number: number | null; // Hangul fallback
  expressionNumber: number | null; // English
  soulUrgeNumber: number | null;
  personalityNumber: number | null;
  birthdayNumber: number;
  maturityNumber: number | null;
  personal_year: number;
  personalMonth: number;
  personalDay: number;
  pinnacles: any[];
  challenges: any[];
  is_master_number: boolean;
  master_number_type: string | null;
  compound_number: number;
  numberMeanings: any;
  vibrations: string[];
}

const PYTHAGOREAN_MAP: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9
};

const VOWELS = ['A', 'E', 'I', 'O', 'U'];

const NUMBER_MEANINGS: Record<number, any> = {
  1: { keyword: "리더십", description: "독립, 개척, 자기 주도", energy: "시작" },
  2: { keyword: "협력", description: "조화, 인내, 파트너십", energy: "수용" },
  3: { keyword: "창조", description: "표현, 소통, 낙관", energy: "확장" },
  4: { keyword: "안정", description: "구조, 근면, 실용", energy: "기반" },
  5: { keyword: "변화", description: "자유, 모험, 다양성", energy: "유동" },
  6: { keyword: "책임", description: "가정, 헌신, 봉사", energy: "조화" },
  7: { keyword: "탐구", description: "분석, 영성, 내면", energy: "성찰" },
  8: { keyword: "성취", description: "권력, 물질, 경영", energy: "수확" },
  9: { keyword: "완성", description: "인도주의, 지혜, 해방", energy: "마무리" },
  11: { keyword: "영감", description: "직관, 영적 각성, 카리스마", energy: "조명", master: true },
  22: { keyword: "건축가", description: "대규모 실현, 비전, 글로벌", energy: "구현", master: true },
  33: { keyword: "치유자", description: "무조건적 사랑, 희생, 교육", energy: "봉사", master: true }
};

function reduceToSingle(n: number): number {
  // B-43R: 마스터 넘버(11, 22, 33) 예외 처리
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = n.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
  }
  return n;
}

function calculateDestinyNumber(name: string): number | null {
  if (!name || name.trim() === "" || name === "이름없음") return null;
  const STROKE_MAP: Record<string, number> = {
    'ㄱ': 1, 'ㄲ': 2, 'ㄴ': 1, 'ㄷ': 2, 'ㄸ': 4, 'ㄹ': 3, 'ㅁ': 3, 'ㅂ': 4, 'ㅃ': 8, 'ㅅ': 2, 'ㅆ': 4, 'ㅇ': 1, 'ㅈ': 3, 'ㅉ': 6, 'ㅊ': 4, 'ㅋ': 2, 'ㅌ': 3, 'ㅍ': 4, 'ㅎ': 3,
    'ㄳ': 3, 'ㄵ': 4, 'ㄶ': 4, 'ㄺ': 4, 'ㄻ': 6, 'ㄼ': 7, 'ㄽ': 5, 'ㄾ': 5, 'ㄿ': 5, 'ㅀ': 6, 'ㅄ': 6
  };
  const CHOSEONG_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const JONGSEONG_LIST = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  let totalStrokes = 0;
  let hasHangul = false;
  for (const char of name) {
    const code = char.charCodeAt(0) - 0xAC00;
    if (code >= 0 && code <= 11171) {
      hasHangul = true;
      const choseongIndex = Math.floor(code / (21 * 28));
      const jongseongIndex = code % 28;
      totalStrokes += STROKE_MAP[CHOSEONG_LIST[choseongIndex]] || 0;
      if (jongseongIndex > 0) totalStrokes += STROKE_MAP[JONGSEONG_LIST[jongseongIndex]] || 0;
    }
  }
  if (!hasHangul) return null;
  return reduceToSingle(totalStrokes);
}

export function calculateNumerology(
  birthDate: string, 
  currentYear: number = new Date().getFullYear(),
  name?: string
): NumerologyResult {
  const dateParts = birthDate.split("-");
  const yearStr = dateParts[0];
  const monthStr = dateParts[1];
  const dayStr = dateParts[2];
  
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const day = parseInt(dayStr);

  const sumDigits = (str: string): number => {
    return str.split("").reduce((acc, digit) => acc + (parseInt(digit) || 0), 0);
  };

  const rMonth = reduceToSingle(month);
  const rDay = reduceToSingle(day);
  const rYear = reduceToSingle(sumDigits(yearStr));

  // 1. Life Path: Reduced Month + Reduced Day + Reduced Year
  const lifePath = reduceToSingle(rMonth + rDay + rYear);
  const lpSum = rMonth + rDay + rYear;

  // 2. Name based numbers (English)
  let expression: number | null = null;
  let soulUrge: number | null = null;
  let personality: number | null = null;

  if (name) {
    const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '');
    if (cleanName.length > 0) {
      let eSum = 0, sSum = 0, pSum = 0;
      for (const char of cleanName) {
        const val = PYTHAGOREAN_MAP[char] || 0;
        eSum += val;
        if (VOWELS.includes(char)) sSum += val;
        else pSum += val;
      }
      expression = reduceToSingle(eSum);
      soulUrge = reduceToSingle(sSum);
      personality = reduceToSingle(pSum);
    }
  }

  // 3. Birthday Number
  const birthdayNumber = reduceToSingle(day);

  // 4. Maturity Number
  const maturityNumber = expression ? reduceToSingle(lifePath + expression) : null;

  // 5. Personal Year, Month, Day (based on current date)
  const now = new Date();
  const personalYear = reduceToSingle(sumDigits(monthStr) + sumDigits(dayStr) + sumDigits(currentYear.toString()));
  const personalMonth = reduceToSingle(personalYear + (now.getMonth() + 1));
  const personalDay = reduceToSingle(personalMonth + now.getDate());

  // 6. Destiny (Hangul fallback)
  const destiny = calculateDestinyNumber(name || "");

  // 7. Pinnacles & Challenges

  const p1 = reduceToSingle(rMonth + rDay);
  const p2 = reduceToSingle(rDay + rYear);
  const p3 = reduceToSingle(p1 + p2);
  const p4 = reduceToSingle(rMonth + rYear);

  const c1 = reduceToSingle(Math.abs(rMonth - rDay));
  const c2 = reduceToSingle(Math.abs(rDay - rYear));
  const c3 = reduceToSingle(Math.abs(c1 - c2));
  const c4 = reduceToSingle(Math.abs(rMonth - rYear));

  const endAge1 = 36 - lifePath;
  const pinnacles = [
    { period: `출생 ~ ${endAge1}세`, number: p1, meaning: (NUMBER_MEANINGS[p1]?.energy || "변화") + "의 시기" },
    { period: `${endAge1 + 1} ~ ${endAge1 + 9}세`, number: p2, meaning: (NUMBER_MEANINGS[p2]?.energy || "변화") + "의 시기" },
    { period: `${endAge1 + 10} ~ ${endAge1 + 18}세`, number: p3, meaning: (NUMBER_MEANINGS[p3]?.energy || "변화") + "의 시기" },
    { period: `${endAge1 + 19}세 ~ 종료`, number: p4, meaning: (NUMBER_MEANINGS[p4]?.energy || "마무리") + "의 시기" }
  ];
  const challenges = [
    { period: `출생 ~ ${endAge1}세`, number: c1, meaning: "도전 과제: " + (NUMBER_MEANINGS[c1]?.keyword || "환경") },
    { period: `${endAge1 + 1} ~ ${endAge1 + 9}세`, number: c2, meaning: "도전 과제: " + (NUMBER_MEANINGS[c2]?.keyword || "환경") },
    { period: `${endAge1 + 10} ~ ${endAge1 + 18}세`, number: c3, meaning: "도전 과제: " + (NUMBER_MEANINGS[c3]?.keyword || "환경") },
    { period: `${endAge1 + 19}세 ~ 종료`, number: c4, meaning: "도전 과제: " + (NUMBER_MEANINGS[c4]?.keyword || "환경") }
  ];

  // 8. Synthesis & Vibrations
  const numberMeanings: any = {
    lifePath: { number: lifePath, ...NUMBER_MEANINGS[lifePath] },
    personalYear: { number: personalYear, ...NUMBER_MEANINGS[personalYear] }
  };
  if (expression) numberMeanings.expression = { number: expression, ...NUMBER_MEANINGS[expression] };
  if (soulUrge) numberMeanings.soulUrge = { number: soulUrge, ...NUMBER_MEANINGS[soulUrge] };
  if (personality) numberMeanings.personality = { number: personality, ...NUMBER_MEANINGS[personality] };

  const vibrations: string[] = [];
  vibrations.push(`생명수 ${lifePath}(${NUMBER_MEANINGS[lifePath]?.keyword}): ${NUMBER_MEANINGS[lifePath]?.description}`);
  vibrations.push(`개인년 ${personalYear}(${NUMBER_MEANINGS[personalYear]?.keyword}): ${NUMBER_MEANINGS[personalYear]?.energy} 에너지가 강한 해`);
  if (expression) vibrations.push(`표현수 ${expression}: 대외적인 이미지와 삶의 목적`);

  const masterNumbers = [11, 22, 33];
  const isMasterNumber = masterNumbers.includes(lifePath) || masterNumbers.includes(personalYear) || (expression !== null && masterNumbers.includes(expression!));
  
  let masterNumberType = null;
  if (masterNumbers.includes(lifePath)) masterNumberType = `생명수 ${lifePath}`;
  else if (expression && masterNumbers.includes(expression)) masterNumberType = `표현수 ${expression}`;
  else if (masterNumbers.includes(personalYear)) masterNumberType = `개인년 ${personalYear}`;

  return {
    life_path_number: lifePath,
    destiny_number: destiny,
    expressionNumber: expression,
    soulUrgeNumber: soulUrge,
    personalityNumber: personality,
    birthdayNumber,
    maturityNumber,
    personal_year: personalYear,
    personalMonth,
    personalDay,
    pinnacles,
    challenges,
    is_master_number: isMasterNumber,
    master_number_type: masterNumberType,
    compound_number: lpSum,
    numberMeanings,
    vibrations
  };
}

export interface PinnacleResult {
  pinnacles: { number: number; startAge: number; endAge: number | null }[];
  challenges: { number: number; startAge: number; endAge: number | null }[];
}

/**
 * A22: Pinnacle & Challenge 계산
 */
export function calculatePinnacles(birthDate: Date): PinnacleResult {
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();
  const year = birthDate.getFullYear();
  
  const sumDigitsValue = (n: number | string): number => {
    return n.toString().split("").reduce((acc, digit) => acc + (parseInt(digit) || 0), 0);
  };

  const rMonth = reduceToSingle(month);
  const rDay = reduceToSingle(day);
  const rYear = reduceToSingle(sumDigitsValue(year));
  const lifePath = reduceToSingle(rMonth + rDay + rYear);

  const p1 = reduceToSingle(rMonth + rDay);
  const p2 = reduceToSingle(rDay + rYear);
  const p3 = reduceToSingle(p1 + p2);
  const p4 = reduceToSingle(rMonth + rYear);

  const c1 = reduceToSingle(Math.abs(rMonth - rDay));
  const c2 = reduceToSingle(Math.abs(rDay - rYear));
  const c3 = reduceToSingle(Math.abs(c1 - c2));
  const c4 = reduceToSingle(Math.abs(rMonth - rYear));

  const p1End = 36 - (lifePath > 9 ? reduceToSingle(lifePath) : lifePath);

  return {
    pinnacles: [
      { number: p1, startAge: 0, endAge: p1End },
      { number: p2, startAge: p1End + 1, endAge: p1End + 9 },
      { number: p3, startAge: p1End + 10, endAge: p1End + 18 },
      { number: p4, startAge: p1End + 19, endAge: null }
    ],
    challenges: [
      { number: c1, startAge: 0, endAge: p1End },
      { number: c2, startAge: p1End + 1, endAge: p1End + 9 },
      { number: c3, startAge: p1End + 10, endAge: p1End + 18 },
      { number: c4, startAge: p1End + 19, endAge: null }
    ]
  };
}

/**
 * A23: Personal Month & Personal Day
 */
export function calculatePersonalMonth(
  birthDate: Date,
  targetYear: number,
  targetMonth: number
): number {
  const bMonth = birthDate.getMonth() + 1;
  const bDay = birthDate.getDate();
  const sumDigitsValue = (n: number | string): number => {
    return n.toString().split("").reduce((acc, digit) => acc + (parseInt(digit) || 0), 0);
  };
  
  const py = reduceToSingle(sumDigitsValue(targetYear) + bMonth + bDay);
  return reduceToSingle(py + targetMonth);
}

export function calculatePersonalDay(
  birthDate: Date,
  targetDate: Date
): number {
  const pm = calculatePersonalMonth(birthDate, targetDate.getFullYear(), targetDate.getMonth() + 1);
  return reduceToSingle(pm + targetDate.getDate());
}

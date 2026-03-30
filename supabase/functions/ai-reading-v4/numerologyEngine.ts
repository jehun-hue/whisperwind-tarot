/**
 * numerologyEngine.ts
 * - Comprehensive Numerology Engine
 * - Life Path, Expression, Soul Urge, Personality, Birthday, Maturity
 * - Personal Year, Month, Day
 * - Pinnacles & Challenges
 * 
 * 🔧 FIX: fix/numerology-engine 브랜치 수정사항
 * - Pinnacle 1 종료 나이 Master Number 보정 (최소 27세 보장)
 * - 한글 이름 전용 시 Expression/SoulUrge/Personality 한글 획수 기반 폴백
 * - Karmic Debt 상세 정보 반환 강화
 * - Master Number 상세 정보 반환 강화
 */

export interface NumerologyResult {
  life_path_number: number;
  destiny_number: number | null;
  expressionNumber: number | null;
  expression_number?: number | null; // Alias
  soulUrgeNumber: number | null;
  soul_urge_number?: number | null;  // Alias
  personalityNumber: number | null;
  personality_number?: number | null; // Alias
  lifePath?: number;                 // Alias
  personal_year_number?: number;     // Alias
  birthdayNumber: number;
  maturityNumber: number | null;
  personal_year: number;
  personalMonth: number;
  personalDay: number;
  pinnacles: any[];
  challenges: any[];
  is_master_number: boolean;
  master_number_type: string | null;
  master_numbers: number[];           // 🔧 FIX #6: 보유 마스터넘버 배열
  compound_number: number;
  numberMeanings: any;
  vibrations: string[];
  karmic_debts: number[];
  has_karmic_debt: boolean;
  karmic_debt_details: string[];      // 🔧 FIX #5: 카르마 부채 상세 설명
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

// 🔧 FIX #5: Karmic Debt 상세 설명 매핑
const KARMIC_DEBT_DETAILS: Record<number, string> = {
  13: "게으름과 무책임에 대한 카르마 — 근면과 집중력으로 극복해야 합니다",
  14: "자유의 남용에 대한 카르마 — 절제와 균형이 필요합니다",
  16: "자아의 오만함에 대한 카르마 — 겸손을 배우는 것이 과제입니다",
  19: "이기심에 대한 카르마 — 타인을 위한 봉사와 나눔이 성장의 열쇠입니다"
};

function reduceToSingle(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = n.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
  }
  return n;
}

const KARMIC_DEBT_NUMBERS = [13, 14, 16, 19];

export function detectKarmicDebt(...rawSums: number[]): number[] {
  const debts: number[] = [];
  for (const n of rawSums) {
    if (KARMIC_DEBT_NUMBERS.includes(n) && !debts.includes(n)) {
      debts.push(n);
    }
  }
  return debts;
}

const CONSONANT_STROKE: Record<string, number> = {
  'ㄱ':1,'ㄲ':2,'ㄴ':1,'ㄷ':2,'ㄸ':4,'ㄹ':3,
  'ㅁ':3,'ㅂ':4,'ㅃ':8,'ㅅ':2,'ㅆ':4,'ㅇ':2,
  'ㅈ':3,'ㅉ':6,'ㅊ':4,'ㅋ':2,'ㅌ':3,'ㅍ':4,'ㅎ':4
};

const VOWEL_STROKE: Record<string, number> = {
  'ㅏ':2,'ㅐ':3,'ㅑ':3,'ㅒ':4,'ㅓ':2,'ㅔ':3,
  'ㅕ':3,'ㅖ':4,'ㅗ':2,'ㅘ':4,'ㅙ':5,'ㅚ':3,
  'ㅛ':3,'ㅜ':2,'ㅝ':4,'ㅞ':5,'ㅟ':3,'ㅠ':3,
  'ㅡ':1,'ㅢ':2,'ㅣ':1
};

const COMPLEX_JONG_STROKE: Record<string, number> = {
  'ㄳ':3,'ㄵ':4,'ㄶ':5,'ㄺ':4,'ㄻ':6,
  'ㄼ':7,'ㄽ':5,'ㄾ':4,'ㄿ':7,'ㅀ':7,
  'ㅄ':6
};

// 🔧 FIX #4: 한글 이름 초·중·종성 분리 함수 (Expression/SoulUrge/Personality 폴백용)
function decomposeHangul(name: string): { choStrokes: number; jungStrokes: number; jongStrokes: number; totalStrokes: number } | null {
  let choStrokes = 0;
  let jungStrokes = 0;
  let jongStrokes = 0;
  let hasHangul = false;

  const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

  for (const char of name) {
    const code = char.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      hasHangul = true;
      const offset = code - 0xAC00;
      const choIdx = Math.floor(offset / (21 * 28));
      const jungIdx = Math.floor((offset % (21 * 28)) / 28);
      const jongIdx = offset % 28;

      choStrokes += CONSONANT_STROKE[CHO[choIdx]] || 0;
      jungStrokes += VOWEL_STROKE[JUNG[jungIdx]] || 0;
      if (jongIdx > 0) {
        const jong = JONG[jongIdx];
        jongStrokes += CONSONANT_STROKE[jong] || COMPLEX_JONG_STROKE[jong] || 0;
      }
    }
  }
  if (!hasHangul) return null;
  return { choStrokes, jungStrokes, jongStrokes, totalStrokes: choStrokes + jungStrokes + jongStrokes };
}

export function calculateDestinyNumber(name: string): { value: number; rawTotal: number } | null {
  if (!name || name.trim() === "" || name === "이름없음") return null;
  const decomposed = decomposeHangul(name);
  if (!decomposed) return null;
  return { value: reduceToSingle(decomposed.totalStrokes), rawTotal: decomposed.totalStrokes };
}

// 🔧 FIX #1: Pinnacle 1 종료 나이 안전 계산 (Master Number 보정)
function calculatePinnacle1EndAge(lifePath: number): number {
  // 전통: 36 - lifePath. 
  // Master Number(11,22,33)는 환원 후 계산하되 최소 27세 보장
  const base = lifePath > 9 ? reduceToSingle(lifePath) : lifePath;
  const endAge = 36 - base;
  // 안전장치: 최소 27세 (현실적인 첫 피너클 종료 나이)
  return Math.max(endAge, 27);
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

  // 1. Life Path
  const lifePath = reduceToSingle(rMonth + rDay + rYear);
  const lpSum = rMonth + rDay + rYear;

  // 2. Name based numbers (English)
  let expression: number | null = null;
  let soulUrge: number | null = null;
  let personality: number | null = null;
  let eSum = 0, sSum = 0, pSum = 0;

  if (name) {
    const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '');
    if (cleanName.length > 0) {
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

  // 🔧 FIX #4: 한글 이름만 있을 때 Expression/SoulUrge/Personality 폴백
  if (expression === null && name) {
    const decomposed = decomposeHangul(name);
    if (decomposed) {
      // 초성(자음) → Personality(외면), 중성(모음) → Soul Urge(내면), 전체 → Expression
      expression = reduceToSingle(decomposed.totalStrokes);
      soulUrge = reduceToSingle(decomposed.jungStrokes);
      personality = reduceToSingle(decomposed.choStrokes + decomposed.jongStrokes);
    }
  }

  // 3. Birthday Number
  const birthdayNumber = reduceToSingle(day);

  // 4. Maturity Number
  const maturityNumber = expression ? reduceToSingle(lifePath + expression) : null;

  // 5. Personal Year, Month, Day
  const now = new Date();
  const personalYear = reduceToSingle(sumDigits(monthStr) + sumDigits(dayStr) + sumDigits(currentYear.toString()));
  const personalMonth = reduceToSingle(personalYear + (now.getMonth() + 1));
  const personalDay = reduceToSingle(personalMonth + now.getDate());

  // 6. Destiny (Hangul)
  const destinyResult = calculateDestinyNumber(name || "");
  const destiny = destinyResult ? destinyResult.value : null;
  const destinyRawTotal = destinyResult ? destinyResult.rawTotal : 0;

  // 7. Pinnacles & Challenges — 🔧 FIX #1 적용
  const p1 = reduceToSingle(rMonth + rDay);
  const p2 = reduceToSingle(rDay + rYear);
  const p3 = reduceToSingle(p1 + p2);
  const p4 = reduceToSingle(rMonth + rYear);

  const c1 = reduceToSingle(Math.abs(rMonth - rDay));
  const c2 = reduceToSingle(Math.abs(rDay - rYear));
  const c3 = reduceToSingle(Math.abs(c1 - c2));
  const c4 = reduceToSingle(Math.abs(rMonth - rYear));

  const endAge1 = calculatePinnacle1EndAge(lifePath); // 🔧 FIX #1

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
  if (expression) vibrations.push(`표현수 ${expression}(${NUMBER_MEANINGS[expression]?.keyword || ''}): 대외적인 이미지와 삶의 목적`);
  if (soulUrge) vibrations.push(`영혼충동수 ${soulUrge}(${NUMBER_MEANINGS[soulUrge]?.keyword || ''}): 내면의 진정한 욕구`);  // 🔧 FIX: 추가 정보

  // 🔧 FIX #6: 마스터넘버 상세 수집
  const masterNumbersList: number[] = [];
  if ([11, 22, 33].includes(lifePath)) masterNumbersList.push(lifePath);
  if (expression !== null && [11, 22, 33].includes(expression!) && !masterNumbersList.includes(expression!)) masterNumbersList.push(expression!);
  if ([11, 22, 33].includes(personalYear) && !masterNumbersList.includes(personalYear)) masterNumbersList.push(personalYear);
  if (soulUrge !== null && [11, 22, 33].includes(soulUrge!) && !masterNumbersList.includes(soulUrge!)) masterNumbersList.push(soulUrge!);

  const isMasterNumber = masterNumbersList.length > 0;

  let masterNumberType = null;
  if ([11, 22, 33].includes(lifePath)) masterNumberType = `생명수 ${lifePath}`;
  else if (expression && [11, 22, 33].includes(expression)) masterNumberType = `표현수 ${expression}`;
  else if ([11, 22, 33].includes(personalYear)) masterNumberType = `개인년 ${personalYear}`;

  // Karmic Debt
  const lpRawSum = rMonth + rDay + rYear;
  const karmicDebts = detectKarmicDebt(lpRawSum, eSum, sSum, pSum, day, destinyRawTotal);
  
  // 🔧 FIX #5: Karmic Debt 상세 설명
  const karmicDebtDetails = karmicDebts.map(d => KARMIC_DEBT_DETAILS[d] || `카르마 부채 ${d}`);

  return {
    life_path_number: lifePath,
    destiny_number: destiny,
    expressionNumber: expression,
    expression_number: expression,
    soulUrgeNumber: soulUrge,
    soul_urge_number: soulUrge,
    personalityNumber: personality,
    personality_number: personality,
    lifePath: lifePath,
    birthdayNumber,
    maturityNumber,
    personal_year: personalYear,
    personal_year_number: personalYear,
    personalMonth,
    personalDay,
    pinnacles,
    challenges,
    is_master_number: isMasterNumber,
    master_number_type: masterNumberType,
    master_numbers: masterNumbersList,              // 🔧 FIX #6
    compound_number: lpSum,
    numberMeanings,
    vibrations,
    karmic_debts: karmicDebts,
    has_karmic_debt: karmicDebts.length > 0,
    karmic_debt_details: karmicDebtDetails           // 🔧 FIX #5
  };
}

export interface PinnacleResult {
  pinnacles: { number: number; startAge: number; endAge: number | null }[];
  challenges: { number: number; startAge: number; endAge: number | null }[];
}

/**
 * A22: Pinnacle & Challenge 계산 — 🔧 FIX #1 적용
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

  const p1End = calculatePinnacle1EndAge(lifePath); // 🔧 FIX #1: 통일된 함수 사용

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
  
  // 🔧 FIX #10: sumDigits로 통일 (10월=1+0=1, 12월=1+2=3)
  const py = reduceToSingle(sumDigitsValue(targetYear) + sumDigitsValue(bMonth) + sumDigitsValue(bDay));
  return reduceToSingle(py + targetMonth);
}

export function calculatePersonalDay(
  birthDate: Date,
  targetDate: Date
): number {
  const pm = calculatePersonalMonth(birthDate, targetDate.getFullYear(), targetDate.getMonth() + 1);
  return reduceToSingle(pm + targetDate.getDate());
}

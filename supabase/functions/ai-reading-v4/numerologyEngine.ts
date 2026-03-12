/**
 * numerologyEngine.ts
 * - Life Path Number calculation
 * - Destiny Number calculation
 * - Personal Year calculation
 */

export interface NumerologyResult {
  life_path_number: number;
  destiny_number: number | null;
  personal_year: number;
  vibrations: string[];
}

/**
 * 한글 자음 획수 기반 숫자 변환 (Pythagorean 방식 보조)
 * ㄱ:1, ㄴ:1, ㄷ:2, ㄹ:3, ㅁ:3, ㅂ:4, ㅅ:2, ㅇ:1, ㅈ:3, ㅊ:4, ㅋ:2, ㅌ:3, ㅍ:4, ㅎ:3
 * ㄲ, ㄸ, ㅃ, ㅆ, ㅉ 등은 동일 자음 합산 혹은 단일 처리 가능하지만 획수 기반이므로 합쳐서 계산
 */
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
      if (jongseongIndex > 0) {
        totalStrokes += STROKE_MAP[JONGSEONG_LIST[jongseongIndex]] || 0;
      }
    } else {
      // 한글이 아닌 경우 (공백 등) 무시하거나 필요시 영어 변환 추가 가능
    }
  }

  if (!hasHangul) return null;

  // Pythagorean reduction (Reduce to 1-9, excluding master numbers 11, 22, 33 if preferred, 
  // but here we just follow the common 1-9 reduction)
  const reduce = (n: number): number => {
    while (n > 9) {
      n = n.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
    }
    return n;
  };

  return reduce(totalStrokes);
}

export function calculateNumerology(
  birthDate: string, 
  currentYear: number = new Date().getFullYear(),
  name?: string
): NumerologyResult {
  const dateParts = birthDate.split("-"); // YYYY-MM-DD
  const yearStr = dateParts[0];
  const monthStr = dateParts[1];
  const dayStr = dateParts[2];

  const reduceNumber = (num: number): number => {
    while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
      num = num.toString().split("").reduce((acc, digit) => acc + parseInt(digit), 0);
    }
    return num;
  };

  const sumDigits = (str: string): number => {
    return str.split("").reduce((acc, digit) => acc + (parseInt(digit) || 0), 0);
  };

  // 1. Life Path: Sum of MM + DD + YYYY
  const lpSum = sumDigits(monthStr) + sumDigits(dayStr) + sumDigits(yearStr);
  const lifePath = reduceNumber(lpSum);

  // 2. Personal Year: MM + DD + CurrentYear
  const pySum = sumDigits(monthStr) + sumDigits(dayStr) + sumDigits(currentYear.toString());
  const personalYear = reduceNumber(pySum);

  // 3. Destiny Number: Based on Name
  const destiny = calculateDestinyNumber(name || ""); 

  const vibrations = [];
  vibrations.push(`Life Path ${lifePath}`);
  vibrations.push(`Personal Year ${personalYear}`);
  if (destiny) vibrations.push(`Destiny Number ${destiny}`);

  return {
    life_path_number: lifePath,
    destiny_number: destiny,
    personal_year: personalYear,
    vibrations
  };
}

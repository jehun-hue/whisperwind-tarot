/**
 * numerologyEngine.ts
 * - Life Path Number calculation
 * - Destiny Number calculation
 * - Personal Year calculation
 */

export interface NumerologyResult {
  life_path_number: number;
  destiny_number: number;
  personal_year: number;
  vibrations: string[];
}

export function calculateNumerology(birthDate: string, currentYear: number = new Date().getFullYear()): NumerologyResult {
  const dateParts = birthDate.split("-"); // YYYY-MM-DD
  const year = dateParts[0];
  const month = dateParts[1];
  const day = dateParts[2];

  const reduceNumber = (num: number): number => {
    while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
      num = num.toString().split("").reduce((acc, digit) => acc + parseInt(digit), 0);
    }
    return num;
  };

  const sumDigits = (str: string): number => {
    return str.split("").reduce((acc, digit) => acc + parseInt(digit), 0);
  };

  // 1. Life Path: Sum of MM + DD + YYYY
  const lpSum = sumDigits(month) + sumDigits(day) + sumDigits(year);
  const lifePath = reduceNumber(lpSum);

  // 2. Personal Year: MM + DD + CurrentYear
  const pySum = sumDigits(month) + sumDigits(day) + sumDigits(currentYear.toString());
  const personalYear = reduceNumber(pySum);

  // 3. Destiny Number (Simplified: placeholder logic based on Life Path for now)
  const destiny = reduceNumber(lifePath + 5); 

  const vibrations = [];
  if (lifePath === 1) vibrations.push("Life Path 1");
  vibrations.push(`Personal Year ${personalYear}`);

  return {
    life_path_number: lifePath,
    destiny_number: destiny,
    personal_year: personalYear,
    vibrations
  };
}

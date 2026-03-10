/**
 * fiveElements.ts
 */

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

export const FIVE_ELEMENTS_MAP: Record<string, string> = {
  "甲": "wood", "乙": "wood",
  "丙": "fire", "丁": "fire",
  "戊": "earth", "己": "earth",
  "庚": "metal", "辛": "metal",
  "壬": "water", "癸": "water",
  "寅": "wood", "卯": "wood", "辰": "earth",
  "巳": "fire", "午": "fire", "未": "earth",
  "申": "metal", "酉": "metal", "戌": "earth",
  "亥": "water", "子": "water", "丑": "earth"
};

export const ELEMENT_KOREAN: Record<string, string> = {
  "wood": "목",
  "fire": "화",
  "earth": "토",
  "metal": "금",
  "water": "수"
};

export function getElement(char: string): string {
  return FIVE_ELEMENTS_MAP[char] || "unknown";
}

export function getElementKorean(char: string): string {
  const eng = getElement(char);
  return ELEMENT_KOREAN[eng] || eng;
}

/**
 * fiveElements.ts
 */

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

export const FIVE_ELEMENTS_MAP: Record<string, string> = {
  "甲": "wood",
  "乙": "wood",
  "丙": "fire",
  "丁": "fire",
  "戊": "earth",
  "己": "earth",
  "庚": "metal",
  "辛": "metal",
  "壬": "water",
  "癸": "water",
  "寅": "wood",
  "卯": "wood",
  "辰": "earth",
  "巳": "fire",
  "午": "fire",
  "未": "earth",
  "申": "metal",
  "酉": "metal",
  "戌": "earth",
  "亥": "water",
  "子": "water",
  "丑": "earth"
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

// ══════════════════════════════════════════
// 공통 상수 (사주엔진 전체에서 사용)
// ══════════════════════════════════════════

// ── 천간 오행 (한글) ──
export const STEM_ELEMENT_KR: Record<string, string> = {
  "甲": "목", "乙": "목", "丙": "화", "丁": "화", "戊": "토",
  "己": "토", "庚": "금", "辛": "금", "壬": "수", "癸": "수"
};

// ── 지지 오행 (한글) ──
export const BRANCH_ELEMENT_KR: Record<string, string> = {
  "子": "수", "丑": "토", "寅": "목", "卯": "목", "辰": "토",
  "巳": "화", "午": "화", "未": "토", "申": "금", "酉": "금",
  "戌": "토", "亥": "수"
};

// ── 천간 음양 ──
export const STEM_POLARITY: Record<string, "양" | "음"> = {
  "甲": "양", "乙": "음", "丙": "양", "丁": "음", "戊": "양",
  "己": "음", "庚": "양", "辛": "음", "壬": "양", "癸": "음"
};

// ── 지지 본기(정기) 장간 ──
export const BRANCH_MAIN_STEM: Record<string, string> = {
  "子": "癸", "丑": "己", "寅": "甲", "卯": "乙", "辰": "戊",
  "巳": "丙", "午": "丁", "未": "己", "申": "庚", "酉": "辛",
  "戌": "戊", "亥": "壬"
};

// ── 지장간 (본기→중기→여기 순서) ──
// [0]=본기(정기), [1]=중기, [2]=여기(초기)
export const HIDDEN_STEMS: Record<string, string[]> = {
  "子": ["癸", "壬"],
  "丑": ["己", "癸", "辛"],
  "寅": ["甲", "丙", "戊"],
  "卯": ["乙", "甲"],
  "辰": ["戊", "乙", "癸"],
  "巳": ["丙", "庚", "戊"],
  "午": ["丁", "己", "丙"],
  "未": ["己", "丁", "乙"],
  "申": ["庚", "壬", "戊"],
  "酉": ["辛", "庚"],
  "戌": ["戊", "丁", "辛"],
  "亥": ["壬", "甲"]
};

// ── 오행 상생 (내가 생하는 것) ──
export const PRODUCE_ELEM: Record<string, string> = {
  "목": "화", "화": "토", "토": "금", "금": "수", "수": "목"
};

// ── 오행 피생 (나를 생하는 것) ──
export const SUPPORT_ELEM: Record<string, string> = {
  "목": "수", "화": "목", "토": "화", "금": "토", "수": "금"
};

// ── 오행 상극 (내가 극하는 것) ──
export const CONQUER_ELEM: Record<string, string> = {
  "목": "토", "화": "금", "토": "수", "금": "목", "수": "화"
};

// ── 오행 피극 (나를 극하는 것) ──
export const CONQUERED_BY_ELEM: Record<string, string> = {
  "목": "금", "화": "수", "토": "목", "금": "화", "수": "토"
};

// ── 오행 순환 배열 ──
export const ELEMENT_CYCLE: string[] = ["목", "화", "토", "금", "수"];

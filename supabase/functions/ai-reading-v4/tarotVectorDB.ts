// tarotVectorDB.ts
// #93 — 타로 78장 벡터 DB + #94 Minor Arcana 자동 생성

export interface CardVector {
  name: string;
  korean: string;
  emotion: number;
  growth: number;
  risk: number;
  stability: number;
  career: number;
  money: number;
  transition: number;
}

// ── Major Arcana 22장 벡터 ────────────────────────────────────────
export const MAJOR_ARCANA_VECTORS: Record<string, CardVector> = {
  "The Fool":         { name: "The Fool",         korean: "바보",         emotion: 0.4,  growth: 0.7,  risk: 0.3,  stability: -0.2, career: 0.3,  money: 0.1,  transition: 0.8 },
  "The Magician":     { name: "The Magician",     korean: "마법사",       emotion: 0.3,  growth: 0.8,  risk: 0.2,  stability: 0.4,  career: 0.9,  money: 0.6,  transition: 0.5 },
  "The High Priestess":{ name: "The High Priestess", korean: "여사제",    emotion: 0.5,  growth: 0.3,  risk: 0.1,  stability: 0.6,  career: 0.2,  money: 0.2,  transition: 0.2 },
  "The Empress":      { name: "The Empress",      korean: "여황제",       emotion: 0.7,  growth: 0.6,  risk: 0.0,  stability: 0.8,  career: 0.4,  money: 0.7,  transition: 0.3 },
  "The Emperor":      { name: "The Emperor",      korean: "황제",         emotion: 0.2,  growth: 0.5,  risk: 0.1,  stability: 0.9,  career: 0.9,  money: 0.7,  transition: 0.2 },
  "The Hierophant":   { name: "The Hierophant",   korean: "교황",         emotion: 0.3,  growth: 0.3,  risk: 0.0,  stability: 0.9,  career: 0.6,  money: 0.4,  transition: 0.1 },
  "The Lovers":       { name: "The Lovers",       korean: "연인",         emotion: 0.9,  growth: 0.4,  risk: 0.3,  stability: 0.5,  career: 0.2,  money: 0.2,  transition: 0.5 },
  "The Chariot":      { name: "The Chariot",      korean: "전차",         emotion: 0.4,  growth: 0.8,  risk: 0.3,  stability: 0.5,  career: 0.9,  money: 0.5,  transition: 0.6 },
  "Strength":         { name: "Strength",         korean: "힘",           emotion: 0.6,  growth: 0.7,  risk: 0.1,  stability: 0.7,  career: 0.7,  money: 0.4,  transition: 0.3 },
  "The Hermit":       { name: "The Hermit",       korean: "은둔자",       emotion: 0.2,  growth: 0.4,  risk: 0.0,  stability: 0.5,  career: 0.2,  money: 0.1,  transition: 0.3 },
  "Wheel of Fortune": { name: "Wheel of Fortune", korean: "운명의 수레바퀴", emotion: 0.4, growth: 0.6, risk: 0.4,  stability: 0.3,  career: 0.6,  money: 0.6,  transition: 0.8 },
  "Justice":          { name: "Justice",          korean: "정의",         emotion: 0.2,  growth: 0.3,  risk: 0.2,  stability: 0.8,  career: 0.6,  money: 0.5,  transition: 0.3 },
  "The Hanged Man":   { name: "The Hanged Man",   korean: "매달린 사람",  emotion: 0.2,  growth: 0.3,  risk: 0.2,  stability: -0.1, career: -0.1, money: -0.1, transition: 0.4 },
  "Death":            { name: "Death",            korean: "죽음",         emotion: -0.2, growth: 0.5,  risk: 0.5,  stability: -0.5, career: 0.2,  money: -0.1, transition: 0.95 },
  "Temperance":       { name: "Temperance",       korean: "절제",         emotion: 0.5,  growth: 0.5,  risk: -0.1, stability: 0.8,  career: 0.4,  money: 0.4,  transition: 0.3 },
  "The Devil":        { name: "The Devil",        korean: "악마",         emotion: -0.5, growth: -0.2, risk: 0.8,  stability: -0.4, career: -0.3, money: -0.3, transition: 0.2 },
  "The Tower":        { name: "The Tower",        korean: "탑",           emotion: -0.6, growth: 0.3,  risk: 0.95, stability: -0.9, career: -0.4, money: -0.5, transition: 0.9 },
  "The Star":         { name: "The Star",         korean: "별",           emotion: 0.8,  growth: 0.7,  risk: -0.1, stability: 0.6,  career: 0.5,  money: 0.4,  transition: 0.4 },
  "The Moon":         { name: "The Moon",         korean: "달",           emotion: -0.3, growth: 0.2,  risk: 0.6,  stability: -0.4, career: -0.2, money: -0.2, transition: 0.5 },
  "The Sun":          { name: "The Sun",          korean: "태양",         emotion: 0.95, growth: 0.9,  risk: -0.2, stability: 0.8,  career: 0.8,  money: 0.7,  transition: 0.4 },
  "Judgement":        { name: "Judgement",        korean: "심판",         emotion: 0.6,  growth: 0.8,  risk: 0.2,  stability: 0.4,  career: 0.8,  money: 0.5,  transition: 0.8 },
  "The World":        { name: "The World",        korean: "세계",         emotion: 0.9,  growth: 0.95, risk: -0.1, stability: 0.9,  career: 0.9,  money: 0.8,  transition: 0.5 }
};

// ── Minor Arcana 자동 생성 (#94) ──────────────────────────────────
const SUIT_BASE: Record<string, Partial<CardVector>> = {
  Wands:     { emotion: 0.4, growth: 0.7, risk: 0.3, stability: 0.2, career: 0.7, money: 0.4, transition: 0.5 },
  Cups:      { emotion: 0.8, growth: 0.3, risk: 0.1, stability: 0.5, career: 0.2, money: 0.2, transition: 0.3 },
  Swords:    { emotion: -0.2, growth: 0.3, risk: 0.6, stability: -0.2, career: 0.4, money: 0.1, transition: 0.4 },
  Pentacles: { emotion: 0.2, growth: 0.5, risk: 0.1, stability: 0.8, career: 0.7, money: 0.9, transition: 0.2 }
};

const NUMBER_MODIFIERS: Record<number, Partial<CardVector>> = {
  1:  { growth: 0.3,  transition: 0.3,  stability: -0.1 },  // Ace
  2:  { stability: 0.2, transition: 0.1 },
  3:  { growth: 0.2,  emotion: 0.1 },
  4:  { stability: 0.3, risk: -0.1 },
  5:  { risk: 0.3,    stability: -0.2, emotion: -0.1 },
  6:  { stability: 0.1, emotion: 0.2,  transition: 0.1 },
  7:  { risk: 0.2,    growth: 0.1 },
  8:  { career: 0.2,  growth: 0.2 },
  9:  { stability: 0.2, emotion: 0.1 },
  10: { stability: 0.2, transition: 0.2, growth: 0.1 }
};

const COURT_MODIFIERS: Record<string, Partial<CardVector>> = {
  Page:   { growth: 0.2,  transition: 0.2, stability: -0.1 },
  Knight: { growth: 0.3,  career: 0.2,    risk: 0.2,  stability: -0.2 },
  Queen:  { emotion: 0.3, stability: 0.2, career: 0.1 },
  King:   { career: 0.3,  stability: 0.3, growth: 0.1 }
};

const SUIT_KOREAN: Record<string, string> = {
  Wands: "완드", Cups: "컵", Swords: "소드", Pentacles: "펜타클"
};

const NUMBER_KOREAN: Record<number, string> = {
  1: "에이스", 2: "2", 3: "3", 4: "4", 5: "5",
  6: "6", 7: "7", 8: "8", 9: "9", 10: "10"
};

function clamp(v: number): number {
  return Math.min(1.0, Math.max(-1.0, v));
}

function buildMinorVector(
  suit: string,
  rank: number | string,
  rankKorean: string
): CardVector {
  const base = { ...SUIT_BASE[suit] } as Record<string, number>;
  let mod: Partial<CardVector> = {};

  if (typeof rank === "number") {
    mod = NUMBER_MODIFIERS[rank] || {};
    const name = `${NUMBER_KOREAN[rank] === "에이스" ? "Ace" : rank} of ${suit}`;
    const korean = `${SUIT_KOREAN[suit]} ${rankKorean}`;
    return {
      name,
      korean,
      emotion:    clamp((base.emotion    || 0) + (mod.emotion    || 0)),
      growth:     clamp((base.growth     || 0) + (mod.growth     || 0)),
      risk:       clamp((base.risk       || 0) + (mod.risk       || 0)),
      stability:  clamp((base.stability  || 0) + (mod.stability  || 0)),
      career:     clamp((base.career     || 0) + (mod.career     || 0)),
      money:      clamp((base.money      || 0) + (mod.money      || 0)),
      transition: clamp((base.transition || 0) + (mod.transition || 0)),
    };
  } else {
    mod = COURT_MODIFIERS[rank] || {};
    const courtKorean: Record<string, string> = { Page: "페이지", Knight: "기사", Queen: "여왕", King: "왕" };
    return {
      name:       `${rank} of ${suit}`,
      korean:     `${SUIT_KOREAN[suit]} ${courtKorean[rank] || rank}`,
      emotion:    clamp((base.emotion    || 0) + (mod.emotion    || 0)),
      growth:     clamp((base.growth     || 0) + (mod.growth     || 0)),
      risk:       clamp((base.risk       || 0) + (mod.risk       || 0)),
      stability:  clamp((base.stability  || 0) + (mod.stability  || 0)),
      career:     clamp((base.career     || 0) + (mod.career     || 0)),
      money:      clamp((base.money      || 0) + (mod.money      || 0)),
      transition: clamp((base.transition || 0) + (mod.transition || 0)),
    };
  }
}

// ── Minor Arcana 56장 자동 생성 ───────────────────────────────────
function buildMinorArcanaVectors(): Record<string, CardVector> {
  const result: Record<string, CardVector> = {};
  const suits = ["Wands", "Cups", "Swords", "Pentacles"];
  const numbers = [1,2,3,4,5,6,7,8,9,10];
  const courts = ["Page", "Knight", "Queen", "King"];

  for (const suit of suits) {
    for (const n of numbers) {
      const korean = NUMBER_KOREAN[n];
      const v = buildMinorVector(suit, n, korean);
      const key = n === 1 ? `Ace of ${suit}` : `${n} of ${suit}`;
      result[key] = { ...v, name: key };
    }
    for (const court of courts) {
      const v = buildMinorVector(suit, court, court);
      result[`${court} of ${suit}`] = v;
    }
  }
  return result;
}

export const MINOR_ARCANA_VECTORS = buildMinorArcanaVectors();

// ── 전체 78장 통합 DB ─────────────────────────────────────────────
export const ALL_CARD_VECTORS: Record<string, CardVector> = {
  ...MAJOR_ARCANA_VECTORS,
  ...MINOR_ARCANA_VECTORS
};

// ── 카드 벡터 조회 함수 ───────────────────────────────────────────
export function getCardVector(cardName: string): CardVector | null {
  return ALL_CARD_VECTORS[cardName] ?? null;
}

// ── 오행 매핑 (#88-a) ─────────────────────────────────────────────
export const MAJOR_ARCANA_WUXING: Record<string, { wuxing: number; element: string; korean: string }> = {
  "The Fool":          { wuxing: 1, element: "木", korean: "목" },
  "The Magician":      { wuxing: 2, element: "火", korean: "화" },
  "The High Priestess":{ wuxing: 5, element: "水", korean: "수" },
  "The Empress":       { wuxing: 3, element: "토", korean: "토" },
  "The Emperor":       { wuxing: 3, element: "토", korean: "토" },
  "The Hierophant":    { wuxing: 3, element: "토", korean: "토" },
  "The Lovers":        { wuxing: 2, element: "火", korean: "화" },
  "The Chariot":       { wuxing: 5, element: "水", korean: "수" },
  "Strength":          { wuxing: 2, element: "火", korean: "화" },
  "The Hermit":        { wuxing: 3, element: "토", korean: "토" },
  "Wheel of Fortune":  { wuxing: 1, element: "木", korean: "목" },
  "Justice":           { wuxing: 4, element: "金", korean: "금" },
  "The Hanged Man":    { wuxing: 5, element: "水", korean: "수" },
  "Death":             { wuxing: 5, element: "水", korean: "수" },
  "Temperance":        { wuxing: 2, element: "火", korean: "화" },
  "The Devil":         { wuxing: 3, element: "토", korean: "토" },
  "The Tower":         { wuxing: 2, element: "火", korean: "화" },
  "The Star":          { wuxing: 5, element: "水", korean: "수" },
  "The Moon":          { wuxing: 5, element: "水", korean: "수" },
  "The Sun":           { wuxing: 2, element: "火", korean: "화" },
  "Judgement":         { wuxing: 2, element: "火", korean: "화" },
  "The World":         { wuxing: 3, element: "토", korean: "토" }
};

export const SUIT_WUXING: Record<string, { wuxing: number; element: string; korean: string }> = {
  Wands:     { wuxing: 2, element: "火", korean: "화" },
  Cups:      { wuxing: 5, element: "水", korean: "수" },
  Swords:    { wuxing: 4, element: "金", korean: "금" },
  Pentacles: { wuxing: 3, element: "토", korean: "토" }
};

// 용신 호환성 보정 (#88-b)
// 오행 번호: 1=木 2=火 3=土 4=金 5=水
export function getElementCompatibility(cardWuxing: number, yongshinWuxing: number): number {
  if (cardWuxing === yongshinWuxing) return 0.20;           // 동일
  const generating: Record<number, number> = { 1:2, 2:3, 3:4, 4:5, 5:1 }; // 상생
  const generated: Record<number, number>  = { 2:1, 3:2, 4:3, 5:4, 1:5 }; // 상생(역)
  const opposing:  Record<number, number>  = { 1:3, 3:5, 5:2, 2:4, 4:1 }; // 상극
  if (generating[cardWuxing] === yongshinWuxing) return 0.10;
  if (generated[cardWuxing]  === yongshinWuxing) return 0.05;
  if (opposing[cardWuxing]   === yongshinWuxing) return -0.15;
  return -0.10;
}

export function getCardWuxing(cardName: string): number {
  if (MAJOR_ARCANA_WUXING[cardName]) return MAJOR_ARCANA_WUXING[cardName].wuxing;
  const suit = cardName.split(" of ")[1];
  if (suit && SUIT_WUXING[suit]) return SUIT_WUXING[suit].wuxing;
  return 3; // 기본값 土
}

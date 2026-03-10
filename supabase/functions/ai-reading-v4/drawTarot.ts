/**
 * drawTarot.ts
 * - Cryptographically secure tarot card drawing.
 * - Supports seed pinning for consistent results for same user.
 */

export function drawCards(count: number, seed?: string): number[] {
  const totalCards = 78;
  const cards: number[] = Array.from({ length: totalCards }, (_, i) => i);
  
  // Deterministic shuffle if seed is provided (simplified LCG or similar)
  if (seed) {
    let s = Number(seed) || 0x12345678;
    for (let i = cards.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const j = s % (i + 1);
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  } else {
    // Cryptographically secure shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const buffer = new Uint32Array(1);
      crypto.getRandomValues(buffer);
      const j = buffer[0] % (i + 1);
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  }

  return cards.slice(0, count);
}

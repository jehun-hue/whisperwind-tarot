/**
 * tarotEngine.ts
 * - Accurate tarot interpretation based on position and combination.
 * - Queried from the database for highest precision.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export class TarotEngine {
  private supabase;

  constructor(url: string, key: string) {
    this.supabase = createClient(url, key);
  }

  async getInterpretation(cardIds: number[], positions: string[]) {
    // 1. Fetch card details
    const { data: cards } = await this.supabase
      .from("tarot_cards")
      .select("*")
      .in("id", cardIds);
    
    if (!cards) return null;

    // 2. Map interpretation by position
    const interpretations = cards?.map((c, i) => ({
      ...c,
      position: positions[i] || "current",
      meaning: positions[i] === "reversed" ? c.reversed_meaning : c.upright_meaning
    }));

    // 3. Analyze Combinations (Tarot Accuracy Engine)
    // Select top 3 cards for combination check
    const sortedNames = interpretations.slice(0, 3).map(c => c.card_name).sort();
    const { data: combinations } = await this.supabase
      .from("tarot_combinations")
      .select("*")
      .eq("card1", sortedNames[0])
      .eq("card2", sortedNames[1])
      .maybeSingle();

    return {
      individual: interpretations,
      combination: combinations || null
    };
  }
}

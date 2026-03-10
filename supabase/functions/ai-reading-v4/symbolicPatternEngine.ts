/**
 * symbolicPatternEngine.ts (v7)
 * - PART 7 & 8: Symbolic Pattern & Cross-System Semantic Engine.
 * - Maps divination results to unified semantic vectors.
 */

import { SYMBOL_MAPPINGS, PATTERN_DICTIONARY } from "./patternDictionary.ts";

export interface SymbolicVector {
  system: string;
  symbol: string;
  vector: Record<string, number>;
  patterns: string[];
}

export function generatePatternVectors(systemResults: any[]): SymbolicVector[] {
  const vectors: SymbolicVector[] = [];

  systemResults.forEach(res => {
    // Check characteristics (Saju/Astrology markers)
    if (res.characteristics) {
      res.characteristics.forEach((char: string) => {
        const mapping = SYMBOL_MAPPINGS.find(m => m.symbol_name === char);
        if (mapping) {
          vectors.push({
            system: res.system,
            symbol: char,
            vector: mapping.semantic_values,
            patterns: mapping.linked_patterns
          });
        }
      });
    }

    // Check individual card names or specific structure IDs
    const identifiers = [res.name, res.structure, res.dayMaster].filter(Boolean);
    identifiers.forEach(id => {
      const mapping = SYMBOL_MAPPINGS.find(m => m.symbol_name === id);
      if (mapping) {
        vectors.push({
          system: res.system,
          symbol: id,
          vector: mapping.semantic_values,
          patterns: mapping.linked_patterns
        });
      }
    });
  });

  return vectors;
}

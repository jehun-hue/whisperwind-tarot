/**
 * symbolicPatternEngine.ts (v9)
 * - 시스템 결과 → 통합 시맨틱 벡터 변환
 * - v9: 한국어 매칭 지원, partial match fallback, 오행 자동 태깅
 */

import { SYMBOL_MAPPINGS } from "./patternDictionary.ts";

export interface SymbolicVector {
  system: string;
  symbol: string;
  vector: Record<string, number>;
  patterns: string[];
}

/**
 * 심볼 이름으로 SYMBOL_MAPPINGS에서 매칭을 찾는다.
 * 정확히 일치 → partial 포함 일치 순서로 탐색.
 */
function findMapping(symbolName: string) {
  if (!symbolName) return null;
  const normalized = symbolName.trim();
  
  // 1차: 정확히 일치
  const exact = SYMBOL_MAPPINGS.find(m => m.symbol_name === normalized);
  if (exact) return exact;

  // 2차: 대소문자 무시 일치
  const lower = normalized.toLowerCase();
  const caseInsensitive = SYMBOL_MAPPINGS.find(m => m.symbol_name.toLowerCase() === lower);
  if (caseInsensitive) return caseInsensitive;

  // 3차: 부분 포함 (예: "Jupiter Transit" 매핑이 "Jupiter Transit in 2nd house" 특성에 매칭)
  const partial = SYMBOL_MAPPINGS.find(m => 
    normalized.includes(m.symbol_name) || m.symbol_name.includes(normalized)
  );
  if (partial) return partial;

  return null;
}

/**
 * 사주 오행 분포에서 과다/부족을 자동 감지하여 추가 characteristics를 생성
 */
function extractElementCharacteristics(elements: Record<string, number>): string[] {
  const result: string[] = [];
  if (!elements) return result;
  
  const names = ["목", "화", "토", "금", "수"];
  names.forEach(name => {
    const count = elements[name] || 0;
    if (count >= 3) result.push(`${name} 과다`);
    else if (count === 0) result.push(`${name} 부족`);
  });
  
  return result;
}

/**
 * 수비학 vibrations 배열에서 매핑 가능한 항목 추출
 */
function extractNumerologyCharacteristics(res: any): string[] {
  const result: string[] = [];
  if (res.vibrations) {
    res.vibrations.forEach((v: string) => result.push(v));
  }
  if (res.life_path_number) result.push(`Life Path ${res.life_path_number}`);
  if (res.personal_year) result.push(`Personal Year ${res.personal_year}`);
  return result;
}

export function generatePatternVectors(systemResults: any[]): SymbolicVector[] {
  const vectors: SymbolicVector[] = [];

  systemResults.forEach(res => {
    const system = (res.system || "unknown").toLowerCase();

    // ── 1. characteristics 기반 매칭 (모든 시스템 공통) ──
    if (res.characteristics && Array.isArray(res.characteristics)) {
      res.characteristics.forEach((char: string) => {
        const mapping = findMapping(char);
        if (mapping) {
          vectors.push({
            system: res.system || system,
            symbol: char,
            vector: mapping.semantic_values,
            patterns: mapping.linked_patterns
          });
        }
      });
    }

    // ── 2. 사주 전용: 오행 과다/부족 자동 감지 ──
    if (system === "saju") {
      const elementChars = extractElementCharacteristics(res.elements);
      elementChars.forEach(char => {
        const mapping = findMapping(char);
        if (mapping) {
          vectors.push({
            system: "saju",
            symbol: char,
            vector: mapping.semantic_values,
            patterns: mapping.linked_patterns
          });
        }
      });

      // 신강/신약 매칭
      if (res.strength) {
        const strengthMapping = findMapping(res.strength);
        if (strengthMapping) {
          vectors.push({
            system: "saju",
            symbol: res.strength,
            vector: strengthMapping.semantic_values,
            patterns: strengthMapping.linked_patterns
          });
        }
      }

      // dayMaster 기반 일간 특성
      if (res.dayMaster) {
        const dmElement: Record<string, string> = {
          "甲": "목", "乙": "목", "丙": "화", "丁": "화",
          "戊": "토", "己": "토", "庚": "금", "辛": "금", "壬": "수", "癸": "수"
        };
        const el = dmElement[res.dayMaster];
        if (el) {
          const tagMap: Record<string, string> = {
            "목": "목 일간의 생명력", "화": "화 일간의 열정",
            "토": "토 일간의 안정", "금": "금 일간의 결단", "수": "수 일간의 유연"
          };
          const tag = tagMap[el];
          if (tag) {
            const mapping = findMapping(tag);
            if (mapping) {
              vectors.push({
                system: "saju",
                symbol: tag,
                vector: mapping.semantic_values,
                patterns: mapping.linked_patterns
              });
            }
          }
        }
      }
    }

    // ── 2-B. 점성술 전용: 행성·어스펙트·원소 벡터화 ──
    if (system === "astrology") {
      // dominantElement → 원소 기반 매핑
      const domEl = res.dominantElement as string | undefined;
      if (domEl) {
        const elTagMap: Record<string, string> = {
          "불": "화 일간의 열정", "흙": "토 일간의 안정",
          "공기": "목 일간의 생명력", "물": "수 일간의 유연"
        };
        const elTag = elTagMap[domEl.split("/")[0].trim()];
        if (elTag) {
          const mapping = findMapping(elTag);
          if (mapping) vectors.push({ system: "astrology", symbol: domEl, vector: mapping.semantic_values, patterns: mapping.linked_patterns });
        }
      }

      // keyAspects → 어스펙트 문자열 매핑
      const keyAspects: string[] = res.keyAspects || res.major_aspects || [];
      keyAspects.slice(0, 5).forEach((asp: string) => {
        // 행성 이름 추출 후 패턴 딕셔너리 매칭
        const aspLower = asp.toLowerCase();
        let tag = "";
        if (aspLower.includes("목성") || aspLower.includes("jupiter")) tag = "Jupiter Transit";
        else if (aspLower.includes("토성") || aspLower.includes("saturn")) tag = "Saturn Aspect";
        else if (aspLower.includes("명왕성") || aspLower.includes("pluto")) tag = "Pluto Transit";
        else if (aspLower.includes("화성") || aspLower.includes("mars")) tag = "Mars Square";
        if (tag) {
          const mapping = findMapping(tag);
          if (mapping) vectors.push({ system: "astrology", symbol: tag, vector: mapping.semantic_values, patterns: mapping.linked_patterns });
        }
      });

      // Sun sign → 기본 패턴 매핑
      const sunSign = res.sunSign || res.sun_sign || "";
      if (sunSign) {
        const sunTagMap: Record<string, string> = {
          "염소자리": "토 일간의 안정", "황소자리": "토 일간의 안정", "처녀자리": "토 일간의 안정",
          "양자리": "화 일간의 열정", "사자자리": "화 일간의 열정", "사수자리": "화 일간의 열정",
          "쌍둥이자리": "목 일간의 생명력", "천칭자리": "목 일간의 생명력", "물병자리": "목 일간의 생명력",
          "게자리": "수 일간의 유연", "전갈자리": "수 일간의 유연", "물고기자리": "수 일간의 유연"
        };
        const sunTag = sunTagMap[sunSign];
        if (sunTag) {
          const mapping = findMapping(sunTag);
          if (mapping) vectors.push({ system: "astrology", symbol: sunSign, vector: mapping.semantic_values, patterns: mapping.linked_patterns });
        }
      }
    }

    // ── 3. 수비학 전용: vibrations 매칭 ──
    if (system === "numerology") {
      const numChars = extractNumerologyCharacteristics(res);
      numChars.forEach(char => {
        const mapping = findMapping(char);
        if (mapping) {
          vectors.push({
            system: "numerology",
            symbol: char,
            vector: mapping.semantic_values,
            patterns: mapping.linked_patterns
          });
        }
      });
    }

    // ── 4. 타로 전용: 카드명 직접 매칭 ──
    if (system === "tarot" && res.category) {
      // tarotSymbolicEngine이 dominant_patterns를 이미 벡터화하므로
      // 여기서는 카드명 기반 패턴 링크만 수행
      const cardNames = res.characteristics || [];
      cardNames.forEach((name: string) => {
        const mapping = findMapping(name);
        if (mapping) {
          vectors.push({
            system: "tarot",
            symbol: name,
            vector: mapping.semantic_values,
            patterns: mapping.linked_patterns
          });
        }
      });
    }

    // ── 5. 범용: name, structure, dayMaster 필드 매칭 (레거시 호환) ──
    const identifiers = [res.name, res.structure, res.dayMaster].filter(Boolean);
    identifiers.forEach((id: string) => {
      // 이미 위에서 처리한 경우 중복 방지
      const alreadyAdded = vectors.some(v => v.symbol === id && v.system === (res.system || system));
      if (alreadyAdded) return;
      
      const mapping = findMapping(id);
      if (mapping) {
        vectors.push({
          system: res.system || system,
          symbol: id,
          vector: mapping.semantic_values,
          patterns: mapping.linked_patterns
        });
      }
    });
  });

  return vectors;
}

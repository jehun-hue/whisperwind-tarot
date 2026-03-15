/**
 * integratedReadingEngine.ts (v9)
 * - Production AI Symbolic Prediction Engine Platform.
 * - Runtime Flow: Calc -> Pattern -> Semantic -> Consensus -> Temporal -> Validation -> Narrative.
 * - v9 변경사항: Mock 점성술/자미두수 제거 → 프론트 실계산 데이터 사용
 */

import { calculateSaju } from "./calculateSaju.ts";
import { analyzeSajuStructure } from "./aiSajuAnalysis.ts";
import { runTarotSymbolicEngine } from "./tarotSymbolicEngine.ts";
import { generatePatternVectors, SymbolicVector } from "./symbolicPatternEngine.ts";
import { calculateConsensusV8, calculateConsensusWithTopic, getTopicWeights, type QuestionTopic } from "./consensusEngine.ts";
import { runLifeTimelineEngine, type LifeTimelineResult } from "./lifeTimelineEngine.ts";
import { analyzeSpreadCCM, lookupCCM, type CCMResult } from "./cardContextMatrix.ts";
import { predictTemporalV8 } from "./temporalPredictionEngine.ts";
import { validateEngineOutput } from "./validationLayer.ts";
import { getLocalizedStyle, buildLocalizedNarrativePrompt } from "./interactivityLayer.ts";
import { calculateNumerology } from "./numerologyEngine.ts";
import { validateV3Schema, patchMissingFields, logMonitoringEvent } from "./monitoringLayer.ts";
import { safeParseGeminiJSON } from "./jsonUtils.ts";
import { calculateServerAstrology } from "./astrologyEngine.ts";
import { calculateServerZiWei } from "./ziweiEngine.ts";
import { classifyWithFallback, TOPIC_SYSTEM_FOCUS } from "./questionClassifier.ts";
import { detectCombinations, aggregateCombinationScore, processCardVector, SPREAD_POSITION_WEIGHTS } from "./tarotCombinationDB.ts";
import { getCardVector, getCardWuxing, getElementCompatibility } from "./tarotVectorDB.ts";

const READING_VERSION = "v9_symbolic_prediction_engine";

/**
 * 프론트에서 전달받은 점성술 데이터를 엔진 내부 포맷으로 변환
 * src/lib/astrology.ts의 AstrologyResult → 엔진용 구조
 */
function transformAstrologyData(frontAstro: any): any {
  if (!frontAstro) return createFallbackAstrology();

  const planets = frontAstro.planets || [];
  const planet_positions = planets.map((p: any) => ({
    planet: p.name || p.planet,
    sign: p.sign,
    house: p.house,
    degree: p.degree,
    dignity: p.dignity || "없음",
    interpretation: p.interpretation || ""
  }));

  const characteristics: string[] = [];
  
  if (frontAstro.transits) {
    frontAstro.transits.forEach((t: any) => {
      if (t.planet && t.sign) {
        characteristics.push(`${t.planet} Transit`);
      }
      if (t.aspectAlerts) {
        t.aspectAlerts.forEach((alert: string) => characteristics.push(alert));
      }
    });
  }

  if (frontAstro.keyAspects) {
    frontAstro.keyAspects.forEach((aspect: string) => characteristics.push(aspect));
  } else if (frontAstro.aspects) {
    frontAstro.aspects.slice(0, 5).forEach((a: any) => {
      const label = `${a.planet1} ${a.type} ${a.planet2}`;
      characteristics.push(label);
    });
  }

  if (frontAstro.dignityReport) {
    frontAstro.dignityReport.forEach((d: any) => {
      if (d.dignity === "본좌" || d.dignity === "고양") {
        characteristics.push(`${d.planet} ${d.dignity}`);
      }
    });
  }

  if (frontAstro.dominantElement) {
    characteristics.push(`${frontAstro.dominantElement} element dominant`);
  }

  return {
    system: "astrology",
    characteristics,
    planet_positions,
    house_positions: frontAstro.housePositions || {
      ASC: frontAstro.risingSign || "Unknown",
      MC: "Unknown",
      IC: "Unknown",
      DESC: "Unknown"
    },
    major_aspects: (frontAstro.keyAspects || []).slice(0, 5),
    sunSign: frontAstro.sunSign,
    moonSign: frontAstro.moonSign,
    risingSign: frontAstro.risingSign,
    elementDistribution: frontAstro.elementDistribution || {},
    qualityDistribution: frontAstro.qualityDistribution || {},
    questionAnalysis: frontAstro.questionAnalysis || null,
    transits: frontAstro.transits || []
  };
}

/**
 * 프론트에서 전달받은 자미두수 데이터를 엔진 내부 포맷으로 변환
 * src/lib/ziwei.ts의 ZiWeiResult → 엔진용 구조
 */
function transformZiweiData(frontZiwei: any): any {
  if (!frontZiwei) return createFallbackZiwei();

  const palaces = (frontZiwei.palaces || []).map((p: any) => ({
    name: p.name,
    main_stars: p.main_stars || p.mainStars || (p.stars ? p.stars.map((s: any) => s.star) : []),
    location: p.branch || p.location || ""
  }));

  const characteristics: string[] = [];

  palaces.forEach((p: any) => {
    if (p.main_stars && p.main_stars.length > 0) {
      p.main_stars.forEach((star: string) => {
        if (["파군", "자미", "천부", "칠살", "무곡", "태양", "천기", "염정"].includes(star)) {
          characteristics.push(star);
        }
      });
    }
  });

  if (frontZiwei.fourTransformations || frontZiwei.siHwa) {
    const ft = frontZiwei.fourTransformations || frontZiwei.siHwa;
    if (ft.rok || ft.화록) characteristics.push("화록 active");
    if (ft.gwon || ft.화권) characteristics.push("화권 active");
    if (ft.gwa || ft.화과) characteristics.push("화과 active");
    if (ft.gi || ft.화기) characteristics.push("화기 active");
  }

  const mingGong = palaces.find((p: any) => p.name === "명궁");
  if (mingGong && mingGong.main_stars.length > 0) {
    characteristics.push("Main star active");
  }

  const caiBai = palaces.find((p: any) => p.name === "재백궁" || p.name === "재帛궁");
  if (caiBai && caiBai.main_stars.length > 0) {
    characteristics.push("Financial palace growth");
  }

  return {
    system: "ziwei",
    characteristics,
    palaces,
    mingGong: frontZiwei.mingGong || "Unknown",
    bureau: frontZiwei.bureau || "Unknown",
    four_transformations: frontZiwei.fourTransformations || frontZiwei.siHwa || frontZiwei.natalTransformations || {},
    currentMajorPeriod: frontZiwei.currentMajorPeriod || null,
    currentMinorPeriod: frontZiwei.currentMinorPeriod || null,
    questionAnalysis: frontZiwei.questionAnalysis || null
  };
}

/** 점성술 데이터 미전달 시 안전한 fallback */
function createFallbackAstrology() {
  return {
    system: "astrology",
    characteristics: [],
    planet_positions: [],
    house_positions: { ASC: "Unknown", MC: "Unknown", IC: "Unknown", DESC: "Unknown" },
    major_aspects: [],
    sunSign: "Unknown",
    moonSign: "Unknown",
    risingSign: "Unknown"
  };
}

/** 자미두수 데이터 미전달 시 안전한 fallback */
function createFallbackZiwei() {
  return {
    system: "ziwei",
    characteristics: [],
    palaces: [],
    four_transformations: {}
  };
}

// ═══════════════════════════════════════════════
// Testable Engine Helpers & Prompt Builders
// ═══════════════════════════════════════════════

export const getPillarFromData = (data: any, row: number) => {
  if (!data || !data[row]) return "";
  return (data[row][1] || "") + (data[row][2] || "");
};

export const getDayMasterFromData = (data: any) => {
  if (!data || !data[1]) return "Unknown";
  return data[1][1] || "Unknown";
};

/** dbSaju.yongsin.data가 2차원 배열인 경우를 위한 헬퍼 */
export const getYongShinFromData = (data: any, type: 'yong' | 'hee') => {
  if (!data) return "Unknown";
  if (Array.isArray(data)) {
    // 2차원 배열 [행][열] 구조에서 검색 (예: [[null, "水", null], [null, "金", null]])
    // 용신은 0번 행, 희신은 1번 행으로 가정하거나 데이터 존재 여부로 판단
    const row = type === 'yong' ? 0 : 1;
    if (data[row] && Array.isArray(data[row])) {
      return data[row].find((v: any) => v && typeof v === 'string' && v.length === 1) || "Unknown";
    }
    return "Unknown";
  }
  return data[type] || "Unknown";
};

export const LUCKY_MAP: Record<string, any> = {
  "목": { color: "초록", number: "3, 8", direction: "동쪽" },
  "木": { color: "초록", number: "3, 8", direction: "동쪽" },
  "화": { color: "빨강", number: "2, 7", direction: "남쪽" },
  "火": { color: "빨강", number: "2, 7", direction: "남쪽" },
  "토": { color: "노랑/브라운", number: "5, 0", direction: "중앙" },
  "土": { color: "노랑/브라운", number: "5, 0", direction: "중앙" },
  "금": { color: "흰색", number: "4, 9", direction: "서쪽" },
  "金": { color: "흰색", number: "4, 9", direction: "서쪽" },
  "수": { color: "검정/남색", number: "1, 6", direction: "북쪽" },
  "水": { color: "검정/남색", number: "1, 6", direction: "북쪽" }
};

/** 
 * SYMBOLIC_MEANINGS: 
 * 엔진에서 계산·상징화 완료된 데이터의 핵심 해석 지침.
 * Gemini가 스스로 계산하지 않고 이 "정답"을 바탕으로 서술하게 함.
 */
const SYMBOLIC_MEANINGS: Record<string, string> = {
  "Solar_Ming": "명궁 주성 태양(太陽): 박애주의, 공명정대, 리더십, 외부로 발산하는 에너지. 타인을 위해 빛을 비추나 정작 자신은 고독할 수 있음.",
  "Jupiter_Cancer": "목성 게자리 트랜짓: 정서적 풍요, 가족·내부 공동체와의 결속 강화, 정서적 안정 기반의 확장운.",
  "Saturn_Aries": "토성 양자리 진입: 새로운 질서의 수립, 성급함에 대한 경고, 인내를 통한 구조적 개혁 필요성.",
  "Metal_Keum": "금(金) 기운: 결단력, 의리, 숙살지기(정리하는 힘). 부족 시 맺고 끊음이 약해질 수 있음.",
  "Water_Su": "수(水) 기운: 유연함, 지혜, 침투력. 과다 시 생각이 깊어 정체될 수 있고, 부족 시 융통성이 부족해짐."
};

const TOPIC_MAPPING: Record<string, string[]> = {
  "relationship": ["relationship_union", "emotional_connection", "mutual_relationship", "partnership", "relationship_start", "emotional_opening", "marriage", "연애", "사랑", "인연", "궁합"],
  "reconciliation": ["endings", "transformation", "recovery", "patience", "introspection", "재회", "이별", "그리움"],
  "money": ["abundance", "financial_stability", "financial_adjustment", "financial_struggle", "wealth", "finance", "재물", "금전", "투자", "수익"],
  "career": ["victory", "authority", "leadership", "structure", "initiative", "skill_use", "manifestation", "control", "planning", "career", "business", "직장", "성공", "명예"],
  "self_growth": ["intuition", "inner_guidance", "wisdom", "introspection", "healing", "renewal", "transformation", "hope", "self_growth", "study", "성장", "공부", "시험"],
  "life_direction": ["sudden_change", "collapse", "endings", "life_reset", "life_transition", "cycle_change", "uncertainty", "movement", "timing_event", "방향", "인생", "운세"],
  "health": ["healing", "recovery", "vitality", "inner_balance", "hope", "renewal", "emotional_healing", "stability", "rest", "건강", "치료", "회복", "몸", "심리"]
};

const CATEGORY_KOREAN: Record<string, string> = {
  "relationship": "연애/궁합",
  "reconciliation": "재회/인연",
  "money": "재물/금전",
  "career": "학업/커리어",
  "self_growth": "자아/성장",
  "life_direction": "인생의 방향",
  "health": "건강/심리",
  "general_future": "종합 운세"
};

const TOPIC_PATTERNS: Record<string, Record<string, string[]>> = {
  money: {
    saju: ["재성", "식상", "재물"],
    ziwei: ["재백궁"],
    astrology: ["2하우스", "목성"],
    tarot: ["Ace of Pentacles", "Ten of Pentacles", "Nine of Pentacles"]
  },
  career: {
    saju: ["관성", "편관", "정관"],
    ziwei: ["관록궁"],
    astrology: ["10하우스", "토성"],
    tarot: ["The Emperor", "Eight of Pentacles", "Three of Pentacles"]
  },
  love: {
    saju: ["재성", "정재", "관성"],
    ziwei: ["부처궁", "자녀궁"],
    astrology: ["7하우스", "금성"],
    tarot: ["The Lovers", "Two of Cups", "Ace of Cups"]
  },
  health: {
    saju: ["식신", "상관", "水", "木"],
    ziwei: ["질액궁"],
    astrology: ["6하우스", "화성"],
    tarot: ["The Star", "Temperance", "Four of Swords"]
  },
  family: {
    saju: ["인성", "편인", "정인"],
    ziwei: ["부모궁", "형제궁", "자녀궁"],
    astrology: ["4하우스", "달"],
    tarot: ["The Empress", "Ten of Cups", "Six of Cups"]
  },
  change: {
    saju: ["편관", "충", "파"],
    ziwei: ["파군", "칠살"],
    astrology: ["천왕성", "명왕성", "트랜짓"],
    tarot: ["The Tower", "Death", "Wheel of Fortune"]
  }
};

// 음력→양력 변환 함수
function lunarToSolar(year: number, month: number, day: number, isLeapMonth: boolean = false): { year: number; month: number; day: number } {
  // 1900~2100년 음력→양력 변환 테이블 (주요 절입일 기준)
  const lunarNewYearSolar: Record<number, [number, number, number]> = {
    1970: [1970, 1, 27], 1971: [1971, 1, 15], 1972: [1972, 2, 3],
    1973: [1973, 1, 23], 1974: [1974, 1, 23], 1975: [1975, 2, 11],
    1976: [1976, 1, 31], 1977: [1977, 2, 18], 1978: [1978, 2, 7],
    1979: [1979, 1, 28], 1980: [1980, 2, 16], 1981: [1981, 2, 5],
    1982: [1982, 1, 25], 1983: [1983, 2, 13], 1984: [1984, 2, 2],
    1985: [1985, 2, 20], 1986: [1986, 2, 9], 1987: [1987, 1, 29],
    1988: [1988, 2, 17], 1989: [1989, 2, 6], 1990: [1990, 1, 27],
    1991: [1991, 2, 15], 1992: [1992, 2, 4], 1993: [1993, 1, 23],
    1994: [1994, 2, 10], 1995: [1995, 1, 31], 1996: [1996, 2, 19],
    1997: [1997, 2, 7],  1998: [1998, 1, 28], 1999: [1999, 2, 16],
    2000: [2000, 2, 5],  2001: [2001, 1, 24], 2002: [2002, 2, 12],
    2003: [2003, 2, 1],  2004: [2004, 1, 22], 2005: [2005, 2, 9],
    2006: [2006, 1, 29], 2007: [2007, 2, 18], 2008: [2008, 2, 7],
    2009: [2009, 1, 26], 2010: [2010, 2, 14], 2011: [2011, 2, 3],
    2012: [2012, 1, 23], 2013: [2013, 2, 10], 2014: [2014, 1, 31],
    2015: [2015, 2, 19], 2016: [2016, 2, 8],  2017: [2017, 1, 28],
    2018: [2018, 2, 16], 2019: [2019, 2, 5],  2020: [2020, 1, 25],
    2021: [2021, 2, 12], 2022: [2022, 2, 1],  2023: [2023, 1, 22],
    2024: [2024, 2, 10], 2025: [2025, 1, 29], 2026: [2026, 2, 17]
  };

  const newYear = lunarNewYearSolar[year];
  if (!newYear) return { year, month, day }; // 범위 밖이면 그대로 반환

  const baseDate = new Date(Date.UTC(newYear[0], newYear[1] - 1, newYear[2]));
  const lunarMonthDays = [29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30];

  let totalDays = 0;
  for (let m = 1; m < month; m++) {
    totalDays += lunarMonthDays[m - 1];
  }

  // 윤달 처리: 윤달이면 해당 월 일수 전체를 더한 후 day 추가
  if (isLeapMonth) {
    totalDays += lunarMonthDays[month - 1]; // 해당 월(평달) 전체 건너뜀
  }

  totalDays += day - 1;

  const resultDate = new Date(baseDate.getTime() + totalDays * 86400000);

  return {
    year: resultDate.getUTCFullYear(),
    month: resultDate.getUTCMonth() + 1,
    day: resultDate.getUTCDate()
  };
}
// B-57 + B-42 개선: 양력→음력 정밀 변환 (월별 날 수 테이블 기반, 윤달 지원)
interface LunarResult {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  is_leap_month: boolean;
  is_leap_month_adjusted: boolean;
}

function solarToLunar(solarYear: number, solarMonth: number, solarDay: number): LunarResult {
  // 각 연도의 음력 데이터: [설날 양력월, 설날 양력일, 월별 날수[], 윤달 위치(-1=없음)]
  const LUNAR_DATA: Record<number, [number, number, number[], number]> = {
    1970: [2,  6,  [29,30,29,30,29,30,29,30,29,30,30,29], -1],
    1971: [1, 27,  [30,29,30,29,30,29,30,29,30,29,29,30], -1],
    1972: [2, 15,  [30,29,30,29,30,30,29,30,29,30,29,29], 3],
    1973: [2,  3,  [30,29,30,30,29,30,29,30,29,30,29,30], -1],
    1974: [1, 23,  [29,30,29,30,29,30,30,29,30,29,30,29], -1],
    1975: [2, 11,  [30,29,29,30,30,29,30,29,30,30,29,30], 8],
    1976: [1, 31,  [29,30,29,29,30,29,30,29,30,30,30,29], -1],
    1977: [2, 18,  [30,29,30,29,29,30,29,29,30,30,30,29], -1],
    1978: [2,  7,  [30,30,29,30,29,29,30,29,29,30,30,29], -1],
    1979: [1, 28,  [30,30,29,30,29,30,29,30,29,29,30,29], 6],
    1980: [2, 16,  [30,29,30,30,29,30,29,30,29,30,29,29], -1],
    1981: [2,  5,  [30,29,30,30,29,30,30,29,30,29,29,30], -1],
    1982: [1, 25,  [29,30,29,30,29,30,30,30,29,30,29,29], 4],
    1983: [2, 13,  [30,29,29,30,29,30,30,29,30,30,29,30], -1],
    1984: [2,  2,  [29,30,29,29,30,29,30,29,30,30,29,30], -1],
    1985: [2, 20,  [29,30,29,29,30,29,29,30,30,29,30,30], 10],
    1986: [2,  9,  [29,30,29,30,29,29,30,29,30,29,30,30], -1],
    1987: [1, 29,  [29,30,30,29,30,29,29,30,29,30,29,30], -1],
    1988: [2, 17,  [29,29,30,30,29,30,29,29,30,29,30,29], 6],
    1989: [2,  6,  [30,29,30,30,29,30,29,30,29,29,30,29], -1],
    1990: [1, 27,  [30,29,30,30,29,30,30,29,30,29,29,29], -1],
    1991: [2, 15,  [30,29,30,29,30,30,29,30,30,29,30,29], 8],
    1992: [2,  4,  [29,30,29,29,30,30,29,30,30,29,30,30], -1],
    1993: [1, 23,  [29,29,30,29,29,30,30,29,30,30,29,30], -1],
    1994: [2, 10,  [29,30,29,30,29,29,30,29,30,30,29,30], 3],
    1995: [1, 31,  [30,29,30,29,30,29,29,30,29,30,30,29], -1],
    1996: [2, 19,  [30,29,30,30,29,30,29,29,30,29,30,29], -1],
    1997: [2,  7,  [30,29,30,30,30,29,30,29,29,30,29,29], 8],
    1998: [1, 28,  [30,29,30,30,29,30,30,29,30,29,29,30], -1],
    1999: [2, 16,  [29,30,29,30,29,30,30,29,30,30,29,29], -1],
    2000: [2,  5,  [30,29,30,29,29,30,30,29,30,30,29,30], 4],
    2001: [1, 24,  [29,30,29,29,30,29,30,29,30,30,30,29], -1],
    2002: [2, 12,  [30,29,30,29,29,30,29,30,29,30,30,29], -1],
    2003: [2,  1,  [30,29,30,30,29,29,30,29,29,30,30,29], 2],
    2004: [1, 22,  [30,29,30,30,29,30,29,30,29,29,30,29], -1],
    2005: [2,  9,  [30,29,30,30,29,30,30,29,30,29,29,29], -1],
    2006: [1, 29,  [30,29,30,29,30,30,30,29,30,29,29,30], 7],
    2007: [2, 18,  [29,30,29,29,30,30,29,30,30,29,30,29], -1],
    2008: [2,  7,  [30,29,30,29,29,30,29,30,30,29,30,30], -1],
    2009: [1, 26,  [29,30,29,30,29,29,30,29,30,29,30,30], 5],
    2010: [2, 14,  [29,30,29,30,29,30,29,29,30,29,30,30], -1],
    2011: [2,  3,  [29,30,29,30,30,29,30,29,29,30,29,30], -1],
    2012: [1, 23,  [29,30,29,30,30,29,30,30,29,29,30,29], 4],
    2013: [2, 10,  [30,29,29,30,30,29,30,30,29,30,29,29], -1],
    2014: [1, 31,  [30,29,30,29,30,29,30,30,29,30,30,29], -1],
    2015: [2, 19,  [29,30,29,30,29,29,30,30,29,30,30,29], 9],
    2016: [2,  8,  [30,29,30,29,29,30,29,30,29,30,30,30], -1],
    2017: [1, 28,  [29,30,29,30,29,29,30,29,30,29,30,30], -1],
    2018: [2, 16,  [29,30,29,30,29,30,29,29,30,29,30,29], 5],
    2019: [2,  5,  [30,30,29,30,29,30,29,30,29,29,30,29], -1],
    2020: [1, 25,  [30,30,29,30,30,29,30,29,30,29,29,30], -1],
    2021: [2, 12,  [29,30,29,30,30,29,30,29,30,30,29,29], 4],
    2022: [2,  1,  [30,29,30,29,30,29,30,30,29,30,30,29], -1],
    2023: [1, 22,  [29,30,29,30,29,30,29,30,30,29,30,29], -1],
    2024: [2, 10,  [30,29,30,29,30,29,30,29,30,29,30,30], 6],
    2025: [1, 29,  [29,30,29,30,29,30,29,30,29,30,29,30], -1],
    2026: [2, 17,  [29,30,29,30,29,30,29,30,29,30,30,29], -1],
  };

  const data = LUNAR_DATA[solarYear];
  const prevData = LUNAR_DATA[solarYear - 1];

  // 해당 연도의 설날 양력 날짜
  const toJulian = (y: number, m: number, d: number) =>
    Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d - 1524;

  const solarJD = toJulian(solarYear, solarMonth > 2 ? solarMonth : solarMonth, solarDay);

  // 설날 기준으로 어느 음력 연도에 속하는지 판별
  function calcLunar(targetJD: number, yearData: [number, number, number[], number], lunarYear: number): LunarResult {
    const [nyM, nyD, monthDays, leapMonth] = yearData;
    const newYearJD = toJulian(lunarYear, nyM, nyD);
    const diff = targetJD - newYearJD;
    if (diff < 0) return { lunarYear: -1, lunarMonth: -1, lunarDay: -1, is_leap_month: false, is_leap_month_adjusted: false };

    let remaining = diff;
    let month = 1;
    let isLeap = false;
    for (let i = 0; i < monthDays.length; i++) {
      const days = monthDays[i];
      // 윤달: leapMonth 번째 달 다음에 윤달 삽입
      if (leapMonth !== -1 && i === leapMonth) {
        // 윤달 길이는 해당 달과 동일
        const leapDays = monthDays[leapMonth - 1] || 29;
        if (remaining < leapDays) {
          return { lunarYear, lunarMonth: leapMonth, lunarDay: remaining + 1, is_leap_month: true, is_leap_month_adjusted: true };
        }
        remaining -= leapDays;
      }
      if (remaining < days) {
        return { lunarYear, lunarMonth: month, lunarDay: remaining + 1, is_leap_month: false, is_leap_month_adjusted: false };
      }
      remaining -= days;
      month++;
    }
    return { lunarYear, lunarMonth: 12, lunarDay: remaining + 1, is_leap_month: false, is_leap_month_adjusted: false };
  }

  // 해당 연도 시도
  if (data) {
    const result = calcLunar(solarJD, data, solarYear);
    if (result.lunarYear !== -1) return result;
  }

  // 이전 연도(설날 이전인 경우)
  if (prevData) {
    const result = calcLunar(solarJD, prevData, solarYear - 1);
    if (result.lunarYear !== -1) return result;
  }

  // 폴백
  return { lunarYear: solarYear, lunarMonth: solarMonth, lunarDay: solarDay, is_leap_month: false, is_leap_month_adjusted: false };
}

/** 24절기 한국어 매핑 (입춘 기준) */
const KOREAN_SOLAR_TERMS = [
  "입춘", "경칩", "청명", "입하", "망종", "소서",
  "입추", "백로", "한로", "입동", "대설", "소한"
];

export function buildEnginePrompts(input: any, sajuRaw: any, sajuAnalysis: any, ziweiAnalysis?: any, astrologyAnalysis?: any) {
  const { birthInfo, sajuData: dbSaju } = input;
  
  // 음양(陰陽) 판별 로직 추가
  const STEM_LIST = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const BRANCH_LIST = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  
  const getPPol = (p: any) => {
    if (!p || !p.stem || !p.branch) return { s: 0, b: 0 };
    const sI = STEM_LIST.indexOf(p.stem);
    const bI = BRANCH_LIST.indexOf(p.branch);
    return {
      s: sI !== -1 ? (sI % 2 === 0 ? 1 : -1) : 0,
      b: bI !== -1 ? (bI % 2 === 0 ? 1 : -1) : 0
    };
  };

  const pY = getPPol(sajuRaw?.year);
  const pM = getPPol(sajuRaw?.month);
  const pD = getPPol(sajuRaw?.day);
  const pH = getPPol(sajuRaw?.hour);
  const pols = [pY.s, pY.b, pM.s, pM.b, pD.s, pD.b, pH.s, pH.b];
  const yangCount = pols.filter(v => v === 1).length;
  const yinCount = pols.filter(v => v === -1).length;

  let yinyangMessage = "";
  if (yinCount >= 7) {
    yinyangMessage = "- [구조적 특징] 극음 구조 — 내면적 치밀함, 예민한 감수성, 외면보다 내실 추구\n";
  } else if (yangCount >= 7) {
    yinyangMessage = "- [구조적 특징] 극양 구조 — 외향적 에너지 과다, 충동성 주의\n";
  }

  
  const sajuDisplay = {
    fourPillars: sajuRaw?.year ? 
      `년주 ${sajuRaw.year.stem}${sajuRaw.year.branch}, 월주 ${sajuRaw.month.stem}${sajuRaw.month.branch}, 일주 ${sajuRaw.day.stem}${sajuRaw.day.branch}, 시주 ${sajuRaw.hour.stem}${sajuRaw.hour.branch}` :
      (dbSaju?.pillar?.data ? 
        `년주 ${getPillarFromData(dbSaju.pillar.data, 3)}, 월주 ${getPillarFromData(dbSaju.pillar.data, 2)}, 일주 ${getPillarFromData(dbSaju.pillar.data, 1)}, 시주 ${getPillarFromData(dbSaju.pillar.data, 0)}` : 
        (dbSaju?.yearPillar ? `년주 ${dbSaju.yearPillar.hanja}, 월주 ${dbSaju.monthPillar.hanja}, 일주 ${dbSaju.dayPillar.hanja}, 시주 ${dbSaju.hourPillar.hanja}` : "데이터 없음")),
    dayMaster: (sajuRaw?.dayMaster && sajuRaw.dayMaster !== "Unknown") ? sajuRaw.dayMaster :
      (sajuAnalysis?.dayMaster && sajuAnalysis.dayMaster !== "Unknown") ? sajuAnalysis.dayMaster : 
      (dbSaju?.pillar?.data ? getDayMasterFromData(dbSaju.pillar.data) : (dbSaju?.dayPillar?.cheongan || "Unknown")),
    elements: (sajuAnalysis?.elements && Object.keys(sajuAnalysis.elements).length > 0) ? 
      Object.entries(sajuAnalysis.elements).map(([k, v]) => `${k}${v}`).join(" ") : 
      (dbSaju?.yinyang?.data ? `목${dbSaju.yinyang.data.wood || 0} 화${dbSaju.yinyang.data.fire || 0} 토${dbSaju.yinyang.data.earth || 0} 금${dbSaju.yinyang.data.metal || 0} 수${dbSaju.yinyang.data.water || 0}` : "분석 불가"),
    yongShin: (sajuAnalysis?.yongShin && sajuAnalysis.yongShin !== "Unknown") ? sajuAnalysis.yongShin : 
      (dbSaju?.yongsin?.data ? getYongShinFromData(dbSaju.yongsin.data, 'yong') : "데이터 부족"),
    heeShin: (sajuAnalysis?.heeShin && sajuAnalysis.heeShin !== "Unknown") ? sajuAnalysis.heeShin :
      (dbSaju?.yongsin?.data ? getYongShinFromData(dbSaju.yongsin.data, 'hee') : "데이터 부족"),
    strength: (sajuAnalysis?.strength && sajuAnalysis.strength !== "Unknown") ? sajuAnalysis.strength : "분석 불가",
    termName: (sajuRaw?.termIdx !== undefined) ? KOREAN_SOLAR_TERMS[sajuRaw.termIdx] : "알 수 없음"
  };

  const luckyFactors = LUCKY_MAP[sajuDisplay.yongShin] || { color: "다양함", number: "전체", direction: "중앙" };

  // 엔진 상징화 결과 (Calculated Symbolic Results)
  const mingGong = ziweiAnalysis?.palaces.find((p: any) => p.name === "명궁");
  const mingStars = mingGong?.main_stars?.join(", ") || "데이터 부족";
  
  const ziweiSymbolic = `
- 명궁(${ziweiAnalysis?.mingGong || "미상"}): ${mingStars} 좌정.
- 국: ${ziweiAnalysis?.bureau || "분석 불가"}
- 성별: ${birthInfo.gender === 'M' ? '음남(陰男)' : '양녀(陽女)'}
- 지침: 제공된 명반의 국과 주성 의미를 중심으로 리딩을 전개하시오.
`;

  const astrologySymbolic = `
- 차트 주요 특징: ${astrologyAnalysis?.characteristics?.join(", ") || "데이터 부족"}
- 지침: 위 엔진 호출 결과(상징)를 그대로 사용하고, 행성 위치를 직접 계산하지 마시오.
`;



  const ziweiPrompt = `

[자미두수 엔진 호출 결과 - 상징화 완료]
${ziweiSymbolic}
- 기본정보: ${birthInfo.year}년 ${birthInfo.month}월 ${birthInfo.day}일 ${birthInfo.hour}시 ${birthInfo.minute}분 (${birthInfo.gender === 'M' ? '음남 陰男' : '양녀 陽女'})
- 현재 대한: ${ziweiAnalysis?.currentMajorPeriod?.interpretation || "데이터 부족"}
- 소한: ${ziweiAnalysis?.currentMinorPeriod?.interpretation || "데이터 부족"}
- 사화: ${Array.isArray(ziweiAnalysis?.four_transformations) ? ziweiAnalysis.four_transformations.map((t: any) => t.description).join(", ") : "데이터 부족"}
- 주요 궁위 상태 (B-155):
${(ziweiAnalysis?.palaces || []).slice(0, 12).map((p: any) => {
  const starInfo = p.main_stars?.length > 0 ? p.main_stars.join(", ") : "공궁(空宮)";
  const borrowedNote = p.is_borrowed_stars ? ` ※차성안궁(${p.borrowed_from || "대궁"}에서 차용)` : "";
  const emptyNote = p.is_empty ? " [공궁]" : "";
  return `  * ${p.name}(${p.location}): ${starInfo}${emptyNote}${borrowedNote}`;
}).join("\n")}
`;

  const astrologyPrompt = `
[점성술 엔진 호출 결과 - 상징화 완료]
${astrologySymbolic}
- 태양: ${astrologyAnalysis?.sunSign || "미상"} / 달: ${astrologyAnalysis?.moonSign || "미상"} / 상승궁: ${astrologyAnalysis?.risingSign || "미상(출생지 필요)"}
- 지배 원소: ${astrologyAnalysis?.dominantElement || "미상"} / 특질: ${astrologyAnalysis?.dominantQuality || "미상"}
- 네이탈 주요 어스펙트(상위 5개):
${(astrologyAnalysis?.keyAspects || []).slice(0, 5).map((a: string) => `  • ${a}`).join("\n") || "  • 데이터 없음"}
- 디그니티(품위): ${astrologyAnalysis?.dignityReport?.join(", ") || "없음"}
- 현재 트랜짓(외행성 → 네이탈 어스펙트):
${(astrologyAnalysis?.transits || []).slice(0, 8).map((t: string) => `  • ${t}`).join("\n") || "  • 데이터 없음"}

[트랜짓 해석 지침]
- ⚡합(Conjunction): 해당 행성 에너지 집중 활성화 — 새로운 시작·강화
- ⚠️사각(Square): 긴장·도전·성장 압력 — 극복 시 도약
- 💎삼합(Trine): 자연스러운 흐름·기회·조화
- ⚖️충(Opposition): 외부와의 충돌·균형 과제·파트너십 이슈
- ✨육분(Sextile): 작은 기회·협력·소통 활성화
- 정점(Exact) 날짜가 가까울수록 영향력이 강함 — 날짜 기반 타이밍 조언을 제공하세요.
- 외행성(목성·토성·천왕성·해왕성·명왕성) 트랜짓은 장기적 삶의 변화 테마를 나타냅니다.
`;

  const tenGodsData = sajuAnalysis?.tenGods || {};
  const tenGodsStr = Object.entries(tenGodsData).length > 0
    ? Object.entries(tenGodsData)
        .filter(([, v]) => (v as number) > 0)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .map(([k, v]) => `${k}(${v})`)
        .join(" ")
    : "데이터 없음";

  const TEN_GOD_MEANINGS: Record<string, string> = {
    비견: "독립심·경쟁·자존감", 겁재: "승부욕·충동·투쟁",
    식신: "창의·표현·안정적 재능 발현", 상관: "혁신·반항·예술적 끼",
    편재: "유동적 재물·투자·사교성", 정재: "안정적 재물·성실·저축",
    편관: "권위 도전·강한 책임감·외부 압력", 정관: "규범·명예·사회적 신뢰",
    편인: "학문·직관·다재다능·불안정", 정인: "학업·지원·보호·안정적 성장",
  };

  const dominantGods = Object.entries(tenGodsData)
    .filter(([, v]) => (v as number) > 0)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 3)
    .map(([k]) => `${k}(${TEN_GOD_MEANINGS[k] || ""})`)
    .join(", ");

  const sajuSymbolic = `
${yinyangMessage}- 핵심 기운: ${sajuDisplay.yongShin} → [상징: ${SYMBOLIC_MEANINGS[sajuDisplay.yongShin === "水" ? "Water_Su" : sajuDisplay.yongShin === "金" ? "Metal_Keum" : ""] || "전문화된 내면 에너지"}]
- 요소 균형: ${sajuDisplay.elements}
- 십성(十星) 분포: ${tenGodsStr}
- 지배 십성: ${dominantGods || "분석 불가"} — AI는 이 십성의 의미를 질문 주제와 연결하여 해석하세요.
- 십성 해석 지침: 정관·편관 강하면 직업/조직 압박, 식신·상관 강하면 창의/표현 욕구, 편재·정재 강하면 재물 흐름 활성, 편인·정인 강하면 학습/지원 에너지.
`;

  return { sajuDisplay, luckyFactors, ziweiPrompt, astrologyPrompt, sajuSymbolic };
}

export async function runFullProductionEngineV8(supabaseClient: any, apiKey: string, input: any) {
  const pipelineStart = Date.now();
  const sessionId = input.sessionId;
  const tarotCards = input.cards || [];
  const combinationClues = tarotCards
    .map((c: any) => `- ${c.korean}: ${c.cardCombination || "정보 없음"}`)
    .join('\n');

  // Normalize birthInfo: client sends {birthDate:"1987-07-17", birthTime:"15:30", gender:"male"}
  // Engine expects {year, month, day, hour, minute, gender}
  const rawBirth = input.birthInfo || {};
  let birthInfo: any;
  if (rawBirth.year !== undefined) {
    birthInfo = rawBirth;
  } else if (rawBirth.birthDate) {
    const [y, m, d] = rawBirth.birthDate.split("-").map(Number);
    const [hr, mn] = rawBirth.birthTime ? rawBirth.birthTime.split(":").map(Number) : [12, 0];
    birthInfo = {
      year: y, month: m, day: d, hour: hr, minute: mn,
      gender: rawBirth.gender === "male" || rawBirth.gender === "M" ? "M" : "F",
      birthDate: rawBirth.birthDate,
      birthTime: rawBirth.birthTime,
      birthPlace: rawBirth.birthPlace,
      latitude: rawBirth.latitude,
      longitude: rawBirth.longitude,
      isLunar: rawBirth.isLunar,
      isLeapMonth: rawBirth.isLeapMonth,
      // B-123 fix: birthPlace 텍스트 → 위도/경도 자동 변환 (주요 도시 테이블)
      ...((!rawBirth.latitude || !rawBirth.longitude) && rawBirth.birthPlace ? (() => {
        const CITY_COORDS: Record<string, [number, number]> = {
          // 한국
          "서울": [37.5665, 126.9780], "Seoul": [37.5665, 126.9780],
          "부산": [35.1796, 129.0756], "Busan": [35.1796, 129.0756],
          "대구": [35.8714, 128.6014], "Daegu": [35.8714, 128.6014],
          "인천": [37.4563, 126.7052], "Incheon": [37.4563, 126.7052],
          "광주": [35.1595, 126.8526], "Gwangju": [35.1595, 126.8526],
          "대전": [36.3504, 127.3845], "Daejeon": [36.3504, 127.3845],
          "울산": [35.5384, 129.3114], "Ulsan": [35.5384, 129.3114],
          "수원": [37.2636, 127.0286], "Suwon": [37.2636, 127.0286],
          "성남": [37.4449, 127.1388], "Seongnam": [37.4449, 127.1388],
          "고양": [37.6584, 126.8320], "Goyang": [37.6584, 126.8320],
          "용인": [37.2411, 127.1775], "Yongin": [37.2411, 127.1775],
          "창원": [35.2279, 128.6811], "Changwon": [35.2279, 128.6811],
          "청주": [36.6424, 127.4890], "Cheongju": [36.6424, 127.4890],
          "전주": [35.8242, 127.1480], "Jeonju": [35.8242, 127.1480],
          "제주": [33.4996, 126.5312], "Jeju": [33.4996, 126.5312],
          // 해외 주요 도시
          "뉴욕": [40.7128, -74.0060], "New York": [40.7128, -74.0060],
          "로스앤젤레스": [34.0522, -118.2437], "Los Angeles": [34.0522, -118.2437], "LA": [34.0522, -118.2437],
          "런던": [51.5074, -0.1278], "London": [51.5074, -0.1278],
          "파리": [48.8566, 2.3522], "Paris": [48.8566, 2.3522],
          "도쿄": [35.6762, 139.6503], "Tokyo": [35.6762, 139.6503],
          "베이징": [39.9042, 116.4074], "Beijing": [39.9042, 116.4074],
          "상하이": [31.2304, 121.4737], "Shanghai": [31.2304, 121.4737],
          "홍콩": [22.3193, 114.1694], "Hong Kong": [22.3193, 114.1694],
          "싱가포르": [1.3521, 103.8198], "Singapore": [1.3521, 103.8198],
          "시드니": [-33.8688, 151.2093], "Sydney": [-33.8688, 151.2093],
          "토론토": [43.6532, -79.3832], "Toronto": [43.6532, -79.3832],
          "밴쿠버": [49.2827, -123.1207], "Vancouver": [49.2827, -123.1207],
          "베를린": [52.5200, 13.4050], "Berlin": [52.5200, 13.4050],
          "모스크바": [55.7558, 37.6173], "Moscow": [55.7558, 37.6173],
          "두바이": [25.2048, 55.2708], "Dubai": [25.2048, 55.2708],
          "방콕": [13.7563, 100.5018], "Bangkok": [13.7563, 100.5018],
        };
        const place = rawBirth.birthPlace.trim();
        // 정확히 일치하는 도시명 먼저 검색, 없으면 부분 문자열 검색
        const exactMatch = CITY_COORDS[place];
        if (exactMatch) return { latitude: exactMatch[0], longitude: exactMatch[1] };
        const partialKey = Object.keys(CITY_COORDS).find(k => place.includes(k) || k.includes(place));
        if (partialKey) return { latitude: CITY_COORDS[partialKey][0], longitude: CITY_COORDS[partialKey][1] };
        // 매칭 실패 시 서울 기본값
        console.warn(`[B-123] birthPlace 좌표 미매칭: "${place}" → 서울 기본값 사용`);
        return { latitude: 37.5665, longitude: 126.9780 };
      })() : {}),
    };
  } else {
    birthInfo = { year: 2000, month: 1, day: 1, hour: 12, minute: 0, gender: "M" };
    console.warn("[Engine] No birthInfo provided, using defaults");
  }

  // 음력→양력 변환 적용
  const solarBirthInfo = (rawBirth.isLunar || rawBirth.isLunarDate)
    ? (() => {
        const converted = lunarToSolar(
          birthInfo.year,
          birthInfo.month,
          birthInfo.day,
          rawBirth.isLeapMonth ?? false
        );
        // 변환 결과 유효성 검증
        const isValidConversion =
          converted.year > 1900 &&
          converted.year < 2100 &&
          converted.month >= 1 &&
          converted.month <= 12 &&
          converted.day >= 1 &&
          converted.day <= 31;

        if (!isValidConversion) {
          console.warn('⚠️ [음력변환 실패] 원본 날짜로 폴백:', birthInfo);
          return birthInfo;
        }

        console.log(`📊 [음력변환 성공] ${birthInfo.year}.${birthInfo.month}.${birthInfo.day}(음) → ${converted.year}.${converted.month}.${converted.day}(양)`);
        return { ...birthInfo, year: converted.year, month: converted.month, day: converted.day };
      })()
    : birthInfo;

  // Step 1: Physical Calculation Pipeline
    // 사주 계산 (동기)
    const sajuRaw = calculateSaju(
      solarBirthInfo.year, solarBirthInfo.month, solarBirthInfo.day, 
      solarBirthInfo.hour, solarBirthInfo.minute, solarBirthInfo.gender
    );

    // 타로 심볼릭 (동기)
    const tarotSymbolic = runTarotSymbolicEngine(input.cards || [], input.question);
    // B-113: Card Context Matrix (CCM) — 동적 카드 의미 분석
    let ccmResult: ReturnType<typeof analyzeSpreadCCM> | null = null;
    try {
      const cardNames: string[] = (input.cards || []).map((c: any) => c.name).filter(Boolean);
      const cardPositions: Array<"past"|"present"|"future"|"advice"|"obstacle"|"outcome"> =
        (input.cards || []).map((_: any, i: number) => {
          const pos = ["past","present","future","advice","obstacle","outcome"];
          return (pos[i] ?? "present") as "past"|"present"|"future"|"advice"|"obstacle"|"outcome";
        });
      if (cardNames.length > 0) {
        ccmResult = analyzeSpreadCCM(cardNames, cardPositions, (input.questionType || "general"));
      }
    } catch (e) {
      console.warn("[B-113] CCM error:", e);
    }

    // 점성술 (동기)
    const serverAstrology = calculateServerAstrology(
      solarBirthInfo.year, solarBirthInfo.month, solarBirthInfo.day,
      solarBirthInfo.hour, solarBirthInfo.minute,
      solarBirthInfo.latitude, solarBirthInfo.longitude
    );

    // 점성술 정규화 (Snake Case + Backward Compatibility)
    const astrologyAnalysis = serverAstrology ? {
      sun_sign: serverAstrology.sunSign || "Unknown",
      moon_sign: serverAstrology.moonSign || "Unknown",
      rising_sign: serverAstrology.risingSign || "Unknown",
      dominant_element: serverAstrology.dominantElement || "Unknown",
      characteristics: [
        ...(serverAstrology.keyAspects || []).slice(0, 5),
        serverAstrology.dominantElement ? `${serverAstrology.dominantElement} element dominant` : null,
      ].filter(Boolean) as string[],
      aspects: serverAstrology.keyAspects || [],
      houses: serverAstrology.house_positions || {},
      planets: serverAstrology.planets || {},
      patterns: serverAstrology.transits || [],
      // Backward compatibility aliases
      sunSign: serverAstrology.sunSign || "Unknown",
      moonSign: serverAstrology.moonSign || "Unknown",
      risingSign: serverAstrology.risingSign || "Unknown",
      planet_positions: serverAstrology.planets,
      house_positions: serverAstrology.house_positions,
      keyAspects: serverAstrology.keyAspects,
      transits: serverAstrology.transits,
      rawData: serverAstrology
    } : null;

    // 자미두수 시간 보정
    const ziweiLongitude = birthInfo.longitude || 127.5;
    const ziweiCorrectionMinutes = (ziweiLongitude - 135) * 4;
    const ziweiTotalMinutes = birthInfo.hour * 60 + (birthInfo.minute || 0) + ziweiCorrectionMinutes;
    const ziweiCorrectedHour = Math.floor(((ziweiTotalMinutes % 1440) + 1440) % 1440 / 60);
    const ziweiCorrectedMinute = ((ziweiTotalMinutes % 60) + 60) % 60;

    // B-57: 정밀 양력→음력 변환 (윤달 플래그 포함)
    let ziweiLunarMonth = solarBirthInfo.month;
    let ziweiLunarDay = solarBirthInfo.day;
    let ziweiIsLeapMonth = false;

    if (!birthInfo.isLunar) {
      const lunarResult = solarToLunar(solarBirthInfo.year, solarBirthInfo.month, solarBirthInfo.day);
      ziweiLunarMonth = lunarResult.lunarMonth;
      ziweiLunarDay = lunarResult.lunarDay;
      ziweiIsLeapMonth = lunarResult.is_leap_month;
    } else {
      ziweiIsLeapMonth = birthInfo.isLeapMonth ?? false;
    }

    // 수비학 (동기)
    const numerologyResult = calculateNumerology(
      `${solarBirthInfo.year}-${String(solarBirthInfo.month).padStart(2,'0')}-${String(solarBirthInfo.day).padStart(2,'0')}`,
      new Date().getFullYear(),
      input.userName
    );

    // 자미두수 (동기)
    const genderZiwei = (birthInfo.gender === "M" || birthInfo.gender === "male") ? "male" as const : "female" as const;
    const serverZiwei = calculateServerZiWei(
      birthInfo.year, ziweiLunarMonth, ziweiLunarDay, ziweiCorrectedHour, ziweiCorrectedMinute, genderZiwei
    );

    // 자미두수 정규화 (Snake Case + Backward Compatibility)
    const ziweiAnalysis = serverZiwei ? {
      life_structure: serverZiwei.lifeStructure || "",
      palaces: serverZiwei.palaces.map(p => {
        const majorStars = p.stars.filter((s: any) =>
          ["자미","천기","태양","무곡","천동","염정","천부","태음","탐랑","거문","천상","천량","칠살","파군"].includes(s.star)
        ).map((s: any) => s.star);
        return {
          name: p.name,
          main_stars: majorStars,
          location: p.branch,
          // B-155 fix: 공궁 정보 포함
          is_empty: majorStars.length === 0,
          is_borrowed_stars: !!(p as any).is_borrowed_stars,
          borrowed_from: (p as any).borrowed_from || null,
        };
      }),
      key_insights: serverZiwei.keyInsights || [],
      major_period: serverZiwei.currentMajorPeriod || {},
      characteristics: [
        ...serverZiwei.palaces.flatMap(p => p.stars.filter(s =>
          ["파군", "자미", "천부", "칠살", "무곡", "태양", "천기", "염정"].includes(s.star)
        ).map(s => s.star)),
        ...serverZiwei.natalTransformations.map(t => `${t.type} active`),
      ].filter(Boolean) as string[],
      period_analysis: serverZiwei.periodAnalysis || "",
      natal_transformations: serverZiwei.natalTransformations || [],
      annual_transformations: serverZiwei.annualTransformations || [],
      annual_year: serverZiwei.annualYear || null,
      annual_gan: serverZiwei.annualGan || null,
      currentMinorPeriod: serverZiwei.currentMinorPeriod || null,
      patterns: serverZiwei.natalTransformations || [],
      // Backward compatibility aliases
      mingGong: serverZiwei.mingGong,
      bureau: serverZiwei.bureau,
      currentMajorPeriod: serverZiwei.currentMajorPeriod,
      rawData: serverZiwei
    } : null;

    // 사주 구조 분석 + 질문 분류 병렬 실행
    const [sajuAnalysis, topicResult] = await Promise.all([
      analyzeSajuStructure(sajuRaw),
      classifyWithFallback(input.question || "", apiKey)
    ]);

    const finalTopic = topicResult?.primary_topic || input.questionType || "general_future";
    const secondaryTopic = topicResult?.secondary_topic || null;
    const detectedSubtopic = topicResult?.subtopic || null;
    const isDualTopic = secondaryTopic !== null && secondaryTopic !== finalTopic;

  const systemResults = [
    { 
      system: "saju", 
      ...sajuAnalysis 
    },
    (() => {
      // 카드별 벡터 계산 (포지션 가중치 + 역방향 + 용신 보정)
      const wuxingMap: Record<string, number> = { "목": 1, "화": 2, "토": 3, "금": 4, "수": 5 };
      const yongshinWuxing: number = wuxingMap[sajuAnalysis?.yongShin] ?? 3;
      const enrichedCardVectors = (input.cards || []).map((c: any, idx: number) => {
        const baseVec = getCardVector(c.name);
        if (!baseVec) return null;

        // 역방향 + 포지션 가중치 적용
        const processed = processCardVector(
          { emotion: baseVec.emotion, growth: baseVec.growth, risk: baseVec.risk,
            stability: baseVec.stability, career: baseVec.career, money: baseVec.money,
            transition: baseVec.transition },
          c.isReversed === true,
          idx + 1,
          finalTopic
        );

        // 용신 오행 보정
        const cardWuxing = getCardWuxing(c.name);
        const compatibility = getElementCompatibility(cardWuxing, yongshinWuxing);
        const adjusted: Record<string, number> = {};
        for (const [key, val] of Object.entries(processed)) {
          adjusted[key] = Math.min(1.0, Math.max(-1.0, (val as number) + compatibility * 0.5));
        }

        return { name: c.name, position: idx + 1, isReversed: c.isReversed, vector: adjusted };
      }).filter(Boolean);

      return {
        system: "tarot",
        category: tarotSymbolic.category,
        characteristics: [
          ...Object.keys(tarotSymbolic.dominant_patterns),
          ...input.cards.map((c: any) => c.name)
        ],
        card_vectors: enrichedCardVectors,
        yongshin_wuxing: yongshinWuxing
      };
    })(),
    { system: "numerology", ...numerologyResult },
    {
      system: "astrology",
      ...astrologyAnalysis,
      characteristics: [
        ...(astrologyAnalysis?.characteristics || []),
        astrologyAnalysis?.sunSign ? `${astrologyAnalysis.sunSign} 태양` : null,
        astrologyAnalysis?.moonSign ? `${astrologyAnalysis.moonSign} 달` : null,
        astrologyAnalysis?.risingSign ? `${astrologyAnalysis.risingSign} 상승궁` : null
      ].filter(Boolean)
    },
    {
      system: "ziwei",
      ...ziweiAnalysis,
      characteristics: [
        ...(ziweiAnalysis?.characteristics || []),
        ziweiAnalysis?.mingGong ? `${ziweiAnalysis.mingGong} 명궁` : null,
        ziweiAnalysis?.bureau ? `${ziweiAnalysis.bureau}` : null
      ].filter(Boolean)
    }
  ];

  const activeEngines = systemResults.filter((r: any) => {
    if (r.system === "tarot") return !!r.category;
    if (r.system === "saju") return !!r.dayMaster;
    if (r.system === "astrology") return !!r.planet_positions;
    if (r.system === "ziwei") return !!r.palaces;
    if (r.system === "numerology") return !!r.life_path_number;
    return false;
  });

  const rawVectors = generatePatternVectors(systemResults);
  // Symbol 기준 중복 제거 (Set/filter)
  const patternVectors = rawVectors.filter((v, i, a) => 
    a.findIndex(t => t.symbol === v.symbol) === i
  );
  console.log(`📊 [Vector Merge] 중복 제거 완료: ${rawVectors.length} -> ${patternVectors.length}`);

  // Step 2: Cross-System Topic Validation (Voting System)
  const systemWins: Record<string, string> = {};
  const activeSystems = [...new Set(patternVectors.map(v => v.system.toLowerCase()))];
  
  activeSystems.forEach(sys => {
    const sysVectors = patternVectors.filter(v => v.system.toLowerCase() === sys);
    const votes: Record<string, number> = {};
    
    sysVectors.forEach(v => {
      // Vector-based voting
      Object.entries(v.vector).forEach(([dim, val]) => {
        Object.entries(TOPIC_MAPPING).forEach(([topic, dims]) => {
          if (dims.includes(dim)) votes[topic] = (votes[topic] || 0) + val;
        });
      });
      // Symbol-based voting
      Object.entries(TOPIC_MAPPING).forEach(([topic, keywords]) => {
        if (keywords.some(k => v.symbol.includes(k))) votes[topic] = (votes[topic] || 0) + 0.5;
      });
    });
    
    let best = "general_future";
    let max = 0;
    Object.entries(votes).forEach(([t, v]) => {
      if (v > max) { max = v; best = t; }
    });
    systemWins[sys] = best;
  });



  const alignedSystems = Object.keys(systemWins).filter(s => systemWins[s] === finalTopic);
  const conflictingSystems = Object.keys(systemWins).filter(s => systemWins[s] !== finalTopic);
  const topicAlignmentScore = Math.round((alignedSystems.length / activeSystems.length) * 100);

  const crossValidation = {
    topic: CATEGORY_KOREAN[finalTopic] || finalTopic,
    topic_alignment_score: topicAlignmentScore,
    aligned_systems: alignedSystems,
    conflicting_systems: conflictingSystems,
    raw_topic: finalTopic
  };

  const birthTimeProvided = !!birthInfo && !!((birthInfo.birthTime && birthInfo.birthTime !== "") || (birthInfo.hour !== undefined && birthInfo.hour !== 12 && birthInfo.minute !== undefined));
  const birthPlaceProvided = !!birthInfo && (!!(birthInfo as any).birthPlace || !!(birthInfo as any).place);
  const questionType = finalTopic;
  const consensusResult = calculateConsensusWithTopic(
    patternVectors,
    finalTopic as QuestionTopic,
    birthTimeProvided,
    birthPlaceProvided
  );
  const temporalResult = predictTemporalV8(consensusResult, systemResults, questionType);
  // B-164 fix: data-only 모드에서는 타로 없으므로 validation 강제 통과 처리
  const validationResult = input.mode === "data-only"
    ? { isValid: true, message: "Validation Passed (Data-Only Mode)", reasons: [] }
    : validateEngineOutput(consensusResult, patternVectors, systemResults, questionType);

  // Step 2: Scale & Grade Logic
  const grade = consensusResult.consensus_score >= 0.7 ? "S"
    : consensusResult.consensus_score >= 0.5 ? "A"
    : consensusResult.consensus_score >= 0.3 ? "B" : "C";

  // 타로 카드 조합 감지 로직 (#92)
  const cardNamesForCombos = tarotCards.map((c: any) => c.name).filter(Boolean);
  const matchedCombinations = detectCombinations(cardNamesForCombos, finalTopic);
  const detectedCombinations = matchedCombinations.length;
  const combinationBonus = aggregateCombinationScore(matchedCombinations);

  // ── birth_context 확정 (#97, #99) ─────────────────────────────
  const birthContext = {
    solar_date: `${solarBirthInfo.year}-${String(solarBirthInfo.month).padStart(2,"0")}-${String(solarBirthInfo.day).padStart(2,"0")}`,
    lunar_date: (rawBirth?.isLunar || rawBirth?.isLunarDate)
      ? `${birthInfo.year}-${String(birthInfo.month).padStart(2,"0")}-${String(birthInfo.day).padStart(2,"0")}`
      : null,
    is_lunar: !!(rawBirth?.isLunar || rawBirth?.isLunarDate),
    is_leap_month: rawBirth?.isLeapMonth ?? false,
    calendar_type: (rawBirth?.isLunar || rawBirth?.isLunarDate) ? "lunar" : "solar",
    birth_time: solarBirthInfo.hour !== undefined
      ? `${String(solarBirthInfo.hour).padStart(2,"0")}:${String(solarBirthInfo.minute ?? 0).padStart(2,"0")}`
      : null,
    birth_time_source: rawBirth?.birthTime
      ? "user_input"
      : "default_noon",
    birth_time_confirmed: !!rawBirth?.birthTime,
    birth_place: rawBirth?.birthPlace ?? null,
    birth_place_confirmed: !!rawBirth?.birthPlace,
    timezone: rawBirth?.timezone ?? "Asia/Seoul",
    hasTime: !!(rawBirth?.birthTime),
    hasPlace: !!(rawBirth?.birthPlace),
    active_systems: [
      sajuAnalysis  ? "saju"       : null,
      tarotSymbolic ? "tarot"      : null,
      ziweiAnalysis ? "ziwei"      : null,
      astrologyAnalysis ? "astrology" : null,
      numerologyResult  ? "numerology" : null,
    ].filter(Boolean),
    degraded_systems: {
      ...(!rawBirth?.birthTime  && { ziwei: "birth_time_unconfirmed", astrology: "birth_time_unconfirmed" }),
    }
  };

  const tarotScoreDetail   = calculateSystemScore(systemResults, "tarot",      patternVectors, finalTopic, birthContext);
  const sajuScoreDetail    = calculateSystemScore(systemResults, "saju",       patternVectors, finalTopic, birthContext);
  const ziweiScoreDetail   = calculateSystemScore(systemResults, "ziwei",      patternVectors, finalTopic, birthContext);
  const astrologyScoreDetail = calculateSystemScore(systemResults, "astrology", patternVectors, finalTopic, birthContext);
  const numerologyScoreDetail = calculateSystemScore(systemResults, "numerology", patternVectors, finalTopic, birthContext);

  // 타로 카드 조합 보너스 적용 (최대 +0.2)
  if (detectedCombinations > 0) {
    tarotScoreDetail.total = Math.min(1.0, tarotScoreDetail.total + Math.min(0.2, detectedCombinations * 0.05));
    tarotScoreDetail.reasoning += ` (+${detectedCombinations} combinations detected)`;
  }

  const scores = {
    tarot:      tarotScoreDetail,
    saju:       sajuScoreDetail,
    ziwei:      ziweiScoreDetail,
    astrology:  astrologyScoreDetail,
    numerology: numerologyScoreDetail,
    overall:    parseFloat(((tarotScoreDetail.total + sajuScoreDetail.total + ziweiScoreDetail.total + astrologyScoreDetail.total + numerologyScoreDetail.total) / 5).toPrecision(3))
  };

  // Step 3: Narrative Engine (Gemini JSON) + Monitoring
  
  // Step 2-B: Mapping Saju Data for Prompt
  const { sajuDisplay, luckyFactors, ziweiPrompt, astrologyPrompt, sajuSymbolic } = buildEnginePrompts(input, sajuRaw, sajuAnalysis, ziweiAnalysis, astrologyAnalysis);
  
  const daewoonPromptSection = sajuAnalysis.daewoon?.currentDaewoon
    ? `
  - 현재 대운: ${sajuAnalysis.daewoon.currentDaewoon.full} (${sajuAnalysis.daewoon.currentDaewoon.startAge}~${sajuAnalysis.daewoon.currentDaewoon.endAge}세)
  - 대운 천간 십성: ${sajuAnalysis.daewoon.currentDaewoon.tenGodStem}
  - 대운 지지 십성: ${sajuAnalysis.daewoon.currentDaewoon.tenGodBranch}
  - 대운 진행방향: ${sajuAnalysis.daewoon.isForward ? "순행" : "역행"}
  - 전체 대운 흐름: ${sajuAnalysis.daewoon.pillars.map((p: any) => `${p.full}(${p.startAge}세)`).join(" → ")}
    `
    : "- 대운 정보: 데이터 부족으로 생략";

  const dataBlock = `
[사주 엔진 호출 결과 - 상징화 완료]
${sajuSymbolic}
- 사주 4주: ${sajuDisplay.fourPillars}
- 일간(Day Master): ${sajuDisplay.dayMaster}
- 오행 분포: ${sajuDisplay.elements}
- 용신(Yong-Shin): ${sajuDisplay.yongShin}
- 희신: ${sajuDisplay.heeShin}
- 신강/신약: ${sajuDisplay.strength}
- 태어난 절기: ${sajuDisplay.termName}
- 행운 요소: 색상(${luckyFactors.color}), 숫자(${luckyFactors.number}), 방향(${luckyFactors.direction})
- 대운 분석: ${daewoonPromptSection}
- 타로 카드: ${tarotCards.map((c: any) => `${c.name}${c.isReversed ? "(역)" : ""}`).join(", ")}
- 타로 카드 조합 통찰(Clues):
${combinationClues}

[점성술 분석]
${astrologyPrompt}
- 하우스 포커스: ${finalTopic === "health" ? "6하우스(건강·일상)" : finalTopic === "career" ? "10하우스(직업·명예)" : finalTopic === "relationship" ? "7하우스(파트너십)" : finalTopic === "finance" ? "2하우스(재물)" : "전체 하우스"}

[자미두수 분석]
${ziweiPrompt}
- 소한궁: ${ziweiAnalysis?.currentMinorPeriod?.palace || "미확인"} → ${ziweiAnalysis?.currentMinorPeriod?.interpretation || ""}
- 유년사화(${ziweiAnalysis?.annual_year || "올해"}): ${(ziweiAnalysis?.annual_transformations as any[])?.map((t: any) => t.description).join(", ") || "없음"}
- 선천사화: ${(ziweiAnalysis?.natal_transformations as any[])?.slice(0, 4).map((t: any) => `${t.type}(${t.star}→${t.palace})`).join(", ") || "없음"}
- 자미두수 포커스: ${finalTopic === "health" ? "질액궁" : finalTopic === "career" ? "관록궁" : finalTopic === "relationship" ? "부처궁" : finalTopic === "finance" ? "재백궁" : "명궁+관록궁"}

[수비학 분석]
- 생명수 ${(numerologyResult as any)?.life_path_number || "?"}번: ${(numerologyResult as any)?.vibrations?.[0] || ""}
- 개인년 ${(numerologyResult as any)?.personal_year || "?"}: ${(numerologyResult as any)?.vibrations?.[3] || ""}
- 운명수: ${(numerologyResult as any)?.destiny_number || "없음"}

[통합 지표]
- 합의도: consensus_score=${consensusResult.consensus_score.toFixed(3)}
- 합의 신뢰도: confidence_score=${consensusResult.confidence_score.toFixed(3)}
- 충돌 요약: ${consensusResult.conflict_summary}
- 시간축 예측: ${JSON.stringify(temporalResult)}
- 질문 유형: ${finalTopic}${isDualTopic ? ` + ${secondaryTopic} (복합 질문)` : ""}
- 서브토픽: ${detectedSubtopic || "없음"}
- 유효 분석 시스템: ${activeEngines.length}개

[추가 분석 지침]
0. **타로 해석 원칙(최우선 순위)**: 카드의 전통적 의미는 참고만 하고, 질문자의 상황과 맥락에 맞게 유연하게 해석할 것. '이 카드는 ~을 의미합니다' 같은 단정 표현 대신 '이 자리에서 이 카드는 ~의 흐름을 보여줍니다' 형태로 표현할 것.
1. 제공된 사주 데이터만을 근거로 분석하세요. 오행 분포와 십성 분포를 정확히 반영해야 합니다.
2. 만약 특정 오행(예: 재성, 관성)이 0이라면 절대로 해당 운이 좋다고 과장하지 마세요.
3. 트랜짓 행성 위치는 반드시 제공된 데이터만 사용하고, 스스로 추측하지 마세요.
4. 자미두수 명반의 국과 주성, 사화(선천+유년) 영향을 정확히 반영하여 리딩을 전개하세요.
5. 행운 요소(색상, 숫자, 방향)는 반드시 action_guide.lucky 섹션에 반영하세요.
6. **사주 분석 어조 및 구조(파이x준쌤 스타일)**:
   - 'merged_reading.structureInsight' 섹션은 반드시 다음 5단계 구조로 작성하세요:
     ① 사회흐름 ② 절기 기반 기질 ③ 핵심 코드 ④ 전략 ⑤ 행동계획
   - 어조는 단호하면서도 통찰력 있는 '마스터'의 문체를 사용하세요.
7. **타로 조합 분석**: 제공된 카드 조합 시나리오 중 스프레드 안에 해당되는 조합이 있다면 핵심 터닝포인트로 강조하세요.
8. **질문 유형별 우선 분석 엔진**:
${finalTopic === "health" ? "   → 건강 질문: 사주 질액궁 오행·점성술 6하우스·자미두수 질액궁을 최우선 분석하세요." : ""}
${finalTopic === "career" ? "   → 진로 질문: 사주 관성·점성술 10하우스·자미두수 관록궁을 최우선 분석하세요." : ""}
${finalTopic === "relationship" ? "   → 관계 질문: 사주 재성·점성술 7하우스·자미두수 부처궁을 최우선 분석하세요." : ""}
${finalTopic === "finance" ? "   → 재물 질문: 사주 재성·점성술 2·8하우스·자미두수 재백궁을 최우선 분석하세요." : ""}
${finalTopic === "life_change" ? "   → 변화 질문: 사주 운로·점성술 1·9하우스·자미두수 천이궁을 최우선 분석하세요." : ""}

[수렴 분석 지침]
분석에 참여한 유효 엔진 수: ${patternVectors.map(v => v.system).filter((v, i, a) => a.indexOf(v) === i).length}개
수렴 분석 시, "데이터 부족"이나 "분석 불가"인 체계는 완전히 제외하고, 실제 데이터가 있는 엔진들 사이의 '일치(Convergence)'와 '충돌(Divergence)'을 구분하여 서술하세요.
출력 JSON의 "total_systems"는 위 유효 엔진 수를, "converged_count"는 그중 일치도가 높은 엔진 수를 기입하세요.
`;

  const totalSystems = activeEngines.length; // Tarot counts as 1 now
  const validStyles = ['hanna', 'monad', 'e7l3', 'e5l5', 'l7e3'];
  const requestedStyle = validStyles.includes(input.style) ? input.style : 'hanna';
  const modelInput = buildLocalizedNarrativePrompt(input.locale || 'kr', dataBlock, totalSystems, requestedStyle);

  // Gemini 호출 전 타이밍 시작
  const geminiStart = Date.now();
  let rawNarrative: string = "";
  let responseType: "valid_json" | "fallback_text" | "parse_error" | "schema_mismatch" | "timeout" | "skipped" = "valid_json";
  let parseSuccess = true;
  let schemaResult = { passed: true, missing: [] as string[], extra: [] as string[] };
  let fetchErrorMessage: string | null = null;
  let geminiLatency = 0;

  let parsed: any;

  if (input.mode === "data-only") {
    console.log("[PlatformV9] Skipping Gemini Narrative (Data-Only Mode)");
    responseType = "skipped";
    parseSuccess = true;
    parsed = buildFallbackReading("데이터 분석 전용 모드입니다. AI 내러티브가 생성되지 않았습니다.", grade, scores, tarotCards, input.question, requestedStyle);
    // B-152/153 fix: data-only 모드에서 tarot narrative 필드 제거
    if (parsed?.tarot_reading) {
      parsed.tarot_reading = { cards: parsed.tarot_reading.cards || [] };
    }
    if (parsed?.merged_reading) {
      parsed.merged_reading = {};
    }
  } else {
    console.log("GPT 호출 시작:", JSON.stringify({model: "gemini-2.5-pro", promptLength: modelInput.length}));
    try {
      rawNarrative = await fetchGemini(apiKey, "gemini-1.5-pro", modelInput, "");
      geminiLatency = Date.now() - geminiStart;
      console.log("[PlatformV9] Gemini Latency:", geminiLatency, "ms");
    } catch (e: any) {
      console.error("Gemini call failed:", e);
      responseType = "timeout";
      fetchErrorMessage = (e as Error).message;
      rawNarrative = "FETCH_ERROR: " + fetchErrorMessage;
    }

    const initialFallback = buildFallbackReading("", grade, scores, tarotCards, input.question, requestedStyle);
    try {
      console.log("[Parse Stage] safeParseGeminiJSON 시작 (Fallback 수립됨)");
      parsed = safeParseGeminiJSON(rawNarrative, initialFallback);
      
      if (!parsed || Object.keys(parsed).length === 0 || !parsed.reading_info) {
        parseSuccess = false;
        responseType = "parse_error";
        parsed = initialFallback;
      } else {
        schemaResult = validateV3Schema(parsed);
        if (!schemaResult.passed) {
          responseType = "schema_mismatch";
          parsed = patchMissingFields(parsed, scores, grade, tarotCards);
        }
      }
    } catch (_e) {
      parseSuccess = false;
      responseType = "fallback_text";
      parsed = initialFallback;
    }
  }

  // 비동기 모니터링
  logMonitoringEvent(supabaseClient, {
    sessionId,
    engineVersion: READING_VERSION,
    geminiModel: input.mode === "data-only" ? "none" : "gemini-1.5-pro",
    responseType,
    parseSuccess,
    schemaValidationPassed: schemaResult.passed,
    missingFields: schemaResult.missing,
    extraFields: schemaResult.extra,
    geminiLatencyMs: geminiLatency,
    totalPipelineMs: Date.now() - pipelineStart,
    promptTokensEstimate: Math.round(modelInput.length / 4),
    questionType,
    consensusScore: consensusResult.consensus_score,
    confidenceScore: consensusResult.confidence_score,
    conflictSummary: consensusResult.conflict_summary,
    grade,
    cardCount: tarotCards?.length || 0,
    hasBirthInfo: !!birthInfo,
    errorMessage: responseType !== "valid_json" && responseType !== "skipped" ? `Type: ${responseType}` : undefined,
    rawResponsePreview: rawNarrative?.slice(0, 500),
  });

  // 엔진 메타데이터 오버라이드
  parsed.reading_info = {
    ...parsed.reading_info,
    grade,
    date: new Date().toISOString().slice(0, 10),
    card_count: tarotCards?.length || 0,
    question: input.question
  };
  const validSystemCount = patternVectors.map(v => v.system).filter((v, i, a) => a.indexOf(v) === i).length;
  parsed.convergence = {
    ...parsed.convergence,
    grade,
    total_systems: validSystemCount,
    converged_count: Math.round(((consensusResult.consensus_score + 1) / 2) * validSystemCount),
    internal_validation: validationResult.isValid ? "통과" : "경고",
    conflict_summary: consensusResult.conflict_summary,
    conflict_log: consensusResult.conflict_log
  };
  parsed.scores = scores;

  // 비연애 질문이면 love_analysis null 강제
  const isLoveQuestion = ["연애", "reconciliation", "relationship", "marriage", "dating"].includes(questionType);
  if (!isLoveQuestion) {
    parsed.love_analysis = null;
  }

  // [Professional V4 Integrated Fields - Inject into 'parsed' for backward compatibility]
  parsed.integrated_summary = parsed.final_message?.summary || parsed.merged_reading?.coreReading || "분석 결과를 생성하는 중입니다. 잠시만 기다려주세요.";
  parsed.practical_advice = parsed.action_guide || { do_list: [], dont_list: [], lucky: {} };
  parsed.system_calculations = {
    ...parsed.convergence,
    consensus_score: Math.round(consensusResult.consensus_score * 100),
    confidence_score: Math.round(consensusResult.confidence_score * 100),
    grade: grade,
    prediction_strength: consensusResult.prediction_strength,
    conflict_summary: consensusResult.conflict_summary,
    conflict_log: consensusResult.conflict_log
  };
  parsed.engine = {
    consensus: consensusResult,
    consensus_score: consensusResult.consensus_score,
    confidence_score: consensusResult.confidence_score,
    prediction_strength: consensusResult.prediction_strength,
    timeline: temporalResult,
    validation: validationResult,
    vectors: patternVectors,
    system_weights: (consensusResult as any).topic_weights_used || { tarot: 0.40, saju: 0.25, ziwei: 0.20, astrology: 0.10, numerology: 0.05 },
    // B-163 fix: topic_weights_used 별도 필드로 추가 (프론트엔드 참조용)
    topic_weights_used: (consensusResult as any).topic_weights_used || null,
  };

  // Professional V4 Detail Mapping (Required by ReaderPage.tsx)
  parsed.saju_analysis = sajuAnalysis;
  parsed.sajuAnalysis = sajuAnalysis?.narrative || "분석 완료";
  parsed.sajuTimeline = JSON.stringify(temporalResult);
  parsed.astrology_data = astrologyAnalysis;
  parsed.astrologyAnalysis = astrologyAnalysis?.characteristics?.join(", ") || "";
  parsed.ziwei_data = ziweiAnalysis;
  parsed.ziweiAnalysis = ziweiAnalysis?.characteristics?.join(", ") || "";
  parsed.numerology_data = numerologyResult;
  parsed.saju_raw = sajuRaw;

  const consultationCopy = `
### [${input.memo || "사용자"}] 분석 결과 요약
[핵심 진단]
${parsed.merged_reading?.coreReading || parsed.integrated_summary}

[실행 계획]
${parsed.action_guide?.do_list?.map((item: string) => `- ${item}`).join('\n') || "준비 중입니다."}

[행운 요소]
- 색상: ${parsed.action_guide?.lucky?.color || "다양함"}
- 숫자: ${parsed.action_guide?.lucky?.number || "전체"}
- 방향: ${parsed.action_guide?.lucky?.direction || "중앙"}

분석이 완료되었습니다. 감사합니다.
`.trim();

  const llmOriginJson = {
    user_context: {
      question: input.question,
      question_type: questionType,
      birth_info: birthInfo,
      memo: input.memo
    },
    engine_results: {
      saju: sajuAnalysis,
      astrology: astrologyAnalysis,
      ziwei: ziweiAnalysis,
      numerology: numerologyResult,
      tarot: tarotSymbolic
    },
    scores,
    consensus: consensusResult,
    timestamp: new Date().toISOString()
  };

  // ── question_specific_analysis 생성 ──────────────────────────────
  const questionTopic = finalTopic || "general_future";
  const localBestSystem = systemWins;

  const questionSpecificAnalysis = {
    topic: questionTopic,
    subtopic: detectedSubtopic || null,
    systems: {
      saju: (() => {
        if (!sajuAnalysis) return null;
        const pillars = sajuRaw || {};
        const stars = Object.keys((sajuAnalysis as any).tenGods || {});
        return {
          signals: [
            stars.includes("정관") || stars.includes("편관") ? "관성 활성 → 직업/사회적 지위 변동 시사" : null,
            stars.includes("식신") || stars.includes("상관") ? "식상 활성 → 창의·표현 에너지 증가" : null,
            stars.includes("편재") || stars.includes("정재") ? "재성 활성 → 재물 흐름 변동" : null,
          ].filter(Boolean),
          key_pillars: Object.entries(pillars).filter(([k]) => ["year", "month", "day", "hour"].includes(k)).map(([k, v]: [string, any]) => `${k}: ${v.stem}${v.branch}`),
          topic_alignment: (localBestSystem as any)?.saju === questionTopic ? "high" : "medium"
        };
      })(),
      ziwei: (() => {
        if (!ziweiAnalysis) return null;
        const careerP = (ziweiAnalysis as any).palaces?.find((p: any) => p.name === "관록궁");
        return {
          signals: [
            careerP ? `관록궁: ${careerP.main_stars?.join("·")}` : null,
            (ziweiAnalysis as any).major_period?.interpretation ? `대한: ${(ziweiAnalysis as any).major_period.interpretation}` : null,
            (ziweiAnalysis as any).currentMinorPeriod?.interpretation ? `소한: ${(ziweiAnalysis as any).currentMinorPeriod.interpretation}` : null,
            (ziweiAnalysis as any).annual_transformations?.length > 0
              ? `${(ziweiAnalysis as any).annual_year}년 유년사화: ${(ziweiAnalysis as any).annual_transformations.map((t: any) => t.description).join(", ")}`
              : null,
            (ziweiAnalysis as any).natal_transformations?.length > 0
              ? `선천사화: ${(ziweiAnalysis as any).natal_transformations.slice(0, 3).map((t: any) => `${t.type}(${t.star}→${t.palace})`).join(", ")}`
              : null,
          ].filter(Boolean),
          key_palaces: (ziweiAnalysis as any).palaces?.map((p: any) => p.name) || [],
          topic_alignment: "medium"
        };
      })(),
      astrology: (() => {
        if (!astrologyAnalysis) return null;
        return {
          signals: [
            (astrologyAnalysis as any).house_positions?.["10"] ? `10하우스(직업궁): ${(astrologyAnalysis as any).house_positions["10"]}` : null,
            (astrologyAnalysis as any).transits?.length > 0 ? `주요 트랜짓: ${(astrologyAnalysis as any).transits[0]}` : null,
          ].filter(Boolean),
          topic_alignment: "medium"
        };
      })(),
      tarot: (() => {
        const careerCards = ["The Emperor", "The Chariot", "Ace of Pentacles", "Knight of Swords"];
        const matchedCards = input?.cards?.filter((c: any) => careerCards.includes(c.name)) || [];
        return {
          signals: matchedCards.map((c: any) => `${c.name}(${c.isReversed ? '역방향' : '정방향'}) → ${questionTopic} 관련 카드`),
          topic_alignment: matchedCards.length > 0 ? "high" : "low"
        };
      })(),
      numerology: (() => {
        if (!numerologyResult) return null;
        return {
          signals: [
            (numerologyResult as any).life_path_number ? `생명수 ${(numerologyResult as any).life_path_number} → ${(numerologyResult as any).vibrations?.[0] || "분석 중"}` : null,
          ].filter(Boolean),
          topic_alignment: (() => {
            const lp = (numerologyResult as any).life_path_number;
            if (!lp) return "low";
            // 생명수가 질문 주제와 연관된 경우 medium 이상 부여
            const careerNums = [1, 8];
            const relationNums = [2, 6, 9];
            const changeNums = [5, 7];
            if (finalTopic === "career" && careerNums.includes(lp)) return "high";
            if (finalTopic === "relationship" && relationNums.includes(lp)) return "high";
            if (finalTopic === "life_change" && changeNums.includes(lp)) return "high";
            return "medium";
          })()
        };
      })()
    }
  };

  // ── age_context 생성 (#85) ─────────────────────────────────────
  const birthYear = solarBirthInfo?.year || birthInfo?.year;
  const birthMonth = solarBirthInfo?.month || birthInfo?.month;
  const birthDay = solarBirthInfo?.day || birthInfo?.day;
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  // 국제 나이 (만 나이)
  let internationalAge = currentYear - birthYear;
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    internationalAge -= 1;
  }

  // 한국 나이 (세는 나이)
  const koreanAge = currentYear - birthYear + 1;

  // 연 나이 (올해 기준)
  const yearAge = currentYear - birthYear;

  const ageContext = {
    international_age: internationalAge,       // 만 나이 (국제 표준)
    korean_age: koreanAge,                     // 한국 세는 나이
    year_age: yearAge,                         // 연 나이
    birth_year: birthYear,
    standard_used: "international",            // 엔진 기준 나이
    note: "국제 나이(만 나이) 기준으로 분석. korean_age는 참고용."
  };

  // ── timeline_sync 생성 (#87) ────────────────────────────────────
  const timelineSync = (() => {
    const currentAge = ageContext.international_age;
    const entries: Array<{
      system: string;
      type: string;
      label: string;
      age_range?: string;
      current: boolean;
      interpretation: string;
    }> = [];

    // 1. 사주 대운 (daewoon)
    try {
      const sajuPeriods = sajuAnalysis?.daewoon || (sajuAnalysis as any)?.majorPeriods || [];
      const sajuPillars = Array.isArray(sajuPeriods) ? sajuPeriods : (sajuPeriods.pillars || []);
      sajuPillars.forEach((p: any) => {
        const isCurrent = p.isCurrent === true ||
          (p.startAge <= currentAge && p.endAge > currentAge);
        entries.push({
          system: "saju",
          type: "major_period",
          label: p.full || p.label || "대운",
          age_range: `${p.startAge}~${p.endAge}세`,
          current: isCurrent,
          interpretation: p.tenGodStem
            ? `천간 ${p.tenGodStem} · 지지 ${p.tenGodBranch}`
            : p.interpretation || ""
        });
      });
    } catch (_) {}

    // 2. 자미두수 대한
    try {
      const ziweiMajor = ziweiAnalysis?.currentMajorPeriod;
      if (ziweiMajor) {
        entries.push({
          system: "ziwei",
          type: "major_period",
          label: `대한 ${ziweiMajor.branch || ""}궁 (${ziweiMajor.palace || ""})`,
          age_range: `${ziweiMajor.startAge}~${ziweiMajor.endAge}세`,
          current: true,
          interpretation: ziweiMajor.interpretation || ""
        });
      }
      const ziweiMinor = ziweiAnalysis?.currentMinorPeriod;
      if (ziweiMinor) {
        entries.push({
          system: "ziwei",
          type: "minor_period",
          label: `소한 ${ziweiMinor.branch || ""}`,
          age_range: `${ziweiMinor.age}세`,
          current: true,
          interpretation: ziweiMinor.interpretation || ""
        });
      }
    } catch (_) {}

    // 3. 점성술 트랜짓
    try {
      const transits = astrologyAnalysis?.transits || [];
      transits.slice(0, 5).forEach((t: any) => {
        const label = typeof t === "string" ? t : (t.label || t.planet || "트랜짓");
        const interp = typeof t === "string" ? t : (t.interpretation || t.aspect || "");
        entries.push({
          system: "astrology",
          type: "transit",
          label,
          current: true,
          interpretation: interp
        });
      });
    } catch (_) {}

    // 현재 활성 항목 먼저, 나머지 나이 순 정렬
    const sorted = [
      ...entries.filter(e => e.current),
      ...entries.filter(e => !e.current)
        .sort((a, b) => {
          const aAge = parseInt(a.age_range?.split("~")[0] || "0");
          const bAge = parseInt(b.age_range?.split("~")[0] || "0");
          return aAge - bAge;
        })
    ];

    return {
      current_age: currentAge,
      entries: sorted,
      summary: {
        saju_major: entries.find(e => e.system === "saju" && e.current)?.label || null,
        ziwei_major: entries.find(e => e.system === "ziwei" && e.type === "major_period")?.label || null,
        ziwei_minor: entries.find(e => e.system === "ziwei" && e.type === "minor_period")?.label || null,
        astrology_transits: entries
          .filter(e => e.system === "astrology")
          .map(e => e.label)
          .slice(0, 3)
      }
    };
  })();

  // B-108: Life Timeline Engine 연동 (Consensus → Timeline → Narrative 파이프라인)
  let lifeTimelineResult: LifeTimelineResult | null = null;
  try {
    const tarotSymbolList: string[] = patternVectors
      .filter(v => v.system === "tarot")
      .flatMap(v => Object.keys(v.vector ?? {}).filter(k => (v.vector[k] ?? 0) > 0.3));

    lifeTimelineResult = runLifeTimelineEngine(
      solarBirthInfo.year,
      solarBirthInfo.month,
      solarBirthInfo.day,
      sajuAnalysis,
      astrologyAnalysis,
      ziweiAnalysis,
      numerologyResult,
      tarotSymbolList
    );
  } catch (e) {
    console.warn("[B-108] lifeTimelineEngine error:", e);
  }

  // ── validation & warnings 생성 ─────────────────────────────────
  const validationWarnings: string[] = [];
  let dataCompleteness = 1.0;

  // 출생 시간 미확정
  if (!birthContext?.hasTime) {
    validationWarnings.push("birth_time_missing");
    dataCompleteness -= 0.15;
  }
  // 출생지 미확정
  if (!birthContext?.hasPlace) {
    validationWarnings.push("birth_place_missing");
    dataCompleteness -= 0.10;
  }
  // 타로 카드 미노출 (5장 미만) — data-only 모드는 카드 없음이 정상이므로 제외 (B-157)
  if (input.mode !== "data-only" && (!input?.cards || input.cards.length < 5)) {
    validationWarnings.push("tarot_cards_insufficient");
    dataCompleteness -= 0.10;
  }
  // 음력 변환 여부 확인
  if (((rawBirth as any)?.isLunar || (rawBirth as any)?.isLunarDate) && !solarBirthInfo) {
    validationWarnings.push("lunar_conversion_failed");
    dataCompleteness -= 0.20;
  }
  // consensus_score 낮을 때
  if (consensusResult?.consensus_score < 0.3) {
    validationWarnings.push("low_consensus_score");
  }
  // ── system_vectors 기여도 역추적 (#83) ───────────────────────────
  const systemVectors = (() => {
    const result: Record<string, {
      contribution: number;
      vectors: Record<string, number>;
      weight: number;
      confidence: number;
    }> = {};

    const systemWeights: Record<string, number> = {
      tarot:      scores.tarot?.total      ?? 0,
      saju:       scores.saju?.total       ?? 0,
      ziwei:      scores.ziwei?.total      ?? 0,
      astrology:  scores.astrology?.total  ?? 0,
      numerology: scores.numerology?.total ?? 0,
    };

    const totalWeight = Object.values(systemWeights).reduce((a, b) => a + b, 0) || 1;

    // 각 시스템별 벡터 집계
    const systemNames = ["tarot", "saju", "ziwei", "astrology", "numerology"];
    for (const sysName of systemNames) {
      const pts = patternVectors.filter(
        (v: any) => v.system?.toLowerCase() === sysName
      );
      const agg: Record<string, number> = {};
      pts.forEach((p: any) => {
        Object.entries(p.vector || {}).forEach(([dim, val]) => {
          agg[dim] = (agg[dim] || 0) + (val as number);
        });
      });

      // 정규화
      const normalized: Record<string, number> = {};
      for (const [dim, val] of Object.entries(agg)) {
        normalized[dim] = Math.min(1.0, Math.max(-1.0, val / Math.max(pts.length, 1)));
      }

      const w = systemWeights[sysName];
      result[sysName] = {
        contribution: parseFloat((w / totalWeight).toFixed(3)),
        vectors: normalized,
        weight: parseFloat(w.toFixed(3)),
        confidence: parseFloat(((scores as any)[sysName]?.confidence ?? 0).toFixed(3))
      };
    }

    return result;
  })();

  const validation = {
    is_valid: validationWarnings.length === 0,
    warnings: validationWarnings,
    data_completeness: parseFloat(Math.max(0, dataCompleteness).toFixed(2)),
    active_systems: [
      sajuAnalysis ? "saju" : null,
      tarotSymbolic ? "tarot" : null,
      ziweiAnalysis ? "ziwei" : null,
      astrologyAnalysis ? "astrology" : null,
      numerologyResult ? "numerology" : null,
    ].filter(Boolean),
    degraded_systems: {
      ...((!birthContext?.hasTime) && { ziwei: "birth_time_unconfirmed", astrology: "birth_time_unconfirmed" }),
      ...((!birthContext?.hasPlace) && { astrology: "birth_place_missing" }),
    }
  };



  // B-61: edge_case_tags 생성
  const edgeCaseTags: string[] = [];
  if (birthInfo.hour === 23) edgeCaseTags.push("야자시(夜子時)");
  if (!birthInfo.birthTime) edgeCaseTags.push("출생시 미입력");
  if (!birthInfo.birthPlace) edgeCaseTags.push("출생지 미입력");
  if (consensusResult.conflict_log?.some(c => c.conflict_level === "severe")) edgeCaseTags.push("엔진간 심각 충돌");
  if (consensusResult.conflict_log?.some(c => c.conflict_level === "moderate")) edgeCaseTags.push("엔진간 중간 충돌");
  if (sajuRaw?.termIdx === 0 || sajuRaw?.termIdx === 11) edgeCaseTags.push("절기 경계 근처");

  // B-61: final_decision_logic 생성
  const severeConflictPairs = consensusResult.conflict_log
    ?.filter(c => c.conflict_level === "severe")
    .map(c => c.pair) || [];
  const finalDecisionLogic = severeConflictPairs.length > 0
    ? `타로 주도 판단 — ${severeConflictPairs.join(", ")} 충돌로 보조 엔진 조건부 참고. ${consensusResult.conflict_log?.find(c => c.mediator)?.mediator || ""}`
    : consensusResult.conflict_log?.some(c => c.conflict_level === "moderate")
    ? `타로 주도 + 보조 경고 포함 — ${consensusResult.conflict_summary}`
    : `전체 엔진 합의 — 통합 신뢰도 ${(consensusResult.confidence_score * 100).toFixed(0)}%`;

  // B-63: consensus vector 기반 최종 타로 카드 자동 선택
  const dominantDim = Object.entries(consensusResult.dominant_vector || {})
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const consensusCardSuggestion = dominantDim
    ? `합의 벡터 최상위 차원: ${dominantDim} — 관련 타로 카드 강조 권장`
    : null;

  return {
    status: "success",
    result_status: (responseType === "valid_json" && schemaResult.passed) ? "normal" : "degraded",
    response_type: responseType,
    error: (responseType === "timeout") ? "Gemini call failed" : null,
    error_message: fetchErrorMessage,
    raw_narrative: rawNarrative,
    debug_prompt: modelInput,
    engine: parsed.engine,
    system_scores: scores,
    detected_combinations: detectedCombinations,
    cross_validation: crossValidation,
    question_specific_analysis: questionSpecificAnalysis,
    validation: validation,
    system_vectors: systemVectors,
    birth_context: birthContext,
    age_context: ageContext,
    timeline_sync: timelineSync,
    life_timeline: lifeTimelineResult,
    ccm_analysis: ccmResult,
    reading: parsed,
    management_tracks: {
      consultation_copy: consultationCopy,
      llm_origin_json: llmOriginJson
    },
    integrated_summary: parsed.final_message?.summary || parsed.merged_reading?.coreReading || "",
    practical_advice: parsed.action_guide?.do_list?.join(", ") || "",
    // B-61: 스키마 개선
    edge_case_tags: edgeCaseTags,
    final_decision_logic: finalDecisionLogic,
    conflict_log: consensusResult.conflict_log || [],
    conflict_summary: consensusResult.conflict_summary || "",
    // B-62: 원시 엔진 데이터 병렬 저장
    system_calculations: {
      saju: sajuAnalysis,
      astrology: astrologyAnalysis,
      ziwei: ziweiAnalysis,
      numerology: numerologyResult
    },
    raw_engine_data: {
      saju_raw: sajuRaw,
      tarot_symbolic: tarotSymbolic,
      consensus_alignment: consensusResult.alignment_matrix,
    },
    // B-63: consensus vector 기반 카드 제안
    consensus_card_suggestion: consensusCardSuggestion,
    saju_raw: sajuRaw,
    saju_analysis: sajuAnalysis,
    analyses: {
      saju: sajuAnalysis,
      tarot: tarotSymbolic,
      astrology: astrologyAnalysis,
      ziwei: ziweiAnalysis,
      numerology: numerologyResult
    },
    // B-66: AI 내러티브 지침 (신뢰도·충돌 기반 톤 결정)
    ai_narrative_directive: (() => {
      const cs = consensusResult.confidence_score;
      const hasSevere = consensusResult.conflict_log?.some(c => c.conflict_level === "severe");
      const hasModeRate = consensusResult.conflict_log?.some(c => c.conflict_level === "moderate");
      if (cs >= 0.8 && !hasSevere) {
        return {
          tone: "confident",
          instruction: "모든 엔진이 강하게 합의합니다. 확신에 찬 어조로 명확하게 해석하세요.",
          emphasis: "직접적이고 구체적인 예측 중심"
        };
      } else if (cs < 0.5 || hasSevere) {
        return {
          tone: "cautious",
          instruction: "엔진 간 충돌이 감지되었습니다. 가능성과 조건을 강조하며 신중하게 해석하세요.",
          emphasis: "조건부 표현('~할 수 있다', '~가능성') 사용, 타로 판단 우선"
        };
      } else {
        return {
          tone: "balanced",
          instruction: "부분적 합의 상태입니다. 균형 잡힌 시각으로 여러 가능성을 함께 제시하세요.",
          emphasis: hasModeRate ? "충돌 영역은 조건부로 표현" : "긍정·부정 가능성 균형 있게 서술"
        };
      }
    })(),

    // B-71new_p3: 추론 추적 (reasoning_trace)
    reasoning_trace: {
      topic_detected: finalTopic,
      topic_weights: (consensusResult as any).topic_weights_used ?? {},
      engine_contributions: patternVectors.map(v => ({
        system: v.system,
        dominant_dimension: Object.entries(v.vector ?? {}).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] ?? "unknown",
        top_score: Object.values(v.vector ?? {}).sort((a: any, b: any) => b - a)[0] ?? 0
      })),
      conflict_summary: consensusResult.conflict_summary,
      confidence_score: consensusResult.confidence_score,
      consensus_score: consensusResult.consensus_score,
      is_time_unknown: (consensusResult as any).is_time_unknown ?? !birthTimeProvided,
      reasoning_steps: [
        `1. 토픽 감지: ${finalTopic} → 가중치 조정`,
        `2. 벡터 수렴: ${patternVectors.length}개 엔진 분석`,
        `3. 충돌 감지: ${consensusResult.conflict_log?.length ?? 0}건`,
        `4. 최종 신뢰도: ${Math.round(consensusResult.confidence_score * 100)}%`,
        `5. 내러티브 톤: ${consensusResult.confidence_score >= 0.8 ? "confident" : consensusResult.confidence_score < 0.5 ? "cautious" : "balanced"}`
      ]
    },
  };
}

// ═══════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════

interface SystemScoreDetail {
  data_quality_score: number;      // 데이터 존재·완전성 (0~0.4)
  signal_strength_score: number;   // 벡터 명확도·주제 일치도 (0~0.6)
  total: number;                   // 합계 (0~1.0)
  confidence: number;              // 신뢰도 (0~1.0, total의 보정값)
  penalties: string[];             // 감점 사유 목록
  reasoning: string;               // 점수 산출 근거 한 줄 요약
}

function calculateSystemScore(
  systemResults: any[],
  systemName: string,
  patternVectors: SymbolicVector[],
  finalTopic: string,
  birthContext?: { hasTime: boolean; hasPlace: boolean }
): SystemScoreDetail {
  const sysData = systemResults.find(v => v.system === systemName);
  const dataPoints = patternVectors.filter(v => v.system.toLowerCase() === systemName.toLowerCase());
  const penalties: string[] = [];

  // ── data_quality_score (0~0.4) ─────────────────────────────
  let dq = 0;
  if (sysData && sysData.characteristics?.length > 0) dq += 0.2;
  if (dataPoints.length > 0) dq += 0.15;
  if (dataPoints.length >= 3) dq += 0.05;
  if (systemName === "numerology" && sysData?.life_path_number) {
    dq = Math.max(dq, 0.4);
  }

  // 출생 정보 패널티
  if ((systemName === "ziwei" || systemName === "astrology") && birthContext && !birthContext.hasTime) {
    dq *= 0.5;
    penalties.push("birth_time_missing");
  }

  // ── signal_strength_score (0~0.6) ─────────────────────────
  // 벡터 명확도 (0~0.3)
  const aggregated: Record<string, number> = {};
  dataPoints.forEach((p: SymbolicVector) => {
    Object.entries(p.vector).forEach(([dim, val]) => {
      aggregated[dim] = (aggregated[dim] || 0) + (val as number);
    });
  });
  const vals = Object.values(aggregated) as number[];
  const magnitude = vals.length > 0
    ? Math.sqrt(vals.reduce((sum, x) => sum + x * x, 0))
    : 0;
  const scoreClarity = Math.min(0.3, (magnitude / 3.0) * 0.3);

  // 주제 일치도 (0~0.3)
  const localVotes: Record<string, number> = {};
  dataPoints.forEach(v => {
    Object.entries(v.vector).forEach(([dim, val]) => {
      Object.entries(TOPIC_MAPPING).forEach(([topic, dims]) => {
        if ((dims as string[]).includes(dim))
          localVotes[topic] = (localVotes[topic] || 0) + (val as number);
      });
    });
  });
  let localBest = "general_future";
  let maxV = 0;
  Object.entries(localVotes).forEach(([t, v]) => { if (v > maxV) { maxV = v; localBest = t; } });
  const scoreAlignment = 0.3; // topic_mismatch 페널티 제거 — 항상 0.3 적용

  const ss = scoreClarity + scoreAlignment;

  const total = Math.min(1.0, dq + ss);
  const confidence = penalties.length === 0
    ? total
    : total * (1 - penalties.length * 0.08);

  const reasoning = `data_quality=${dq.toFixed(2)}, clarity=${scoreClarity.toFixed(2)}, alignment=${scoreAlignment.toFixed(2)}, penalties=[${penalties.join(",")}]`;

  return { data_quality_score: dq, signal_strength_score: ss, total, confidence, penalties, reasoning };
}

function buildFallbackReading(text: string, grade: string, scores: any, cards: any[], question: string, style: string = 'hanna') {
  const defaultText = text || "인공지능 모델의 응답을 파싱하는 과정에서 오류가 발생했습니다. 요약된 정보를 기반으로 조언 드립니다.";
  
  const tarotReading: any = {};
  if (style === 'monad') {
    tarotReading.monad = { cards: cards?.map((c: any) => ({ name: c.name, position: c.position || "", reversed: c.isReversed || false })) || [], story: defaultText, key_message: "" };
  } else if (style === 'e7l3') {
    tarotReading.e7l3 = { cards: cards?.map((c: any) => ({ name: c.name, position: c.position || "", reversed: c.isReversed || false })) || [], story: defaultText, key_message: "" };
  } else if (style === 'e5l5') {
    tarotReading.e5l5 = { cards: cards?.map((c: any) => ({ name: c.name, position: c.position || "", reversed: c.isReversed || false })) || [], story: defaultText, key_message: "" };
  } else if (style === 'l7e3') {
    tarotReading.l7e3 = { cards: cards?.map((c: any) => ({ name: c.name, position: c.position || "", reversed: c.isReversed || false })) || [], story: defaultText, key_message: "" };
  } else {
    tarotReading.choihanna = { cards: cards?.map((c: any) => ({ name: c.name, position: c.position || "", reversed: c.isReversed || false })) || [], story: defaultText, key_message: "" };
  }

  return {
    reading_info: { question, grade, date: new Date().toISOString().slice(0, 10), card_count: cards?.length || 0 },
    tarot_reading: tarotReading,
    convergence: { 
      total_systems: 6, 
      converged_count: Math.round((scores.overall / 100) * 6), 
      grade, 
      common_message: defaultText, 
      tarot_convergence: { count: 1, systems: ["웨이트 타로"], common_keywords: [] }, 
      internal_validation: "경고", 
      divergent_note: "파싱 오류로 인해 상세 교차 검증 정보가 손실되었습니다." 
    },
    love_analysis: null,
    action_guide: { 
      do_list: ["차후에 다시 한 번 분석을 시도해보세요"], 
      dont_list: ["결과가 누락되었다고 해서 운세 자체가 부정적인 것은 아닙니다"], 
      lucky: { color: "화이트", number: "7", item: "메모장" } 
    },
    final_message: { title: "리딩 요약", summary: defaultText },
    merged_reading: { coreReading: defaultText, structureInsight: "", currentSituation: "", timingInsight: "", longTermFlow: "", finalAdvice: "" },
    scores,
  };
}

async function fetchGemini(apiKey: string, model: string, system: string, _user: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: system }] }],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    })
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
}

export async function fetchGeminiStream(apiKey: string, model: string, system: string): Promise<ReadableStream<Uint8Array>> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: system }] }],
      generationConfig: { maxOutputTokens: 8192 }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini Stream API error: ${response.status} - ${errText}`);
  }

  if (!response.body) throw new Error("No response body for streaming");
  return response.body;
}

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
import { getLocalizedStyle, buildCoreReadingPrompt, buildStyleApplyPrompt } from "./interactivityLayer.ts";
import { calculateNumerology } from "./numerologyEngine.ts";
import { validateV3Schema, patchMissingFields, logMonitoringEvent } from "./monitoringLayer.ts";
import { safeParseGeminiJSON } from "./jsonUtils.ts";
import { calculateServerAstrology } from "./astrologyEngine.ts";
import { calculateServerZiWei } from "./ziweiEngine.ts";
import { classifyWithFallback, classifyQuestion, TOPIC_SYSTEM_FOCUS } from "./questionClassifier.ts";
import { detectCombinations, aggregateCombinationScore, processCardVector, SPREAD_POSITION_WEIGHTS } from "./tarotCombinationDB.ts";
import { getCardVector, getCardWuxing, getElementCompatibility } from "./tarotVectorDB.ts";
import { lunarToSolarAccurate } from "./lunarData.ts";

/**
 * 통합 리딩 엔진 V8
 * 
 * 날짜 처리 규칙:
 * - 사주/점성술: 양력(Solar) 기준 → solarBirthInfo 사용
 * - 자미두수: 음력(Lunar) 기준 → rawBirth 또는 solarToLunar 변환값 사용
 * - 수비학: 양력 기준
 * - 타로: 날짜 무관 (카드 기반)
 * 
 * 시간 보정: 경도 기반 진태양시 보정 적용 (기본 서울 127°E → -30분)
 */
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
/**
 * @deprecated Use lunarToSolarAccurate from lunarData.ts instead.
 * This internal version is kept for reference but not used in the main pipeline.
 */
function _deprecated_lunarToSolar(year: number, month: number, day: number, isLeapMonth: boolean = false): { year: number; month: number; day: number } {
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
  if (!newYear) return { year, month, day };

  const baseDate = new Date(Date.UTC(newYear[0], newYear[1] - 1, newYear[2]));
  const lunarMonthDays = [29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30];

  let totalDays = 0;
  for (let m = 1; m < month; m++) {
    totalDays += lunarMonthDays[m - 1];
  }

  if (isLeapMonth) {
    totalDays += lunarMonthDays[month - 1]; 
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

export function buildEnginePrompts(input: any, sajuRaw: any, sajuAnalysis: any, ziweiAnalysis?: any, astrologyAnalysis?: any, ageContext?: any) {
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
    termName: (sajuRaw?.termIdx !== undefined) ? KOREAN_SOLAR_TERMS[sajuRaw.termIdx] : "알 수 없음",
    // B-181 fix: 대운 교체 임박 정보 추가
    isDaewoonChanging: !!(sajuRaw as any)?.daewoon?.is_daeun_changing_year || false,
    currentDaewoon: (sajuRaw as any)?.daewoon?.currentDaewoon?.full || null,
    nextDaewoon: (() => {
      const dw = (sajuRaw as any)?.daewoon;
      if (!dw?.is_daeun_changing_year || !dw?.pillars) return null;
      const cur = dw.currentDaewoon;
      const next = dw.pillars.find((p: any) => p.index === (cur?.index || 0) + 1);
      return next?.full || null;
    })(),
    has_time: !!sajuRaw?.has_time
  };

  const luckyFactors = LUCKY_MAP[sajuDisplay.yongShin] || { color: "다양함", number: "전체", direction: "중앙" };

  // 엔진 상징화 결과 (Calculated Symbolic Results)
  const mingGong = ziweiAnalysis?.palaces?.find((p: any) => p.name === "명궁");
  const mingStars = mingGong?.main_stars?.join(", ") || "데이터 부족";
  
  const ziweiSymbolic = ziweiAnalysis?.skipped ? `(자미두수 데이터 없음: ${ziweiAnalysis.reason})` : `
- 명궁(${ziweiAnalysis?.mingGong || "미상"}): ${mingStars} 좌정.
- 국: ${ziweiAnalysis?.bureau || "분석 불가"}
- 성별: ${birthInfo.gender === 'M' ? '음남(陰男)' : '양녀(陽女)'}
- 지침: 제공된 명반의 국과 주성 의미를 중심으로 리딩을 전개하시오.
`;

  const astrologySymbolic = `
- 차트 주요 특징: ${astrologyAnalysis?.characteristics?.join(", ") || "데이터 부족"}
- 지침: 위 엔진 호출 결과(상징)를 그대로 사용하고, 행성 위치를 직접 계산하지 마시오.${sajuDisplay.has_time ? "" : " (시간 미입력: 하우스 분석 제외)"}
`;



  const ziweiPrompt = ziweiAnalysis?.skipped ? ziweiAnalysis.reason : `
[자미두수 엔진 호출 결과 - 상징화 완료]
${ziweiSymbolic}
- 기본정보: ${birthInfo.year}년 ${birthInfo.month}월 ${birthInfo.day}일 ${birthInfo.hour}시 ${birthInfo.minute}분 (${birthInfo.gender === 'M' ? '음남 陰男' : '양녀 陽女'})
- 현재 대한: ${ziweiAnalysis?.currentMajorPeriod?.interpretation || "데이터 부족"}
- 소한: ${ziweiAnalysis?.currentMinorPeriod?.interpretation || "데이터 부족"}
- 선천사화: ${Array.isArray(ziweiAnalysis?.natal_transformations) ? ziweiAnalysis.natal_transformations.slice(0,4).map((t: any) => `${t.type}(${t.star}→${t.palace})`).join(", ") : "데이터 부족"}
- B-175 압축: 주요궁(명/관록/부처/질액/천이) + 공궁만 표시
${(ziweiAnalysis?.palaces || []).filter((p: any) => 
  ["명궁","관록궁","부처궁","질액궁","천이궁"].includes(p.name) || p.is_empty
).map((p: any) => {
  const starInfo = p.main_stars?.length > 0 ? p.main_stars.join(", ") : "공궁(空宮)";
  const borrowedNote = p.is_borrowed_stars ? ` ※차성안궁(${p.borrowed_from || "대궁"}에서 차용)` : "";
  const emptyNote = p.is_empty ? " [공궁]" : "";
  return `  * ${p.name}(${p.location}): ${starInfo}${emptyNote}${borrowedNote}`;
}).join("\n")}
`;

  const astrologyPrompt = `
[점성술 엔진 호출 결과 - 상징화 완료]
${astrologySymbolic}
- 태양: ${astrologyAnalysis?.sunSign || "미상"} / 달: ${astrologyAnalysis?.moonSign || "미상"} / 상승궁: ${astrologyAnalysis?.risingSign || "미상(출생시간 필요)"}
- 지배 원소: ${astrologyAnalysis?.dominant_element || astrologyAnalysis?.dominantElement || "미상"} / 특질: ${astrologyAnalysis?.dominantQuality || "미상"}
- 네이탈 주요 어스펙트(상위 5개):
${(astrologyAnalysis?.keyAspects || astrologyAnalysis?.major_aspects || []).slice(0, 5).map((a: string) => `  • ${a}`).join("\n") || "  • 데이터 없음"}
- 디그니티(품위): ${astrologyAnalysis?.dignityReport?.join(", ") || "없음"}
- 현재 트랜짓(외행성 → 네이탈 어스펙트):
${(astrologyAnalysis?.transits || []).slice(0, 8).map((t: string) => `  • ${t}`).join("\n") || "  • 데이터 없음"}

[트랜짓 해석 지침] 합=활성화, 사각=긴장/성장, 삼합=흐름/기회, 충=충돌/균형, 육분=소기회. 정점일 가까울수록 강함.
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
    "비겁": "자기 힘·독립심·경쟁의식이 강하며, 형제/동료와의 인연이 두드러짐",
    "식상": "표현력·창의력·재능 발산이 활발하며, 자유로운 활동을 추구함",
    "재성": "재물·현실 감각·실용성이 뛰어나며, 대인관계와 사교에 능함",
    "관성": "책임감·규율·사회적 지위에 대한 의식이 강하며, 조직 내 역할을 중시함",
    "인성": "학문·지혜·내면의 깊이가 있으며, 보호와 지원을 받는 경향",
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

/**
 * B-230: CCM(Card Combination Matching) 카드 조합 분석 강화
 */
function analyzeCardCombinations(cards: any[]): any[] {
  if (!cards || cards.length === 0) return [];
  const combinations: any[] = [];
  
  // 핵심 조합 룰 (Major Arcana 위주)
  const COMBO_RULES: Record<string, { type: string; meaning: string }> = {
    "The World+The Hermit": { type: "tension", meaning: "완성과 고독의 역설 — 성취했으나 내면은 재평가 중. 다음 사이클 진입 전 성찰 필요." },
    "The Tower+The Star": { type: "synergy", meaning: "붕괴 후 희망 — 충격적 변화 뒤에 치유와 새 비전이 온다." },
    "Death+The Sun": { type: "synergy", meaning: "끝과 시작의 동시성 — 낡은 것을 놓으면 밝은 전환이 따른다." },
    "The Moon+The High Priestess": { type: "amplify", meaning: "무의식 증폭 — 직관이 매우 강하나 환상과 혼동 주의." },
    "The Emperor+The Empress": { type: "synergy", meaning: "구조와 풍요의 균형 — 실행력과 수용성이 함께 작동." },
    "The Lovers+The Devil": { type: "tension", meaning: "진심과 집착의 경계 — 관계에서 건강한 선택이 필요." },
    "Wheel of Fortune+The Hanged Man": { type: "tension", meaning: "변화의 흐름 속 정지 — 타이밍을 기다려야 하는 시점." },
    "Strength+The Chariot": { type: "synergy", meaning: "내면의 힘과 추진력 결합 — 부드러운 의지로 돌파 가능." },
    "The Fool+Judgement": { type: "synergy", meaning: "새 출발과 각성 — 과거를 정산하고 순수한 마음으로 도약." },
    "The Magician+The High Priestess": { type: "synergy", meaning: "의지와 직관의 조화 — 현실적 능력과 내면 지혜를 동시 활용." },
    "Three of Swords+Ten of Swords": { type: "amplify", meaning: "이중 고통 신호 — 감정적 상처가 극에 달했으나 바닥은 반등의 시작." },
    "Ace of Cups+Ten of Cups": { type: "synergy", meaning: "감정의 시작과 완성 — 새 관계나 화해가 깊은 만족으로 이어질 잠재력." },
    "King of Wands+Queen of Wands": { type: "amplify", meaning: "화(火) 에너지 폭발 — 열정과 리더십이 극대화되나 소진 주의." },
  };

  // 역방향 키도 검색 (A+B = B+A)
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const nameA = cards[i]?.name || cards[i]?.card_name || "";
      const nameB = cards[j]?.name || cards[j]?.card_name || "";
      const keyAB = `${nameA}+${nameB}`;
      const keyBA = `${nameB}+${nameA}`;
      
      const rule = COMBO_RULES[keyAB] || COMBO_RULES[keyBA];
      if (rule) {
        combinations.push({
          cards: [nameA, nameB],
          positions: [i + 1, j + 1],
          type: rule.type,
          meaning: rule.meaning
        });
      }
    }
  }

  // 원소 기반 자동 분석 (룰에 없는 조합용)
  const suitCounts: Record<string, number> = {};
  const majorCount = cards.filter((c: any) => {
    const name = c?.name || c?.card_name || "";
    const suit = c?.suit || "";
    if (suit && suit !== "major") {
      suitCounts[suit] = (suitCounts[suit] || 0) + 1;
    }
    return !suit || suit === "major";
  }).length;

  if (majorCount >= 3) {
    combinations.push({
      cards: ["Major Arcana x" + majorCount],
      type: "amplify",
      meaning: `메이저 아르카나 ${majorCount}장 — 인생의 큰 전환점에 있음. 이 시기의 결정이 장기적 영향을 미침.`
    });
  }

  for (const [suit, count] of Object.entries(suitCounts)) {
    if (count >= 3) {
      const suitMeanings: Record<string, string> = {
        "Wands": `완드 ${count}장 — 행동·열정·의지 에너지 집중. 추진력은 강하나 번아웃 주의.`,
        "Cups": `컵 ${count}장 — 감정·관계·직관 에너지 집중. 마음의 흐름에 따르되 현실 점검 필요.`,
        "Swords": `소드 ${count}장 — 사고·갈등·결단 에너지 집중. 명확한 판단이 요구되는 시기.`,
        "Pentacles": `펜타클 ${count}장 — 물질·안정·현실 에너지 집중. 실질적 결과에 집중할 때.`
      };
      combinations.push({
        cards: [`${suit} x${count}`],
        type: "amplify",
        meaning: suitMeanings[suit] || `${suit} 원소 ${count}장 집중`
      });
    }
  }

  return combinations;
}

// ═══════════════════════════════════════════════
// B-256: 수비학 이름 기반 계산 (Numerology Name-based)
// ═══════════════════════════════════════════════

/**
 * 피타고라스 변환 테이블 (한글 -> 숫자)
 * ㄱ=1, ㄴ=2, ㄷ=3, ㄹ=4, ㅁ=5, ㅂ=6, ㅅ=7, ㅇ=8, ㅈ=9
 * ㅊ=1, ㅋ=2, ㅌ=3, ㅍ=4, ㅎ=5
 */
const HANGUL_CONSONANT_MAP: Record<string, number> = {
  'ㄱ': 1, 'ㄴ': 2, 'ㄷ': 3, 'ㄹ': 4, 'ㅁ': 5, 'ㅂ': 6, 'ㅅ': 7, 'ㅇ': 8, 'ㅈ': 9,
  'ㅊ': 1, 'ㅋ': 2, 'ㅌ': 3, 'ㅍ': 4, 'ㅎ': 5,
  'ㄲ': 1, 'ㄸ': 3, 'ㅃ': 6, 'ㅆ': 7, 'ㅉ': 9
};

/**
 * 모음 변환 테이블
 * ㅏ=1, ㅑ=2, ㅓ=3, ㅕ=4, ㅗ=5, ㅛ=6, ㅜ=7, ㅠ=8, ㅡ=9, ㅣ=1
 */
const HANGUL_VOWEL_MAP: Record<string, number> = {
  'ㅏ': 1, 'ㅑ': 2, 'ㅓ': 3, 'ㅕ': 4, 'ㅗ': 5, 'ㅛ': 6, 'ㅜ': 7, 'ㅠ': 8, 'ㅡ': 9, 'ㅣ': 1,
  'ㅐ': 2, 'ㅒ': 3, 'ㅔ': 4, 'ㅖ': 5, 'ㅘ': 6, 'ㅙ': 7, 'ㅚ': 6, 'ㅝ': 1, 'ㅞ': 2, 'ㅟ': 8, 'ㅢ': 1
};

/**
 * 영문 피타고라스 시스템 (A=1 ~ Z=8)
 */
const ENGLISH_NUMERO_MAP: Record<string, number> = {
  'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
  'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 6, 'P': 7, 'Q': 8, 'R': 9,
  'S': 1, 'T': 2, 'U': 3, 'V': 4, 'W': 5, 'X': 6, 'Y': 7, 'Z': 8
};

/**
 * 수비학 이름 계산 함수
 * - Expression Number: 전체 합산
 * - Soul Number: 모음 합산
 * - Personality Number: 자음 합산
 */
function calculateNameNumerology(name: string) {
  if (!name || name.trim() === "" || name === "이름없음") {
    return { expression: 0, soul: 0, personality: 0 };
  }

  let expressionSum = 0;
  let soulSum = 0;
  let personalitySum = 0;

  for (const char of name) {
    const code = char.charCodeAt(0);
    // 한글 유니코드 범위: 0xAC00 ~ 0xD7A3
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const relativeCode = code - 0xAC00;
      const choseongIdx = Math.floor(relativeCode / (21 * 28));
      const jungseongIdx = Math.floor((relativeCode % 588) / 28);
      const jongseongIdx = relativeCode % 28;

      const CHOSEONG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
      const JUNGSEONG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
      const JONGSEONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

      const cho = CHOSEONG[choseongIdx];
      const jung = JUNGSEONG[jungseongIdx];
      const jong = JONGSEONG[jongseongIdx];

      // 초성 (자음)
      const choVal = HANGUL_CONSONANT_MAP[cho] || 0;
      expressionSum += choVal;
      personalitySum += choVal;

      // 중성 (모음)
      const jungVal = HANGUL_VOWEL_MAP[jung] || 0;
      expressionSum += jungVal;
      soulSum += jungVal;

      // 종성 (자음)
      if (jong) {
        const JONG_DECOMP: Record<string, string[]> = {
          'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'],
          'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'],
          'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'],
          'ㅀ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ']
        };
        const parts = JONG_DECOMP[jong] || [jong];
        parts.forEach(p => {
          const val = HANGUL_CONSONANT_MAP[p] || 0;
          expressionSum += val;
          personalitySum += val;
        });
      }
    } else if (/[a-zA-Z]/.test(char)) {
      const upper = char.toUpperCase();
      const val = ENGLISH_NUMERO_MAP[upper] || 0;
      expressionSum += val;
      if (['A', 'E', 'I', 'O', 'U'].includes(upper)) {
        soulSum += val;
      } else {
        personalitySum += val;
      }
    }
  }

  const reduceNumber = (num: number): number => {
    if (num === 0) return 0;
    while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
      num = num.toString().split("").reduce((acc, digit) => acc + (parseInt(digit) || 0), 0);
    }
    return num;
  };

  return {
    expression: reduceNumber(expressionSum),
    soul: reduceNumber(soulSum),
    personality: reduceNumber(personalitySum)
  };
}

export async function runFullProductionEngineV8(supabaseClient: any, apiKey: string, input: any) {
  const pipelineStart = Date.now();
  const sessionId = input.sessionId;
  const tarotCards = input.cards || [];
  const combinationClues = tarotCards
    .map((c: any) => `- ${c.korean}: ${c.cardCombination || "정보 없음"}`)
    .join('\n');

  // Normalize birthInfo: client sends {birthDate:"1987-07-17", birthTime:"15:30", gender:"male"}
  const rawBirth = input.birthInfo || {};
  // B-228 + B-225: 출생시간 "모름" 처리 표준화
  const hasTime = rawBirth.birthTime !== "" && rawBirth.birthTime !== null && rawBirth.birthTime !== undefined && rawBirth.birthTime !== "모름";

  let birthInfo: any;

  if (rawBirth.year !== undefined) {
    birthInfo = rawBirth;
  } else {
    // 1) birthDate 정규화 — 다양한 소스 대응
    let rawDate: string = rawBirth.birthDate ?? rawBirth.birth_date ?? rawBirth.date ?? "";
    rawDate = rawDate.toString().trim();
    let y: number, m: number, d: number;

    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(rawDate)) {
      [y, m, d] = rawDate.split("-").map(Number);
    } else if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(rawDate)) {
      [y, m, d] = rawDate.split("/").map(Number);
    } else if (/^\d{8}$/.test(rawDate)) {
      y = +rawDate.slice(0, 4);
      m = +rawDate.slice(4, 6);
      d = +rawDate.slice(6, 8);
    } else if (rawDate) {
      const fallback = new Date(rawDate);
      if (!isNaN(fallback.getTime())) {
        y = fallback.getFullYear();
        m = fallback.getMonth() + 1;
        d = fallback.getDate();
      } else {
        console.error("[birthInfo] 파싱 실패 — rawDate:", JSON.stringify(rawDate), "rawBirth:", JSON.stringify(rawBirth));
        throw new Error(`생년월일 파싱 실패: "${rawDate}". YYYY-MM-DD 형식이 필요합니다.`);
      }
    } else {
      // 날짜 정보 없음 -> 기본값
      y = 2000; m = 1; d = 1;
      rawDate = "2000-01-01";
    }

    // 2) birthTime 정규화
    let rawTime: string = rawBirth.birthTime ?? rawBirth.birth_time ?? rawBirth.time ?? "";
    rawTime = rawTime.toString().trim();
    let hr: number, mn: number;
    if (/^\d{1,2}:\d{2}$/.test(rawTime)) {
      [hr, mn] = rawTime.split(":").map(Number);
    } else if (/^\d{1,2}$/.test(rawTime)) {
      hr = +rawTime; mn = 0;
    } else {
      hr = 12; mn = 0;
    }

    // 3) 유효성 검증
    if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
      throw new Error(`생년월일 범위 오류: ${y}-${m}-${d}`);
    }
    if (hr < 0 || hr > 23 || mn < 0 || mn > 59) { hr = 12; mn = 0; }

    birthInfo = {
      year: y, month: m, day: d, hour: hr, minute: mn,
      gender: rawBirth.gender === "male" || rawBirth.gender === "M" ? "M" : "F",
      birthDate: rawDate,
      birthTime: rawTime,
      isLunar: rawBirth.isLunar,
      isLeapMonth: rawBirth.isLeapMonth,
      // B-123 fix: birthPlace 텍스트 → 위도/경도 자동 변환 (주요 도시 테이블)
      ...(() => {
        let bPlace = rawBirth.birthPlace || "";
        let lat = rawBirth.latitude;
        let lng = rawBirth.longitude;
        
        // 출생지 기본값 처리 (서울)
        if (!bPlace || bPlace.trim() === "") {
          bPlace = "서울";
          if (!lat) lat = 37.5665;
          if (!lng) lng = 126.9780;
          console.log("[BIRTHPLACE DEFAULT]", { birthPlace: bPlace, latitude: lat, longitude: lng });
        }

        const CITY_COORDS: Record<string, [number, number]> = {
          "서울": [37.5665, 126.9780], "Seoul": [37.5665, 126.9780],
          "부산": [35.1796, 129.0756], "Busan": [35.1796, 129.0756],
          "대구": [35.8714, 128.6014], "Daegu": [35.8714, 128.6014],
          "인천": [37.4563, 126.7052], "Incheon": [37.4563, 126.7052],
          "광주": [35.1595, 126.8526], "Gwangju": [35.1595, 126.8526],
          "대전": [36.3504, 127.3845], "Daejeon": [36.3504, 127.3845],
          "울산": [35.5384, 129.3114], "Ulsan": [35.5384, 129.3114],
          "수원": [37.2636, 127.0286], "Suwon": [37.2636, 127.0286],
          "성남": [37.4449, 127.1388], "Seongnam": [37.4449, 127.1388],
          "도쿄": [35.6762, 139.6503], "Tokyo": [35.6762, 139.6503],
          "뉴욕": [40.7128, -74.0060], "New York": [40.7128, -74.0060],
          "런던": [51.5074, -0.1278], "London": [51.5074, -0.1278],
          "파리": [48.8566, 2.3522], "Paris": [48.8566, 2.3522],
        };
        const place = bPlace.trim();
        const exactMatch = CITY_COORDS[place];
        if (exactMatch) return { birthPlace: bPlace, latitude: exactMatch[0], longitude: exactMatch[1] };
        const partialKey = Object.keys(CITY_COORDS).find(k => place.includes(k) || k.includes(place));
        if (partialKey) return { birthPlace: bPlace, latitude: CITY_COORDS[partialKey][0], longitude: CITY_COORDS[partialKey][1] };
        return { birthPlace: bPlace, latitude: lat || 37.5665, longitude: lng || 126.9780 };
      })(),
    };
  }

  // Debug/Monitoring용 Date 객체
  const birthDate = new Date(Date.UTC(birthInfo.year, birthInfo.month - 1, birthInfo.day, birthInfo.hour, birthInfo.minute, 0));

  // 음력→양력 변환 적용
  const isLunar = !!(rawBirth.isLunar || rawBirth.isLunarDate);
  const isLeapMonthInput = !!rawBirth.isLeapMonth;
  
  const solarBirthInfo = isLunar
    ? (() => {
        const converted = lunarToSolarAccurate(
          birthInfo.year,
          birthInfo.month,
          birthInfo.day,
          isLeapMonthInput
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
          console.error('❌ [음력변환 실패] 유효하지 않은 변환 결과:', { birthInfo, converted });
          throw new Error("음력에서 양력으로 변환하는 데 실패했습니다. 날짜를 확인해 주세요.");
        }

        const result = { ...birthInfo, year: converted.year, month: converted.month, day: converted.day };
        console.log("[LUNAR→SOLAR]", { 
          input: { year: birthInfo.year, month: birthInfo.month, day: birthInfo.day }, 
          isLunar, 
          isLeapMonth: isLeapMonthInput,
          converted: { year: result.year, month: result.month, day: result.day },
          success: true 
        });
        return result;
      })()
    : { ...birthInfo };

  if (!isLunar) {
    console.log("[LUNAR→SOLAR] 양력 입력 유지:", { year: solarBirthInfo.year, month: solarBirthInfo.month, day: solarBirthInfo.day });
  }

  // Step 1: Physical Calculation Pipeline
    // 사주 계산 (동기)
    console.log("[SAJU INPUT TRACE]", {
      solarBirthInfo_year: solarBirthInfo.year,
      solarBirthInfo_month: solarBirthInfo.month,
      solarBirthInfo_day: solarBirthInfo.day,
      rawBirth_year: rawBirth.year,
      rawBirth_month: rawBirth.month,
      rawBirth_day: rawBirth.day,
      isLunar: rawBirth.isLunar
    });

    let sajuRaw: any = null;
    try {
      sajuRaw = calculateSaju(
        solarBirthInfo.year, solarBirthInfo.month, solarBirthInfo.day, 
        solarBirthInfo.hour, solarBirthInfo.minute, solarBirthInfo.gender,
        solarBirthInfo.longitude,
        hasTime
      );
      if (!sajuRaw) throw new Error("사주 계산 결과가 유효하지 않습니다.");
    } catch (e: any) {
      console.error("[ENGINE-SAFE] 사주 계산 실패:", e);
      throw new Error(`사주 분석 엔진 오류: ${e.message}`);
    }

    // 타로 심볼릭 (동기)
    const tarotSymbolic = runTarotSymbolicEngine(input.cards || [], input.question);
    // B-113: Card Context Matrix (CCM) — 동적 카드 의미 분석
    let ccmResult: ReturnType<typeof analyzeSpreadCCM> | null = null;
    try {
      const cardNames: string[] = (input.cards || []).map((c: any) => c.name).filter(Boolean);
      // B-142 fix: 카드 원본 position 필드 우선 사용, 없으면 인덱스 기반 폴백
      const positionFallback = ["past","present","future","advice","obstacle","outcome"];
      const cardPositions: Array<"past"|"present"|"future"|"advice"|"obstacle"|"outcome"> =
        (input.cards || []).map((c: any, i: number) => {
          const rawPos = (c.position || "").toLowerCase().trim();
          const posMap: Record<string, "past"|"present"|"future"|"advice"|"obstacle"|"outcome"> = {
            "past": "past", "과거": "past", "현재 상황": "present", "present": "present",
            "future": "future", "미래": "future", "가까운 결과": "future",
            "advice": "advice", "조언": "advice", "숨겨진 원인": "advice",
            "obstacle": "obstacle", "핵심 문제": "obstacle",
            "outcome": "outcome", "최종 결과": "outcome"
          };
          return posMap[rawPos] ?? (positionFallback[i] ?? "present") as "past"|"present"|"future"|"advice"|"obstacle"|"outcome";
        });
      if (cardNames.length > 0) {
        ccmResult = analyzeSpreadCCM(cardNames, cardPositions, (input.questionType || "general"));
      }
    } catch (e) {
      console.warn("[B-113] CCM error:", e);
    }

    // 점성술 (동기)
    let serverAstrology: any = null;
    try {
      serverAstrology = calculateServerAstrology(
        solarBirthInfo.year, solarBirthInfo.month, solarBirthInfo.day,
        hasTime ? solarBirthInfo.hour : 12, 
        hasTime ? solarBirthInfo.minute : 0,
        solarBirthInfo.latitude, solarBirthInfo.longitude,
        hasTime
      );
    } catch (e) {
      console.error("[ENGINE-SAFE] 점성술 계산 실패:", e);
    }

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
      confidence: serverAstrology.location_confidence,
      rawData: serverAstrology
    } : null;

    // 자미두수 시간 보정
    const ziweiLongitude = birthInfo.longitude || 127.5;
    const ziweiCorrectionMinutes = (ziweiLongitude - 135) * 4;
    const ziweiTotalMinutes = birthInfo.hour * 60 + (birthInfo.minute || 0) + ziweiCorrectionMinutes;
    const ziweiCorrectedHour = Math.floor(((ziweiTotalMinutes % 1440) + 1440) % 1440 / 60);
    const ziweiCorrectedMinute = ((ziweiTotalMinutes % 60) + 60) % 60;

    // B-57: 정밀 양력→음력 변환 (윤달 플래그 포함)
    let ziweiLunarMonth = 1;
    let ziweiLunarDay = 1;
    let ziweiIsLeapMonth = false;
    let ziweiSource = "unknown";

    if (isLunar) {
      // 음력 입력이면 원본 데이터를 그대로 사용 (매우 중요)
      ziweiLunarMonth = birthInfo.month;
      ziweiLunarDay = birthInfo.day;
      ziweiIsLeapMonth = isLeapMonthInput;
      ziweiSource = "원본음력";
    } else {
      // 양력 입력이면 양력->음력 역변환
      const lunarResult = solarToLunar(solarBirthInfo.year, solarBirthInfo.month, solarBirthInfo.day);
      ziweiLunarMonth = lunarResult.lunarMonth;
      ziweiLunarDay = lunarResult.lunarDay;
      ziweiIsLeapMonth = lunarResult.is_leap_month;
      ziweiSource = "양력→음력변환";
    }

    console.log("[ZIWEI INPUT]", { 
      year: birthInfo.year,
      ziweiLunarMonth, 
      ziweiLunarDay, 
      isLeap: ziweiIsLeapMonth,
      isLunar, 
      source: ziweiSource 
    });

    // 수비학 (생년월일 + 이름 기반)
    let numerologyResult: any = null;
    try {
      const baseResult = calculateNumerology(
        `${solarBirthInfo.year}-${String(solarBirthInfo.month).padStart(2,'0')}-${String(solarBirthInfo.day).padStart(2,'0')}`,
        new Date().getFullYear(),
        rawBirth.name || input.userName
      );

      // B-256: 이름 기반 수비학 추가
      const name = rawBirth.name || input.userName || "이름없음";
      const nameResult = calculateNameNumerology(name);

      numerologyResult = {
        ...baseResult,
        lifePath: baseResult.life_path_number,
        expression: nameResult.expression,
        soul: nameResult.soul,
        personality: nameResult.personality,
        data_quality_score: 0.85 // 상향
      };

      console.log("[NUMEROLOGY NAME]", { 
        name, 
        expression: nameResult.expression, 
        soul: nameResult.soul, 
        personality: nameResult.personality 
      });
    } catch (e) {
      console.error("[ENGINE-SAFE] 수비학 계산 실패:", e);
    }

    // B-228: 자미두수 건너뜀 및 정규화 통합 처리
    let ziweiAnalysis: any = null;
    const genderZiwei = (birthInfo.gender === "M" || birthInfo.gender === "male") ? "male" as const : "female" as const;
    let serverZiwei: any = null;
    try {
      /**
       * 자미두수 시간 기준 문서
       * ─────────────────────
       * 1. 입력: 음력 생년월일 + 경도보정 시간
       *    - isLunar=true → rawBirth.month/day를 그대로 음력으로 사용
       *    - isLunar=false → solarToLunar 변환 후 음력 월일 사용
       * 2. 시간: 경도보정(-30분) 적용된 correctedHour 사용
       *    - 예: 서울(127°) 04:35 → 04:03 (진시 辰時)
       * 3. 성별: gender 파라미터 그대로 전달
       * 4. 주의: 사주 엔진은 양력 기준, 자미두수는 음력 기준 (경로 독립)
       */
      serverZiwei = hasTime ? calculateServerZiWei(
        birthInfo.year, ziweiLunarMonth, ziweiLunarDay, ziweiCorrectedHour, ziweiCorrectedMinute, genderZiwei
      ) : null;
    } catch (e) {
      console.error("[ENGINE-SAFE] 자미두수 계산 실패:", e);
    }

    let ziweiWarnings: string[] = [];
    if (!hasTime) {
      ziweiAnalysis = {
        skipped: true,
        reason: "출생 시간이 필요합니다. 자미두수는 출생 시(時)를 기준으로 명궁을 결정하므로, 정확한 출생 시간 없이는 신뢰할 수 있는 결과를 제공할 수 없습니다."
      };
    } else if (serverZiwei) {
      // ── B-255: 록기충(祿忌沖) 검사 ──────────────────────────────────
      const dahanTransforms = serverZiwei?.currentMajorPeriod?.transformations || [];
      const annualTransforms = serverZiwei?.annualTransformations || [];

      for (const annual of annualTransforms) {
        for (const dahan of dahanTransforms) {
          // 같은 별에 화록+화기 또는 화기+화록이 걸린 경우
          if (annual.star === dahan.star) {
            if ((annual.type === "화기" && dahan.type === "화록") ||
                (annual.type === "화록" && dahan.type === "화기")) {
              ziweiWarnings.push(
                `⚠️ 록기충: ${annual.star}에 대한화${dahan.type === "화록" ? "록" : "기"}과 유년화${annual.type === "화록" ? "록" : "기"}이 동시 작용 → ${annual.palace || dahan.palace} 영역 길흉 혼재, 각별한 주의 필요`
              );
            }
          }
        }
      }

      ziweiAnalysis = {
        life_structure: serverZiwei.lifeStructure || "",
        palaces: serverZiwei.palaces.map((p: any) => {
          const majorStars = p.stars.filter((s: any) =>
            ["자미","천기","태양","무곡","천동","염정","천부","태음","탐랑","거문","천상","천량","칠살","파군"].includes(s.star)
          ).map((s: any) => s.star);
          return {
            name: p.name,
            main_stars: majorStars,
            location: p.branch,
            is_empty: (p as any).is_empty ?? (majorStars.length === 0),
            is_borrowed_stars: (p as any).is_borrowed_stars ?? false,
            borrowed_from: (p as any).borrowed_from ?? null,
          };
        }),
        key_insights: serverZiwei.keyInsights || [],
        major_period: serverZiwei.currentMajorPeriod || {},
        characteristics: [
          ...serverZiwei.palaces.flatMap((p: any) => p.stars.filter((s: any) =>
            ["파군", "자미", "천부", "칠살", "무곡", "태양", "천기", "염정"].includes(s.star)
          ).map((s: any) => s.star)),
          ...serverZiwei.natalTransformations.map((t: any) => `${t.type} active`),
        ].filter(Boolean) as string[],
        period_analysis: serverZiwei.periodAnalysis || "",
        natal_transformations: serverZiwei.natalTransformations || [],
        annual_transformations: serverZiwei.annualTransformations || [],
        ziwei_warnings: ziweiWarnings,
        annual_year: serverZiwei.annualYear || null,
        annual_gan: serverZiwei.annualGan || null,
        currentMinorPeriod: serverZiwei.currentMinorPeriod || null,
        patterns: serverZiwei.natalTransformations || [],
        mingGong: serverZiwei.mingGong,
        bureau: serverZiwei.bureau,
        currentMajorPeriod: serverZiwei.currentMajorPeriod,
        rawData: serverZiwei
      };
    }

    // 사주 구조 분석 + 질문 분류 병렬 실행
    const [sajuAnalysis, topicResult] = await Promise.all([
      analyzeSajuStructure(sajuRaw).catch(e => {
        console.error("[ENGINE-SAFE] 사주 구조 분석 실패:", e);
        return {
          characteristics: [], narrative: "분석 실패", elements: {}, tenGods: {},
          yongShin: "Unknown", heeShin: "Unknown", daewoon: null, interactions: [], shinsal: [],
          health_risk_tags: [], topic_shinsal_map: {}, strength: "Unknown"
        } as any;
      }),
      classifyWithFallback(input.question || "", apiKey).catch(e => {
        console.error("[ENGINE-SAFE] 질문 분류 실패:", e);
        return classifyQuestion(input.question || "");
      })
    ]);

    const finalTopic = topicResult?.primary_topic || input.questionType || "general_future";
    const secondaryTopic = topicResult?.secondary_topic || null;
    const detectedSubtopic = topicResult?.subtopic || null;
    const isDualTopic = secondaryTopic !== null && secondaryTopic !== finalTopic;

  const systemResults = [
    { 
      system: "saju", 
      fourPillars: {
        year: sajuRaw.year,
        month: sajuRaw.month,
        day: sajuRaw.day,
        hour: sajuRaw.hour
      },
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
    if (r.system === "ziwei") return !!r.palaces && !r.skipped;
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

  // B-179 fix: 복합 토픽일 때 두 토픽 가중치 평균 블렌딩
  let blendedWeights: Record<string, number> | undefined;
  if (isDualTopic && secondaryTopic) {
    const w1 = getTopicWeights(finalTopic as QuestionTopic);
    const w2 = getTopicWeights(secondaryTopic as QuestionTopic);
    const allKeys = new Set([...Object.keys(w1), ...Object.keys(w2)]);
    blendedWeights = {};
    allKeys.forEach(k => {
      blendedWeights![k] = ((w1[k] || 0) * 0.6 + (w2[k] || 0) * 0.4);
    });
    const total = Object.values(blendedWeights).reduce((s, v) => s + v, 0);
    if (total > 0) Object.keys(blendedWeights).forEach(k => blendedWeights![k] /= total);
  }

  const consensusResult = calculateConsensusWithTopic(
    patternVectors,
    finalTopic as QuestionTopic,
    hasTime,
    birthPlaceProvided,
    blendedWeights,
    systemResults
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

  let scores = {
    tarot:      tarotScoreDetail,
    saju:       sajuScoreDetail,
    ziwei:      ziweiScoreDetail,
    astrology:  astrologyScoreDetail,
    numerology: numerologyScoreDetail,
    overall:    parseFloat(((tarotScoreDetail.total + sajuScoreDetail.total + ziweiScoreDetail.total + astrologyScoreDetail.total + numerologyScoreDetail.total) / 5).toPrecision(3))
  };

  // Step 3: Narrative Engine (Gemini JSON) + Monitoring
  
  // ── age_context 계산 (B-237 fix: 프롬프트 생성 전으로 이동) ──
  const age_birthYear = solarBirthInfo?.year || birthInfo?.year;
  const age_birthMonth = solarBirthInfo?.month || birthInfo?.month;
  const age_birthDay = solarBirthInfo?.day || birthInfo?.day;
  const age_today = new Date();
  const age_currentYear = age_today.getFullYear();
  const age_currentMonth = age_today.getMonth() + 1;
  const age_currentDay = age_today.getDate();

  let internationalAge = age_currentYear - age_birthYear;
  if (age_currentMonth < age_birthMonth || (age_currentMonth === age_birthMonth && age_currentDay < age_birthDay)) {
    internationalAge -= 1;
  }
  const koreanAge = age_currentYear - age_birthYear + 1;
  const ageContext = {
    international_age: internationalAge,
    korean_age: koreanAge,
    year_age: age_currentYear - age_birthYear,
    birth_year: age_birthYear,
    standard_used: "international"
  };

  // Step 2-B: Mapping Saju Data for Prompt
  const { sajuDisplay, luckyFactors, ziweiPrompt, astrologyPrompt, sajuSymbolic } = buildEnginePrompts(input, sajuRaw, sajuAnalysis, ziweiAnalysis, astrologyAnalysis, ageContext);
  
  // B-230: 타로 카드 조합 분석 실행
  const cardCombos = analyzeCardCombinations(tarotCards);
  
  console.log("[DEBUG-CRASH] B-240 압축 코드 진입 직전");
  // B-240: [Compression] Gemini 프롬프트 최적화 (rawData 제거 및 필드 Pick)
  const promptAstroData = astrologyAnalysis ? {
    sun_sign: astrologyAnalysis.sun_sign,
    moon_sign: astrologyAnalysis.moon_sign,
    rising_sign: astrologyAnalysis.rising_sign,
    dominant_element: astrologyAnalysis.dominant_element,
    aspects: (astrologyAnalysis.aspects || []).slice(0, 10),
    planets: astrologyAnalysis.planets,
    houses: astrologyAnalysis.houses,
    transits: (astrologyAnalysis.transits || []).slice(0, 10),
    patterns: (astrologyAnalysis.patterns || []).slice(0, 10),
    confidence: astrologyAnalysis.confidence
  } : null;

  const promptZiweiData = (ziweiAnalysis && !ziweiAnalysis.skipped) ? {
    mingGong: ziweiAnalysis.mingGong,
    bureau: ziweiAnalysis.bureau,
    palaces: (ziweiAnalysis.palaces || []).map((p: any) => ({
      name: p.name,
      main_stars: p.main_stars,
      location: p.location,
      is_empty: p.is_empty,
      is_borrowed: p.is_borrowed_stars
    })),
    key_insights: (ziweiAnalysis.key_insights || []).slice(0, 5),
    natal_transformations: (ziweiAnalysis.natal_transformations || []).slice(0, 4),
    annual_transformations: (ziweiAnalysis.annual_transformations || []).slice(0, 4),
    major_period: ziweiAnalysis.major_period,
    currentMinorPeriod: ziweiAnalysis.currentMinorPeriod,
    period_analysis: typeof ziweiAnalysis.period_analysis === 'string' ? ziweiAnalysis.period_analysis.slice(0, 300) : ziweiAnalysis.period_analysis,
    characteristics: (ziweiAnalysis.characteristics || []).slice(0, 10)
  } : ziweiAnalysis;

  const ziweiDataStr = ziweiAnalysis?.skipped ? `(자미두수 데이터 없음: ${ziweiAnalysis.reason})` : JSON.stringify(promptZiweiData);
  const astrologyDataStr = astrologyAnalysis ? JSON.stringify(promptAstroData) : "(점성술 데이터 없음)";

  const astroNote = hasTime ? "" : "\n⚠️ 출생 시간 미입력: ASC/하우스 정보 없음. 태양/행성 위치 및 사인 위주로 해석할 것. 달 위치는 ±6° 오차 가능.";
  
  const daewoonPromptSection = sajuAnalysis.daewoon?.currentDaewoon
    ? `
- 현재 대운: ${sajuAnalysis.daewoon.currentDaewoon.full} (${sajuAnalysis.daewoon.currentDaewoon.startAge}~${sajuAnalysis.daewoon.currentDaewoon.endAge}세)
- 대운 천간 십성: ${sajuAnalysis.daewoon.currentDaewoon.tenGodStem}
- 대운 지지 십성: ${sajuAnalysis.daewoon.currentDaewoon.tenGodBranch}
- 대운 진행방향: ${sajuAnalysis.daewoon.isForward ? "순행" : "역행"}
- B-175 압축: 전체 대운 중 현재+다음 2개만 포함
- 다음 대운: ${sajuAnalysis.daewoon.pillars?.find((p: any) => p.index === (sajuAnalysis.daewoon.currentDaewoon.index || 0) + 1)?.full || "없음"}
    `
    : "- 대운 정보: 데이터 부족으로 생략";

  // ── B-238: 교차분석 엔진 신뢰도 필터 ──
  // 점성술 신뢰도 필터
  const astroConfidenceValue = astrologyAnalysis?.rawData?.location_confidence || 
                          astrologyAnalysis?.confidence || 1.0;
  let astroPromptNote = "";
  if (astroConfidenceValue === "very_low" || (typeof astroConfidenceValue === "number" && astroConfidenceValue < 0.5)) {
    astroPromptNote = "\n⚠️ 점성술 데이터 신뢰도: 매우 낮음. 출생시간 미입력 또는 출생지 미입력. ASC/하우스/달 위치를 직접 언급하지 마세요. '행성 배치 참고' 수준으로만 활용하세요.";
  } else if (typeof astroConfidenceValue === "number" && astroConfidenceValue < 0.8) {
    astroPromptNote = "\n⚠️ 점성술 데이터 신뢰도: 보통. ASC와 하우스 배치는 '추정'임을 명시하고, 태양/외행성 위치 위주로 해석하세요.";
  }

  // 자미두수 신뢰도 필터
  const ziweiSkippedFlag = ziweiAnalysis?.skipped === true;
  let ziweiPromptNote = "";
  if (ziweiSkippedFlag) {
    ziweiPromptNote = "\n⚠️ 자미두수: 출생시간 미입력으로 분석이 생략되었습니다. 자미두수 관련 내용을 언급하지 마세요.";
  } else {
    const ziweiConfidenceValue = ziweiAnalysis?.confidence || 1.0;
    if (typeof ziweiConfidenceValue === "number" && ziweiConfidenceValue < 0.7) {
      ziweiPromptNote = "\n⚠️ 자미두수 데이터 신뢰도: 낮음. 명궁/신궁 위치를 단정하지 말고 '참고 수준'으로만 언급하세요.";
    }
  }

  // 사주 신뢰도 필터 (시주 미상일 때)
  const hourPillarMissing = sajuRaw?.hour?.stem === "미상" || 
                            sajuRaw?.hour?.stem === "" ||
                            !sajuRaw?.hour?.stem;
  let sajuPromptNote = "";
  if (hourPillarMissing) {
    sajuPromptNote = "\n⚠️ 사주: 시주(시간 기둥) 미입력. 년월일 3주만으로 분석합니다. 시주 관련 십성/신살은 언급하지 마세요.";
  }

  console.log(`[DEBUG-userName] input.userName = "${input.userName}", type = ${typeof input.userName}`);
  const dataBlock = `
- [질문자 성함] ${input.userName || "님"}
[사주 엔진 호출 결과 - 상징화 완료]
${sajuSymbolic}${sajuPromptNote}
- 사주 4주: ${sajuDisplay.fourPillars}
- 일간(Day Master): ${sajuDisplay.dayMaster}
- 오행 분포: ${sajuDisplay.elements}
- 용신(Yong-Shin): ${sajuDisplay.yongShin}
- 희신: ${sajuDisplay.heeShin}
- 신강/신약: ${sajuDisplay.strength}
- 태어난 절기: ${sajuDisplay.termName}
${sajuDisplay.isDaewoonChanging ? `- ⚠️ 대운 교체 임박: 현재 ${sajuDisplay.currentDaewoon} 대운이 곧 종료되고 ${sajuDisplay.nextDaewoon || "다음"} 대운으로 전환됩니다. 이 전환기의 심리적·운세적 변화를 반드시 분석에 반영하세요.` : `- 현재 대운: ${sajuDisplay.currentDaewoon || "데이터 없음"}`}
- 행운 요소: 색상(${luckyFactors.color}), 숫자(${luckyFactors.number}), 방향(${luckyFactors.direction})
- 대운 분석: ${daewoonPromptSection}
- 사주 세부 지표: ${JSON.stringify(sajuAnalysis?.characteristics || [])}
- 사주 상세 해석: ${sajuAnalysis?.narrative || "데이터 없음"}
- [핵심 정보] 연령대: ${ageContext?.international_age || "알 수 없음"}세 (만 나이), 한국나이 ${ageContext?.korean_age || "알 수 없음"}세
- 타로 카드 (5장 스프레드):
  1번 (현재 상황): ${tarotCards[0]?.korean || tarotCards[0]?.name || "기록 없음"} (${tarotCards[0]?.isReversed ? "역방향" : "정방향"})
  2번 (도전/장애): ${tarotCards[1]?.korean || tarotCards[1]?.name || "기록 없음"} (${tarotCards[1]?.isReversed ? "역방향" : "정방향"})
  3번 (조언): ${tarotCards[2]?.korean || tarotCards[2]?.name || "기록 없음"} (${tarotCards[2]?.isReversed ? "역방향" : "정방향"})
  4번 (내면/과정): ${tarotCards[3]?.korean || tarotCards[3]?.name || "기록 없음"} (${tarotCards[3]?.isReversed ? "역방향" : "정방향"})
  5번 (최종 결과/미래): ${tarotCards[4]?.korean || tarotCards[4]?.name || "기록 없음"} (${tarotCards[4]?.isReversed ? "역방향" : "정방향"})
- 타로 카드 조합 통찰(Clues):
${combinationClues}
${cardCombos.length > 0 ? `
### 카드 조합 분석 (Card Combinations)
아래 조합 패턴을 반드시 해석에 반영하세요. tension 타입은 갈등/주의 포인트로, synergy 타입은 시너지로, amplify 타입은 에너지 증폭으로 해석하세요.
${JSON.stringify(cardCombos, null, 2)}
` : ""}
- age_context: ${JSON.stringify(ageContext)}

[자미두수 분석 데이터]
${ziweiDataStr}${ziweiPromptNote}

[점성술 분석 데이터]${astroNote}${astroPromptNote}
${astrologyDataStr}
${astrologyPrompt}
- 하우스 포커스: ${finalTopic === "health" ? "6하우스(건강·일상)" : finalTopic === "career" ? "10하우스(직업·명예)" : finalTopic === "relationship" ? "7하우스(파트너십)" : finalTopic === "finance" ? "2하우스(재물)" : "전체 하우스"}

[자미두수 분석]
${ziweiPrompt}
- 소한궁: ${ziweiAnalysis?.currentMinorPeriod?.palace || "미확인"} → ${ziweiAnalysis?.currentMinorPeriod?.interpretation || ""}
- 유년사화(${ziweiAnalysis?.annual_year || "올해"}): ${(ziweiAnalysis?.annual_transformations as any[])?.map((t: any) => t.description).join(", ") || "없음"}
- 선천사화: ${(ziweiAnalysis?.natal_transformations as any[])?.slice(0, 4).map((t: any) => `${t.type}(${t.star}→${t.palace})`).join(", ") || "없음"}
- 자미두수 포커스: ${finalTopic === "health" ? "질액궁" : finalTopic === "career" ? "관록궁" : finalTopic === "relationship" ? "부처궁" : finalTopic === "finance" ? "재백궁" : "명궁+관록궁"}${ziweiWarnings.length > 0 ? `\n- 자미두수 특별 경고: ${ziweiWarnings.join("; ")}` : ""}

[수비학 분석]
- 생명수 ${(numerologyResult as any)?.life_path_number || "?"}번: ${(numerologyResult as any)?.vibrations?.[0] || ""}
- 개인년 ${(numerologyResult as any)?.personal_year || "?"}: ${(numerologyResult as any)?.vibrations?.[3] || ""}
- 운명수: ${(numerologyResult as any)?.destiny_number || "없음"}

[통합 지표]
- 합의도: consensus_score=${consensusResult.consensus_score.toFixed(3)}
- 합의 신뢰도: confidence_score=${consensusResult.confidence_score.toFixed(3)}
- 충돌 요약: ${consensusResult.conflict_summary}
- 시간축 예측: ${JSON.stringify(temporalResult)?.slice(0, 200)}
- 질문 유형: ${finalTopic}${isDualTopic ? ` + ${secondaryTopic} (복합 질문)` : ""}
- 서브토픽: ${detectedSubtopic || "없음"}
- 유효 분석 시스템: ${activeEngines.length}개

[추가 분석 지침]
0. **타로 해석 원칙(최우선 순위)**: 카드의 전통적 의미는 참고만 하고, 질문자의 상황과 맥락에 맞게 유연하게 해석할 것. '이 카드는 ~을 의미합니다' 같은 단정 표현 대신 '이 자리에서 이 카드는 ~의 흐름을 보여줍니다' 형태로 표현할 것. 카드 조합 분석(Card Combinations)이 제공된 경우, 개별 카드 해석 외에 반드시 '카드 간 관계' 섹션을 포함하여 조합의 긴장, 시너지, 증폭 패턴을 설명하세요.
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

### 데이터 정확성 규칙 (절대 준수)
1. 위에 제공된 [사주 데이터], [점성술 데이터], [자미두수 데이터], [타로 카드] 블록에 명시된 값만 사용하세요.
2. 데이터 블록에 없는 별자리 이름, 궁 이름, 도수, 별 이름, 신살 이름을 절대 만들어내지 마세요.
3. null, "미상", skipped로 표시된 항목은 리딩에서 언급하지 마세요.
4. 숫자(도수, 점수, 퍼센트)를 인용할 때는 데이터 블록의 값을 그대로 사용하세요. 반올림하거나 변형하지 마세요.
5. "~일 수 있습니다", "~로 추정됩니다" 같은 추측 표현 대신, 데이터가 있으면 단정적으로, 없으면 아예 언급하지 마세요.
6. 데이터 블록에 ⚠️ 경고가 있는 엔진의 구체적 수치(궁 이름, 별자리, 도수)는 언급하지 마세요. 해당 엔진은 "전반적 에너지 흐름" 수준으로만 참고하세요.
`;

  const totalSystems = activeEngines.length;
  const validStyles = ['hanna', 'monad', 'e7l3', 'e5l5', 'l7e3'];
  const requestedStyle = validStyles.includes(input.style) ? input.style : 'hanna';
  const locale = input.locale || 'kr';

  // --- Step 1: Core Reading (Style-independent, Neutral) ---
  const coreHash = (input.cards || []).map((c: any) => c.name || "card").join("-") + `_core_${locale}`;
  const { data: cachedCore } = await supabaseClient
    .from("reading_results")
    .select("reading_json")
    .eq("session_id", sessionId)
    .eq("spread_hash", coreHash)
    .eq("reading_version", READING_VERSION)
    .maybeSingle();

  let coreReading: any = input.coreReading;
  let coreGeminiLatency = 0;

  if (coreReading) {
    console.log(`[PlatformV9] Reusing provided Core Reading from payload.`);
  } else if (cachedCore?.reading_json) {
    console.log(`[PlatformV9] Core Reading Cache Hit: ${coreHash}`);
    coreReading = cachedCore.reading_json;
  } else {
    console.log(`[PlatformV9] Generating New Core Reading...`);
    const corePrompt = buildCoreReadingPrompt(locale, dataBlock, totalSystems);
    const coreStart = Date.now();
    // coreReading: 2.5-flash (고품질 분석, 유지)
    console.log("[MODEL]", { task: "코어분석", model: "gemini-2.5-flash" });
    const rawCore = await fetchGemini(apiKey, "gemini-2.5-flash", corePrompt, "", 0.15);
    coreGeminiLatency = Date.now() - coreStart;
    
    try {
      coreReading = JSON.parse(rawCore.replace(/```json|```/g, ""));
      // Cache core reading
      if (sessionId && coreReading) {
        await supabaseClient.from("reading_results").insert({
          session_id: sessionId,
          question: input.question,
          spread_hash: coreHash,
          reading_version: READING_VERSION,
          reading_json: coreReading
        });
      }
    } catch (e) {
      console.error("Core Reading Parse Error:", e, rawCore);
      coreReading = { overall_conclusion: "분석 데이터를 파싱하는 중 오류가 발생했습니다." };
    }
  }

  // --- Step 2: Style Apply (Persona & Tone) ---
  const STYLE_TEMP_MAP: Record<string, number> = { hanna: 0.4, monad: 0.5, e7l3: 0.45, e5l5: 0.45, l7e3: 0.35 };
  const requestedTemp = STYLE_TEMP_MAP[requestedStyle] || 0.4;
  
  const stylePrompt = buildStyleApplyPrompt(locale, JSON.stringify(coreReading), requestedStyle, totalSystems);
  const styleStart = Date.now();
  let rawNarrative: string = "";
  let responseType: "valid_json" | "fallback_text" | "parse_error" | "schema_mismatch" | "timeout" | "skipped" = "valid_json";
  let geminiLatency = 0;

  if (input.mode === "data-only") {
    console.log("[PlatformV9] Skipping Style Application (Data-Only Mode)");
    responseType = "skipped";
    rawNarrative = "{}";
  } else {
    try {
      // styleApply: 2.5-flash-lite (비용 절감, 단순 스타일 적용)
      console.log("[MODEL]", { task: "스타일적용", model: "gemini-2.5-flash-lite" });
      rawNarrative = await fetchGemini(apiKey, "gemini-2.5-flash-lite", stylePrompt, "", requestedTemp);
      geminiLatency = Date.now() - styleStart;
      console.log("[PlatformV9] Style Application Latency:", geminiLatency, "ms");
    } catch (e: any) {
      console.error("Style Application Gemini call failed:", e);
      responseType = "timeout";
      rawNarrative = "FETCH_ERROR: " + e.message;
    }
  }

  // --- Step 3: Parsing & Merging ---
  let parsed: any;
  let schemaResult = { passed: true, missing: [] as string[], extra: [] as string[] };
  let parseSuccess = true;
  const initialFallback = buildFallbackReading("", grade, scores, tarotCards, input.question, requestedStyle);

  if (responseType === "skipped") {
    parsed = buildFallbackReading("데이터 분석 전용 모드입니다.", grade, scores, tarotCards, input.question, requestedStyle);
  } else {
    try {
      parsed = safeParseGeminiJSON(rawNarrative, initialFallback);
      if (!parsed || Object.keys(parsed).length === 0) {
        responseType = "parse_error";
        parsed = initialFallback;
        parseSuccess = false;
      } else {
        schemaResult = validateV3Schema(parsed);
        if (!schemaResult.passed) {
          responseType = "schema_mismatch";
          parsed = patchMissingFields(parsed, scores, grade, tarotCards);
        }
      }
    } catch (_e) {
      responseType = "fallback_text";
      parsed = initialFallback;
      parseSuccess = false;
    }
  }

  // --- Step 4: Metadata Patching ---
  // coreReading에서 계산된 점수 반영
  // Gemini가 반환한 scores는 엔진 계산값을 0으로 덮어쓸 위험이 있으므로 병합하지 않음
  console.log("[SCORES]", JSON.stringify(scores));

  const modelInput = stylePrompt || "";

  // 비동기 모니터링
  logMonitoringEvent(supabaseClient, {
    sessionId,
    engineVersion: READING_VERSION,
    geminiModel: input.mode === "data-only" ? "none" : "gemini-2.5-flash-lite",
    responseType,
    parseSuccess,
    schemaValidationPassed: schemaResult.passed,
    missingFields: schemaResult.missing,
    extraFields: schemaResult.extra,
    geminiLatencyMs: geminiLatency + coreGeminiLatency,
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
  // B-228: data-only 모드 시 system_calculations에 원본 데이터 보존 (프론트 표시용)
  if (input.mode === "data-only") {
    parsed.system_calculations = {
      ...parsed.system_calculations,
      saju: sajuAnalysis,
      astrology: astrologyAnalysis,
      ziwei: ziweiAnalysis,
      numerology: numerologyResult
    };
  }

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
    prediction_strength: consensusResult.prediction_strength,
    engine_reliability: consensusResult.engine_reliability,
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
            stars.includes("관성") ? "관성 활성 → 직업/사회적 지위 변동 시사" : null,
            stars.includes("식상") ? "식상 활성 → 창의·표현 에너지 증가" : null,
            stars.includes("재성") ? "재성 활성 → 재물 흐름 변동" : null,
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

  // ── age_context 생성 (#85) — 위에서 계산한 값 사용 ────────────────

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
    error_message: null,
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
    coreReading: coreReading,
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

  // ── data_quality_score (0~0.85) ─────────────────────────────
  let dq = 0;
  if (sysData && sysData.characteristics?.length > 0) dq += 0.2;
  if (dataPoints.length > 0) dq += 0.15;
  if (dataPoints.length >= 3) dq += 0.05;

  // numerology만 엔진에서 전달된 score가 있으면 우선 적용 (이름 계산 시 0.85)
  if (systemName === "numerology" && sysData?.data_quality_score) {
    dq = sysData.data_quality_score;
  } else if (systemName === "numerology" && sysData?.life_path_number) {
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

async function fetchGemini(apiKey: string, model: string, system: string, _user: string, temperature: number = 0.2): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: system }] }],
    generationConfig: {
      maxOutputTokens: 16384,
      temperature: temperature
    }
  });

  // B-204 + 503 Retry logic
  const doFetch = async (attempt: number = 0): Promise<string> => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody
    });

    if (!response.ok) {
      const errText = await response.text();
      // 503 Retry logic (Max 3 retries)
      if (response.status === 503 && attempt < 3) {
        const waitMs = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
        console.log("[GEMINI RETRY]", { attempt: attempt + 1, statusCode: 503, waitMs });
        await new Promise(resolve => setTimeout(resolve, waitMs));
        return doFetch(attempt + 1);
      }
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  };

  // 1차 시도
  let result = await doFetch();

  // B-204: 빈 응답이면 1초 대기 후 1회 추가 재시도 (팩트체크용)
  if (!result || result === "{}") {
    console.warn("[B-204] Gemini 빈 응답 감지 → 1초 후 재시도");
    await new Promise(resolve => setTimeout(resolve, 1000));
    result = await doFetch(); // 여기서도 doFetch 내부의 503 로직은 작동함
    if (!result || result === "{}") {
      console.error("[B-204] 재시도 후에도 빈 응답 → fallback 진행");
    } else {
      console.log("[B-204] 재시도 성공");
    }
  }

  return result || "{}";
}

export async function fetchGeminiStream(apiKey: string, model: string, system: string): Promise<ReadableStream<Uint8Array>> {
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;
  
  const doFetch = async (attempt: number = 0): Promise<Response> => {
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
      // 503 Retry logic (Max 3 retries)
      if (response.status === 503 && attempt < 3) {
        const waitMs = Math.pow(2, attempt + 1) * 1000;
        console.log("[GEMINI RETRY]", { attempt: attempt + 1, statusCode: 503, waitMs });
        await new Promise(resolve => setTimeout(resolve, waitMs));
        return doFetch(attempt + 1);
      }
      throw new Error(`Gemini Stream API error: ${response.status} - ${errText}`);
    }
    return response;
  };

  const response = await doFetch();

  if (!response.body) throw new Error("No response body for streaming");
  return response.body;
}

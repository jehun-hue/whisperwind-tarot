/**
 * integratedReadingEngine.ts (v9)
 * - Production AI Symbolic Prediction Engine Platform.
 * - Runtime Flow: Calc -> Pattern -> Semantic -> Consensus -> Temporal -> Validation -> Narrative.
 * - v9 蹂寃쎌궗?? Mock ?먯꽦???먮??먯닔 ?쒓굅 ???꾨줎???ㅺ퀎???곗씠???ъ슜
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
 * ?듯빀 由щ뵫 ?붿쭊 V8
 * 
 * ?좎쭨 泥섎━ 洹쒖튃:
 * - ?ъ＜/?먯꽦?? ?묐젰(Solar) 湲곗? ??solarBirthInfo ?ъ슜
 * - ?먮??먯닔: ?뚮젰(Lunar) 湲곗? ??rawBirth ?먮뒗 solarToLunar 蹂?섍컪 ?ъ슜
 * - ?섎퉬?? ?묐젰 湲곗?
 * - ?濡? ?좎쭨 臾닿? (移대뱶 湲곕컲)
 * 
 * ?쒓컙 蹂댁젙: 寃쎈룄 湲곕컲 吏꾪깭?묒떆 蹂댁젙 ?곸슜 (湲곕낯 ?쒖슱 127째E ??-30遺?
 */
const READING_VERSION = "v9_symbolic_prediction_engine";

/**
 * ?꾨줎?몄뿉???꾨떖諛쏆? ?먯꽦???곗씠?곕? ?붿쭊 ?대? ?щ㎎?쇰줈 蹂?? * src/lib/astrology.ts??AstrologyResult ???붿쭊??援ъ“
 */
function transformAstrologyData(frontAstro: any): any {
  if (!frontAstro) return createFallbackAstrology();

  const planets = frontAstro.planets || [];
  const planet_positions = planets.map((p: any) => ({
    planet: p.name || p.planet,
    sign: p.sign,
    house: p.house,
    degree: p.degree,
    dignity: p.dignity || "?놁쓬",
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
      if (d.dignity === "蹂몄쥖" || d.dignity === "怨좎뼇") {
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
 * ?꾨줎?몄뿉???꾨떖諛쏆? ?먮??먯닔 ?곗씠?곕? ?붿쭊 ?대? ?щ㎎?쇰줈 蹂?? * src/lib/ziwei.ts??ZiWeiResult ???붿쭊??援ъ“
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
        if (["?뚭뎔", "?먮?", "泥쒕?", "移좎궡", "臾닿끝", "?쒖뼇", "泥쒓린", "?쇱젙"].includes(star)) {
          characteristics.push(star);
        }
      });
    }
  });

  if (frontZiwei.fourTransformations || frontZiwei.siHwa) {
    const ft = frontZiwei.fourTransformations || frontZiwei.siHwa;
    if (ft.rok || ft.?붾줉) characteristics.push("?붾줉 active");
    if (ft.gwon || ft.?붽텒) characteristics.push("?붽텒 active");
    if (ft.gwa || ft.?붽낵) characteristics.push("?붽낵 active");
    if (ft.gi || ft.?붽린) characteristics.push("?붽린 active");
  }

  const mingGong = palaces.find((p: any) => p.name === "紐낃턿");
  if (mingGong && mingGong.main_stars.length > 0) {
    characteristics.push("Main star active");
  }

  const caiBai = palaces.find((p: any) => p.name === "?щ갚沅? || p.name === "?у툤沅?);
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

/** ?먯꽦???곗씠??誘몄쟾?????덉쟾??fallback */
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

/** ?먮??먯닔 ?곗씠??誘몄쟾?????덉쟾??fallback */
function createFallbackZiwei() {
  return {
    system: "ziwei",
    characteristics: [],
    palaces: [],
    four_transformations: {}
  };
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??// Testable Engine Helpers & Prompt Builders
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
export const getPillarFromData = (data: any, row: number) => {
  if (!data || !data[row]) return "";
  return (data[row][1] || "") + (data[row][2] || "");
};

export const getDayMasterFromData = (data: any) => {
  if (!data || !data[1]) return "Unknown";
  return data[1][1] || "Unknown";
};

/** dbSaju.yongsin.data媛 2李⑥썝 諛곗뿴??寃쎌슦瑜??꾪븳 ?ы띁 */
export const getYongShinFromData = (data: any, type: 'yong' | 'hee') => {
  if (!data) return "Unknown";
  if (Array.isArray(data)) {
    // 2李⑥썝 諛곗뿴 [??[?? 援ъ“?먯꽌 寃??(?? [[null, "麗?, null], [null, "??, null]])
    // ?⑹떊? 0踰??? ?ъ떊? 1踰??됱쑝濡?媛?뺥븯嫄곕굹 ?곗씠??議댁옱 ?щ?濡??먮떒
    const row = type === 'yong' ? 0 : 1;
    if (data[row] && Array.isArray(data[row])) {
      return data[row].find((v: any) => v && typeof v === 'string' && v.length === 1) || "Unknown";
    }
    return "Unknown";
  }
  return data[type] || "Unknown";
};

export const LUCKY_MAP: Record<string, any> = {
  "紐?: { color: "珥덈줉", number: "3, 8", direction: "?숈そ" },
  "??: { color: "珥덈줉", number: "3, 8", direction: "?숈そ" },
  "??: { color: "鍮④컯", number: "2, 7", direction: "?⑥そ" },
  "??: { color: "鍮④컯", number: "2, 7", direction: "?⑥そ" },
  "??: { color: "?몃옉/釉뚮씪??, number: "5, 0", direction: "以묒븰" },
  "??: { color: "?몃옉/釉뚮씪??, number: "5, 0", direction: "以묒븰" },
  "湲?: { color: "?곗깋", number: "4, 9", direction: "?쒖そ" },
  "??: { color: "?곗깋", number: "4, 9", direction: "?쒖そ" },
  "??: { color: "寃???⑥깋", number: "1, 6", direction: "遺곸そ" },
  "麗?: { color: "寃???⑥깋", number: "1, 6", direction: "遺곸そ" }
};

/** 
 * SYMBOLIC_MEANINGS: 
 * ?붿쭊?먯꽌 怨꾩궛쨌?곸쭠???꾨즺???곗씠?곗쓽 ?듭떖 ?댁꽍 吏移?
 * Gemini媛 ?ㅼ뒪濡?怨꾩궛?섏? ?딄퀬 ??"?뺣떟"??諛뷀깢?쇰줈 ?쒖닠?섍쾶 ??
 */
const SYMBOLIC_MEANINGS: Record<string, string> = {
  "Solar_Ming": "紐낃턿 二쇱꽦 ?쒖뼇(鸚ら쇋): 諛뺤븷二쇱쓽, 怨듬챸?뺣?, 由щ뜑?? ?몃?濡?諛쒖궛?섎뒗 ?먮꼫吏. ??몄쓣 ?꾪빐 鍮쏆쓣 鍮꾩텛???뺤옉 ?먯떊? 怨좊룆?????덉쓬.",
  "Jupiter_Cancer": "紐⑹꽦 寃뚯옄由??몃옖吏? ?뺤꽌???띿슂, 媛議굿룸궡遺 怨듬룞泥댁???寃곗냽 媛뺥솕, ?뺤꽌???덉젙 湲곕컲???뺤옣??",
  "Saturn_Aries": "?좎꽦 ?묒옄由?吏꾩엯: ?덈줈??吏덉꽌???섎┰, ?깃툒?⑥뿉 ???寃쎄퀬, ?몃궡瑜??듯븳 援ъ“??媛쒗쁺 ?꾩슂??",
  "Metal_Keum": "湲??? 湲곗슫: 寃곕떒?? ?섎━, ?숈궡吏湲??뺣━?섎뒗 ??. 遺議???留브퀬 ?딆쓬???쏀빐吏????덉쓬.",
  "Water_Su": "??麗? 湲곗슫: ?좎뿰?? 吏?? 移⑦닾?? 怨쇰떎 ???앷컖??源딆뼱 ?뺤껜?????덇퀬, 遺議????듯넻?깆씠 遺議깊빐吏?"
};

const TOPIC_MAPPING: Record<string, string[]> = {
  "relationship": ["relationship_union", "emotional_connection", "mutual_relationship", "partnership", "relationship_start", "emotional_opening", "marriage", "?곗븷", "?щ옉", "?몄뿰", "沅곹빀"],
  "reconciliation": ["endings", "transformation", "recovery", "patience", "introspection", "?ы쉶", "?대퀎", "洹몃━?"],
  "money": ["abundance", "financial_stability", "financial_adjustment", "financial_struggle", "wealth", "finance", "?щЪ", "湲덉쟾", "?ъ옄", "?섏씡"],
  "career": ["victory", "authority", "leadership", "structure", "initiative", "skill_use", "manifestation", "control", "planning", "career", "business", "吏곸옣", "?깃났", "紐낆삁"],
  "self_growth": ["intuition", "inner_guidance", "wisdom", "introspection", "healing", "renewal", "transformation", "hope", "self_growth", "study", "?깆옣", "怨듬?", "?쒗뿕"],
  "life_direction": ["sudden_change", "collapse", "endings", "life_reset", "life_transition", "cycle_change", "uncertainty", "movement", "timing_event", "諛⑺뼢", "?몄깮", "?댁꽭"],
  "health": ["healing", "recovery", "vitality", "inner_balance", "hope", "renewal", "emotional_healing", "stability", "rest", "嫄닿컯", "移섎즺", "?뚮났", "紐?, "?щ━"]
};

const CATEGORY_KOREAN: Record<string, string> = {
  "relationship": "?곗븷/沅곹빀",
  "reconciliation": "?ы쉶/?몄뿰",
  "money": "?щЪ/湲덉쟾",
  "career": "?숈뾽/而ㅻ━??,
  "self_growth": "?먯븘/?깆옣",
  "life_direction": "?몄깮??諛⑺뼢",
  "health": "嫄닿컯/?щ━",
  "general_future": "醫낇빀 ?댁꽭"
};

const TOPIC_PATTERNS: Record<string, Record<string, string[]>> = {
  money: {
    saju: ["?ъ꽦", "?앹긽", "?щЪ"],
    ziwei: ["?щ갚沅?],
    astrology: ["2?섏슦??, "紐⑹꽦"],
    tarot: ["Ace of Pentacles", "Ten of Pentacles", "Nine of Pentacles"]
  },
  career: {
    saju: ["愿??, "?멸?", "?뺢?"],
    ziwei: ["愿濡앷턿"],
    astrology: ["10?섏슦??, "?좎꽦"],
    tarot: ["The Emperor", "Eight of Pentacles", "Three of Pentacles"]
  },
  love: {
    saju: ["?ъ꽦", "?뺤옱", "愿??],
    ziwei: ["遺泥섍턿", "?먮?沅?],
    astrology: ["7?섏슦??, "湲덉꽦"],
    tarot: ["The Lovers", "Two of Cups", "Ace of Cups"]
  },
  health: {
    saju: ["?앹떊", "?곴?", "麗?, "??],
    ziwei: ["吏덉븸沅?],
    astrology: ["6?섏슦??, "?붿꽦"],
    tarot: ["The Star", "Temperance", "Four of Swords"]
  },
  family: {
    saju: ["?몄꽦", "?몄씤", "?뺤씤"],
    ziwei: ["遺紐④턿", "?뺤젣沅?, "?먮?沅?],
    astrology: ["4?섏슦??, "??],
    tarot: ["The Empress", "Ten of Cups", "Six of Cups"]
  },
  change: {
    saju: ["?멸?", "異?, "??],
    ziwei: ["?뚭뎔", "移좎궡"],
    astrology: ["泥쒖솗??, "紐낆솗??, "?몃옖吏?],
    tarot: ["The Tower", "Death", "Wheel of Fortune"]
  }
};

// ?뚮젰?믪뼇??蹂???⑥닔
/**
 * @deprecated Use lunarToSolarAccurate from lunarData.ts instead.
 * This internal version is kept for reference but not used in the main pipeline.
 */
function _deprecated_lunarToSolar(year: number, month: number, day: number, isLeapMonth: boolean = false): { year: number; month: number; day: number } {
  // 1900~2100???뚮젰?믪뼇??蹂???뚯씠釉?(二쇱슂 ?덉엯??湲곗?)
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
// B-57 + B-42 媛쒖꽑: ?묐젰?믪쓬???뺣? 蹂??(?붾퀎 ?????뚯씠釉?湲곕컲, ?ㅻ떖 吏??
interface LunarResult {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  is_leap_month: boolean;
  is_leap_month_adjusted: boolean;
}

function solarToLunar(solarYear: number, solarMonth: number, solarDay: number): LunarResult {
  // 媛??곕룄???뚮젰 ?곗씠?? [?ㅻ궇 ?묐젰?? ?ㅻ궇 ?묐젰?? ?붾퀎 ?좎닔[], ?ㅻ떖 ?꾩튂(-1=?놁쓬)]
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

  // ?대떦 ?곕룄???ㅻ궇 ?묐젰 ?좎쭨
  const toJulian = (y: number, m: number, d: number) =>
    Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d - 1524;

  const solarJD = toJulian(solarYear, solarMonth > 2 ? solarMonth : solarMonth, solarDay);

  // ?ㅻ궇 湲곗??쇰줈 ?대뒓 ?뚮젰 ?곕룄???랁븯?붿? ?먮퀎
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
      // ?ㅻ떖: leapMonth 踰덉㎏ ???ㅼ쓬???ㅻ떖 ?쎌엯
      if (leapMonth !== -1 && i === leapMonth) {
        // ?ㅻ떖 湲몄씠???대떦 ?ш낵 ?숈씪
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

  // ?대떦 ?곕룄 ?쒕룄
  if (data) {
    const result = calcLunar(solarJD, data, solarYear);
    if (result.lunarYear !== -1) return result;
  }

  // ?댁쟾 ?곕룄(?ㅻ궇 ?댁쟾??寃쎌슦)
  if (prevData) {
    const result = calcLunar(solarJD, prevData, solarYear - 1);
    if (result.lunarYear !== -1) return result;
  }

  // ?대갚
  return { lunarYear: solarYear, lunarMonth: solarMonth, lunarDay: solarDay, is_leap_month: false, is_leap_month_adjusted: false };
}

/** 24?덇린 ?쒓뎅??留ㅽ븨 (?낆텣 湲곗?) */
const KOREAN_SOLAR_TERMS = [
  "?낆텣", "寃쎌묩", "泥?챸", "?낇븯", "留앹쥌", "?뚯꽌",
  "?낆텛", "諛깅줈", "?쒕줈", "?낅룞", "???, "?뚰븳"
];

export function buildEnginePrompts(input: any, sajuRaw: any, sajuAnalysis: any, ziweiAnalysis?: any, astrologyAnalysis?: any, ageContext?: any) {
  const { birthInfo, sajuData: dbSaju } = input;
  
  // ?뚯뼇(?곈쇋) ?먮퀎 濡쒖쭅 異붽?
  const STEM_LIST = ["??, "阿?, "訝?, "訝?, "??, "藥?, "佯?, "渦?, "鶯?, "??];
  const BRANCH_LIST = ["耶?, "訝?, "野?, "??, "渦?, "藥?, "??, "??, "??, "??, "??, "雅?];
  
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
    yinyangMessage = "- [援ъ“???뱀쭠] 洹뱀쓬 援ъ“ ???대㈃??移섎??? ?덈???媛먯닔?? ?몃㈃蹂대떎 ?댁떎 異붽뎄\n";
  } else if (yangCount >= 7) {
    yinyangMessage = "- [援ъ“???뱀쭠] 洹뱀뼇 援ъ“ ???명뼢???먮꼫吏 怨쇰떎, 異⑸룞??二쇱쓽\n";
  }

  
  const sajuDisplay = {
    fourPillars: sajuRaw?.year ? 
      `?꾩＜ ${sajuRaw.year.stem}${sajuRaw.year.branch}, ?붿＜ ${sajuRaw.month.stem}${sajuRaw.month.branch}, ?쇱＜ ${sajuRaw.day.stem}${sajuRaw.day.branch}, ?쒖＜ ${sajuRaw.hour.stem}${sajuRaw.hour.branch}` :
      (dbSaju?.pillar?.data ? 
        `?꾩＜ ${getPillarFromData(dbSaju.pillar.data, 3)}, ?붿＜ ${getPillarFromData(dbSaju.pillar.data, 2)}, ?쇱＜ ${getPillarFromData(dbSaju.pillar.data, 1)}, ?쒖＜ ${getPillarFromData(dbSaju.pillar.data, 0)}` : 
        (dbSaju?.yearPillar ? `?꾩＜ ${dbSaju.yearPillar.hanja}, ?붿＜ ${dbSaju.monthPillar.hanja}, ?쇱＜ ${dbSaju.dayPillar.hanja}, ?쒖＜ ${dbSaju.hourPillar.hanja}` : "?곗씠???놁쓬")),
    dayMaster: (sajuRaw?.dayMaster && sajuRaw.dayMaster !== "Unknown") ? sajuRaw.dayMaster :
      (sajuAnalysis?.dayMaster && sajuAnalysis.dayMaster !== "Unknown") ? sajuAnalysis.dayMaster : 
      (dbSaju?.pillar?.data ? getDayMasterFromData(dbSaju.pillar.data) : (dbSaju?.dayPillar?.cheongan || "Unknown")),
    elements: (sajuAnalysis?.elements && Object.keys(sajuAnalysis.elements).length > 0) ? 
      Object.entries(sajuAnalysis.elements).map(([k, v]) => `${k}${v}`).join(" ") : 
      (dbSaju?.yinyang?.data ? `紐?{dbSaju.yinyang.data.wood || 0} ??{dbSaju.yinyang.data.fire || 0} ??{dbSaju.yinyang.data.earth || 0} 湲?{dbSaju.yinyang.data.metal || 0} ??{dbSaju.yinyang.data.water || 0}` : "遺꾩꽍 遺덇?"),
    yongShin: (sajuAnalysis?.yongShin && sajuAnalysis.yongShin !== "Unknown") ? sajuAnalysis.yongShin : 
      (dbSaju?.yongsin?.data ? getYongShinFromData(dbSaju.yongsin.data, 'yong') : "?곗씠??遺議?),
    heeShin: (sajuAnalysis?.heeShin && sajuAnalysis.heeShin !== "Unknown") ? sajuAnalysis.heeShin :
      (dbSaju?.yongsin?.data ? getYongShinFromData(dbSaju.yongsin.data, 'hee') : "?곗씠??遺議?),
    strength: (sajuAnalysis?.strength && sajuAnalysis.strength !== "Unknown") ? sajuAnalysis.strength : "遺꾩꽍 遺덇?",
    termName: (sajuRaw?.termIdx !== undefined) ? KOREAN_SOLAR_TERMS[sajuRaw.termIdx] : "?????놁쓬",
    // B-181 fix: ???援먯껜 ?꾨컯 ?뺣낫 異붽?
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

  const luckyFactors = LUCKY_MAP[sajuDisplay.yongShin] || { color: "?ㅼ뼇??, number: "?꾩껜", direction: "以묒븰" };

  // ?붿쭊 ?곸쭠??寃곌낵 (Calculated Symbolic Results)
  const mingGong = ziweiAnalysis?.palaces?.find((p: any) => p.name === "紐낃턿");
  const mingStars = mingGong?.main_stars?.join(", ") || "?곗씠??遺議?;
  
  const ziweiSymbolic = ziweiAnalysis?.skipped ? `(?먮??먯닔 ?곗씠???놁쓬: ${ziweiAnalysis.reason})` : `
- 紐낃턿(${ziweiAnalysis?.mingGong || "誘몄긽"}): ${mingStars} 醫뚯젙.
- 援? ${ziweiAnalysis?.bureau || "遺꾩꽍 遺덇?"}
- ?깅퀎: ${birthInfo.gender === 'M' ? '?뚮궓(?곁뵹)' : '?묐?(?썲Ⅳ)'}
- 吏移? ?쒓났??紐낅컲??援?낵 二쇱꽦 ?섎?瑜?以묒떖?쇰줈 由щ뵫???꾧컻?섏떆??
`;

  const astrologySymbolic = `
- 李⑦듃 二쇱슂 ?뱀쭠: ${astrologyAnalysis?.characteristics?.join(", ") || "?곗씠??遺議?}
- 吏移? ???붿쭊 ?몄텧 寃곌낵(?곸쭠)瑜?洹몃?濡??ъ슜?섍퀬, ?됱꽦 ?꾩튂瑜?吏곸젒 怨꾩궛?섏? 留덉떆??${sajuDisplay.has_time ? "" : " (?쒓컙 誘몄엯?? ?섏슦??遺꾩꽍 ?쒖쇅)"}
`;



  const ziweiPrompt = ziweiAnalysis?.skipped ? ziweiAnalysis.reason : `
[?먮??먯닔 ?붿쭊 ?몄텧 寃곌낵 - ?곸쭠???꾨즺]
${ziweiSymbolic}
- 湲곕낯?뺣낫: ${birthInfo.year}??${birthInfo.month}??${birthInfo.day}??${birthInfo.hour}??${birthInfo.minute}遺?(${birthInfo.gender === 'M' ? '?뚮궓 ?곁뵹' : '?묐? ?썲Ⅳ'})
- ?꾩옱 ??? ${ziweiAnalysis?.currentMajorPeriod?.interpretation || "?곗씠??遺議?}
- ?뚰븳: ${ziweiAnalysis?.currentMinorPeriod?.interpretation || "?곗씠??遺議?}
- ?좎쿇?ы솕: ${Array.isArray(ziweiAnalysis?.natal_transformations) ? ziweiAnalysis.natal_transformations.slice(0,4).map((t: any) => `${t.type}(${t.star}??{t.palace})`).join(", ") : "?곗씠??遺議?}
- B-175 ?뺤텞: 二쇱슂沅?紐?愿濡?遺泥?吏덉븸/泥쒖씠) + 怨듦턿留??쒖떆
${(ziweiAnalysis?.palaces || []).filter((p: any) => 
  ["紐낃턿","愿濡앷턿","遺泥섍턿","吏덉븸沅?,"泥쒖씠沅?].includes(p.name) || p.is_empty
).map((p: any) => {
  const starInfo = p.main_stars?.length > 0 ? p.main_stars.join(", ") : "怨듦턿(令뷴?)";
  const borrowedNote = p.is_borrowed_stars ? ` ?살감?깆븞沅?${p.borrowed_from || "?沅?}?먯꽌 李⑥슜)` : "";
  const emptyNote = p.is_empty ? " [怨듦턿]" : "";
  return `  * ${p.name}(${p.location}): ${starInfo}${emptyNote}${borrowedNote}`;
}).join("\n")}
`;

  const astrologyPrompt = `
[?먯꽦???붿쭊 ?몄텧 寃곌낵 - ?곸쭠???꾨즺]
${astrologySymbolic}
- ?쒖뼇: ${astrologyAnalysis?.sunSign || "誘몄긽"} / ?? ${astrologyAnalysis?.moonSign || "誘몄긽"} / ?곸듅沅? ${astrologyAnalysis?.risingSign || "誘몄긽(異쒖깮?쒓컙 ?꾩슂)"}
- 吏諛??먯냼: ${astrologyAnalysis?.dominant_element || astrologyAnalysis?.dominantElement || "誘몄긽"} / ?뱀쭏: ${astrologyAnalysis?.dominantQuality || "誘몄긽"}
- ?ㅼ씠??二쇱슂 ?댁뒪?숉듃(?곸쐞 5媛?:
${(astrologyAnalysis?.keyAspects || astrologyAnalysis?.major_aspects || []).slice(0, 5).map((a: string) => `  ??${a}`).join("\n") || "  ???곗씠???놁쓬"}
- ?붽렇?덊떚(?덉쐞): ${astrologyAnalysis?.dignityReport?.join(", ") || "?놁쓬"}
- ?꾩옱 ?몃옖吏??명뻾?????ㅼ씠???댁뒪?숉듃):
${(astrologyAnalysis?.transits || []).slice(0, 8).map((t: string) => `  ??${t}`).join("\n") || "  ???곗씠???놁쓬"}

[?몃옖吏??댁꽍 吏移? ???쒖꽦?? ?ш컖=湲댁옣/?깆옣, ?쇳빀=?먮쫫/湲고쉶, 異?異⑸룎/洹좏삎, ?〓텇=?뚭린?? ?뺤젏??媛源뚯슱?섎줉 媛뺥븿.
`;

  const tenGodsData = sajuAnalysis?.tenGods || {};
  const tenGodsStr = Object.entries(tenGodsData).length > 0
    ? Object.entries(tenGodsData)
        .filter(([, v]) => (v as number) > 0)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .map(([k, v]) => `${k}(${v})`)
        .join(" ")
    : "?곗씠???놁쓬";

  const TEN_GOD_MEANINGS: Record<string, string> = {
    "鍮꾧쾪": "?먭린 ?샕룸룆由쎌떖쨌寃쎌웳?섏떇??媛뺥븯硫? ?뺤젣/?숇즺????몄뿰???먮뱶?ъ쭚",
    "?앹긽": "?쒗쁽?Β룹갹?섎젰쨌?щ뒫 諛쒖궛???쒕컻?섎ŉ, ?먯쑀濡쒖슫 ?쒕룞??異붽뎄??,
    "?ъ꽦": "?щЪ쨌?꾩떎 媛먭컖쨌?ㅼ슜?깆씠 ?곗뼱?섎ŉ, ??멸?怨꾩? ?ш탳???ν븿",
    "愿??: "梨낆엫媛먃룰퇋?㉱룹궗?뚯쟻 吏?꾩뿉 ????섏떇??媛뺥븯硫? 議곗쭅 ????븷??以묒떆??,
    "?몄꽦": "?숇Ц쨌吏?쑣룸궡硫댁쓽 源딆씠媛 ?덉쑝硫? 蹂댄샇? 吏?먯쓣 諛쏅뒗 寃쏀뼢",
  };

  const dominantGods = Object.entries(tenGodsData)
    .filter(([, v]) => (v as number) > 0)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 3)
    .map(([k]) => `${k}(${TEN_GOD_MEANINGS[k] || ""})`)
    .join(", ");

  const sajuSymbolic = `
${yinyangMessage}- ?듭떖 湲곗슫: ${sajuDisplay.yongShin} ??[?곸쭠: ${SYMBOLIC_MEANINGS[sajuDisplay.yongShin === "麗? ? "Water_Su" : sajuDisplay.yongShin === "?? ? "Metal_Keum" : ""] || "?꾨Ц?붾맂 ?대㈃ ?먮꼫吏"}]
- ?붿냼 洹좏삎: ${sajuDisplay.elements}
- ??꽦(?곫삜) 遺꾪룷: ${tenGodsStr}
- 吏諛???꽦: ${dominantGods || "遺꾩꽍 遺덇?"} ??AI??????꽦???섎?瑜?吏덈Ц 二쇱젣? ?곌껐?섏뿬 ?댁꽍?섏꽭??
- ??꽦 ?댁꽍 吏移? ?뺢?쨌?멸? 媛뺥븯硫?吏곸뾽/議곗쭅 ?뺣컯, ?앹떊쨌?곴? 媛뺥븯硫?李쎌쓽/?쒗쁽 ?뺢뎄, ?몄옱쨌?뺤옱 媛뺥븯硫??щЪ ?먮쫫 ?쒖꽦, ?몄씤쨌?뺤씤 媛뺥븯硫??숈뒿/吏???먮꼫吏.
`;

  return { sajuDisplay, luckyFactors, ziweiPrompt, astrologyPrompt, sajuSymbolic };
}

/**
 * B-230: CCM(Card Combination Matching) 移대뱶 議고빀 遺꾩꽍 媛뺥솕
 */
function analyzeCardCombinations(cards: any[]): any[] {
  if (!cards || cards.length === 0) return [];
  const combinations: any[] = [];
  
  // ?듭떖 議고빀 猷?(Major Arcana ?꾩＜)
  const COMBO_RULES: Record<string, { type: string; meaning: string }> = {
    "The World+The Hermit": { type: "tension", meaning: "?꾩꽦怨?怨좊룆????꽕 ???깆랬?덉쑝???대㈃? ?ы룊媛 以? ?ㅼ쓬 ?ъ씠??吏꾩엯 ???깆같 ?꾩슂." },
    "The Tower+The Star": { type: "synergy", meaning: "遺뺢눼 ???щ쭩 ??異⑷꺽??蹂???ㅼ뿉 移섏쑀? ??鍮꾩쟾???⑤떎." },
    "Death+The Sun": { type: "synergy", meaning: "?앷낵 ?쒖옉???숈떆?????≪? 寃껋쓣 ?볦쑝硫?諛앹? ?꾪솚???곕Ⅸ??" },
    "The Moon+The High Priestess": { type: "amplify", meaning: "臾댁쓽??利앺룺 ??吏곴???留ㅼ슦 媛뺥븯???섏긽怨??쇰룞 二쇱쓽." },
    "The Emperor+The Empress": { type: "synergy", meaning: "援ъ“? ?띿슂??洹좏삎 ???ㅽ뻾?κ낵 ?섏슜?깆씠 ?④퍡 ?묐룞." },
    "The Lovers+The Devil": { type: "tension", meaning: "吏꾩떖怨?吏묒갑??寃쎄퀎 ??愿怨꾩뿉??嫄닿컯???좏깮???꾩슂." },
    "Wheel of Fortune+The Hanged Man": { type: "tension", meaning: "蹂?붿쓽 ?먮쫫 ???뺤? ????대컢??湲곕떎?ㅼ빞 ?섎뒗 ?쒖젏." },
    "Strength+The Chariot": { type: "synergy", meaning: "?대㈃???섍낵 異붿쭊??寃고빀 ??遺?쒕윭???섏?濡??뚰뙆 媛??" },
    "The Fool+Judgement": { type: "synergy", meaning: "??異쒕컻怨?媛곸꽦 ??怨쇨굅瑜??뺤궛?섍퀬 ?쒖닔??留덉쓬?쇰줈 ?꾩빟." },
    "The Magician+The High Priestess": { type: "synergy", meaning: "?섏?? 吏곴???議고솕 ???꾩떎???λ젰怨??대㈃ 吏?쒕? ?숈떆 ?쒖슜." },
    "Three of Swords+Ten of Swords": { type: "amplify", meaning: "?댁쨷 怨좏넻 ?좏샇 ??媛먯젙???곸쿂媛 洹뱀뿉 ?ы뻽?쇰굹 諛붾떏? 諛섎벑???쒖옉." },
    "Ace of Cups+Ten of Cups": { type: "synergy", meaning: "媛먯젙???쒖옉怨??꾩꽦 ????愿怨꾨굹 ?뷀빐媛 源딆? 留뚯”?쇰줈 ?댁뼱吏??좎옱??" },
    "King of Wands+Queen of Wands": { type: "amplify", meaning: "???? ?먮꼫吏 ??컻 ???댁젙怨?由щ뜑??씠 洹밸??붾릺???뚯쭊 二쇱쓽." },
  };

  // ??갑???ㅻ룄 寃??(A+B = B+A)
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

  // ?먯냼 湲곕컲 ?먮룞 遺꾩꽍 (猷곗뿉 ?녿뒗 議고빀??
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
      meaning: `硫붿씠? ?꾨Ⅴ移대굹 ${majorCount}?????몄깮?????꾪솚?먯뿉 ?덉쓬. ???쒓린??寃곗젙???κ린???곹뼢??誘몄묠.`
    });
  }

  for (const [suit, count] of Object.entries(suitCounts)) {
    if (count >= 3) {
      const suitMeanings: Record<string, string> = {
        "Wands": `?꾨뱶 ${count}?????됰룞쨌?댁젙쨌?섏? ?먮꼫吏 吏묒쨷. 異붿쭊?μ? 媛뺥븯??踰덉븘??二쇱쓽.`,
        "Cups": `而?${count}????媛먯젙쨌愿怨꽷룹쭅愿 ?먮꼫吏 吏묒쨷. 留덉쓬???먮쫫???곕Ⅴ???꾩떎 ?먭? ?꾩슂.`,
        "Swords": `?뚮뱶 ${count}?????ш퀬쨌媛덈벑쨌寃곕떒 ?먮꼫吏 吏묒쨷. 紐낇솗???먮떒???붽뎄?섎뒗 ?쒓린.`,
        "Pentacles": `?쒗???${count}????臾쇱쭏쨌?덉젙쨌?꾩떎 ?먮꼫吏 吏묒쨷. ?ㅼ쭏??寃곌낵??吏묒쨷????`
      };
      combinations.push({
        cards: [`${suit} x${count}`],
        type: "amplify",
        meaning: suitMeanings[suit] || `${suit} ?먯냼 ${count}??吏묒쨷`
      });
    }
  }

  return combinations;
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??// B-256: ?섎퉬???대쫫 湲곕컲 怨꾩궛 (Numerology Name-based)
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
/**
 * ?쇳?怨좊씪??蹂???뚯씠釉?(?쒓? -> ?レ옄)
 * ??1, ??2, ??3, ??4, ??5, ??6, ??7, ??8, ??9
 * ??1, ??2, ??3, ??4, ??5
 */
const HANGUL_CONSONANT_MAP: Record<string, number> = {
  '??: 1, '??: 2, '??: 3, '??: 4, '??: 5, '??: 6, '??: 7, '??: 8, '??: 9,
  '??: 1, '??: 2, '??: 3, '??: 4, '??: 5,
  '??: 1, '??: 3, '??: 6, '??: 7, '??: 9
};

/**
 * 紐⑥쓬 蹂???뚯씠釉? * ??1, ??2, ??3, ??4, ??5, ??6, ??7, ??8, ??9, ??1
 */
const HANGUL_VOWEL_MAP: Record<string, number> = {
  '??: 1, '??: 2, '??: 3, '??: 4, '??: 5, '??: 6, '??: 7, '??: 8, '??: 9, '??: 1,
  '??: 2, '??: 3, '??: 4, '??: 5, '??: 6, '??: 7, '??: 6, '??: 1, '??: 2, '??: 8, '??: 1
};

/**
 * ?곷Ц ?쇳?怨좊씪???쒖뒪??(A=1 ~ Z=8)
 */
const ENGLISH_NUMERO_MAP: Record<string, number> = {
  'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
  'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 6, 'P': 7, 'Q': 8, 'R': 9,
  'S': 1, 'T': 2, 'U': 3, 'V': 4, 'W': 5, 'X': 6, 'Y': 7, 'Z': 8
};

/**
 * ?섎퉬???대쫫 怨꾩궛 ?⑥닔
 * - Expression Number: ?꾩껜 ?⑹궛
 * - Soul Number: 紐⑥쓬 ?⑹궛
 * - Personality Number: ?먯쓬 ?⑹궛
 */
function calculateNameNumerology(name: string) {
  if (!name || name.trim() === "" || name === "?대쫫?놁쓬") {
    return { expression: 0, soul: 0, personality: 0 };
  }

  let expressionSum = 0;
  let soulSum = 0;
  let personalitySum = 0;

  for (const char of name) {
    const code = char.charCodeAt(0);
    // ?쒓? ?좊땲肄붾뱶 踰붿쐞: 0xAC00 ~ 0xD7A3
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const relativeCode = code - 0xAC00;
      const choseongIdx = Math.floor(relativeCode / (21 * 28));
      const jungseongIdx = Math.floor((relativeCode % 588) / 28);
      const jongseongIdx = relativeCode % 28;

      const CHOSEONG = ['??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??];
      const JUNGSEONG = ['??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??];
      const JONGSEONG = ['', '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '?', '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??, '??];

      const cho = CHOSEONG[choseongIdx];
      const jung = JUNGSEONG[jungseongIdx];
      const jong = JONGSEONG[jongseongIdx];

      // 珥덉꽦 (?먯쓬)
      const choVal = HANGUL_CONSONANT_MAP[cho] || 0;
      expressionSum += choVal;
      personalitySum += choVal;

      // 以묒꽦 (紐⑥쓬)
      const jungVal = HANGUL_VOWEL_MAP[jung] || 0;
      expressionSum += jungVal;
      soulSum += jungVal;

      // 醫낆꽦 (?먯쓬)
      if (jong) {
        const JONG_DECOMP: Record<string, string[]> = {
          '??: ['??, '??], '??: ['??, '??], '??: ['??, '??],
          '??: ['??, '??], '??: ['??, '??], '??: ['??, '??],
          '??: ['??, '??], '??: ['??, '??], '??: ['??, '??],
          '?': ['??, '??], '??: ['??, '??]
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
    .map((c: any) => `- ${c.korean}: ${c.cardCombination || "?뺣낫 ?놁쓬"}`)
    .join('\n');

  // Normalize birthInfo: client sends {birthDate:"1987-07-17", birthTime:"15:30", gender:"male"}
  const rawBirth = input.birthInfo || {};
  // B-228 + B-225: 異쒖깮?쒓컙 "紐⑤쫫" 泥섎━ ?쒖???  const hasTime = rawBirth.birthTime !== "" && rawBirth.birthTime !== null && rawBirth.birthTime !== undefined && rawBirth.birthTime !== "紐⑤쫫";

  let birthInfo: any;

  if (rawBirth.year !== undefined) {
    birthInfo = rawBirth;
  } else {
    // 1) birthDate ?뺢퇋?????ㅼ뼇???뚯뒪 ???    let rawDate: string = rawBirth.birthDate ?? rawBirth.birth_date ?? rawBirth.date ?? "";
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
        console.error("[birthInfo] ?뚯떛 ?ㅽ뙣 ??rawDate:", JSON.stringify(rawDate), "rawBirth:", JSON.stringify(rawBirth));
        throw new Error(`?앸뀈?붿씪 ?뚯떛 ?ㅽ뙣: "${rawDate}". YYYY-MM-DD ?뺤떇???꾩슂?⑸땲??`);
      }
    } else {
      // ?좎쭨 ?뺣낫 ?놁쓬 -> 湲곕낯媛?      y = 2000; m = 1; d = 1;
      rawDate = "2000-01-01";
    }

    // 2) birthTime ?뺢퇋??    let rawTime: string = rawBirth.birthTime ?? rawBirth.birth_time ?? rawBirth.time ?? "";
    rawTime = rawTime.toString().trim();
    let hr: number, mn: number;
    if (/^\d{1,2}:\d{2}$/.test(rawTime)) {
      [hr, mn] = rawTime.split(":").map(Number);
    } else if (/^\d{1,2}$/.test(rawTime)) {
      hr = +rawTime; mn = 0;
    } else {
      hr = 12; mn = 0;
    }

    // 3) ?좏슚??寃利?    if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
      throw new Error(`?앸뀈?붿씪 踰붿쐞 ?ㅻ쪟: ${y}-${m}-${d}`);
    }
    if (hr < 0 || hr > 23 || mn < 0 || mn > 59) { hr = 12; mn = 0; }

    birthInfo = {
      year: y, month: m, day: d, hour: hr, minute: mn,
      gender: rawBirth.gender === "male" || rawBirth.gender === "M" ? "M" : "F",
      birthDate: rawDate,
      birthTime: rawTime,
      isLunar: rawBirth.isLunar,
      isLeapMonth: rawBirth.isLeapMonth,
      // B-123 fix: birthPlace ?띿뒪?????꾨룄/寃쎈룄 ?먮룞 蹂??(二쇱슂 ?꾩떆 ?뚯씠釉?
      ...(() => {
        let bPlace = rawBirth.birthPlace || "";
        let lat = rawBirth.latitude;
        let lng = rawBirth.longitude;
        
        // 異쒖깮吏 湲곕낯媛?泥섎━ (?쒖슱)
        if (!bPlace || bPlace.trim() === "") {
          bPlace = "?쒖슱";
          if (!lat) lat = 37.5665;
          if (!lng) lng = 126.9780;
          console.log("[BIRTHPLACE DEFAULT]", { birthPlace: bPlace, latitude: lat, longitude: lng });
        }

        const CITY_COORDS: Record<string, [number, number]> = {
          "?쒖슱": [37.5665, 127.5], "Seoul": [37.5665, 127.5],
          "遺??: [35.1796, 129.0756], "Busan": [35.1796, 129.0756],
          "?援?: [35.8714, 128.6014], "Daegu": [35.8714, 128.6014],
          "?몄쿇": [37.4563, 126.7052], "Incheon": [37.4563, 126.7052],
          "愿묒＜": [35.1595, 126.8526], "Gwangju": [35.1595, 126.8526],
          "???: [36.3504, 127.3845], "Daejeon": [36.3504, 127.3845],
          "?몄궛": [35.5384, 129.3114], "Ulsan": [35.5384, 129.3114],
          "?섏썝": [37.2636, 127.0286], "Suwon": [37.2636, 127.0286],
          "?깅궓": [37.4449, 127.1388], "Seongnam": [37.4449, 127.1388],
          "?꾩퓙": [35.6762, 139.6503], "Tokyo": [35.6762, 139.6503],
          "?댁슃": [40.7128, -74.0060], "New York": [40.7128, -74.0060],
          "?곕뜕": [51.5074, -0.1278], "London": [51.5074, -0.1278],
          "?뚮━": [48.8566, 2.3522], "Paris": [48.8566, 2.3522],
        };
        const place = bPlace.trim();
        const exactMatch = CITY_COORDS[place];
        if (exactMatch) return { birthPlace: bPlace, latitude: exactMatch[0], longitude: exactMatch[1] };
        const partialKey = Object.keys(CITY_COORDS).find(k => place.includes(k) || k.includes(place));
        if (partialKey) return { birthPlace: bPlace, latitude: CITY_COORDS[partialKey][0], longitude: CITY_COORDS[partialKey][1] };
        return { birthPlace: bPlace, latitude: lat || 37.5665, longitude: lng || 127.5 };
      })(),
    };
  }

  // Debug/Monitoring??Date 媛앹껜
  const birthDate = new Date(Date.UTC(birthInfo.year, birthInfo.month - 1, birthInfo.day, birthInfo.hour, birthInfo.minute, 0));

  // ?뚮젰?믪뼇??蹂???곸슜
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
        // 蹂??寃곌낵 ?좏슚??寃利?        const isValidConversion =
          converted.year > 1900 &&
          converted.year < 2100 &&
          converted.month >= 1 &&
          converted.month <= 12 &&
          converted.day >= 1 &&
          converted.day <= 31;

        if (!isValidConversion) {
          console.error('??[?뚮젰蹂???ㅽ뙣] ?좏슚?섏? ?딆? 蹂??寃곌낵:', { birthInfo, converted });
          throw new Error("?뚮젰?먯꽌 ?묐젰?쇰줈 蹂?섑븯?????ㅽ뙣?덉뒿?덈떎. ?좎쭨瑜??뺤씤??二쇱꽭??");
        }

        const result = { ...birthInfo, year: converted.year, month: converted.month, day: converted.day };
        console.log("[LUNAR?뭆OLAR]", { 
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
    console.log("[LUNAR?뭆OLAR] ?묐젰 ?낅젰 ?좎?:", { year: solarBirthInfo.year, month: solarBirthInfo.month, day: solarBirthInfo.day });
  }

  // Step 1: Physical Calculation Pipeline
    // ?ъ＜ 怨꾩궛 (?숆린)
    console.log("[SAJU INPUT TRACE]", {
      solarBirthInfo_year: solarBirthInfo.year,
      solarBirthInfo_month: solarBirthInfo.month,
      solarBirthInfo_day: solarBirthInfo.day,
      solarBirthInfo_hour: solarBirthInfo.hour,
      solarBirthInfo_minute: solarBirthInfo.minute,
      solarBirthInfo_longitude: solarBirthInfo.longitude,
      rawBirth_year: rawBirth.year,
      rawBirth_month: rawBirth.month,
      rawBirth_day: rawBirth.day,
      rawBirth_hour: rawBirth.hour,
      rawBirth_minute: rawBirth.minute,
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
      if (!sajuRaw) throw new Error("?ъ＜ 怨꾩궛 寃곌낵媛 ?좏슚?섏? ?딆뒿?덈떎.");
    } catch (e: any) {
      console.error("[ENGINE-SAFE] ?ъ＜ 怨꾩궛 ?ㅽ뙣:", e);
      throw new Error(`?ъ＜ 遺꾩꽍 ?붿쭊 ?ㅻ쪟: ${e.message}`);
    }

    // ?濡??щ낵由?(?숆린)
    const tarotSymbolic = runTarotSymbolicEngine(input.cards || [], input.question);
    // B-113: Card Context Matrix (CCM) ???숈쟻 移대뱶 ?섎? 遺꾩꽍
    let ccmResult: ReturnType<typeof analyzeSpreadCCM> | null = null;
    try {
      const cardNames: string[] = (input.cards || []).map((c: any) => c.name).filter(Boolean);
      // B-142 fix: 移대뱶 ?먮낯 position ?꾨뱶 ?곗꽑 ?ъ슜, ?놁쑝硫??몃뜳??湲곕컲 ?대갚
      const positionFallback = ["past","present","future","advice","obstacle","outcome"];
      const cardPositions: Array<"past"|"present"|"future"|"advice"|"obstacle"|"outcome"> =
        (input.cards || []).map((c: any, i: number) => {
          const rawPos = (c.position || "").toLowerCase().trim();
          const posMap: Record<string, "past"|"present"|"future"|"advice"|"obstacle"|"outcome"> = {
            "past": "past", "怨쇨굅": "past", "?꾩옱 ?곹솴": "present", "present": "present",
            "future": "future", "誘몃옒": "future", "媛源뚯슫 寃곌낵": "future",
            "advice": "advice", "議곗뼵": "advice", "?④꺼吏??먯씤": "advice",
            "obstacle": "obstacle", "?듭떖 臾몄젣": "obstacle",
            "outcome": "outcome", "理쒖쥌 寃곌낵": "outcome"
          };
          return posMap[rawPos] ?? (positionFallback[i] ?? "present") as "past"|"present"|"future"|"advice"|"obstacle"|"outcome";
        });
      if (cardNames.length > 0) {
        ccmResult = analyzeSpreadCCM(cardNames, cardPositions, (input.questionType || "general"));
      }
    } catch (e) {
      console.warn("[B-113] CCM error:", e);
    }

    // ?먯꽦??(?숆린)
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
      console.error("[ENGINE-SAFE] ?먯꽦??怨꾩궛 ?ㅽ뙣:", e);
    }

    // ?먯꽦???뺢퇋??(Snake Case + Backward Compatibility)
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

    // ?먮??먯닔 ?쒓컙 蹂댁젙
    const ziweiLongitude = birthInfo.longitude || 127.5;
    const ziweiCorrectionMinutes = (ziweiLongitude - 135) * 4;
    const ziweiTotalMinutes = birthInfo.hour * 60 + (birthInfo.minute || 0) + ziweiCorrectionMinutes;
    const ziweiCorrectedHour = Math.floor(((ziweiTotalMinutes % 1440) + 1440) % 1440 / 60);
    const ziweiCorrectedMinute = ((ziweiTotalMinutes % 60) + 60) % 60;

    // B-57: ?뺣? ?묐젰?믪쓬??蹂??(?ㅻ떖 ?뚮옒洹??ы븿)
    let ziweiLunarMonth = 1;
    let ziweiLunarDay = 1;
    let ziweiIsLeapMonth = false;
    let ziweiSource = "unknown";

    if (isLunar) {
      // ?뚮젰 ?낅젰?대㈃ ?먮낯 ?곗씠?곕? 洹몃?濡??ъ슜 (留ㅼ슦 以묒슂)
      ziweiLunarMonth = birthInfo.month;
      ziweiLunarDay = birthInfo.day;
      ziweiIsLeapMonth = isLeapMonthInput;
      ziweiSource = "?먮낯?뚮젰";
    } else {
      // ?묐젰 ?낅젰?대㈃ ?묐젰->?뚮젰 ?????      const lunarResult = solarToLunar(solarBirthInfo.year, solarBirthInfo.month, solarBirthInfo.day);
      ziweiLunarMonth = lunarResult.lunarMonth;
      ziweiLunarDay = lunarResult.lunarDay;
      ziweiIsLeapMonth = lunarResult.is_leap_month;
      ziweiSource = "?묐젰?믪쓬?λ???;
    }

    console.log("[ZIWEI INPUT]", { 
      year: birthInfo.year,
      ziweiLunarMonth, 
      ziweiLunarDay, 
      isLeap: ziweiIsLeapMonth,
      isLunar, 
      source: ziweiSource 
    });

    // ?섎퉬??(?앸뀈?붿씪 + ?대쫫 湲곕컲)
    let numerologyResult: any = null;
    try {
      const baseResult = calculateNumerology(
        `${solarBirthInfo.year}-${String(solarBirthInfo.month).padStart(2,'0')}-${String(solarBirthInfo.day).padStart(2,'0')}`,
        new Date().getFullYear(),
        rawBirth.name || input.userName
      );

      // B-256: ?대쫫 湲곕컲 ?섎퉬??異붽?
      const name = rawBirth.name || input.userName || "?대쫫?놁쓬";
      const nameResult = calculateNameNumerology(name);

      numerologyResult = {
        ...baseResult,
        lifePath: baseResult.life_path_number,
        expression: nameResult.expression,
        soul: nameResult.soul,
        personality: nameResult.personality,
        data_quality_score: 0.85 // ?곹뼢
      };

      console.log("[NUMEROLOGY NAME]", { 
        name, 
        expression: nameResult.expression, 
        soul: nameResult.soul, 
        personality: nameResult.personality 
      });
    } catch (e) {
      console.error("[ENGINE-SAFE] ?섎퉬??怨꾩궛 ?ㅽ뙣:", e);
    }

    // B-228: ?먮??먯닔 嫄대꼫? 諛??뺢퇋???듯빀 泥섎━
    let ziweiAnalysis: any = null;
    const genderZiwei = (birthInfo.gender === "M" || birthInfo.gender === "male") ? "male" as const : "female" as const;
    let serverZiwei: any = null;
    try {
      /**
       * ?먮??먯닔 ?쒓컙 湲곗? 臾몄꽌
       * ?????????????????????
       * 1. ?낅젰: ?뚮젰 ?앸뀈?붿씪 + 寃쎈룄蹂댁젙 ?쒓컙
       *    - isLunar=true ??rawBirth.month/day瑜?洹몃?濡??뚮젰?쇰줈 ?ъ슜
       *    - isLunar=false ??solarToLunar 蹂?????뚮젰 ?붿씪 ?ъ슜
       * 2. ?쒓컙: 寃쎈룄蹂댁젙(-30遺? ?곸슜??correctedHour ?ъ슜
       *    - ?? ?쒖슱(127째) 04:35 ??04:03 (吏꾩떆 渦경셽)
       * 3. ?깅퀎: gender ?뚮씪誘명꽣 洹몃?濡??꾨떖
       * 4. 二쇱쓽: ?ъ＜ ?붿쭊? ?묐젰 湲곗?, ?먮??먯닔???뚮젰 湲곗? (寃쎈줈 ?낅┰)
       */
      serverZiwei = hasTime ? calculateServerZiWei(
        birthInfo.year, ziweiLunarMonth, ziweiLunarDay, ziweiCorrectedHour, ziweiCorrectedMinute, genderZiwei
      ) : null;
    } catch (e) {
      console.error("[ENGINE-SAFE] ?먮??먯닔 怨꾩궛 ?ㅽ뙣:", e);
    }

    let ziweiWarnings: string[] = [];
    if (!hasTime) {
      ziweiAnalysis = {
        skipped: true,
        reason: "異쒖깮 ?쒓컙???꾩슂?⑸땲?? ?먮??먯닔??異쒖깮 ????瑜?湲곗??쇰줈 紐낃턿??寃곗젙?섎?濡? ?뺥솗??異쒖깮 ?쒓컙 ?놁씠???좊ː?????덈뒗 寃곌낵瑜??쒓났?????놁뒿?덈떎."
      };
    } else if (serverZiwei) {
      // ?? B-255: 濡앷린異?曄욕퓣亦? 寃????????????????????????????????????
      const dahanTransforms = serverZiwei?.currentMajorPeriod?.transformations || [];
      const annualTransforms = serverZiwei?.annualTransformations || [];

      for (const annual of annualTransforms) {
        for (const dahan of dahanTransforms) {
          // 媛숈? 蹂꾩뿉 ?붾줉+?붽린 ?먮뒗 ?붽린+?붾줉??嫄몃┛ 寃쎌슦
          if (annual.star === dahan.star) {
            if ((annual.type === "?붽린" && dahan.type === "?붾줉") ||
                (annual.type === "?붾줉" && dahan.type === "?붽린")) {
              ziweiWarnings.push(
                `?좑툘 濡앷린異? ${annual.star}????쒗솕${dahan.type === "?붾줉" ? "濡? : "湲?}怨??좊뀈??{annual.type === "?붾줉" ? "濡? : "湲?}???숈떆 ?묒슜 ??${annual.palace || dahan.palace} ?곸뿭 湲명쓨 ?쇱옱, 媛곷퀎??二쇱쓽 ?꾩슂`
              );
            }
          }
        }
      }

      ziweiAnalysis = {
        life_structure: serverZiwei.lifeStructure || "",
        palaces: serverZiwei.palaces.map((p: any) => {
          const majorStars = p.stars.filter((s: any) =>
            ["?먮?","泥쒓린","?쒖뼇","臾닿끝","泥쒕룞","?쇱젙","泥쒕?","?쒖쓬","?먮옉","嫄곕Ц","泥쒖긽","泥쒕웾","移좎궡","?뚭뎔"].includes(s.star)
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
            ["?뚭뎔", "?먮?", "泥쒕?", "移좎궡", "臾닿끝", "?쒖뼇", "泥쒓린", "?쇱젙"].includes(s.star)
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

    // ?ъ＜ 援ъ“ 遺꾩꽍 + 吏덈Ц 遺꾨쪟 蹂묐젹 ?ㅽ뻾
    const [sajuAnalysis, topicResult] = await Promise.all([
      analyzeSajuStructure(sajuRaw).catch(e => {
        console.error("[ENGINE-SAFE] ?ъ＜ 援ъ“ 遺꾩꽍 ?ㅽ뙣:", e);
        return {
          characteristics: [], narrative: "遺꾩꽍 ?ㅽ뙣", elements: {}, tenGods: {},
          yongShin: "Unknown", heeShin: "Unknown", daewoon: null, interactions: [], shinsal: [],
          health_risk_tags: [], topic_shinsal_map: {}, strength: "Unknown"
        } as any;
      }),
      classifyWithFallback(input.question || "", apiKey).catch(e => {
        console.error("[ENGINE-SAFE] 吏덈Ц 遺꾨쪟 ?ㅽ뙣:", e);
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
      // 移대뱶蹂?踰≫꽣 怨꾩궛 (?ъ???媛以묒튂 + ??갑??+ ?⑹떊 蹂댁젙)
      const wuxingMap: Record<string, number> = { "紐?: 1, "??: 2, "??: 3, "湲?: 4, "??: 5 };
      const yongshinWuxing: number = wuxingMap[sajuAnalysis?.yongShin] ?? 3;
      const enrichedCardVectors = (input.cards || []).map((c: any, idx: number) => {
        const baseVec = getCardVector(c.name);
        if (!baseVec) return null;

        // ??갑??+ ?ъ???媛以묒튂 ?곸슜
        const processed = processCardVector(
          { emotion: baseVec.emotion, growth: baseVec.growth, risk: baseVec.risk,
            stability: baseVec.stability, career: baseVec.career, money: baseVec.money,
            transition: baseVec.transition },
          c.isReversed === true,
          idx + 1,
          finalTopic
        );

        // ?⑹떊 ?ㅽ뻾 蹂댁젙
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
        astrologyAnalysis?.sunSign ? `${astrologyAnalysis.sunSign} ?쒖뼇` : null,
        astrologyAnalysis?.moonSign ? `${astrologyAnalysis.moonSign} ?? : null,
        astrologyAnalysis?.risingSign ? `${astrologyAnalysis.risingSign} ?곸듅沅? : null
      ].filter(Boolean)
    },
    {
      system: "ziwei",
      ...ziweiAnalysis,
      characteristics: [
        ...(ziweiAnalysis?.characteristics || []),
        ziweiAnalysis?.mingGong ? `${ziweiAnalysis.mingGong} 紐낃턿` : null,
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
  // Symbol 湲곗? 以묐났 ?쒓굅 (Set/filter)
  const patternVectors = rawVectors.filter((v, i, a) => 
    a.findIndex(t => t.symbol === v.symbol) === i
  );
  console.log(`?뱤 [Vector Merge] 以묐났 ?쒓굅 ?꾨즺: ${rawVectors.length} -> ${patternVectors.length}`);

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

  // B-179 fix: 蹂듯빀 ?좏뵿???????좏뵿 媛以묒튂 ?됯퇏 釉붾젋??  let blendedWeights: Record<string, number> | undefined;
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
  // B-164 fix: data-only 紐⑤뱶?먯꽌???濡??놁쑝誘濡?validation 媛뺤젣 ?듦낵 泥섎━
  const validationResult = input.mode === "data-only"
    ? { isValid: true, message: "Validation Passed (Data-Only Mode)", reasons: [] }
    : validateEngineOutput(consensusResult, patternVectors, systemResults, questionType);

  // Step 2: Scale & Grade Logic
  const grade = consensusResult.consensus_score >= 0.7 ? "S"
    : consensusResult.consensus_score >= 0.5 ? "A"
    : consensusResult.consensus_score >= 0.3 ? "B" : "C";

  // ?濡?移대뱶 議고빀 媛먯? 濡쒖쭅 (#92)
  const cardNamesForCombos = tarotCards.map((c: any) => c.name).filter(Boolean);
  const matchedCombinations = detectCombinations(cardNamesForCombos, finalTopic);
  const detectedCombinations = matchedCombinations.length;
  const combinationBonus = aggregateCombinationScore(matchedCombinations);

  // ?? birth_context ?뺤젙 (#97, #99) ?????????????????????????????
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

  // ?濡?移대뱶 議고빀 蹂대꼫???곸슜 (理쒕? +0.2)
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
  
  // ?? age_context 怨꾩궛 (B-237 fix: ?꾨＼?꾪듃 ?앹꽦 ?꾩쑝濡??대룞) ??
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
  
  // B-230: ?濡?移대뱶 議고빀 遺꾩꽍 ?ㅽ뻾
  const cardCombos = analyzeCardCombinations(tarotCards);
  
  console.log("[DEBUG-CRASH] B-240 ?뺤텞 肄붾뱶 吏꾩엯 吏곸쟾");
  // B-240: [Compression] Gemini ?꾨＼?꾪듃 理쒖쟻??(rawData ?쒓굅 諛??꾨뱶 Pick)
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

  const ziweiDataStr = ziweiAnalysis?.skipped ? `(?먮??먯닔 ?곗씠???놁쓬: ${ziweiAnalysis.reason})` : JSON.stringify(promptZiweiData);
  const astrologyDataStr = astrologyAnalysis ? JSON.stringify(promptAstroData) : "(?먯꽦???곗씠???놁쓬)";

  const astroNote = hasTime ? "" : "\n?좑툘 異쒖깮 ?쒓컙 誘몄엯?? ASC/?섏슦???뺣낫 ?놁쓬. ?쒖뼇/?됱꽦 ?꾩튂 諛??ъ씤 ?꾩＜濡??댁꽍??寃? ???꾩튂??짹6째 ?ㅼ감 媛??";
  
  const daewoonPromptSection = sajuAnalysis.daewoon?.currentDaewoon
    ? `
- ?꾩옱 ??? ${sajuAnalysis.daewoon.currentDaewoon.full} (${sajuAnalysis.daewoon.currentDaewoon.startAge}~${sajuAnalysis.daewoon.currentDaewoon.endAge}??
- ???泥쒓컙 ??꽦: ${sajuAnalysis.daewoon.currentDaewoon.tenGodStem}
- ???吏吏 ??꽦: ${sajuAnalysis.daewoon.currentDaewoon.tenGodBranch}
- ???吏꾪뻾諛⑺뼢: ${sajuAnalysis.daewoon.isForward ? "?쒗뻾" : "??뻾"}
- B-175 ?뺤텞: ?꾩껜 ???以??꾩옱+?ㅼ쓬 2媛쒕쭔 ?ы븿
- ?ㅼ쓬 ??? ${sajuAnalysis.daewoon.pillars?.find((p: any) => p.index === (sajuAnalysis.daewoon.currentDaewoon.index || 0) + 1)?.full || "?놁쓬"}
    `
    : "- ????뺣낫: ?곗씠??遺議깆쑝濡??앸왂";

  // ?? B-238: 援먯감遺꾩꽍 ?붿쭊 ?좊ː???꾪꽣 ??
  // ?먯꽦???좊ː???꾪꽣
  const astroConfidenceValue = astrologyAnalysis?.rawData?.location_confidence || 
                          astrologyAnalysis?.confidence || 1.0;
  let astroPromptNote = "";
  if (astroConfidenceValue === "very_low" || (typeof astroConfidenceValue === "number" && astroConfidenceValue < 0.5)) {
    astroPromptNote = "\n?좑툘 ?먯꽦???곗씠???좊ː?? 留ㅼ슦 ??쓬. 異쒖깮?쒓컙 誘몄엯???먮뒗 異쒖깮吏 誘몄엯?? ASC/?섏슦?????꾩튂瑜?吏곸젒 ?멸툒?섏? 留덉꽭?? '?됱꽦 諛곗튂 李멸퀬' ?섏??쇰줈留??쒖슜?섏꽭??";
  } else if (typeof astroConfidenceValue === "number" && astroConfidenceValue < 0.8) {
    astroPromptNote = "\n?좑툘 ?먯꽦???곗씠???좊ː?? 蹂댄넻. ASC? ?섏슦??諛곗튂??'異붿젙'?꾩쓣 紐낆떆?섍퀬, ?쒖뼇/?명뻾???꾩튂 ?꾩＜濡??댁꽍?섏꽭??";
  }

  // ?먮??먯닔 ?좊ː???꾪꽣
  const ziweiSkippedFlag = ziweiAnalysis?.skipped === true;
  let ziweiPromptNote = "";
  if (ziweiSkippedFlag) {
    ziweiPromptNote = "\n?좑툘 ?먮??먯닔: 異쒖깮?쒓컙 誘몄엯?μ쑝濡?遺꾩꽍???앸왂?섏뿀?듬땲?? ?먮??먯닔 愿???댁슜???멸툒?섏? 留덉꽭??";
  } else {
    const ziweiConfidenceValue = ziweiAnalysis?.confidence || 1.0;
    if (typeof ziweiConfidenceValue === "number" && ziweiConfidenceValue < 0.7) {
      ziweiPromptNote = "\n?좑툘 ?먮??먯닔 ?곗씠???좊ː?? ??쓬. 紐낃턿/?좉턿 ?꾩튂瑜??⑥젙?섏? 留먭퀬 '李멸퀬 ?섏?'?쇰줈留??멸툒?섏꽭??";
    }
  }

  // ?ъ＜ ?좊ː???꾪꽣 (?쒖＜ 誘몄긽????
  const hourPillarMissing = sajuRaw?.hour?.stem === "誘몄긽" || 
                            sajuRaw?.hour?.stem === "" ||
                            !sajuRaw?.hour?.stem;
  let sajuPromptNote = "";
  if (hourPillarMissing) {
    sajuPromptNote = "\n?좑툘 ?ъ＜: ?쒖＜(?쒓컙 湲곕뫁) 誘몄엯?? ?꾩썡??3二쇰쭔?쇰줈 遺꾩꽍?⑸땲?? ?쒖＜ 愿????꽦/?좎궡? ?멸툒?섏? 留덉꽭??";
  }

  console.log(`[DEBUG-userName] input.userName = "${input.userName}", type = ${typeof input.userName}`);
  const dataBlock = `
- [吏덈Ц???깊븿] ${input.userName || "??}
[?ъ＜ ?붿쭊 ?몄텧 寃곌낵 - ?곸쭠???꾨즺]
${sajuSymbolic}${sajuPromptNote}
- ?ъ＜ 4二? ${sajuDisplay.fourPillars}
- ?쇨컙(Day Master): ${sajuDisplay.dayMaster}
- ?ㅽ뻾 遺꾪룷: ${sajuDisplay.elements}
- ?⑹떊(Yong-Shin): ${sajuDisplay.yongShin}
- ?ъ떊: ${sajuDisplay.heeShin}
- ?좉컯/?좎빟: ${sajuDisplay.strength}
- ?쒖뼱???덇린: ${sajuDisplay.termName}
${sajuDisplay.isDaewoonChanging ? `- ?좑툘 ???援먯껜 ?꾨컯: ?꾩옱 ${sajuDisplay.currentDaewoon} ??댁씠 怨?醫낅즺?섍퀬 ${sajuDisplay.nextDaewoon || "?ㅼ쓬"} ??댁쑝濡??꾪솚?⑸땲?? ???꾪솚湲곗쓽 ?щ━?겶룹슫?몄쟻 蹂?붾? 諛섎뱶??遺꾩꽍??諛섏쁺?섏꽭??` : `- ?꾩옱 ??? ${sajuDisplay.currentDaewoon || "?곗씠???놁쓬"}`}
- ?됱슫 ?붿냼: ?됱긽(${luckyFactors.color}), ?レ옄(${luckyFactors.number}), 諛⑺뼢(${luckyFactors.direction})
- ???遺꾩꽍: ${daewoonPromptSection}
- ?ъ＜ ?몃? 吏?? ${JSON.stringify(sajuAnalysis?.characteristics || [])}
- ?ъ＜ ?곸꽭 ?댁꽍: ${sajuAnalysis?.narrative || "?곗씠???놁쓬"}
- [?듭떖 ?뺣낫] ?곕졊?: ${ageContext?.international_age || "?????놁쓬"}??(留??섏씠), ?쒓뎅?섏씠 ${ageContext?.korean_age || "?????놁쓬"}??- ?濡?移대뱶 (5???ㅽ봽?덈뱶):
  1踰?(?꾩옱 ?곹솴): ${tarotCards[0]?.korean || tarotCards[0]?.name || "湲곕줉 ?놁쓬"} (${tarotCards[0]?.isReversed ? "??갑?? : "?뺣갑??})
  2踰?(?꾩쟾/?μ븷): ${tarotCards[1]?.korean || tarotCards[1]?.name || "湲곕줉 ?놁쓬"} (${tarotCards[1]?.isReversed ? "??갑?? : "?뺣갑??})
  3踰?(議곗뼵): ${tarotCards[2]?.korean || tarotCards[2]?.name || "湲곕줉 ?놁쓬"} (${tarotCards[2]?.isReversed ? "??갑?? : "?뺣갑??})
  4踰?(?대㈃/怨쇱젙): ${tarotCards[3]?.korean || tarotCards[3]?.name || "湲곕줉 ?놁쓬"} (${tarotCards[3]?.isReversed ? "??갑?? : "?뺣갑??})
  5踰?(理쒖쥌 寃곌낵/誘몃옒): ${tarotCards[4]?.korean || tarotCards[4]?.name || "湲곕줉 ?놁쓬"} (${tarotCards[4]?.isReversed ? "??갑?? : "?뺣갑??})
- ?濡?移대뱶 議고빀 ?듭같(Clues):
${combinationClues}
${cardCombos.length > 0 ? `
### 移대뱶 議고빀 遺꾩꽍 (Card Combinations)
?꾨옒 議고빀 ?⑦꽩??諛섎뱶???댁꽍??諛섏쁺?섏꽭?? tension ??낆? 媛덈벑/二쇱쓽 ?ъ씤?몃줈, synergy ??낆? ?쒕꼫吏濡? amplify ??낆? ?먮꼫吏 利앺룺?쇰줈 ?댁꽍?섏꽭??
${JSON.stringify(cardCombos, null, 2)}
` : ""}
- age_context: ${JSON.stringify(ageContext)}

[?먮??먯닔 遺꾩꽍 ?곗씠??
${ziweiDataStr}${ziweiPromptNote}

[?먯꽦??遺꾩꽍 ?곗씠??${astroNote}${astroPromptNote}
${astrologyDataStr}
${astrologyPrompt}
- ?섏슦???ъ빱?? ${finalTopic === "health" ? "6?섏슦??嫄닿컯쨌?쇱긽)" : finalTopic === "career" ? "10?섏슦??吏곸뾽쨌紐낆삁)" : finalTopic === "relationship" ? "7?섏슦???뚰듃?덉떗)" : finalTopic === "finance" ? "2?섏슦???щЪ)" : "?꾩껜 ?섏슦??}

[?먮??먯닔 遺꾩꽍]
${ziweiPrompt}
- ?뚰븳沅? ${ziweiAnalysis?.currentMinorPeriod?.palace || "誘명솗??} ??${ziweiAnalysis?.currentMinorPeriod?.interpretation || ""}
- ?좊뀈?ы솕(${ziweiAnalysis?.annual_year || "?ы빐"}): ${(ziweiAnalysis?.annual_transformations as any[])?.map((t: any) => t.description).join(", ") || "?놁쓬"}
- ?좎쿇?ы솕: ${(ziweiAnalysis?.natal_transformations as any[])?.slice(0, 4).map((t: any) => `${t.type}(${t.star}??{t.palace})`).join(", ") || "?놁쓬"}
- ?먮??먯닔 ?ъ빱?? ${finalTopic === "health" ? "吏덉븸沅? : finalTopic === "career" ? "愿濡앷턿" : finalTopic === "relationship" ? "遺泥섍턿" : finalTopic === "finance" ? "?щ갚沅? : "紐낃턿+愿濡앷턿"}${ziweiWarnings.length > 0 ? `\n- ?먮??먯닔 ?밸퀎 寃쎄퀬: ${ziweiWarnings.join("; ")}` : ""}

[?섎퉬??遺꾩꽍]
- ?앸챸??${(numerologyResult as any)?.life_path_number || "?"}踰? ${(numerologyResult as any)?.vibrations?.[0] || ""}
- 媛쒖씤??${(numerologyResult as any)?.personal_year || "?"}: ${(numerologyResult as any)?.vibrations?.[3] || ""}
- ?대챸?? ${(numerologyResult as any)?.destiny_number || "?놁쓬"}

[?듯빀 吏??
- ?⑹쓽?? consensus_score=${consensusResult.consensus_score.toFixed(3)}
- ?⑹쓽 ?좊ː?? confidence_score=${consensusResult.confidence_score.toFixed(3)}
- 異⑸룎 ?붿빟: ${consensusResult.conflict_summary}
- ?쒓컙異??덉륫: ${JSON.stringify(temporalResult)?.slice(0, 200)}
- 吏덈Ц ?좏삎: ${finalTopic}${isDualTopic ? ` + ${secondaryTopic} (蹂듯빀 吏덈Ц)` : ""}
- ?쒕툕?좏뵿: ${detectedSubtopic || "?놁쓬"}
- ?좏슚 遺꾩꽍 ?쒖뒪?? ${activeEngines.length}媛?
[異붽? 遺꾩꽍 吏移?
0. **?濡??댁꽍 ?먯튃(理쒖슦???쒖쐞)**: 移대뱶???꾪넻???섎???李멸퀬留??섍퀬, 吏덈Ц?먯쓽 ?곹솴怨?留λ씫??留욊쾶 ?좎뿰?섍쾶 ?댁꽍??寃? '??移대뱶??~???섎??⑸땲?? 媛숈? ?⑥젙 ?쒗쁽 ???'???먮━?먯꽌 ??移대뱶??~???먮쫫??蹂댁뿬以띾땲?? ?뺥깭濡??쒗쁽??寃? 移대뱶 議고빀 遺꾩꽍(Card Combinations)???쒓났??寃쎌슦, 媛쒕퀎 移대뱶 ?댁꽍 ?몄뿉 諛섎뱶??'移대뱶 媛?愿怨? ?뱀뀡???ы븿?섏뿬 議고빀??湲댁옣, ?쒕꼫吏, 利앺룺 ?⑦꽩???ㅻ챸?섏꽭??
1. ?쒓났???ъ＜ ?곗씠?곕쭔??洹쇨굅濡?遺꾩꽍?섏꽭?? ?ㅽ뻾 遺꾪룷? ??꽦 遺꾪룷瑜??뺥솗??諛섏쁺?댁빞 ?⑸땲??
2. 留뚯빟 ?뱀젙 ?ㅽ뻾(?? ?ъ꽦, 愿????0?대씪硫??덈?濡??대떦 ?댁씠 醫뗫떎怨?怨쇱옣?섏? 留덉꽭??
3. ?몃옖吏??됱꽦 ?꾩튂??諛섎뱶???쒓났???곗씠?곕쭔 ?ъ슜?섍퀬, ?ㅼ뒪濡?異붿륫?섏? 留덉꽭??
4. ?먮??먯닔 紐낅컲??援?낵 二쇱꽦, ?ы솕(?좎쿇+?좊뀈) ?곹뼢???뺥솗??諛섏쁺?섏뿬 由щ뵫???꾧컻?섏꽭??
5. ?됱슫 ?붿냼(?됱긽, ?レ옄, 諛⑺뼢)??諛섎뱶??action_guide.lucky ?뱀뀡??諛섏쁺?섏꽭??
6. **?ъ＜ 遺꾩꽍 ?댁“ 諛?援ъ“(?뚯씠x以???ㅽ???**:
   - 'merged_reading.structureInsight' ?뱀뀡? 諛섎뱶???ㅼ쓬 5?④퀎 援ъ“濡??묒꽦?섏꽭??
     ???ы쉶?먮쫫 ???덇린 湲곕컲 湲곗쭏 ???듭떖 肄붾뱶 ???꾨왂 ???됰룞怨꾪쉷
   - ?댁“???⑦샇?섎㈃?쒕룄 ?듭같???덈뒗 '留덉뒪????臾몄껜瑜??ъ슜?섏꽭??
7. **?濡?議고빀 遺꾩꽍**: ?쒓났??移대뱶 議고빀 ?쒕굹由ъ삤 以??ㅽ봽?덈뱶 ?덉뿉 ?대떦?섎뒗 議고빀???덈떎硫??듭떖 ?곕떇?ъ씤?몃줈 媛뺤“?섏꽭??
8. **吏덈Ц ?좏삎蹂??곗꽑 遺꾩꽍 ?붿쭊**:
${finalTopic === "health" ? "   ??嫄닿컯 吏덈Ц: ?ъ＜ 吏덉븸沅??ㅽ뻾쨌?먯꽦??6?섏슦?ㅒ룹옄誘몃몢??吏덉븸沅곸쓣 理쒖슦??遺꾩꽍?섏꽭??" : ""}
${finalTopic === "career" ? "   ??吏꾨줈 吏덈Ц: ?ъ＜ 愿?굿룹젏?깆닠 10?섏슦?ㅒ룹옄誘몃몢??愿濡앷턿??理쒖슦??遺꾩꽍?섏꽭??" : ""}
${finalTopic === "relationship" ? "   ??愿怨?吏덈Ц: ?ъ＜ ?ъ꽦쨌?먯꽦??7?섏슦?ㅒ룹옄誘몃몢??遺泥섍턿??理쒖슦??遺꾩꽍?섏꽭??" : ""}
${finalTopic === "finance" ? "   ???щЪ 吏덈Ц: ?ъ＜ ?ъ꽦쨌?먯꽦??2쨌8?섏슦?ㅒ룹옄誘몃몢???щ갚沅곸쓣 理쒖슦??遺꾩꽍?섏꽭??" : ""}
${finalTopic === "life_change" ? "   ??蹂??吏덈Ц: ?ъ＜ ?대줈쨌?먯꽦??1쨌9?섏슦?ㅒ룹옄誘몃몢??泥쒖씠沅곸쓣 理쒖슦??遺꾩꽍?섏꽭??" : ""}

[?섎졃 遺꾩꽍 吏移?
遺꾩꽍??李몄뿬???좏슚 ?붿쭊 ?? ${patternVectors.map(v => v.system).filter((v, i, a) => a.indexOf(v) === i).length}媛??섎졃 遺꾩꽍 ?? "?곗씠??遺議??대굹 "遺꾩꽍 遺덇?"??泥닿퀎???꾩쟾???쒖쇅?섍퀬, ?ㅼ젣 ?곗씠?곌? ?덈뒗 ?붿쭊???ъ씠??'?쇱튂(Convergence)'? '異⑸룎(Divergence)'??援щ텇?섏뿬 ?쒖닠?섏꽭??
異쒕젰 JSON??"total_systems"?????좏슚 ?붿쭊 ?섎?, "converged_count"??洹몄쨷 ?쇱튂?꾧? ?믪? ?붿쭊 ?섎? 湲곗엯?섏꽭??

### ?곗씠???뺥솗??洹쒖튃 (?덈? 以??
1. ?꾩뿉 ?쒓났??[?ъ＜ ?곗씠??, [?먯꽦???곗씠??, [?먮??먯닔 ?곗씠??, [?濡?移대뱶] 釉붾줉??紐낆떆??媛믩쭔 ?ъ슜?섏꽭??
2. ?곗씠??釉붾줉???녿뒗 蹂꾩옄由??대쫫, 沅??대쫫, ?꾩닔, 蹂??대쫫, ?좎궡 ?대쫫???덈? 留뚮뱾?대궡吏 留덉꽭??
3. null, "誘몄긽", skipped濡??쒖떆????ぉ? 由щ뵫?먯꽌 ?멸툒?섏? 留덉꽭??
4. ?レ옄(?꾩닔, ?먯닔, ?쇱꽱??瑜??몄슜???뚮뒗 ?곗씠??釉붾줉??媛믪쓣 洹몃?濡??ъ슜?섏꽭?? 諛섏삱由쇳븯嫄곕굹 蹂?뺥븯吏 留덉꽭??
5. "~?????덉뒿?덈떎", "~濡?異붿젙?⑸땲?? 媛숈? 異붿륫 ?쒗쁽 ??? ?곗씠?곌? ?덉쑝硫??⑥젙?곸쑝濡? ?놁쑝硫??꾩삁 ?멸툒?섏? 留덉꽭??
6. ?곗씠??釉붾줉???좑툘 寃쎄퀬媛 ?덈뒗 ?붿쭊??援ъ껜???섏튂(沅??대쫫, 蹂꾩옄由? ?꾩닔)???멸툒?섏? 留덉꽭?? ?대떦 ?붿쭊? "?꾨컲???먮꼫吏 ?먮쫫" ?섏??쇰줈留?李멸퀬?섏꽭??
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
    // coreReading: 2.5-flash (怨좏뭹吏?遺꾩꽍, ?좎?)
    console.log("[MODEL]", { task: "肄붿뼱遺꾩꽍", model: "gemini-2.5-flash" });
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
      coreReading = { overall_conclusion: "遺꾩꽍 ?곗씠?곕? ?뚯떛?섎뒗 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." };
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
      // styleApply: 2.5-flash (?먮났 - lite ?뚯떛 ?먮윭)
      console.log("[MODEL]", { task: "?ㅽ??쇱쟻??, model: "gemini-2.5-flash" });
      rawNarrative = await fetchGemini(apiKey, "gemini-2.5-flash", stylePrompt, "", requestedTemp);
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
    parsed = buildFallbackReading("?곗씠??遺꾩꽍 ?꾩슜 紐⑤뱶?낅땲??", grade, scores, tarotCards, input.question, requestedStyle);
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
  // coreReading?먯꽌 怨꾩궛???먯닔 諛섏쁺
  // Gemini媛 諛섑솚??scores???붿쭊 怨꾩궛媛믪쓣 0?쇰줈 ??뼱???꾪뿕???덉쑝誘濡?蹂묓빀?섏? ?딆쓬
  console.log("[SCORES]", JSON.stringify(scores));

  const modelInput = stylePrompt || "";

  // 鍮꾨룞湲?紐⑤땲?곕쭅
  logMonitoringEvent(supabaseClient, {
    sessionId,
    engineVersion: READING_VERSION,
    geminiModel: input.mode === "data-only" ? "none" : "gemini-2.5-flash",
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

  // ?붿쭊 硫뷀??곗씠???ㅻ쾭?쇱씠??  parsed.reading_info = {
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
    internal_validation: validationResult.isValid ? "?듦낵" : "寃쎄퀬",
    conflict_summary: consensusResult.conflict_summary,
    conflict_log: consensusResult.conflict_log
  };
  parsed.scores = scores;
  // B-228: data-only 紐⑤뱶 ??system_calculations???먮낯 ?곗씠??蹂댁〈 (?꾨줎???쒖떆??
  if (input.mode === "data-only") {
    parsed.system_calculations = {
      ...parsed.system_calculations,
      saju: sajuAnalysis,
      astrology: astrologyAnalysis,
      ziwei: ziweiAnalysis,
      numerology: numerologyResult
    };
  }

  // 鍮꾩뿰??吏덈Ц?대㈃ love_analysis null 媛뺤젣
  const isLoveQuestion = ["?곗븷", "reconciliation", "relationship", "marriage", "dating"].includes(questionType);
  if (!isLoveQuestion) {
    parsed.love_analysis = null;
  }

  // [Professional V4 Integrated Fields - Inject into 'parsed' for backward compatibility]
  parsed.integrated_summary = parsed.final_message?.summary || parsed.merged_reading?.coreReading || "遺꾩꽍 寃곌낵瑜??앹꽦?섎뒗 以묒엯?덈떎. ?좎떆留?湲곕떎?ㅼ＜?몄슂.";
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
    // B-163 fix: topic_weights_used 蹂꾨룄 ?꾨뱶濡?異붽? (?꾨줎?몄뿏??李몄“??
    topic_weights_used: (consensusResult as any).topic_weights_used || null,
  };

  // Professional V4 Detail Mapping (Required by ReaderPage.tsx)
  parsed.saju_analysis = sajuAnalysis;
  parsed.sajuAnalysis = sajuAnalysis?.narrative || "遺꾩꽍 ?꾨즺";
  parsed.sajuTimeline = JSON.stringify(temporalResult);
  parsed.astrology_data = astrologyAnalysis;
  parsed.astrologyAnalysis = astrologyAnalysis?.characteristics?.join(", ") || "";
  parsed.ziwei_data = ziweiAnalysis;
  parsed.ziweiAnalysis = ziweiAnalysis?.characteristics?.join(", ") || "";
  parsed.numerology_data = numerologyResult;
  parsed.saju_raw = sajuRaw;

  const consultationCopy = `
### [${input.memo || "?ъ슜??}] 遺꾩꽍 寃곌낵 ?붿빟
[?듭떖 吏꾨떒]
${parsed.merged_reading?.coreReading || parsed.integrated_summary}

[?ㅽ뻾 怨꾪쉷]
${parsed.action_guide?.do_list?.map((item: string) => `- ${item}`).join('\n') || "以鍮?以묒엯?덈떎."}

[?됱슫 ?붿냼]
- ?됱긽: ${parsed.action_guide?.lucky?.color || "?ㅼ뼇??}
- ?レ옄: ${parsed.action_guide?.lucky?.number || "?꾩껜"}
- 諛⑺뼢: ${parsed.action_guide?.lucky?.direction || "以묒븰"}

遺꾩꽍???꾨즺?섏뿀?듬땲?? 媛먯궗?⑸땲??
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

  // ?? question_specific_analysis ?앹꽦 ??????????????????????????????
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
            stars.includes("愿??) ? "愿???쒖꽦 ??吏곸뾽/?ы쉶??吏??蹂???쒖궗" : null,
            stars.includes("?앹긽") ? "?앹긽 ?쒖꽦 ??李쎌쓽쨌?쒗쁽 ?먮꼫吏 利앷?" : null,
            stars.includes("?ъ꽦") ? "?ъ꽦 ?쒖꽦 ???щЪ ?먮쫫 蹂?? : null,
          ].filter(Boolean),
          key_pillars: Object.entries(pillars).filter(([k]) => ["year", "month", "day", "hour"].includes(k)).map(([k, v]: [string, any]) => `${k}: ${v.stem}${v.branch}`),
          topic_alignment: (localBestSystem as any)?.saju === questionTopic ? "high" : "medium"
        };
      })(),
      ziwei: (() => {
        if (!ziweiAnalysis) return null;
        const careerP = (ziweiAnalysis as any).palaces?.find((p: any) => p.name === "愿濡앷턿");
        return {
          signals: [
            careerP ? `愿濡앷턿: ${careerP.main_stars?.join("쨌")}` : null,
            (ziweiAnalysis as any).major_period?.interpretation ? `??? ${(ziweiAnalysis as any).major_period.interpretation}` : null,
            (ziweiAnalysis as any).currentMinorPeriod?.interpretation ? `?뚰븳: ${(ziweiAnalysis as any).currentMinorPeriod.interpretation}` : null,
            (ziweiAnalysis as any).annual_transformations?.length > 0
              ? `${(ziweiAnalysis as any).annual_year}???좊뀈?ы솕: ${(ziweiAnalysis as any).annual_transformations.map((t: any) => t.description).join(", ")}`
              : null,
            (ziweiAnalysis as any).natal_transformations?.length > 0
              ? `?좎쿇?ы솕: ${(ziweiAnalysis as any).natal_transformations.slice(0, 3).map((t: any) => `${t.type}(${t.star}??{t.palace})`).join(", ")}`
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
            (astrologyAnalysis as any).house_positions?.["10"] ? `10?섏슦??吏곸뾽沅?: ${(astrologyAnalysis as any).house_positions["10"]}` : null,
            (astrologyAnalysis as any).transits?.length > 0 ? `二쇱슂 ?몃옖吏? ${(astrologyAnalysis as any).transits[0]}` : null,
          ].filter(Boolean),
          topic_alignment: "medium"
        };
      })(),
      tarot: (() => {
        const careerCards = ["The Emperor", "The Chariot", "Ace of Pentacles", "Knight of Swords"];
        const matchedCards = input?.cards?.filter((c: any) => careerCards.includes(c.name)) || [];
        return {
          signals: matchedCards.map((c: any) => `${c.name}(${c.isReversed ? '??갑?? : '?뺣갑??}) ??${questionTopic} 愿??移대뱶`),
          topic_alignment: matchedCards.length > 0 ? "high" : "low"
        };
      })(),
      numerology: (() => {
        if (!numerologyResult) return null;
        return {
          signals: [
            (numerologyResult as any).life_path_number ? `?앸챸??${(numerologyResult as any).life_path_number} ??${(numerologyResult as any).vibrations?.[0] || "遺꾩꽍 以?}` : null,
          ].filter(Boolean),
          topic_alignment: (() => {
            const lp = (numerologyResult as any).life_path_number;
            if (!lp) return "low";
            // ?앸챸?섍? 吏덈Ц 二쇱젣? ?곌???寃쎌슦 medium ?댁긽 遺??            const careerNums = [1, 8];
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

  // ?? age_context ?앹꽦 (#85) ???꾩뿉??怨꾩궛??媛??ъ슜 ????????????????

  // ?? timeline_sync ?앹꽦 (#87) ????????????????????????????????????
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

    // 1. ?ъ＜ ???(daewoon)
    try {
      const sajuPeriods = sajuAnalysis?.daewoon || (sajuAnalysis as any)?.majorPeriods || [];
      const sajuPillars = Array.isArray(sajuPeriods) ? sajuPeriods : (sajuPeriods.pillars || []);
      sajuPillars.forEach((p: any) => {
        const isCurrent = p.isCurrent === true ||
          (p.startAge <= currentAge && p.endAge > currentAge);
        entries.push({
          system: "saju",
          type: "major_period",
          label: p.full || p.label || "???,
          age_range: `${p.startAge}~${p.endAge}??,
          current: isCurrent,
          interpretation: p.tenGodStem
            ? `泥쒓컙 ${p.tenGodStem} 쨌 吏吏 ${p.tenGodBranch}`
            : p.interpretation || ""
        });
      });
    } catch (_) {}

    // 2. ?먮??먯닔 ???    try {
      const ziweiMajor = ziweiAnalysis?.currentMajorPeriod;
      if (ziweiMajor) {
        entries.push({
          system: "ziwei",
          type: "major_period",
          label: `???${ziweiMajor.branch || ""}沅?(${ziweiMajor.palace || ""})`,
          age_range: `${ziweiMajor.startAge}~${ziweiMajor.endAge}??,
          current: true,
          interpretation: ziweiMajor.interpretation || ""
        });
      }
      const ziweiMinor = ziweiAnalysis?.currentMinorPeriod;
      if (ziweiMinor) {
        entries.push({
          system: "ziwei",
          type: "minor_period",
          label: `?뚰븳 ${ziweiMinor.branch || ""}`,
          age_range: `${ziweiMinor.age}??,
          current: true,
          interpretation: ziweiMinor.interpretation || ""
        });
      }
    } catch (_) {}

    // 3. ?먯꽦???몃옖吏?    try {
      const transits = astrologyAnalysis?.transits || [];
      transits.slice(0, 5).forEach((t: any) => {
        const label = typeof t === "string" ? t : (t.label || t.planet || "?몃옖吏?);
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

    // ?꾩옱 ?쒖꽦 ??ぉ 癒쇱?, ?섎㉧吏 ?섏씠 ???뺣젹
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

  // B-108: Life Timeline Engine ?곕룞 (Consensus ??Timeline ??Narrative ?뚯씠?꾨씪??
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

  // ?? validation & warnings ?앹꽦 ?????????????????????????????????
  const validationWarnings: string[] = [];
  let dataCompleteness = 1.0;

  // 異쒖깮 ?쒓컙 誘명솗??  if (!birthContext?.hasTime) {
    validationWarnings.push("birth_time_missing");
    dataCompleteness -= 0.15;
  }
  // 異쒖깮吏 誘명솗??  if (!birthContext?.hasPlace) {
    validationWarnings.push("birth_place_missing");
    dataCompleteness -= 0.10;
  }
  // ?濡?移대뱶 誘몃끂異?(5??誘몃쭔) ??data-only 紐⑤뱶??移대뱶 ?놁쓬???뺤긽?대?濡??쒖쇅 (B-157)
  if (input.mode !== "data-only" && (!input?.cards || input.cards.length < 5)) {
    validationWarnings.push("tarot_cards_insufficient");
    dataCompleteness -= 0.10;
  }
  // ?뚮젰 蹂???щ? ?뺤씤
  if (((rawBirth as any)?.isLunar || (rawBirth as any)?.isLunarDate) && !solarBirthInfo) {
    validationWarnings.push("lunar_conversion_failed");
    dataCompleteness -= 0.20;
  }
  // consensus_score ??쓣 ??  if (consensusResult?.consensus_score < 0.3) {
    validationWarnings.push("low_consensus_score");
  }
  // ?? system_vectors 湲곗뿬????텛??(#83) ???????????????????????????
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

    // 媛??쒖뒪?쒕퀎 踰≫꽣 吏묎퀎
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

      // ?뺢퇋??      const normalized: Record<string, number> = {};
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



  // B-61: edge_case_tags ?앹꽦
  const edgeCaseTags: string[] = [];
  if (birthInfo.hour === 23) edgeCaseTags.push("?쇱옄??鸚쒎춴??");
  if (!birthInfo.birthTime) edgeCaseTags.push("異쒖깮??誘몄엯??);
  if (!birthInfo.birthPlace) edgeCaseTags.push("異쒖깮吏 誘몄엯??);
  if (consensusResult.conflict_log?.some(c => c.conflict_level === "severe")) edgeCaseTags.push("?붿쭊媛??ш컖 異⑸룎");
  if (consensusResult.conflict_log?.some(c => c.conflict_level === "moderate")) edgeCaseTags.push("?붿쭊媛?以묎컙 異⑸룎");
  if (sajuRaw?.termIdx === 0 || sajuRaw?.termIdx === 11) edgeCaseTags.push("?덇린 寃쎄퀎 洹쇱쿂");

  // B-61: final_decision_logic ?앹꽦
  const severeConflictPairs = consensusResult.conflict_log
    ?.filter(c => c.conflict_level === "severe")
    .map(c => c.pair) || [];
  const finalDecisionLogic = severeConflictPairs.length > 0
    ? `?濡?二쇰룄 ?먮떒 ??${severeConflictPairs.join(", ")} 異⑸룎濡?蹂댁“ ?붿쭊 議곌굔遺 李멸퀬. ${consensusResult.conflict_log?.find(c => c.mediator)?.mediator || ""}`
    : consensusResult.conflict_log?.some(c => c.conflict_level === "moderate")
    ? `?濡?二쇰룄 + 蹂댁“ 寃쎄퀬 ?ы븿 ??${consensusResult.conflict_summary}`
    : `?꾩껜 ?붿쭊 ?⑹쓽 ???듯빀 ?좊ː??${(consensusResult.confidence_score * 100).toFixed(0)}%`;

  // B-63: consensus vector 湲곕컲 理쒖쥌 ?濡?移대뱶 ?먮룞 ?좏깮
  const dominantDim = Object.entries(consensusResult.dominant_vector || {})
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const consensusCardSuggestion = dominantDim
    ? `?⑹쓽 踰≫꽣 理쒖긽??李⑥썝: ${dominantDim} ??愿???濡?移대뱶 媛뺤“ 沅뚯옣`
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
    // B-61: ?ㅽ궎留?媛쒖꽑
    edge_case_tags: edgeCaseTags,
    final_decision_logic: finalDecisionLogic,
    conflict_log: consensusResult.conflict_log || [],
    conflict_summary: consensusResult.conflict_summary || "",
    // B-62: ?먯떆 ?붿쭊 ?곗씠??蹂묐젹 ???    system_calculations: {
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
    // B-63: consensus vector 湲곕컲 移대뱶 ?쒖븞
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
    // B-66: AI ?대윭?곕툕 吏移?(?좊ː?꽷룹땐??湲곕컲 ??寃곗젙)
    ai_narrative_directive: (() => {
      const cs = consensusResult.confidence_score;
      const hasSevere = consensusResult.conflict_log?.some(c => c.conflict_level === "severe");
      const hasModeRate = consensusResult.conflict_log?.some(c => c.conflict_level === "moderate");
      if (cs >= 0.8 && !hasSevere) {
        return {
          tone: "confident",
          instruction: "紐⑤뱺 ?붿쭊??媛뺥븯寃??⑹쓽?⑸땲?? ?뺤떊??李??댁“濡?紐낇솗?섍쾶 ?댁꽍?섏꽭??",
          emphasis: "吏곸젒?곸씠怨?援ъ껜?곸씤 ?덉륫 以묒떖"
        };
      } else if (cs < 0.5 || hasSevere) {
        return {
          tone: "cautious",
          instruction: "?붿쭊 媛?異⑸룎??媛먯??섏뿀?듬땲?? 媛?μ꽦怨?議곌굔??媛뺤“?섎ŉ ?좎쨷?섍쾶 ?댁꽍?섏꽭??",
          emphasis: "議곌굔遺 ?쒗쁽('~?????덈떎', '~媛?μ꽦') ?ъ슜, ?濡??먮떒 ?곗꽑"
        };
      } else {
        return {
          tone: "balanced",
          instruction: "遺遺꾩쟻 ?⑹쓽 ?곹깭?낅땲?? 洹좏삎 ?≫엺 ?쒓컖?쇰줈 ?щ윭 媛?μ꽦???④퍡 ?쒖떆?섏꽭??",
          emphasis: hasModeRate ? "異⑸룎 ?곸뿭? 議곌굔遺濡??쒗쁽" : "湲띿젙쨌遺??媛?μ꽦 洹좏삎 ?덇쾶 ?쒖닠"
        };
      }
    })(),

    // B-71new_p3: 異붾줎 異붿쟻 (reasoning_trace)
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
        `1. ?좏뵿 媛먯?: ${finalTopic} ??媛以묒튂 議곗젙`,
        `2. 踰≫꽣 ?섎졃: ${patternVectors.length}媛??붿쭊 遺꾩꽍`,
        `3. 異⑸룎 媛먯?: ${consensusResult.conflict_log?.length ?? 0}嫄?,
        `4. 理쒖쥌 ?좊ː?? ${Math.round(consensusResult.confidence_score * 100)}%`,
        `5. ?대윭?곕툕 ?? ${consensusResult.confidence_score >= 0.8 ? "confident" : consensusResult.confidence_score < 0.5 ? "cautious" : "balanced"}`
      ]
    },
  };
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??// Helper Functions
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
interface SystemScoreDetail {
  data_quality_score: number;      // ?곗씠??議댁옱쨌?꾩쟾??(0~0.4)
  signal_strength_score: number;   // 踰≫꽣 紐낇솗?꽷룹＜???쇱튂??(0~0.6)
  total: number;                   // ?⑷퀎 (0~1.0)
  confidence: number;              // ?좊ː??(0~1.0, total??蹂댁젙媛?
  penalties: string[];             // 媛먯젏 ?ъ쑀 紐⑸줉
  reasoning: string;               // ?먯닔 ?곗텧 洹쇨굅 ??以??붿빟
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

  // ?? data_quality_score (0~0.85) ?????????????????????????????
  let dq = 0;
  if (sysData && sysData.characteristics?.length > 0) dq += 0.2;
  if (dataPoints.length > 0) dq += 0.15;
  if (dataPoints.length >= 3) dq += 0.05;

  // numerology留??붿쭊?먯꽌 ?꾨떖??score媛 ?덉쑝硫??곗꽑 ?곸슜 (?대쫫 怨꾩궛 ??0.85)
  if (systemName === "numerology" && sysData?.data_quality_score) {
    dq = sysData.data_quality_score;
  } else if (systemName === "numerology" && sysData?.life_path_number) {
    dq = Math.max(dq, 0.4);
  }

  // 異쒖깮 ?뺣낫 ?⑤꼸??  if ((systemName === "ziwei" || systemName === "astrology") && birthContext && !birthContext.hasTime) {
    dq *= 0.5;
    penalties.push("birth_time_missing");
  }

  // ?? signal_strength_score (0~0.6) ?????????????????????????
  // 踰≫꽣 紐낇솗??(0~0.3)
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

  // 二쇱젣 ?쇱튂??(0~0.3)
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
  const scoreAlignment = 0.3; // topic_mismatch ?섎꼸???쒓굅 ????긽 0.3 ?곸슜

  const ss = scoreClarity + scoreAlignment;

  const total = Math.min(1.0, dq + ss);
  const confidence = penalties.length === 0
    ? total
    : total * (1 - penalties.length * 0.08);

  const reasoning = `data_quality=${dq.toFixed(2)}, clarity=${scoreClarity.toFixed(2)}, alignment=${scoreAlignment.toFixed(2)}, penalties=[${penalties.join(",")}]`;

  return { data_quality_score: dq, signal_strength_score: ss, total, confidence, penalties, reasoning };
}

function buildFallbackReading(text: string, grade: string, scores: any, cards: any[], question: string, style: string = 'hanna') {
  const defaultText = text || "?멸났吏??紐⑤뜽???묐떟???뚯떛?섎뒗 怨쇱젙?먯꽌 ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎. ?붿빟???뺣낫瑜?湲곕컲?쇰줈 議곗뼵 ?쒕┰?덈떎.";
  
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
      tarot_convergence: { count: 1, systems: ["?⑥씠???濡?], common_keywords: [] }, 
      internal_validation: "寃쎄퀬", 
      divergent_note: "?뚯떛 ?ㅻ쪟濡??명빐 ?곸꽭 援먯감 寃利??뺣낫媛 ?먯떎?섏뿀?듬땲??" 
    },
    love_analysis: null,
    action_guide: { 
      do_list: ["李⑦썑???ㅼ떆 ??踰?遺꾩꽍???쒕룄?대낫?몄슂"], 
      dont_list: ["寃곌낵媛 ?꾨씫?섏뿀?ㅺ퀬 ?댁꽌 ?댁꽭 ?먯껜媛 遺?뺤쟻??寃껋? ?꾨떃?덈떎"], 
      lucky: { color: "?붿씠??, number: "7", item: "硫붾え?? } 
    },
    final_message: { title: "由щ뵫 ?붿빟", summary: defaultText },
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
      // 500/502/503/429 Retry logic (Max 3 retries)
      const retryableStatuses = [429, 500, 502, 503];
      if (retryableStatuses.includes(response.status) && attempt < 3) {
        const waitMs = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
        console.log("[GEMINI RETRY]", { attempt: attempt + 1, statusCode: response.status, waitMs });
        await new Promise(resolve => setTimeout(resolve, waitMs));
        return doFetch(attempt + 1);
      }
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  };

  // 1李??쒕룄
  let result = await doFetch();

  // B-204: 鍮??묐떟?대㈃ 1珥??湲???1??異붽? ?ъ떆??(?⑺듃泥댄겕??
  if (!result || result === "{}") {
    console.warn("[B-204] Gemini 鍮??묐떟 媛먯? ??1珥????ъ떆??);
    await new Promise(resolve => setTimeout(resolve, 1000));
    result = await doFetch(); // ?ш린?쒕룄 doFetch ?대???503 濡쒖쭅? ?묐룞??    if (!result || result === "{}") {
      console.error("[B-204] ?ъ떆???꾩뿉??鍮??묐떟 ??fallback 吏꾪뻾");
    } else {
      console.log("[B-204] ?ъ떆???깃났");
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
      // 500/502/503/429 Retry logic (Max 3 retries)
      const retryableStatuses = [429, 500, 502, 503];
      if (retryableStatuses.includes(response.status) && attempt < 3) {
        const waitMs = Math.pow(2, attempt + 1) * 1000;
        console.log("[GEMINI RETRY]", { attempt: attempt + 1, statusCode: response.status, waitMs });
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

/**
 * integratedReadingEngine.ts (v9)
 * - Production AI Symbolic Prediction Engine Platform.
 * - Runtime Flow: Calc -> Pattern -> Semantic -> Consensus -> Temporal -> Validation -> Narrative.
 * - v9 蹂寃쎌궗?? Mock ?먯꽦???먮??먯닔 ?쒓굅 ???꾨줎???ㅺ퀎???곗씠???ъ슜
 */

import { calculateSaju } from "./calculateSaju.ts";
import { analyzeSajuStructure } from "./aiSajuAnalysis.ts";
import { runTarotSymbolicEngine } from "./tarotSymbolicEngine.ts";
import { generatePatternVectors } from "./symbolicPatternEngine.ts";
import { calculateConsensusV8 } from "./consensusEngine.ts";
import { predictTemporalV8 } from "./temporalPredictionEngine.ts";
import { validateEngineOutput } from "./validationLayer.ts";
import { getLocalizedStyle, buildLocalizedNarrativePrompt } from "./interactivityLayer.ts";
import { calculateNumerology } from "./numerologyEngine.ts";
import { validateV3Schema, patchMissingFields, logMonitoringEvent } from "./monitoringLayer.ts";
import { safeParseGeminiJSON } from "./jsonUtils.ts";
import { calculateServerAstrology } from "./astrologyEngine.ts";
import { calculateServerZiWei } from "./ziweiEngine.ts";

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

/** 24?덇린 ?쒓뎅??留ㅽ븨 (?낆텣 湲곗?) */
const KOREAN_SOLAR_TERMS = [
  "?낆텣", "寃쎌묩", "泥?챸", "?낇븯", "留앹쥌", "?뚯꽌",
  "?낆텛", "諛깅줈", "?쒕줈", "?낅룞", "???, "?뚰븳"
];

export function buildEnginePrompts(input: any, sajuRaw: any, sajuAnalysis: any, ziweiAnalysis?: any, astrologyAnalysis?: any) {
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
    dayMaster: (sajuAnalysis?.dayMaster && sajuAnalysis.dayMaster !== "Unknown") ? sajuAnalysis.dayMaster : 
      (dbSaju?.pillar?.data ? getDayMasterFromData(dbSaju.pillar.data) : (dbSaju?.dayPillar?.cheongan || "Unknown")),
    elements: (sajuAnalysis?.elements && Object.keys(sajuAnalysis.elements).length > 0) ? 
      Object.entries(sajuAnalysis.elements).map(([k, v]) => `${k}${v}`).join(" ") : 
      (dbSaju?.yinyang?.data ? `紐?{dbSaju.yinyang.data.wood || 0} ??{dbSaju.yinyang.data.fire || 0} ??{dbSaju.yinyang.data.earth || 0} 湲?{dbSaju.yinyang.data.metal || 0} ??{dbSaju.yinyang.data.water || 0}` : "遺꾩꽍 遺덇?"),
    yongShin: (sajuAnalysis?.yongShin && sajuAnalysis.yongShin !== "Unknown") ? sajuAnalysis.yongShin : 
      (dbSaju?.yongsin?.data ? getYongShinFromData(dbSaju.yongsin.data, 'yong') : "?곗씠??遺議?),
    heeShin: (sajuAnalysis?.heeShin && sajuAnalysis.heeShin !== "Unknown") ? sajuAnalysis.heeShin :
      (dbSaju?.yongsin?.data ? getYongShinFromData(dbSaju.yongsin.data, 'hee') : "?곗씠??遺議?),
    strength: (sajuAnalysis?.strength && sajuAnalysis.strength !== "Unknown") ? sajuAnalysis.strength : "遺꾩꽍 遺덇?",
    termName: (sajuRaw?.termIdx !== undefined) ? KOREAN_SOLAR_TERMS[sajuRaw.termIdx] : "?????놁쓬"
  };

  const luckyFactors = LUCKY_MAP[sajuDisplay.yongShin] || { color: "?ㅼ뼇??, number: "?꾩껜", direction: "以묒븰" };

  // ?붿쭊 ?곸쭠??寃곌낵 (Calculated Symbolic Results)
  const mingGong = ziweiAnalysis?.palaces.find((p: any) => p.name === "紐낃턿");
  const mingStars = mingGong?.main_stars?.join(", ") || "?곗씠??遺議?;
  
  const ziweiSymbolic = `
- 紐낃턿(${ziweiAnalysis?.mingGong || "誘몄긽"}): ${mingStars} 醫뚯젙.
- 援? ${ziweiAnalysis?.bureau || "遺꾩꽍 遺덇?"}
- ?깅퀎: ${birthInfo.gender === 'M' ? '?뚮궓(?곁뵹)' : '?묐?(?썲Ⅳ)'}
- 吏移? ?쒓났??紐낅컲??援?낵 二쇱꽦 ?섎?瑜?以묒떖?쇰줈 由щ뵫???꾧컻?섏떆??
`;

  const astrologySymbolic = `
- 李⑦듃 二쇱슂 ?뱀쭠: ${astrologyAnalysis?.characteristics?.join(", ") || "?곗씠??遺議?}
- 吏移? ???붿쭊 ?몄텧 寃곌낵(?곸쭠)瑜?洹몃?濡??ъ슜?섍퀬, ?됱꽦 ?꾩튂瑜?吏곸젒 怨꾩궛?섏? 留덉떆??
`;



  const ziweiPrompt = `

[?먮??먯닔 ?붿쭊 ?몄텧 寃곌낵 - ?곸쭠???꾨즺]
${ziweiSymbolic}
- 湲곕낯?뺣낫: ${birthInfo.year}??${birthInfo.month}??${birthInfo.day}??${birthInfo.hour}??${birthInfo.minute}遺?(${birthInfo.gender === 'M' ? '?뚮궓 ?곁뵹' : '?묐? ?썲Ⅳ'})
- ?꾩옱 ??? ${ziweiAnalysis?.currentMajorPeriod?.interpretation || "?곗씠??遺議?}
- ?뚰븳: ${ziweiAnalysis?.currentMinorPeriod?.interpretation || "?곗씠??遺議?}
- ?ы솕: ${Array.isArray(ziweiAnalysis?.four_transformations) ? ziweiAnalysis.four_transformations.map((t: any) => t.description).join(", ") : "?곗씠??遺議?}
`;

  const astrologyPrompt = `
[?먯꽦???붿쭊 ?몄텧 寃곌낵 - ?곸쭠???꾨즺]
${astrologySymbolic}
- 湲곗? ?쒖젏: 2026??3???몃옖吏?- 6/30: 紐⑹꽦 ?ъ옄?먮━(Leo) 吏꾩엯 ?덉젙
- ?꾩옱 ?몃옖吏??곹솴:
${(astrologyAnalysis?.transits || []).map((t: any) => `  * ${t}`).join("\n")}

諛섎뱶???ы븿???댁슜:
1. ?쒖뼇, ?? ?곸듅沅??ъ씤 (?쒓났???ъ씤???쒖슜)
2. ?ㅼ씠??李⑦듃 ?듭떖 ?댁뒪?숉듃 (?붿쭊 遺꾩꽍 湲곕컲)
3. ?뺤젙??2026???몃옖吏??곗씠??湲곕컲???꾩옱 ?댁꽭 ?댁꽍
`;

  const sajuSymbolic = `
${yinyangMessage}- ?듭떖 湲곗슫: ${sajuDisplay.yongShin} -> [?곸쭠: ${SYMBOLIC_MEANINGS[sajuDisplay.yongShin === "麗? ? "Water_Su" : sajuDisplay.yongShin === "?? ? "Metal_Keum" : ""] || "?꾨Ц?붾맂 ?대㈃ ?먮꼫吏"}]
- ?붿냼 洹좏삎: ${sajuDisplay.elements}
`;

  return { sajuDisplay, luckyFactors, ziweiPrompt, astrologyPrompt, sajuSymbolic };
}

export async function runFullProductionEngineV8(supabaseClient: any, apiKey: string, input: any) {
  const pipelineStart = Date.now();
  const sessionId = input.sessionId;
  const tarotCards = input.cards || [];

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
    };
  } else {
    birthInfo = { year: 2000, month: 1, day: 1, hour: 12, minute: 0, gender: "M" };
    console.warn("[Engine] No birthInfo provided, using defaults");
  }

  // Step 1: Physical Calculation Pipeline
  const sajuRaw = calculateSaju(
    birthInfo.year, birthInfo.month, birthInfo.day, 
    birthInfo.hour, birthInfo.minute, birthInfo.gender
  );
  const sajuAnalysis = await analyzeSajuStructure(sajuRaw);
  const tarotSymbolic = runTarotSymbolicEngine(input.cards || [], input.question);

  // Server-side astrology calculation (Swiss Ephemeris based)
  const serverAstrology = calculateServerAstrology(
    birthInfo.year, birthInfo.month, birthInfo.day, birthInfo.hour, birthInfo.minute,
    birthInfo.latitude, birthInfo.longitude
  );
  const astrologyAnalysis = {
    system: "astrology",
    characteristics: [
      ...(serverAstrology.keyAspects || []).slice(0, 5),
      serverAstrology.dominantElement ? `${serverAstrology.dominantElement} element dominant` : null,
    ].filter(Boolean) as string[],
    planet_positions: serverAstrology.planets,
    house_positions: {
      ASC: serverAstrology.house_positions?.ASC || serverAstrology.risingSign,
      MC: serverAstrology.house_positions?.MC || "Unknown",
      IC: serverAstrology.house_positions?.IC || "Unknown",
      DESC: serverAstrology.house_positions?.DESC || "Unknown",
    },
    major_aspects: serverAstrology.keyAspects.slice(0, 5),
    sunSign: serverAstrology.sunSign,
    moonSign: serverAstrology.moonSign,
    risingSign: serverAstrology.risingSign,
    elementDistribution: serverAstrology.elements,
    qualityDistribution: serverAstrology.qualities,
    transits: serverAstrology.transits,
  };

  // Server-side Ziwei Doushu calculation
  const lunarMonth = birthInfo.month; // TODO: solar?뭠unar conversion if needed
  const lunarDay = birthInfo.day;
  const genderZiwei = (birthInfo.gender === "M" || birthInfo.gender === "male") ? "male" as const : "female" as const;
  const serverZiwei = calculateServerZiWei(
    birthInfo.year, lunarMonth, lunarDay, birthInfo.hour, birthInfo.minute, genderZiwei
  );
  const ziweiAnalysis = {
    system: "ziwei",
    characteristics: [
      ...serverZiwei.palaces.flatMap(p => p.stars.filter(s =>
        ["?뚭뎔", "?먮?", "泥쒕?", "移좎궡", "臾닿끝", "?쒖뼇", "泥쒓린", "?쇱젙"].includes(s.star)
      ).map(s => s.star)),
      ...serverZiwei.natalTransformations.map(t => `${t.type} active`),
      serverZiwei.palaces[0]?.stars.length > 0 ? "Main star active" : null,
    ].filter(Boolean) as string[],
    palaces: serverZiwei.palaces.map(p => ({
      name: p.name,
      main_stars: p.stars.map(s => s.star),
      location: p.branch,
    })),
    mingGong: serverZiwei.mingGong,
    bureau: serverZiwei.bureau,
    four_transformations: serverZiwei.natalTransformations,
    currentMajorPeriod: serverZiwei.currentMajorPeriod,
    currentMinorPeriod: serverZiwei.currentMinorPeriod,
  };

  const numerologyResult = calculateNumerology(
    `${birthInfo.year}-${String(birthInfo.month).padStart(2,'0')}-${String(birthInfo.day).padStart(2,'0')}`,
    new Date().getFullYear(),
    input.userName
  );

  const systemResults = [
    { 
      system: "saju", 
      ...sajuAnalysis 
    },
    { 
      system: "tarot", 
      category: tarotSymbolic.category, 
      characteristics: [
        ...Object.keys(tarotSymbolic.dominant_patterns),
        ...input.cards.map((c: any) => c.name)
      ] 
    },
    { system: "numerology", ...numerologyResult },
    {
      ...astrologyAnalysis,
      characteristics: [
        ...(astrologyAnalysis?.characteristics || []),
        astrologyAnalysis?.sunSign ? `${astrologyAnalysis.sunSign} ?쒖뼇` : null,
        astrologyAnalysis?.moonSign ? `${astrologyAnalysis.moonSign} ?? : null,
        astrologyAnalysis?.risingSign ? `${astrologyAnalysis.risingSign} ?곸듅沅? : null
      ].filter(Boolean)
    },
    {
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
    if (r.system === "ziwei") return !!r.palaces;
    if (r.system === "numerology") return !!r.life_path_number;
    return false;
  });

  const questionType = tarotSymbolic.category;
  const rawVectors = generatePatternVectors(systemResults);
  // Symbol 湲곗? 以묐났 ?쒓굅 (Set/filter)
  const patternVectors = rawVectors.filter((v, i, a) => 
    a.findIndex(t => t.symbol === v.symbol) === i
  );
  console.log(`?뱤 [Vector Merge] 以묐났 ?쒓굅 ?꾨즺: ${rawVectors.length} -> ${patternVectors.length}`);
  const consensusResult = calculateConsensusV8(patternVectors);
  const temporalResult = predictTemporalV8(consensusResult, systemResults, questionType);
  const validationResult = validateEngineOutput(consensusResult, patternVectors, systemResults, questionType);

  // Step 2: Scale & Grade Logic
  const grade = consensusResult.consensus_score >= 0.7 ? "S"
    : consensusResult.consensus_score >= 0.5 ? "A"
    : consensusResult.consensus_score >= 0.3 ? "B" : "C";

  const scores = {
    tarot: Math.round(calculateSystemScore(systemResults, "tarot") * 100),
    saju: Math.round(calculateSystemScore(systemResults, "saju") * 100),
    astrology: Math.round(calculateSystemScore(systemResults, "astrology") * 100),
    ziwei: Math.round(calculateSystemScore(systemResults, "ziwei") * 100),
    overall: Math.round(((consensusResult.consensus_score + 1) / 2) * 100),
  };

  // Step 3: Narrative Engine (Gemini JSON) + Monitoring
  
  // Step 2-B: Mapping Saju Data for Prompt
  const { sajuDisplay, luckyFactors, ziweiPrompt, astrologyPrompt, sajuSymbolic } = buildEnginePrompts(input, sajuRaw, sajuAnalysis, ziweiAnalysis, astrologyAnalysis);
  
  const daewoonPromptSection = sajuAnalysis.daewoon?.currentDaewoon
    ? `
  - ?꾩옱 ??? ${sajuAnalysis.daewoon.currentDaewoon.full} (${sajuAnalysis.daewoon.currentDaewoon.startAge}~${sajuAnalysis.daewoon.currentDaewoon.endAge}??
  - ???泥쒓컙 ??꽦: ${sajuAnalysis.daewoon.currentDaewoon.tenGodStem}
  - ???吏吏 ??꽦: ${sajuAnalysis.daewoon.currentDaewoon.tenGodBranch}
  - ???吏꾪뻾諛⑺뼢: ${sajuAnalysis.daewoon.isForward ? "?쒗뻾" : "??뻾"}
  - ?꾩껜 ????먮쫫: ${sajuAnalysis.daewoon.pillars.map((p: any) => `${p.full}(${p.startAge}??`).join(" ??")}
    `
    : "- ????뺣낫: ?곗씠??遺議깆쑝濡??앸왂";

  const dataBlock = `
[?ъ＜ ?붿쭊 ?몄텧 寃곌낵 - ?곸쭠???꾨즺]
${sajuSymbolic}
- ?ъ＜ 4二? ${sajuDisplay.fourPillars}
- ?쇨컙(Day Master): ${sajuDisplay.dayMaster}
- ?ㅽ뻾 遺꾪룷: ${sajuDisplay.elements}
- ?⑹떊(Yong-Shin): ${sajuDisplay.yongShin}
- ?ъ떊: ${sajuDisplay.heeShin}
- ?좉컯/?좎빟: ${sajuDisplay.strength}
- ?쒖뼱???덇린: ${sajuDisplay.termName}
- ?됱슫 ?붿냼: ?됱긽(${luckyFactors.color}), ?レ옄(${luckyFactors.number}), 諛⑺뼢(${luckyFactors.direction})
- ???遺꾩꽍: ${daewoonPromptSection}
- ?濡?移대뱶: ${JSON.stringify(tarotCards)}
- ?먯꽦?? ${astrologyPrompt}
- ?먮??먯닔: ${ziweiPrompt}
- ?섎퉬?? ${JSON.stringify(numerologyResult)}
- ?⑹쓽?? consensus_score=${consensusResult.consensus_score.toFixed(3)}
- ?쒓컙異??덉륫: ${JSON.stringify(temporalResult)}
- 吏덈Ц ?좏삎: ${questionType}
- ?좏슚 遺꾩꽍 ?쒖뒪???? ${activeEngines.length} (?꾩껜 ${systemResults.length}媛?以?

[異붽? 遺꾩꽍 吏移?
0. **?濡??댁꽍 ?먯튃(理쒖슦???쒖쐞)**: 移대뱶???꾪넻???섎???李멸퀬留??섍퀬, 吏덈Ц?먯쓽 ?곹솴怨?留λ씫??留욊쾶 ?좎뿰?섍쾶 ?댁꽍??寃? '??移대뱶??~???섎??⑸땲?? 媛숈? ?⑥젙 ?쒗쁽 ???'???먮━?먯꽌 ??移대뱶??~???먮쫫??蹂댁뿬以띾땲?? ?뺥깭濡??쒗쁽??寃? (理쒗븳??紐⑤굹???ㅽ???怨듯넻 ?곸슜)
1. ?쒓났???ъ＜ ?곗씠?곕쭔??洹쇨굅濡?遺꾩꽍?섏꽭?? ?ㅽ뻾 遺꾪룷? ??꽦 遺꾪룷瑜??뺥솗??諛섏쁺?댁빞 ?⑸땲??
2. 留뚯빟 ?뱀젙 ?ㅽ뻾(?? ?ъ꽦, 愿????0?대씪硫??덈?濡??대떦 ?댁씠 醫뗫떎怨?怨쇱옣?섏? 留덉꽭?? (?? ?ъ꽦 0?대㈃ '?섏씡蹂대떎???먯븘?ㅽ쁽 湲곕컲'?쇰줈 ?댁꽍)
3. ?몃옖吏??됱꽦 ?꾩튂??諛섎뱶???쒓났???곗씠?곕쭔 ?ъ슜?섍퀬, ?ㅼ뒪濡?異붿륫?섏? 留덉꽭??
4. ?먮??먯닔 紐낅컲??援?낵 二쇱꽦, 洹몃━怨??ы솕???곹뼢???뺥솗??諛섏쁺?섏뿬 由щ뵫???꾧컻?섏꽭??
5. ?됱슫 ?붿냼(?됱긽, ?レ옄, 諛⑺뼢)??諛섎뱶??'?됱슫 ?붿냼' ?곗씠??釉붾줉???쒓났???댁슜??action_guide.lucky ?뱀뀡??諛섏쁺?섏꽭??
6. **?ъ＜ 遺꾩꽍 ?댁“ 諛?援ъ“(?뚯씠x以???ㅽ???**: 
   - 'merged_reading.structureInsight' ?뱀뀡? 諛섎뱶???ㅼ쓬 5?④퀎 援ъ“濡??묒꽦?섏꽭??
     ???ы쉶?먮쫫 (?꾩옱 ?쒕???諛곌꼍怨??ъ＜ 湲곗슫??議고솕)
     ???덇린 湲곕컲 湲곗쭏 (?쒖뼱???덇린???곕Ⅸ 蹂몄쭏???깊뼢)
     ???듭떖 肄붾뱶 (?ъ＜ 援ъ꽦??愿?듯븯?????섎굹???듭떖 ?ㅼ썙??肄붾뱶)
     ???꾨왂 (?띠쓣 ??섎뒗 理쒖꽑??諛⑹떇)
     ???됰룞怨꾪쉷 (援ъ껜?곸씤 ?ㅼ쿇 諛⑹븞)
   - ?댁“???⑦샇?섎㈃?쒕룄 ?듭같???덈뒗 '留덉뒪????臾몄껜瑜??ъ슜?섏꽭??

[?섎졃 遺꾩꽍 吏移?
遺꾩꽍??李몄뿬???좏슚 ?붿쭊 ?? ${patternVectors.map(v => v.system).filter((v, i, a) => a.indexOf(v) === i).length}媛??섎졃 遺꾩꽍 ?? "?곗씠??遺議??대굹 "遺꾩꽍 遺덇?"??泥닿퀎???꾩쟾???쒖쇅?섍퀬, ?ㅼ젣 ?곗씠?곌? ?덈뒗 ?붿쭊???ъ씠??'?쇱튂(Convergence)'? '異⑸룎(Divergence)'??援щ텇?섏뿬 ?쒖닠?섏꽭??
異쒕젰 JSON??"total_systems"?????좏슚 ?붿쭊 ?섎?, "converged_count"??洹몄쨷 ?쇱튂?꾧? ?믪? ?붿쭊 ?섎? 湲곗엯?섏꽭??
`;

  const totalSystems = activeEngines.length; // Tarot counts as 1 now
  const validStyles = ['hanna', 'monad', 'e7l3', 'e5l5', 'l7e3'];
  const requestedStyle = validStyles.includes(input.style) ? input.style : 'hanna';
  const modelInput = buildLocalizedNarrativePrompt(input.locale || 'kr', dataBlock, totalSystems, requestedStyle);

  // Gemini ?몄텧 ????대컢 ?쒖옉
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
    parsed = buildFallbackReading("?곗씠??遺꾩꽍 ?꾩슜 紐⑤뱶?낅땲?? AI ?대윭?곕툕媛 ?앹꽦?섏? ?딆븯?듬땲??", grade, scores, tarotCards, input.question, requestedStyle);
  } else {
    console.log("GPT ?몄텧 ?쒖옉:", JSON.stringify({model: "gemini-2.5-pro", promptLength: modelInput.length}));
    try {
      rawNarrative = await fetchGemini(apiKey, "gemini-2.5-pro", modelInput, "");
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
      console.log("[Parse Stage] safeParseGeminiJSON ?쒖옉 (Fallback ?섎┰??");
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

  // 鍮꾨룞湲?紐⑤땲?곕쭅
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
    internal_validation: validationResult.isValid ? "?듦낵" : "寃쎄퀬"
  };
  parsed.scores = scores;

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
    grade: grade,
    prediction_strength: consensusResult.prediction_strength
  };
  parsed.engine = {
    consensus: consensusResult,
    consensus_score: consensusResult.consensus_score,
    confidence_score: consensusResult.confidence_score,
    prediction_strength: consensusResult.prediction_strength,
    timeline: temporalResult,
    validation: validationResult,
    vectors: patternVectors,
    system_weights: { saju: 0.30, astrology: 0.25, tarot: 0.20, ziwei: 0.15, numerology: 0.10 },
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

  return {
    status: "success",
    result_status: (responseType === "valid_json" && schemaResult.passed) ? "normal" : "degraded",
    response_type: responseType,
    error: (responseType === "timeout") ? "Gemini call failed" : null,
    error_message: fetchErrorMessage,
    raw_narrative: rawNarrative,
    debug_prompt: modelInput,
    engine: parsed.engine,
    reading: parsed,
    management_tracks: {
      consultation_copy: consultationCopy,
      llm_origin_json: llmOriginJson
    },
    integrated_summary: parsed.final_message?.summary || parsed.merged_reading?.coreReading || "",
    practical_advice: parsed.action_guide?.do_list?.join(", ") || "",
    system_calculations: {
      saju: sajuAnalysis,
      astrology: astrologyAnalysis,
      ziwei: ziweiAnalysis,
      numerology: numerologyResult
    },
    saju_raw: sajuRaw,
    saju_analysis: sajuAnalysis, // Redundant top-level
    analyses: { 
      saju: sajuAnalysis, 
      tarot: tarotSymbolic, 
      astrology: astrologyAnalysis, 
      ziwei: ziweiAnalysis, 
      numerology: numerologyResult 
    },
  };
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??// Helper Functions
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
function calculateSystemScore(systemResults: any[], systemName: string): number {
  const sysData = systemResults.find(v => v.system === systemName);
  if (!sysData) return 0.5;
  
  const vector = sysData.vector;
  if (!vector) return 0.7;

  const vals = Object.values(vector) as number[];
  const magnitude = Math.sqrt(vals.reduce((sum, x) => sum + x * x, 0));
  return Math.min(1, magnitude / 2);
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

async function fetchGemini(apiKey: string, model: string, system: string, _user: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: system }] }],
      generationConfig: { 
        // response_mime_type: "application/json",
        maxOutputTokens: 8192
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

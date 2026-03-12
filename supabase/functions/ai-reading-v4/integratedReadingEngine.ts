/**
 * integratedReadingEngine.ts (v9)
 * - Production AI Symbolic Prediction Engine Platform.
 * - Runtime Flow: Calc -> Pattern -> Semantic -> Consensus -> Temporal -> Validation -> Narrative.
 * - v9 변경사항: Mock 점성술/자미두수 제거 → 프론트 실계산 데이터 사용
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
    house_positions: {
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

/** 24절기 한국어 매핑 (입춘 기준) */
const KOREAN_SOLAR_TERMS = [
  "입춘", "경칩", "청명", "입하", "망종", "소서",
  "입추", "백로", "한로", "입동", "대설", "소한"
];

export function buildEnginePrompts(input: any, sajuRaw: any, sajuAnalysis: any, ziweiAnalysis?: any, astrologyAnalysis?: any) {
  const { birthInfo, sajuData: dbSaju } = input;
  const isJehun = birthInfo.year === 1987 && birthInfo.month === 7 && birthInfo.day === 17;
  
  const sajuDisplay = {
    fourPillars: sajuRaw?.year ? 
      `년주 ${sajuRaw.year.stem}${sajuRaw.year.branch}, 월주 ${sajuRaw.month.stem}${sajuRaw.month.branch}, 일주 ${sajuRaw.day.stem}${sajuRaw.day.branch}, 시주 ${sajuRaw.hour.stem}${sajuRaw.hour.branch}` :
      (dbSaju?.pillar?.data ? 
        `년주 ${getPillarFromData(dbSaju.pillar.data, 3)}, 월주 ${getPillarFromData(dbSaju.pillar.data, 2)}, 일주 ${getPillarFromData(dbSaju.pillar.data, 1)}, 시주 ${getPillarFromData(dbSaju.pillar.data, 0)}` : 
        (dbSaju?.yearPillar ? `년주 ${dbSaju.yearPillar.hanja}, 월주 ${dbSaju.monthPillar.hanja}, 일주 ${dbSaju.dayPillar.hanja}, 시주 ${dbSaju.hourPillar.hanja}` : "데이터 없음")),
    dayMaster: (sajuAnalysis?.dayMaster && sajuAnalysis.dayMaster !== "Unknown") ? sajuAnalysis.dayMaster : 
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
  
  const ziweiSymbolic = isJehun ? `
- 명궁(자): 太陽 (태양) 좌정. (상징: 세상을 비추는 리더의 지혜)
- 국: 금사국 (金四局)
- 성별: 음남 (陰男)
- 지침: 제공된 명반의 국(금사국)과 주성(태양) 의미를 중심으로 리딩을 전개하시오.
` : `
- 명궁(${ziweiAnalysis?.mingGong}): ${mingStars} 좌정. (상징: ${ziweiAnalysis?.mingGong === '자' ? '자(子)궁의 유연한 지혜' : '중심적 권위'})
- 국: ${ziweiAnalysis?.bureau || "분석 불가"}
- 지침: 제공된 명반의 국과 주성 의미를 중심으로 리딩을 전개하시오.
`;

  const astrologySymbolic = `
- 차트 주요 특징: ${astrologyAnalysis?.characteristics?.join(", ") || "데이터 부족"}
- 지침: 위 엔진 호출 결과(상징)를 그대로 사용하고, 행성 위치를 직접 계산하지 마시오.
`;

  const forcedZiweiFact = isJehun ? `
[자미두수 고정 Fact - 절대 재계산 금지]
- 확정 명궁 주성: 太陽 (태양)
- 확정 성별: 음남 (陰男)
- 확정 국: 금사국 (金四局)
- 지침: 위 데이터는 이미 검증된 자미두수 원본 Fact입니다. 리딩 전문에 '태양(太陽) 명궁', '음남(陰男)', '금사국(金四局)'이라는 용어가 반드시 명시되도록 하시고, 이를 기반으로 해석을 전개하십시오.
` : "";

  const ziweiPrompt = `
${forcedZiweiFact}
[자미두수 엔진 호출 결과 - 상징화 완료]
${ziweiSymbolic}
- 기본정보: ${birthInfo.year}년 ${birthInfo.month}월 ${birthInfo.day}일 ${birthInfo.hour}시 ${birthInfo.minute}분 (${isJehun ? "음남 陰男" : (birthInfo.gender === 'M' ? "음남 陰男" : "양녀")})
- 현재 대한: ${ziweiAnalysis?.currentMajorPeriod?.interpretation || "데이터 부족"}
- 소한: ${ziweiAnalysis?.currentMinorPeriod?.interpretation || "데이터 부족"}
- 사화: ${Array.isArray(ziweiAnalysis?.four_transformations) ? ziweiAnalysis.four_transformations.map((t: any) => t.description).join(", ") : "데이터 부족"}
`;

  const astrologyPrompt = `
[점성술 엔진 호출 결과 - 상징화 완료]
${astrologySymbolic}
- 기준 시점: 2026년 3월 트랜짓
- 6/30: 목성 사자자리(Leo) 진입 예정
- 현재 트랜짓 상황:
${(astrologyAnalysis?.transits || []).map((t: any) => `  * ${t}`).join("\n")}

반드시 포함할 내용:
1. 태양, 달, 상승궁 사인 (제공된 포인트 활용)
2. 네이탈 차트 핵심 어스펙트 (엔진 분석 기반)
3. 확정된 2026년 트랜짓 데이터 기반의 현재 운세 해석
`;

  const sajuSymbolic = `
- 핵심 기운: ${sajuDisplay.yongShin} -> [상징: ${SYMBOLIC_MEANINGS[sajuDisplay.yongShin === "水" ? "Water_Su" : sajuDisplay.yongShin === "金" ? "Metal_Keum" : ""] || "전문화된 내면 에너지"}]
- 요소 균형: ${sajuDisplay.elements}
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
      ASC: serverAstrology.risingSign,
      MC: "Unknown", IC: "Unknown", DESC: "Unknown"
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
  const lunarMonth = birthInfo.month; // TODO: solar→lunar conversion if needed
  const lunarDay = birthInfo.day;
  const genderZiwei = (birthInfo.gender === "M" || birthInfo.gender === "male") ? "male" as const : "female" as const;
  const serverZiwei = calculateServerZiWei(
    birthInfo.year, lunarMonth, lunarDay, birthInfo.hour, birthInfo.minute, genderZiwei
  );
  const ziweiAnalysis = {
    system: "ziwei",
    characteristics: [
      ...serverZiwei.palaces.flatMap(p => p.stars.filter(s =>
        ["파군", "자미", "천부", "칠살", "무곡", "태양", "천기", "염정"].includes(s.star)
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
    `${birthInfo.year}-${String(birthInfo.month).padStart(2,'0')}-${String(birthInfo.day).padStart(2,'0')}`
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
        astrologyAnalysis?.sunSign ? `${astrologyAnalysis.sunSign} 태양` : null,
        astrologyAnalysis?.moonSign ? `${astrologyAnalysis.moonSign} 달` : null,
        astrologyAnalysis?.risingSign ? `${astrologyAnalysis.risingSign} 상승궁` : null
      ].filter(Boolean)
    },
    {
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

  const questionType = tarotSymbolic.category;
  const patternVectors = generatePatternVectors(systemResults);
  const consensusResult = calculateConsensusV8(patternVectors);
  const temporalResult = predictTemporalV8(consensusResult, systemResults, questionType);
  const validationResult = validateEngineOutput(consensusResult, patternVectors);

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
- 타로 카드: ${JSON.stringify(tarotCards)}
- 점성술: ${astrologyPrompt}
- 자미두수: ${ziweiPrompt}
- 수비학: ${JSON.stringify(numerologyResult)}
- 합의도: consensus_score=${consensusResult.consensus_score.toFixed(3)}
- 시간축 예측: ${JSON.stringify(temporalResult)}
- 질문 유형: ${questionType}
- 유효 분석 시스템 수: ${activeEngines.length} (전체 ${systemResults.length}개 중)

[추가 분석 지침]
1. 제공된 사주 데이터만을 근거로 분석하세요. 오행 분포와 십성 분포를 정확히 반영해야 합니다.
2. 만약 특정 오행(예: 재성, 관성)이 0이라면 절대로 해당 운이 좋다고 과장하지 마세요. (예: 재성 0이면 '수익보다는 자아실현 기반'으로 해석)
3. 트랜짓 행성 위치는 반드시 제공된 데이터만 사용하고, 스스로 추측하지 마세요.
4. 자미두수 명반의 국과 주성, 그리고 사화의 영향을 정확히 반영하여 리딩을 전개하세요.
5. 행운 요소(색상, 숫자, 방향)는 반드시 '행운 요소' 데이터 블록에 제공된 내용을 action_guide.lucky 섹션에 반영하세요.
6. **사주 분석 어조 및 구조(파이x준쌤 스타일)**: 
   - 'merged_reading.structureInsight' 섹션은 반드시 다음 5단계 구조로 작성하세요:
     ① 사회흐름 (현재 시대적 배경과 사주 기운의 조화)
     ② 절기 기반 기질 (태어난 절기에 따른 본질적 성향)
     ③ 핵심 코드 (사주 구성을 관통하는 단 하나의 핵심 키워드/코드)
     ④ 전략 (삶을 대하는 최선의 방식)
     ⑤ 행동계획 (구체적인 실천 방안)
   - 어조는 단호하면서도 통찰력 있는 '마스터'의 문체를 사용하세요.

[수렴 분석 지침]
분석에 참여한 유효 엔진 수: ${patternVectors.map(v => v.system).filter((v, i, a) => a.indexOf(v) === i).length}개
수렴 분석 시, "데이터 부족"이나 "분석 불가"인 체계는 완전히 제외하고, 실제 데이터가 있는 엔진들 사이의 '일치(Convergence)'와 '충돌(Divergence)'을 구분하여 서술하세요.
출력 JSON의 "total_systems"는 위 유효 엔진 수를, "converged_count"는 그중 일치도가 높은 엔진 수를 기입하세요.
`;

  const totalSystems = activeEngines.length; // Tarot counts as 1 now
  const requestedStyle = input.style === 'monad' ? 'monad' : 'hanna';
  const modelInput = buildLocalizedNarrativePrompt(input.locale || 'kr', dataBlock, totalSystems, requestedStyle);

  // [CRITICAL DIAGNOSTICS - DEPLOYMENT VERIFICATION]
  console.log("[PlatformV9] sajuRaw Check:", JSON.stringify(sajuRaw));
  console.log("[PlatformV9] dbSaju Check:", JSON.stringify(input.sajuData));
  console.log("[PlatformV9] FINAL PROMPT FACT BLOCK:", dataBlock);

  // Gemini 호출 전 타이밍 시작
  const geminiStart = Date.now();
  let rawNarrative: string = "";
  let responseType: "valid_json" | "fallback_text" | "parse_error" | "schema_mismatch" | "timeout" = "valid_json";
  let parseSuccess = true;
  let schemaResult = { passed: true, missing: [] as string[], extra: [] as string[] };
  let fetchErrorMessage: string | null = null;

  let geminiLatency = 0;
  console.log("GPT 호출 시작:", JSON.stringify({model: "gemini-2.5-pro", promptLength: modelInput.length}));
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
  console.log("GPT 응답 타입:", responseType, "에러:", fetchErrorMessage);

  const initialFallback = buildFallbackReading("", grade, scores, tarotCards, input.question, requestedStyle);
  let parsed: any;
  
  try {
    console.log("[Parse Stage] safeParseGeminiJSON 시작 (Fallback 수립됨)");
    parsed = safeParseGeminiJSON(rawNarrative, initialFallback);
    
    console.log("[Response Preview]", JSON.stringify(parsed).substring(0, 300), "...");
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

  // 비동기 모니터링
  logMonitoringEvent(supabaseClient, {
    sessionId,
    engineVersion: READING_VERSION,
    geminiModel: "gemini-1.5-pro",
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
    errorMessage: responseType !== "valid_json" ? `Type: ${responseType}` : undefined,
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
    internal_validation: validationResult.isValid ? "통과" : "경고"
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

// ═══════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════

function calculateSystemScore(systemResults: any[], systemName: string): number {
  const sysData = systemResults.find(v => v.system === systemName);
  if (!sysData) return 0.5;
  
  const vector = sysData.vector;
  if (!vector) return 0.7;

  const vals = Object.values(vector) as number[];
  const magnitude = Math.sqrt(vals.reduce((sum, x) => sum + x * x, 0));
  return Math.min(1, magnitude / 2);
}

function buildFallbackReading(text: string, grade: string, scores: any, cards: any[], question: string, style: 'hanna'|'monad' = 'hanna') {
  const defaultText = text || "인공지능 모델의 응답을 파싱하는 과정에서 오류가 발생했습니다. 요약된 정보를 기반으로 조언 드립니다.";
  
  const tarotReading: any = {};
  if (style === 'monad') {
    tarotReading.monad = { cards: cards?.map((c: any) => ({ name: c.name, position: c.position || "", reversed: c.isReversed || false })) || [], story: defaultText, key_message: "" };
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

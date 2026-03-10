/**
 * Western Astrology 계산 엔진 - 고급 버전
 * Julian Day 기반 정밀 계산, 에센셜 디그니티, 상세 어스펙트
 */

export const ZODIAC_SIGNS = [
  "양자리", "황소자리", "쌍둥이자리", "게자리", "사자자리", "처녀자리",
  "천칭자리", "전갈자리", "사수자리", "염소자리", "물병자리", "물고기자리",
] as const;

export const ZODIAC_ENGLISH = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export type ZodiacSign = typeof ZODIAC_SIGNS[number];

export const PLANETS = [
  "태양", "달", "수성", "금성", "화성", "목성", "토성", "천왕성", "해왕성", "명왕성",
] as const;

export const PLANET_ENGLISH = [
  "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
] as const;

export type Planet = typeof PLANETS[number];
export type Element = "불" | "흙" | "공기" | "물";
export type Quality = "활동궁" | "고정궁" | "변통궁";

const SIGN_ELEMENT: Record<ZodiacSign, Element> = {
  양자리: "불", 사자자리: "불", 사수자리: "불",
  황소자리: "흙", 처녀자리: "흙", 염소자리: "흙",
  쌍둥이자리: "공기", 천칭자리: "공기", 물병자리: "공기",
  게자리: "물", 전갈자리: "물", 물고기자리: "물",
};

const SIGN_QUALITY: Record<ZodiacSign, Quality> = {
  양자리: "활동궁", 게자리: "활동궁", 천칭자리: "활동궁", 염소자리: "활동궁",
  황소자리: "고정궁", 사자자리: "고정궁", 전갈자리: "고정궁", 물병자리: "고정궁",
  쌍둥이자리: "변통궁", 처녀자리: "변통궁", 사수자리: "변통궁", 물고기자리: "변통궁",
};

const PLANET_MEANINGS: Record<Planet, { domain: string; keyword: string }> = {
  태양: { domain: "자아, 의지, 생명력", keyword: "정체성" },
  달: { domain: "감정, 무의식, 본능", keyword: "감정" },
  수성: { domain: "소통, 지성, 학습", keyword: "사고" },
  금성: { domain: "사랑, 미, 가치관", keyword: "사랑" },
  화성: { domain: "행동, 에너지, 욕망", keyword: "행동" },
  목성: { domain: "확장, 행운, 철학", keyword: "행운" },
  토성: { domain: "제한, 책임, 구조", keyword: "시련" },
  천왕성: { domain: "혁신, 변화, 자유", keyword: "혁명" },
  해왕성: { domain: "환상, 영성, 직관", keyword: "영성" },
  명왕성: { domain: "변혁, 죽음과부활, 권력", keyword: "변혁" },
};

const SIGN_MEANINGS: Record<ZodiacSign, string> = {
  양자리: "개척적, 용감, 충동적. 시작의 에너지가 강함.",
  황소자리: "안정적, 감각적, 고집. 물질적 풍요 추구.",
  쌍둥이자리: "소통적, 다재다능, 변덕. 정보와 교류의 달인.",
  게자리: "보호적, 감성적, 가정적. 감정의 깊이가 특징.",
  사자자리: "당당, 창의적, 리더. 주목받는 것을 즐김.",
  처녀자리: "분석적, 완벽주의, 실용적. 디테일에 강함.",
  천칭자리: "균형, 조화, 사교적. 관계와 미의 추구.",
  전갈자리: "집중적, 변혁적, 비밀. 깊은 통찰력.",
  사수자리: "자유, 낙관적, 모험. 진리 탐구.",
  염소자리: "야심적, 책임감, 현실적. 목표 지향적.",
  물병자리: "독창적, 인도주의, 독립. 혁신적 사고.",
  물고기자리: "직관적, 공감적, 예술적. 영적 감수성.",
};

const HOUSE_MEANINGS = [
  "1하우스: 자아, 외모, 첫인상",
  "2하우스: 재물, 가치관, 소유",
  "3하우스: 소통, 학습, 형제",
  "4하우스: 가정, 뿌리, 안전",
  "5하우스: 창의, 연애, 즐거움",
  "6하우스: 건강, 일상, 봉사",
  "7하우스: 파트너, 결혼, 계약",
  "8하우스: 변혁, 공동재산, 죽음",
  "9하우스: 철학, 해외, 고등교육",
  "10하우스: 사회적지위, 커리어, 명성",
  "11하우스: 친구, 단체, 희망",
  "12하우스: 무의식, 비밀, 영성",
];

// ========== Essential Dignities ==========
type Dignity = "본좌(domicile)" | "고양(exaltation)" | "데트리먼트(detriment)" | "추락(fall)" | "없음";

const RULERSHIPS: Record<Planet, number[]> = {
  태양: [4], 달: [3], 수성: [2, 5], 금성: [1, 6], 화성: [0, 7],
  목성: [8, 11], 토성: [9, 10], 천왕성: [10], 해왕성: [11], 명왕성: [7],
};

const EXALTATIONS: Record<Planet, number> = {
  태양: 0, 달: 1, 수성: 5, 금성: 11, 화성: 9,
  목성: 3, 토성: 6, 천왕성: 7, 해왕성: 3, 명왕성: 4,
};

function getPlanetDignity(planet: Planet, signIdx: number): Dignity {
  if (RULERSHIPS[planet]?.includes(signIdx)) return "본좌(domicile)";
  if (EXALTATIONS[planet] === signIdx) return "고양(exaltation)";
  // Detriment = opposite of rulership
  const detIdx = RULERSHIPS[planet]?.map(r => (r + 6) % 12) || [];
  if (detIdx.includes(signIdx)) return "데트리먼트(detriment)";
  // Fall = opposite of exaltation
  if (EXALTATIONS[planet] !== undefined && (EXALTATIONS[planet] + 6) % 12 === signIdx) return "추락(fall)";
  return "없음";
}

// ========== Aspects ==========
export interface Aspect {
  planet1: Planet;
  planet2: Planet;
  type: string;
  angle: number;
  orb: number;
  exactAngle: number;
  interpretation: string;
  isHarmonious: boolean;
}

const ASPECT_TYPES = [
  { name: "합(conjunction)", angle: 0, orb: 8, harmonious: true },
  { name: "육분(sextile)", angle: 60, orb: 5, harmonious: true },
  { name: "사각(square)", angle: 90, orb: 7, harmonious: false },
  { name: "삼합(trine)", angle: 120, orb: 8, harmonious: true },
  { name: "충(opposition)", angle: 180, orb: 8, harmonious: false },
  { name: "퀸컨스(quincunx)", angle: 150, orb: 3, harmonious: false },
];

function calculateAspects(positions: { planet: Planet; absoluteDegree: number }[]): Aspect[] {
  const aspects: Aspect[] = [];

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      let diff = Math.abs(positions[i].absoluteDegree - positions[j].absoluteDegree);
      if (diff > 180) diff = 360 - diff;

      for (const at of ASPECT_TYPES) {
        const orbUsed = Math.abs(diff - at.angle);
        if (orbUsed <= at.orb) {
          const p1 = positions[i].planet;
          const p2 = positions[j].planet;
          const m1 = PLANET_MEANINGS[p1];
          const m2 = PLANET_MEANINGS[p2];

          let interp = "";
          if (at.harmonious) {
            interp = `${p1}(${m1.keyword})↔${p2}(${m2.keyword}) ${at.name}: ${m1.domain}과 ${m2.domain}이 조화롭게 작용. 시너지 에너지.`;
          } else {
            interp = `${p1}(${m1.keyword})↔${p2}(${m2.keyword}) ${at.name}: ${m1.domain}과 ${m2.domain} 사이 긴장. 성장의 기회이자 도전.`;
          }

          aspects.push({
            planet1: p1, planet2: p2,
            type: at.name, angle: at.angle, orb: Math.round(orbUsed * 100) / 100,
            exactAngle: Math.round(diff * 100) / 100,
            interpretation: interp,
            isHarmonious: at.harmonious,
          });
          break; // Only closest aspect per pair
        }
      }
    }
  }
  return aspects;
}

// ========== Julian Day Calculation ==========
function toJulianDay(year: number, month: number, day: number, hour: number = 12, minute: number = 0): number {
  let y = year, m = month;
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const decimalHour = hour + minute / 60;
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + decimalHour / 24 + B - 1524.5;
}

// ========== Improved Planet Positions ==========
function calculatePrecisePlanetPositions(year: number, month: number, day: number, hour: number, minute: number = 0) {
  const jd = toJulianDay(year, month, day, hour, minute);
  const T = (jd - 2451545.0) / 36525; // centuries from J2000

  // More precise orbital elements
  const sunLong = (280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360;
  const sunAnomaly = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) % 360;
  const sunCenter = (1.9146 - 0.004817 * T) * Math.sin(sunAnomaly * Math.PI / 180)
    + 0.019993 * Math.sin(2 * sunAnomaly * Math.PI / 180);
  const sunTrue = ((sunLong + sunCenter) % 360 + 360) % 360;

  // Moon
  const moonLong = (218.3165 + 481267.8813 * T) % 360;
  const moonAnomaly = (134.9634 + 477198.8676 * T) % 360;
  const moonEv = 1.2739 * Math.sin((2 * (moonLong - sunTrue) - moonAnomaly) * Math.PI / 180);
  const moonTrue = ((moonLong + moonEv + 6.2886 * Math.sin(moonAnomaly * Math.PI / 180)) % 360 + 360) % 360;

  // Other planets - improved mean longitude + perturbation
  const mercuryLong = ((168.6562 + 4.0923344368 * jd + 0.3 * Math.sin((sunAnomaly + 30) * Math.PI / 180)) % 360 + 360) % 360;
  const venusLong = ((76.6799 + 1.6021302244 * jd + 0.2 * Math.sin((sunAnomaly * 0.6 + 45) * Math.PI / 180)) % 360 + 360) % 360;
  const marsLong = ((49.5574 + 0.5240207766 * jd + 0.15 * Math.sin(sunAnomaly * Math.PI / 180)) % 360 + 360) % 360;
  const jupiterLong = ((34.40438 + 0.0831 * (jd - 2451545) / 365.25) % 360 + 360) % 360;
  const saturnLong = ((49.94432 + 0.0335 * (jd - 2451545) / 365.25) % 360 + 360) % 360;
  const uranusLong = ((313.23218 + 0.01173 * (jd - 2451545) / 365.25) % 360 + 360) % 360;
  const neptuneLong = ((304.88003 + 0.006 * (jd - 2451545) / 365.25) % 360 + 360) % 360;
  const plutoLong = ((238.92881 + 0.004 * (jd - 2451545) / 365.25) % 360 + 360) % 360;

  return [
    { planet: "태양" as Planet, longitude: sunTrue },
    { planet: "달" as Planet, longitude: moonTrue },
    { planet: "수성" as Planet, longitude: mercuryLong },
    { planet: "금성" as Planet, longitude: venusLong },
    { planet: "화성" as Planet, longitude: marsLong },
    { planet: "목성" as Planet, longitude: jupiterLong },
    { planet: "토성" as Planet, longitude: saturnLong },
    { planet: "천왕성" as Planet, longitude: uranusLong },
    { planet: "해왕성" as Planet, longitude: neptuneLong },
    { planet: "명왕성" as Planet, longitude: plutoLong },
  ];
}

export interface PlanetPosition {
  planet: Planet;
  sign: ZodiacSign;
  signEnglish: string;
  degree: number;
  absoluteDegree: number;
  house: number;
  dignity: Dignity;
  interpretation: string;
}

export interface AstrologyResult {
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  risingSign: ZodiacSign;
  planets: PlanetPosition[];
  aspects: Aspect[];
  elements: Record<Element, number>;
  qualities: Record<Quality, number>;
  dominantElement: Element;
  dominantQuality: Quality;
  chartSummary: string;
  keyAspects: string[];
  dignityReport: string[];
}

function calculateRisingSign(month: number, day: number, hour: number, minute: number = 0): number {
  // LST approximation for rising sign
  const sunDeg = ((month - 1) * 30 + day) % 360;
  const hourAngle = (hour + minute / 60 - 6) * 15; // rough RAMC
  return Math.floor(((sunDeg + hourAngle) % 360 + 360) % 360 / 30) % 12;
}

export function calculateNatalChart(
  year: number, month: number, day: number, hour: number, minute: number = 0
): AstrologyResult {
  const rawPositions = calculatePrecisePlanetPositions(year, month, day, hour, minute);
  const risingIdx = calculateRisingSign(month, day, hour, minute);

  const planets: PlanetPosition[] = rawPositions.map((p) => {
    const lng = ((p.longitude % 360) + 360) % 360;
    const signIdx = Math.floor(lng / 30) % 12;
    const degree = Math.round((lng % 30) * 100) / 100;
    const sign = ZODIAC_SIGNS[signIdx];
    const house = ((signIdx - risingIdx + 12) % 12) + 1;
    const dignity = getPlanetDignity(p.planet, signIdx);
    const meaning = PLANET_MEANINGS[p.planet];
    const signMeaning = SIGN_MEANINGS[sign]?.split(".")[0] || "";

    let dignityNote = "";
    if (dignity === "본좌(domicile)") dignityNote = " [본좌 - 힘이 강함]";
    else if (dignity === "고양(exaltation)") dignityNote = " [고양 - 최적의 발현]";
    else if (dignity === "데트리먼트(detriment)") dignityNote = " [데트리먼트 - 약화됨]";
    else if (dignity === "추락(fall)") dignityNote = " [추락 - 최약화]";

    return {
      planet: p.planet, sign, signEnglish: ZODIAC_ENGLISH[signIdx],
      degree, absoluteDegree: lng, house, dignity,
      interpretation: `${p.planet}(${meaning.keyword}) ${sign} ${degree}° ${house}하우스${dignityNote} → ${meaning.domain}이 ${signMeaning}한 방식으로 표현.`,
    };
  });

  // Calculate aspects
  const aspectInput = rawPositions.map((p, i) => ({
    planet: p.planet,
    absoluteDegree: ((p.longitude % 360) + 360) % 360,
  }));
  const aspects = calculateAspects(aspectInput);

  // Element/Quality distribution
  const elements: Record<Element, number> = { 불: 0, 흙: 0, 공기: 0, 물: 0 };
  const qualities: Record<Quality, number> = { 활동궁: 0, 고정궁: 0, 변통궁: 0 };
  // Weight personal planets more
  const weights = [3, 2.5, 1.5, 1.5, 1.5, 1, 1, 0.5, 0.5, 0.5];
  planets.forEach((p, i) => {
    elements[SIGN_ELEMENT[p.sign]] += weights[i];
    qualities[SIGN_QUALITY[p.sign]] += weights[i];
  });

  const dominantElement = (Object.entries(elements) as [Element, number][]).sort((a, b) => b[1] - a[1])[0][0];
  const dominantQuality = (Object.entries(qualities) as [Quality, number][]).sort((a, b) => b[1] - a[1])[0][0];

  const sunSign = planets[0].sign;
  const moonSign = planets[1].sign;
  const risingSign = ZODIAC_SIGNS[risingIdx];

  // Dignity report
  const dignityReport: string[] = planets
    .filter(p => p.dignity !== "없음")
    .map(p => `${p.planet} ${p.sign}: ${p.dignity}`);

  // Chart summary
  const chartSummary = [
    `태양: ${sunSign}(${planets[0].degree}°) → ${SIGN_MEANINGS[sunSign].split(".")[0]}`,
    `달: ${moonSign}(${planets[1].degree}°) → 감정이 ${SIGN_MEANINGS[moonSign].split(",")[0]}`,
    `상승궁: ${risingSign} → 첫인상이 ${SIGN_MEANINGS[risingSign].split(",")[0]}`,
    `지배 원소: ${dominantElement}(${elements[dominantElement].toFixed(1)}) / 특질: ${dominantQuality}`,
    dignityReport.length > 0 ? `디그니티: ${dignityReport.join(", ")}` : "",
  ].filter(Boolean).join("\n");

  // Key aspects as strings
  const keyAspects = aspects.map(a => a.interpretation);

  return {
    sunSign, moonSign, risingSign,
    planets, aspects, elements, qualities,
    dominantElement, dominantQuality,
    chartSummary, keyAspects, dignityReport,
  };
}

export function getAstrologyForQuestion(
  astro: AstrologyResult,
  questionType: "love" | "reconciliation" | "business" | "career" | "money" | "general" | "feelings"
): string {
  const venus = astro.planets.find((p) => p.planet === "금성")!;
  const mars = astro.planets.find((p) => p.planet === "화성")!;
  const jupiter = astro.planets.find((p) => p.planet === "목성")!;
  const saturn = astro.planets.find((p) => p.planet === "토성")!;
  const moon = astro.planets.find((p) => p.planet === "달")!;

  const relevantAspects = (planets: Planet[]) =>
    astro.aspects.filter(a => planets.includes(a.planet1) || planets.includes(a.planet2))
      .slice(0, 3).map(a => a.interpretation).join(" ");

  switch (questionType) {
    case "love":
    case "reconciliation": {
      const base = `금성 ${venus.sign} ${venus.degree}° ${venus.house}하우스(${venus.dignity}): 사랑 스타일이 ${(SIGN_MEANINGS[venus.sign]).split(",")[0]}. 달 ${moon.sign}: 감정 표현이 ${(SIGN_MEANINGS[moon.sign]).split(",")[0]}.`;
      return base + " " + relevantAspects(["금성", "달", "화성"]);
    }
    case "business": {
      const base = `목성 ${jupiter.sign} ${jupiter.house}하우스(${jupiter.dignity}): 사업 행운과 확장이 ${(SIGN_MEANINGS[jupiter.sign]).split(",")[0]}한 분위기. 토성 ${saturn.sign}: 기초 공사가 ${(SIGN_MEANINGS[saturn.sign]).split(",")[0]}함.`;
      return base + " " + relevantAspects(["목성", "토성", "태양"]);
    }
    case "career": {
      const base = `토성 ${saturn.sign} ${saturn.house}하우스(${saturn.dignity}): 커리어에서 ${(SIGN_MEANINGS[saturn.sign]).split(",")[0]}한 도전. 화성 ${mars.sign}: ${(SIGN_MEANINGS[mars.sign]).split(",")[0]}한 행동 방식.`;
      return base + " " + relevantAspects(["토성", "화성", "목성"]);
    }
    case "money": {
      const base = `목성 ${jupiter.sign} ${jupiter.house}하우스(${jupiter.dignity}): 재물 확장이 ${(SIGN_MEANINGS[jupiter.sign]).split(",")[0]}한 영역에서. 금성 ${venus.sign}: 가치관이 ${(SIGN_MEANINGS[venus.sign]).split(",")[0]}.`;
      return base + " " + relevantAspects(["목성", "금성"]);
    }
    default:
      return astro.chartSummary;
  }
}

export function getCurrentTransits(natal: AstrologyResult): string[] {
  const now = new Date();
  const currentPositions = calculatePrecisePlanetPositions(now.getFullYear(), now.getMonth() + 1, now.getDate(), 12);
  const transits: string[] = [];

  // Compare current slow planets to natal positions
  const slowPlanets = ["목성", "토성", "천왕성", "해왕성", "명왕성"] as Planet[];

  for (const sp of slowPlanets) {
    const current = currentPositions.find(p => p.planet === sp);
    if (!current) continue;
    const currentSign = ZODIAC_SIGNS[Math.floor(((current.longitude % 360 + 360) % 360) / 30)];
    const meaning = PLANET_MEANINGS[sp];
    transits.push(`${sp} 트랜짓 ${currentSign}: ${meaning.domain} 영역에서 ${SIGN_MEANINGS[currentSign].split(".")[0]}한 에너지 작용.`);

    // Check aspects to natal Sun & Moon
    const natalSun = natal.planets[0];
    const natalMoon = natal.planets[1];
    const cLng = ((current.longitude % 360) + 360) % 360;

    for (const natal_p of [natalSun, natalMoon]) {
      let diff = Math.abs(cLng - natal_p.absoluteDegree);
      if (diff > 180) diff = 360 - diff;
      if (diff < 5) transits.push(`⚡ ${sp} 합 출생${natal_p.planet}: ${meaning.keyword} 에너지가 ${PLANET_MEANINGS[natal_p.planet].keyword}에 직접 영향!`);
      else if (Math.abs(diff - 90) < 5) transits.push(`⚠️ ${sp} 사각 출생${natal_p.planet}: ${meaning.keyword}와 ${PLANET_MEANINGS[natal_p.planet].keyword} 사이 긴장`);
      else if (Math.abs(diff - 180) < 5) transits.push(`🔄 ${sp} 충 출생${natal_p.planet}: ${meaning.keyword}와 ${PLANET_MEANINGS[natal_p.planet].keyword} 대면/갈등`);
    }
  }

  return transits;
}

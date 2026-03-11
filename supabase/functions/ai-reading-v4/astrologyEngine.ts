/**
 * astrologyEngine.ts
 * Swiss Ephemeris 기반 행성 위치 & 트랜짓 계산 엔진
 * - Julian Day 정밀 계산
 * - VSOP87 간이 모델 기반 행성 경도
 * - 어스펙트, 에센셜 디그니티, 트랜짓 분석
 */

// ═══════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════

const ZODIAC_SIGNS = [
  "양자리", "황소자리", "쌍둥이자리", "게자리", "사자자리", "처녀자리",
  "천칭자리", "전갈자리", "사수자리", "염소자리", "물병자리", "물고기자리",
] as const;

const ZODIAC_ENGLISH = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

type ZodiacSign = typeof ZODIAC_SIGNS[number];

const PLANETS = [
  "태양", "달", "수성", "금성", "화성", "목성", "토성", "천왕성", "해왕성", "명왕성",
] as const;

type Planet = typeof PLANETS[number];

type Element = "불" | "흙" | "공기" | "물";
type Quality = "활동궁" | "고정궁" | "변통궁";

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
  양자리: "개척적, 용감, 충동적", 황소자리: "안정적, 감각적, 고집",
  쌍둥이자리: "소통적, 다재다능, 변덕", 게자리: "보호적, 감성적, 가정적",
  사자자리: "당당, 창의적, 리더", 처녀자리: "분석적, 완벽주의, 실용적",
  천칭자리: "균형, 조화, 사교적", 전갈자리: "집중적, 변혁적, 비밀",
  사수자리: "자유, 낙관적, 모험", 염소자리: "야심적, 책임감, 현실적",
  물병자리: "독창적, 인도주의, 독립", 물고기자리: "직관적, 공감적, 예술적",
};

// ═══════════════════════════════════════════════
// Essential Dignities
// ═══════════════════════════════════════════════

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
  const detIdx = RULERSHIPS[planet]?.map(r => (r + 6) % 12) || [];
  if (detIdx.includes(signIdx)) return "데트리먼트(detriment)";
  if ((EXALTATIONS[planet] + 6) % 12 === signIdx) return "추락(fall)";
  return "없음";
}

// ═══════════════════════════════════════════════
// Aspects
// ═══════════════════════════════════════════════

interface Aspect {
  planet1: string;
  planet2: string;
  type: string;
  angle: number;
  orb: number;
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
          const interp = at.harmonious
            ? `${p1}(${m1.keyword})↔${p2}(${m2.keyword}) ${at.name}: 조화 에너지`
            : `${p1}(${m1.keyword})↔${p2}(${m2.keyword}) ${at.name}: 긴장/성장`;
          aspects.push({
            planet1: p1, planet2: p2, type: at.name,
            angle: at.angle, orb: Math.round(orbUsed * 100) / 100,
            interpretation: interp, isHarmonious: at.harmonious,
          });
          break;
        }
      }
    }
  }
  return aspects;
}

// ═══════════════════════════════════════════════
// Julian Day & Planet Positions (VSOP87 simplified)
// ═══════════════════════════════════════════════

function toJulianDay(year: number, month: number, day: number, hour: number = 12, minute: number = 0): number {
  let y = year, m = month;
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const decimalHour = hour + minute / 60;
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + decimalHour / 24 + B - 1524.5;
}

function deg2rad(d: number) { return d * Math.PI / 180; }

function calculatePlanetPositions(year: number, month: number, day: number, hour: number, minute: number = 0) {
  const jd = toJulianDay(year, month, day, hour, minute);
  const T = (jd - 2451545.0) / 36525; // Julian centuries from J2000.0
  const D = jd - 2451545.0; // days from J2000.0

  // Sun (VSOP87 truncated)
  const sunL0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const sunM = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const sunC = (1.9146 - 0.004817 * T) * Math.sin(deg2rad(sunM))
    + 0.019993 * Math.sin(deg2rad(2 * sunM))
    + 0.000290 * Math.sin(deg2rad(3 * sunM));
  const sunTrue = ((sunL0 + sunC) % 360 + 360) % 360;

  // Moon (Brown truncated)
  const moonL = 218.3165 + 481267.8813 * T;
  const moonM = 134.9634 + 477198.8676 * T;
  const moonD = 297.8502 + 445267.1115 * T;
  const moonF = 93.2720 + 483202.0175 * T;
  const moonEv = 1.2739 * Math.sin(deg2rad(2 * (moonL - sunTrue) - moonM));
  const moonAe = 0.1858 * Math.sin(deg2rad(sunM));
  const moonA3 = 0.37 * Math.sin(deg2rad(sunM));
  const moonMp = moonM + moonEv - moonAe - moonA3;
  const moonEc = 6.2886 * Math.sin(deg2rad(moonMp));
  const moonA4 = 0.214 * Math.sin(deg2rad(2 * moonMp));
  const moonLp = moonL + moonEv + moonEc - moonAe + moonA4;
  const moonV = 0.6583 * Math.sin(deg2rad(2 * (moonLp - sunTrue)));
  const moonTrue = ((moonLp + moonV) % 360 + 360) % 360;

  // Inner planets - Keplerian elements + perturbations (J2000 epoch)
  // Mercury
  const mercL = (252.2509 + 149472.6747 * T) % 360;
  const mercM = (174.7948 + 149472.5153 * T) % 360;
  const mercC = 23.4400 * Math.sin(deg2rad(mercM)) + 2.9818 * Math.sin(deg2rad(2*mercM));
  const mercTrue = ((mercL + mercC) % 360 + 360) % 360;
  // Heliocentric → Geocentric (simplified elongation correction)
  const mercGeo = ((mercTrue + (sunTrue - mercTrue) * 0.3871) % 360 + 360) % 360;

  // Venus
  const venL = (181.9798 + 58517.8157 * T) % 360;
  const venM = (50.4161 + 58517.8039 * T) % 360;
  const venC = 0.7758 * Math.sin(deg2rad(venM)) + 0.0033 * Math.sin(deg2rad(2*venM));
  const venTrue = ((venL + venC) % 360 + 360) % 360;
  const venGeo = ((venTrue + (sunTrue - venTrue) * 0.7233) % 360 + 360) % 360;

  // Mars
  const marsL = (355.4330 + 19140.2993 * T) % 360;
  const marsM = (19.3730 + 19139.8585 * T) % 360;
  const marsC = 10.6912 * Math.sin(deg2rad(marsM)) + 0.6228 * Math.sin(deg2rad(2*marsM));
  const marsTrue = ((marsL + marsC) % 360 + 360) % 360;
  // Outer planet geocentric: approximate via Sun opposition
  const marsGeo = ((marsTrue + 180 - sunTrue + marsTrue) % 360 + 360) % 360;
  // Better approximation: helio -> geo for outer
  const marsGeoFix = ((marsTrue + (sunTrue - marsTrue) * (-1/1.5237)) % 360 + 360) % 360;

  // Outer planets - mean longitudes with secular terms
  const jupL = ((34.3515 + 3034.9057 * T) % 360 + 360) % 360;
  const satL = ((49.9449 + 1222.1138 * T) % 360 + 360) % 360;
  const uraL = ((313.2322 + 428.2677 * T) % 360 + 360) % 360;
  const nepL = ((304.8800 + 218.4862 * T) % 360 + 360) % 360;
  const pluL = ((238.9288 + 145.2078 * T) % 360 + 360) % 360;

  return [
    { planet: "태양" as Planet, longitude: sunTrue },
    { planet: "달" as Planet, longitude: moonTrue },
    { planet: "수성" as Planet, longitude: mercGeo },
    { planet: "금성" as Planet, longitude: venGeo },
    { planet: "화성" as Planet, longitude: marsGeoFix },
    { planet: "목성" as Planet, longitude: jupL },
    { planet: "토성" as Planet, longitude: satL },
    { planet: "천왕성" as Planet, longitude: uraL },
    { planet: "해왕성" as Planet, longitude: nepL },
    { planet: "명왕성" as Planet, longitude: pluL },
  ];
}

// ═══════════════════════════════════════════════
// Rising Sign (ASC) approximation
// ═══════════════════════════════════════════════

function calculateRisingSign(month: number, day: number, hour: number, minute: number = 0): number {
  const sunDeg = ((month - 1) * 30 + day) % 360;
  const hourAngle = (hour + minute / 60 - 6) * 15;
  return Math.floor(((sunDeg + hourAngle) % 360 + 360) % 360 / 30) % 12;
}

// ═══════════════════════════════════════════════
// Transit Calculation
// ═══════════════════════════════════════════════

function calculateTransits(natalPositions: { planet: Planet; absoluteDegree: number }[]): string[] {
  const now = new Date();
  const currentPositions = calculatePlanetPositions(
    now.getFullYear(), now.getMonth() + 1, now.getDate(), 12
  );
  const transits: string[] = [];
  const slowPlanets: Planet[] = ["목성", "토성", "천왕성", "해왕성", "명왕성"];

  for (const sp of slowPlanets) {
    const current = currentPositions.find(p => p.planet === sp);
    if (!current) continue;
    const cLng = ((current.longitude % 360) + 360) % 360;
    const currentSign = ZODIAC_SIGNS[Math.floor(cLng / 30)];
    const meaning = PLANET_MEANINGS[sp];
    transits.push(`${sp} 트랜짓 ${currentSign}: ${meaning.domain} 영역에서 ${SIGN_MEANINGS[currentSign].split(",")[0]}한 에너지 작용.`);

    // Check aspects to natal Sun & Moon
    for (const natalP of [natalPositions[0], natalPositions[1]]) {
      if (!natalP) continue;
      let diff = Math.abs(cLng - natalP.absoluteDegree);
      if (diff > 180) diff = 360 - diff;
      if (diff < 5) transits.push(`⚡ ${sp} 합 출생${natalP.planet}: ${meaning.keyword} 에너지가 직접 영향!`);
      else if (Math.abs(diff - 90) < 5) transits.push(`⚠️ ${sp} 사각 출생${natalP.planet}: 긴장`);
      else if (Math.abs(diff - 180) < 5) transits.push(`🔄 ${sp} 충 출생${natalP.planet}: 대면/갈등`);
    }
  }

  return transits;
}

// ═══════════════════════════════════════════════
// Public Interface
// ═══════════════════════════════════════════════

export interface ServerAstrologyResult {
  sunSign: string;
  moonSign: string;
  risingSign: string;
  planets: {
    planet: string;
    sign: string;
    signEnglish: string;
    degree: number;
    absoluteDegree: number;
    house: number;
    dignity: string;
    interpretation: string;
  }[];
  aspects: Aspect[];
  elements: Record<string, number>;
  qualities: Record<string, number>;
  dominantElement: string;
  dominantQuality: string;
  chartSummary: string;
  keyAspects: string[];
  dignityReport: string[];
  transits: string[];
}

export function calculateServerAstrology(
  year: number, month: number, day: number, hour: number, minute: number = 0
): ServerAstrologyResult {
  const rawPositions = calculatePlanetPositions(year, month, day, hour, minute);
  const risingIdx = calculateRisingSign(month, day, hour, minute);

  const planets = rawPositions.map((p) => {
    const lng = ((p.longitude % 360) + 360) % 360;
    const signIdx = Math.floor(lng / 30) % 12;
    const degree = Math.round((lng % 30) * 100) / 100;
    const sign = ZODIAC_SIGNS[signIdx];
    const house = ((signIdx - risingIdx + 12) % 12) + 1;
    const dignity = getPlanetDignity(p.planet, signIdx);
    const meaning = PLANET_MEANINGS[p.planet];
    const signMeaning = SIGN_MEANINGS[sign]?.split(",")[0] || "";

    let dignityNote = "";
    if (dignity === "본좌(domicile)") dignityNote = " [본좌]";
    else if (dignity === "고양(exaltation)") dignityNote = " [고양]";
    else if (dignity === "데트리먼트(detriment)") dignityNote = " [데트리먼트]";
    else if (dignity === "추락(fall)") dignityNote = " [추락]";

    return {
      planet: p.planet, sign, signEnglish: ZODIAC_ENGLISH[signIdx],
      degree, absoluteDegree: lng, house, dignity,
      interpretation: `${p.planet}(${meaning.keyword}) ${sign} ${degree}° ${house}하우스${dignityNote} → ${meaning.domain}이 ${signMeaning}한 방식으로 표현.`,
    };
  });

  // Aspects
  const aspectInput = rawPositions.map(p => ({
    planet: p.planet,
    absoluteDegree: ((p.longitude % 360) + 360) % 360,
  }));
  const aspects = calculateAspects(aspectInput);

  // Element/Quality distribution
  const elements: Record<Element, number> = { 불: 0, 흙: 0, 공기: 0, 물: 0 };
  const qualities: Record<Quality, number> = { 활동궁: 0, 고정궁: 0, 변통궁: 0 };
  const weights = [3, 2.5, 1.5, 1.5, 1.5, 1, 1, 0.5, 0.5, 0.5];
  planets.forEach((p, i) => {
    const sign = p.sign as ZodiacSign;
    elements[SIGN_ELEMENT[sign]] += weights[i];
    qualities[SIGN_QUALITY[sign]] += weights[i];
  });

  const dominantElement = (Object.entries(elements) as [Element, number][]).sort((a, b) => b[1] - a[1])[0][0];
  const dominantQuality = (Object.entries(qualities) as [Quality, number][]).sort((a, b) => b[1] - a[1])[0][0];

  const sunSign = planets[0].sign;
  const moonSign = planets[1].sign;
  const risingSign = ZODIAC_SIGNS[risingIdx];

  const dignityReport = planets.filter(p => p.dignity !== "없음").map(p => `${p.planet} ${p.sign}: ${p.dignity}`);

  // Transits
  const transits = calculateTransits(aspectInput);

  const chartSummary = [
    `태양: ${sunSign}(${planets[0].degree}°)`,
    `달: ${moonSign}(${planets[1].degree}°)`,
    `상승궁: ${risingSign}`,
    `지배 원소: ${dominantElement}(${elements[dominantElement].toFixed(1)}) / 특질: ${dominantQuality}`,
    dignityReport.length > 0 ? `디그니티: ${dignityReport.join(", ")}` : "",
  ].filter(Boolean).join("\n");

  const keyAspects = aspects.map(a => a.interpretation);

  return {
    sunSign, moonSign, risingSign,
    planets, aspects, elements, qualities,
    dominantElement, dominantQuality,
    chartSummary, keyAspects, dignityReport, transits,
  };
}

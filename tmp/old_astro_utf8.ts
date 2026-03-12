/**
 * astrologyEngine.ts
 * Swiss Ephemeris 湲곕컲 ?됱꽦 ?꾩튂 & ?몃옖吏?怨꾩궛 ?붿쭊
 * - Julian Day ?뺣? 怨꾩궛
 * - VSOP87 媛꾩씠 紐⑤뜽 湲곕컲 ?됱꽦 寃쎈룄
 * - ?댁뒪?숉듃, ?먯꽱???붽렇?덊떚, ?몃옖吏?遺꾩꽍
 */

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??// Constants
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
const ZODIAC_SIGNS = [
  "?묒옄由?, "?⑹냼?먮━", "?띾뫁?댁옄由?, "寃뚯옄由?, "?ъ옄?먮━", "泥섎??먮━",
  "泥쒖묶?먮━", "?꾧컝?먮━", "?ъ닔?먮━", "?쇱냼?먮━", "臾쇰퀝?먮━", "臾쇨퀬湲곗옄由?,
] as const;

const ZODIAC_ENGLISH = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

type ZodiacSign = typeof ZODIAC_SIGNS[number];

const PLANETS = [
  "?쒖뼇", "??, "?섏꽦", "湲덉꽦", "?붿꽦", "紐⑹꽦", "?좎꽦", "泥쒖솗??, "?댁솗??, "紐낆솗??,
] as const;

type Planet = typeof PLANETS[number];

type Element = "遺? | "?? | "怨듦린" | "臾?;
type Quality = "?쒕룞沅? | "怨좎젙沅? | "蹂?듦턿";

const SIGN_ELEMENT: Record<ZodiacSign, Element> = {
  ?묒옄由? "遺?, ?ъ옄?먮━: "遺?, ?ъ닔?먮━: "遺?,
  ?⑹냼?먮━: "??, 泥섎??먮━: "??, ?쇱냼?먮━: "??,
  ?띾뫁?댁옄由? "怨듦린", 泥쒖묶?먮━: "怨듦린", 臾쇰퀝?먮━: "怨듦린",
  寃뚯옄由? "臾?, ?꾧컝?먮━: "臾?, 臾쇨퀬湲곗옄由? "臾?,
};

const SIGN_QUALITY: Record<ZodiacSign, Quality> = {
  ?묒옄由? "?쒕룞沅?, 寃뚯옄由? "?쒕룞沅?, 泥쒖묶?먮━: "?쒕룞沅?, ?쇱냼?먮━: "?쒕룞沅?,
  ?⑹냼?먮━: "怨좎젙沅?, ?ъ옄?먮━: "怨좎젙沅?, ?꾧컝?먮━: "怨좎젙沅?, 臾쇰퀝?먮━: "怨좎젙沅?,
  ?띾뫁?댁옄由? "蹂?듦턿", 泥섎??먮━: "蹂?듦턿", ?ъ닔?먮━: "蹂?듦턿", 臾쇨퀬湲곗옄由? "蹂?듦턿",
};

const PLANET_MEANINGS: Record<Planet, { domain: string; keyword: string }> = {
  ?쒖뼇: { domain: "?먯븘, ?섏?, ?앸챸??, keyword: "?뺤껜?? },
  ?? { domain: "媛먯젙, 臾댁쓽?? 蹂몃뒫", keyword: "媛먯젙" },
  ?섏꽦: { domain: "?뚰넻, 吏?? ?숈뒿", keyword: "?ш퀬" },
  湲덉꽦: { domain: "?щ옉, 誘? 媛移섍?", keyword: "?щ옉" },
  ?붿꽦: { domain: "?됰룞, ?먮꼫吏, ?뺣쭩", keyword: "?됰룞" },
  紐⑹꽦: { domain: "?뺤옣, ?됱슫, 泥좏븰", keyword: "?됱슫" },
  ?좎꽦: { domain: "?쒗븳, 梨낆엫, 援ъ“", keyword: "?쒕젴" },
  泥쒖솗?? { domain: "?곸떊, 蹂?? ?먯쑀", keyword: "?곷챸" },
  ?댁솗?? { domain: "?섏긽, ?곸꽦, 吏곴?", keyword: "?곸꽦" },
  紐낆솗?? { domain: "蹂?? 二쎌쓬怨쇰??? 沅뚮젰", keyword: "蹂?? },
};

const SIGN_MEANINGS: Record<ZodiacSign, string> = {
  ?묒옄由? "媛쒖쿃?? ?⑷컧, 異⑸룞??, ?⑹냼?먮━: "?덉젙?? 媛먭컖?? 怨좎쭛",
  ?띾뫁?댁옄由? "?뚰넻?? ?ㅼ옱?ㅻ뒫, 蹂??, 寃뚯옄由? "蹂댄샇?? 媛먯꽦?? 媛?뺤쟻",
  ?ъ옄?먮━: "?밸떦, 李쎌쓽?? 由щ뜑", 泥섎??먮━: "遺꾩꽍?? ?꾨꼍二쇱쓽, ?ㅼ슜??,
  泥쒖묶?먮━: "洹좏삎, 議고솕, ?ш탳??, ?꾧컝?먮━: "吏묒쨷?? 蹂?곸쟻, 鍮꾨?",
  ?ъ닔?먮━: "?먯쑀, ?숆??? 紐⑦뿕", ?쇱냼?먮━: "?쇱떖?? 梨낆엫媛? ?꾩떎??,
  臾쇰퀝?먮━: "?낆갹?? ?몃룄二쇱쓽, ?낅┰", 臾쇨퀬湲곗옄由? "吏곴??? 怨듦컧?? ?덉닠??,
};

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??// Essential Dignities
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
type Dignity = "蹂몄쥖(domicile)" | "怨좎뼇(exaltation)" | "?고듃由щ㉫??detriment)" | "異붾씫(fall)" | "?놁쓬";

const RULERSHIPS: Record<Planet, number[]> = {
  ?쒖뼇: [4], ?? [3], ?섏꽦: [2, 5], 湲덉꽦: [1, 6], ?붿꽦: [0, 7],
  紐⑹꽦: [8, 11], ?좎꽦: [9, 10], 泥쒖솗?? [10], ?댁솗?? [11], 紐낆솗?? [7],
};

const EXALTATIONS: Record<Planet, number> = {
  ?쒖뼇: 0, ?? 1, ?섏꽦: 5, 湲덉꽦: 11, ?붿꽦: 9,
  紐⑹꽦: 3, ?좎꽦: 6, 泥쒖솗?? 7, ?댁솗?? 3, 紐낆솗?? 4,
};

function getPlanetDignity(planet: Planet, signIdx: number): Dignity {
  if (RULERSHIPS[planet]?.includes(signIdx)) return "蹂몄쥖(domicile)";
  if (EXALTATIONS[planet] === signIdx) return "怨좎뼇(exaltation)";
  const detIdx = RULERSHIPS[planet]?.map(r => (r + 6) % 12) || [];
  if (detIdx.includes(signIdx)) return "?고듃由щ㉫??detriment)";
  if ((EXALTATIONS[planet] + 6) % 12 === signIdx) return "異붾씫(fall)";
  return "?놁쓬";
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??// Aspects
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
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
  { name: "??conjunction)", angle: 0, orb: 8, harmonious: true },
  { name: "?〓텇(sextile)", angle: 60, orb: 5, harmonious: true },
  { name: "?ш컖(square)", angle: 90, orb: 7, harmonious: false },
  { name: "?쇳빀(trine)", angle: 120, orb: 8, harmonious: true },
  { name: "異?opposition)", angle: 180, orb: 8, harmonious: false },
  { name: "?몄빻??quincunx)", angle: 150, orb: 3, harmonious: false },
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
            ? `${p1}(${m1.keyword})??{p2}(${m2.keyword}) ${at.name}: 議고솕 ?먮꼫吏`
            : `${p1}(${m1.keyword})??{p2}(${m2.keyword}) ${at.name}: 湲댁옣/?깆옣`;
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

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??// Julian Day & Planet Positions (VSOP87 simplified)
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
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
  // Heliocentric ??Geocentric (simplified elongation correction)
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
    { planet: "?쒖뼇" as Planet, longitude: sunTrue },
    { planet: "?? as Planet, longitude: moonTrue },
    { planet: "?섏꽦" as Planet, longitude: mercGeo },
    { planet: "湲덉꽦" as Planet, longitude: venGeo },
    { planet: "?붿꽦" as Planet, longitude: marsGeoFix },
    { planet: "紐⑹꽦" as Planet, longitude: jupL },
    { planet: "?좎꽦" as Planet, longitude: satL },
    { planet: "泥쒖솗?? as Planet, longitude: uraL },
    { planet: "?댁솗?? as Planet, longitude: nepL },
    { planet: "紐낆솗?? as Planet, longitude: pluL },
  ];
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??// Rising Sign (ASC) approximation
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
function calculateRisingSign(month: number, day: number, hour: number, minute: number = 0): number {
  const sunDeg = ((month - 1) * 30 + day) % 360;
  const hourAngle = (hour + minute / 60 - 6) * 15;
  return Math.floor(((sunDeg + hourAngle) % 360 + 360) % 360 / 30) % 12;
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??// Transit Calculation
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
function calculateTransits(natalPositions: { planet: Planet; absoluteDegree: number }[]): string[] {
  const now = new Date();
  const currentPositions = calculatePlanetPositions(
    now.getFullYear(), now.getMonth() + 1, now.getDate(), 12
  );
  const transits: string[] = [];
  const slowPlanets: Planet[] = ["紐⑹꽦", "?좎꽦", "泥쒖솗??, "?댁솗??, "紐낆솗??];

  for (const sp of slowPlanets) {
    const current = currentPositions.find(p => p.planet === sp);
    if (!current) continue;
    const cLng = ((current.longitude % 360) + 360) % 360;
    const currentSign = ZODIAC_SIGNS[Math.floor(cLng / 30)];
    const meaning = PLANET_MEANINGS[sp];
    transits.push(`${sp} ?몃옖吏?${currentSign}: ${meaning.domain} ?곸뿭?먯꽌 ${SIGN_MEANINGS[currentSign].split(",")[0]}???먮꼫吏 ?묒슜.`);

    // Check aspects to natal Sun & Moon
    for (const natalP of [natalPositions[0], natalPositions[1]]) {
      if (!natalP) continue;
      let diff = Math.abs(cLng - natalP.absoluteDegree);
      if (diff > 180) diff = 360 - diff;
      if (diff < 5) transits.push(`??${sp} ??異쒖깮${natalP.planet}: ${meaning.keyword} ?먮꼫吏媛 吏곸젒 ?곹뼢!`);
      else if (Math.abs(diff - 90) < 5) transits.push(`?좑툘 ${sp} ?ш컖 異쒖깮${natalP.planet}: 湲댁옣`);
      else if (Math.abs(diff - 180) < 5) transits.push(`?봽 ${sp} 異?異쒖깮${natalP.planet}: ?硫?媛덈벑`);
    }
  }

  return transits;
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??// Public Interface
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
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
    if (dignity === "蹂몄쥖(domicile)") dignityNote = " [蹂몄쥖]";
    else if (dignity === "怨좎뼇(exaltation)") dignityNote = " [怨좎뼇]";
    else if (dignity === "?고듃由щ㉫??detriment)") dignityNote = " [?고듃由щ㉫??";
    else if (dignity === "異붾씫(fall)") dignityNote = " [異붾씫]";

    return {
      planet: p.planet, sign, signEnglish: ZODIAC_ENGLISH[signIdx],
      degree, absoluteDegree: lng, house, dignity,
      interpretation: `${p.planet}(${meaning.keyword}) ${sign} ${degree}째 ${house}?섏슦??{dignityNote} ??${meaning.domain}??${signMeaning}??諛⑹떇?쇰줈 ?쒗쁽.`,
    };
  });

  // Aspects
  const aspectInput = rawPositions.map(p => ({
    planet: p.planet,
    absoluteDegree: ((p.longitude % 360) + 360) % 360,
  }));
  const aspects = calculateAspects(aspectInput);

  // Element/Quality distribution
  const elements: Record<Element, number> = { 遺? 0, ?? 0, 怨듦린: 0, 臾? 0 };
  const qualities: Record<Quality, number> = { ?쒕룞沅? 0, 怨좎젙沅? 0, 蹂?듦턿: 0 };
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

  const dignityReport = planets.filter(p => p.dignity !== "?놁쓬").map(p => `${p.planet} ${p.sign}: ${p.dignity}`);

  // Transits
  const transits = calculateTransits(aspectInput);

  const chartSummary = [
    `?쒖뼇: ${sunSign}(${planets[0].degree}째)`,
    `?? ${moonSign}(${planets[1].degree}째)`,
    `?곸듅沅? ${risingSign}`,
    `吏諛??먯냼: ${dominantElement}(${elements[dominantElement].toFixed(1)}) / ?뱀쭏: ${dominantQuality}`,
    dignityReport.length > 0 ? `?붽렇?덊떚: ${dignityReport.join(", ")}` : "",
  ].filter(Boolean).join("\n");

  const keyAspects = aspects.map(a => a.interpretation);

  return {
    sunSign, moonSign, risingSign,
    planets, aspects, elements, qualities,
    dominantElement, dominantQuality,
    chartSummary, keyAspects, dignityReport, transits,
  };
}

// @ts-nocheck — astronomy-engine esm.sh 타입 호환 이슈 (런타임 정상)
import * as Astronomy from "https://esm.sh/astronomy-engine@2.1.19";

const {
  Body,
  GeoVector,
  EclipticLongitude,
  MakeTime,
  SiderealTime,
  e_tilt,
  SearchSunLongitude,
  Vector,
  Ecliptic,
  Observer,
  AstroTime,
  Equator
} = Astronomy;

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

const PLANETS_MAP: Record<string, Body> = {
  "태양": Body.Sun,
  "달": Body.Moon,
  "수성": Body.Mercury,
  "금성": Body.Venus,
  "화성": Body.Mars,
  "목성": Body.Jupiter,
  "토성": Body.Saturn,
  "천왕성": Body.Uranus,
  "해왕성": Body.Neptune,
  "명왕성": Body.Pluto,
};

const PLANET_NAMES = Object.keys(PLANETS_MAP);

const PLANET_MEANINGS: Record<string, { domain: string; keyword: string }> = {
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
  "North Node": { domain: "운명적 방향, 성장, 카르마의 목적", keyword: "미래" },
  "South Node": { domain: "과거의 습관, 숙달된 재능, 카르마적 부채", keyword: "과거" },
  "Chiron": { domain: "트라우마, 치유, 교육, 대안 의학", keyword: "치유" },
  "Lilith": { domain: "무의식, 성적 에너지, 금기, 독립", keyword: "본능" },
};

const SIGN_MEANINGS: Record<string, string> = {
  양자리: "개척적, 용감, 충동적", 황소자리: "안정적, 감각적, 고집",
  쌍둥이자리: "소통적, 다재다능, 변덕", 게자리: "보호적, 감성적, 가정적",
  사자자리: "당당, 창의적, 리더", 처녀자리: "분석적, 완벽주의, 실용적",
  천칭자리: "균형, 조화, 사교적", 전갈자리: "집중적, 변혁적, 비밀",
  사수자리: "자유, 낙관적, 모험", 염소자리: "야심적, 책임감, 현실적",
  물병자리: "독창적, 인도주의, 독립", 물고기자리: "직관적, 공감적, 예술적",
};

const SIGN_ELEMENT: Record<string, string> = {
  양자리: "불", 사자자리: "불", 사수자리: "불",
  황소자리: "흙", 처녀자리: "흙", 염소자리: "흙",
  쌍둥이자리: "공기", 천칭자리: "공기", 물병자리: "공기",
  게자리: "물", 전갈자리: "물", 물고기자리: "물",
};

const SIGN_QUALITY: Record<string, string> = {
  양자리: "활동궁", 게자리: "활동궁", 천칭자리: "활동궁", 염소자리: "활동궁",
  황소자리: "고정궁", 사자자리: "고정궁", 전갈자리: "고정궁", 물병자리: "고정궁",
  쌍둥이자리: "변통궁", 처녀자리: "변통궁", 사수자리: "변통궁", 물고기자리: "변통궁",
};

const RULERSHIPS: Record<string, number[]> = {
  태양: [4], 달: [3], 수성: [2, 5], 금성: [1, 6], 화성: [0, 7],
  목성: [8, 11], 토성: [9, 10], 천왕성: [10], 해왕성: [11], 명왕성: [7],
};

const EXALTATIONS: Record<string, number> = {
  태양: 0, 달: 1, 수성: 5, 금성: 11, 화성: 9,
  목성: 3, 토성: 6, 천왕성: 7, 해왕성: 3, 명왕성: 4,
};

const HOUSE_MEANINGS: Record<number, string> = {
  1: "자아·외모·첫인상", 2: "재물·가치관·소유",
  3: "소통·형제·단거리이동", 4: "가정·뿌리·내면",
  5: "창의·연애·자녀·즐거움", 6: "건강·일상·서비스",
  7: "파트너십·결혼·계약", 8: "변환·공유재물·심층심리",
  9: "철학·해외·고등교육", 10: "사회적지위·직업·명예",
  11: "우정·사회참여·목표", 12: "잠재의식·은둔·카르마",
};

// ═══════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════

function getPlanetDignity(planet: string, signIdx: number): string {
  if (RULERSHIPS[planet]?.includes(signIdx)) return "본좌(domicile)";
  if (EXALTATIONS[planet] === signIdx) return "고양(exaltation)";
  const detIdx = RULERSHIPS[planet]?.map(r => (r + 6) % 12) || [];
  if (detIdx.includes(signIdx)) return "데트리먼트(detriment)";
  if ((EXALTATIONS[planet] + 6) % 12 === signIdx) return "추락(fall)";
  return "없음";
}

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
  { name: "합(conjunction)", angle: 0, orb: 6, harmonious: true, symbol: "☌" },
  { name: "육분(sextile)", angle: 60, orb: 4, harmonious: true, symbol: "⚹" },
  { name: "사각(square)", angle: 90, orb: 6, harmonious: false, symbol: "□" },
  { name: "삼합(trine)", angle: 120, orb: 6, harmonious: true, symbol: "△" },
  { name: "충(opposition)", angle: 180, orb: 6, harmonious: false, symbol: "☍" },
  { name: "퀸컨스(quincunx)", angle: 150, orb: 2, harmonious: false, symbol: "⚻" },
  { name: "semi-sextile", angle: 30, orb: 2, harmonious: true, symbol: "⚺" },
  { name: "semi-square", angle: 45, orb: 2, harmonious: false, symbol: "∠" },
  { name: "sesquiquadrate", angle: 135, orb: 2, harmonious: false, symbol: "⚼" },
];

function getPlanetOrbCorrection(planet: string): number {
  if (planet === "태양" || planet === "달") return 2;
  if (planet === "목성" || planet === "토성") return -1;
  if (planet === "천왕성" || planet === "해왕성" || planet === "명왕성") return -2;
  if (planet === "North Node" || planet === "South Node" || planet === "Chiron" || planet === "Lilith") return -1;
  return 0;
}

function calculateAspects(positions: { planet: string; absoluteDegree: number }[]): Aspect[] {
  const aspects: Aspect[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      let diff = Math.abs(positions[i].absoluteDegree - positions[j].absoluteDegree);
      if (diff > 180) diff = 360 - diff;

      const p1 = positions[i].planet;
      const p2 = positions[j].planet;
      const corr1 = getPlanetOrbCorrection(p1);
      const corr2 = getPlanetOrbCorrection(p2);
      const maxCorr = Math.max(corr1, corr2);

      for (const at of ASPECT_TYPES) {
        const finalOrb = at.orb + maxCorr;
        const orbUsed = Math.abs(diff - at.angle);
        if (orbUsed <= finalOrb) {
          const m1 = PLANET_MEANINGS[p1] || { keyword: p1 };
          const m2 = PLANET_MEANINGS[p2] || { keyword: p2 };
          const interp = at.harmonious
            ? `${p1}(${m1.keyword}) ${at.symbol} ${p2}(${m2.keyword}) ${at.name}: 조화`
            : `${p1}(${m1.keyword}) ${at.symbol} ${p2}(${m2.keyword}) ${at.name}: 긴장/성장`;
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

function calculateMeanNode(date: Date): number {
  const time = MakeTime(date);
  // Julian centuries since J2000.0 (JD 2451545.0)
  const T = time.tt / 36525.0;
  // IAU formula for Mean Node (Tropical)
  let node = 125.044522 - 1934.136261 * T + 0.0020754 * T * T;
  return ((node % 360) + 360) % 360;
}

function calculateChironLongitude(time: AstroTime): number {
  const D = time.tt;
  // Piecewise linear interpolation with cumulative longitude
  // Source: Cafe Astrology Chiron sign ingress dates (Swiss Ephemeris)
  const T: [number, number][] = [
    [-18262, 300],  // 1950 Jan
    [-15340, 330],  // 1958 Jan
    [-12784, 345],  // 1965 Jan
    [-11597, 360],  // 1968 Apr: Aries 0°
    [-9953, 380],   // 1972 Sep
    [-8310, 390],   // 1977 Mar: Taurus 0°
    [-5753, 420],   // 1984 Apr: Gemini 0°
    [-4211, 450],   // 1988 Jun: Cancer 0°
    [-3076, 120 + 360],   // 1991 Jul: Leo 0°
    [-2313, 150 + 360],   // 1993 Sep: Virgo 0°
    [-1574, 180 + 360],   // 1995 Sep: Libra 0°
    [-844, 210 + 360],    // 1997 Sep: Scorpio 0°
    [-467, 588],    // 1998 Sep
    [-102, 600],    // 1999 Sep: Sagittarius 0°
    [0.5, 622],     // 2000 Jan
    [710, 630],     // 2001 Dec: Capricorn 0°
    [2171, 660],    // 2005 Dec: Aquarius 0°
    [4057, 690],    // 2011 Feb: Pisces 0°
    [6988, 720],    // 2019 Feb: Aries 0°
    [10001, 750],   // 2027 Apr: Taurus 0°
  ];

  if (D <= T[0][0]) {
    const r = (T[1][1] - T[0][1]) / (T[1][0] - T[0][0]);
    return (((T[0][1] + r * (D - T[0][0])) % 360) + 360) % 360;
  }
  for (let i = 0; i < T.length - 1; i++) {
    if (D >= T[i][0] && D < T[i + 1][0]) {
      const lon = T[i][1] + (T[i + 1][1] - T[i][1]) * (D - T[i][0]) / (T[i + 1][0] - T[i][0]);
      return ((lon % 360) + 360) % 360;
    }
  }
  const last = T.length - 1;
  const r = (T[last][1] - T[last - 1][1]) / (T[last][0] - T[last - 1][0]);
  return (((T[last][1] + r * (D - T[last][0])) % 360) + 360) % 360;
}

function calculateLilithLongitude(time: AstroTime): number {
  const D = time.tt;
  const lon = 231.9117 + 0.11140353 * D;
  return ((lon % 360) + 360) % 360;
}

function getHighPrecisionPositions(date: Date, observer: Observer) {
  const time = MakeTime(date);

  const basePositions = PLANET_NAMES
    .filter(name => name !== "North Node" && name !== "South Node")
    .map(name => {
      const body = PLANETS_MAP[name];
      try {
        const geoVec = GeoVector(body, time, true);
        const ecl = Ecliptic(geoVec);
        return { planet: name, longitude: ecl.elon };
      } catch (e) {
        const fallbackLon = EclipticLongitude(body, time);
        return { planet: name, longitude: fallbackLon };
      }
    });

  // Mean Node (IAU formula - already Tropical)
  const nodeLng = calculateMeanNode(date);

  const planetPositions = [...basePositions];
  planetPositions.push({ planet: "North Node", longitude: nodeLng });
  planetPositions.push({ planet: "South Node", longitude: (nodeLng + 180) % 360 });

  // Chiron
  try {
    const chironLng = calculateChironLongitude(time);
    planetPositions.push({ planet: "Chiron", longitude: chironLng });
  } catch (_) { }

  // Lilith
  try {
    const lilithLng = calculateLilithLongitude(time);
    planetPositions.push({ planet: "Lilith", longitude: lilithLng });
  } catch (_) { }

  return planetPositions;
}

function raToLon(raDeg: number, epsRad: number): number {
  const raRad = raDeg * Math.PI / 180;
  const cosEps = Math.cos(epsRad);
  let lon = Math.atan2(Math.sin(raRad), Math.cos(raRad) * cosEps) * 180 / Math.PI;
  return (lon + 360) % 360;
}

function placidusCusp(ramcDeg: number, epsRad: number, phiRad: number, house: number): number {
  const tanPhi = Math.tan(phiRad);
  let frac: number, baseDeg: number, sign: number, nocturnal: boolean;
  switch (house) {
    case 11: frac = 1/3; baseDeg = ramcDeg;       sign = +1; nocturnal = false; break;
    case 12: frac = 2/3; baseDeg = ramcDeg;       sign = +1; nocturnal = false; break;
    case 2:  frac = 2/3; baseDeg = ramcDeg + 180; sign = -1; nocturnal = true;  break;
    case 3:  frac = 1/3; baseDeg = ramcDeg + 180; sign = -1; nocturnal = true;  break;
    default: return 0;
  }
  let ra = baseDeg + sign * frac * 90;
  for (let i = 0; i < 100; i++) {
    const raRad = (ra * Math.PI) / 180;
    const tanD = Math.tan(epsRad) * Math.sin(raRad);
    const D = Math.atan(tanD);
    let arc: number;
    if (nocturnal) {
      const cosH = tanPhi * Math.tan(D);
      if (cosH <= -1) arc = 180;
      else if (cosH >= 1) arc = 0;
      else arc = Math.acos(cosH) * 180 / Math.PI;
    } else {
      const cosH = -tanPhi * Math.tan(D);
      if (cosH <= -1) arc = 180;
      else if (cosH >= 1) arc = 0;
      else arc = Math.acos(cosH) * 180 / Math.PI;
    }
    const newRA = baseDeg + sign * frac * arc;
    if (Math.abs(newRA - ra) < 0.0001) { ra = newRA; break; }
    ra = newRA;
  }
  return raToLon(ra, epsRad);
}

function calculateHousesManual(date: Date, observer: any) {
  const time = MakeTime(date);
  const gst = SiderealTime(time);
  const lst = ((gst + observer.longitude / 15.0) % 24 + 24) % 24;
  const ramc = lst * 15.0;
  const tilt = e_tilt(time);
  const epsRad = (tilt?.tobl || 23.43929) * Math.PI / 180;
  const phiRad = observer.latitude * Math.PI / 180;
  const ramcRad = ramc * Math.PI / 180;
  const mcDeg = raToLon(ramc, epsRad);
  const y = Math.cos(ramcRad);
  const x = -(Math.sin(epsRad) * Math.tan(phiRad) + Math.cos(epsRad) * Math.sin(ramcRad));
  let ascDeg = Math.atan2(y, x) * 180 / Math.PI;
  ascDeg = (ascDeg + 360) % 360;
  const icDeg = (mcDeg + 180) % 360;
  const descDeg = (ascDeg + 180) % 360;
  return {
    asc: ascDeg, mc: mcDeg, ic: icDeg, desc: descDeg,
    ramc: ramc, eps: epsRad, phi: phiRad,
    isConsistent: true, angleBetween: (ascDeg - mcDeg + 360) % 360
  };
}

function calculateHouseCuspsPlacidus(asc: number, mc: number, ramc?: number, eps?: number, phi?: number) {
  const ic = (mc + 180) % 360;
  const desc = (asc + 180) % 360;
  if (ramc !== undefined && eps !== undefined && phi !== undefined) {
    const h11 = placidusCusp(ramc, eps, phi, 11);
    const h12 = placidusCusp(ramc, eps, phi, 12);
    const h2  = placidusCusp(ramc, eps, phi, 2);
    const h3  = placidusCusp(ramc, eps, phi, 3);
    return [
      asc, h2, h3, ic,
      (h11 + 180) % 360, (h12 + 180) % 360,
      desc,
      (h2 + 180) % 360, (h3 + 180) % 360,
      mc, h11, h12
    ];
  }
  const q1 = (asc - mc + 360) % 360;
  const q2 = (ic - asc + 360) % 360;
  const q3 = (desc - ic + 360) % 360;
  const q4 = (mc - desc + 360) % 360;
  return [
    asc, (asc + q2/3) % 360, (asc + 2*q2/3) % 360, ic,
    (ic + q3/3) % 360, (ic + 2*q3/3) % 360, desc,
    (desc + q4/3) % 360, (desc + 2*q4/3) % 360, mc,
    (mc + q1/3) % 360, (mc + 2*q1/3) % 360
  ];
}

function getHouseForLongitude(longitude: number, cusps: number[]): number {
  for (let i = 0; i < 11; i++) {
    const start = cusps[i];
    const end = cusps[i + 1];
    if (start < end) {
      if (longitude >= start && longitude < end) return i + 1;
    } else {
      if (longitude >= start || longitude < end) return i + 1;
    }
  }
  return 12;
}

function formatPosition(longitude: number) {
  const lng = ((longitude % 360) + 360) % 360;
  const signIdx = Math.floor(lng / 30) % 12;
  const degree = lng % 30;
  const deg = Math.floor(degree);
  const min = Math.round((degree - deg) * 60);
  return {
    longitude: lng,
    sign: ZODIAC_SIGNS[signIdx],
    degree: `${deg}°${min}'`
  };
}

function calculateSolarReturn(natalSunLon: number, birthMonth: number, birthDay: number, observer: Observer, currentYear: number = 2026) {
  const searchStart = new Date(Date.UTC(currentYear, birthMonth - 1, birthDay - 5, 0, 0, 0));
  const startTime = MakeTime(searchStart);

  const srTime = SearchSunLongitude(natalSunLon, startTime, 10);
  if (!srTime) return null;

  const srDate = srTime.date;
  const srPositions = getHighPrecisionPositions(srDate, observer);
  const houseData = calculateHousesManual(srDate, observer);
  const cusps = calculateHouseCuspsPlacidus(houseData.asc, houseData.mc, houseData.ramc, houseData.eps, houseData.phi);

  const srPlanets = srPositions?.map(p => {
    const lng = ((p.longitude % 360) + 360) % 360;
    const signIdx = Math.floor(lng / 30) % 12;
    const degVal = lng % 30;
    return {
      planet: p.planet,
      longitude: lng,
      sign: ZODIAC_SIGNS[signIdx],
      degree: Math.floor(degVal) + "°" + Math.round((degVal % 1) * 60) + "'",
      house: getHouseForLongitude(lng, cusps)
    };
  });

  const aspectInput = srPositions?.map(p => ({
    planet: p.planet,
    absoluteDegree: p.longitude,
  }));
  const aspects = calculateAspects(aspectInput);

  const ascSign = ZODIAC_SIGNS[Math.floor(houseData.asc / 30) % 12];
  const moon = srPlanets.find(p => p.planet === "달")!;
  const saturn = srPlanets.find(p => p.planet === "토성")!;

  const highlights = [];
  highlights.push(`솔라 리턴 ASC가 ${ascSign}자리 → 올해의 페르소나와 활동 테마`);
  highlights.push(`솔라 리턴 달이 ${moon.house}하우스 → 올해 정서적 에너지와 관심이 집중되는 영역`);

  let mcDiff = Math.abs(saturn.longitude - houseData.mc);
  if (mcDiff > 180) mcDiff = 360 - mcDiff;
  if (mcDiff < 5) {
    highlights.push(`솔라 리턴 토성이 MC 부근 → 올해 커리어와 사회적 책임의 구조화/강화`);
  }

  return {
    year: currentYear,
    exactDate: srDate.toISOString(),
    sun: srPlanets.find(p => p.planet === "태양"),
    moon,
    ascendant: { longitude: houseData.asc, sign: ascSign },
    mc: { longitude: houseData.mc, sign: ZODIAC_SIGNS[Math.floor(houseData.mc / 30) % 12] },
    planets: srPlanets,
    aspects: aspects?.map(a => a.interpretation),
    highlights
  };
}

// ═══════════════════════════════════════════════
// Public Interface
// ═══════════════════════════════════════════════

export interface CoreIdentityPlanet {
  sign: string;
  signEnglish: string;
  house: number | null;
  degree: number;
  is_retrograde: boolean;
  dignity: string;
}

export interface ServerAstrologyResult {
  is_time_exact: boolean;
  core_identity: {
    sun: CoreIdentityPlanet;
    moon: CoreIdentityPlanet;
    ascendant: { sign: string; degree: number } | null;
  };
  angles: {
    asc_self: string;
    mc_career: string;
    ic_roots: string;
    dsc_partner: string;
  } | null;
  ai_synthesis_tags: string[];
  sunSign: string;
  moonSign: string;
  risingSign: string;
  planet_positions: any[];
  house_positions: {
    ASC: string;
    MC: string;
    IC: string;
    DESC: string;
    raw: number[];
  } | null;
  major_aspects: string[];
  planets: {
    planet: string;
    sign: string;
    signEnglish: string;
    degree: number;
    absoluteDegree: number;
    house: number | null;
    dignity: string;
    is_retrograde: boolean;
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
  location_confidence: string;
  location_warning: string | null;
  houses: {
    system: string;
    cusps: number[];
    ascendant: number;
    mc: number;
  } | null;
  progression: {
    date: string;
    sun: any;
    moon: any;
    moon_house: number | null;
    moon_aspects: any[];
  } | null;
  solarReturn: {
    year: number;
    exactDate: string;
    sun: any;
    moon: any;
    ascendant: any;
    mc: any;
    planets: any[];
    aspects: string[];
    highlights: string[];
  } | null;
  asc_degree: number;
  mc_degree: number;
  debug_log?: { asc_degree: number, mc_degree: number };
}

import { getKoreanTimezoneOffset } from './timeUtils.ts';

export function calculateServerAstrology(
  year: number, month: number, day: number, hour: number, minute: number = 0,
  latitude?: number, longitude?: number,
  hasTime: boolean = true,
  targetDate?: Date
): ServerAstrologyResult {
  const offset = getKoreanTimezoneOffset(year, month, day);
  const natalDate = new Date(Date.UTC(year, month - 1, day, hour - offset, minute));

  // 출생지 제공 여부 확인
  const birthPlaceProvided = !!(latitude && latitude !== 0 && longitude && longitude !== 0);
  const lat = birthPlaceProvided ? latitude! : 37.5665;
  const lon = birthPlaceProvided ? longitude! : 126.978;
  const observer = new Observer(lat, lon, 0);

  // 출생지 없을 때 신뢰도 경고 플래그
  const locationConfidence = hasTime ? (birthPlaceProvided ? "high" : "low") : "very_low";
  const locationWarning = hasTime
    ? (birthPlaceProvided ? null : "출생지 미입력: 서울 기본값(37.5°N, 127.0°E) 적용. ASC/하우스 계산 신뢰도 낮음.")
    : "출생 시간 미입력: 정오(12:00) 기준 계산. ASC/하우스 미제공, 달 위치 오차 가능(±6°).";

  const rawPositions = getHighPrecisionPositions(natalDate, observer);
  const houseData = calculateHousesManual(natalDate, observer);

  console.log("🌎 [DEBUG-ASTRO] Observer:", JSON.stringify(observer));
  console.log("🔭 [DEBUG-ASTRO] Raw Node Longitude:", rawPositions.find(p => p.planet === "North Node")?.longitude.toFixed(4));
  console.log("🏠 [House Calculation] ASC:", houseData.asc.toFixed(2), "MC:", houseData.mc.toFixed(2));
  console.log("[DEBUG-ASTRO] House Calculation 완료");

  if (!houseData.isConsistent) {
    console.warn("⚠️ [Geometry Warning] ASC and MC angle is unusual:", houseData.angleBetween.toFixed(2));
  }

  const risingSign = ZODIAC_SIGNS[Math.floor(houseData.asc / 30) % 12];
  const mcSign = ZODIAC_SIGNS[Math.floor(houseData.mc / 30) % 12];
  const icSign = ZODIAC_SIGNS[Math.floor(houseData.ic / 30) % 12];
  const descSign = ZODIAC_SIGNS[Math.floor(houseData.desc / 30) % 12];

  const cusps = hasTime ? calculateHouseCuspsPlacidus(houseData.asc, houseData.mc, houseData.ramc, houseData.eps, houseData.phi) : [];

  const planets = rawPositions?.map((p, i) => {
    const lng = ((p.longitude % 360) + 360) % 360;
    const signIdx = Math.floor(lng / 30) % 12;
    const degree = Math.round((lng % 30) * 100) / 100;
    const isCusp = degree <= 1 || degree >= 29;
    const cuspNote = isCusp ? `(경계: ${degree <= 1 ? ZODIAC_SIGNS[(signIdx + 11) % 12] : ZODIAC_SIGNS[(signIdx + 1) % 12]} 영향 가능)` : "";
    const sign = ZODIAC_SIGNS[signIdx];
    const house = hasTime ? getHouseForLongitude(lng, cusps) : null;

    // Final force-correction for Node inside the UI-facing array
    let finalLng = lng;
    let finalSign = ZODIAC_SIGNS[signIdx];
    let finalDegree = degree;


    const dignity = getPlanetDignity(p.planet, Math.floor(finalLng / 30) % 12);
    const meaning = PLANET_MEANINGS[p.planet] || { domain: "", keyword: "" };
    const signMeaning = SIGN_MEANINGS[finalSign]?.split(",")[0] || "";

    // B-71new: 역행 판별 — 현재 속도 음수 여부 (astronomy-engine GeoVector 기반)
    let is_retrograde = false;
    if (p.planet === "North Node" || p.planet === "South Node" || p.planet === "Lilith") {
      is_retrograde = p.planet === "Lilith" ? false : true;
    } else if (p.planet === "Chiron") {
      try {
        const t1 = MakeTime(natalDate);
        const t2 = MakeTime(new Date(natalDate.getTime() + 86400000));
        is_retrograde = calculateChironLongitude(t2) < calculateChironLongitude(t1);
      } catch (_) { }
    } else {
      try {
        const body = PLANETS_MAP[p.planet];
        if (body && body !== Body.Sun && body !== Body.Moon) {
          const t1 = MakeTime(natalDate);
          const t2 = MakeTime(new Date(natalDate.getTime() + 86400000));
          const g1 = GeoVector(body, t1, true);
          const e1 = Ecliptic(g1);
          const g2 = GeoVector(body, t2, true);
          const e2 = Ecliptic(g2);
          let diff = e2.elon - e1.elon;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          is_retrograde = diff < 0;
        }
      } catch (_) { }
    }

    let dignityNote = "";
    if (dignity.includes("본좌")) dignityNote = " [본좌]";
    else if (dignity.includes("고양")) dignityNote = " [고양]";

    return {
      planet: p.planet,
      sign: finalSign,
      signEnglish: ZODIAC_ENGLISH[ZODIAC_SIGNS.indexOf(finalSign as any)],
      degree: finalDegree,
      absoluteDegree: finalLng,
      house,
      dignity,
      is_retrograde,
      interpretation: `${p.planet}(${meaning.keyword}) ${finalSign} ${finalDegree}°, ${house ? `${house}하우스(${HOUSE_MEANINGS[house] || "전반"})` : "하우스 미확정"}${dignityNote}${is_retrograde ? " [역행]" : ""} — ${meaning.domain}이 ${signMeaning} 방식으로 ${house ? (HOUSE_MEANINGS[house]?.split("·")[0] || "삶") : "일반"} 영역에 영향.${cuspNote}`,
    };
  });

  const aspectInput = rawPositions?.map(p => ({
    planet: p.planet,
    absoluteDegree: p.longitude,
  }));
  const aspects = calculateAspects(aspectInput);

  const elements: Record<string, number> = { 불: 0, 흙: 0, 공기: 0, 물: 0 };
  const qualities: Record<string, number> = { 활동궁: 0, 고정궁: 0, 변통궁: 0 };
  const weights = [3, 2.5, 1.5, 1.5, 1.5, 1, 1, 0.5, 0.5, 0.5];
  planets.forEach((p, i) => {
    const sign = p.sign;
    if (SIGN_ELEMENT[sign]) elements[SIGN_ELEMENT[sign]] += weights[i] || 0.5;
    if (SIGN_QUALITY[sign]) qualities[SIGN_QUALITY[sign]] += weights[i] || 0.5;
  });

  const elementEntries = Object.entries(elements).sort((a, b) => b[1] - a[1]);
  const maxElementVal = elementEntries[0][1];
  const secondElementVal = elementEntries[1]?.[1] ?? 0;
  const dominantElement = (maxElementVal - secondElementVal <= 0.5)
    ? `${elementEntries[0][0]}/${elementEntries[1][0]} (혼합)`
    : elementEntries[0][0];

  const qualityEntries = Object.entries(qualities).sort((a, b) => b[1] - a[1]);
  const maxQualityVal = qualityEntries[0][1];
  const dominantQuality = qualityEntries.filter(q => q[1] === maxQualityVal).map(q => q[0]).join("/");

  const sunSign = planets[0].sign;
  const moonSign = planets[1].sign;
  const dignityReport = planets.filter(p => p.dignity !== "없음").map(p => `${p.planet} ${p.sign}: ${p.dignity}`);

  // Transits: 개선된 어스펙트 감지 및 정점(exact) 날짜 추정
  const SLOW_PLANET_SPEEDS: Record<string, number> = {
    "목성": 0.083, "토성": 0.034, "천왕성": 0.012, "해왕성": 0.006, "명왕성": 0.004,
  };

  const TRANSIT_ASPECTS = [
    { name: "합(0°)", angle: 0, icon: "⚡" },
    { name: "육분(60°)", angle: 60, icon: "✨" },
    { name: "사각(90°)", angle: 90, icon: "⚠️" },
    { name: "삼합(120°)", angle: 120, icon: "💎" },
    { name: "충(180°)", angle: 180, icon: "⚖️" },
  ];

  const now = targetDate || new Date();
  const currentPositions = getHighPrecisionPositions(now, observer);
  const transits: string[] = [];
  const slowPlanets = ["목성", "토성", "천왕성", "해왕성", "명왕성"];

  for (const sp of slowPlanets) {
    const current = currentPositions.find(p => p.planet === sp);
    if (!current) continue;
    const cLng = ((current.longitude % 360) + 360) % 360;
    const currentSign = ZODIAC_SIGNS[Math.floor(cLng / 30) % 12];
    const meaning = PLANET_MEANINGS[sp] || { domain: sp, keyword: sp };
    const speed = SLOW_PLANET_SPEEDS[sp] || 0.01;

    transits.push(`${sp} 트랜짓 ${currentSign}: ${meaning.domain} 영역에서 ${SIGN_MEANINGS[currentSign]?.split(",")[0]} 에너지 작용.`);

    for (const natalP of aspectInput) {
      const nLng = ((natalP.absoluteDegree % 360) + 360) % 360;
      const diffFromNatal = (cLng - nLng + 360) % 360;

      for (const ta of TRANSIT_ASPECTS) {
        const targets = (ta.angle === 0 || ta.angle === 180) ? [ta.angle] : [ta.angle, 360 - ta.angle];

        for (const target of targets) {
          let angleDiff = target - diffFromNatal;
          while (angleDiff > 180) angleDiff -= 360;
          while (angleDiff < -180) angleDiff += 360;

          if (Math.abs(angleDiff) <= 5) { // 트랜짓 허용 오차 5도
            const daysToExact = angleDiff / speed;
            const exactDate = new Date(now.getTime() + daysToExact * 24 * 60 * 60 * 1000);
            const dateStr = exactDate.toISOString().split('T')[0];
            const timingNote = daysToExact > 0 ? `${dateStr}경 정점 예상` : `${dateStr}경 정점 통과`;
            const diffDays = Math.abs(Math.round(daysToExact));

            transits.push(`${ta.icon} [트랜짓]${sp} ${ta.name} [출생]${natalP.planet}: ${timingNote} (${diffDays}일 차이)`);
          }
        }
      }
    }
  }

  const chartSummary = [
    `태양: ${sunSign}(${planets[0].degree}°)`,
    `달: ${moonSign}(${planets[1].degree}°)${!hasTime ? " (시간 미입력 오차 가능)" : ""}`,
    `상승궁: ${hasTime ? risingSign : "미확정"}`,
    `지배 원소: ${dominantElement} / 특질: ${dominantQuality}`,
    dignityReport.length > 0 ? `디그니티: ${dignityReport.join(", ")}` : "",
  ].filter(Boolean).join("\n");

  const majorAspectsStrings = aspects?.map(a => a.interpretation);

  // B-87new: core_identity 구성
  const sunPlanet = planets[0];
  const moonPlanet = planets[1];
  const core_identity = {
    sun: { sign: sunPlanet.sign, signEnglish: sunPlanet.signEnglish, house: sunPlanet.house, degree: sunPlanet.degree, is_retrograde: false, dignity: sunPlanet.dignity },
    moon: { sign: moonPlanet.sign, signEnglish: moonPlanet.signEnglish, house: moonPlanet.house, degree: moonPlanet.degree, is_retrograde: moonPlanet.is_retrograde, dignity: moonPlanet.dignity },
    ascendant: (birthPlaceProvided && hasTime) ? { sign: risingSign, degree: Math.round(houseData.asc % 30 * 100) / 100 } : null,
  };

  // B-88new: angles 4축
  const angles = (birthPlaceProvided && hasTime) ? {
    asc_self: risingSign,
    mc_career: mcSign,
    ic_roots: icSign,
    dsc_partner: descSign,
  } : null;

  // B-89new: ai_synthesis_tags 자동 생성
  const ai_synthesis_tags: string[] = [];
  const elementMax = Object.entries(elements).sort((a, b) => b[1] - a[1])[0];
  if (elementMax[1] >= 6) ai_synthesis_tags.push(`${elementMax[0]} 원소 과다(Heavy ${elementMax[0]})`);
  planets.filter(p => p.is_retrograde).forEach(p => ai_synthesis_tags.push(`${p.planet} 역행기 출생`));
  if (hasTime && mcSign) ai_synthesis_tags.push(`MC ${mcSign}(${SIGN_MEANINGS[mcSign]?.split(",")[0] || ""})`);
  if (dignityReport.length > 0) ai_synthesis_tags.push(`품위 행성: ${dignityReport.slice(0, 2).join(", ")}`);

  // B-86new: is_time_exact
  const is_time_exact = !!(hour && hour !== 12);

  // Secondary Progression
  const ageInDays = (now.getTime() - natalDate.getTime()) / (1000 * 60 * 60 * 24);
  const ageInYears = ageInDays / 365.25;
  const progressedDate = new Date(natalDate.getTime() + ageInYears * 24 * 60 * 60 * 1000);
  const progPositions = getHighPrecisionPositions(progressedDate, observer);

  const progSun = progPositions.find(p => p.planet === "태양")!;
  const progMoon = progPositions.find(p => p.planet === "달")!;
  const moonAspects: any[] = [];
  const ASPECT_TYPES_SHORT = [
    { name: "conjunction", angle: 0, orb: 2 },
    { name: "sextile", angle: 60, orb: 2 },
    { name: "square", angle: 90, orb: 2 },
    { name: "trine", angle: 120, orb: 2 },
    { name: "opposition", angle: 180, orb: 2 }
  ];

  planets.forEach(np => {
    let diff = Math.abs(progMoon.longitude - np.absoluteDegree);
    if (diff > 180) diff = 360 - diff;
    for (const at of ASPECT_TYPES_SHORT) {
      if (Math.abs(diff - at.angle) <= at.orb) {
        moonAspects.push({ planet: `natal ${np.planet}`, aspect: at.name, orb: Math.round(Math.abs(diff - at.angle) * 100) / 100 });
      }
    }
  });

  return {
    is_time_exact,
    core_identity,
    angles,
    ai_synthesis_tags,
    sunSign, moonSign, risingSign,
    planet_positions: planets,
    house_positions: hasTime ? {
      ASC: risingSign, MC: mcSign, IC: icSign, DESC: descSign,
      raw: [houseData.asc, houseData.mc, houseData.ic, houseData.desc],
    } : null,
    major_aspects: majorAspectsStrings,
    planets, aspects, elements, qualities,
    dominantElement, dominantQuality,
    chartSummary, keyAspects: majorAspectsStrings,
    dignityReport, transits,
    location_confidence: locationConfidence,
    location_warning: locationWarning,
    houses: hasTime ? { system: "Placidus", cusps, ascendant: houseData.asc, mc: houseData.mc } : null,
    progression: {
      date: progressedDate.toISOString().split('T')[0],
      sun: formatPosition(progSun.longitude),
      moon: formatPosition(progMoon.longitude),
      moon_house: hasTime ? getHouseForLongitude(progMoon.longitude, cusps) : null,
      moon_aspects: moonAspects
    },
    solarReturn: calculateSolarReturn(planets[0].absoluteDegree, month, day, observer, now.getFullYear()),
    asc_degree: houseData.asc,
    mc_degree: houseData.mc,
    debug_log: { asc_degree: houseData.asc, mc_degree: houseData.mc }
  };
}

/**
 * astrologyEngine.ts
 * - Western Astrology calculations using Swiss Ephemeris.
 * - Includes solar-to-lunar conversion logic for downstream Ziwei accuracy.
 */

import { Solar, Lunar } from "https://esm.sh/lunar-javascript";
import { Body, Equator, Ecliptic, Observer, AstroTime } from "npm:astronomy-engine@2.1.19";

export interface AstrologyCalculationInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  lat?: number;
  lng?: number;
}

const MAJOR_ASPECTS = [
  { name: "conjunction", angle: 0, orb: 8 },
  { name: "opposition", angle: 180, orb: 7 },
  { name: "square", angle: 90, orb: 7 },
  { name: "trine", angle: 120, orb: 6 },
  { name: "sextile", angle: 60, orb: 6 }
];

const MINOR_ASPECTS = [
  { name: "quincunx", angle: 150, orb: 2 },
  { name: "semi-sextile", angle: 30, orb: 2 },
  { name: "semi-square", angle: 45, orb: 2 },
  { name: "sesquiquadrate", angle: 135, orb: 2 },
  { name: "quintile", angle: 72, orb: 1.5 },
  { name: "bi-quintile", angle: 144, orb: 1.5 }
];

export function calculateAstrologyV9(input: AstrologyCalculationInput) {
  const { year, month, day, hour, minute } = input;
  const date = new Date(year, month - 1, day, hour, minute);
  
  // 1. Solar to Lunar Conversion
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  
  const lunarData = {
    lunarYear: lunar.getYear(),
    lunarMonth: lunar.getMonth(),
    lunarDay: lunar.getDay(),
    isLeap: lunar.getMonth() < 0,
    lunarString: `${lunar.getYear()}-${Math.abs(lunar.getMonth())}-${lunar.getDay()}`
  };

  // 2. Planet Positions
  const observer = new Observer(37.5665, 126.9780, 0); 
  const time = new AstroTime(date);
  
  const planets = [
    "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"
  ];
  
  const planet_positions = planets.map(p => {
    // @ts-ignore
    const body = Body[p];
    const equ_vec = Equator(body, time, observer, true, true);
    const ecl_vec = Ecliptic(equ_vec);
    
    const lon = ecl_vec.elon;
    const signIdx = Math.floor(lon / 30) % 12;
    const degree = lon % 30;
    
    return {
      planet: p,
      lon,
      signIdx,
      degree,
      sign: getZodiacSign(signIdx)
    };
  });

  // 3. Aspect Detection (B-266: Major and Minor)
  const aspects: any[] = [];
  for (let i = 0; i < planet_positions.length; i++) {
    for (let j = i + 1; j < planet_positions.length; j++) {
      const p1 = planet_positions[i];
      const p2 = planet_positions[j];
      const diff = calculateAngleDifference(p1.lon, p2.lon);

      // Major
      for (const aspect of MAJOR_ASPECTS) {
        if (Math.abs(diff - aspect.angle) <= aspect.orb) {
          aspects.push({
            p1: p1.planet,
            p2: p2.planet,
            name: aspect.name,
            degree: aspect.angle,
            orb: parseFloat(Math.abs(diff - aspect.angle).toFixed(2)),
            type: 'major'
          });
        }
      }
      // Minor
      for (const aspect of MINOR_ASPECTS) {
        if (Math.abs(diff - aspect.angle) <= aspect.orb) {
          aspects.push({
            p1: p1.planet,
            p2: p2.planet,
            name: aspect.name,
            degree: aspect.angle,
            orb: parseFloat(Math.abs(diff - aspect.angle).toFixed(2)),
            type: 'minor'
          });
        }
      }
    }
  }

  // 4. Transits
  const now = new Date();
  const timeNow = new AstroTime(now);
  const transits = planets.map(p => {
    // @ts-ignore
    const body = Body[p];
    const equ_vec = Equator(body, timeNow, observer, true, true);
    const ecl_vec = Ecliptic(equ_vec);
    return {
      planet: p,
      lon: ecl_vec.elon,
      sign: getZodiacSign(Math.floor(ecl_vec.elon / 30) % 12)
    };
  });

  return {
    lunarData,
    planets: planet_positions,
    aspects, // Resulting aspects
    transits,
    sunSign: getZodiacSign(Math.floor(planet_positions[0].lon / 30) % 12),
    moonSign: getZodiacSign(Math.floor(planet_positions[1].lon / 30) % 12),
    risingSign: "Unknown",
    characteristics: planet_positions.map(p => `${p.planet} in ${p.sign}`)
  };
}

function calculateAngleDifference(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function getZodiacSign(idx: number): string {
  const signs = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  return signs[idx];
}

// ══════════════════════════════════════════════════════
// B-266: Secondary Progression & Transit 계산
// ══════════════════════════════════════════════════════

export interface PlanetPosition {
  planet: string;
  lon: number;
  signIdx: number;
  degree: number;
  sign: string;
}

export interface ProgressedPlanet {
  planet: string;
  natalDegree: number;
  progressedDegree: number;
  sign: string;
  yearsFromBirth: number;
}

export interface TransitPlanet {
  planet: string;
  degree: number;
  sign: string;
  speed: number;  // 도/일
}

export interface TransitAspect {
  transitPlanet: string;
  natalPlanet: string;
  aspect: string;
  orb: number;
  isApplying: boolean;  // 접근중(true) vs 분리중(false)
}

const TRANSIT_EPOCH = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
const TRANSIT_CONFIG: Record<string, { pos: number; speed: number }> = {
  Sun: { pos: 280.46, speed: 0.9856 },
  Moon: { pos: 218.32, speed: 13.176 },
  Mercury: { pos: 252.25, speed: 4.0921 }, 
  Venus: { pos: 181.98, speed: 1.6021 }, 
  Mars: { pos: 355.45, speed: 0.5240 }, 
  Jupiter: { pos: 34.40, speed: 0.0831 }, 
  Saturn: { pos: 49.94, speed: 0.0334 }, 
  Uranus: { pos: 314.05, speed: 0.0117 }, 
  Neptune: { pos: 304.22, speed: 0.0059 }, 
  Pluto: { pos: 254.88, speed: 0.0040 }
};

/**
 * Secondary Progression 계산 (1일 = 1년 법칙)
 */
export function calculateProgressions(
  birthDate: Date,
  targetDate: Date,
  natalPlanets: PlanetPosition[]
): ProgressedPlanet[] {
  const yearsDiff = (targetDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const speeds: Record<string, number> = {
    Sun: 1.0,
    Moon: 12.5,
    Mercury: 1.38,
    Venus: 1.2,
    Mars: 0.524
  };

  const targets = ["Sun", "Moon", "Mercury", "Venus", "Mars"];
  return targets.map(p => {
    const natal = natalPlanets.find(np => np.planet === p);
    const natalLon = natal ? natal.lon : 0;
    const speed = speeds[p] || 0;
    const progressedLon = (natalLon + speed * yearsDiff) % 360;
    
    return {
      planet: p,
      natalDegree: natalLon,
      progressedDegree: progressedLon,
      sign: getZodiacSign(Math.floor(progressedLon / 30) % 12),
      yearsFromBirth: parseFloat(yearsDiff.toFixed(2))
    };
  });
}

/**
 * Transit (현재 행성 위치 근사치) 계산
 */
export function calculateTransits(targetDate: Date): TransitPlanet[] {
  const diffMs = targetDate.getTime() - TRANSIT_EPOCH.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return Object.entries(TRANSIT_CONFIG).map(([planet, cfg]) => {
    const degree = (cfg.pos + cfg.speed * diffDays) % 360;
    const normalizedDegree = ((degree % 360) + 360) % 360;
    return {
      planet,
      degree: normalizedDegree,
      sign: getZodiacSign(Math.floor(normalizedDegree / 30) % 12),
      speed: cfg.speed
    };
  });
}

/**
 * Transit-to-Natal 어스펙트 감지
 */
export function calculateTransitAspects(
  transits: TransitPlanet[],
  natalPlanets: PlanetPosition[]
): TransitAspect[] {
  const aspects: TransitAspect[] = [];
  const rules = [
    { name: "conjunction", angle: 0, orb: 3 },
    { name: "opposition", angle: 180, orb: 3 },
    { name: "trine", angle: 120, orb: 2 },
    { name: "square", angle: 90, orb: 2 },
    { name: "sextile", angle: 60, orb: 1.5 }
  ];

  for (const t of transits) {
    for (const n of natalPlanets) {
      const diff = calculateAngleDifference(t.degree, n.lon);
      for (const rule of rules) {
        if (Math.abs(diff - rule.angle) <= rule.orb) {
          // Applying(접근) vs Separating(분리) 판별
          // 트랜짓 행성 이동 후 거리차 확인
          const nextTransitDeg = (t.degree + t.speed * 0.1) % 360;
          const nextDiff = calculateAngleDifference(nextTransitDeg, n.lon);
          const isApplying = Math.abs(nextDiff - rule.angle) < Math.abs(diff - rule.angle);

          aspects.push({
            transitPlanet: t.planet,
            natalPlanet: n.planet,
            aspect: rule.name,
            orb: parseFloat(Math.abs(diff - rule.angle).toFixed(2)),
            isApplying
          });
        }
      }
    }
  }
  return aspects;
}

// ══════════════════════════════════════════════════════
// B-266: Essential Dignity & Reception 계산
// ══════════════════════════════════════════════════════

export interface PlanetDignity {
  planet: string;
  sign: string;
  dignity: 'domicile' | 'exaltation' | 'detriment' | 'fall' | 'peregrine';
  score: number;          // +5 ~ -5
  triplicity: boolean;    // 삼주 해당 여부
  totalScore: number;     // dignity + triplicity 합산
  description: string;    // 한국어 1문장
}

export interface MutualReception {
  planet1: string;
  planet2: string;
  type: 'domicile' | 'mixed';
  description: string;
}

const DOMICILES: Record<string, string[]> = {
  Aries: ["Mars"],
  Taurus: ["Venus"],
  Gemini: ["Mercury"],
  Cancer: ["Moon"],
  Leo: ["Sun"],
  Virgo: ["Mercury"],
  Libra: ["Venus"],
  Scorpio: ["Mars", "Pluto"],
  Sagittarius: ["Jupiter"],
  Capricorn: ["Saturn"],
  Aquarius: ["Saturn", "Uranus"],
  Pisces: ["Jupiter", "Neptune"]
};

const EXALTATIONS: Record<string, { planet: string; degree?: number }> = {
  Aries: { planet: "Sun" },
  Taurus: { planet: "Moon" },
  Cancer: { planet: "Jupiter" },
  Virgo: { planet: "Mercury" },
  Libra: { planet: "Saturn" },
  Capricorn: { planet: "Mars" },
  Pisces: { planet: "Venus" }
};

const TRIPLICITY_MAP: Record<string, { day: string; night: string }> = {
  Fire: { day: "Sun", night: "Jupiter" },
  Earth: { day: "Venus", night: "Moon" },
  Air: { day: "Saturn", night: "Mercury" },
  Water: { day: "Mars", night: "Moon" }
};

const SIGN_ELEMENT: Record<string, string> = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water"
};

const OPPOSITE_SIGNS: Record<string, string> = {
  Aries: "Libra", Taurus: "Scorpio", Gemini: "Sagittarius",
  Cancer: "Capricorn", Leo: "Aquarius", Virgo: "Pisces",
  Libra: "Aries", Scorpio: "Taurus", Sagittarius: "Gemini",
  Capricorn: "Cancer", Aquarius: "Leo", Pisces: "Virgo"
};

/**
 * 행성별 본질적 위엄(Essential Dignity) 점수 산출
 */
export function calculateDignities(planets: PlanetPosition[]): PlanetDignity[] {
  // 낮/밤 구분 (단순화: 태양이 1~6하우스 영역에 있는지 등, 여기선 태양의 황경으로 추정)
  const sun = planets.find(p => p.planet === "Sun");
  const isDay = sun ? (sun.lon > 0 && sun.lon <= 180) : true;

  return planets.map(p => {
    let dignity: PlanetDignity['dignity'] = 'peregrine';
    let score = 0;

    // 1. Domicile (+5)
    if (DOMICILES[p.sign]?.includes(p.planet)) {
      dignity = 'domicile';
      score = 5;
    }
    // 2. Exaltation (+4)
    else if (EXALTATIONS[p.sign]?.planet === p.planet) {
      dignity = 'exaltation';
      score = 4;
    }
    // 3. Detriment (-5)
    else {
      const opposite = OPPOSITE_SIGNS[p.sign];
      if (DOMICILES[opposite]?.includes(p.planet)) {
        dignity = 'detriment';
        score = -5;
      }
      // 4. Fall (-4)
      else if (EXALTATIONS[opposite]?.planet === p.planet) {
        dignity = 'fall';
        score = -4;
      }
    }

    // 5. Triplicity (+3)
    const element = SIGN_ELEMENT[p.sign];
    const tri = TRIPLICITY_MAP[element];
    const hasTriplicity = tri ? (isDay ? tri.day === p.planet : tri.night === p.planet) : false;

    const totalScore = score + (hasTriplicity ? 3 : 0);

    const descMap = {
      domicile: "행성이 자신의 본거지에 머물러 가장 자연스럽고 강력한 힘을 발휘합니다.",
      exaltation: "매우 고양된 상태로, 자신의 장점이 극대화되어 발휘되는 명예로운 위치입니다.",
      detriment: "외부 환경과의 부조화로 인해 자신의 역량을 발휘하기 어렵고 힘이 왜곡될 수 있습니다.",
      fall: "심리적 위축이나 환경적 제약으로 인해 품위가 손상되고 기반이 약화된 상태입니다.",
      peregrine: "특별한 위엄을 갖추지 못해 주변의 영향에 쉽게 휩쓸리거나 타 행성의 도움이 필요합니다."
    };

    return {
      planet: p.planet,
      sign: p.sign,
      dignity,
      score,
      triplicity: hasTriplicity,
      totalScore,
      description: descMap[dignity]
    };
  });
}

/**
 * 상호 리셉션(Mutual Reception) 탐색
 */
export function findMutualReceptions(planets: PlanetPosition[]): MutualReception[] {
  const results: MutualReception[] = [];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];

      // A가 B의 집에 있고, B가 A의 집에 있는 경우 (Domicile)
      const p1InP2Home = DOMICILES[p1.sign]?.includes(p2.planet);
      const p2InP1Home = DOMICILES[p2.sign]?.includes(p1.planet);

      if (p1InP2Home && p2InP1Home) {
        results.push({
          planet1: p1.planet,
          planet2: p2.planet,
          type: 'domicile',
          description: `${p1.planet}와 ${p2.planet}가 서로의 본거지를 점유하며 강력한 상호 협력 체계를 구축합니다.`
        });
        continue;
      }

      // Mixed Reception (Domicile vs Exaltation)
      const p1InExaltP2 = EXALTATIONS[p1.sign]?.planet === p2.planet;
      const p2InExaltP1 = EXALTATIONS[p2.sign]?.planet === p1.planet;

      if ((p1InP2Home && p2InExaltP1) || (p2InP1Home && p1InExaltP2)) {
        results.push({
          planet1: p1.planet,
          planet2: p2.planet,
          type: 'mixed',
          description: `${p1.planet}와 ${p2.planet}가 서로의 품위를 지탱해주며 조건 없는 도움과 지지를 교환합니다.`
        });
      }
    }
  }

  return results;
}

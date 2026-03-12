/**
 * astrologyEngine.ts
 * Swiss Ephemeris (via astronomy-engine) 기반 행성 위치 & 트랜짓 계산 엔진
 * - 고정렬 Astronomy Engine 사용으로 정밀도 & 안정성 확보
 * - 어스펙트, 에센셜 디그니티, 트랜짓 분석 포함
 * - MC/IC/DESC 계산을 위한 Meeus 공식 적용
 */

import * as Astronomy from "npm:astronomy-engine";

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

const PLANETS_MAP: Record<string, Astronomy.Body> = {
  "태양": Astronomy.Body.Sun,
  "달": Astronomy.Body.Moon,
  "수성": Astronomy.Body.Mercury,
  "금성": Astronomy.Body.Venus,
  "화성": Astronomy.Body.Mars,
  "목성": Astronomy.Body.Jupiter,
  "토성": Astronomy.Body.Saturn,
  "천왕성": Astronomy.Body.Uranus,
  "해왕성": Astronomy.Body.Neptune,
  "명왕성": Astronomy.Body.Pluto,
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
  { name: "합(conjunction)", angle: 0, orb: 8, harmonious: true },
  { name: "육분(sextile)", angle: 60, orb: 5, harmonious: true },
  { name: "사각(square)", angle: 90, orb: 7, harmonious: false },
  { name: "삼합(trine)", angle: 120, orb: 8, harmonious: true },
  { name: "충(opposition)", angle: 180, orb: 8, harmonious: false },
  { name: "퀸컨스(quincunx)", angle: 150, orb: 3, harmonious: false },
];

function calculateAspects(positions: { planet: string; absoluteDegree: number }[]): Aspect[] {
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
          const m1 = PLANET_MEANINGS[p1] || { keyword: "영향" };
          const m2 = PLANET_MEANINGS[p2] || { keyword: "영향" };
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

function getHighPrecisionPositions(date: Date, observer: Astronomy.Observer) {
  const time = Astronomy.MakeTime(date);
  return PLANET_NAMES.map(name => {
    const body = PLANETS_MAP[name];
    try {
      // Equator 대신 GeoVector → Ecliptic 변환 시도
      const geoVec = Astronomy.GeoVector(body, time, true);
      const ecl = Astronomy.Ecliptic(geoVec);
      return { planet: name, longitude: ecl.elon };
    } catch (e) {
      // 폴백: EclipticLongitude 직접 계산
      const lon = Astronomy.EclipticLongitude(body, time);
      return { planet: name, longitude: lon };
    }
  });
}

/**
 * Manual Calculation of ASC, MC, IC, DESC
 * Formulas from Jean Meeus, Astronomical Algorithms
 */
function calculateHousesManual(date: Date, observer: Astronomy.Observer) {
  const time = Astronomy.MakeTime(date);
  const lst = Astronomy.SiderealTime(time) + (observer.longitude / 15.0);
  const ramc = ((lst % 24) * 15) % 360;
  const eps = 23.4392911; // J2000 Obliquity
  const phi = observer.latitude * Math.PI / 180;
  
  const ramcRad = ramc * Math.PI / 180;
  const epsRad = eps * Math.PI / 180;

  // Midheaven (MC): λ = atan(tan(α) / cos(ε))
  const mcRad = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(epsRad));
  let mcDeg = (mcRad * 180 / Math.PI + 360) % 360;

  // Ascendant (ASC): λ = atan(cos(α) / -(sin(ε)tan(φ) + cos(ε)sin(α)))
  const ascRad = Math.atan2(Math.cos(ramcRad), -(Math.sin(epsRad) * Math.tan(phi) + Math.cos(epsRad) * Math.sin(ramcRad)));
  let ascDeg = (ascRad * 180 / Math.PI + 360 + 90) % 360; 

  const icDeg = (mcDeg + 180) % 360;
  const descDeg = (ascDeg + 180) % 360;

  return { asc: ascDeg, mc: mcDeg, ic: icDeg, desc: descDeg };
}

// ═══════════════════════════════════════════════
// Public Interface
// ═══════════════════════════════════════════════

export interface ServerAstrologyResult {
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
  };
  major_aspects: string[];
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
  year: number, month: number, day: number, hour: number, minute: number = 0,
  latitude?: number, longitude?: number
): ServerAstrologyResult {
  const natalDate = new Date(Date.UTC(year, month - 1, day, hour - 9, minute));
  const lat = (latitude && latitude !== 0) ? latitude : 37.5665;
  const lon = (longitude && longitude !== 0) ? longitude : 126.9780;
  const observer = new Astronomy.Observer(lat, lon, 0);
  
  const rawPositions = getHighPrecisionPositions(natalDate, observer);
  const houseData = calculateHousesManual(natalDate, observer);
  console.log("🏠 houseData raw:", JSON.stringify({
    asc: houseData.asc,
    mc: houseData.mc,
    ic: houseData.ic,
    desc: houseData.desc,
    ascIsNaN: isNaN(houseData.asc),
    mcIsNaN: isNaN(houseData.mc),
    lst: Astronomy.SiderealTime(Astronomy.MakeTime(natalDate)),
    longitude: observer.longitude,
    latitude: observer.latitude,
  }));

  const risingSign = ZODIAC_SIGNS[Math.floor(houseData.asc / 30) % 12];
  const mcSign = ZODIAC_SIGNS[Math.floor(houseData.mc / 30) % 12];
  const icSign = ZODIAC_SIGNS[Math.floor(houseData.ic / 30) % 12];
  const descSign = ZODIAC_SIGNS[Math.floor(houseData.desc / 30) % 12];

  const planets = rawPositions.map((p) => {
    const lng = ((p.longitude % 360) + 360) % 360;
    const signIdx = Math.floor(lng / 30) % 12;
    const degree = Math.round((lng % 30) * 100) / 100;
    const sign = ZODIAC_SIGNS[signIdx];
    
    // Equal House approximation
    const house = ((signIdx - Math.floor(houseData.asc / 30) + 12) % 12) + 1;
    
    const dignity = getPlanetDignity(p.planet, signIdx);
    const meaning = PLANET_MEANINGS[p.planet] || { domain: "", keyword: "" };
    const signMeaning = SIGN_MEANINGS[sign]?.split(",")[0] || "";

    let dignityNote = "";
    if (dignity.includes("본좌")) dignityNote = " [본좌]";
    else if (dignity.includes("고양")) dignityNote = " [고양]";

    return {
      planet: p.planet, sign, signEnglish: ZODIAC_ENGLISH[signIdx],
      degree, absoluteDegree: lng, house, dignity,
      interpretation: `${p.planet}(${meaning.keyword}) ${sign} ${degree}° ${house}하우스${dignityNote} → ${meaning.domain}이 ${signMeaning}한 방식으로 표현.`,
    };
  });

  const aspectInput = rawPositions.map(p => ({
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

  const dominantElement = Object.entries(elements).sort((a, b) => b[1] - a[1])[0][0];
  const dominantQuality = Object.entries(qualities).sort((a, b) => b[1] - a[1])[0][0];

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

  const now = new Date();
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

    transits.push(`${sp} 트랜짓 ${currentSign}: ${meaning.domain} 영역에서 ${SIGN_MEANINGS[currentSign]?.split(",")[0]}한 에너지 작용.`);

    for (const natalP of aspectInput) {
      const nLng = ((natalP.absoluteDegree % 360) + 360) % 360;
      const diffFromNatal = (cLng - nLng + 360) % 360;

      for (const ta of TRANSIT_ASPECTS) {
        // 합/충은 한 방향, 나머지는 두 방향(예: 90도, 270도) 체크
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
    `달: ${moonSign}(${planets[1].degree}°)`,
    `상승궁: ${risingSign}`,
    `지배 원소: ${dominantElement} / 특질: ${dominantQuality}`,
    dignityReport.length > 0 ? `디그니티: ${dignityReport.join(", ")}` : "",
  ].filter(Boolean).join("\n");

  const majorAspectsStrings = aspects.map(a => a.interpretation);

  return {
    sunSign, moonSign, risingSign,
    planet_positions: planets,
    house_positions: {
      ASC: risingSign,
      MC: mcSign,
      IC: icSign,
      DESC: descSign,
      raw: [houseData.asc, houseData.mc, houseData.ic, houseData.desc],
    },
    major_aspects: majorAspectsStrings,
    planets, aspects, elements, qualities,
    dominantElement, dominantQuality,
    chartSummary, keyAspects: majorAspectsStrings, 
    dignityReport, transits,
  };
}

/**
 * Western Astrology 계산 엔진
 * Natal Chart 기반 행성, 하우스, 트랜짓 분석
 */

// 12 별자리 (Zodiac Signs)
export const ZODIAC_SIGNS = [
  "양자리", "황소자리", "쌍둥이자리", "게자리", "사자자리", "처녀자리",
  "천칭자리", "전갈자리", "사수자리", "염소자리", "물병자리", "물고기자리",
] as const;

export const ZODIAC_ENGLISH = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export type ZodiacSign = typeof ZODIAC_SIGNS[number];

// 행성
export const PLANETS = [
  "태양", "달", "수성", "금성", "화성", "목성", "토성", "천왕성", "해왕성", "명왕성",
] as const;

export const PLANET_ENGLISH = [
  "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
] as const;

export type Planet = typeof PLANETS[number];

// 원소
export type Element = "불" | "흙" | "공기" | "물";

// 특질
export type Quality = "활동궁" | "고정궁" | "변통궁";

// 별자리 → 원소
const SIGN_ELEMENT: Record<ZodiacSign, Element> = {
  양자리: "불", 사자자리: "불", 사수자리: "불",
  황소자리: "흙", 처녀자리: "흙", 염소자리: "흙",
  쌍둥이자리: "공기", 천칭자리: "공기", 물병자리: "공기",
  게자리: "물", 전갈자리: "물", 물고기자리: "물",
};

// 별자리 → 특질
const SIGN_QUALITY: Record<ZodiacSign, Quality> = {
  양자리: "활동궁", 게자리: "활동궁", 천칭자리: "활동궁", 염소자리: "활동궁",
  황소자리: "고정궁", 사자자리: "고정궁", 전갈자리: "고정궁", 물병자리: "고정궁",
  쌍둥이자리: "변통궁", 처녀자리: "변통궁", 사수자리: "변통궁", 물고기자리: "변통궁",
};

// 행성 해석
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

// 별자리별 해석
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

// 12하우스 의미
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

export interface PlanetPosition {
  planet: Planet;
  sign: ZodiacSign;
  signEnglish: string;
  degree: number;
  house: number;
  interpretation: string;
}

export interface AstrologyResult {
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  risingSign: ZodiacSign;
  planets: PlanetPosition[];
  elements: Record<Element, number>;
  qualities: Record<Quality, number>;
  dominantElement: Element;
  dominantQuality: Quality;
  chartSummary: string;
  keyAspects: string[];
}

/**
 * 태양 별자리 계산 (생년월일 기반)
 */
function calculateSunSign(month: number, day: number): number {
  const boundaries = [
    { month: 1, day: 20 }, { month: 2, day: 19 }, { month: 3, day: 20 },
    { month: 4, day: 20 }, { month: 5, day: 21 }, { month: 6, day: 21 },
    { month: 7, day: 22 }, { month: 8, day: 23 }, { month: 9, day: 23 },
    { month: 10, day: 23 }, { month: 11, day: 22 }, { month: 12, day: 22 },
  ];

  for (let i = 0; i < 12; i++) {
    const b = boundaries[i];
    if (month === b.month && day <= b.day) {
      return (i + 11) % 12; // 이전 별자리
    }
    if (month === b.month && day > b.day) {
      return i;
    }
  }
  return 0;
}

/**
 * 달 별자리 근사 계산 (Julian Day 기반)
 */
function calculateMoonSign(year: number, month: number, day: number): number {
  // 간소화된 달 위치 계산
  const jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day - 1524.5;
  const moonLongitude = (jd * 13.176396 + 64.975464) % 360;
  return Math.floor(moonLongitude / 30) % 12;
}

/**
 * 라이징 사인 근사 계산 (출생시간 기반)
 */
function calculateRisingSign(month: number, day: number, hour: number): number {
  // 간소화: 태양 별자리 + 시간 보정
  const sunIdx = calculateSunSign(month, day);
  const hourOffset = Math.floor(hour / 2);
  return (sunIdx + hourOffset) % 12;
}

/**
 * 행성 위치 근사 계산
 */
function calculatePlanetPositions(year: number, month: number, day: number, hour: number): PlanetPosition[] {
  const sunIdx = calculateSunSign(month, day);
  const moonIdx = calculateMoonSign(year, month, day);
  const risingIdx = calculateRisingSign(month, day, hour);

  // 행성 위치 근사 (실제로는 천문력 필요)
  const jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day;

  const positions: { planet: Planet; signIdx: number; degree: number }[] = [
    { planet: "태양", signIdx: sunIdx, degree: (day / 30) * 30 },
    { planet: "달", signIdx: moonIdx, degree: ((jd * 13.176) % 30) },
    { planet: "수성", signIdx: (sunIdx + Math.floor((jd * 4.09) % 3) - 1 + 12) % 12, degree: (jd * 4.09) % 30 },
    { planet: "금성", signIdx: (sunIdx + Math.floor((jd * 1.62) % 4) - 2 + 12) % 12, degree: (jd * 1.62) % 30 },
    { planet: "화성", signIdx: Math.floor((jd * 0.524) % 12), degree: (jd * 0.524) % 30 },
    { planet: "목성", signIdx: Math.floor((year - 2000) / 1 + 5) % 12, degree: ((year - 2000) * 30.35) % 30 },
    { planet: "토성", signIdx: Math.floor((year - 2000) / 2.5 + 5) % 12, degree: ((year - 2000) * 12.2) % 30 },
    { planet: "천왕성", signIdx: Math.floor((year - 2000) / 7 + 10) % 12, degree: ((year - 2000) * 4.3) % 30 },
    { planet: "해왕성", signIdx: Math.floor((year - 2000) / 14 + 10) % 12, degree: ((year - 2000) * 2.2) % 30 },
    { planet: "명왕성", signIdx: Math.floor((year - 2000) / 20 + 8) % 12, degree: ((year - 2000) * 1.5) % 30 },
  ];

  return positions.map((p, idx) => {
    const safeIdx = ((p.signIdx % 12) + 12) % 12;
    const sign = ZODIAC_SIGNS[safeIdx];
    const house = ((safeIdx - risingIdx + 12) % 12) + 1;
    const meaning = PLANET_MEANINGS[p.planet];
    const signMeaning = SIGN_MEANINGS[sign] || "다양한 특성";

    return {
      planet: p.planet,
      sign,
      signEnglish: ZODIAC_ENGLISH[safeIdx],
      degree: Math.round(p.degree * 100) / 100,
      house,
      interpretation: `${p.planet}(${meaning.keyword}) in ${sign} ${house}하우스 → ${meaning.domain}이 ${signMeaning.split(".")[0]}한 방식으로 표현됨.`,
    };
  });
}

/**
 * Natal Chart 계산
 */
export function calculateNatalChart(
  year: number,
  month: number,
  day: number,
  hour: number
): AstrologyResult {
  const sunIdx = calculateSunSign(month, day);
  const moonIdx = calculateMoonSign(year, month, day);
  const risingIdx = calculateRisingSign(month, day, hour);

  const planets = calculatePlanetPositions(year, month, day, hour);

  // 원소 분포
  const elements: Record<Element, number> = { 불: 0, 흙: 0, 공기: 0, 물: 0 };
  planets.forEach((p) => {
    elements[SIGN_ELEMENT[p.sign]]++;
  });

  // 특질 분포
  const qualities: Record<Quality, number> = { 활동궁: 0, 고정궁: 0, 변통궁: 0 };
  planets.forEach((p) => {
    qualities[SIGN_QUALITY[p.sign]]++;
  });

  // 지배 원소/특질
  const dominantElement = (Object.entries(elements) as [Element, number][])
    .sort((a, b) => b[1] - a[1])[0][0];
  const dominantQuality = (Object.entries(qualities) as [Quality, number][])
    .sort((a, b) => b[1] - a[1])[0][0];

  const sunSign = ZODIAC_SIGNS[sunIdx];
  const moonSign = ZODIAC_SIGNS[moonIdx];
  const risingSign = ZODIAC_SIGNS[risingIdx];

  // 차트 요약
  const chartSummary = [
    `태양: ${sunSign} → ${SIGN_MEANINGS[sunSign].split(".")[0]}`,
    `달: ${moonSign} → 감정이 ${SIGN_MEANINGS[moonSign].split(",")[0]}`,
    `상승궁: ${risingSign} → 첫인상이 ${SIGN_MEANINGS[risingSign].split(",")[0]}`,
    `지배 원소: ${dominantElement} / 지배 특질: ${dominantQuality}`,
  ].join("\n");

  // 주요 상(Aspects) 근사
  const keyAspects: string[] = [];

  // 태양-달 관계
  const sunMoonDiff = Math.abs(sunIdx - moonIdx);
  if (sunMoonDiff === 0) keyAspects.push("태양-달 합(conjunction): 의지와 감정이 일치. 강한 자기 확신.");
  else if (sunMoonDiff === 6) keyAspects.push("태양-달 충(opposition): 의지와 감정이 갈등. 내적 긴장.");
  else if (sunMoonDiff === 4 || sunMoonDiff === 8) keyAspects.push("태양-달 삼합(trine): 의지와 감정이 조화. 자연스러운 흐름.");
  else if (sunMoonDiff === 3 || sunMoonDiff === 9) keyAspects.push("태양-달 사각(square): 의지와 감정 사이 도전. 성장의 기회.");

  // 금성-화성 관계
  const venusIdx = planets.find((p) => p.planet === "금성")!;
  const marsIdx = planets.find((p) => p.planet === "화성")!;
  const vmIdx = ZODIAC_SIGNS.indexOf(venusIdx.sign);
  const mmIdx = ZODIAC_SIGNS.indexOf(marsIdx.sign);
  const vmDiff = Math.abs(vmIdx - mmIdx);
  if (vmDiff === 0) keyAspects.push("금성-화성 합: 사랑과 열정이 강하게 결합. 매력적.");
  else if (vmDiff === 6) keyAspects.push("금성-화성 충: 사랑과 욕망의 갈등. 격렬한 감정.");

  // 목성 하우스
  const jupiterHouse = planets.find((p) => p.planet === "목성")!.house;
  keyAspects.push(`목성 ${jupiterHouse}하우스: ${HOUSE_MEANINGS[jupiterHouse - 1].split(":")[1].trim()} 영역에서 확장과 행운.`);

  // 토성 하우스
  const saturnHouse = planets.find((p) => p.planet === "토성")!.house;
  keyAspects.push(`토성 ${saturnHouse}하우스: ${HOUSE_MEANINGS[saturnHouse - 1].split(":")[1].trim()} 영역에서 시련과 성장.`);

  return {
    sunSign, moonSign, risingSign,
    planets, elements, qualities,
    dominantElement, dominantQuality,
    chartSummary, keyAspects,
  };
}

/**
 * 질문 유형별 점성술 핵심 분석
 */
export function getAstrologyForQuestion(
  astro: AstrologyResult,
  questionType: "love" | "career" | "money" | "general"
): string {
  const venus = astro.planets.find((p) => p.planet === "금성")!;
  const mars = astro.planets.find((p) => p.planet === "화성")!;
  const jupiter = astro.planets.find((p) => p.planet === "목성")!;
  const saturn = astro.planets.find((p) => p.planet === "토성")!;
  const moon = astro.planets.find((p) => p.planet === "달")!;

  switch (questionType) {
    case "love":
      return `금성 ${venus.sign} ${venus.house}하우스: 사랑의 스타일이 ${SIGN_MEANINGS[venus.sign].split(",")[0]}. 달 ${moon.sign}: 감정 표현이 ${SIGN_MEANINGS[moon.sign].split(",")[0]}.`;
    case "career":
      return `토성 ${saturn.sign} ${saturn.house}하우스: 커리어에서 ${SIGN_MEANINGS[saturn.sign].split(",")[0]}한 도전. 화성 ${mars.sign}: ${SIGN_MEANINGS[mars.sign].split(",")[0]}한 방식으로 행동.`;
    case "money":
      return `목성 ${jupiter.sign} ${jupiter.house}하우스: 재물 확장이 ${SIGN_MEANINGS[jupiter.sign].split(",")[0]}한 영역에서. 금성 ${venus.sign}: 가치관이 ${SIGN_MEANINGS[venus.sign].split(",")[0]}.`;
    default:
      return astro.chartSummary;
  }
}

/**
 * 현재 트랜짓 분석 (간소화)
 */
export function getCurrentTransits(natal: AstrologyResult): string[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const currentSunIdx = calculateSunSign(currentMonth, currentDay);
  const currentSunSign = ZODIAC_SIGNS[currentSunIdx];

  const transits: string[] = [];

  // 현재 태양 위치와 natal 차트 비교
  const natalSunIdx = ZODIAC_SIGNS.indexOf(natal.sunSign);
  const sunTransitDiff = Math.abs(currentSunIdx - natalSunIdx);
  if (sunTransitDiff === 0) {
    transits.push("☀️ 현재 태양이 출생 태양 위치 → 생일 시즌! 새로운 한 해의 에너지가 시작됩니다.");
  }

  // 목성 트랜짓 (대략적)
  const jupiterIdx = Math.floor((currentYear - 2000) / 1 + 5) % 12;
  const jupiterSign = ZODIAC_SIGNS[jupiterIdx];
  transits.push(`♃ 목성 트랜짓 ${jupiterSign}: 이 영역에서 확장과 기회의 에너지.`);

  // 토성 트랜짓
  const saturnIdx = Math.floor((currentYear - 2000) / 2.5 + 5) % 12;
  const saturnSign = ZODIAC_SIGNS[saturnIdx];
  transits.push(`♄ 토성 트랜짓 ${saturnSign}: 이 영역에서 시련과 구조화의 에너지.`);

  return transits;
}

import { solarToLunar as solarToLunarCore } from "./lunarConverter.ts";

/**
 * lib/dataTransform.ts
 * - Phase 6-1: Extract constants from integratedReadingEngine.ts
 * - Phase 6-2: Extract transform functions from integratedReadingEngine.ts
 */

export interface LunarResult {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  is_leap_month: boolean;
  is_leap_month_adjusted: boolean;
}

export const CITY_COORDINATES: Record<string, [number, number]> = {
  "서울": [37.5665, 126.978], "Seoul": [37.5665, 126.978], "seoul": [37.5665, 126.978],
  "부산": [35.1796, 129.0756], "Busan": [35.1796, 129.0756],
  "대구": [35.8714, 128.6014], "Daegu": [35.8714, 128.6014],
  "인천": [37.4563, 126.7052], "Incheon": [37.4563, 126.7052],
  "광주": [35.1595, 126.8526], "Gwangju": [35.1595, 126.8526],
  "대전": [36.3504, 127.3845], "Daejeon": [36.3504, 127.3845],
  "울산": [35.5384, 129.3114], "Ulsan": [35.5384, 129.3114],
  "수원": [37.2636, 127.0286], "Suwon": [37.2636, 127.0286],
  "성남": [37.4449, 127.1388], "Seongnam": [37.4449, 127.1388],
  "도쿄": [35.6762, 139.6503], "Tokyo": [35.6762, 139.6503],
  "뉴욕": [40.7128, -74.0060], "New York": [40.7128, -74.0060],
  "런던": [51.5074, -0.1278], "London": [51.5074, -0.1278],
  "파리": [48.8566, 2.3522], "Paris": [48.8566, 2.3522],
};

export const SOLAR_TERMS_KR = [
  "입춘", "경칩", "청명", "입하", "망종", "소서",
  "입추", "백로", "한로", "입동", "대설", "소한"
];

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

export const TOPIC_MAPPING: Record<string, string[]> = {
  "relationship": ["relationship_union", "emotional_connection", "mutual_relationship", "partnership", "relationship_start", "emotional_opening", "marriage", "연애", "사랑", "인연", "궁합"],
  "reconciliation": ["endings", "transformation", "recovery", "patience", "introspection", "재회", "이별", "그리움"],
  "finance": ["abundance", "financial_stability", "financial_adjustment", "financial_struggle", "wealth", "finance", "재물", "금전", "투자", "수익"],
  "career": ["victory", "authority", "leadership", "structure", "initiative", "skill_use", "manifestation", "control", "planning", "career", "business", "직장", "성공", "명예"],
  "self_growth": ["intuition", "inner_guidance", "wisdom", "introspection", "healing", "renewal", "transformation", "hope", "self_growth", "study", "성장", "공부", "시험"],
  "life_direction": ["sudden_change", "collapse", "endings", "life_reset", "life_transition", "cycle_change", "uncertainty", "movement", "timing_event", "방향", "인생", "운세"],
  "health": ["healing", "recovery", "vitality", "inner_balance", "hope", "renewal", "emotional_healing", "stability", "rest", "건강", "치료", "회복", "몸", "심리"]
};

export const CATEGORY_KOREAN: Record<string, string> = {
  "relationship": "연애/궁합",
  "reconciliation": "재회/인연",
  "finance": "재물/금전",
  "career": "학업/커리어",
  "self_growth": "자아/성장",
  "life_direction": "인생의 방향",
  "health": "건강/심리",
  "general_future": "종합 운세"
};

export const TOPIC_PATTERNS: Record<string, Record<string, string[]>> = {
  finance: {
    saju: ["재성", "식상", "재물"],
    ziwei: ["재백궁"],
    astrology: ["2하우스", "목성"],
    tarot: ["Ace of Pentacles", "Ten of Pentacles", "Nine of Pentacles"]
  },
  career: {
    saju: ["관성", "편관", "정관"],
    ziwei: ["관록궁"],
    astrology: ["10하우스", "토성"],
    tarot: ["The Emperor", "Eight of Pentacles", "Three of Pentacles"]
  },
  love: {
    saju: ["재성", "정재", "관성"],
    ziwei: ["부처궁", "자녀궁"],
    astrology: ["7하우스", "금성"],
    tarot: ["The Lovers", "Two of Cups", "Ace of Cups"]
  },
  health: {
    saju: ["식신", "상관", "水", "木"],
    ziwei: ["질액궁"],
    astrology: ["6하우스", "화성"],
    tarot: ["The Star", "Temperance", "Four of Swords"]
  },
  family: {
    saju: ["인성", "편인", "정인"],
    ziwei: ["부모궁", "형제궁", "자녀궁"],
    astrology: ["4하우스", "달"],
    tarot: ["The Empress", "Ten of Cups", "Six of Cups"]
  },
  change: {
    saju: ["편관", "충", "파"],
    ziwei: ["파군", "칠살"],
    astrology: ["천왕성", "명왕성", "트랜짓"],
    tarot: ["The Tower", "Death", "Wheel of Fortune"]
  }
};

export const SYMBOLIC_MEANINGS: Record<string, string> = {
  "Solar_Ming": "명궁 주성 태양(太陽): 박애주의, 공명정대, 리더십, 외부로 발산하는 에너지. 타인을 위해 빛을 비추나 정작 자신은 고독할 수 있음.",
  "Jupiter_Cancer": "목성 게자리 트랜짓: 정서적 풍요, 가족·내부 공동체와의 결속 강화, 정서적 안정 기반의 확장운.",
  "Saturn_Aries": "토성 양자리 진입: 새로운 질서의 수립, 성급함에 대한 경고, 인내를 통한 구조적 개혁 필요성.",
  "Metal_Keum": "금(金) 기운: 결단력, 의리, 숙살지기(정리하는 힘). 부족 시 맺고 끊음이 약해질 수 있음.",
  "Water_Su": "수(水) 기운: 유연함, 지혜, 침투력. 과다 시 생각이 깊어 정체될 수 있고, 부족 시 융통성이 부족해짐."
};

/**
 * 프론트에서 전달받은 점성술 데이터를 엔진 내부 포맷으로 변환
 */
export function transformAstrologyData(frontAstro: any): any {
  if (!frontAstro) return generateFallbackAstrology();

  const planets = frontAstro?.planets ?? [];
  const planet_positions = (planets ?? []).map((p: any) => ({
    planet: p?.name || p?.planet,
    sign: p?.sign,
    house: p?.house,
    degree: p?.degree,
    dignity: p?.dignity || "없음",
    interpretation: p?.interpretation || ""
  }));

  const characteristics: string[] = [];
  
  if (frontAstro?.transits) {
    (frontAstro?.transits ?? []).forEach((t: any) => {
      if (t?.planet && t?.sign) {
        characteristics.push(`${t.planet} Transit`);
      }
      if (t?.aspectAlerts) {
        (t?.aspectAlerts ?? []).forEach((alert: string) => characteristics.push(alert));
      }
    });
  }

  if (frontAstro?.keyAspects) {
    (frontAstro?.keyAspects ?? []).forEach((aspect: string) => characteristics.push(aspect));
  } else if (frontAstro?.aspects) {
    (frontAstro?.aspects ?? []).slice(0, 5).forEach((a: any) => {
      const label = `${a?.planet1} ${a?.type} ${a?.planet2}`;
      characteristics.push(label);
    });
  }

  if (frontAstro?.dignityReport) {
    (frontAstro?.dignityReport ?? []).forEach((d: any) => {
      if (d?.dignity === "본좌" || d?.dignity === "고양") {
        characteristics.push(`${d.planet} ${d.dignity}`);
      }
    });
  }

  if (frontAstro?.dominantElement) {
    characteristics.push(`${frontAstro?.dominantElement} element dominant`);
  }

  return {
    system: "astrology",
    characteristics,
    planet_positions,
    house_positions: frontAstro?.housePositions || {
      ASC: frontAstro?.risingSign || "Unknown",
      MC: "Unknown",
      IC: "Unknown",
      DESC: "Unknown"
    },
    major_aspects: (frontAstro?.keyAspects || []).slice(0, 5),
    sunSign: frontAstro?.sunSign,
    moonSign: frontAstro?.moonSign,
    risingSign: frontAstro?.risingSign,
    elementDistribution: frontAstro?.elementDistribution || {},
    qualityDistribution: frontAstro?.qualityDistribution || {},
    questionAnalysis: frontAstro?.questionAnalysis || null,
    transits: frontAstro?.transits || [],
    progression: frontAstro?.progression || frontAstro?.secondaryProgression || null,
    solarReturn: frontAstro?.solarReturn || frontAstro?.solar_return || null
  };
}

/**
 * 프론트에서 전달받은 자미두수 데이터를 엔진 내부 포맷으로 변환
 */
export function transformZiweiData(frontZiwei: any): any {
  if (!frontZiwei) return generateFallbackZiwei();

  const palaces = (frontZiwei?.palaces ?? []).map((p: any) => ({
    name: p?.name,
    main_stars: p?.main_stars || p?.mainStars || (p?.stars ? (p?.stars ?? []).map((s: any) => s?.star) : []),
    location: p?.branch || p?.location || ""
  }));

  const characteristics: string[] = [];

  (palaces ?? []).forEach((p: any) => {
    if (p?.main_stars && (p.main_stars ?? []).length > 0) {
      (p.main_stars ?? []).forEach((star: string) => {
        if (["파군", "자미", "천부", "칠살", "무곡", "태양", "천기", "염정"].includes(star)) {
          characteristics.push(star);
        }
      });
    }
  });

  if (frontZiwei?.fourTransformations || frontZiwei?.siHwa) {
    const ft = frontZiwei?.fourTransformations || frontZiwei?.siHwa;
    if (ft?.rok || ft?.화록) characteristics.push("화록 active");
    if (ft?.gwon || ft?.화권) characteristics.push("화권 active");
    if (ft?.gwa || ft?.화과) characteristics.push("화과 active");
    if (ft?.gi || ft?.화기) characteristics.push("화기 active");
  }

  const mingGong = (palaces ?? []).find((p: any) => p?.name === "명궁");
  if (mingGong && (mingGong?.main_stars ?? []).length > 0) {
    characteristics.push("Main star active");
  }

  const caiBai = (palaces ?? []).find((p: any) => p?.name === "재백궁" || p?.name === "재帛궁");
  if (caiBai && (caiBai?.main_stars ?? []).length > 0) {
    characteristics.push("Financial palace growth");
  }

  return {
    system: "ziwei",
    characteristics,
    palaces,
    mingGong: frontZiwei?.mingGong || "Unknown",
    bureau: frontZiwei?.bureau || "Unknown",
    four_transformations: frontZiwei?.fourTransformations || frontZiwei?.siHwa || frontZiwei?.natalTransformations || {},
    currentMajorPeriod: frontZiwei?.currentMajorPeriod || null,
    currentMinorPeriod: frontZiwei?.currentMinorPeriod || null,
    questionAnalysis: frontZiwei?.questionAnalysis || null
  };
}

/** 점성술 데이터 미전달 시 안전한 fallback */
export function generateFallbackAstrology() {
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
export function generateFallbackZiwei() {
  return {
    system: "ziwei",
    characteristics: [],
    palaces: [],
    four_transformations: {}
  };
}

export const getPillarFromData = (data: any, row: number) => {
  if (!data || !data[row]) return "";
  return (data[row][1] || "") + (data[row][2] || "");
};

export const getDayMasterFromData = (data: any) => {
  if (!data || !data[1]) return "Unknown";
  return data[1][1] || "Unknown";
};

export const getYongShinFromData = (data: any, type: 'yong' | 'hee') => {
  if (!data) return "Unknown";
  if (Array.isArray(data)) {
    const row = type === 'yong' ? 0 : 1;
    if (data[row] && Array.isArray(data[row])) {
      return data[row].find((v: any) => v && typeof v === 'string' && v.length === 1) || "Unknown";
    }
    return "Unknown";
  }
  return data[type] || "Unknown";
};

export function convertLunarToSolar(solarYear: number, solarMonth: number, solarDay: number): LunarResult {
  const result = solarToLunarCore(solarYear, solarMonth, solarDay);
  return {
    lunarYear: result.year,
    lunarMonth: result.month,
    lunarDay: result.day,
    is_leap_month: result.isLeapMonth,
    is_leap_month_adjusted: false
  };
}

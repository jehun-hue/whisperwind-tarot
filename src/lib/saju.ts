/**
 * 사주(四柱) 계산 엔진
 * 만세력 기반 천간지지 계산, 오행 분포, 십성, 신강약 판단
 */

// 천간 (Heavenly Stems)
export const CHEONGAN = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;
export const CHEONGAN_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;

// 지지 (Earthly Branches)
export const JIJI = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const;
export const JIJI_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

// 오행 (Five Elements)
export type FiveElement = "목" | "화" | "토" | "금" | "수";

// 천간 → 오행 매핑
const CHEONGAN_ELEMENT: Record<string, FiveElement> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};

// 천간 → 음양
const CHEONGAN_YINYANG: Record<string, "양" | "음"> = {
  갑: "양", 을: "음", 병: "양", 정: "음", 무: "양",
  기: "음", 경: "양", 신: "음", 임: "양", 계: "음",
};

// 지지 → 오행
const JIJI_ELEMENT: Record<string, FiveElement> = {
  자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화",
  오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수",
};

// 지지 → 지장간 (Hidden Stems)
const JIJANGGAN: Record<string, string[]> = {
  자: ["계"], 축: ["기", "계", "신"], 인: ["갑", "병", "무"],
  묘: ["을"], 진: ["무", "을", "계"], 사: ["병", "경", "무"],
  오: ["정", "기"], 미: ["기", "정", "을"], 신: ["경", "임", "무"],
  유: ["신"], 술: ["무", "신", "정"], 해: ["임", "갑"],
};

// 십성 관계 (Ten Gods) - 일간 기준
const SIPSUNG_TABLE: Record<string, Record<string, string>> = {
  // 같은 오행
  same_yang: "비견", same_yin: "겁재",
  // 내가 생하는 오행
  produce_yang: "식신", produce_yin: "상관",
  // 나를 극하는 오행
  control_yang: "편관", control_yin: "정관",
  // 내가 극하는 오행
  overcome_yang: "편재", overcome_yin: "정재",
  // 나를 생하는 오행
  support_yang: "편인", support_yin: "정인",
} as any;

// 오행 상생 관계
const PRODUCES: Record<FiveElement, FiveElement> = {
  목: "화", 화: "토", 토: "금", 금: "수", 수: "목",
};

// 오행 상극 관계
const OVERCOMES: Record<FiveElement, FiveElement> = {
  목: "토", 화: "금", 토: "수", 금: "목", 수: "화",
};

// 월령 계절 오행
const MONTH_SEASON_ELEMENT: Record<number, FiveElement> = {
  1: "목", 2: "목", 3: "토", 4: "화", 5: "화", 6: "토",
  7: "금", 8: "금", 9: "토", 10: "수", 11: "수", 12: "토",
};

export interface SajuPillar {
  cheongan: string;
  jiji: string;
  cheonganElement: FiveElement;
  jijiElement: FiveElement;
}

export interface SajuResult {
  yearPillar: SajuPillar;
  monthPillar: SajuPillar;
  dayPillar: SajuPillar;
  hourPillar: SajuPillar;
  ilgan: string; // 일간 (Day Master)
  ilganElement: FiveElement;
  ilganYinyang: "양" | "음";
  strength: "신강" | "중화" | "신약";
  fiveElementDist: Record<FiveElement, number>;
  sipsung: Record<string, string>; // 각 기둥의 십성
  yongsin: FiveElement; // 용신 (Useful God)
  description: string;
}

/**
 * 양력 날짜로부터 사주팔자 계산
 */
export function calculateSaju(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  birthHour: number // 0-23
): SajuResult {
  // 연주 (Year Pillar)
  const yearGanIdx = (birthYear - 4) % 10;
  const yearJiIdx = (birthYear - 4) % 12;
  const yearGan = CHEONGAN[yearGanIdx >= 0 ? yearGanIdx : yearGanIdx + 10];
  const yearJi = JIJI[yearJiIdx >= 0 ? yearJiIdx : yearJiIdx + 12];

  // 월주 (Month Pillar) - 인월(寅月) 시작 기준
  const adjustedMonth = birthMonth >= 2 ? birthMonth - 1 : birthMonth + 11;
  const monthJiIdx = (adjustedMonth + 1) % 12; // 인=2부터 시작
  const monthJi = JIJI[monthJiIdx];
  // 월간 = 연간 × 2 + 월지인덱스 보정
  const monthGanBase = (yearGanIdx % 5) * 2;
  const monthGanIdx = (monthGanBase + adjustedMonth) % 10;
  const monthGan = CHEONGAN[monthGanIdx];

  // 일주 (Day Pillar) - 간지 순환 60일
  const baseDate = new Date(1900, 0, 1);
  const targetDate = new Date(birthYear, birthMonth - 1, birthDay);
  const dayDiff = Math.floor((targetDate.getTime() - baseDate.getTime()) / 86400000);
  // 1900-01-01 = 경자일(庚子日) → 간지번호 36
  const dayGanIdx = (dayDiff + 6) % 10; // 경=6
  const dayJiIdx = (dayDiff + 0) % 12;  // 자=0
  const dayGan = CHEONGAN[dayGanIdx >= 0 ? dayGanIdx : dayGanIdx + 10];
  const dayJi = JIJI[dayJiIdx >= 0 ? dayJiIdx : dayJiIdx + 12];

  // 시주 (Hour Pillar)
  const hourJiIdx = Math.floor((birthHour + 1) / 2) % 12;
  const hourJi = JIJI[hourJiIdx];
  const hourGanBase = (dayGanIdx % 5) * 2;
  const hourGanIdx = (hourGanBase + hourJiIdx) % 10;
  const hourGan = CHEONGAN[hourGanIdx];

  const makePillar = (gan: string, ji: string): SajuPillar => ({
    cheongan: gan,
    jiji: ji,
    cheonganElement: CHEONGAN_ELEMENT[gan],
    jijiElement: JIJI_ELEMENT[ji],
  });

  const yearPillar = makePillar(yearGan, yearJi);
  const monthPillar = makePillar(monthGan, monthJi);
  const dayPillar = makePillar(dayGan, dayJi);
  const hourPillar = makePillar(hourGan, hourJi);

  const ilgan = dayGan;
  const ilganElement = CHEONGAN_ELEMENT[ilgan];
  const ilganYinyang = CHEONGAN_YINYANG[ilgan];

  // 오행 분포 계산
  const allElements = [
    yearPillar.cheonganElement, yearPillar.jijiElement,
    monthPillar.cheonganElement, monthPillar.jijiElement,
    dayPillar.cheonganElement, dayPillar.jijiElement,
    hourPillar.cheonganElement, hourPillar.jijiElement,
  ];
  const fiveElementDist: Record<FiveElement, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  allElements.forEach((e) => fiveElementDist[e]++);

  // 지장간 포함 확장 분포
  [yearJi, monthJi, dayJi, hourJi].forEach((ji) => {
    JIJANGGAN[ji]?.forEach((gan) => {
      fiveElementDist[CHEONGAN_ELEMENT[gan]] += 0.3;
    });
  });

  // 신강/신약 판단
  const monthElement = MONTH_SEASON_ELEMENT[birthMonth];
  const sameElementCount = fiveElementDist[ilganElement];
  const supportElement = Object.entries(PRODUCES).find(([, v]) => v === ilganElement)?.[0] as FiveElement | undefined;
  const supportCount = supportElement ? fiveElementDist[supportElement] : 0;
  const strengthScore = sameElementCount + supportCount;

  let strength: "신강" | "중화" | "신약";
  if (monthElement === ilganElement || (supportElement && monthElement === supportElement)) {
    strength = strengthScore >= 4 ? "신강" : strengthScore >= 2.5 ? "중화" : "신약";
  } else {
    strength = strengthScore >= 5 ? "신강" : strengthScore >= 3 ? "중화" : "신약";
  }

  // 용신 판단
  let yongsin: FiveElement;
  if (strength === "신강") {
    // 신강이면 나를 극하거나 내가 극하는 오행이 용신
    yongsin = OVERCOMES[ilganElement]; // 내가 극하는 것 = 재성
  } else if (strength === "신약") {
    // 신약이면 나를 생하거나 같은 오행이 용신
    yongsin = supportElement || ilganElement;
  } else {
    yongsin = ilganElement; // 중화면 일간 자체
  }

  // 십성 계산
  const getSipsung = (targetElement: FiveElement, targetYinyang: "양" | "음"): string => {
    if (targetElement === ilganElement) {
      return targetYinyang === ilganYinyang ? "비견" : "겁재";
    }
    if (PRODUCES[ilganElement] === targetElement) {
      return targetYinyang === ilganYinyang ? "식신" : "상관";
    }
    if (OVERCOMES[ilganElement] === targetElement) {
      return targetYinyang === ilganYinyang ? "편재" : "정재";
    }
    if (OVERCOMES[targetElement] === ilganElement) {
      return targetYinyang === ilganYinyang ? "편관" : "정관";
    }
    if (PRODUCES[targetElement] === ilganElement) {
      return targetYinyang === ilganYinyang ? "편인" : "정인";
    }
    return "비견";
  };

  const sipsung: Record<string, string> = {
    연간: getSipsung(yearPillar.cheonganElement, CHEONGAN_YINYANG[yearGan]),
    연지: getSipsung(yearPillar.jijiElement, hourJiIdx % 2 === 0 ? "양" : "음"),
    월간: getSipsung(monthPillar.cheonganElement, CHEONGAN_YINYANG[monthGan]),
    월지: getSipsung(monthPillar.jijiElement, monthJiIdx % 2 === 0 ? "양" : "음"),
    시간: getSipsung(hourPillar.cheonganElement, CHEONGAN_YINYANG[hourGan]),
    시지: getSipsung(hourPillar.jijiElement, hourJiIdx % 2 === 0 ? "양" : "음"),
  };

  // 십성 분포 분석
  const sipsungValues = Object.values(sipsung);
  const hasGwansung = sipsungValues.some((s) => s.includes("관"));
  const hasJaesung = sipsungValues.some((s) => s.includes("재"));
  const hasSiksang = sipsungValues.some((s) => s === "식신" || s === "상관");
  const hasInsung = sipsungValues.some((s) => s.includes("인"));

  let description = `일간 ${ilgan}${CHEONGAN_ELEMENT[ilgan]}(${ilganYinyang}) / ${strength}`;
  if (strength === "신강") {
    description += " → 에너지가 넘치므로 활동, 도전, 발산이 유리합니다.";
  } else if (strength === "신약") {
    description += " → 에너지가 부족하므로 도움, 협력, 내실 다지기가 중요합니다.";
  } else {
    description += " → 균형 잡힌 사주로 유연한 대응이 가능합니다.";
  }

  return {
    yearPillar, monthPillar, dayPillar, hourPillar,
    ilgan, ilganElement, ilganYinyang, strength,
    fiveElementDist, sipsung, yongsin, description,
  };
}

/**
 * 사주와 타로 교차 해석을 위한 키워드 생성
 */
export function getSajuTarotCrossKeywords(saju: SajuResult, tarotSuits: string[]): string[] {
  const keywords: string[] = [];

  // 사주 강약 + 슈트 조합
  if (saju.strength === "신약" && tarotSuits.includes("Wands")) {
    keywords.push("신약+완드: 실행력 부족 주의, 준비 후 행동");
  }
  if (saju.strength === "신강" && tarotSuits.includes("Wands")) {
    keywords.push("신강+완드: 강한 추진력, 실행 가능");
  }
  if (tarotSuits.includes("Cups") && saju.fiveElementDist["수"] >= 2) {
    keywords.push("컵+수 과다: 감정 과잉 경향, 객관적 판단 필요");
  }
  if (tarotSuits.includes("Swords") && saju.fiveElementDist["금"] >= 2) {
    keywords.push("검+금 강: 판단력 강하지만 과도한 냉정함 주의");
  }
  if (tarotSuits.includes("Pentacles") && saju.fiveElementDist["토"] >= 2) {
    keywords.push("펜타클+토 강: 안정 지향, 실질적 성과 가능");
  }

  // 용신 기반 조언
  keywords.push(`용신: ${saju.yongsin} → ${saju.yongsin} 에너지 강화 필요`);

  return keywords;
}

/**
 * 질문 유형별 사주 핵심 분석
 */
export function getSajuForQuestion(
  saju: SajuResult,
  questionType: "love" | "career" | "money" | "general"
): string {
  const { sipsung, strength, ilganElement, fiveElementDist } = saju;
  const sipsungValues = Object.values(sipsung);

  switch (questionType) {
    case "love": {
      const hasGwan = sipsungValues.some((s) => s.includes("관"));
      const hasJae = sipsungValues.some((s) => s.includes("재"));
      if (hasGwan && hasJae) return "관성+재성 동시 존재 → 인연이 들어올 구조. 단, 타이밍과 선택이 중요.";
      if (hasGwan) return "관성 존재 → 인연 에너지 있음. 감정보다 현실 조건 확인 필요.";
      if (hasJae) return "재성 존재 → 매력 발산 가능. 다만 감정 깊이 부족할 수 있음.";
      return "관성/재성 부재 → 지금은 인연보다 자기 성장에 집중하는 시기.";
    }
    case "career": {
      const hasGwan = sipsungValues.some((s) => s.includes("관"));
      const hasSik = sipsungValues.some((s) => s === "식신" || s === "상관");
      if (hasGwan && strength === "신강") return "관성+신강 → 조직 내 승진, 리더십 발휘에 유리한 구조.";
      if (hasSik) return "식상 존재 → 창의적 일, 프리랜서, 사업에 적합한 에너지.";
      return "현재 사주 구조상 안정적 기반 다지기가 우선. 급격한 변화보다 점진적 이동 권장.";
    }
    case "money": {
      const hasJae = sipsungValues.some((s) => s.includes("재"));
      if (hasJae && strength === "신강") return "재성+신강 → 재물 획득 능력 강함. 적극적 투자 가능.";
      if (hasJae && strength === "신약") return "재성 있으나 신약 → 돈이 들어와도 유지 어려움. 관리 우선.";
      return "재성 부재 → 직접적 재물운보다 기술/능력으로 간접 수입 구조가 유리.";
    }
    default:
      return `${strength} 사주 / 일간 ${ilganElement} → ${strength === "신강" ? "적극적 행동이 유리" : strength === "신약" ? "내실 다지기가 핵심" : "균형 잡힌 운영 가능"}.`;
  }
}

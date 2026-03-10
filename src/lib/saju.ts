/**
 * 사주(四柱) 계산 엔진 - 고급 버전
 * 만세력 기반 천간지지 계산, 오행 분포, 십성, 신강약, 대운/세운, 신살, 합충형파해
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

// 지지 → 음양
const JIJI_YINYANG: Record<string, "양" | "음"> = {
  자: "양", 축: "음", 인: "양", 묘: "음", 진: "양", 사: "음",
  오: "양", 미: "음", 신: "양", 유: "음", 술: "양", 해: "음",
};

// 지지 → 지장간 (Hidden Stems)
const JIJANGGAN: Record<string, string[]> = {
  자: ["계"], 축: ["기", "계", "신"], 인: ["갑", "병", "무"],
  묘: ["을"], 진: ["무", "을", "계"], 사: ["병", "경", "무"],
  오: ["정", "기"], 미: ["기", "정", "을"], 신: ["경", "임", "무"],
  유: ["신"], 술: ["무", "신", "정"], 해: ["임", "갑"],
};

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

// ========== 지지 합충형파해 ==========

// 육합 (Six Harmonies)
const YUKHAP: [string, string, FiveElement][] = [
  ["자", "축", "토"], ["인", "해", "목"], ["묘", "술", "화"],
  ["진", "유", "금"], ["사", "신", "수"], ["오", "미", "화"],
];

// 삼합 (Three Harmonies)
const SAMHAP: [string, string, string, FiveElement][] = [
  ["인", "오", "술", "화"], ["사", "유", "축", "금"],
  ["신", "자", "진", "수"], ["해", "묘", "미", "목"],
];

// 방합 (Directional Harmonies)
const BANGHAP: [string, string, string, FiveElement][] = [
  ["인", "묘", "진", "목"], ["사", "오", "미", "화"],
  ["신", "유", "술", "금"], ["해", "자", "축", "수"],
];

// 충 (Clashes)
const CHUNG: [string, string][] = [
  ["자", "오"], ["축", "미"], ["인", "신"], ["묘", "유"], ["진", "술"], ["사", "해"],
];

// 형 (Punishments)
const HYUNG: [string, string][] = [
  ["인", "사"], ["사", "신"], ["인", "신"], // 삼형
  ["축", "술"], ["술", "미"], ["축", "미"], // 삼형
  ["자", "묘"], // 무례지형
  ["진", "진"], ["오", "오"], ["유", "유"], ["해", "해"], // 자형
];

// 파 (Breaks)
const PA: [string, string][] = [
  ["자", "유"], ["축", "진"], ["인", "해"], ["묘", "오"],
  ["사", "신"], ["미", "술"],
];

// 해 (Harms)
const HAE: [string, string][] = [
  ["자", "미"], ["축", "오"], ["인", "사"], ["묘", "진"],
  ["신", "해"], ["유", "술"],
];

export interface JijiInteraction {
  type: "육합" | "삼합" | "방합" | "충" | "형" | "파" | "해";
  branches: string[];
  result?: string;
  description: string;
}

// ========== 신살 (Spirit Stars) ==========
export interface Sinsal {
  name: string;
  description: string;
  isPositive: boolean;
}

// 도화살 (Peach Blossom) - 일지 기준
function getDohwa(dayBranch: string): string | null {
  const map: Record<string, string> = {
    인: "묘", 오: "묘", 술: "묘",
    사: "오", 유: "오", 축: "오",
    신: "유", 자: "유", 진: "유",
    해: "자", 묘: "자", 미: "자",
  };
  return map[dayBranch] || null;
}

// 역마살 (Traveling Horse) - 일지 기준
function getYeokma(dayBranch: string): string | null {
  const map: Record<string, string> = {
    인: "신", 오: "신", 술: "신",
    사: "해", 유: "해", 축: "해",
    신: "인", 자: "인", 진: "인",
    해: "사", 묘: "사", 미: "사",
  };
  return map[dayBranch] || null;
}

// 화개살 (Literary Star)
function getHwagae(dayBranch: string): string | null {
  const map: Record<string, string> = {
    인: "술", 오: "술", 술: "술",
    사: "축", 유: "축", 축: "축",
    신: "진", 자: "진", 진: "진",
    해: "미", 묘: "미", 미: "미",
  };
  return map[dayBranch] || null;
}

// ========== 십이운성 (Twelve Life Stages) ==========
const TWELVE_STAGES = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"] as const;
export type TwelveStage = typeof TWELVE_STAGES[number];

// 일간별 십이운성 시작 지지
const TWELVE_STAGE_START: Record<string, number> = {
  갑: 10, // 해에서 장생
  을: 4,  // 오에서 장생 (역순)
  병: 2,  // 인에서 장생
  정: 8,  // 유에서 장생 (역순)
  무: 2,  // 인에서 장생
  기: 8,  // 유에서 장생 (역순)
  경: 5,  // 사에서 장생
  신: 0,  // 자에서 장생 (역순)
  임: 8,  // 신에서 장생
  계: 3,  // 묘에서 장생 (역순)
};

function getTwelveStage(ilgan: string, branch: string): TwelveStage {
  const branchIdx = JIJI.indexOf(branch as any);
  const startIdx = TWELVE_STAGE_START[ilgan] ?? 0;
  const isYin = CHEONGAN_YINYANG[ilgan] === "음";
  let stageIdx: number;
  if (isYin) {
    stageIdx = ((startIdx - branchIdx + 12) % 12);
  } else {
    stageIdx = ((branchIdx - startIdx + 12) % 12);
  }
  return TWELVE_STAGES[stageIdx];
}

// ========== 격국 (Life Pattern) ==========
export type Gyeokguk = string;

function determineGyeokguk(ilgan: string, monthGan: string, monthJi: string, strength: string): Gyeokguk {
  const ilganEl = CHEONGAN_ELEMENT[ilgan];
  const monthGanEl = CHEONGAN_ELEMENT[monthGan];
  const ilganYY = CHEONGAN_YINYANG[ilgan];
  const monthGanYY = CHEONGAN_YINYANG[monthGan];

  // 십성 기반 격국 판단
  if (monthGanEl === ilganEl) {
    return monthGanYY === ilganYY ? "비견격" : "겁재격";
  }
  if (PRODUCES[ilganEl] === monthGanEl) {
    return monthGanYY === ilganYY ? "식신격" : "상관격";
  }
  if (OVERCOMES[ilganEl] === monthGanEl) {
    return monthGanYY === ilganYY ? "편재격" : "정재격";
  }
  if (OVERCOMES[monthGanEl] === ilganEl) {
    return monthGanYY === ilganYY ? "편관격" : "정관격";
  }
  if (PRODUCES[monthGanEl] === ilganEl) {
    return monthGanYY === ilganYY ? "편인격" : "정인격";
  }
  return "잡기격";
}

// ========== 대운/세운 ==========
export interface DaeunPeriod {
  startAge: number;
  endAge: number;
  cheongan: string;
  jiji: string;
  element: FiveElement;
  description: string;
}

function calculateDaeun(
  yearGanIdx: number, monthGanIdx: number, monthJiIdx: number,
  gender: "male" | "female", birthYear: number
): DaeunPeriod[] {
  const yearYinyang = CHEONGAN_YINYANG[CHEONGAN[yearGanIdx >= 0 ? yearGanIdx : yearGanIdx + 10]];
  // 순행: 양남음녀, 역행: 음남양녀
  const isForward = (yearYinyang === "양" && gender === "male") || (yearYinyang === "음" && gender === "female");

  const periods: DaeunPeriod[] = [];
  for (let i = 1; i <= 8; i++) {
    let ganIdx: number, jiIdx: number;
    if (isForward) {
      ganIdx = (monthGanIdx + i) % 10;
      jiIdx = (monthJiIdx + i) % 12;
    } else {
      ganIdx = ((monthGanIdx - i) % 10 + 10) % 10;
      jiIdx = ((monthJiIdx - i) % 12 + 12) % 12;
    }
    const gan = CHEONGAN[ganIdx];
    const ji = JIJI[jiIdx];
    const startAge = i * 10 - 7; // approximate
    const endAge = startAge + 9;
    const el = CHEONGAN_ELEMENT[gan];

    periods.push({
      startAge, endAge,
      cheongan: gan, jiji: ji,
      element: el,
      description: `${gan}${ji}(${el}) 대운: ${startAge}~${endAge}세`,
    });
  }
  return periods;
}

function getCurrentDaeun(daeun: DaeunPeriod[], age: number): DaeunPeriod | null {
  return daeun.find(d => age >= d.startAge && age <= d.endAge) || null;
}

export interface SewunInfo {
  year: number;
  cheongan: string;
  jiji: string;
  element: FiveElement;
  description: string;
}

function calculateSewun(targetYear: number): SewunInfo {
  const ganIdx = ((targetYear - 4) % 10 + 10) % 10;
  const jiIdx = ((targetYear - 4) % 12 + 12) % 12;
  const gan = CHEONGAN[ganIdx];
  const ji = JIJI[jiIdx];
  return {
    year: targetYear,
    cheongan: gan, jiji: ji,
    element: CHEONGAN_ELEMENT[gan],
    description: `${targetYear}년 ${gan}${ji}(${CHEONGAN_ELEMENT[gan]})`,
  };
}

// ========== Main Types ==========
export interface SajuPillar {
  cheongan: string;
  jiji: string;
  cheonganElement: FiveElement;
  jijiElement: FiveElement;
  twelveStage?: TwelveStage;
}

export interface SajuResult {
  yearPillar: SajuPillar;
  monthPillar: SajuPillar;
  dayPillar: SajuPillar;
  hourPillar: SajuPillar;
  ilgan: string;
  ilganElement: FiveElement;
  ilganYinyang: "양" | "음";
  strength: "신강" | "중화" | "신약";
  fiveElementDist: Record<FiveElement, number>;
  sipsung: Record<string, string>;
  yongsin: FiveElement;
  gyeokguk: Gyeokguk;
  jijiInteractions: JijiInteraction[];
  sinsal: Sinsal[];
  daeun: DaeunPeriod[];
  currentDaeun: DaeunPeriod | null;
  sewun: SewunInfo;
  twelveStages: Record<string, TwelveStage>;
  description: string;
}

// ========== 지지 합충형파해 검사 ==========
function findJijiInteractions(branches: string[]): JijiInteraction[] {
  const results: JijiInteraction[] = [];

  // 육합
  for (const [a, b, el] of YUKHAP) {
    if (branches.includes(a) && branches.includes(b)) {
      results.push({ type: "육합", branches: [a, b], result: el, description: `${a}${b} 육합(${el}) → 조화와 결합의 에너지` });
    }
  }
  // 삼합
  for (const [a, b, c, el] of SAMHAP) {
    const count = [a, b, c].filter(x => branches.includes(x)).length;
    if (count >= 2) {
      const present = [a, b, c].filter(x => branches.includes(x));
      results.push({ type: "삼합", branches: present, result: el, description: `${present.join("")} 삼합(${el}) → 강한 ${el} 에너지 결집` });
    }
  }
  // 방합
  for (const [a, b, c, el] of BANGHAP) {
    const count = [a, b, c].filter(x => branches.includes(x)).length;
    if (count >= 2) {
      const present = [a, b, c].filter(x => branches.includes(x));
      results.push({ type: "방합", branches: present, result: el, description: `${present.join("")} 방합(${el}) → ${el} 방위 에너지 강화` });
    }
  }
  // 충
  for (const [a, b] of CHUNG) {
    if (branches.includes(a) && branches.includes(b)) {
      results.push({ type: "충", branches: [a, b], description: `${a}${b} 충 → 갈등, 변동, 이동의 에너지` });
    }
  }
  // 형
  for (const [a, b] of HYUNG) {
    if (a === b) {
      if (branches.filter(x => x === a).length >= 2) {
        results.push({ type: "형", branches: [a, a], description: `${a}${a} 자형 → 자기 파괴적 경향` });
      }
    } else if (branches.includes(a) && branches.includes(b)) {
      results.push({ type: "형", branches: [a, b], description: `${a}${b} 형 → 갈등, 법적 문제, 건강 주의` });
    }
  }
  // 파
  for (const [a, b] of PA) {
    if (branches.includes(a) && branches.includes(b)) {
      results.push({ type: "파", branches: [a, b], description: `${a}${b} 파 → 파괴, 깨짐, 소멸의 기운` });
    }
  }
  // 해
  for (const [a, b] of HAE) {
    if (branches.includes(a) && branches.includes(b)) {
      results.push({ type: "해", branches: [a, b], description: `${a}${b} 해 → 해침, 배신, 손해의 기운` });
    }
  }

  // Remove duplicates
  const seen = new Set<string>();
  return results.filter(r => {
    const key = `${r.type}-${r.branches.sort().join("")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ========== 신살 검사 ==========
function findSinsal(branches: string[], dayBranch: string): Sinsal[] {
  const results: Sinsal[] = [];

  const dohwa = getDohwa(dayBranch);
  if (dohwa && branches.includes(dohwa)) {
    results.push({ name: "도화살", description: "매력, 인기, 이성운이 강하나 감정적 갈등 가능", isPositive: true });
  }

  const yeokma = getYeokma(dayBranch);
  if (yeokma && branches.includes(yeokma)) {
    results.push({ name: "역마살", description: "이동, 변화, 해외운이 강함. 바쁜 삶", isPositive: true });
  }

  const hwagae = getHwagae(dayBranch);
  if (hwagae && branches.includes(hwagae)) {
    results.push({ name: "화개살", description: "학문, 예술, 종교적 감수성이 뛰어남. 고독한 면", isPositive: true });
  }

  // 백호살 (White Tiger) - 간소화
  const baekho: Record<string, string> = {
    갑: "진", 을: "사", 병: "오", 정: "미", 무: "신",
    기: "유", 경: "술", 신: "해", 임: "자", 계: "축",
  };
  // Not using dayBranch here, but we check year branch for simplicity

  // 괴강살 - 일주가 무진, 임진, 경술, 경진
  return results;
}

// ========== Main Calculation ==========
export function calculateSaju(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  birthHour: number,
  birthMinute: number = 0,
  gender: "male" | "female" = "male"
): SajuResult {
  // 연주 (Year Pillar)
  const yearGanIdx = ((birthYear - 4) % 10 + 10) % 10;
  const yearJiIdx = ((birthYear - 4) % 12 + 12) % 12;
  const yearGan = CHEONGAN[yearGanIdx];
  const yearJi = JIJI[yearJiIdx];

  // 월주 (Month Pillar)
  const adjustedMonth = birthMonth >= 2 ? birthMonth - 1 : birthMonth + 11;
  const monthJiIdx = (adjustedMonth + 1) % 12;
  const monthJi = JIJI[monthJiIdx];
  const monthGanBase = (yearGanIdx % 5) * 2;
  const monthGanIdx = (monthGanBase + adjustedMonth) % 10;
  const monthGan = CHEONGAN[monthGanIdx];

  // 일주 (Day Pillar)
  const baseDate = new Date(1900, 0, 1);
  const targetDate = new Date(birthYear, birthMonth - 1, birthDay);
  const dayDiff = Math.floor((targetDate.getTime() - baseDate.getTime()) / 86400000);
  const dayGanIdx = ((dayDiff + 6) % 10 + 10) % 10;
  const dayJiIdx = ((dayDiff + 0) % 12 + 12) % 12;
  const dayGan = CHEONGAN[dayGanIdx];
  const dayJi = JIJI[dayJiIdx];

  // 시주 (Hour Pillar)
  const hourJiIdx = Math.floor((birthHour + birthMinute / 60 + 1) / 2) % 12;
  const hourJi = JIJI[hourJiIdx];
  const hourGanBase = (dayGanIdx % 5) * 2;
  const hourGanIdx = (hourGanBase + hourJiIdx) % 10;
  const hourGan = CHEONGAN[hourGanIdx];

  const makePillar = (gan: string, ji: string): SajuPillar => ({
    cheongan: gan,
    jiji: ji,
    cheonganElement: CHEONGAN_ELEMENT[gan],
    jijiElement: JIJI_ELEMENT[ji],
    twelveStage: getTwelveStage(dayGan, ji),
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
    yongsin = OVERCOMES[ilganElement];
  } else if (strength === "신약") {
    yongsin = supportElement || ilganElement;
  } else {
    yongsin = ilganElement;
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
    연지: getSipsung(yearPillar.jijiElement, JIJI_YINYANG[yearJi]),
    월간: getSipsung(monthPillar.cheonganElement, CHEONGAN_YINYANG[monthGan]),
    월지: getSipsung(monthPillar.jijiElement, JIJI_YINYANG[monthJi]),
    시간: getSipsung(hourPillar.cheonganElement, CHEONGAN_YINYANG[hourGan]),
    시지: getSipsung(hourPillar.jijiElement, JIJI_YINYANG[hourJi]),
  };

  // 격국
  const gyeokguk = determineGyeokguk(ilgan, monthGan, monthJi, strength);

  // 지지 합충형파해
  const allBranches = [yearJi, monthJi, dayJi, hourJi];
  const jijiInteractions = findJijiInteractions(allBranches);

  // 신살
  const sinsal = findSinsal(allBranches, dayJi);

  // 십이운성
  const twelveStages: Record<string, TwelveStage> = {
    연지: getTwelveStage(ilgan, yearJi),
    월지: getTwelveStage(ilgan, monthJi),
    일지: getTwelveStage(ilgan, dayJi),
    시지: getTwelveStage(ilgan, hourJi),
  };

  // 대운
  const daeun = calculateDaeun(yearGanIdx, monthGanIdx, monthJiIdx, gender, birthYear);
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear + 1; // Korean age approximation
  const currentDaeun = getCurrentDaeun(daeun, age);

  // 세운
  const sewun = calculateSewun(currentYear);

  // Description
  let description = `일간 ${ilgan}${CHEONGAN_ELEMENT[ilgan]}(${ilganYinyang}) / ${strength} / ${gyeokguk}`;
  if (currentDaeun) {
    description += ` / 현재 대운: ${currentDaeun.cheongan}${currentDaeun.jiji}(${currentDaeun.element})`;
  }
  description += ` / ${sewun.description}`;

  if (jijiInteractions.length > 0) {
    description += ` / 지지관계: ${jijiInteractions.map(j => `${j.type}(${j.branches.join("")})`).join(", ")}`;
  }
  if (sinsal.length > 0) {
    description += ` / 신살: ${sinsal.map(s => s.name).join(", ")}`;
  }

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
    fiveElementDist, sipsung, yongsin, gyeokguk,
    jijiInteractions, sinsal, daeun, currentDaeun, sewun,
    twelveStages, description,
  };
}

/**
 * 사주와 타로 교차 해석을 위한 키워드 생성
 */
export function getSajuTarotCrossKeywords(saju: SajuResult, tarotSuits: string[]): string[] {
  const keywords: string[] = [];

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

  // 합충형파해 + 타로 연계
  if (saju.jijiInteractions.some(j => j.type === "충")) {
    keywords.push("사주 충 존재 → 갈등/변화 에너지가 타로 결과에 영향");
  }
  if (saju.jijiInteractions.some(j => j.type === "삼합" || j.type === "육합")) {
    keywords.push("사주 합 존재 → 조화/결합 에너지가 타로 결과를 강화");
  }

  // 신살 + 타로
  if (saju.sinsal.some(s => s.name === "도화살")) {
    keywords.push("도화살 → 연애/관계 에너지 활성화, 감정 카드 강조");
  }
  if (saju.sinsal.some(s => s.name === "역마살")) {
    keywords.push("역마살 → 이동/변화 에너지, 소드/완드 카드 강조");
  }

  keywords.push(`용신: ${saju.yongsin} → ${saju.yongsin} 에너지 강화 필요`);
  keywords.push(`격국: ${saju.gyeokguk} → 인생 패턴 참고`);

  return keywords;
}

/**
 * 질문 유형별 사주 핵심 분석
 */
export function getSajuForQuestion(
  saju: SajuResult,
  questionType: "love" | "career" | "money" | "general"
): string {
  const { sipsung, strength, ilganElement, gyeokguk, jijiInteractions, sinsal, currentDaeun, sewun, twelveStages } = saju;
  const sipsungValues = Object.values(sipsung);

  const hasChung = jijiInteractions.some(j => j.type === "충");
  const hasHap = jijiInteractions.some(j => j.type === "육합" || j.type === "삼합");
  const hasDohwa = sinsal.some(s => s.name === "도화살");

  let base = "";

  switch (questionType) {
    case "love": {
      const hasGwan = sipsungValues.some((s) => s.includes("관"));
      const hasJae = sipsungValues.some((s) => s.includes("재"));
      if (hasGwan && hasJae) base = "관성+재성 동시 존재 → 인연이 들어올 구조. 단, 타이밍과 선택이 중요.";
      else if (hasGwan) base = "관성 존재 → 인연 에너지 있음. 감정보다 현실 조건 확인 필요.";
      else if (hasJae) base = "재성 존재 → 매력 발산 가능. 다만 감정 깊이 부족할 수 있음.";
      else base = "관성/재성 부재 → 지금은 인연보다 자기 성장에 집중하는 시기.";

      if (hasDohwa) base += " 도화살 활성 → 이성 인연 활발하나 감정 관리 필요.";
      if (hasChung) base += " 지지 충 → 관계에 변동/갈등 에너지 존재.";
      if (hasHap) base += " 지지 합 → 결합/안정 에너지 유리.";
      break;
    }
    case "career": {
      const hasGwan = sipsungValues.some((s) => s.includes("관"));
      const hasSik = sipsungValues.some((s) => s === "식신" || s === "상관");
      if (hasGwan && strength === "신강") base = "관성+신강 → 조직 내 승진, 리더십 발휘에 유리한 구조.";
      else if (hasSik) base = "식상 존재 → 창의적 일, 프리랜서, 사업에 적합한 에너지.";
      else base = "현재 사주 구조상 안정적 기반 다지기가 우선. 급격한 변화보다 점진적 이동 권장.";

      base += ` 격국(${gyeokguk})에 따른 적성 방향 참고.`;
      if (sinsal.some(s => s.name === "역마살")) base += " 역마살 → 이동/출장/해외 관련 직업 적합.";
      break;
    }
    case "money": {
      const hasJae = sipsungValues.some((s) => s.includes("재"));
      if (hasJae && strength === "신강") base = "재성+신강 → 재물 획득 능력 강함. 적극적 투자 가능.";
      else if (hasJae && strength === "신약") base = "재성 있으나 신약 → 돈이 들어와도 유지 어려움. 관리 우선.";
      else base = "재성 부재 → 직접적 재물운보다 기술/능력으로 간접 수입 구조가 유리.";
      break;
    }
    default:
      base = `${strength} 사주 / 일간 ${ilganElement} / ${gyeokguk} → ${strength === "신강" ? "적극적 행동이 유리" : strength === "신약" ? "내실 다지기가 핵심" : "균형 잡힌 운영 가능"}.`;
  }

  // 대운/세운 추가
  if (currentDaeun) {
    base += ` 현재 대운 ${currentDaeun.cheongan}${currentDaeun.jiji}(${currentDaeun.element}).`;
  }
  base += ` ${sewun.description}.`;

  // 십이운성 정보
  const dayStage = twelveStages["일지"];
  if (dayStage) {
    const stageDesc: Record<string, string> = {
      장생: "새로운 시작의 에너지", 목욕: "정화와 변화", 관대: "성장과 확장",
      건록: "안정과 실력 발휘", 제왕: "절정의 에너지", 쇠: "전환기",
      병: "에너지 하락", 사: "정지와 성찰", 묘: "잠복과 준비",
      절: "단절과 새 시작", 태: "잉태와 가능성", 양: "성장의 시작",
    };
    base += ` 일지 십이운성 '${dayStage}'(${stageDesc[dayStage] || ""}).`;
  }

  return base;
}

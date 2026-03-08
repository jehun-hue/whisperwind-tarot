/**
 * 자미두수(紫微斗數) 명반 계산 엔진
 * 출생정보 기반 명반 생성 및 궁위별 분석
 */

// 12궁위 (Twelve Palaces)
export const PALACES = [
  "명궁", "형제궁", "부처궁", "자녀궁", "재백궁", "질액궁",
  "천이궁", "노복궁", "관록궁", "전택궁", "복덕궁", "부모궁",
] as const;

export type PalaceName = typeof PALACES[number];

// 14 주성 (Major Stars)
export const MAJOR_STARS = [
  "자미", "천기", "태양", "무곡", "천동", "염정",
  "천부", "태음", "탐랑", "거문", "천상", "천량",
  "칠살", "파군",
] as const;

export type MajorStar = typeof MAJOR_STARS[number];

// 별의 밝기 등급
export type StarBrightness = "묘" | "왕" | "득지" | "평화" | "함지" | "낙함";

// 오행국 (Five Element Bureau)
export type Bureau = "수이국" | "목삼국" | "금사국" | "토오국" | "화육국";

export interface StarPlacement {
  star: MajorStar;
  palace: PalaceName;
  brightness: StarBrightness;
  description: string;
}

export interface PalaceInfo {
  name: PalaceName;
  branch: string; // 지지
  stars: StarPlacement[];
  interpretation: string;
}

export interface ZiWeiResult {
  mingGong: string; // 명궁 지지
  shenGong: string; // 신궁 지지
  bureau: Bureau;
  palaces: PalaceInfo[];
  lifeStructure: string;
  keyInsights: string[];
}

// 지지 순서
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

// 명궁 계산: 출생월 + 출생시 기반
function calculateMingGong(lunarMonth: number, birthHourBranch: number): number {
  // 명궁 = 인(2) + 월 - 시 (12로 나머지)
  const mingIdx = (2 + lunarMonth - 1 - birthHourBranch + 24) % 12;
  return mingIdx;
}

// 신궁 계산
function calculateShenGong(lunarMonth: number, birthHourBranch: number): number {
  const shenIdx = (2 + lunarMonth - 1 + birthHourBranch) % 12;
  return shenIdx;
}

// 오행국 결정
function determineBureau(mingGongIdx: number, yearGanIdx: number): Bureau {
  // 납음오행 기반 간소화된 결정
  const combo = (yearGanIdx + mingGongIdx) % 5;
  const bureaus: Bureau[] = ["수이국", "목삼국", "금사국", "토오국", "화육국"];
  return bureaus[combo];
}

// 자미성 위치 계산 (간소화)
function calculateZiWeiPosition(lunarDay: number, bureau: Bureau): number {
  const bureauNum: Record<Bureau, number> = {
    수이국: 2, 목삼국: 3, 금사국: 4, 토오국: 5, 화육국: 6,
  };
  const num = bureauNum[bureau];
  // 간소화된 자미성 위치 = 일수를 국수로 나눈 몫 기반
  const pos = Math.ceil(lunarDay / num) % 12;
  return pos;
}

// 14주성 배치 (자미성 위치 기준)
function placeMajorStars(ziWeiPos: number): Map<number, MajorStar[]> {
  const placements = new Map<number, MajorStar[]>();

  // 자미계 (자미 기준 고정 간격)
  const ziWeiGroup: [MajorStar, number][] = [
    ["자미", 0], ["천기", -1], ["태양", -2], ["무곡", -3],
    ["천동", -4], ["염정", -6],
  ];

  // 천부계 (천부 = 자미 대칭)
  const tianFuPos = (12 - ziWeiPos + 4) % 12; // 간소화된 천부 위치
  const tianFuGroup: [MajorStar, number][] = [
    ["천부", 0], ["태음", 1], ["탐랑", 2], ["거문", 3],
    ["천상", 4], ["천량", 5], ["칠살", 6], ["파군", 8],
  ];

  ziWeiGroup.forEach(([star, offset]) => {
    const pos = ((ziWeiPos + offset) % 12 + 12) % 12;
    if (!placements.has(pos)) placements.set(pos, []);
    placements.get(pos)!.push(star);
  });

  tianFuGroup.forEach(([star, offset]) => {
    const pos = ((tianFuPos + offset) % 12 + 12) % 12;
    if (!placements.has(pos)) placements.set(pos, []);
    placements.get(pos)!.push(star);
  });

  return placements;
}

// 별 밝기 판단 (간소화)
function getStarBrightness(star: MajorStar, palaceIdx: number): StarBrightness {
  // 간소화된 밝기 판단 - 각 별의 최적 위치
  const optimalPositions: Partial<Record<MajorStar, number[]>> = {
    자미: [1, 4, 6, 7],
    천기: [2, 5, 8],
    태양: [2, 3, 4, 5],
    무곡: [0, 1, 6, 7],
    천동: [2, 5, 8, 11],
    염정: [2, 5, 8],
    천부: [1, 4, 6, 7, 10],
    태음: [8, 9, 10, 11],
    탐랑: [2, 5, 8, 11],
    거문: [0, 3, 6, 9],
    천상: [1, 4, 7, 10],
    천량: [0, 2, 5, 8],
    칠살: [2, 5, 8, 11],
    파군: [0, 3, 6, 9],
  };

  const worstPositions: Partial<Record<MajorStar, number[]>> = {
    자미: [3, 9],
    태양: [8, 9, 10, 11],
    태음: [2, 3, 4, 5],
    천동: [0, 6],
  };

  if (optimalPositions[star]?.includes(palaceIdx)) {
    return Math.random() > 0.5 ? "묘" : "왕";
  }
  if (worstPositions[star]?.includes(palaceIdx)) {
    return Math.random() > 0.5 ? "함지" : "낙함";
  }
  return Math.random() > 0.5 ? "득지" : "평화";
}

// 별의 기본 해석
const STAR_MEANINGS: Record<MajorStar, { positive: string; negative: string; domain: string }> = {
  자미: { positive: "리더십, 존귀, 중심, 결정권", negative: "독단, 고집, 외로움", domain: "인생 전반의 격과 위치" },
  천기: { positive: "지혜, 전략, 계획, 학문", negative: "우유부단, 신경질, 체력약", domain: "사고방식과 지적 능력" },
  태양: { positive: "광명, 활력, 남성, 공적 활동", negative: "과로, 소모, 눈 건강", domain: "사회활동과 명예" },
  무곡: { positive: "재물, 실행, 결단, 군인기질", negative: "고독, 강경, 감정부족", domain: "재물과 실행력" },
  천동: { positive: "복록, 편안, 예술, 아이", negative: "게으름, 우유부단, 의존", domain: "복과 감수성" },
  염정: { positive: "열정, 매력, 예술, 연애", negative: "집착, 시비, 형벌, 사고", domain: "감정과 열정" },
  천부: { positive: "재고, 안정, 보수, 관리", negative: "보수적, 소심, 변화거부", domain: "재산 보존과 관리" },
  태음: { positive: "부동산, 모성, 직관, 깔끔", negative: "우울, 과민, 폐쇄적", domain: "부동산과 내면세계" },
  탐랑: { positive: "다재다능, 매력, 사교, 창의", negative: "탐욕, 색정, 집착, 도박", domain: "욕망과 재능" },
  거문: { positive: "언변, 분석, 법률, 교육", negative: "시비, 구설, 의심, 소송", domain: "말과 분석력" },
  천상: { positive: "보좌, 조화, 인쇄, 문서", negative: "수동적, 우유부단", domain: "문서와 조화" },
  천량: { positive: "장수, 지혜, 종교, 의약", negative: "고독, 고집, 종교편향", domain: "수명과 지혜" },
  칠살: { positive: "결단, 용맹, 개혁, 독립", negative: "충동, 파괴, 고독, 재난", domain: "결단과 변혁" },
  파군: { positive: "개척, 변화, 파괴후재건", negative: "파괴, 불안정, 방탕", domain: "파괴와 재건" },
};

// 궁위별 해석 생성
function interpretPalace(palace: PalaceName, stars: StarPlacement[]): string {
  if (stars.length === 0) return `${palace}에 주성이 없어 타 궁의 영향을 크게 받습니다.`;

  const mainStar = stars[0];
  const meaning = STAR_MEANINGS[mainStar.star];
  const isBright = mainStar.brightness === "묘" || mainStar.brightness === "왕";

  const palaceContext: Record<PalaceName, string> = {
    명궁: "성격과 인생 전반의 방향",
    형제궁: "형제자매 및 가까운 동료",
    부처궁: "배우자와 연애 관계",
    자녀궁: "자녀와 후계",
    재백궁: "재물 운용과 수입",
    질액궁: "건강과 질병",
    천이궁: "이동, 여행, 외부 활동",
    노복궁: "부하, 직원, 팔로워",
    관록궁: "직업과 사업",
    전택궁: "부동산과 가산",
    복덕궁: "정신적 만족과 취미",
    부모궁: "부모와 상사",
  };

  const context = palaceContext[palace];
  if (isBright) {
    return `${palace}(${context})에 ${mainStar.star}(${mainStar.brightness}) → ${meaning.positive}. ${meaning.domain}에서 강한 에너지.`;
  } else if (mainStar.brightness === "함지" || mainStar.brightness === "낙함") {
    return `${palace}(${context})에 ${mainStar.star}(${mainStar.brightness}) → ${meaning.negative} 경향. ${meaning.domain}에서 주의 필요.`;
  }
  return `${palace}(${context})에 ${mainStar.star}(${mainStar.brightness}) → ${meaning.positive}과 ${meaning.negative} 혼재. 환경에 따라 변동.`;
}

/**
 * 자미두수 명반 계산
 */
export function calculateZiWei(
  birthYear: number,
  lunarMonth: number,
  lunarDay: number,
  birthHour: number, // 0-23
  gender: "male" | "female"
): ZiWeiResult {
  const yearGanIdx = (birthYear - 4) % 10;
  const birthHourBranch = Math.floor((birthHour + 1) / 2) % 12;

  // 명궁, 신궁 계산
  const mingGongIdx = calculateMingGong(lunarMonth, birthHourBranch);
  const shenGongIdx = calculateShenGong(lunarMonth, birthHourBranch);

  // 오행국
  const bureau = determineBureau(mingGongIdx, yearGanIdx);

  // 자미성 위치
  const ziWeiPos = calculateZiWeiPosition(lunarDay, bureau);

  // 14주성 배치
  const starMap = placeMajorStars(ziWeiPos);

  // 12궁 구성
  const palaces: PalaceInfo[] = PALACES.map((name, idx) => {
    const palaceIdx = (mingGongIdx + idx) % 12;
    const starsInPalace = starMap.get(palaceIdx) || [];
    const starPlacements: StarPlacement[] = starsInPalace.map((star) => ({
      star,
      palace: name,
      brightness: getStarBrightness(star, palaceIdx),
      description: STAR_MEANINGS[star].positive,
    }));

    return {
      name,
      branch: BRANCHES[palaceIdx],
      stars: starPlacements,
      interpretation: interpretPalace(name, starPlacements),
    };
  });

  // 핵심 궁위 분석
  const mingPalace = palaces[0];
  const fuChuPalace = palaces[2]; // 부처궁
  const caiBaiPalace = palaces[4]; // 재백궁
  const guanLuPalace = palaces[8]; // 관록궁

  // 인생 구조 분석
  const mingStars = mingPalace.stars.map((s) => s.star).join(", ") || "공궁";
  const hasPowerStar = mingPalace.stars.some((s) =>
    ["자미", "천부", "태양", "무곡"].includes(s.star)
  );
  const hasChangeStar = mingPalace.stars.some((s) =>
    ["칠살", "파군", "염정"].includes(s.star)
  );

  let lifeStructure = `명궁 ${BRANCHES[mingGongIdx]}궁에 ${mingStars} 좌정. `;
  if (hasPowerStar) {
    lifeStructure += "권위와 안정을 추구하는 인생 구조. 리더십과 구조적 성공이 핵심.";
  } else if (hasChangeStar) {
    lifeStructure += "변화와 개혁을 통해 성장하는 인생 구조. 파괴 후 재건 패턴.";
  } else {
    lifeStructure += "유연하고 다양한 경험을 통해 성장하는 인생 구조.";
  }

  // 핵심 인사이트
  const keyInsights: string[] = [];
  keyInsights.push(mingPalace.interpretation);

  if (fuChuPalace.stars.length > 0) {
    const fuStar = fuChuPalace.stars[0];
    const isBright = fuStar.brightness === "묘" || fuStar.brightness === "왕";
    keyInsights.push(
      `부처궁: ${fuStar.star}(${fuStar.brightness}) → ${isBright ? "좋은 배우자운" : "배우자 관계에 노력 필요"}`
    );
  }

  if (caiBaiPalace.stars.length > 0) {
    const caiStar = caiBaiPalace.stars[0];
    const isBright = caiStar.brightness === "묘" || caiStar.brightness === "왕";
    keyInsights.push(
      `재백궁: ${caiStar.star}(${caiStar.brightness}) → ${isBright ? "재물 획득 능력 강" : "재물 관리에 주의"}`
    );
  }

  if (guanLuPalace.stars.length > 0) {
    const guanStar = guanLuPalace.stars[0];
    const isBright = guanStar.brightness === "묘" || guanStar.brightness === "왕";
    keyInsights.push(
      `관록궁: ${guanStar.star}(${guanStar.brightness}) → ${isBright ? "직업운 강함" : "직업 변동 가능성"}`
    );
  }

  return {
    mingGong: BRANCHES[mingGongIdx],
    shenGong: BRANCHES[shenGongIdx],
    bureau,
    palaces,
    lifeStructure,
    keyInsights,
  };
}

/**
 * 질문 유형별 자미두수 핵심 분석
 */
export function getZiWeiForQuestion(
  ziwei: ZiWeiResult,
  questionType: "love" | "career" | "money" | "general"
): string {
  switch (questionType) {
    case "love": {
      const fuChu = ziwei.palaces[2]; // 부처궁
      return fuChu.interpretation;
    }
    case "career": {
      const guanLu = ziwei.palaces[8]; // 관록궁
      return guanLu.interpretation;
    }
    case "money": {
      const caiBai = ziwei.palaces[4]; // 재백궁
      return caiBai.interpretation;
    }
    default: {
      return ziwei.lifeStructure;
    }
  }
}

// lib/gyeokguk.ts — 격국 판정 엔진 v2 (전통 명리학 우선순위 준수)
// 판정 순서: ① 전왕격 → ② 종격 → ③ 내격 → ④ 특수 십성 조합(보조 속성)

// ─── 타입 정의 ───
export interface GyeokgukResult {
  type: "외격" | "내격";
  name: string;
  description: string;
  specialTrait?: string;          // 식신제살, 관인상생 등 (보조 정보)
  specialTraitDescription?: string;
  yongShinElement?: string;       // 격국 기반 용신 오행
}

// ─── 상수 ───
const STEM_ELEMENT: Record<string, string> = {
  "甲": "목", "乙": "목", "丙": "화", "丁": "화", "戊": "토",
  "己": "토", "庚": "금", "辛": "금", "壬": "수", "癸": "수"
};

const BRANCH_MAIN_ELEMENT: Record<string, string> = {
  "子": "수", "丑": "토", "寅": "목", "卯": "목", "辰": "토", "巳": "화",
  "午": "화", "未": "토", "申": "금", "酉": "금", "戌": "토", "亥": "수"
};

const STEM_POLARITY: Record<string, boolean> = {
  "甲": true, "乙": false, "丙": true, "丁": false, "戊": true,
  "己": false, "庚": true, "辛": false, "壬": true, "癸": false
};

const GYEOK_BRANCH_STEM: Record<string, string> = {
  "子": "癸", "丑": "己", "寅": "甲", "卯": "乙", "辰": "戊", "巳": "丙",
  "午": "丁", "未": "己", "申": "庚", "酉": "辛", "戌": "戊", "亥": "壬"
};

const GENERATE_MAP: Record<string, string> = {
  "목": "수", "화": "목", "토": "화", "금": "토", "수": "금"
};

const CONTROL_MAP: Record<string, string> = {
  "목": "금", "화": "수", "토": "목", "금": "화", "수": "토"
};

const PRODUCE_MAP: Record<string, string> = {
  "목": "화", "화": "토", "토": "금", "금": "수", "수": "목"
};

// ─── 헬퍼 함수 ───
function getDayMasterElement(dayMaster: string): string {
  return STEM_ELEMENT[dayMaster] || "목";
}

function countElementsInPillars(
  pillars: { year: string[]; month: string[]; day: string[]; hour: string[] }
): Record<string, number> {
  const counts: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const allChars = [
    pillars.year[0], pillars.year[1],
    pillars.month[0], pillars.month[1],
    pillars.day[0], pillars.day[1],
    pillars.hour[0], pillars.hour[1]
  ];
  for (const ch of allChars) {
    if (!ch) continue;
    const el = STEM_ELEMENT[ch] || BRANCH_MAIN_ELEMENT[ch];
    if (el) counts[el]++;
  }
  return counts;
}

function hasElementInStemsBranches(
  pillars: { year: string[]; month: string[]; day: string[]; hour: string[] },
  element: string,
  excludeDayStem = true
): boolean {
  const stems = [pillars.year[0], pillars.month[0], pillars.hour[0]];
  if (!excludeDayStem) stems.push(pillars.day[0]);
  const branches = [pillars.year[1], pillars.month[1], pillars.day[1], pillars.hour[1]];
  for (const s of stems) {
    if (STEM_ELEMENT[s] === element) return true;
  }
  for (const b of branches) {
    if (BRANCH_MAIN_ELEMENT[b] === element) return true;
  }
  return false;
}

// 일간의 뿌리(통근처)가 지지에 있는지 확인
function hasDayMasterRoot(
  pillars: { year: string[]; month: string[]; day: string[]; hour: string[] },
  dayMasterElement: string
): boolean {
  const branches = [pillars.year[1], pillars.month[1], pillars.day[1], pillars.hour[1]];
  for (const b of branches) {
    if (BRANCH_MAIN_ELEMENT[b] === dayMasterElement) return true;
  }
  return false;
}

// 월지가 일간을 돕는지 (득령)
function isDeukryeong(monthBranch: string, dayMasterElement: string): boolean {
  const mbEl = BRANCH_MAIN_ELEMENT[monthBranch];
  return mbEl === dayMasterElement || mbEl === GENERATE_MAP[dayMasterElement];
}

// ════════════════════════════════════════
// 1단계: 전왕격 (一行得氣格 / 專旺格) 판정
// ════════════════════════════════════════
function checkJeonwangGyeok(
  pillars: { year: string[]; month: string[]; day: string[]; hour: string[] },
  dayMaster: string,
  balance: number
): GyeokgukResult | null {
  if (balance < 0.75) return null; // 최소 75% 이상 신강해야 후보

  const dmEl = getDayMasterElement(dayMaster);
  const counts = countElementsInPillars(pillars);
  const controlEl = CONTROL_MAP[dmEl]; // 관살 오행

  // 관살이 천간·지지 본기에 존재하면 전왕격 불성립
  if (hasElementInStemsBranches(pillars, controlEl)) return null;

  // 일간 오행 + 인성 오행이 전체 8자 중 6자 이상 차지
  const genEl = GENERATE_MAP[dmEl];
  const selfCount = counts[dmEl] + counts[genEl];
  if (selfCount < 6) return null;

  // 월지가 일간 오행이어야 함
  const monthBranch = pillars.month[1];
  const mbEl = BRANCH_MAIN_ELEMENT[monthBranch];
  if (mbEl !== dmEl && mbEl !== genEl) return null;

  // 비겁이 천간에 투출해야 진격
  const stems = [pillars.year[0], pillars.month[0], pillars.hour[0]];
  const hasBigeopTouchul = stems.some(s => STEM_ELEMENT[s] === dmEl);

  const nameMap: Record<string, string[]> = {
    "목": ["곡직격(曲直格)", "목의 기운이 한쪽으로 편중된 전왕격입니다. 인성(수)·비겁(목) 운이 길하고, 관살(금) 운이 흉합니다."],
    "화": ["염상격(炎上格)", "화의 기운이 한쪽으로 편중된 전왕격입니다. 인성(목)·비겁(화) 운이 길하고, 관살(수) 운이 흉합니다."],
    "토": ["가색격(稼穡格)", "토의 기운이 한쪽으로 편중된 전왕격입니다. 인성(화)·비겁(토) 운이 길하고, 관살(목) 운이 흉합니다."],
    "금": ["종혁격(從革格)", "금의 기운이 한쪽으로 편중된 전왕격입니다. 인성(토)·비겁(금) 운이 길하고, 관살(화) 운이 흉합니다."],
    "수": ["윤하격(潤下格)", "수의 기운이 한쪽으로 편중된 전왕격입니다. 인성(금)·비겁(수) 운이 길하고, 관살(토) 운이 흉합니다."]
  };

  const info = nameMap[dmEl];
  if (!info) return null;

  return {
    type: "외격",
    name: info[0] + (hasBigeopTouchul ? "" : " (가격)"),
    description: info[1],
    yongShinElement: dmEl // 전왕격은 일간 오행 자체가 용신
  };
}

// ════════════════════════════════════════
// 2단계: 종격 (從格) 판정
// ════════════════════════════════════════
function checkJongGyeok(
  pillars: { year: string[]; month: string[]; day: string[]; hour: string[] },
  dayMaster: string,
  tenGods: Record<string, number>,
  balance: number
): GyeokgukResult | null {
  const dmEl = getDayMasterElement(dayMaster);
  const genEl = GENERATE_MAP[dmEl];
  const monthBranch = pillars.month[1];

  // ── 종강격 / 종왕격 (극신강) ──
  if (balance >= 0.80) {
    // 일간이 득령해야 함
    if (!isDeukryeong(monthBranch, dmEl)) return null;

    const bigeop = (tenGods["비겁"] || 0);
    const inseong = (tenGods["인성"] || 0);

    if (inseong >= bigeop) {
      return {
        type: "외격",
        name: "종강격(從强格)",
        description: "인성이 태왕하여 일간이 극도로 강한 사주입니다. 비겁·인성 운이 길하고, 재성·관살 운이 흉합니다. 식상 운은 비겁이 많으면 길하나 인성이 많으면 흉합니다.",
        yongShinElement: genEl
      };
    } else {
      return {
        type: "외격",
        name: "종왕격(從旺格)",
        description: "비겁이 태왕하여 일간이 극도로 강한 사주입니다. 비겁·인성 운이 길하고, 재성·관살 운이 흉합니다.",
        yongShinElement: dmEl
      };
    }
  }

  // ── 종재격 / 종관격 / 종아격 (극신약) ──
  if (balance <= 0.20) {
    // 일간이 실령(失令)해야 함
    if (isDeukryeong(monthBranch, dmEl)) return null;

    // 일간의 뿌리가 없거나 극히 미약해야 함
    const hasRoot = hasDayMasterRoot(pillars, dmEl);
    const hasGenRoot = hasDayMasterRoot(pillars, genEl);

    // 천간에 인성·비겁이 투출되면 종격 불성립 (가종 제외)
    const stems = [pillars.year[0], pillars.month[0], pillars.hour[0]];
    const hasSupportStem = stems.some(s => {
      const el = STEM_ELEMENT[s];
      return el === dmEl || el === genEl;
    });

    const isJinJong = !hasRoot && !hasGenRoot && !hasSupportStem;
    const suffix = isJinJong ? "" : " (가종)";

    // 가종이면서 뿌리가 있으면 종격 불성립 → 내격으로 처리
    if (!isJinJong && hasRoot) return null;

    // 어떤 종격인지 판단: 가장 왕성한 육신 기준
    const jaeseong = (tenGods["재성"] || 0);
    const gwanseong = (tenGods["관성"] || 0);
    const siksang = (tenGods["식상"] || 0);

    if (gwanseong >= jaeseong && gwanseong >= siksang) {
      return {
        type: "외격",
        name: "종관격(從官格)" + suffix,
        description: "관살이 태왕하여 일간이 관살의 기세를 따르는 사주입니다. 관살·재성 운이 길하고, 인성·비겁 운이 흉합니다.",
        yongShinElement: CONTROL_MAP[dmEl]
      };
    } else if (jaeseong >= siksang) {
      return {
        type: "외격",
        name: "종재격(從財格)" + suffix,
        description: "재성이 태왕하여 일간이 재성의 기세를 따르는 사주입니다. 재성·식상 운이 길하고, 인성·비겁 운이 흉합니다.",
        yongShinElement: PRODUCE_MAP[dmEl]
      };
    } else {
      return {
        type: "외격",
        name: "종아격(從兒格)" + suffix,
        description: "식상이 태왕하여 일간이 식상의 기세를 따르는 사주입니다. 식상·재성 운이 길하고, 인성·비겁 운이 흉합니다.",
        yongShinElement: PRODUCE_MAP[dmEl]
      };
    }
  }

  return null;
}

// ════════════════════════════════════════
// 3단계: 내격 (정격 / 팔격) 판정
// ════════════════════════════════════════
function checkNaegyeok(
  pillars: { year: string[]; month: string[]; day: string[]; hour: string[] },
  dayMaster: string,
  tenGods: Record<string, number>
): { name: string; description: string } {
  const dmEl = getDayMasterElement(dayMaster);
  const monthBranch = pillars.month[1];
  const mbEl = BRANCH_MAIN_ELEMENT[monthBranch];

  // 건록격 / 양인격 체크
  const GEOLLOG: Record<string, string> = {
    "甲": "寅", "乙": "卯", "丙": "巳", "丁": "午", "戊": "巳",
    "己": "午", "庚": "申", "辛": "酉", "壬": "亥", "癸": "子"
  };
  const YANGIN: Record<string, string> = {
    "甲": "卯", "丙": "午", "戊": "午", "庚": "酉", "壬": "子"
  };

  if (YANGIN[dayMaster] === monthBranch) {
    return { name: "양인격(羊刃格)", description: "월지가 일간의 양인에 해당하는 격국입니다. 칠살로 제어하는 운이 길합니다." };
  }
  if (GEOLLOG[dayMaster] === monthBranch) {
    return { name: "건록격(建祿格)", description: "월지가 일간의 건록에 해당하는 격국입니다. 재관 운이 길합니다." };
  }

  // 월지 본기 → 일간 대비 십신 → 격국명
  const monthMainStem = GYEOK_BRANCH_STEM[monthBranch] || "甲";
  const relation = getRelationByStem(dayMaster, monthMainStem);

  const GYEOK_NAMES: Record<string, string[]> = {
    "정관": ["정관격(正官格)", "월지 본기가 정관에 해당합니다. 신왕하고 인수가 있으면 발복합니다."],
    "편관": ["편관격(偏官格)", "월지 본기가 편관(칠살)에 해당합니다. 식신제살 또는 인수화살이 필요합니다."],
    "정인": ["정인격(正印格)", "월지 본기가 정인에 해당합니다. 관성이 있으면 관인양전으로 귀합니다."],
    "편인": ["편인격(偏印格)", "월지 본기가 편인에 해당합니다. 편재로 제압하거나 비견으로 설기하면 길합니다."],
    "식신": ["식신격(食神格)", "월지 본기가 식신에 해당합니다. 재성이 있어 식신생재가 되면 길합니다."],
    "상관": ["상관격(傷官格)", "월지 본기가 상관에 해당합니다. 상관상진이 되거나 인성으로 제어하면 길합니다."],
    "정재": ["정재격(正財格)", "월지 본기가 정재에 해당합니다. 신왕해야 재를 감당할 수 있습니다."],
    "편재": ["편재격(偏財格)", "월지 본기가 편재에 해당합니다. 신왕하고 관성이 있으면 재관격으로 귀합니다."],
    "비견": ["건록격(建祿格)", "월지 본기가 비견에 해당합니다."],
    "겁재": ["건록격(建祿格)", "월지 본기가 겁재에 해당합니다."]
  };

  const entry = GYEOK_NAMES[relation];
  if (entry) {
    return { name: entry[0], description: entry[1] };
  }

  // fallback: 가장 왕성한 십신으로 격국 추정
  let maxGod = "정관";
  let maxCount = 0;
  for (const [god, count] of Object.entries(tenGods)) {
    if (god !== "비겁" && count > maxCount) {
      maxCount = count;
      maxGod = god;
    }
  }
  const fallback = GYEOK_NAMES[maxGod];
  return {
    name: fallback ? fallback[0] : "잡격(雜格)",
    description: fallback ? fallback[1] : "특정 격국으로 분류하기 어려운 사주입니다."
  };
}

function getRelationByStem(dayMasterStem: string, targetStem: string): string {
  const dayEl = STEM_ELEMENT[dayMasterStem];
  const targetEl = STEM_ELEMENT[targetStem];
  if (!dayEl || !targetEl) return "비견";

  const samePol = STEM_POLARITY[dayMasterStem] === STEM_POLARITY[targetStem];

  if (dayEl === targetEl) return samePol ? "비견" : "겁재";
  if (GENERATE_MAP[dayEl] === targetEl) return samePol ? "편인" : "정인";
  if (PRODUCE_MAP[dayEl] === targetEl) return samePol ? "식신" : "상관";
  if (CONTROL_MAP[dayEl] === targetEl) return samePol ? "편관" : "정관";
  return samePol ? "편재" : "정재";
}

// ════════════════════════════════════════
// 4단계: 특수 십성 조합 (보조 속성)
// ════════════════════════════════════════
function checkSpecialTrait(
  pillars: { year: string[]; month: string[]; day: string[]; hour: string[] },
  dayMaster: string,
  tenGods: Record<string, number>
): { name: string; description: string } | null {
  const dmEl = getDayMasterElement(dayMaster);
  const allStems = [pillars.year[0], pillars.month[0], pillars.day[0], pillars.hour[0]];
  const allBranches = [pillars.year[1], pillars.month[1], pillars.day[1], pillars.hour[1]];

  const hasElement = (el: string) => {
    return allStems.some(s => STEM_ELEMENT[s] === el) ||
           allBranches.some(b => BRANCH_MAIN_ELEMENT[b] === el);
  };

  const siksangEl = PRODUCE_MAP[dmEl];        // 식상 오행
  const gwanEl = CONTROL_MAP[dmEl];           // 관살 오행
  const inEl = GENERATE_MAP[dmEl];            // 인성 오행
  const jaeEl = PRODUCE_MAP[siksangEl] || ""; // 재성 오행

  // 식신제살격: 식상과 관살이 모두 존재
  if (hasElement(siksangEl) && hasElement(gwanEl)) {
    return {
      name: "식신제살(食神制殺)",
      description: "식신이 칠살을 제압하는 구조입니다. 식신과 칠살의 힘이 균형을 이루면 귀격입니다."
    };
  }

  // 관인상생격: 관성과 인성이 모두 존재
  if (hasElement(gwanEl) && hasElement(inEl)) {
    return {
      name: "관인상생(官印相生)",
      description: "관성이 인성을 생하고 인성이 일간을 돕는 구조입니다. 관살의 흉함이 인성으로 해소됩니다."
    };
  }

  // 상관배인격: 상관과 인성이 모두 존재
  if (hasElement(siksangEl) && hasElement(inEl)) {
    const isSangGwan = (tenGods["식상"] || 0) >= 2;
    if (isSangGwan) {
      return {
        name: "상관배인(傷官佩印)",
        description: "상관의 기세가 강한데 인성이 이를 제어하는 구조입니다."
      };
    }
  }

  // 재관쌍미격: 재성과 관성이 모두 존재하고 적당
  if (hasElement(jaeEl) && hasElement(gwanEl)) {
    return {
      name: "재관쌍미(財官雙美)",
      description: "재성이 관성을 생하여 일간에 권위와 재물이 함께 하는 구조입니다."
    };
  }

  // 식신생재격: 식상과 재성이 모두 존재
  if (hasElement(siksangEl) && hasElement(jaeEl)) {
    return {
      name: "식신생재(食神生財)",
      description: "식신이 재성을 생하는 구조로, 재물 획득의 통로가 열립니다."
    };
  }

  return null;
}

// ════════════════════════════════════════
// 메인: determineGyeokguk
// ════════════════════════════════════════
export function determineGyeokguk(
  pillars: { year: string[]; month: string[]; day: string[]; hour: string[] },
  dayMaster: string,
  tenGods: Record<string, number>,
  balance: number
): GyeokgukResult {

  // ── 1순위: 전왕격 ──
  const jeonwang = checkJeonwangGyeok(pillars, dayMaster, balance);
  if (jeonwang) {
    const trait = checkSpecialTrait(pillars, dayMaster, tenGods);
    if (trait) {
      jeonwang.specialTrait = trait.name;
      jeonwang.specialTraitDescription = trait.description;
    }
    return jeonwang;
  }

  // ── 2순위: 종격 ──
  const jongguk = checkJongGyeok(pillars, dayMaster, tenGods, balance);
  if (jongguk) {
    const trait = checkSpecialTrait(pillars, dayMaster, tenGods);
    if (trait) {
      jongguk.specialTrait = trait.name;
      jongguk.specialTraitDescription = trait.description;
    }
    return jongguk;
  }

  // ── 3순위: 내격 ──
  const naegyeok = checkNaegyeok(pillars, dayMaster, tenGods);

  // ── 4순위: 특수 십성 조합 (보조 속성) ──
  const trait = checkSpecialTrait(pillars, dayMaster, tenGods);

  return {
    type: "내격",
    name: naegyeok.name,
    description: naegyeok.description,
    specialTrait: trait?.name,
    specialTraitDescription: trait?.description
  };
}

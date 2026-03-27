// gyeokguk.ts v2 - 전통 명리학 격국 판정 엔진
// 우선순위: 종격(외격) → 내격 → specialTrait(보조)

import {
  STEM_ELEMENT_HANJA as STEM_ELEMENT,
  BRANCH_ELEMENT_HANJA as BRANCH_ELEMENT,
  BRANCH_MAIN_STEM,
  STEM_POLARITY,
  GENERATES_HANJA as GENERATES,
  CONTROLS_HANJA as CONTROLS,
  GENERATED_BY_HANJA as GENERATED_BY,
  CONTROLLED_BY_HANJA as CONTROLLED_BY
} from "./fiveElements.ts";

export interface GyeokgukResult {
  type: string;
  name: string;
  description: string;
  specialTrait?: string;
  specialTraitDescription?: string;
  yongShinElement?: string;
}


// === 십성 판별 (음양 구분) ===
function getRelationByStem(dayStem: string, targetStem: string): string {
  const dayEl = STEM_ELEMENT[dayStem] || "木";
  const targetEl = STEM_ELEMENT[targetStem] || "木";
  const dayPol = STEM_POLARITY[dayStem] || "양";
  const targetPol = STEM_POLARITY[targetStem] || "양";
  const samePol = dayPol === targetPol;

  if (dayEl === targetEl) return samePol ? "비견" : "겁재";
  if (GENERATES[dayEl] === targetEl) return samePol ? "식신" : "상관";
  if (CONTROLS[dayEl] === targetEl) return samePol ? "편재" : "정재";
  if (CONTROLLED_BY[dayEl] === targetEl) return samePol ? "편관" : "정관";
  if (GENERATED_BY[dayEl] === targetEl) return samePol ? "편인" : "정인";
  return "비견";
}

// === 종격 판별 ===
function checkJongGyeok(
  pillars: { year: string[]; month: string[]; day: string[]; hour: string[] },
  dayMaster: string,
  tenGods: Record<string, number>,
  balance: number
): GyeokgukResult | null {
  const dmEl = STEM_ELEMENT[dayMaster] || "木";

  // 극신강 (balance >= 0.80) → 종강격/종왕격
  if (balance >= 0.80) {
    const bigyeop = (tenGods["비견"] || 0) + (tenGods["겁재"] || 0);
    const insung = (tenGods["편인"] || 0) + (tenGods["정인"] || 0);

    if (bigyeop >= insung) {
      return {
        type: "외격", name: "종왕격(從旺格)",
        description: "비겁이 태왕하여 일간의 기세를 따릅니다. 비겁과 인성이 용신입니다.",
        yongShinElement: bigyeop >= insung ? dmEl : GENERATED_BY[dmEl]
      };
    } else {
      return {
        type: "외격", name: "종강격(從强格)",
        description: "인성이 태왕하여 일간을 극도로 생조합니다. 인성과 비겁이 용신입니다.",
        yongShinElement: GENERATED_BY[dmEl]
      };
    }
  }

  // 극신약 (balance <= 0.20) → 종재/종살/종아격
  if (balance <= 0.20) {
    const jaeSung = (tenGods["편재"] || 0) + (tenGods["정재"] || 0);
    const gwanSal = (tenGods["편관"] || 0) + (tenGods["정관"] || 0);
    const sikSang = (tenGods["식신"] || 0) + (tenGods["상관"] || 0);

    if (gwanSal >= jaeSung && gwanSal >= sikSang) {
      return {
        type: "외격", name: "종살격(從殺格)",
        description: "관살이 태왕하여 일간이 따릅니다. 관살과 재성이 용신입니다.",
        yongShinElement: CONTROLLED_BY[dmEl]
      };
    } else if (jaeSung >= sikSang) {
      return {
        type: "외격", name: "종재격(從財格)",
        description: "재성이 태왕하여 일간이 따릅니다. 재성과 식상이 용신입니다.",
        yongShinElement: CONTROLS[dmEl]
      };
    } else {
      return {
        type: "외격", name: "종아격(從兒格)",
        description: "식상이 태왕하여 일간이 따릅니다. 식상과 재성이 용신입니다.",
        yongShinElement: GENERATES[dmEl]
      };
    }
  }

  return null;
}

// === 내격 판별 (월지 투간 기준) ===
function checkNaegyeok(
  pillars: { year: string[]; month: string[]; day: string[]; hour: string[] },
  dayMaster: string
): GyeokgukResult {
  const monthBranch = pillars.month[1] || "子";
  const hiddenStems = HIDDEN_STEMS[monthBranch] || []; // [본기, 중기, 여기]
  
  // 투간(透干) 확인: 월지 지장간이 다른 기둥(년, 월, 시) 천간에 나타났는지 확인
  const heavenStems = [
    { stem: pillars.year[0], label: "년" },
    { stem: pillars.month[0], label: "월" },
    { stem: pillars.hour[0], label: "시" }
  ];

  let selectedStem = "";
  let priority = 4; // 1: 본기투간, 2: 중기투간, 3: 초기투간, 4: 본기(불투간)

  // 1. 투간 우선순위 판정
  for (const { stem } of heavenStems) {
    if (!stem) continue;
    const idx = hiddenStems.indexOf(stem);
    if (idx === 0 && priority > 1) { selectedStem = stem; priority = 1; }
    else if (idx === 1 && priority > 2) { selectedStem = stem; priority = 2; }
    else if (idx === 2 && priority > 3) { selectedStem = stem; priority = 3; }
  }

  // 2. 투간된 것이 없으면 월지 본기(정기)를 기준으로 정함
  if (priority === 4) {
    selectedStem = hiddenStems[0] || "甲";
  }

  const relation = getRelationByStem(dayMaster, selectedStem);

  const GYEOK_NAMES: Record<string, { name: string; desc: string }> = {
    "비견": { name: "건록격(建祿格)", desc: "월지가 일간과 같은 오행의 양간입니다. 자립심이 강합니다." },
    "겁재": { name: "양인격(羊刃格)", desc: "월지가 일간과 같은 오행의 음간입니다. 결단력이 있습니다." },
    "식신": { name: "식신격(食神格)", desc: "월지 기운이 투간되거나 본기가 식신에 해당합니다. 재능과 표현력이 뛰어납니다." },
    "상관": { name: "상관격(傷관格)", desc: "월지 기운이 투간되거나 본기가 상관에 해당합니다. 창의성과 비판력이 강합니다." },
    "편재": { name: "편재격(偏財格)", desc: "월지 기운이 투간되거나 본기가 편재에 해당합니다. 재물 운용 능력이 좋습니다." },
    "정재": { name: "정재격(正財格)", desc: "월지 기운이 투간되거나 본기가 정재에 해당합니다. 안정적 재물 축적에 유리합니다." },
    "편관": { name: "편관격(偏官格)", desc: "월지 기운이 투간되거나 본기가 편관(칠살)에 해당합니다. 권위와 추진력이 있습니다." },
    "정관": { name: "정관격(正官格)", desc: "월지 기운이 투간되거나 본기가 정관에 해당합니다. 명예와 질서를 중시합니다." },
    "편인": { name: "편인격(偏印格)", desc: "월지 기운이 투간되거나 본기가 편인에 해당합니다. 학문적 깊이와 독창성이 있습니다." },
    "정인": { name: "정인격(正印格)", desc: "월지 기운이 투간되거나 본기가 정인에 해당합니다. 학문과 인덕이 풍부합니다." },
  };

  const gyeok = GYEOK_NAMES[relation] || GYEOK_NAMES["비견"]!;
  const tugangSuffix = priority < 4 ? ` (월지 ${priority === 1 ? "본기" : (priority === 2 ? "중기" : "초기")} 투간)` : "";

  return {
    type: "내격",
    name: gyeok.name + tugangSuffix,
    description: gyeok.desc
  };
}

// === 특수 조합 (보조 속성) ===
function checkSpecialTrait(
  dayMaster: string,
  tenGods: Record<string, number>
): { name: string; description: string } | null {
  const siksin = (tenGods["식신"] || 0);
  const sangwan = (tenGods["상관"] || 0);
  const pyeonGwan = (tenGods["편관"] || 0);
  const jeongGwan = (tenGods["정관"] || 0);
  const pyeonIn = (tenGods["편인"] || 0);
  const jeongIn = (tenGods["정인"] || 0);
  const pyeonJae = (tenGods["편재"] || 0);
  const jeongJae = (tenGods["정재"] || 0);

  if (siksin >= 1 && pyeonGwan >= 1)
    return { name: "식신제살(食神制殺)", description: "식신이 칠살을 제어하여 흉을 길로 바꿉니다." };
  if ((pyeonGwan >= 1 || jeongGwan >= 1) && (pyeonIn >= 1 || jeongIn >= 1))
    return { name: "관인상생(官印相生)", description: "관성과 인성이 상생하여 학문과 명예가 함께합니다." };
  if (sangwan >= 1 && (pyeonIn >= 1 || jeongIn >= 1))
    return { name: "상관배인(傷官佩印)", description: "상관의 날카로움을 인성이 다스려 균형을 이룬다." };
  if ((pyeonJae >= 1 || jeongJae >= 1) && (pyeonGwan >= 1 || jeongGwan >= 1))
    return { name: "재관쌍미(財官雙美)", description: "재성과 관성이 함께하여 부와 명예를 겸합니다." };
  if (siksin >= 1 && (pyeonJae >= 1 || jeongJae >= 1))
    return { name: "식신생재(食신生財)", description: "식신이 재성을 생하여 재물 복이 풍부합니다." };

  return null;
}

// === 메인 함수 ===
export function determineGyeokguk(
  pillars: { year: string[]; month: string[]; day: string[]; hour: string[] },
  dayMaster: string,
  tenGods: Record<string, number>,
  balance: number
): GyeokgukResult {

  // 1순위: 종격 (외격) - balance 극단값
  const jongGyeok = checkJongGyeok(pillars, dayMaster, tenGods, balance);
  if (jongGyeok) {
    const trait = checkSpecialTrait(dayMaster, tenGods);
    if (trait) {
      jongGyeok.specialTrait = trait.name;
      jongGyeok.specialTraitDescription = trait.description;
    }
    return jongGyeok;
  }

  // 2순위: 내격 (월지 정기 기준)
  const naegyeok = checkNaegyeok(pillars, dayMaster);

  // 보조: 특수 조합
  const trait = checkSpecialTrait(dayMaster, tenGods);
  if (trait) {
    naegyeok.specialTrait = trait.name;
    naegyeok.specialTraitDescription = trait.description;
  }

  return naegyeok;
}

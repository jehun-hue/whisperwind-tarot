/**
 * gyeokguk.ts
 * 사주 격국(格局) 판별 모듈
 */

import { calculateTenGod } from "./tenGods.ts";

export interface GyeokgukResult {
  type: "내격" | "외격" | "특수격";
  name: string;
  hanja?: string;
  description: string;
  strength: "강" | "중" | "약";
}

/**
 * 월지의 본기(정기) 장간을 리턴
 */
export function getMonthBranchMainGan(monthBranch: string): string {
  const map: Record<string, string> = {
    "子": "癸", "丑": "己", "寅": "甲", "卯": "乙", "辰": "戊", "巳": "丙",
    "午": "丁", "未": "己", "申": "庚", "酉": "辛", "戌": "戊", "亥": "壬"
  };
  return map[monthBranch] || "";
}

/**
 * 특수격국 (Special Structures) 판별
 */
function checkSpecialGyeok(
  dayStem: string,
  allStems: string[],
  allBranches: string[],
  tenGodsCount: Record<string, number>
): GyeokgukResult | null {
  const branchCount: Record<string, number> = {};
  allBranches.forEach(b => {
    const char = b.charAt(0);
    branchCount[char] = (branchCount[char] || 0) + 1;
  });

  const stemTenGods = allStems.map(s => calculateTenGod(dayStem, s));
  const hasInStems = (god: string) => stemTenGods.includes(god);

  // Helper for Banghap
  const hasBanghap = (set: string[]) => set.every(b => allBranches.some(ab => ab.includes(b)));
  
  // 1. 곡직격 (曲直格)
  if (["甲", "乙"].includes(dayStem)) {
    const woodCount = (branchCount["寅"] || 0) + (branchCount["卯"] || 0) + (branchCount["辰"] || 0);
    if (hasBanghap(["寅", "卯", "辰"]) || woodCount >= 3) {
      return { type: "외격", name: "곡직격", hanja: "曲直格", description: "나무의 생동하는 기운을 가진 격으로 인자함과 성장성이 돋보입니다.", strength: "강" };
    }
  }

  // 2. 염상격 (炎上格)
  if (["丙", "丁"].includes(dayStem)) {
    const fireCount = (branchCount["巳"] || 0) + (branchCount["午"] || 0) + (branchCount["未"] || 0);
    if (hasBanghap(["巳", "午", "未"]) || fireCount >= 3) {
      return { type: "외격", name: "염상격", hanja: "炎上格", description: "불의 정점이나 확산력을 가진 격으로 열정과 예의가 살아있습니다.", strength: "강" };
    }
  }

  // 3. 가색격 (稼穡格)
  if (["戊", "己"].includes(dayStem)) {
    const earthCount = (branchCount["辰"] || 0) + (branchCount["戌"] || 0) + (branchCount["丑"] || 0) + (branchCount["未"] || 0);
    if (earthCount >= 3) {
      return { type: "외격", name: "가색격", hanja: "稼穡格", description: "대지의 풍요를 상징하는 격으로 결실을 맺고 성실하게 기반을 닦습니다.", strength: "강" };
    }
  }

  // 4. 종혁격 (從革格)
  if (["庚", "辛"].includes(dayStem)) {
    const metalCount = (branchCount["申"] || 0) + (branchCount["酉"] || 0) + (branchCount["戌"] || 0);
    if (hasBanghap(["申", "酉", "戌"]) || metalCount >= 3) {
      return { type: "외격", name: "종혁격", hanja: "從革格", description: "금의 결단력과 변혁을 의미하는 격으로 의리와 강력한 집행력이 돋보입니다.", strength: "강" };
    }
  }

  // 5. 윤하격 (潤下格)
  if (["壬", "癸"].includes(dayStem)) {
    const waterCount = (branchCount["亥"] || 0) + (branchCount["子"] || 0) + (branchCount["丑"] || 0);
    if (hasBanghap(["亥", "子", "丑"]) || waterCount >= 3) {
      return { type: "외격", name: "윤하격", hanja: "潤下格", description: "물의 유동성과 지혜를 의미하는 격으로 깊은 통찰력과 침투력이 있습니다.", strength: "강" };
    }
  }

  // 6. 양인합살격 (羊刃合殺格)
  const yanginMap: Record<string, string> = { "甲": "卯", "乙": "寅", "丙": "午", "丁": "巳", "戊": "午", "己": "巳", "庚": "酉", "辛": "申", "壬": "子", "癸": "亥" };
  if (allBranches.some(b => b.includes(yanginMap[dayStem])) && hasInStems("편관")) {
    return { type: "특수격", name: "양인합살격", hanja: "羊刃合殺格", description: "강인한 양인의 기운을 날카로운 편관(살)으로 제어하여 큰 권위를 얻는 대귀한 격국입니다.", strength: "강" };
  }

  // 7. 상관배인격 (傷官佩印格)
  if (tenGodsCount["상관"] >= 2.0 && (hasInStems("정인") || hasInStems("편인"))) {
    return { type: "특수격", name: "상관배인격", hanja: "傷官佩印格", description: "뛰어난 재능과 언변(상관)을 지혜로운 인성(인)으로 다듬어 학문이나 전문직에서 이름을 떨칩니다.", strength: "중" };
  }

  // 8. 식신제살격 (食神制殺格)
  if (hasInStems("식신") && hasInStems("편관")) {
    return { type: "특수격", name: "식신제살격", hanja: "食神制殺格", description: "총명한 능력으로 난관과 고난(편관)을 해결하며 사회적 문제를 타파하는 용사형 격국입니다.", strength: "중" };
  }

  // 9. 재자약살격 (財滋弱殺格)
  if (hasInStems("재성") && hasInStems("편관")) {
    return { type: "특수격", name: "재자약살격", hanja: "財滋弱殺格", description: "풍요로운 재물이 명예와 권위(편관)를 뒷받침하여 실질적인 지위와 부를 동시에 거머쥡니다.", strength: "중" };
  }

  // 10. 관인상생격 (官印相生格)
  if (hasInStems("정관") && hasInStems("정인")) {
    return { type: "특수격", name: "관인상생격", hanja: "官印相生格", description: "조직의 신뢰와 개인의 학문적 소양이 조화를 이루어 순탄하게 성공과 승진을 이루는 명문 격국입니다.", strength: "중" };
  }

  return null;
}

/**
 * 격국 판별 메인 함수
 */
export function determineGyeokguk(
  dayStem: string,
  monthBranch: string,
  tenGodsCount: Record<string, number>,
  balance: { supportRatio: number; isDeukyeong: boolean },
  allStems: string[],
  allBranches: string[]
): GyeokgukResult {
  const { supportRatio, isDeukyeong } = balance;

  // 1. 특수격 판별 (Check first)
  const special = checkSpecialGyeok(dayStem, allStems, allBranches, tenGodsCount);
  if (special) return special;

  // 2. 외격 (종격) 판별
  if (supportRatio >= 0.80 && isDeukyeong) {
    return {
      type: "외격",
      name: "종강격",
      description: "에너지가 한곳(인성·비겁)으로 극도로 쏠려 있어 그 기운을 따라야 하는 격국",
      strength: "강"
    };
  }
  
  if (supportRatio <= 0.20) {
    const sjCount = tenGodsCount["식상"] || 0;
    const jjCount = tenGodsCount["재성"] || 0;
    const kjCount = tenGodsCount["관성"] || 0;

    if (jjCount >= sjCount && jjCount >= kjCount) {
      return {
        type: "외격",
        name: "종재격",
        description: "재성의 기운이 매우 강하여 자신의 주체성보다 재물의 흐름을 따르는 격국",
        strength: "강"
      };
    } else if (kjCount >= sjCount && kjCount >= jjCount) {
      return {
        type: "외격",
        name: "종관격",
        description: "관성의 기운이 매우 강하여 대세나 조직의 규율을 따르는 격국",
        strength: "강"
      };
    } else {
      return {
        type: "외격",
        name: "종아격",
        description: "식상의 기운이 매우 강하여 자신의 재능과 표현력을 극한으로 발휘하는 격국",
        strength: "강"
      };
    }
  }

  // 3. 내격 판별
  // a. 건록격 / 양인격 체크
  const gunrokMap: Record<string, string> = {
    "甲": "寅", "乙": "卯", "丙": "巳", "丁": "午", "戊": "巳", "己": "午", "庚": "申", "辛": "酉", "壬": "亥", "癸": "子"
  };
  const yanginMap: Record<string, string> = {
    "甲": "卯", "乙": "寅", "丙": "午", "丁": "巳", "戊": "午", "己": "巳", "庚": "酉", "辛": "申", "壬": "子", "癸": "亥"
  };

  if (gunrokMap[dayStem] === monthBranch) {
    return {
      type: "내격",
      name: "건록격",
      description: "월지에 건록을 두어 자수성가하고 주체성이 뚜렷하며 기반이 탄탄한 격국",
      strength: "중"
    };
  }
  if (yanginMap[dayStem] === monthBranch) {
    return {
      type: "내격",
      name: "양인격",
      description: "월지에 양인을 두어 리더십과 추진력이 매우 강하며 고집과 기품이 있는 격국",
      strength: "중"
    };
  }

  // b. 월지 장간 십신 기준 8격
  const mainGan = getMonthBranchMainGan(monthBranch);
  const tenGod = calculateTenGod(dayStem, mainGan);
  
  const gyeokMap: Record<string, { name: string; desc: string }> = {
    "정관": { name: "정관격", desc: "명예와 원칙을 중시하며 합리적이고 조직적인 삶을 추구하는 격국" },
    "편관": { name: "편관격", desc: "책임감이 강하고 카리스마가 있으며 고난을 극복하는 기운이 강한 격국" },
    "정인": { name: "정인격", desc: "학문적 소양과 수용력이 뛰어나며 윗사람의 덕과 지혜를 갖춘 격국" },
    "편인": { name: "편인격", desc: "기술적 재능이나 직관력이 뛰어나며 독창적인 정신 세계를 가진 격국" },
    "식신": { name: "식신격", desc: "풍요로움과 전문성을 갖추고 있으며 탐구심과 낙천적인 성향의 격국" },
    "상관": { name: "상관격", desc: "재능과 화술이 뛰어나며 변화를 추구하고 비판적 사고가 발달한 격국" },
    "정재": { name: "정재격", desc: "성실하고 치밀하며 안정적인 재물 추구와 합리적 소비 형태를 지닌 격국" },
    "편재": { name: "편재격", desc: "활동 범위가 넓고 재물 취득에 과감하며 수완이 뛰어난 격국" },
    "비견": { name: "비견격", desc: "독립심이 강하고 자기 주관이 뚜렷한 삶을 추구하는 격국" },
    "겁재": { name: "겁재격", desc: "경쟁심이 강하고 승부욕이 있으며 동료와의 협력이 돋보이는 격국" }
  };

  const selectedGyeok = gyeokMap[tenGod] || { name: `${tenGod}격`, desc: "월지 기운에 따른 일반적인 격국" };

  return {
    type: "내격",
    name: selectedGyeok.name,
    description: selectedGyeok.desc,
    strength: supportRatio > 0.5 ? "강" : (supportRatio < 0.4 ? "약" : "중")
  };
}

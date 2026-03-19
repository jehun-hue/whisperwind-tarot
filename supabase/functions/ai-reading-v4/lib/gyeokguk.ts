/**
 * gyeokguk.ts
 * 사주 격국(格局) 판별 모듈
 */

import { calculateTenGod } from "./tenGods.ts";

export interface GyeokgukResult {
  type: "내격" | "외격";
  name: string;
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
 * 격국 판별 메인 함수
 */
export function determineGyeokguk(
  dayStem: string,
  monthBranch: string,
  tenGodsCount: Record<string, number>,
  balance: { supportRatio: number; isDeukyeong: boolean }
): GyeokgukResult {
  const { supportRatio, isDeukyeong } = balance;

  // 1. 외격 (종격) 판별 우선
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

  // 2. 내격 판별
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

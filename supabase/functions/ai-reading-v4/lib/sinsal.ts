/**
 * sinsal.ts
 * 사주 신살(神殺) 계산 엔진
 */

export interface SinsalResult {
  name: string;          // 한글명
  hanja: string;         // 한자명
  location: string;      // 발견 위치 (년주/월주/일주/시주)
  category: '귀인' | '흉살' | '특수';
  effect: string;        // 1~2문장 한국어 해석
  strength: '강' | '중' | '약';
}

// 1) 일간 기준 매핑
const CHEONIL_MAP: Record<string, string[]> = { "甲": ["丑", "未"], "戊": ["丑", "未"], "庚": ["丑", "未"], "乙": ["子", "申"], "己": ["子", "申"], "丙": ["亥", "酉"], "丁": ["亥", "酉"], "壬": ["卯", "巳"], "癸": ["卯", "巳"], "辛": ["寅", "午"] };
const MUNCHANG_MAP: Record<string, string> = { "甲": "巳", "乙": "午", "丙": "申", "丁": "酉", "戊": "申", "己": "酉", "庚": "亥", "辛": "子", "壬": "寅", "癸": "卯" };
const HAKDANG_MAP: Record<string, string> = { "甲": "亥", "乙": "午", "丙": "寅", "丁": "酉", "戊": "寅", "己": "酉", "庚": "巳", "辛": "子", "壬": "申", "癸": "卯" };
const GEUMYEO_MAP: Record<string, string> = { "甲": "辰", "乙": "巳", "丙": "未", "丁": "申", "戊": "未", "己": "申", "庚": "戌", "辛": "亥", "壬": "丑", "癸": "寅" };

// 월지 기준 매핑
const CHEONDEOK_MAP: Record<string, string> = { "子": "巳", "丑": "庚", "寅": "丁", "卯": "申", "辰": "壬", "巳": "辛", "午": "亥", "未": "甲", "申": "癸", "酉": "寅", "戌": "丙", "亥": "乙" };
const WOLDEOK_MAP: Record<string, string> = { "寅": "丙", "午": "丙", "戌": "丙", "申": "壬", "子": "壬", "辰": "壬", "巳": "庚", "酉": "庚", "丑": "庚", "亥": "甲", "卯": "甲", "未": "甲" };

// 12신살 기본 순서 및 산출 베이스
const SHINSAL_12_NAMES: [string, string, string][] = [
  ["겁살", "劫殺", "흉살"], ["재살", "災殺", "흉살"], ["천살", "天殺", "흉살"], ["지살", "地殺", "귀인"],
  ["년살", "年殺", "특수"], ["월살", "月殺", "흉살"], ["망신살", "亡身殺", "흉살"], ["장성살", "將星殺", "귀인"],
  ["반안살", "攀鞍殺", "귀인"], ["역마살", "驛馬殺", "특수"], ["육해살", "六害殺", "흉살"], ["화개살", "華蓋殺", "특수"]
];
const SHINSAL_12_BASE: Record<string, string> = {
  "寅": "亥", "午": "亥", "戌": "亥", "巳": "寅", "酉": "寅", "丑": "寅",
  "申": "巳", "子": "巳", "辰": "巳", "亥": "申", "卯": "申", "未": "申"
};

const BAEKHO_LIST = ["甲辰", "乙巳", "丙申", "丁酉", "戊午", "己丑", "庚寅", "辛卯", "壬戌", "癸亥"];
const GOEGANG_LIST = ["庚辰", "庚戌", "壬辰", "壬戌"];
const WONJINSAL_MAP: Record<string, string> = { "子": "未", "丑": "午", "寅": "酉", "卯": "申", "辰": "亥", "巳": "戌", "午": "丑", "未": "子", "申": "卯", "酉": "寅", "戌": "巳", "亥": "辰" };
const GWIMUN_MAP: Record<string, string> = { "子": "酉", "丑": "午", "寅": "未", "卯": "申", "辰": "亥", "巳": "戌", "午": "丑", "未": "寅", "申": "卯", "酉": "子", "戌": "巳", "亥": "辰" };

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

export function calculateSinsal(
  dayMaster: string,
  stems: string[],
  branches: string[],
  monthBranch: string,
  yearBranch: string
): SinsalResult[] {
  const results: SinsalResult[] = [];
  const locations = ["년주", "월주", "일주", "시주"];

  // 1) 일간 기준
  branches.forEach((ji, idx) => {
    const loc = locations[idx];
    if (CHEONIL_MAP[dayMaster]?.includes(ji)) {
      results.push({ name: "천을귀인", hanja: "天乙貴人", location: loc, category: "귀인", effect: "일생 통틀어 귀인의 도움을 받고 위기에서 벗어납니다.", strength: "강" });
    }
    if (MUNCHANG_MAP[dayMaster] === ji) {
      results.push({ name: "문창귀인", hanja: "文昌貴人", location: loc, category: "귀인", effect: "지혜가 총명하고 학문과 창의적 재능이 뛰어납니다.", strength: "중" });
    }
    if (HAKDANG_MAP[dayMaster] === ji) {
      results.push({ name: "학당귀인", hanja: "學堂貴人", location: loc, category: "귀인", effect: "교육적 소양과 학문에 깊은 연이 있습니다.", strength: "중" });
    }
    if (GEUMYEO_MAP[dayMaster] === ji) {
      results.push({ name: "금여록", hanja: "金輿祿", location: loc, category: "귀인", effect: "의식주가 풍족하고 안정적인 생활을 뒷받침합니다.", strength: "중" });
    }
  });

  // 2) 월지 기준 (천덕/월덕)
  stems.forEach((stem, idx) => {
    if (CHEONDEOK_MAP[monthBranch] === stem) {
      results.push({ name: "천덕귀인", hanja: "天德貴人", location: locations[idx], category: "귀인", effect: "하늘의 덕이 내려 재난을 피하고 덕을 입습니다.", strength: "강" });
    }
    if (WOLDEOK_MAP[monthBranch] === stem) {
      results.push({ name: "월덕귀인", hanja: "月德貴人", location: locations[idx], category: "귀인", effect: "사회적으로 인정을 받고 조상의 덕을 입는 운입니다.", strength: "강" });
    }
  });

  // 3) 12신살 (년지 기준)
  const yBaseJi = SHINSAL_12_BASE[yearBranch.charAt(0)];
  if (yBaseJi) {
    branches.forEach((ji, idx) => {
      const diff = (BRANCHES.indexOf(ji.charAt(0)) - BRANCHES.indexOf(yBaseJi) + 24) % 12;
      const [name, hanja, cat] = SHINSAL_12_NAMES[diff];
      results.push({ name, hanja, location: locations[idx], category: cat as any, effect: `${name}의 작용으로 해당 주에 변동성이나 특수한 기운이 작용합니다.`, strength: "중" });
    });
  }

  // 4) 특수살 (백호/괴강/원진/귀문)
  stems.forEach((stem, idx) => {
    const ji = branches[idx];
    const full = stem + ji;
    if (BAEKHO_LIST.includes(full)) {
      results.push({ name: "백호대살", hanja: "白虎大殺", location: locations[idx], category: "흉살", effect: "강력한 변화와 예기치 못한 사고에 주의가 필요한 살입니다.", strength: "강" });
    }
  });

  const ilju = stems[2] + branches[2];
  if (GOEGANG_LIST.includes(ilju)) {
    results.push({ name: "괴강살", hanja: "魁罡殺", location: "일주", category: "특수", effect: "강인한 정신력과 대담함으로 큰 뜻을 펼칠 기세가 있습니다.", strength: "강" });
  }

  // 원진/귀문 (일지 기준)
  const ilji = branches[2];
  branches.forEach((ji, idx) => {
    if (idx === 2) return;
    if (WONJINSAL_MAP[ilji] === ji) {
      results.push({ name: "원진살", hanja: "怨嗔殺", location: locations[idx], category: "흉살", effect: "이유 없는 미움이나 마찰로 인한 대인 관계 스트레스를 의미합니다.", strength: "중" });
    }
    if (GWIMUN_MAP[ilji] === ji) {
      results.push({ name: "귀문관살", hanja: "鬼門關殺", location: locations[idx], category: "특수", effect: "예민한 감수성과 비범한 영적 세계를 의미합니다.", strength: "중" });
    }
  });

  return results;
}

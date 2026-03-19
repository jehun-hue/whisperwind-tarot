/**
 * ziweiEngine.ts
 * 자미두수(紫微斗數) 엔진 3단계: 사화, 대한, 유년, 삼방사정 및 해석 통합
 */

import { getNapeum } from "./napeum.ts";

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

/**
 * 1. 사화(四化) 계산
 */
export function calculateSihua(stem: string): Record<string, string> {
  const table: Record<string, string[]> = {
    "甲": ["염정", "파군", "무곡", "태양"],
    "乙": ["천기", "천량", "자미", "태음"],
    "丙": ["천동", "천기", "문창", "염정"],
    "丁": ["태음", "천동", "천기", "거문"],
    "戊": ["탐랑", "태음", "우필", "천기"],
    "己": ["무곡", "탐랑", "천량", "문곡"],
    "庚": ["태양", "무곡", "태음", "천동"],
    "辛": ["거문", "태양", "문곡", "문창"],
    "壬": ["천량", "자미", "좌보", "무곡"],
    "癸": ["파군", "거문", "태음", "탐랑"]
  };
  const res = table[stem] || ["", "", "", ""];
  return { "화록": res[0], "화권": res[1], "화과": res[2], "화기": res[3] };
}

/**
 * 2. 대한(大限) 계산
 */
export function calculateDahan(
  juNum: number,
  yearStem: string,
  gender: "male" | "female",
  mgBranch: string
) {
  const isYang = "甲丙戊庚壬".includes(yearStem);
  // 순행 조건: 양남음녀
  const isForward = (isYang && gender === "male") || (!isYang && gender === "female");
  
  const startIdx = BRANCHES.indexOf(mgBranch);
  const result = [];
  
  for (let i = 0; i < 12; i++) {
    const offset = isForward ? i : -i;
    const b = BRANCHES[(startIdx + offset + 24) % 12];
    const ageStart = juNum + (i * 10);
    result.push({
      period: `${ageStart}-${ageStart + 9}세`,
      branch: b,
      index: i
    });
  }
  return result;
}

/**
 * 3. 삼방사정(三方四正) 계산
 */
export function getSanbangSizheng(branch: string): string[] {
  const idx = BRANCHES.indexOf(branch);
  return [
    branch,
    BRANCHES[(idx + 6) % 12], // 대궁
    BRANCHES[(idx + 4) % 12], // 삼합1
    BRANCHES[(idx + 8) % 12]  // 삼합2
  ];
}

/**
 * 4. 명반 배치 로직 (기존 1, 2단계 포함)
 */
export function determineMingGong(lunarMonth: number, birthHourBranch: string): string {
  const hIdx = BRANCHES.indexOf(birthHourBranch);
  const targetIdx = (2 + (lunarMonth - 1) - hIdx + 12) % 12;
  return BRANCHES[targetIdx];
}
/**
 * 2. 신궁(身宮) 위치 결정
 * 생시에 따라 12궁 중 특정 궁과 겹치는 위치에 배치 (대만 정통 방식)
 * - 子/午: 명궁, 丑/未: 복덕궁, 寅/申: 관록궁
 * - 卯/酉: 천이궁, 辰/戌: 재백궁, 巳/亥: 부처궁
 * (참고: sajuplus.net에서는 戌(부처궁)로 표시될 수 있음, 학파 차이 가능)
 */
export function determineShenGong(birthHourBranch: string, palaceMap: Map<string, string>): string {
  const mapping: Record<string, string> = {
    "子": "명궁", "午": "명궁",
    "丑": "복덕궁", "未": "복덕궁",
    "寅": "관록궁", "申": "관록궁",
    "卯": "천이궁", "酉": "천이궁",
    "辰": "재백궁", "戌": "재백궁",
    "巳": "부처궁", "亥": "부처궁"
  };
  const targetPalaceName = mapping[birthHourBranch];
  
  // palaceMap에서 해당 이름을 가진 지지 찾기
  for (const [branch, name] of palaceMap.entries()) {
    if (name === targetPalaceName) return branch;
  }
  return "";
}

export function determineWuxingJu(yearStem: string, mingGongBranch: string): { name: string, number: number } {
  const startStemMap: Record<string, string> = { "甲": "丙", "己": "丙", "乙": "戊", "庚": "戊", "丙": "庚", "辛": "庚", "丁": "壬", "壬": "壬", "戊": "甲", "癸": "甲" };
  const startStem = startStemMap[yearStem] || "丙";
  const startIdx = STEMS.indexOf(startStem);
  const mgIdx = BRANCHES.indexOf(mingGongBranch);
  const distance = (mgIdx - 2 + 12) % 12;
  const mgStem = STEMS[(startIdx + distance) % 10];
  const napeum = getNapeum(mgStem, mingGongBranch);
  const juMap: Record<string, { name: string, number: number }> = {
    "水": { name: "水二局", number: 2 }, "木": { name: "木三局", number: 3 },
    "金": { name: "金四局", number: 4 }, "土": { name: "土五局", number: 5 }, "火": { name: "火六局", number: 6 }
  };
  return juMap[napeum.element] || { name: "未知局", number: 0 };
}

const ZIWEI_POSITION_TABLE: Record<number, Record<number, string>> = {
  2: { 1:"丑", 2:"寅", 3:"寅", 4:"卯", 5:"卯", 6:"辰", 7:"辰", 8:"巳", 9:"巳", 10:"午", 11:"午", 12:"未", 13:"未", 14:"申", 15:"申", 16:"酉", 17:"酉", 18:"戌", 19:"戌", 20:"亥", 21:"亥", 22:"子", 23:"子", 24:"丑", 25:"丑", 26:"寅", 27:"寅", 28:"卯", 29:"卯", 30:"辰" },
  3: { 1:"辰", 2:"丑", 3:"寅", 4:"寅", 5:"卯", 6:"卯", 7:"辰", 8:"辰", 9:"巳", 10:"巳", 11:"午", 12:"午", 13:"未", 14:"未", 15:"申", 16:"申", 17:"酉", 18:"酉", 19:"戌", 20:"戌", 21:"亥", 22:"亥", 23:"子", 24:"자", 25:"丑", 26:"丑", 27:"寅", 28:"寅", 29:"卯", 30:"卯" },
  4: { 1:"丑", 2:"辰", 3:"丑", 4:"寅", 5:"寅", 6:"卯", 7:"卯", 8:"辰", 9:"辰", 10:"巳", 11:"巳", 12:"午", 13:"午", 14:"未", 15:"未", 16:"申", 17:"申", 18:"酉", 19:"酉", 20:"戌", 21:"戌", 22:"亥", 23:"亥", 24:"子", 25:"子", 26:"丑", 27:"丑", 28:"寅", 29:"寅", 30:"卯" },
  5: { 1:"丑", 2:"未", 3:"辰", 4:"丑", 5:"寅", 6:"寅", 7:"卯", 8:"卯", 9:"辰", 10:"辰", 11:"巳", 12:"巳", 13:"午", 14:"午", 15:"未", 16:"未", 17:"申", 18:"申", 19:"酉", 20:"酉", 21:"戌", 22:"戌", 23:"亥", 24:"亥", 25:"子", 26:"자", 27:"丑", 28:"丑", 29:"寅", 30:"寅" },
  6: { 1:"丑", 2:"申", 3:"未", 4:"辰", 5:"丑", 6:"寅", 7:"寅", 8:"卯", 9:"卯", 10:"辰", 11:"辰", 12:"巳", 13:"巳", 14:"午", 15:"午", 16:"未", 17:"未", 18:"申", 19:"申", 20:"酉", 21:"酉", 22:"戌", 23:"戌", 24:"亥", 25:"亥", 26:"子", 27:"子", 28:"丑", 29:"丑", 30:"寅" }
};

export function placeAssistStars(lunarMonth: number, yearStem: string, birthHourBranch: string) {
  const mIdx = lunarMonth - 1;
  const hIdx = BRANCHES.indexOf(birthHourBranch);
  const stars: Record<string, string> = {
    "좌보": BRANCHES[(4 + mIdx) % 12], "우필": BRANCHES[(10 - mIdx + 12) % 12],
    "문창": BRANCHES[(10 - hIdx + 12) % 12], "문곡": BRANCHES[(4 + hIdx) % 12],
  };
  const km: Record<string, string[]> = { "甲":["丑","未"], "乙":["子","申"], "丙":["亥","酉"], "丁":["酉","亥"], "戊":["亥","酉"], "己":["酉","亥"], "庚":["未","丑"], "辛":["午","寅"], "壬":["卯","巳"], "癸":["卯","巳"] };
  const kv = km[yearStem] || ["",""];
  stars["천괴"] = kv[0]; stars["천월"] = kv[1];
  return stars;
}

export function placeKillStars(yearStem: string, yearBranch: string, birthHourBranch: string) {
  const hIdx = BRANCHES.indexOf(birthHourBranch);
  const lm: Record<string, string> = { "甲":"寅", "乙":"卯", "丙":"巳", "丁":"午", "戊":"巳", "己":"午", "庚":"申", "辛":"酉", "壬":"亥", "癸":"子" };
  const lukzun = lm[yearStem] || "寅";
  const lIdx = BRANCHES.indexOf(lukzun);
  const grp = ["寅午戌", "巳酉丑", "申子辰", "亥卯未"].findIndex(g => g.includes(yearBranch));
  const hs = ["丑", "卯", "寅", "酉"][grp];
  const ls = ["卯", "戌", "戌", "戌"][grp];
  return {
    "록존": lukzun, "경양": BRANCHES[(lIdx + 1) % 12], "타라": BRANCHES[(lIdx - 1 + 12) % 12],
    "지공": BRANCHES[(11 - hIdx + 12) % 12], "지겁": BRANCHES[(11 + hIdx) % 12],
    "화성": BRANCHES[(BRANCHES.indexOf(hs) + hIdx) % 12], "영성": BRANCHES[(BRANCHES.indexOf(ls) + hIdx) % 12],
    "천마": { "寅午戌":"申", "巳酉丑":"亥", "申子辰":"寅", "亥卯未":"巳" }[ ["寅午戌","巳酉丑","申子辰","亥卯未"].find(g => g.includes(yearBranch)) || "" ] || ""
  };
}

const BR_TABLE: Record<string, string[]> = {
  "자미": ["왕", "묘", "묘", "평", "묘", "득", "묘", "묘", "묘", "평", "묘", "득"],
  "천기": ["묘", "함", "왕", "묘", "함", "왕", "묘", "함", "왕", "묘", "함", "왕"],
  "태양": ["함", "불", "왕", "묘", "왕", "묘", "묘", "득", "평", "불", "함", "함"],
  "무곡": ["왕", "묘", "득", "평", "묘", "묘", "왕", "묘", "득", "묘", "묘", "평"],
  "천동": ["묘", "불", "평", "평", "함", "묘", "함", "불", "평", "평", "함", "묘"],
  "염정": ["함", "함", "묘", "평", "득", "왕", "함", "묘", "묘", "평", "득", "왕"],
  "천부": ["묘", "묘", "묘", "득", "묘", "묘", "묘", "묘", "묘", "득", "묘", "묘"],
  "태음": ["묘", "묘", "함", "함", "불", "함", "함", "불", "득", "왕", "묘", "묘"],
  "탐랑": ["묘", "함", "묘", "왕", "왕", "평", "묘", "함", "묘", "왕", "왕", "평"],
  "거문": ["왕", "묘", "묘", "묘", "함", "평", "왕", "묘", "묘", "묘", "함", "평"],
  "천상": ["득", "묘", "묘", "평", "묘", "묘", "득", "묘", "묘", "평", "묘", "묘"],
  "천량": ["묘", "묘", "평", "묘", "왕", "묘", "묘", "묘", "평", "묘", "왕", "묘"],
  "칠살": ["왕", "묘", "묘", "왕", "묘", "평", "왕", "묘", "묘", "왕", "묘", "평"],
  "파군": ["왕", "묘", "함", "평", "묘", "득", "왕", "묘", "함", "평", "묘", "득"]
};

/**
 * 5. 해석 메타데이터
 */
const PALACE_MEANINGS: Record<string, any> = {
  "명궁": { domain: "자아/성격", question: "나는 어떤 사람인가?" },
  "형제궁": { domain: "형제/동료", question: "대인 관계의 질은?" },
  "부처궁": { domain: "배우자/연인", question: "애정운과 파트너십은?" },
  "재백궁": { domain: "재물/소득", question: "부를 쌓을 수 있는가?" },
  "관록궁": { domain: "직업/사회공헌", question: "사회적 지위는?" }
};

const STAR_MEANINGS: Record<string, any> = {
  "자미": { keywords: ["리더십", "자존심"], positive: "지도력", negative: "고집" },
  "천기": { keywords: ["지혜", "변화"], positive: "기획력", negative: "변덕" },
  "태양": { keywords: ["명예", "헌신"], positive: "공명정대", negative: "허세" }
};

/**
 * 6. 결과 통합 및 확장
 */
export interface ZiweiResult {
  mingGong: string;
  shenGong: string;
  wuxingJu: { name: string, number: number };
  ziweiPosition: string;
  birthSihua: Record<string, string>;
  dahan: any[];
  liunian: any;
  palaces: Record<string, any>;
}

export function calculateZiwei(
  yearStem: string,
  yearBranch: string,
  lunarMonth: number,
  lunarDay: number,
  birthHourBranch: string,
  gender: "male" | "female",
  currentYear: number = 2026
): ZiweiResult {
  const mg = determineMingGong(lunarMonth, birthHourBranch);
  const ju = determineWuxingJu(yearStem, mg);
  const zwPos = (ZIWEI_POSITION_TABLE[ju.number] || {})[lunarDay] || "寅";
  
  const mainStarMap = new Map<string, string[]>();
  const zIdx = BRANCHES.indexOf(zwPos);
  [{n:"자미",o:0},{n:"천기",o:-1},{n:"태양",o:-3},{n:"무곡",o:-4},{n:"천동",o:-5},{n:"염정",o:-8}].forEach(s => {
    const p = BRANCHES[(zIdx + s.o + 24) % 12];
    if(!mainStarMap.has(p)) mainStarMap.set(p, []);
    mainStarMap.get(p)!.push(s.n);
  });
  const fIdx = (4 - zIdx + 12) % 12;
  [{n:"천부",o:0},{n:"태음",o:1},{n:"탐랑",o:2},{n:"거문",o:3},{n:"천상",o:4},{n:"천량",o:5},{n:"칠살",o:6},{n:"파군",o:10}].forEach(s => {
    const p = BRANCHES[(fIdx + s.o) % 12];
    if(!mainStarMap.has(p)) mainStarMap.set(p, []);
    if(!mainStarMap.get(p)!.includes(s.n)) mainStarMap.get(p)!.push(s.n);
  });

  const assist = placeAssistStars(lunarMonth, yearStem, birthHourBranch);
  const kill = placeKillStars(yearStem, yearBranch, birthHourBranch);
  const birthSihua = calculateSihua(yearStem);
  const dahanList = calculateDahan(ju.number, yearStem, gender, mg);
  
  const liunianBranch = BRANCHES[(currentYear - 4) % 12]; // 2024=辰, 2026=午
  const liunianStem = STEMS[(currentYear - 4) % 10]; // 2026=丙
  const liunianSihua = calculateSihua(liunianStem);

  const mgStart = BRANCHES.indexOf(mg);
  const pNames = ["명궁", "형제궁", "부처궁", "자녀궁", "재백궁", "질액궁", "천이궁", "노복궁", "관록궁", "전택궁", "복덕궁", "부모궁"];
  const palaceMap = new Map<string, string>();
  pNames.forEach((n, i) => palaceMap.set(BRANCHES[(mgStart - i + 12) % 12], n));

  const sg = determineShenGong(birthHourBranch, palaceMap);

  const outPalaces: Record<string, any> = {};
  
  BRANCHES.forEach(b => {
    const bIdx = BRANCHES.indexOf(b);
    const pName = pNames[(mgStart - bIdx + 12) % 12];
    const mainStars = (mainStarMap.get(b) || []).map(s => ({ name: s, brightness: (BR_TABLE[s] || [])[bIdx] }));
    const aStars = Object.entries(assist).filter(([n, pos]) => pos === b).map(([n]) => n);
    const kStars = Object.entries(kill).filter(([n, pos]) => pos === b).map(([n]) => n);
    
    outPalaces[b] = {
      name: pName,
      mainStars,
      assistStars: aStars,
      killStars: kStars,
      sanbang: getSanbangSizheng(b),
      meaning: PALACE_MEANINGS[pName] || {}
    };
  });

  return {
    mingGong: mg,
    shenGong: sg,
    wuxingJu: ju,
    ziweiPosition: zwPos,
    birthSihua,
    dahan: dahanList,
    liunian: { year: currentYear, stem: liunianStem, branch: liunianBranch, sihua: liunianSihua },
    palaces: outPalaces
  };
}

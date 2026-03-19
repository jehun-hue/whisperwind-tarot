/**
 * ziweiEngine.ts
 * 자미두수(紫微斗數) 엔진 2단계: 보좌성, 살성, 별의 밝기(묘왕평함) 추가
 */

import { getNapeum } from "./napeum.ts";

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

/**
 * 1. 명궁(命宮) 위치 결정
 */
export function determineMingGong(lunarMonth: number, birthHourBranch: string): string {
  const hIdx = BRANCHES.indexOf(birthHourBranch);
  const targetIdx = (2 + (lunarMonth - 1) - hIdx + 12) % 12;
  return BRANCHES[targetIdx];
}

/**
 * 2. 신궁(身宮) 위치 결정
 */
export function determineShenGong(lunarMonth: number, birthHourBranch: string): string {
  const hIdx = BRANCHES.indexOf(birthHourBranch);
  const targetIdx = (2 + (lunarMonth - 1) + hIdx) % 12;
  return BRANCHES[targetIdx];
}

/**
 * 3. 오행국(五行局) 결정
 */
export function determineWuxingJu(yearStem: string, mingGongBranch: string): { name: string, number: number } {
  const startStemMap: Record<string, string> = { "甲": "丙", "己": "丙", "乙": "戊", "庚": "戊", "丙": "庚", "辛": "庚", "丁": "壬", "壬": "壬", "戊": "甲", "癸": "甲" };
  const startStem = startStemMap[yearStem];
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

/**
 * 4. 자미성 위치 및 14주성 배치
 */
const ZIWEI_POSITION_TABLE: Record<number, Record<number, string>> = {
  2: { 1:"丑", 2:"寅", 3:"寅", 4:"卯", 5:"卯", 6:"辰", 7:"辰", 8:"巳", 9:"巳", 10:"午", 11:"午", 12:"未", 13:"未", 14:"申", 15:"申", 16:"酉", 17:"酉", 18:"戌", 19:"戌", 20:"亥", 21:"亥", 22:"子", 23:"子", 24:"丑", 25:"丑", 26:"寅", 27:"寅", 28:"卯", 29:"卯", 30:"辰" },
  3: { 1:"辰", 2:"丑", 3:"寅", 4:"寅", 5:"卯", 6:"卯", 7:"辰", 8:"辰", 9:"巳", 10:"巳", 11:"午", 12:"午", 13:"未", 14:"未", 15:"申", 16:"申", 17:"酉", 18:"酉", 19:"戌", 20:"戌", 21:"亥", 22:"亥", 23:"子", 24:"子", 25:"丑", 26:"丑", 27:"寅", 28:"寅", 29:"卯", 30:"卯" },
  4: { 1:"丑", 2:"辰", 3:"丑", 4:"寅", 5:"寅", 6:"卯", 7:"卯", 8:"辰", 9:"辰", 10:"巳", 11:"巳", 12:"午", 13:"午", 14:"未", 15:"未", 16:"申", 17:"申", 18:"酉", 19:"酉", 20:"戌", 21:"戌", 22:"亥", 23:"亥", 24:"子", 25:"子", 26:"丑", 27:"丑", 28:"寅", 29:"寅", 30:"卯" },
  5: { 1:"丑", 2:"未", 3:"辰", 4:"丑", 5:"寅", 6:"寅", 7:"卯", 8:"卯", 9:"辰", 10:"辰", 11:"巳", 12:"巳", 13:"午", 14:"午", 15:"未", 16:"未", 17:"申", 18:"申", 19:"酉", 20:"酉", 21:"戌", 22:"戌", 23:"亥", 24:"亥", 25:"子", 26:"子", 27:"丑", 28:"丑", 29:"寅", 30:"寅" },
  6: { 1:"丑", 2:"申", 3:"未", 4:"辰", 5:"丑", 6:"寅", 7:"寅", 8:"卯", 9:"卯", 10:"辰", 11:"辰", 12:"巳", 13:"巳", 14:"午", 15:"午", 16:"未", 17:"未", 18:"申", 19:"申", 20:"酉", 21:"酉", 22:"戌", 23:"戌", 24:"亥", 25:"亥", 26:"子", 27:"子", 28:"丑", 29:"丑", 30:"寅" }
};

/**
 * 5. 보좌성(輔佐星) 배치
 */
export function placeAssistStars(lunarMonth: number, yearStem: string, birthHourBranch: string) {
  const mIdx = lunarMonth - 1;
  const hIdx = BRANCHES.indexOf(birthHourBranch);
  
  const stars: Record<string, string> = {
    "좌보": BRANCHES[(4 + mIdx) % 12], // 辰(4)에서 순행
    "우필": BRANCHES[(10 - mIdx + 12) % 12], // 戌(10)에서 역행
    "문창": BRANCHES[(10 - hIdx + 12) % 12], // 戌(10)에서 역행
    "문곡": BRANCHES[(4 + hIdx) % 12], // 辰(4)에서 순행
  };

  const kuiYueMap: Record<string, [string, string]> = {
    "甲": ["丑", "未"], "乙": ["子", "申"], "丙": ["亥", "酉"], "丁": ["酉", "亥"],
    "戊": ["亥", "酉"], "己": ["酉", "亥"], "庚": ["未", "丑"], "辛": ["午", "寅"],
    "壬": ["卯", "巳"], "癸": ["卯", "巳"]
  };
  const [kui, yue] = kuiYueMap[yearStem] || ["", ""];
  stars["천괴"] = kui;
  stars["천월"] = yue;

  return stars;
}

/**
 * 6. 살성(煞星) 및 특수성 배치
 */
export function placeKillStars(yearStem: string, yearBranch: string, birthHourBranch: string) {
  const hIdx = BRANCHES.indexOf(birthHourBranch);
  const lukzunMap: Record<string, string> = {
    "甲": "寅", "乙": "卯", "丙": "巳", "丁": "午", "戊": "巳", "己": "午", "庚": "申", "辛": "酉", "壬": "亥", "癸": "子"
  };
  const lukzun = lukzunMap[yearStem] || "寅";
  const lIdx = BRANCHES.indexOf(lukzun);

  const groupIdx = ["寅午戌", "巳酉丑", "申子辰", "亥卯未"].findIndex(g => g.includes(yearBranch));
  const huoStart = ["丑", "卯", "寅", "酉"][groupIdx];
  const lingStart = ["卯", "戌", "戌", "戌"][groupIdx];

  const stars: Record<string, string> = {
    "록존": lukzun,
    "경양": BRANCHES[(lIdx + 1) % 12],
    "타라": BRANCHES[(lIdx - 1 + 12) % 12],
    "지공": BRANCHES[(11 - hIdx + 12) % 12], // 亥(11)에서 역행
    "지겁": BRANCHES[(11 + hIdx) % 12], // 亥(11)에서 순행
    "화성": BRANCHES[(BRANCHES.indexOf(huoStart) + hIdx) % 12],
    "영성": BRANCHES[(BRANCHES.indexOf(lingStart) + hIdx) % 12],
  };

  const tianmaMap: Record<string, string> = {
    "寅": "申", "午": "申", "戌": "申",
    "巳": "亥", "酉": "亥", "丑": "亥",
    "申": "寅", "子": "寅", "辰": "寅",
    "亥": "巳", "卯": "巳", "未": "巳"
  };
  stars["천마"] = tianmaMap[yearBranch] || "";

  return stars;
}

/**
 * 7. 별의 밝기(묘왕평함) 판정
 */
const BRIGHTNESS_TABLE: Record<string, string[]> = {
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

export function getStarBrightness(star: string, branch: string): string {
  const bIdx = BRANCHES.indexOf(branch);
  const list = BRIGHTNESS_TABLE[star];
  return list ? list[bIdx] : "";
}

/**
 * 통합 결과 인터페이스 및 함수
 */
export interface ZiweiResult {
  mingGong: string;
  shenGong: string;
  wuxingJu: { name: string, number: number };
  ziweiPosition: string;
  palaces: Record<string, string>;
  stars: Record<string, string[]>;
  assistStars: Record<string, string>;
  killStars: Record<string, string>;
  specialStars: Record<string, string>;
  brightness: Record<string, { star: string, level: string }[]>;
}

export function calculateZiwei(
  yearStem: string,
  yearBranch: string,
  lunarMonth: number,
  lunarDay: number,
  birthHourBranch: string
): ZiweiResult {
  const mg = determineMingGong(lunarMonth, birthHourBranch);
  const sg = determineShenGong(lunarMonth, birthHourBranch);
  const ju = determineWuxingJu(yearStem, mg);
  const zwPos = determineZiweiPosition(ju.number, lunarDay);
  
  const mainStarMap = new Map<string, string[]>();
  const zIdx = BRANCHES.indexOf(zwPos);
  
  const ziweiSeries = [{n:"자미",o:0},{n:"천기",o:-1},{n:"태양",o:-3},{n:"무곡",o:-4},{n:"천동",o:-5},{n:"염정",o:-8}];
  ziweiSeries.forEach(s => {
    const p = BRANCHES[(zIdx + s.o + 24) % 12];
    if(!mainStarMap.has(p)) mainStarMap.set(p, []);
    mainStarMap.get(p)!.push(s.n);
  });
  
  const fIdx = (4 - zIdx + 12) % 12;
  const tianfuSeries = [{n:"천부",o:0},{n:"태음",o:1},{n:"탐랑",o:2},{n:"거문",o:3},{n:"천상",o:4},{n:"천량",o:5},{n:"칠살",o:6},{n:"파군",o:10}];
  tianfuSeries.forEach(s => {
    const p = BRANCHES[(fIdx + s.o) % 12];
    if(!mainStarMap.has(p)) mainStarMap.set(p, []);
    if(!mainStarMap.get(p)!.includes(s.n)) mainStarMap.get(p)!.push(s.n);
  });

  const assistStars = placeAssistStars(lunarMonth, yearStem, birthHourBranch);
  const killSpecial = placeKillStars(yearStem, yearBranch, birthHourBranch);
  
  const palaceMap = new Map<string, string>();
  const mgStartIdx = BRANCHES.indexOf(mg);
  const palaceNames = ["명궁", "형제궁", "부처궁", "자녀궁", "재백궁", "질액궁", "천이궁", "노복궁", "관록궁", "전택궁", "복덕궁", "부모궁"];
  palaceNames.forEach((n, i) => palaceMap.set(BRANCHES[(mgStartIdx + i) % 12], n));

  const starsOut: Record<string, string[]> = {};
  const brightnessOut: Record<string, { star: string, level: string }[]> = {};
  
  BRANCHES.forEach(b => {
    const list: string[] = mainStarMap.get(b) || [];
    starsOut[b] = list;
    brightnessOut[b] = list.map(s => ({ star: s, level: getStarBrightness(s, b) }));
  });

  return {
    mingGong: mg,
    shenGong: sg,
    wuxingJu: ju,
    ziweiPosition: zwPos,
    palaces: Object.fromEntries(palaceMap),
    stars: starsOut,
    assistStars: assistStars,
    killStars: {
      "경양": killSpecial.경양, "타라": killSpecial.타라, "화성": killSpecial.화성,
      "영성": killSpecial.영성, "지공": killSpecial.지공, "지겁": killSpecial.지겁
    },
    specialStars: {
      "록존": killSpecial.록존, "천마": killSpecial.천마
    },
    brightness: brightnessOut
  };
}

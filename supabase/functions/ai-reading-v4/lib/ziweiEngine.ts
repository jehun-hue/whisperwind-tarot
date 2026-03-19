/**
 * ziweiEngine.ts
 * 자미두수(紫微斗數) 엔진 3단계: 사화, 대한, 유년, 삼방사정 및 해석 통합
 */

import { getNapeum } from "./napeum.ts";

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

export interface ZiweiResult {
  lifePalace: string;
  bodyPalace: string;
  fiveElementFrame: string;
  lunarMonth: number;
  lunarDay: number;
  hourBranch: string;
  majorStars: { name: string; palace: string; brightness: string }[];
  siHua: Record<string, string>;
  palaces: { name: string; branch: string; majorStars: any[]; auxiliaryStars: any[] }[];
  mingGong: string;
  shenGong: string;
  wuxingJu: { name: string, number: number };
}

export function determineMingGong(lunarMonth: number, birthHourBranch: string): string {
  const hIdx = BRANCHES.indexOf(birthHourBranch);
  const targetIdx = (2 + (lunarMonth - 1) - hIdx + 12) % 12;
  return BRANCHES[targetIdx];
}

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
  4: { 1:"丑", 2:"辰", 3:"丑", 4:"寅", 5:"寅", 6:"卯", 7:"卯", 8:"辰", 9:"辰", 10:"巳", 11:"巳", 12:"午", 13:"午", 14:"未", 15:"未", 16:"申", 17:"申", 18:"酉", 19:"酉", 20:"戌", 21:"戌", 22:"亥", 23:"亥", 24:"子", 25:"자", 26:"丑", 27:"丑", 28:"寅", 29:"寅", 30:"卯" },
  5: { 1:"丑", 2:"未", 3:"辰", 4:"丑", 5:"寅", 6:"寅", 7:"卯", 8:"卯", 9:"辰", 10:"辰", 11:"巳", 12:"巳", 13:"午", 14:"午", 15:"未", 16:"未", 17:"申", 18:"申", 19:"酉", 20:"酉", 21:"戌", 22:"戌", 23:"亥", 24:"亥", 25:"子", 26:"자", 27:"丑", 28:"丑", 29:"寅", 30:"寅" },
  6: { 1:"丑", 2:"申", 3:"未", 4:"辰", 5:"丑", 6:"寅", 7:"寅", 8:"卯", 9:"卯", 10:"辰", 11:"辰", 12:"巳", 13:"巳", 14:"午", 15:"午", 16:"未", 17:"未", 18:"申", 19:"申", 20:"酉", 21:"酉", 22:"戌", 23:"戌", 24:"亥", 25:"亥", 26:"子", 27:"자", 28:"丑", 29:"丑", 30:"寅" }
};

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

export function calculateZiwei(
  year: number, month: number, day: number, hour: number, minute: number,
  gender: "male" | "female"
): ZiweiResult {
  const dateObj = new Date(year, month - 1, day);
  const formatter = new Intl.DateTimeFormat('ko-KR-u-ca-chinese', { day: 'numeric', month: 'numeric', year: 'numeric' });
  const parts = formatter.formatToParts(dateObj);
  let lunarMonth = 1;
  let lunarDay = 1;
  for (const part of parts) {
    if (part.type === 'month') lunarMonth = parseInt(part.value.replace(/\D/g, '')) || 1;
    if (part.type === 'day') lunarDay = parseInt(part.value.replace(/\D/g, '')) || 1;
  }

  const yearStem = STEMS[(year - 4) % 10];
  const hourIdx = Math.floor(((hour + 1) % 24) / 2);
  const birthHourBranch = BRANCHES[hourIdx];

  const lifePalace = determineMingGong(lunarMonth, birthHourBranch);
  const wuxingJu = determineWuxingJu(yearStem, lifePalace);
  const zwPos = (ZIWEI_POSITION_TABLE[wuxingJu.number] || {})[lunarDay] || "寅";

  const majorStars: any[] = [];
  const zIdx = BRANCHES.indexOf(zwPos);
  
  // Ziwei Star Group (Forward)
  [{n:"자미",o:0},{n:"천기",o:-1},{n:"태양",o:-3},{n:"무곡",o:-4},{n:"천동",o:-5},{n:"염정",o:-8}].forEach(s => {
    const p = BRANCHES[(zIdx + s.o + 24) % 12];
    majorStars.push({ name: s.n, palace: p, brightness: (BR_TABLE[s.n] || [])[BRANCHES.indexOf(p)] });
  });
  
  // Tianfu Star Group (Reverse from Ziwei)
  // Mapping Ziwei (zIdx) to Tianfu (fIdx): fIdx = (4 - zIdx + 12) % 12 (Simplified traditional rule)
  const fIdx = (4 - zIdx + 12) % 12;
  [{n:"천부",o:0},{n:"태음",o:1},{n:"탐랑",o:2},{n:"거문",o:3},{n:"천상",o:4},{n:"천량",o:5},{n:"칠살",o:6},{n:"파군",o:10}].forEach(s => {
    const p = BRANCHES[(fIdx + s.o) % 12];
    majorStars.push({ name: s.n, palace: p, brightness: (BR_TABLE[s.n] || [])[BRANCHES.indexOf(p)] });
  });

  const sihuaTable: Record<string, string[]> = {
    "甲": ["염정", "파군", "무곡", "태양"], "乙": ["천기", "천량", "자미", "태음"], "丙": ["천동", "천기", "문창", "염정"],
    "丁": ["태음", "천동", "천기", "거문"], "戊": ["탐랑", "태음", "우필", "천기"], "己": ["무곡", "탐랑", "천량", "문곡"],
    "庚": ["태양", "무곡", "태음", "천동"], "辛": ["거문", "태양", "문곡", "문창"], "壬": ["천량", "자미", "좌보", "무곡"],
    "癸": ["파군", "거문", "태음", "탐랑"]
  };
  const sh = sihuaTable[yearStem] || ["", "", "", ""];
  const siHua = { "화록": sh[0], "화권": sh[1], "화과": sh[2], "화기": sh[3] };

  const mgStart = BRANCHES.indexOf(lifePalace);
  const pNames = ["명궁", "형제궁", "부처궁", "자녀궁", "재백궁", "질액궁", "천이궁", "노복궁", "관록궁", "전택궁", "복덕궁", "부모궁"];
  const palaceMap = new Map<string, string>();
  pNames.forEach((n, i) => palaceMap.set(BRANCHES[(mgStart - i + 12) % 12], n));
  const bodyPalace = determineShenGong(birthHourBranch, palaceMap);

  const palaces = BRANCHES.map(b => ({
    branch: b,
    name: palaceMap.get(b) || "",
    majorStars: majorStars.filter(s => s.palace === b),
    auxiliaryStars: []
  }));

  return {
    lifePalace,
    bodyPalace,
    fiveElementFrame: wuxingJu.name,
    lunarMonth,
    lunarDay,
    hourBranch: birthHourBranch,
    majorStars,
    siHua,
    palaces,
    mingGong: lifePalace,
    shenGong: bodyPalace,
    wuxingJu
  };
}

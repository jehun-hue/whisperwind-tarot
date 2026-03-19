/**
 * ziweiEngine.ts
 * 자미두수(紫微斗數) 엔진 1단계: 명반 기초 구성
 * 명궁, 신궁, 오행국, 14주성 배치 로직 구현
 */

import { getNapeum } from "./napeum.ts";

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

/**
 * 1. 명궁(命宮) 위치 결정
 * 공식: 寅궁에서 시작하여 생월만큼 순행, 생시 인덱스만큼 역행
 */
export function determineMingGong(lunarMonth: number, birthHourBranch: string): string {
  const hIdx = BRANCHES.indexOf(birthHourBranch);
  // 寅(2) + (month - 1) - hourIdx
  const targetIdx = (2 + (lunarMonth - 1) - hIdx + 12) % 12;
  return BRANCHES[targetIdx];
}

/**
 * 2. 신궁(身宮) 위치 결정
 * 공식: 寅궁에서 시작하여 생월만큼 순행, 생시 인덱스만큼 순행
 */
export function determineShenGong(lunarMonth: number, birthHourBranch: string): string {
  const hIdx = BRANCHES.indexOf(birthHourBranch);
  // 寅(2) + (month - 1) + hourIdx
  const targetIdx = (2 + (lunarMonth - 1) + hIdx) % 12;
  return BRANCHES[targetIdx];
}

/**
 * 3. 오행국(五行局) 결정
 * 명궁의 천간과 지지의 납음오행으로 결정
 */
export function determineWuxingJu(yearStem: string, mingGongBranch: string): { name: string, number: number } {
  // 寅궁 천간 시작점 계산 (년상기인법)
  // 甲己 -> 丙, 乙庚 -> 戊, 丙辛 -> 庚, 丁壬 -> 壬, 戊癸 -> 甲
  const startStemMap: Record<string, string> = { "甲": "丙", "己": "丙", "乙": "戊", "庚": "戊", "丙": "庚", "辛": "庚", "丁": "壬", "壬": "壬", "戊": "甲", "癸": "甲" };
  const startStem = startStemMap[yearStem];
  const startIdx = STEMS.indexOf(startStem);
  
  // 寅(2)궁부터 명궁까지의 거리
  const mgIdx = BRANCHES.indexOf(mingGongBranch);
  const distance = (mgIdx - 2 + 12) % 12;
  
  const mgStem = STEMS[(startIdx + distance) % 10];
  const napeum = getNapeum(mgStem, mingGongBranch);
  
  const juMap: Record<string, { name: string, number: number }> = {
    "水": { name: "水二局", number: 2 },
    "木": { name: "木三局", number: 3 },
    "金": { name: "金四局", number: 4 },
    "土": { name: "土五局", number: 5 },
    "火": { name: "火六局", number: 6 }
  };
  
  return juMap[napeum.element] || { name: "未知局", number: 0 };
}

/**
 * 4. 자미성(紫微星) 위치 결정
 * 오행국과 음력 생일 기준
 */
const ZIWEI_POSITION_TABLE: Record<number, Record<number, string>> = {
  2: { 1:"丑", 2:"寅", 3:"寅", 4:"卯", 5:"卯", 6:"辰", 7:"辰", 8:"巳", 9:"巳", 10:"午", 11:"午", 12:"未", 13:"未", 14:"申", 15:"申", 16:"酉", 17:"酉", 18:"戌", 19:"戌", 20:"亥", 21:"亥", 22:"子", 23:"子", 24:"丑", 25:"丑", 26:"寅", 27:"寅", 28:"卯", 29:"卯", 30:"辰" },
  3: { 1:"辰", 2:"丑", 3:"寅", 4:"寅", 5:"卯", 6:"卯", 7:"辰", 8:"辰", 9:"巳", 10:"巳", 11:"午", 12:"午", 13:"未", 14:"未", 15:"申", 16:"申", 17:"酉", 18:"酉", 19:"戌", 20:"戌", 21:"亥", 22:"亥", 23:"子", 24:"子", 25:"丑", 26:"丑", 27:"寅", 28:"寅", 29:"卯", 30:"卯" },
  4: { 1:"丑", 2:"辰", 3:"丑", 4:"寅", 5:"寅", 6:"卯", 7:"卯", 8:"辰", 9:"辰", 10:"巳", 11:"巳", 12:"午", 13:"午", 14:"未", 15:"未", 16:"申", 17:"申", 18:"酉", 19:"酉", 20:"戌", 21:"戌", 22:"亥", 23:"亥", 24:"子", 25:"子", 26:"丑", 27:"丑", 28:"寅", 29:"寅", 30:"卯" },
  5: { 1:"丑", 2:"未", 3:"辰", 4:"丑", 5:"寅", 6:"寅", 7:"卯", 8:"卯", 9:"辰", 10:"辰", 11:"巳", 12:"巳", 13:"午", 14:"午", 15:"未", 16:"未", 17:"申", 18:"申", 19:"酉", 20:"酉", 21:"戌", 22:"戌", 23:"亥", 24:"亥", 25:"子", 26:"子", 27:"丑", 28:"丑", 29:"寅", 30:"寅" },
  6: { 1:"丑", 2:"申", 3:"未", 4:"辰", 5:"丑", 6:"寅", 7:"寅", 8:"卯", 9:"卯", 10:"辰", 11:"辰", 12:"巳", 13:"巳", 14:"午", 15:"午", 16:"未", 17:"未", 18:"申", 19:"申", 20:"酉", 21:"酉", 22:"戌", 23:"戌", 24:"亥", 25:"亥", 26:"子", 27:"子", 28:"丑", 29:"丑", 30:"寅" }
};

export function determineZiweiPosition(juNumber: number, lunarDay: number): string {
  const table = ZIWEI_POSITION_TABLE[juNumber];
  return table?.[lunarDay] || "寅";
}

/**
 * 5. 14주성 배치
 */
export function placeMainStars(ziweiPos: string): Map<string, string[]> {
  const starMap = new Map<string, string[]>();
  const zIdx = BRANCHES.indexOf(ziweiPos);
  
  // 자미 계열 (역행)
  const ziweiSeries = [
    { name: "자미", offset: 0 },
    { name: "천기", offset: -1 },
    { name: "태양", offset: -3 },
    { name: "무곡", offset: -4 },
    { name: "천동", offset: -5 },
    { name: "염정", offset: -8 }
  ];
  
  ziweiSeries.forEach(s => {
    const pos = BRANCHES[(zIdx + s.offset + 24) % 12];
    if (!starMap.has(pos)) starMap.set(pos, []);
    starMap.get(pos)!.push(s.name);
  });
  
  // 천부 계열 (순행, 자미와 寅-子 축 대칭)
  const fIdx = (4 - zIdx + 12) % 12; // 寅(2) 기준 대칭: fIdx = 2*2 - zIdx
  const tianfuSeries = [
    { name: "천부", offset: 0 },
    { name: "태음", offset: 1 },
    { name: "탐랑", offset: 2 },
    { name: "거문", offset: 3 },
    { name: "천상", offset: 4 },
    { name: "천량", offset: 5 },
    { name: "칠살", offset: 6 },
    { name: "파군", offset: 10 } // 자미에서 순행 4궁 = 천부에서 순행 10궁 (또는 -2)
  ];
  
  tianfuSeries.forEach(s => {
    const pos = BRANCHES[(fIdx + s.offset) % 12];
    if (!starMap.has(pos)) starMap.set(pos, []);
    // 중복 제거 (파군 등이 이미 자미계열과 겹칠 수 있음)
    if (!starMap.get(pos)!.includes(s.name)) {
      starMap.get(pos)!.push(s.name);
    }
  });
  
  return starMap;
}

/**
 * 6. 12궁 이름 배치
 */
export function assignTwelvePalaces(mgBranch: string): Map<string, string> {
  const names = ["명궁", "형제궁", "부처궁", "자녀궁", "재백궁", "질액궁", "천이궁", "노복궁", "관록궁", "전택궁", "복덕궁", "부모궁"];
  const palaceMap = new Map<string, string>();
  const startIdx = BRANCHES.indexOf(mgBranch);
  
  names.forEach((name, i) => {
    const pos = BRANCHES[(startIdx + i) % 12];
    palaceMap.set(pos, name);
  });
  return palaceMap;
}

/**
 * 7. 결과 통합
 */
export interface ZiweiResult {
  mingGong: string;
  shenGong: string;
  wuxingJu: { name: string, number: number };
  ziweiPosition: string;
  tianfuPosition: string;
  palaces: Record<string, string>;
  stars: Record<string, string[]>;
}

export function calculateZiwei(
  yearStem: string,
  lunarMonth: number,
  lunarDay: number,
  birthHourBranch: string
): ZiweiResult {
  const mg = determineMingGong(lunarMonth, birthHourBranch);
  const sg = determineShenGong(lunarMonth, birthHourBranch);
  const ju = determineWuxingJu(yearStem, mg);
  const zw = determineZiweiPosition(ju.number, lunarDay);
  const tf = BRANCHES[(4 - BRANCHES.indexOf(zw) + 12) % 12];
  
  const starMap = placeMainStars(zw);
  const palaceMap = assignTwelvePalaces(mg);
  
  const palaces: Record<string, string> = {};
  const stars: Record<string, string[]> = {};
  
  BRANCHES.forEach(b => {
    palaces[b] = palaceMap.get(b) || "";
    stars[b] = starMap.get(b) || [];
  });
  
  return {
    mingGong: mg,
    shenGong: sg,
    wuxingJu: ju,
    ziweiPosition: zw,
    tianfuPosition: tf,
    palaces,
    stars
  };
}

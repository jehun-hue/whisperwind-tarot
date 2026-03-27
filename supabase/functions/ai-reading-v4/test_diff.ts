import { calculateSaju } from "./lib/sajuEngine.ts";

const testCases = [
  { date: [1985, 8, 8, 15, 0], expectedDay: "己卯", label: "Case 1" },
  { date: [2000, 2, 4, 9, 30], expectedDay: "壬辰", label: "Case 2" },
  { date: [1990, 3, 15, 23, 0], expectedDay: "庚辰", label: "Case 3", mode: 'keep_day' },
  { date: [1991, 12, 31, 11, 30], expectedDay: "乙亥", label: "Case 4" },
  { date: [1984, 5, 10, 13, 30], expectedDay: "甲辰", label: "Case 5" },
  { date: [1988, 11, 20, 5, 30], expectedDay: "己卯", label: "Case 6" },
  { date: [1987, 7, 17, 14, 0], expectedDay: "丁卯", label: "Case 7" },
  { date: [1986, 1, 8, 2, 30], expectedDay: "壬子", label: "Case 8" },
  { date: [1993, 9, 25, 19, 30], expectedDay: "己酉", label: "Case 9" },
];

const GANJI = [
  "甲子", "乙丑", "丙寅", "丁卯", "戊辰", "己巳", "庚午", "辛未", "壬申", "癸酉",
  "甲戌", "乙亥", "丙子", "丁丑", "戊寅", "己卯", "庚辰", "辛巳", "壬午", "癸未",
  "甲申", "乙酉", "丙戌", "丁亥", "戊子", "己丑", "庚寅", "辛卯", "壬辰", "癸巳",
  "甲午", "乙未", "丙申", "丁酉", "戊戌", "己亥", "庚子", "辛丑", "壬寅", "癸卯",
  "甲辰", "乙巳", "丙午", "丁未", "戊申", "己酉", "庚戌", "辛亥", "壬子", "癸丑",
  "甲寅", "乙卯", "丙辰", "丁巳", "戊午", "己未", "庚申", "辛酉", "壬戌", "癸亥"
];

for (const tc of testCases) {
  const [y, m, d, h, min] = tc.date;
  const result = calculateSaju(y, m, d, h, min, 'M', 127.5, true, tc.mode || 'keep_day');
  const dP = result.day;
  const actual = `${dP.stem}${dP.branch}`;
  const actualIdx = GANJI.indexOf(actual);
  const expectedIdx = GANJI.indexOf(tc.expectedDay);
  const diff = (actualIdx - expectedIdx + 60) % 60;
  
  console.log(`${tc.label}: Actual=${actual}(${actualIdx}), Expected=${tc.expectedDay}(${expectedIdx}), Diff=${diff}`);
}

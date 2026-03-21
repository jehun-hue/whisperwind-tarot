
function calculateJulianDay(date) {
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const dayFraction = (hour + minute / 60 + second / 3600) / 24;
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + dayFraction + B - 1524.5;
}

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

function getPillar(idx) {
  return STEMS[idx % 10] + BRANCHES[idx % 12];
}

const tests = [
  { name: "1987-08-04 06:30 UTC (15:30 KST with DST)", date: new Date(Date.UTC(1987, 7, 4, 6, 30)), target: "丁卯" },
  { name: "2000-11-13 15:00 UTC (00:00 KST next day)", date: new Date(Date.UTC(2000, 10, 13, 15, 0)), target: "乙亥" }
];

console.log("=== Pillar Calibration Test ===");
tests.forEach(t => {
  const jd = calculateJulianDay(t.date);
  const idx = Math.floor(jd + 0.5 + 49) % 60;
  console.log(`${t.name}: JD=${jd}, Index=${idx}, Pillar=${getPillar(idx)} (Target: ${t.target})`);
});

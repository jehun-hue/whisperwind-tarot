
const d1 = new Date(Date.UTC(1970, 0, 1));
const d2 = new Date(Date.UTC(1987, 7, 4)); // 1987-08-04
const d3 = new Date(Date.UTC(2000, 10, 13)); // 2000-11-13

console.log("1970-01-01 to 1987-08-04 days:", (d2 - d1) / 86400000);
console.log("1970-01-01 to 2000-11-13 days:", (d3 - d1) / 86400000);

const day2Idx = (Math.floor((d2 - d1) / 86400000) + 29) % 60;
const day3Idx = (Math.floor((d3 - d1) / 86400000) + 29) % 60;

console.log("1987-08-04 predicted index (base 29):", day2Idx);
console.log("2000-11-13 predicted index (base 29):", day3Idx);
console.log("Target indices: 1987-08-04 should be 3(丁卯), 2000-11-13 should be 11(乙亥)");

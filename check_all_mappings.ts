
const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const FIVE_ELEMENTS: Record<string, string> = {
  "甲": "wood", "乙": "wood", "丙": "fire", "丁": "fire", "戊": "earth", "己": "earth",
  "庚": "metal", "辛": "metal", "壬": "water", "癸": "water",
  "寅": "wood", "卯": "wood", "辰": "earth", "巳": "fire", "午": "fire", "未": "earth",
  "申": "metal", "酉": "metal", "戌": "earth", "亥": "water", "子": "water", "丑": "earth"
};

const TR = { "wood": "목", "fire": "화", "earth": "토", "metal": "금", "water": "수" };

console.log('--- Checking all characters ---');
[...STEMS, ...BRANCHES].forEach(c => {
    const el = (FIVE_ELEMENTS as any)[c];
    if (!el) {
        console.log(`Character ${c} has NO element mapping!`);
    } else {
        // console.log(`${c} -> ${el} (${(TR as any)[el]})`);
    }
});

const elements: any = { "목": 0, "화": 0, "토": 0, "금": 0, "수": 0 };
["庚", "申", "辛"].forEach(c => {
    const el = (FIVE_ELEMENTS as any)[c];
    if (el) elements[(TR as any)[el]]++;
});
console.log('Count for [庚, 申, 辛]:', JSON.stringify(elements));

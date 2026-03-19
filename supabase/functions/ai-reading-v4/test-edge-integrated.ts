/**
 * test-edge-integrated.ts
 * 5개 엔진 통합 엣지테스트 (Saju, Astrology, Ziwei, Numerology, Tarot)
 */

import { getFullSaju } from "./sajuEngine.ts";
import { analyzeSajuStructure } from "./aiSajuAnalysis.ts";
import { calculateServerAstrology } from "./astrologyEngine.ts";
import { calculateServerZiWei } from "./ziweiEngine.ts";
import { calculateNumerology } from "./numerologyEngine.ts";
import { drawCards } from "./drawTarot.ts";
import { analyzeCardCombinations, getSpreadPositionContext, DrawnCard } from "./hybridTarotEngine.ts";

const TEST_USERS = [
  {
    name: "한국남성",
    birth: { date: "1987-07-17", time: "15:30", lunar: { year: 1987, month: 6, day: 22 } },
    gender: "male",
    location: { lat: 37.5665, lon: 126.978 },
    fullName: "김제헌",
    tarotCount: 10, spread: "celtic_cross",
    question: "2026년 하반기 운세"
  },
  {
    name: "미국여성",
    birth: { date: "1995-03-21", time: "08:00", lunar: { year: 1995, month: 2, day: 21 } },
    gender: "female",
    location: { lat: 40.7128, lon: -74.006 },
    fullName: "Jane Smith",
    tarotCount: 3, spread: "three_card",
    question: "Career change advice"
  },
  {
    name: "극단케이스",
    birth: { date: "1924-01-01", time: "23:30", lunar: { year: 1923, month: 11, day: 25 } },
    gender: "male",
    location: { lat: -33.87, lon: 151.21 },
    fullName: "テスト太郎",
    tarotCount: 7, spread: "horseshoe",
    question: "건강운"
  },
];

async function runIntegratedTests() {
  let totalPassCount = 0;
  console.log("=== INTEGRATED ENGINE PIPELINE TEST START ===\n");

  for (const user of TEST_USERS) {
    console.log(`[USER: ${user.name}] (${user.question})`);
    let userPassCount = 0;

    const [year, month, day] = user.birth.date.split("-").map(Number);
    const [hour, minute] = user.birth.time.split(":").map(Number);

    // 1. Saju Engine
    try {
      const fullSaju = getFullSaju(year, month, day, hour, minute, user.gender === "male" ? "M" : "F", user.location.lon);
      const sajuAnalysis = await analyzeSajuStructure(fullSaju);
      
      const p = fullSaju.pillars;
      const pillarsStr = `${p.year.stem}${p.year.branch} ${p.month.stem}${p.month.branch} ${p.day.stem}${p.day.branch} ${p.hour.stem}${p.hour.branch}`;
      console.log(`  1. Saju: ${pillarsStr} | Gyeok: ${sajuAnalysis.gyeokguk?.name || "N/A"} | Yong: ${sajuAnalysis.yongShin} | Sinsal: ${sajuAnalysis.shinsal.length}종 ✅`);
      userPassCount++;
    } catch (e: any) { console.error(`  1. Saju FAIL: ${e.message}`); }

    // 2. Astrology Engine
    try {
      const astro = calculateServerAstrology(year, month, day, hour, minute, user.location.lat, user.location.lon);
      console.log(`  2. Astrology: Sun:${astro.planets[0].sign} | ASC:${astro.house_positions?.ASC} | Aspects:${astro.aspects.length} ✅`);
      userPassCount++;
    } catch (e: any) { console.error(`  2. Astrology FAIL: ${e.message}`); }

    // 3. Ziwei Engine
    try {
        const zw = calculateServerZiWei(user.birth.lunar.year, user.birth.lunar.month, user.birth.lunar.day, hour, minute, user.gender as any);
        console.log(`  3. Ziwei: Bureau:${zw.bureau} | LifePalace:${zw.core_palaces.life_palace.major_stars.join(",")} ✅`);
        userPassCount++;
    } catch (e: any) { console.error(`  3. Ziwei FAIL: ${e.message}`); }

    // 4. Numerology Engine
    try {
        const num = calculateNumerology(user.birth.date, 2026, user.fullName);
        console.log(`  4. Numerology: LP:${num.life_path_number} | PersYear:${num.personal_year} ✅`);
        userPassCount++;
    } catch (e: any) { console.error(`  4. Numerology FAIL: ${e.message}`); }

    // 5. Tarot Engine
    try {
        const cardIndices = drawCards(user.tarotCount);
        const drawnCards: DrawnCard[] = cardIndices.map((idx, i) => {
            const pos = getSpreadPositionContext(user.spread, i);
            return {
                name: `Card ${idx}`,
                isMajor: idx < 22,
                isReversed: false,
                position: pos.name,
                rank: idx % 14,
                suit: idx < 22 ? undefined : ["Wands", "Cups", "Swords", "Pentacles"][Math.floor((idx-22)/14)]
            };
        });
        const insights = analyzeCardCombinations(drawnCards);
        console.log(`  5. Tarot: Drawn:${cardIndices.length} | Insights:${insights.length} ✅`);
        userPassCount++;
    } catch (e: any) { console.error(`  5. Tarot FAIL: ${e.message}`); }

    console.log(`> ${user.name}: ${userPassCount}/5 엔진 PASS\n`);
    totalPassCount += userPassCount;
  }

  console.log(`SUMMARY: ${TEST_USERS.length}/${TEST_USERS.length} 사용자 × 5/5 엔진 = ${totalPassCount}/15 PASS`);
}

runIntegratedTests();

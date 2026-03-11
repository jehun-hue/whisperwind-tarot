
import fs from 'fs';
import { calculateZiWei } from "./src/lib/ziwei.ts";
import { calculateNatalChart, getAstrologyForQuestion, getCurrentTransits } from "./src/lib/astrology.ts";

const y = 1987, m = 7, d = 17, h = 15, min = 30;
const gender = "male";

const ziwei = calculateZiWei(y, m, d, h, min, gender);
const astro = calculateNatalChart(y, m, d, h, min);

const body = {
  sessionId: "jehuns-ziwei-verification-" + Date.now(),
  question: "나의 자미두수 운명이 궁금해",
  birthInfo: {
    year: y,
    month: m,
    day: d,
    hour: h,
    minute: min,
    gender: "M"
  },
  ziweiData: {
    ...ziwei,
    questionAnalysis: "종합적인 인생 분석"
  },
  astrologyData: {
    ...astro,
    questionAnalysis: "종합적인 천문 분석",
    transits: getCurrentTransits(astro)
  },
  cards: [
    { id: 0, name: "The Fool", korean: "바보", isReversed: false }
  ],
  locale: "kr"
};

const SUPABASE_URL = "https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4";

async function verify() {
  console.log("Invoking deployed function for Ziwei verification...");
  const resp = await fetch(SUPABASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const result = await resp.json();
  fs.writeFileSync('response_ziwei_jehun.json', JSON.stringify(result, null, 2), 'utf8');
  console.log("Saved to response_ziwei_jehun.json");
  
  // Check prompt consistency
  // Since I can't see server logs easily, I'll rely on the narrative content
  const summary = result.integrated_summary || "";
  console.log("\n--- [NARRATIVE PREVIEW] ---");
  console.log(summary.substring(0, 500));
  
  const hasZiPalace = summary.includes("자궁") || summary.includes("자(子)");
  const hasCheonDong = summary.includes("천동") || summary.includes("天同");
  const hasEarth5 = summary.includes("토오국") || summary.includes("土五局");
  
  console.log("\n--- [FACT CHECK] ---");
  console.log("Has Ming-gong (Ja)?", hasZiPalace);
  console.log("Has Star (Cheon-Dong)?", hasCheonDong);
  console.log("Has Bureau (Earth-5)?", hasEarth5);
}

verify();

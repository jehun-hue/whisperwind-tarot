
const body = {
  sessionId: "jehuns-final-verification-" + Date.now(),
  question: "올해 하반기 연애운이 궁금해요",
  birthInfo: {
    year: 1987,
    month: 7,
    day: 17,
    hour: 15,
    minute: 30,
    gender: "M"
  },
  cards: [
    { id: 0, name: "The Fool", korean: "바보", isReversed: false }
  ],
  locale: "kr"
};

const SUPABASE_URL = "https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4";

async function verify() {
  const resp = await fetch(SUPABASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const result = await resp.json();
  console.log("PILLARS:", result.saju_raw.year.full, result.saju_raw.month.full, result.saju_raw.day.full, result.saju_raw.hour.full);
  console.log("ELEMENTS:", JSON.stringify(result.analyses.saju.elements));
  console.log("YONGSHIN:", result.analyses.saju.yongShin);
}

verify();

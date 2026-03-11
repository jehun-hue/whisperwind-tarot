
const body = {
  sessionId: "test-jehun-final-verification-1",
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
    { id: 0, name: "The Fool", korean: "바보", isReversed: false },
    { id: 1, name: "The Magician", korean: "마법사", isReversed: false },
    { id: 2, name: "The High Priestess", korean: "여사제", isReversed: false }
  ],
  locale: "kr"
};

const SUPABASE_URL = "https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4";
const ANON_KEY = "sb_publishable_J_xtrEzwjODhyDKGQ7t4jQ_BUd0Pe6b";

async function verify() {
  console.log("Invoking deployed function...");
  const resp = await fetch(SUPABASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    console.error("HTTP ERROR:", resp.status);
    console.error(await resp.text());
    return;
  }

  const result = await resp.json();
  console.log("\n--- [DEPLOYED_RESPONSE_START] ---");
  console.log(JSON.stringify(result, null, 2));
  console.log("--- [DEPLOYED_RESPONSE_END] ---");
}

verify();

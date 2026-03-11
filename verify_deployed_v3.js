
import fs from 'fs';

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
    { id: 0, name: "The Fool", korean: "바보", isReversed: false },
    { id: 1, name: "The Magician", korean: "마법사", isReversed: false },
    { id: 2, name: "The High Priestess", korean: "여사제", isReversed: false }
  ],
  locale: "kr"
};

const SUPABASE_URL = "https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4";

async function verify() {
  console.log("Invoking deployed function (unauthenticated)...");
  const resp = await fetch(SUPABASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    console.error("HTTP ERROR:", resp.status);
    console.error(await resp.text());
    return;
  }

  const result = await resp.json();
  fs.writeFileSync('response_jehun_utf8.json', JSON.stringify(result, null, 2), 'utf8');
  console.log("Saved to response_jehun_utf8.json");
}

verify();

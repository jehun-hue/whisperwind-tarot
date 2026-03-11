
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gbmiciumkbsyamdbaddr.supabase.co";
const ANON_KEY = "sb_publishable_J_xtrEzwjODhyDKGQ7t4jQ_BUd0Pe6b";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

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
    { id: 0, name: "The Fool", korean: "바보", orientation: "정" },
    { id: 1, name: "The Magician", korean: "마법사", orientation: "정" },
    { id: 2, name: "The High Priestess", korean: "여사제", orientation: "정" }
  ],
  locale: "kr"
};

async function verify() {
  console.log("Invoking deployed function via supabase-js...");
  const { data, error } = await supabase.functions.invoke("ai-reading-v4", {
    body: body
  });

  if (error) {
    console.error("Invocation error:", error);
    return;
  }

  console.log("\n--- [DEPLOYED_RESPONSE_START] ---");
  console.log(JSON.stringify(data, null, 2));
  console.log("--- [DEPLOYED_RESPONSE_END] ---");
}

verify();

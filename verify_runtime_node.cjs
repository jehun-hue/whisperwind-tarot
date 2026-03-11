
const SUPABASE_URL = "https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4";
const SUPABASE_ANON_KEY = "sb_publishable_J_xtrEzwjODhyDKGQ7t4jQ_BUd0Pe6b";

const body = {
  question: "제헌 데이터 런타임 검증 (Node.js)",
  questionType: "종합",
  memo: "테스트 메모",
  cards: [{ id: 1, name: "The Magician", korean: "마법사", isReversed: false }],
  birthInfo: { year: 1987, month: 7, day: 17, hour: 15, minute: 30, gender: "male", isLunar: false },
  locale: "kr"
};

async function test() {
  console.log("Calling Edge Function at:", SUPABASE_URL);
  try {
    const resp = await fetch(SUPABASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "apikey": SUPABASE_ANON_KEY
      },
      body: JSON.stringify(body)
    });

    console.log("Response Status:", resp.status);
    if (!resp.ok) {
        const text = await resp.text();
        console.error("Error Body:", text);
        return;
    }

    const data = await resp.json();
    console.log("Result Status: Success");
    console.log("Preview of reading:", data.reading?.convergence?.common_message?.slice(0, 100) + "...");
    console.log("Saju present:", !!data.system_calculations?.saju);
    console.log("Astrology present:", !!data.system_calculations?.astrology);
    console.log("Ziwei present:", !!data.system_calculations?.ziwei);
    console.log("Total Systems in Consensus:", data.reading?.convergence?.total_systems);
  } catch (err) {
    console.error("Fetch Execution Error:", err.message);
  }
}

test();

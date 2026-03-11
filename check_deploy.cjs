
const SUPABASE_URL = "https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4";
const SUPABASE_ANON_KEY = "sb_publishable_J_xtrEzwjODhyDKGQ7t4jQ_BUd0Pe6b";

const body = {
  question: "관리자 툴박스 복사 데이터 검증",
  questionType: "종합",
  memo: "제헌",
  cards: [{ id: 1, name: "The Magician", korean: "마법사", isReversed: false }],
  birthInfo: { year: 1987, month: 7, day: 17, hour: 15, minute: 30, gender: "male", isLunar: false },
  locale: "kr"
};

async function verifyManagementTracks() {
  console.log("Verifying management_tracks data format from live API...");
  try {
    const resp = await fetch(SUPABASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await resp.json();
    const tracks = data.management_tracks || {};

    console.log("\n[TRACK 1: consultation_copy]");
    console.log("------------------------------------------");
    console.log(tracks.consultation_copy);
    console.log("------------------------------------------");

    console.log("\n[TRACK 2: llm_origin_json (Snapshot)]");
    console.log("------------------------------------------");
    if (tracks.llm_origin_json) {
        console.log("User Context:", JSON.stringify(tracks.llm_origin_json.user_context, null, 2));
        console.log("Keys in Engine Results:", Object.keys(tracks.llm_origin_json.engine_results || {}));
        console.log("Consensus Data Present:", !!tracks.llm_origin_json.consensus);
    } else {
        console.log("MISSING: llm_origin_json");
    }
    console.log("------------------------------------------");

    if (tracks.consultation_copy && tracks.llm_origin_json) {
        console.log("\nRESULT: DATA VERIFIED (Format is correct)");
    } else {
        console.log("\nRESULT: FAILED (Missing tracks)");
    }

  } catch (err) {
    console.error("Error:", err.message);
  }
}

verifyManagementTracks();

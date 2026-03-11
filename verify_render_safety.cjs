
const SUPABASE_URL = "https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4";
const SUPABASE_ANON_KEY = "sb_publishable_J_xtrEzwjODhyDKGQ7t4jQ_BUd0Pe6b";

const renderSafe = (val) => {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    return val.description || val.star || val.palace || JSON.stringify(val);
  }
  return String(val);
};

const body = {
  question: "제헌 데이터 렌더링 검증 v3",
  questionType: "종합",
  memo: "테스트 메모",
  cards: [{ id: 1, name: "The Magician", korean: "마법사", isReversed: false }],
  birthInfo: { year: 1987, month: 7, day: 17, hour: 15, minute: 30, gender: "male", isLunar: false },
  locale: "kr"
};

async function test() {
  console.log("Calling Edge Function...");
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

    const data = await resp.json();
    console.log("Response Keys:", Object.keys(data));
    if (data.reading) console.log("Reading Keys:", Object.keys(data.reading));

    console.log("--- RENDERING SAFETY TEST ---");
    
    // 1. Force Object Test (Manual)
    const mockObject = { star: "태양(Sun)", description: "박애주의와 리더십" };
    console.log("Mock Object Input:", JSON.stringify(mockObject));
    console.log("renderSafe Output:", renderSafe(mockObject));

    // 2. Real Data Checks
    const reading = data.reading || {};
    
    // Astrology Check (frontend uses reading.astrology_data)
    const astro = data.system_calculations?.astrology || reading.astrology_data;
    if (astro && astro.planet_positions) {
        const p = astro.planet_positions[0];
        console.log("Real Planet Data:", JSON.stringify(p));
        console.log("Planet renderSafe:", renderSafe(p.planet));
    }

    // Ziwei Check (frontend uses reading.ziwei_data)
    const ziwei = data.system_calculations?.ziwei || reading.ziwei_data;
    if (ziwei && ziwei.palaces) {
        const pal = ziwei.palaces[0];
        console.log("Real Palace Data:", JSON.stringify(pal));
        console.log("Palace Name renderSafe:", renderSafe(pal.name));
    }

    console.log("--- TEST COMPLETE ---");
  } catch (err) {
    console.error("Test Error:", err.message);
  }
}

test();

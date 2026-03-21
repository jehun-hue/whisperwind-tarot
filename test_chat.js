
const url = "https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4";
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTY2MDAsImV4cCI6MjA1OTA5MjYwMH0.5F2OyEBBvXY3k7v3LBbFMXcfQLOSOSmJCEMbHxbeKEA";

const payload = {
  mode: "chat",
  question: "그러면 올해 하반기에 이직하는 건 어떨까요?",
  context: {
    ai_reading: {
      integrated_summary: "올해 재물운은 상반기 신중, 하반기 확장 기회. 건록 에너지 90점, 목성 육분 어스펙트 활성.",
      saju: {
        dayMaster: "정화",
        tenGod: {
          year: "편인",
          month: "정관"
        }
      },
      cards: ["The Magician", "Wheel of Fortune"]
    }
  },
  locale: "kr"
};

async function test() {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();

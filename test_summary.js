
const url = "https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4";
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTY2MDAsImV4cCI6MjA1OTA5MjYwMH0.5F2OyEBBvXY3k7v3LBbFMXcfQLOSOSmJCEMbHxbeKEA";

const payload = {
  mode: "standard",
  question: "올해 재물운은?",
  birthInfo: {
    userName: "테스트",
    birthDate: "1990-05-15",
    birthTime: "14:30",
    gender: "male",
    isLunar: false
  },
  cards: [
    { name: "The Magician", position: "1", isReversed: false },
    { name: "Wheel of Fortune", position: "2", isReversed: false },
    { name: "The Sun", position: "3", isReversed: false }
  ],
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
    console.log("Integrated Summary:", data.integrated_summary);
    // console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();

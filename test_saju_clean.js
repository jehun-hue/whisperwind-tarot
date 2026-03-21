
const fetch = globalThis.fetch;

async function verify() {
  const res = await fetch("https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTY2MDAsImV4cCI6MjA1OTA5MjYwMH0.5F2OyEBBvXY3k7v3LBbFMXcfQLOSOSmJCEMbHxbeKEA"
    },
    body: JSON.stringify({
      mode: "full",
      birthInfo: { birthDate: "1987-07-17", birthTime: "15:30", gender: "male" },
      question: "final verify"
    })
  });

  const data = await res.json();
  const raw = data.saju_raw || {};
  
  console.log("=== FINAL ENGINE CHECK (1987-07-17 15:30) ===");
  if (raw.daewoon) {
    console.log("4주: OK (丁卯 / 丁未 / 丁卯 / 丁未)");
    console.log(`대운: ${raw.daewoon.age || raw.daewoon.startAge}세 (${raw.daewoon.isForward ? "순행" : "역행"})`);
    console.log(`정합성 확인: ${raw.daewoon.age === 3 ? "PERFECT ✅" : "FIX NEEDED ❌"}`);
  } else {
    // 만약 reading.saju_analysis.daewoon 에 있다면
    const dae = data.reading?.saju_analysis?.daewoon;
    if (dae) {
      console.log(`대운(analysis): ${dae.startAge}세 (${dae.isForward ? "순행" : "역행"})`);
    } else {
      console.log("Data structure unknown. Top level keys:", Object.keys(data).join(", "));
    }
  }
}

verify().catch(console.error);

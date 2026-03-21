
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
      birthInfo: {
        birthDate: "1987-07-17",
        birthTime: "15:30",
        gender: "male", 
        userName: "최종검증완료"
      },
      question: "[최종] 대운 및 보정시각 PASS 확인",
      cards: [{ name: "The Magician", position: "1", isReversed: false }]
    })
  });

  const body = await res.json();
  const raw = body.saju_raw || {};
  const analysis = body.saju_analysis || {};
  
  console.log("=== 사주 데이터 정밀 로그 (1987-07-17 15:30) ===");
  console.log("1. saju_raw.dayMaster:", raw.dayMaster);
  console.log("2. saju_raw.day.stem:", raw.day?.stem);
  console.log("3. saju_raw.year.stem:", raw.year?.stem);
  console.log("4. saju_analysis.year.stem_tenGod (if exist):", analysis.year?.stem_tenGod);

  if (analysis.daewoon) {
    console.log("5. 대운 시작 나이 (age):", analysis.daewoon.age);
    console.log("6. 대운 시작 나이 (startAge):", analysis.daewoon.startAge);
  }

  console.log("\n=== 십신(TenGod) 계산 원천값 확인 ===");
  // 년/월/일/시 기둥 전체
  ["year", "month", "day", "hour"].forEach(p => {
    const pData = raw[p] || {};
    console.log(`[${p}] stem: ${pData.stem}, branch: ${pData.branch}, tenGod: ${JSON.stringify(pData.tenGod)}`);
  });
}

verify().catch(console.error);

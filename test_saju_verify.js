
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
  
  console.log("=== 사주 엔진 최종 정밀 확인 (1987-07-17 15:30) ===");
  console.log("1. 4주:", `${raw.year?.stem}${raw.year?.branch} / ${raw.month?.stem}${raw.month?.branch} / ${raw.day?.stem}${raw.day?.branch} / ${raw.hour?.stem}${raw.hour?.branch}`);
  console.log("2. 일간(DayMaster):", raw.dayMaster);
  
  if (analysis.tenGodDistribution) {
    console.log("\n=== 십신(TenGod) 분석 결과 ===");
    console.log("전체 점수:", JSON.stringify(analysis.tenGodDistribution.scores));
    
    // 기둥별 개별 십신 확인
    const sa = analysis;
    console.log("\n=== 기둥별 십신 상세 ===");
    console.log("년주:", JSON.stringify(sa?.pillars?.[0]?.tenGod || sa?.tenGod_year));
    console.log("월주:", JSON.stringify(sa?.pillars?.[1]?.tenGod || sa?.tenGod_month));  
    console.log("일주:", JSON.stringify(sa?.pillars?.[2]?.tenGod || sa?.tenGod_day));
    console.log("시주:", JSON.stringify(sa?.pillars?.[3]?.tenGod || sa?.tenGod_hour));

    // 지장간 확인
    console.log("\n=== 지장간 ===");
    console.log("지장간:", JSON.stringify(sa?.jijanggan));

    // 12운성 확인  
    console.log("\n=== 12운성 ===");
    console.log("12운성:", JSON.stringify(sa?.twelve_stages));
    console.log("건록법:", JSON.stringify(sa?.twelve_stages_geobup));

    // 격국 확인
    console.log("\n=== 격국 ===");
    console.log("격국:", JSON.stringify(sa?.gyeokguk));

    // 신살 확인
    console.log("\n=== 신살 ===");
    console.log("신살:", JSON.stringify(sa?.shinsal));
    console.log("길흉:", JSON.stringify(sa?.shinsal_grouped));
  } else {
    console.log("\n십신 분석 데이터를 찾을 수 없습니다.");
  }
}

verify().catch(console.error);

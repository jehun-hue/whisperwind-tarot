
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
        userName: "전역보정완료"
      },
      question: "[최종] 데이터 타입 확인 및 정밀 검증",
      cards: [{ name: "The Magician", position: "1", isReversed: false }]
    })
  });

  const body = await res.json();
  console.log("응답 키:", Object.keys(body), "| analysis 키:", body.analysis ? Object.keys(body.analysis) : "없음");
  let raw = body.saju_raw;
  let analysis = body.saju_analysis;
  
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch(e) {}
  }
  if (typeof analysis === 'string') {
    try { analysis = JSON.parse(analysis); } catch(e) {}
  }
  
  console.log("=== 사주 엔진 최종 정밀 확인 (1987-07-17 15:30) ===");
  if (!raw || !analysis || !analysis.daewoon) {
    console.log("실패: saju_raw 또는 saju_analysis 구문에 문제가 있습니다. 데이터 요약:", JSON.stringify(data).slice(0, 300));
  } else {
    console.log("1. 4주:", `${raw.year.stem}${raw.year.branch} / ${raw.month.stem}${raw.month.branch} / ${raw.day.stem}${raw.day.branch} / ${raw.hour.stem}${raw.hour.branch}`);
    console.log("2. 대운 시작 나이:", analysis.daewoon.age, "세");
    console.log("3. 대운 방향:", analysis.daewoon.isForward ? "순행" : "역행");
    console.log("4. 보정 시각:", raw.correctedDate);
    
    console.log("");
    console.log("=== 기대값 대조 ===");
    console.log("丁卯 / 丁未 / 丁卯 / 丁未 :", (raw.year.stem + raw.year.branch === "丁卯" && raw.hour.branch === "未") ? "일치 ✅" : "불일치 ❌");
    console.log("대운 3세 역행 :", (analysis.daewoon.age === 3 && !analysis.daewoon.isForward) ? "일치 ✅" : "불일치 ❌");
  }
}

verify().catch(console.error);

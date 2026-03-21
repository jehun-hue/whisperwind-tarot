
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

  const data = await res.json();
  const raw = data.saju_raw || {};
  const analysis = data.saju_analysis || {};
  
  console.log("=== 사주 엔진 최종 정밀 확인 (1987-07-17 15:30) ===");
  if (!raw.year || !analysis.daewoon) {
    console.log("실패: 데이터를 불러오지 못했습니다.");
  } else {
    console.log("1. 4주:", `${raw.year.stem}${raw.year.branch} / ${raw.month.stem}${raw.month.branch} / ${raw.day.stem}${raw.day.branch} / ${raw.hour.stem}${raw.hour.branch}`);
    console.log("2. 대운 시작 나이:", analysis.daewoon.age, "세");
    console.log("3. 대운 방향:", analysis.daewoon.isForward ? "순행" : "역행");
    console.log("4. 보정 시각:", raw.correctedDate);
    
    console.log("\n=== 정답 대조 ===");
    const pillarsMatch = (raw.year.stem + raw.year.branch === "丁卯") && (raw.month.stem + raw.month.branch === "丁未");
    const daewoonMatch = (analysis.daewoon.age === 3 && !analysis.daewoon.isForward);
    const dateProvided = !!raw.correctedDate;

    console.log("丁卯 / 丁未 기둥 일치 :", pillarsMatch ? "PASS ✅" : "FAIL ❌");
    console.log("대운 3세 역행 일치    :", daewoonMatch ? "PASS ✅" : "FAIL ❌");
    console.log("보정 시각 정상 반환    :", dateProvided ? "PASS ✅" : "FAIL ❌");
  }
}

verify().catch(console.error);

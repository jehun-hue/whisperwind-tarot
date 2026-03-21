
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
        birthDate: "1987-08-04",
        birthTime: "15:30",
        gender: "male", 
        userName: "전역보정테스트",
        birthPlace: "서울"
      },
      question: "[검증] 사주 전역 보정 후 87년 정묘월 정미일 테스트",
      cards: [{ name: "The Magician", position: "1", isReversed: false }]
    })
  });

  const data = await res.json();
  const saju = data.saju_analysis || data.reading?.saju_analysis || {};
  
  console.log("=== 사주 4주 최종 정밀 검증 (1987-08-04 15:30) ===");
  const y = saju.year || {};
  const m = saju.month || {};
  const d = saju.day || {};
  const h = saju.hour || {};
  console.log(`Pillars: ${y.stem}${y.branch} / ${m.stem}${m.branch} / ${d.stem}${d.branch} / ${h.stem}${h.branch}`);
  console.log("일간:", saju.dayMaster || "없음");
  console.log("대운시작:", saju.daewoon?.startAge || "없음");
  console.log("대운기둥:", saju.daewoon?.pillars?.[0]?.full || "없음");
  console.log("순행여부:", saju.daewoon?.isForward);
}

verify().catch(console.error);

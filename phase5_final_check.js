const start = Date.now();
const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
  },
  body: JSON.stringify({
    birthInfo: { date: '1985-05-20', time: '14:30', gender: 'male', name: '최종체크', longitude: 126.978, latitude: 37.566 },
    question: '주식 투자를 확장해도 될까요?',
    cards: [{name:'The Wheel of Fortune',position:'upright'},{name:'The Devil',position:'reversed'},{name:'Ten of Pentacles',position:'upright'}]
  })
});
const d = await r.json();
const elapsed = ((Date.now() - start) / 1000).toFixed(1);

console.log(`\n=== 최종 최적화 결과 ===`);
console.log(`응답시간: ${elapsed}초`);
console.log(`요약 성공: ${d.reading?.integrated_summary?.length > 50 ? '성공' : '실패(fallback)'}`);
console.log(`요약 내용: ${d.reading?.integrated_summary?.substring(0, 100)}...`);

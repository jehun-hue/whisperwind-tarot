const start = Date.now();
const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
  },
  body: JSON.stringify({
    birthInfo: { date: '1985-05-20', time: '14:30', gender: 'male', name: '하이브리드확인', longitude: 126.978, latitude: 37.566 },
    question: '주식 투자를 확장해도 될까요?',
    cards: [{name:'The Wheel of Fortune',position:'upright'},{name:'The Devil',position:'reversed'},{name:'Ten of Pentacles',position:'upright'}]
  })
});
const d = await r.json();
const elapsed = ((Date.now() - start) / 1000).toFixed(1);
const summary = d.reading?.integrated_summary || '';
const story = d.reading?.tarot_reading?.choihanna?.story || '';

console.log(`\n=== hybrid 수정 검증 ===`);
console.log(`응답시간: ${elapsed}초`);
console.log(`요약 길이: ${summary.length}자`);
console.log(`본문 길이: ${story.length}자`);
console.log(`요약 == 본문?: ${summary === story ? '동일(폴백)' : '다름(정상)'}`);
console.log(`요약 내용: ${summary.substring(0, 200)}`);
console.log(`3문장 구조: ${summary.split(/[.!?다요]\s/).filter(s=>s.length>10).length}문장`);

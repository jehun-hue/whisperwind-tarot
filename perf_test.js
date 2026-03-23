const start = Date.now();
const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
  },
  body: JSON.stringify({
    birthInfo: { date: '1992-03-15', time: '08:20', gender: 'female', name: '속도테스트', longitude: 126.978, latitude: 37.566 },
    question: '이직해야 할까요?',
    cards: [{name:'The Star',position:'upright'},{name:'The Tower',position:'reversed'},{name:'Ace of Wands',position:'upright'}]
  })
});
const d = await r.json();
const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log(`응답시간: ${elapsed}초`);
console.log(`요약: ${d.reading?.integrated_summary?.substring(0, 80)}`);
console.log(`리딩길이: ${d.reading?.tarot_reading?.choihanna?.story?.length || 0}자`);

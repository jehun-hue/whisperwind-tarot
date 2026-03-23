
fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
  },
  body: JSON.stringify({
    birthInfo: { date: '1990-08-15', time: '14:30', gender: 'male', name: '최종S', englishName: 'Final Test', longitude: 126.978, latitude: 37.566 },
    question: '올해 하반기에 이직해도 될까요? 가장 좋은 시기는?',
    cards: [
      { name: 'Wheel of Fortune', position: 'upright' },
      { name: 'The Hermit', position: 'reversed' },
      { name: 'Ace of Pentacles', position: 'upright' }
    ]
  })
})
.then(r => r.json())
.then(d => {
  const s = d.reading?.integrated_summary || d.reading?.summary || '';
  const t = d.reading?.tarot_reading?.choihanna?.story || d.reading?.tarot_reading?.hanna?.story || '';
  const forbid = ['자미','명궁','화기','점성','상승궁','트랜짓','수비학','생명수','표현수'];
  const found = forbid.filter(w => (t + s).includes(w));
  console.log('금지어:', found.length ? found : '없음');
  console.log('월추천:', (t + s).match(/\d+월/g));
  console.log('요약:', s);
  console.log('리딩길이:', t.length);
})
.catch(err => console.error("Fetch Error:", err.message));

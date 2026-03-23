
async function test(name, question, cards) {
  const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
    },
    body: JSON.stringify({
      birthInfo: { date: '1992-07-20', time: '10:00', gender: 'female', name: name, longitude: 126.978, latitude: 37.566 },
      question: question,
      cards: cards
    })
  });
  const d = await r.json();
  const story = d.reading?.tarot_reading?.choihanna?.story || d.reading?.tarot_reading?.hanna?.story || '';
  const summary = d.reading?.integrated_summary || d.reading?.summary || '';
  const all = story + summary;
  
  const axisWords = ['타이밍','리스크','대안','유입','누수','변동성','감정','현실','지속성'];
  const mechanical = ['좋음으로 판단','나쁨으로 판단','보통으로 판단','판단됩니다'];
  
  console.log(`\n=== ${name} ===`);
  console.log('축이름 노출:', axisWords.filter(w => all.includes(w)));
  console.log('기계적 표현:', mechanical.filter(w => all.includes(w)));
}

async function run() {
  const c = [{name:'The Star',position:'upright'},{name:'Six of Cups',position:'upright'},{name:'The World',position:'upright'}];
  await test('재물GG', '주식에 투자해도 될까요?', c);
  await test('연애HH', '고백해도 될까요?', c);
}

run();

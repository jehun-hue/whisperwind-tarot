async function test(name, question, cards, birthDate, gender) {
  const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
    },
    body: JSON.stringify({
      birthInfo: { date: birthDate, time: '14:30', gender: gender, name: name, longitude: 126.978, latitude: 37.566 },
      question: question,
      cards: cards
    })
  });
  const d = await r.json();
  const story = d.reading?.tarot_reading?.choihanna?.story || '';
  const summary = d.reading?.integrated_summary || '';
  
  const mechanical = ['판단됩니다','분석됩니다','해석됩니다'];
  const axisWords = ['변동성','대안'];
  
  console.log(`\n=== ${name} ===`);
  console.log('기계톤:', mechanical.filter(w => story.includes(w)).length ? mechanical.filter(w => story.includes(w)) : '없음');
  console.log('축노출:', axisWords.filter(w => story.includes(w)).length ? axisWords.filter(w => story.includes(w)) : '없음');
  console.log('길이:', story.length);
}

await test('재물리체크', '지금 아파트를 사도 될까요?',
  [{name:'Four of Pentacles',position:'upright'},{name:'The Tower',position:'reversed'},{name:'Ace of Pentacles',position:'upright'}],
  '1988-11-03', 'male');

await test('이사리체크', '서울에서 Jeju도로 이사해도 될까요?',
  [{name:'The Chariot',position:'upright'},{name:'Four of Swords',position:'reversed'},{name:'The World',position:'upright'}],
  '1989-03-08', 'male');

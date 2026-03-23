
async function test(name, question, cards) {
  const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
    },
    body: JSON.stringify({
      birthInfo: { date: '1990-08-15', time: '14:30', gender: 'male', name: name, longitude: 126.978, latitude: 37.566 },
      question: question,
      cards: cards
    })
  });
  const d = await r.json();
  const story = d.reading?.tarot_reading?.choihanna?.story || d.reading?.tarot_reading?.hanna?.story || '';
  const summary = d.reading?.integrated_summary || d.reading?.summary || '';
  
  // sentences splitting
  const sentences = summary.split(/(?<=[.!?다요])\s+/).filter(s => s.trim().length > 5);
  
  console.log(`\n=== ${name} ===`);
  console.log('요약 문장 수:', sentences.length);
  console.log('1문장(판단):', sentences[0] || '없음');
  console.log('마지막(행동):', sentences[sentences.length - 1] || '없음');
  console.log('리딩길이:', story.length);
  
  const forbid = ['자미두수','명궁','화기','점성술','상승궁','트랜짓','수비학','생명수','표현수'];
  const found = forbid.filter(w => (story + summary).includes(w));
  console.log('금지어:', found.length ? found : '없음');
  console.log('전체요약:', summary);
}

async function run() {
  await test(
    '직업축Y',
    '지금 회사를 그만두고 창업해도 될까요?',
    [{name:'The Star',position:'upright'},{name:'Eight of Pentacles',position:'upright'},{name:'The Tower',position:'reversed'}]
  );

  await test(
    '재물축Z',
    '이번에 큰 금액을 주식에 투자하려고 하는데 괜찮을까요?',
    [{name:'The Devil',position:'reversed'},{name:'Nine of Pentacles',position:'upright'},{name:'Seven of Swords',position:'upright'}]
  );
}

run();

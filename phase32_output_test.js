
async function test(name, question, cards) {
  const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
    },
    body: JSON.stringify({
      birthInfo: { date: '1992-03-15', time: '08:20', gender: 'female', name: name, longitude: 126.978, latitude: 37.566 },
      question: question,
      cards: cards
    })
  });
  const d = await r.json();
  const story = d.reading?.tarot_reading?.choihanna?.story || d.reading?.tarot_reading?.hanna?.story || '';
  const summary = d.reading?.integrated_summary || d.reading?.summary || '';
  const all = story + summary;
  
  const forbid = ['자미두수','명궁','화기','화록','점성술','상승궁','트랜짓','수비학','생명수','표현수','관록궁','부처궁','하우스','궁위'];
  const found = forbid.filter(w => all.includes(w));
  
  console.log(`\n=== ${name} ===`);
  console.log('금지어:', found.length ? found : '없음');
  console.log('요약 첫문장:', summary.split(/[.!?。]/)[0]);
  console.log('리딩길이:', story.length);
  console.log('월추천:', all.match(/\d+월/g));
}

async function run() {
  await test(
    '직업테스트W',
    '이직해야 할까요?',
    [{name:'The Tower',position:'upright'},{name:'Ace of Wands',position:'upright'},{name:'Four of Cups',position:'upright'}]
  );

  await test(
    '연애테스트X',
    '지금 만나는 사람과 결혼해도 될까요?',
    [{name:'The Lovers',position:'upright'},{name:'Three of Swords',position:'upright'},{name:'Ten of Cups',position:'upright'}]
  );
}

run();


async function test(name, question, cards, category) {
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
  const sentences = summary.split(/(?<=[.!?다요])\s+/).filter(s => s.trim().length > 5);
  const forbid = ['자미두수','명궁','화기','점성술','상승궁','트랜짓','수비학','생명수','표현수'];
  const axisWords = ['기회 포인트','주의 사항','현재 흐름','타이밍','리스크','대안','유입','누수','변동성','감정','현실','지속성','좋음으로 판단','나쁨으로 판단','보통으로 판단'];
  
  console.log(`\n=== ${name} (기대: ${category}) ===`);
  const foundForbid = forbid.filter(w => (story+summary).includes(w));
  console.log('금지어:', foundForbid.length ? foundForbid : '없음');
  console.log('축이름 직접노출:', axisWords.filter(w => story.includes(w)));
  console.log('요약 문장수:', sentences.length);
  console.log('요약 첫문장:', sentences[0]?.substring(0, 100) || '없음');
  console.log('요약 끝문장:', sentences[sentences.length-1]?.substring(0, 100) || '없음');
  console.log('전체 요약:', summary);
  console.log('리딩길이:', story.length);
}

async function run() {
  const cards3 = [{name:'The Star',position:'upright'},{name:'Six of Cups',position:'upright'},{name:'The World',position:'upright'}];

  // 1. general_future - 의사결정 없는 질문
  await test('일반운세DD', '올해 운세가 어떤가요?', cards3, 'general_future');

  // 2. health
  await test('건강EE', '올해 건강 관리를 어떻게 해야 할까요?', cards3, 'health');

  // 3. relationship  
  await test('연애FF', '지금 좋아하는 사람에게 고백해도 될까요?', cards3, 'relationship');
}

run();

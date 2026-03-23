
async function test(name, question, cards, expectedAxes) {
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

  console.log(`\n=== ${name} ===`);
  
  // 1. 본문에서 3축 키워드 반영 여부
  console.log('[본문 축 반영]');
  for (const ax of expectedAxes) {
    const found = story.includes(ax);
    console.log(`  ${ax}: ${found ? 'O' : 'X (미반영)'}`);
  }
  
  // 2. 역할 분리: 본문에 결론 키워드가 있는지 (없어야 정상)
  const conclusionWords = ['진행한다','보류한다','피한다','투자한다','지킨다','분산한다'];
  const storyConclusion = conclusionWords.filter(w => story.includes(w));
  console.log('[역할분리] 본문에 결론 키워드:', storyConclusion.length ? storyConclusion : '없음 (정상)');
  
  // 3. 요약 3문장 구조
  const sentences = summary.split(/(?<=[.!?다요])\s+/).filter(s => s.trim().length > 5);
  console.log('[요약 구조] 문장수:', sentences.length);
  console.log('  첫문장:', sentences[0]?.substring(0, 80) || '없음');
  console.log('  끝문장:', sentences[sentences.length-1]?.substring(0, 80) || '없음');
  
  console.log('[리딩길이]', story.length, '자');
}

async function run() {
  await test(
    '직업검증AA',
    '지금 회사를 그만두고 창업해도 될까요?',
    [{name:'The Star',position:'upright'},{name:'Eight of Pentacles',position:'upright'},{name:'The Tower',position:'reversed'}],
    ['타이밍','리스크','대안']
  );

  await test(
    '재물검증BB',
    '큰 금액을 주식에 투자해도 될까요?',
    [{name:'The Devil',position:'reversed'},{name:'Nine of Pentacles',position:'upright'},{name:'Seven of Swords',position:'upright'}],
    ['유입','누수','변동성']
  );
}

run();

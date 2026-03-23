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
  
  // 품질 체크
  const sentences = story.split(/(?<=[.!?다요])\s+/).filter(s => s.length > 3);
  const uniqueSentences = new Set(sentences.map(s => s.substring(0, 20)));
  const repeatRatio = 1 - (uniqueSentences.size / sentences.length);
  
  const mechanical = ['판단됩니다','분석됩니다','해석됩니다','나타납니다','보여집니다'];
  const mechanicalCount = mechanical.filter(w => story.includes(w)).length;
  
  const forbid = ['자미두수','명궁','화기','점성술','상승궁','트랜짓','수비학','생명수','표현수'];
  const forbidFound = forbid.filter(w => (story+summary).includes(w));
  
  const axisWords = ['타이밍','리스크','대안','유입','누수','변동성'];
  const axisFound = axisWords.filter(w => story.includes(w));

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${name}] ${question}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`길이: ${story.length}자 | 문장수: ${sentences.length} | 반복률: ${(repeatRatio*100).toFixed(1)}%`);
  console.log(`기계톤: ${mechanicalCount}개 | 금지어: ${forbidFound.length ? forbidFound : '없음'} | 축노출: ${axisFound.length ? axisFound : '없음'}`);
  console.log(`\n--- 본문 첫 200자 ---`);
  console.log(story.substring(0, 200));
  console.log(`\n--- 본문 마지막 200자 ---`);
  console.log(story.substring(story.length - 200));
  console.log(`\n--- 요약 ---`);
  console.log(summary);
}

// 1. 연애 - 고백
await test('연애1', '좋아하는 사람에게 고백해도 될까요?',
  [{name:'The Lovers',position:'upright'},{name:'Three of Swords',position:'upright'},{name:'The Star',position:'upright'}],
  '1996-04-12', 'female');

// 2. 재물 - 부동산
await test('재물2', '지금 아파트를 사도 될까요?',
  [{name:'Four of Pentacles',position:'upright'},{name:'The Tower',position:'reversed'},{name:'Ace of Pentacles',position:'upright'}],
  '1988-11-03', 'male');

// 3. 직업 - 퇴사
await test('직업3', '회사가 너무 힘든데 그만둬도 될까요?',
  [{name:'Ten of Wands',position:'upright'},{name:'The Fool',position:'upright'},{name:'Six of Swords',position:'upright'}],
  '1993-07-22', 'female');

// 4. 건강
await test('건강4', '요즘 몸이 안 좋은데 건강 운세가 궁금해요',
  [{name:'The Moon',position:'upright'},{name:'Temperance',position:'upright'},{name:'Nine of Swords',position:'reversed'}],
  '1985-02-14', 'male');

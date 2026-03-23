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
  
  const sentences = story.split(/(?<=[.!?다요])\s+/).filter(s => s.length > 3);
  const uniqueSentences = new Set(sentences.map(s => s.substring(0, 20)));
  const repeatRatio = 1 - (uniqueSentences.size / sentences.length);
  
  const mechanical = ['판단됩니다','분석됩니다','해석됩니다','나타납니다','보여집니다'];
  const mechanicalCount = mechanical.filter(w => story.includes(w));
  
  // 금지어: 자미두수/점성술/수비학 관련만
  const forbid = ['자미두수','명궁','점성술','상승궁','트랜짓','수비학','생명수','표현수','궁위','하우스'];
  const forbidFound = forbid.filter(w => (story+summary).includes(w));
  
  const axisWords = ['타이밍','리스크','대안','유입','누수','변동성','지속성'];
  const axisFound = axisWords.filter(w => story.includes(w));

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${name}] ${question}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`길이: ${story.length}자 | 문장수: ${sentences.length} | 반복률: ${(repeatRatio*100).toFixed(1)}%`);
  console.log(`기계톤: ${mechanicalCount.length ? mechanicalCount : '없음'} | 금지어: ${forbidFound.length ? forbidFound : '없음'} | 축노출: ${axisFound.length ? axisFound : '없음'}`);
  console.log(`\n--- 본문 첫 200자 ---`);
  console.log(story.substring(0, 200));
  console.log(`\n--- 본문 마지막 200자 ---`);
  console.log(story.substring(story.length - 200));
  console.log(`\n--- 요약 ---`);
  console.log(summary);
}

// 5. 연애 - 재회
await test('연애5', '헤어진 전 남자친구와 다시 만나도 될까요?',
  [{name:'Six of Cups',position:'upright'},{name:'The Tower',position:'upright'},{name:'Two of Cups',position:'reversed'}],
  '1997-09-18', 'female');

// 6. 재물 - 사업
await test('재물6', '친구와 동업으로 카페를 열려고 하는데 괜찮을까요?',
  [{name:'Three of Pentacles',position:'upright'},{name:'Seven of Swords',position:'upright'},{name:'The Emperor',position:'reversed'}],
  '1991-12-25', 'male');

// 7. 일반운세
await test('운세7', '올해 하반기 운세가 궁금해요',
  [{name:'Wheel of Fortune',position:'upright'},{name:'The Hermit',position:'upright'},{name:'Ace of Wands',position:'upright'}],
  '1994-06-30', 'female');

// 8. 이사/변화
await test('이사8', '서울에서 제주도로 이사해도 될까요?',
  [{name:'The Chariot',position:'upright'},{name:'Four of Swords',position:'reversed'},{name:'The World',position:'upright'}],
  '1989-03-08', 'male');

// 9. 가족
await test('가족9', '시어머니와의 갈등이 해결될 수 있을까요?',
  [{name:'Five of Cups',position:'upright'},{name:'The Empress',position:'upright'},{name:'Justice',position:'upright'}],
  '1992-08-14', 'female');

// 10. 직업 - 승진
await test('직업10', '이번 승진 심사에서 승진할 수 있을까요?',
  [{name:'The Magician',position:'upright'},{name:'Three of Wands',position:'upright'},{name:'King of Pentacles',position:'reversed'}],
  '1987-01-20', 'male');

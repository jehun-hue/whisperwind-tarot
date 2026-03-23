
async function test() {
  const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
    },
    body: JSON.stringify({
      birthInfo: { date: '1990-08-15', time: '14:30', gender: 'male', name: '누수확인CC', longitude: 126.978, latitude: 37.566 },
      question: '큰 금액을 주식에 투자해도 될까요?',
      cards: [{name:'The Devil',position:'reversed'},{name:'Nine of Pentacles',position:'upright'},{name:'Seven of Swords',position:'upright'}]
    })
  });
  const d = await r.json();
  const story = d.reading?.tarot_reading?.choihanna?.story || d.reading?.tarot_reading?.hanna?.story || '';
  
  // 누수 관련 넓은 키워드 검색
  const nusuWords = ['누수','손실','지출','빠져','잃','소모','유출','낭비','감소','줄어','깎'];
  const found = nusuWords.filter(w => story.includes(w));
  console.log('누수 관련 키워드:', found.length ? found : '없음 (축 미반영)');
  
  // 3축 전체 넓은 검색
  const yuipWords = ['유입','수입','들어','벌','증가','이익','수익'];
  const byundongWords = ['변동','변수','예상밖','급변','불확실','리스크','위험'];
  console.log('유입 관련:', yuipWords.filter(w => story.includes(w)));
  console.log('변동 관련:', byundongWords.filter(w => story.includes(w)));
  
  console.log('\n본문 전문 (확인용):\n', story);
}

await test();

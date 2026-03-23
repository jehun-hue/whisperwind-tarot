(async () => {
  async function test(name, question, cards) {
    const start = Date.now();
    const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
      },
      body: JSON.stringify({
        birthInfo: { date: '1990-08-15', time: '14:30', gender: 'male', name: name, longitude: 126.978, latitude: 37.566 },
        question, cards
      })
    });
    const d = await r.json();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const story = d.reading?.tarot_reading?.choihanna?.story || '';
    const monad = d.reading?.tarot_reading?.monad?.story || '';
    const summary = d.reading?.integrated_summary || '';
    console.log(`\n=== ${name} ===`);
    console.log(`응답시간: ${elapsed}초`);
    console.log(`choihanna 길이: ${story.length}자`);
    console.log(`monad 길이: ${monad.length}자`);
    console.log(`요약 길이: ${summary.length}자`);
    console.log(`요약==본문?: ${summary === story ? '동일(폴백)' : '다름(정상)'}`);
    console.log(`choihanna 첫200자: ${story.substring(0, 200)}`);
    console.log(`choihanna 끝100자: ${story.substring(story.length - 100)}`);
  }

  // 이전에 3,200자 나왔던 이직 질문
  await test('이직재테스트', '지금 회사를 그만두고 창업해도 될까요?',
    [{name:'The Star',position:'upright'},{name:'Eight of Pentacles',position:'upright'},{name:'The Tower',position:'reversed'}]);

  // 이전에 짧게 나온 투자 질문
  await test('투자재테스트', '주식 투자를 확장해도 될까요?',
    [{name:'The Wheel of Fortune',position:'upright'},{name:'The Devil',position:'reversed'},{name:'Ten of Pentacles',position:'upright'}]);
})();

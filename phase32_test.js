
async function test(question, name) {
  console.log(`\n>>> Testing: ${name} (Question: ${question})`);
  const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
    },
    body: JSON.stringify({
      birthInfo: { date: '1990-08-15', time: '14:30', gender: 'male', name, englishName: 'Test', longitude: 126.978, latitude: 37.566 },
      question,
      cards: [{ name: 'The Star', position: 'upright' }]
    })
  });
  const d = await r.json();
  const prompt = d.debug_prompt || '';
  
  console.log('Detected Topic:', d.topic_validation?.topic);
  
  const hasFocusSection = prompt.includes('[질문 주제별 핵심 분석 포인트]');
  console.log('Has Focus Section in Prompt:', hasFocusSection);
  
  if (hasFocusSection) {
    const focusContent = prompt.split('[질문 주제별 핵심 분석 포인트]')[1].split('━━━━━━━━━━━━━━━━━━━━━━━━')[0];
    console.log('Focus Keywords in Prompt:\n', focusContent.trim());
  }

  // Check if integrated_summary reflects the focus (optional, usually slow)
  // console.log('Summary Preview:', d.integrated_summary.slice(0, 100));
}

async function run() {
  await test('올해 하반기 이직운이 궁금해요', '직업테스트');
  await test('헤어진 연인과 재회할 수 있을까요?', '연애테스트');
}

run();

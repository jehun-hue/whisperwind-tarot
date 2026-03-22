const fs = require('fs');

async function run() {
  const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
    },
    body: JSON.stringify({
      birthInfo: { date: '1987-07-17', time: '15:30', gender: 'male', name: '홍길동', englishName: 'Hong Gildong', longitude: 126.978, latitude: 37.566 },
      question: '자미두수와 점성술 데이터를 활용해 제 미래의 흐름을 알려주세요.',
      cards: [{ name: 'The Magician', position: 'upright' }, { name: 'Wheel of Fortune', position: 'upright' }, { name: 'Death', position: 'reversed' }]
    })
  });
  const d = await r.json();
  const story = d.reading?.tarot_reading?.choihanna?.story || 'Error';
  fs.writeFileSync('final_reading.txt', story, 'utf8');
  console.log('Saved to final_reading.txt');
}
run();

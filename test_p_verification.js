
const payload = {
  birthInfo: {
    date: '1988-09-25',
    time: '06:30',
    gender: 'female',
    name: '정하은Q_검증',
    englishName: 'Jung Haeun',
    longitude: 126.978,
    latitude: 37.566
  },
  question: '올해 이사 적기가 언제인가요?',
  cards: [
    { name: 'The World', position: 'upright' },
    { name: 'Six of Swords', position: 'upright' },
    { name: 'Eight of Cups', position: 'upright' }
  ]
};

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE';

async function run() {
  console.log("Starting fetch...");
  try {
    const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    console.log("Status:", r.status);
    const d = await r.json();
    
    // Check if error
    if (d.error || !d.reading) {
      console.log("API Error:", d);
      return;
    }

    const hanna = d.reading.tarot_reading.choihanna.story;
    const monad = d.reading.tarot_reading.monad?.story || '';
    const summary = d.reading.integrated_summary || '';
    
    const all = hanna + monad + summary;
    
    const forbid = ['자미', '명궁', '화기', '화록', '점성', '상승궁', '트랜짓', '수비학', '생명수', '표현수'];
    const found = forbid.filter(w => all.includes(w));
    
    console.log('금지어검출:', found.length ? found : '없음');
    console.log('월추천:', all.match(/\d+월/g));
    console.log('세운언급:', /세운|올해.*운/.test(all));
    console.log('대운언급:', /대운|큰.*흐름/.test(all));
  } catch (err) {
    console.error("Fetch Error:", err.message);
  }
}

run();


fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE'
  },
  body: JSON.stringify({
    birthInfo: { date: '1990-08-15', time: '14:30', gender: 'male', name: '검수V', englishName: 'Audit V', longitude: 126.978, latitude: 37.566 },
    question: '올해 하반기 이직 적기는?',
    cards: [{ name: 'Wheel of Fortune', position: 'upright' }, { name: 'The Hermit', position: 'reversed' }, { name: 'Ace of Pentacles', position: 'upright' }]
  })
})
.then(r => r.json())
.then(d => {
  // 1. 월운 확인
  const saju = d.analyses?.saju || d.system_calculations?.saju || d.reading?.saju || {};
  const wolwoon = saju.wolwoon || saju.wolun || saju.monthly_luck || '없음';
  console.log('=== 1. 사주 월운 ===');
  console.log('wolwoon:', typeof wolwoon === 'object' ? JSON.stringify(wolwoon).slice(0,500) : wolwoon);

  // 2. 교운기 확인
  const daewoon = saju.daewoon || {};
  // Check the flag at both levels (saju level and daewoon level)
  const changing = saju.is_daewoon_changing_year !== undefined ? saju.is_daewoon_changing_year : (daewoon.is_daewoon_changing_year !== undefined ? daewoon.is_daewoon_changing_year : (daewoon.is_daeun_changing_year !== undefined ? daewoon.is_daeun_changing_year : '미확인'));
  console.log('\n=== 2. 교운기 ===');
  console.log('is_changing:', changing);

  // 3. 리딩에 시간축 근거가 반영되었는지 (텍스트 분석)
  const story = d.reading?.tarot_reading?.choihanna?.story || d.reading?.tarot_reading?.hanna?.story || '';
  const summary = d.reading?.integrated_summary || d.reading?.summary || '';
  const all = story + summary;
  console.log('\n=== 3. 시간축 텍스트 반영 ===');
  console.log('월언급:', all.match(/\d+월/g));
  console.log('하반기언급:', /하반기|후반|7월|8월|9월|10월|11월|12월/.test(all));
  console.log('흐름언급:', /흐름|기운|운의|시기|때|타이밍/.test(all));
  console.log('리딩길이:', story.length);
  
  // extra debug: saju keys
  console.log('\n=== [DEBUG] Saju Keys ===');
  console.log(Object.keys(saju));
})
.catch(err => console.error("Fetch Error:", err.message));

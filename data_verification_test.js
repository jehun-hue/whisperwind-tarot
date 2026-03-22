
const payload = {
  birthInfo: {
    date: '1988-09-25',
    time: '06:30',
    gender: 'female',
    name: '정하은R_데이터검증',
    englishName: 'Jung Haeun',
    longitude: 126.978,
    latitude: 37.566
  },
  question: '올해 운세',
  cards: [
    { name: 'The Star', position: 'upright' }
  ]
};

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTU0MTMsImV4cCI6MjA2MDY5MTQxM30.8bfxMQblVcBkERmMFVBbYlp7bDPv6WzisWIvRaJYAJE';

async function run() {
  console.log("Starting data verification fetch...");
  try {
    const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!r.ok) {
      console.error("HTTP Error:", r.status);
      return;
    }

    const d = await r.json();
    const rd = d.reading || {};
    const z = rd.ziwei || {};
    const a = rd.astrology || {};
    const s = rd.saju || {};

    console.log('=== 자미두수 시간축 ===');
    console.log('currentMajorPeriod:', z.currentMajorPeriod || z.current_major_period || '없음');
    console.log('currentMinorPeriod:', z.currentMinorPeriod || z.current_minor_period || '없음');
    console.log('annualTransformations:', z.annualTransformations || z.annual_transformations || '없음');

    console.log('=== 점성술 시간축 ===');
    console.log('transits:', a.transits?.length || 0, '개');
    console.log('progression:', a.secondaryProgression || a.secondary_progression || '없음');
    console.log('solarReturn:', a.solarReturn || a.solar_return || '없음');

    console.log('=== 사주 시간축 ===');
    console.log('daewoon:', s.daewoon?.current || s.daewoon || '없음');
    console.log('sewoon:', s.sewoon || '없음');
    console.log('isDaewoonChanging:', s.is_daewoon_changing_year || s.isDaewoonChangingYear || '없음');

  } catch (err) {
    console.error("Fetch Error:", err.message);
  }
}

run();


const payload = {
  birthInfo: {
    date: '1988-09-25',
    time: '06:30',
    gender: 'female',
    name: '정하은R_v2_최종검증',
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
  console.log("Starting v2 final data verification...");
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
    
    // Check multiple possible paths
    const z = d.ziwei_analysis || d.system_calculations?.ziwei || d.analyses?.ziwei || {};
    const a = d.astrology_analysis || d.system_calculations?.astrology || d.analyses?.astrology || {};
    const s = d.saju_analysis || d.system_calculations?.saju || d.analyses?.saju || {};

    console.log('=== [DEBUG] JSON Keys Detected ===');
    console.log('Top Level Keys:', Object.keys(d));
    if (d.reading) console.log('Reading Keys:', Object.keys(d.reading));
    
    console.log('\n=== 자미두수 (Ziwei) ===');
    console.log('major_period:', !!(z.current_major_period || z.currentMajorPeriod));
    console.log('minor_period:', !!(z.current_minor_period || z.currentMinorPeriod));
    console.log('annual_trans:', (z.annual_transformations || z.annualTransformations)?.length || 0, '개');

    console.log('\n=== 점성술 (Astrology) ===');
    console.log('transits_count:', a.transits?.length || 0);
    console.log('progression:', !!(a.secondary_progression || a.secondaryProgression));
    console.log('solar_return:', !!(a.solar_return || a.solarReturn));

    console.log('\n=== 사주 (Saju) ===');
    console.log('daewoon:', !!s.daewoon);
    console.log('sewoon:', !!s.sewoon);

    const n = d.analyses?.numerology || d.system_calculations?.numerology || {};
    console.log('\n=== 수비학 (Numerology) ===');
    console.log('personal_year:', n.personal_year || '없음');
    console.log('pinnacle:', n.currentPinnacle?.number || '없음');
    console.log('challenge:', n.currentChallenge?.number || '없음');

  } catch (err) {
    console.error("Fetch Error:", err.message);
  }
}

run();

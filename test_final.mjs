async function test() {
  try {
    const payload = {
      birthInfo: { year: 1987, month: 7, day: 17, hour: 15, minute: 30, gender: 'M', isLunar: false, longitude: 127.5 },
      question: '2026운세',
      cards: [{ name: 'The Tower', position: '현재', isReversed: false }],
      mode: 'data-only'
    };
    const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxMjY1MDEsImV4cCI6MjA1MzcwMjUwMX0.JME92xEHs8-8R3ipOcBgJuv9MXr0l66l-8P0MqVmHFQ'
      },
      body: JSON.stringify(payload)
    });
    const j = await r.json();
    console.log('STATUS:', j.status);
    console.log('KEYS:', Object.keys(j));
    if (j.saju_raw) {
       console.log('saju_raw dayMaster:', j.saju_raw.dayMaster);
       console.log('saju_raw strength:', j.saju_raw.strength);
    } else {
       console.log('saju_raw NOT FOUND');
    }
    if (j.saju_analysis) {
       console.log('saju_analysis yongShin:', j.saju_analysis.yongShin);
       console.log('saju_analysis strength:', j.saju_analysis.strength);
    } else {
       console.log('saju_analysis NOT FOUND');
    }
  } catch (e) {
    console.error('ERROR:', e);
  }
}

test();

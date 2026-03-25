async function test() {
  try {
    const payload = {
      birthInfo: { year: 1987, month: 7, day: 17, hour: 15, minute: 30, gender: 'M', isLunar: false, longitude: 127.5 },
      question: 'test',
      cards: [{ name: 'The Tower', position: 'a', isReversed: false }],
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
    console.log('has_time:', j.saju_raw?.has_time);
    console.log('hour_pillar:', JSON.stringify(j.saju_raw?.pillars?.hour));
    console.log('strength:', j.saju_raw?.strength);
    console.log('percent:', j.saju_raw?.strength_detail?.percent);
    console.log('score:', j.saju_raw?.strength_detail?.score);
    console.log(j.saju_raw?.strength === '약변강' ? 'PASS' : 'FAIL: ' + j.saju_raw?.strength);
  } catch (e) {
    console.error('ERROR:', e);
  }
}

test();

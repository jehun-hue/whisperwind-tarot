async function test() {
  const p = {
    birthInfo: { year: 1987, month: 7, day: 17, hour: 15, minute: 30, gender: 'M', isLunar: false, longitude: 127.5 },
    question: '2026운세',
    cards: [{ name: 'The Tower', position: '현재', isReversed: false }],
    mode: 'data-only'
  };
  try {
    const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxMjIxMDAsImV4cCI6MjA1NTY5ODEwMH0.dGSM0fK53GY0z6906Z3MQcChEwVJB05r_GUZJbVefhE'
      },
      body: JSON.stringify(p)
    });
    const d = await r.json();
    const sa = d.saju_analysis || {};
    const sr = d.saju_raw || {};

    console.log('=== DAEWOON DEBUG ===');
    console.log('saju_raw.daewoon exists:', !!sr.daewoon);
    console.log('saju_analysis.daewoon exists:', !!sa.daewoon);

    const dw = sr.daewoon || sa.daewoon || d.daewoon;
    if (dw) {
      console.log('isForward:', dw.isForward);
      console.log('direction:', dw.direction);
      console.log('startAge:', dw.startAge || dw.age);
      console.log('currentAge:', dw.currentAge);
      console.log('currentDaewoon:', JSON.stringify(dw.currentDaewoon));
      console.log('pillars count:', dw.pillars?.length);
      console.log('first 5 pillars:', JSON.stringify(dw.pillars?.slice(0, 5).map(p => p.full + ' ' + p.startAge + '세')));
      console.log('current_seun:', JSON.stringify(dw.current_seun));
      console.log('is_daeun_changing_year:', dw.is_daeun_changing_year);
    } else {
      console.log('daewoon NOT FOUND in response');
      console.log('top-level keys:', Object.keys(d).join(', '));
      const search = (obj, path = '') => {
        if (!obj || typeof obj !== 'object') return;
        for (const k of Object.keys(obj)) {
          if (k.toLowerCase().includes('daewoon') || k.toLowerCase().includes('daeun') || k.toLowerCase().includes('대운')) {
            console.log('FOUND:', path + '.' + k, '=', typeof obj[k] === 'object' ? '{...}' : obj[k]);
          }
          if (typeof obj[k] === 'object' && obj[k]) search(obj[k], path + '.' + k);
        }
      };
      search(d, 'root');
    }

    console.log('\n=== ELEMENT COUNTS ===');
    console.log('elements(raw):', JSON.stringify(sr.elements));
    console.log('elements(analysis):', JSON.stringify(sa.elements));

    console.log('\n=== TEN GODS ===');
    console.log('tenGods:', JSON.stringify(sa.tenGods));

    console.log('\n=== YIN/YANG ===');
    console.log('yinYang:', JSON.stringify(sa.yinYang || sa.yinyang));
  } catch (e) {
    console.error('ERROR:', e);
  }
}

test();

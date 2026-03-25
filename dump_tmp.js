import fs from 'node:fs';

(async () => {
  const p = {
    birthInfo: {
      year: 1987, month: 7, day: 17,
      hour: 15, minute: 30,
      gender: 'M', isLunar: false, longitude: 127.5
    },
    question: '2026운세',
    cards: [
      { name: 'The Tower', position: '현재 상황', isReversed: false },
      { name: 'The Star', position: '핵심 문제', isReversed: false },
      { name: 'Ten of Pentacles', position: '조언', isReversed: true }
    ],
    mode: 'data-only'
  };

  const r = await fetch(
    'https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxMjY1MDEsImV4cCI6MjA1MzcwMjUwMX0.JME92xEHs8-8R3ipOcBgJuv9MXr0l66l-8P0MqVmHFQ'
      },
      body: JSON.stringify(p)
    }
  );

  console.log('=== STATUS:', r.status, '===');

  const txt = await r.text();

  // 파일로 저장
  fs.writeFileSync('test-response-dump.json', txt, 'utf8');
  console.log('전체 응답이 test-response-dump.json 에 저장됨');
  console.log('응답 길이:', txt.length, 'bytes');

  // JSON 파싱 시도
  try {
    const j = JSON.parse(txt);

    // 최상위 키 목록
    console.log('\n=== 최상위 키 ===');
    console.log(Object.keys(j));

    // 사주 관련 필드 탐색
    const paths = [
      'sajuResult', 'saju', 'data', 'result',
      'engineData', 'analysisData', 'reading'
    ];
    for (const k of paths) {
      if (j[k]) {
        console.log('\n=== j.' + k + ' 키 ===');
        console.log(Object.keys(j[k]));
      }
    }

    // 깊이 탐색 - dayMaster 찾기
    const findKey = (obj, target, path = '') => {
      if (!obj || typeof obj !== 'object') return;
      for (const [k, v] of Object.entries(obj)) {
        const cur = path + '.' + k;
        if (k.toLowerCase().includes(target)) {
          console.log('FOUND:', cur, '=', v);
        }
        if (typeof v === 'object' && v !== null) {
          findKey(v, target, cur);
        }
      }
    };

    console.log('\n=== daymaster 필드 검색 ===');
    findKey(j, 'daymaster');
    console.log('\n=== strength 필드 검색 ===');
    findKey(j, 'strength');
    console.log('\n=== yong 필드 검색 ===');
    findKey(j, 'yong');
    console.log('\n=== pillar 필드 검색 ===');
    findKey(j, 'pillar');

  } catch (e) {
    console.log('JSON 파싱 실패:', e.message);
    console.log('처음 500자:', txt.substring(0, 500));
  }
})().catch(e => console.error('FETCH ERROR:', e));

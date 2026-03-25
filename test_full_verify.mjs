const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxMjY1MDEsImV4cCI6MjA1MzcwMjUwMX0.JME92xEHs8-8R3ipOcBgJuv9MXr0l66l-8P0MqVmHFQ'
  },
  body: JSON.stringify({
    birthInfo: { year: 1987, month: 7, day: 17, hour: 15, minute: 30, gender: 'M', isLunar: false, longitude: 127.5 },
    question: '2026년 종합운세',
    cards: [{ name: 'The Tower', position: '현재', isReversed: false }],
    mode: 'data-only'
  })
});
const j = await r.json();

console.log('====== PHASE 1: 임제헌 전수 검증 ======');
console.log('');

// 1. 기둥
console.log('--- 1. 사주 4기둥 ---');
const p = j.saju_raw?.pillars;
console.log('년주:', p?.year?.stem + p?.year?.branch, '| 정답: 丁卯');
console.log('월주:', p?.month?.stem + p?.month?.branch, '| 정답: 丁未');
console.log('일주:', p?.day?.stem + p?.day?.branch, '| 정답: 丁卯');
console.log('시주:', p?.hour?.stem + p?.hour?.branch, '| 정답: 丁未');
console.log('일간:', j.saju_raw?.dayMaster, '| 정답: 丁');
console.log('');

// 2. 강약
console.log('--- 2. 신강약 ---');
console.log('strength:', j.saju_raw?.strength, '| 정답: 약변강');
console.log('score:', j.saju_raw?.strength_detail?.score, '/ 110');
console.log('percent:', j.saju_raw?.strength_detail?.percent, '%');
console.log('has_time:', j.saju_raw?.has_time);
console.log('');

// 3. 오행
console.log('--- 3. 오행 카운트 ---');
const el = j.saju_raw?.elements;
console.log('목:', el?.['목'], '| 정답: 2');
console.log('화:', el?.['화'], '| 정답: 4');
console.log('토:', el?.['토'], '| 정답: 2');
console.log('금:', el?.['금'], '| 정답: 0');
console.log('수:', el?.['수'], '| 정답: 0');
console.log('');

// 4. 용신 체계
console.log('--- 4. 용신/희신/기신/구신/한신 ---');
const sa = j.saju_analysis;
console.log('용신:', sa?.yongShin, '| 정답: 수(水)');
console.log('희신:', sa?.heeShin, '| 정답: 금(金)');
console.log('기신:', sa?.giShin, '| 정답: 토(土)');
console.log('구신:', sa?.guShin, '| 정답: 화(火)');
console.log('한신:', sa?.hanShin, '| 정답: 목(木)');
console.log('용신방법:', sa?.yongShinMethod);
console.log('');

// 5. 십성
console.log('--- 5. 십성 분포 ---');
const tg = sa?.tenGods;
console.log('비겁:', tg?.['비겁'], '| 정답: 3');
console.log('식상:', tg?.['식상'], '| 정답: 2');
console.log('재성:', tg?.['재성'], '| 정답: 0');
console.log('관성:', tg?.['관성'], '| 정답: 0');
console.log('인성:', tg?.['인성'], '| 정답: 2');
console.log('');

// 6. 대운
console.log('--- 6. 대운 ---');
const dw = sa?.daewoon;
console.log('대운 시작 나이:', dw?.startAge, '| 정답: 3세');
console.log('대운 방향:', dw?.direction, '| 정답: 역행');
console.log('현재 대운:', dw?.currentDaewoon?.full, '| 정답: 壬寅 (43세 시작)');
console.log('대운 기둥 수:', dw?.pillars?.length);
if (dw?.pillars) {
  dw.pillars.slice(0, 5).forEach((dp, i) => {
    console.log('  대운', i + 1, ':', dp.full, '(', dp.startAge, '세)');
  });
}
console.log('');

// 7. 격국
console.log('--- 7. 격국 ---');
console.log('격국:', sa?.gyeokguk?.name, '/', sa?.gyeokguk?.type);
console.log('');

// 8. 시간 보정
console.log('--- 8. 시간 보정 ---');
console.log('solarTimeApplied:', j.saju_raw?.solarTimeApplied);
console.log('time_corrected:', j.saju_raw?.time_corrected);
console.log('correctedDate:', j.saju_raw?.correctedDate);
console.log('solarTimeNote:', j.saju_raw?.solarTimeNote);
console.log('');

// 9. 신살
console.log('--- 9. 신살 ---');
console.log('신살 수:', sa?.shinsal?.length);
if (sa?.shinsal) {
  sa.shinsal.slice(0, 10).forEach(s => console.log(' ', s.name, '|', s.pillar));
}
console.log('');

// 10. 합충형
console.log('--- 10. 합충형 ---');
console.log('interactions:', sa?.interactions?.length);
if (sa?.interactions) {
  sa.interactions.slice(0, 10).forEach(x => console.log(' ', x.type, x.label || x.name || ''));
}

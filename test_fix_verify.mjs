const p = {
  birthInfo: { year: 1987, month: 7, day: 17, hour: 15, minute: 30, gender: 'M', isLunar: false, longitude: 127.5 },
  question: '2026운세',
  cards: [{ name: 'The Tower', position: '현재', isReversed: false }],
  mode: 'data-only'
};

const r = await fetch('https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxMjIxMDAsImV4cCI6MjA1NTY5ODEwMH0.dGSM0fK53GY0z6906Z3MQcChEwVJB05r_GUZJbVefhE'
  },
  body: JSON.stringify(p)
});

console.log('HTTP:', r.status);
const d = await r.json();
const sa = d.saju_analysis || {};

console.log('=== FULL SAJU_ANALYSIS ===');
console.log(JSON.stringify(sa, null, 2));

console.log('=== FIX VERIFICATION ===');
console.log('direction:', sa.daewoon?.direction);
console.log('yinYang:', JSON.stringify(sa.yinYang));
console.log('elements_simple:', JSON.stringify(sa.elements_simple));
console.log('tenGods_rounded:', JSON.stringify(sa.tenGods_rounded));

const y = sa.yinYang || {};
const es = sa.elements_simple || {};
const tg = sa.tenGods_rounded || {};
const checks = [
  ['direction', sa.daewoon?.direction, '역행'],
  ['yin', y.yin, 8],
  ['yang', y.yang, 0],
  ['목', es['목'], 2],
  ['화', es['화'], 4],
  ['토', es['토'], 2],
  ['금', es['금'], 0],
  ['수', es['수'], 0],
  ['비겁', tg['비겁'], 3],
  ['식상', tg['식상'], 2],
  ['재성', tg['재성'], 0],
  ['관성', tg['관성'], 0],
  ['인성', tg['인성'], 2]
];

let pass = 0, fail = 0;
for (const [name, actual, expected] of checks) {
  const ok = String(actual) === String(expected);
  console.log(ok ? 'PASS' : 'FAIL', name, 'got:', actual, 'expected:', expected);
  if (ok) pass++; else fail++;
}
console.log('Result:', pass + '/' + (pass + fail), 'PASS');

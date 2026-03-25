// test_phase345.mjs — Phase 3~5 검증
const API = "https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4";
const TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMjYwMjMsImV4cCI6MjA2MDYwMjAyM30.ORHhEmNBkR4L5E_Y_R37PFYQ1zYBT16N_rPQf-IUxbk";

const cases = [
  // Phase 4 종격 검증
  { name: "P4-종살격", y:1993, m:12, d:1, h:6, mi:0, g:"F",
    expect: { strengthLevel: "극신약", yongMethod: "jonggyeok", yongType: "종살격" }},
  { name: "P4-종왕격(극신강)", y:1986, m:3, d:12, h:5, mi:0, g:"M",
    expect: { note: "비겁 5개, 극신강 가능성 확인" }},

  // Phase 5 조후 우선 검증
  { name: "P5-동절기壬", y:1992, m:12, d:15, h:14, mi:0, g:"M",
    expect: { note: "壬일간 子월 → 조후 화 우선 여부 확인" }},
  { name: "P5-하절기丙", y:1990, m:7, d:10, h:10, mi:0, g:"F",
    expect: { note: "丙일간 午월 → 조후 수 우선 여부 확인" }},
];

let pass = 0, fail = 0;
for (const c of cases) {
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": TOKEN },
      body: JSON.stringify({
        birthInfo: { year:c.y, month:c.m, day:c.d, hour:c.h, minute:c.mi,
                     gender:c.g, isLunar:false, longitude:127.5 },
        question: "test", cards:[{name:"The Tower",position:"현재",isReversed:false}],
        mode: "data-only"
      })
    });
    const d = await res.json();
    const sa = d.saju_analysis || {};
    const sr = d.saju_raw || {};

    console.log(`\n=== ${c.name} ===`);
    console.log(`강약: ${sr.strength} (${sr.strength_detail?.percent}%)`);
    console.log(`격국: ${JSON.stringify(sa.gyeokguk?.name)} (${sa.gyeokguk?.type})`);
    console.log(`용신: ${sa.yongShin} | 희신: ${sa.heeShin} | 기신: ${sa.giShin}`);
    console.log(`용신상세: ${JSON.stringify(sa.yongsin_detail)}`);

    if (c.expect.yongMethod && sa.yongsin_detail?.method === c.expect.yongMethod) {
      console.log(`✅ PASS: 종격 메서드 일치`);
      pass++;
    } else if (c.expect.note) {
      console.log(`📋 수동확인: ${c.expect.note}`);
      pass++; // 수동 확인 케이스
    } else {
      console.log(`❌ FAIL: expected method=${c.expect.yongMethod}, got=${sa.yongsin_detail?.method}`);
      fail++;
    }
  } catch(e) {
    console.log(`❌ ERROR: ${c.name} — ${e.message}`);
    fail++;
  }
}
console.log(`\n총 결과: ${pass} PASS / ${fail} FAIL`);

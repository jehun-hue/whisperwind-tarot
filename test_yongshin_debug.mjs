const URL = 'https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4';
const AUTH = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxMjIxMDAsImV4cCI6MjA1NTY5ODEwMH0.dGSM0fK53GY0z6906Z3MQcChEwVJB05r_GUZJbVefhE';

const cases = [
  { name:"김민수", year:1990, month:3, day:15, hour:23, minute:30, gender:"M",
    ans:{ dm:"庚", yong:"금", hee:"토", gi:"화", gu:"목", han:"수" }},
  { name:"이서연", year:1985, month:8, day:8, hour:15, minute:30, gender:"M",
    ans:{ dm:"己", yong:"토", hee:"화", gi:"목", gu:"수", han:"금" }},
  { name:"박준호", year:1984, month:5, day:10, hour:14, minute:0, gender:"M",
    ans:{ dm:"甲", yong:"목", hee:"수", gi:"금", gu:"토", han:"화" }},
  { name:"최유진", year:1988, month:11, day:20, hour:6, minute:0, gender:"F",
    ans:{ dm:"己", yong:"토", hee:"화", gi:"목", gu:"수", han:"금" }},
  { name:"정대현", year:1993, month:9, day:25, hour:20, minute:0, gender:"F",
    ans:{ dm:"己", yong:"화", hee:"목", gi:"수", gu:"금", han:"토" }},
  { name:"한소희", year:2000, month:2, day:4, hour:10, minute:0, gender:"M",
    ans:{ dm:"壬", yong:"수", hee:"금", gi:"토", gu:"화", han:"목" }},
  { name:"송재원", year:1991, month:12, day:31, hour:12, minute:0, gender:"F",
    ans:{ dm:"乙", yong:"토", hee:"화", gi:"목", gu:"수", han:"금" }},
  { name:"유하은", year:1986, month:1, day:8, hour:3, minute:0, gender:"M",
    ans:{ dm:"壬", yong:"금", hee:"토", gi:"화", gu:"목", han:"수" }},
];

const EL = {"Wood":"목","Fire":"화","Earth":"토","Metal":"금","Water":"수",
  "목":"목","화":"화","토":"토","금":"금","수":"수"};

function k(v){ return EL[v] || v || "없음"; }

async function run() {
  let totalPass=0, totalFail=0;
  for (const c of cases) {
    const payload = {
      birthInfo: { year:c.year, month:c.month, day:c.day, hour:c.hour, minute:c.minute,
        gender:c.gender, isLunar:false, longitude:127.5 },
      question: "2026운세",
      cards: [{ name:"The Tower", position:"현재", isReversed:false }],
      mode: "data-only"
    };
    try {
      const r = await fetch(URL, {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':AUTH},
        body: JSON.stringify(payload)
      });
      const d = await r.json();
      const sa = d.saju_analysis || {};
      const ey=k(sa.yongShin), eh=k(sa.heeShin), eg=k(sa.giShin), eu=k(sa.guShin), ehn=k(sa.hanShin);
      let p=0,f=0;
      const chk=(label,eng,ans)=>{const ok=eng===ans;ok?p++:f++;return `${label}: 엔진=${eng} 정답=${ans} ${ok?'✅':'❌'}`};
      
      console.log(`\n===== ${c.name} (${c.year}-${String(c.month).padStart(2,'0')}-${String(c.day).padStart(2,'0')} ${c.hour}:${String(c.minute).padStart(2,'0')} ${c.gender}) =====`);
      console.log(`일간: ${sa.dayMaster} (정답:${c.ans.dm}) ${sa.dayMaster===c.ans.dm?'✅':'❌'}`);
      console.log(`강약: ${sa.strength}`);
      console.log(`용신방법: ${sa.yongShinMethod||'없음'}`);
      console.log(`용신상세: ${JSON.stringify(sa.yongShinDetail||{}).substring(0,200)}`);
      console.log(chk('용신',ey,c.ans.yong));
      console.log(chk('희신',eh,c.ans.hee));
      console.log(chk('기신',eg,c.ans.gi));
      console.log(chk('구신',eu,c.ans.gu));
      console.log(chk('한신',ehn,c.ans.han));
      console.log(`오행: ${JSON.stringify(sa.elements_simple)}`);
      console.log(`십성: ${JSON.stringify(sa.tenGods_rounded)}`);
      console.log(`대운: dir=${sa.daewoon?.direction} fwd=${sa.daewoon?.isForward} age=${sa.daewoon?.startAge}`);
      totalPass+=p; totalFail+=f;
      console.log(`>> ${c.name}: ${p}/5 PASS`);
    } catch(e) {
      console.log(`\n===== ${c.name} ERROR: ${e.message} =====`);
      totalFail+=5;
    }
  }
  console.log(`\n========== TOTAL 5신: ${totalPass}/${totalPass+totalFail} PASS ==========`);
}
run();

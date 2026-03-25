const AUTH='Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxMjIxMDAsImV4cCI6MjA1NTY5ODEwMH0.dGSM0fK53GY0z6906Z3MQcChEwVJB05r_GUZJbVefhE';
const U='https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4';

const newCases=[
  {name:"9.극신강남",y:1986,m:3,d:12,h:5,mi:0,g:'M'},
  {name:"10.극신강여",y:1992,m:6,d:15,h:11,mi:0,g:'F'},
  {name:"11.중화남",y:1995,m:4,d:20,h:8,mi:0,g:'M'},
  {name:"12.중화여",y:1988,m:10,d:5,h:14,mi:0,g:'F'},
  {name:"13.야자시남",y:1990,m:7,d:22,h:23,mi:15,g:'M'},
  {name:"14.야자시여",y:1985,m:1,d:3,h:23,mi:45,g:'F'},
  {name:"15.절기경계",y:2000,m:2,d:4,h:3,mi:0,g:'M'},
  {name:"16.시간미상",y:1978,m:9,d:18,h:0,mi:0,g:'F'},
  {name:"17.1950대남",y:1957,m:8,d:15,h:9,mi:0,g:'M'},
  {name:"18.극신약여",y:1993,m:12,d:1,h:16,mi:0,g:'F'},
  {name:"19.신강남",y:1982,m:5,d:28,h:7,mi:30,g:'M'},
  {name:"20.강변약여",y:1997,m:3,d:8,h:18,mi:0,g:'F'},
];

for(const c of newCases){
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${c.name} (${c.y}-${c.m}-${c.d} ${c.h}:${String(c.mi).padStart(2,'0')} ${c.g})`);
  console.log('='.repeat(60));
  try{
    const body={birthInfo:{year:c.y,month:c.m,day:c.d,hour:c.h,minute:c.mi,gender:c.g,isLunar:false,longitude:127.5},
      question:'2026운세',cards:[{name:'The Tower',position:'현재',isReversed:false}],mode:'data-only'};
    if(c.name.includes('시간미상')) body.birthInfo.hour=-1;
    const r=await fetch(U,{method:'POST',headers:{'Content-Type':'application/json','Authorization':AUTH},body:JSON.stringify(body)});
    const d=await r.json();
    const sa=d.saju_analysis||{};const sr=d.saju_raw||{};
    const pil=sr.pillars||{};
    const mk=(s,b)=>(s||'')+(b||'');
    console.log('4주:',mk(pil.year?.stem,pil.year?.branch),mk(pil.month?.stem,pil.month?.branch),mk(pil.day?.stem,pil.day?.branch),mk(pil.hour?.stem,pil.hour?.branch));
    console.log('일간:',sr.dayMaster,'강약:',sr.strength,'('+sr.strength_detail?.percent+'%)');
    console.log('용신:',sa.yongShin,'희신:',sa.heeShin,'기신:',sa.giShin,'구신:',sa.guShin,'한신:',sa.hanShin);
    console.log('오행:',JSON.stringify(sa.elements_simple));
    console.log('십성:',JSON.stringify(sa.tenGods_rounded));
    console.log('대운시작:',sa.daewoon?.startAge||sa.daewoon?.age,'방향:',sa.daewoon?.direction);
    console.log('음양:',sa.yinYang);
  }catch(e){console.log('ERROR:',e.message);}
}

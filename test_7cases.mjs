const AUTH='Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibWljaXVta2JzeWFtZGJhZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxMjIxMDAsImV4cCI6MjA2MDYwMjAyM30.ORHhEmNBkR4L5E_Y_R37PFYQ1zYBT16N_rPQf-IUxbk';
const U='https://gbmiciumkbsyamdbaddr.supabase.co/functions/v1/ai-reading-v4';
const cases=[
  {name:"1.김민수",y:1990,m:3,d:15,h:23,mi:30,g:'M',p:["庚午","己卯","庚辰","丙子"],dm:"庚",yo:"금",he:"토",gi:"화",gu:"목",ha:"수",yi:2,ya:6,el:{목:1,화:2,토:2,금:2,수:1},tg:{비겁:1,식상:1,재성:1,관성:2,인성:2},ds:7,dd:"순행"},
  {name:"2.오성민",y:1985,m:8,d:8,h:15,mi:30,g:'M',p:["乙丑","甲申","己卯","壬申"],dm:"己",yo:"목",he:"화",gi:"토",gu:"화",ha:"금",yi:4,ya:4,el:{목:3,화:0,토:2,금:2,수:1},tg:{비겁:1,식상:2,재성:1,관성:3,인성:0},ds:1,dd:"역행"},
  {name:"3.정대현",y:1984,m:5,d:10,h:14,mi:0,g:'M',p:["甲子","己巳","甲辰","辛未"],dm:"甲",yo:"목",he:"수",gi:"금",gu:"토",ha:"화",yi:4,ya:4,el:{목:2,화:1,토:3,금:1,수:1},tg:{비겁:1,식상:1,재성:3,관성:1,인성:1},ds:9,dd:"순행"},
  {name:"4.최유진",y:1988,m:11,d:20,h:6,mi:0,g:'F',p:["戊辰","癸亥","己卯","丁卯"],dm:"己",yo:"토",he:"화",gi:"목",gu:"수",ha:"금",yi:6,ya:2,el:{목:2,화:1,토:3,금:0,수:2},tg:{비겁:2,식상:0,재성:2,관성:2,인성:1},ds:4,dd:"역행"},
  {name:"5.한소희",y:1993,m:9,d:25,h:20,mi:0,g:'F',p:["癸酉","辛酉","己酉","甲戌"],dm:"己",yo:"목",he:"화",gi:"토",gu:"화",ha:"금",yi:6,ya:2,el:{목:1,화:0,토:2,금:4,수:1},tg:{비겁:1,식상:4,재성:1,관성:1,인성:0},ds:4,dd:"순행"},
  {name:"6.박준호",y:2000,m:2,d:4,h:10,mi:0,g:'M',p:["己卯","丁丑","壬辰","乙巳"],dm:"壬",yo:"수",he:"금",gi:"토",gu:"화",ha:"목",yi:6,ya:2,el:{목:2,화:2,토:3,금:0,수:1},tg:{비겁:0,식상:2,재성:2,관성:3,인성:0},ds:10,dd:"역행"},
  {name:"7.유하은",y:1991,m:12,d:31,h:12,mi:0,g:'F',p:["辛未","庚子","乙亥","壬午"],dm:"乙",yo:"토",he:"화",gi:"목",gu:"수",ha:"금",yi:4,ya:4,el:{목:1,화:1,토:1,금:2,수:3},tg:{비겁:0,식상:1,재성:1,관성:2,인성:3},ds:2,dd:"순행"},
  {name:"8.송재원",y:1986,m:1,d:8,h:3,mi:0,g:'M',p:["乙丑","己丑","壬子","辛丑"],dm:"壬",yo:"금",he:"토",gi:"화",gu:"목",ha:"수",yi:6,ya:2,el:{목:1,화:0,토:4,금:1,수:2},tg:{비겁:1,식상:1,재성:0,관성:4,인성:1},ds:1,dd:"역행"},
  // === Case 9~20: 확충 케이스 ===
  {name: "9.약변강남",y: 1986, m: 3, d: 12, h: 5, mi: 0, g: "M", p: ["丙寅", "辛卯", "乙卯", "戊寅"], dm: "乙", yo: "금", he: "토", gi: "화", gu: "목", ha: "수", ds: 8, dd: "순행"},
  {name: "10.신약여",y: 1992, m: 6, d: 15, h: 11, mi: 0, g: "F", p: ["壬申", "丙午", "壬戌", "乙巳"], dm: "壬", yo: "토", he: "금", gi: "수", gu: "금", ha: "목", ds: 3, dd: "역행"},
  {name: "11.약변강남2",y: 1995, m: 4, d: 20, h: 8, mi: 0, g: "M", p: ["乙亥", "庚辰", "辛巳", "壬辰"], dm: "辛", yo: "화", he: "목", gi: "수", gu: "금", ha: "토", ds: 5, dd: "역행"},
  {name: "12.중화여",y: 1988, m: 10, d: 5, h: 14, mi: 0, g: "F", p: ["戊辰", "辛酉", "癸巳", "戊午"], dm: "癸", yo: "수", he: "금", gi: "토", gu: "화", ha: "목", ds: 9, dd: "역행"},
  {name: "13.야자시남",y: 1990, m: 7, d: 22, h: 23, mi: 15, g: "M", p: ["庚午", "癸未", "戊子", "癸亥"], dm: "戊", yo: "토", he: "화", gi: "목", gu: "수", ha: "금", ds: 5, dd: "순행"},
  {name: "14.야자시여",y: 1985, m: 1, d: 3, h: 23, mi: 30, g: "F", p: ["甲子", "丙子", "癸卯", "壬子"], dm: "癸", yo: "토", he: "화", gi: "목", gu: "수", ha: "금", ds: 10, dd: "역행"},
  {name: "15.절기경계",y: 2000, m: 2, d: 4, h: 7, mi: 0, g: "M", p: ["己卯", "丁丑", "壬辰", "癸卯"], dm: "壬", yo: "수", he: "금", gi: "토", gu: "화", ha: "목", ds: 10, dd: "역행"},
  {name: "17.1950대남",y: 1957, m: 8, d: 15, h: 9, mi: 0, g: "M", p: ["丁酉", "戊申", "己未", "戊辰"], dm: "己", yo: "목", he: "수", gi: "금", gu: "토", ha: "화", ds: 3, dd: "역행"},
  {name: "18.극신약여",y: 1993, m: 12, d: 1, h: 6, mi: 0, g: "F", p: ["癸酉", "癸亥", "丙辰", "辛卯"], dm: "丙", yo: "수", he: "목", gi: "화", gu: "목", ha: "토", ds: 2, dd: "순행"},
  {name: "19.신약남",y: 1982, m: 5, d: 28, h: 23, mi: 0, g: "M", p: ["壬戌", "乙巳", "辛亥", "己亥"], dm: "辛", yo: "화", he: "토", gi: "금", gu: "토", ha: "수", ds: 3, dd: "순행"},
  {name: "20.신약여",y: 1997, m: 3, d: 8, h: 1, mi: 0, g: "F", p: ["丁丑", "癸卯", "己酉", "甲子"], dm: "己", yo: "목", he: "화", gi: "토", gu: "화", ha: "금", ds: 9, dd: "순행"},
];
let totalP=0,totalF=0;
for(const c of cases){
  console.log(`\n${'='.repeat(60)}\n${c.name} (${c.y}-${c.m}-${c.d} ${c.h}:${String(c.mi).padStart(2,'0')} ${c.g})\n${'='.repeat(60)}`);
  try{
    const r=await fetch(U,{method:'POST',headers:{'Content-Type':'application/json','Authorization':AUTH},
      body:JSON.stringify({birthInfo:{year:c.y,month:c.m,day:c.d,hour:c.h,minute:c.mi,gender:c.g,isLunar:false,longitude:127.5},
        question:'2026운세',cards:[{name:'The Tower',position:'현재',isReversed:false}],mode:'data-only'})});
    const d=await r.json();
    const sa=d.saju_analysis||{};const sr=d.saju_raw||{};
    const pil=sr.pillars||sa.pillars||{};
    const mk=(s,b)=>(s||'')+(b||'');
    const eng={
      p:[mk(pil.year?.stem,pil.year?.branch),mk(pil.month?.stem,pil.month?.branch),mk(pil.day?.stem,pil.day?.branch),mk(pil.hour?.stem,pil.hour?.branch)],
      dm:sr.dayMaster||sa.dayMaster||'',
      yo:sa.yongShin||'',he:sa.heeShin||'',gi:sa.giShin||'',gu:sa.guShin||'',ha:sa.hanShin||'',
      yi:(sa.yinYang?.yin??'?'),ya:(sa.yinYang?.yang??'?'),
      el:sa.elements_simple||{},tg:sa.tenGods_rounded||{},
      ds:sa.daewoon?.startAge||sa.daewoon?.age||'?',dd:sa.daewoon?.direction||'?'
    };
    const chk=(n,a,e)=>{if(e===undefined)return true;const ok=String(a)===String(e);if(ok)totalP++;else totalF++;console.log(ok?'  PASS':'  FAIL',n,'got:',a,'exp:',e);return ok;};
    chk('년주',eng.p[0],c.p[0]);chk('월주',eng.p[1],c.p[1]);chk('일주',eng.p[2],c.p[2]);chk('시주',eng.p[3],c.p[3]);
    chk('일간',eng.dm,c.dm);chk('용신',eng.yo,c.yo);chk('희신',eng.he,c.he);chk('기신',eng.gi,c.gi);chk('구신',eng.gu,c.gu);chk('한신',eng.ha,c.ha);
    chk('음',eng.yi,c.yi);chk('양',eng.ya,c.ya);
    for(const k of ['목','화','토','금','수'])chk('오행_'+k,eng.el[k]??'?',c.el?.[k]);
    for(const k of ['비겁','식상','재성','관성','인성'])chk('십성_'+k,eng.tg[k]??'?',c.tg?.[k]);
    chk('대운시작',eng.ds,c.ds);chk('대운방향',eng.dd,c.dd);
  }catch(e){console.log('  ERROR:',e.message);totalF+=24;}
}
console.log(`\n${'='.repeat(60)}\nTOTAL: ${totalP} PASS / ${totalF} FAIL (${totalP+totalF} checks)\n${'='.repeat(60)}`);

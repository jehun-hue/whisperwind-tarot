import { getFullSaju } from "./sajuEngine.ts";
import { analyzeSajuStructure } from "./aiSajuAnalysis.ts";

async function runTest() {
  console.log("==========================================");
  console.log("[사주 엔진 테스트] 대상: 임제헌");
  console.log("출생: 1987년 7월 17일 15:30");
  console.log("==========================================");

  const birthData = {
    year: 1987,
    month: 7,
    day: 17,
    hour: 15,
    minute: 30,
    gender: "M" as const
  };

  const sajuRaw = await getFullSaju(
    birthData.year,
    birthData.month,
    birthData.day,
    birthData.hour,
    birthData.minute,
    birthData.gender,
    127.5
  );

  const analysis = await analyzeSajuStructure(sajuRaw);

  const pillars = sajuRaw.pillars;

  console.log("1. 사주 팔자");
  console.log(`   년주: ${pillars.year.stem}${pillars.year.branch}`);
  console.log(`   월주: ${pillars.month.stem}${pillars.month.branch}`);
  console.log(`   일주: ${pillars.day.stem}${pillars.day.branch}`);
  console.log(`   시주: ${pillars.hour.stem}${pillars.hour.branch}`);
  console.log("");

  console.log("2. 일간 및 강약 상세");
  console.log(`   일간: ${analysis.dayMaster}`);
  if (analysis.strength_detail) {
    const sd = analysis.strength_detail;
    console.log(`   득령/실령: ${sd.deukryeong.result} (${sd.deukryeong.reason})`);
    console.log(`   득지/실지: ${sd.deukji.result} (${sd.deukji.reason})`);
    console.log(`   득세/실세: ${sd.deukse.result} (${sd.deukse.reason})`);
    console.log(`   최종 강약: ${sd.overall} (${sd.overall_reason})`);
  } else {
    console.log(`   신강약: ${analysis.strength}`);
  }
  console.log("");

  console.log("3. 십신 배치");
  // getFullSaju는 pillars.year.tenGodStem 형식을 쓰거나, calculateTenGod 결과가 상위에 있을 수 있음
  // sajuEngine.ts의 getFullSaju 리턴 구성을 보니 pillars 내부에 필드가 있는 것으로 추정
  // 실제 sajuEngine.ts 코드를 보니 pillars.year 에는 { stem, branch } 만 있음.
  // 십신은 analyzeSajuStructure가 계산함.
  // 하지만 test-saju.ts에서는 원본 pillars 정보를 출력하고 싶어함.
  // getFullSaju 코드를 다시 보니 십신은 리턴에 포함 안됨? 
  // 아, getFullSaju 리턴 객체에 tenGods가 없음.
  // 대신 aiSajuAnalysis에서 계산된 tenGods를 사용하거나, pillars를 직접 활용.
  // 일단 기존 코드 스타일 유지.
  console.log(`   년간: ${pillars.year.stem} / 년지: ${pillars.year.branch}`);
  console.log(`   월간: ${pillars.month.stem} / 월지: ${pillars.month.branch}`);
  console.log(`   일지: ${pillars.day.branch}`);
  console.log(`   시간: ${pillars.hour.stem} / 시지: ${pillars.hour.branch}`);
  console.log("");

  console.log("4. 오행 균형");
  const els = analysis.elements;
  console.log(`   목:${els.목 || 0}, 화:${els.화 || 0}, 토:${els.토 || 0}, 금:${els.금 || 0}, 수:${els.수 || 0}`);
  console.log("");

  console.log("4-2. 십신 에너지 분포");
  if (analysis.tenGodDistribution) {
    const td = analysis.tenGodDistribution;
    console.log(`   점수계: 비겁(${td.groups.비겁.toFixed(1)}), 식상(${td.groups.식상.toFixed(1)}), 재성(${td.groups.재성.toFixed(1)}), 관성(${td.groups.관성.toFixed(1)}), 인성(${td.groups.인성.toFixed(1)})`);
    console.log(`   세부: 비견(${td.scores.비견.toFixed(1)}), 겁재(${td.scores.겁재.toFixed(1)}), 식신(${td.scores.식신.toFixed(1)}), 상관(${td.scores.상상 || td.scores.상관 || 0}) ...`);
    console.log(`   분석: ${td.analysis}`);
  }
  console.log("");

  console.log("5. 용신·희신·기신 (상세)");
  if (analysis.yongsin_detail) {
    const yd = analysis.yongsin_detail;
    console.log(`   [억부] ${yd.eokbu.yongsin} (${yd.eokbu.reason})`);
    console.log(`   [조후] ${yd.johu.yongsin}${yd.johu.secondary ? `, ${yd.johu.secondary}` : ""} (${yd.johu.reason})`);
    console.log(`   [통관] ${yd.tonggwan.yongsin || "해당없음"} (${yd.tonggwan.reason})`);
    console.log(`   [최종] ${yd.final.primary} (${yd.final.reason})`);
  } else {
    console.log(`   용신: ${analysis.yongShin} (${analysis.yongShinMethod})`);
  }
  console.log(`   희신: ${analysis.heeShin}`);
  console.log(`   기신: ${analysis.giShin}`);
  console.log(`   구신: ${analysis.guShin}`);
  console.log(`   한신: ${analysis.hanShin}`);
  console.log("");

  console.log("6. 격국 판별");
  if (analysis.gyeokguk) {
    console.log(`   격국명: ${analysis.gyeokguk.name} (${analysis.gyeokguk.type})`);
    console.log(`   설명: ${analysis.gyeokguk.description}`);
  }
  console.log("");

  console.log("7. 12운성");
  if (analysis.twelve_stages?.pillars && analysis.twelve_stages_geobup?.pillars) {
    const ts = analysis.twelve_stages.pillars;
    const tg = analysis.twelve_stages_geobup.pillars;
    console.log(`   년지 ${pillars.year.branch}: 봉법 ${ts.year.stage}(${ts.year.level}) / 거법 ${tg.year}`);
    console.log(`   월지 ${pillars.month.branch}: 봉법 ${ts.month.stage}(${ts.month.level}) / 거법 ${tg.month}`);
    console.log(`   일지 ${pillars.day.branch}: 봉법 ${ts.day.stage}(${ts.day.level}) / 거법 ${tg.day}`);
    console.log(`   시지 ${pillars.hour.branch}: 봉법 ${ts.hour.stage}(${ts.hour.level}) / 거법 ${tg.hour}`);
  }
  console.log("");

  console.log("8. 합충형파해 감지");
  analysis.interactions.forEach((inter: any) => {
    console.log(`   [${inter.severity}] ${inter.type}(${inter.elements.join(",")}): ${inter.meaning_keyword}`);
  });
  console.log("");

  console.log("9. 신살 목록");
  if (analysis.shinsal_grouped) {
    const sg = analysis.shinsal_grouped;
    const formatS = (list: any[]) => list?.map(s => s.name).join(", ") || "없음";
    console.log(`   년주 ${pillars.year.branch}: ${formatS(sg.year)}`);
    console.log(`   월주 ${pillars.month.branch}: ${formatS(sg.month)}`);
    console.log(`   일주 ${pillars.day.branch}: ${formatS(sg.day)}`);
    console.log(`   시주 ${pillars.hour.branch}: ${formatS(sg.hour)}`);
    if (sg.general?.length > 0) console.log(`   기타: ${formatS(sg.general)}`);
  }
  console.log("");

  console.log("10. 공망");
  const gongmang = (analysis.shinsal || []).find((s: any) => s.name === "공망");
  console.log(`   결과: ${gongmang ? "존재 (허약 체질 및 갈증 주의)" : "미감결"}`);
  console.log("");

  console.log("14. 지장간");
  // aiSajuAnalysis에서 계산된 지장간 정보 (v4-format)
  // pillars 기반 지장간 출력
  console.log("   (지장간 정보 생략 - aiSajuAnalysis 연동 결과 확인)");
  console.log("");

  console.log("15. 귀문관살·원진살");
  if (analysis.gwimun_wonjin) {
    const gw = analysis.gwimun_wonjin;
    console.log(`   귀문관살: ${gw.gwimun.join(", ") || "없음"}`);
    console.log(`   원진살: ${gw.wonjin.join(", ") || "없음"}`);
    if (gw.daewoon.length > 0) console.log(`   대운: ${gw.daewoon.join(", ")}`);
    if (gw.seun.length > 0) console.log(`   세운: ${gw.seun.join(", ")}`);
  }
  console.log("");

  console.log("16. 납음오행");
  if (analysis.napeum) {
    const n = analysis.napeum;
    console.log(`   년주 ${pillars.year.stem}${pillars.year.branch}: ${n.year.name}`);
    console.log(`   월주 ${pillars.month.stem}${pillars.month.branch}: ${n.month.name}`);
    console.log(`   일주 ${pillars.day.stem}${pillars.day.branch}: ${n.day.name}`);
    console.log(`   시주 ${pillars.hour.stem}${pillars.hour.branch}: ${n.hour.name}`);
  }
  console.log("");

  console.log("17. 대운·세운·월운 교차 합충");
  if (analysis.cross_interactions) {
    const ci = analysis.cross_interactions;
    const formatRel = (rel: any) => `${rel.pair} ${rel.type}(${rel.description})`;
    
    console.log("   [대운 교차]");
    ci.daewoon.stem_rels.forEach((r: any) => console.log(`      천간: ${formatRel(r)}`));
    ci.daewoon.branch_rels.forEach((r: any) => console.log(`      지지: ${formatRel(r)}`));
    
    console.log("   [세운 교차]");
    ci.sewoon.with_original.branch_rels.forEach((r: any) => console.log(`      원국지: ${formatRel(r)}`));
    ci.sewoon.with_daewoon.branch_rels.forEach((r: any) => console.log(`      대운지: ${formatRel(r)}`));

    console.log("   [월운 교차]");
    ci.wolwoon.with_original.branch_rels.forEach((r: any) => console.log(`      원국지: ${formatRel(r)}`));
    
    console.log(`   요약: ${ci.summary}`);
  }
  console.log("");

  console.log("==========================================");
  console.log("[테스트 종료]");
}

runTest();

/**
 * test-saju.ts
 * 사주 엔진 정밀도 검증 테스트 스크립트
 */

import { getFullSaju } from "./sajuEngine.ts";
import { analyzeSajuStructure } from "./aiSajuAnalysis.ts";
import { calculateTenGod, calculateTenGodBranch } from "./lib/tenGods.ts";

const TEST_USER = {
  name: "임제헌",
  year: 1987,
  month: 7,
  day: 17,
  hour: 15,
  minute: 30,
  gender: "M" as const,
  isLunar: false,
  birthPlace: "서울"
};

async function runTest() {
  console.log("==========================================");
  console.log(`[사주 엔진 테스트] 대상: ${TEST_USER.name}`);
  console.log(`출생: ${TEST_USER.year}년 ${TEST_USER.month}월 ${TEST_USER.day}일 ${TEST_USER.hour}:${TEST_USER.minute}`);
  console.log("==========================================");

  // 1. 기초 사주 데이터 (만세력 변환)
  const sajuRaw = getFullSaju(
    TEST_USER.year,
    TEST_USER.month,
    TEST_USER.day,
    TEST_USER.hour,
    TEST_USER.minute,
    TEST_USER.gender,
    127.0, // 서울 경도 근사값
    true
  );

  const pillars = sajuRaw.pillars;
  const STEM_KO: Record<string, string> = { "甲":"갑", "乙":"을", "丙":"병", "丁":"정", "戊":"무", "己":"기", "庚":"경", "辛":"신", "壬":"임", "癸":"계" };
  const BRANCH_KO: Record<string, string> = { "子":"자", "丑":"축", "寅":"인", "卯":"묘", "辰":"진", "巳":"사", "午":"오", "未":"미", "申":"신", "酉":"유", "戌":"술", "亥":"해" };

  const formatPillar = (p: { stem: string; branch: string }) => 
    `${p.stem}${p.branch} (${STEM_KO[p.stem] || p.stem}${BRANCH_KO[p.branch] || p.branch})`;

  console.log("1. 사주 팔자");
  console.log(`   년주: ${formatPillar(pillars.year)}`);
  console.log(`   월주: ${formatPillar(pillars.month)}`);
  console.log(`   일주: ${formatPillar(pillars.day)}`);
  console.log(`   시주: ${formatPillar(pillars.hour)}`);
  console.log("");

  // 2. 심층 분석 (십신, 오행, 용신, 격국, 12운성 등)
  const analysis = await analyzeSajuStructure(sajuRaw);

  console.log("2. 일간 및 오행");
  console.log(`   일간: ${analysis.dayMaster} (${STEM_KO[analysis.dayMaster]})`);
  console.log(`   신강약: ${analysis.strength}`);
  console.log("");

  console.log("3. 십신 배치");
  const tg = {
    yearStem: calculateTenGod(analysis.dayMaster, pillars.year.stem),
    yearBranch: calculateTenGodBranch(analysis.dayMaster, pillars.year.branch),
    monthStem: calculateTenGod(analysis.dayMaster, pillars.month.stem),
    monthBranch: calculateTenGodBranch(analysis.dayMaster, pillars.month.branch),
    dayBranch: calculateTenGodBranch(analysis.dayMaster, pillars.day.branch),
    hourStem: calculateTenGod(analysis.dayMaster, pillars.hour.stem),
    hourBranch: calculateTenGodBranch(analysis.dayMaster, pillars.hour.branch),
  };
  console.log(`   년간: ${tg.yearStem} / 년지: ${tg.yearBranch}`);
  console.log(`   월간: ${tg.monthStem} / 월지: ${tg.monthBranch}`);
  console.log(`   일지: ${tg.dayBranch}`);
  console.log(`   시간: ${tg.hourStem} / 시지: ${tg.hourBranch}`);
  console.log("");

  console.log("4. 오행 균형");
  console.log(`   ${Object.entries(analysis.elements).map(([k, v]) => `${k}:${v}`).join(", ")}`);
  console.log("");

  console.log("5. 용신·희신·기신");
  console.log(`   용신: ${analysis.yongShin} (${analysis.yongShinMethod})`);
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
  if (analysis.twelve_stages) {
    const ts = analysis.twelve_stages.pillars;
    console.log(`   년지: ${ts.year.stage} (에너지 ${ts.year.level})`);
    console.log(`   월지: ${ts.month.stage} (에너지 ${ts.month.level})`);
    console.log(`   일지: ${ts.day.stage} (에너지 ${ts.day.level})`);
    console.log(`   시지: ${ts.hour.stage} (에너지 ${ts.hour.level})`);
  }
  console.log("");

  console.log("8. 합충형파해 감지");
  analysis.interactions.forEach(inter => {
    console.log(`   [${inter.severity}] ${inter.type}(${inter.elements.join(",")}): ${inter.meaning_keyword}`);
  });
  console.log("");

  console.log("9. 신살 목록");
  analysis.shinsal.slice(0, 10).forEach(s => {
    console.log(`   - ${s.name}: ${s.description}`);
  });
  console.log("");

  console.log("10. 공망");
  const gongmang = analysis.shinsal.find(s => s.name === "공망");
  console.log(`   결과: ${gongmang ? "존재 (허약 체질 및 갈증 주의)" : "미감결"}`);
  console.log("");

  console.log("11. 현재 대운 (2026년 기준)");
  if (analysis.daewoon?.currentDaewoon) {
    const cd = analysis.daewoon.currentDaewoon;
    console.log(`   대운명: ${cd.full} (${cd.startAge}~${cd.endAge}세)`);
    console.log(`   십성: ${cd.tenGodStem}/${cd.tenGodBranch}`);
    console.log(`   12운성: ${cd.twelveStage} (${cd.twelveStageEnergy?.level}점)`);
  }
  console.log("");

  console.log("12. 2026년 세운 분석");
  const seunTag = analysis.characteristics.find(c => c.startsWith("세운:"));
  const seunTwelve = analysis.characteristics.find(c => c.startsWith("세운 12운성:"));
  console.log(`   세운명: ${seunTag || "미감결"}`);
  console.log(`   12운성: ${seunTwelve || "미감결"}`);
  console.log("");

  console.log("13. 2026년 3월 월운 분석");
  const wolunTag = analysis.characteristics.find(c => c.startsWith("월운:"));
  const wolunTwelve = analysis.characteristics.find(c => c.startsWith("월운 12운성:"));
  console.log(`   월운명: ${wolunTag || "미감결"}`);
  console.log(`   12운성: ${wolunTwelve || "미감결"}`);
  console.log("");

  console.log("==========================================");
  console.log("[테스트 종료]");
}

runTest();

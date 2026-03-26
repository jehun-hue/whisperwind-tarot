import { calculateZiWei } from "./ziwei";

// ─── 테스트 케이스 5건 ───
// 케이스 1: 1997년 음력 6월 22일 15시 30분 남성
// 케이스 2: 2000년 음력 2월 10일 08시 00분 여성
// 케이스 3: 1985년 음력 12월 1일 00시 30분 남성
// 케이스 4: 2002년 음력 7월 15일 06시 00분 여성
// 케이스 5: 1990년 음력 11월 28일 12시 00분 남성

interface TestCase {
  label: string;
  input: [number, number, number, number, number, "male" | "female"];
  expected: {
    mingGong: string;
    bureau: string;
  };
}

const testCases: TestCase[] = [
  {
    label: "케이스1: 1997 음6월 22일 15:30 남",
    input: [1997, 6, 22, 15, 30, "male"],
    expected: { mingGong: "해", bureau: "금사국" },
  },
  {
    label: "케이스2: 2000 음2월 10일 08:00 여",
    input: [2000, 2, 10, 8, 0, "female"],
    expected: { mingGong: "해", bureau: "토오국" },
  },
  {
    label: "케이스3: 1985 음12월 1일 00:30 남",
    input: [1985, 12, 1, 0, 30, "male"],
    expected: { mingGong: "축", bureau: "화육국" },
  },
  {
    label: "케이스4: 2002 음7월 15일 06:00 여",
    input: [2002, 7, 15, 6, 0, "female"],
    expected: { mingGong: "사", bureau: "화육국" },
  },
  {
    label: "케이스5: 1990 음11월 28일 12:00 남",
    input: [1990, 11, 28, 12, 0, "male"],
    expected: { mingGong: "오", bureau: "목삼국" },
  },
];

// ─── 테스트 실행 ───
let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const result = calculateZiWei(...tc.input);

  const mingOk = result.mingGong === tc.expected.mingGong;
  const bureauOk = result.bureau === tc.expected.bureau;

  if (mingOk && bureauOk) {
    console.log(`✅ ${tc.label}`);
    passed++;
  } else {
    console.log(`❌ ${tc.label}`);
    if (!mingOk) console.log(`   명궁: 기대 ${tc.expected.mingGong}, 실제 ${result.mingGong}`);
    if (!bureauOk) console.log(`   오행국: 기대 ${tc.expected.bureau}, 실제 ${result.bureau}`);
    failed++;
  }

  // 추가 검증: 구조적 완전성
  const issues: string[] = [];
  if (result.palaces.length !== 12) issues.push(`궁 수 ${result.palaces.length} (12 아님)`);
  if (!result.shenGongPalace) issues.push("shenGongPalace 없음");
  if (result.natalTransformations.length !== 4) issues.push(`사화 ${result.natalTransformations.length}개 (4 아님)`);
  if (result.majorPeriods.length !== 12) issues.push(`대한 ${result.majorPeriods.length}개 (12 아님)`);
  if (!result.currentMinorPeriod) issues.push("소한 없음");

  // 보조성 확인: 최소 1개 궁에 보조성이 있어야 함
  const hasAux = result.palaces.some(p => p.stars.some(s =>
    ["좌보","우필","문창","문곡","록존","천괴","천월","경양","타라","화성","영성"].includes(s.star)
  ));
  if (!hasAux) issues.push("보조성 배치 안됨");

  if (issues.length > 0) {
    console.log(`   ⚠️ 구조 이슈: ${issues.join(", ")}`);
    failed++;
  } else {
    console.log(`   ✔ 구조 검증 통과 (12궁, 사화4개, 대한12개, 보조성 있음)`);
  }
}

console.log(`\n결과: ${passed} passed, ${failed} failed / 총 ${testCases.length} 케이스`);

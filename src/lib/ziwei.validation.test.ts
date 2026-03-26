import { calculateZiWei } from "./ziwei";

interface ValidationCase {
  label: string;
  input: [number, number, number, number, number, "male" | "female"];
  expected: {
    mingGong: string;
    bureau: string;
    natalStars?: Record<string, string>; // 화록:"별", 화권:"별" ...
  };
}

const cases: ValidationCase[] = [
  // ── 기존 5건 ──
  { label: "케이스1: 1997 음6/22 15:30 남", input: [1997,6,22,15,30,"male"],
    expected: { mingGong: "해", bureau: "금사국" } },
  { label: "케이스2: 2000 음2/10 08:00 여", input: [2000,2,10,8,0,"female"],
    expected: { mingGong: "해", bureau: "토오국" } },
  { label: "케이스3: 1985 음12/1 00:30 남", input: [1985,12,1,0,30,"male"],
    expected: { mingGong: "축", bureau: "화육국" } },
  { label: "케이스4: 2002 음7/15 06:00 여", input: [2002,7,15,6,0,"female"],
    expected: { mingGong: "사", bureau: "화육국" } },
  { label: "케이스5: 1990 음11/28 12:00 남", input: [1990,11,28,12,0,"male"],
    expected: { mingGong: "오", bureau: "목삼국" } },
  // ── 신규 5건 (엔진 실측값) ──
  { label: "케이스6: 1964 음9/17 12:00 남", input: [1964,9,17,12,0,"male"],
    expected: { mingGong: "진", bureau: "목삼국",
      natalStars: { 화록: "염정", 화권: "파군", 화과: "무곡", 화기: "태양" } } },
  { label: "케이스7: 1978 음3/5 22:00 여", input: [1978,3,5,22,0,"female"],
    expected: { mingGong: "사", bureau: "토오국",
      natalStars: { 화록: "탐랑", 화권: "태음", 화과: "천부", 화기: "천기" } } },
  { label: "케이스8: 1955 음1/15 06:00 남", input: [1955,1,15,6,0,"male"],
    expected: { mingGong: "해", bureau: "토오국",
      natalStars: { 화록: "천기", 화권: "천량", 화과: "자미", 화기: "태음" } } },
  { label: "케이스9: 1988 음4/20 03:00 여", input: [1988,4,20,3,0,"female"],
    expected: { mingGong: "묘", bureau: "수이국",
      natalStars: { 화록: "탐랑", 화권: "태음", 화과: "천부", 화기: "천기" } } },
  { label: "케이스10: 1970 음8/8 00:00 남", input: [1970,8,8,0,0,"male"],
    expected: { mingGong: "유", bureau: "수이국",
      natalStars: { 화록: "태양", 화권: "무곡", 화과: "태음", 화기: "천동" } } },
];

let passed = 0;
let failed = 0;

for (const tc of cases) {
  const r = calculateZiWei(...tc.input);
  const errors: string[] = [];

  // 1) 명궁
  if (r.mingGong !== tc.expected.mingGong)
    errors.push(`명궁: 기대 ${tc.expected.mingGong}, 실제 ${r.mingGong}`);
  // 2) 오행국
  if (r.bureau !== tc.expected.bureau)
    errors.push(`오행국: 기대 ${tc.expected.bureau}, 실제 ${r.bureau}`);
  // 3) 사화 (있는 경우만)
  if (tc.expected.natalStars) {
    for (const [type, star] of Object.entries(tc.expected.natalStars)) {
      const found = r.natalTransformations.find(t => t.type === type);
      if (!found) errors.push(`사화 ${type}: 없음`);
      else if (found.star !== star) errors.push(`사화 ${type}: 기대 ${star}, 실제 ${found.star}`);
    }
  }
  // 4) 구조 검증
  if (r.palaces.length !== 12) errors.push(`궁 수 ${r.palaces.length}`);
  if (r.natalTransformations.length !== 4) errors.push(`사화 ${r.natalTransformations.length}개`);
  if (r.majorPeriods.length !== 12) errors.push(`대한 ${r.majorPeriods.length}개`);
  if (!r.overallScore) errors.push("overallScore 없음");
  // 5) 신살 존재
  const hasShenSha = r.palaces.some(p => p.shenSha && p.shenSha.length > 0);
  if (!hasShenSha) errors.push("신살 배치 없음");
  // 6) 소한
  if (!r.currentMinorPeriod) errors.push("소한 없음");

  if (errors.length === 0) {
    console.log(`✅ ${tc.label}`);
    passed++;
  } else {
    console.log(`❌ ${tc.label}`);
    errors.forEach(e => console.log(`   ${e}`));
    failed++;
  }
}

console.log(`\n결과: ${passed} passed, ${failed} failed / 총 ${cases.length} 케이스`);
if (failed > 0) process.exit(1);

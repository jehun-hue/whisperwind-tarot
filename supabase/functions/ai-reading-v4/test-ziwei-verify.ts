// supabase/functions/ai-reading-v4/test-ziwei-verify.ts

import { calculateZiwei } from './lib/ziweiEngine.ts';

function verify() {
  const result = calculateZiwei(1987, 7, 17, 15, 30, "male");

  console.log("=== 자미두수 검증 (1987-07-17 15:30 남자 서울) ===\n");

  // 1. 기본 정보
  console.log("[기본 정보]");
  console.log("음력:", result.lunarMonth, "월", result.lunarDay, "일");
  console.log("시지:", result.hourBranch);
  console.log("오행국:", result.fiveElementFrame);
  console.log("명궁:", result.lifePalace);
  console.log("신궁:", result.bodyPalace);

  // 2. 주성 배치
  console.log("\n[주성 14개 배치]");
  const targetStars: Record<string, string> = {
    "자미": "亥", "천기": "戌", "태양": "申", "무곡": "未",
    "천동": "午", "염정": "卯", "천부": "巳", "태음": "午",
    "탐랑": "未", "거문": "申", "천상": "酉", "천량": "戌",
    "칠살": "亥", "파군": "卯"
  };

  if ((result as any).stars || result.majorStars) {
    const stars = (result as any).stars || result.majorStars;
    for (const [name, expectedPalace] of Object.entries(targetStars)) {
      const found = stars.find((s: any) => s.name === name || s.star === name);
      const actual = found?.palace || found?.branch || "없음";
      const match = actual === expectedPalace ? "✅" : "❌";
      console.log(`${name}: ${actual} (목표: ${expectedPalace}) ${match}`);
    }
  } else {
    console.log("주성 데이터 없음 ❌");
  }

  // 3. 사화
  console.log("\n[사화 (丁간)]");
  const targetHua: Record<string, { star: string; palace: string }> = {
    "화록": { star: "태음", palace: "午" },
    "화권": { star: "천동", palace: "午" },
    "화과": { star: "천기", palace: "戌" },
    "화기": { star: "거문", palace: "申" },
  };

  if (result.siHua || (result as any).fourTransformations) {
    const hua = result.siHua || (result as any).fourTransformations;
    console.log(JSON.stringify(hua, null, 2));
  } else {
    console.log("사화 데이터 없음 — 수동 확인 필요");
  }

  // 4. 12궁 배치
  console.log("\n[12궁 배치]");
  const targetPalaces: Record<string, string> = {
    "子": "명궁", "丑": "부모궁", "寅": "복덕궁", "卯": "전택궁",
    "辰": "관록궁", "巳": "노복궁", "午": "천이궁", "未": "질액궁",
    "申": "재백궁", "酉": "자녀궁", "戌": "부처궁", "亥": "형제궁"
  };

  if (result.palaces || (result as any).houses) {
    const palaces = result.palaces || (result as any).houses;
    for (const [branch, expectedName] of Object.entries(targetPalaces)) {
      const found = palaces.find((p: any) => p.branch === branch);
      const actual = (found as any)?.name || (found as any)?.palace || "없음";
      const match = actual === expectedName ? "✅" : "❌";
      console.log(`${branch}: ${actual} (목표: ${expectedName}) ${match}`);
    }
  } else {
    console.log("12궁 데이터 없음 ❌");
  }

  // 5. 전체 JSON
  console.log("\n[전체 결과 JSON]");
  console.log(JSON.stringify(result, null, 2));
}

verify();

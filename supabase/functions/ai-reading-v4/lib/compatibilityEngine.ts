import { callGeminiWithStyle } from "./geminiClient.ts";

interface CompatibilityPayload {
  birthInfo: {
    birthDate: string;
    birthTime?: string;
    gender: string;
    isLunar?: boolean;
    userName?: string;
  };
  partnerInfo: {
    birthDate: string;
    birthTime?: string;
    gender: string;
    isLunar?: boolean;
    userName?: string;
  };
  question?: string;
  mode: string;
}

// 사주 일간 계산 (간이 버전 - 추후 sajuEngine 연동)
function getDayMaster(birthDate: string): string {
  const stems = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  const [y, m, d] = birthDate.split("-").map(Number);
  // 간이 일주 계산 (정확한 만세력은 sajuEngine 사용)
  const idx = (y * 365 + m * 30 + d + 4) % 10;
  return stems[idx];
}

// 오행 매핑
function getElement(stem: string): string {
  const map: Record<string, string> = {
    "甲": "木", "乙": "木", "丙": "火", "丁": "火", "戊": "土",
    "己": "土", "庚": "金", "辛": "金", "壬": "水", "癸": "水"
  };
  return map[stem] || "未知";
}

// 오행 상생상극 관계
function getRelation(elemA: string, elemB: string): string {
  const generate: Record<string, string> = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
  const control: Record<string, string> = { "木": "土", "土": "水", "水": "火", "火": "金", "金": "木" };

  if (elemA === elemB) return "비화(같은 기운) - 동질감과 경쟁이 공존";
  if (generate[elemA] === elemB) return `상생(${elemA}→${elemB}) - A가 B를 자연스럽게 돕는 관계`;
  if (generate[elemB] === elemA) return `상생(${elemB}→${elemA}) - B가 A를 자연스럽게 돕는 관계`;
  if (control[elemA] === elemB) return `상극(${elemA}→${elemB}) - A가 B를 제어하는 긴장 관계`;
  if (control[elemB] === elemA) return `상극(${elemB}→${elemA}) - B가 A를 제어하는 긴장 관계`;
  return "간접 관계";
}

// 수비학 생명수 계산
function calcLifePath(birthDate: string): number {
  const digits = birthDate.replace(/-/g, "").split("").map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum).split("").map(Number).reduce((a, b) => a + b, 0);
  }
  return sum;
}

// 생명수 궁합
function lifePathCompatibility(lpA: number, lpB: number): string {
  const good: Record<number, number[]> = {
    1: [3, 5, 7], 2: [4, 6, 8], 3: [1, 5, 9], 4: [2, 6, 8],
    5: [1, 3, 7], 6: [2, 4, 9], 7: [1, 5, 9], 8: [2, 4, 6],
    9: [3, 6, 7], 11: [2, 4, 6], 22: [4, 6, 8], 33: [3, 6, 9]
  };
  if (good[lpA]?.includes(lpB) || good[lpB]?.includes(lpA)) return "높은 호환성";
  if (lpA === lpB) return "동일 에너지 - 깊은 이해와 동시에 충돌 가능";
  return "보완적 관계 - 서로 다른 강점으로 성장 가능";
}

export async function runCompatibilityEngine(
  _supabase: any,
  apiKey: string,
  payload: CompatibilityPayload
) {
  const { birthInfo, partnerInfo, question } = payload;
  const nameA = birthInfo.userName || "나";
  const nameB = partnerInfo.userName || "상대방";

  console.log(`[INFO][Compatibility] ${nameA} vs ${nameB} 궁합 분석 시작`);

  // 1. 사주 기본 분석
  const stemA = getDayMaster(birthInfo.birthDate);
  const stemB = getDayMaster(partnerInfo.birthDate);
  const elemA = getElement(stemA);
  const elemB = getElement(stemB);
  const relation = getRelation(elemA, elemB);

  // 2. 수비학 분석
  const lpA = calcLifePath(birthInfo.birthDate);
  const lpB = calcLifePath(partnerInfo.birthDate);
  const lpCompat = lifePathCompatibility(lpA, lpB);

  // 3. 궁합 프롬프트 생성
  const compatPrompt = `
당신은 사주, 서양 점성술, 수비학을 통합하여 두 사람의 궁합을 분석하는 최상위 궁합 전문가입니다.

[두 사람의 정보]
- ${nameA}: ${birthInfo.birthDate} 출생, ${birthInfo.gender === "male" ? "남" : "여"}성, 일간 ${stemA}(${elemA})
- ${nameB}: ${partnerInfo.birthDate} 출생, ${partnerInfo.gender === "male" ? "남" : "여"}성, 일간 ${stemB}(${elemB})

[사주 궁합 데이터]
- ${nameA}의 일간: ${stemA} (${elemA})
- ${nameB}의 일간: ${stemB} (${elemB})
- 오행 관계: ${relation}

[수비학 궁합 데이터]
- ${nameA}의 생명수: ${lpA}
- ${nameB}의 생명수: ${lpB}
- 호환성: ${lpCompat}

${question ? `[질문] ${question}` : ""}

[분석 지시]
1. 두 사람의 오행 관계를 바탕으로 근본적 호환성을 해석하라.
2. 수비학 생명수 관계로 성격 호환성을 보완 해석하라.
3. 관계의 강점 3가지, 주의점 2가지를 구체적으로 제시하라.
4. 시기별 관계 흐름 (올해 기준)을 간략히 안내하라.
5. 종합 궁합 점수를 100점 만점으로 제시하되, 근거를 함께 설명하라.

[금지]
- 마크다운, JSON, 내부 용어 사용 금지.
- "${nameA}님", "${nameB}님"으로 호칭.
- 자연스럽고 따뜻한 상담 톤으로 작성.
`;

  // 4. Gemini 호출
  const geminiResult = await callGeminiWithStyle(
    apiKey,
    "choihanna",
    compatPrompt
  );

  if (!geminiResult.success) {
    console.log(`[ERROR][Compatibility] Gemini 호출 실패: ${geminiResult.text}`);
    return {
      status: "error",
      message: "궁합 분석 중 오류가 발생했습니다.",
    };
  }

  console.log(`[INFO][Compatibility] 분석 완료 (${geminiResult.text.length}자)`);

  return {
    status: "success",
    mode: "compatibility",
    personA: { name: nameA, birthDate: birthInfo.birthDate, dayStem: stemA, element: elemA, lifePath: lpA },
    personB: { name: nameB, birthDate: partnerInfo.birthDate, dayStem: stemB, element: elemB, lifePath: lpB },
    compatibility: {
      elementRelation: relation,
      lifePathCompat: lpCompat,
      reading: geminiResult.text,
    },
    integrated_summary: geminiResult.text.slice(0, 300),
    final_message: { summary: geminiResult.text.slice(0, 300) },
  };
}

// lib/compatibilityEngine.ts — 궁합 엔진 v2 (정밀 사주 연동)
// 기존 간이 일주 계산 → sajuEngine + compatibilitySajuEngine 정밀 분석 연동

import { callGeminiWithStyle } from "./geminiClient.ts";
import { getFullSaju } from "../sajuEngine.ts";
import { analyzeSajuStructure } from "../aiSajuAnalysis.ts";
import { analyzeCompatibility, type PersonSaju, type CompatibilityResult } from "./compatibilitySajuEngine.ts";
import { STEM_ELEMENT_KR } from "./fiveElements.ts";

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

// ── 생년월일시 파싱 ──
function parseBirthInput(birthDate: string, birthTime?: string): {
  year: number; month: number; day: number; hour: number; minute: number; hasTime: boolean;
} {
  const [y, m, d] = birthDate.split("-").map(Number);
  let hour = 12, minute = 0, hasTime = false;

  if (birthTime && birthTime.trim() !== "" && birthTime !== "모름") {
    const parts = birthTime.split(":").map(Number);
    hour = parts[0] ?? 12;
    minute = parts[1] ?? 0;
    hasTime = true;
  }
  return { year: y, month: m, day: d, hour, minute, hasTime };
}

// ── PersonSaju 빌더 (sajuRaw + analysisResult → PersonSaju) ──
function buildPersonSaju(sajuRaw: any, analysis: any): PersonSaju {
  const pillars = sajuRaw.pillars || {};
  return {
    dayMaster: sajuRaw.dayMaster,
    stems: [
      pillars.year?.stem, pillars.month?.stem,
      pillars.day?.stem, pillars.hour?.stem
    ].filter(Boolean),
    branches: [
      pillars.year?.branch, pillars.month?.branch,
      pillars.day?.branch, pillars.hour?.branch
    ].filter(Boolean),
    yongShin: analysis.yongShin || "",
    heeShin: analysis.heeShin || "",
    giShin: analysis.giShin || "",
    strength: analysis.strength || sajuRaw.strength || "",
    elements: analysis.elements_simple || analysis.elements || {},
  };
}

// ── 수비학 생명수 (보조 지표로 유지) ──
function calcLifePath(birthDate: string): number {
  const digits = birthDate.replace(/-/g, "").split("").map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum).split("").map(Number).reduce((a, b) => a + b, 0);
  }
  return sum;
}

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

// ═══════════════════════════════════════
// 메인 함수
// ═══════════════════════════════════════
export async function runCompatibilityEngine(
  _supabase: any,
  apiKey: string,
  payload: CompatibilityPayload
) {
  const { birthInfo, partnerInfo, question } = payload;
  const nameA = birthInfo.userName || "나";
  const nameB = partnerInfo.userName || "상대방";

  console.log(`[INFO][Compatibility v2] ${nameA} vs ${nameB} 정밀 궁합 분석 시작`);

  try {
    // ── 1. 정밀 사주 계산 (sajuEngine) ──
    const inputA = parseBirthInput(birthInfo.birthDate, birthInfo.birthTime);
    const inputB = parseBirthInput(partnerInfo.birthDate, partnerInfo.birthTime);

    const genderA: 'M' | 'F' = birthInfo.gender === "male" ? "M" : "F";
    const genderB: 'M' | 'F' = partnerInfo.gender === "male" ? "M" : "F";

    const sajuA = getFullSaju(inputA.year, inputA.month, inputA.day, inputA.hour, inputA.minute, genderA, 127.5, inputA.hasTime);
    const sajuB = getFullSaju(inputB.year, inputB.month, inputB.day, inputB.hour, inputB.minute, genderB, 127.5, inputB.hasTime);

    // ── 2. 구조 분석 (aiSajuAnalysis) ──
    const analysisA = await analyzeSajuStructure(sajuA);
    const analysisB = await analyzeSajuStructure(sajuB);

    // ── 3. 정밀 궁합 분석 (compatibilitySajuEngine) ──
    const personA = buildPersonSaju(sajuA, analysisA);
    const personB = buildPersonSaju(sajuB, analysisB);
    const compatResult: CompatibilityResult = analyzeCompatibility(personA, personB);

    // ── 4. 보조 지표 (수비학) ──
    const lpA = calcLifePath(birthInfo.birthDate);
    const lpB = calcLifePath(partnerInfo.birthDate);
    const lpCompat = lifePathCompatibility(lpA, lpB);

    // ── 5. 오행 정보 ──
    const elemA = STEM_ELEMENT_KR[sajuA.dayMaster] || "미상";
    const elemB = STEM_ELEMENT_KR[sajuB.dayMaster] || "미상";

    // ── 6. Gemini AI 프롬프트 (구조적 데이터 기반) ──
    const categoryDetails = compatResult.categories
      .map(c => `[${c.name}] ${c.score}점 — ${c.details.join("; ")}`)
      .join("\n");

    const compatPrompt = `
당신은 사주명리학 기반 궁합 전문가입니다. 아래 구조적 분석 데이터를 바탕으로 두 사람의 궁합을 자연스럽게 해설하세요.

[두 사람의 정보]
- ${nameA}: ${birthInfo.birthDate} 출생, ${birthInfo.gender === "male" ? "남" : "여"}성
  일간 ${sajuA.dayMaster}(${elemA}), 강약 ${analysisA.strength}, 용신 ${analysisA.yongShin}
- ${nameB}: ${partnerInfo.birthDate} 출생, ${partnerInfo.gender === "male" ? "남" : "여"}성
  일간 ${sajuB.dayMaster}(${elemB}), 강약 ${analysisB.strength}, 용신 ${analysisB.yongShin}

[정밀 궁합 분석 결과]
종합점수: ${compatResult.totalScore}점 (${compatResult.grade})

${categoryDetails}

천간 관계: ${compatResult.stemRelation ? `${compatResult.stemRelation.type} — ${compatResult.stemRelation.description}` : "특별한 천간합극 없음"}
십성 관계: ${nameA}에게 ${nameB}는 ${compatResult.tenGodAtoB}, ${nameB}에게 ${nameA}는 ${compatResult.tenGodBtoA}
지지 합: ${compatResult.crossHarmonies.length > 0 ? compatResult.crossHarmonies.join(", ") : "없음"}
지지 충: ${compatResult.crossClashes.length > 0 ? compatResult.crossClashes.join(", ") : "없음"}
용신 보완: ${compatResult.yongsinComplement.details.join("; ")}

[보조 지표 - 수비학]
${nameA} 생명수 ${lpA}, ${nameB} 생명수 ${lpB}: ${lpCompat}

${question ? `[질문] ${question}` : ""}

[작성 지침]
1. 위 데이터를 자연스러운 상담 언어로 풀어서 설명하라.
2. 관계의 강점 3가지, 주의점 2가지를 구체적으로 제시하라.
3. 시기별 관계 흐름 (올해 기준)을 간략히 안내하라.
4. 종합 점수 ${compatResult.totalScore}점(${compatResult.grade})의 근거를 함께 설명하라.
5. 수비학은 보조 참고로만 언급하라 (1~2문장).

[금지]
- 마크다운, JSON, 내부 용어 직접 노출 금지.
- "${nameA}님", "${nameB}님"으로 호칭.
- 자연스럽고 따뜻한 상담 톤으로 작성.
`;

    // ── 7. Gemini 호출 ──
    const geminiResult = await callGeminiWithStyle(apiKey, "choihanna", compatPrompt);

    if (!geminiResult.success) {
      console.log(`[ERROR][Compatibility v2] Gemini 호출 실패: ${geminiResult.text}`);
      return {
        status: "error",
        message: "궁합 분석 중 오류가 발생했습니다.",
      };
    }

    console.log(`[INFO][Compatibility v2] 분석 완료 (${geminiResult.text.length}자)`);

    return {
      status: "success",
      mode: "compatibility",
      personA: {
        name: nameA,
        birthDate: birthInfo.birthDate,
        dayStem: sajuA.dayMaster,
        element: elemA,
        strength: analysisA.strength,
        yongShin: analysisA.yongShin,
        lifePath: lpA,
      },
      personB: {
        name: nameB,
        birthDate: partnerInfo.birthDate,
        dayStem: sajuB.dayMaster,
        element: elemB,
        strength: analysisB.strength,
        yongShin: analysisB.yongShin,
        lifePath: lpB,
      },
      compatibility: {
        totalScore: compatResult.totalScore,
        grade: compatResult.grade,
        categories: compatResult.categories,
        stemRelation: compatResult.stemRelation,
        tenGodRelation: {
          aToB: compatResult.tenGodAtoB,
          bToA: compatResult.tenGodBtoA,
        },
        crossHarmonies: compatResult.crossHarmonies,
        crossClashes: compatResult.crossClashes,
        yongsinComplement: compatResult.yongsinComplement,
        lifePathCompat: lpCompat,
        reading: geminiResult.text,
      },
      structuredSummary: compatResult.summary,
      integrated_summary: geminiResult.text.slice(0, 300),
      final_message: { summary: geminiResult.text.slice(0, 300) },
    };

  } catch (error: any) {
    console.log(`[ERROR][Compatibility v2] 분석 실패: ${error?.message || error}`);

    // 폴백: 기존 간이 로직으로 fallback
    console.log(`[INFO][Compatibility v2] 폴백 모드로 전환`);
    return await runFallbackCompatibility(_supabase, apiKey, payload);
  }
}

// ═══════════════════════════════════════
// 폴백: 기존 간이 궁합 (v1 로직)
// ═══════════════════════════════════════
async function runFallbackCompatibility(
  _supabase: any,
  apiKey: string,
  payload: CompatibilityPayload
) {
  const { birthInfo, partnerInfo, question } = payload;
  const nameA = birthInfo.userName || "나";
  const nameB = partnerInfo.userName || "상대방";

  const stems = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  const getSimpleDayMaster = (bd: string) => {
    const [y, m, d] = bd.split("-").map(Number);
    return stems[(y * 365 + m * 30 + d + 4) % 10];
  };

  const elemMap: Record<string, string> = {
    "甲": "木", "乙": "木", "丙": "火", "丁": "火", "戊": "土",
    "己": "土", "庚": "金", "辛": "金", "壬": "水", "癸": "水"
  };

  const stemA = getSimpleDayMaster(birthInfo.birthDate);
  const stemB = getSimpleDayMaster(partnerInfo.birthDate);
  const elemA = elemMap[stemA] || "미상";
  const elemB = elemMap[stemB] || "미상";

  const lpA = calcLifePath(birthInfo.birthDate);
  const lpB = calcLifePath(partnerInfo.birthDate);
  const lpCompat = lifePathCompatibility(lpA, lpB);

  const fallbackPrompt = `
당신은 사주 궁합 전문가입니다.
- ${nameA}: ${birthInfo.birthDate}, ${birthInfo.gender === "male" ? "남" : "여"}, 일간 ${stemA}(${elemA})
- ${nameB}: ${partnerInfo.birthDate}, ${partnerInfo.gender === "male" ? "남" : "여"}, 일간 ${stemB}(${elemB})
- 수비학: ${nameA} 생명수 ${lpA}, ${nameB} 생명수 ${lpB} (${lpCompat})
${question ? `[질문] ${question}` : ""}
관계의 강점, 주의점, 조언을 따뜻한 상담 톤으로 작성하세요. 마크다운 금지.
`;

  const geminiResult = await callGeminiWithStyle(apiKey, "choihanna", fallbackPrompt);

  return {
    status: geminiResult.success ? "success" : "error",
    mode: "compatibility",
    note: "fallback_mode",
    personA: { name: nameA, birthDate: birthInfo.birthDate, dayStem: stemA, element: elemA, lifePath: lpA },
    personB: { name: nameB, birthDate: partnerInfo.birthDate, dayStem: stemB, element: elemB, lifePath: lpB },
    compatibility: {
      lifePathCompat: lpCompat,
      reading: geminiResult.text || "분석 중 오류가 발생했습니다.",
    },
    integrated_summary: (geminiResult.text || "").slice(0, 300),
    final_message: { summary: (geminiResult.text || "").slice(0, 300) },
  };
}

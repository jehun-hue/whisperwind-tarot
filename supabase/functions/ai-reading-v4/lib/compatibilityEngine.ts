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
  payload: CompatibilityPayload,
  extraEngines?: {
    ziweiA?: any;
    ziweiB?: any;
    astrologyA?: any;
    astrologyB?: any;
    tarotResult?: any;
  }
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

    // ── 4.5 다엔진 데이터 추출 ──
    const ziweiA = extraEngines?.ziweiA || {};
    const ziweiB = extraEngines?.ziweiB || {};
    const astroA = extraEngines?.astrologyA || {};
    const astroB = extraEngines?.astrologyB || {};
    const tarot = extraEngines?.tarotResult || {};

    // 자미두수: 부처궁 비교
    const palacesA = ((ziweiA as any).rawData || ziweiA)?.palaces || [];
    const palacesB = ((ziweiB as any).rawData || ziweiB)?.palaces || [];
    const bucheA = palacesA.find((p: any) => p.name === '부처궁');
    const bucheB = palacesB.find((p: any) => p.name === '부처궁');
    const bokdeokA = palacesA.find((p: any) => p.name === '복덕궁');
    const bokdeokB = palacesB.find((p: any) => p.name === '복덕궁');

    const ziweiCompatBlock = (bucheA || bucheB) ? `
[자미두수 궁합 분석]
- ${nameA} 부처궁: ${bucheA?.main_stars?.join(', ') || '빈궁'} | 복덕궁: ${bokdeokA?.main_stars?.join(', ') || '빈궁'}
- ${nameB} 부처궁: ${bucheB?.main_stars?.join(', ') || '빈궁'} | 복덕궁: ${bokdeokB?.main_stars?.join(', ') || '빈궁'}
- 해석 포인트: 부처궁은 배우자 성향과 결혼 운, 복덕궁은 내면 정서 안정을 나타냄.
` : '';

    // 점성술: 시나스트리 핵심 어스펙트
    const synastryAspects: string[] = [];
    const planetsA = (astroA.rawData || astroA)?.planets || [];
    const planetsB = (astroB.rawData || astroB)?.planets || [];
    const sunA = planetsA.find((p: any) => p.name === '태양' || p.name === 'Sun');
    const moonA = planetsA.find((p: any) => p.name === '달' || p.name === 'Moon');
    const venusA = planetsA.find((p: any) => p.name === '금성' || p.name === 'Venus');
    const marsA = planetsA.find((p: any) => p.name === '화성' || p.name === 'Mars');
    const sunB = planetsB.find((p: any) => p.name === '태양' || p.name === 'Sun');
    const moonB = planetsB.find((p: any) => p.name === '달' || p.name === 'Moon');
    const venusB = planetsB.find((p: any) => p.name === '금성' || p.name === 'Venus');
    const marsB = planetsB.find((p: any) => p.name === '화성' || p.name === 'Mars');

    if (sunA?.sign && moonB?.sign) synastryAspects.push(`${nameA} 태양(${sunA.sign}) ↔ ${nameB} 달(${moonB.sign})`);
    if (sunB?.sign && moonA?.sign) synastryAspects.push(`${nameB} 태양(${sunB.sign}) ↔ ${nameA} 달(${moonA.sign})`);
    if (venusA?.sign && marsB?.sign) synastryAspects.push(`${nameA} 금성(${venusA.sign}) ↔ ${nameB} 화성(${marsB.sign})`);
    if (venusB?.sign && marsA?.sign) synastryAspects.push(`${nameB} 금성(${venusB.sign}) ↔ ${nameA} 화성(${marsA.sign})`);

    const astroCompatBlock = synastryAspects.length > 0 ? `
[점성술 시나스트리 (핵심)]
${synastryAspects.map(a => `- ${a}`).join('\n')}
- 태양↔달: 의식과 무의식의 조화. 금성↔화성: 끌림과 열정의 균형.
` : '';

    // 타로: 관계 카드 해석
    const tarotCards = tarot?.cards || tarot?.selectedCards || [];
    const tarotCompatBlock = tarotCards.length > 0 ? `
[타로 관계 리딩]
${tarotCards.slice(0, 3).map((c: any, i: number) => `- ${i + 1}번: ${c.name || c.card_name} (${c.isReversed ? '역방향' : '정방향'}) — ${c.keywords?.join(', ') || c.meaning || ''}`).join('\n')}
` : '';

    // 교차 검증 요약
    const crossCompatPatterns: string[] = [];
    // 사주 천간합 + 자미 부처궁 길성 = 강력 긍정
    if (compatResult.stemRelation?.type === '천간합' && bucheA?.main_stars?.some((s: string) => ['자미', '천부', '태양', '태음', '천동'].includes(s))) {
      crossCompatPatterns.push('✅ 천간합 + 부처궁 길성: 사주와 자미 모두 관계 길신호 — 강한 인연');
    }
    // 사주 충 + 자미 화기 = 이중 경고
    if (compatResult.crossClashes.length >= 2 && palacesA.some((p: any) => p.name === '부처궁' && (ziweiA.rawData || ziweiA)?.natalTransformations?.some((t: any) => t.type === '화기' && t.palace === '부처궁'))) {
      crossCompatPatterns.push('⚠️ 사주 지지충 다수 + 부처궁 화기: 관계 마찰 강화 패턴');
    }

    const crossCompatBlock = crossCompatPatterns.length > 0 ? `
[엔진 간 교차 검증]
${crossCompatPatterns.join('\n')}
` : '';

    // ── 5. 오행 정보 ──
    const elemA = STEM_ELEMENT_KR[sajuA.dayMaster] || "미상";
    const elemB = STEM_ELEMENT_KR[sajuB.dayMaster] || "미상";

    // ── 6. Gemini AI 프롬프트 (구조적 데이터 기반) ──
    const categoryDetails = compatResult.categories
      .map(c => `[${c.name}] ${c.score}점 — ${c.details.join("; ")}`)
      .join("\n");

    const compatPrompt = `
당신은 사주명리학·자미두수·서양점성술을 통합하는 궁합 전문 상담사입니다. 아래 다중 엔진 분석 데이터를 바탕으로 두 사람의 관계를 입체적으로 해설하세요.

=== [A] 인물 정보 ===
- ${nameA}: ${birthInfo.birthDate} 출생, ${birthInfo.gender === "male" ? "남" : "여"}성
  일간 ${sajuA.dayMaster}(${elemA}), 강약 ${analysisA.strength}, 용신 ${analysisA.yongShin}
- ${nameB}: ${partnerInfo.birthDate} 출생, ${partnerInfo.gender === "male" ? "남" : "여"}성
  일간 ${sajuB.dayMaster}(${elemB}), 강약 ${analysisB.strength}, 용신 ${analysisB.yongShin}

=== [B] 사주 정밀 궁합 ===
종합점수: ${compatResult.totalScore}점 (${compatResult.grade})
${categoryDetails}
천간 관계: ${compatResult.stemRelation ? `${compatResult.stemRelation.type} — ${compatResult.stemRelation.description}` : "특별한 천간합극 없음"}
십성 관계: ${nameA}에게 ${nameB}는 ${compatResult.tenGodAtoB}, ${nameB}에게 ${nameA}는 ${compatResult.tenGodBtoA}
지지 합: ${compatResult.crossHarmonies.length > 0 ? compatResult.crossHarmonies.join(", ") : "없음"}
지지 충: ${compatResult.crossClashes.length > 0 ? compatResult.crossClashes.join(", ") : "없음"}
용신 보완: ${compatResult.yongsinComplement.details.join("; ")}

${ziweiCompatBlock}
${astroCompatBlock}
${tarotCompatBlock}
${crossCompatBlock}

=== [C] 보조 지표 ===
수비학: ${nameA} 생명수 ${lpA}, ${nameB} 생명수 ${lpB} — ${lpCompat}

${question ? `=== [D] 질문 === ${question}` : ""}

=== [E] 작성 지침 ===
1. 리딩 첫머리에 두 사람 관계의 핵심을 한 문장으로 요약하라.
2. [B] 사주 궁합을 중심으로 관계의 강점 3가지, 주의점 2가지를 구체적으로 제시하라.
3. [B]와 다른 엔진([자미두수]/[점성술]/[타로]) 결과가 일치하면 "여러 관점이 같은 방향을 가리킵니다"로 신뢰를 강조하라.
4. [B]와 다른 엔진 결과가 상충하면 "다양한 측면에서 보완의 여지가 있습니다"로 유연하게 표현하라.
5. 올해(${new Date().getFullYear()}) 기준 관계 흐름을 간략히 안내하라 (용신 계절 활성 시기 언급).
6. 종합 점수 ${compatResult.totalScore}점(${compatResult.grade})의 근거를 자연스럽게 녹여 설명하라.
7. 타로 데이터가 있으면 카드 이미지를 활용해 감성적 메시지를 추가하라.
8. 수비학은 보조 참고로만 1~2문장 언급하라.

=== [F] 금지 ===
- 마크다운(#, **, -), JSON, 내부 용어(십성, 천간합, 화기 등) 직접 노출 금지.
- "${nameA}님", "${nameB}님"으로 호칭.
- 자연스럽고 따뜻한 상담 톤. 분석 근거를 쉬운 비유로 전환하라.
- 내부 점수, 합의도, 엔진명 절대 노출 금지.
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
    // 정확한 일진 계산 (Julian Day 방식)
    let year = y, month = m;
    if (month <= 2) { year -= 1; month += 12; }
    const a = Math.floor(year / 100);
    const b = 2 - a + Math.floor(a / 4);
    const jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + d + b - 1524.5;
    const stems = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
    return stems[Math.floor(jd + 0.5 + 9) % 10]; 
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

// lib/compatibilitySajuEngine.ts — 사주 기반 정밀 궁합 엔진
// sajuEngine의 만세력 데이터를 활용한 구조적 궁합 분석

import {
  STEMS, BRANCHES,
  STEM_ELEMENT_KR, BRANCH_ELEMENT_KR,
  ELEMENT_CYCLE, PRODUCE_ELEM, SUPPORT_ELEM,
  CONQUER_ELEM, CONQUERED_BY_ELEM
} from "./fiveElements.ts";
import { calculateTenGod } from "./tenGods.ts";
import { checkStemRelation, checkBranchRelation } from "./interactions.ts";

// ═══════════════════════════════════════
// 타입 정의
// ═══════════════════════════════════════

export interface PersonSaju {
  dayMaster: string;          // 일간 한자 (甲, 乙, ...)
  stems: string[];            // 4주 천간
  branches: string[];         // 4주 지지
  yongShin: string;           // 용신 오행 (목, 화, ...)
  heeShin: string;            // 희신
  giShin: string;             // 기신
  strength: string;           // 강약
  elements: Record<string, number>;  // 오행 분포
}

export interface CompatibilityCategory {
  name: string;
  score: number;              // 0~100
  weight: number;             // 가중치
  details: string[];
}

export interface CompatibilityResult {
  totalScore: number;         // 0~100
  grade: "천생연분" | "좋은 인연" | "무난한 관계" | "노력이 필요한 관계" | "주의가 필요한 관계";
  categories: CompatibilityCategory[];
  stemRelation: { type: string; description: string } | null;
  tenGodAtoB: string;         // A 기준 B의 십성
  tenGodBtoA: string;         // B 기준 A의 십성
  crossClashes: string[];
  crossHarmonies: string[];
  yongsinComplement: { aHelpsB: boolean; bHelpsA: boolean; details: string[] };
  summary: string;
}

// ═══════════════════════════════════════
// 1. 일간 관계 분석
// ═══════════════════════════════════════

function analyzeDayMasterRelation(a: PersonSaju, b: PersonSaju): CompatibilityCategory {
  const details: string[] = [];
  let score = 50; // 기본점

  // 천간합 확인
  const stemRel = checkStemRelation(a.dayMaster, b.dayMaster);
  if (stemRel) {
    if (stemRel.type === "천간합") {
      score += 30;
      details.push(`일간 천간합(${a.dayMaster}-${b.dayMaster}): ${stemRel.description} — 천생의 인연`);
    } else if (stemRel.type === "천간극") {
      score -= 15;
      details.push(`일간 천간극(${a.dayMaster}-${b.dayMaster}): ${stemRel.description} — 긴장 관계`);
    }
  }

  // 오행 관계
  const elemA = STEM_ELEMENT_KR[a.dayMaster] || "";
  const elemB = STEM_ELEMENT_KR[b.dayMaster] || "";

  if (elemA === elemB) {
    score += 10;
    details.push(`동일 오행(${elemA}): 서로 이해가 빠르고 공감대가 높음`);
  } else if (PRODUCE_ELEM[elemA] === elemB) {
    score += 15;
    details.push(`${elemA}→${elemB} 상생: A가 B를 자연스럽게 도움`);
  } else if (PRODUCE_ELEM[elemB] === elemA) {
    score += 15;
    details.push(`${elemB}→${elemA} 상생: B가 A를 자연스럽게 도움`);
  } else if (CONQUER_ELEM[elemA] === elemB) {
    score -= 10;
    details.push(`${elemA}→${elemB} 상극: A가 B를 제어하는 구조 — 역할 분담 가능`);
  } else if (CONQUER_ELEM[elemB] === elemA) {
    score -= 10;
    details.push(`${elemB}→${elemA} 상극: B가 A를 제어하는 구조 — 역할 분담 가능`);
  }

  return { name: "일간 관계", score: Math.max(0, Math.min(100, score)), weight: 0.25, details };
}

// ═══════════════════════════════════════
// 2. 십성 궁합
// ═══════════════════════════════════════

function analyzeTenGodCompat(a: PersonSaju, b: PersonSaju): CompatibilityCategory {
  const details: string[] = [];
  let score = 50;

  const aToB = calculateTenGod(a.dayMaster, b.dayMaster);
  const bToA = calculateTenGod(b.dayMaster, a.dayMaster);

  const goodTenGods = ["정재", "정관", "정인", "식신"];
  const neutralTenGods = ["편재", "편인", "비견"];
  const tenseTenGods = ["편관", "상관", "겁재"];

  // A→B 십성
  if (goodTenGods.includes(aToB)) {
    score += 15;
    details.push(`A에게 B는 ${aToB}: 안정적이고 긍정적 관계`);
  } else if (tenseTenGods.includes(aToB)) {
    score -= 10;
    details.push(`A에게 B는 ${aToB}: 긴장감이 있으나 성장의 동력`);
  } else {
    details.push(`A에게 B는 ${aToB}: 무난한 관계`);
  }

  // B→A 십성
  if (goodTenGods.includes(bToA)) {
    score += 15;
    details.push(`B에게 A는 ${bToA}: 안정적이고 긍정적 관계`);
  } else if (tenseTenGods.includes(bToA)) {
    score -= 10;
    details.push(`B에게 A는 ${bToA}: 긴장감이 있으나 성장의 동력`);
  } else {
    details.push(`B에게 A는 ${bToA}: 무난한 관계`);
  }

  // 상호 보완 보너스
  if ((aToB === "정재" && bToA === "정관") || (aToB === "정관" && bToA === "정재")) {
    score += 10;
    details.push("재관쌍미 구조: 재물과 명예가 함께하는 이상적 조합");
  }
  if ((aToB === "정인" && bToA === "식신") || (aToB === "식신" && bToA === "정인")) {
    score += 8;
    details.push("식인상생 구조: 지혜와 재능이 서로를 키워주는 관계");
  }

  return { name: "십성 궁합", score: Math.max(0, Math.min(100, score)), weight: 0.20, details };
}

// ═══════════════════════════════════════
// 3. 지지 합충 교차 분석
// ═══════════════════════════════════════

function analyzeCrossBranchInteractions(a: PersonSaju, b: PersonSaju): CompatibilityCategory {
  const details: string[] = [];
  let score = 50;
  const clashes: string[] = [];
  const harmonies: string[] = [];

  const labelsA = ["A년지", "A월지", "A일지", "A시지"];
  const labelsB = ["B년지", "B월지", "B일지", "B시지"];

  for (let i = 0; i < a.branches.length; i++) {
    for (let j = 0; j < b.branches.length; j++) {
      if (!a.branches[i] || !b.branches[j]) continue;
      const rel = checkBranchRelation(a.branches[i], b.branches[j]);
      if (!rel) continue;

      const label = `${labelsA[i]}-${labelsB[j]}`;
      if (rel.type.includes("합") || rel.type.includes("삼합")) {
        harmonies.push(`${label}: ${rel.description}`);
        // 일지끼리 합이면 특히 중요
        if (i === 2 && j === 2) {
          score += 12;
          details.push(`일지 합(${a.branches[i]}-${b.branches[j]}): 가장 깊은 유대감`);
        } else {
          score += 5;
        }
      } else if (rel.type === "지지충") {
        clashes.push(`${label}: ${rel.description}`);
        if (i === 2 && j === 2) {
          score -= 12;
          details.push(`일지 충(${a.branches[i]}-${b.branches[j]}): 근본적 마찰 주의`);
        } else {
          score -= 4;
        }
      } else if (rel.type === "형") {
        clashes.push(`${label}: ${rel.description}`);
        score -= 3;
      }
    }
  }

  if (harmonies.length > 0) details.push(`합 ${harmonies.length}개 발견: 결합·안정 에너지`);
  if (clashes.length > 0) details.push(`충/형 ${clashes.length}개 발견: 변동·마찰 에너지`);
  if (harmonies.length === 0 && clashes.length === 0) details.push("특별한 합충 없음: 무난한 관계");

  return { name: "지지 합충", score: Math.max(0, Math.min(100, score)), weight: 0.25, details };
}

// ═══════════════════════════════════════
// 4. 용신 보완 분석
// ═══════════════════════════════════════

function analyzeYongsinComplement(a: PersonSaju, b: PersonSaju): CompatibilityCategory {
  const details: string[] = [];
  let score = 50;

  // B의 사주에 A의 용신 오행이 있는지
  const bElements = b.elements || {};
  const aElements = a.elements || {};

  const aYongInB = (bElements[a.yongShin] || 0) >= 1;
  const bYongInA = (aElements[b.yongShin] || 0) >= 1;

  if (aYongInB) {
    score += 18;
    details.push(`B의 사주에 A의 용신(${a.yongShin})이 존재: B가 A에게 큰 도움`);
  } else {
    details.push(`B의 사주에 A의 용신(${a.yongShin}) 부재`);
  }

  if (bYongInA) {
    score += 18;
    details.push(`A의 사주에 B의 용신(${b.yongShin})이 존재: A가 B에게 큰 도움`);
  } else {
    details.push(`A의 사주에 B의 용신(${b.yongShin}) 부재`);
  }

  // 상호 용신 보완 (최고 점수)
  if (aYongInB && bYongInA) {
    score += 10;
    details.push("상호 용신 보완: 서로에게 필요한 기운을 제공하는 최상의 궁합");
  }

  // 기신 충돌 체크
  const aGiInB = (bElements[a.giShin] || 0) >= 2;
  const bGiInA = (aElements[b.giShin] || 0) >= 2;

  if (aGiInB) {
    score -= 10;
    details.push(`B의 사주에 A의 기신(${a.giShin}) 과다: B가 A에게 부담이 될 수 있음`);
  }
  if (bGiInA) {
    score -= 10;
    details.push(`A의 사주에 B의 기신(${b.giShin}) 과다: A가 B에게 부담이 될 수 있음`);
  }

  return { name: "용신 보완", score: Math.max(0, Math.min(100, score)), weight: 0.30, details };
}

// ═══════════════════════════════════════
// 종합 점수 → 등급
// ═══════════════════════════════════════

function scoreToGrade(score: number): CompatibilityResult["grade"] {
  if (score >= 85) return "천생연분";
  if (score >= 70) return "좋은 인연";
  if (score >= 50) return "무난한 관계";
  if (score >= 35) return "노력이 필요한 관계";
  return "주의가 필요한 관계";
}

// ═══════════════════════════════════════
// 요약 텍스트 생성
// ═══════════════════════════════════════

function generateSummary(result: Omit<CompatibilityResult, "summary">): string {
  const parts: string[] = [];

  parts.push(`두 분의 종합 궁합 점수는 ${result.totalScore}점으로 '${result.grade}'입니다.`);

  // 가장 높은 카테고리
  const best = [...result.categories].sort((a, b) => b.score - a.score)[0];
  if (best && best.score >= 65) {
    parts.push(`특히 ${best.name} 영역에서 ${best.score}점으로 좋은 조화를 보입니다.`);
  }

  // 가장 낮은 카테고리
  const worst = [...result.categories].sort((a, b) => a.score - b.score)[0];
  if (worst && worst.score < 40) {
    parts.push(`${worst.name} 영역(${worst.score}점)은 서로 이해와 배려가 필요한 부분입니다.`);
  }

  // 십성 관계
  parts.push(`A에게 B는 ${result.tenGodAtoB}의 관계이고, B에게 A는 ${result.tenGodBtoA}의 관계입니다.`);

  // 용신 보완
  if (result.yongsinComplement.aHelpsB && result.yongsinComplement.bHelpsA) {
    parts.push("상호 용신 보완이 이루어져 함께 있을 때 서로에게 긍정적 에너지를 줍니다.");
  } else if (result.yongsinComplement.aHelpsB || result.yongsinComplement.bHelpsA) {
    parts.push("한쪽이 다른 쪽에게 필요한 기운을 제공하는 관계입니다.");
  }

  return parts.join(" ");
}

// ═══════════════════════════════════════
// 메인 함수
// ═══════════════════════════════════════

export function analyzeCompatibility(a: PersonSaju, b: PersonSaju): CompatibilityResult {

  // 4개 카테고리 분석
  const cat1 = analyzeDayMasterRelation(a, b);
  const cat2 = analyzeTenGodCompat(a, b);
  const cat3 = analyzeCrossBranchInteractions(a, b);
  const cat4 = analyzeYongsinComplement(a, b);

  const categories = [cat1, cat2, cat3, cat4];

  // 가중 평균
  const totalWeight = categories.reduce((s, c) => s + c.weight, 0);
  const totalScore = Math.round(
    categories.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight
  );

  const grade = scoreToGrade(totalScore);

  // 십성 관계
  const tenGodAtoB = calculateTenGod(a.dayMaster, b.dayMaster);
  const tenGodBtoA = calculateTenGod(b.dayMaster, a.dayMaster);

  // 천간 관계
  const stemRelation = checkStemRelation(a.dayMaster, b.dayMaster);

  // 교차 충합 목록
  const crossClashes: string[] = [];
  const crossHarmonies: string[] = [];
  for (let i = 0; i < a.branches.length; i++) {
    for (let j = 0; j < b.branches.length; j++) {
      if (!a.branches[i] || !b.branches[j]) continue;
      const rel = checkBranchRelation(a.branches[i], b.branches[j]);
      if (!rel) continue;
      if (rel.type.includes("합") || rel.type.includes("삼합")) {
        crossHarmonies.push(`${a.branches[i]}-${b.branches[j]}: ${rel.description}`);
      } else {
        crossClashes.push(`${a.branches[i]}-${b.branches[j]}: ${rel.description}`);
      }
    }
  }

  // 용신 보완 요약
  const bElements = b.elements || {};
  const aElements = a.elements || {};
  const aHelpsB = (aElements[b.yongShin] || 0) >= 1;
  const bHelpsA = (bElements[a.yongShin] || 0) >= 1;
  const yongsinComplement = {
    aHelpsB,
    bHelpsA,
    details: cat4.details,
  };

  const resultData: Omit<CompatibilityResult, "summary"> = {
    totalScore,
    grade,
    categories,
    stemRelation,
    tenGodAtoB,
    tenGodBtoA,
    crossClashes,
    crossHarmonies,
    yongsinComplement,
  };

  return {
    ...resultData,
    summary: generateSummary(resultData),
  };
}

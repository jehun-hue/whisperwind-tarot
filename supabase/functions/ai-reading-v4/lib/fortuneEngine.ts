// lib/fortuneEngine.ts — 세운·월운 길흉 판단 엔진
// 용신/희신/기신/구신/한신 매칭 + 대운·원국 충합 기반 운세 판정

import {
  STEMS, BRANCHES, FIVE_ELEMENTS_MAP,
  STEM_ELEMENT_KR, BRANCH_ELEMENT_KR
} from "./fiveElements.ts";
import { calculateTenGod } from "./tenGods.ts";
import { calculateSeWoon, calculateWolWoon, analyzeWoonInteractions } from "./daewoon.ts";
import { checkStemRelation, checkBranchRelation } from "./interactions.ts";

// ═══════════════════════════════════════
// 타입 정의
// ═══════════════════════════════════════

export type FortuneRating = "대길" | "길" | "소길" | "평" | "소흉" | "흉" | "대흉";
export type ShinMatch = "용신" | "희신" | "기신" | "구신" | "한신" | "없음";

export interface SeunFortune {
  year: number;
  stem: string;
  branch: string;
  stemElement: string;
  branchElement: string;
  tenGodStem: string;
  tenGodBranch: string;
  stemMatch: ShinMatch;
  branchMatch: ShinMatch;
  rating: FortuneRating;
  score: number;            // -100 ~ +100
  clashes: string[];
  harmonies: string[];
  summary: string;
}

export interface WolwoonFortune {
  month: number;            // 1~12 (음력 기준 인월=1)
  solarMonth: number;       // 양력 대략 월
  stem: string;
  branch: string;
  stemElement: string;
  branchElement: string;
  stemMatch: ShinMatch;
  branchMatch: ShinMatch;
  rating: FortuneRating;
  score: number;
  summary: string;
}

export interface FortuneResult {
  seun: SeunFortune;
  monthly: WolwoonFortune[];
  yearOverview: string;
  bestMonths: number[];
  cautionMonths: number[];
  currentMonthFortune: WolwoonFortune | null;
}

// ═══════════════════════════════════════
// 용신 매칭 함수
// ═══════════════════════════════════════

function matchShin(
  element: string,
  yongShin: string,
  heeShin: string,
  giShin: string,
  guShin: string,
  hanShin: string
): ShinMatch {
  if (!element || element === "unknown") return "없음";
  if (element === yongShin) return "용신";
  if (element === heeShin) return "희신";
  if (element === giShin) return "기신";
  if (element === guShin) return "구신";
  if (element === hanShin) return "한신";
  return "없음";
}

// ═══════════════════════════════════════
// 점수 계산
// ═══════════════════════════════════════

const SHIN_SCORE: Record<ShinMatch, number> = {
  "용신": 40,
  "희신": 25,
  "한신": 0,
  "없음": 0,
  "구신": -20,
  "기신": -35,
};

function calcBaseScore(stemMatch: ShinMatch, branchMatch: ShinMatch): number {
  // 천간 40%, 지지 60% (지지가 실제 작용력 더 큼)
  return Math.round(SHIN_SCORE[stemMatch] * 0.4 + SHIN_SCORE[branchMatch] * 0.6);
}

function adjustForInteractions(base: number, clashes: string[], harmonies: string[]): number {
  let score = base;
  // 충은 변동성 → 기본 점수 방향 강화
  score += clashes.length * (base >= 0 ? -8 : -10);
  // 합은 안정성 → 기본 점수 방향 강화  
  score += harmonies.length * (base >= 0 ? 6 : 3);
  return Math.max(-100, Math.min(100, score));
}

function scoreToRating(score: number): FortuneRating {
  if (score >= 50) return "대길";
  if (score >= 30) return "길";
  if (score >= 15) return "소길";
  if (score >= -15) return "평";
  if (score >= -30) return "소흉";
  if (score >= -50) return "흉";
  return "대흉";
}

// ═══════════════════════════════════════
// 세운 요약 텍스트 생성
// ═══════════════════════════════════════

function generateSeunSummary(seun: Omit<SeunFortune, "summary">): string {
  const parts: string[] = [];

  // 기본 판정
  const ratingDesc: Record<FortuneRating, string> = {
    "대길": "매우 좋은 흐름이 예상되는 해입니다",
    "길": "전반적으로 순조로운 한 해입니다",
    "소길": "무난하면서 작은 기회가 있는 해입니다",
    "평": "큰 변화 없이 안정적인 한 해입니다",
    "소흉": "다소 주의가 필요한 해입니다",
    "흉": "어려움이 예상되므로 신중함이 필요합니다",
    "대흉": "큰 변화와 시련이 예상되므로 각별한 주의가 필요합니다",
  };
  parts.push(`${seun.year}년(${seun.stem}${seun.branch})은 ${ratingDesc[seun.rating]}.`);

  // 용신 매칭
  if (seun.stemMatch === "용신" || seun.branchMatch === "용신") {
    parts.push("세운에 용신이 들어와 핵심 에너지가 보충됩니다.");
  } else if (seun.stemMatch === "희신" || seun.branchMatch === "희신") {
    parts.push("희신의 기운이 작용하여 용신을 도와줍니다.");
  } else if (seun.stemMatch === "기신" || seun.branchMatch === "기신") {
    parts.push("기신의 기운이 강해 용신을 억제하므로 주의가 필요합니다.");
  } else if (seun.stemMatch === "구신" || seun.branchMatch === "구신") {
    parts.push("구신이 기신을 돕는 구조로 간접적 어려움이 있을 수 있습니다.");
  }

  // 충합 정보
  if (seun.clashes.length > 0) {
    parts.push(`원국과 ${seun.clashes[0]} 등의 충돌이 있어 변동·이동수가 있습니다.`);
  }
  if (seun.harmonies.length > 0) {
    parts.push(`원국과 ${seun.harmonies[0]} 등의 합이 있어 안정·결합의 기운이 있습니다.`);
  }

  // 십성 기반 영역
  const tenGodArea: Record<string, string> = {
    "비견": "자기 확장, 독립적 활동에 유리합니다",
    "겁재": "경쟁 상황에서 힘이 생기나 재물 지출에 주의하세요",
    "식신": "재능 발휘와 건강에 좋은 기운입니다",
    "상관": "창의성이 높아지나 윗사람과 마찰에 주의하세요",
    "편재": "투자·사업 기회가 있으나 리스크도 함께합니다",
    "정재": "안정적 수입과 재물 축적에 유리합니다",
    "편관": "직업적 변화·도전의 기회가 옵니다",
    "정관": "직장·명예 운이 좋아지는 시기입니다",
    "편인": "학문·기술 분야에서 돌파구가 열립니다",
    "정인": "학업·자격·인덕이 좋아지는 시기입니다",
  };
  if (tenGodArea[seun.tenGodStem]) {
    parts.push(`천간 ${seun.tenGodStem}의 작용으로 ${tenGodArea[seun.tenGodStem]}.`);
  }

  return parts.join(" ");
}

// ═══════════════════════════════════════
// 월운 요약 텍스트 생성
// ═══════════════════════════════════════

function generateWolwoonSummary(wol: Omit<WolwoonFortune, "summary">, yearRating: FortuneRating): string {
  const monthNames = ["인월(1월)", "묘월(2월)", "진월(3월)", "사월(4월)", "오월(5월)", "미월(6월)",
                      "신월(7월)", "유월(8월)", "술월(9월)", "해월(10월)", "자월(11월)", "축월(12월)"];
  const name = monthNames[wol.month - 1] || `${wol.month}월`;

  if (wol.stemMatch === "용신" || wol.branchMatch === "용신") {
    return `${name}: 용신이 작용하여 가장 활발한 시기. 중요한 결정이나 시작에 적합합니다.`;
  }
  if (wol.stemMatch === "희신" || wol.branchMatch === "희신") {
    return `${name}: 희신의 보조로 안정적이고 순조로운 흐름입니다.`;
  }
  if (wol.stemMatch === "기신" || wol.branchMatch === "기신") {
    return `${name}: 기신의 영향으로 장애물이 예상됩니다. 무리한 추진을 삼가세요.`;
  }
  if (wol.stemMatch === "구신" || wol.branchMatch === "구신") {
    return `${name}: 구신의 간접 방해가 있을 수 있습니다. 주변 관계에 신경 쓰세요.`;
  }
  return `${name}: 특별한 변동 없이 평온한 시기입니다.`;
}

function getSolarToJeolMonth(solarMonth: number, solarDay: number): number {
  const APPROX_JEOL_DAY = 6;
  let adjusted = solarDay < APPROX_JEOL_DAY ? solarMonth - 1 : solarMonth;
  if (adjusted <= 0) adjusted += 12;
  return adjusted <= 1 ? 12 : adjusted - 1;
}

// ═══════════════════════════════════════
// 메인 함수
// ═══════════════════════════════════════

export function calculateFortune(
  dayMaster: string,
  yongShin: string,
  heeShin: string,
  giShin: string,
  guShin: string,
  hanShin: string,
  natalStems: string[],
  natalBranches: string[],
  daewoonStem: string | null,
  daewoonBranch: string | null,
  targetYear?: number,
  currentMonth?: number
): FortuneResult {

  const year = targetYear || new Date().getFullYear();
  const month = currentMonth || new Date().getMonth() + 1;

  // ── 1. 세운 계산 ──
  const seunRaw = calculateSeWoon(year);
  const seunStemElem = STEM_ELEMENT_KR[seunRaw.stem] || "unknown";
  const seunBranchElem = BRANCH_ELEMENT_KR[seunRaw.branch] || "unknown";
  const seunTenGodStem = calculateTenGod(dayMaster, seunRaw.stem);
  const seunTenGodBranch = calculateTenGod(dayMaster, seunRaw.branch);

  const stemMatch = matchShin(seunStemElem, yongShin, heeShin, giShin, guShin, hanShin);
  const branchMatch = matchShin(seunBranchElem, yongShin, heeShin, giShin, guShin, hanShin);

  // 충합 분석
  const seunClashes: string[] = [];
  const seunHarmonies: string[] = [];

  natalStems.forEach((ns, i) => {
    const labels = ["년간", "월간", "일간", "시간"];
    const rel = checkStemRelation(seunRaw.stem, ns);
    if (rel) {
      if (rel.type.includes("합")) seunHarmonies.push(`세운-${labels[i]} ${rel.description}`);
      else seunClashes.push(`세운-${labels[i]} ${rel.description}`);
    }
  });
  natalBranches.forEach((nb, i) => {
    const labels = ["년지", "월지", "일지", "시지"];
    const rel = checkBranchRelation(seunRaw.branch, nb);
    if (rel) {
      if (rel.type.includes("합") || rel.type.includes("삼합")) seunHarmonies.push(`세운-${labels[i]} ${rel.description}`);
      else seunClashes.push(`세운-${labels[i]} ${rel.description}`);
    }
  });

  // 대운과 세운 상호작용
  if (daewoonStem && daewoonBranch) {
    const dsStem = checkStemRelation(daewoonStem, seunRaw.stem);
    if (dsStem) {
      if (dsStem.type.includes("합")) seunHarmonies.push(`대운-세운 천간 ${dsStem.description}`);
      else seunClashes.push(`대운-세운 천간 ${dsStem.description}`);
    }
    const dsBranch = checkBranchRelation(daewoonBranch, seunRaw.branch);
    if (dsBranch) {
      if (dsBranch.type.includes("합") || dsBranch.type.includes("삼합")) seunHarmonies.push(`대운-세운 지지 ${dsBranch.description}`);
      else seunClashes.push(`대운-세운 지지 ${dsBranch.description}`);
    }
  }

  const baseScore = calcBaseScore(stemMatch, branchMatch);
  const finalScore = adjustForInteractions(baseScore, seunClashes, seunHarmonies);
  const rating = scoreToRating(finalScore);

  const seunData: Omit<SeunFortune, "summary"> = {
    year,
    stem: seunRaw.stem,
    branch: seunRaw.branch,
    stemElement: seunStemElem,
    branchElement: seunBranchElem,
    tenGodStem: seunTenGodStem,
    tenGodBranch: seunTenGodBranch,
    stemMatch,
    branchMatch,
    rating,
    score: finalScore,
    clashes: seunClashes,
    harmonies: seunHarmonies,
  };

  const seun: SeunFortune = {
    ...seunData,
    summary: generateSeunSummary(seunData),
  };

  // ── 2. 월운 12개월 계산 ──
  const yearStem = seunRaw.stem;
  const monthly: WolwoonFortune[] = [];

  for (let m = 1; m <= 12; m++) {
    const wol = calculateWolWoon(yearStem, m);
    const wolStemElem = STEM_ELEMENT_KR[wol.stem] || "unknown";
    const wolBranchElem = BRANCH_ELEMENT_KR[wol.branch] || "unknown";

    const wStemMatch = matchShin(wolStemElem, yongShin, heeShin, giShin, guShin, hanShin);
    const wBranchMatch = matchShin(wolBranchElem, yongShin, heeShin, giShin, guShin, hanShin);

    const wBase = calcBaseScore(wStemMatch, wBranchMatch);
    // 월운은 세운 기조의 영향을 받음 (세운 점수의 20% 가산)
    const wFinal = Math.max(-100, Math.min(100, wBase + Math.round(finalScore * 0.2)));
    const wRating = scoreToRating(wFinal);

    // 양력 대략 환산 (인월=2월 기준)
    const solarMonth = m === 12 ? 1 : m + 1;

    const wolData: Omit<WolwoonFortune, "summary"> = {
      month: m,
      solarMonth,
      stem: wol.stem,
      branch: wol.branch,
      stemElement: wolStemElem,
      branchElement: wolBranchElem,
      stemMatch: wStemMatch,
      branchMatch: wBranchMatch,
      rating: wRating,
      score: wFinal,
    };

    monthly.push({
      ...wolData,
      summary: generateWolwoonSummary(wolData, rating),
    });
  }

  // ── 3. 종합 분석 ──
  const bestMonths = monthly
    .filter(m => m.score >= 15)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(m => m.solarMonth);

  const cautionMonths = monthly
    .filter(m => m.score <= -15)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(m => m.solarMonth);

  // 현재 월운
  const currentSolarMonth = month;
  const currentSolarDay = new Date().getDate();
  const currentJeolMonth = getSolarToJeolMonth(currentSolarMonth, currentSolarDay);
  const currentMonthFortune = monthly.find(m => m.month === currentJeolMonth) || null;

  // 연간 총평
  const yearParts: string[] = [];
  yearParts.push(`${year}년 전체 운세는 '${rating}'으로 판정됩니다.`);

  if (bestMonths.length > 0) {
    yearParts.push(`가장 좋은 시기는 ${bestMonths.map(m => `${m}월`).join(", ")}입니다.`);
  }
  if (cautionMonths.length > 0) {
    yearParts.push(`주의가 필요한 시기는 ${cautionMonths.map(m => `${m}월`).join(", ")}입니다.`);
  }

  if (currentMonthFortune) {
    yearParts.push(`현재 ${currentSolarMonth}월(절기 ${currentJeolMonth}월)은 '${currentMonthFortune.rating}' 흐름입니다.`);
  }

  const yearOverview = yearParts.join(" ");

  return {
    seun,
    monthly,
    yearOverview,
    bestMonths,
    cautionMonths,
    currentMonthFortune,
  };
}

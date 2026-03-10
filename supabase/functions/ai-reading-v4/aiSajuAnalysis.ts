/**
 * aiSajuAnalysis.ts (v9)
 * 사주 구조 분석 엔진 — 일간별 동적 분석, 십성(十星), 6충, 삼합/방합/형살
 *
 * 입력: sajuEngine.ts의 getFullSaju() 반환값
 * 출력: SajuAnalysisResult (dayMaster, strength, elements, characteristics[], narrative)
 */

export interface SajuAnalysisResult {
  dayMaster: string;
  strength: string;
  elements: Record<string, number>;
  characteristics: string[];
  narrative: string;
  tenGods: Record<string, number>;
  yongShin: string;
  daewoon: any | null; 
}

import { getDaewoonInfo, calculateFullDaewoon, type DaewoonResult } from "./lib/daewoon.ts";
import { STEMS, BRANCHES, FIVE_ELEMENTS_MAP } from "./lib/fiveElements.ts";

// ═══════════════════════════════════════
// 천간(天干) 오행 매핑
// ═══════════════════════════════════════
const STEM_ELEMENT: Record<string, string> = {
  "甲": "목", "乙": "목", "丙": "화", "丁": "화", "戊": "토",
  "己": "토", "庚": "금", "辛": "금", "壬": "수", "癸": "수"
};

// 지지(地支) 오행 매핑
const BRANCH_ELEMENT: Record<string, string> = {
  "子": "수", "丑": "토", "寅": "목", "卯": "목", "辰": "토", "巳": "화",
  "午": "화", "未": "토", "申": "금", "酉": "금", "戌": "토", "亥": "수"
};

// 지지 장간(藏干) — 각 지지에 숨어있는 천간들 (본기/중기/여기)
const HIDDEN_STEMS: Record<string, string[]> = {
  "子": ["癸"],
  "丑": ["己", "癸", "辛"],
  "寅": ["甲", "丙", "戊"],
  "卯": ["乙"],
  "辰": ["戊", "乙", "癸"],
  "巳": ["丙", "庚", "戊"],
  "午": ["丁", "己"],
  "未": ["己", "丁", "乙"],
  "申": ["庚", "壬", "戊"],
  "酉": ["辛"],
  "戌": ["戊", "辛", "丁"],
  "亥": ["壬", "甲"]
};

// ═══════════════════════════════════════
// 오행 상생상극 관계
// ═══════════════════════════════════════
// 나(일간 오행) 기준 십성 판별용
const ELEMENT_CYCLE = ["목", "화", "토", "금", "수"];

function getRelation(myElement: string, targetElement: string): string {
  const myIdx = ELEMENT_CYCLE.indexOf(myElement);
  const tgtIdx = ELEMENT_CYCLE.indexOf(targetElement);
  if (myIdx < 0 || tgtIdx < 0) return "unknown";

  const diff = (tgtIdx - myIdx + 5) % 5;
  // diff: 0=비겁, 1=식상, 2=재성, 3=관성, 4=인성
  switch (diff) {
    case 0: return "비겁";
    case 1: return "식상";
    case 2: return "재성";
    case 3: return "관성";
    case 4: return "인성";
    default: return "unknown";
  }
}

// ═══════════════════════════════════════
// 6충(六沖) 감지
// ═══════════════════════════════════════
const CHUNG_PAIRS: [string, string, string][] = [
  ["子", "午", "자오충"],
  ["丑", "未", "축미충"],
  ["寅", "申", "인신충"],
  ["卯", "酉", "묘유충"],
  ["辰", "戌", "진술충"],
  ["巳", "亥", "사해충"]
];

function detectChung(branches: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      for (const [a, b, name] of CHUNG_PAIRS) {
        if ((branches[i] === a && branches[j] === b) || (branches[i] === b && branches[j] === a)) {
          result.push(`${name} 존재`);
        }
      }
    }
  }
  return result;
}

// ═══════════════════════════════════════
// 삼합(三合) 감지
// ═══════════════════════════════════════
const SAMHAP_GROUPS: [string, string, string, string][] = [
  ["申", "子", "辰", "수국 삼합"],   // 수(水) 삼합
  ["寅", "午", "戌", "화국 삼합"],   // 화(火) 삼합
  ["巳", "酉", "丑", "금국 삼합"],   // 금(金) 삼합
  ["亥", "卯", "未", "목국 삼합"]    // 목(木) 삼합
];

function detectSamhap(branches: string[]): string[] {
  const result: string[] = [];
  const branchSet = new Set(branches);
  for (const [a, b, c, name] of SAMHAP_GROUPS) {
    if (branchSet.has(a) && branchSet.has(b) && branchSet.has(c)) {
      result.push(`삼합 존재`);
      break; // 하나만 감지해도 태깅
    }
  }
  return result;
}

// ═══════════════════════════════════════
// 방합(方合) 감지
// ═══════════════════════════════════════
const BANGHAP_GROUPS: [string, string, string, string][] = [
  ["寅", "卯", "辰", "동방 목국 방합"],
  ["巳", "午", "未", "남방 화국 방합"],
  ["申", "酉", "戌", "서방 금국 방합"],
  ["亥", "子", "丑", "북방 수국 방합"]
];

function detectBanghap(branches: string[]): string[] {
  const result: string[] = [];
  const branchSet = new Set(branches);
  for (const [a, b, c, _name] of BANGHAP_GROUPS) {
    if (branchSet.has(a) && branchSet.has(b) && branchSet.has(c)) {
      result.push(`방합 존재`);
      break;
    }
  }
  return result;
}

// ═══════════════════════════════════════
// 형살(刑殺) 감지 (삼형살)
// ═══════════════════════════════════════
const HYUNG_GROUPS: [string, string, string][] = [
  ["寅", "巳", "申"],  // 무은지형(無恩之刑)
  ["丑", "戌", "未"],  // 무례지형(無禮之刑)
];

function detectHyung(branches: string[]): string[] {
  const result: string[] = [];
  const branchSet = new Set(branches);
  for (const [a, b, c] of HYUNG_GROUPS) {
    if (branchSet.has(a) && branchSet.has(b) && branchSet.has(c)) {
      result.push(`형살 존재`);
      break;
    }
  }
  // 자형(自刑): 辰辰, 午午, 酉酉, 亥亥
  const selfPunish = ["辰", "午", "酉", "亥"];
  for (const sp of selfPunish) {
    if (branches.filter(b => b === sp).length >= 2) {
      result.push(`형살 존재`);
      break;
    }
  }
  return result;
}

// ═══════════════════════════════════════
// 메인 분석 함수
// ═══════════════════════════════════════
export async function analyzeSajuStructure(
  sajuRaw: any
): Promise<SajuAnalysisResult> {
  // 방어: 데이터 부족 시
  if (!sajuRaw || !sajuRaw.dayMaster) {
    return {
      dayMaster: "Unknown",
      strength: "Unknown",
      elements: {},
      characteristics: [],
      narrative: "사주 데이터가 부족합니다.",
      tenGods: {},
      yongShin: "Unknown",
      daewoon: null
    };
  }

  const dm = sajuRaw.dayMaster; // 천간 문자 (예: "甲", "壬")
  const myElement = STEM_ELEMENT[dm] || "unknown";
  const elements: Record<string, number> = sajuRaw.elements || {};

  // 4개 기둥의 stem/branch 수집
  const pillars = sajuRaw.pillars || { year: sajuRaw.year, month: sajuRaw.month, day: sajuRaw.day, hour: sajuRaw.hour };
  const stems: string[] = [pillars.year?.stem, pillars.month?.stem, pillars.day?.stem, pillars.hour?.stem].filter(Boolean);
  const branches: string[] = [pillars.year?.branch, pillars.month?.branch, pillars.day?.branch, pillars.hour?.branch].filter(Boolean);

  // ── 1. 십성(十星) 분포 계산 ──
  const tenGodCount: Record<string, number> = { "비겁": 0, "식상": 0, "재성": 0, "관성": 0, "인성": 0 };

  // 천간 분석 (일간 자신 제외)
  stems.forEach((s, i) => {
    if (i === 2) return; // 일간(day stem) 자체는 제외
    const el = STEM_ELEMENT[s];
    if (el) {
      const rel = getRelation(myElement, el);
      if (tenGodCount[rel] !== undefined) tenGodCount[rel]++;
    }
  });

  // 지지 장간 분석 (모든 지지의 장간 포함)
  branches.forEach(b => {
    const hiddenStems = HIDDEN_STEMS[b] || [];
    hiddenStems.forEach((hs, idx) => {
      const el = STEM_ELEMENT[hs];
      if (el) {
        const rel = getRelation(myElement, el);
        // 본기(idx=0)는 1.0, 중기(idx=1)는 0.5, 여기(idx=2)는 0.3 가중
        const weight = idx === 0 ? 1.0 : idx === 1 ? 0.5 : 0.3;
        if (tenGodCount[rel] !== undefined) tenGodCount[rel] += weight;
      }
    });
  });

  // ── 2. 신강/신약 판정 ──
  // 나를 돕는 힘: 비겁 + 인성
  const supportPower = tenGodCount["비겁"] + tenGodCount["인성"];
  // 나를 약하게 하는 힘: 식상 + 재성 + 관성
  const drainPower = tenGodCount["식상"] + tenGodCount["재성"] + tenGodCount["관성"];
  const totalPower = supportPower + drainPower;
  const supportRatio = totalPower > 0 ? supportPower / totalPower : 0.5;

  let strength: string;
  if (supportRatio >= 0.7) strength = "극신강";
  else if (supportRatio >= 0.55) strength = "중신강";
  else if (supportRatio >= 0.4) strength = "중신약";
  else strength = "극신약";

  // ── 3. 용신(用神) 추론 ──
  // 신강 → 식상/재성/관성이 용신 (에너지 배출)
  // 신약 → 비겁/인성이 용신 (에너지 보충)
  let yongsin: string;
  if (strength === "극신강" || strength === "중신강") {
    // 가장 약한 극설(洩) 오행 찾기
    const drainMap: Record<string, string> = { "식상": getProducedElement(myElement), "재성": getConqueredElement(myElement) };
    const weakest = Object.entries(elements).sort((a, b) => a[1] - b[1])[0];
    yongsin = weakest ? weakest[0] : getProducedElement(myElement);
  } else {
    // 비겁 또는 인성 → 나와 같거나 나를 생하는 오행
    yongsin = elements[myElement] <= (elements[getProducingElement(myElement)] || 0) ? myElement : getProducingElement(myElement);
  }

  // ── 4. Characteristics 생성 ──
  const characteristics: string[] = [];

  // 십성 강약 태깅
  const maxTenGod = Object.entries(tenGodCount).sort((a, b) => b[1] - a[1]);
  if (maxTenGod[0] && maxTenGod[0][1] >= 2.5) {
    characteristics.push(`${maxTenGod[0][0]} 작용 강함`);
  }
  if (maxTenGod.length > 1 && maxTenGod[1][1] >= 2.0) {
    characteristics.push(`${maxTenGod[1][0]} 작용 강함`);
  }

  // 오행 과다/부족 태깅
  const elementNames = ["목", "화", "토", "금", "수"];
  elementNames.forEach(name => {
    const count = elements[name] || 0;
    if (count >= 3) characteristics.push(`${name} 과다`);
    else if (count === 0) characteristics.push(`${name} 부족`);
  });

  // 일간 특성 태깅
  const dmTagMap: Record<string, string> = {
    "목": "목 일간의 생명력", "화": "화 일간의 열정",
    "토": "토 일간의 안정", "금": "금 일간의 결단", "수": "수 일간의 유연"
  };
  if (dmTagMap[myElement]) characteristics.push(dmTagMap[myElement]);

  // 충(沖) 감지
  const chungResults = detectChung(branches);
  characteristics.push(...chungResults);

  // 삼합 감지
  const samhapResults = detectSamhap(branches);
  characteristics.push(...samhapResults);

  // 방합 감지
  const banghapResults = detectBanghap(branches);
  characteristics.push(...banghapResults);

  // 형살 감지
  const hyungResults = detectHyung(branches);
  characteristics.push(...hyungResults);

  // ── 5. 서사(Narrative) 생성 ──
  const dmKorean: Record<string, string> = {
    "甲": "갑목(甲木)", "乙": "을목(乙木)", "丙": "병화(丙火)", "丁": "정화(丁火)",
    "戊": "무토(戊土)", "己": "기토(己土)", "庚": "경금(庚金)", "辛": "신금(辛金)",
    "壬": "임수(壬水)", "癸": "계수(癸水)"
  };

  const strengthDesc: Record<string, string> = {
    "극신강": "매우 강한 자아를 가지고 있어 자기 주도적이지만 고집이 셀 수 있습니다",
    "중신강": "적당히 강한 에너지로 자기 표현과 추진력이 좋은 구조입니다",
    "중신약": "주변 환경의 영향을 많이 받으며 유연하지만 결단에 시간이 걸릴 수 있습니다",
    "극신약": "자아 에너지가 약해 환경에 의해 휘둘리기 쉬우며, 자기 보호가 중요합니다"
  };

  const tenGodDesc = maxTenGod
    .filter(([_, v]) => v >= 1.5)
    .slice(0, 3)
    .map(([k, v]) => `${k}(${v.toFixed(1)})`)
    .join(", ");

  const chungDesc = chungResults.length > 0 ? ` ${chungResults.join(", ")}이(가) 감지되어 해당 영역에서 변동성이 예상됩니다.` : "";
  const harmonyDesc = (samhapResults.length > 0 || banghapResults.length > 0) ? " 지지 합의 구조가 있어 에너지 결집력이 좋습니다." : "";
  const hyungDesc = hyungResults.length > 0 ? " 형살 구조가 있어 건강이나 대인관계 마찰에 주의가 필요합니다." : "";

  let narrative = `일간이 ${dmKorean[dm] || dm}으로, ${strengthDesc[strength] || strength}. ` +
    `오행 분포는 ${elementNames.map(n => `${n}(${elements[n] || 0})`).join(", ")}이며, ` +
    `주요 십성 구성은 ${tenGodDesc || "고르게 분포"}입니다. ` +
    `용신은 '${yongsin}'으로 판단됩니다.` +
    chungDesc + harmonyDesc + hyungDesc;

  // === 대운 분석 ===
  let daewoon: DaewoonResult | null = null;
  try {
    const yearStemIdx = STEMS.indexOf(sajuRaw.yearPillar?.stem || sajuRaw.year?.stem);
    const monthStemIdx = STEMS.indexOf(sajuRaw.monthPillar?.stem || sajuRaw.month?.stem);
    const monthBranchIdx = BRANCHES.indexOf(sajuRaw.monthPillar?.branch || sajuRaw.month?.branch);
    const gender = sajuRaw.gender === 'F' || sajuRaw.gender === 'female' ? 'F' : 'M';
    const birthYear = sajuRaw.yearPillar?.year || sajuRaw.birthYear || sajuRaw.year || new Date().getFullYear() - 30;
    const currentAge = new Date().getFullYear() - birthYear;

    if (yearStemIdx >= 0 && monthStemIdx >= 0 && monthBranchIdx >= 0 && sajuRaw.sunLong !== undefined) {
      const { age: startAge, isForward } = getDaewoonInfo(
        yearStemIdx, gender, sajuRaw.sunLong, sajuRaw.jd, birthYear
      );
      daewoon = calculateFullDaewoon(monthStemIdx, monthBranchIdx, dm, startAge, isForward, currentAge);

      // 현재 대운 특성 태깅
      if (daewoon.currentDaewoon) {
        const cd = daewoon.currentDaewoon;
        characteristics.push(`현재 대운: ${cd.full} (${cd.startAge}~${cd.endAge}세)`);
        characteristics.push(`대운 십성: ${cd.tenGodStem}/${cd.tenGodBranch}`);
        
        // 대운이 용신과 같은 오행이면 긍정 태깅
        const yongShinElement = FIVE_ELEMENTS_MAP[yongsin] || "unknown";
        if (cd.stemElement === yongShinElement || cd.branchElement === yongShinElement) {
          characteristics.push("대운-용신 합치: 운세 상승기");
        }
        // 대운에 충이 있으면 경고 태깅 (CHUNG_PAIRS 활용)
        if (CHUNG_PAIRS.some(([a, b]) => 
          (cd.branch === a && branches.includes(b)) || (cd.branch === b && branches.includes(a))
        )) {
          characteristics.push("대운 충 존재: 변동 주의");
        }
      }
    }
  } catch (e) {
    console.error("[Daewoon] Calculation failed:", e);
  }

  // narrative에 대운 정보 통합
  if (daewoon?.currentDaewoon) {
    const cd = daewoon.currentDaewoon;
    narrative += ` 현재 ${cd.startAge}~${cd.endAge}세 대운(${cd.full})이 진행 중이며, ` +
      `이 시기의 주요 에너지는 ${cd.tenGodStem}(천간)과 ${cd.tenGodBranch}(지지)입니다.`;
  }

  return { 
    dayMaster: dm, 
    strength, 
    elements, 
    characteristics, 
    narrative, 
    tenGods: tenGodCount, 
    yongShin: yongsin, 
    daewoon 
  };
}

// ═══════════════════════════════════════
// 오행 관계 헬퍼
// ═══════════════════════════════════════

/** 내가 생하는 오행 (식상) */
function getProducedElement(myEl: string): string {
  const map: Record<string, string> = { "목": "화", "화": "토", "토": "금", "금": "수", "수": "목" };
  return map[myEl] || myEl;
}

/** 내가 극하는 오행 (재성) */
function getConqueredElement(myEl: string): string {
  const map: Record<string, string> = { "목": "토", "화": "금", "토": "수", "금": "목", "수": "화" };
  return map[myEl] || myEl;
}

/** 나를 생하는 오행 (인성) */
function getProducingElement(myEl: string): string {
  const map: Record<string, string> = { "목": "수", "화": "목", "토": "화", "금": "토", "수": "금" };
  return map[myEl] || myEl;
}

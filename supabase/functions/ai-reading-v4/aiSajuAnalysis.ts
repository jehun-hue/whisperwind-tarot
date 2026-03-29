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
  sewoon: any | null;
  wolwoon: any | null;
  tenGods: Record<string, number>;
  yongShin: string;
  yongShinMethod: string;
  heeShin: string;
  daewoon: any | null; 
  interactions: Interaction[];
  shinsal: Shinsal[];                                   // B-144: 신살
  health_risk_tags: string[];                           // B-144: 건강 위험 태그
  topic_shinsal_map: Record<string, string[]>;          // B-145: 토픽별 신살 매핑
  twelve_stages?: any;                                  // B-256: 12운성 정보
  gyeokguk?: GyeokgukResult;                             // B-257: 격국 분석
  giShin: string;                                       // B-258: 기신
  guShin: string;                                       // B-258: 구신
  hanShin: string;                                      // B-258: 한신
  jijanggan?: any;                                      // B-259: 지장간 상세
  shinsal_grouped?: any;                                // B-260: 주별 신살
  gwimun_wonjin?: any;                                  // B-261: 귀문관살·원진살
  twelve_stages_geobup?: any;                           // B-262: 12운성 거법
  napeum?: any;                                         // B-263: 납음오행
  strength_detail?: any;                                // B-264: 강약 세부
  cross_interactions?: any;                             // B-265: 교차 합충
  yongsin_detail?: any;                                 // B-266: 용신 상세 (억부, 조후, 통관)
  tenGodDistribution?: any;                             // B-267: 십신 에너지 분포
  elements_simple?: Record<string, number>;            // v2: 단순 오행 카운트
  elements_weighted?: Record<string, number>;          // v2: 가중 오행 (합충 반영)
  gongmang?: any;                                      // v2: 공망 정보
  element_adjustments?: any[];                         // v2: 합화 오행 변화
  daewoon_transition?: any;                            // v2: 대운 전환기 경고
  daily_pillar?: any;                                  // v2: 일진 분석
  fortune?: FortuneResult;                             // v3: 세운·월운 운세
  fourPillars?: any;                                   // v3: 사주 원국 원본 (일주 추출용)
}

import { getDaewoonInfo, calculateFullDaewoon, type DaewoonResult } from "./lib/daewoon.ts";
import {
  STEM_ELEMENT_KR as STEM_ELEMENT,
  BRANCH_ELEMENT_KR as BRANCH_ELEMENT,
  HIDDEN_STEMS,
  BRANCH_MAIN_STEM,
  ELEMENT_CYCLE,
  PRODUCE_ELEM,
  SUPPORT_ELEM,
  CONQUER_ELEM,
  CONQUERED_BY_ELEM,
  STEMS,
  BRANCHES,
  FIVE_ELEMENTS_MAP
} from "./lib/fiveElements.ts";
import { calculateInteractions, calculateShinsal, calculateShinsalGrouped, calculateGwimunWonjin, calculateGongmang, checkStemRelation, checkBranchRelation, type Interaction, type Shinsal } from "./lib/interactions.ts";
import { calculateAllTwelveStages, calculateTwelveStage, calculateAllTwelveStagesGeobup, calculateTwelveStageGeobup, getTwelveStageEnergy } from "./lib/twelveStages.ts";
import { determineGyeokguk, type GyeokgukResult } from "./lib/gyeokguk.ts";
import { getAllPillarJijanggan } from "./lib/jijanggan.ts";
import { getAllPillarNapeum } from "./lib/napeum.ts";
import { calculateTenGod } from "./lib/tenGods.ts";
import { getFullSaju } from "./sajuEngine.ts";
import { calculateJonggyeok } from "./lib/jonggyeokEngine.ts";
import { calculateFortune, type FortuneResult } from "./lib/fortuneEngine.ts";



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
const HYUNG_GROUPS: [string, string, string, string][] = [
  ["寅", "巳", "申", "寅巳申 삼형살(무은지형)"],
  ["丑", "戌", "未", "丑戌未 삼형살(무례지형)"],
];

function detectHyung(branches: string[]): string[] {
  const result: string[] = [];
  const branchSet = new Set(branches);
  for (const [a, b, c, label] of HYUNG_GROUPS) {
    if (branchSet.has(a) && branchSet.has(b) && branchSet.has(c)) {
      result.push(`${label} 존재`);
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

// ── B-266: 조후용신 테이블 ──────────────────────────────────────
const JOHU_TABLE: Record<string, Record<string, string[]>> = {
  "甲": {
    "寅": ["丙", "癸"], "卯": ["丙", "癸"], "辰": ["丙", "癸", "庚"],
    "巳": ["癸"], "午": ["癸", "丁"], "未": ["癸"],
    "申": ["丙", "癸"], "酉": ["丁", "丙"], "戌": ["甲", "丙"],
    "亥": ["丙", "庚"], "子": ["丙", "丁"], "丑": ["丙", "丁"]
  },
  "乙": {
    "寅": ["丙"], "卯": ["丙"], "辰": ["癸", "丙"],
    "巳": ["癸"], "午": ["癸"], "未": ["癸", "丙"],
    "申": ["丙", "癸"], "酉": ["丙", "癸"], "戌": ["丙"],
    "亥": ["丙"], "子": ["丙"], "丑": ["丙"]
  },
  "丙": {
    "寅": ["壬"], "卯": ["壬"], "辰": ["壬", "甲"],
    "巳": ["壬", "庚"], "午": ["壬", "庚"], "未": ["壬"],
    "申": ["甲", "壬"], "酉": ["甲", "壬"], "戌": ["甲", "壬"],
    "亥": ["甲", "壬"], "子": ["甲", "壬"], "丑": ["甲", "壬"]
  },
  "丁": {
    "寅": ["甲", "庚"], "卯": ["甲", "庚"], "辰": ["甲", "庚"],
    "巳": ["壬", "甲"], "午": ["壬", "甲"], "未": ["壬", "甲"],
    "申": ["甲", "庚", "丙"], "酉": ["甲", "庚", "丙"], "戌": ["甲", "庚"],
    "亥": ["甲", "庚"], "子": ["甲", "庚"], "丑": ["甲", "庚"]
  },
  "戊": {
    "寅": ["丙", "癸"], "卯": ["丙", "癸"], "辰": ["甲", "癸"],
    "巳": ["壬", "甲"], "午": ["壬", "甲"], "未": ["癸", "丙"],
    "申": ["丙", "癸"], "酉": ["丙", "癸"], "戌": ["甲", "癸"],
    "亥": ["丙", "甲"], "子": ["丙", "甲"], "丑": ["丙", "甲"]
  },
  "己": {
    "寅": ["丙", "癸"], "卯": ["丙", "癸"], "辰": ["丙", "癸", "甲"],
    "巳": ["癸"], "午": ["癸"], "未": ["癸", "丙"],
    "申": ["丙", "癸"], "酉": ["丙", "癸"], "戌": ["丙", "癸"],
    "亥": ["丙", "癸"], "子": ["丙"], "丑": ["丙"]
  },
  "庚": {
    "寅": ["丙", "丁"], "卯": ["丙", "丁"], "辰": ["甲", "丁", "壬"],
    "巳": ["壬", "甲"], "午": ["壬", "甲"], "未": ["壬", "丁"],
    "申": ["丁", "壬"], "酉": ["丁", "壬"], "戌": ["壬", "甲"],
    "亥": ["丁", "丙", "甲"], "子": ["丁", "丙"], "丑": ["丁", "丙"]
  },
  "辛": {
    "寅": ["壬", "甲"], "卯": ["壬", "甲"], "辰": ["壬"],
    "巳": ["壬", "己"], "午": ["壬", "己"], "未": ["壬", "甲"],
    "申": ["壬", "甲"], "酉": ["壬", "甲"], "戌": ["壬", "甲"],
    "亥": ["丙", "壬"], "子": ["丙", "壬"], "丑": ["丙", "壬"]
  },
  "壬": {
    "寅": ["庚", "丙"], "卯": ["庚", "丙"], "辰": ["甲", "庚"],
    "巳": ["庚", "辛"], "午": ["庚", "辛"], "未": ["庚", "辛"],
    "申": ["甲", "丙"], "酉": ["甲", "丙"], "戌": ["甲", "丙"],
    "亥": ["丙", "甲", "戊"], "子": ["丙", "甲", "戊"], "丑": ["丙", "丁"]
  },
  "癸": {
    "寅": ["庚", "辛"], "卯": ["庚", "辛"], "辰": ["丙", "辛"],
    "巳": ["庚", "辛", "壬"], "午": ["庚", "辛"], "未": ["庚", "辛"],
    "申": ["丙"], "酉": ["辛", "丙"], "戌": ["辛", "丙"],
    "亥": ["丙", "丁"], "子": ["丙", "丁"], "丑": ["丙", "丁"]
  }
};

function determineJohuYong(dm: string, monthBranch: string): { yongsin: string, secondary: string | null, reason: string } {
  const dmChar = dm.charAt(0);
  const mbChar = monthBranch.charAt(0);
  const recommendations = JOHU_TABLE[dmChar]?.[mbChar] || [];
  const y1 = recommendations[0] ? (STEM_ELEMENT[recommendations[0]] || "불명") : "불명";
  const y2 = recommendations[1] ? (STEM_ELEMENT[recommendations[1]] || null) : null;
  return {
    yongsin: y1,
    secondary: y2,
    reason: `${dmChar}일간 ${mbChar}월생 조후 기준`
  };
}

function determineTonggwanYong(elements: Record<string, number>): { yongsin: string | null, reason: string } {
  const pairs = [
    { a: "목", b: "토", bridge: "화", desc: "木 vs 土 대립" },
    { a: "화", b: "금", bridge: "토", desc: "火 vs 金 대립" },
    { a: "토", b: "수", bridge: "금", desc: "土 vs 水 대립" },
    { a: "금", b: "목", bridge: "수", desc: "金 vs 木 대립" },
    { a: "수", b: "화", bridge: "목", desc: "수 vs 화 대립" }
  ];

  for (const p of pairs) {
    const valA = elements[p.a] || 0;
    const valB = elements[p.b] || 0;
    if (valA >= 2.0 && valB >= 2.0) {
      const sumAB = valA + valB;
      const otherSum = Object.entries(elements)
        .filter(([k]) => k !== p.a && k !== p.b)
        .reduce((sum, [_, v]) => sum + v, 0);
      
      if (otherSum < sumAB) {
        return { yongsin: p.bridge, reason: `${p.desc}, ${p.bridge}가 통관` };
      }
    }
  }
  return { yongsin: null, reason: "뚜렷한 양대 대립 없음" };
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
      yongShinMethod: "Unknown",
      heeShin: "Unknown",
      daewoon: null,
      interactions: [],
      shinsal: [],
      health_risk_tags: [],
      topic_shinsal_map: {},
      giShin: "",
      guShin: "",
      hanShin: "",
      jijanggan: null,
      shinsal_grouped: null,
      gwimun_wonjin: null,
      twelve_stages_geobup: null,
      napeum: null,
      strength_detail: null,
      cross_interactions: null,
      fortune: null,
    };
  }

  const dm = sajuRaw.dayMaster; // 천간 문자 (예: "甲", "壬")
  const myElement = STEM_ELEMENT[dm] || "unknown";
  const elements: Record<string, number> = sajuRaw.elements || {};

  // 4개 기둥의 stem/branch 수집
  const pillars = sajuRaw.pillars || { year: sajuRaw.year, month: sajuRaw.month, day: sajuRaw.day, hour: sajuRaw.hour };
  const stems: string[] = [pillars.year?.stem, pillars.month?.stem, pillars.day?.stem, pillars.hour?.stem].filter(Boolean);
  const branches: string[] = [pillars.year?.branch, pillars.month?.branch, pillars.day?.branch, pillars.hour?.branch].filter(Boolean);

  // v2: 오행 단순 카운트 (elements_simple)
  const elements_simple: Record<string, number> = { "목": 0, "화": 0, "토": 0, "금": 0, "수": 0 };
  [pillars.year, pillars.month, pillars.day, pillars.hour].forEach(p => {
    if (p?.stem && STEM_ELEMENT[p.stem]) elements_simple[STEM_ELEMENT[p.stem]]++;
    if (p?.branch && BRANCH_ELEMENT[p.branch]) elements_simple[BRANCH_ELEMENT[p.branch]]++;
  });

  // B-222: 십성 세력 계산 (천간 + 지장간)
  const tenGodCount: Record<string, number> = {
    "비겁": 0, "식상": 0, "재성": 0, "관성": 0, "인성": 0
  };

  const dayMaster = pillars.day?.stem;
  if (!dayMaster) {

  } else {
    const dayElement = STEM_ELEMENT[dayMaster];

    // 천간 처리 (일간 제외, 각 1.0점)
    const allStems = [
      { stem: pillars.year?.stem, label: "year" },
      { stem: pillars.month?.stem, label: "month" },
      { stem: pillars.day?.stem, label: "day" },
      { stem: pillars.hour?.stem, label: "hour" }
    ];

    for (const { stem, label } of allStems) {
      if (!stem || label === "day") continue; // 일간은 건너뜀
      const rel = getRelation(dayElement, STEM_ELEMENT[stem]);
      if (rel) tenGodCount[rel] += 1.0;
    }

    // 지지의 지장간 처리 (본기만 1.0, 중기/초기 무시 — 단순 정수 카운팅)
    const HIDDEN_WEIGHTS = [1.0, 0, 0]; // 본기만 카운트
    const allBranches = [
      pillars.year?.branch,
      pillars.month?.branch,
      pillars.day?.branch,
      pillars.hour?.branch
    ];

    // 월지 가중치 동일 (단순 정수 카운팅)
    const BRANCH_MULTIPLIER = [1.0, 1.0, 1.0, 1.0];

    for (let bi = 0; bi < allBranches.length; bi++) {
      const branch = allBranches[bi];
      if (!branch) continue;
      const hiddens = HIDDEN_STEMS[branch] || [];
      const multiplier = BRANCH_MULTIPLIER[bi];

      for (let hi = 0; hi < hiddens.length; hi++) {
        const hStem = hiddens[hi];
        const baseWeight = HIDDEN_WEIGHTS[hi] ?? 0.1;
        const rel = getRelation(dayElement, STEM_ELEMENT[hStem]);
        if (rel) tenGodCount[rel] += baseWeight * multiplier;
      }
    }
  }

  // ── B-264: 강약 세분화 (득령/득지/득세) ──
  // 1. 득령(得令) / 실령(失令)
  const strengthMonthBranch = pillars.month?.branch || "";
  const monthMainStem = BRANCH_MAIN_STEM[strengthMonthBranch] || "";
  const monthMainElem = STEM_ELEMENT[monthMainStem];
  const deukryeongResult = (monthMainElem === myElement || getRelation(myElement, monthMainElem) === "인성");
  const deukryeong = {
    result: deukryeongResult ? "득령" : "실령",
    reason: `월지 ${strengthMonthBranch} 본기 ${monthMainStem}(${monthMainElem}), ${myElement}일간 기준 ${monthMainElem === myElement ? "비겁" : (getRelation(myElement, monthMainElem) === "인성" ? "인성" : "실령")}`
  };

  // 2. 득지(得地) / 실지(失地)
  const bongbupStages = [
    calculateTwelveStage(dm, pillars.year?.branch || ""),
    calculateTwelveStage(dm, pillars.month?.branch || ""),
    calculateTwelveStage(dm, pillars.day?.branch || ""),
    calculateTwelveStage(dm, pillars.hour?.branch || ""),
  ];
  const strongStages = ["장생", "건록", "제왕", "관대"];
  const strongCount = bongbupStages.filter(s => strongStages.includes(s)).length;
  const deukjiResult = strongCount >= 2;
  const deukji = {
    result: deukjiResult ? "득지" : "실지",
    reason: `${strongCount}개 강세지(${strongStages.filter(s => bongbupStages.includes(s)).join(",")}) 보유`
  };

  // 3. 득세(得勢) / 실세(失勢)
  const deukseTarget = tenGodCount["비겁"] + tenGodCount["인성"];
  const deukseResult = deukseTarget >= 4.0;
  const deukse = {
    result: deukseResult ? "득세" : "실세",
    reason: `비겁/인성 합계 ${deukseTarget.toFixed(1)}점 (과반 기준 4.0점)`
  };

  // 종합 판단 및 보정 규칙
  // Use strength determined in sajuEngine (100-point weighted system)
  let strengthLevel = sajuRaw.strength || "중화";
  let calibrationNote = "";

  const strength_detail = {
    deukryeong,
    deukji,
    deukse,
    overall: strengthLevel,
    overall_reason: `sajuEngine 정밀 판정 결과(가중치 점수제) 기반${calibrationNote}`
  };



  const isDeukyeong = deukryeongResult;
  const supportRatio = (sajuRaw?.strength_detail?.percent ?? 50) / 100;

  // ── B-257: 격국(格局) 판별 ──────────────────────────────────────
  const gyeokguk = determineGyeokguk(
    {
      year: [pillars.year?.stem, pillars.year?.branch],
      month: [pillars.month?.stem, pillars.month?.branch],
      day: [pillars.day?.stem, pillars.day?.branch],
      hour: [pillars.hour?.stem, pillars.hour?.branch],
    },
    dm,
    tenGodCount,
    supportRatio
  );
  
  // Back-compatibility for other logic using 'strength' variable
  const strength = strengthLevel;
  const strengthPercent = sajuRaw?.strength_detail?.percent ?? 50;

  // ── 3. 용신(用神) 상세 분석 (종격·억부·조후·통관) ──

  // (1) 종격 판정 시도 (Phase 4)
  const jonggyeokResult = calculateJonggyeok(
    dayMaster,
    myElement,
    pillars,
    tenGodCount,
    supportRatio,
    strengthPercent
  );

  let yongShinElement: string;
  let yongShinReason: string;
  let yongShinMethod: string;
  let heeShin: string = "";
  let giShin: string = "";
  let guShin: string = "";
  let hanShin: string = "";

  // 억부용신 기본값 (폴백용)
  let eokbuYong = myElement;
  let eokbuReason = "";

  if (jonggyeokResult) {
    // 종격 적용
    yongShinElement = jonggyeokResult.yongshin;
    yongShinReason = jonggyeokResult.reason;
    yongShinMethod = "jonggyeok";
    heeShin = jonggyeokResult.heeshin;
    giShin = jonggyeokResult.gisin;
    guShin = jonggyeokResult.gusin;
    hanShin = jonggyeokResult.hansin;
  } else {
    // (2) 기존 억부 로직 (Balance)
    if (strengthLevel.trim() === "극신강" || strengthLevel.trim() === "신강" || strengthLevel.trim() === "약변강") {
      const conquerElem = CONQUERED_BY_ELEM[myElement];
      const supportElem = SUPPORT_ELEM[myElement];
      const gwanCount = elements_simple[conquerElem] || 0;
      const inCount = elements_simple[supportElem] || 0;
      if (gwanCount >= 3) {
        eokbuYong = supportElem;
        eokbuReason = `신강: 관성(${conquerElem}) 과다(${gwanCount}개) — 인성(${supportElem})으로 설기`;
      } else if (inCount >= 3) {
        const drainElem = CONQUER_ELEM[myElement];
        eokbuYong = drainElem;
        eokbuReason = `신강: 인성(${supportElem}) 과다(${inCount}개) — 재성(${drainElem})으로 제어`;
      } else {
        const releaseElem = PRODUCE_ELEM[myElement];
        const drainElem = CONQUER_ELEM[myElement];
        const candidates = [
          { elem: conquerElem, priority: 1, name: "관성" },
          { elem: drainElem, priority: 2, name: "재성" },
          { elem: releaseElem, priority: 3, name: "식상" }
        ];
        const sortedCandidates = candidates.sort((a,b) => (elements_simple[a.elem]||0) - (elements_simple[b.elem]||0) || a.priority - b.priority);
        eokbuYong = sortedCandidates[0].elem;
        eokbuReason = `신강: ${sortedCandidates[0].name}(${eokbuYong}) 부족 보충`;
      }
    } else {
      // 신약 또는 중화: 기본 비겁 우선, 식상 과다(3+) 시 인성으로 제어
      const selfElem = myElement;
      const supportElem = SUPPORT_ELEM[myElement];
      const sikSangElem = PRODUCE_ELEM[myElement];
      const sikSangCount = elements_simple[sikSangElem] || 0;
      if (sikSangCount >= 3) {
        eokbuYong = supportElem;
        eokbuReason = `${strengthLevel}: 식상(${sikSangElem}) 과다(${sikSangCount}개) — 인성(${supportElem})으로 제어`;
      } else {
        eokbuYong = selfElem;
        eokbuReason = `${strengthLevel}: 비겁(${selfElem}) 우선 — 일간 오행 보충`;
      }
    }
    yongShinElement = eokbuYong;
    yongShinReason = eokbuReason;
    yongShinMethod = "eokbu";
  }

  // (3) 조후용신 (Climate) 및 (4) 통관용신 (Mediation) 사전 계산
  const mbH = pillars.month?.branch || "寅";
  const johuResult = determineJohuYong(dm, mbH);
  const tonggwanResult = determineTonggwanYong(elements);

  // Phase 5: 조후용신 우선 판정
  const winterBranches = ["亥", "子", "丑"];
  const summerBranches = ["巳", "午", "未"];
  const isSeasonExtreme = winterBranches.includes(mbH) || summerBranches.includes(mbH);

  const VALID_ELEMENTS = ["목", "화", "토", "금", "수"];
  const shouldJohuOverride =
    !jonggyeokResult &&                          // 종격 아님
    isSeasonExtreme &&                            // 동/하절기
    johuResult &&                                 // 조후 결과 존재
    johuResult.yongshin !== "불명" &&
    VALID_ELEMENTS.includes(johuResult.yongshin) &&
    johuResult.yongshin !== yongShinElement &&    // 억부와 다른 경우만
    strengthPercent >= 30 && strengthPercent <= 70; // 극단 아닌 강약

  if (shouldJohuOverride && johuResult) {
    const prevYong = yongShinElement;
    yongShinElement = johuResult.yongshin;
    yongShinReason = `조후 우선: ${mbH}월 ${dayMaster}일간, 억부(${prevYong})→조후(${johuResult.yongshin}) 전환. ${johuResult.reason}`;
    yongShinMethod = "johu_override";
  }

  // 최종 용신 확정 및 희기구한신 재계산 (억부/조후 공용)
  if (yongShinMethod !== "jonggyeok") {
    // 억부나 조후일 경우 표준 상생상극 적용
    heeShin = SUPPORT_ELEM[yongShinElement] || "";     // 용신을 생하는 것
    giShin = CONQUERED_BY_ELEM[yongShinElement] || ""; // 용신을 극하는 것
    guShin = SUPPORT_ELEM[giShin] || "";               // 기신을 생하는 것
    const allElems = ["목", "화", "토", "금", "수"];
    hanShin = allElems.find(e => ![yongShinElement, heeShin, giShin, guShin].includes(e)) || PRODUCE_ELEM[yongShinElement];
  }

  const yongsin_detail = {
    method: yongShinMethod,
    eokbu: { yongsin: eokbuYong, reason: eokbuReason },
    johu: johuResult,
    tonggwan: tonggwanResult,
    jonggyeok: jonggyeokResult,
    final: {
      primary: yongShinElement,
      reason: yongShinReason
    }
  };

  const yongsin = yongShinElement;
  const yongShinMethodLabel = yongShinMethod === "jonggyeok" ? "종격" : (yongShinMethod === "johu_override" ? "조후" : "억부");

  // ── B-258: 기신(忌神) / 구신(仇神) / 한신(閑神) 정밀 분류 ──
  // (희기구한신은 이미 위에서 통합 계산됨)

  // ── 4. Characteristics 생성 ──
  const characteristics: string[] = [];

  // B-257: 격국 태깅
  if (gyeokguk) {
    characteristics.push(`격국: ${gyeokguk.name} (${gyeokguk.type})`);
  }

  if (jonggyeokResult) {
    characteristics.push(`종격 성립: ${jonggyeokResult.type} — 일반적인 균형 대신 강한 세력을 따라감`);
  }

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
    "신강": "자아가 단단하여 추진력과 자기 표현이 좋으며 리더십이 있는 구조입니다",
    "약변강": "신강에 가까운 중간 세력으로, 자기 주장이 있으면서도 유연하게 대처할 수 있습니다",
    "중화": "오행이 비교적 균형을 이루어 안정적이지만, 뚜렷한 주도 기운이 약할 수 있습니다",
    "강변약": "신약에 가까운 중간 세력으로, 환경에 민감하지만 상황에 따라 힘을 발휘합니다",
    "신약": "주변 환경의 영향을 많이 받으며 유연하지만 결단에 시간이 걸릴 수 있습니다",
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
    `오행 분포는 ${elementNames?.map(n => `${n}(${elements[n] || 0})`).join(", ")}이며, ` +
    `주요 십성 구성은 ${tenGodDesc || "고르게 분포"}입니다. ` +
    `용신은 '${yongsin}'으로 판단됩니다 (${yongShinMethodLabel}법: ${yongShinReason}).` +
    (heeShin ? ` 희신은 '${heeShin}'으로, 용신을 보조하는 역할을 합니다.` : "") +
    chungDesc + harmonyDesc + hyungDesc;

  // === 대운 분석 ===
  let daewoon: DaewoonResult | null = null;
  try {
    const yearStemIdx = STEMS.indexOf(pillars.year?.stem);
    const monthStemIdx = STEMS.indexOf(pillars.month?.stem);
    const monthBranchIdx = BRANCHES.indexOf(pillars.month?.branch);
    const gender = (sajuRaw.gender === 'F' || sajuRaw.gender === 'female') ? 'F' : 'M';
    const birthYear = Number(pillars.year?.year || sajuRaw.year);
    const currentAge = new Date().getFullYear() - (Number.isFinite(birthYear) ? birthYear : 1990) + 1;
    const sLong = sajuRaw.sunLong ?? sajuRaw.sun_long ?? 0;
    const jdVal = sajuRaw.jd ?? sajuRaw.julian_day ?? 0;

    if (yearStemIdx >= 0 && monthStemIdx >= 0 && monthBranchIdx >= 0) {
      const { age: startAge, isForward } = getDaewoonInfo(
        yearStemIdx, gender, sLong, jdVal, birthYear
      );
      const direction = isForward ? "순행" : "역행";
      daewoon = calculateFullDaewoon(monthStemIdx, monthBranchIdx, dm, startAge, isForward, currentAge);
      if (daewoon) {
        (daewoon as any).direction = direction;
      }

      // 현재 대운 특성 태깅
      if (daewoon.currentDaewoon) {
        const cd = daewoon.currentDaewoon;
        // B-256: 대운 12운성 추가
        cd.twelveStage = calculateTwelveStage(dm, cd.branch);
        cd.twelveStageEnergy = getTwelveStageEnergy(cd.twelveStage);
        
        characteristics.push(`현재 대운: ${cd.full} (${cd.startAge}~${cd.endAge}세)`);
        characteristics.push(`대운 십성: ${cd.tenGodStem}/${cd.tenGodBranch}`);
        characteristics.push(`대운 12운성: ${cd.twelveStage} (${cd.twelveStageEnergy.level}점)`);
        
        // 대운이 용신과 같은 오행이면 긍정 태깅
        const yongShinElement = FIVE_ELEMENTS_MAP[yongsin] || "unknown";
        if (cd.stemElement === yongShinElement || cd.branchElement === yongShinElement) {
          characteristics.push("대운-용신 합치: 운세 상승기");
        }
        if (CHUNG_PAIRS.some(([a, b]) => 
          (cd.branch === a && branches.includes(b)) || (cd.branch === b && branches.includes(a))
        )) {
          characteristics.push("대운 충 존재: 변동 주의");
        }

        // ── B-254: 대운 교체 임박 감지 ──
        if (daewoon.is_daeun_changing_year) {
          const nextIdx = (cd.index || 0) + 1;
          const nextD = daewoon.pillars.find(p => p.index === nextIdx);
          characteristics.push(`대운 교체 임박: ${cd.full} → ${nextD?.full || "다음"} (변화 준비)`);
        }
      }
    }
  } catch (e) {

  }

  // v2: 대운 전환기 경고
  let daewoon_transition: any = { isTransitioning: false, yearsUntilNext: 0, nextDaewoon: null, warning: null };
  if (daewoon && daewoon.currentDaewoon) {
    const cd = daewoon.currentDaewoon;
    const birthYear = Number(pillars.year?.year || sajuRaw.year);
    const currentAge = new Date().getFullYear() - (Number.isFinite(birthYear) ? birthYear : 1990) + 1;
    const yearsUntilNext = cd.endAge - currentAge + 1;
    const nextIdx = (cd.index || 0) + 1;
    const nextD = daewoon.pillars.find(p => p.index === nextIdx);
    
    daewoon_transition = {
      isTransitioning: yearsUntilNext <= 2,
      yearsUntilNext,
      nextDaewoon: nextD?.full || "미상",
      warning: yearsUntilNext <= 2 ? `대운 전환기 ${yearsUntilNext}년 이내 — 변동성 주의` : null
    };
  }

  // narrative에 대운 정보 통합
  if (daewoon?.currentDaewoon) {
    const cd = daewoon.currentDaewoon;
    narrative += ` 현재 ${cd.startAge}~${cd.endAge}세 대운(${cd.full})이 진행 중이며, ` +
      `이 시기의 주요 에너지는 ${cd.tenGodStem}(천간)과 ${cd.tenGodBranch}(지지)입니다.`;
    
    if (daewoon.is_daeun_changing_year) {
      const nextD = daewoon.pillars.find(p => p.index === (cd.index || 0) + 1);
      narrative += ` 특히 지금은 대운이 교체되는 시기이므로 ${nextD ? `${nextD.full} 대운` : "새로운 흐름"}으로의 전환을 준비해야 합니다.`;
    }
  }

  // ── B-250: 세운(流年) 분석 ──────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const yearStemIdx = (currentYear - 4) % 10;
  const yearBranchIdx = (currentYear - 4) % 12;
  const STEMS_KR = ["갑","을","병","정","무","기","경","신","임","계"];
  const BRANCHES_KR = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
  const seunStem = STEMS_KR[yearStemIdx];
  const seunBranch = BRANCHES_KR[yearBranchIdx];
  const seunFull = `${seunStem}${seunBranch}`;

  // 세운 천간 오행
  const STEM_ELEMENTS = ["목","목","화","화","토","토","금","금","수","수"];
  
  // 지지 한글 매핑 (충/합 체크용)
  const BRANCH_KO_MAP: Record<string, string> = { "子": "자", "丑": "축", "寅": "인", "卯": "묘", "辰": "진", "巳": "사", "午": "오", "未": "미", "申": "신", "酉": "유", "戌": "술", "亥": "해" };
  const originalBranches = [pillars.year?.branch, pillars.month?.branch, pillars.day?.branch, pillars.hour?.branch]
    .filter((b): b is string => !!b)
    .map(b => BRANCH_KO_MAP[b.charAt(0)] || b);

  // 세운 지지와 원국 지지 충 체크
  const CHUNG_MAP: Record<string,string> = {"자":"오","축":"미","인":"신","묘":"유","진":"술","사":"해","오":"자","미":"축","신":"인","유":"묘","술":"진","해":"사"};
  const seunChungs = originalBranches.filter(b => CHUNG_MAP[seunBranch] === b);

  // 세운 지지와 원국 지지 합 체크
  const HAP_MAP: Record<string,string> = {"자":"축","축":"자","인":"해","묘":"술","진":"유","사":"신","오":"미","미":"오","신":"사","유":"진","술":"묘","해":"인"};
  const seunHaps = originalBranches.filter(b => HAP_MAP[seunBranch] === b);

  // 결과 태그 추가
  characteristics.push(`세운: ${seunFull}(${currentYear}년)`);
  if (seunChungs.length > 0) characteristics.push(`세운-원국 충: ${seunBranch}↔${seunChungs.join(",")} (변동·갈등 주의)`);
  if (seunHaps.length > 0) characteristics.push(`세운-원국 합: ${seunBranch}↔${seunHaps.join(",")} (조화·기회)`);

  // 세운-용신 관계
  const seunElement = STEM_ELEMENTS[yearStemIdx];
  if (yongsin.includes(seunElement)) {
    characteristics.push("세운-용신 일치: 올해 운세 긍정적");
  }

  // B-256: 세운 12운성
  const seunTwelveStage = calculateTwelveStage(dm, BRANCHES[yearBranchIdx]);
  const seunTwelveStageEnergy = getTwelveStageEnergy(seunTwelveStage);
  characteristics.push(`세운 12운성: ${seunTwelveStage} (${seunTwelveStageEnergy.level}점)`);

  // narrative에 세운 정보 추가
  narrative += ` ${currentYear}년 세운은 ${seunFull}이며,`;
  if (seunChungs.length > 0) narrative += ` 원국과 충이 있어 변화·갈등이 예상되고,`;
  if (seunHaps.length > 0) narrative += ` 원국과 합이 있어 새로운 기회가 열릴 수 있으며,`;
  if (yongsin.includes(seunElement)) narrative += ` 용신과 일치하여 전반적으로 유리한 흐름입니다.`;
  else narrative += ` 용신(${yongsin})과의 조화를 의식하며 균형을 유지하는 것이 중요합니다.`;

  // ── B-252: 월운(月運) 분석 ──────────────────────────────────────
  const currentMonth = new Date().getMonth() + 1; // 양력 1~12
  const currentDay = new Date().getDate();
  // 절기 기준 월 매핑 (양력 근사): 절입일 기준
  const JEOLGI_START = [0, 4, 4, 5, 5, 5, 6, 7, 7, 8, 8, 7, 7]; // [0,1월,2월,...12월] 절입 근사일
  const jeolgiMonth = (currentDay >= JEOLGI_START[currentMonth]) ? currentMonth : currentMonth - 1;
  const adjustedMonth = jeolgiMonth < 1 ? 12 : jeolgiMonth;
  // 월지: 1월=인(2), 2월=묘(3), 3월=진(4)... → (adjustedMonth) % 12
  const monthBranchIdx = (adjustedMonth) % 12;
  // 월간: 년상기월법 → (yearStemIdx * 2 + adjustedMonth) % 10
  const monthStemIdx = (yearStemIdx * 2 + adjustedMonth) % 10;
  const wolunStem = STEMS_KR[monthStemIdx];
  const wolunBranch = BRANCHES_KR[monthBranchIdx];
  const wolunFull = `${wolunStem}${wolunBranch}`;

  // 월운 지지 vs 원국 지지 충/합
  const wolunChungs = originalBranches.filter(b => CHUNG_MAP[wolunBranch] === b);
  const wolunHaps = originalBranches.filter(b => HAP_MAP[wolunBranch] === b);

  // 월운 vs 세운 지지 관계 (월-년 시너지/충돌)
  const wolunSeunChung = CHUNG_MAP[wolunBranch] === seunBranch;
  const wolunSeunHap = HAP_MAP[wolunBranch] === seunBranch;

  // 월운 오행과 용신
  const wolunElement = STEM_ELEMENTS[monthStemIdx];

  characteristics.push(`월운: ${wolunFull}(${currentMonth}월)`);
  if (wolunChungs.length > 0) characteristics.push(`월운-원국 충: ${wolunBranch}↔${wolunChungs.join(",")} (이달 변동 주의)`);
  if (wolunHaps.length > 0) characteristics.push(`월운-원국 합: ${wolunBranch}↔${wolunHaps.join(",")} (이달 기회)`);
  if (wolunSeunChung) characteristics.push("월운-세운 충: 이달 특히 갈등·변화 주의");
  if (wolunSeunHap) characteristics.push("월운-세운 합: 이달 올해 흐름과 조화");
  if (yongsin.includes(wolunElement)) characteristics.push("월운-용신 일치: 이달 운세 긍정적");

  // B-256: 월운 12운성
  const wolunTwelveStage = calculateTwelveStage(dm, BRANCHES[monthBranchIdx]);
  const wolunTwelveStageEnergy = getTwelveStageEnergy(wolunTwelveStage);
  characteristics.push(`월운 12운성: ${wolunTwelveStage} (${wolunTwelveStageEnergy.level}점)`);

  // B-252: 월운(月運) 객체 조립
  const current_wolwoon = {
    full: wolunFull,
    month: currentMonth,
    stem: wolunStem,
    branch: wolunBranch,
    element: wolunElement,
    twelveStage: wolunTwelveStage,
    score: wolunTwelveStageEnergy.level
  };

  narrative += ` 이번 달(${currentMonth}월) 월운은 ${wolunFull}이며,`;
  if (wolunChungs.length > 0) narrative += ` 원국과 충이 있어 주의가 필요하고,`;
  if (wolunHaps.length > 0) narrative += ` 원국과 합이 있어 좋은 기회가 있으며,`;
  if (yongsin.includes(wolunElement)) narrative += ` 용신과 일치하여 이달 유리합니다.`;
  else narrative += ` 용신과 다르므로 신중하게 움직이는 것이 좋습니다.`;

  // B-70new: 천간합·지지충·삼합·육합·삼형살 사전 연산
  const interactionStems = [
    pillars.year?.stem,
    pillars.month?.stem,
    pillars.day?.stem,
    pillars.hour?.stem,
  ].filter((s): s is string => !!s);
  const interactionBranches = [
    pillars.year?.branch,
    pillars.month?.branch,
    pillars.day?.branch,
    pillars.hour?.branch,
  ].filter((b): b is string => !!b);
  const interactions = calculateInteractions(interactionStems, interactionBranches);

  // ── B-223: 공망(空亡) 계산 ──
  const gongmang = calculateGongmang(dm, pillars.day?.branch || "", {
    year: pillars.year?.branch || "",
    month: pillars.month?.branch || "",
    day: pillars.day?.branch || "",
    hour: pillars.hour?.branch || "",
  });
  if (gongmang.emptied.length > 0) {
    const emptiedStr = gongmang.emptied.join(",");
    characteristics.push(`공망: ${emptiedStr} (${gongmang.affectedPillars.join(",")} 적용)`);
  }

  // v2: 합충 결과의 오행 변화 (element_adjustments) 및 점수 반영
  const element_adjustments: any[] = [];
  const elements_weighted = { ...elements }; // 가중치 적용할 복사본
  const SAMHAP_ELEMENTS: Record<string, string> = { "수국 삼합": "수", "화국 삼합": "화", "금국 삼합": "금", "목국 삼합": "목" };
  const BANGHAP_ELEMENTS: Record<string, string> = { "동방 목국 방합": "목", "남방 화국 방합": "화", "서방 금국 방합": "금", "북방 수국 방합": "수" };

  interactions.forEach(inter => {
    if (inter.type === "지지삼합") {
      const isFull = !inter.result.includes("반합");
      const baseName = inter.meaning_keyword.split(" ")[0];
      const targetElem = SAMHAP_ELEMENTS[baseName];
      if (targetElem) {
        const score = isFull ? 1.0 : 0.3;
        elements_weighted[targetElem] = (elements_weighted[targetElem] || 0) + score;
        element_adjustments.push({
          type: isFull ? "삼합성립" : "반합경향",
          element: targetElem,
          score,
          combination: inter.elements.join("") + " " + inter.result,
          effect: isFull ? `${targetElem} 에너지 +1.0 (삼합)` : `${targetElem} 에너지 +0.3 (반합)`
        });
      }
    } else if (inter.type === "지지방합") {
      const targetElem = BANGHAP_ELEMENTS[inter.result];
      if (targetElem) {
        const score = 0.8;
        elements_weighted[targetElem] = (elements_weighted[targetElem] || 0) + score;
        element_adjustments.push({
          type: "방합성립",
          element: targetElem,
          score,
          combination: inter.elements.join(" ") + " " + inter.result,
          effect: `${targetElem} 에너지 +0.8 (방합)`
        });
      }
    } else if (inter.type === "지지충") {
      const losers = inter.elements?.map(e => BRANCH_ELEMENT[e]);
      losers.forEach(le => {
        if (le) {
          elements_weighted[le] = Math.max(0, (elements_weighted[le] || 0) - 0.25); // 개별 -0.25 (합 -0.5)
        }
      });
      element_adjustments.push({
        type: "격돌",
        score: -0.5,
        combination: inter.elements.join(" vs "),
        effect: `충돌 오행 각각 약화 (-0.5)`
      });
    }
  });

  // B-144: 신살 계산
  const targetYearBranch = sajuRaw.target_year_branch || "午";
  const shinsal = calculateShinsal(
    dm, 
    pillars.day?.branch || "", 
    interactionBranches, 
    interactionStems, 
    pillars.year?.branch, 
    pillars.month?.branch,
    targetYearBranch
  );

  const shinsal_grouped = calculateShinsalGrouped(
    dm,
    pillars.day?.branch || "",
    {
      year: pillars.year?.branch || "",
      month: pillars.month?.branch || "",
      day: pillars.day?.branch || "",
      hour: pillars.hour?.branch || "",
    },
    interactionStems,
    targetYearBranch
  );

  const gwimun_wonjin = calculateGwimunWonjin(
    interactionBranches,
    daewoon?.currentDaewoon?.branch,
    sajuRaw.seun_branch || targetYearBranch
  );

  // B-144: 건강 위험 태그 추출
  const health_risk_tags: string[] = shinsal
    .filter((s: Shinsal) => s.health_implication)
    .map((s: Shinsal) => `${s.name}: ${s.health_implication}`);

  // B-145: 토픽별 신살 매핑
  const topic_shinsal_map: Record<string, string[]> = {};
  shinsal.forEach((s: Shinsal) => {
    s.topic_relevance.forEach((topic: string) => {
      if (!topic_shinsal_map[topic]) topic_shinsal_map[topic] = [];
      topic_shinsal_map[topic].push(s.name);
    });
  });

  // 신살 중 역마살 있으면 characteristics에 추가
  shinsal.forEach((s: Shinsal) => {
    if (s.type === "역마" || s.type === "양인") {
      characteristics.push(`${s.name}: ${s.description}`);
    }
  });
  
  // [B-252 FIX] 유실된 정밀 신살 로직 복구 및 정정 (Legacy compatibility)
  const legacy_list: string[] = [];
  const b_list = [pillars.year?.branch, pillars.month?.branch, pillars.day?.branch, pillars.hour?.branch];
  b_list.forEach(b => {
      if (!b) return;
      if (dm === "丙" && b === "午") legacy_list.push("양인살(년기)");
      if (dm === "丁" && b === "午") legacy_list.push("양인살(년기)"); // 정정: 丁의 양인은 午
      if (dm === "戊" && b === "午") legacy_list.push("양인살(년기)");
      if (dm === "己" && b === "未") legacy_list.push("양인살(년기)");
      if (dm === "壬" && b === "子") legacy_list.push("양인살(년기)");
      if (dm === "癸" && b === "丑") legacy_list.push("양인살(년기)");
      if ((dm === "丙" || dm === "丁") && b === "未") legacy_list.push("음착살");
      // 상관살은 십신이므로 제거
  });
  characteristics.push(...[...new Set(legacy_list)]);

  // Gongmang을 shinsal 배열에도 추가 (검증 테스트용)
  if (gongmang.emptied.length > 0) {
    shinsal.push({
      name: "공망",
      type: "중립",
      description: `사주의 공망: ${gongmang.emptied.join(", ")} 지지 (${gongmang.affectedPillars.join(", ")} 해당).`,
      health_implication: "허약 체질 및 갈증 주의",
      topic_relevance: ["general", "spirituality"],
      severity: "중립",
      pillar: "general"
    });
  }

  // 충·형살이 있으면 characteristics에 추가
  interactions.forEach((inter: Interaction) => {
    if (inter.severity === "흉") {
      characteristics.push(`${inter.type}(${inter.elements.join("·")}): ${inter.meaning_keyword}`);
    }
  });

  // B-256: 12운성(포태법) 계산
  const twelveStages = calculateAllTwelveStages(dm, {
    year: pillars.year?.branch || "",
    month: pillars.month?.branch || "",
    day: pillars.day?.branch || "",
    hour: pillars.hour?.branch || "",
  });

  const twelveStagesGeobup = calculateAllTwelveStagesGeobup(dm, {
    year: pillars.year?.branch || "",
    month: pillars.month?.branch || "",
    day: pillars.day?.branch || "",
    hour: pillars.hour?.branch || "",
  });

  const twelveStageDetails = {
    year: { stage: twelveStages.year, ...getTwelveStageEnergy(twelveStages.year) },
    month: { stage: twelveStages.month, ...getTwelveStageEnergy(twelveStages.month) },
    day: { stage: twelveStages.day, ...getTwelveStageEnergy(twelveStages.day) },
    hour: { stage: twelveStages.hour, ...getTwelveStageEnergy(twelveStages.hour) }
  };

  // ── B-265: 교차 합충 분석 ──
  const daewoonPillarP = daewoon?.currentDaewoon;
  const KR_TO_HAN_STEM: any = { "갑":"甲", "을":"乙", "병":"丙", "정":"丁", "무":"戊", "기":"己", "경":"庚", "신":"辛", "임":"壬", "계":"癸" };
  const KR_TO_HAN_BRANCH: any = { "자":"子", "축":"丑", "인":"寅", "묘":"卯", "진":"辰", "사":"巳", "오":"午", "미":"未", "신":"申", "유":"酉", "술":"戌", "해":"亥" };

  const sStemH = KR_TO_HAN_STEM[seunStem] || "丙";
  const sBranchH = KR_TO_HAN_BRANCH[seunBranch] || "午";
  const wStemH = KR_TO_HAN_STEM[wolunStem] || "辛";
  const wBranchH = KR_TO_HAN_BRANCH[wolunBranch] || "卯";

  const getRelationsResult = (s: string, b: string, targets: any[]) => {
    const stem_rels: any[] = [];
    const branch_rels: any[] = [];
    targets.forEach(t => {
      const sr = checkStemRelation(s, t.stem);
      if (sr) stem_rels.push({ pair: `${s}-${t.stem}`, ...sr });
      const br = checkBranchRelation(b, t.branch);
      if (br) branch_rels.push({ pair: `${b}-${t.branch}`, ...br });
    });
    return { stem_rels, branch_rels };
  };

  const pList = [
    { name: "년주", stem: pillars.year?.stem, branch: pillars.year?.branch },
    { name: "월주", stem: pillars.month?.stem, branch: pillars.month?.branch },
    { name: "일주", stem: pillars.day?.stem, branch: pillars.day?.branch },
    { name: "시주", stem: pillars.hour?.stem, branch: pillars.hour?.branch }
  ];

  const daewoonCross = getRelationsResult(daewoonPillarP?.stem || "", daewoonPillarP?.branch || "", pList);
  const seunCrossWithPillars = getRelationsResult(sStemH, sBranchH, pList);
  const seunCrossWithDaewoon = getRelationsResult(sStemH, sBranchH, [{ stem: daewoonPillarP?.stem, branch: daewoonPillarP?.branch }]);

  const wolunCrossWithPillars = getRelationsResult(wStemH, wBranchH, pList);
  const wolunCrossWithDaewoon = getRelationsResult(wStemH, wBranchH, [{ stem: daewoonPillarP?.stem, branch: daewoonPillarP?.branch }]);
  const wolunCrossWithSeun = getRelationsResult(wStemH, wBranchH, [{ stem: sStemH, branch: sBranchH }]);

  const cross_interactions = {
    daewoon: daewoonCross,
    sewoon: {
      with_original: seunCrossWithPillars,
      with_daewoon: seunCrossWithDaewoon
    },
    wolwoon: {
      with_original: wolunCrossWithPillars,
      with_daewoon: wolunCrossWithDaewoon,
      with_sewoon: wolunCrossWithSeun
    },
    summary: `${currentYear}년 ${seunBranch}(${sBranchH})운이 원국과 작용하여 생활 리듬에 변화가 예상됩니다.`
  };

  // ── B-267: 십신 에너지 분포 정량화 ──
  const tenGodScores: Record<string, number> = {
    "비견": 0, "겁재": 0, "식신": 0, "상관": 0,
    "편재": 0, "정재": 0, "편관": 0, "정관": 0,
    "편인": 0, "정인": 0
  };

  const GROUP_MAP: Record<string, string> = {
    "비견": "비겁", "겁재": "비겁",
    "식신": "식상", "상관": "식상",
    "편재": "재성", "정재": "재성",
    "편관": "관성", "정관": "관성",
    "편인": "인성", "정인": "인성"
  };

  // 1. 천간 점수 (일간 제외)
  const stemsToScore = [pillars.year?.stem, pillars.month?.stem, pillars.hour?.stem].filter(Boolean) as string[];

  stemsToScore.forEach(s => {
    const tg = calculateTenGod(dm, s);
    if (tg && tenGodScores[tg] !== undefined) tenGodScores[tg] += 1.0;
  });

  // 2. 지지 장간 점수 (본기 0.6, 중기 0.3, 여기 0.1)
  const branchesToScore = [pillars.year?.branch, pillars.month?.branch, pillars.day?.branch, pillars.hour?.branch].filter(Boolean) as string[];
  branchesToScore.forEach(b => {
    const hiddens = HIDDEN_STEMS[b] || [];
    hiddens.forEach((s, idx) => {
      const tg = calculateTenGod(dm, s || "");
      if (tg && tenGodScores[tg] !== undefined) {
        let weight = 0;
        if (idx === 0) weight = 0.6;
        else if (idx === 1) weight = (hiddens.length === 2) ? 0.1 : 0.3;
        else if (idx === 2) weight = 0.1;
        tenGodScores[tg] += weight;
      }
    });
  });

  const groupScores: Record<string, number> = { "비겁": 0, "식상": 0, "재성": 0, "관성": 0, "인성": 0 };
  Object.entries(tenGodScores).forEach(([tg, score]) => {
    const group = GROUP_MAP[tg];
    if (group) groupScores[group] += score;
  });

  const avgScore = Object.values(groupScores).reduce((a, b) => a + b, 0) / 5;
  const excess: string[] = [];
  const deficient: string[] = [];
  Object.entries(groupScores).forEach(([name, score]) => {
    if (score >= avgScore * 1.5 && score > 0) excess.push(name);
    else if (score <= avgScore * 0.3) deficient.push(name);
  });

  const tenGodDistribution = {
    scores: tenGodScores,
    groups: groupScores,
    excess,
    deficient,
    analysis: `${excess.length > 0 ? excess.join("/") + " 과잉" : "에너지 균형"}이며, ` +
               `${deficient.length > 0 ? deficient.join("/") + " 결핍" : "뚜렷한 결핍 없음"} 상태입니다.`,
    elements_weighted // 보정된 오행 점수 포함
  };

  // v2: 일진 분석 (Daily Pillar)
  let daily_pillar: any = null;
  try {
    const today = new Date("2026-03-19T12:00:00+09:00");
    const todaySaju = getFullSaju(today.getFullYear(), today.getMonth() + 1, today.getDate(), today.getHours(), today.getMinutes());
    const dailyStem = todaySaju.pillars.day.stem;
    const dailyBranch = todaySaju.pillars.day.branch;
    const stemTenGod = calculateTenGod(dm, dailyStem);
    const branchRelations: any[] = [];
    
    [
      { name: "년지", branch: pillars.year?.branch },
      { name: "월지", branch: pillars.month?.branch },
      { name: "일지", branch: pillars.day?.branch },
      { name: "시지", branch: pillars.hour?.branch }
    ].forEach(p => {
      if (p.branch) {
        const rel = checkBranchRelation(dailyBranch, p.branch);
        if (rel) branchRelations.push({ with: `${p.name} ${p.branch}`, type: rel.type });
      }
    });

    daily_pillar = {
      date: today.toISOString().split("T")[0],
      stem: dailyStem,
      branch: dailyBranch,
      pillar: `${dailyStem}${dailyBranch}`,
      stem_tenGod: stemTenGod,
      branch_relation: branchRelations,
      interpretation: `오늘의 에너지: ${stemTenGod} 기운, 원국 지지와 ${branchRelations.length > 0 ? branchRelations?.map(r => r.type).join("/") : "조화로운"} 관계`
    };
  } catch (e) {

  }

  // ── B-267: 음양(陰陽) 구성 분석 ──
  const STEM_LIST = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const BRANCH_LIST = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  let yang = 0;
  let yin = 0;
  [pillars.year, pillars.month, pillars.day, pillars.hour].forEach(p => {
    if (p?.stem) {
      const sIdx = STEM_LIST.indexOf(p.stem);
      if (sIdx !== -1) { if (sIdx % 2 === 0) yang++; else yin++; }
    }
    if (p?.branch) {
      const bIdx = BRANCH_LIST.indexOf(p.branch);
      if (bIdx !== -1) { if (bIdx % 2 === 0) yang++; else yin++; }
    }
  });
  const yinYang = { yang, yin };

  // ── v3: 운세 엔진 (세운·월운 길흉 판단) ──
  let fortuneResult: FortuneResult | undefined;
  try {
    const currentDaewoon = daewoon?.currentDaewoon;
    fortuneResult = calculateFortune(
      dm,
      yongShinElement,
      heeShin,
      giShin,
      guShin,
      hanShin,
      stems,
      branches,
      currentDaewoon?.stem || null,
      currentDaewoon?.branch || null
    );
  } catch (e) {
    console.error("[fortuneEngine] error:", e);
  }

  // ── fortune → sewoon/wolwoon 파생 (단일 출처 보장) ──
  let derivedSewoon = daewoon?.current_seun || (sajuRaw as any).seun || null;
  let derivedWolwoon = current_wolwoon;

  if (fortuneResult) {
    derivedSewoon = {
      score: fortuneResult.seun.score,
      rating: fortuneResult.seun.rating,
      stem: fortuneResult.seun.stem,
      branch: fortuneResult.seun.branch,
      summary: fortuneResult.seun.summary || fortuneResult.yearOverview || "",
      is_good: fortuneResult.seun.score >= 15,
      is_clash: fortuneResult.seun.score <= -15,
      _source: "fortuneEngine",
    };

    derivedWolwoon = fortuneResult.monthly.map((mf: any, idx: number) => ({
      month: idx + 1,
      score: mf.score,
      rating: mf.rating,
      stem: mf.stem,
      branch: mf.branch,
      summary: mf.summary || "",
      is_good: mf.score >= 15,
      is_clash: mf.score <= -15,
      _source: "fortuneEngine",
    }));

    console.log(`[aiSajuAnalysis] fortune 파생 완료: 세운=${derivedSewoon.rating}(${derivedSewoon.score}), 월운 ${derivedWolwoon.length}개월`);
  }

  // fortune이 성공한 경우, sewoon/wolwoon을 fortune에서 파생 (단일 출처 보장)
  return {
    _analysis_ver: "v4.1.2",
    dayMaster: dm,
    strength,
    elements,
    elements_simple,
    characteristics,
    narrative,
    tenGods: tenGodCount,
    tenGods_rounded: {
      "비겁": Math.round(tenGodCount["비겁"]),
      "식상": Math.round(tenGodCount["식상"]),
      "재성": Math.round(tenGodCount["재성"]),
      "관성": Math.round(tenGodCount["관성"]),
      "인성": Math.round(tenGodCount["인성"])
    },
    yinYang: yinYang,
    yongShin: yongsin,
    yongShinMethod,
    heeShin: heeShin,
    daewoon,
    sewoon: derivedSewoon,
    wolwoon: derivedWolwoon,
    interactions,
    shinsal,
    health_risk_tags,
    topic_shinsal_map,
    giShin,
    guShin,
    hanShin,
    twelve_stages: {
      pillars: twelveStageDetails,
      seun: { stage: seunTwelveStage, ...seunTwelveStageEnergy },
      wolun: { stage: wolunTwelveStage, ...wolunTwelveStageEnergy }
    },
    gyeokguk,
    twelve_stages_geobup: {
      pillars: twelveStagesGeobup,
      seun: calculateTwelveStageGeobup(sajuRaw.seun_branch || sBranchH),
      wolun: calculateTwelveStageGeobup(sajuRaw.wolun_branch || wBranchH)
    },
    jijanggan: getAllPillarJijanggan(dm, {
      year: pillars.year?.branch || "",
      month: pillars.month?.branch || "",
      day: pillars.day?.branch || "",
      hour: pillars.hour?.branch || "",
    }),
    shinsal_grouped,
    gwimun_wonjin,
    napeum: getAllPillarNapeum({
      year: { stem: pillars.year?.stem || "", branch: pillars.year?.branch || "" },
      month: { stem: pillars.month?.stem || "", branch: pillars.month?.branch || "" },
      day: { stem: pillars.day?.stem || "", branch: pillars.day?.branch || "" },
      hour: { stem: pillars.hour?.stem || "", branch: pillars.hour?.branch || "" },
    }),
    strength_detail,
    cross_interactions,
    yongsin_detail,
    tenGodDistribution,
    elements_weighted,
    gongmang,
    element_adjustments,
    daewoon_transition,
    daily_pillar,
    fortune: fortuneResult,                             // v3: 운세
    fourPillars: sajuRaw.pillars,                       // v3: 원국 원본 추가
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

/** 나를 극하는 오행 (관성) */
function getConqueringElement(myEl: string): string {
  const map: Record<string, string> = { "목": "금", "화": "수", "토": "목", "금": "화", "수": "토" };
  return map[myEl] || myEl;
}

/** 나를 생하는 오행 (인성) */
function getProducingElement(myEl: string): string {
  const map: Record<string, string> = { "목": "수", "화": "목", "토": "화", "금": "토", "수": "금" };
  return map[myEl] || myEl;
}

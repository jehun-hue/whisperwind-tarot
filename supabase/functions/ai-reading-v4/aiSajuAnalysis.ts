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
  heeShin: string;
  daewoon: any | null; 
  interactions: Interaction[];
  shinsal: Shinsal[];                                   // B-144: 신살
  health_risk_tags: string[];                           // B-144: 건강 위험 태그
  topic_shinsal_map: Record<string, string[]>;          // B-145: 토픽별 신살 매핑
}

import { getDaewoonInfo, calculateFullDaewoon, type DaewoonResult } from "./lib/daewoon.ts";
import { STEMS, BRANCHES, FIVE_ELEMENTS_MAP } from "./lib/fiveElements.ts";
import { calculateInteractions, calculateShinsal, type Interaction, type Shinsal } from "./lib/interactions.ts";

// ═══════════════════════════════════════
// 천간(天干) 오행 매핑
// ═══════════════════════════════════════
const STEM_ELEMENT: Record<string, string> = {
  "甲": "목",
  "乙": "목",
  "丙": "화",
  "丁": "화",
  "戊": "토",
  "己": "토",
  "庚": "금",
  "辛": "금",
  "壬": "수",
  "癸": "수"
};

// 지지(地支) 오행 매핑
const BRANCH_ELEMENT: Record<string, string> = {
  "子": "수",
  "丑": "토",
  "寅": "목",
  "卯": "목",
  "辰": "토",
  "巳": "화",
  "午": "화",
  "未": "토",
  "申": "금",
  "酉": "금",
  "戌": "토",
  "亥": "수"
};

// 지지 장간(藏干) — 각 지지에 숨어있는 천간들 (본기/중기/여기)
const HIDDEN_STEMS: Record<string, string[]> = {
  "子": ["癸", "壬"],           // 본기 癸, 중기 壬
  "丑": ["己", "癸", "辛"],     // 본기 己, 중기 癸, 초기 辛
  "寅": ["甲", "丙", "戊"],     // 본기 甲, 중기 丙, 초기 戊
  "卯": ["乙", "甲"],           // 본기 乙, 중기 甲
  "辰": ["戊", "乙", "癸"],     // 본기 戊, 중기 乙, 초기 癸
  "巳": ["丙", "庚", "戊"],     // 본기 丙, 중기 庚, 초기 戊
  "午": ["丁", "己", "丙"],     // 본기 丁, 중기 己, 초기 丙
  "未": ["己", "丁", "乙"],     // 본기 己, 중기 丁, 초기 乙
  "申": ["庚", "壬", "戊"],     // 본기 庚, 중기 壬, 초기 戊
  "酉": ["辛", "庚"],           // 본기 辛, 중기 庚
  "戌": ["戊", "丁", "辛"],     // 본기 戊, 중기 丁, 초기 辛
  "亥": ["壬", "甲"]            // 본기 壬, 중기 甲
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
      heeShin: "Unknown",
      daewoon: null,
      interactions: [],
      shinsal: [],
      health_risk_tags: [],
      topic_shinsal_map: {},
    };
  }

  const dm = sajuRaw.dayMaster; // 천간 문자 (예: "甲", "壬")
  const myElement = STEM_ELEMENT[dm] || "unknown";
  const elements: Record<string, number> = sajuRaw.elements || {};

  // 4개 기둥의 stem/branch 수집
  const pillars = sajuRaw.pillars || { year: sajuRaw.year, month: sajuRaw.month, day: sajuRaw.day, hour: sajuRaw.hour };
  const stems: string[] = [pillars.year?.stem, pillars.month?.stem, pillars.day?.stem, pillars.hour?.stem].filter(Boolean);
  const branches: string[] = [pillars.year?.branch, pillars.month?.branch, pillars.day?.branch, pillars.hour?.branch].filter(Boolean);

  // B-222: 십성 세력 계산 (천간 + 지장간)
  const tenGodCount: Record<string, number> = {
    "비겁": 0, "식상": 0, "재성": 0, "관성": 0, "인성": 0
  };

  const dayMaster = pillars.day?.stem;
  if (!dayMaster) {
    console.warn("[aiSajuAnalysis] dayMaster is missing, skipping tenGod calculation");
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

    // 지지의 지장간 처리 (가중치: 본기 0.6, 중기 0.3, 초기 0.1)
    const HIDDEN_WEIGHTS = [0.6, 0.3, 0.1]; // 첫 번째=본기, 두 번째=중기, 세 번째=초기
    const allBranches = [
      pillars.year?.branch,
      pillars.month?.branch,
      pillars.day?.branch,
      pillars.hour?.branch
    ];

    // 월지(index 1)에 월령 가중치 1.5배 적용
    const BRANCH_MULTIPLIER = [1.0, 1.5, 1.0, 1.0];

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

  // B-222: 강약 판정 (월령 득령 보정 적용)
  const strengthMonthBranch = pillars.month?.branch;
  const monthElement = BRANCH_ELEMENT[strengthMonthBranch] || "";
  console.log("[MONTH BRANCH DEBUG]", strengthMonthBranch, "→", monthElement);
  const isDeukyeong = (monthElement === myElement) || 
    (myElement === "목" && monthElement === "수") ||
    (myElement === "화" && monthElement === "목") ||
    (myElement === "토" && monthElement === "화") ||
    (myElement === "금" && monthElement === "토") ||
    (myElement === "수" && monthElement === "금");

  const supportForce = tenGodCount["비겁"] + tenGodCount["인성"];
  const resistForce = tenGodCount["식상"] + tenGodCount["재성"] + tenGodCount["관성"];
  
  // 보정된 supportForce (월령 득령 시 +1.5 보너스)
  const adjustedSupportForce = supportForce + (isDeukyeong ? 1.5 : 0);
  const adjustedTotal = adjustedSupportForce + resistForce;
  const supportRatio = adjustedTotal > 0 ? adjustedSupportForce / adjustedTotal : 0.5;

  let strengthLevel = "중화";
  if (supportRatio >= 0.60) strengthLevel = "극신강";
  else if (supportRatio >= 0.50) strengthLevel = "신강";
  else if (supportRatio >= 0.42) strengthLevel = "중화";
  else if (supportRatio >= 0.30) strengthLevel = "신약";
  else strengthLevel = "극신약";

  console.log("[STRENGTH DEBUG]", JSON.stringify({ 
    dmEl: myElement, 
    monthBranchEl: monthElement, 
    isDeukyeong, 
    supportForce, 
    resistForce, 
    adjustedSupportForce, 
    supportRatio, 
    strengthLevel 
  }));

  // 종격 판정
  let specialPattern = "";
  if (supportRatio >= 0.75) {
    specialPattern = "종강격";
    strengthLevel = "종강";
  } else if (supportRatio <= 0.20) {
    if (tenGodCount["재성"] >= tenGodCount["관성"] && tenGodCount["재성"] >= tenGodCount["식상"]) {
      specialPattern = "종재격";
    } else if (tenGodCount["관성"] >= tenGodCount["재성"] && tenGodCount["관성"] >= tenGodCount["식상"]) {
      specialPattern = "종관격";
    } else {
      specialPattern = "종아격";
    }
    strengthLevel = specialPattern;
  }
  
  // Back-compatibility for other logic using 'strength' variable
  const strength = strengthLevel;
  const isSpecialFormat = specialPattern !== "";
  const specialFormatType = specialPattern;

  // ── 3. 용신(用神) 추론 ──
  // 월지 기준 계절 파악
  const monthBranch = branches[1]; // 월지
  const SEASON_MAP: Record<string, string> = {
    "寅": "봄", "卯": "봄", "辰": "봄",
    "巳": "여름", "午": "여름", "未": "여름",
    "申": "가을", "酉": "가을", "戌": "가을",
    "亥": "겨울", "子": "겨울", "丑": "겨울"
  };
  const season = SEASON_MAP[monthBranch] || "봄";

  // 조후용신 결정 (B-177 fix: 수 과다 일간은 조후 제한)
  let johuYong: string | null = null;
  const waterCount = elements["수"] || 0;
  const fireCount = elements["화"] || 0;
  const woodCount = elements["목"] || 0;
  // 수(水) 일간이면서 수가 이미 3개 이상이면 조후용신으로 화를 쓰지 않음 (수 과다 상태)
  const isWaterOverflow = myElement === "수" && waterCount >= 3;
  if (season === "여름" && (elements["수"] || 0) <= 1) johuYong = "수";
  else if (season === "겨울" && fireCount <= 1 && !isWaterOverflow) johuYong = "화";

  // 억부용신 결정
  let eokbuYong: string;
  if (isSpecialFormat) {
    // 종격 (B-222): 강한 기운을 따라감
    if (specialFormatType === "종강격") {
      eokbuYong = myElement;
    } else if (specialFormatType === "종재격") {
      eokbuYong = getConqueredElement(myElement);
    } else if (specialFormatType === "종관격") {
      eokbuYong = getConqueringElement(myElement);
    } else { // 종아격
      eokbuYong = getProducedElement(myElement);
    }
  } else if (strength === "극신강" || strength === "신강") {
    // 신강 → 설기/재성/관성 중 가장 부족한 오행
    const drainElements = [
      getProducedElement(myElement),   // 식상
      getConqueredElement(myElement),  // 재성
      getConqueringElement(myElement)  // 관성
    ];
    eokbuYong = drainElements.sort((a, b) => (elements[a] || 0) - (elements[b] || 0))[0];
  } else if (strength === "중화") {
    // B-177 fix: 중화 → 수 과다 일간이면 토(관성)를 우선 용신으로
    if (isWaterOverflow) {
      eokbuYong = getConqueringElement(myElement); // 관성(토) 우선
    } else {
      const allElements = ["목", "화", "토", "금", "수"];
      eokbuYong = allElements.sort((a, b) => (elements[a] || 0) - (elements[b] || 0))[0];
    }
  } else {
    // 신약/중신약/극신약 → 일간 오행 자체가 부족하면 비겁, 생조 오행이 부족하면 인성
    const supElement = getProducingElement(myElement); // 인성 오행
    const myElemCount = elements[myElement] || 0;
    const supElemCount = elements[supElement] || 0;
    // 일간 오행이 이미 충분하면(3개 이상) 인성보다 비겁 우선
    if (myElemCount >= 3) {
      eokbuYong = myElement; // 비겁 용신
    } else if (supElemCount <= 1) {
      eokbuYong = supElement; // 인성 용신
    } else {
      eokbuYong = (supElemCount < myElemCount) ? supElement : myElement;
    }
  }

  // 최종 용신: 조후 + 억부 모두 반환 (조후 우선, 억부 병행)
  let yongsin: string;
  if (johuYong && johuYong !== eokbuYong) {
    yongsin = `${johuYong}/${eokbuYong}`; // 예: "화/토"
  } else if (johuYong) {
    yongsin = johuYong; // 조후=억부 일치
  } else {
    yongsin = eokbuYong; // 조후 없음 → 억부만
  }

  // ── B-253: 희신(喜神) 추론 ──────────────────────────────────────
  const PRODUCE_MAP: Record<string, string> = { "목":"화", "화":"토", "토":"금", "금":"수", "수":"목" };
  const SUPPORT_MAP: Record<string, string> = { "목":"수", "화":"목", "토":"화", "금":"토", "수":"금" };

  let heeShin = "";
  if (yongsin.includes("/")) {
    // 조후/억부 병기인 경우 — 억부용신 기준으로 희신 산출
    const mainYong = yongsin.split("/")[1] || yongsin.split("/")[0];
    heeShin = SUPPORT_MAP[mainYong] || "";
  } else {
    // 용신을 생해주는 오행이 희신
    heeShin = SUPPORT_MAP[yongsin] || "";
  }
  // 희신이 용신과 같으면 용신을 생하는 쪽의 생오행으로 대체
  if (heeShin === yongsin) {
    heeShin = SUPPORT_MAP[heeShin] || "";
  }

  // ── 4. Characteristics 생성 ──
  const characteristics: string[] = [];

  if (isSpecialFormat) {
    characteristics.push(`특수격국: ${specialFormatType} — 일반적인 억부 용신 대신 격국에 맞는 용신 적용`);
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
    (heeShin ? ` 희신은 '${heeShin}'으로, 용신을 보조하는 역할을 합니다.` : "") +
    chungDesc + harmonyDesc + hyungDesc;

  // === 대운 분석 ===
  let daewoon: DaewoonResult | null = null;
  try {
    const yearStemIdx = STEMS.indexOf(sajuRaw.year?.stem || (typeof sajuRaw.year === 'string' ? sajuRaw.year[0] : undefined));
    const monthStemIdx = STEMS.indexOf(sajuRaw.month?.stem);
    const monthBranchIdx = BRANCHES.indexOf(sajuRaw.month?.branch);
    const gender = (sajuRaw.gender === 'F' || sajuRaw.gender === 'female') ? 'F' : 'M';
    const birthYear = Number(sajuRaw.year?.year || sajuRaw.year);
    const currentAge = new Date().getFullYear() - (Number.isFinite(birthYear) ? birthYear : 1990) + 1;
    const sLong = sajuRaw.sunLong ?? sajuRaw.sun_long ?? 0;
    const jdVal = sajuRaw.jd ?? sajuRaw.julian_day ?? 0;

    if (yearStemIdx >= 0 && monthStemIdx >= 0 && monthBranchIdx >= 0) {
      const { age: startAge, isForward } = getDaewoonInfo(
        yearStemIdx, gender, sLong, jdVal, birthYear
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
    console.error("[Daewoon] Calculation failed:", e);
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

  // B-144: 신살 계산
  const shinsal = calculateShinsal(dm, pillars.day?.branch || "", interactionBranches, pillars.year?.branch);

  // B-144: 건강 위험 태그 추출
  const health_risk_tags: string[] = shinsal
    .filter(s => s.health_implication)
    .map(s => `${s.name}: ${s.health_implication}`);

  // B-145: 토픽별 신살 매핑
  const topic_shinsal_map: Record<string, string[]> = {};
  shinsal.forEach(s => {
    s.topic_relevance.forEach(topic => {
      if (!topic_shinsal_map[topic]) topic_shinsal_map[topic] = [];
      topic_shinsal_map[topic].push(s.name);
    });
  });

  // 신살 중 역마살 있으면 characteristics에 추가
  shinsal.forEach(s => {
    if (s.type === "역마" || s.type === "양인") {
      characteristics.push(`${s.name}: ${s.description}`);
    }
  });

  // 충·형살이 있으면 characteristics에 추가
  interactions.forEach(inter => {
    if (inter.severity === "흉") {
      characteristics.push(`${inter.type}(${inter.elements.join("·")}): ${inter.meaning_keyword}`);
    }
  });

  return {
    dayMaster: dm,
    strength,
    elements,
    characteristics,
    narrative,
    tenGods: tenGodCount,
    yongShin: yongsin,
    heeShin: heeShin,
    daewoon,
    interactions,
    shinsal,
    health_risk_tags,
    topic_shinsal_map,
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

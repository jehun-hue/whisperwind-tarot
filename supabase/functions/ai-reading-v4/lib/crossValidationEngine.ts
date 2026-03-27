/**
 * crossValidationEngine.ts
 * 자미두수 × 사주 구조적 교차 검증 엔진
 * 두 시스템이 같은 방향을 가리키면 신뢰도 상승, 반대면 주의 필요
 */

// 영역별 매핑: 자미두수 궁 ↔ 사주 십성/요소
const DOMAIN_MAP = {
  재물: {
    ziweiPalaces: ["재백궁", "전택궁"],
    ziweiStars: ["무곡", "천부", "태음", "록존"],
    ziweiTransforms: ["화록"], // 재백궁에 화록이면 재물 길
    sajuTenGods: ["편재", "정재"],
    sajuElements: ["재성"],
    label: "재물/금전운"
  },
  직업: {
    ziweiPalaces: ["관록궁"],
    ziweiStars: ["자미", "태양", "무곡", "염정", "칠살"],
    ziweiTransforms: ["화권"],
    sajuTenGods: ["편관", "정관"],
    sajuElements: ["관성"],
    label: "직업/사회적 성취"
  },
  연애: {
    ziweiPalaces: ["부처궁", "복덕궁"],
    ziweiStars: ["태음", "탐랑", "천동", "천상"],
    ziweiTransforms: ["화록", "화과"],
    sajuTenGods: ["정재", "정관", "편재", "편관"],
    sajuElements: ["재성", "관성"],
    label: "연애/결혼운"
  },
  건강: {
    ziweiPalaces: ["질액궁"],
    ziweiStars: ["천동", "천량"],
    ziweiTransforms: ["화기"], // 질액궁에 화기면 건강 흉
    sajuTenGods: ["식신", "상관"],
    sajuElements: ["식상"],
    label: "건강운"
  },
  인간관계: {
    ziweiPalaces: ["노복궁", "형제궁", "부모궁"],
    ziweiStars: ["좌보", "우필", "천괴", "천월"],
    ziweiTransforms: ["화과"],
    sajuTenGods: ["비견", "겁재", "정인", "편인"],
    sajuElements: ["비겁", "인성"],
    label: "인간관계/사회적 인맥"
  }
};

interface CrossValidationItem {
  domain: string;           // "재물", "직업" 등
  label: string;            // 한글 레이블
  ziweiSignal: "길" | "흉" | "중립";
  ziweiEvidence: string[];  // 근거 목록
  sajuSignal: "길" | "흉" | "중립";
  sajuEvidence: string[];
  agreement: "일치" | "상충" | "편향";  // 두 시스템 비교
  confidence: number;       // 0~100
  synthesis: string;        // 종합 한줄 해석
}

export interface CrossValidationResult {
  items: CrossValidationItem[];
  overallAgreement: number;   // 전체 일치율 0~100
  strongSignals: string[];    // 강력한 교차 확인 신호
  conflictSignals: string[];  // 상충 신호
  summary: string;            // 전체 종합 요약
}

export function runCrossValidation(
  ziweiResult: any,
  sajuResult: any
): CrossValidationResult {
  // ── 필드 존재 방어 로직 ──
  if (!sajuResult) {
    console.error("[CrossValidation] sajuResult가 null/undefined");
    return {
      items: [],
      overallAgreement: 0,
      strongSignals: [],
      conflictSignals: [],
      summary: "교차검증 불가: 사주 데이터 없음"
    };
  }

  // tenGods 형식 정규화 (배열 vs 객체 대응)
  let tenGodCounts: Record<string, number> = {};
  if (Array.isArray(sajuResult.tenGods)) {
    for (const tg of sajuResult.tenGods) {
      const name = tg.tenGod || tg.name || tg.type;
      if (name) tenGodCounts[name] = (tenGodCounts[name] || 0) + 1;
    }
  } else if (sajuResult.tenGods && typeof sajuResult.tenGods === 'object') {
    tenGodCounts = sajuResult.tenGods;
  }

  // 용신/기신/오행 방어
  const yongShin = sajuResult.yongShin || sajuResult.yongsin || "";
  const giShin = sajuResult.giShin || sajuResult.gisin || "";
  const elements = sajuResult.elements || sajuResult.fiveElementDist || {};

  // 충합/12운성/대운 방어
  const interactions = sajuResult.interactions || sajuResult.jijiInteractions || { clashes: [], harmonies: [] };
  const twelveStages = sajuResult.twelve_stages || sajuResult.twelveLifeStages || sajuResult.twelveStages || {};
  const daewoon = sajuResult.daewoon || sajuResult.daewoonResult || sajuResult.currentDaeun || null;

  const items: CrossValidationItem[] = [];
  
  for (const [domainKey, mapping] of Object.entries(DOMAIN_MAP)) {
    // === 자미두수 신호 분석 ===
    const ziweiEvidence: string[] = [];
    let ziweiPositive = 0;
    let ziweiNegative = 0;
    
    const palaces = ziweiResult?.palaces || [];
    for (const palaceName of mapping.ziweiPalaces) {
      const palace = palaces.find((p: any) => p.name === palaceName);
      if (!palace) continue;
      
      // 주성 확인
      const stars = (palace.stars || []).map((s: any) => s.star);
      const matchedStars = stars.filter((s: string) => mapping.ziweiStars.includes(s));
      if (matchedStars.length > 0) {
        ziweiEvidence.push(`${palaceName}에 ${matchedStars.join(",")} 좌정`);
        ziweiPositive += matchedStars.length;
      }
      
      // 사화 확인
      const transforms = palace.transformations || [];
      for (const t of transforms) {
        if (mapping.ziweiTransforms.includes(t.type)) {
          if (t.type === "화기") {
            ziweiEvidence.push(`${palaceName}에 화기(${t.star}) — 장애`);
            ziweiNegative += 2;
          } else {
            ziweiEvidence.push(`${palaceName}에 ${t.type}(${t.star}) — 길`);
            ziweiPositive += 2;
          }
        }
      }
      
      // 살성 확인 (경양, 타라, 화성, 영성, 지공, 지겁)
      const killStars = stars.filter((s: string) => 
        ["경양", "타라", "화성", "영성", "지공", "지겁"].includes(s)
      );
      if (killStars.length > 0) {
        ziweiEvidence.push(`${palaceName}에 살성 ${killStars.join(",")} — 흉`);
        ziweiNegative += killStars.length;
      }
    }
    
    // 밝기 보너스
    for (const palaceName of mapping.ziweiPalaces) {
      const palace = palaces.find((p: any) => p.name === palaceName);
      if (!palace) continue;
      const brightStars = (palace.stars || []).filter((s: any) => 
        mapping.ziweiStars.includes(s.star) && (s.brightness === "묘" || s.brightness === "왕")
      );
      if (brightStars.length > 0) {
        ziweiPositive += 1;
        ziweiEvidence.push(`${palaceName} 주성 밝기 양호(${brightStars.map((s:any) => `${s.star}:${s.brightness}`).join(",")})`);
      }
    }
    
    const ziweiSignal: "길" | "흉" | "중립" = 
      ziweiPositive > ziweiNegative + 1 ? "길" : 
      ziweiNegative > ziweiPositive + 1 ? "흉" : "중립";
    
    // === 사주 신호 분석 ===
    const sajuEvidence: string[] = [];
    let sajuPositive = 0;
    let sajuNegative = 0;
    
    // 십성 분포 확인
    for (const tg of mapping.sajuTenGods) {
      const count = tenGodCounts[tg] || 0;
      if (count > 0) {
        sajuEvidence.push(`${tg} ${count}개 활성`);
        sajuPositive += count;
      }
    }
    
    // 세운 십성 확인
    const fortuneTenGod = sajuResult?.fortune?.tenGodStem || sajuResult?.fourPillars?.year?.tenGodStem || ""; // Fallback
    if (mapping.sajuTenGods.some(tg => fortuneTenGod.includes(tg))) {
      sajuEvidence.push(`올해 세운 십성: ${fortuneTenGod} — 해당 영역 활성`);
      sajuPositive += 2;
    }
    
    // 용신 관련 확인
    if (mapping.sajuElements.some(el => yongShin.includes(el))) {
      sajuEvidence.push(`용신이 ${yongShin}으로 해당 영역에 유리`);
      sajuPositive += 2;
    }
    
    // 기신 관련 확인
    if (mapping.sajuElements.some(el => giShin.includes(el))) {
      sajuEvidence.push(`기신이 ${giShin}으로 해당 영역에 장애`);
      sajuNegative += 2;
    }
    
    // 세운 교차작용 (충/형/파)
    const crossInteractions = sajuResult?.cross_interactions?.sewoon?.with_original?.branch_rels || [];
    const hasConflict = crossInteractions.some((r: any) => 
      ["충", "형", "파"].includes(r.type)
    );
    if (hasConflict && (domainKey === "연애" || domainKey === "인간관계")) {
      sajuEvidence.push(`세운-원국 지지 충돌 — 관계 마찰 가능`);
      sajuNegative += 1;
    }
    
    // 12운성 에너지
    const seunStage = twelveStages.seun?.level || twelveStages.sewun?.level || 50;
    if (seunStage >= 70) {
      sajuEvidence.push(`세운 12운성(${seunStage}점) — 에너지 충만`);
      sajuPositive += 1;
    } else if (seunStage <= 30) {
      sajuEvidence.push(`세운 12운성(${seunStage}점) — 에너지 저하`);
      sajuNegative += 1;
    }
    
    const sajuSignal: "길" | "흉" | "중립" = 
      sajuPositive > sajuNegative + 1 ? "길" : 
      sajuNegative > sajuPositive + 1 ? "흉" : "중립";
    
    // === 교차 비교 ===
    let agreement: "일치" | "상충" | "편향";
    let confidence: number;
    
    if (ziweiSignal === sajuSignal) {
      agreement = "일치";
      confidence = Math.min(95, 60 + (ziweiEvidence.length + sajuEvidence.length) * 5);
    } else if (
      (ziweiSignal === "길" && sajuSignal === "흉") || 
      (ziweiSignal === "흉" && sajuSignal === "길")
    ) {
      agreement = "상충";
      confidence = Math.max(30, 50 - Math.abs(ziweiPositive - sajuPositive) * 5);
    } else {
      agreement = "편향";
      confidence = 50 + Math.max(ziweiEvidence.length, sajuEvidence.length) * 3;
    }
    
    // 종합 해석
    let synthesis: string;
    if (agreement === "일치" && ziweiSignal === "길") {
      synthesis = `${mapping.label}: 자미두수와 사주 모두 긍정적 신호 (신뢰도 ${confidence}%)`;
    } else if (agreement === "일치" && ziweiSignal === "흉") {
      synthesis = `${mapping.label}: 양 시스템 모두 주의 신호 — 각별한 대비 필요 (신뢰도 ${confidence}%)`;
    } else if (agreement === "상충") {
      synthesis = `${mapping.label}: 자미두수(${ziweiSignal})와 사주(${sajuSignal}) 상충 — 시기별 변동 가능 (신뢰도 ${confidence}%)`;
    } else {
      const dominant = ziweiEvidence.length > sajuEvidence.length ? "자미두수" : "사주";
      synthesis = `${mapping.label}: ${dominant} 중심 판단, 보조 시스템은 중립 (신뢰도 ${confidence}%)`;
    }
    
    items.push({
      domain: domainKey,
      label: mapping.label,
      ziweiSignal,
      ziweiEvidence,
      sajuSignal,
      sajuEvidence,
      agreement,
      confidence,
      synthesis
    });
  }
  
  // 전체 통계
  const agreeCount = items.filter(i => i.agreement === "일치").length;
  const overallAgreement = Math.round((agreeCount / items.length) * 100);
  
  const strongSignals = items
    .filter(i => i.agreement === "일치" && i.confidence >= 70)
    .map(i => i.synthesis);
  
  const conflictSignals = items
    .filter(i => i.agreement === "상충")
    .map(i => i.synthesis);
  
  const summary = strongSignals.length >= 3
    ? `5개 영역 중 ${agreeCount}개에서 자미두수·사주가 일치합니다. 전반적으로 신뢰도 높은 분석입니다.`
    : conflictSignals.length >= 2
    ? `일부 영역에서 시스템 간 상충이 있어 시기별 변동이 예상됩니다. 세밀한 시기 분석이 필요합니다.`
    : `자미두수와 사주가 혼재된 신호를 보이고 있어, 질문 영역에 집중한 해석이 필요합니다.`;
  
  return { items, overallAgreement, strongSignals, conflictSignals, summary };
}

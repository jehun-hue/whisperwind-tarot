import { type ZiweiResult, STAR_PALACE_MEANINGS } from "./ziweiEngine.ts";

export const ZIWEI_PALACE_MAP: Record<string, string[]> = {
  relationship:   ["부처궁", "복덕궁", "천이궁", "명궁", "재백궁", "관록궁"],
  career:         ["관록궁", "천이궁", "재백궁", "명궁", "복덕궁", "부처궁"],
  health:         ["질액궁", "복덕궁", "명궁", "부모궁", "재백궁", "관록궁"],
  finance:        ["재백궁", "전택궁", "관록궁", "명궁", "복덕궁", "부처궁"],
  life_change:    ["천이궁", "명궁", "관록궁", "복덕궁", "재백궁", "부처궁"],
  migration:      ["천이궁", "명궁", "부모궁", "복덕궁", "재백궁", "관록궁"],
  family:         ["부모궁", "자녀궁", "형제궁", "부처궁", "명궁", "복덕궁"],
  compatibility:  ["부처궁", "복덕궁", "명궁", "천이궁", "재백궁", "관록궁"],
  general_future: ["명궁", "관록궁", "재백궁", "부처궁", "질액궁", "복덕궁"],
  default:        ["명궁", "관록궁", "재백궁", "부처궁", "질액궁", "복덕궁"],
};


/**
 * 자미두수 분석 결과를 AI 프롬프트용 구조화 텍스트로 변환
 */
export function buildZiWeiPromptSection(ziwei: ZiweiResult, questionType?: string): string {
  const lines: string[] = [];

  // ── 기본 정보 ──
  lines.push("=== 자미두수(紫微斗數) 명반 분석 ===");
  lines.push(`명궁: ${ziwei.mingGong} | 신궁: ${ziwei.shenGong} | 오행국: ${ziwei.bureau}`);
  
  if ((ziwei as any).chartType) {
    const ct = (ziwei as any).chartType;
    lines.push(`명반 유형: ${ct.name}(${ct.code}) — ${ct.description}`);
    lines.push(`  강점: ${ct.strengths.join(", ")}`);
    lines.push(`  약점: ${ct.weaknesses.join(", ")}`);
  }

  // ── 래인궁 (Lai Yin Gong) ──
  if ((ziwei as any).laiYinAnalysis) {
    const la = (ziwei as any).laiYinAnalysis;
    lines.push("");
    lines.push("[래인궁(來因宮) — 인생의 출발점]");
    lines.push(`  래인궁: ${la.laiYinGong} (${la.laiYinStar}의 화록이 떨어진 궁)`);
    lines.push(`  인생 주제: ${la.lifeTheme}`);
    lines.push(`  체궁(體): ${la.tiGong} | 용궁(用): ${la.yongGong}`);
    lines.push(`  체용 관계: ${la.tiYongRelation}`);
    lines.push("");
    lines.push("★ 래인궁 해석 지침: 래인궁은 이 사람 인생의 '진짜 출발점'입니다. 명궁이 아닌 래인궁의 별과 사화를 중심으로 인생 전체의 방향을 해석하세요. 래인궁에 화기가 함께 있으면 '복과 장애가 공존하는 복잡한 인생'으로, 화록만 있으면 '순탄한 출발'로 해석합니다.");
  }
  
  // 종합 점수 (Server version might not have overallScore yet, so we guard it)
  if ((ziwei as any).overallScore) {
    const os = (ziwei as any).overallScore;
    lines.push(`종합 등급: ${os.grade} (${os.total}점/100)`);
    lines.push(`한줄 요약: ${os.oneLineSummary}`);

    // ── 카테고리별 점수 ──
    lines.push("");
    lines.push("[카테고리별 운세]");
    for (const cat of os.categories || []) {
      lines.push(`  ${cat.name}: ${cat.score}점 (${cat.summary})`);
    }
  }

  // ── 격국 ──
  if ((ziwei as any).geokGuk && (ziwei as any).geokGuk.length > 0) {
    lines.push("");
    lines.push("[격국(格局)]");
    for (const g of (ziwei as any).geokGuk) {
      lines.push(`  ${g.name} [${g.grade}]: ${g.description}`);
      if (g.breakConditions && g.breakConditions.length > 0) {
        lines.push(`    ⚠ 파격 조건: ${g.breakConditions.join(", ")}`);
      }
    }
  }

  // ── 본명 사화 ──
  lines.push("");
  lines.push("[본명 사화(四化)]");
  for (const t of ziwei.natalTransformations || []) {
    lines.push(`  ${t.type}: ${t.star} → ${t.palace} (${t.description})`);
  }

  // ── 궁간사화 (Flying Star) ──
  if ((ziwei as any).palaceFlyingSiHua && (ziwei as any).palaceFlyingSiHua.length > 0) {
    lines.push("");
    lines.push("[궁간사화(飛星四化) — 인과관계 분석]");
    for (const pf of (ziwei as any).palaceFlyingSiHua) {
      if (pf.flights.length > 0) {
        lines.push(`  ${pf.palace}(${pf.stem}간):`);
        for (const f of pf.flights) {
          lines.push(`    ${f.type}: ${f.star} → ${f.toPalace} (${f.meaning})`);
        }
      }
    }
    lines.push("");
    lines.push("★ 궁간사화 해석 지침: 화기(忌)가 날아간 궁은 '문제의 원인'이고, 화록(祿)이 날아간 궁은 '해결의 실마리'입니다. 명궁에서 화기가 재백궁으로 가면 '자기 자신의 성격이 재물 손실의 원인', 관록궁에서 화록이 부처궁으로 가면 '직업을 통해 좋은 인연을 만남'으로 해석하세요.");
  }

  // ── 삼대기추적 (Chain Analysis) ──
  if ((ziwei as any).siHuaChainAnalysis) {
    lines.push("");
    lines.push("[삼대기추적(三代忌追蹤) — 운명의 인과 체인]");
    for (const chain of (ziwei as any).siHuaChainAnalysis) {
      lines.push(`  ${chain.palace}:`);
      if (chain.giChain && chain.giChain.length > 0) {
        const giPath = chain.giChain.map((c: any) => `${c.fromPalace}→${c.toPalace}`).join(" → ");
        lines.push(`    화기(忌) 경로: ${giPath}`);
        lines.push(`    → 해석: ${chain.giChain[chain.giChain.length - 1].meaning}`);
      }
      if (chain.rokChain && chain.rokChain.length > 0) {
        const rokPath = chain.rokChain.map((c: any) => `${c.fromPalace}→${c.toPalace}`).join(" → ");
        lines.push(`    화록(祿) 경로: ${rokPath}`);
        lines.push(`    → 해석: ${chain.rokChain[chain.rokChain.length - 1].meaning}`);
      }
    }
    lines.push("");
    lines.push("★ 삼대기추적 해석 지침: 화기 체인의 최종 도착궁이 '근본 원인'입니다. 예: 명궁→재백궁→질액궁이면 '성격 문제가 돈 문제를 일으키고, 결국 건강까지 해친다'고 해석하세요. 화록 체인의 최종 도착궁은 '궁극적 해결처'입니다.");
  }

  // ── 12궁 요약 (명궁, 재백궁, 관록궁, 부처궁, 질액궁만 핵심) ──
  lines.push("");
  // ── P1-3: 질문 유형별 핵심 궁 우선순위 ──
  const keyPalaces = ZIWEI_PALACE_MAP[questionType || ""] || ZIWEI_PALACE_MAP.default;
  const primaryPalaces = keyPalaces.slice(0, 3); // 상위 3궁은 상세 분석

  lines.push(`[핵심 궁위 분석] (질문 유형: ${questionType || "종합"}, 우선궁: ${primaryPalaces.join("→")})`);

  // P1-3: keyPalaces 순서대로 출력
  for (const palaceName of keyPalaces) {
    const palace = (ziwei.palaces || []).find(p => p.name === palaceName);
    if (!palace) continue;

    const majorStars = (palace.stars || [])
      .filter(s => ["자미","천기","태양","무곡","천동","염정","천부","태음","탐랑","거문","천상","천량","칠살","파군"].includes(s.star))
      .map(s => `${s.star}(${s.brightness})`)
      .join(", ");
    const auxStars = (palace.stars || [])
      .filter(s => !["자미","천기","태양","무곡","천동","염정","천부","태음","탐랑","거문","천상","천량","칠살","파군"].includes(s.star))
      .map(s => s.star)
      .join(", ");
    const shenSha = ((palace as any).shenSha || []).slice(0, 4).join(", ");
    const trans = (palace.transformations || []).map(t => t.type).join(",");

    lines.push(`  ${palace.name}(${palace.branch}):`);

    // ── P1-3: 상위 3궁 표시 ──
    if (primaryPalaces.includes(palace.name)) {
      lines.push(`    ◆ 이 궁은 질문의 핵심 궁입니다. 상세하게 해석하세요.`);
    }

    if (majorStars) lines.push(`    주성: ${majorStars}`);
    
    // 주성 궁별 해석 추가 (Tier 2-2)
    const firstMajorStar = (palace.stars || []).find(s => STAR_PALACE_MEANINGS[s.star])?.star;
    if (firstMajorStar && STAR_PALACE_MEANINGS[firstMajorStar]?.[palace.name]) {
      lines.push(`    핵심의미: ${STAR_PALACE_MEANINGS[firstMajorStar][palace.name]}`);
    }

    if (auxStars) lines.push(`    보조성: ${auxStars}`);
    if (trans) lines.push(`    사화: ${trans}`);
    if (shenSha) lines.push(`    신살: ${shenSha}`);

    // 삼방사정 분석 추가 (Tier 2-3)
    const BRANCHES_LIST = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
    const palaceBranchIdx = BRANCHES_LIST.indexOf(palace.branch);
    if (palaceBranchIdx >= 0) {
      // ── P1-1: 공궁 차성(借星) 처리 ──
      const isMajorEmpty = !majorStars;
      if (isMajorEmpty) {
        const BRANCHES_TEMP = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
        const bIdx = BRANCHES_TEMP.indexOf(palace.branch);
        if (bIdx >= 0) {
          const oppIdx = (bIdx + 6) % 12;
          const oppPalace = (ziwei.palaces || []).find(pp => pp.branch === BRANCHES_TEMP[oppIdx]);
          if (oppPalace) {
            const borrowedStars = (oppPalace.stars || [])
              .filter(s => ["자미","천기","태양","무곡","천동","염정","천부","태음","탐랑","거문","천상","천량","칠살","파군"].includes(s.star))
              .map(s => `${s.star}(${s.brightness})`)
              .join(", ");
            if (borrowedStars) {
              lines.push(`    ★ 빈궁 차성: 대궁 ${oppPalace.name}(${oppPalace.branch})에서 차용 → ${borrowedStars}`);
              lines.push(`    ★ 차성 해석 지침: 빈궁은 대궁의 별을 빌려 해석합니다. 단, 빌린 별의 영향력은 원래 궁에 있을 때의 약 60~70% 수준입니다.`);
            }
          }
        }
      }

      const oppositeIdx = (palaceBranchIdx + 6) % 12;
      const trine1Idx = (palaceBranchIdx + 4) % 12;
      const trine2Idx = (palaceBranchIdx + 8) % 12;

      const getStarsAtBranch = (branchIdx: number) => {
        const p = (ziwei.palaces || []).find(pp => pp.branch === BRANCHES_LIST[branchIdx]);
        if (!p) return "";
        return (p.stars || [])
          .filter(s => ["자미", "천기", "태양", "무곡", "천동", "염정", "천부", "태음", "탐랑", "거문", "천상", "천량", "칠살", "파군"].includes(s.star))
          .map(s => s.star)
          .join(",");
      };

      const oppStars = getStarsAtBranch(oppositeIdx);
      const tri1Stars = getStarsAtBranch(trine1Idx);
      const tri2Stars = getStarsAtBranch(trine2Idx);

      if (oppStars || tri1Stars || tri2Stars) {
        lines.push(`    삼방사정: 대궁[${oppStars || "빈"}] 삼합[${tri1Stars || "빈"}, ${tri2Stars || "빈"}]`);
        // ── P1-1: 삼방사정 해석 지침 ──
        lines.push(`    ★ 삼방사정 해석: 본궁의 주성이 약하거나 빈궁이더라도, 삼방사정의 길성(좌보/우필/문창/문곡/록존/천괴/천월)이 많으면 외부 도움과 기회가 풍부합니다. 흉성(경양/타라/화성/영성/지공/지겁)이 집중되면 장애와 변동이 큽니다.`);
      }
    }
  }

  // ── 성조합 ──
  if ((ziwei as any).starCombinations && (ziwei as any).starCombinations.length > 0) {
    lines.push("");
    lines.push("[활성 성조합]");
    for (const combo of (ziwei as any).starCombinations.slice(0, 5)) {
      lines.push(`  ${combo.name}[${combo.rating}] @${combo.palace}: ${combo.interpretation}`);
    }
  }

  // ── 현재 대한 ──
  if (ziwei.currentMajorPeriod) {
    const mp = ziwei.currentMajorPeriod;
    lines.push("");
    lines.push(`[현재 대한(大限)] ${mp.startAge}~${mp.endAge}세: ${mp.palace}(${mp.branch})`);
    if (mp.transformations && mp.transformations.length > 0) {
      lines.push(`  대한사화: ${mp.transformations.map(t => `${t.type}(${t.star})`).join(", ")}`);
    }
    lines.push(`  해석: ${mp.interpretation.slice(0, 200)}`);
  }

  // ── 소한 삼중 교차 ──
  if (ziwei.currentMinorPeriod) {
    const sp = ziwei.currentMinorPeriod;
    lines.push("");
    lines.push(`[현재 소한(小限)] ${sp.age}세: ${sp.palace}(${sp.branch})`);
    if ((sp as any).tripleOverlap) {
      const top = (sp as any).tripleOverlap;
      lines.push(`  삼중 교차 판정: ${top.severity}`);
      lines.push(`  요약: ${top.summary}`);
      if (top.natalHits && top.natalHits.length > 0)
        lines.push(`  본명 교차: ${top.natalHits.join(", ")}`);
      if (top.dahanHits && top.dahanHits.length > 0)
        lines.push(`  대한 교차: ${top.dahanHits.join(", ")}`);
    } else {
        lines.push(`  해석: ${sp.interpretation}`);
    }
  }

  // ── 유년 분석 ──
  if ((ziwei as any).currentYearAnalysis) {
    const ya = (ziwei as any).currentYearAnalysis;
    lines.push("");
    lines.push(`[${ya.year}년 유년 운세] 천간: ${ya.yearStem} 지지: ${ya.yearBranch}`);
    if (ya.flowYearTransformations && ya.flowYearTransformations.length > 0) {
      lines.push(`  유년사화: ${ya.flowYearTransformations.map((t: any) => `${t.type}(${t.star})`).join(", ")}`);
    }
    if (ya.dahanOverlap && ya.dahanOverlap.length > 0)
      lines.push(`  대한 겹침: ${ya.dahanOverlap.join(", ")}`);
    if (ya.natalOverlap && ya.natalOverlap.length > 0)
      lines.push(`  본명 겹침: ${ya.natalOverlap.join(", ")}`);
    lines.push(`  해석: ${ya.interpretation.slice(0, 200)}`);
  }

  // ── P1-2: 사화 클러스터 분석 (궁별 사화 중첩 감지) ──
  const natalTrans = ziwei.natalTransformations || [];
  const dahanTrans = ziwei.currentMajorPeriod?.transformations || [];
  const flowTrans = (ziwei as any).currentYearAnalysis?.flowYearTransformations || [];
  
  // 궁별 사화 수집
  const palaceCluster: Record<string, { natal: string[]; dahan: string[]; flow: string[] }> = {};
  
  for (const t of natalTrans) {
    if (!palaceCluster[t.palace]) palaceCluster[t.palace] = { natal: [], dahan: [], flow: [] };
    palaceCluster[t.palace].natal.push(`${t.type}(${t.star})`);
  }
  for (const t of dahanTrans) {
    if (!palaceCluster[t.palace]) palaceCluster[t.palace] = { natal: [], dahan: [], flow: [] };
    palaceCluster[t.palace].dahan.push(`${t.type}(${t.star})`);
  }
  for (const t of flowTrans) {
    if (!palaceCluster[t.palace]) palaceCluster[t.palace] = { natal: [], dahan: [], flow: [] };
    palaceCluster[t.palace].flow.push(`${t.type}(${t.star})`);
  }
  
  // 2개 이상 레이어에서 사화가 겹치는 궁만 추출
  const clusterEntries = Object.entries(palaceCluster)
    .filter(([_, v]) => [v.natal.length > 0, v.dahan.length > 0, v.flow.length > 0].filter(Boolean).length >= 2);
  
  if (clusterEntries.length > 0) {
    lines.push("");
    lines.push("[사화 클러스터 분석 — 궁별 사화 중첩]");
    
    for (const [palace, cluster] of clusterEntries) {
      const layers: string[] = [];
      if (cluster.natal.length > 0) layers.push(`본명: ${cluster.natal.join(", ")}`);
      if (cluster.dahan.length > 0) layers.push(`대한: ${cluster.dahan.join(", ")}`);
      if (cluster.flow.length > 0) layers.push(`유년: ${cluster.flow.join(", ")}`);
      
      const allTypes = [...cluster.natal, ...cluster.dahan, ...cluster.flow].map(s => s.split("(")[0]);
      const giCount = allTypes.filter(t => t === "화기").length;
      const rokCount = allTypes.filter(t => t === "화록").length;
      
      let severity = "주의";
      let interpretation = "";
      
      if (giCount >= 2) {
        severity = "⚠ 위험";
        interpretation = "다중 화기 중첩 — 이 궁의 영역에서 심각한 장애, 손실, 집착이 예상됩니다. 최우선 주의 대상입니다.";
      } else if (rokCount >= 2) {
        severity = "★ 대길";
        interpretation = "다중 화록 중첩 — 이 궁의 영역에서 큰 재물운과 기회가 집중됩니다. 적극적으로 활용하세요.";
      } else if (giCount >= 1 && rokCount >= 1) {
        severity = "⚡ 복합";
        interpretation = "화록+화기 공존 — 기회와 장애가 동시에 옵니다. 이익을 취하되 리스크 관리가 필수입니다.";
      } else {
        interpretation = "다중 레이어 사화 중첩 — 이 궁의 에너지 변동이 큰 시기입니다.";
      }
      
      lines.push(`  ${palace} [${severity}]: ${layers.join(" | ")}`);
      lines.push(`    → ${interpretation}`);
    }
    
    lines.push("");
    lines.push("★ 사화 클러스터 해석 지침: 같은 궁에 본명·대한·유년 사화가 겹치면 그 궁의 에너지가 극대화됩니다. 화기 2중첩은 '반드시 경고', 화록 2중첩은 '핵심 기회', 화록+화기 공존은 '양날의 검'으로 해석하세요. 클러스터가 없는 궁보다 클러스터가 있는 궁을 우선 해석하십시오.");
  }

  return lines.join("\n");
}

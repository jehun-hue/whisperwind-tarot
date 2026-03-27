import { type ZiweiResult, STAR_PALACE_MEANINGS } from "./ziweiEngine.ts";

/**
 * 자미두수 분석 결과를 AI 프롬프트용 구조화 텍스트로 변환
 */
export function buildZiWeiPromptSection(ziwei: ZiweiResult): string {
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
  lines.push("[핵심 궁위 분석]");
  const keyPalaces = ["명궁", "재백궁", "관록궁", "부처궁", "질액궁", "복덕궁"];
  for (const palace of ziwei.palaces || []) {
    if (keyPalaces.includes(palace.name)) {
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
        }
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
  } else if (ziwei.annualTransformations && ziwei.annualTransformations.length > 0) {
    lines.push("");
    lines.push(`[${ziwei.annualYear}년 유년 사화] 천간: ${ziwei.annualGan}`);
    lines.push(`  유년사화: ${ziwei.annualTransformations.map(t => `${t.type}(${t.star})`).join(", ")}`);
  }

  return lines.join("\n");
}

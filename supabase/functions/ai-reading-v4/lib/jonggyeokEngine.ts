/**
 * jonggyeokEngine.ts - Phase 4: 종격 용신 엔진 (v3)
 * 극신강(≥80%) → 종왕격/종강격
 * 극신약(≤20%) → 종살격/종재격/종아격
 *
 * ★ v3 수정: tenGodCounts 키를 5분류("비겁","인성","관성","재성","식상")로 통일
 *   aiSajuAnalysis.ts에서 넘기는 키와 일치시킴
 */

export interface JonggyeokResult {
  method: "jonggyeok";
  type: string;       // 종왕격/종강격/종살격/종재격/종아격
  yongshin: string;
  heeshin: string;
  gisin: string;
  gusin: string;
  hansin: string;
  confidence: number;  // 0~1
  reason: string;
}

// 오행 상생 순환
const ELEM_CYCLE = ["목", "화", "토", "금", "수"];
const generates = (a: string): string => ELEM_CYCLE[(ELEM_CYCLE.indexOf(a) + 1) % 5];
const generatedBy = (a: string): string => ELEM_CYCLE[(ELEM_CYCLE.indexOf(a) + 4) % 5];
const controls = (a: string): string => ELEM_CYCLE[(ELEM_CYCLE.indexOf(a) + 2) % 5];
const controlledBy = (a: string): string => ELEM_CYCLE[(ELEM_CYCLE.indexOf(a) + 3) % 5];

export function calculateJonggyeok(
  _dayMaster: string,
  dayMasterElement: string,
  _pillars: any,
  tenGodCounts: Record<string, number>,
  _balance: number,       // 0~1 (percent/100)
  strengthPercent: number // 0~100
): JonggyeokResult | null {

  // ── 종격 진입 조건 ──
  const isExtreme강 = strengthPercent >= 80;
  const isExtreme약 = strengthPercent <= 20;
  if (!isExtreme강 && !isExtreme약) return null;

  const dm = dayMasterElement; // 일간 오행 (목/화/토/금/수)

  // ★ v3: 5분류 키 사용 (aiSajuAnalysis.ts의 tenGodCount 키와 일치)
  // 10분류 키("비견","겁재" 등)가 들어올 수도 있으므로 양쪽 모두 지원
  const bigeop = (tenGodCounts["비겁"] || 0)
    + (tenGodCounts["비견"] || 0) + (tenGodCounts["겁재"] || 0);
  const inseong = (tenGodCounts["인성"] || 0)
    + (tenGodCounts["정인"] || 0) + (tenGodCounts["편인"] || 0);
  const gwansal = (tenGodCounts["관성"] || 0)
    + (tenGodCounts["정관"] || 0) + (tenGodCounts["편관"] || 0);
  const jaeseong = (tenGodCounts["재성"] || 0)
    + (tenGodCounts["정재"] || 0) + (tenGodCounts["편재"] || 0);
  const siksang = (tenGodCounts["식상"] || 0)
    + (tenGodCounts["식신"] || 0) + (tenGodCounts["상관"] || 0);

  // ── 극신강 (≥80%) ──
  if (isExtreme강) {
    if (bigeop >= inseong) {
      // 종왕격: 비겁 주도
      const yong = dm;
      const hee = generatedBy(dm);   // 인성
      const gi = controls(dm);       // 재성
      const gu = controlledBy(dm);   // 관성
      const han = generates(dm);     // 식상
      return {
        method: "jonggyeok", type: "종왕격",
        yongshin: yong, heeshin: hee, gisin: gi, gusin: gu, hansin: han,
        confidence: Math.min((strengthPercent - 80) / 15 + 0.6, 1.0),
        reason: `극신강(${strengthPercent}%): 비겁(${bigeop.toFixed(1)}) 주도 → 종왕격, 일간(${dm}) 따라감`
      };
    } else {
      // 종강격: 인성 주도
      const yong = generatedBy(dm);  // 인성
      const hee = dm;                // 비겁
      const gi = generates(dm);      // 식상
      const gu = controls(dm);       // 재성
      const han = controlledBy(dm);  // 관성
      return {
        method: "jonggyeok", type: "종강격",
        yongshin: yong, heeshin: hee, gisin: gi, gusin: gu, hansin: han,
        confidence: Math.min((strengthPercent - 80) / 15 + 0.6, 1.0),
        reason: `극신강(${strengthPercent}%): 인성(${inseong.toFixed(1)}) 주도 → 종강격, 인성(${generatedBy(dm)}) 따라감`
      };
    }
  }

  // ── 극신약 (≤20%) ──
  if (isExtreme약) {
    // 가장 많은 십성 카테고리를 따라감
    const categories = [
      { name: "종살격", count: gwansal, yong: controlledBy(dm), label: "관살" },
      { name: "종재격", count: jaeseong, yong: controls(dm), label: "재성" },
      { name: "종아격", count: siksang, yong: generates(dm), label: "식상" },
    ];
    categories.sort((a, b) => b.count - a.count);

    const winner = categories[0];
    const yong = winner.yong;
    const hee = generates(yong);      // 용신을 생하는 것
    const gi = dm;                     // 일간 오행 = 기신
    const gu = generatedBy(dm);        // 인성 = 구신
    const han = controlledBy(yong);    // 용신을 극하는 것

    return {
      method: "jonggyeok", type: winner.name,
      yongshin: yong, heeshin: hee, gisin: gi, gusin: gu, hansin: han,
      confidence: Math.min((20 - strengthPercent) / 15 + 0.6, 1.0),
      reason: `극신약(${strengthPercent}%): ${winner.label}(${winner.count.toFixed(1)}) 주도 → ${winner.name}, 용신 ${yong}`
    };
  }

  return null;
}

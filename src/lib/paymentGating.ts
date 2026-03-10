export type Grade = "C" | "B" | "A" | "S";

export interface GradeProduct {
  id: string;
  name: string;
  price: number;
  grade: Grade;
  creditsRequired: number;
  features: string[];
}

export const GRADE_PRODUCTS: Record<Grade, GradeProduct> = {
  C: {
    id: "grade_c", name: "기본 리딩", price: 0, grade: "C", creditsRequired: 0,
    features: ["웨이트 타로 1종", "핵심 메시지", "행운색 + 행운숫자"]
  },
  B: {
    id: "grade_b", name: "상세 리딩", price: 1000, grade: "B", creditsRequired: 1,
    features: ["타로 2종 (웨이트 + 최한나)", "연애 핵심 분석", "DO 가이드 (2개)", "럭키 5종"]
  },
  A: {
    id: "grade_a", name: "프리미엄 리딩", price: 3000, grade: "A", creditsRequired: 3,
    features: ["타로 3종 전체", "6체계 교차검증", "연애 DNA + 3개월 타임라인", "DO/DON'T 가이드", "럭키 5종"]
  },
  S: {
    id: "grade_s", name: "마스터 리딩", price: 5000, grade: "S", creditsRequired: 5,
    features: ["타로 3종 + 6체계 교차검증", "인연 프로필", "6개월 타임라인", "대운 분석", "DO/DON'T 가이드", "리딩 저장 + 공유"]
  }
};

const GRADE_RANK: Record<Grade, number> = { C: 0, B: 1, A: 2, S: 3 };

export function canAccessGrade(purchasedGrade: Grade, contentGrade: Grade): boolean {
  return GRADE_RANK[purchasedGrade] >= GRADE_RANK[contentGrade];
}

/**
 * V3ReadingData를 구매 등급에 맞게 필터링
 * ReadingResultV3.tsx의 grade prop과 연동됨
 */
export function filterReadingByGrade(reading: any, purchasedGrade: Grade): any {
  if (!reading) return reading;
  
  const filtered = { ...reading };
  
  // C등급: waite만, story 300자 제한, convergence 없음, love 없음
  if (purchasedGrade === "C") {
    if (filtered.tarot_reading) {
      filtered.tarot_reading = {
        waite: filtered.tarot_reading.waite ? {
          ...filtered.tarot_reading.waite,
          story: filtered.tarot_reading.waite.story?.slice(0, 300) + "..."
        } : null,
        choihanna: null,
        monad: null,
      };
    }
    filtered.convergence = null;
    filtered.love_analysis = null;
    if (filtered.action_guide) {
      filtered.action_guide = {
        do_list: null,
        dont_list: null,
        lucky: filtered.action_guide.lucky ? {
          color: filtered.action_guide.lucky.color,
          number: filtered.action_guide.lucky.number,
        } : null,
      };
    }
    if (filtered.final_message) {
      filtered.final_message = { title: filtered.final_message.title, summary: null };
    }
  }
  
  // B등급: waite + choihanna, story 400자 제한, 간단한 convergence, love 기본, do 2개
  if (purchasedGrade === "B") {
    if (filtered.tarot_reading) {
      filtered.tarot_reading = {
        waite: filtered.tarot_reading.waite ? {
          ...filtered.tarot_reading.waite,
          story: filtered.tarot_reading.waite.story?.slice(0, 400) + (filtered.tarot_reading.waite.story?.length > 400 ? "..." : "")
        } : null,
        choihanna: filtered.tarot_reading.choihanna ? {
          ...filtered.tarot_reading.choihanna,
          story: filtered.tarot_reading.choihanna.story?.slice(0, 400) + "..."
        } : null,
        monad: null,
      };
    }
    // convergence: 간단 텍스트만
    if (filtered.convergence) {
      filtered.convergence = {
        ...filtered.convergence,
        tarot_convergence: null,
        divergent_note: null,
      };
    }
    // love: status_specific만, DNA/타임라인/파트너 제거
    if (filtered.love_analysis) {
      filtered.love_analysis = {
        status: filtered.love_analysis.status,
        love_dna: null,
        timeline: null,
        partner_profile: null,
        status_specific: filtered.love_analysis.status_specific,
      };
    }
    // action: do 2개, dont 없음
    if (filtered.action_guide) {
      filtered.action_guide = {
        do_list: filtered.action_guide.do_list?.slice(0, 2) || null,
        dont_list: null,
        lucky: filtered.action_guide.lucky,
      };
    }
    // summary 300자 제한
    if (filtered.final_message?.summary && filtered.final_message.summary.length > 300) {
      filtered.final_message.summary = filtered.final_message.summary.slice(0, 300) + "...";
    }
  }
  
  // A등급: 전체 타로, convergence 전체, love DNA + 3개월 타임라인, do/dont 전체, summary 전체
  if (purchasedGrade === "A") {
    // love 타임라인 3개로 제한
    if (filtered.love_analysis?.timeline) {
      const entries = Object.entries(filtered.love_analysis.timeline);
      filtered.love_analysis.timeline = Object.fromEntries(entries.slice(0, 3));
    }
    // partner_profile 제거
    if (filtered.love_analysis) {
      filtered.love_analysis.partner_profile = null;
    }
  }
  
  // S등급: 전체 (필터링 없음)
  
  // reading_info에 표시 등급 반영
  if (filtered.reading_info) {
    filtered.reading_info.grade = purchasedGrade;
  }
  if (filtered.convergence) {
    filtered.convergence.grade = purchasedGrade;
  }
  
  return filtered;
}

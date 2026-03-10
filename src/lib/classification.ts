
export type Category = "연애" | "재회" | "사업" | "직업" | "금전" | "종합";
export type Intent = "연애 시작" | "짝사랑" | "썸" | "관계 지속" | "결혼" | "재회" | "연락 재개" | "전연인 소식" | "이직" | "창업" | "투자" | "기타";
export type Tone = "불안형" | "확신형" | "결단형" | "평온형";
export type AnalysisMode = "tarot_focus" | "saju_tarot_combined";

export interface ClassificationResult {
  category: Category;
  intent: Intent;
  tone: Tone;
  confidence: number;
  mode: AnalysisMode;
}

function normalize(s: string) {
  return s.replace(/[\s\?\!\.\,]+/g, '').toLowerCase();
}

const KEYWORDS: Record<Exclude<Category, "종합">, string[]> = {
  "재회": [
    "헤어진", "재회", "다시만나", "연락다시", "돌아올", "전남친", "전여친", "재결합", "다시사귈", "연락올까", "다시시작", 
    "잊었을까", "미련", "차단", "후폭풍", "기다려", "그리워", "보고싶어", "다시할수", "전애인", "다시연락", "다시만날", "연락할까요", "잊으려고", "연락끊긴", "재회가능성"
  ],
  "연애": [
    "연애", "애인", "남친", "여친", "좋아하는", "썸", "고백", "연애운", "사귀게될까", "만날사람", "짝사랑", "소개팅", 
    "인연", "데이트", "사랑", "결혼", "솔로", "연인", "호감", "설레", "마음", "상대방", "속마음", "사이가", "오래갈까", "상견례", 
    "나타날까", "언제쯤", "잘될까", "운명", "친해질", "포기", "무슨사이", "권태기", "화해", "아이를", "부모님", "행복", "신뢰", "회복", "감정", "동갑", "연상", "연하", "다가가", "변화", "미래"
  ],
  "사업": [
    "사업", "창업", "가게", "매출", "장사", "투자", "사업운", "사업시작", "창업시기", "동업", "CEO", "브랜드", "가맹점", 
    "거래처", "수익", "운영", "확장", "폐업", "매장"
  ],
  "직업": [
    "취업", "이직", "직장", "회사", "직업운", "커리어", "직장운", "직장이동", "퇴사", "합격", "면접", "적성", "승진", 
    "시험", "직무", "업무", "동료", "직원"
  ],
  "금전": [
    "돈", "재물", "금전운", "투자", "돈복", "재물운", "돈들어올", "로또", "당첨", "빚", "청산", "재테크", "자산", 
    "수입", "지출", "경제", "부자"
  ]
};

const INTENT_MAP_COMPLEX: { intent: Intent; keywords: string[] }[] = [
  { intent: "결혼", keywords: ["결혼", "상견례", "식장", "배우자", "아이를", "부모님"] },
  { intent: "짝사랑", keywords: ["짝사랑", "생각하고있을까", "친해질", "포기하는게", "먼저연락해도", "좋아할까", "다가가"] },
  { intent: "썸", keywords: ["썸", "고백받을까", "연인으로발전", "무슨사이", "데이트분위기", "확실한사이"] },
  { intent: "관계 지속", keywords: ["오래갈까", "깊어질까", "권태기", "앞으로의미래", "관계에변화", "관계를", "감정", "신뢰", "행복"] },
  { intent: "연애 시작", keywords: ["연애", "사귀게", "인연", "솔로", "소개팅", "나타날까", "언제쯤", "연애하게", "만날수", "동갑", "연상", "연하"] },
  { intent: "연락 재개", keywords: ["연락", "차단", "안부문자", "먼저연락", "문자", "카톡"] },
  { intent: "전연인 소식", keywords: ["전남친", "전여친", "전애인", "마주칠까", "소식궁금", "사진다시"] },
  { intent: "재회", keywords: ["재회", "다시", "헤어진", "돌아올", "재결합", "다시만나", "다시시작"] },
  { intent: "이직", keywords: ["이직", "취업", "퇴사", "점프", "직장이동", "승진", "면접", "합격"] },
  { intent: "창업", keywords: ["창업", "사업시작", "가게", "매장", "오픈", "동업", "프랜차이즈"] },
  { intent: "투자", keywords: ["투자", "매출", "수익", "재테크", "로또", "당첨", "돈들어올"] }
];

/**
 * 1차 분류: 키워드 기반
 */
function keywordClassifier(q: string): { category: Category; confidence: number; intent: Intent } {
  const text = normalize(q);
  let bestCategory: Category = "종합";
  let maxMatches = 0;
  const scores: Record<string, number> = {};

  for (const [cat, keywords] of Object.entries(KEYWORDS)) {
    let matches = 0;
    keywords.forEach(kw => {
      if (text.includes(normalize(kw))) matches++;
    });
    scores[cat] = matches;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = cat as Category;
    }
  }

  // Business logic for ties and overlaps
  if (scores["재회"] > 0 && (text.includes("다시") || text.includes("전") || text.includes("헤어진") || text.includes("재회"))) {
    bestCategory = "재회";
  } else if (scores["연애"] > 0 && text.includes("결혼")) {
    bestCategory = "연애"; // Marriage beats money/general
  } else if (scores["연애"] > 0 && scores["금전"] > 0 && text.includes("연애")) {
     bestCategory = "연애";
  }

  // Improved intent matching
  let bestIntent: Intent = "기타";
  let maxIntentMatches = 0;
  for (const item of INTENT_MAP_COMPLEX) {
    let matches = 0;
    item.keywords.forEach(kw => {
      if (text.includes(normalize(kw))) matches++;
    });
    if (matches > maxIntentMatches) {
      maxIntentMatches = matches;
      bestIntent = item.intent;
    }
  }

  const confidence = maxMatches > 0 ? Math.min(0.99, 0.58 + (maxMatches * 0.15)) : 0;

  return { category: bestCategory, confidence, intent: bestIntent };
}

/**
 * 2차 분류: LLM 보점 (Simulation)
 */
async function llmClassifier(q: string): Promise<{ category: Category; intent: Intent }> {
  const text = normalize(q);
  let category: Category = "종합";
  let intent: Intent = "기타";

  if (text.match(/다시|연락|전|헤어|이별|재회|미련|차단/)) {
    category = "재회";
    intent = text.includes("연락") ? "연락 재개" : "재회";
  } else if (text.match(/사랑|결혼|썸|사람|연애|남친|여친|누구|인연|좋아하|맞을까|관계|행복|다가가/)) {
    category = "연애";
    if (text.includes("결혼")) intent = "결혼";
    else if (text.includes("썸")) intent = "썸";
    else if (text.includes("짝사랑") || text.includes("좋아하")) intent = "짝사랑";
    else intent = "연애 시작";
  } else if (text.match(/일|직장|회사|취업|합격|승진|커리어/)) {
    category = "직업";
    intent = "이직";
  } else if (text.match(/사업|장사|가게|창업|매출/)) {
    category = "사업";
    intent = "창업";
  } else if (text.match(/돈|재물|투자|금전|로또/)) {
    category = "금전";
    intent = "투자";
  }

  return { category, intent };
}

export async function classifyQuestion(q: string): Promise<ClassificationResult> {
  const { category: kCat, confidence: kConf, intent: kInt } = keywordClassifier(q);
  let category = kCat;
  let intent = kInt;
  let confidence = kConf;

  // Confidence is low or category is general -> Try LLM (refined logic)
  if (confidence < 0.73 || category === "종합") {
    const refined = await llmClassifier(q);
    if (category === "종합" || confidence < 0.6) {
      category = refined.category;
      intent = refined.intent;
      confidence = 0.88; 
    }
  }

  if (intent === "기타") {
    if (category === "재회") intent = "재회";
    else if (category === "연애") intent = "연애 시작";
    else if (category === "사업") intent = "창업";
    else if (category === "직업") intent = "이직";
    else if (category === "금전") intent = "투자";
  }

  let tone: Tone = "평온형";
  if (q.match(/제발|어떡하죠|불안|걱정|전전긍긍|떨려요|힘들어요|보고있어|보구싶|답답해/)) tone = "불안형";
  else if (q.match(/할까요|마음|확신|결정|어떻게|언제|궁금/)) tone = "확신형";
  else if (q.match(/했다|그만|정리|끝|차단/)) tone = "결단형";

  const mode: AnalysisMode = q.length < 20 ? "tarot_focus" : "saju_tarot_combined";

  return {
    category,
    intent,
    tone,
    confidence,
    mode
  };
}

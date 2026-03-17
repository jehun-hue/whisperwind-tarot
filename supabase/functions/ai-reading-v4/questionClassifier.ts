// questionClassifier.ts
// #91 — 질문 유형 자동 분류기

export interface ClassificationResult {
  primary_topic: string;
  secondary_topic: string | null;
  subtopic: string | null;
  sub_topics: string[];          // B-141: 멀티토픽 배열
  confidence: number;
  all_scores: Record<string, number>;
  language: string;
  question_length: number;
  is_multi_topic: boolean;       // B-141: 복합 질문 여부
  primary_category: string;      // B-141: 상위 카테고리
}

// ── 주제별 키워드 ─────────────────────────────────────────────────
const TOPIC_KEYWORDS: Record<string, string[]> = {
  career: [
    "직장", "직업", "이직", "취업", "승진", "사업", "창업", "커리어",
    "일", "업무", "회사", "직무", "연봉", "이직운", "취업운", "사업운",
    "직장운", "진로", "퇴직", "프리랜서", "부업", "투잡", "창업운",
    "사장", "대표", "임원", "팀장", "계약직", "정규직", "취준", "면접",
    "합격", "불합격", "이력서", "포트폴리오", "스펙", "자격증", "시험",
    "공무원", "대기업", "중소기업", "스타트업", "재취업", "명퇴", "권고사직"
  ],
  relationship: [
    "연애", "사랑", "남자친구", "여자친구", "남친", "여친", "결혼",
    "이별", "헤어짐", "재회", "짝사랑", "소개팅", "썸", "고백",
    "관계", "애인", "파트너", "배우자", "남편", "아내", "연인",
    "데이트", "첫만남", "인연", "궁합", "결혼운", "연애운",
    "좋아하는", "좋아하는 사람", "그 사람", "전남친", "전여친", "전 남자친구",
    "전 여자친구", "복잡한 관계", "삼각관계", "양다리", "바람", "외도",
    "이혼", "별거", "화해", "만남", "호감", "연락", "문자", "카톡"
  ],
  money: [
    "돈", "재물", "재정", "투자", "주식", "부동산", "수입", "지출",
    "빚", "대출", "저축", "재테크", "금전", "횡재", "손실", "이익",
    "재물운", "금전운", "경제", "월급", "보너스", "수익", "매출",
    "비용", "예산", "자산", "부채", "코인", "펀드", "적금", "보험",
    "계약", "거래", "장사", "가게", "임대", "전세", "월세", "매매",
    "경매", "분양", "청약", "대박", "로또", "복권", "재산"
  ],
  life_change: [
    "이사", "이민", "유학", "전학", "변화", "전환점", "결정", "선택",
    "갈림길", "새출발", "시작", "끝", "마무리", "도전", "모험",
    "변신", "전직", "이전", "이동", "방향", "미래", "운명", "팔자",
    "해외", "귀국", "한국", "외국", "abroad", "돌아가", "돌아오",
    "이주", "정착", "비자", "영주권", "이민가", "떠나", "귀향",
    "고향", "타지", "타향", "해외생활", "외국생활", "귀환",
    "독립", "자취", "분가", "집을 나가", "새 집", "새집", "인생"
  ],
  migration: [
    "이민", "해외이주", "이주", "영주권", "비자", "해외정착", "외국이민",
    "미국이민", "캐나다이민", "호주이민", "유럽이민", "이민가", "이민갈까",
    "해외에서 살", "외국에서 살", "이민생활", "타국", "이민준비",
    "해외취업", "워킹홀리데이", "워홀", "주재원", "해외발령",
    "국적", "시민권", "귀화", "이중국적", "해외 생활", "해외 이사"
  ],
  health: [
    "건강", "병", "질병", "치료", "수술", "몸", "컨디션", "피로",
    "스트레스", "정신건강", "우울", "불안", "체력", "다이어트",
    "운동", "건강운", "회복", "완치", "검사", "병원", "의사",
    "약", "처방", "통증", "아프", "허리", "두통", "소화", "수면",
    "불면", "식욕", "체중", "비만", "임신", "출산", "유산", "난임"
  ],
  family: [
    "가족", "부모", "자녀", "아이", "아들", "딸", "엄마", "아빠",
    "형제", "자매", "시댁", "처가", "고부갈등", "육아", "임신",
    "출산", "임신운", "가정", "집안", "형제운", "부모운", "자녀운",
    "시어머니", "장모", "장인", "시아버지", "며느리", "사위",
    "손자", "손녀", "할머니", "할아버지", "친척", "명절", "제사",
    "상속", "유언", "노부모", "간병", "돌봄", "보육"
  ]
};

// ── 서브토픽 키워드 ───────────────────────────────────────────────
const SUBTOPIC_KEYWORDS: Record<string, string[]> = {
  job_change:      ["이직", "이직운", "회사 옮기", "직장 바꾸", "이직할까"],
  promotion:       ["승진", "승진운", "진급", "팀장", "임원"],
  business_start:  ["창업", "창업운", "사업 시작", "가게", "사장"],
  reunion:         ["재회", "다시 만나", "돌아올까", "연락올까", "다시 볼 수 있", "돌아오", "복합", "재결합"],
  breakup:         ["이별", "헤어짐", "헤어질까", "끝날까", "이별운"],
  marriage:        ["결혼", "결혼운", "혼인", "프러포즈", "결혼할까"],
  investment:      ["투자", "주식", "부동산", "코인", "투자운"],
  moving:          ["이사", "이사운", "이전", "집 구하기", "이사할까"],
  pregnancy:       ["임신", "임신운", "출산", "아이", "임신할까"],
  study_abroad:    ["유학", "해외", "어학연수", "외국", "유학운"]
};

// ── 시스템별 집중 분석 포인트 ─────────────────────────────────────
export const TOPIC_SYSTEM_FOCUS: Record<string, Record<string, string[]>> = {
  career: {
    saju:      ["관성", "식상", "재성", "일간강약"],
    ziwei:     ["관록궁", "재백궁", "천이궁"],
    astrology: ["10하우스", "6하우스", "토성트랜짓"],
    tarot:     ["career", "growth", "stability"]
  },
  relationship: {
    saju:      ["관성", "재성", "도화살", "배우자궁"],
    ziwei:     ["부처궁", "복덕궁", "명궁"],
    astrology: ["7하우스", "5하우스", "금성트랜짓"],
    tarot:     ["emotion", "relationship", "transition"]
  },
  money: {
    saju:      ["재성", "편재", "정재", "식신"],
    ziwei:     ["재백궁", "복덕궁"],
    astrology: ["2하우스", "8하우스", "목성트랜짓"],
    tarot:     ["money", "stability", "growth"]
  },
  life_change: {
    saju:      ["대운전환", "세운충형", "신살"],
    ziwei:     ["천이궁", "명궁", "대한전환"],
    astrology: ["1하우스", "사투른리턴", "명왕성트랜짓"],
    tarot:     ["transition", "risk", "growth"]
  },
  health: {
    saju:      ["일간오행", "질병신", "인수"],
    ziwei:     ["질액궁", "복덕궁"],
    astrology: ["6하우스", "12하우스", "화성트랜짓"],
    tarot:     ["health", "stability", "emotion"]
  },
  family: {
    saju:      ["인수", "관성", "재성", "자녀궁"],
    ziwei:     ["부처궁", "자녀궁", "부모궁"],
    astrology: ["4하우스", "5하우스", "달트랜짓"],
    tarot:     ["emotion", "stability", "relationship"]
  }
};

// ── 분류 함수 ─────────────────────────────────────────────────────
export function classifyQuestion(question: string): ClassificationResult {
  if (!question || question.trim().length === 0) {
    return {
      primary_topic: "general_future",
      secondary_topic: null,
      subtopic: null,
      sub_topics: [],
      confidence: 0,
      all_scores: {},
      language: "ko",
      question_length: 0,
      is_multi_topic: false,
      primary_category: "general"
    };
  }

  const q = question.toLowerCase();
  const scores: Record<string, number> = {};

  // 각 주제 점수 계산
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const matches = keywords.filter(kw => q.includes(kw));
    scores[topic] = matches.length;
  }

  // 총 매칭 수
  const totalMatches = Object.values(scores).reduce((a, b) => a + b, 0);

  // 1위 주제
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [primaryTopic, primaryScore] = sorted[0];
  const [secondaryTopic, secondaryScore] = sorted[1] ?? ["general_future", 0];

  // 신뢰도: 1위 점수 / 전체 매칭
  const confidence = totalMatches > 0
    ? parseFloat((primaryScore / totalMatches).toFixed(2))
    : 0;

  // 주제 없으면 general_future
  const finalPrimary = primaryScore === 0 ? "general_future" : primaryTopic;
  const finalSecondary = (secondaryScore > 0 && secondaryTopic !== finalPrimary)
    ? secondaryTopic
    : null;

  // 서브토픽 감지
  let subtopic: string | null = null;
  for (const [sub, keywords] of Object.entries(SUBTOPIC_KEYWORDS)) {
    if (keywords.some(kw => q.includes(kw))) {
      subtopic = sub;
      break;
    }
  }

  // B-141: 멀티토픽 배열 및 카테고리 구성
  const subTopics: string[] = [];
  if (finalSecondary) subTopics.push(finalSecondary);
  if (subtopic) subTopics.push(subtopic);

  // 상위 카테고리 매핑
  const CATEGORY_MAP: Record<string, string> = {
    career: "life_work", relationship: "life_love", money: "life_wealth",
    life_change: "life_transition", migration: "life_transition",
    health: "life_wellbeing", family: "life_family", general_future: "general"
  };

  return {
    primary_topic: finalPrimary,
    secondary_topic: finalSecondary,
    subtopic,
    sub_topics: subTopics,
    confidence,
    all_scores: scores,
    language: "ko",
    question_length: question.length,
    is_multi_topic: subTopics.length > 0,
    primary_category: CATEGORY_MAP[finalPrimary] ?? "general",
  };
}

// ── Gemini 폴백 분류 (#91-b) ──────────────────────────────────────
export async function classifyWithFallback(
  question: string,
  apiKey: string
): Promise<ClassificationResult> {
  const ruleResult = classifyQuestion(question);

  // 복합 질문 감지: 1위와 2위 점수 차이가 작으면 dual_topic 처리
  const scores = ruleResult.all_scores;
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [primaryTopic, primaryScore] = sorted[0] ?? ["general_future", 0];
  const [secondaryTopic, secondaryScore] = sorted[1] ?? ["general_future", 0];

  // 두 주제 점수가 모두 1 이상이고 차이가 1 이하면 복합 질문
  const isDualTopic = primaryScore >= 1 && secondaryScore >= 1 && (primaryScore - secondaryScore) <= 1;

  if (isDualTopic && ruleResult.secondary_topic) {
    return {
      ...ruleResult,
      confidence: Math.min(ruleResult.confidence + 0.1, 1.0),
    };
  }

  // 신뢰도 0.5 이상이면 룰 기반 결과 사용
  if (ruleResult.confidence >= 0.5) return ruleResult;

  // 신뢰도 낮으면 Gemini AI 폴백
  try {
    const prompt = `다음 질문의 주제를 분류해주세요. career, relationship, money, life_change, health, family, general_future 중 최대 2개를 JSON으로 반환하세요. 복합 질문이면 두 개 모두 반환하세요.
질문: "${question}"
응답 형식: {"primary_topic": "career", "secondary_topic": "relationship"}`;

    console.log("[MODEL]", { task: "분류기", model: "gemini-2.5-flash" });
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const match = text.match(/\{.*\}/s);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.primary_topic) {
        const CATEGORY_MAP: Record<string, string> = {
          career: "life_work", relationship: "life_love", money: "life_wealth",
          life_change: "life_transition", migration: "life_transition",
          health: "life_wellbeing", family: "life_family", general_future: "general"
        };
        const updatedSubTopics = [...ruleResult.sub_topics];
        if (parsed.secondary_topic && !updatedSubTopics.includes(parsed.secondary_topic)) {
          updatedSubTopics.push(parsed.secondary_topic);
        }
        return {
          ...ruleResult,
          primary_topic: parsed.primary_topic,
          secondary_topic: parsed.secondary_topic || ruleResult.secondary_topic,
          sub_topics: updatedSubTopics,
          confidence: 0.75,
          is_multi_topic: updatedSubTopics.length > 0,
          primary_category: CATEGORY_MAP[parsed.primary_topic] ?? "general",
        };
      }
    }
  } catch (_) {}

  return ruleResult;
}

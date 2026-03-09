export type Locale = "kr" | "jp" | "us";

export interface QuestionOption {
  label: string;
  value: string;
  emoji: string;
}

export interface LocaleConfig {
  locale: Locale;
  lang: string;
  // Header
  siteTitle: string;
  siteSubtitle: string;
  siteDescription: string;
  // Steps
  stepLabels: string[];
  // Question step
  questionTitle: string;
  questionSubtitle: string;
  questionPlaceholder: string;
  memoPlaceholder: string;
  questionTypes: QuestionOption[];
  nextButton: string;
  // Birth info
  birthTitle: string;
  birthSubtitle: string;
  nameLabel: string;
  namePlaceholder: string;
  genderLabel: string;
  genderOptions: { male: string; female: string };
  birthDateLabel: string;
  birthTimeLabel: string;
  birthTimePlaceholder: string;
  birthPlaceLabel: string;
  birthPlacePlaceholder: string;
  calendarToggle: { solar: string; lunar: string };
  birthSubmitButton: string;
  birthSkipButton: string;
  // Card selection
  cardSelectTitle: string;
  cardSelectSubtitle: string;
  cardPositions: string[];
  suitLabels: Record<string, string>;
  submitButton: string;
  // Completion screen (after card selection)
  completionTitle: string;
  completionMessage: string;
  completionSubMessage: string;
  // Result
  loadingTitle: string;
  loadingSubtitle: string;
  errorTitle: string;
  resetButton: string;
  confidenceLabel: string;
  // Score labels
  scoreLabels: {
    tarot: string;
    saju: string;
    astrology: string;
    ziwei: string;
    overall: string;
  };
  // Section titles for reading result
  sectionTitles: {
    conclusion: string;
    tarotAnalysis: string;
    emotionFlow?: string;
    sajuAnalysis: string;
    astrologyAnalysis: string;
    ziweiAnalysis: string;
    crossValidation: string;
    risk: string;
    advice: string;
    energySummary?: string;
    guidance?: string;
  };
  // Auto-classify label
  classifyLabel: (type: string) => string;
  // Theme
  themeClass: string;
  fontImport: string;
  bodyFont: string;
  displayFont: string;
  // Which analyses to show prominently
  showSaju: boolean;
  showZiwei: boolean;
  showEmotionFlow: boolean;
}

export const localeConfigs: Record<Locale, LocaleConfig> = {
  kr: {
    locale: "kr",
    lang: "ko",
    siteTitle: "AI 통합 점술 상담",
    siteSubtitle: "divination reading",
    siteDescription: "타로 + 사주 교차 검증으로 깊이 있는 리딩을 제공합니다\n고요히 마음을 가다듬고, 직감이 이끄는 대로 진행하세요.",
    stepLabels: ["질문", "출생정보", "카드선택", "결과"],
    questionTitle: "어떤 것이 궁금하신가요?",
    questionSubtitle: "마음속 질문을 자유롭게 적어주세요",
    questionPlaceholder: "예: 그 사람에게 다시 연락이 올까요?",
    memoPlaceholder: "상황을 자세히 적어주시면 더 정확한 리딩이 가능합니다",
    questionTypes: [
      { label: "💕 연애", value: "love", emoji: "💕" },
      { label: "💼 직업", value: "career", emoji: "💼" },
      { label: "💰 금전", value: "money", emoji: "💰" },
      { label: "🔮 종합", value: "general", emoji: "🔮" },
    ],
    nextButton: "다음 단계로",
    birthTitle: "출생 정보 입력",
    birthSubtitle: "사주 분석을 위해 출생 정보를 입력해주세요",
    genderLabel: "성별",
    genderOptions: { male: "👨 남성", female: "👩 여성" },
    birthDateLabel: "생년월일",
    birthTimeLabel: "출생 시간",
    birthTimePlaceholder: "모르면 비워두세요",
    birthPlaceLabel: "출생지",
    birthPlacePlaceholder: "예: 서울, 부산 (선택사항)",
    calendarToggle: { solar: "양력", lunar: "음력" },
    birthSubmitButton: "✦ 사주 분석 포함하여 진행",
    birthSkipButton: "건너뛰고 타로만 진행",
    cardSelectTitle: "카드를 선택하세요",
    cardSelectSubtitle: "마음이 끌리는 카드를 직감적으로 3장 고르세요",
    cardPositions: ["현재 상황", "핵심 문제", "결과/방향"],
    suitLabels: {
      all: "전체 78장",
      "Major Arcana": "메이저 아르카나",
      Wands: "완드",
      Cups: "컵",
      Swords: "검",
      Pentacles: "펜타클",
    },
    submitButton: "카드 선택 완료",
    completionTitle: "카드 선택이 완료되었습니다 ✦",
    completionMessage: "선택하신 카드를 기반으로 전문 상담사가\n정성껏 분석하여 결과를 전달해 드리겠습니다.",
    completionSubMessage: "분석이 완료되면 별도로 안내해 드립니다.\n잠시만 기다려 주세요.",
    loadingTitle: "AI가 분석 중입니다...",
    loadingSubtitle: "타로 + 사주 + 점성술 + 자미두수 교차 검증 리딩을 생성하고 있습니다",
    errorTitle: "분석 중 오류 발생",
    resetButton: "새 상담 시작하기",
    confidenceLabel: "신뢰도",
    scoreLabels: {
      tarot: "타로 분석",
      saju: "사주 분석",
      astrology: "점성술 분석",
      ziwei: "자미두수 분석",
      overall: "종합 신뢰도",
    },
    sectionTitles: {
      conclusion: "✦ 최종 결론",
      tarotAnalysis: "🃏 타로 분석",
      sajuAnalysis: "🔮 사주 분석",
      astrologyAnalysis: "⭐ 점성술 분석",
      ziweiAnalysis: "🏯 자미두수 분석",
      crossValidation: "⚖️ 교차 검증",
      risk: "⚠️ 리스크",
      advice: "💡 현실 조언",
    },
    classifyLabel: (type) =>
      type === "love" ? "💕 연애" : type === "career" ? "💼 직업" : type === "money" ? "💰 금전" : "🔮 종합",
    themeClass: "theme-kr",
    fontImport: "",
    bodyFont: "'Noto Sans KR', sans-serif",
    displayFont: "'Cormorant Garamond', serif",
    showSaju: true,
    showZiwei: true,
    showEmotionFlow: false,
  },

  jp: {
    locale: "jp",
    lang: "ja",
    siteTitle: "AI占いリーディング",
    siteSubtitle: "tarot reading",
    siteDescription: "タロット＋西洋占星術を中心に、あなたの心に寄り添うリーディングをお届けします。\n静かに心を落ち着けて、直感に従ってください。",
    stepLabels: ["質問", "生年月日", "カード選択", "結果"],
    questionTitle: "何について知りたいですか？",
    questionSubtitle: "心の中の質問を自由にお書きください",
    questionPlaceholder: "例：あの人は私のことをどう思っていますか？",
    memoPlaceholder: "状況を詳しく書いていただくと、より正確なリーディングが可能です",
    questionTypes: [
      { label: "💕 恋愛", value: "love", emoji: "💕" },
      { label: "💭 あの人の気持ち", value: "feelings", emoji: "💭" },
      { label: "🔄 復縁", value: "reunion", emoji: "🔄" },
      { label: "💫 今後の関係", value: "relationship", emoji: "💫" },
      { label: "💼 仕事", value: "career", emoji: "💼" },
      { label: "🔀 転職", value: "jobchange", emoji: "🔀" },
      { label: "💰 金運", value: "money", emoji: "💰" },
      { label: "🌊 人生の流れ", value: "life", emoji: "🌊" },
    ],
    nextButton: "次のステップへ",
    birthTitle: "生年月日の入力",
    birthSubtitle: "より深いリーディングのために生年月日をご入力ください",
    genderLabel: "性別",
    genderOptions: { male: "👨 男性", female: "👩 女性" },
    birthDateLabel: "生年月日",
    birthTimeLabel: "出生時刻",
    birthTimePlaceholder: "不明な場合は空欄で",
    birthPlaceLabel: "出生地",
    birthPlacePlaceholder: "例：東京、大阪（任意）",
    calendarToggle: { solar: "新暦", lunar: "旧暦" },
    birthSubmitButton: "✦ 詳細分析を含めて進む",
    birthSkipButton: "スキップしてタロットのみで進む",
    cardSelectTitle: "カードを選んでください",
    cardSelectSubtitle: "心が惹かれるカードを直感で3枚選んでください",
    cardPositions: ["現在のエネルギー", "相手の気持ち", "これからの流れ"],
    suitLabels: {
      all: "全78枚",
      "Major Arcana": "大アルカナ",
      Wands: "ワンド",
      Cups: "カップ",
      Swords: "ソード",
      Pentacles: "ペンタクル",
    },
    submitButton: "カード選択完了",
    completionTitle: "カード選択が完了しました ✦",
    completionMessage: "選んでいただいたカードをもとに、専門の鑑定師が\n丁寧に分析し、結果をお届けいたします。",
    completionSubMessage: "分析が完了次第、ご案内いたします。\n少々お待ちください。",
    loadingTitle: "AIが分析中です...",
    loadingSubtitle: "タロット＋占星術を組み合わせたリーディングを作成しています",
    errorTitle: "分析中にエラーが発生しました",
    resetButton: "新しい相談を始める",
    confidenceLabel: "信頼度",
    scoreLabels: {
      tarot: "タロット分析",
      saju: "内部分析",
      astrology: "占星術分析",
      ziwei: "内部検証",
      overall: "総合信頼度",
    },
    sectionTitles: {
      conclusion: "✦ 総合メッセージ",
      tarotAnalysis: "🃏 タロットメッセージ",
      emotionFlow: "💫 感情の流れ",
      sajuAnalysis: "",
      astrologyAnalysis: "⭐ 占星術の影響",
      ziweiAnalysis: "",
      crossValidation: "",
      risk: "⚠️ 注意点",
      advice: "💡 アドバイス",
    },
    classifyLabel: (type) => {
      const map: Record<string, string> = {
        love: "💕 恋愛",
        feelings: "💭 気持ち",
        reunion: "🔄 復縁",
        relationship: "💫 関係",
        career: "💼 仕事",
        jobchange: "🔀 転職",
        money: "💰 金運",
        life: "🌊 人生",
        general: "🔮 総合",
      };
      return map[type] || "🔮 総合";
    },
    themeClass: "theme-jp",
    fontImport: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700&family=Shippori+Mincho:wght@400;600&display=swap",
    bodyFont: "'Noto Sans JP', sans-serif",
    displayFont: "'Shippori Mincho', serif",
    showSaju: false,
    showZiwei: false,
    showEmotionFlow: true,
  },

  us: {
    locale: "us",
    lang: "en",
    siteTitle: "AI Spiritual Reading",
    siteSubtitle: "cosmic guidance",
    siteDescription: "Tarot + Astrology combined for a deeply intuitive spiritual reading.\nClear your mind, trust your intuition, and let the universe guide you.",
    stepLabels: ["Question", "Birth Info", "Card Selection", "Reading"],
    questionTitle: "What would you like guidance on?",
    questionSubtitle: "Share what's on your mind and heart",
    questionPlaceholder: "e.g., Will they reach out to me again?",
    memoPlaceholder: "Share more details about your situation for a deeper reading",
    questionTypes: [
      { label: "💕 Love & Relationships", value: "love", emoji: "💕" },
      { label: "📱 Will they contact me?", value: "contact", emoji: "📱" },
      { label: "💼 Career & Work", value: "career", emoji: "💼" },
      { label: "💰 Money & Abundance", value: "money", emoji: "💰" },
      { label: "🌟 Life Path", value: "life", emoji: "🌟" },
      { label: "✨ Spiritual Message", value: "spiritual", emoji: "✨" },
    ],
    nextButton: "Continue",
    birthTitle: "Birth Information",
    birthSubtitle: "Enter your birth details for a deeper astrological reading",
    genderLabel: "Gender",
    genderOptions: { male: "👨 Male", female: "👩 Female" },
    birthDateLabel: "Date of Birth",
    birthTimeLabel: "Time of Birth",
    birthTimePlaceholder: "Leave blank if unknown",
    birthPlaceLabel: "Place of Birth",
    birthPlacePlaceholder: "e.g., New York, Los Angeles (optional)",
    calendarToggle: { solar: "Solar", lunar: "Lunar" },
    birthSubmitButton: "✦ Continue with Full Analysis",
    birthSkipButton: "Skip — Tarot Only",
    cardSelectTitle: "Choose Your Cards",
    cardSelectSubtitle: "Trust your intuition and select 3 cards that call to you",
    cardPositions: ["Current Energy", "Core Challenge", "Outcome"],
    suitLabels: {
      all: "All 78 Cards",
      "Major Arcana": "Major Arcana",
      Wands: "Wands",
      Cups: "Cups",
      Swords: "Swords",
      Pentacles: "Pentacles",
    },
    submitButton: "Complete Card Selection",
    completionTitle: "Your cards have been selected ✦",
    completionMessage: "A professional reader will carefully analyze your selected cards\nand deliver a personalized reading to you.",
    completionSubMessage: "You'll be notified once your reading is ready.\nPlease allow a moment.",
    loadingTitle: "The universe is speaking...",
    loadingSubtitle: "Creating your personalized Tarot + Astrology reading",
    errorTitle: "Something went wrong",
    resetButton: "Start a New Reading",
    confidenceLabel: "Confidence",
    scoreLabels: {
      tarot: "Tarot Analysis",
      saju: "Internal Analysis",
      astrology: "Astrology Analysis",
      ziwei: "Internal Validation",
      overall: "Overall Confidence",
    },
    sectionTitles: {
      conclusion: "✦ Energy Summary",
      tarotAnalysis: "🃏 Tarot Insight",
      energySummary: "🌟 Energy Reading",
      sajuAnalysis: "",
      astrologyAnalysis: "⭐ Astrological Influence",
      ziweiAnalysis: "",
      crossValidation: "",
      risk: "⚠️ Watch Out For",
      advice: "💡 Guidance",
    },
    classifyLabel: (type) => {
      const map: Record<string, string> = {
        love: "💕 Love",
        contact: "📱 Contact",
        career: "💼 Career",
        money: "💰 Money",
        life: "🌟 Life Path",
        spiritual: "✨ Spiritual",
        general: "🔮 General",
      };
      return map[type] || "🔮 General";
    },
    themeClass: "theme-us",
    fontImport: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap",
    bodyFont: "'Inter', sans-serif",
    displayFont: "'Playfair Display', serif",
    showSaju: false,
    showZiwei: false,
    showEmotionFlow: false,
  },
};

// Japanese card names mapping
export const jpCardNames: Record<number, string> = {
  0: "愚者", 1: "魔術師", 2: "女教皇", 3: "女帝", 4: "皇帝",
  5: "教皇", 6: "恋人", 7: "戦車", 8: "力", 9: "隠者",
  10: "運命の輪", 11: "正義", 12: "吊るされた男", 13: "死神",
  14: "節制", 15: "悪魔", 16: "塔", 17: "星", 18: "月",
  19: "太陽", 20: "審判", 21: "世界",
};

export function getCardDisplayName(card: { id: number; name: string; korean: string }, locale: Locale): string {
  if (locale === "kr") return card.korean;
  if (locale === "jp") return jpCardNames[card.id] || card.name;
  return card.name;
}

export function getCardDirectionLabel(isReversed: boolean, locale: Locale): { label: string; short: string } {
  if (locale === "kr") return isReversed ? { label: "역방향", short: "역" } : { label: "정방향", short: "정" };
  if (locale === "jp") return isReversed ? { label: "逆位置", short: "逆" } : { label: "正位置", short: "正" };
  return isReversed ? { label: "Reversed", short: "Rev" } : { label: "Upright", short: "Up" };
}

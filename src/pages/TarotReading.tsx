import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shuffle, Sparkles, RotateCcw, Eye, EyeOff } from "lucide-react";

const CARD_BACK = "✦";

interface TarotCardBase {
  id: number;
  name: string;
  korean: string;
  suit: string;
  keywords: string[];
  upright: string;
  reversedMeaning: string;
  love: string;
  career: string;
  money: string;
  short: string;
}

interface DeckCard extends TarotCardBase {
  isPicked: boolean;
  revealed: boolean;
  isReversed: boolean;
}

const tarotCards: TarotCardBase[] = [
  { id: 0, name: "The Fool", korean: "바보", suit: "Major Arcana", keywords: ["새로운 시작", "충동", "순수함", "도전"], upright: "새 출발의 흐름입니다. 아직 모든 조건이 완벽하지 않아도 움직일 때 길이 열리는 카드입니다.", reversedMeaning: "충동적 선택, 준비 부족, 현실 감각의 약화를 경고합니다.", love: "연애에서는 새로운 인연 또는 관계의 리셋 가능성이 큽니다.", career: "일에서는 새로운 제안, 이직, 사이드 프로젝트의 시작에 유리합니다.", money: "돈 흐름은 새는 구간과 새 기회를 동시에 보여줍니다." },
  { id: 1, name: "The Magician", korean: "마법사", suit: "Major Arcana", keywords: ["실행력", "의지", "설득", "창조"], upright: "원하는 방향으로 현실을 밀어붙일 수 있는 힘이 있습니다.", reversedMeaning: "능력은 있지만 방향이 비틀리기 쉽습니다.", love: "연애에서는 적극적 접근이 통할 수 있습니다.", career: "기획, 협상, 브랜딩, 자기 PR에 매우 강한 흐름입니다.", money: "수익 구조를 직접 설계할 때 강합니다." },
  { id: 2, name: "The High Priestess", korean: "여사제", suit: "Major Arcana", keywords: ["직감", "보류", "내면", "비밀"], upright: "겉으로 보이는 것보다 숨은 정보가 더 중요합니다.", reversedMeaning: "오해, 숨김, 감정 억눌림이 커질 수 있습니다.", love: "연애에서는 상대의 속마음이 쉽게 드러나지 않습니다.", career: "일에서는 내부 정보, 분위기, 타이밍 파악이 핵심입니다.", money: "투자·금전에서는 불투명한 제안에 주의가 필요합니다." },
  { id: 3, name: "The Empress", korean: "여황제", suit: "Major Arcana", keywords: ["풍요", "매력", "관계", "확장"], upright: "자연스럽게 끌어당기는 힘이 강해지는 카드입니다.", reversedMeaning: "과소비, 감정 의존, 편안함에 머무는 흐름을 주의해야 합니다.", love: "연애에서는 호감, 애정 표현, 관계 회복의 흐름이 좋습니다.", career: "브랜드, 미용, 감성 콘텐츠, 사람 상대 일에 강합니다.", money: "돈은 들어오지만 같이 나가기도 쉽습니다." },
  { id: 4, name: "The Emperor", korean: "황제", suit: "Major Arcana", keywords: ["통제", "책임", "구조", "안정"], upright: "흔들리는 상황을 정리하고 기준을 세워야 할 때입니다.", reversedMeaning: "고집, 통제 과잉, 관계 경직이 문제가 될 수 있습니다.", love: "연애에서는 안정 욕구가 강해지지만 표현이 딱딱해질 수 있습니다.", career: "관리, 운영, 리더 역할, 사업 구조 정비에 좋습니다.", money: "장기적으로 안정화할 수 있는 흐름입니다." },
  { id: 5, name: "The Hierophant", korean: "교황", suit: "Major Arcana", keywords: ["전통", "조언", "제도", "신뢰"], upright: "기존 질서 안에서 답을 찾는 카드입니다.", reversedMeaning: "고정관념, 답답한 규칙, 형식만 남은 관계를 의미할 수 있습니다.", love: "연애에서는 진지한 관계, 소개, 결혼 논의와 연결되기 쉽습니다.", career: "공공기관, 교육, 조직생활, 자격 기반 일에 유리합니다.", money: "안정적 관리에는 좋지만 큰 한방과는 거리가 있습니다." },
  { id: 6, name: "The Lovers", korean: "연인", suit: "Major Arcana", keywords: ["선택", "관계", "끌림", "합의"], upright: "마음과 현실 사이의 선택이 중요해지는 카드입니다.", reversedMeaning: "엇갈림, 유혹, 가치관 충돌이 생기기 쉽습니다.", love: "연애 그 자체를 강하게 보여주는 카드입니다.", career: "파트너십, 협업, 공동 프로젝트에 유리합니다.", money: "금전은 사람과의 관계에 영향을 받습니다." },
  { id: 7, name: "The Chariot", korean: "전차", suit: "Major Arcana", keywords: ["돌파", "속도", "의지", "이동"], upright: "밀어붙이면 길이 열리는 카드입니다.", reversedMeaning: "과속, 조급함, 방향 상실을 뜻합니다.", love: "연애에서는 빠른 진전이 가능하지만 감정 속도 차이가 문제될 수 있습니다.", career: "이직, 이동, 프로젝트 추진, 경쟁 상황에서 강합니다.", money: "단기적으로 움직임이 크지만 안정성은 약할 수 있습니다." },
  { id: 8, name: "Strength", korean: "힘", suit: "Major Arcana", keywords: ["인내", "절제", "내면의 힘", "회복"], upright: "강하게 누르기보다 부드럽게 다뤄야 성과가 납니다.", reversedMeaning: "자신감 저하, 피로, 버티는 힘의 약화를 보여줍니다.", love: "연애에서는 참아주는 힘, 관계 회복, 감정 조율이 중요합니다.", career: "일에서는 꾸준함과 평정심이 이깁니다.", money: "수익보다 지출 통제와 회복이 핵심입니다." },
  { id: 9, name: "The Hermit", korean: "은둔자", suit: "Major Arcana", keywords: ["거리", "탐색", "고독", "정리"], upright: "혼자 생각을 정리해야 보이는 것이 있습니다.", reversedMeaning: "지나친 고립, 우울, 판단 지연으로 흐름이 막힐 수 있습니다.", love: "연애에서는 거리감, 잠시 멈춤, 혼자만의 판단이 강해질 수 있습니다.", career: "연구, 분석, 전략 수정에는 좋습니다.", money: "지출 축소, 위험 회피, 혼자 점검하는 시간이 유리합니다." },
  { id: 10, name: "Wheel of Fortune", korean: "운명의 수레바퀴", suit: "Major Arcana", keywords: ["변화", "전환", "기회", "타이밍"], upright: "판이 바뀌는 흐름입니다.", reversedMeaning: "엇박자, 반복 실수, 타이밍 미스를 조심해야 합니다.", love: "연애에서는 재회, 우연한 연결, 갑작스러운 변화 가능성이 큽니다.", career: "기회가 열리지만 준비된 사람만 잡습니다.", money: "수입 변동이 생기기 쉽습니다." },
  { id: 11, name: "Justice", korean: "정의", suit: "Major Arcana", keywords: ["균형", "판단", "계약", "책임"], upright: "감정보다 사실이 중요합니다.", reversedMeaning: "불균형, 억울함, 애매한 관계가 계속될 수 있습니다.", love: "연애에서는 말보다 행동, 감정보다 태도가 중요합니다.", career: "계약, 문서, 협상, 평가에 중요합니다.", money: "금전 문제는 정확한 계산이 필요합니다." },
  { id: 12, name: "The Hanged Man", korean: "매달린 남자", suit: "Major Arcana", keywords: ["정체", "보류", "관점 전환", "희생"], upright: "지금은 억지로 결과를 만들기보다 관점을 바꾸어야 할 때입니다.", reversedMeaning: "무의미한 버팀, 답 없는 기다림, 희생의 반복이 될 수 있습니다.", love: "연애에서는 한쪽만 버티는 관계가 될 수 있습니다.", career: "일은 잠시 묶일 수 있지만, 방향 수정에는 도움이 됩니다.", money: "금전에서는 당장 키우기보다 묶이는 흐름입니다." },
  { id: 13, name: "Death", korean: "죽음", suit: "Major Arcana", keywords: ["종결", "전환", "정리", "재시작"], upright: "끝나야 할 것이 끝나야 다음 흐름이 시작됩니다.", reversedMeaning: "끝내야 할 것을 붙잡아 반복 피로가 생길 수 있습니다.", love: "연애에서는 관계의 형태가 크게 바뀔 수 있습니다.", career: "일에서는 퇴사, 부서 변경, 구조 개편과 관련됩니다.", money: "돈 흐름도 구간이 끊기고 다시 시작됩니다." },
  { id: 14, name: "Temperance", korean: "절제", suit: "Major Arcana", keywords: ["균형", "회복", "조율", "완화"], upright: "극단으로 가지 말고 조정해야 할 때입니다.", reversedMeaning: "과함, 불균형, 생활 리듬 붕괴를 주의해야 합니다.", love: "연애에서는 회복과 조율의 가능성이 있습니다.", career: "협업, 중재, 안정적 운영에 유리합니다.", money: "급등보다 안정 회복형입니다." },
  { id: 15, name: "The Devil", korean: "악마", suit: "Major Arcana", keywords: ["집착", "유혹", "중독", "반복"], upright: "끊기 어려운 패턴, 강한 끌림, 불편하지만 익숙한 구조를 보여줍니다.", reversedMeaning: "묶인 상태에서 벗어나려는 흐름입니다.", love: "연애에서는 집착, 반복 관계, 끌리지만 소모적인 연결을 의미할 수 있습니다.", career: "일에서는 돈은 되지만 지치는 구조를 암시합니다.", money: "지출 습관, 빚, 욕망 소비를 강하게 경고합니다." },
  { id: 16, name: "The Tower", korean: "탑", suit: "Major Arcana", keywords: ["충격", "붕괴", "진실", "해체"], upright: "갑작스러운 깨달음 또는 붕괴를 통해 진실이 드러나는 카드입니다.", reversedMeaning: "이미 흔들리는 구조를 억지로 붙잡는 모습일 수 있습니다.", love: "연애에서는 갑작스러운 다툼, 진실 폭로, 관계 재정립이 올 수 있습니다.", career: "일에서는 예상 밖의 변화, 구조조정 가능성이 있습니다.", money: "큰 지출이나 예기치 못한 변수에 주의가 필요합니다." },
  { id: 17, name: "The Star", korean: "별", suit: "Major Arcana", keywords: ["희망", "회복", "명확성", "치유"], upright: "힘들었던 흐름 이후 다시 숨이 트이는 카드입니다.", reversedMeaning: "희망은 있으나 아직 확신이 부족합니다.", love: "연애에서는 상처 회복, 순한 연결, 관계 개선 가능성이 있습니다.", career: "일에서는 이미지 개선, 장기 비전에 유리합니다.", money: "대박보다는 회복과 안정화 흐름입니다." },
  { id: 18, name: "The Moon", korean: "달", suit: "Major Arcana", keywords: ["불안", "착각", "감정", "미확인"], upright: "보이지 않는 것이 많습니다. 불안과 직감이 동시에 커지는 시기입니다.", reversedMeaning: "혼란이 조금씩 걷히는 흐름입니다.", love: "연애에서는 상대 마음을 단정하기 어렵습니다.", career: "일에서는 정보가 불명확합니다.", money: "금전 흐름이 불안정하거나 숨은 비용이 있을 수 있습니다." },
  { id: 19, name: "The Sun", korean: "태양", suit: "Major Arcana", keywords: ["성공", "명확성", "활력", "호감"], upright: "가장 직관적으로 좋은 카드 중 하나입니다.", reversedMeaning: "좋은 기운은 있으나 기대만큼 빠르게 체감되지 않을 수 있습니다.", love: "연애에서는 호감, 공개, 관계 진전, 밝은 흐름을 의미합니다.", career: "일에서는 성과, 인정, 주목, 홍보 효과가 좋습니다.", money: "돈 흐름도 비교적 좋습니다." },
  { id: 20, name: "Judgement", korean: "심판", suit: "Major Arcana", keywords: ["재평가", "각성", "재기회", "결론"], upright: "과거를 다시 돌아보고 결론을 내려야 할 때입니다.", reversedMeaning: "과거 미해결 문제가 발목을 잡을 수 있습니다.", love: "연애에서는 재회, 재연락, 다시 판단하는 흐름과 관련이 깊습니다.", career: "일에서는 예전 기회의 재등장, 방향 수정이 가능합니다.", money: "과거의 소비나 계약 정산이 필요합니다." },
  { id: 21, name: "The World", korean: "세계", suit: "Major Arcana", keywords: ["완성", "마무리", "확장", "성취"], upright: "한 사이클이 완성되는 카드입니다.", reversedMeaning: "마무리 지연, 애매한 종료를 보여줄 수 있습니다.", love: "연애에서는 관계의 완성, 공식화가 연결될 수 있습니다.", career: "프로젝트 마무리, 론칭, 결과 발표에 유리합니다.", money: "돈은 누적 결과가 드러나는 흐름입니다." },
].map((card, idx) => ({ ...card, short: idx < 10 ? `0${idx}` : `${idx}` }));

const defaultQuestion = "지금 내 흐름에서 가장 중요한 메시지는 무엇인가요?";

type QuestionType = "love" | "career" | "money" | "general";

function classifyQuestion(question: string): QuestionType {
  const q = question.toLowerCase();
  if (/(연애|재회|썸|남자|여자|상대|연락|결혼)/.test(q)) return "love";
  if (/(이직|직장|사업|취업|회사|일|브랜드|커리어)/.test(q)) return "career";
  if (/(돈|금전|재물|수익|매출|사업운|투자)/.test(q)) return "money";
  return "general";
}

function interpretCard(card: TarotCardBase, isReversed: boolean, type: QuestionType) {
  const summary = isReversed ? card.reversedMeaning : card.upright;
  const domain = type === "love" ? card.love : type === "career" ? card.career : type === "money" ? card.money : card.upright;
  return { summary, domain };
}

function buildOverallReading(selected: DeckCard[], questionType: QuestionType) {
  const reversedCount = selected.filter((c) => c.isReversed).length;
  const strongCards = selected.filter((c) => [1, 4, 7, 10, 19, 21].includes(c.id)).length;
  const unstableCards = selected.filter((c) => [12, 15, 16, 18].includes(c.id)).length;

  let tone = "전체적으로는 흐름이 아예 막힌 상태는 아니며, 선택과 태도에 따라 결과 차이가 크게 나는 리딩입니다.";
  if (reversedCount >= 2) tone = "지금은 에너지가 뒤집히거나 엇갈리는 부분이 많아, 성급하게 밀어붙일수록 결과가 비틀릴 가능성이 큽니다.";
  if (strongCards >= 2) tone = "판을 움직일 힘은 충분히 들어와 있습니다. 다만 감정이 아니라 구조와 타이밍으로 승부해야 합니다.";
  if (unstableCards >= 2) tone = "지금 리딩의 핵심은 불안정성입니다. 기대와 현실 사이의 간격을 줄이지 않으면 실망이 커질 수 있습니다.";

  const actionMap: Record<QuestionType, string> = {
    love: "연애 질문이라면 상대 반응 하나에 과몰입하기보다, 관계의 균형과 실제 행동을 기준으로 판단하는 것이 맞습니다.",
    career: "일 질문이라면 당장 결과보다 방향 정리와 실행 구조를 먼저 잡아야 성과가 납니다.",
    money: "금전 질문이라면 확장보다 관리가 우선입니다. 새 기회는 테스트 후 확대하는 방식이 안전합니다.",
    general: "지금은 감정으로 결론 내리기보다, 반복되는 패턴이 무엇인지 먼저 읽어내는 것이 중요합니다.",
  };
  const action = actionMap[questionType];

  const finalLine = reversedCount >= 2
    ? "정리하면, 지금은 되는지 안 되는지를 급히 묻는 시기보다 무엇이 흐름을 막는지 정확히 보는 시기입니다."
    : "정리하면, 지금 흐름은 가능성이 있으며 그 가능성을 현실로 바꾸는 건 질문자님의 선택 방식과 실행력입니다.";

  return { tone, action, finalLine };
}

function randomPick(arr: TarotCardBase[], n: number) {
  const copy = [...arr];
  const out: TarotCardBase[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const index = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(index, 1)[0]);
  }
  return out;
}

function makeDeckCard(card: TarotCardBase, isPicked: boolean, revealed: boolean, isReversed: boolean): DeckCard {
  return { ...card, isPicked, revealed, isReversed };
}

const questionTypeLabels: Record<QuestionType, string> = {
  love: "연애",
  career: "직업/사업",
  money: "금전",
  general: "종합",
};

export default function TarotReading() {
  const [question, setQuestion] = useState(defaultQuestion);
  const [step, setStep] = useState(1);
  const [deck, setDeck] = useState<DeckCard[]>(() =>
    tarotCards.map((card) => makeDeckCard(card, false, false, false))
  );
  const [picked, setPicked] = useState<DeckCard[]>([]);
  const [readingReady, setReadingReady] = useState(false);
  const [autoMode, setAutoMode] = useState(false);

  const questionType = useMemo(() => classifyQuestion(question), [question]);

  const progressLabel = useMemo(() => {
    if (step === 1) return "질문 입력";
    if (step === 2) return "카드 선택";
    return "리딩 결과";
  }, [step]);

  const selectCard = (card: DeckCard) => {
    if (step !== 2 || picked.length >= 3 || card.isPicked) return;
    const rev = Math.random() < 0.35;
    const updatedDeck = deck.map((c) =>
      c.id === card.id ? makeDeckCard(c, true, true, rev) : c
    );
    const chosen = makeDeckCard(card, true, true, rev);
    setDeck(updatedDeck);
    setPicked((prev) => [...prev, chosen]);
  };

  const startSelection = () => {
    setStep(2);
    setReadingReady(false);
  };

  const autoDraw = () => {
    const chosen: DeckCard[] = randomPick(tarotCards, 3).map((c) =>
      makeDeckCard(c, true, true, Math.random() < 0.35)
    );
    setDeck(
      tarotCards.map((c) => {
        const found = chosen.find((x) => x.id === c.id);
        return found ?? makeDeckCard(c, false, false, false);
      })
    );
    setPicked(chosen);
    setStep(3);
    setReadingReady(true);
  };

  const analyze = () => {
    if (picked.length !== 3) return;
    setStep(3);
    setReadingReady(true);
  };

  const resetAll = () => {
    setQuestion(defaultQuestion);
    setStep(1);
    setPicked([]);
    setReadingReady(false);
    setAutoMode(false);
    setDeck(tarotCards.map((card) => makeDeckCard(card, false, false, false)));
  };

  const overall = useMemo(() => {
    if (!readingReady || picked.length !== 3) return null;
    return buildOverallReading(picked, questionType);
  }, [readingReady, picked, questionType]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 space-y-6">
          <Card className="overflow-hidden border-border bg-card glow-gold">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-sm italic tracking-widest text-gold">
                  tarot reading studio
                </span>
                <Badge variant="outline" className="border-gold/30 text-gold">
                  {progressLabel}
                </Badge>
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                타로 상담 웹사이트
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                질문을 입력하고 카드를 직접 선택한 뒤, 선택된 카드 3장을 기준으로 자동 분석 결과를 확인할 수 있습니다.
                연애, 재회, 금전, 이직 같은 질문 유형도 간단히 분류해 해석에 반영합니다.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">빠른 조작</span>
              <Button variant="secondary" className="rounded-full" onClick={resetAll}>
                <RotateCcw className="mr-2 h-4 w-4" /> 처음부터 다시
              </Button>
              <Button
                variant="secondary"
                className="rounded-full"
                onClick={() => {
                  setAutoMode(true);
                  setStep(2);
                  setTimeout(autoDraw, 250);
                }}
              >
                <Shuffle className="mr-2 h-4 w-4" /> 자동으로 3장 뽑기
              </Button>
              <p className="w-full text-xs text-muted-foreground sm:w-auto">
                수동 선택과 자동 추출 둘 다 지원합니다.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Step 1 */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-xl text-foreground">1. 질문 입력</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">질문 제목</label>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="rounded-xl border-border bg-secondary"
                  placeholder="예: 그 사람에게 다시 연락이 올까요?"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">상세 상황 메모</label>
                <Textarea
                  className="min-h-[100px] rounded-xl border-border bg-secondary"
                  placeholder="상황을 자세히 적으면 해석에 도움이 됩니다 (선택사항)"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full border-border text-foreground">
                  분류: {questionTypeLabels[questionType]}
                </Badge>
                <Badge variant="outline" className="rounded-full border-border text-foreground">
                  선택 카드: {picked.length}/3
                </Badge>
                {autoMode && (
                  <Badge variant="outline" className="rounded-full border-border text-foreground">
                    자동 추출 모드
                  </Badge>
                )}
              </div>
              <Button className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90" onClick={startSelection}>
                카드 선택하러 가기
              </Button>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-xl text-foreground">2. 카드 선택</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">총 22장의 메이저 아르카나 덱입니다. 3장을 선택하세요.</p>
                <Button
                  variant="secondary"
                  className="rounded-xl"
                  onClick={analyze}
                  disabled={picked.length !== 3}
                >
                  <Sparkles className="mr-2 h-4 w-4" /> 카드 분석하기
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {deck.map((card) => {
                  const isSelected = picked.some((p) => p.id === card.id);
                  return (
                    <motion.button
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      key={card.id}
                      onClick={() => selectCard(card)}
                      disabled={card.isPicked || picked.length >= 3 || step !== 2}
                      className={`group relative aspect-[0.68] rounded-2xl border p-3 text-left transition-all ${
                        isSelected
                          ? "border-gold/50 bg-gold/5 glow-gold"
                          : "border-border bg-secondary hover:border-gold/20 hover:bg-muted"
                      } ${step !== 2 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{card.short}</span>
                          <span className="font-display italic">major</span>
                        </div>
                        <div className="flex flex-1 items-center justify-center font-display text-3xl font-light tracking-[0.2em] text-foreground/80">
                          {card.revealed ? card.name[0] : CARD_BACK}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {card.revealed ? card.korean : "unknown"}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            {card.revealed ? (
                              <>
                                {card.isReversed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                {card.isReversed ? "역방향" : "정방향"}
                              </>
                            ) : (
                              "선택하세요"
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reading results */}
        <AnimatePresence>
          {readingReady && overall && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.5 }}
              className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"
            >
              <Card className="border-border bg-card glow-gold">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground">3. 선택된 카드</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {picked.map((card, idx) => {
                    const info = interpretCard(card, card.isReversed, questionType);
                    return (
                      <div key={card.id} className="rounded-xl border border-border bg-secondary p-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm text-muted-foreground">card {idx + 1}</div>
                            <div className="text-lg font-semibold text-foreground">
                              {card.korean}{" "}
                              <span className="font-display text-muted-foreground">{card.name}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="rounded-full border-gold/30 text-gold">
                            {card.isReversed ? "역방향" : "정방향"}
                          </Badge>
                        </div>
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {card.keywords.map((k) => (
                            <Badge key={k} variant="secondary" className="rounded-full text-xs">
                              {k}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">{info.summary}</p>
                        <p className="mt-2 text-sm leading-relaxed text-foreground">{info.domain}</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-xl text-foreground">자동 리딩 결과</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-border bg-secondary p-5">
                    <div className="mb-1.5 text-sm text-muted-foreground">질문</div>
                    <div className="text-lg leading-7 text-foreground">{question}</div>
                  </div>

                  <div className="rounded-xl border border-border bg-secondary p-5">
                    <div className="mb-1.5 text-sm text-muted-foreground">전체 흐름</div>
                    <p className="leading-7 text-foreground/90">{overall.tone}</p>
                  </div>

                  <div className="rounded-xl border border-border bg-secondary p-5">
                    <div className="mb-1.5 text-sm text-muted-foreground">질문 분야 해석</div>
                    <p className="leading-7 text-foreground/90">{overall.action}</p>
                  </div>

                  <div className="rounded-xl border border-border bg-secondary p-5">
                    <div className="mb-1.5 text-sm text-muted-foreground">정리</div>
                    <p className="leading-7 text-foreground/90">{overall.finalLine}</p>
                  </div>

                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-sm leading-relaxed text-muted-foreground">
                    현재 버전은 메이저 아르카나 22장 샘플 덱 기반입니다. 실제 서비스로 확장하려면
                    78장 전체 카드 DB, 질문 유형별 프롬프트, 카드 조합 해석 엔진, 결제 후 심화 리딩,
                    상담자용 관리자 화면을 추가하면 됩니다.
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

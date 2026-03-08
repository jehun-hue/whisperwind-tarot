import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shuffle, Sparkles, RotateCcw, Eye, EyeOff, Filter } from "lucide-react";
import { tarotCards, makeDeckCard, type TarotCardBase, type DeckCard } from "@/data/tarotCards";

const CARD_BACK = "✦";
const defaultQuestion = "지금 내 흐름에서 가장 중요한 메시지는 무엇인가요?";

type QuestionType = "love" | "career" | "money" | "general";

const suitLabels: Record<string, string> = {
  all: "전체",
  "Major Arcana": "메이저",
  Wands: "완드",
  Cups: "컵",
  Swords: "검",
  Pentacles: "펜타클",
};

const suitShort: Record<string, string> = {
  "Major Arcana": "major",
  Wands: "wands",
  Cups: "cups",
  Swords: "swords",
  Pentacles: "penta",
};

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

  // Suit-specific insights for minor arcana
  const suitCounts: Record<string, number> = {};
  selected.forEach((c) => {
    suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
  });

  let suitInsight = "";
  if (suitCounts["Wands"] >= 2) suitInsight = "완드 카드가 다수 등장했습니다. 열정, 행동, 창조적 에너지가 핵심 테마입니다.";
  else if (suitCounts["Cups"] >= 2) suitInsight = "컵 카드가 다수 등장했습니다. 감정, 관계, 직감이 핵심 테마입니다.";
  else if (suitCounts["Swords"] >= 2) suitInsight = "검 카드가 다수 등장했습니다. 사고, 결정, 진실이 핵심 테마입니다.";
  else if (suitCounts["Pentacles"] >= 2) suitInsight = "펜타클 카드가 다수 등장했습니다. 물질, 안정, 실용이 핵심 테마입니다.";

  const finalLine = reversedCount >= 2
    ? "정리하면, 지금은 되는지 안 되는지를 급히 묻는 시기보다 무엇이 흐름을 막는지 정확히 보는 시기입니다."
    : "정리하면, 지금 흐름은 가능성이 있으며 그 가능성을 현실로 바꾸는 건 질문자님의 선택 방식과 실행력입니다.";

  return { tone, action, suitInsight, finalLine };
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
  const [suitFilter, setSuitFilter] = useState("all");

  const questionType = useMemo(() => classifyQuestion(question), [question]);

  const filteredDeck = useMemo(() => {
    if (suitFilter === "all") return deck;
    return deck.filter((c) => c.suit === suitFilter);
  }, [deck, suitFilter]);

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
    setSuitFilter("all");
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
                78장 전체 타로 덱 (메이저 아르카나 22장 + 마이너 아르카나 56장) 기반입니다.
                질문을 입력하고 카드를 직접 선택한 뒤, 자동 분석 결과를 확인하세요.
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
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
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
                  className="min-h-[80px] rounded-xl border-border bg-secondary"
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
                <Badge variant="outline" className="rounded-full border-border text-foreground">
                  전체 덱: 78장
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
              <div className="mb-4 flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {suitFilter === "all" ? "78장" : filteredDeck.length + "장"} 중에서 3장을 선택하세요.
                  </p>
                  <Button
                    variant="secondary"
                    className="rounded-xl"
                    onClick={analyze}
                    disabled={picked.length !== 3}
                  >
                    <Sparkles className="mr-2 h-4 w-4" /> 카드 분석하기
                  </Button>
                </div>
                {/* Suit filter */}
                <div className="flex flex-wrap gap-1.5">
                  <Filter className="mr-1 h-4 w-4 text-muted-foreground self-center" />
                  {Object.entries(suitLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSuitFilter(key)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        suitFilter === key
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {filteredDeck.map((card) => {
                  const isSelected = picked.some((p) => p.id === card.id);
                  return (
                    <motion.button
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.97 }}
                      key={card.id}
                      onClick={() => selectCard(card)}
                      disabled={card.isPicked || picked.length >= 3 || step !== 2}
                      className={`group relative aspect-[0.68] rounded-xl border p-2 text-left transition-all ${
                        isSelected
                          ? "border-gold/50 bg-gold/5 glow-gold"
                          : "border-border bg-secondary hover:border-gold/20 hover:bg-muted"
                      } ${step !== 2 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{card.short}</span>
                          <span className="font-display italic">{suitShort[card.suit] ?? "?"}</span>
                        </div>
                        <div className="flex flex-1 items-center justify-center font-display text-2xl font-light tracking-[0.15em] text-foreground/80">
                          {card.revealed ? card.name[0] : CARD_BACK}
                        </div>
                        <div>
                          <div className="truncate text-[11px] font-medium text-foreground">
                            {card.revealed ? card.korean : "unknown"}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                            {card.revealed ? (
                              <>
                                {card.isReversed ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                                {card.isReversed ? "역" : "정"}
                              </>
                            ) : (
                              "선택"
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
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>card {idx + 1}</span>
                              <Badge variant="secondary" className="rounded-full text-[10px]">
                                {suitLabels[card.suit]}
                              </Badge>
                            </div>
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

                  {overall.suitInsight && (
                    <div className="rounded-xl border border-border bg-secondary p-5">
                      <div className="mb-1.5 text-sm text-muted-foreground">슈트 분석</div>
                      <p className="leading-7 text-foreground/90">{overall.suitInsight}</p>
                    </div>
                  )}

                  <div className="rounded-xl border border-border bg-secondary p-5">
                    <div className="mb-1.5 text-sm text-muted-foreground">질문 분야 해석</div>
                    <p className="leading-7 text-foreground/90">{overall.action}</p>
                  </div>

                  <div className="rounded-xl border border-border bg-secondary p-5">
                    <div className="mb-1.5 text-sm text-muted-foreground">정리</div>
                    <p className="leading-7 text-foreground/90">{overall.finalLine}</p>
                  </div>

                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-sm leading-relaxed text-muted-foreground">
                    78장 전체 타로 덱 (메이저 아르카나 22장 + 마이너 아르카나 56장) 기반 리딩입니다.
                    완드(열정/행동), 컵(감정/관계), 검(사고/결정), 펜타클(물질/안정)의 4가지 슈트가 포함되어 있습니다.
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

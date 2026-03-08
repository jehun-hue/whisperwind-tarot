import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shuffle, Eye, EyeOff, Filter, Sparkles, CheckCircle2 } from "lucide-react";
import { tarotCards, makeDeckCard, type DeckCard } from "@/data/tarotCards";

const CARD_BACK = "✦";

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

export default function ClientPage() {
  const [question, setQuestion] = useState("");
  const [memo, setMemo] = useState("");
  const [step, setStep] = useState<"question" | "select" | "done">("question");
  const [deck, setDeck] = useState<DeckCard[]>(() =>
    tarotCards.map((card) => makeDeckCard(card, false, false, false))
  );
  const [picked, setPicked] = useState<DeckCard[]>([]);
  const [suitFilter, setSuitFilter] = useState("all");
  const [submitted, setSubmitted] = useState(false);

  const filteredDeck = useMemo(() => {
    if (suitFilter === "all") return deck;
    return deck.filter((c) => c.suit === suitFilter);
  }, [deck, suitFilter]);

  const selectCard = (card: DeckCard) => {
    if (step !== "select" || picked.length >= 3 || card.isPicked) return;
    const rev = Math.random() < 0.35;
    setDeck((prev) =>
      prev.map((c) => (c.id === card.id ? makeDeckCard(c, true, true, rev) : c))
    );
    setPicked((prev) => [...prev, makeDeckCard(card, true, true, rev)]);
  };

  const handleSubmit = () => {
    if (picked.length !== 3) return;
    // Save to localStorage for reader to retrieve
    const session = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      question,
      memo,
      cards: picked.map((c) => ({
        id: c.id,
        name: c.name,
        korean: c.korean,
        suit: c.suit,
        isReversed: c.isReversed,
      })),
      timestamp: new Date().toISOString(),
    };
    // Append to sessions list
    const existing = JSON.parse(localStorage.getItem("tarot_sessions") || "[]");
    existing.unshift(session);
    localStorage.setItem("tarot_sessions", JSON.stringify(existing.slice(0, 100)));
    setSubmitted(true);
    setStep("done");
  };

  const resetAll = () => {
    setQuestion("");
    setMemo("");
    setStep("question");
    setPicked([]);
    setSubmitted(false);
    setSuitFilter("all");
    setDeck(tarotCards.map((card) => makeDeckCard(card, false, false, false)));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="font-display text-sm italic tracking-widest text-gold">
            tarot reading
          </span>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            타로 상담
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            마음을 가다듬고, 질문을 떠올린 후 카드 3장을 선택해 주세요.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Question */}
          {step === "question" && (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="mx-auto max-w-lg border-border bg-card glow-gold">
                <CardHeader>
                  <CardTitle className="text-center text-lg text-foreground">
                    어떤 것이 궁금하신가요?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="rounded-xl border-border bg-secondary"
                    placeholder="예: 그 사람에게 다시 연락이 올까요?"
                  />
                  <Textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="min-h-[80px] rounded-xl border-border bg-secondary"
                    placeholder="상황을 자세히 적어주시면 더 정확한 리딩이 가능합니다 (선택사항)"
                  />
                  <Button
                    className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setStep("select")}
                    disabled={!question.trim()}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    카드 선택하기
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Card Selection */}
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-foreground">
                      카드를 3장 선택해 주세요
                    </CardTitle>
                    <Badge variant="outline" className="border-gold/30 text-gold">
                      {picked.length} / 3
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    마음이 끌리는 카드를 직감적으로 선택하세요.
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Suit filter */}
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    <Filter className="mr-1 h-4 w-4 self-center text-muted-foreground" />
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

                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
                    {filteredDeck.map((card) => {
                      const isSelected = picked.some((p) => p.id === card.id);
                      return (
                        <motion.button
                          whileHover={{ y: -3 }}
                          whileTap={{ scale: 0.97 }}
                          key={card.id}
                          onClick={() => selectCard(card)}
                          disabled={card.isPicked || picked.length >= 3}
                          className={`group relative aspect-[0.68] rounded-xl border p-2 text-left transition-all ${
                            isSelected
                              ? "border-gold/50 bg-gold/5 glow-gold"
                              : "border-border bg-secondary hover:border-gold/20 hover:bg-muted"
                          } ${card.isPicked || picked.length >= 3 ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div className="flex h-full flex-col items-center justify-center">
                            <div className="font-display text-2xl font-light tracking-[0.15em] text-foreground/60">
                              {isSelected ? card.name[0] : CARD_BACK}
                            </div>
                            {isSelected && (
                              <div className="mt-1 text-[10px] text-gold">
                                {card.isReversed ? "역" : "정"}
                              </div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Selected cards summary */}
                  {picked.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <div className="text-sm font-medium text-muted-foreground">선택된 카드</div>
                      <div className="flex flex-wrap gap-2">
                        {picked.map((card, idx) => (
                          <Badge
                            key={card.id}
                            variant="outline"
                            className="rounded-full border-gold/30 px-3 py-1.5 text-foreground"
                          >
                            {idx + 1}. {card.korean}
                            <span className="ml-1 text-gold">
                              {card.isReversed ? "(역)" : "(정)"}
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {picked.length === 3 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <Button
                        className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={handleSubmit}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        선택 완료하기
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Done */}
          {step === "done" && submitted && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <Card className="mx-auto max-w-lg border-border bg-card glow-gold">
                <CardContent className="py-12">
                  <div className="mb-4 font-display text-5xl text-gold">✦</div>
                  <h2 className="font-display text-2xl font-semibold text-foreground">
                    카드 선택이 완료되었습니다
                  </h2>
                  <p className="mt-3 text-sm text-muted-foreground">
                    상담사가 선택하신 카드를 바탕으로 정성스럽게 리딩을 진행합니다.
                    <br />
                    결과는 별도로 안내드리겠습니다.
                  </p>

                  <div className="mt-6 space-y-2">
                    {picked.map((card, idx) => (
                      <div
                        key={card.id}
                        className="mx-auto flex max-w-xs items-center justify-between rounded-lg border border-border bg-secondary px-4 py-2"
                      >
                        <span className="text-sm text-foreground">
                          {idx + 1}. {card.korean}
                          <span className="ml-1 font-display text-xs text-muted-foreground">
                            {card.name}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gold">
                          {card.isReversed ? (
                            <>
                              <EyeOff className="h-3 w-3" /> 역방향
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3" /> 정방향
                            </>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="secondary"
                    className="mt-8 rounded-full"
                    onClick={resetAll}
                  >
                    새 상담 시작하기
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

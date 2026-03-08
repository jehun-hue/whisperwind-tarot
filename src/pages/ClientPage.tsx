import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Eye, EyeOff, Filter, CheckCircle2 } from "lucide-react";
import { tarotCards, makeDeckCard, type DeckCard } from "@/data/tarotCards";
import heroBg from "@/assets/tarot-hero-bg.jpg";
import cardBackImg from "@/assets/card-back.png";

const suitLabels: Record<string, string> = {
  all: "전체 78장",
  "Major Arcana": "메이저 아르카나",
  Wands: "완드",
  Cups: "컵",
  Swords: "검",
  Pentacles: "펜타클",
};

// Floating stars component
function FloatingStars() {
  const stars = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-gold-light"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            opacity: 0.4,
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

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
    <div className="relative min-h-screen bg-background">
      {/* Hero background */}
      <div className="fixed inset-0 z-0">
        <img
          src={heroBg}
          alt=""
          className="h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <FloatingStars />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <div className="animate-float mb-4 text-4xl">☽</div>
          <span className="font-display text-sm italic tracking-[0.3em] text-gold-light">
            tarot reading
          </span>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            타로 상담
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            고요히 마음을 가다듬고, 떠오르는 질문에 집중한 뒤
            <br />
            직감이 이끄는 대로 카드 3장을 선택해 주세요.
          </p>
          <div className="mx-auto mt-6 h-px w-32 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Step 1: Question */}
          {step === "question" && (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="mx-auto max-w-lg border-border/50 bg-card/80 backdrop-blur-xl animate-pulse-glow">
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-6 text-center">
                    <div className="mb-2 text-2xl">✦</div>
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      어떤 것이 궁금하신가요?
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      마음속 질문을 자유롭게 적어주세요
                    </p>
                  </div>
                  <div className="space-y-4">
                    <Input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="rounded-xl border-border/50 bg-background/50 backdrop-blur text-foreground placeholder:text-muted-foreground/50"
                      placeholder="예: 그 사람에게 다시 연락이 올까요?"
                    />
                    <Textarea
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      className="min-h-[80px] rounded-xl border-border/50 bg-background/50 backdrop-blur text-foreground placeholder:text-muted-foreground/50"
                      placeholder="상황을 자세히 적어주시면 더 정확한 리딩이 가능합니다"
                    />
                    <Button
                      className="w-full rounded-xl bg-gradient-to-r from-primary to-gold text-primary-foreground font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                      onClick={() => setStep("select")}
                      disabled={!question.trim()}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      카드 선택하기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Card Selection */}
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Selection header */}
              <div className="mb-6 text-center">
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  카드를 선택하세요
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  마음이 끌리는 카드를 직감적으로 3장 고르세요
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-display text-sm transition-all ${
                        i < picked.length
                          ? "border-gold bg-gold/20 text-gold glow-gold"
                          : "border-border/30 text-muted-foreground/30"
                      }`}
                    >
                      {i < picked.length ? picked[i].korean[0] : i + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Suit filter */}
              <div className="mb-4 flex flex-wrap items-center justify-center gap-1.5">
                <Filter className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                {Object.entries(suitLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSuitFilter(key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      suitFilter === key
                        ? "bg-gold/20 text-gold border border-gold/30"
                        : "bg-secondary/50 text-muted-foreground hover:bg-muted border border-transparent"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Card grid */}
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                {filteredDeck.map((card) => {
                  const isSelected = picked.some((p) => p.id === card.id);
                  const isDisabled = card.isPicked || picked.length >= 3;
                  return (
                    <motion.button
                      whileHover={!isDisabled ? { y: -6, scale: 1.05 } : {}}
                      whileTap={!isDisabled ? { scale: 0.95 } : {}}
                      key={card.id}
                      onClick={() => selectCard(card)}
                      disabled={isDisabled}
                      className={`group relative aspect-[0.65] overflow-hidden rounded-lg border transition-all ${
                        isSelected
                          ? "border-gold/60 glow-gold-strong"
                          : isDisabled
                          ? "border-border/20 opacity-40 cursor-not-allowed"
                          : "border-border/30 hover:border-gold/30 cursor-pointer"
                      }`}
                    >
                      {isSelected ? (
                        // Revealed card
                        <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-gold/10 to-accent/10 p-1.5">
                          <span className="font-display text-lg font-semibold text-gold">
                            {card.name[0]}
                          </span>
                          <span className="mt-0.5 text-[9px] font-medium text-foreground">
                            {card.korean}
                          </span>
                          <span className="mt-0.5 flex items-center gap-0.5 text-[8px] text-gold-light">
                            {card.isReversed ? (
                              <>
                                <EyeOff className="h-2 w-2" /> 역
                              </>
                            ) : (
                              <>
                                <Eye className="h-2 w-2" /> 정
                              </>
                            )}
                          </span>
                        </div>
                      ) : (
                        // Card back
                        <img
                          src={cardBackImg}
                          alt="tarot card"
                          className="h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-100"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Selected cards & submit */}
              {picked.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8"
                >
                  <div className="mx-auto max-w-md space-y-3">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {picked.map((card, idx) => (
                        <Badge
                          key={card.id}
                          className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-foreground"
                        >
                          {idx + 1}. {card.korean}
                          <span className="ml-1 text-gold">
                            {card.isReversed ? "(역)" : "(정)"}
                          </span>
                        </Badge>
                      ))}
                    </div>

                    {picked.length === 3 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <Button
                          className="w-full rounded-xl bg-gradient-to-r from-primary to-gold text-primary-foreground font-medium shadow-lg shadow-primary/20"
                          onClick={handleSubmit}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          선택 완료하기
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 3: Done */}
          {step === "done" && submitted && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <Card className="mx-auto max-w-lg border-gold/20 bg-card/80 backdrop-blur-xl glow-gold-strong">
                <CardContent className="py-14 px-8">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="mb-6 font-display text-6xl text-gold"
                  >
                    ☽
                  </motion.div>
                  <h2 className="font-display text-2xl font-semibold text-foreground">
                    카드 선택이 완료되었습니다
                  </h2>
                  <div className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    상담사가 선택하신 카드를 바탕으로
                    <br />
                    정성스럽게 리딩을 진행합니다.
                    <br />
                    <span className="text-gold-light">결과는 별도로 안내드리겠습니다.</span>
                  </p>

                  <div className="mt-8 space-y-2.5">
                    {picked.map((card, idx) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.2 }}
                        className="mx-auto flex max-w-xs items-center justify-between rounded-xl border border-gold/15 bg-background/50 backdrop-blur px-4 py-3"
                      >
                        <span className="text-sm text-foreground">
                          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-[10px] font-semibold text-gold">
                            {idx + 1}
                          </span>
                          {card.korean}
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
                      </motion.div>
                    ))}
                  </div>

                  <Button
                    variant="secondary"
                    className="mt-10 rounded-full border border-border/50 bg-secondary/50 backdrop-blur"
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

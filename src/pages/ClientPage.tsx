import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Eye, EyeOff, Filter, CheckCircle2 } from "lucide-react";
import { tarotCards, makeDeckCard, type DeckCard } from "@/data/tarotCards";
import { calculateSaju, getSajuTarotCrossKeywords, getSajuForQuestion, type SajuResult } from "@/lib/saju";
import { calculateNatalChart, getAstrologyForQuestion, getCurrentTransits, type AstrologyResult } from "@/lib/astrology";
import { calculateZiWei, getZiWeiForQuestion, type ZiWeiResult } from "@/lib/ziwei";
import { calculateManseryeokSaju, type ManseryeokResult } from "@/lib/manseryeokCalc";
import { getCombinationSummary } from "@/data/tarotCombinations";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BirthInfoForm, { type BirthInfo } from "@/components/BirthInfoForm";
import ReadingResult from "@/components/ReadingResult";
import SajuManualOverride from "@/components/SajuManualOverride";
import UserHeader from "@/components/UserHeader";
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

type ReadingStyle = "default" | "choihanna" | "psychological" | "spiritual";

const readingStyleLabels: Record<ReadingStyle, { label: string; description: string; icon: string }> = {
  default: { label: "기본 통합 분석", description: "타로+사주+점성술+자미두수 교차검증", icon: "🔮" },
  choihanna: { label: "최한나 스타일", description: "직관적·심리 중심·상대방 감정 깊이 분석", icon: "🌙" },
  psychological: { label: "심리 분석 중심", description: "무의식 패턴·내면 갈등·성장 포인트 집중", icon: "🧠" },
  spiritual: { label: "영적 가이드", description: "에너지 흐름·영적 메시지·카르마 해석", icon: "✨" },
};

type QuestionType = "love" | "career" | "money" | "general";

function classifyQuestion(question: string): QuestionType {
  const q = question.toLowerCase();
  if (/(연애|재회|썸|남자|여자|상대|연락|결혼|상대방|속마음)/.test(q)) return "love";
  if (/(이직|직장|사업|취업|회사|일|브랜드|커리어|승진)/.test(q)) return "career";
  if (/(돈|금전|재물|수익|매출|사업운|투자|재정)/.test(q)) return "money";
  return "general";
}

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
  const { user, useCredit } = useAuth();
  const [question, setQuestion] = useState("");
  const [memo, setMemo] = useState("");
  const [step, setStep] = useState<"question" | "birthInfo" | "select" | "loading" | "result">("question");
  const [deck, setDeck] = useState<DeckCard[]>(() =>
    tarotCards.map((card) => makeDeckCard(card, false, false, false))
  );
  const [picked, setPicked] = useState<DeckCard[]>([]);
  const [suitFilter, setSuitFilter] = useState("all");
  const [birthInfo, setBirthInfo] = useState<BirthInfo | null>(null);
  const [readingStyle, setReadingStyle] = useState<ReadingStyle>("default");
  const [sajuResult, setSajuResult] = useState<SajuResult | null>(null);
  const [manseryeokResult, setManseryeokResult] = useState<ManseryeokResult | null>(null);
  const [astroResult, setAstroResult] = useState<AstrologyResult | null>(null);
  const [ziweiResult, setZiweiResult] = useState<ZiWeiResult | null>(null);
  const [aiReading, setAiReading] = useState<any>(null);
  const [manualSajuData, setManualSajuData] = useState("");
  const [error, setError] = useState<string | null>(null);

  const questionType = useMemo(() => classifyQuestion(question), [question]);

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

  const handleBirthInfoSubmit = (info: BirthInfo) => {
    setBirthInfo(info);
    const [y, m, d] = info.birthDate.split("-").map(Number);
    const hour = info.birthTime ? parseInt(info.birthTime.split(":")[0]) : 12;
    const minute = info.birthTime ? parseInt(info.birthTime.split(":")[1]) : 0;
    
    // Manseryeok auto-calculation
    try {
      const msResult = calculateManseryeokSaju(y, m, d, hour, minute, info.isLunar);
      setManseryeokResult(msResult);
    } catch (e) {
      console.error("Manseryeok calculation error:", e);
      setManseryeokResult(null);
    }
    
    const saju = calculateSaju(y, m, d, hour);
    setSajuResult(saju);
    const astro = calculateNatalChart(y, m, d, hour);
    setAstroResult(astro);
    const ziwei = calculateZiWei(y, m, d, hour, info.gender);
    setZiweiResult(ziwei);
    setStep("select");
  };

  const handleBirthInfoSkip = () => {
    setBirthInfo(null);
    setSajuResult(null);
    setManseryeokResult(null);
    setAstroResult(null);
    setZiweiResult(null);
    setStep("select");
  };

  const handleSubmit = async () => {
    if (picked.length !== 3) return;

    // Credit check: logged-in users use credits for AI deep analysis
    if (user) {
      const ok = await useCredit("AI 심화 분석");
      if (!ok) {
        setError("크레딧이 부족합니다. 관리자에게 문의하세요.");
        setStep("result");
        return;
      }
    }

    setStep("loading");
    setError(null);

    const cardData = picked.map((c) => ({
      id: c.id,
      name: c.name,
      korean: c.korean,
      suit: c.suit,
      isReversed: c.isReversed,
    }));

    // Prepare all engine data for AI
    let sajuDataForAI = null;
    if (sajuResult) {
      sajuDataForAI = { ...sajuResult, crossKeywords: getSajuTarotCrossKeywords(sajuResult, picked.map((c) => c.suit)), questionAnalysis: getSajuForQuestion(sajuResult, questionType) };
    }
    let astroDataForAI = null;
    if (astroResult) {
      astroDataForAI = { ...astroResult, questionAnalysis: getAstrologyForQuestion(astroResult, questionType), transits: getCurrentTransits(astroResult) };
    }
    let ziweiDataForAI = null;
    if (ziweiResult) {
      ziweiDataForAI = { ...ziweiResult, questionAnalysis: getZiWeiForQuestion(ziweiResult, questionType) };
    }
    const combinationSummary = getCombinationSummary(picked.map((c) => c.id), questionType);

    try {
      const { data: session, error: dbError } = await supabase
        .from("reading_sessions")
        .insert({
          question, question_type: questionType, memo: memo || null,
          gender: birthInfo?.gender || null, birth_date: birthInfo?.birthDate || null,
          birth_time: birthInfo?.birthTime || null, birth_place: birthInfo?.birthPlace || null,
          is_lunar: birthInfo?.isLunar || false, cards: cardData as any,
          saju_data: sajuDataForAI as any, status: "analyzing",
          user_id: user?.id || null,
        })
        .select().single();

      if (dbError) throw dbError;

      const { data: aiData, error: fnError } = await supabase.functions.invoke("ai-reading", {
        body: { question, questionType, memo, cards: cardData, sajuData: sajuDataForAI, birthInfo, astrologyData: astroDataForAI, ziweiData: ziweiDataForAI, combinationSummary, readingStyle, manseryeokData: manseryeokResult },
      });

      if (fnError) throw fnError;

      const reading = aiData?.reading;
      setAiReading(reading);

      // Update session with AI reading
      if (session?.id && reading) {
        await supabase
          .from("reading_sessions")
          .update({
            ai_reading: reading as any,
            tarot_score: reading.scores?.tarot || null,
            saju_score: reading.scores?.saju || null,
            final_confidence: reading.scores?.overall || null,
            status: "completed",
          })
          .eq("id", session.id);
      }

      setStep("result");
    } catch (err: any) {
      console.error("Reading error:", err);
      setError(err.message || "분석 중 오류가 발생했습니다.");
      setStep("result");
    }
  };

  const resetAll = () => {
    setQuestion("");
    setMemo("");
    setStep("question");
    setPicked([]);
    setSuitFilter("all");
    setBirthInfo(null);
    setReadingStyle("default");
    setSajuResult(null);
    setManseryeokResult(null);
    setAstroResult(null);
    setZiweiResult(null);
    setAiReading(null);
    setError(null);
    setDeck(tarotCards.map((card) => makeDeckCard(card, false, false, false)));
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div className="fixed inset-0 z-0">
        <img src={heroBg} alt="" className="h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>
      <FloatingStars />

      <div className="relative z-10">
        <UserHeader />
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <div className="animate-float mb-4 text-4xl">☽</div>
          <span className="font-display text-sm italic tracking-[0.3em] text-gold-light">
            divination reading
          </span>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            통합 점술 상담
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            타로 + 사주 교차 검증으로 깊이 있는 리딩을 제공합니다
            <br />
            고요히 마음을 가다듬고, 직감이 이끄는 대로 진행하세요.
          </p>
          <div className="mx-auto mt-6 h-px w-32 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

          {/* Step indicator */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {["질문", "출생정보", "카드선택", "결과"].map((label, i) => {
              const stepOrder = ["question", "birthInfo", "select", "result"];
              const currentIdx = stepOrder.indexOf(step === "loading" ? "result" : step);
              return (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className={`flex h-7 items-center rounded-full px-3 text-[10px] font-medium transition-all ${
                      i <= currentIdx
                        ? "bg-gold/20 text-gold"
                        : "bg-secondary/50 text-muted-foreground/40"
                    }`}
                  >
                    {label}
                  </div>
                  {i < 3 && (
                    <div className={`h-px w-4 ${i < currentIdx ? "bg-gold/40" : "bg-border/30"}`} />
                  )}
                </div>
              );
            })}
          </div>
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
                    {/* Reading Style Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">해석 스타일</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.entries(readingStyleLabels) as [ReadingStyle, typeof readingStyleLabels[ReadingStyle]][]).map(([key, style]) => (
                          <button
                            key={key}
                            onClick={() => setReadingStyle(key)}
                            className={`rounded-xl border p-3 text-left transition-all ${
                              readingStyle === key
                                ? "border-gold/60 bg-gold/10 shadow-sm shadow-gold/10"
                                : "border-border/30 bg-background/30 hover:border-border/50"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{style.icon}</span>
                              <span className={`text-xs font-medium ${readingStyle === key ? "text-gold" : "text-foreground"}`}>
                                {style.label}
                              </span>
                            </div>
                            <p className="mt-1 text-[10px] leading-tight text-muted-foreground">
                              {style.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {question.trim() && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-gold/30 text-gold text-xs">
                          자동 분류: {questionType === "love" ? "💕 연애" : questionType === "career" ? "💼 직업" : questionType === "money" ? "💰 금전" : "🔮 종합"}
                        </Badge>
                      </div>
                    )}
                    <Button
                      className="w-full rounded-xl bg-gradient-to-r from-primary to-gold text-primary-foreground font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                      onClick={() => setStep("birthInfo")}
                      disabled={!question.trim()}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      다음 단계로
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Birth Info */}
          {step === "birthInfo" && (
            <BirthInfoForm
              key="birthInfo"
              onSubmit={handleBirthInfoSubmit}
              onSkip={handleBirthInfoSkip}
            />
          )}

          {/* Step 3: Card Selection */}
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Saju auto-calculated (hidden from UI, data only for AI) */}
              {manseryeokResult && (
                <Card className="mb-6 border-border/50 bg-card/80 backdrop-blur-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-display italic text-gold">✦ 출생 데이터 분석 준비 완료</span>
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">
                        적용됨
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      입력하신 출생 정보를 기반으로 정밀 분석 데이터가 자동 생성되었습니다.
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="mb-6 text-center">
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  카드를 선택하세요
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  마음이 끌리는 카드를 직감적으로 3장 고르세요
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  1번: 현재 상황 · 2번: 핵심 문제 · 3번: 결과/방향
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
                        <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-gold/10 to-accent/10 p-1.5">
                          <span className="font-display text-lg font-semibold text-gold">
                            {card.name[0]}
                          </span>
                          <span className="mt-0.5 text-[9px] font-medium text-foreground">
                            {card.korean}
                          </span>
                          <span className="mt-0.5 flex items-center gap-0.5 text-[8px] text-gold-light">
                            {card.isReversed ? (
                              <><EyeOff className="h-2 w-2" /> 역</>
                            ) : (
                              <><Eye className="h-2 w-2" /> 정</>
                            )}
                          </span>
                        </div>
                      ) : (
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
                          AI 분석 시작하기
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 4: Loading & Result */}
          {(step === "loading" || step === "result") && (
            <motion.div key="result">
              {error ? (
                <Card className="mx-auto max-w-lg border-destructive/30 bg-card/80 backdrop-blur-xl">
                  <CardContent className="py-10 px-8 text-center">
                    <div className="mb-4 text-3xl">⚠️</div>
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      분석 중 오류 발생
                    </h2>
                    <p className="mt-3 text-sm text-muted-foreground">{error}</p>
                    <Button
                      variant="secondary"
                      className="mt-6 rounded-full"
                      onClick={resetAll}
                    >
                      다시 시작하기
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <ReadingResult
                  reading={aiReading}
                  isLoading={step === "loading"}
                  onReset={resetAll}
                  hasSaju={!!sajuResult}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

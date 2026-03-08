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
import { getCombinationSummary } from "@/data/tarotCombinations";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import LocalizedBirthInfoForm from "@/components/LocalizedBirthInfoForm";
import LocalizedReadingResult from "@/components/LocalizedReadingResult";
import UserHeader from "@/components/UserHeader";
import CosmicBackground from "@/components/CosmicBackground";
import heroBg from "@/assets/tarot-hero-bg.jpg";
import cardBackImg from "@/assets/card-back.png";
import { type LocaleConfig, type Locale, getCardDisplayName, getCardDirectionLabel } from "@/config/locales";
import type { BirthInfo } from "@/components/BirthInfoForm";

interface LocalizedClientPageProps {
  config: LocaleConfig;
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

function classifyQuestionByLocale(question: string, locale: Locale): string {
  const q = question.toLowerCase();
  if (locale === "kr") {
    if (/(연애|재회|썸|남자|여자|상대|연락|결혼|상대방|속마음)/.test(q)) return "love";
    if (/(이직|직장|사업|취업|회사|일|브랜드|커리어|승진)/.test(q)) return "career";
    if (/(돈|금전|재물|수익|매출|사업운|투자|재정)/.test(q)) return "money";
    return "general";
  }
  if (locale === "jp") {
    if (/(恋|恋愛|好き|彼|彼女|復縁|気持ち|連絡|結婚)/.test(q)) return "love";
    if (/(仕事|転職|会社|キャリア|昇進|就職)/.test(q)) return "career";
    if (/(金|お金|収入|投資|財|金運)/.test(q)) return "money";
    return "general";
  }
  // US
  if (/(love|relationship|partner|crush|ex|marriage|dating|contact|reach out)/.test(q)) return "love";
  if (/(career|job|work|business|promotion|interview)/.test(q)) return "career";
  if (/(money|finance|abundance|wealth|income|invest)/.test(q)) return "money";
  return "general";
}

export default function LocalizedClientPage({ config }: LocalizedClientPageProps) {
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
  const [sajuResult, setSajuResult] = useState<SajuResult | null>(null);
  const [astroResult, setAstroResult] = useState<AstrologyResult | null>(null);
  const [ziweiResult, setZiweiResult] = useState<ZiWeiResult | null>(null);
  const [aiReading, setAiReading] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestionType, setSelectedQuestionType] = useState<string | null>(null);

  const questionType = useMemo(() => {
    if (selectedQuestionType) return selectedQuestionType;
    return classifyQuestionByLocale(question, config.locale);
  }, [question, config.locale, selectedQuestionType]);

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
    setAstroResult(null);
    setZiweiResult(null);
    setStep("select");
  };

  const handleSubmit = async () => {
    if (picked.length !== 3) return;

    if (user) {
      const ok = await useCredit("AI Reading");
      if (!ok) {
        setError(config.locale === "kr" ? "크레딧이 부족합니다." : config.locale === "jp" ? "クレジットが不足しています。" : "Not enough credits.");
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

    let sajuDataForAI = null;
    if (sajuResult) {
      sajuDataForAI = { ...sajuResult, crossKeywords: getSajuTarotCrossKeywords(sajuResult, picked.map((c) => c.suit)), questionAnalysis: getSajuForQuestion(sajuResult, questionType as any) };
    }
    let astroDataForAI = null;
    if (astroResult) {
      astroDataForAI = { ...astroResult, questionAnalysis: getAstrologyForQuestion(astroResult, questionType as any), transits: getCurrentTransits(astroResult) };
    }
    let ziweiDataForAI = null;
    if (ziweiResult) {
      ziweiDataForAI = { ...ziweiResult, questionAnalysis: getZiWeiForQuestion(ziweiResult, questionType as any) };
    }
    const combinationSummary = getCombinationSummary(picked.map((c) => c.id), questionType as any);

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
        body: {
          question, questionType, memo, cards: cardData,
          sajuData: sajuDataForAI, birthInfo,
          astrologyData: astroDataForAI, ziweiData: ziweiDataForAI,
          combinationSummary,
          locale: config.locale,
        },
      });

      if (fnError) throw fnError;

      const reading = aiData?.reading;
      setAiReading(reading);

      if (session?.id && reading) {
        await supabase
          .from("reading_sessions")
          .update({
            ai_reading: reading as any,
            tarot_score: reading.scores?.tarot || null,
            saju_score: reading.scores?.saju || null,
            astrology_score: reading.scores?.astrology || null,
            ziwei_score: reading.scores?.ziwei || null,
            final_confidence: reading.scores?.overall || null,
            status: "completed",
          })
          .eq("id", session.id);
      }

      setStep("result");
    } catch (err: any) {
      console.error("Reading error:", err);
      setError(err.message || "Error occurred");
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
    setSajuResult(null);
    setAstroResult(null);
    setZiweiResult(null);
    setAiReading(null);
    setError(null);
    setSelectedQuestionType(null);
    setDeck(tarotCards.map((card) => makeDeckCard(card, false, false, false)));
  };

  return (
    <div className={`relative min-h-screen bg-background ${config.themeClass}`}
         style={{ fontFamily: config.bodyFont }}>
      {/* Background: Cosmic for US, standard for others */}
      {config.locale === "us" ? (
        <CosmicBackground />
      ) : (
        <>
          <div className="fixed inset-0 z-0">
            <img src={heroBg} alt="" className="h-full w-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
          </div>
          <FloatingStars />
        </>
      )}

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
            <div className="animate-float mb-4 text-4xl">{config.locale === "us" ? "✦" : "☽"}</div>
            <span className={`text-sm italic tracking-[0.3em] ${config.locale === "us" ? "text-cosmic-accent" : "text-gold-light"}`}
                  style={{ fontFamily: config.displayFont }}>
              {config.siteSubtitle}
            </span>
            </span>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
                style={{ fontFamily: config.displayFont }}>
              {config.siteTitle}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {config.siteDescription}
            </p>
            <div className={`mx-auto mt-6 h-px w-32 bg-gradient-to-r ${config.locale === "us" ? "from-transparent via-purple-400/40 to-transparent" : "from-transparent via-gold/40 to-transparent"}`} />

            {/* Step indicator */}
            <div className="mt-6 flex items-center justify-center gap-2">
              {config.stepLabels.map((label, i) => {
                const stepOrder = ["question", "birthInfo", "select", "result"];
                const currentIdx = stepOrder.indexOf(step === "loading" ? "result" : step);
                return (
                    <div key={label} className="flex items-center gap-2">
                      <div
                        className={`flex h-7 items-center rounded-full px-3 text-[10px] font-medium transition-all ${
                          i <= currentIdx
                            ? config.locale === "us"
                              ? "bg-purple-500/20 text-purple-300"
                              : "bg-gold/20 text-gold"
                            : "bg-secondary/50 text-muted-foreground/40"
                        }`}
                      >
                        {label}
                      </div>
                      {i < 3 && (
                        <div className={`h-px w-4 ${i < currentIdx ? (config.locale === "us" ? "bg-purple-400/40" : "bg-gold/40") : "bg-border/30"}`} />
                      )}
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
                      <h2 className="text-xl font-semibold text-foreground"
                          style={{ fontFamily: config.displayFont }}>
                        {config.questionTitle}
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {config.questionSubtitle}
                      </p>
                    </div>

                    {/* Question type quick select */}
                    <div className="mb-4 flex flex-wrap gap-2">
                      {config.questionTypes.map((qt) => (
                        <button
                          key={qt.value}
                          onClick={() => setSelectedQuestionType(qt.value)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                            selectedQuestionType === qt.value
                              ? "bg-gold/20 text-gold border border-gold/30"
                              : "bg-secondary/50 text-muted-foreground hover:bg-muted border border-transparent"
                          }`}
                        >
                          {qt.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <Input
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="rounded-xl border-border/50 bg-background/50 backdrop-blur text-foreground placeholder:text-muted-foreground/50"
                        placeholder={config.questionPlaceholder}
                      />
                      <Textarea
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        className="min-h-[80px] rounded-xl border-border/50 bg-background/50 backdrop-blur text-foreground placeholder:text-muted-foreground/50"
                        placeholder={config.memoPlaceholder}
                      />
                      {question.trim() && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-gold/30 text-gold text-xs">
                            {config.classifyLabel(questionType)}
                          </Badge>
                        </div>
                      )}
                      <Button
                        className="w-full rounded-xl bg-gradient-to-r from-primary to-gold text-primary-foreground font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                        onClick={() => setStep("birthInfo")}
                        disabled={!question.trim()}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {config.nextButton}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Birth Info */}
            {step === "birthInfo" && (
              <LocalizedBirthInfoForm
                key="birthInfo"
                config={config}
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
                {/* Engine summary (only for KR) */}
                {config.locale === "kr" && sajuResult && (
                  <Card className="mb-6 border-border/50 bg-card/80 backdrop-blur-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs italic text-gold" style={{ fontFamily: config.displayFont }}>
                          saju analysis
                        </span>
                        <Badge variant="outline" className="border-gold/30 text-gold text-[10px]">
                          {sajuResult.strength}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>일간: {sajuResult.ilgan}({sajuResult.ilganElement})</span>
                        <span>•</span>
                        <span>용신: {sajuResult.yongsin}</span>
                        <span>•</span>
                        <span>
                          {sajuResult.yearPillar.cheongan}{sajuResult.yearPillar.jiji} /
                          {sajuResult.monthPillar.cheongan}{sajuResult.monthPillar.jiji} /
                          {sajuResult.dayPillar.cheongan}{sajuResult.dayPillar.jiji} /
                          {sajuResult.hourPillar.cheongan}{sajuResult.hourPillar.jiji}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-semibold text-foreground"
                      style={{ fontFamily: config.displayFont }}>
                    {config.cardSelectTitle}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {config.cardSelectSubtitle}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    {config.cardPositions.map((pos, i) => `${i + 1}: ${pos}`).join(" · ")}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm transition-all ${
                          i < picked.length
                            ? "border-gold bg-gold/20 text-gold glow-gold"
                            : "border-border/30 text-muted-foreground/30"
                        }`}
                        style={{ fontFamily: config.displayFont }}
                      >
                        {i < picked.length ? getCardDisplayName(picked[i], config.locale)[0] : i + 1}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap items-center justify-center gap-1.5">
                  <Filter className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                  {Object.entries(config.suitLabels).map(([key, label]) => (
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
                    const dir = getCardDirectionLabel(card.isReversed, config.locale);
                    const isUS = config.locale === "us";
                    return (
                      <motion.button
                        whileHover={!isDisabled ? { y: isUS ? -10 : -6, scale: isUS ? 1.08 : 1.05, rotateY: isUS ? 5 : 0 } : {}}
                        whileTap={!isDisabled ? { scale: 0.92 } : {}}
                        key={card.id}
                        onClick={() => selectCard(card)}
                        disabled={isDisabled}
                        className={`group relative aspect-[0.65] overflow-hidden rounded-lg border transition-all duration-300 ${
                          isSelected
                            ? isUS
                              ? "border-purple-400/60 glow-cosmic animate-card-mystical"
                              : "border-gold/60 glow-gold-strong"
                            : isDisabled
                            ? "border-border/20 opacity-40 cursor-not-allowed"
                            : isUS
                            ? "border-purple-500/20 hover:border-purple-400/40 cursor-pointer hover:shadow-[0_0_25px_-5px_hsl(270_60%_60%/0.3)]"
                            : "border-border/30 hover:border-gold/30 cursor-pointer"
                        }`}
                      >
                        {isSelected ? (
                          <motion.div
                            initial={{ rotateY: 180, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className={`flex h-full flex-col items-center justify-center p-1.5 ${
                              isUS
                                ? "bg-gradient-to-b from-purple-500/15 via-indigo-500/10 to-blue-500/15"
                                : "bg-gradient-to-b from-gold/10 to-accent/10"
                            }`}
                          >
                            <span className={`text-lg font-semibold ${isUS ? "text-purple-300" : "text-gold"}`}
                                  style={{ fontFamily: config.displayFont }}>
                              {card.name[0]}
                            </span>
                            <span className="mt-0.5 text-[9px] font-medium text-foreground">
                              {getCardDisplayName(card, config.locale)}
                            </span>
                            <span className={`mt-0.5 flex items-center gap-0.5 text-[8px] ${isUS ? "text-purple-300/80" : "text-gold-light"}`}>
                              {card.isReversed ? (
                                <><EyeOff className="h-2 w-2" /> {dir.short}</>
                              ) : (
                                <><Eye className="h-2 w-2" /> {dir.short}</>
                              )}
                            </span>
                          </motion.div>
                        ) : (
                          <img
                            src={cardBackImg}
                            alt="tarot card"
                            className={`h-full w-full object-cover transition-all duration-300 ${
                              isUS
                                ? "opacity-60 group-hover:opacity-100 group-hover:brightness-110"
                                : "opacity-70 group-hover:opacity-100"
                            }`}
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
                        {picked.map((card, idx) => {
                          const dir = getCardDirectionLabel(card.isReversed, config.locale);
                          return (
                            <Badge
                              key={card.id}
                              className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-foreground"
                            >
                              {idx + 1}. {getCardDisplayName(card, config.locale)}
                              <span className="ml-1 text-gold">
                                ({dir.short})
                              </span>
                            </Badge>
                          );
                        })}
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
                            {config.submitButton}
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
                      <h2 className="text-xl font-semibold text-foreground"
                          style={{ fontFamily: config.displayFont }}>
                        {config.errorTitle}
                      </h2>
                      <p className="mt-3 text-sm text-muted-foreground">{error}</p>
                      <Button
                        variant="secondary"
                        className="mt-6 rounded-full"
                        onClick={resetAll}
                      >
                        {config.resetButton}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <LocalizedReadingResult
                    config={config}
                    reading={aiReading}
                    isLoading={step === "loading"}
                    onReset={resetAll}
                    hasBirthInfo={!!birthInfo}
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

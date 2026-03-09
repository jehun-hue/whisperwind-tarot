import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { tarotCards, makeDeckCard, type DeckCard } from "@/data/tarotCards";
import { calculateSaju, getSajuTarotCrossKeywords, getSajuForQuestion, type SajuResult } from "@/lib/saju";
import { calculateNatalChart, type AstrologyResult } from "@/lib/astrology";
import { calculateZiWei, type ZiWeiResult } from "@/lib/ziwei";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import LocalizedBirthInfoForm from "@/components/LocalizedBirthInfoForm";
import UserHeader from "@/components/UserHeader";
import CosmicBackground from "@/components/CosmicBackground";
import heroBg from "@/assets/tarot-hero-bg.jpg";
import cardBackImg from "@/assets/card-back.png";
import { type LocaleConfig, type Locale, getCardDisplayName, getCardDirectionLabel } from "@/config/locales";
import { useSEO } from "@/hooks/useSEO";
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

const seoData: Record<Locale, { title: string; description: string }> = {
  kr: {
    title: "통합 점술 상담 — 타로 + 사주 교차 검증 리딩",
    description: "타로, 사주, 점성술, 자미두수를 결합한 교차 검증 점술 상담. 깊이 있는 리딩으로 당신의 질문에 답합니다.",
  },
  jp: {
    title: "AI占いリーディング — タロット＋占星術の総合鑑定",
    description: "タロットと西洋占星術を組み合わせたAI占いリーディング。あなたの心に寄り添う優しい鑑定をお届けします。",
  },
  us: {
    title: "AI Spiritual Reading — Tarot + Astrology Cosmic Guidance",
    description: "AI-powered Tarot and Astrology spiritual reading. Get deep cosmic guidance, energy insights, and actionable advice for love, career, and life.",
  },
};

export default function LocalizedClientPage({ config }: LocalizedClientPageProps) {
  const { user, useCredit } = useAuth();

  useSEO({
    title: seoData[config.locale].title,
    description: seoData[config.locale].description,
    lang: config.lang,
    canonical: `${window.location.origin}/${config.locale}`,
  });
  const [question, setQuestion] = useState("");
  const [memo, setMemo] = useState("");
  const [step, setStep] = useState<"question" | "birthInfo" | "select" | "loading" | "result">("question");
  const [deck, setDeck] = useState<DeckCard[]>(() => {
    const shuffled = [...tarotCards].sort(() => Math.random() - 0.5);
    return shuffled.map((card) => makeDeckCard(card, false, false, false));
  });
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
    try {
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
    } catch (err) {
      console.error("Birth analysis error:", err);
      // Still proceed to card selection even if analysis fails
      setBirthInfo(info);
      setStep("select");
    }
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

    setStep("loading");
    setError(null);

    const cardData = picked.map((c) => ({
      id: c.id,
      name: c.name,
      korean: c.korean,
      suit: c.suit,
      isReversed: c.isReversed,
    }));

    let sajuDataForDB = null;
    if (sajuResult) {
      sajuDataForDB = { ...sajuResult, crossKeywords: getSajuTarotCrossKeywords(sajuResult, picked.map((c) => c.suit)), questionAnalysis: getSajuForQuestion(sajuResult, questionType as any) };
    }

    try {
      const { error: dbError } = await supabase
        .from("reading_sessions")
        .insert({
          question, question_type: questionType, memo: memo || null,
          gender: birthInfo?.gender || null, birth_date: birthInfo?.birthDate || null,
          birth_time: birthInfo?.birthTime || null, birth_place: birthInfo?.birthPlace || null,
          is_lunar: birthInfo?.isLunar || false, cards: cardData as any,
          saju_data: sajuDataForDB as any, status: "pending",
          user_id: user?.id || null,
          user_name: birthInfo?.name || null,
        });

      if (dbError) throw dbError;

      setStep("result");
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message || "Error occurred");
      setStep("result");
    }
  };

  const resetAll = () => {
    setQuestion("");
    setMemo("");
    setPicked([]);
    setSuitFilter("all");
    setAiReading(null);
    setError(null);
    setSelectedQuestionType(null);
    const shuffled = [...tarotCards].sort(() => Math.random() - 0.5);
    setDeck(shuffled.map((card) => makeDeckCard(card, false, false, false)));
    // 출생정보가 이미 있으면 질문 단계로, 출생정보 입력은 생략
    setStep("question");
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
        <UserHeader locale={config.locale} />
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
                      <Button
                        className={`w-full rounded-xl font-medium shadow-lg transition-shadow ${
                          config.locale === "us"
                            ? "bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-purple-500/20 hover:shadow-purple-500/40"
                            : "bg-gradient-to-r from-primary to-gold text-primary-foreground shadow-primary/20 hover:shadow-primary/40"
                        }`}
                        onClick={() => setStep(birthInfo ? "select" : "birthInfo")}
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
                  <p className="text-sm text-muted-foreground">
                    {config.locale === "kr" ? "카드를 섞었습니다." : config.locale === "jp" ? "カードをシャッフルしました。" : "The cards have been shuffled."}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-foreground"
                      style={{ fontFamily: config.displayFont }}>
                    {config.locale === "kr" ? "마음이 끌리는 카드 3장을 선택하세요" : config.locale === "jp" ? "心が惹かれるカードを3枚選んでください" : "Choose 3 cards that call to you"}
                  </h2>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    {[0, 1, 2].map((i) => {
                      const posLabels = config.locale === "kr"
                        ? ["현재 상황", "핵심 문제", "결과 방향"]
                        : config.locale === "jp"
                        ? ["現状", "核心", "結果"]
                        : ["Present", "Challenge", "Outcome"];
                      return (
                        <div
                          key={i}
                          className={`flex flex-col items-center gap-1`}
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm transition-all ${
                              i < picked.length
                                ? config.locale === "us"
                                  ? "border-purple-400 bg-purple-500/20 text-purple-300 glow-cosmic"
                                  : "border-gold bg-gold/20 text-gold glow-gold"
                                : "border-border/30 text-muted-foreground/30"
                            }`}
                            style={{ fontFamily: config.displayFont }}
                          >
                            {i < picked.length ? getCardDisplayName(picked[i], config.locale)[0] : i + 1}
                          </div>
                          <span className={`text-[10px] ${i < picked.length ? (config.locale === "us" ? "text-purple-300" : "text-gold") : "text-muted-foreground/50"}`}>
                            {posLabels[i]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>


                <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13">
                  {deck.map((card) => {
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
                              className={`rounded-full border px-3 py-1.5 text-foreground ${
                                config.locale === "us"
                                  ? "border-purple-400/30 bg-purple-500/10"
                                  : "border-gold/30 bg-gold/10"
                              }`}
                            >
                              {idx + 1}. {getCardDisplayName(card, config.locale)}
                              <span className={`ml-1 ${config.locale === "us" ? "text-purple-300" : "text-gold"}`}>
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
                            className={`w-full rounded-xl font-medium shadow-lg ${
                              config.locale === "us"
                                ? "bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-purple-500/20"
                                : "bg-gradient-to-r from-primary to-gold text-primary-foreground shadow-primary/20"
                            }`}
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

            {/* Step 4: Completion */}
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
                ) : step === "loading" ? (
                  <Card className={`mx-auto max-w-lg border-border/50 bg-card/80 backdrop-blur-xl animate-pulse-glow`}>
                    <CardContent className="py-16 px-8 text-center">
                      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-t-transparent ${config.locale === 'us' ? 'border-purple-400' : 'border-gold'}" />
                      <h2 className="text-xl font-semibold text-foreground"
                          style={{ fontFamily: config.displayFont }}>
                        {config.loadingTitle}
                      </h2>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {config.loadingSubtitle}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mx-auto max-w-lg"
                  >
                    <Card className={`border-border/50 bg-card/80 backdrop-blur-xl ${
                      config.locale === "us" ? "glow-cosmic" : "glow-gold"
                    }`}>
                      <CardContent className="py-12 px-8 text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", delay: 0.2 }}
                          className="mb-6 text-5xl"
                        >
                          ✦
                        </motion.div>
                        <h2 className="text-xl font-semibold text-foreground"
                            style={{ fontFamily: config.displayFont }}>
                          {birthInfo?.name
                            ? config.locale === "kr"
                              ? `${birthInfo.name}님의 리딩이 접수되었습니다`
                              : config.locale === "jp"
                              ? `${birthInfo.name}様のリーディングを受け付けました`
                              : `${birthInfo.name}'s Reading Submitted`
                            : config.completionTitle}
                        </h2>
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                          {config.completionMessage}
                        </p>
                        <div className={`mx-auto my-6 h-px w-32 bg-gradient-to-r from-transparent ${
                          config.locale === "us" ? "via-purple-400/40" : "via-gold/40"
                        } to-transparent`} />
                        <p className="text-xs leading-relaxed text-muted-foreground/70 whitespace-pre-line">
                          {config.completionSubMessage}
                        </p>

                        {/* Show selected cards summary */}
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                          {picked.map((card, idx) => {
                            const dir = getCardDirectionLabel(card.isReversed, config.locale);
                            return (
                              <Badge
                                key={card.id}
                                variant="outline"
                                className={`rounded-full px-3 py-1 text-xs ${
                                  config.locale === "us"
                                    ? "border-purple-400/30 text-purple-300"
                                    : "border-gold/30 text-gold"
                                }`}
                              >
                                {idx + 1}. {getCardDisplayName(card, config.locale)} ({dir.short})
                              </Badge>
                            );
                          })}
                        </div>

                        <Button
                          variant="secondary"
                          className="mt-8 rounded-full border border-border/50 bg-secondary/50 backdrop-blur"
                          onClick={resetAll}
                        >
                          {config.resetButton}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

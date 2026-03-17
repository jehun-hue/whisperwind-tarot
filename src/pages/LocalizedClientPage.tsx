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
import LocalizedReadingResult from "@/components/LocalizedReadingResult";
import { toast } from "sonner";
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
    title: "占いリーディング — タロット＋占星術の総合鑑定",
    description: "タロットと西洋占星術을 組み合わせた占いリーディング。あなたの心に寄り添う優しい鑑定をお届けします。",
  },
  us: {
    title: "Spiritual Reading — Tarot + Astrology Cosmic Guidance",
    description: "Tarot and Astrology spiritual reading. Get deep cosmic guidance, energy insights, and actionable advice for love, career, and life.",
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
    const shuffled = [...tarotCards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.map((card) => makeDeckCard(card, false, false, false));
  });
  const [picked, setPicked] = useState<DeckCard[]>([]);
  const [suitFilter, setSuitFilter] = useState("all");
  const [birthInfo, setBirthInfo] = useState<BirthInfo | null>(null);
  const [sajuResult, setSajuResult] = useState<SajuResult | null>(null);
  const [astroResult, setAstroResult] = useState<AstrologyResult | null>(null);
  const [ziweiResult, setZiweiResult] = useState<ZiWeiResult | null>(null);
  const [aiReading, setAiReading] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [purchasedGrade, setPurchasedGrade] = useState<string>("C");
  const [isPolling, setIsPolling] = useState(false);
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
    if (step !== "select" || picked.length >= 5 || card.isPicked) return;
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
      const minute = info.birthTime && info.birthTime.includes(":") ? parseInt(info.birthTime.split(":")[1]) || 0 : 0;

      const saju = calculateSaju(y, m, d, hour, minute, info.gender);
      setSajuResult(saju);
      const astro = calculateNatalChart(y, m, d, hour, minute);
      setAstroResult(astro);
      const ziwei = calculateZiWei(y, m, d, hour, minute, info.gender);
      setZiweiResult(ziwei);
      setStep("select");
    } catch (err) {
      console.error("Birth analysis error:", err);
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
    if (picked.length !== 5) return;

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
      const { data, error: dbError } = await supabase
        .from("reading_sessions")
        .insert({
          question, question_type: questionType, memo: memo || null,
          gender: birthInfo?.gender || null, birth_date: birthInfo?.birthDate || null,
          birth_time: birthInfo?.birthTime || null, birth_place: birthInfo?.birthPlace || null,
          is_lunar: birthInfo?.isLunar || false, cards: cardData as any,
          saju_data: sajuDataForDB as any, status: "pending",
          user_id: user?.id || null,
          user_name: birthInfo?.name || null,
          locale: config.locale,
        }).select('id');

      if (dbError) throw dbError;

      const newSessionId = (data as any)[0]?.id;
      if (newSessionId) setSessionId(newSessionId);

      setStep("result");
      setIsPolling(true);
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
    setSessionId(null);
    setPurchasedGrade("C");
    setIsPolling(false);
    const shuffled = [...tarotCards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setDeck(shuffled.map((card) => makeDeckCard(card, false, false, false)));
    setStep("question");
  };

  useEffect(() => {
    let pollTimer: NodeJS.Timeout;
    if (isPolling && sessionId) {
      const poll = async () => {
        const { data } = await (supabase as any)
          .from("reading_sessions")
          .select("ai_reading, status, purchased_grade")
          .eq("id", sessionId)
          .single();

        if (data?.status === "completed" && data.ai_reading) {
          setAiReading(data.ai_reading);
          setPurchasedGrade(data.purchased_grade || "C");
          setIsPolling(false);
        } else if (data?.status === "error") {
          setError("AI 분석 중 오류가 발생했습니다.");
          setIsPolling(false);
        } else {
          pollTimer = setTimeout(poll, 3000);
        }
      };
      poll();
    }
    return () => clearTimeout(pollTimer);
  }, [isPolling, sessionId]);

  const { purchaseGrade } = useAuth();

  const handleUpgrade = async (targetGrade: string) => {
    if (!sessionId) return;
    const res = await purchaseGrade(sessionId, targetGrade);
    if (res.success) {
      toast.success(`${targetGrade}등급으로 업그레이드되었습니다.`);
      setPurchasedGrade(targetGrade);
      await (supabase as any).from("reading_sessions").update({ purchased_grade: targetGrade }).eq("id", sessionId);
    } else {
      toast.error(res.error || "업그레이드 실패");
    }
  };

  return (
    <div className={`relative min-h-screen bg-background ${config.themeClass}`}
      style={{ fontFamily: config.bodyFont }}>
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
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
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

            <div className="mt-6 flex items-center justify-center gap-2">
              {config.stepLabels.map((label, i) => {
                const stepOrder = ["question", "birthInfo", "select", "result"];
                const currentIdx = stepOrder.indexOf(step === "loading" ? "result" : step);
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className={`flex h-7 items-center rounded-full px-3 text-[10px] font-medium transition-all ${i <= currentIdx
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
            {step === "question" && (
              <motion.div
                key="question"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
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
                        className={`w-full rounded-xl font-medium shadow-lg transition-shadow ${config.locale === "us"
                            ? "bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-purple-500/20"
                            : "bg-gradient-to-r from-primary to-gold text-primary-foreground shadow-primary/20"
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

            {step === "birthInfo" && (
              <LocalizedBirthInfoForm
                key="birthInfo"
                config={config}
                onSubmit={handleBirthInfoSubmit}
                onSkip={handleBirthInfoSkip}
              />
            )}

            {step === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
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
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="mb-6 text-center">
                  <h2 className="mt-1 text-2xl font-semibold text-foreground"
                    style={{ fontFamily: config.displayFont }}>
                    {config.locale === "kr" ? (<>마음이 끌리는<br />카드 5장을 선택하세요</>) : config.locale === "jp" ? (<>心が惹かれるカードを<br />5枚選んでください</>) : (<>Choose 5 cards<br />that call to you</>)}
                  </h2>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    {[0, 1, 2, 3, 4].map((i) => {
                      const posLabels = config.locale === "kr"
                        ? ["현재 상황", "핵심 문제", "숨겨진 원인", "조언", "가까운 결과"]
                        : config.locale === "jp"
                          ? ["現状", "課題", "原因", "助言", "結果"]
                          : ["Present", "Challenge", "Cause", "Advice", "Outcome"];
                      return (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm transition-all ${i < picked.length
                                ? config.locale === "us" ? "border-purple-400 bg-purple-500/20 text-purple-300 glow-cosmic" : "border-gold bg-gold/20 text-gold glow-gold"
                                : "border-border/30 text-muted-foreground/30"
                              }`}
                          >
                            {i < picked.length ? getCardDisplayName(picked[i], config.locale)[0] : i + 1}
                          </div>
                          <span className={`text-[10px] whitespace-nowrap break-keep ${i < picked.length ? (config.locale === "us" ? "text-purple-300" : "text-gold") : "text-muted-foreground/50"}`}>
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
                    const isDisabled = card.isPicked || picked.length >= 5;
                    const isUS = config.locale === "us";
                    return (
                      <motion.button
                        key={card.id}
                        onClick={() => selectCard(card)}
                        disabled={isDisabled}
                        className={`group relative aspect-[0.65] overflow-hidden rounded-lg border transition-all duration-300 ${isSelected
                            ? isUS ? "border-purple-400/60 glow-cosmic" : "border-gold/60 glow-gold-strong"
                            : isDisabled ? "border-border/20 opacity-40" : isUS ? "border-purple-500/20 hover:border-purple-400/40" : "border-border/30 hover:border-gold/30"
                          }`}
                      >
                        {isSelected ? (
                          <div className={`flex h-full flex-col items-center justify-center p-1.5 ${isUS ? "bg-purple-500/15" : "bg-gold/10"}`}>
                            <span className={`text-lg font-bold ${isUS ? "text-purple-300" : "text-gold"}`}>{getCardDisplayName(card, config.locale)[0]}</span>
                          </div>
                        ) : (
                          <img src={cardBackImg} alt="" className="h-full w-full object-cover opacity-60" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                {picked.length === 5 && (
                  <Button className="mt-8 w-full rounded-xl bg-primary text-primary-foreground" onClick={handleSubmit}>
                    {config.submitButton}
                  </Button>
                )}
              </motion.div>
            )}

            {(step === "loading" || step === "result") && (
              <motion.div key="result">
                {error ? (
                  <Card className="mx-auto max-w-lg border-destructive/30 bg-card/80 backdrop-blur-xl">
                    <CardContent className="py-10 px-8 text-center">
                      <h2 className="text-xl font-semibold text-foreground">{config.errorTitle}</h2>
                      <p className="mt-3 text-sm text-muted-foreground">{error}</p>
                      <Button variant="secondary" className="mt-6 rounded-full" onClick={resetAll}>{config.resetButton}</Button>
                    </CardContent>
                  </Card>
                ) : step === "loading" || (step === "result" && !aiReading) ? (
                  <Card className="mx-auto max-w-lg border-border/50 bg-card/80 backdrop-blur-xl">
                    <CardContent className="py-16 px-8 text-center">
                      <div className={`mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-t-transparent ${config.locale === 'us' ? 'border-purple-400' : 'border-gold'}`} />
                      <h2 className="text-xl font-semibold text-foreground">{aiReading ? config.completionTitle : config.loadingTitle}</h2>
                      <p className="mt-3 text-sm text-muted-foreground">{aiReading ? config.completionMessage : config.loadingSubtitle}</p>
                    </CardContent>
                  </Card>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl">
                    <LocalizedReadingResult
                      config={config}
                      reading={aiReading}
                      isLoading={false}
                      onReset={resetAll}
                      hasBirthInfo={!!birthInfo}
                      onUpgrade={handleUpgrade}
                      sessionId={sessionId!}
                    />
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

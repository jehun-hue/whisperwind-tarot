import React, { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import type { BirthInfo } from "@/components/BirthInfoForm";
import { TarotCard } from "@/components/TarotCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Eye, EyeOff, CheckCircle2, ChevronRight, Star, Crown, ArrowLeft, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { tarotCards, makeDeckCard, type DeckCard } from "@/data/tarotCards";
import { calculateNatalChart, getAstrologyForQuestion, getCurrentTransits, type AstrologyResult } from "@/lib/astrology";
import { calculateZiWei, getZiWeiForQuestion, type ZiWeiResult } from "@/lib/ziwei";
import { getManseryeok } from "@/lib/sajuCalc";
import { getCombinationSummary } from "@/data/tarotCombinations";
import { supabase } from "@/integrations/supabase/client";
import { classifyQuestion, type Category, type ClassificationResult } from "@/lib/classification";
import ReadingResultV3 from "@/components/ReadingResultV3";
import SajuManualOverride from "@/components/SajuManualOverride";
import cardBackImg from "@/assets/card-back.png";

// ─── Types ───
type Step = "question" | "birthInfo" | "romance" | "cardSelect" | "submitted";
type Grade = "C" | "B" | "A" | "S";
type RomanceStatus = "solo" | "some" | "dating" | "breakup" | "marriage";

const ROMANCE_KEYWORDS = /(연애|사랑|썸|이별|결혼|애인|남친|여친|짝사랑|재회|소개팅|남자친구|여자친구|좋아하는|연인|데이트|고백|헤어|바람|외도|불륜|속마음|상대방|그사람|그 사람)/;

const QUICK_QUESTIONS = [
  { emoji: "💕", label: "연애운", text: "올해 하반기 연애운이 궁금해요" },
  { emoji: "💰", label: "재물운", text: "올해 재물운과 투자 방향이 궁금해요" },
  { emoji: "💼", label: "직장운", text: "직장에서의 승진과 커리어 방향이 궁금해요" },
  { emoji: "🔮", label: "종합운", text: "올해 전반적인 운세와 흐름이 궁금해요" },
];

const ROMANCE_OPTIONS: { value: RomanceStatus; emoji: string; label: string }[] = [
  { value: "solo", emoji: "🙋", label: "솔로 (연인 없음)" },
  { value: "some", emoji: "💬", label: "썸/진행 중인 관계" },
  { value: "dating", emoji: "❤️", label: "연애 중" },
  { value: "breakup", emoji: "💔", label: "이별 후 / 재회 고민" },
  { value: "marriage", emoji: "💍", label: "결혼 고민 중" },
];

const GRADE_INFO: { grade: Grade; label: string; desc: string; price: string; priceNum: number; badge?: string; features?: string }[] = [
  { grade: "C", label: "기본 리딩", desc: "타로 3장 기본 해석", price: "무료", priceNum: 0 },
  { grade: "B", label: "상세 리딩", desc: "타로 + 기본 교차검증", price: "₩1,000", priceNum: 1000 },
  { grade: "A", label: "심층 리딩", desc: "5장 + 4체계 교차검증", price: "₩3,000", priceNum: 3000 },
  { grade: "S", label: "최고급 종합 리딩", desc: "6체계 교차검증 + 연애 심화 + 월별 타임라인 + 실천 가이드", price: "₩5,000", priceNum: 5000, badge: "⭐ 추천" },
];

const BIRTH_HOURS = [
  { value: "unknown", label: "모름" },
  ...Array.from({ length: 24 }, (_, i) => ({
    value: `${i.toString().padStart(2, "0")}:00`,
    label: `${i.toString().padStart(2, "0")}시`,
  })),
];


const HOUR_LABELS: Record<number, string> = {
  0: "00시 (오전)", 1: "01시 (오전)", 2: "02시 (오전)",
  3: "03시 (오전)", 4: "04시 (오전)", 5: "05시 (오전)",
  6: "06시 (오전)", 7: "07시 (오전)", 8: "08시 (오전)",
  9: "09시 (오전)", 10: "10시 (오전)", 11: "11시 (오전)",
  12: "12시 (오후)", 13: "13시 (오후)", 14: "14시 (오후)",
  15: "15시 (오후)", 16: "16시 (오후)", 17: "17시 (오후)",
  18: "18시 (오후)", 19: "19시 (오후)", 20: "20시 (오후)",
  21: "21시 (오후)", 22: "22시 (오후)", 23: "23시 (오후)",
};

function getRequiredCards(grade: Grade): number {
  switch (grade) {
    case "C":
    case "B":
      return 3;
    case "A":
      return 5;
    case "S":
      return 5;
    default:
      return 3;
  }
}

function shuffleDeck<T>(cards: T[]): T[] {
  const arr = [...cards];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Floating Stars ───
function FloatingStars() {
  const stars = useMemo(
    () => Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2.5 + 0.5,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
    })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-gold-light"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size, opacity: 0.3, animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite` }}
        />
      ))}
    </div>
  );
}

// ─── Step Indicator ───
function StepIndicator({ currentStep, isLoveQuestion }: { currentStep: Step; isLoveQuestion: boolean }) {
  const steps = isLoveQuestion
    ? [{ key: "question", label: "질문" }, { key: "birthInfo", label: "출생정보" }, { key: "romance", label: "연애상태" }, { key: "cardSelect", label: "카드선택" }]
    : [{ key: "question", label: "질문" }, { key: "birthInfo", label: "출생정보" }, { key: "cardSelect", label: "카드선택" }];

  const currentIdx = steps.findIndex((s) => s.key === currentStep);
  const effectiveIdx = currentStep === "submitted" ? steps.length : currentIdx;

  return (
    <div className="flex items-center justify-center gap-1.5">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className={`flex h-7 items-center rounded-full px-3 text-[10px] font-medium transition-all ${i <= effectiveIdx ? "bg-gold/20 text-gold" : "bg-secondary/50 text-muted-foreground/40"
            }`}>
            {s.label}
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-3 ${i < effectiveIdx ? "bg-gold/40" : "bg-border/30"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Main Component ───
export default function ClientPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("question");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [question, setQuestion] = useState("");
  const [memo, setMemo] = useState("");

  // Birth info
  const [userName, setUserName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthTime, setBirthTime] = useState("known");
  const [birthHour24, setBirthHour24] = useState<number>(12);
  const [birthMinute, setBirthMinute] = useState<number>(0);
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [isLunar, setIsLunar] = useState(false);
  const [isLeapMonth, setIsLeapMonth] = useState(false);

  // Romance
  const [romanceStatus, setRomanceStatus] = useState<RomanceStatus | null>(null);

  // Cards
  const [deck, setDeck] = useState<DeckCard[]>(() => {
    const shuffled = shuffleDeck([...tarotCards]);
    return shuffled.map((c) => makeDeckCard(c, false, false, false));
  });
  const [picked, setPicked] = useState<DeckCard[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<Grade>("S");

  // Analysis data (internal)
  const [manseryeokResult, setManseryeokResult] = useState<any>(null);
  const [astroResult, setAstroResult] = useState<AstrologyResult | null>(null);
  const [ziweiResult, setZiweiResult] = useState<ZiWeiResult | null>(null);
  const [manualSajuData, setManualSajuData] = useState("");

  // Result
  const [error, setError] = useState<string | null>(null);

  const [classification, setClassification] = useState<ClassificationResult | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (question.trim()) {
        const res = await classifyQuestion(question);
        setClassification(res);
      } else {
        setClassification(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [question]);

  const questionType = classification?.category || "종합";
  const isLoveQuestion = useMemo(() => ROMANCE_KEYWORDS.test(question), [question]);
  const requiredCards = getRequiredCards(selectedGrade);
  const hasEnoughCards = picked.length >= requiredCards;

  const hasBirthDate = birthYear && birthMonth && birthDay;

  // ─── Birth info calculation ───
  const calculateBirthData = useCallback(() => {
    if (!hasBirthDate) return;
    const y = parseInt(birthYear);
    const m = parseInt(birthMonth);
    const d = parseInt(birthDay);
    let hour = 12
    let minute = 0

    if (birthTime && birthTime !== "unknown") {
      const parts = birthTime.split(":")
      const h = parts[0]
      const m = parts[1]

      hour = parseInt(h || "12", 10)
      minute = parseInt(m || "0", 10)
    }

    try {
      const isLunarBool = isLunar === true || String(isLunar) === "true";
      const isLeapBool = isLeapMonth === true;
      console.log("[getManseryeok 호출]", { year: y, month: m, day: d, hour, minute, isLunar: isLunarBool, isLeapMonth: isLeapBool });
      const ms = getManseryeok(y, m, d, hour, minute, isLunarBool, isLeapBool);
      if (!ms) {
        console.warn("사주 자동 계산 실패: 입력된 날짜/시간으로 만세력을 계산할 수 없습니다.");
      }
      setManseryeokResult(ms);

      const astro = calculateNatalChart(y, m, d, hour, minute);
      setAstroResult(astro);
      const ziwei = calculateZiWei(y, m, d, hour, minute, gender as any);
      setZiweiResult(ziwei);
    } catch (e) {
      console.warn("Analysis data prep error:", e);
    }
  }, [birthYear, birthMonth, birthDay, birthTime, isLunar, isLeapMonth, gender, hasBirthDate]);

  const selectCard = (card: DeckCard) => {
    if (step !== "cardSelect" || picked.length >= requiredCards || card.isPicked) return;
    const rev = Math.random() < 0.35;
    setDeck((prev) => prev.map((c) => (c.id === card.id ? makeDeckCard(c, true, true, rev) : c)));
    setPicked((prev) => [...prev, makeDeckCard(card, true, true, rev)]);
  };

  const handleGradeChange = (grade: Grade) => {
    setSelectedGrade(grade);
    const needed = getRequiredCards(grade);
    if (picked.length > needed) {
      const keep = picked.slice(0, needed);
      const removed = picked.slice(needed);
      setPicked(keep);
      setDeck((prev) =>
        prev.map((c) => {
          if (removed.some((r) => r.id === c.id)) {
            return makeDeckCard(c, false, false, false);
          }
          return c;
        })
      );
    }
  };

  // ─── Submit: DB 저장 후 즉시 접수완료, AI는 백그라운드 ───
  const handleSubmit = async () => {
    if (!hasEnoughCards) return;
    // B-158 fix: 중복 제출 방지
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const spread = ["현재 상황", "핵심 문제", "숨겨진 원인", "조언", "가까운 결과"];
    const cardData = picked.map((c, idx) => ({
      id: c.id, 
      name: c.name, 
      korean: c.korean, 
      suit: c.suit, 
      isReversed: c.isReversed,
      position: spread[idx] || "추가 분석",
      cardCombination: c.cardCombination
    }));

    const birthInfo = hasBirthDate ? {
      gender,
      birthDate: `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`,
      birthTime: birthTime !== "unknown" ? birthTime : "",
      birthPlace: "",
      isLunar,
      isLeapMonth,
    } : null;

    let sajuDataForAI: any = null;
    let astroDataForAI: any = null;
    let ziweiDataForAI: any = null;

    if (manseryeokResult) {
      sajuDataForAI = manseryeokResult;
    }
    if (astroResult) {
      astroDataForAI = { ...astroResult, questionAnalysis: getAstrologyForQuestion(astroResult, questionType), transits: getCurrentTransits(astroResult) };
    }
    if (ziweiResult) {
      ziweiDataForAI = { ...ziweiResult, questionAnalysis: getZiWeiForQuestion(ziweiResult, questionType) };
    }
    const combinationSummary = getCombinationSummary(picked.map((c) => c.id), questionType);

    try {
      const { data: session, error: dbError } = await supabase
        .from("reading_sessions")
        .insert({
          question, 
          question_type: questionType, 
          memo: memo || null,
          final_confidence: classification?.confidence || 0,
          gender: birthInfo?.gender || null, 
          birth_date: birthInfo?.birthDate || null,
          birth_time: birthInfo?.birthTime || null, 
          is_lunar: birthInfo?.isLunar || false,
          cards: cardData as any, 
          saju_data: sajuDataForAI as any, 
          user_name: userName || null,
          status: "pending",
        })
        .select().single();

      if (dbError) throw dbError;

      setStep("submitted");

    } catch (err: any) {
      console.error("Session save error:", err);
      setError(err.message || "접수 중 오류가 발생했습니다.");
      setStep("submitted");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAll = () => {
    setStep("question");
    setQuestion(""); setMemo(""); setUserName("");
    setBirthYear(""); setBirthMonth(""); setBirthDay("");
    setBirthTime("unknown"); setBirthHour24(12); setBirthMinute(0); setGender("");
    setIsLunar(false); setIsLeapMonth(false);
    setRomanceStatus(null);
    setPicked([]); setSelectedGrade("S");
    setManseryeokResult(null);
    setAstroResult(null); setZiweiResult(null);
    setManualSajuData("");
    setError(null);
    const shuffled = shuffleDeck([...tarotCards]);
    setDeck(shuffled.map((c) => makeDeckCard(c, false, false, false)));
  };

  const goBack = () => {
    if (step === "birthInfo") setStep("question");
    else if (step === "romance") setStep("birthInfo");
    else if (step === "cardSelect") setStep(isLoveQuestion ? "romance" : "birthInfo");
  };

  const proceedFromBirth = () => {
    if (hasBirthDate && gender) {
      calculateBirthData();
      if (isLoveQuestion) setStep("romance");
      else setStep("cardSelect");
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <FloatingStars />
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-gold/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-lg px-4 py-8 sm:px-6">
        {/* Admin button */}
        <button
          onClick={() => navigate("/reader")}
          className="absolute top-4 right-4 p-2 z-50 rounded-full text-muted-foreground/50 hover:text-gold hover:bg-secondary/50 transition-colors"
          title="관리자"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <div className="animate-float mb-3 text-3xl">☽</div>
          <span className="font-display text-xs italic tracking-[0.3em] text-gold-light">premium tarot salon</span>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          {step !== "submitted" && (
            <div className="mt-5">
              <StepIndicator currentStep={step} isLoveQuestion={isLoveQuestion} />
            </div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ═══ STEP 1: Question ═══ */}
          {step === "question" && (
            <motion.div key="q" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
              <Card className="border-border/50 bg-card/80 backdrop-blur-xl animate-pulse-glow">
                <CardContent className="p-6 sm:p-8 space-y-5">
                  <div className="text-center">
                    <h2 className="font-display text-2xl font-semibold text-foreground">무엇이 궁금하신가요?</h2>
                    <p className="mt-1 text-xs text-muted-foreground">마음속 질문을 자유롭게 적어주세요</p>
                  </div>

                  <Input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="rounded-xl border-border/50 bg-background/50 backdrop-blur text-foreground placeholder:text-muted-foreground/50"
                    placeholder="예: 올해 하반기 연애운이 궁금해요"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q.label}
                        onClick={() => setQuestion(q.text)}
                        className={`rounded-xl border p-3 text-left transition-all ${question === q.text
                          ? "border-gold/50 bg-gold/10"
                          : "border-border/30 bg-background/30 hover:border-border/60"
                          }`}
                      >
                        <span className="text-lg">{q.emoji}</span>
                        <span className={`ml-2 text-sm font-medium ${question === q.text ? "text-gold" : "text-foreground"}`}>
                          {q.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  <Textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="min-h-[70px] rounded-xl border-border/50 bg-background/50 backdrop-blur text-foreground placeholder:text-muted-foreground/50"
                    placeholder="상황을 자세히 적어주시면 더 정확한 리딩이 가능합니다 (선택)"
                  />

                  {question.trim() && (
                    <div className="flex flex-wrap gap-2">
                       <Badge variant="outline" className="border-gold/30 text-gold text-xs">
                        자동 분류: {
                          questionType === "연애" ? "💕 연애" :
                            questionType === "재회" ? "💔 재회" :
                              questionType === "직업" ? "💼 직업" :
                                questionType === "사업" ? "🏢 사업" :
                                  questionType === "금전" ? "💰 금전" : "🔮 종합"
                        }
                      </Badge>
                      {classification?.intent && (
                        <Badge variant="outline" className="border-accent/40 text-accent/80 text-[10px]">
                          {classification.intent}
                        </Badge>
                      )}

                    </div>
                  )}

                  <Button
                    className="w-full rounded-xl bg-gradient-to-r from-accent to-gold text-primary-foreground font-medium shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-shadow"
                    onClick={() => setStep("birthInfo")}
                    disabled={!question.trim()}
                  >
                    다음 <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ═══ STEP 2: Birth Info ═══ */}
          {step === "birthInfo" && (
            <motion.div key="birth" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
              <Card className="border-border/50 bg-card/80 backdrop-blur-xl animate-pulse-glow">
                <CardContent className="p-6 sm:p-8 space-y-5">
                  <button onClick={goBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3 w-3" /> 이전
                  </button>

                  <div className="text-center">
                    <h2 className="font-display text-2xl font-semibold text-foreground">출생 정보를 알려주세요</h2>
                    <p className="mt-1 text-xs text-muted-foreground">더 정밀한 분석을 위해 필요합니다</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">이름(실명)</label>
                    <Input
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="rounded-xl border-border/50 bg-background/50 backdrop-blur text-foreground placeholder:text-muted-foreground/50"
                      placeholder="이름(실명)을 입력해주세요"
                    />
                    <p className="text-[10px] text-accent/70 mt-1">ⓘ 실명을 입력해주세요</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">생년월일</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="YYYY"
                        value={birthYear}
                        maxLength={4}
                        onInput={(e) => {
                          const t = e.currentTarget;
                          t.value = t.value.replace(/[^0-9]/g, '').slice(0, 4);
                        }}
                        onChange={(e) => setBirthYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                        className="rounded-xl border-border/50 bg-background/50 text-foreground placeholder:text-gray-500"
                      />
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="MM"
                        value={birthMonth}
                        maxLength={2}
                        onInput={(e) => {
                          const t = e.currentTarget;
                          t.value = t.value.replace(/[^0-9]/g, '').slice(0, 2);
                        }}
                        onChange={(e) => setBirthMonth(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                        className="rounded-xl border-border/50 bg-background/50 text-foreground placeholder:text-gray-500"
                      />
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="DD"
                        value={birthDay}
                        maxLength={2}
                        onInput={(e) => {
                          const t = e.currentTarget;
                          t.value = t.value.replace(/[^0-9]/g, '').slice(0, 2);
                        }}
                        onChange={(e) => setBirthDay(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                        className="rounded-xl border-border/50 bg-background/50 text-foreground placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center rounded-full border border-border/50 bg-background/30 p-0.5">
                      <button
                        onClick={() => { setIsLunar(false); setIsLeapMonth(false); }}
                        className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${!isLunar ? "bg-accent/20 text-accent shadow-sm" : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        ☀️ 양력
                      </button>
                      <button
                        onClick={() => setIsLunar(true)}
                        className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${isLunar ? "bg-accent/20 text-accent shadow-sm" : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        🌙 음력
                      </button>
                    </div>
                    {isLunar && (
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                        <Checkbox checked={isLeapMonth} onCheckedChange={(v) => setIsLeapMonth(!!v)} />
                        윤달
                      </label>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-purple-200 whitespace-nowrap">출생 시간</label>
                      <div className="flex gap-1.5 flex-1">
                        {/* 시간 입력이 먼저 */}
                        <button
                          type="button"
                          onClick={() => setBirthTime("known")}
                          className={`flex-1 h-9 rounded-lg text-xs font-medium transition-all ${
                            birthTime !== "unknown"
                              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20"
                              : "bg-black/30 text-purple-300/60 border border-purple-500/20"
                          }`}
                        >
                          시간 입력
                        </button>
                        {/* 모름이 뒤에 */}
                        <button
                          type="button"
                          onClick={() => setBirthTime("unknown")}
                          className={`flex-1 h-9 rounded-lg text-xs font-medium transition-all ${
                            birthTime === "unknown"
                              ? "bg-white/10 text-white border border-white/20"
                              : "bg-black/30 text-purple-300/60 border border-purple-500/20"
                          }`}
                        >
                          모름
                        </button>
                      </div>
                    </div>

                    {birthTime === "unknown" && (
                      <p className="text-[10px] text-purple-300/50 ml-1">
                        ⓘ 시간을 모르면 시주를 제외하고 년·월·일주만 사용합니다
                      </p>
                    )}

                    {birthTime !== "unknown" && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="relative flex-1">
                          <select
                            value={birthHour24}
                            onChange={(e) => setBirthHour24(parseInt(e.target.value))}
                            className="w-full h-10 rounded-lg bg-black/40 border border-purple-500/20 text-white text-center text-sm appearance-none cursor-pointer focus:border-purple-400/50 focus:outline-none hover:border-purple-400/40 transition-all"
                            style={{ colorScheme: "dark" }}
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i}>{HOUR_LABELS[i]}</option>
                            ))}
                          </select>
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400/40 text-[10px]">▼</div>
                        </div>

                        <span className="text-purple-400/60 text-sm">:</span>

                        <div className="relative flex-[0.5]">
                          <select
                            value={birthMinute}
                            onChange={(e) => setBirthMinute(parseInt(e.target.value))}
                            className="w-full h-10 rounded-lg bg-black/40 border border-purple-500/20 text-white text-center text-sm appearance-none cursor-pointer focus:border-purple-400/50 focus:outline-none hover:border-purple-400/40 transition-all"
                            style={{ colorScheme: "dark" }}
                          >
                            {Array.from({ length: 60 }, (_, i) => (
                              <option key={i} value={i}>{String(i).padStart(2, "0")}분</option>
                            ))}
                          </select>
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400/40 text-[10px]">▼</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">성별</label>
                    <div className="flex gap-2">
                      {(["female", "male"] as const).map((g) => (
                        <button
                          key={g}
                          onClick={() => setGender(g)}
                          className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${gender === g
                            ? "border-gold/50 bg-gold/10 text-gold"
                            : "border-border/50 bg-background/50 text-muted-foreground hover:bg-muted"
                            }`}
                        >
                          {g === "female" ? "👩 여성" : "👨 남성"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Button
                      className={`w-full rounded-xl font-medium shadow-lg transition-all duration-300 ${
                        hasBirthDate && gender 
                          ? "bg-gradient-to-r from-accent to-gold text-primary-foreground shadow-accent/20 hover:shadow-accent/40 opacity-100" 
                          : "bg-muted text-muted-foreground shadow-none opacity-50 cursor-not-allowed"
                      }`}
                      onClick={proceedFromBirth}
                      disabled={!hasBirthDate || !gender}
                    >
                      다음 <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ═══ STEP 2.5: Romance Status ═══ */}
          {step === "romance" && (
            <motion.div key="romance" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
              <Card className="border-border/50 bg-card/80 backdrop-blur-xl animate-pulse-glow">
                <CardContent className="p-6 sm:p-8 space-y-5">
                  <button onClick={goBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3 w-3" /> 이전
                  </button>

                  <div className="text-center">
                    <h2 className="font-display text-2xl font-semibold text-foreground">현재 연애 상태를 알려주세요</h2>
                    <p className="mt-1 text-xs text-muted-foreground">더 정확한 연애 리딩을 위해 선택해주세요</p>
                  </div>

                  <div className="space-y-2">
                    {ROMANCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setRomanceStatus(opt.value)}
                        className={`w-full rounded-xl border p-4 text-left transition-all ${romanceStatus === opt.value
                          ? "border-gold/50 bg-gold/10"
                          : "border-border/30 bg-background/30 hover:border-border/60"
                          }`}
                      >
                        <span className="text-lg mr-2">{opt.emoji}</span>
                        <span className={`text-sm font-medium ${romanceStatus === opt.value ? "text-gold" : "text-foreground"}`}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  <Button
                    className="w-full rounded-xl bg-gradient-to-r from-accent to-gold text-primary-foreground font-medium shadow-lg"
                    onClick={() => setStep("cardSelect")}
                    disabled={!romanceStatus}
                  >
                    다음 <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ═══ STEP 3: Card Selection ═══ */}
          {step === "cardSelect" && (
            <motion.div key="cards" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
              <div className="space-y-4">
                <button onClick={goBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-3 w-3" /> 이전
                </button>

                <div className="text-center">
                  <h2 className="font-display text-2xl font-semibold text-foreground">직감으로 카드를 선택하세요</h2>
                  <p className="mt-2 text-xs text-muted-foreground">
                    마음이 끌리는 카드를 {requiredCards}장 고르세요
                  </p>
                </div>

                <div className="mt-6 mb-8 flex flex-col items-center space-y-6">
                  <div className="flex items-center justify-center gap-1.5 sm:gap-3 w-full max-w-4xl">
                    {Array.from({ length: requiredCards }).map((_, idx) => {
                      const card = picked[idx];
                      const spread = ["현재 상황", "핵심 문제", "숨겨진 원인", "조언", "가까운 결과"];
                      const positionLabel = spread[idx] || "추가 분석";

                      if (!card) {
                        return (
                          <div key={idx} className="flex flex-col items-center gap-2">
                            <span className="text-xs font-medium tracking-widest text-muted-foreground/50 whitespace-nowrap break-keep">{positionLabel}</span>
                            <div className="w-[18vw] sm:w-28 md:w-32 lg:w-36 aspect-[0.65] rounded-xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center text-muted-foreground/30 bg-background/20 relative shadow-inner">
                              <span className="text-3xl font-light opacity-40">?</span>
                            </div>
                          </div>
                        );
                      }

                      let suitBg = 'from-purple-600 to-indigo-900';
                      if (card.suit === 'Pentacles') suitBg = 'from-yellow-500 to-amber-900';
                      else if (card.suit === 'Wands') suitBg = 'from-red-600 to-rose-900';
                      else if (card.suit === 'Cups') suitBg = 'from-blue-600 to-cyan-900';
                      else if (card.suit === 'Swords') suitBg = 'from-slate-500 to-gray-800';

                      return (
                        <div key={card.id} className="flex flex-col items-center gap-2">
                          <span className={`text-xs font-medium tracking-widest ${card.isReversed ? "text-purple-300/80" : "text-gold-light/80"} whitespace-nowrap break-keep`}>{positionLabel}</span>
                          <TarotCard 
                            name={card.name} 
                            koreanName={card.korean} 
                            isReversed={card.isReversed} 
                            image={card.image}
                            className="w-[18vw] sm:w-28 md:w-32 lg:w-36 aspect-[0.65]"
                            size="md"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    className={`w-full max-w-sm rounded-xl font-semibold text-base shadow-lg transition-all py-6 ${picked.length >= requiredCards
                      ? "bg-gradient-to-r from-accent via-gold to-accent text-primary-foreground shadow-gold/20 hover:shadow-gold/40 hover:-translate-y-0.5"
                      : "bg-secondary/50 text-muted-foreground border border-border/30 opacity-60 cursor-not-allowed hover:bg-secondary/50"
                      }`}
                    onClick={handleSubmit}
                    disabled={picked.length < requiredCards}
                  >
                    <Sparkles className={`mr-2 h-5 w-5 ${picked.length >= requiredCards ? "text-primary-foreground" : "text-muted-foreground/50"}`} />
                    {picked.length >= requiredCards ? "선택 완료" : `${picked.length} / ${requiredCards}장 선택 중`}
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11">
                  {deck.map((card) => {
                    const isSelected = picked.some((p) => p.id === card.id);
                    const isDisabled = card.isPicked || picked.length >= requiredCards;

                    return (
                      <motion.button
                        whileHover={!isDisabled ? { y: -4, scale: 1.05 } : {}}
                        whileTap={!isDisabled ? { scale: 0.95 } : {}}
                        key={card.id}
                        onClick={() => selectCard(card)}
                        disabled={isDisabled}
                        className={`group relative aspect-[0.65] w-full transition-all duration-500 ${isDisabled && !isSelected ? "cursor-not-allowed opacity-40" : "cursor-pointer"} ${isSelected ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100"}`}
                      >
                        <div className={`absolute inset-0 w-full h-full rounded-lg border flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${!isSelected && !isDisabled ? "border-border/30 hover:border-gold/30" : "border-border/20"}`}>
                          <img src={cardBackImg} alt="" className="w-full h-full object-cover opacity-90 rounded-lg transition-opacity group-hover:opacity-100" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ 접수 완료 화면 ═══ */}
          {step === "submitted" && (
            <motion.div key="submitted" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {error ? (
                <Card className="border-destructive/30 bg-card/80 backdrop-blur-xl">
                  <CardContent className="py-10 px-8 text-center space-y-4">
                    <div className="mb-2 text-3xl">⚠️</div>
                    <h2 className="font-display text-xl font-semibold text-foreground">접수 중 오류가 발생했습니다</h2>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <div className="flex gap-3 justify-center pt-2">
                      <Button variant="secondary" className="rounded-full" onClick={handleSubmit}>다시 시도</Button>
                      <Button variant="ghost" className="rounded-full" onClick={resetAll}>처음으로</Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-gold/30 bg-card/80 backdrop-blur-xl">
                  <CardContent className="py-16 px-8 text-center space-y-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="text-5xl"
                    >
                      ✨
                    </motion.div>
                    <div className="space-y-3">
                      <h2 className="font-display text-2xl font-semibold text-foreground">카드 리딩이 접수되었습니다</h2>
                      <p className="text-base text-muted-foreground">
                        상담 내용을 곧 전달드리겠습니다.
                      </p>
                      <p className="text-base text-muted-foreground">
                        잠시만 기다려 주세요 💜
                      </p>
                    </div>
                    <div className="pt-4">
                      <Button variant="ghost" className="rounded-full text-gold hover:text-gold/80" onClick={resetAll}>
                        새로운 상담 시작하기
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


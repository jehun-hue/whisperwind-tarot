import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
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
import { calculateSaju, getSajuTarotCrossKeywords, getSajuForQuestion, type SajuResult } from "@/lib/saju";
import { calculateNatalChart, getAstrologyForQuestion, getCurrentTransits, type AstrologyResult } from "@/lib/astrology";
import { calculateZiWei, getZiWeiForQuestion, type ZiWeiResult } from "@/lib/ziwei";
import { calculateManseryeokSaju, type ManseryeokResult } from "@/lib/manseryeokCalc";
import { getCombinationSummary } from "@/data/tarotCombinations";
import { supabase } from "@/integrations/supabase/client";
import ReadingResultV3 from "@/components/ReadingResultV3";
import SajuManualOverride from "@/components/SajuManualOverride";
import cardBackImg from "@/assets/card-back.png";

// ─── Types ───
type Step = "question" | "birthInfo" | "romance" | "cardSelect" | "submitted";
type QuestionType = "love" | "career" | "money" | "general";
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

function classifyQuestion(q: string): QuestionType {
  const lower = q.toLowerCase();
  if (/(연애|재회|썸|남자|여자|상대|연락|결혼|상대방|속마음|사랑|짝사랑|애인|남친|여친)/.test(lower)) return "love";
  if (/(이직|직장|사업|취업|회사|일|브랜드|커리어|승진)/.test(lower)) return "career";
  if (/(돈|금전|재물|수익|매출|사업운|투자|재정)/.test(lower)) return "money";
  return "general";
}

function getRequiredCards(_grade: Grade): number {
  return 3;
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
          <div className={`flex h-7 items-center rounded-full px-3 text-[10px] font-medium transition-all ${
            i <= effectiveIdx ? "bg-gold/20 text-gold" : "bg-secondary/50 text-muted-foreground/40"
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
  const [question, setQuestion] = useState("");
  const [memo, setMemo] = useState("");

  // Birth info
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthTime, setBirthTime] = useState("unknown");
  const [birthHourInput, setBirthHourInput] = useState("");
  const [birthMinInput, setBirthMinInput] = useState("");
  const [birthAmPm, setBirthAmPm] = useState<"am" | "pm">("am");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [isLunar, setIsLunar] = useState(false);
  const [isLeapMonth, setIsLeapMonth] = useState(false);

  // Romance
  const [romanceStatus, setRomanceStatus] = useState<RomanceStatus | null>(null);

  // Cards
  const [deck, setDeck] = useState<DeckCard[]>(() => {
    const shuffled = [...tarotCards].sort(() => Math.random() - 0.5);
    return shuffled.map((c) => makeDeckCard(c, false, false, false));
  });
  const [picked, setPicked] = useState<DeckCard[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<Grade>("S");

  // Analysis data (internal)
  const [manseryeokResult, setManseryeokResult] = useState<ManseryeokResult | null>(null);
  const [sajuResult, setSajuResult] = useState<SajuResult | null>(null);
  const [astroResult, setAstroResult] = useState<AstrologyResult | null>(null);
  const [ziweiResult, setZiweiResult] = useState<ZiWeiResult | null>(null);
  const [manualSajuData, setManualSajuData] = useState("");

  // Result
  const [error, setError] = useState<string | null>(null);

  const questionType = useMemo(() => classifyQuestion(question), [question]);
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
    const hour = birthTime !== "unknown" ? parseInt(birthTime.split(":")[0]) : 12;
    const minute = 0;

    try {
      const ms = calculateManseryeokSaju(y, m, d, hour, minute, isLunar);
      setManseryeokResult(ms);
    } catch (e) {
      console.error("Manseryeok error:", e);
      setManseryeokResult(null);
    }

    try {
      const saju = calculateSaju(y, m, d, hour);
      setSajuResult(saju);
      const astro = calculateNatalChart(y, m, d, hour);
      setAstroResult(astro);
      const ziwei = calculateZiWei(y, m, d, hour, gender);
      setZiweiResult(ziwei);
    } catch (e) {
      console.error("Analysis calc error:", e);
    }
  }, [birthYear, birthMonth, birthDay, birthTime, isLunar, gender, hasBirthDate]);

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
    setError(null);

    const cardData = picked.map((c) => ({
      id: c.id, name: c.name, korean: c.korean, suit: c.suit, isReversed: c.isReversed,
    }));

    const birthInfo = hasBirthDate ? {
      gender,
      birthDate: `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`,
      birthTime: birthTime !== "unknown" ? birthTime : "",
      birthPlace: "",
      isLunar,
    } : null;

    let sajuDataForAI = null;
    let astroDataForAI = null;
    let ziweiDataForAI = null;

    if (sajuResult) {
      sajuDataForAI = { ...sajuResult, crossKeywords: getSajuTarotCrossKeywords(sajuResult, picked.map((c) => c.suit)), questionAnalysis: getSajuForQuestion(sajuResult, questionType) };
    }
    if (astroResult) {
      astroDataForAI = { ...astroResult, questionAnalysis: getAstrologyForQuestion(astroResult, questionType), transits: getCurrentTransits(astroResult) };
    }
    if (ziweiResult) {
      ziweiDataForAI = { ...ziweiResult, questionAnalysis: getZiWeiForQuestion(ziweiResult, questionType) };
    }
    const combinationSummary = getCombinationSummary(picked.map((c) => c.id), questionType);

    try {
      // 1) DB에 세션 저장
      const { data: session, error: dbError } = await supabase
        .from("reading_sessions")
        .insert({
          question, question_type: questionType, memo: memo || null,
          gender: birthInfo?.gender || null, birth_date: birthInfo?.birthDate || null,
          birth_time: birthInfo?.birthTime || null, is_lunar: birthInfo?.isLunar || false,
          cards: cardData as any, saju_data: sajuDataForAI as any, status: "analyzing",
        })
        .select().single();

      if (dbError) throw dbError;

      // 2) 즉시 접수완료 화면으로 전환 (사용자는 더 이상 기다리지 않음)
      setStep("submitted");

      // 3) AI 호출은 백그라운드로 실행 (사용자에게 영향 없음)
      supabase.functions.invoke("ai-reading-v4", {
        body: {
          question, questionType, memo,
          cards: cardData, sajuData: sajuDataForAI, birthInfo,
          astrologyData: astroDataForAI, ziweiData: ziweiDataForAI,
          combinationSummary,
          manseryeokData: manseryeokResult,
          forcetellData: manualSajuData.trim() || null,
          romanceStatus,
          grade: selectedGrade,
        },
      }).then(({ data: aiData, error: fnError }) => {
        if (fnError) {
          console.error("AI 백그라운드 에러:", fnError);
          return;
        }
        const reading = aiData?.reading;
        if (session?.id && reading) {
          supabase.from("reading_sessions").update({
            ai_reading: reading as any,
            final_confidence: reading.convergence?.converged_count ? Math.round((reading.convergence.converged_count / 6) * 100) : 70,
            status: "completed",
          }).eq("id", session.id).then(() => {
            console.log("AI 분석 완료, DB 업데이트됨");
          });
        }
      }).catch((err) => {
        console.error("AI 백그라운드 에러:", err);
      });

    } catch (err: any) {
      console.error("Session save error:", err);
      setError(err.message || "접수 중 오류가 발생했습니다.");
    }
  };

  const resetAll = () => {
    setStep("question");
    setQuestion(""); setMemo("");
    setBirthYear(""); setBirthMonth(""); setBirthDay("");
    setBirthTime("unknown"); setBirthHourInput(""); setBirthMinInput(""); setBirthAmPm("am"); setGender("female");
    setIsLunar(false); setIsLeapMonth(false);
    setRomanceStatus(null);
    setPicked([]); setSelectedGrade("S");
    setManseryeokResult(null); setSajuResult(null);
    setAstroResult(null); setZiweiResult(null);
    setManualSajuData("");
    setError(null);
    const shuffled = [...tarotCards].sort(() => Math.random() - 0.5);
    setDeck(shuffled.map((c) => makeDeckCard(c, false, false, false)));
  };

  const goBack = () => {
    if (step === "birthInfo") setStep("question");
    else if (step === "romance") setStep("birthInfo");
    else if (step === "cardSelect") setStep(isLoveQuestion ? "romance" : "birthInfo");
  };

  const proceedFromBirth = () => {
    calculateBirthData();
    if (isLoveQuestion) setStep("romance");
    else setStep("cardSelect");
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
          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground/50 hover:text-gold hover:bg-secondary/50 transition-colors"
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
                        className={`rounded-xl border p-3 text-left transition-all ${
                          question === q.text
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
                    <Badge variant="outline" className="border-gold/30 text-gold text-xs">
                      자동 분류: {questionType === "love" ? "💕 연애" : questionType === "career" ? "💼 직업" : questionType === "money" ? "💰 금전" : "🔮 종합"}
                    </Badge>
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
                    <label className="text-sm text-muted-foreground">생년월일</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number" placeholder="1993" value={birthYear}
                        onChange={(e) => setBirthYear(e.target.value)}
                        className="rounded-xl border-border/50 bg-background/50 text-foreground"
                        min="1920" max="2010"
                      />
                      <Input
                        type="number" placeholder="07" value={birthMonth}
                        onChange={(e) => setBirthMonth(e.target.value)}
                        className="rounded-xl border-border/50 bg-background/50 text-foreground"
                        min="1" max="12"
                      />
                      <Input
                        type="number" placeholder="17" value={birthDay}
                        onChange={(e) => setBirthDay(e.target.value)}
                        className="rounded-xl border-border/50 bg-background/50 text-foreground"
                        min="1" max="31"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center rounded-full border border-border/50 bg-background/30 p-0.5">
                      <button
                        onClick={() => { setIsLunar(false); setIsLeapMonth(false); }}
                        className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                          !isLunar ? "bg-accent/20 text-accent shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        ☀️ 양력
                      </button>
                      <button
                        onClick={() => setIsLunar(true)}
                        className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                          isLunar ? "bg-accent/20 text-accent shadow-sm" : "text-muted-foreground hover:text-foreground"
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

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-muted-foreground">출생 시간</label>
                      <div className="inline-flex items-center rounded-full border border-border/50 bg-background/30 p-0.5">
                        <button
                          onClick={() => {
                            setBirthAmPm("am");
                            if (birthTime === "unknown") { setBirthTime(""); }
                            else if (birthHourInput) {
                              const h = parseInt(birthHourInput, 10);
                              const h24 = h === 12 ? 0 : h;
                              setBirthTime(`${String(h24).padStart(2, "0")}:${birthMinInput || "00"}`);
                            }
                          }}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                            birthAmPm === "am" && birthTime !== "unknown" ? "bg-accent/20 text-accent shadow-sm" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          오전
                        </button>
                        <button
                          onClick={() => {
                            setBirthAmPm("pm");
                            if (birthTime === "unknown") { setBirthTime(""); }
                            else if (birthHourInput) {
                              const h = parseInt(birthHourInput, 10);
                              const h24 = h === 12 ? 12 : h + 12;
                              setBirthTime(`${String(h24).padStart(2, "0")}:${birthMinInput || "00"}`);
                            }
                          }}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                            birthAmPm === "pm" && birthTime !== "unknown" ? "bg-accent/20 text-accent shadow-sm" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          오후
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setBirthTime("unknown");
                          setBirthHourInput("");
                          setBirthMinInput("");
                        }}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                          birthTime === "unknown"
                            ? "border-gold/50 bg-gold/10 text-gold"
                            : "border-border/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        모름
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={birthHourInput}
                        onValueChange={(v) => {
                          setBirthHourInput(v);
                          const h = parseInt(v, 10);
                          const h24 = birthAmPm === "pm" ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
                          setBirthTime(`${String(h24).padStart(2, "0")}:${birthMinInput || "00"}`);
                        }}
                        disabled={birthTime === "unknown"}
                      >
                        <SelectTrigger className={`w-24 rounded-xl border-border/50 bg-background/50 text-foreground ${birthTime === "unknown" ? "opacity-40" : ""}`}>
                          <SelectValue placeholder="시" />
                        </SelectTrigger>
                        <SelectContent>
                          {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
                            <SelectItem key={h} value={String(h)}>{h}시</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">:</span>
                      <Select
                        value={birthMinInput}
                        onValueChange={(v) => {
                          setBirthMinInput(v);
                          if (birthHourInput) {
                            const h = parseInt(birthHourInput, 10);
                            const h24 = birthAmPm === "pm" ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
                            setBirthTime(`${String(h24).padStart(2, "0")}:${v}`);
                          }
                        }}
                        disabled={birthTime === "unknown"}
                      >
                        <SelectTrigger className={`w-24 rounded-xl border-border/50 bg-background/50 text-foreground ${birthTime === "unknown" ? "opacity-40" : ""}`}>
                          <SelectValue placeholder="분" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48 overflow-y-auto">
                          {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
                            <SelectItem key={m} value={m}>{m}분</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {birthTime === "unknown" && (
                      <p className="text-[10px] text-muted-foreground/70">
                        ⓘ 시간을 모르면 시주 분석을 제외하고 년·월·일주만 사용합니다.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">성별</label>
                    <div className="flex gap-2">
                      {(["female", "male"] as const).map((g) => (
                        <button
                          key={g}
                          onClick={() => setGender(g)}
                          className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                            gender === g
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
                      className="w-full rounded-xl bg-gradient-to-r from-accent to-gold text-primary-foreground font-medium shadow-lg"
                      onClick={proceedFromBirth}
                      disabled={!hasBirthDate}
                    >
                      다음 <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full rounded-xl text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        if (isLoveQuestion) setStep("romance");
                        else setStep("cardSelect");
                      }}
                    >
                      건너뛰고 타로만 진행
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
                        className={`w-full rounded-xl border p-4 text-left transition-all ${
                          romanceStatus === opt.value
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
                  <div className="mt-3 flex items-center justify-center gap-2">
                    {Array.from({ length: requiredCards }, (_, i) => (
                      <div
                        key={i}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium transition-all ${
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

                {picked.length >= 3 && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                    <Button
                      className="w-full rounded-xl bg-gradient-to-r from-accent via-gold to-accent text-primary-foreground font-semibold text-base shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-all py-6"
                      onClick={handleSubmit}
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      선택 완료
                    </Button>
                  </motion.div>
                )}

                <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6 md:grid-cols-8">
                  {deck.map((card) => {
                    const isSelected = picked.some((p) => p.id === card.id);
                    const isDisabled = card.isPicked || picked.length >= requiredCards;
                    return (
                      <motion.button
                        whileHover={!isDisabled ? { y: -4, scale: 1.03 } : {}}
                        whileTap={!isDisabled ? { scale: 0.97 } : {}}
                        key={card.id}
                        onClick={() => selectCard(card)}
                        disabled={isDisabled}
                        className={`group relative aspect-[0.65] overflow-hidden rounded-lg border transition-all ${
                          isSelected
                            ? "border-gold/60 glow-gold-strong"
                            : isDisabled
                            ? "border-border/20 opacity-30 cursor-not-allowed"
                            : "border-border/30 hover:border-gold/30 cursor-pointer"
                        }`}
                      >
                        {isSelected ? (
                          <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-gold/10 to-accent/10 p-1">
                            <span className="font-display text-sm font-semibold text-gold">{card.korean}</span>
                            <span className="mt-0.5 flex items-center gap-0.5 text-[8px] text-gold-light">
                              {card.isReversed ? <><EyeOff className="h-2 w-2" /> 역</> : <><Eye className="h-2 w-2" /> 정</>}
                            </span>
                          </div>
                        ) : (
                          <img src={cardBackImg} alt="" className="h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-90" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {picked.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {picked.map((card, idx) => (
                      <Badge key={card.id} className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-foreground text-[11px]">
                        {idx + 1}. {card.korean} <span className="ml-0.5 text-gold">{card.isReversed ? "(역)" : "(정)"}</span>
                      </Badge>
                    ))}
                  </div>
                )}
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

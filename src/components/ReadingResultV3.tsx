import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Shield, Heart, Calendar, Lightbulb, AlertTriangle, Clover, Share2, Bookmark, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import cardBackImg from "@/assets/card-back.png";

// ─── Types ───
export interface V3ReadingData {
  reading_info?: { question?: string; grade?: string; date?: string; card_count?: number };
  tarot_reading?: {
    waite?: TarotSection | null;
    choihanna?: TarotSection | null;
    monad?: TarotSection | null;
  };
  convergence?: {
    total_systems?: number;
    converged_count?: number;
    grade?: string;
    tarot_convergence?: { count?: number; systems?: string[]; common_keywords?: string[] };
    internal_validation?: string;
    common_message?: string;
    divergent_note?: string | null;
  };
  love_analysis?: LoveAnalysis | null;
  action_guide?: {
    do_list?: string[] | null;
    dont_list?: string[] | null;
    lucky?: { color?: string; number?: string; direction?: string; day?: string; item?: string };
  };
  final_message?: { title?: string; summary?: string };
}

interface TarotSection {
  cards?: { name?: string; position?: string; reversed?: boolean }[];
  story?: string;
  key_message?: string;
}

interface LoveAnalysis {
  status?: string;
  love_dna?: { style?: string; pattern?: string; weakness?: string } | null;
  timeline?: Record<string, { period?: string; theme?: string; detail?: string }> | null;
  partner_profile?: { personality?: string; atmosphere?: string; meeting_place?: string } | null;
  status_specific?: { main_insight?: string; probability?: string; timing?: string; warning?: string };
}

type Grade = "C" | "B" | "A" | "S";

interface ReadingResultV3Props {
  reading: V3ReadingData | null;
  isLoading: boolean;
  onReset: () => void;
  children?: React.ReactNode;
  grade?: string;
  onUpgrade?: (targetGrade: string) => void;
  sessionId?: string;
}

// ─── Grade Badge ───
const gradeStyles: Record<string, { bg: string; text: string; glow: string; label: string }> = {
  S: { bg: "bg-gradient-to-r from-amber-500 to-yellow-400", text: "text-black", glow: "shadow-[0_0_30px_rgba(245,158,11,0.5)]", label: "최고 수렴도 S" },
  A: { bg: "bg-gradient-to-r from-purple-600 to-violet-500", text: "text-white", glow: "shadow-[0_0_20px_rgba(139,92,246,0.4)]", label: "높은 수렴도 A" },
  B: { bg: "bg-gradient-to-r from-blue-600 to-cyan-500", text: "text-white", glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]", label: "수렴도 B" },
  C: { bg: "bg-secondary", text: "text-muted-foreground", glow: "", label: "수렴도 C" },
};

function GradeBadge({ grade }: { grade: string }) {
  const g = grade?.charAt(0)?.toUpperCase() || "C";
  const s = gradeStyles[g] || gradeStyles.C;
  return (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-base font-bold ${s.bg} ${s.text} ${s.glow}`}>
      {g === "S" && <Sparkles className="h-5 w-5" />}
      {s.label}
    </motion.div>
  );
}

// ─── Loading Screen (7-8) ───
const LOADING_MESSAGES = [
  "카드의 에너지를 읽고 있습니다...",
  "6개 체계로 교차 검증 중...",
  "당신만의 리딩을 완성하고 있습니다...",
];

function LoadingScreen({ grade }: { grade?: string }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => setMsgIdx((p) => (p < LOADING_MESSAGES.length - 1 ? p + 1 : p)), 4000);
    const progTimer = setInterval(() => setProgress((p) => Math.min(p + 1, 95)), 200);
    return () => { clearInterval(msgTimer); clearInterval(progTimer); };
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
      <Card className="mx-auto max-w-lg border-border/50 bg-card/80 backdrop-blur-xl">
        <CardContent className="py-16 px-8 space-y-6">
          {/* Rotating card animation */}
          <motion.div
            animate={{ rotateY: [0, 180, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto h-24 w-16 rounded-lg overflow-hidden"
            style={{ perspective: 600, transformStyle: "preserve-3d" }}
          >
            <img src={cardBackImg} alt="" className="h-full w-full object-cover" />
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.p key={msgIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="font-display text-lg font-semibold text-foreground">
              {LOADING_MESSAGES[msgIdx]}
            </motion.p>
          </AnimatePresence>

          <div className="mx-auto max-w-xs space-y-2">
            <Progress value={progress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">예상 소요 시간: 10~20초</p>
          </div>

          <div className="mx-auto h-px w-32 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Tarot Card Visual ───
function TarotCardVisual({ card, isWaite }: { card: { name?: string; position?: string; reversed?: boolean }; isWaite: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[70px]">
      <div className={`relative h-24 w-16 rounded-lg border-2 overflow-hidden ${card.reversed ? "border-red-400/50" : "border-gold/40"}`}>
        {isWaite ? (
          <div className={`h-full w-full bg-gradient-to-b from-accent/20 to-gold/10 flex items-center justify-center p-1 ${card.reversed ? "rotate-180" : ""}`}>
            <span className="text-[9px] text-center text-foreground font-medium leading-tight">{card.name}</span>
          </div>
        ) : (
          <div className={`h-full w-full bg-gradient-to-b from-accent/10 to-secondary/30 border-gold/30 flex items-center justify-center p-1`}>
            <span className="text-[9px] text-center text-foreground font-medium leading-tight">{card.name}</span>
          </div>
        )}
        {card.reversed && (
          <div className="absolute top-0 left-0 right-0 bg-red-500/80 text-[7px] text-white text-center py-0.5">역방향</div>
        )}
      </div>
      <span className="text-[9px] text-muted-foreground text-center max-w-[70px] truncate">{card.position}</span>
    </div>
  );
}

// ─── Tarot Tab Content ───
function TarotTabContent({ section, tarotKey, maxStoryLength }: { section: TarotSection; tarotKey: string; maxStoryLength?: number }) {
  const isWaite = tarotKey === "waite";
  const story = maxStoryLength && section.story && section.story.length > maxStoryLength
    ? section.story.slice(0, maxStoryLength) + "..."
    : section.story;

  return (
    <div className="space-y-4">
      {section.cards && section.cards.length > 0 && (
        <div className="flex justify-center gap-3 overflow-x-auto pb-2">
          {section.cards.map((c, i) => <TarotCardVisual key={i} card={c} isWaite={isWaite} />)}
        </div>
      )}
      <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{story}</p>
      {section.key_message && (
        <div className="rounded-xl bg-gold/5 border border-gold/20 p-4">
          <p className="text-sm font-medium text-gold text-center">✦ {section.key_message}</p>
        </div>
      )}
    </div>
  );
}

// ─── Convergence Visualization (A, S) ───
function ConvergenceVisual({ conv, grade }: { conv: NonNullable<V3ReadingData["convergence"]>; grade: Grade }) {
  const systems = [
    { label: "웨이트 타로", icon: "🃏", converged: conv.tarot_convergence?.systems?.includes("웨이트 타로") },
    { label: "최한나 타로", icon: "💫", converged: conv.tarot_convergence?.systems?.includes("최한나 타로") },
    { label: "모나드 타로", icon: "🔷", converged: conv.tarot_convergence?.systems?.includes("모나드 타로") },
    { label: "내부 검증 (3체계)", icon: "🔒", converged: true },
  ];

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-gold" />
          <h3 className="font-display text-base font-semibold text-foreground">교차검증 결과</h3>
          <Badge variant="outline" className="border-gold/30 text-gold text-xs ml-auto">
            {conv.converged_count || 0}/6 수렴
          </Badge>
        </div>

        {grade === "S" && (
          <div className="grid grid-cols-2 gap-2">
            {systems.map((sys, i) => (
              <div key={i} className={`flex items-center gap-2 rounded-lg p-2.5 ${sys.converged ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-secondary/30 border border-border/30"}`}>
                {sys.converged ? <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" /> : <XCircle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />}
                <span className="text-xs">{sys.icon} {sys.label}</span>
              </div>
            ))}
          </div>
        )}

        {conv.tarot_convergence?.common_keywords && (
          <div className="flex flex-wrap gap-1.5">
            {conv.tarot_convergence.common_keywords.map((kw, i) => (
              <Badge key={i} variant="outline" className="border-gold/30 text-gold text-[11px]">#{kw}</Badge>
            ))}
          </div>
        )}

        {conv.common_message && <p className="text-sm text-muted-foreground">{conv.common_message}</p>}
        {grade === "S" && conv.divergent_note && <p className="text-xs text-orange-400/80 italic">{conv.divergent_note}</p>}

        {grade === "S" && (
          <p className="text-[10px] text-muted-foreground/60 text-center">6체계 교차검증 완료 (타로 3종 + 내부 3체계)</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Love Section ───
function LoveSection({ love, grade }: { love: LoveAnalysis; grade: Grade }) {
  const showDna = grade === "A" || grade === "S";
  const showTimeline = grade === "A" || grade === "S";
  const showPartner = grade === "S";
  const timelineEntries = love.timeline ? Object.values(love.timeline).filter(Boolean) : [];
  const limitedTimeline = grade === "A" ? timelineEntries.slice(0, 3) : timelineEntries;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Heart className="h-4 w-4 text-pink-400" />
        <h3 className="font-display text-base font-semibold text-foreground">💕 연애 심층 분석</h3>
      </div>

      {/* Love DNA */}
      {showDna && love.love_dna && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-5 space-y-3">
            {love.love_dna.style && (
              <div className="text-center">
                <p className="text-[10px] text-pink-400 mb-1">당신의 연애 스타일</p>
                <p className="font-display text-lg font-bold text-foreground">{love.love_dna.style}</p>
              </div>
            )}
            {love.love_dna.pattern && (
              <div className="rounded-lg bg-secondary/30 p-3">
                <p className="text-[10px] text-pink-400 font-medium mb-1">사랑에 빠지는 패턴</p>
                <p className="text-xs text-muted-foreground">{love.love_dna.pattern}</p>
              </div>
            )}
            {love.love_dna.weakness && (
              <div className="rounded-lg bg-secondary/30 p-3">
                <p className="text-[10px] text-orange-400 font-medium mb-1">약점 & 개선 방향</p>
                <p className="text-xs text-muted-foreground">{love.love_dna.weakness}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Specific */}
      {love.status_specific?.main_insight && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-5 space-y-3">
            <h4 className="text-sm font-semibold text-foreground">💝 핵심 연애 분석</h4>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{love.status_specific.main_insight}</p>
            <div className="grid grid-cols-3 gap-2">
              {love.status_specific.probability && (
                <div className="rounded-lg bg-secondary/30 p-2 text-center space-y-1">
                  <span className="text-[9px] text-muted-foreground">가능성</span>
                  <p className="text-xs font-bold text-gold">{love.status_specific.probability}</p>
                  {/* Gauge */}
                  <div className="h-1 rounded-full bg-secondary mx-2">
                    <div className={`h-full rounded-full ${love.status_specific.probability === "높음" ? "w-4/5 bg-emerald-400" : love.status_specific.probability === "보통" ? "w-1/2 bg-gold" : "w-1/4 bg-orange-400"}`} />
                  </div>
                </div>
              )}
              {love.status_specific.timing && (
                <div className="rounded-lg bg-secondary/30 p-2 text-center">
                  <span className="text-[9px] text-muted-foreground">최적 시기</span>
                  <p className="text-xs font-bold text-gold mt-1">{love.status_specific.timing}</p>
                </div>
              )}
              {love.status_specific.warning && (
                <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-2 text-center">
                  <span className="text-[9px] text-muted-foreground">주의</span>
                  <p className="text-[10px] text-red-400 mt-1">{love.status_specific.warning}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {showTimeline && limitedTimeline.length > 0 && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gold" />
              <h4 className="text-sm font-semibold text-foreground">월별 타임라인</h4>
            </div>
            <div className="overflow-x-auto">
              <div className="flex gap-3 pb-2 min-w-max">
                {limitedTimeline.map((m, i) => (
                  <div key={i} className="w-36 flex-shrink-0 rounded-xl bg-secondary/30 p-3 space-y-1.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-gold text-[10px] font-bold">
                      {m.period || `${i + 1}월`}
                    </div>
                    <p className="text-xs font-medium text-foreground">{m.theme}</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{m.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partner Profile (S only) */}
      {showPartner && love.partner_profile && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-5 space-y-3">
            <h4 className="text-sm font-semibold text-foreground">💫 인연 프로필</h4>
            <div className="grid gap-2">
              {[
                { label: "성격", value: love.partner_profile.personality, color: "text-accent" },
                { label: "분위기", value: love.partner_profile.atmosphere, color: "text-gold" },
                { label: "만남 장소", value: love.partner_profile.meeting_place, color: "text-emerald-400" },
              ].map((item, i) => item.value ? (
                <div key={i} className="rounded-lg bg-secondary/30 p-3">
                  <span className={`text-[10px] font-medium ${item.color}`}>{item.label}</span>
                  <p className="text-xs text-muted-foreground mt-1">{item.value}</p>
                </div>
              ) : null)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Upgrade Banner ───
function UpgradeBanner({ currentGrade, onUpgrade }: { currentGrade: Grade; onUpgrade?: (g: string) => void }) {
  if (currentGrade === "S") return null;
  
  const handleUpgrade = (targetGrade: string) => {
    if (onUpgrade) onUpgrade(targetGrade);
  };
  
  const upgrades: Record<string, React.ReactNode> = {
    C: (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
        <span className="text-sm text-muted-foreground">더 깊은 리딩이 궁금하다면?</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-full border-border/50 text-xs"
            onClick={() => handleUpgrade("B")}>
            B등급 상세 리딩 1크레딧
          </Button>
          <Button size="sm" className="rounded-full bg-gradient-to-r from-gold to-accent text-primary-foreground text-xs"
            onClick={() => handleUpgrade("S")}>
            <Sparkles className="h-3 w-3 mr-1" /> S등급 종합 5크레딧
          </Button>
        </div>
      </div>
    ),
    B: (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
        <span className="text-sm text-muted-foreground">6체계 교차검증으로 더 정확하게</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-full text-xs"
            onClick={() => handleUpgrade("A")}>
            A등급 프리미엄 3크레딧
          </Button>
          <Button size="sm" className="rounded-full bg-gradient-to-r from-gold to-accent text-primary-foreground text-xs"
            onClick={() => handleUpgrade("S")}>
            <Sparkles className="h-3 w-3 mr-1" /> S등급 5크레딧
          </Button>
        </div>
      </div>
    ),
    A: (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
        <span className="text-sm text-muted-foreground">S등급: 6개월 타임라인 + 인연 프로필 + 대운</span>
        <Button size="sm" className="rounded-full bg-gradient-to-r from-gold to-accent text-primary-foreground text-xs"
          onClick={() => handleUpgrade("S")}>
          <Sparkles className="h-3 w-3 mr-1" /> S등급 5크레딧
        </Button>
      </div>
    ),
  };

  return (
    <Card className="border-gold/20 bg-gradient-to-r from-gold/5 to-accent/5 backdrop-blur-xl">
      <CardContent className="p-4">{upgrades[currentGrade]}</CardContent>
    </Card>
  );
}

// ─── Main Component ───
export default function ReadingResultV3({ 
  reading, 
  isLoading, 
  onReset, 
  children, 
  grade: propGrade,
  onUpgrade,
  sessionId
}: ReadingResultV3Props) {
  const grade = ((propGrade || reading?.reading_info?.grade || "C") as Grade);

  if (isLoading) return <LoadingScreen grade={grade} />;
  if (!reading) return null;

  const tr = reading.tarot_reading;
  const conv = reading.convergence;
  const love = reading.love_analysis;
  const ag = reading.action_guide;
  const fm = reading.final_message;

  // Grade-based filtering
  const showConvergence = grade === "A" || grade === "S";
  const showLove = !!love && (grade === "B" || grade === "A" || grade === "S");
  const showDoList = grade !== "C";
  const showDontList = grade === "A" || grade === "S";
  const showFullSummary = grade !== "C";

  // Story length limits
  const storyLimit = grade === "C" ? 300 : grade === "B" ? 400 : undefined;

  // Available tarot tabs
  const availableTarots: { key: string; label: string; section: TarotSection }[] = [];
  if (tr?.waite) availableTarots.push({ key: "waite", label: "🃏 웨이트", section: tr.waite });
  if (tr?.choihanna && grade !== "C") availableTarots.push({ key: "choihanna", label: "💫 최한나", section: tr.choihanna });
  if (tr?.monad && (grade === "A" || grade === "S")) availableTarots.push({ key: "monad", label: "🔷 모나드", section: tr.monad });

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
      className="mx-auto max-w-2xl space-y-4">

      {/* 7-1: Header */}
      <Card className="border-border/50 bg-gradient-to-b from-card/90 to-card/70 backdrop-blur-xl glow-gold-strong overflow-hidden">
        <CardContent className="p-8 text-center space-y-4 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/3 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-4">
            {fm?.title && (
              <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="font-display text-2xl font-bold text-gold">
                {fm.title}
              </motion.h2>
            )}
            <GradeBadge grade={conv?.grade || grade} />
            {grade === "S" && (
              <p className="text-[10px] text-muted-foreground/60">6체계 교차검증 완료</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 7-2: Tarot Readings (Tabs) */}
      {availableTarots.length > 0 && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-5">
            {availableTarots.length === 1 ? (
              <div className="space-y-3">
                <h3 className="font-display text-base font-semibold text-foreground text-center">
                  {availableTarots[0].label} 리딩
                </h3>
                <TarotTabContent section={availableTarots[0].section} tarotKey={availableTarots[0].key} maxStoryLength={storyLimit} />
              </div>
            ) : (
              <Tabs defaultValue={availableTarots[0].key}>
                <TabsList className="w-full bg-secondary/30">
                  {availableTarots.map((t) => (
                    <TabsTrigger key={t.key} value={t.key} className="flex-1 text-xs data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {availableTarots.map((t) => (
                  <TabsContent key={t.key} value={t.key} className="mt-4">
                    <TarotTabContent section={t.section} tarotKey={t.key} maxStoryLength={storyLimit} />
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      {/* 7-3: Convergence (A, S only) */}
      {showConvergence && conv && <ConvergenceVisual conv={conv} grade={grade} />}

      {/* B grade: simple convergence text */}
      {grade === "B" && conv && (
        <div className="text-center">
          <Badge variant="outline" className="border-gold/30 text-gold text-xs">✓ 타로 2종 교차 확인 완료</Badge>
        </div>
      )}

      {/* 7-4: Love Analysis */}
      {showLove && love && <LoveSection love={love} grade={grade} />}

      {/* 7-5: Action Guide */}
      {ag && (showDoList || ag.lucky) && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-gold" />
              <h3 className="font-display text-base font-semibold text-foreground">실천 가이드</h3>
            </div>

            {showDoList && (ag.do_list || ag.dont_list) && (
              <div className={`grid gap-4 ${showDontList && ag.dont_list ? "grid-cols-2" : "grid-cols-1"}`}>
                {ag.do_list && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-emerald-400">✅ 이번 달 DO</span>
                    {(grade === "B" ? ag.do_list.slice(0, 2) : ag.do_list).map((item, i) => (
                      <p key={i} className="text-xs text-muted-foreground pl-2">• {item}</p>
                    ))}
                  </div>
                )}
                {showDontList && ag.dont_list && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-red-400">❌ 이번 달 DON'T</span>
                    {ag.dont_list.map((item, i) => (
                      <p key={i} className="text-xs text-muted-foreground pl-2">• {item}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Lucky elements */}
            {ag.lucky && Object.values(ag.lucky).some(Boolean) && (
              <div className={`grid gap-2 text-center ${grade === "C" ? "grid-cols-2" : "grid-cols-5"}`}>
                {[
                  { label: "행운색", value: ag.lucky.color, emoji: "🎨", show: true },
                  { label: "행운숫자", value: ag.lucky.number, emoji: "🔢", show: true },
                  { label: "방위", value: ag.lucky.direction, emoji: "🧭", show: grade !== "C" },
                  { label: "행운일", value: ag.lucky.day, emoji: "📅", show: grade !== "C" },
                  { label: "아이템", value: ag.lucky.item, emoji: "🍀", show: grade !== "C" },
                ].filter(i => i.show && i.value).map((item, i) => (
                  <div key={i} className="rounded-lg bg-secondary/30 p-2 space-y-1">
                    <div className="text-lg">{item.emoji}</div>
                    <div className="text-[9px] text-muted-foreground">{item.label}</div>
                    <div className="text-xs font-medium text-gold">{item.value}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 7-6: Final Summary */}
      {showFullSummary && fm?.summary && (
        <Card className="border-border/50 bg-gradient-to-b from-card/80 to-gold/5 backdrop-blur-xl">
          <CardContent className="p-6">
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {grade === "B" && fm.summary.length > 300 ? fm.summary.slice(0, 300) + "..." : fm.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* C grade: title only for final message */}
      {grade === "C" && !showFullSummary && fm?.title && (
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground italic">{fm.title}</p>
        </div>
      )}

      {/* Manual Override */}
      {children}

      {/* 7-7: CTA */}
      {grade === "S" ? (
        <div className="flex gap-3 justify-center pt-4">
          <Button variant="outline" className="rounded-full border-gold/30 text-gold hover:bg-gold/10">
            <Bookmark className="h-4 w-4 mr-1.5" /> 리딩 저장하기
          </Button>
          <Button variant="outline" className="rounded-full border-accent/30 text-accent hover:bg-accent/10">
            <Share2 className="h-4 w-4 mr-1.5" /> 친구에게 공유
          </Button>
        </div>
      ) : (
        <UpgradeBanner currentGrade={grade} onUpgrade={onUpgrade} />
      )}

      <div className="pt-2 text-center">
        <Button variant="secondary" className="rounded-full border border-border/50 bg-secondary/50 backdrop-blur" onClick={onReset}>
          다시 리딩하기
        </Button>
      </div>
    </motion.div>
  );
}

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Shield, Heart, Calendar, Lightbulb, AlertTriangle, Clover, Star } from "lucide-react";

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

interface ReadingResultV3Props {
  reading: V3ReadingData | null;
  isLoading: boolean;
  onReset: () => void;
  children?: React.ReactNode;
  grade?: string;
}

const gradeColors: Record<string, { bg: string; text: string; glow: string }> = {
  S: { bg: "bg-gradient-to-r from-amber-500 to-yellow-400", text: "text-black", glow: "shadow-[0_0_30px_rgba(245,158,11,0.5)]" },
  A: { bg: "bg-gradient-to-r from-purple-600 to-violet-500", text: "text-white", glow: "shadow-[0_0_20px_rgba(139,92,246,0.4)]" },
  B: { bg: "bg-gradient-to-r from-blue-600 to-cyan-500", text: "text-white", glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]" },
  C: { bg: "bg-secondary", text: "text-muted-foreground", glow: "" },
};

const tarotLabels: Record<string, { icon: string; label: string; tone: string }> = {
  waite: { icon: "🃏", label: "웨이트 타로", tone: "객관적·분석적" },
  choihanna: { icon: "💫", label: "최한나 타로", tone: "따뜻한·현실적" },
  monad: { icon: "🔷", label: "모나드 타로", tone: "영적·철학적" },
};

function GradeBadge({ grade }: { grade: string }) {
  const g = grade?.trim()?.charAt(0)?.toUpperCase() || "C";
  const colors = gradeColors[g] || gradeColors.C;
  return (
    <motion.div
      initial={{ scale: 0 }} animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-lg font-bold ${colors.bg} ${colors.text} ${colors.glow}`}
    >
      {g === "S" && <Sparkles className="h-5 w-5" />}
      {g}등급
    </motion.div>
  );
}

function TarotReadingCard({ tarotKey, section }: { tarotKey: string; section: TarotSection }) {
  const info = tarotLabels[tarotKey] || { icon: "🃏", label: tarotKey, tone: "" };
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-foreground">
            {info.icon} {info.label}
          </h3>
          <span className="text-[10px] text-muted-foreground italic">{info.tone}</span>
        </div>
        {section.cards && section.cards.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {section.cards.map((c, i) => (
              <div key={i} className="rounded-lg bg-secondary/50 px-3 py-1.5 text-xs">
                <span className="text-muted-foreground">{c.position}</span>
                <span className="mx-1 text-foreground font-medium">{c.name}</span>
                <span className={c.reversed ? "text-red-400" : "text-emerald-400"}>
                  ({c.reversed ? "역" : "정"})
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{section.story}</p>
        {section.key_message && (
          <div className="rounded-lg bg-gold/5 border border-gold/20 p-3">
            <p className="text-xs font-medium text-gold">✦ {section.key_message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConvergenceCard({ conv }: { conv: NonNullable<V3ReadingData["convergence"]> }) {
  const g = conv.grade?.charAt(0)?.toUpperCase() || "C";
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-gold" />
          <h3 className="font-display text-base font-semibold text-foreground">교차검증 결과</h3>
          <Badge variant="outline" className="border-gold/30 text-gold text-xs ml-auto">
            {conv.converged_count || 0}/6 수렴
          </Badge>
        </div>
        {conv.tarot_convergence?.systems && (
          <div className="flex flex-wrap gap-1.5">
            {conv.tarot_convergence.systems.map((s, i) => (
              <Badge key={i} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[11px]">✓ {s}</Badge>
            ))}
          </div>
        )}
        {conv.internal_validation && (
          <p className="text-[11px] text-muted-foreground/70 italic">🔒 {conv.internal_validation}</p>
        )}
        {conv.tarot_convergence?.common_keywords && (
          <div className="flex flex-wrap gap-1.5">
            {conv.tarot_convergence.common_keywords.map((kw, i) => (
              <Badge key={i} variant="outline" className="border-gold/30 text-gold text-[11px]">{kw}</Badge>
            ))}
          </div>
        )}
        {conv.common_message && <p className="text-sm text-muted-foreground">{conv.common_message}</p>}
        {conv.divergent_note && <p className="text-xs text-orange-400/80 italic">{conv.divergent_note}</p>}
      </CardContent>
    </Card>
  );
}

function LoveAnalysisSection({ love }: { love: LoveAnalysis }) {
  return (
    <div className="space-y-3">
      {/* DNA */}
      {love.love_dna && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-400" />
              <h3 className="font-display text-base font-semibold text-foreground">연애 DNA</h3>
            </div>
            <div className="grid gap-2">
              {love.love_dna.style && <div className="rounded-lg bg-secondary/30 p-3"><span className="text-[10px] text-pink-400 font-medium">연애 스타일</span><p className="text-xs text-muted-foreground mt-1">{love.love_dna.style}</p></div>}
              {love.love_dna.pattern && <div className="rounded-lg bg-secondary/30 p-3"><span className="text-[10px] text-pink-400 font-medium">사랑 패턴</span><p className="text-xs text-muted-foreground mt-1">{love.love_dna.pattern}</p></div>}
              {love.love_dna.weakness && <div className="rounded-lg bg-secondary/30 p-3"><span className="text-[10px] text-orange-400 font-medium">약점 & 개선</span><p className="text-xs text-muted-foreground mt-1">{love.love_dna.weakness}</p></div>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Specific */}
      {love.status_specific?.main_insight && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-display text-base font-semibold text-foreground">💝 핵심 연애 분석</h3>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{love.status_specific.main_insight}</p>
            <div className="grid grid-cols-3 gap-2">
              {love.status_specific.probability && (
                <div className="rounded-lg bg-secondary/30 p-2 text-center">
                  <span className="text-[10px] text-muted-foreground">가능성</span>
                  <p className="text-xs font-medium text-gold mt-0.5">{love.status_specific.probability}</p>
                </div>
              )}
              {love.status_specific.timing && (
                <div className="rounded-lg bg-secondary/30 p-2 text-center">
                  <span className="text-[10px] text-muted-foreground">시기</span>
                  <p className="text-xs font-medium text-gold mt-0.5">{love.status_specific.timing}</p>
                </div>
              )}
              {love.status_specific.warning && (
                <div className="rounded-lg bg-secondary/30 p-2 text-center">
                  <span className="text-[10px] text-muted-foreground">주의</span>
                  <p className="text-xs font-medium text-orange-400 mt-0.5">{love.status_specific.warning}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {love.timeline && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gold" />
              <h3 className="font-display text-base font-semibold text-foreground">월별 연애 타임라인</h3>
            </div>
            <div className="grid gap-2">
              {Object.values(love.timeline).filter(Boolean).map((m, i) => (
                <div key={i} className="rounded-lg bg-secondary/30 p-3 flex gap-3">
                  <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold text-xs font-bold">
                    {m.period || `${i + 1}월`}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{m.theme}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{m.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partner Profile */}
      {love.partner_profile && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-display text-base font-semibold text-foreground">💫 인연 프로필</h3>
            <div className="grid gap-2">
              {love.partner_profile.personality && <div className="rounded-lg bg-secondary/30 p-3"><span className="text-[10px] text-accent font-medium">성격</span><p className="text-xs text-muted-foreground mt-1">{love.partner_profile.personality}</p></div>}
              {love.partner_profile.atmosphere && <div className="rounded-lg bg-secondary/30 p-3"><span className="text-[10px] text-accent font-medium">분위기</span><p className="text-xs text-muted-foreground mt-1">{love.partner_profile.atmosphere}</p></div>}
              {love.partner_profile.meeting_place && <div className="rounded-lg bg-secondary/30 p-3"><span className="text-[10px] text-accent font-medium">만남 장소</span><p className="text-xs text-muted-foreground mt-1">{love.partner_profile.meeting_place}</p></div>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ReadingResultV3({ reading, isLoading, onReset, children, grade }: ReadingResultV3Props) {
  if (isLoading) {
    const gradeLabel = grade === "S" ? "최고급 종합" : grade === "A" ? "심층" : grade === "B" ? "상세" : "기본";
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <Card className="mx-auto max-w-lg border-border/50 bg-card/80 backdrop-blur-xl animate-pulse-glow">
          <CardContent className="py-16 px-8">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-gold" />
            <h2 className="font-display text-xl font-semibold text-foreground">{gradeLabel} 리딩 분석 중...</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {grade === "S" || grade === "A" ? "6체계 교차검증 타로 리딩을 생성하고 있습니다" : "타로 리딩을 생성하고 있습니다"}
            </p>
            <div className="mx-auto mt-6 h-px w-32 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!reading) return null;

  const tr = reading.tarot_reading;
  const conv = reading.convergence;
  const love = reading.love_analysis;
  const ag = reading.action_guide;
  const fm = reading.final_message;
  const convGrade = conv?.grade || reading.reading_info?.grade || "C";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-2xl space-y-4"
    >
      {/* Title & Grade */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-xl glow-gold-strong">
        <CardContent className="p-6 text-center space-y-4">
          <GradeBadge grade={convGrade} />
          {fm?.title && <h2 className="font-display text-xl font-bold text-foreground">{fm.title}</h2>}
          {fm?.summary && <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{fm.summary}</p>}
        </CardContent>
      </Card>

      {/* Tarot Readings */}
      {tr && (
        <div className="space-y-3">
          {(["waite", "choihanna", "monad"] as const).map((key, idx) => {
            const section = tr[key];
            if (!section) return null;
            return (
              <motion.div key={key} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                <TarotReadingCard tarotKey={key} section={section} />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Convergence */}
      {conv && <ConvergenceCard conv={conv} />}

      {/* Love Analysis */}
      {love && <LoveAnalysisSection love={love} />}

      {/* Action Guide */}
      {ag && (ag.do_list || ag.dont_list) && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-gold" />
              <h3 className="font-display text-base font-semibold text-foreground">실천 가이드</h3>
            </div>
            {ag.do_list && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-emerald-400">✅ 해야 할 것</span>
                {ag.do_list.map((item, i) => (
                  <p key={i} className="text-xs text-muted-foreground pl-3">• {item}</p>
                ))}
              </div>
            )}
            {ag.dont_list && (
              <div className="space-y-1.5 mt-2">
                <span className="text-[10px] font-medium text-red-400">❌ 하지 말아야 할 것</span>
                {ag.dont_list.map((item, i) => (
                  <p key={i} className="text-xs text-muted-foreground pl-3">• {item}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lucky Elements */}
      {ag?.lucky && Object.values(ag.lucky).some(Boolean) && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl glow-gold">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Clover className="h-4 w-4 text-gold" />
              <h3 className="font-display text-base font-semibold text-foreground">행운 요소</h3>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { label: "색상", value: ag.lucky.color, emoji: "🎨" },
                { label: "숫자", value: ag.lucky.number, emoji: "🔢" },
                { label: "방위", value: ag.lucky.direction, emoji: "🧭" },
                { label: "요일", value: ag.lucky.day, emoji: "📅" },
                { label: "아이템", value: ag.lucky.item, emoji: "🍀" },
              ].map((item, i) => item.value ? (
                <div key={i} className="rounded-lg bg-secondary/30 p-2 space-y-1">
                  <div className="text-lg">{item.emoji}</div>
                  <div className="text-[10px] text-muted-foreground">{item.label}</div>
                  <div className="text-xs font-medium text-gold">{item.value}</div>
                </div>
              ) : null)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Override */}
      {children}

      {/* Reset */}
      <div className="pt-4 text-center">
        <Button
          variant="secondary"
          className="rounded-full border border-border/50 bg-secondary/50 backdrop-blur"
          onClick={onReset}
        >
          새 상담 시작하기
        </Button>
      </div>
    </motion.div>
  );
}

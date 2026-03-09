import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Star, Shield, Clock, Sparkles, AlertTriangle, Lightbulb, Clover } from "lucide-react";

interface V2ReadingData {
  user_info?: {
    birth?: string;
    question?: string;
  };
  individual_readings?: {
    saju?: SystemReading;
    astrology?: SystemReading;
    ziwei?: SystemReading;
    tarot?: SystemReading & { spread?: string; cards?: CardInfo[] };
    choi_hanna_tarot?: SystemReading & { cards?: CardInfo[] };
    monad_tarot?: SystemReading & { cards?: CardInfo[] };
  };
  convergence?: {
    converged_count?: number;
    converged_systems?: string[];
    common_keywords?: string[];
    common_message?: string;
    divergent_systems?: string[];
    divergent_reason?: string;
  };
  final_reading?: {
    grade?: string;
    grade_criteria?: Record<string, string>;
    title?: string;
    summary?: string;
    time_flow?: {
      past_influence?: string;
      present_situation?: string;
      near_future?: string;
      long_term?: string;
    };
    advice?: string;
    caution?: string;
    lucky_elements?: {
      color?: string;
      number?: string;
      direction?: string;
      time?: string;
      day?: string;
    };
  };
  fallback?: boolean;
}

interface SystemReading {
  source?: string;
  raw_data_used?: Record<string, string>;
  keywords?: string[];
  direction?: string;
  detail?: string;
}

interface CardInfo {
  position?: string;
  card?: string;
  orientation?: string;
}

interface ReadingResultV2Props {
  reading: V2ReadingData | null;
  isLoading: boolean;
  onReset: () => void;
  hasSaju: boolean;
  children?: React.ReactNode;
}

const gradeColors: Record<string, { bg: string; text: string; glow: string }> = {
  S: { bg: "bg-gradient-to-r from-amber-500 to-yellow-400", text: "text-black", glow: "shadow-[0_0_30px_rgba(245,158,11,0.5)]" },
  A: { bg: "bg-gradient-to-r from-purple-600 to-violet-500", text: "text-white", glow: "shadow-[0_0_20px_rgba(139,92,246,0.4)]" },
  B: { bg: "bg-gradient-to-r from-blue-600 to-cyan-500", text: "text-white", glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]" },
  C: { bg: "bg-secondary", text: "text-muted-foreground", glow: "" },
};

const systemLabels: Record<string, { icon: string; label: string }> = {
  saju: { icon: "🔮", label: "사주팔자" },
  astrology: { icon: "⭐", label: "서양 점성술" },
  ziwei: { icon: "🏯", label: "자미두수" },
  tarot: { icon: "🃏", label: "웨이트 타로" },
  choi_hanna_tarot: { icon: "💫", label: "최한나 타로" },
  monad_tarot: { icon: "🔷", label: "모나드 타로" },
};

function GradeBadge({ grade }: { grade: string }) {
  const g = grade?.trim()?.charAt(0)?.toUpperCase() || "C";
  const colors = gradeColors[g] || gradeColors.C;
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-lg font-bold ${colors.bg} ${colors.text} ${colors.glow}`}
    >
      {g === "S" && <Sparkles className="h-5 w-5" />}
      {g}등급
    </motion.div>
  );
}

function KeywordBadges({ keywords }: { keywords?: string[] }) {
  if (!keywords?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {keywords.map((kw, i) => (
        <Badge key={i} variant="outline" className="border-gold/30 text-gold text-[11px]">
          {kw}
        </Badge>
      ))}
    </div>
  );
}

function SystemReadingCard({ systemKey, reading }: { systemKey: string; reading?: SystemReading & { cards?: CardInfo[]; spread?: string } }) {
  if (!reading?.detail) return null;
  const info = systemLabels[systemKey] || { icon: "📋", label: systemKey };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-foreground">
            {info.icon} {info.label}
          </h3>
          {reading.direction && (
            <span className="text-[11px] text-gold italic">{reading.direction}</span>
          )}
        </div>
        <KeywordBadges keywords={reading.keywords} />
        {reading.cards && reading.cards.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {reading.cards.map((c, i) => (
              <div key={i} className="rounded-lg bg-secondary/50 px-3 py-1.5 text-xs">
                <span className="text-muted-foreground">{c.position}</span>
                <span className="mx-1 text-foreground font-medium">{c.card}</span>
                <span className={`${c.orientation === "역" ? "text-red-400" : "text-emerald-400"}`}>
                  ({c.orientation})
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
          {reading.detail}
        </p>
      </CardContent>
    </Card>
  );
}

export default function ReadingResultV2({ reading, isLoading, onReset, hasSaju, children }: ReadingResultV2Props) {
  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <Card className="mx-auto max-w-lg border-border/50 bg-card/80 backdrop-blur-xl animate-pulse-glow">
          <CardContent className="py-16 px-8">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-gold" />
            <h2 className="font-display text-xl font-semibold text-foreground">
              6개 체계 통합 분석 중...
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              사주 + 점성술 + 자미두수 + 웨이트타로 + 최한나타로 + 모나드타로
            </p>
            <div className="mx-auto mt-6 h-px w-32 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!reading) return null;

  const fr = reading.final_reading;
  const conv = reading.convergence;
  const ir = reading.individual_readings;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-2xl space-y-4"
    >
      {/* Grade & Title */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-xl glow-gold-strong">
        <CardContent className="p-6 text-center space-y-4">
          {fr?.grade && <GradeBadge grade={fr.grade} />}
          {fr?.title && (
            <h2 className="font-display text-xl font-bold text-foreground">{fr.title}</h2>
          )}
          {fr?.summary && (
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {fr.summary}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Convergence */}
      {conv && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gold" />
              <h3 className="font-display text-base font-semibold text-foreground">
                수렴 분석
              </h3>
              <Badge variant="outline" className="border-gold/30 text-gold text-xs ml-auto">
                {conv.converged_count || 0}/6 수렴
              </Badge>
            </div>
            {conv.converged_systems && conv.converged_systems.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {conv.converged_systems.map((s, i) => (
                  <Badge key={i} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[11px]">
                    ✓ {s}
                  </Badge>
                ))}
              </div>
            )}
            {conv.divergent_systems && conv.divergent_systems.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {conv.divergent_systems.map((s, i) => (
                  <Badge key={i} variant="outline" className="border-orange-500/30 text-orange-400 text-[11px]">
                    ✗ {s}
                  </Badge>
                ))}
              </div>
            )}
            <KeywordBadges keywords={conv.common_keywords} />
            {conv.common_message && (
              <p className="text-sm text-muted-foreground">{conv.common_message}</p>
            )}
            {conv.divergent_reason && (
              <p className="text-xs text-orange-400/80 italic">{conv.divergent_reason}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Individual System Readings */}
      {ir && (
        <div className="space-y-3">
          {(["tarot", "choi_hanna_tarot", "monad_tarot", "saju", "astrology", "ziwei"] as const).map((key, idx) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <SystemReadingCard
                systemKey={key}
                reading={ir[key]}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Time Flow */}
      {fr?.time_flow && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gold" />
              <h3 className="font-display text-base font-semibold text-foreground">시간 흐름</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "과거 영향", value: fr.time_flow.past_influence, color: "text-slate-400" },
                { label: "현재 상황", value: fr.time_flow.present_situation, color: "text-gold" },
                { label: "3개월 전망", value: fr.time_flow.near_future, color: "text-emerald-400" },
                { label: "6개월~1년", value: fr.time_flow.long_term, color: "text-purple-400" },
              ].map((item, i) => (
                item.value ? (
                  <div key={i} className="rounded-lg bg-secondary/30 p-3 space-y-1">
                    <span className={`text-[11px] font-medium ${item.color}`}>{item.label}</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.value}</p>
                  </div>
                ) : null
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advice & Caution */}
      {fr?.advice && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-gold" />
              <h3 className="font-display text-base font-semibold text-foreground">실천 조언</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{fr.advice}</p>
          </CardContent>
        </Card>
      )}

      {fr?.caution && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <h3 className="font-display text-base font-semibold text-foreground">주의사항</h3>
            </div>
            <p className="text-sm leading-relaxed text-orange-400/80 whitespace-pre-line">{fr.caution}</p>
          </CardContent>
        </Card>
      )}

      {/* Lucky Elements */}
      {fr?.lucky_elements && Object.values(fr.lucky_elements).some(Boolean) && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl glow-gold">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Clover className="h-4 w-4 text-gold" />
              <h3 className="font-display text-base font-semibold text-foreground">행운 요소</h3>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { label: "색상", value: fr.lucky_elements.color, emoji: "🎨" },
                { label: "숫자", value: fr.lucky_elements.number, emoji: "🔢" },
                { label: "방위", value: fr.lucky_elements.direction, emoji: "🧭" },
                { label: "시간", value: fr.lucky_elements.time, emoji: "⏰" },
                { label: "요일", value: fr.lucky_elements.day, emoji: "📅" },
              ].map((item, i) => (
                item.value ? (
                  <div key={i} className="rounded-lg bg-secondary/30 p-2 space-y-1">
                    <div className="text-lg">{item.emoji}</div>
                    <div className="text-[10px] text-muted-foreground">{item.label}</div>
                    <div className="text-xs font-medium text-gold">{item.value}</div>
                  </div>
                ) : null
              ))}
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

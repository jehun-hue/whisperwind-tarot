import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { LocaleConfig } from "@/config/locales";
import ReadingResultV3, { type V3ReadingData } from "./ReadingResultV3";

interface AIReadingResult {
  conclusion: string;
  tarotAnalysis: string;
  tarotCardInteraction?: string;
  emotionFlow?: string;
  sajuAnalysis: string;
  sajuTimeline?: string;
  astrologyAnalysis: string;
  astrologyTransits?: string;
  ziweiAnalysis: string;
  ziweiLifeStructure?: string;
  crossValidation: string;
  crossValidationMatrix?: string;
  timing?: string;
  risk: string;
  hiddenPattern?: string;
  advice: string;
  energySummary?: string;
  guidance?: string;
  scores: {
    tarot: number;
    saju: number;
    astrology: number;
    ziwei: number;
    overall: number;
  };
}

interface LocalizedReadingResultProps {
  config: LocaleConfig;
  reading: AIReadingResult | null;
  isLoading: boolean;
  onReset: () => void;
  hasBirthInfo: boolean;
  onUpgrade?: (targetGrade: string) => void;
  sessionId?: string;
}

function ScoreBar({ label, score, isUS = false }: { label: string; score: number; isUS?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay: 0.3 }}
          className={`h-full rounded-full ${isUS ? "bg-gradient-to-r from-purple-600 to-indigo-400" : "bg-gradient-to-r from-primary to-gold"}`}
        />
      </div>
    </div>
  );
}

// Section title mappings for new fields by locale
const EXTRA_SECTION_TITLES: Record<string, Record<string, string>> = {
  kr: {
    tarotCardInteraction: "🔗 카드 상호작용",
    sajuTimeline: "📅 사주 시간축 분석",
    astrologyTransits: "🪐 트랜짓 분석",
    ziweiLifeStructure: "🧬 인생 구조 분석",
    crossValidationMatrix: "📊 검증 매트릭스",
    timing: "⏰ 시기 분석",
    hiddenPattern: "🔍 숨겨진 패턴",
  },
  jp: {
    tarotCardInteraction: "🔗 カード間の相互作用",
    sajuTimeline: "",
    astrologyTransits: "🪐 トランジット分析",
    ziweiLifeStructure: "",
    crossValidationMatrix: "📊 検証マトリックス",
    timing: "⏰ タイミング分析",
    hiddenPattern: "🔍 隠れたパターン",
  },
  us: {
    tarotCardInteraction: "🔗 Card Interactions",
    sajuTimeline: "",
    astrologyTransits: "🪐 Transit Analysis",
    ziweiLifeStructure: "",
    crossValidationMatrix: "📊 Validation Matrix",
    timing: "⏰ Timing Analysis",
    hiddenPattern: "🔍 Hidden Patterns",
  },
};

export default function LocalizedReadingResult({ config, reading, isLoading, onReset, hasBirthInfo, onUpgrade, sessionId }: LocalizedReadingResultProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <Card className="mx-auto max-w-lg border-border/50 bg-card/80 backdrop-blur-xl animate-pulse-glow">
          <CardContent className="py-16 px-8">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-gold" />
            <h2 className="text-xl font-semibold text-foreground"
                style={{ fontFamily: config.displayFont }}>
              {config.loadingTitle}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {config.loadingSubtitle}
            </p>
            <div className="mx-auto mt-6 h-px w-32 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!reading) return null;

  // V3 포맷 감지: tarot_reading.waite 또는 convergence.grade 존재 시
  const isV3Format = reading && (
    (reading as any).tarot_reading?.waite || 
    (reading as any).convergence?.grade ||
    (reading as any).reading_info?.grade
  );

  if (isV3Format) {
    // V3 렌더러에 위임
    return (
      <ReadingResultV3
        reading={reading as unknown as V3ReadingData}
        isLoading={isLoading}
        onReset={onReset}
        grade={(reading as any).reading_info?.grade || (reading as any).convergence?.grade}
        onUpgrade={onUpgrade}
        sessionId={sessionId}
      />
    );
  }

  const extraTitles = EXTRA_SECTION_TITLES[config.locale] || EXTRA_SECTION_TITLES.kr;

  // Build sections based on locale
  const sections: { title: string; content: string; accent?: boolean }[] = [];

  // Conclusion
  sections.push({
    title: config.sectionTitles.conclusion,
    content: reading.conclusion || reading.energySummary || "",
    accent: true,
  });

  // Tarot
  if (config.sectionTitles.tarotAnalysis) {
    sections.push({ title: config.sectionTitles.tarotAnalysis, content: reading.tarotAnalysis });
  }

  // Tarot Card Interaction (new)
  if (reading.tarotCardInteraction && extraTitles.tarotCardInteraction) {
    sections.push({ title: extraTitles.tarotCardInteraction, content: reading.tarotCardInteraction });
  }

  // Emotion Flow (JP)
  if (config.showEmotionFlow && config.sectionTitles.emotionFlow && reading.emotionFlow) {
    sections.push({ title: config.sectionTitles.emotionFlow, content: reading.emotionFlow });
  }

  // Saju (KR only)
  if (config.showSaju && hasBirthInfo && config.sectionTitles.sajuAnalysis) {
    sections.push({ title: config.sectionTitles.sajuAnalysis, content: reading.sajuAnalysis });
  }

  // Saju Timeline (new, KR only)
  if (config.showSaju && hasBirthInfo && reading.sajuTimeline && extraTitles.sajuTimeline) {
    sections.push({ title: extraTitles.sajuTimeline, content: reading.sajuTimeline });
  }

  // Astrology
  if (config.sectionTitles.astrologyAnalysis) {
    sections.push({ title: config.sectionTitles.astrologyAnalysis, content: reading.astrologyAnalysis });
  }

  // Astrology Transits (new)
  if (hasBirthInfo && reading.astrologyTransits && extraTitles.astrologyTransits) {
    sections.push({ title: extraTitles.astrologyTransits, content: reading.astrologyTransits });
  }

  // Ziwei (KR only)
  if (config.showZiwei && hasBirthInfo && config.sectionTitles.ziweiAnalysis) {
    sections.push({ title: config.sectionTitles.ziweiAnalysis, content: reading.ziweiAnalysis });
  }

  // Ziwei Life Structure (new, KR only)
  if (config.showZiwei && hasBirthInfo && reading.ziweiLifeStructure && extraTitles.ziweiLifeStructure) {
    sections.push({ title: extraTitles.ziweiLifeStructure, content: reading.ziweiLifeStructure });
  }

  // Cross validation
  if (config.showSaju && hasBirthInfo && config.sectionTitles.crossValidation) {
    sections.push({ title: config.sectionTitles.crossValidation, content: reading.crossValidation });
  }

  // Cross Validation Matrix (new)
  if (hasBirthInfo && reading.crossValidationMatrix && extraTitles.crossValidationMatrix) {
    sections.push({ title: extraTitles.crossValidationMatrix, content: reading.crossValidationMatrix });
  }

  // Timing (new)
  if (reading.timing && extraTitles.timing) {
    sections.push({ title: extraTitles.timing, content: reading.timing });
  }

  // Risk
  sections.push({ title: config.sectionTitles.risk, content: reading.risk });

  // Hidden Pattern (new)
  if (reading.hiddenPattern && extraTitles.hiddenPattern) {
    sections.push({ title: extraTitles.hiddenPattern, content: reading.hiddenPattern });
  }

  // Advice
  sections.push({ title: config.sectionTitles.advice, content: reading.advice || reading.guidance || "" });

  // Filter out empty sections
  const validSections = sections.filter((s) => s.title && s.content);

  // Score bars
  const scoreEntries: { label: string; score: number }[] = [
    { label: config.scoreLabels.tarot, score: reading.scores.tarot },
  ];
  if (config.showSaju && hasBirthInfo) {
    scoreEntries.push({ label: config.scoreLabels.saju, score: reading.scores.saju });
  }
  if (hasBirthInfo) {
    scoreEntries.push({ label: config.scoreLabels.astrology, score: reading.scores.astrology || 0 });
  }
  if (config.showZiwei && hasBirthInfo) {
    scoreEntries.push({ label: config.scoreLabels.ziwei, score: reading.scores.ziwei || 0 });
  }
  scoreEntries.push({ label: config.scoreLabels.overall, score: reading.scores.overall });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-2xl space-y-4"
    >
      {/* Scores */}
      <Card className={`border-border/50 bg-card/80 backdrop-blur-xl ${config.locale === "us" ? "glow-cosmic" : "glow-gold"}`}>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className={`text-sm italic tracking-widest ${config.locale === "us" ? "text-cosmic-accent" : "text-gold"}`}
                  style={{ fontFamily: config.displayFont }}>
              analysis scores
            </span>
            <Badge variant="outline" className={`text-xs ${config.locale === "us" ? "border-purple-400/30 text-purple-300" : "border-gold/30 text-gold"}`}>
              {config.confidenceLabel} {reading.scores.overall}%
            </Badge>
          </div>
          <div className="space-y-3">
            {scoreEntries.map((entry) => (
              <ScoreBar key={entry.label} label={entry.label} score={entry.score} isUS={config.locale === "us"} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reading sections */}
      {validSections.map((section, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <Card
            className={`border-border/50 bg-card/80 backdrop-blur-xl ${
              section.accent ? "glow-gold-strong" : ""
            }`}
          >
            <CardContent className="p-5">
              <h3 className="mb-2 text-base font-semibold text-foreground"
                  style={{ fontFamily: config.displayFont }}>
                {section.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {section.content}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Reset */}
      <div className="pt-4 text-center">
        <Button
          variant="secondary"
          className="rounded-full border border-border/50 bg-secondary/50 backdrop-blur"
          onClick={onReset}
        >
          {config.resetButton}
        </Button>
      </div>
    </motion.div>
  );
}

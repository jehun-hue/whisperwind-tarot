import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { LocaleConfig } from "@/config/locales";

interface AIReadingResult {
  conclusion: string;
  tarotAnalysis: string;
  emotionFlow?: string;
  sajuAnalysis: string;
  astrologyAnalysis: string;
  ziweiAnalysis: string;
  crossValidation: string;
  risk: string;
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

export default function LocalizedReadingResult({ config, reading, isLoading, onReset, hasBirthInfo }: LocalizedReadingResultProps) {
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

  // Build sections based on locale
  const sections: { title: string; content: string; accent?: boolean }[] = [];

  // Conclusion / Energy Summary
  sections.push({
    title: config.sectionTitles.conclusion,
    content: reading.conclusion || reading.energySummary || "",
    accent: true,
  });

  // Tarot
  if (config.sectionTitles.tarotAnalysis) {
    sections.push({ title: config.sectionTitles.tarotAnalysis, content: reading.tarotAnalysis });
  }

  // Emotion Flow (JP)
  if (config.showEmotionFlow && config.sectionTitles.emotionFlow && reading.emotionFlow) {
    sections.push({ title: config.sectionTitles.emotionFlow, content: reading.emotionFlow });
  }

  // Saju (KR only)
  if (config.showSaju && hasBirthInfo && config.sectionTitles.sajuAnalysis) {
    sections.push({ title: config.sectionTitles.sajuAnalysis, content: reading.sajuAnalysis });
  }

  // Astrology
  if (config.sectionTitles.astrologyAnalysis) {
    sections.push({ title: config.sectionTitles.astrologyAnalysis, content: reading.astrologyAnalysis });
  }

  // Ziwei (KR only)
  if (config.showZiwei && hasBirthInfo && config.sectionTitles.ziweiAnalysis) {
    sections.push({ title: config.sectionTitles.ziweiAnalysis, content: reading.ziweiAnalysis });
  }

  // Cross validation (KR only)
  if (config.showSaju && hasBirthInfo && config.sectionTitles.crossValidation) {
    sections.push({ title: config.sectionTitles.crossValidation, content: reading.crossValidation });
  }

  // Risk
  sections.push({ title: config.sectionTitles.risk, content: reading.risk });

  // Advice / Guidance
  sections.push({ title: config.sectionTitles.advice, content: reading.advice || reading.guidance || "" });

  // Filter out empty sections
  const validSections = sections.filter((s) => s.title && s.content);

  // Score bars based on locale
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
      <Card className="border-border/50 bg-card/80 backdrop-blur-xl glow-gold">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm italic tracking-widest text-gold"
                  style={{ fontFamily: config.displayFont }}>
              analysis scores
            </span>
            <Badge variant="outline" className="border-gold/30 text-gold text-xs">
              {config.confidenceLabel} {reading.scores.overall}%
            </Badge>
          </div>
          <div className="space-y-3">
            {scoreEntries.map((entry) => (
              <ScoreBar key={entry.label} label={entry.label} score={entry.score} />
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
